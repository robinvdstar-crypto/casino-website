#!/usr/bin/env python3
"""Pick at most one safe next SEO task from agent reports."""

from __future__ import annotations

import argparse
import re
from pathlib import Path

from utils import ensure_report_dir, load_config, repo_root, today_string, write_text_file


def latest_report(report_dir: Path, pattern: str) -> Path | None:
    files = sorted(report_dir.glob(pattern), key=lambda p: p.stat().st_mtime, reverse=True)
    return files[0] if files else None


def recommend(reports: str | Path | None = None, output: str | Path | None = None) -> Path:
    config = load_config()
    report_dir = repo_root() / Path(reports or config["report_dir"])
    report_dir.mkdir(parents=True, exist_ok=True)
    output = repo_root() / Path(output) if output else report_dir / f"task-recommendation-{today_string()}.md"
    sc = latest_report(report_dir, "search-console-analysis-*.md")
    site = latest_report(report_dir, "site-check-*.md")
    combined = "\n".join(p.read_text(encoding="utf-8", errors="replace") for p in [sc, site] if p)
    lower = combined.lower()
    advice = "Monitoren en eerst verse Search Console-exports toevoegen."
    task = "Geen websitewijziging uitvoeren; download verse Search Console CSV's en draai de agent opnieuw."
    risk = "Laag"
    data_signal = "Geen bruikbare P0/P1/P2-signalen gevonden."
    allowed = "Alleen `data/search-console/`, `docs/agent-reports/` en rapportagebestanden."
    if "p0" in lower:
        advice = "P0-diagnose uitvoeren voordat content of SEO-copy wordt aangepast."
        task = "Maak een read-only diagnose van de P0-URL's uit het rapport. Geen redirects of Cloudflare wijzigen."
        risk = "Hoog als dit blind wordt gefixt; veilig als diagnose-only."
        data_signal = "Rapport bevat P0-signalen."
    elif "redirect error" in lower:
        advice = "Redirect error exact inspecteren en alleen rapporteren."
        task = "Controleer de exacte Redirect error URL's en rapporteer verwachte eind-URL's. Geen redirectregels wijzigen."
        risk = "Middel"
        data_signal = "Search Console export noemt Redirect error."
    elif "?optie=" in lower or "querystrings" in lower:
        advice = "URL-ruis rond querystrings diagnosticeren."
        task = "Maak een rapportage van query-URL's en mogelijke bronnen in interne links/canonicals. Geen fixes uitvoeren."
        risk = "Laag"
        data_signal = "URL-ruis met querystrings gevonden."
    elif "positie 8-30" in lower or "lage ctr" in lower or "p1" in lower:
        advice = "Een beperkte meta-title/CTR-test voorbereiden voor de sterkste bestaande pagina."
        task = "Optimaliseer maximaal een bestaande pagina met veel impressies, positie 8-30 en lage CTR. Geen afbeeldingen, formulieren of redirects."
        risk = "Laag tot middel"
        data_signal = "P1 of CTR-signaal gevonden."
    elif "positie 20-50" in lower or "p2" in lower:
        advice = "Bestaande money-page of interne links verbeteren."
        task = "Verbeter een bestaande money-page of blog->money-page interne linkroute op basis van een duidelijk P2-signaal."
        risk = "Laag"
        data_signal = "P2-signaal gevonden."
    if "lokale" in lower and "impress" in lower and "p0" not in lower:
        advice = "Overweeg later een kleine lokale SEO-batch, maar alleen met duidelijke data."
    report = f"""# Aanbevolen volgende taak — casinotafelshuren.com

## Advies

{advice}

## Waarom deze taak

De agent kiest maximaal een volgende taak en vermijdt grote batches. Technische risico's gaan altijd voor contentoptimalisatie.

## Data-signaal

{data_signal}

## Toegestane bestanden

{allowed}

## Verboden bestanden/onderdelen

Geen Cloudflare, redirects, formulieren, Web3Forms, WhatsApp, Analytics, afbeeldingen, video’s, prijzen, deploy-config of websitebrede cleanup.

## Risico-inschatting

{risk}

## Wachten/meten?

Gebruik bij SEO-wijzigingen bij voorkeur eerst een beperkte wijziging en meet daarna opnieuw in Search Console.

## Concept-Codex-taak

{task}

## Niet doen

Niet deployen, geen redirects aanpassen, geen Cloudflare wijzigen, geen formulierlogica aanraken, geen afbeeldingen/video's vervangen en geen extra optimalisaties buiten de taak.
"""
    write_text_file(output, report)
    return output


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--reports", default=None)
    parser.add_argument("--output")
    args = parser.parse_args()
    path = recommend(args.reports, args.output)
    print(f"Taakaanbeveling: {path}")


if __name__ == "__main__":
    main()
