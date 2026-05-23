# 23-05-2026 - Extra aanbod check

## Huidige structuur

- Er bestonden al losse pagina's voor casino decoratie, casino verlichting, casino props, rode loper entree, Las Vegas decor en fotospiegel.
- Er bestond nog geen centrale overzichtspagina voor het overige aanbod.
- Daarom is `overig-aanbod.html` aangemaakt als rustige centrale overzichtspagina.

## Aangemaakt

- `overig-aanbod.html`
  - Verlichting
  - Decoratie & entree
  - Fotografie & extra beleving
  - Mini-callout voor speeldollars met eigen logo

## Afbeeldingen gebruikt

- `images/casino-roulette-entree-event.jpg`
- `images/led-par-lampen-casino-event.jpg`
- `images/neon-verlichting-casino-event.jpg`
- `images/led-staven-casino-event.jpg`
- `images/rode-loper-casino-event.jpg`
- `images/dobbelstenen-decor-casino-event.jpg`
- `images/mega-speelkaarten-casino-event.jpg`
- `images/poker-chips-decor-casino-event.jpg`
- `images/las-vegas-sign-xxl-casino-event.jpg`
- `images/magische-fotospiegel-casino-event.jpg`
- `images/photo-booth-casino-event.jpg`
- `images/car-photo-booth-casino-event.jpg`

De 360 videobooth-afbeelding is niet gebruikt.

## Links en aanvraagflow

- Homepage extra's-preview linkt nu naar `overig-aanbod.html` met de knop `Bekijk alle extra’s`.
- `overig-aanbod.html` linkt naar bestaande detailpagina's:
  - `casino-decoratie-huren.html`
  - `casino-verlichting-huren.html`
  - `casino-props-huren.html`
  - `rode-loper-casino-entree.html`
  - `las-vegas-decor-huren.html`
  - `fotospiegel-casino-beleving.html`
  - `complete-casinoavond-huren.html`
- Aanvraagknoppen op de nieuwe overzichtspagina linken naar `index.html#offerte` met bestaande query-parameters, zodat de huidige formulierlogica extra's kan voorselecteren.

## Extra's in het formulier

Deze extra's zitten in de bestaande formulierstructuur:

- Casino decoratie
- Verlichting
- Extra croupier
- Fotografie / fotospiegel
- Custom speeldollars met eigen logo
- Complete aankleding / themafeest
- Ik weet het nog niet, adviseer mij

De aliaslijst in `script.js` is uitgebreid voor fotospiegel/photo booth, casino verlichting en speeldollars, zodat aanvraaglinks uit het extra-aanbod overzicht netjes op bestaande formulieropties landen.

## SEO

- `overig-aanbod.html` heeft een unieke title, meta description, canonical en H1.
- `overig-aanbod.html` is toegevoegd aan `sitemap.xml`.
- Afbeeldingen hebben natuurlijke alt-teksten en gebruiken `loading="lazy"` en `decoding="async"` buiten de hero.

## Test uitgevoerd

- Statische link- en assetcheck uitgevoerd voor homepage, overig aanbod, decoratie, verlichting, props, rode loper en fotospiegel.
- Geen ontbrekende lokale bestanden gevonden in deze pagina's.
- `sitemap.xml` gecontroleerd: `overig-aanbod.html` staat erin en er zijn geen dubbele sitemap-URL's gevonden.
- Homepage gecontroleerd: extra's-preview heeft 6 kaarten en linkt naar `overig-aanbod.html`.
- `index.html?optie=Custom%20speeldollars%20met%20eigen%20logo#offerte` getest: speeldollars wordt geselecteerd en komt in het hidden veld `Extra opties`.
- Mobiele viewport gecontroleerd voor `overig-aanbod.html`: geen horizontale overflow gevonden.
- `git diff --check` geeft geen whitespace-fouten voor de aangepaste bestanden.

## Bewust niet aangepast

- Geen nieuwe locatiepagina's.
- Geen nieuwe blogs.
- Geen aanpassing aan Web3Forms access key of redirect.
- Geen nieuwe formulierflow.
- Geen wijziging aan WhatsApp-links.
- Geen wijzigingen aan hover-video's.
- Geen grote redesigns van homepage of bestaande detailpagina's.

## Later eventueel

- Footerlinks sitebreed uniform maken als alle pagina's dezelfde centrale extra-aanbod ingang moeten tonen.
- Rode loper, props en fotospiegel eventueel nog directer als losse extra-opties in het formulier opnemen, als de aanvraagmail die granulariteit later nodig heeft.
