#!/usr/bin/env python3
"""Local-only visual dashboard for the Casino SEO Guardrail Agent."""

from __future__ import annotations

import html
import json
import subprocess
import sys
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import parse_qs, urlparse

from dashboard_renderer import calc_summary, render_dashboard, render_template, report_dir, write_dashboard_files
from utils import dashboard_output_dir, load_config, repo_root


def safe_report_path(file_name: str) -> Path | None:
    reports = report_dir()
    candidate = (reports / file_name).resolve()
    try:
        candidate.relative_to(reports.resolve())
    except ValueError:
        return None
    if not candidate.exists() or not candidate.is_file():
        return None
    return candidate


def latest_prompt() -> Path | None:
    reports = report_dir()
    files = sorted(reports.glob("recommended-codex-prompt-*.md"), key=lambda p: p.stat().st_mtime, reverse=True)
    return files[0] if files else None


def latest_diff() -> Path | None:
    reports = report_dir()
    files = sorted(reports.glob("diff-guard-*.md"), key=lambda p: p.stat().st_mtime, reverse=True)
    return files[0] if files else None


def page(title: str, body: str) -> bytes:
    return render_template(f"<header><h1>{html.escape(title)}</h1><p><a href=\"/\">Terug naar dashboard</a></p></header>{body}").encode("utf-8")


class DashboardHandler(BaseHTTPRequestHandler):
    def send_html(self, content: str | bytes, status: int = 200):
        if isinstance(content, str):
            content = content.encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "text/html; charset=utf-8")
        self.send_header("Content-Length", str(len(content)))
        self.end_headers()
        self.wfile.write(content)

    def send_json(self, data: dict, status: int = 200):
        payload = json.dumps(data, indent=2, ensure_ascii=False).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(payload)))
        self.end_headers()
        self.wfile.write(payload)

    def do_GET(self):
        parsed = urlparse(self.path)
        if parsed.path == "/":
            self.send_html(render_dashboard(calc_summary()))
            return
        if parsed.path == "/status.json":
            self.send_json(calc_summary())
            return
        if parsed.path == "/reports":
            reports = sorted(report_dir().glob("*"), key=lambda p: p.stat().st_mtime, reverse=True)
            items = "".join(f"<tr><td><a href=\"/report?file={html.escape(p.name)}\">{html.escape(p.name)}</a></td><td>{p.stat().st_size}</td></tr>" for p in reports if p.is_file())
            if not items:
                items = '<tr><td colspan="2">Geen rapporten gevonden.</td></tr>'
            self.send_html(page("Rapporten", f"<article class=\"card\"><table><tr><th>Bestand</th><th>Bytes</th></tr>{items}</table></article>"))
            return
        if parsed.path == "/report":
            file_name = parse_qs(parsed.query).get("file", [""])[0]
            target = safe_report_path(file_name)
            if not target:
                self.send_html(page("Rapport niet gevonden", "<article class=\"card\"><p>Bestand bestaat niet of valt buiten de lokale rapportmap.</p></article>"), 404)
                return
            text = html.escape(target.read_text(encoding="utf-8", errors="replace"))
            self.send_html(page(target.name, f"<pre>{text}</pre>"))
            return
        if parsed.path == "/prompt":
            target = latest_prompt()
            if not target:
                self.send_html(page("Codex prompt", "<article class=\"card\"><p>Geen prompt gevonden. Draai eerst /run.</p></article>"), 404)
                return
            text = html.escape(target.read_text(encoding="utf-8", errors="replace"))
            self.send_html(page("Aanbevolen Codex-prompt", f"<article class=\"card\"><p>Kopieer deze prompt handmatig naar Codex.</p></article><pre>{text}</pre>"))
            return
        if parsed.path == "/diff":
            target = latest_diff()
            if not target:
                self.send_html(page("Diff Guard", "<article class=\"card\"><p>Diff Guard is nog niet gedraaid.</p><p>Draai lokaal: <code>python3 tools/seo-agent/diff_guard.py</code></p></article>"), 404)
                return
            text = html.escape(target.read_text(encoding="utf-8", errors="replace"))
            self.send_html(page("Diff Guard", f"<pre>{text}</pre>"))
            return
        if parsed.path == "/run":
            proc = subprocess.run(
                [sys.executable, "tools/seo-agent/run_agent.py", "--skip-recommendation"],
                cwd=repo_root(),
                text=True,
                capture_output=True,
                check=False,
            )
            # Recommender + prompt are run separately so the dashboard always has fresh site/search reports first.
            subprocess.run([sys.executable, "tools/seo-agent/task_recommender.py", "--reports", str(report_dir())], cwd=repo_root(), text=True, capture_output=True, check=False)
            subprocess.run([sys.executable, "tools/seo-agent/prompt_generator.py"], cwd=repo_root(), text=True, capture_output=True, check=False)
            summary = write_dashboard_files()
            output = html.escape((proc.stdout + proc.stderr).strip())
            self.send_html(page("Read-only analyse uitgevoerd", f"<article class=\"card\"><p>Status: {html.escape(summary.get('status_label','onbekend'))}</p><p><a class=\"button primary\" href=\"/\">Terug naar dashboard</a></p><pre>{output}</pre></article>"))
            return
        self.send_html(page("Niet gevonden", "<article class=\"card\"><p>Deze dashboardroute bestaat niet.</p></article>"), 404)

    def log_message(self, fmt, *args):
        return


def main():
    config = load_config()
    dashboard_output_dir(config)
    report_dir(config)
    write_dashboard_files()
    host = config.get("dashboard_host", "127.0.0.1")
    port = int(config.get("dashboard_port", 8765))
    server = ThreadingHTTPServer((host, port), DashboardHandler)
    print("Casino SEO Guardrail Agent dashboard:")
    print(f"http://localhost:{port}")
    print(f"http://{host}:{port}")
    print("Stop met Ctrl+C.")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nDashboard gestopt.")
    finally:
        server.server_close()


if __name__ == "__main__":
    main()
