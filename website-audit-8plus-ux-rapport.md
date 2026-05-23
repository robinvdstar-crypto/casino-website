# Website-audit 8+ UX

Datum: 19 mei 2026

## Wat is gecontroleerd

- Alle HTML-pagina's in de root van het project.
- `style.css`, `script.js`, `sitemap.xml`, `robots.txt` en `_redirects`.
- Homepage, aanvraagformulier, sticky offerteflow, mobiele navigatie, WhatsApp-knoppen en hover-video's.
- Interne links, CTA's, anchors, canonicals, Open Graph-tags, sitemap-URL's en assetpaden.

## Gevonden punten

- De interne linkcheck was schoon: geen kapotte relatieve links, lege `href`-waarden, `href="#"` placeholders of ontbrekende same-page anchors gevonden.
- De SEO-basisset was schoon: alle 39 HTML-pagina's hebben precies een H1, een title, een meta description en een canonical.
- `robots.txt` verwijst correct naar `https://casinotafelshuren.com/sitemap.xml`.
- De homepage-formulierflow bevat nog steeds de juiste Web3Forms access key, redirect naar `bedankt.html`, datumveld als kalenderkeuze en hidden velden voor gekozen tafels/extra's.
- De hover-video's voor roulette en blackjack staan op `preload="metadata"` en spelen via JavaScript alleen op apparaten met echte hover.
- In `_redirects` stonden nog 200-rewrites van belangrijke `.html` tafelpagina's naar extensionless varianten. Dat kan in Cloudflare/Google Search Console verwarrend gedrag geven.

## Direct opgelost

- De 200-rewrites voor deze drie belangrijke indexeerbare URL's verwijderd:
  - `/roulette-tafel-huren.html`
  - `/blackjack-tafel-huren.html`
  - `/pokertafel-huren.html`
- De bestaande 301-regels van extensionless URL's naar de canonical `.html` URL's behouden.
- De mobiele menuknop in `script.js` iets netter gemaakt:
  - `type="button"` wordt gezet via JavaScript.
  - `aria-controls="mobile-menu"` wordt gezet.
  - `aria-expanded` beweegt mee bij openen/sluiten.
  - Sluiten via menu-link, overlayklik en buitenklik gebruikt nu dezelfde kleine helper.

## Links en anchors

- Statische check uitgevoerd op alle HTML-bestanden.
- Geen ontbrekende interne bestanden of assets gevonden.
- Geen ontbrekende anchors gevonden voor onder andere `#aanbod`, `#offerte`, `#offerte-keuzes`, `#offerte-gegevens` en `#contact`.
- Sitemap bevat alleen bestaande lokale HTML-bestanden.

## Mobiele UX

- Sticky offerteflow in de code gecontroleerd:
  - boven het formulier: `Offerte aanvragen` naar `#offerte`
  - tijdens keuzes/met selectie: `Verder naar gegevens` naar `#offerte-gegevens`
  - bij gegevensvelden: sticky CTA en aanvraagbalk worden verborgen
- WhatsApp-knop heeft mobiele posities die meebewegen met de offerteflow.
- Mobiele hero-video wordt onder 760px verborgen, waardoor mobiel rustiger en lichter blijft.

## SEO-techniek

- Alle indexeerbare pagina's hebben self-referencing canonicals.
- Open Graph-tags zijn aanwezig op belangrijke pagina's en templates.
- `sitemap.xml` en `robots.txt` zijn gecontroleerd.
- De eerder gevoelige roulette-, blackjack- en pokerpagina's blijven canonical `.html` pagina's en staan in de sitemap.

## Code opgeschoond

- Kleine JS-opruiming rond het mobiele menu.
- Geen grote CSS- of formulierrefactor uitgevoerd, omdat de bestaande aanvraagflow functioneel en consistent is.

## Bewust niet aangepast

- Geen homepage redesign.
- Geen nieuw formulierconcept.
- Geen Web3Forms access key of redirect aangepast.
- Geen WhatsApp-nummer aangepast.
- Geen bestaande SEO-pagina's verwijderd of herschreven.
- Geen afbeeldingen of video's verwijderd.
- Geen externe libraries toegevoegd.
- Geen live Web3Forms-test verzonden tijdens deze audit, om geen onnodige echte testmail te sturen.

## Later apart oppakken

- Overwegen om aparte pagina's te maken voor ontbrekende aanbodvarianten zoals paardenrennen of gokkasten als daar SEO-focus op komt.
- Afbeeldingsgewichten kunnen later nog apart worden geoptimaliseerd met een dedicated beeldcompressie-ronde.
- Eventueel kan de mobiele navigatie later visueel verfijnd worden, maar functioneel werkt hij nu netjes.
