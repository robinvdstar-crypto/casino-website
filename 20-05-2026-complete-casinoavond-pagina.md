# 20-05-2026 - Complete casinoavond pagina

## Aangepast

- `complete-casinoavond-huren.html` sterker gemaakt als SEO- en conversiepagina.
- Hero aangescherpt met duidelijke propositie voor een volledig verzorgde casinoavond.
- CTA's aangepast naar het bestaande offerteformulier via `index.html#offerte`.
- WhatsApp CTA toegevoegd met het bestaande nummer `+31 6 83449057`.
- Uitleg toegevoegd over wat een complete casinoavond inhoudt.
- Keuzehulp toegevoegd voor kleine casinoavond, complete casinohoek en luxe casino thema-avond.
- Populaire tafels verduidelijkt en gelinkt naar bestaande pagina's waar mogelijk.
- Extra's en aankleding uitgebreid met bestaande afbeeldingen en logische interne links.
- Praktische checklist toegevoegd om aanvragen laagdrempelig te houden.
- FAQ vervangen door 5 gerichte vragen over prijs, croupiers, echt geld, tafelaantal en decoratie.

## Interne links gecontroleerd

- `index.html#offerte`
- `roulette-tafel-huren.html`
- `blackjack-tafel-huren.html`
- `pokertafel-huren.html`
- `rad-van-fortuin-huren.html`
- `craps-tafel-huren.html`
- `casino-decoratie-huren.html`
- `casino-verlichting-huren.html`
- `rode-loper-casino-entree.html`
- `fotospiegel-casino-beleving.html`
- `casino-props-huren.html`
- `blog-casinoavond-thuis-of-op-locatie.html`

`paardenrennen-huren.html` bestaat niet in de huidige repo. Daarom verwijst Paardenrennen op deze pagina veilig naar `index.html#aanbod` om geen dode link te maken.

## Afbeeldingen gebruikt

- `images/casinoSEOalgemeen.jpg`
- `images/casino-roulette-entree-event.jpg`
- `images/casino-sfeerverlichting-event.jpg`
- `images/rode-loper-casino-event.jpg`
- `images/magische-fotospiegel-casino-event.jpg`
- `images/poker-chips-decor-casino-event.jpg`
- `images/mega-speelkaarten-casino-event.jpg`

Afbeeldingen buiten de hero hebben `loading="lazy"` en `decoding="async"`.

## SEO gecontroleerd

- Title is correct.
- Meta description is correct.
- Canonical verwijst naar `https://casinotafelshuren.com/complete-casinoavond-huren.html`.
- Pagina heeft precies één H1.
- Pagina staat in `sitemap.xml`.
- Geen `noindex` gevonden.
- Geen ontbrekende interne assets of links gevonden op deze pagina.

## Test uitgevoerd

- Desktop lokaal geopend via `http://127.0.0.1:8020/complete-casinoavond-huren.html`.
- Mobiele viewport gecontroleerd op hero, CTA's en horizontale overflow.
- CTA `Vraag vrijblijvend voorstel aan` getest: komt uit op `index.html#offerte`.
- CTA `Bekijk populaire tafels` getest: komt uit op `#populaire-tafels`.
- Belangrijke interne linkdoelen bestaan lokaal.
- `git diff --check` geeft geen whitespace-fouten voor deze wijziging.

## Bewust niet aangepast

- Homepage video-background.
- Roulette en blackjack hover-video's.
- Aanvraagformulier en Web3Forms.
- Sticky offerteflow.
- WhatsApp-nummer.
- Blogstructuur.
- Locatiepagina's.
- Sitemap en robots.txt, omdat de pagina al correct in de sitemap stond.

## Later eventueel

- Een aparte pagina voor `paardenrennen-huren.html` maken als Paardenrennen structureel als eigen tafelpagina moet gaan ranken.
- Sitebreed nav-links naar `/#contact` later consistent vervangen door `index.html#offerte` als de hele site volledig op dezelfde offerte-anchor moet sturen.
