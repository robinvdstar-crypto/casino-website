#!/usr/bin/env python3
"""Central runner for the local Casino SEO Guardrail Agent."""

from __future__ import annotations

import argparse
import subprocess
import sys
from pathlib import Path

from utils import ensure_report_dir, load_config, repo_root, today_string
from dashboard_renderer import write_dashboard_files


def has_csv(input_dir: Path) -> bool:
    return input_dir.exists() and any(p.suffix.lower() == ".csv" for p in input_dir.iterdir())


def run_step(args):
    proc = subprocess.run([sys.executable] + args, cwd=repo_root(), text=True, capture_output=True, check=False)
    return proc.returncode, (proc.stdout + proc.stderr).strip()


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--input", default="data/search-console")
    parser.add_argument("--site-root")
    parser.add_argument("--reports")
    parser.add_argument("--skip-search-console", action="store_true")
    parser.add_argument("--skip-site-check", action="store_true")
    parser.add_argument("--skip-recommendation", action="store_true")
    parser.add_argument("--generate-prompt", action="store_true")
    parser.add_argument("--diff-guard", action="store_true")
    args = parser.parse_args()
    config = load_config()
    report_dir = ensure_report_dir(config, args.reports)
    input_dir = repo_root() / args.input
    outputs = []
    script_dir = Path("tools/seo-agent")
    if not args.skip_search_console:
        if has_csv(input_dir):
            cmd = [str(script_dir / "search_console_analyzer.py"), "--input", args.input, "--output", str(report_dir / f"search-console-analysis-{today_string()}.md")]
        else:
            cmd = [str(script_dir / "search_console_analyzer.py"), "--input", args.input, "--output", str(report_dir / f"search-console-analysis-{today_string()}.md")]
        outputs.append(run_step(cmd))
    if not args.skip_site_check:
        cmd = [str(script_dir / "site_checker.py"), "--output", str(report_dir / f"site-check-{today_string()}.md")]
        if args.site_root:
            cmd += ["--site-root", args.site_root]
        outputs.append(run_step(cmd))
    if not args.skip_recommendation:
        outputs.append(run_step([str(script_dir / "task_recommender.py"), "--reports", str(report_dir), "--output", str(report_dir / f"task-recommendation-{today_string()}.md")]))
    if args.generate_prompt or not args.skip_recommendation:
        rec = report_dir / f"task-recommendation-{today_string()}.md"
        outputs.append(run_step([str(script_dir / "prompt_generator.py"), "--recommendation", str(rec), "--output", str(report_dir / f"recommended-codex-prompt-{today_string()}.md")]))
    if args.diff_guard:
        outputs.append(run_step([str(script_dir / "diff_guard.py"), "--output", str(report_dir / f"diff-guard-{today_string()}.md")]))
    summary = write_dashboard_files()
    print("Casino SEO Guardrail Agent klaar.")
    print(f"Rapportmap: {report_dir}")
    print(f"Dashboardstatus: {summary.get('status_label')}")
    for code, text in outputs:
        print(f"- exit {code}: {text}")


if __name__ == "__main__":
    main()
