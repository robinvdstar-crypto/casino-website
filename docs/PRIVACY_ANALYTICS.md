# Privacy en conversiemeting — stap 59

Stap 62: afzonderlijke publicatie expliciet goedgekeurd. De eerdere releasepatches blijven bewaard.

## Aangetoonde oorzaak en correctie
De echte Google-tag batcht events (in de trace circa zes seconden); event_callback bevestigt geen serverontvangst. Playwright route-interceptie miste het keepalive-verzoek bij navigatie. Een gesloten lokale TLS-proxy vangt nu daadwerkelijk HTTP-verkeer op, met ongewijzigde Google-tagcode, bestemming, batching, toestemming en formulierredirect. De proxy stuurt niets door. Web3Forms-success wordt gecontroleerd gesimuleerd; er gaan geen echte aanvragen of metingen naar dienstverleners.

De nauwkeurigere test vond ook een echte intrekkingsfout: een eerder gemaakte batch kon bij navigatie alsnog worden verzonden ondanks ga-disable. De kleine productiecorrectie controleert toestemming daarom ook bij fetch/sendBeacon naar uitsluitend Analytics-collectorhosts. Andere hosts, waaronder Web3Forms en PDOK, passeren ongewijzigd. Bestaande opt-outflag, cookieopruiming, submitvergrendeling en succescontrole blijven behouden. Beleidsversie 2026-11-22.1 vraagt opnieuw een keuze bij oudere keuzes.

De tests observeren na success en herladen precies één generate_lead en geen replay. Na intrekking volgen ook bij navigatie en 7,5 seconden extra observatie geen collectorrequests. Geen debug_mode, gewijzigde Google-batchinstelling, uitgeschakelde privacycontrole of nagebootst generate_lead-event gebruikt. De lokale collector gebruikt een tijdelijk zelfondertekend testcertificaat; deze uitzondering geldt uitsluitend voor het geïsoleerde testprofiel en vormt geen productieconfiguratie.

## Reproductie
Vanuit de schone website-release:
```
PRIVACY_TEST_TOOLS_ROOT=/pad/naar/booking-studio CHROME_PATH='/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' GA_TAG_FIXTURE_DIR=/pad/naar/publieke-tagfixtures node tests/privacy-browser.cjs
```
De fixturemap bevat de ongewijzigde openbare gtag/js-bestanden voor beide measurement-ID’s. OpenSSL maakt uitsluitend een tijdelijk lokaal testcertificaat. Zonder GA_TAG_FIXTURE_DIR gebruikt dezelfde suite een kleine deterministische tagmock; de echte netwerkeis blijft actief wanneer de echte tagfixture wordt gekozen.

## Bewaarbeleid uitvoeren
Bevestigd door eigenaar: niet-geboekte aanvragen en bijbehorende e-mail/CRM 24 maanden na het laatste relevante klantcontact; uitzonderingen uitsluitend voor aantoonbare wettelijke verplichtingen of concrete claims/geschillen. Er is geen automatische opruiming toegevoegd.

Handmatige werkwijze bij ingebruikname en periodieke controle:
1. Bepaal per niet-geboekte aanvraag het laatste relevante klantcontact uit e-mail en dossier; gebruik niet automatisch technische updated_at- of importdatums.
2. Controleer boekingen, financiële bewaarplichten en concrete claims; leg een noodzakelijke uitzondering met reden vast.
3. Beoordeel alle vindplaatsen: zakelijke e-mail, CRM/klantkaart, gerelateerde Gmail-import-/reviewgegevens en Web3Forms. Het verwijderen van één CRM-aanvraag ruimt andere kopieën niet automatisch op. Alleen de bestaande bevoegde eigenaarroute gebruiken; voer hier niets uit.
4. Web3Forms noemt maximaal drie jaar als standaard. Voor ons kortere beleid is eerdere verwijdering of een verwijderinstructie aan Web3Forms nodig. Geen automatische uitvoering of specifieke herstelkopietermijn beloven.

Een nieuw bewaarbeleid in een privacytekst is geen bewijs dat oude dossiers al zijn opgeschoond. Booking Studio en productiegegevens zijn in deze stap niet gewijzigd. GA4-leadvalidatie blijft onbekend tot een afzonderlijk goedgekeurde live validatie.


Stap 62 definitieve controle: 14 volledige browsergroepen geslaagd; 320/390/1280 px, fysieke lokale ontvangst van de ongewijzigde Google-tag en veilige intrekking. Commerciële metadata, formulieren, keys, prijzen, redirects en bestaande SEO-links behouden. Noodterugval met Analytics gepauzeerd en werkende formulieren lokaal getest.
