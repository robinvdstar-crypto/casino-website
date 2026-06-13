# Casino SEO Guardrail Agent

Deze lokale agent analyseert Search Console-exports, statische HTML-signalen en git-diffs voor casinotafelshuren.com. De agent is read-only richting de website: hij rapporteert, adviseert, toont een lokaal dashboard en genereert veilige Codex-prompts, maar wijzigt geen websitepagina's en deployt niets.

## Wat de agent doet

- Search Console CSV-exports analyseren.
- Indexeringsmeldingen en URL-ruis signaleren.
- Statische HTML-controles uitvoeren op titles, meta descriptions, H1, canonicals, interne links en CTA-signalen.
- Maximaal een veilige vervol taak aanbevelen.
- Een afgebakende Codex-prompt genereren.
- Na een Codex-taak de git diff controleren op risicovolle wijzigingen.
- Een lokaal dashboard tonen op `http://localhost:8765`.

## Wat de agent niet doet

- Geen Cloudflare, redirects of deploy-config wijzigen.
- Geen formulieren, Web3Forms, WhatsApp, Analytics, prijzen, afbeeldingen of video’s wijzigen.
- Geen websitepagina’s automatisch aanpassen.
- Geen Search Console API, OAuth, credentials of tokens gebruiken.

## Search Console exports

Download CSV-bestanden handmatig en zet ze in:

```bash
data/search-console/
```

Zie `data/search-console/README.md` voor de aanbevolen bestandsnamen.

## Commando's

```bash
python3 tools/seo-agent/dashboard.py
python3 tools/seo-agent/run_agent.py
python3 tools/seo-agent/run_agent.py --generate-prompt
python3 tools/seo-agent/run_agent.py --diff-guard
python3 tools/seo-agent/search_console_analyzer.py --input data/search-console
python3 tools/seo-agent/site_checker.py
python3 tools/seo-agent/task_recommender.py --reports docs/agent-reports
python3 tools/seo-agent/prompt_generator.py
python3 tools/seo-agent/diff_guard.py
```

Runtime-rapporten verschijnen lokaal in:

```bash
local-agent-reports/reports/
```

`local-agent-reports/` is gitignored en is niet bedoeld voor GitHub.

## Dashboard

Start lokaal:

```bash
python3 tools/seo-agent/dashboard.py
```

Open:

```text
http://localhost:8765
```

Beschikbare routes:

- `/` dashboard
- `/reports` rapportlijst
- `/report?file=...` rapportweergave
- `/prompt` laatste aanbevolen Codex-prompt
- `/diff` laatste Diff Guard-rapport
- `/run` read-only analyse uitvoeren
- `/status.json` laatste samenvatting als JSON

Het dashboard mag niet publiek worden gedeployed en staat niet in `public/`.

## Prioriteiten

- `P0`: direct inspecteren.
- `P1`: kansrijke SEO-optimalisatie of belangrijk technisch risico.
- `P2`: content/interne link verbeteren.
- `P3`: meta-title test later.
- `P4`: monitoren of geen actie.

## Diff Guard

Draai na een Codex-taak:

```bash
python3 tools/seo-agent/diff_guard.py
```

Deploy alleen handmatig en alleen als de Diff Guard geen STOP-signaal geeft en de wijziging inhoudelijk klopt.

## Veiligheid

- Geen externe API’s.
- Geen Search Console API.
- Geen Google-login, OAuth, credentials of tokens.
- Geen automatische fixes.
- Geen deploy.
- Geen wijzigingen aan `public/`, websitepagina’s, formulieren, afbeeldingen, video’s, redirects of Cloudflare.
