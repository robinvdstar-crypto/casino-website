#!/usr/bin/env python3
"""Read-only git diff guard for post-Codex safety checks."""

from __future__ import annotations

import argparse
import datetime as dt
from pathlib import Path

from utils import command_runner, ensure_report_dir, is_protected_file, load_config, markdown_table, repo_root, today_string, write_text_file
from dashboard_renderer import write_dashboard_files


MEDIA_EXT = (".jpg", ".jpeg", ".png", ".webp", ".gif", ".mp4", ".mov", ".webm", ".svg")
PRICE_TERMS = ("€395", "€100", "€95", "btw", "transportkosten", "vanaf")
FORM_TERMS = ("web3forms", "access_key", "<form", "input", "textarea", "submit")
WHATSAPP_TERMS = ("+31 6 83449057", "whatsapp", "wa.me", "tel:")


def run(output=None) -> Path:
    config = load_config()
    report_dir = ensure_report_dir(config)
    stamp = dt.datetime.now().strftime("%Y-%m-%d-%H%M")
    output = repo_root() / Path(output) if output else report_dir / f"diff-guard-{stamp}.md"
    code, status, err = command_runner(["git", "status", "--short"])
    if code != 0:
        write_text_file(output, f"# Diff Guard rapport — casinotafelshuren.com\n\nGit kon niet worden gelezen.\n\n```text\n{err}\n```\n")
        return output
    _, name_only, _ = command_runner(["git", "diff", "--name-only"])
    _, stat, _ = command_runner(["git", "diff", "--stat"])
    _, numstat, _ = command_runner(["git", "diff", "--numstat"])
    _, diff, _ = command_runner(["git", "diff"])
    files = [line.strip() for line in name_only.splitlines() if line.strip()]
    changed_from_status = [line[3:].strip() for line in status.splitlines() if line.strip()]
    all_files = sorted(set(files + changed_from_status))
    suspicious = []
    stop = False
    protected = [f for f in all_files if is_protected_file(f, config)]
    media = [f for f in all_files if f.lower().endswith(MEDIA_EXT)]
    deleted = [line for line in status.splitlines() if line.startswith(" D") or line.startswith("D ")]
    new_html = [f for f in all_files if f.endswith(".html") and f not in files]
    if protected:
        suspicious.append(["Protected file", ", ".join(protected), "STOP"])
        stop = True
    if media:
        suspicious.append(["Media file", ", ".join(media), "STOP"])
        stop = True
    if deleted:
        suspicious.append(["Deleted file", "; ".join(deleted), "STOP"])
        stop = True
    if len(all_files) > 25:
        suspicious.append(["Veel bestanden", str(len(all_files)), "STOP tenzij expliciet verwacht"])
        stop = True
    lower_diff = diff.lower()
    if any(term in lower_diff for term in WHATSAPP_TERMS):
        suspicious.append(["WhatsApp/tel", "Diff bevat WhatsApp/tel-signaal", "STOP als nummer/functionality gewijzigd is"])
        stop = True
    if any(term.lower() in lower_diff for term in PRICE_TERMS):
        suspicious.append(["Prijscontext", "Diff bevat prijsachtige tekst", "STOP tenzij taak dit expliciet toestond"])
        stop = True
    if any(term in lower_diff for term in FORM_TERMS):
        suspicious.append(["Formulier", "Diff bevat formulier/Web3Forms-signaal", "STOP tenzij taak dit expliciet toestond"])
        stop = True
    if any(f in all_files for f in ("style.css", "public/style.css")):
        suspicious.append(["CSS", "style.css gewijzigd", "STOP tenzij aanbeveling CSS toestond"])
        stop = True
    if any(f in all_files for f in ("sitemap.xml", "robots.txt")):
        suspicious.append(["Sitemap/robots", "sitemap.xml of robots.txt gewijzigd", "Review nodig"])
    status_label = "STOP — NIET DEPLOYEN" if stop else "SAFE TO REVIEW"
    report = [
        "# Diff Guard rapport — casinotafelshuren.com",
        "",
        "## Status",
        "",
        status_label,
        "",
        "## Gewijzigde bestanden",
        "",
        "```text",
        status.strip() or "Geen wijzigingen gevonden.",
        "```",
        "",
        "## Verdachte wijzigingen",
        "",
        markdown_table(["Type", "Signaal", "Advies"], suspicious),
        "## Beschermde bestanden geraakt?",
        "",
        markdown_table(["Bestand"], [[f] for f in protected]),
        "## Afbeeldingen/video’s geraakt?",
        "",
        markdown_table(["Bestand"], [[f] for f in media]),
        "## Formulieren/WhatsApp/prijzen geraakt?",
        "",
        "- Zie verdachte wijzigingen hierboven. Diff Guard wijzigt niets.",
        "",
        "## Sitemap/robots/canonicals geraakt?",
        "",
        markdown_table(["Bestand"], [[f] for f in all_files if f in {"sitemap.xml", "robots.txt"} or f.endswith(".html")]),
        "## Advies",
        "",
        "Niet deployen bij STOP. Controleer de verdachte wijzigingen en maak eventueel een hersteltaak.",
        "",
        "## Volgende stap",
        "",
        "Bij SAFE TO REVIEW: handmatig reviewen en pas daarna deploybeslissing nemen. Bij STOP: eerst corrigeren of expliciet laten goedkeuren.",
        "",
        "## Diff stat",
        "",
        "```text",
        stat.strip(),
        "```",
        "",
        "## Numstat",
        "",
        "```text",
        numstat.strip(),
        "```",
        "",
    ]
    write_text_file(output, "\n".join(report))
    write_dashboard_files()
    return output


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--output")
    args = parser.parse_args()
    path = run(args.output)
    print(f"Diff Guard rapport: {path}")


if __name__ == "__main__":
    main()
