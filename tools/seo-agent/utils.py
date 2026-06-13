#!/usr/bin/env python3
"""Shared helpers for the local Casino SEO Guardrail Agent."""

from __future__ import annotations

import csv
import datetime as dt
import json
import re
import subprocess
from collections import defaultdict
from pathlib import Path
from urllib.parse import parse_qsl, urlparse, urlunparse


def repo_root() -> Path:
    here = Path(__file__).resolve()
    return here.parents[2]


def load_config(config_path: str | Path | None = None) -> dict:
    path = Path(config_path) if config_path else Path(__file__).resolve().parent / "config.json"
    return json.loads(path.read_text(encoding="utf-8"))


def today_string() -> str:
    return dt.date.today().isoformat()


def ensure_report_dir(config: dict | None = None, report_dir: str | Path | None = None) -> Path:
    config = config or load_config()
    default_dir = config.get("local_report_dir") or config.get("report_dir") or "local-agent-reports/reports"
    path = repo_root() / (Path(report_dir) if report_dir else Path(default_dir))
    path.mkdir(parents=True, exist_ok=True)
    return path


def dashboard_output_dir(config: dict | None = None) -> Path:
    config = config or load_config()
    path = repo_root() / Path(config.get("dashboard_output_dir", "local-agent-reports"))
    path.mkdir(parents=True, exist_ok=True)
    return path


def normalize_header(header: str) -> str:
    key = re.sub(r"[^a-z0-9]+", " ", (header or "").strip().lower()).strip()
    aliases = {
        "query": "query",
        "top queries": "query",
        "search query": "query",
        "zoekopdracht": "query",
        "page": "page",
        "top pages": "page",
        "landing page": "page",
        "url": "url",
        "clicks": "clicks",
        "klikken": "clicks",
        "impressions": "impressions",
        "vertoningen": "impressions",
        "ctr": "ctr",
        "position": "position",
        "average position": "position",
        "positie": "position",
        "last crawled": "last_crawled",
        "laatst gecrawld": "last_crawled",
        "reason": "reason",
        "reden": "reason",
        "validation": "validation",
        "validatie": "validation",
        "status": "status"
    }
    return aliases.get(key, key.replace(" ", "_"))


def parse_int(value) -> int:
    text = str(value or "").strip()
    if not text:
        return 0
    text = text.replace("\u00a0", "").replace(" ", "").replace(".", "").replace(",", "")
    try:
        return int(float(text))
    except ValueError:
        return 0


def parse_float(value) -> float:
    text = str(value or "").strip()
    if not text:
        return 0.0
    text = text.replace("%", "").replace("\u00a0", "").replace(" ", "")
    if "," in text and "." not in text:
        text = text.replace(",", ".")
    else:
        text = text.replace(",", "")
    try:
        return float(text)
    except ValueError:
        return 0.0


def parse_ctr(value) -> float:
    return parse_float(value)


def safe_slug(value: str) -> str:
    slug = re.sub(r"[^a-z0-9]+", "-", (value or "").lower()).strip("-")
    return slug or "item"


def read_csv_flexible(path: str | Path) -> tuple[list[dict], list[str], list[str]]:
    path = Path(path)
    warnings: list[str] = []
    unknown: list[str] = []
    if not path.exists():
        return [], warnings, unknown
    if path.suffix.lower() != ".csv":
        warnings.append(f"`{path.name}` overgeslagen: alleen CSV wordt ondersteund.")
        return [], warnings, unknown
    if path.stat().st_size == 0:
        warnings.append(f"`{path.name}` is leeg en is overgeslagen.")
        return [], warnings, unknown
    sample = path.read_text(encoding="utf-8-sig", errors="replace")[:4096]
    try:
        dialect = csv.Sniffer().sniff(sample)
    except csv.Error:
        dialect = csv.excel
    rows: list[dict] = []
    known = {"query", "page", "url", "clicks", "impressions", "ctr", "position", "last_crawled", "reason", "validation", "status"}
    with path.open("r", encoding="utf-8-sig", newline="", errors="replace") as handle:
        reader = csv.DictReader(handle, dialect=dialect)
        if not reader.fieldnames:
            warnings.append(f"`{path.name}` heeft geen header.")
            return [], warnings, unknown
        header_map = {h: normalize_header(h) for h in reader.fieldnames}
        unknown = sorted({h for h, norm in header_map.items() if norm not in known and not any(x in norm for x in ("click", "impression", "position", "ctr", "previous", "current", "last", "diff", "change"))})
        for raw in reader:
            row = {}
            for original, value in raw.items():
                if original is None:
                    continue
                row[header_map[original]] = (value or "").strip()
            if row.get("page") and not row.get("url"):
                row["url"] = row["page"]
            if row.get("url") and not row.get("page"):
                row["page"] = row["url"]
            row["clicks"] = parse_int(row.get("clicks"))
            row["impressions"] = parse_int(row.get("impressions"))
            row["ctr"] = parse_ctr(row.get("ctr"))
            row["position"] = parse_float(row.get("position"))
            if any(str(v).strip() for v in row.values()):
                rows.append(row)
    if not rows:
        warnings.append(f"`{path.name}` bevat geen bruikbare rijen.")
    return rows, warnings, unknown


def read_text_file(path: str | Path) -> str:
    return Path(path).read_text(encoding="utf-8", errors="replace")


def write_text_file(path: str | Path, content: str) -> None:
    path = Path(path)
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(content, encoding="utf-8")


def find_site_root(site_root: str | Path | None = None, config: dict | None = None) -> Path:
    root = repo_root()
    if site_root:
        candidate = root / Path(site_root)
        return candidate if candidate.exists() else root
    config = config or load_config()
    for rel in config.get("default_site_root_candidates", ["public", "."]):
        candidate = root / rel
        if candidate.exists() and list(candidate.glob("*.html")):
            return candidate
    return root


def list_html_files(site_root: str | Path) -> list[Path]:
    root = Path(site_root)
    return sorted(p for p in root.rglob("*.html") if ".git" not in p.parts and "node_modules" not in p.parts)


def markdown_table(headers: list[str], rows: list[list], empty: str = "Geen data gevonden.") -> str:
    if not rows:
        return empty + "\n"
    def esc(value):
        return str(value if value is not None else "").replace("|", "\\|").replace("\n", " ").strip()
    lines = [
        "| " + " | ".join(headers) + " |",
        "| " + " | ".join("---" for _ in headers) + " |",
    ]
    for row in rows:
        lines.append("| " + " | ".join(esc(v) for v in row) + " |")
    return "\n".join(lines) + "\n"


def classify_query_intent(query: str, config: dict | None = None) -> str:
    config = config or load_config()
    q = (query or "").lower()
    if any(x in q for x in ("casinotafelshuren", "casino tafels huren", "casinotafels huren")):
        return "branded/navigational"
    if any(city in q for city in config.get("known_city_terms", [])):
        return "lokaal"
    if any(x in q for x in ("casino avond", "casinoavond", "casino night", "casino organiseren", "casino feestje")):
        return "casinoavond/complete avond"
    if any(x in q for x in ("bedrijfsfeest", "personeelsfeest", "bedrijfsevent", "zakelijke borrel", "collega")):
        return "bedrijfsfeest/personeelsfeest"
    if any(x in q for x in ("roulette", "blackjack", "poker", "pokertafel", "craps", "paardenrennen", "rad van fortuin", "caribbean stud", "golden ten", "gokkast")):
        return "tafel-specifiek"
    if any(x in q for x in ("decoratie", "verlichting", "rode loper", "las vegas", "props", "speeldollars", "fotospiegel")):
        return "decoratie/extra's"
    return "overig"


def is_money_page(url: str, config: dict | None = None) -> bool:
    config = config or load_config()
    lower = (url or "").lower()
    if any(page.lower().replace(".html", "") in lower for page in config.get("money_pages", [])):
        return True
    return any(x in lower for x in ("complete-casinoavond-huren", "casino-huren-bedrijfsfeest", "roulette-tafel-huren", "blackjack-tafel-huren", "pokertafel-huren", "rad-van-fortuin-huren", "paardenrennen", "casino-huren-"))


def is_protected_file(path: str, config: dict | None = None) -> bool:
    config = config or load_config()
    normalized = path.replace("\\", "/").lstrip("./")
    if normalized in config.get("protected_files", []):
        return True
    return any(normalized.startswith(pattern) for pattern in config.get("protected_path_patterns", []))


def classify_url_noise(urls: list[str]) -> dict:
    noise = defaultdict(list)
    variants = defaultdict(list)
    for url in urls:
        parsed = urlparse(url or "")
        if not parsed.path and not parsed.netloc:
            continue
        lower = (url or "").lower()
        if parsed.scheme == "http":
            noise["http"].append(url)
        if parsed.netloc.startswith("www."):
            noise["www"].append(url)
        if parsed.path.endswith("/index.html") or parsed.path == "/index.html":
            noise["index_html"].append(url)
        if parsed.query:
            noise["querystrings"].append(url)
            if "optie=" in parsed.query:
                noise["optie"].append(url)
        if parsed.path.endswith("/") and parsed.path != "/":
            noise["trailing_slash"].append(url)
        if parsed.path != parsed.path.lower():
            noise["uppercase"].append(url)
        if "%20" in lower or " " in url:
            noise["encoded_or_space"].append(url)
        path = parsed.path.rstrip("/").lower()
        if path.endswith("/index.html"):
            path = path[:-10]
        canonicalish = urlunparse(("https", parsed.netloc.lower().replace("www.", ""), path or "/", "", "", ""))
        variants[canonicalish].append(url)
    noise["duplicate_variants"] = [" | ".join(sorted(set(v))[:3]) for v in variants.values() if len(set(v)) > 1]
    return noise


def command_runner(args: list[str], cwd: str | Path | None = None) -> tuple[int, str, str]:
    try:
        proc = subprocess.run(args, cwd=cwd or repo_root(), text=True, capture_output=True, check=False)
        return proc.returncode, proc.stdout, proc.stderr
    except FileNotFoundError as exc:
        return 127, "", str(exc)
