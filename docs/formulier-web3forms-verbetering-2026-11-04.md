# Formulier- en Web3Forms-verbetering - 2026-11-04

## Technische inventarisatie vooraf

- Het offerteformulier staat in `index.html`; `public/` is gegenereerde, genegeerde build-output via `scripts/build-public.sh`.
- De bestaande selectie-, URL-parameter-, adres- en sticky-offertelogica staat in `script.js`.
- De formulierstyling staat in `style.css`.
- Web3Forms werd rechtstreeks via een standaard HTML POST aangeroepen. Daardoor gingen alle benoemde velden mee.
- De bestaande Web3Forms access key, afleverbestemming en `from_name` zijn behouden.
- De bestaande URL-voorselecties gebruiken onder meer `?tafel=`, `?optie=` en `?pakket=`.
- Tafels en extra's werden dubbel aangeleverd via aparte verborgen velden en een extra samenvattingsveld.
- Locatie kon tegelijk als algemene locatie, volledig adres en losse adresdelen worden verstuurd.
- Datum, telefoonnummer, type evenement en tijden waren niet allemaal verplicht; begin- en eindtijd ontbraken.
- De bestaande adreszoekfunctie gebruikt de PDOK-suggestie-API en biedt handmatige invoer als alternatief.
- Er was geen JavaScript-controle op de daadwerkelijke Web3Forms-succesrespons en geen dubbelklikblokkering.
- In de aangetroffen formuliercode stond geen expliciete honeypot. De aanbevolen Web3Forms `botcheck` is toegevoegd zonder andere spamvoorzieningen te verwijderen.

## Aangepaste formulierstructuur

Het formulier is verdeeld in bestaande keuzes en drie rustige gegevensgroepen:

1. Evenementgegevens: datum, type evenement, verplichte speeltijden, gasten en budgetindicatie.
2. Locatie: een hoofdveld en een optioneel uitklapbaar exact adres.
3. Contactgegevens: naam, e-mail, telefoon en optionele aanvullende wensen.

Toegevoegd of aangescherpt:

- datum is verplicht en kan niet onbedoeld in het verleden liggen;
- gewenste begin- en eindtijd zijn verplicht;
- een checkbox ondersteunt expliciet een eindtijd op de volgende dag;
- de gewenste speelduur wordt zichtbaar berekend, zonder prijsberekening;
- type evenement is verplicht en `Anders` opent een verplicht toelichtingsveld;
- gasten heeft een expliciete keuze `Nog niet bekend`;
- budget is een verplichte grove indicatie met `Nog niet vastgesteld / graag advies`;
- telefoon is verplicht en wordt soepel op geldige tekens en minimaal zeven cijfers gecontroleerd;
- labels, autocomplete-attributen, focusweergave en Nederlandstalige veldfouten zijn verbeterd.

## Selecties en voorselecties

- Alle bestaande tafels en extra's zijn behouden.
- `Ik weet het nog niet, adviseer mij` wordt niet tegelijk als concrete tafelkeuze behandeld.
- Een concrete tafelkeuze na een algemene advieskeuze schakelt naar `Losse casinotafels huren`.
- Onbekende queryparameterwaarden worden genegeerd.
- Bestaande geldige `?tafel=`, `?optie=` en `?pakket=`-voorselecties blijven behouden tijdens verdere invoer.

## Tijden en validatie

- Beide tijden moeten aanwezig en geldig zijn.
- Gelijke begin- en eindtijd wordt afgewezen, ook als `volgende dag` is aangevinkt.
- Een eindtijd die eerder is dan de begintijd vereist de expliciete volgende-dagkeuze.
- `20:00` tot `00:30` met volgende dag wordt berekend als 4 uur en 30 minuten.
- De tijdsduur is alleen een controle voor de bezoeker en beïnvloedt geen prijzen.

## Locatie

- Alleen plaats/locatie ingevuld: er gaat één veld `Locatie` mee.
- Volledig adres met dezelfde plaats: alleen het samengestelde exacte adres gaat mee.
- Locatienaam en exact adres die inhoudelijk verschillen: beide blijven bewaard in één regel, gescheiden door een liggend streepje.
- Een gedeeltelijk ingevuld exact adres wordt afgewezen; het hoofdveld blijft voldoende als het exacte-adresblok dicht staat.
- Lege adresdelen worden niet verstuurd.

## Gecontroleerde Web3Forms-payload

`form-utils.js` bouwt een whitelist-object in vaste volgorde. Alleen relevante, ingevulde waarden worden als JSON verzonden:

1. `access_key`, onderwerp en afzendernaam;
2. `name`, `email` en `phone`;
3. datum, locatie, type evenement en gasten;
4. begin/eindtijd, eventuele volgende dag en berekende speeltijd;
5. aanvraagtype, gekozen tafels en extra's;
6. budget en eventuele aanvullende wensen;
7. een korte bronvermelding zonder querystring.

Het gereserveerde Web3Forms-veld `email` wordt gebruikt zodat Reply-To correct kan werken. Het onderwerp wordt lokaal opgebouwd als `Nieuwe casinoaanvraag | DD-MM-JJJJ | locatie`. Lege waarden, ongekozen opties, `undefined`, `null`, technische formulier-ID's en dubbele samenvattingen worden gefilterd.

De officiële Web3Forms-documentatie ondersteunt vrije formuliervelden en JavaScript/JSON-verzending, maar documenteert geen vrij HTML-mailtemplate binnen deze bestaande basisintegratie. Daarom is de mail geoptimaliseerd met compacte, duidelijk benoemde velden in vaste volgorde. Er is geen betaalde functie of andere maildienst toegevoegd.

Bronnen:

- https://docs.web3forms.com/getting-started/api-reference
- https://docs.web3forms.com/how-to-guides/html-and-javascript
- https://docs.web3forms.com/getting-started/troubleshooting

## Verzendstatus en foutafhandeling

- De verzendknop wordt direct geblokkeerd tijdens verzending.
- Alleen een HTTP-succesrespons met `success: true` leidt naar `bedankt.html`.
- Bij netwerk- of Web3Forms-fout blijven alle ingevulde gegevens staan.
- Fouten worden in het Nederlands bij het veld en in een toegankelijke statusmelding getoond.
- Er worden geen persoonsgegevens naar console- of technische logs geschreven.

## Tests

Uitgevoerd zonder productieaanvraag:

- JavaScript syntaxcontrole voor `script.js` en `form-utils.js`;
- 11 Node-tests voor tijdsduur, nachtelijke events, payloadfiltering, één/meerdere tafels, complete avond, adviesaanvraag, meerdere extra's, lege opmerkingen, locatiesamenvoeging en URL-voorselecties;
- statische HTML-controle op dubbele IDs en scriptvolgorde;
- `git diff --check`;
- lokale HTTP-controle van homepage, helperbestand en een voorselectie-URL.

Geen echte Web3Forms-aanvraag is verstuurd. Een volledige visuele browserautomatisering was in deze werkomgeving niet beschikbaar; daarom blijft een korte handmatige eindcontrole in iPhone Safari en een desktopbrowser verstandig voordat de eigenaar publiceert.

## Bewust niet aangepast

- geen prijzen of commerciële voorwaarden;
- geen Analytics/GA4 of tracking;
- geen WhatsApp-links of telefoonnummers;
- geen productpagina-inhoud;
- geen afbeeldingen of video's;
- geen Cloudflare-, Wrangler- of deployconfiguratie;
- geen redirects, sitemap of robots.txt;
- geen SEO-agent;
- geen commit, push, deployment of echte productieaanvraag.
