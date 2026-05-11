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
}
