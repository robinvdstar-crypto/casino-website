(function (root, factory) {
  const api = factory();

  if (typeof module === "object" && module.exports) {
    module.exports = api;
  }

  root.CasinoFormUtils = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  function clean(value) {
    return typeof value === "string" ? value.trim().replace(/\s+/g, " ") : "";
  }

  function timeToMinutes(value) {
    if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(value || "")) return null;
    const [hours, minutes] = value.split(":").map(Number);
    return (hours * 60) + minutes;
  }

  function calculateDuration(startTime, endTime, endsNextDay) {
    const start = timeToMinutes(startTime);
    const end = timeToMinutes(endTime);

    if (start === null || end === null) {
      return { valid: false, minutes: null, reason: "invalid" };
    }

    if (start === end) {
      return { valid: false, minutes: null, reason: "identical" };
    }

    if (end < start && !endsNextDay) {
      return { valid: false, minutes: null, reason: "next_day_required" };
    }

    const minutes = (endsNextDay ? end + (24 * 60) : end) - start;
    if (minutes <= 0) {
      return { valid: false, minutes: null, reason: "invalid" };
    }

    return { valid: true, minutes, reason: null };
  }

  function formatDuration(minutes) {
    const hours = Math.floor(minutes / 60);
    const remainder = minutes % 60;
    const parts = [];

    if (hours) parts.push(`${hours} ${hours === 1 ? "uur" : "uur"}`);
    if (remainder) parts.push(`${remainder} minuten`);

    return parts.join(" en ") || "0 minuten";
  }

  function formatDateForSubject(value) {
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value || "");
    return match ? `${match[3]}-${match[2]}-${match[1]}` : clean(value);
  }

  function formatDateForEmail(value) {
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value || "");
    if (!match) return clean(value);

    const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
    return new Intl.DateTimeFormat("nl-NL", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(date);
  }

  function composeExactAddress(address) {
    const streetLine = [clean(address.street), clean(address.houseNumber)].filter(Boolean).join(" ");
    const cityLine = [clean(address.postcode), clean(address.city)].filter(Boolean).join(" ");
    return [streetLine, cityLine].filter(Boolean).join(", ");
  }

  function composeLocation(generalLocation, address) {
    const general = clean(generalLocation);
    const exact = composeExactAddress(address || {});
    if (!exact) return general;
    if (!general) return exact;

    const normalizedGeneral = general.toLocaleLowerCase("nl-NL");
    const normalizedExact = exact.toLocaleLowerCase("nl-NL");
    const normalizedCity = clean(address.city).toLocaleLowerCase("nl-NL");

    if (normalizedExact.includes(normalizedGeneral) || normalizedGeneral === normalizedCity) {
      return exact;
    }

    return `${general} — ${exact}`;
  }

  function withoutAdvice(values) {
    return (values || []).filter((value) => clean(value) && !clean(value).toLocaleLowerCase("nl-NL").includes("adviseer mij"));
  }

  function buildSubmissionObject(data) {
    const duration = calculateDuration(data.startTime, data.endTime, Boolean(data.endsNextDay));
    if (!duration.valid) throw new Error("Ongeldige gewenste speeltijd");

    const location = composeLocation(data.location, data.address);
    const eventType = data.eventType === "Anders" ? clean(data.otherEventType) : clean(data.eventType);
    const tables = withoutAdvice(data.tables);
    const extras = withoutAdvice(data.extras);
    const tableAdvice = (data.tables || []).some((value) => clean(value).toLocaleLowerCase("nl-NL").includes("adviseer mij"));
    const extraAdvice = (data.extras || []).some((value) => clean(value).toLocaleLowerCase("nl-NL").includes("adviseer mij"));
    const result = {
      access_key: clean(data.accessKey),
      subject: `Nieuwe casinoaanvraag | ${formatDateForSubject(data.eventDate)} | ${clean(data.location) || clean(data.address?.city)}`,
      from_name: clean(data.fromName) || "Casinotafelshuren.com",
      name: clean(data.name),
      email: clean(data.email),
      phone: clean(data.phone),
      "Datum evenement": formatDateForEmail(data.eventDate),
      Locatie: location,
      "Type evenement": eventType,
      "Aantal gasten": clean(data.guestCount),
      "Gewenste begintijd casinotafels": clean(data.startTime),
      "Gewenste eindtijd casinotafels": clean(data.endTime),
    };

    if (data.endsNextDay) {
      result["Eindtijd volgende dag"] = "Ja";
    }

    Object.assign(result, {
      "Gewenste speeltijd": formatDuration(duration.minutes),
      Aanvraagtype: clean(data.intent),
      Tafels: tables.length ? tables.join(", ") : (tableAdvice ? "Advies gevraagd" : ""),
      "Extra's": extras.length ? extras.join(", ") : (extraAdvice ? "Advies gevraagd" : ""),
      Budgetindicatie: clean(data.budget),
      "Aanvullende wensen": clean(data.message),
      Bron: "Website offerteformulier",
    });

    return Object.fromEntries(Object.entries(result).filter(([, value]) => value !== "" && value !== null && value !== undefined));
  }

  return {
    buildSubmissionObject,
    calculateDuration,
    clean,
    composeExactAddress,
    composeLocation,
    formatDateForEmail,
    formatDateForSubject,
    formatDuration,
    timeToMinutes,
  };
});
