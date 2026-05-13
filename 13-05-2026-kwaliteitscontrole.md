# Kwaliteitscontrole 13-05-2026

## Uitgevoerde controles

- Sitebreed gecontroleerd op kapotte interne links, lege hrefs en ontbrekende anchors.
- SEO-basis gecontroleerd op H1-aantallen, title tags, meta descriptions, canonicals, noindex en sitemap-vermeldingen.
- Formulierstructuur gecontroleerd op Web3Forms action, access key, redirect en de belangrijkste aanvraagvelden.
- Hover-video's gecontroleerd op lokale paden, preload-instelling en desktop-hover CSS.
- Afbeeldingspaden gecontroleerd op ontbrekende bestanden en alt-teksten.
- Robots.txt en sitemap.xml gecontroleerd op publieke indexeerbare pagina's.

## Opgelost

- Oude TODO-comment over de 360 video booth verwijderd uit `fotospiegel-casino-beleving.html`, zodat er geen interne testnotitie meer in de pagina staat.
- Dubbele WhatsApp floating button CSS samengevoegd in `style.css`, waardoor mobiel gedrag rustiger en voorspelbaarder blijft.
- `sitemap.xml` bijgewerkt voor de aangepaste fotospiegelpagina met lastmod `2026-05-13`.

## Mobiele UX

- Sticky offerteflow gecontroleerd in de code: bovenaan verwijst de knop naar `#offerte`, na selectie of in de keuzesectie naar `#offerte-gegevens`, en bij de gegevensvelden wordt de sticky CTA verborgen.
- WhatsApp-knop blijft op mobiel boven de offertebalk en zakt terug zodra de gegevensvelden zichtbaar zijn.
- CSS gecontroleerd op horizontale overflow-risico's bij formulieren, kaarten en sticky elementen.

## Links en anchors

- Geen kapotte lokale links gevonden.
- Geen ontbrekende anchors gevonden voor `#aanbod`, `#mogelijkheden`, `#extras`, `#contact`, `#offerte`, `#offerte-keuzes` en `#offerte-gegevens`.
- Geen `href="#"` of lege hrefs gevonden in HTML-bestanden.

## SEO en sitemap

- Publieke HTML-pagina's hebben precies één H1, unieke metadata en een self-referencing canonical.
- `bedankt.html` staat niet in de sitemap.
- De eerder belangrijke URL's voor roulette, blackjack en poker staan in de sitemap en hebben self-canonicals.
- Robots.txt verwijst correct naar `https://casinotafelshuren.com/sitemap.xml`.

## Formulier en Web3Forms

- Web3Forms action, access key, subject en redirect zijn intact gelaten.
- De aanvraag stuurt de belangrijkste velden mee: wat de klant zoekt, gewenste tafels, extra opties, samenvatting, contactgegevens, datum, locatie, type event, aantal gasten en bericht.
- Geen live testverzending gedaan, om geen echte Web3Forms-aanvraag te versturen zonder expliciete bevestiging.

## Afbeeldingen en video's

- Alle HTML-afbeeldingen en video sources verwijzen naar bestaande lokale bestanden.
- Geen 360 video booth afbeelding gebruikt.
- Roulette- en blackjack-hovervideo's blijven gekoppeld aan desktop hover en gebruiken `preload="metadata"`.
- Aandachtspunt voor later: veel JPG-afbeeldingen zijn 2 tot 3 MB. Compressie of WebP-versies kunnen de laadtijd verder verbeteren.

## Later aandacht geven

- Eventueel visueel testen op meerdere echte mobiele schermbreedtes na Cloudflare-deploy.
- Eventueel afbeeldingsoptimalisatie uitvoeren voor de grootste visuals.
- Eventueel een echte testaanvraag via Web3Forms versturen wanneer dat bewust gewenst is.
