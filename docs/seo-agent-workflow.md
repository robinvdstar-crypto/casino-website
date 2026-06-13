# SEO Agent workflow

Workflow voor Robin:

1. Download Search Console CSV's handmatig.
2. Zet de CSV's in `data/search-console/`.
3. Start het lokale dashboard:

   ```bash
   python3 tools/seo-agent/dashboard.py
   ```

4. Open:

   ```text
   http://localhost:8765
   ```

5. Klik op `/run` of gebruik de knop `Run read-only analysis`.
6. Bekijk de status, Search Console-samenvatting, URL-ruis, indexeringssignalen en aanbevolen taak.
7. Open de aanbevolen Codex-prompt via het dashboard.
8. Geef de prompt handmatig aan Codex.
9. Draai na de Codex-taak:

   ```bash
   python3 tools/seo-agent/diff_guard.py
   ```

10. Open het dashboard opnieuw en check de Diff Guard-status.
11. Deploy alleen als Diff Guard veilig is en Robin handmatig akkoord geeft.
12. Test na deploy de live site handmatig.

Belangrijk:

- Deze agent maakt de site niet automatisch succesvol.
- Hij voorkomt vooral verkeerde vervolgstappen.
- Hij beschermt bestaande werkende onderdelen.
- Doe maximaal een SEO-taak per run/dag.
- Geen grote batches zonder data.
- Geen Cloudflare, redirects, formulieren, afbeeldingen, video’s of prijzen aanpassen zonder losse opdracht.
- Het dashboard is lokaal en mag niet publiek worden gedeployed.
- Geen automatische deploy en geen publieke dashboard-URL.
