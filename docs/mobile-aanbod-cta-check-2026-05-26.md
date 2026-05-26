# Mobiele aanbod CTA-check 2026-05-26

## Scope
- Gecontroleerd: aanbodsectie op de homepage met uitgeklapte casino-onderdelen.
- Focus: mobiele weergave van `Voeg toe aan aanvraag`, `Bekijk ...`, sticky offertebalk en WhatsApp-knop.
- Niet aangepast: content, prijzen, afbeeldingen, formulierlogica, WhatsApp-link, sticky functionaliteit, SEO, redirects, Analytics en deploy-config.

## Gecontroleerde aanbodkaarten
- Roulette
- Blackjack
- Craps
- Pokertafel
- Rad van Fortuin
- Golden Ten
- Paardenrennen
- Caribbean Stud
- Gokkasten

## Bevindingen
- Caribbean Stud en Paardenrennen gebruiken dezelfde CTA-opbouw: eerst `Voeg toe aan aanvraag`, daarna een `Bekijk ...`-link.
- Op mobiel konden de knop en de `Bekijk ...`-link visueel rommelig naast elkaar of onrustig afbreken.
- De sticky offertebalk bleef functioneel, maar uitgeklapte kaarten hadden baat bij iets meer onderruimte.
- `paardenrennen.html` bestaat en de aanbodkaart heeft `Bekijk Paardenrennen` met link naar `paardenrennen.html`.

## Uitgevoerde aanpassing
- `style.css`: alleen specifieke CTA-spacing binnen `.table-content` aangepast.
- Desktop behoudt de inline CTA-opbouw met extra tussenruimte.
- Mobiel zet `Voeg toe aan aanvraag` en `Bekijk ...` netjes onder elkaar.
- Mobiel kreeg iets extra padding onder uitgeklapte kaartcontent.

## Controle
- Breedtes beoordeeld rond 390px en 430px via responsive CSS/media-query controle.
- `git diff --check` schoon.
