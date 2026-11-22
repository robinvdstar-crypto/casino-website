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
  hamburger.setAttribute("type", "button");
  hamburger.setAttribute("aria-controls", "mobile-menu");
  hamburger.setAttribute("aria-expanded", "false");

  function closeMobileMenu() {
    mobileMenu.classList.remove("open");
    hamburger.classList.remove("open");
    hamburger.setAttribute("aria-expanded", "false");
  }

  hamburger.addEventListener("click", () => {
    const isOpen = mobileMenu.classList.toggle("open");
    hamburger.classList.toggle("open", isOpen);
    hamburger.setAttribute("aria-expanded", String(isOpen));
  });

  mobileMenu.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      closeMobileMenu();
    });
  });

  mobileMenu.addEventListener("click", (event) => {
    if (event.target === mobileMenu) {
      closeMobileMenu();
    }
  });

  document.addEventListener("click", (event) => {
    const clickInsideMenu = mobileMenu.contains(event.target);
    const clickOnHamburger = hamburger.contains(event.target);

    if (!clickInsideMenu && !clickOnHamburger) {
      closeMobileMenu();
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

const hoverVideoMedia = document.querySelectorAll(".table-media--roulette, .table-media--blackjack");
const supportsDesktopHover = window.matchMedia("(hover: hover) and (pointer: fine)");

hoverVideoMedia.forEach((media) => {
  const video = media.querySelector("video");

  if (!video) return;

  media.addEventListener("mouseenter", () => {
    if (!supportsDesktopHover.matches) return;

    video.currentTime = 0;
    video.play().catch(() => {});
  });

  media.addEventListener("mouseleave", () => {
    video.pause();
    video.currentTime = 0;
  });
});

const quoteButtons = document.querySelectorAll("[data-option]");
const selectionFeedback = document.querySelector(".selection-feedback");
const requestSummaryBar = document.querySelector(".request-summary-bar");
const stickyMobileCta = document.querySelector(".sticky-mobile-cta");
const offerSection = document.getElementById("offerte");
const offerChoicesSection = document.getElementById("offerte-keuzes");
const offerDetailsSection = document.getElementById("offerte-gegevens");
const optionAliases = {
  "Complete casinoavond": "Complete casinoavond laten verzorgen",
  "Decoratie": "Casino decoratie",
  "Casino props": "Casino decoratie",
  "Rode loper entree": "Casino decoratie",
  "Las Vegas decoratie": "Complete aankleding / themafeest",
  "Fotografie": "Fotografie / fotospiegel",
  "Fotospiegel": "Fotografie / fotospiegel",
  "Magische fotospiegel": "Fotografie / fotospiegel",
  "Photo booth": "Fotografie / fotospiegel",
  "Casino verlichting": "Verlichting",
  "Speeldollars met eigen logo": "Custom speeldollars met eigen logo",
  "Speeldollars met eigen logo (+€100)": "Custom speeldollars met eigen logo",
};

function getCheckedValues(selector) {
  return Array.from(document.querySelectorAll(selector + ":checked")).map((input) => input.value);
}

function findOptionInput(optionName) {
  const normalizedOption = optionAliases[optionName] || optionName;

  return Array.from(document.querySelectorAll('input[data-request-group="tables"], input[data-request-group="extras"]'))
    .find((input) => input.value === normalizedOption);
}

function findIntentInput(optionName) {
  const normalizedOption = optionAliases[optionName] || optionName;

  return Array.from(document.querySelectorAll('input[name="Wat zoekt de klant ongeveer"]'))
    .find((input) => input.value === normalizedOption);
}

function getRequestSelections() {
  const selectedTables = getCheckedValues('input[data-request-group="tables"]');
  const selectedExtras = getCheckedValues('input[data-request-group="extras"]');
  const selectedIntent = document.querySelector('input[name="Wat zoekt de klant ongeveer"]:checked')?.value || "";

  return { selectedTables, selectedExtras, selectedIntent };
}

function updateRequestSelection() {
  const { selectedTables, selectedExtras, selectedIntent } = getRequestSelections();
  const allSelections = [...new Set([...selectedTables, ...selectedExtras])];

  if (requestSummaryBar) {
    const count = allSelections.length + (selectedIntent ? 1 : 0);
    requestSummaryBar.hidden = count === 0;
    document.body.classList.toggle("has-request-selection", count > 0);

    const label = requestSummaryBar.querySelector("strong");
    if (label) {
      label.textContent = allSelections.length
        ? `${allSelections.length} ${allSelections.length === 1 ? "optie" : "opties"}`
        : "Je aanvraag";
    }
  }
}

function selectRequestOption(optionName) {
  const checkbox = findOptionInput(optionName);
  const intentInput = findIntentInput(optionName);

  if (checkbox) {
    checkbox.checked = true;
    enforceAdviceChoice(checkbox);
  }

  if (intentInput) {
    intentInput.checked = true;
  }

  updateRequestSelection();
}

function enforceAdviceChoice(changedInput) {
  if (!changedInput?.checked) return;

  const group = changedInput.dataset.requestGroup;
  if (!group) return;

  const groupInputs = Array.from(document.querySelectorAll(`input[data-request-group="${group}"]`));
  const changedIsAdvice = changedInput.value.toLocaleLowerCase("nl-NL").includes("adviseer mij");

  groupInputs.forEach((input) => {
    const inputIsAdvice = input.value.toLocaleLowerCase("nl-NL").includes("adviseer mij");
    if (input !== changedInput && (changedIsAdvice || inputIsAdvice)) {
      input.checked = false;
    }
  });
}

function applyRequestParams() {
  const params = new URLSearchParams(window.location.search);
  const tableParams = [...params.getAll("tafel"), ...params.getAll("tafels"), ...params.getAll("table")];
  const extraParams = [...params.getAll("optie"), ...params.getAll("extra"), ...params.getAll("extras"), ...params.getAll("option")];
  const packageParams = [...params.getAll("pakket"), ...params.getAll("package")];
  const selectedParams = [...tableParams, ...extraParams, ...packageParams]
    .flatMap((value) => value.split(","))
    .map((value) => value.trim())
    .filter(Boolean);

  selectedParams.forEach(selectRequestOption);
}

function getSelectedOptionLabel(optionName) {
  return optionAliases[optionName] || optionName;
}

function setQuoteCtaTarget(target, label) {
  if (stickyMobileCta) {
    stickyMobileCta.setAttribute("href", target);
    stickyMobileCta.textContent = label;
  }

  const summaryLink = requestSummaryBar?.querySelector("a");
  if (summaryLink) {
    summaryLink.setAttribute("href", target);
    summaryLink.textContent = label;
  }
}

function updateStickyQuoteFlow() {
  if (!stickyMobileCta || !offerSection || !offerChoicesSection || !offerDetailsSection) return;

  const offset = 140;
  const choicesTop = offerChoicesSection.getBoundingClientRect().top;
  const detailsTop = offerDetailsSection.getBoundingClientRect().top;
  const detailsBottom = offerDetailsSection.getBoundingClientRect().bottom;
  const detailsVisible = detailsTop < window.innerHeight * 0.72 && detailsBottom > offset;
  const isInChoices = choicesTop <= offset || window.location.hash === "#offerte-keuzes";
  const { selectedTables, selectedExtras, selectedIntent } = getRequestSelections();
  const hasSelections = selectedTables.length > 0 || selectedExtras.length > 0 || Boolean(selectedIntent);

  document.body.classList.toggle("at-offerte-gegevens", detailsVisible);

  if (detailsVisible) {
    return;
  }

  if (isInChoices || hasSelections) {
    setQuoteCtaTarget("#offerte-gegevens", "Verder naar gegevens");
  } else {
    setQuoteCtaTarget("#offerte", "Offerte aanvragen");
  }
}

function getLocalDateValue(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
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
  container.hidden = true;
  container.innerHTML = "";
}

function getManualAddress(form) {
  return {
    street: form.querySelector('[data-address-field="street"]')?.value.trim() || "",
    houseNumber: form.querySelector('[data-address-field="houseNumber"]')?.value.trim() || "",
    postcode: form.querySelector('[data-address-field="postcode"]')?.value.trim() || "",
    city: form.querySelector('[data-address-field="city"]')?.value.trim() || "",
  };
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
      const willOpen = manualFields.hidden;
      manualFields.hidden = !willOpen;
      manualToggle.setAttribute("aria-expanded", String(willOpen));
      manualToggle.textContent = willOpen ? "Exact adres verbergen" : "Exact adres al bekend?";
      hideSuggestions();
      const firstManualField = willOpen ? manualFields.querySelector("input") : null;
      if (firstManualField) {
        firstManualField.focus();
      }
    });
  }

  document.addEventListener("click", (event) => {
    if (!input.contains(event.target) && !container.contains(event.target)) {
      hideSuggestions();
    }
  });

}

quoteButtons.forEach((button) => {
  button.addEventListener("click", (event) => {
    event.stopPropagation();

    const optionName = button.getAttribute("data-option");
    selectRequestOption(optionName);
    const selectedLabel = getSelectedOptionLabel(optionName);

    if (selectionFeedback && selectedLabel) {
      selectionFeedback.textContent = `${selectedLabel} toegevoegd aan je aanvraag`;
    }

    const originalText = button.dataset.originalText || button.textContent;
    button.dataset.originalText = originalText;
    button.textContent = "Toegevoegd";
    button.classList.add("is-added");

    window.setTimeout(() => {
      button.textContent = originalText;
      button.classList.remove("is-added");
    }, 1600);

    setQuoteCtaTarget("#offerte-gegevens", "Verder naar gegevens");
    updateStickyQuoteFlow();
  });
});

function setFieldError(input, errorId, message) {
  const error = document.getElementById(errorId);
  if (error) error.textContent = message;
  if (input) input.setAttribute("aria-invalid", message ? "true" : "false");
}

function clearFormErrors(form) {
  form.querySelectorAll(".field-error").forEach((error) => {
    error.textContent = "";
  });
  form.querySelectorAll('[aria-invalid="true"]').forEach((field) => {
    field.removeAttribute("aria-invalid");
  });
}

function updateDurationPreview(form) {
  const output = form.querySelector("#play-duration");
  const startTime = form.querySelector("#event-start-time")?.value || "";
  const endTime = form.querySelector("#event-end-time")?.value || "";
  const endsNextDay = form.querySelector("#event-next-day")?.checked || false;

  if (!output) return;
  if (!startTime || !endTime) {
    output.textContent = "Vul begin- en eindtijd in om de gewenste speeltijd te controleren.";
    output.classList.remove("is-error");
    return;
  }

  const duration = window.CasinoFormUtils.calculateDuration(startTime, endTime, endsNextDay);
  if (!duration.valid) {
    output.textContent = duration.reason === "next_day_required"
      ? "Valt de eindtijd na middernacht? Vink dan ‘Eindtijd is de volgende dag’ aan."
      : "Begin- en eindtijd moeten verschillend zijn.";
    output.classList.add("is-error");
    return;
  }

  output.textContent = `Gewenste speeltijd: ${window.CasinoFormUtils.formatDuration(duration.minutes)}.`;
  output.classList.remove("is-error");
}

function validateQuoteForm(form) {
  clearFormErrors(form);
  let firstInvalid = null;

  function requireField(selector, errorId, message) {
    const field = form.querySelector(selector);
    if (!field || field.value.trim()) return field;
    setFieldError(field, errorId, message);
    firstInvalid ||= field;
    return field;
  }

  const selectedIntent = form.querySelector('input[name="Wat zoekt de klant ongeveer"]:checked');
  if (!selectedIntent) {
    const firstIntent = form.querySelector('input[name="Wat zoekt de klant ongeveer"]');
    setFieldError(firstIntent, "request-intent-error", "Kies wat je ongeveer zoekt.");
    firstInvalid ||= firstIntent;
  }

  const eventDate = requireField("#event-date", "event-date-error", "Kies de datum van het evenement.");
  if (eventDate?.value && eventDate.value < eventDate.min) {
    setFieldError(eventDate, "event-date-error", "Kies vandaag of een datum in de toekomst.");
    firstInvalid ||= eventDate;
  }

  const eventType = requireField("#event-type", "event-type-error", "Kies het type evenement.");
  const otherType = form.querySelector("#other-event-type");
  if (eventType?.value === "Anders" && !otherType?.value.trim()) {
    setFieldError(otherType, "other-event-type-error", "Beschrijf kort om welk evenement het gaat.");
    firstInvalid ||= otherType;
  }

  const startTime = requireField("#event-start-time", "event-start-time-error", "Vul de gewenste begintijd in.");
  const endTime = requireField("#event-end-time", "event-end-time-error", "Vul de gewenste eindtijd in.");
  if (startTime?.value && endTime?.value) {
    const duration = window.CasinoFormUtils.calculateDuration(
      startTime.value,
      endTime.value,
      form.querySelector("#event-next-day")?.checked || false
    );
    if (!duration.valid) {
      const message = duration.reason === "next_day_required"
        ? "Vink ‘Eindtijd is de volgende dag’ aan voor een eindtijd na middernacht."
        : "Begin- en eindtijd moeten verschillend zijn.";
      setFieldError(endTime, "event-end-time-error", message);
      firstInvalid ||= endTime;
    }
  }

  requireField("#guest-count", "guest-count-error", "Kies een inschatting of ‘Nog niet bekend’." );
  requireField("#budget-indication", "budget-error", "Kies een budgetindicatie of vraag om advies.");
  requireField("#event-address", "event-address-error", "Vul de plaats of locatie van het evenement in.");
  requireField("#customer-name", "customer-name-error", "Vul je naam in.");

  const email = requireField("#customer-email", "customer-email-error", "Vul je e-mailadres in.");
  if (email?.value && !email.validity.valid) {
    setFieldError(email, "customer-email-error", "Vul een geldig e-mailadres in.");
    firstInvalid ||= email;
  }

  const phone = requireField("#customer-phone", "customer-phone-error", "Vul je telefoonnummer in.");
  if (phone?.value) {
    const digits = phone.value.replace(/\D/g, "");
    const allowedCharacters = /^[+()\d\s.-]+$/.test(phone.value);
    if (!allowedCharacters || digits.length < 7) {
      setFieldError(phone, "customer-phone-error", "Vul een geldig telefoonnummer in.");
      firstInvalid ||= phone;
    }
  }

  const manualFields = form.querySelector("#manual-address-fields");
  if (manualFields && !manualFields.hidden) {
    const address = getManualAddress(form);
    if (Object.values(address).some(Boolean) && Object.values(address).some((value) => !value)) {
      const message = "Vul straat, huisnummer, postcode en plaats in, of verberg het exacte adres.";
      const addressInputs = Array.from(manualFields.querySelectorAll("input"));
      addressInputs.forEach((input) => input.setAttribute("aria-invalid", "true"));
      const error = form.querySelector("#manual-address-error");
      if (error) error.textContent = message;
      firstInvalid ||= addressInputs.find((input) => !input.value.trim()) || addressInputs[0];
    }
  }

  if (firstInvalid) {
    firstInvalid.focus();
    return false;
  }
  return true;
}

function collectQuoteFormData(form) {
  const selections = getRequestSelections();
  const manualFields = form.querySelector("#manual-address-fields");
  const eventType = form.querySelector("#event-type")?.value || "";

  return {
    accessKey: form.querySelector('input[name="access_key"]')?.value || "",
    fromName: form.querySelector('input[name="from_name"]')?.value || "",
    name: form.querySelector("#customer-name")?.value || "",
    email: form.querySelector("#customer-email")?.value || "",
    phone: form.querySelector("#customer-phone")?.value || "",
    eventDate: form.querySelector("#event-date")?.value || "",
    eventType,
    otherEventType: eventType === "Anders" ? form.querySelector("#other-event-type")?.value || "" : "",
    startTime: form.querySelector("#event-start-time")?.value || "",
    endTime: form.querySelector("#event-end-time")?.value || "",
    endsNextDay: form.querySelector("#event-next-day")?.checked || false,
    guestCount: form.querySelector("#guest-count")?.value || "",
    budget: form.querySelector("#budget-indication")?.value || "",
    location: form.querySelector("#event-address")?.value || "",
    address: manualFields && !manualFields.hidden ? getManualAddress(form) : {},
    intent: selections.selectedIntent,
    tables: selections.selectedTables,
    extras: selections.selectedExtras,
    message: form.querySelector("#customer-message")?.value || "",
  };
}

async function submitQuoteForm(form) {
  const submitButton = form.querySelector(".form-submit");
  const status = form.querySelector(".form-status");
  const originalLabel = submitButton.textContent;
  const payload = window.CasinoFormUtils.buildSubmissionObject(collectQuoteFormData(form));

  submitButton.disabled = true;
  submitButton.setAttribute("aria-busy", "true");
  submitButton.textContent = "Aanvraag versturen...";
  status.className = "form-status is-pending";
  status.setAttribute("role", "status");
  status.textContent = "Je aanvraag wordt veilig verstuurd.";

  try {
    const response = await fetch("https://api.web3forms.com/submit", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(payload),
    });
    const result = await response.json().catch(() => ({}));

    if (!response.ok || result.success !== true) {
      throw new Error("Web3Forms bevestigde de verzending niet.");
    }

    // Success is confirmed above. Never let an Analytics failure affect the request.
    try { await window.SitePrivacy?.lead(form); } catch (_) {}
    status.className = "form-status is-success";
    status.setAttribute("role", "status");
    status.textContent = "Aanvraag ontvangen. Je wordt doorgestuurd naar de bedankpagina.";
    window.location.assign("bedankt.html");
    return true;
  } catch (error) {
    status.className = "form-status is-error";
    status.setAttribute("role", "alert");
    status.textContent = "Versturen is niet gelukt. Controleer je verbinding en probeer het opnieuw; je ingevulde gegevens zijn bewaard.";
    status.focus();
    submitButton.disabled = false;
    submitButton.removeAttribute("aria-busy");
    submitButton.textContent = originalLabel;
    return false;
  }
}

const contactForm = document.querySelector(".contact-form");

if (contactForm) {
  const eventDateInput = contactForm.querySelector("#event-date");
  const eventTypeInput = contactForm.querySelector("#event-type");
  const otherEventField = contactForm.querySelector("#other-event-field");
  const otherEventInput = contactForm.querySelector("#other-event-type");
  let isSubmitting = false;

  if (eventDateInput) {
    eventDateInput.min = getLocalDateValue();
  }

  function updateOtherEventField() {
    const isOther = eventTypeInput?.value === "Anders";
    if (otherEventField) otherEventField.hidden = !isOther;
    if (otherEventInput) otherEventInput.required = isOther;
  }

  eventTypeInput?.addEventListener("change", updateOtherEventField);
  updateOtherEventField();

  contactForm.querySelectorAll("#event-start-time, #event-end-time, #event-next-day").forEach((field) => {
    field.addEventListener("input", () => updateDurationPreview(contactForm));
    field.addEventListener("change", () => updateDurationPreview(contactForm));
  });
  updateDurationPreview(contactForm);

  contactForm
    .querySelectorAll('input[data-request-group="tables"], input[data-request-group="extras"], input[name="Wat zoekt de klant ongeveer"]')
    .forEach((input) => {
      input.addEventListener("change", () => {
        if (input.name === "Wat zoekt de klant ongeveer") {
          const intentError = contactForm.querySelector("#request-intent-error");
          if (intentError) intentError.textContent = "";
          contactForm.querySelectorAll('input[name="Wat zoekt de klant ongeveer"]').forEach((intent) => {
            intent.removeAttribute("aria-invalid");
          });
        }
        if (input.dataset.requestGroup) {
          enforceAdviceChoice(input);
          const adviceIntent = contactForm.querySelector('input[name="Wat zoekt de klant ongeveer"][value="Ik weet het nog niet, adviseer mij"]');
          const isConcreteTable = input.dataset.requestGroup === "tables"
            && input.checked
            && !input.value.toLocaleLowerCase("nl-NL").includes("adviseer mij");
          if (isConcreteTable && adviceIntent?.checked) {
            adviceIntent.checked = false;
            contactForm.querySelector('input[name="Wat zoekt de klant ongeveer"][value="Losse casinotafels huren"]').checked = true;
          }
        } else if (input.value === "Ik weet het nog niet, adviseer mij" && input.checked) {
          contactForm.querySelectorAll('input[data-request-group="tables"]').forEach((table) => {
            table.checked = false;
          });
        }
        updateRequestSelection();
        updateStickyQuoteFlow();
      });
    });

  contactForm.addEventListener("input", (event) => {
    const field = event.target;
    if (!(field instanceof HTMLElement)) return;
    field.removeAttribute("aria-invalid");
    const describedBy = (field.getAttribute("aria-describedby") || "").split(/\s+/);
    describedBy.forEach((id) => {
      const message = document.getElementById(id);
      if (message?.classList.contains("field-error")) message.textContent = "";
    });
  });

  contactForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (isSubmitting) return;

    updateRequestSelection();
    if (contactForm.querySelector('input[name="botcheck"]')?.checked) {
      return;
    }
    if (!validateQuoteForm(contactForm)) {
      const status = contactForm.querySelector(".form-status");
      status.className = "form-status is-error";
      status.setAttribute("role", "alert");
      status.textContent = "Controleer de gemarkeerde velden voordat je de aanvraag verstuurt.";
      return;
    }

    isSubmitting = true;
    const submitted = await submitQuoteForm(contactForm);
    if (!submitted) isSubmitting = false;
  });

  updateRequestSelection();
  applyRequestParams();
  updateStickyQuoteFlow();
  initAddressAutocomplete(contactForm);
}

window.addEventListener("scroll", updateStickyQuoteFlow, { passive: true });
window.addEventListener("resize", updateStickyQuoteFlow);
updateStickyQuoteFlow();
