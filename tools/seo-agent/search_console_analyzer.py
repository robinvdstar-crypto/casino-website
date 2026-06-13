#!/usr/bin/env python3
"""Read-only Search Console export analyzer for casinotafelshuren.com."""

from __future__ import annotations

import argparse
from pathlib import Path

from utils import (
    classify_query_intent,
    classify_url_noise,
    ensure_report_dir,
    is_money_page,
    load_config,
    markdown_table,
    parse_float,
    parse_int,
    read_csv_flexible,
    repo_root,
    today_string,
    write_text_file,
)


FILES = {
    "queries": "performance-queries-last-3-months.csv",
    "pages": "performance-pages-last-3-months.csv",
    "queries_compare": "performance-queries-compare.csv",
    "pages_compare": "performance-pages-compare.csv",
    "page_with_redirect": "indexing-page-with-redirect.csv",
    "alternative_canonical": "indexing-alternative-canonical.csv",
    "crawled_not_indexed": "indexing-crawled-not-indexed.csv",
    "redirect_error": "indexing-redirect-error.csv",
}


def top(rows, field, limit=15):
    return sorted(rows, key=lambda r: r.get(field, 0), reverse=True)[:limit]


def low_ctr(row):
    return row.get("ctr", 0) < 2.0


def commercial(text):
    value = (text or "").lower()
    return any(x in value for x in ("huren", "organiseren", "bedrijfsfeest", "personeelsfeest", "bruiloft", "casino avond", "casinoavond", "tafel", "op locatie"))


def page_type(page):
    lower = (page or "").lower()
    if "blog-" in lower:
        return "blog"
    if "casino-huren-" in lower:
        return "lokale pagina"
    if any(x in lower for x in ("roulette", "blackjack", "poker", "craps", "paardenrennen", "rad-van-fortuin", "caribbean", "golden-ten", "gokkasten")):
        return "tafelpagina"
    if is_money_page(page):
        return "money-page"
    return "overig"


def priority_perf(row, subject):
    impressions = row.get("impressions", 0)
    clicks = row.get("clicks", 0)
    position = row.get("position", 0.0)
    ctr = row.get("ctr", 0.0)
    if impressions >= 20 and 8 <= position <= 30 and ctr < 2:
        return "P1"
    if impressions >= 5 and 20 <= position <= 50 and commercial(subject):
        return "P2"
    if impressions >= 20 and clicks == 0:
        return "P2"
    if impressions >= 20 and 8 <= position <= 20 and ctr < 3:
        return "P3"
    return "P4"


def indexing_priority(category, url):
    lower = (url or "").lower()
    important = is_money_page(lower) or lower.rstrip("/").endswith("casinotafelshuren.com") or "offerte" in lower
    if category == "Redirect error":
        return ("P0" if important else "P1", "Redirect error handmatig inspecteren.")
    if category == "Crawled - currently not indexed":
        return ("P1" if important else "P3", "Controleer indexeerbaarheid, interne links en kwaliteit.")
    if category == "Alternative page with proper canonical tag":
        return ("P1" if important and "?" not in lower else "P4", "Meestal normaal als canonical klopt.")
    if category == "Page with redirect":
        normal = any(x in lower for x in ("http://", "www.", "/index.html"))
        return ("P4" if normal else ("P1" if important else "P4"), "Vaak normaal bij http/www/index.html; inspecteer vreemde money-page redirects.")
    return "P4", "Monitoren."


def metric_pair(keys, metric_words):
    keys = [k for k in keys if any(w in k for w in metric_words)]
    current = next((k for k in keys if any(m in k for m in ("current", "last", "huidig", "laatste", "afgelopen"))), None)
    previous = next((k for k in keys if any(m in k for m in ("previous", "vorige", "prior", "voorgaande"))), None)
    if not current and len(keys) >= 2:
        current = keys[0]
    if not previous and len(keys) >= 2:
        previous = keys[1]
    return current, previous


def compare_rows(rows, label):
    if not rows:
        return [], "Geen compare-bestand aanwezig."
    keys = sorted({k for row in rows[:10] for k in row.keys()})
    c_now, c_prev = metric_pair(keys, ("click", "klik"))
    i_now, i_prev = metric_pair(keys, ("impression", "vertoning"))
    p_now, p_prev = metric_pair(keys, ("position", "positie"))
    if not any((c_now and c_prev, i_now and i_prev, p_now and p_prev)):
        return [], f"{label} gelezen, maar compare-kolommen niet betrouwbaar herkend. Handmatige interpretatie nodig."
    out = []
    for row in rows:
        subject = row.get("query") or row.get("page") or row.get("url") or "(onbekend)"
        clicks_now = parse_int(row.get(c_now)) if c_now else 0
        clicks_prev = parse_int(row.get(c_prev)) if c_prev else 0
        impr_now = parse_int(row.get(i_now)) if i_now else 0
        impr_prev = parse_int(row.get(i_prev)) if i_prev else 0
        pos_now = parse_float(row.get(p_now)) if p_now else 0.0
        pos_prev = parse_float(row.get(p_prev)) if p_prev else 0.0
        notes = []
        if impr_prev >= 10 and impr_now <= impr_prev * 0.5:
            notes.append("sterke daling impressies")
        if clicks_prev >= 1 and clicks_now <= clicks_prev * 0.5:
            notes.append("sterke daling clicks")
        if impr_now >= 10 and impr_now >= impr_prev * 1.5:
            notes.append("sterke stijging impressies")
        if pos_prev and pos_now and pos_now >= pos_prev + 5:
            notes.append("positie verslechterd")
        if notes:
            out.append([subject, clicks_now, clicks_prev, impr_now, impr_prev, pos_now, pos_prev, ", ".join(notes)])
    return out[:20], f"{label} gelezen. Vergelijking is best-effort."


def analyze(input_dir: Path, output: Path | None = None) -> Path:
    config = load_config()
    input_dir = repo_root() / input_dir if not input_dir.is_absolute() else input_dir
    report_dir = ensure_report_dir(config)
    output = output or report_dir / f"search-console-analysis-{today_string()}.md"
    output = repo_root() / output if not output.is_absolute() else output
    loaded, warnings, unknown = {}, [], {}
    read_files = 0
    for key, filename in FILES.items():
        path = input_dir / filename
        rows, file_warnings, file_unknown = read_csv_flexible(path)
        loaded[key] = rows
        if path.exists():
            read_files += 1
        warnings.extend(file_warnings)
        if file_unknown:
            unknown[filename] = file_unknown

    queries, pages = loaded["queries"], loaded["pages"]
    indexing = {
        "Page with redirect": loaded["page_with_redirect"],
        "Alternative page with proper canonical tag": loaded["alternative_canonical"],
        "Redirect error": loaded["redirect_error"],
        "Crawled - currently not indexed": loaded["crawled_not_indexed"],
    }
    opportunities = []
    for row in queries:
        p = priority_perf(row, row.get("query", ""))
        if p != "P4":
            opportunities.append([p, "query", row.get("query", ""), row.get("clicks"), row.get("impressions"), row.get("ctr"), row.get("position"), "Optimaliseer bestaande relevante pagina of interne linkroute."])
    for row in pages:
        p = priority_perf(row, row.get("page", ""))
        if p != "P4":
            opportunities.append([p, "page", row.get("page", ""), row.get("clicks"), row.get("impressions"), row.get("ctr"), row.get("position"), "Controleer title/meta, contentfocus en interne links."])
    for category, rows in indexing.items():
        for row in rows:
            url = row.get("url") or row.get("page") or ""
            p, advice = indexing_priority(category, url)
            if p in {"P0", "P1"}:
                opportunities.append([p, category, url, "", "", "", "", advice])
    opportunities = sorted(opportunities, key=lambda r: {"P0": 0, "P1": 1, "P2": 2, "P3": 3}.get(r[0], 9))[:30]

    all_urls = [r.get("page", "") for r in pages]
    for rows in indexing.values():
        all_urls.extend((r.get("url") or r.get("page") or "") for r in rows)
    noise = classify_url_noise(all_urls)
    q_compare, q_note = compare_rows(loaded["queries_compare"], "Queries compare")
    p_compare, p_note = compare_rows(loaded["pages_compare"], "Pages compare")

    lines = [
        "# Search Console analyse — casinotafelshuren.com",
        "",
        "## 1. Samenvatting",
        "",
        f"- Gelezen bestanden: {read_files}",
        f"- Query-rijen: {len(queries)}",
        f"- Page-rijen: {len(pages)}",
        f"- Indexerings-URL's: {sum(len(v) for v in indexing.values())}",
        "- Belangrijkste conclusie: " + ("Geen CSV's gevonden; plaats exports in data/search-console/." if read_files == 0 else "Data gelezen; beoordeel eerst P0/P1 en daarna commerciële P2-kansen."),
        "- Belangrijkste actieadvies: voer niets automatisch uit; gebruik dit rapport voor één afgebakende Codex-taak.",
        "",
    ]
    if warnings:
        lines += ["### Waarschuwingen", "", *[f"- {w}" for w in warnings], ""]
    if unknown:
        lines += ["### Onbekende kolommen", "", *[f"- `{k}`: {', '.join(v[:12])}" for k, v in unknown.items()], ""]
    lines += [
        "## 2. Belangrijkste kansen",
        "",
        markdown_table(["Prioriteit", "Type", "Query/page/url", "Clicks", "Impressions", "CTR", "Position", "Advies"], opportunities),
        "## 3. Query-analyse",
        "",
        "### Top queries",
        "",
        markdown_table(["Query", "Clicks", "Impressions", "CTR", "Position", "Intent"], [[r.get("query"), r.get("clicks"), r.get("impressions"), r.get("ctr"), r.get("position"), classify_query_intent(r.get("query", ""), config)] for r in top(queries, "impressions")]),
        "### 0 clicks met impressies",
        "",
        markdown_table(["Query", "Impressions", "Position", "Intent"], [[r.get("query"), r.get("impressions"), r.get("position"), classify_query_intent(r.get("query", ""), config)] for r in top([r for r in queries if r.get("impressions") and not r.get("clicks")], "impressions")]),
        "### Positie 8-30 met lage CTR",
        "",
        markdown_table(["Query", "Impressions", "CTR", "Position", "Intent"], [[r.get("query"), r.get("impressions"), r.get("ctr"), r.get("position"), classify_query_intent(r.get("query", ""), config)] for r in top([r for r in queries if 8 <= r.get("position", 0) <= 30 and r.get("ctr", 0) < 2], "impressions")]),
        "### Positie 20-50 met commerciele intentie",
        "",
        markdown_table(["Query", "Impressions", "Position", "Intent"], [[r.get("query"), r.get("impressions"), r.get("position"), classify_query_intent(r.get("query", ""), config)] for r in top([r for r in queries if 20 <= r.get("position", 0) <= 50 and commercial(r.get("query", ""))], "impressions")]),
        "## 4. Page-analyse",
        "",
        markdown_table(["Page", "Clicks", "Impressions", "CTR", "Position", "Type"], [[r.get("page"), r.get("clicks"), r.get("impressions"), r.get("ctr"), r.get("position"), page_type(r.get("page", ""))] for r in top(pages, "impressions")]),
        "### Pages met impressies maar 0 clicks",
        "",
        markdown_table(["Page", "Impressions", "Position", "Type"], [[r.get("page"), r.get("impressions"), r.get("position"), page_type(r.get("page", ""))] for r in top([r for r in pages if r.get("impressions") and not r.get("clicks")], "impressions")]),
        "### Money-pages",
        "",
        markdown_table(["Page", "Clicks", "Impressions", "Position"], [[r.get("page"), r.get("clicks"), r.get("impressions"), r.get("position")] for r in top([r for r in pages if is_money_page(r.get("page", ""), config)], "impressions")]),
        "### Blogs",
        "",
        markdown_table(["Page", "Clicks", "Impressions", "Position"], [[r.get("page"), r.get("clicks"), r.get("impressions"), r.get("position")] for r in top([r for r in pages if page_type(r.get("page", "")) == "blog"], "impressions")]),
        "### Lokale pagina's",
        "",
        markdown_table(["Page", "Clicks", "Impressions", "Position"], [[r.get("page"), r.get("clicks"), r.get("impressions"), r.get("position")] for r in top([r for r in pages if page_type(r.get("page", "")) == "lokale pagina"], "impressions")]),
        "### Tafelpagina's",
        "",
        markdown_table(["Page", "Clicks", "Impressions", "Position"], [[r.get("page"), r.get("clicks"), r.get("impressions"), r.get("position")] for r in top([r for r in pages if page_type(r.get("page", "")) == "tafelpagina"], "impressions")]),
        "## 5. Daling/stijging analyse",
        "",
        f"- {q_note}",
        "",
        markdown_table(["Query", "Clicks nu", "Clicks vorige", "Impr. nu", "Impr. vorige", "Pos. nu", "Pos. vorige", "Opmerking"], q_compare),
        f"- {p_note}",
        "",
        markdown_table(["Page", "Clicks nu", "Clicks vorige", "Impr. nu", "Impr. vorige", "Pos. nu", "Pos. vorige", "Opmerking"], p_compare),
        "## 6. Indexeringsanalyse",
        "",
    ]
    for category, rows in indexing.items():
        lines += [f"### {category}", "", markdown_table(["Prioriteit", "URL", "Reason", "Validation", "Advies"], [[indexing_priority(category, r.get("url") or r.get("page") or "")[0], r.get("url") or r.get("page"), r.get("reason"), r.get("validation"), indexing_priority(category, r.get("url") or r.get("page") or "")[1]] for r in rows[:50]]), ""]
    lines += [
        "## 7. URL-ruis",
        "",
        markdown_table(["Type", "Aantal", "Voorbeelden", "Advies"], [[k, len(v), ", ".join(v[:3]), "Alleen rapporteren; redirects niet automatisch aanpassen."] for k, v in sorted(noise.items())]),
        "## 8. Aanbevolen volgende Codex-taken",
        "",
        "- Kies maximaal een taak op basis van P0/P1/P2.",
        "- Gebruik `task_recommender.py` om een enkele veilige taak te formuleren.",
        "- Laat `prompt_generator.py` daarna een afgebakende Codex-prompt maken.",
        "",
        "## 9. Niet doen",
        "",
        "- Geen redirects blind aanpassen.",
        "- Geen Cloudflare wijzigen.",
        "- Geen formulieren wijzigen.",
        "- Geen afbeeldingen/video's wijzigen.",
        "- Geen massale pagina-aanmaak.",
        "- Geen titles overal tegelijk aanpassen.",
        "",
    ]
    write_text_file(output, "\n".join(lines))
    return output


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--input", default="data/search-console")
    parser.add_argument("--output")
    args = parser.parse_args()
    output = Path(args.output) if args.output else None
    path = analyze(Path(args.input), output)
    print(f"Search Console rapport: {path}")


if __name__ == "__main__":
    main()
