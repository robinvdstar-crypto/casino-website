# Google tag installatie

Datum: 19 mei 2026

## Measurement ID

- Google tag / GA4 Measurement ID: `G-49375CQY1`

## Bestaande tags

- Voor installatie zijn geen bestaande `googletagmanager.com`, `gtag(`, `G-49375CQY1` of `GTM-` tags gevonden in de HTML-bestanden.
- Er zijn dus geen oude tags vervangen en er is niets dubbel toegevoegd.

## Toegevoegd op pagina's

De Google tag is direct na de opening van `<head>` toegevoegd aan alle 39 HTML-pagina's:

- `index.html`
- `bedankt.html`
- `blackjack-tafel-huren.html`
- `blog.html`
- `blog-casino-op-locatie-bedrijfsfeest.html`
- `blog-casino-op-locatie-vs-holland-casino.html`
- `blog-casinoavond-thuis-of-op-locatie.html`
- `caribbean-stud-tafel-huren.html`
- `casino-beleving-op-locatie.html`
- `casino-decoratie-huren.html`
- `casino-entertainment-bedrijfsfeest.html`
- `casino-huren.html`
- `casino-huren-amsterdam.html`
- `casino-huren-arnhem.html`
- `casino-huren-assen.html`
- `casino-huren-bedrijfsfeest.html`
- `casino-huren-den-bosch.html`
- `casino-huren-den-haag.html`
- `casino-huren-groningen.html`
- `casino-huren-haarlem.html`
- `casino-huren-leeuwarden.html`
- `casino-huren-lelystad.html`
- `casino-huren-maastricht.html`
- `casino-huren-middelburg.html`
- `casino-huren-rotterdam.html`
- `casino-huren-utrecht.html`
- `casino-huren-zwolle.html`
- `casino-props-huren.html`
- `casino-themafeest-organiseren.html`
- `casino-verlichting-huren.html`
- `complete-casinoavond-huren.html`
- `craps-tafel-huren.html`
- `fotospiegel-casino-beleving.html`
- `golden-ten-tafel-huren.html`
- `las-vegas-decor-huren.html`
- `pokertafel-huren.html`
- `rad-van-fortuin-huren.html`
- `rode-loper-casino-entree.html`
- `roulette-tafel-huren.html`

## Dubbele tags voorkomen

- Controle uitgevoerd: elke HTML-pagina bevat exact een loader voor `https://www.googletagmanager.com/gtag/js?id=G-49375CQY1`.
- Controle uitgevoerd: elke HTML-pagina bevat exact een `gtag('config', 'G-49375CQY1');`.
- Er zijn geen `GTM-` tags of andere GA Measurement IDs gevonden.

## Getest

- `git diff --check` uitgevoerd: geen whitespace-/diff-fouten.
- Statische controle uitgevoerd op unieke Google tag per HTML-bestand.
- Lokale browsercheck uitgevoerd op `index.html`, `bedankt.html`, `blog.html` en `roulette-tafel-huren.html`.
- In de browsercheck had elke geteste pagina exact 1 Google tag loader en geen console errors.
- De bestaande Web3Forms-code, redirect, WhatsApp-links, sitemap, SEO-tags, video’s en offerteflow zijn niet inhoudelijk aangepast.

## Opmerking

`bedankt.html` heeft de tag ook gekregen. De pagina blijft `noindex`, maar is juist nuttig voor conversiemeting na formulierverzending.
