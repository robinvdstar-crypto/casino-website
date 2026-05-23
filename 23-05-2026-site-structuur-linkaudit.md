# 23-05-2026 - Site structuur en interne-linkaudit

## 1. Inventarisatie

Aantal gevonden HTML-pagina's: 40.

Hoofdpagina's:
- `index.html`
- `complete-casinoavond-huren.html`
- `overig-aanbod.html`
- `blog.html`

Tafelpagina's:
- `roulette-tafel-huren.html`
- `blackjack-tafel-huren.html`
- `pokertafel-huren.html`
- `craps-tafel-huren.html`
- `rad-van-fortuin-huren.html`
- `golden-ten-tafel-huren.html`
- `caribbean-stud-tafel-huren.html`

Extra's-pagina's:
- `casino-beleving-op-locatie.html`
- `casino-decoratie-huren.html`
- `casino-verlichting-huren.html`
- `casino-props-huren.html`
- `rode-loper-casino-entree.html`
- `las-vegas-decor-huren.html`
- `fotospiegel-casino-beleving.html`
- `overig-aanbod.html`

Locatiepagina's:
- `casino-huren.html`
- `casino-huren-amsterdam.html`
- `casino-huren-rotterdam.html`
- `casino-huren-utrecht.html`
- `casino-huren-den-haag.html`
- `casino-huren-haarlem.html`
- `casino-huren-assen.html`
- `casino-huren-lelystad.html`
- `casino-huren-leeuwarden.html`
- `casino-huren-arnhem.html`
- `casino-huren-groningen.html`
- `casino-huren-maastricht.html`
- `casino-huren-den-bosch.html`
- `casino-huren-zwolle.html`
- `casino-huren-middelburg.html`
- `casino-huren-bedrijfsfeest.html`

Event/long-tail pagina's:
- `casino-entertainment-bedrijfsfeest.html`
- `casino-themafeest-organiseren.html`

Blogpagina's:
- `blog-casino-op-locatie-bedrijfsfeest.html`
- `blog-casinoavond-thuis-of-op-locatie.html`
- `blog-casino-op-locatie-vs-holland-casino.html`

Functionele pagina:
- `bedankt.html`

## 2. Pagina's zonder inkomende interne links

- `bedankt.html`

Dit is bewust niet opgelost, omdat de bedankpagina niet als commerciële of indexeerbare route gepusht moet worden.

## 3. Kapotte links

Gevonden na controle:
- Geen kapotte interne linkdoelen.
- Geen lege `href=""`.
- Geen `href="#"`.
- Geen links naar niet-bestaande HTML-bestanden.

Opgelost:
- Offerte-links die nog naar `/#contact` wezen zijn sitebreed aangepast naar `/#offerte`, zodat bezoekers directer bij het aanvraagblok uitkomen.
- Primaire CTA-teksten zoals `Vraag offerte aan` en `Vraag vrijblijvend een offerte aan` zijn waar veilig aangepast naar `Vraag vrijblijvend voorstel aan`.

## 4. Tafelnamen

Werkende tafelpagina's:
- Roulette tafel: `roulette-tafel-huren.html`
- Blackjack tafel: `blackjack-tafel-huren.html`
- Pokertafel: `pokertafel-huren.html`
- Craps tafel: `craps-tafel-huren.html`
- Rad van Fortuin: `rad-van-fortuin-huren.html`
- Golden Ten: `golden-ten-tafel-huren.html`
- Caribbean Stud: `caribbean-stud-tafel-huren.html`

Ontbrekende losse tafelpagina's:
- Paardenrennen
- Gokkasten

Deze worden niet als dode links gebruikt. Waar ze voorkomen, verwijzen ze naar het bestaande aanbod of offerteformulier.

## 5. Extra's

Werkende extra's-pagina's:
- Casino decoratie: `casino-decoratie-huren.html`
- Casino verlichting: `casino-verlichting-huren.html`
- Casino props: `casino-props-huren.html`
- Rode loper entree: `rode-loper-casino-entree.html`
- Las Vegas decor: `las-vegas-decor-huren.html`
- Fotospiegel: `fotospiegel-casino-beleving.html`
- Overig aanbod: `overig-aanbod.html`

De homepage linkt nu naar `overig-aanbod.html` via `Bekijk alle extra’s`.

## 6. Anchors en offerteflow

Gecontroleerde anchors:
- `#aanbod`
- `#extras`
- `#contact`
- `#offerte`
- `#offerte-keuzes`
- `#offerte-gegevens`

Alle gebruikte anchors bestaan. De sticky flow is niet opnieuw ontworpen en blijft gericht op:
- bovenaan naar `#offerte`
- tijdens keuzes naar `#offerte-gegevens`

## 7. Sitemap

Gecontroleerd:
- 39 sitemap-URL's.
- Geen dubbele URL's.
- Geen ontbrekende bestanden.
- `bedankt.html` staat niet in de sitemap.
- `overig-aanbod.html` staat in de sitemap.

## 8. Canonicals en metadata

Gecontroleerd:
- Geen canonical-fouten gevonden op indexeerbare HTML-pagina's.
- Iedere indexeerbare HTML-pagina heeft precies één H1.
- Iedere indexeerbare HTML-pagina heeft een title en meta description.

## 9. Menu en footer

Aangepast:
- Offerte-links in menu's en CTA's wijzen nu naar `/#offerte` in plaats van `/#contact`.
- Footerlinks zijn waar veilig uitgebreid met `overig-aanbod.html`, vooral bij footerblokken waar de extra's-structuur al aanwezig was.

Niet gedaan:
- Geen volledig nieuw hoofdmenu gebouwd.
- Geen locaties in het hoofdmenu toegevoegd.
- Geen mega-menu of grote footer-herbouw gedaan.

## 10. Testresultaten

Statisch getest:
- Interne links sitewide.
- Sitemap versus echte bestanden.
- Canonicals.
- H1/title/meta description.
- Extra-aanvraagopties in het formulier.

Browser getest:
- Homepage desktop.
- Homepage mobiel.
- Mobiel menu openen/sluiten.
- Homepage extra's-preview.
- `overig-aanbod.html`.
- Offerte-CTA vanaf homepage.
- Tafelpagina's: roulette, blackjack en poker.
- Complete casinoavond pagina.
- Decoratie en verlichting pagina.
- Locatiepagina's: Amsterdam, Rotterdam en Arnhem.
- Blogoverzicht en blogartikel over bedrijfsfeest.
- `Voeg toe aan aanvraag` bij Roulette: selectie komt in het formulier en in het hidden veld `Gewenste tafels`.
- Speeldollars aanvraaglink naar formulier.

Opmerking: lazy-loaded afbeeldingen worden in de browser pas geladen wanneer ze in beeld komen. De statische assetcheck bevestigt dat de lokale afbeeldingpaden bestaan.

## 11. Aanbevolen vervolgstappen

Niet vandaag uitgevoerd:
- Eventueel losse pagina's maken voor `paardenrennen-huren.html` en `gokkasten-huren.html`, als deze tafels zelfstandig moeten ranken.
- Footerstructuur later visueel groeperen in kolommen zoals `Casinotafels`, `Extra's`, `Locaties` en `Blog`, als daar een aparte designronde voor komt.
- CTA-teksten op alle oude detailpagina's later inhoudelijk verder aanscherpen, zonder alleen mechanisch te vervangen.
