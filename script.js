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

const quoteButtons = document.querySelectorAll("[data-table]");
const contactSection = document.getElementById("contact");
const selectionFeedback = document.querySelector(".selection-feedback");

quoteButtons.forEach((button) => {
  button.addEventListener("click", (event) => {
    event.stopPropagation();

    const tableName = button.getAttribute("data-table");
    const checkbox = Array.from(document.querySelectorAll('input[name="tables[]"]'))
      .find((input) => input.value === tableName);

    if (checkbox) {
      checkbox.checked = true;
    }

    if (selectionFeedback && tableName) {
      selectionFeedback.textContent = `${tableName} toegevoegd aan je offerteaanvraag`;
    }

    if (contactSection) {
      contactSection.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  });
});

const contactForm = document.querySelector(".contact-form");

if (contactForm) {
  contactForm.addEventListener("submit", () => {
    const selectedTables = Array.from(contactForm.querySelectorAll('input[name="tables[]"]:checked'))
      .map((input) => input.value)
      .join(", ");
    const selectedExtras = Array.from(contactForm.querySelectorAll('input[name="extras[]"]:checked'))
      .map((input) => input.value)
      .join(", ");
    const selectedTablesField = contactForm.querySelector('input[name="selected_tables"]');
    const selectedExtrasField = contactForm.querySelector('input[name="selected_extras"]');

    if (selectedTablesField) {
      selectedTablesField.value = selectedTables;
    }

    if (selectedExtrasField) {
      selectedExtrasField.value = selectedExtras;
    }
  });
}
