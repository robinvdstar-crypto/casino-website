# Indexatie-, sitemap- en linkcheck

Datum: 19 mei 2026

## 1. Aantal gevonden indexeerbare pagina's

- Totaal gevonden HTML-bestanden: 39.
- Indexeerbaar bedoeld: 38 pagina's.
- Niet-indexeerbaar / uitgesloten van sitemap: `bedankt.html`.

## 2. Pagina's in sitemap.xml

`sitemap.xml` bevat exact de 38 indexeerbare publieke pagina's:

- Homepage
- Alle bestaande tafelpagina's
- Alle bestaande locatiepagina's
- Blogoverzicht en 3 blogartikelen
- Decoratie-, verlichting-, props-, fotospiegel-, rode-loper- en Las Vegas decorpagina's
- Long-tail pagina `casino-entertainment-bedrijfsfeest.html`

De sitemap bevat geen dubbele URL's en geen niet-bestaande bestanden.

## 3. Uit sitemap.xml verwijderd

- Geen extra verwijderingen nodig tijdens deze check.
- `bedankt.html` staat niet in de sitemap en is bewust uitgesloten.

## 4. Kapotte links opgelost

- Geen kapotte interne links gevonden.
- Geen lege `href`-waarden of `href="#"` placeholders gevonden.
- Geen links naar ontbrekende assets gevonden.

## 5. Anchors gecontroleerd

Gecontroleerde anchors bestaan en worden correct gebruikt:

- `#aanbod`
- `#extras`
- `#contact`
- `#offerte`
- `#offerte-keuzes`
- `#offerte-gegevens`

De mobiele sticky offerteflow is behouden: bovenaan naar `#offerte`, na selectie naar `#offerte-gegevens`, en bij de gegevensvelden verdwijnt de sticky CTA.

## 6. Canonical issues opgelost

- Geen canonical issues gevonden.
- Alle indexeerbare pagina's hebben een self-referencing canonical op `https://casinotafelshuren.com/`.
- De homepage canonical staat correct op `https://casinotafelshuren.com/`.

## 7. Pagina's die nog ontbreken maar intern genoemd worden

Deze opties worden genoemd en zijn klikbaar naar het bestaande aanbod/offertepunt, omdat er nog geen aparte pagina voor bestaat:

- `paardenrennen-huren.html`
- `gokkasten-huren.html`

Daarnaast bestaan de live pagina's voor Golden Ten en Caribbean Stud met de huidige bestandsnamen:

- `golden-ten-tafel-huren.html`
- `caribbean-stud-tafel-huren.html`

Er zijn geen dode links naar de ontbrekende varianten aangetroffen.

## 8. Aanbevolen inspectie in Google Search Console

Handmatig opnieuw inspecteren:

- `https://casinotafelshuren.com/`
- `https://casinotafelshuren.com/roulette-tafel-huren.html`
- `https://casinotafelshuren.com/blackjack-tafel-huren.html`
- `https://casinotafelshuren.com/pokertafel-huren.html`
- `https://casinotafelshuren.com/casino-entertainment-bedrijfsfeest.html`
- `https://casinotafelshuren.com/blog.html`
- `https://casinotafelshuren.com/casino-huren-amsterdam.html`
- `https://casinotafelshuren.com/casino-huren-rotterdam.html`
- `https://casinotafelshuren.com/casino-huren-utrecht.html`
- `https://casinotafelshuren.com/casino-huren-den-haag.html`
- `https://casinotafelshuren.com/casino-huren-haarlem.html`
- `https://casinotafelshuren.com/casino-huren-assen.html`

## 9. Bewust niet aangepast

- Geen nieuwe SEO-pagina's of blogs aangemaakt.
- Geen formulierconcept gewijzigd.
- Web3Forms access key en redirect niet aangepast.
- WhatsApp-nummer niet aangepast.
- Homepage, hover-video's en sticky offerteflow niet teruggedraaid.
- Sitemapvolgorde en lastmod-waarden zijn niet onnodig gewijzigd, omdat de inhoud technisch klopt.

## Extra controlepunten

- `robots.txt` is correct:
  - `User-agent: *`
  - `Allow: /`
  - sitemap verwijst naar `https://casinotafelshuren.com/sitemap.xml`
- `_redirects` bevat alleen veilige 301-regels van extensionless varianten naar canonical `.html` URL's plus `/index.html` naar `/`.
- Blogartikelen linken terug naar `blog.html` en naar relevante commerciële pagina's.
- De Holland Casino-blog blijft feitelijk en maakt duidelijk onderscheid tussen echt casinospel en casino entertainment zonder echt geld.
- Homepage banner video en roulette/blackjack hover-video's behouden `muted`, `playsinline` en `preload="metadata"`.
