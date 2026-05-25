# Heading audit 2026-05-24

## Scope
- Gecontroleerd: alle publieke HTML-bestanden in de root van de site.
- Focus: H1/H2/H3-structuur en visuele heading-schaal op desktop en mobiel.
- Niet aangepast: content, prijzen, formulieren, afbeeldingen, links, Analytics, redirects en deploy-config.

## Structuur
- Alle gecontroleerde HTML-pagina's hebben exact 1 H1.
- Er zijn geen duidelijke dubbele H1-problemen gevonden.
- H2/H3-structuur volgt de bestaande paginavolgorde; er zijn geen heading-tags inhoudelijk aangepast.

## Visuele bevindingen
- De globale hero-H1 had op mobiel een minimum van 44px via `clamp(44px, 7vw, 78px)`. Lange H1's op tafelpagina's, blogartikelen en landingspagina's konden daardoor te veel verticale ruimte innemen.
- Sectie-H2's en kaarttitels waren functioneel, maar misten op mobiel een rustige bovengrens per paginatype.
- Aanbodkaarttitels zoals Caribbean Stud en Paardenrennen gebruiken dezelfde tafelkaartstijl en hadden vooral baat bij een iets rustiger mobiele line-height.

## Uitgevoerde aanpassing
- `style.css`: alleen responsive heading-styling aangepast.
- Gebruikte aanpak: bestaande media queries, `clamp()` en specifieke selectors voor hero-H1, sectie-H2, blog-H2, kaart-H3 en tafelkaart-H3.
- Desktop-styling blijft ongewijzigd; de aangepaste regels gelden alleen onder 760px en 560px.

## Controle
- `git diff --check` schoon.
- Lokale desktopcontrole uitgevoerd op `paardenrennen.html`; 1 H1, geen horizontale overflow en geen console errors.
