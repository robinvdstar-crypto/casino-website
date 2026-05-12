# Linkcheck rapport

Datum: 2026-05-12

## Controle

- Alle HTML-bestanden in de root gecontroleerd op interne links, anchors, assets en placeholder-links.
- `sitemap.xml` gecontroleerd op bestaande bestanden, self-referencing canonicals en noindex-pagina's.
- Aanvraagknoppen met `data-option` gecontroleerd tegen de formulierkeuzes en bestaande alias-logica in `script.js`.

## Gevonden en opgelost

- Niet-klikbare pills voor bestaande tafels gecorrigeerd:
  - Rad van Fortuin -> `/rad-van-fortuin-huren.html`
  - Golden Ten -> `/golden-ten-tafel-huren.html`
  - Caribbean Stud -> `/caribbean-stud-tafel-huren.html`
- Niet-klikbare `Paardenrennen` op onder andere `casino-huren-amsterdam.html` klikbaar gemaakt naar `/#aanbod`, omdat er nog geen losse paardenrennenpagina bestaat.
- Niet-klikbare `Gokkasten` klikbaar gemaakt naar `/#aanbod`, omdat er nog geen losse gokkastenpagina bestaat.
- Extra's en aankleding waar logisch klikbaar gemaakt:
  - Rode loper -> `/rode-loper-casino-entree.html`
  - Las Vegas decoratie -> `/las-vegas-decor-huren.html`
  - Casino props -> `/casino-props-huren.html`
  - Fotospiegel -> `/fotospiegel-casino-beleving.html`
  - Verlichting-pills -> `/casino-verlichting-huren.html`
  - Speeldollars met eigen logo -> `/#contact`
- Homepage-aanbod uitgebreid met subtiele tekstlinks naar bestaande tafelpagina's voor roulette, blackjack, craps, pokertafel, Rad van Fortuin, Golden Ten en Caribbean Stud.

## Ontbrekende pagina's

Deze pagina's bestaan niet en zijn daarom niet als dode link gebruikt:

- `paardenrennen-huren.html`
- `gokkasten-huren.html`
- `golden-ten-huren.html` bestaat niet; juiste bestaande pagina is `golden-ten-tafel-huren.html`.
- `caribbean-stud-huren.html` bestaat niet; juiste bestaande pagina is `caribbean-stud-tafel-huren.html`.
- `rode-loper-entree.html` bestaat niet; juiste bestaande pagina is `rode-loper-casino-entree.html`.
- `las-vegas-decor.html` bestaat niet; juiste bestaande pagina is `las-vegas-decor-huren.html`.
- `fotospiegel-huren.html` bestaat niet; juiste bestaande pagina is `fotospiegel-casino-beleving.html`.

## Resultaat checks

- Geen lege `href` waarden gevonden.
- Geen `href="#"` placeholder-links gevonden.
- Geen ontbrekende interne linkdoelen gevonden.
- Geen ontbrekende anchors gevonden voor `#aanbod`, `#mogelijkheden`, `#extras`, `#contact`, `#offerte`, `#offerte-keuzes` en `#offerte-gegevens`.
- Geen ontbrekende CSS-, JS-, afbeelding- of videobestanden gevonden.
- `sitemap.xml` bevat alleen bestaande, canonical, indexeerbare pagina's.

## Aanbeveling later

Maak eventueel losse SEO-pagina's voor `paardenrennen-huren.html` en `gokkasten-huren.html` als deze onderdelen belangrijk genoeg zijn voor organisch verkeer.
