const assert = require("node:assert/strict");
const fs = require("node:fs");
const test = require("node:test");
const vm = require("node:vm");

function input(value, group) {
  return { value, checked: false, dataset: { requestGroup: group } };
}

function loadPreselection(search) {
  const tables = [input("Roulette tafel", "tables"), input("Blackjack tafel", "tables")];
  const extras = [input("Verlichting", "extras"), input("Custom speeldollars met eigen logo", "extras")];
  const intents = [
    { value: "Losse casinotafels huren", checked: false },
    { value: "Complete casinoavond laten verzorgen", checked: false },
    { value: "Ik weet het nog niet, adviseer mij", checked: false },
  ];

  const document = {
    addEventListener() {},
    getElementById() { return null; },
    querySelector(selector) {
      if (selector === ".contact-form") return null;
      if (selector.includes('name="Wat zoekt de klant ongeveer":checked')) return intents.find((item) => item.checked) || null;
      return null;
    },
    querySelectorAll(selector) {
      if (selector.includes('data-request-group="tables"') && selector.includes('data-request-group="extras"')) return [...tables, ...extras];
      if (selector === 'input[data-request-group="tables"]:checked') return tables.filter((item) => item.checked);
      if (selector === 'input[data-request-group="extras"]:checked') return extras.filter((item) => item.checked);
      if (selector.includes('name="Wat zoekt de klant ongeveer"')) return intents;
      return [];
    },
  };
  const window = {
    addEventListener() {},
    location: { search, hash: "" },
    matchMedia() { return { matches: false }; },
    setTimeout() {},
    clearTimeout() {},
  };
  const context = vm.createContext({
    AbortController,
    document,
    fetch: async () => ({ ok: true, json: async () => ({}) }),
    HTMLElement: function HTMLElement() {},
    URL,
    URLSearchParams,
    window,
  });
  const source = `${fs.readFileSync("script.js", "utf8")}\n;globalThis.__formTest = { applyRequestParams };`;
  vm.runInContext(source, context);
  context.__formTest.applyRequestParams();
  return { tables, extras, intents };
}

test("geldige tafelvoorselectie blijft werken en onbekende waarde wordt genegeerd", () => {
  const state = loadPreselection("?tafel=Roulette+tafel&tafel=Onbekende+tafel");
  assert.equal(state.tables[0].checked, true);
  assert.equal(state.tables[1].checked, false);
});

test("extra-alias wordt veilig naar de bestaande optie vertaald", () => {
  const state = loadPreselection("?optie=Speeldollars+met+eigen+logo");
  assert.equal(state.extras[1].checked, true);
});

test("pakketvoorselectie selecteert het bestaande aanvraagtype", () => {
  const state = loadPreselection("?pakket=Complete+casinoavond");
  assert.equal(state.intents[1].checked, true);
});
