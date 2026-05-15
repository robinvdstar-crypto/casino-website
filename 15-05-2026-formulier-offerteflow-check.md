# Formulier en offerteflow check 15-05-2026

## Gecontroleerde onderdelen

- Formulierankers: `#offerte`, `#offerte-keuzes` en `#offerte-gegevens`.
- Keuze: wat zoekt de klant ongeveer.
- Gewenste tafels en extra's.
- `Voeg toe aan aanvraag` knoppen op tafels en extra's.
- Sticky offerteflow en aanvraagbalk.
- Datumveld, locatieveld, type event en aantal gasten.
- Web3Forms action, access key, subject en redirect.
- Bedankpagina en WhatsApp-nummer.

## Aangepast

- Extra's in het formulier compacter gemaakt:
  - Casino decoratie
  - Verlichting
  - Extra croupier
  - Fotografie / fotospiegel
  - Custom speeldollars met eigen logo
  - Complete aankleding / themafeest
  - Ik weet het nog niet, adviseer mij
- Microcopy bij extra's toegevoegd, zodat bezoekers weten dat ze niet alles zeker hoeven te weten.
- Speeldollars-microcopy aangescherpt: populair bij bedrijfsfeesten en leuk om te bewaren.
- Microcopy bij de gegevenssectie toegevoegd: bezoekers ontvangen een vrijblijvend voorstel op maat.
- Datumveld aangevuld met tekst: `Nog niet bekend? Laat dit veld leeg en vermeld het bij opmerkingen.`
- Minimale datum wordt nu op basis van de lokale datum gezet in plaats van UTC.

## Web3Forms-output

- Gewenste tafels en extra's worden nu via de bestaande verborgen velden `Gewenste tafels`, `Extra opties` en `Samenvatting aanvraag` meegestuurd.
- De zichtbare checkboxen hebben geen technische array-namen meer, zodat de Web3Forms-mail minder dubbel en rustiger binnenkomt.
- De keuze `Wat zoekt de klant ongeveer` blijft als gewone radiokeuze meegestuurd.
- Access key, action, subject en redirect zijn niet aangepast.

## Selectieflow

- Alle tafels zijn gecontroleerd als keuze-optie:
  Roulette, Blackjack, Pokertafel, Craps, Rad van Fortuin, Golden Ten, Paardenrennen, Caribbean Stud, Gokkasten en advies.
- Alle `data-option` knoppen mappen naar een bestaande formulierkeuze.
- Decoratie, casino props en rode loper worden als `Casino decoratie` geselecteerd.
- Las Vegas decoratie wordt als `Complete aankleding / themafeest` geselecteerd.
- Fotografie wordt als `Fotografie / fotospiegel` geselecteerd.
- Speeldollars met eigen logo blijft als eigen extra zichtbaar.

## Mobiele flow

- De bestaande sticky offerteflow is behouden.
- Bij gemaakte keuzes blijft de aanvraagbalk naar `#offerte-gegevens` wijzen.
- Bij de gegevensvelden wordt de sticky CTA via bestaande CSS verborgen.
- WhatsApp-positionering is niet aangepast.

## Testresultaten

- `script.js` syntaxcontrole: goed.
- Homepage links en asset-paden: goed.
- Formulierstructuur en Web3Forms-velden: goed.
- Geen lege hrefs of kapotte formulieranchors gevonden.
- Geen live Web3Forms-testverzending gedaan. De browseromgeving blokkeerde lokale `file://` browsercontrole en een echte mailcheck kan hier niet worden bevestigd zonder toegang tot de inbox.

## Bewust behouden

- Geen nieuw formulierconcept gebouwd.
- Geen Web3Forms access key aangepast.
- Geen bedankpagina of redirect aangepast.
- Geen sticky offerteflow teruggedraaid.
- Geen hover-video's, homepage-video, menu of locatiepagina's aangepast.

## Later aandacht geven

- Eén echte testaanvraag uitvoeren na deploy en in de inbox controleren of de mailvolgorde precies naar wens is.
- Op een echte telefoon nog kort controleren of het datumveld en de aanvraagbalk prettig aanvoelen.
