#!/usr/bin/env python3
"""Generate a safe Codex prompt from a task recommendation."""

from __future__ import annotations

import argparse
from pathlib import Path

from utils import ensure_report_dir, load_config, repo_root, today_string, write_text_file


DEFAULT_FORBIDDEN = [
    "Cloudflare-instellingen",
    "wrangler.jsonc",
    "package.json",
    "package-lock.json",
    "scripts/build-public.sh",
    "_redirects",
    "redirects",
    "Analytics/GA4",
    "Web3Forms",
    "aanvraagformulieren",
    "formulierlogica",
    "WhatsApp-knoppen of WhatsApp-nummer",
    "sticky offerteflow",
    "homepage video",
    "video-overlay/logo-overlay",
    "hover-video's",
    "afbeeldingen",
    "beeldbestanden",
    "videobestanden",
    "prijzen",
    "deploy-config",
]


def generate(recommendation: str | Path | None = None, output: str | Path | None = None) -> Path:
    config = load_config()
    report_dir = ensure_report_dir(config)
    if recommendation:
        rec_path = repo_root() / Path(recommendation)
    else:
        recs = sorted(report_dir.glob("task-recommendation-*.md"), key=lambda p: p.stat().st_mtime, reverse=True)
        rec_path = recs[0] if recs else None
    rec_text = rec_path.read_text(encoding="utf-8", errors="replace") if rec_path and rec_path.exists() else "Geen aanbevelingsrapport gevonden. Vraag eerst om een nieuwe agent-run."
    output = repo_root() / Path(output) if output else report_dir / f"recommended-codex-prompt-{today_string()}.md"
    lower = rec_text.lower()
    if "url-ruis" in lower or "redirect" in lower:
        scope_extra = "Deze taak mag alleen rapporteren. Sitemap/interne links pas aanpassen na expliciete losse goedkeuring. Redirects nooit aanpassen."
    elif "content" in lower or "money-page" in lower or "meta-title" in lower:
        scope_extra = "Deze taak mag alleen de expliciet genoemde bestaande pagina's aanpassen. Geen nieuwe pagina's, afbeeldingen of video’s."
    else:
        scope_extra = "Deze taak is standaard read-only tenzij de aanbeveling expliciet een kleine veilige wijziging noemt."
    prompt = f"""Je werkt in de bestaande repo van casinotafelshuren.com.

Belangrijk:
De website werkt momenteel goed en moet stabiel blijven. Voer alleen de hieronder beschreven taak uit.

Context:
De lokale Casino SEO Guardrail Agent heeft deze aanbeveling gemaakt:

{rec_text}

Doel:
Voer maximaal één veilige vervolgstap uit die past binnen de aanbeveling.

Exacte scope:
{scope_extra}

Toegestane bestanden:
Alleen bestanden die expliciet in de aanbeveling passen. Bij twijfel: niets aanpassen en rapporteren.

Niet aanpassen:
{chr(10).join(f"- {item}" for item in DEFAULT_FORBIDDEN)}

Veiligheidsregels:
- Geen brede redesign.
- Geen deploy.
- Geen Cloudflare of redirects.
- Geen externe API's.
- Geen Search Console credentials.
- Geen extra optimalisaties buiten deze opdracht.

Stappenplan:
1. Lees de aanbeveling en bepaal of het diagnose-only of een kleine wijziging is.
2. Controleer eerst de relevante bestanden.
3. Voer alleen de toegestane stap uit.
4. Draai waar mogelijk een lokale controle.
5. Maak of update een kort rapport in docs/agent-reports/.

Rapportage-eis:
Geef kort terug welke bestanden zijn geraakt, welke controle is gedaan en welke onderdelen bewust niet zijn aangepast.

Output-eis:
Sluit af met expliciete bevestiging dat Cloudflare, redirects, Analytics, formulieren, WhatsApp, afbeeldingen, video’s, prijzen en deploy-config ongemoeid zijn gebleven.

Belangrijke eindregel:
Geen extra optimalisaties buiten opdracht.
"""
    write_text_file(output, prompt)
    return output


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--recommendation")
    parser.add_argument("--output")
    args = parser.parse_args()
    path = generate(args.recommendation, args.output)
    print(f"Codex-prompt: {path}")


if __name__ == "__main__":
    main()
