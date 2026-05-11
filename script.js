const sections = document.querySelectorAll("section[id]");
const navLinks = document.querySelectorAll(".nav-links a");

function setActiveNav() {
  let current = "";
  sections.forEach((section) => {
    if (window.scrollY >= section.offsetTop - 120) {
      current = section.getAttribute("id");
    }
  });
  navLinks.forEach((link) => {
    link.classList.remove("active");
    if (link.getAttribute("href") === "#" + current) {
      link.classList.add("active");
    }
  });
}

window.addEventListener("scroll", setActiveNav);

const hamburger = document.getElementById("hamburger");
const mobileMenu = document.getElementById("mobile-menu");

if (hamburger && mobileMenu) {
  hamburger.addEventListener("click", () => {
    mobileMenu.classList.toggle("open");
    hamburger.classList.toggle("open");
  });

  mobileMenu.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      mobileMenu.classList.remove("open");
      hamburger.classList.remove("open");
    });
  });

  mobileMenu.addEventListener("click", (event) => {
    if (event.target === mobileMenu) {
      mobileMenu.classList.remove("open");
      hamburger.classList.remove("open");
    }
  });

  document.addEventListener("click", (event) => {
    const clickInsideMenu = mobileMenu.contains(event.target);
    const clickOnHamburger = hamburger.contains(event.target);

    if (!clickInsideMenu && !clickOnHamburger) {
      mobileMenu.classList.remove("open");
      hamburger.classList.remove("open");
    }
  });
}

const tableItems = document.querySelectorAll(".table-item");

tableItems.forEach((item) => {
  const toggle = item.querySelector(".table-toggle");

  if (!toggle) return;

  toggle.addEventListener("click", () => {
    const isOpen = item.classList.contains("open");

    tableItems.forEach((otherItem) => {
      otherItem.classList.remove("open");
      const otherToggle = otherItem.querySelector(".table-toggle");
      if (otherToggle) {
        otherToggle.setAttribute("aria-expanded", "false");
      }
    });

    if (!isOpen) {
      item.classList.add("open");
      toggle.setAttribute("aria-expanded", "true");
    }
  });
});

const quoteButtons = document.querySelectorAll("[data-option]");
const contactSection = document.getElementById("contact");
const selectionFeedback = document.querySelector(".selection-feedback");
const requestSummaryBar = document.querySelector(".request-summary-bar");
const selectedOptionsTextarea = document.querySelector('textarea[name="gekozen_tafels_en_opties"]');
const tableOptions = [
  "Roulette tafel",
  "Blackjack tafel",
  "Craps tafel",
  "Pokertafel",
  "Rad van Fortuin",
  "Golden Ten",
  "Paardenrennen",
  "Caribbean Stud",
  "Gokkasten",
];

function getCheckedValues(selector) {
  return Array.from(document.querySelectorAll(selector + ":checked")).map((input) => input.value);
}

function findOptionInput(optionName) {
  return Array.from(document.querySelectorAll('input[name="aanvraag_opties[]"], input[name="extras[]"]'))
    .find((input) => input.value === optionName);
}

function updateRequestSelection() {
  const selectedOptions = getCheckedValues('input[name="aanvraag_opties[]"]');
  const selectedExtras = getCheckedValues('input[name="extras[]"]');
  const allSelections = [...new Set([...selectedOptions, ...selectedExtras])];
  const selectionText = allSelections.length ? allSelections.join(", ") : "";
  const selectedTablesField = document.querySelector('input[name="selected_tables"]');
  const selectedExtrasField = document.querySelector('input[name="selected_extras"]');
  const selectedRequestField = document.querySelector('input[name="selected_request"]');

  if (selectedTablesField) selectedTablesField.value = selectedOptions.join(", ");
  if (selectedExtrasField) selectedExtrasField.value = selectedExtras.join(", ");
  if (selectedRequestField) selectedRequestField.value = selectionText;

  if (selectedOptionsTextarea) {
    selectedOptionsTextarea.value = selectionText;
  }

  if (requestSummaryBar) {
    const count = allSelections.length;
    requestSummaryBar.hidden = count === 0;
    document.body.classList.toggle("has-request-selection", count > 0);

    const label = requestSummaryBar.querySelector("strong");
    if (label) {
      label.textContent = `${count} ${count === 1 ? "optie" : "opties"}`;
    }
  }
}

function selectRequestOption(optionName) {
  const checkbox = findOptionInput(optionName);

  if (checkbox) {
    checkbox.checked = true;
  }

  const tableSelect = document.querySelector('select[name="type_tafels"]');
  const extrasSelect = document.querySelector('select[name="overige_opties"]');

  if (tableSelect && tableOptions.includes(optionName)) {
    tableSelect.value = optionName;
  }

  if (extrasSelect && !tableOptions.includes(optionName)) {
    extrasSelect.value = optionName;
  }

  updateRequestSelection();
}

function getAddressField(form, name) {
  return form.elements.namedItem(name);
}

function setAddressHiddenFields(form, address) {
  const fields = {
    "Volledig adres evenement": address.fullAddress || "",
    "Postcode evenement": address.postcode || "",
    "Huisnummer evenement": address.houseNumber || "",
    "Straat evenement": address.street || "",
    "Plaats evenement": address.city || "",
  };

  Object.entries(fields).forEach(([name, value]) => {
    const field = getAddressField(form, name);
    if (field) {
      field.value = value;
    }
  });
}

function normalizeAddressSuggestion(doc) {
  const houseNumber = [doc.huisnummer, doc.huisletter, doc.huisnummertoevoeging]
    .filter(Boolean)
    .join("");

  return {
    fullAddress: doc.weergavenaam || "",
    street: doc.straatnaam || "",
    city: doc.woonplaatsnaam || "",
    postcode: doc.postcode || "",
    houseNumber,
  };
}

async function fetchAddressSuggestions(query, signal) {
  const url = new URL("https://api.pdok.nl/bzk/locatieserver/search/v3_1/suggest");
  url.searchParams.set("q", query);
  url.searchParams.set("fq", "type:adres");
  url.searchParams.set(
    "fl",
    "weergavenaam,straatnaam,woonplaatsnaam,postcode,huisnummer,huisletter,huisnummertoevoeging,adresseerbaarobject_id"
  );
  url.searchParams.set("rows", "5");

  const response = await fetch(url, { signal });
  if (!response.ok) {
    throw new Error("Adres zoeken is tijdelijk niet beschikbaar");
  }

  const data = await response.json();
  return (data.response?.docs || []).slice(0, 5).map(normalizeAddressSuggestion);
}

function renderAddressSuggestions(container, suggestions, onSelect) {
  container.innerHTML = "";

  if (!suggestions.length) {
    const status = document.createElement("div");
    status.className = "address-suggestion-status";
    status.textContent = "Geen adres gevonden, vul handmatig in";
    container.appendChild(status);
    container.hidden = false;
    return;
  }

  suggestions.forEach((suggestion) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "address-suggestion";
    button.setAttribute("role", "option");
    button.textContent = suggestion.fullAddress;
    button.addEventListener("click", () => onSelect(suggestion));
    container.appendChild(button);
  });

  container.hidden = false;
}

function selectAddressSuggestion(form, input, container, suggestion) {
  input.value = suggestion.fullAddress;
  input.setAttribute("aria-expanded", "false");
  setAddressHiddenFields(form, suggestion);
  container.hidden = true;
  container.innerHTML = "";
}

function updateManualAddress(form, input) {
  const manualFields = {
    street: form.querySelector('[data-address-field="street"]')?.value.trim() || "",
    houseNumber: form.querySelector('[data-address-field="houseNumber"]')?.value.trim() || "",
    postcode: form.querySelector('[data-address-field="postcode"]')?.value.trim() || "",
    city: form.querySelector('[data-address-field="city"]')?.value.trim() || "",
  };
  const fullAddress = [manualFields.street, manualFields.houseNumber, manualFields.postcode, manualFields.city]
    .filter(Boolean)
    .join(", ");

  setAddressHiddenFields(form, { ...manualFields, fullAddress });

  if (fullAddress) {
    input.value = fullAddress;
  }
}

function initAddressAutocomplete(form) {
  const input = form.querySelector("#event-address");
  const container = form.querySelector("#address-suggestions");
  const manualToggle = form.querySelector(".address-manual-toggle");
  const manualFields = form.querySelector(".manual-address-fields");

  if (!input || !container) return;

  let debounceTimer;
  let activeRequest;

  function hideSuggestions() {
    container.hidden = true;
    input.setAttribute("aria-expanded", "false");
  }

  input.addEventListener("input", () => {
    window.clearTimeout(debounceTimer);

    const query = input.value.trim();
    setAddressHiddenFields(form, { fullAddress: query });

    if (query.length < 4) {
      hideSuggestions();
      container.innerHTML = "";
      return;
    }

    debounceTimer = window.setTimeout(async () => {
      if (activeRequest) {
        activeRequest.abort();
      }

      activeRequest = new AbortController();
      container.innerHTML = '<div class="address-suggestion-status">Adres zoeken...</div>';
      container.hidden = false;
      input.setAttribute("aria-expanded", "true");

      try {
        const suggestions = await fetchAddressSuggestions(query, activeRequest.signal);
        renderAddressSuggestions(container, suggestions, (suggestion) => {
          selectAddressSuggestion(form, input, container, suggestion);
        });
      } catch (error) {
        if (error.name === "AbortError") return;
        renderAddressSuggestions(container, [], () => {});
      }
    }, 300);
  });

  if (manualToggle && manualFields) {
    manualToggle.addEventListener("click", () => {
      manualFields.hidden = false;
      hideSuggestions();
      const firstManualField = manualFields.querySelector("input");
      if (firstManualField) {
        firstManualField.focus();
      }
    });

    manualFields.querySelectorAll("input").forEach((field) => {
      field.addEventListener("input", () => updateManualAddress(form, input));
    });
  }

  document.addEventListener("click", (event) => {
    if (!input.contains(event.target) && !container.contains(event.target)) {
      hideSuggestions();
    }
  });

  form.addEventListener("submit", () => {
    if (manualFields && !manualFields.hidden) {
      updateManualAddress(form, input);
    } else {
      const fullAddressField = getAddressField(form, "Volledig adres evenement");
      if (fullAddressField && !fullAddressField.value) {
        fullAddressField.value = input.value.trim();
      }
    }
  });
}

quoteButtons.forEach((button) => {
  button.addEventListener("click", (event) => {
    event.stopPropagation();

    const optionName = button.getAttribute("data-option");
    selectRequestOption(optionName);

    if (selectionFeedback && optionName) {
      selectionFeedback.textContent = `${optionName} toegevoegd aan je aanvraag`;
    }

    const originalText = button.dataset.originalText || button.textContent;
    button.dataset.originalText = originalText;
    button.textContent = "Toegevoegd";
    button.classList.add("is-added");

    window.setTimeout(() => {
      button.textContent = originalText;
      button.classList.remove("is-added");
    }, 1600);

    if (contactSection) {
      contactSection.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  });
});

const contactForm = document.querySelector(".contact-form");

if (contactForm) {
  const eventDateInput = contactForm.querySelector('input[type="date"][name="event_date"]');

  if (eventDateInput) {
    eventDateInput.min = new Date().toISOString().split("T")[0];
  }

  contactForm
    .querySelectorAll('input[name="aanvraag_opties[]"], input[name="extras[]"]')
    .forEach((input) => {
      input.addEventListener("change", updateRequestSelection);
    });

  contactForm.querySelectorAll('select[name="type_tafels"], select[name="overige_opties"]').forEach((select) => {
    select.addEventListener("change", () => {
      if (select.value) {
        selectRequestOption(select.value);
      } else {
        updateRequestSelection();
      }
    });
  });

  contactForm.addEventListener("submit", () => {
    updateRequestSelection();
  });

  updateRequestSelection();
  initAddressAutocomplete(contactForm);
}
