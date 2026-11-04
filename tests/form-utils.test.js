const assert = require("node:assert/strict");
const test = require("node:test");
const {
  buildSubmissionObject,
  calculateDuration,
  composeLocation,
} = require("../form-utils.js");

const baseRequest = {
  accessKey: "test-access-key",
  fromName: "Casinotafelshuren.com",
  name: "Voorbeeld Bezoeker",
  email: "voorbeeld@example.com",
  phone: "+31 6 12345678",
  eventDate: "2027-02-13",
  eventType: "Bedrijfsfeest",
  otherEventType: "",
  startTime: "19:00",
  endTime: "23:00",
  endsNextDay: false,
  guestCount: "50-100",
  budget: "Nog niet vastgesteld / graag advies",
  location: "Oss",
  address: {},
  intent: "Losse casinotafels huren",
  tables: ["Roulette tafel"],
  extras: [],
  message: "",
};

test("berekent een gewone en nachtelijke speeltijd", () => {
  assert.deepEqual(calculateDuration("19:00", "23:00", false), { valid: true, minutes: 240, reason: null });
  assert.deepEqual(calculateDuration("20:00", "00:30", true), { valid: true, minutes: 270, reason: null });
  assert.equal(calculateDuration("20:00", "00:30", false).reason, "next_day_required");
  assert.equal(calculateDuration("20:00", "20:00", true).reason, "identical");
});

test("stuurt één tafel zonder lege optionele velden", () => {
  const payload = buildSubmissionObject(baseRequest);
  assert.equal(payload.Tafels, "Roulette tafel");
  assert.equal(payload["Gewenste speeltijd"], "4 uur");
  assert.equal(payload.Locatie, "Oss");
  assert.equal(payload.email, "voorbeeld@example.com");
  assert.ok(!("Extra's" in payload));
  assert.ok(!("Aanvullende wensen" in payload));
  assert.ok(!Object.values(payload).includes(""));
});

test("stuurt meerdere tafels en verlichting compact", () => {
  const payload = buildSubmissionObject({
    ...baseRequest,
    tables: ["Roulette tafel", "Blackjack tafel"],
    extras: ["Verlichting"],
  });
  assert.equal(payload.Tafels, "Roulette tafel, Blackjack tafel");
  assert.equal(payload["Extra's"], "Verlichting");
});

test("complete casinoavond en adviesaanvraag werken zonder gekozen tafel", () => {
  const complete = buildSubmissionObject({ ...baseRequest, intent: "Complete casinoavond laten verzorgen", tables: [] });
  const advice = buildSubmissionObject({ ...baseRequest, intent: "Ik weet het nog niet, adviseer mij", tables: [] });
  assert.ok(!("Tafels" in complete));
  assert.ok(!("Tafels" in advice));
});

test("adviesoptie wordt niet als exacte tafel verstuurd", () => {
  const payload = buildSubmissionObject({ ...baseRequest, tables: ["Ik weet het nog niet, adviseer mij"] });
  assert.equal(payload.Tafels, "Advies gevraagd");
});

test("nachtelijke aanvraag vermeldt de volgende dag", () => {
  const payload = buildSubmissionObject({ ...baseRequest, startTime: "20:00", endTime: "00:30", endsNextDay: true });
  assert.equal(payload["Gewenste speeltijd"], "4 uur en 30 minuten");
  assert.equal(payload["Eindtijd volgende dag"], "Ja");
});

test("algemene locatie en exact adres worden niet dubbel herhaald", () => {
  const address = { street: "Voorbeeldstraat", houseNumber: "10", postcode: "5341 AA", city: "Oss" };
  assert.equal(composeLocation("Oss", address), "Voorbeeldstraat 10, 5341 AA Oss");
  assert.equal(composeLocation("Feestzaal De Voorbeeld", address), "Feestzaal De Voorbeeld — Voorbeeldstraat 10, 5341 AA Oss");
});

test("meerdere extra's en ontbrekende opmerkingen blijven schoon", () => {
  const payload = buildSubmissionObject({
    ...baseRequest,
    extras: ["Verlichting", "Casino decoratie"],
    message: "   ",
  });
  assert.equal(payload["Extra's"], "Verlichting, Casino decoratie");
  assert.ok(!("Aanvullende wensen" in payload));
  assert.ok(!JSON.stringify(payload).includes("undefined"));
  assert.ok(!JSON.stringify(payload).includes("null"));
});
