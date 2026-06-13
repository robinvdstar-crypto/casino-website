#!/usr/bin/env python3
"""Dashboard rendering and summary helpers for the local SEO agent."""

from __future__ import annotations

import html
import json
from pathlib import Path

from utils import (
    classify_url_noise,
    dashboard_output_dir,
    ensure_report_dir,
    load_config,
    parse_float,
    read_csv_flexible,
    repo_root,
    today_string,
    write_text_file,
)


FILES = {
    "queries": "performance-queries-last-3-months.csv",
    "pages": "performance-pages-last-3-months.csv",
    "page_with_redirect": "indexing-page-with-redirect.csv",
    "alternative_canonical": "indexing-alternative-canonical.csv",
    "crawled_not_indexed": "indexing-crawled-not-indexed.csv",
    "redirect_error": "indexing-redirect-error.csv",
}


def report_dir(config=None) -> Path:
    return ensure_report_dir(config or load_config())


def latest(pattern: str, directory: Path | None = None) -> Path | None:
    directory = directory or report_dir()
    files = sorted(directory.glob(pattern), key=lambda p: p.stat().st_mtime, reverse=True)
    return files[0] if files else None


def rel(path: Path | None) -> str | None:
    if not path:
        return None
    try:
        return str(path.relative_to(report_dir()))
    except ValueError:
        return path.name


def read_rows(data_dir: Path, filename: str):
    rows, warnings, unknown = read_csv_flexible(data_dir / filename)
    return rows


def calc_summary() -> dict:
    config = load_config()
    root = repo_root()
    data_dir = root / config.get("search_console_data_dir", "data/search-console")
    reports = report_dir(config)
    dash_dir = dashboard_output_dir(config)
    queries = read_rows(data_dir, FILES["queries"])
    pages = read_rows(data_dir, FILES["pages"])
    indexing_rows = {key: read_rows(data_dir, filename) for key, filename in FILES.items() if key not in {"queries", "pages"}}
    files_read = sum(1 for filename in FILES.values() if (data_dir / filename).exists())
    total_clicks = sum(r.get("clicks", 0) for r in queries) if queries else None
    total_impressions = sum(r.get("impressions", 0) for r in queries) if queries else None
    average_ctr = round(sum(r.get("ctr", 0.0) for r in queries) / len(queries), 2) if queries else None
    positions = [r.get("position", 0.0) for r in queries if r.get("position", 0.0)]
    average_position = round(sum(positions) / len(positions), 1) if positions else None
    top_queries = sorted(queries, key=lambda r: r.get("impressions", 0), reverse=True)[:5]
    top_pages = sorted(pages, key=lambda r: r.get("impressions", 0), reverse=True)[:5]
    urls = []
    for rows in indexing_rows.values():
        urls.extend((r.get("url") or r.get("page") or "") for r in rows)
    noise = classify_url_noise(urls)
    diff_report = latest("diff-guard-*.md", reports)
    diff_status = "not_run"
    if diff_report:
        text = diff_report.read_text(encoding="utf-8", errors="replace")
        if "STOP — NIET DEPLOYEN" in text:
            diff_status = "stop"
        elif "SAFE TO REVIEW" in text:
            diff_status = "safe"
        else:
            diff_status = "unknown"
    rec = latest("task-recommendation-*.md", reports)
    prompt = latest("recommended-codex-prompt-*.md", reports)
    priority = title = reason = risk = None
    if rec:
        text = rec.read_text(encoding="utf-8", errors="replace")
        for p in ("P0", "P1", "P2", "P3", "P4"):
            if p in text:
                priority = p
                break
        title = "Aanbevolen volgende taak"
        if "## Advies" in text:
            reason = text.split("## Advies", 1)[1].split("##", 1)[0].strip()[:280]
        if "## Risico-inschatting" in text:
            risk = text.split("## Risico-inschatting", 1)[1].split("##", 1)[0].strip()[:180]
    overall = "safe"
    status_label = "SAFE / monitoren"
    if diff_status == "stop" or indexing_rows["redirect_error"]:
        overall, status_label = "stop", "STOP — niet deployen"
    elif files_read == 0 or indexing_rows["crawled_not_indexed"] or noise.get("querystrings"):
        overall, status_label = "warning", "Diagnose nodig"
    report_files = []
    for p in sorted(reports.glob("*"), key=lambda x: x.stat().st_mtime, reverse=True):
        if p.is_file():
            report_files.append({"file": p.name, "size": p.stat().st_size, "modified": p.stat().st_mtime})
    summary = {
        "site": config["site_name"],
        "last_run": today_string(),
        "overall_status": overall,
        "status_label": status_label,
        "search_console": {
            "files_read": files_read,
            "total_clicks": total_clicks,
            "total_impressions": total_impressions,
            "average_ctr": average_ctr,
            "average_position": average_position,
            "top_queries": [{"query": r.get("query"), "clicks": r.get("clicks"), "impressions": r.get("impressions"), "ctr": r.get("ctr"), "position": r.get("position")} for r in top_queries],
            "top_pages": [{"page": r.get("page"), "clicks": r.get("clicks"), "impressions": r.get("impressions"), "ctr": r.get("ctr"), "position": r.get("position")} for r in top_pages],
        },
        "indexing": {
            "page_with_redirect_count": len(indexing_rows["page_with_redirect"]),
            "alternative_canonical_count": len(indexing_rows["alternative_canonical"]),
            "crawled_not_indexed_count": len(indexing_rows["crawled_not_indexed"]),
            "redirect_error_count": len(indexing_rows["redirect_error"]),
        },
        "url_noise": {
            "http_count": len(noise.get("http", [])),
            "www_count": len(noise.get("www", [])),
            "index_html_count": len(noise.get("index_html", [])),
            "querystring_count": len(noise.get("querystrings", [])),
            "optie_count": len(noise.get("optie", [])),
        },
        "recommendation": {
            "priority": priority,
            "title": title,
            "reason": reason,
            "risk": risk,
            "prompt_file": rel(prompt),
        },
        "diff_guard": {
            "status": diff_status,
            "report_file": rel(diff_report),
        },
        "reports": report_files,
    }
    write_text_file(dash_dir / "latest-summary.json", json.dumps(summary, indent=2, ensure_ascii=False))
    return summary


def render_template(content: str) -> str:
    template = (Path(__file__).resolve().parent / "dashboard_template.html").read_text(encoding="utf-8")
    return template.replace("{{content}}", content)


def link_report(file_name: str | None, label: str) -> str:
    if not file_name:
        return f"<span class=\"button\">{html.escape(label)} ontbreekt</span>"
    return f"<a class=\"button\" href=\"/report?file={html.escape(file_name)}\">{html.escape(label)}</a>"


def render_dashboard(summary: dict | None = None) -> str:
    summary = summary or calc_summary()
    sc = summary["search_console"]
    idx = summary["indexing"]
    noise = summary["url_noise"]
    rec = summary["recommendation"]
    diff = summary["diff_guard"]
    latest_reports = {r["file"]: r for r in summary["reports"]}
    def find_report(prefix):
        for r in summary["reports"]:
            if r["file"].startswith(prefix):
                return r["file"]
        return None
    query_rows = "".join(f"<tr><td>{html.escape(str(q.get('query') or ''))}</td><td>{q.get('impressions')}</td><td>{q.get('clicks')}</td><td>{q.get('position')}</td></tr>" for q in sc["top_queries"]) or "<tr><td colspan=\"4\">Geen querydata gevonden.</td></tr>"
    page_rows = "".join(f"<tr><td>{html.escape(str(p.get('page') or ''))}</td><td>{p.get('impressions')}</td><td>{p.get('clicks')}</td><td>{p.get('position')}</td></tr>" for p in sc["top_pages"]) or "<tr><td colspan=\"4\">Geen pagedata gevonden.</td></tr>"
    content = f"""
    <header>
      <h1>Casino SEO Guardrail Agent</h1>
      <p>Lokale cockpit voor analyse, rapportage, promptvoorstellen en diff-controle. Geen deploy, geen fixes, geen externe API's.</p>
    </header>
    <section class="grid">
      <article class="card span-12">
        <h2>Algemene status</h2>
        <span class="status {html.escape(summary['overall_status'])}">{html.escape(summary['status_label'])}</span>
        <p>Laatste run: {html.escape(str(summary.get('last_run') or 'onbekend'))} · Search Console bestanden: {sc['files_read']} · Rapporten: {len(summary['reports'])}</p>
        <div class="links"><a class="button primary" href="/run">Run read-only analysis</a><a class="button" href="/reports">Alle rapporten</a><a class="button" href="/status.json">status.json</a></div>
      </article>
      <article class="card span-8">
        <h2>Search Console samenvatting</h2>
        <div class="metrics">
          <div class="metric"><span>Clicks</span><strong>{sc['total_clicks'] if sc['total_clicks'] is not None else '-'}</strong></div>
          <div class="metric"><span>Impressions</span><strong>{sc['total_impressions'] if sc['total_impressions'] is not None else '-'}</strong></div>
          <div class="metric"><span>Gem. CTR</span><strong>{sc['average_ctr'] if sc['average_ctr'] is not None else '-'}</strong></div>
          <div class="metric"><span>Gem. positie</span><strong>{sc['average_position'] if sc['average_position'] is not None else '-'}</strong></div>
        </div>
        <h3>Top queries</h3><table><tr><th>Query</th><th>Impr.</th><th>Clicks</th><th>Pos.</th></tr>{query_rows}</table>
        <h3>Top pagina's</h3><table><tr><th>Pagina</th><th>Impr.</th><th>Clicks</th><th>Pos.</th></tr>{page_rows}</table>
      </article>
      <article class="card span-4">
        <h2>Indexering</h2>
        <p>Page with redirect: <strong>{idx['page_with_redirect_count']}</strong></p>
        <p>Alternative canonical: <strong>{idx['alternative_canonical_count']}</strong></p>
        <p>Crawled not indexed: <strong>{idx['crawled_not_indexed_count']}</strong></p>
        <p>Redirect error: <strong>{idx['redirect_error_count']}</strong></p>
        <p>{'Redirect errors eerst inspecteren.' if idx['redirect_error_count'] else 'Geen redirect-error exportsignaal gevonden.'}</p>
      </article>
      <article class="card span-4">
        <h2>URL-ruis</h2>
        <p>http:// {noise['http_count']} · www {noise['www_count']}</p>
        <p>/index.html {noise['index_html_count']} · querystrings {noise['querystring_count']} · ?optie= {noise['optie_count']}</p>
        <p>{'Diagnose nodig' if noise['querystring_count'] or noise['optie_count'] else 'Normaal / monitoren'}</p>
      </article>
      <article class="card span-4">
        <h2>Aanbevolen volgende taak</h2>
        <p><strong>{html.escape(str(rec.get('priority') or 'Geen prioriteit'))}</strong> — {html.escape(str(rec.get('title') or 'Geen aanbeveling'))}</p>
        <p>{html.escape(str(rec.get('reason') or 'Draai een analyse met data voor een gerichte aanbeveling.'))}</p>
        <p>Risico: {html.escape(str(rec.get('risk') or 'onbekend'))}</p>
        {link_report(rec.get('prompt_file'), 'Open Codex prompt')}
      </article>
      <article class="card span-4">
        <h2>Diff Guard</h2>
        <p>Status: <strong>{html.escape(str(diff.get('status') or 'not_run'))}</strong></p>
        {link_report(diff.get('report_file'), 'Open Diff Guard')}
      </article>
      <article class="card span-12">
        <h2>Snelle links</h2>
        <div class="links">
          {link_report(find_report('search-console-analysis-'), 'Open Search Console analyse')}
          {link_report(find_report('site-check-'), 'Open Site check')}
          {link_report(find_report('task-recommendation-'), 'Open Task recommendation')}
          {link_report(find_report('recommended-codex-prompt-'), 'Open Recommended Codex prompt')}
          {link_report(find_report('diff-guard-'), 'Open Diff Guard')}
        </div>
      </article>
    </section>
    """
    return render_template(content)


def write_dashboard_files() -> dict:
    summary = calc_summary()
    dash_dir = dashboard_output_dir(load_config())
    write_text_file(dash_dir / "index.html", render_dashboard(summary))
    return summary
