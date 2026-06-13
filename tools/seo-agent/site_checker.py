#!/usr/bin/env python3
"""Static read-only site/UX checker for the casino website."""

from __future__ import annotations

import argparse
import re
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urlparse

from utils import (
    classify_url_noise,
    ensure_report_dir,
    find_site_root,
    list_html_files,
    load_config,
    markdown_table,
    read_text_file,
    repo_root,
    today_string,
    write_text_file,
)


class PageParser(HTMLParser):
    def __init__(self):
        super().__init__()
        self.in_title = False
        self.current_heading = None
        self.title = ""
        self.meta_description = ""
        self.canonical = ""
        self.h1s = []
        self.links = []
        self.images = []
        self.forms = 0
        self.text_bits = []

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if tag == "title":
            self.in_title = True
        if tag == "meta" and attrs.get("name", "").lower() == "description":
            self.meta_description = attrs.get("content", "")
        if tag == "link" and attrs.get("rel", "").lower() == "canonical":
            self.canonical = attrs.get("href", "")
        if tag in {"h1", "h2", "h3"}:
            self.current_heading = tag
        if tag == "a":
            self.links.append(attrs.get("href", ""))
        if tag == "img":
            self.images.append((attrs.get("src", ""), attrs.get("alt")))
        if tag == "form":
            self.forms += 1

    def handle_endtag(self, tag):
        if tag == "title":
            self.in_title = False
        if tag == self.current_heading:
            self.current_heading = None

    def handle_data(self, data):
        text = data.strip()
        if not text:
            return
        if self.in_title:
            self.title += text
        if self.current_heading == "h1":
            self.h1s.append(text)
        self.text_bits.append(text)


def length_status(text, low, high):
    n = len(text or "")
    if n == 0:
        return "ontbreekt"
    if n < low:
        return "kort"
    if n > high:
        return "lang"
    return "goed"


def local_target_exists(site_root: Path, href: str) -> bool:
    if not href or href.startswith(("#", "mailto:", "tel:", "https://", "http://", "data:")):
        return True
    target = href.split("#")[0].split("?")[0]
    if not target or target == "/":
        return True
    if target.startswith("/"):
        target = target.lstrip("/")
    return (site_root / target).exists() or (repo_root() / target).exists()


def check(site_root_arg=None, output=None):
    config = load_config()
    site_root = find_site_root(site_root_arg, config)
    report_dir = ensure_report_dir(config)
    output = Path(output) if output else report_dir / f"site-check-{today_string()}.md"
    output = repo_root() / output if not output.is_absolute() else output
    html_files = list_html_files(site_root)
    page_rows, risks, canonical_rows, link_rows, cta_rows, alt_rows = [], [], [], [], [], []
    all_urls = []
    canonical_hosts = []
    for path in html_files:
        rel = str(path.relative_to(site_root))
        parser = PageParser()
        text = read_text_file(path)
        parser.feed(text)
        title_status = length_status(parser.title, 25, 65)
        meta_status = length_status(parser.meta_description, 70, 160)
        h1_count = len(parser.h1s)
        if h1_count != 1:
            risks.append(["H1", rel, f"{h1_count} H1's gevonden"])
        if not parser.title or not parser.meta_description:
            risks.append(["Meta", rel, "Title of meta description ontbreekt"])
        if parser.canonical:
            parsed = urlparse(parser.canonical)
            canonical_hosts.append(parsed.netloc)
            issues = []
            if parsed.scheme != "https":
                issues.append("niet-https")
            if "http://" in parser.canonical:
                issues.append("http")
            if "/index.html" in parser.canonical:
                issues.append("index.html")
            canonical_rows.append([rel, parser.canonical, ", ".join(issues) or "ok"])
            all_urls.append(parser.canonical)
        else:
            canonical_rows.append([rel, "", "ontbreekt"])
        for href in parser.links:
            if not href:
                link_rows.append([rel, href, "lege href"])
                continue
            all_urls.append(href)
            if href.startswith("http://casinotafelshuren.com") or href.startswith("http://www.casinotafelshuren.com"):
                link_rows.append([rel, href, "http-interne link"])
            elif "/index.html" in href:
                link_rows.append([rel, href, "index.html link"])
            elif "?optie=" in href:
                link_rows.append([rel, href, "optie query"])
            elif not local_target_exists(site_root, href):
                link_rows.append([rel, href, "lokaal doel ontbreekt"])
        missing_alt = [src for src, alt in parser.images if alt is None or not alt.strip()]
        if missing_alt:
            alt_rows.append([rel, len(missing_alt), ", ".join(missing_alt[:3])])
        body_text = " ".join(parser.text_bits).lower()
        has_cta = "#offerte" in text or "offerte" in body_text or "aanvraag" in body_text
        cta_rows.append([rel, "ja" if has_cta else "nee", "ja" if "wa.me" in text.lower() or "whatsapp" in body_text else "nee", parser.forms])
        page_rows.append([rel, title_status, meta_status, h1_count, parser.h1s[0] if parser.h1s else "", "ja" if parser.canonical else "nee"])
    host_counts = {h: canonical_hosts.count(h) for h in sorted(set(canonical_hosts))}
    if len(host_counts) > 1:
        risks.append(["Canonical", "sitewide", f"meerdere hosts: {host_counts}"])
    noise = classify_url_noise(all_urls)
    sitemap_rows = []
    sitemap_path = repo_root() / "sitemap.xml"
    if sitemap_path.exists():
        sitemap = read_text_file(sitemap_path)
        for page in config.get("important_pages", []):
            sitemap_rows.append([page, "ja" if page in sitemap or (page == "index.html" and "<loc>https://casinotafelshuren.com/</loc>" in sitemap) else "nee"])
        if "http://" in sitemap:
            risks.append(["Sitemap", "sitemap.xml", "bevat http://"])
        if "/index.html" in sitemap:
            risks.append(["Sitemap", "sitemap.xml", "bevat /index.html"])
        if "?" in sitemap:
            risks.append(["Sitemap", "sitemap.xml", "bevat querystring"])
    robots_rows = []
    robots_path = repo_root() / "robots.txt"
    if robots_path.exists():
        robots = read_text_file(robots_path).lower()
        robots_rows.append(["robots.txt", "aanwezig", "sitemap vermeld" if "sitemap:" in robots else "geen sitemap vermeld"])
        for page in config.get("important_pages", []):
            if f"disallow: /{page.lower()}" in robots:
                risks.append(["Robots", page, "belangrijke pagina lijkt geblokkeerd"])
    report = [
        "# Site/UX check — casinotafelshuren.com",
        "",
        "## 1. Samenvatting",
        "",
        f"- Gebruikte site-root: `{site_root}`",
        f"- HTML-bestanden gecontroleerd: {len(html_files)}",
        f"- Belangrijkste risico's: {len(risks)}",
        "",
        "## 2. Belangrijkste risico's",
        "",
        markdown_table(["Type", "Bestand", "Signaal"], risks),
        "## 3. Belangrijke pagina's",
        "",
        markdown_table(["Pagina", "Title", "Meta", "H1 count", "H1", "Canonical"], [row for row in page_rows if row[0] in config.get("important_pages", [])]),
        "## 4. Titles/meta/H1",
        "",
        markdown_table(["Bestand", "Title", "Meta", "H1 count", "H1", "Canonical"], page_rows),
        "## 5. Canonicals",
        "",
        markdown_table(["Bestand", "Canonical", "Status"], canonical_rows),
        "## 6. Interne links en 404-risico",
        "",
        markdown_table(["Bestand", "Link", "Probleem"], link_rows),
        "## 7. URL-ruis",
        "",
        markdown_table(["Type", "Aantal", "Voorbeelden"], [[k, len(v), ", ".join(v[:3])] for k, v in sorted(noise.items())]),
        "## 8. Sitemap/robots",
        "",
        markdown_table(["Sitemap page", "Aanwezig"], sitemap_rows),
        markdown_table(["Bestand", "Status", "Opmerking"], robots_rows),
        "## 9. UX/CTA-signalen",
        "",
        markdown_table(["Bestand", "CTA/offerte-signaal", "WhatsApp-signaal", "Forms"], cta_rows),
        "### Alt-attributen",
        "",
        markdown_table(["Bestand", "Aantal ontbrekend/leeg", "Voorbeelden"], alt_rows),
        "## 10. Aanbevolen veilige vervolgstappen",
        "",
        "- Gebruik dit rapport alleen als signalering.",
        "- Corrigeer links/canonicals/content pas via een aparte, afgebakende Codex-taak.",
        "- Draai Diff Guard na elke wijziging.",
        "",
        "## 11. Niet aanpassen",
        "",
        "- Geen redirects, Cloudflare, formulieren, afbeeldingen, video’s, prijzen of deploy-config automatisch aanpassen.",
        "",
    ]
    write_text_file(output, "\n".join(report))
    return output


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--site-root")
    parser.add_argument("--output")
    args = parser.parse_args()
    path = check(args.site_root, args.output)
    print(f"Site check rapport: {path}")


if __name__ == "__main__":
    main()
