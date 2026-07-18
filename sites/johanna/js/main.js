// js/main.js
(() => {
  const bookingConfig = {
    // GitHub Pages liefert ausschließlich statische Dateien aus. Ohne
    // Server-Endpunkt wird die Anfrage sicher als vorbereitete E-Mail geöffnet.
    backendEndpoint: "",
    ownerEmail: "willkommen@studio-johanna.de",
    ownerPhone: "+491749450240",
    minBookingHours: 2,
    weekendMinBookingHours: 4,
    maxDailyBookingHours: 12,
    maxDirectBookingHours: 6,
    maxMultiDayDays: 5,
    weekdayMinPriceNet: 120,
    weekendMinPriceNet: 170,
    dailyPriceNet: 267,
    multiDayDiscountPriceNet: 235,
    openingHour: 8,
    closingHour: 21,
    calendarSyncTarget: "caldav-or-ical-feed",
    eventTypes: [
      {
        value: "tagung",
        label: "Tagung / Workshop",
        defaultDuration: 4,
        addons: ["technik", "getraenke", "catering", "tafel"]
      },
      {
        value: "promotion",
        label: "Promotion / Pop-up",
        defaultDuration: 3,
        addons: ["technik", "getraenke"]
      },
      {
        value: "familiencafe",
        label: "Familiencafe / Dinner",
        defaultDuration: 4,
        addons: ["tafel", "catering", "blumen"]
      },
      {
        value: "trauerfeier",
        label: "Trauerfeier / stiller Empfang",
        defaultDuration: 4,
        addons: ["tafel", "getraenke", "blumen", "aussenbereich"]
      },
      {
        value: "stehempfang",
        label: "Stehempfang / Außenbereich",
        defaultDuration: 3,
        addons: ["getraenke", "aussenbereich", "restaurant"]
      },
      {
        value: "abend",
        label: "Empfang mit Folgeprogramm",
        defaultDuration: 5,
        addons: ["getraenke", "restaurant", "bars"]
      }
    ],
    seatingOptions: [
      ["lange-tafel", "Lange Tafel"],
      ["bankett", "Bankett"],
      ["reihen", "Reihenbestuhlung"],
      ["workshop", "Workshop-Setup"],
      ["freie-flaeche", "Freie Fläche"]
    ],
    addons: [
      ["tafel", "Eindeckung einer Tafel", "Geschirr, Gläser, Servietten und festlicher Aufbau."],
      ["catering", "Cateringservice", "Abstimmung von Speisen, Service und Getränken."],
      ["blumen", "Tischblumenservice", "Florale Begleitung passend zum Anlass."],
      ["technik", "Präsentationstechnik", "Vortrag, Workshop oder Produktpräsentation."],
      ["getraenke", "Getränke-Service", "Empfang, Kaffee, Wasser oder Abendbegleitung."],
      ["aussenbereich", "Außenbereich / Innenhof", "Stehempfang im grünen Innenhof oder nach Absprache am Eingang in der Barfüßer Straße."],
      ["restaurant", "Restaurant-Empfehlung", "Naheliegendes Dinner als Anschlussprogramm."],
      ["bars", "Bars in der Altstadt", "Ruhiges Folgeprogramm nach Studio-Nutzung."],
      ["hohnstein", "Burgruine Hohnstein", "Ausflug oder ritterliches Gelage in Neustadt."],
      ["rundum", "Wir kümmern uns um alles", "Rundumbetreuung ab 12 Stunden: Hochzeitsempfang, Anschlusslokalität und passende Übernachtung."]
    ],
    lodgingOptions: [
      ["", "Noch nicht benötigt"],
      ["fuerstenhof", "Nordhäuser Fürstenhof - gehoben"],
      ["pension-ibe", "Pension Ibe / Südharzperle Neustadt - naturnah und günstiger"],
      ["beide", "Beide Optionen prüfen"]
    ]
  };

  const studioBookingConfig = {
    ...bookingConfig,
    ...(window.STUDIO_BOOKING_CONFIG || {})
  };

  const header = document.querySelector("[data-header]");
  const menuToggle = document.querySelector("[data-menu-toggle]");
  const mobileNav = document.querySelector("[data-mobile-nav]");
  const tourDialog = document.querySelector("[data-tour-dialog]");
  const tourOpenButtons = document.querySelectorAll("[data-tour-open]");
  const tourCloseButton = document.querySelector("[data-tour-close]");
  const bookingDialog = document.querySelector("[data-booking-dialog]");
  const bookingOpenButton = document.querySelector("[data-booking-open]");
  const bookingCloseButton = document.querySelector("[data-booking-close]");
  const bookingForm = document.querySelector("[data-booking-form]");
  const bookingType = document.querySelector("[data-booking-type]");
  const bookingDate = document.querySelector("[data-booking-date]");
  const bookingEndDate = document.querySelector("[data-booking-end-date]");
  const bookingDateSummary = document.querySelector("[data-booking-date-summary]");
  const bookingResetDate = document.querySelector("[data-booking-reset-date]");
  const bookingTimeRow = document.querySelector("[data-booking-time-row]");
  const bookingStart = document.querySelector("[data-booking-start]");
  const bookingDuration = document.querySelector("[data-booking-duration]");
  const bookingPrice = document.querySelector("[data-booking-price]");
  const calendarTitle = document.querySelector("[data-calendar-title]");
  const calendarGrid = document.querySelector("[data-calendar-grid]");
  const calendarPrev = document.querySelector("[data-calendar-prev]");
  const calendarNext = document.querySelector("[data-calendar-next]");
  const bookingGuests = document.querySelector("[data-booking-guests]");
  const bookingSeating = document.querySelector("[data-booking-seating]");
  const bookingAddons = document.querySelector("[data-booking-addons]");
  const bookingLodging = document.querySelector("[data-booking-lodging]");
  const bookingLodgingRow = document.querySelector("[data-booking-lodging-row]");
  const bookingStatus = document.querySelector("[data-booking-status]");
  const bookingSubmitStatus = document.querySelector("[data-booking-submit-status]");
  const bookingSubmit = document.querySelector("[data-booking-submit]");
  const bookingName = document.querySelector("[data-booking-name]");
  const bookingEmail = document.querySelector("[data-booking-email]");
  const bookingPhone = document.querySelector("[data-booking-phone]");
  const bookingCompany = document.querySelector("[data-booking-company]");
  const bookingReview = document.querySelector("[data-booking-review]");
  const bookingConsent = document.querySelector("[data-booking-consent]");
  const bookingBackButton = document.querySelector("[data-booking-back]");
  const bookingNextButton = document.querySelector("[data-booking-next]");
  const bookingStepLabel = document.querySelector("[data-booking-step-label]");
  const bookingSteps = document.querySelectorAll("[data-booking-step]");
  const bookingStepDots = document.querySelectorAll("[data-step-dot]");
  let currentBookingStep = 0;
  let selectedStartDate = "";
  let selectedEndDate = "";
  let serverAvailability = [];
  const today = new Date();
  let visibleCalendarMonth = new Date(today.getFullYear(), today.getMonth(), 1);

  const setHeaderState = () => {
    if (!header) return;
    header.classList.toggle("is-scrolled", window.scrollY > 24);
  };

  window.addEventListener("scroll", setHeaderState, { passive: true });
  setHeaderState();

  if (menuToggle && mobileNav) {
    menuToggle.addEventListener("click", () => {
      const isOpen = mobileNav.classList.toggle("is-open");
      menuToggle.setAttribute("aria-expanded", String(isOpen));
      menuToggle.setAttribute("aria-label", isOpen ? "Menü schließen" : "Menü öffnen");
    });

    mobileNav.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", () => {
        mobileNav.classList.remove("is-open");
        menuToggle.setAttribute("aria-expanded", "false");
        menuToggle.setAttribute("aria-label", "Menü öffnen");
      });
    });
  }

  const revealItems = document.querySelectorAll(".reveal");

  if ("IntersectionObserver" in window) {
    const revealObserver = new IntersectionObserver(
      (entries, observer) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        });
      },
      {
        threshold: 0.14,
        rootMargin: "0px 0px -8% 0px"
      }
    );

    revealItems.forEach((item) => revealObserver.observe(item));
  } else {
    revealItems.forEach((item) => item.classList.add("is-visible"));
  }

  const padTime = (hour) => `${String(hour).padStart(2, "0")}:00`;

  const formatDate = (date) =>
    new Intl.DateTimeFormat("de-DE", {
      weekday: "short",
      day: "2-digit",
      month: "2-digit",
      year: "numeric"
    }).format(date);

  const toIsoDate = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const fromIsoDate = (value) => {
    if (!value) return null;
    const [year, month, day] = value.split("-").map(Number);
    if (!year || !month || !day) return null;
    return new Date(year, month - 1, day);
  };

  const addDays = (date, days) => {
    const nextDate = new Date(date);
    nextDate.setDate(nextDate.getDate() + days);
    return nextDate;
  };

  const dayCountBetween = (start, end) => {
    const startDate = fromIsoDate(start);
    const endDate = fromIsoDate(end || start);
    if (!startDate || !endDate) return 0;
    return Math.round((endDate - startDate) / 86400000) + 1;
  };

  const isWeekend = (dateValue) => {
    const date = fromIsoDate(dateValue);
    if (!date) return false;
    const day = date.getDay();
    return day === 0 || day === 6;
  };

  const toDateTime = (date, time) => new Date(`${date}T${time}:00`);

  const overlapsBlockedSlot = (payload) => {
    if (!payload.date) return false;
    return serverAvailability.some((block) => {
      const blockEndDate = block.endDate || block.date;
      if (payload.isMultiDay) {
        return payload.date <= blockEndDate && payload.endDate >= block.date;
      }
      if (payload.date < block.date || payload.date > blockEndDate) return false;
      if (!payload.start || !payload.duration || !block.start || !block.duration || blockEndDate !== block.date) return true;
      const requestStart = toDateTime(payload.date, payload.start);
      const requestEnd = new Date(requestStart.getTime() + payload.duration * 60 * 60 * 1000);
      const blockStart = toDateTime(block.date, block.start);
      const blockEnd = new Date(blockStart.getTime() + Number(block.duration) * 60 * 60 * 1000);
      return requestStart < blockEnd && requestEnd > blockStart;
    });
  };

  const loadAvailability = async () => {
    if (!studioBookingConfig.backendEndpoint) return;
    try {
      const response = await fetch(`${studioBookingConfig.backendEndpoint}?action=availability`, {
        headers: { Accept: "application/json" },
        cache: "no-store"
      });
      const result = await response.json();
      if (response.ok && result.success && Array.isArray(result.ranges)) {
        serverAvailability = result.ranges;
        renderCalendar();
        setStatus();
      }
    } catch {
      // Die Anfrage bleibt auch bei vorübergehend nicht erreichbarer Verfügbarkeitsprüfung möglich.
    }
  };

  const createOptions = (select, options) => {
    if (!select) return;
    select.replaceChildren();

    options.forEach(([value, label]) => {
      const option = document.createElement("option");
      option.value = value;
      option.textContent = label;
      select.append(option);
    });
  };

  const isMultiDaySelection = () => selectedStartDate && selectedEndDate && selectedEndDate !== selectedStartDate;

  const renderCalendar = () => {
    if (!calendarGrid || !calendarTitle) return;

    const monthStart = new Date(visibleCalendarMonth.getFullYear(), visibleCalendarMonth.getMonth(), 1);
    const monthEnd = new Date(visibleCalendarMonth.getFullYear(), visibleCalendarMonth.getMonth() + 1, 0);
    const gridStartOffset = (monthStart.getDay() + 6) % 7;
    const gridStart = addDays(monthStart, -gridStartOffset);
    const todayIso = toIsoDate(new Date());

    calendarTitle.textContent = new Intl.DateTimeFormat("de-DE", {
      month: "long",
      year: "numeric"
    }).format(monthStart);

    calendarGrid.replaceChildren();

    for (let index = 0; index < 42; index += 1) {
      const date = addDays(gridStart, index);
      const iso = toIsoDate(date);
      const button = document.createElement("button");
      button.type = "button";
      button.className = "calendar-day";
      button.textContent = String(date.getDate());
      button.dataset.date = iso;
      button.setAttribute("role", "gridcell");
      button.setAttribute("aria-label", formatDate(date));

      if (date.getMonth() !== monthStart.getMonth()) {
        button.classList.add("is-muted");
      }

      if (iso < todayIso) {
        button.disabled = true;
      }

      if (serverAvailability.some((block) => iso >= block.date && iso <= (block.endDate || block.date))) {
        button.classList.add("is-busy");
        button.setAttribute("aria-description", "Termin teilweise oder vollständig belegt; Anfrage unter Vorbehalt möglich");
      }

      if (selectedStartDate && selectedEndDate && iso >= selectedStartDate && iso <= selectedEndDate) {
        button.classList.add("is-range");
      }

      if (iso === selectedStartDate) {
        button.classList.add("is-selected");
      }

      if (iso === selectedEndDate && selectedEndDate !== selectedStartDate) {
        button.classList.add("is-end");
      }

      button.addEventListener("click", () => selectCalendarDate(iso));
      calendarGrid.append(button);
    }
  };

  const resetCalendarSelection = () => {
    selectedStartDate = "";
    selectedEndDate = "";
    if (bookingDate) bookingDate.value = "";
    if (bookingEndDate) bookingEndDate.value = "";
    updateDateControls();
    renderCalendar();
  };

  const selectCalendarDate = (iso) => {
    if (!selectedStartDate || isMultiDaySelection()) {
      selectedStartDate = iso;
      selectedEndDate = iso;
    } else if (iso > selectedStartDate) {
      const days = dayCountBetween(selectedStartDate, iso);
      if (days > studioBookingConfig.maxMultiDayDays) {
        if (bookingDateSummary) {
          bookingDateSummary.textContent = `Mehr als ${studioBookingConfig.maxMultiDayDays} Tage bitte individuell anfragen.`;
        }
        return;
      }
      selectedEndDate = iso;
    } else {
      selectedStartDate = iso;
      selectedEndDate = iso;
    }

    if (bookingDate) bookingDate.value = selectedStartDate;
    if (bookingEndDate) bookingEndDate.value = selectedEndDate !== selectedStartDate ? selectedEndDate : "";

    updateDateControls();
    renderCalendar();
  };

  const getMinimumHours = () =>
    isWeekend(selectedStartDate) ? studioBookingConfig.weekendMinBookingHours : studioBookingConfig.minBookingHours;

  const getMaximumDurationForStart = () => {
    const startHour = Number((bookingStart?.value || `${studioBookingConfig.openingHour}:00`).split(":")[0]);
    return Math.min(studioBookingConfig.maxDailyBookingHours, studioBookingConfig.closingHour - startHour);
  };

  const createStartOptions = () => {
    const previousValue = bookingStart?.value;
    const minimumHours = getMinimumHours();
    const lastStartHour = studioBookingConfig.closingHour - minimumHours;
    createOptions(
      bookingStart,
      Array.from(
        { length: lastStartHour - studioBookingConfig.openingHour + 1 },
        (_, index) => {
          const hour = studioBookingConfig.openingHour + index;
          return [padTime(hour), padTime(hour)];
        }
      )
    );

    if (bookingStart && previousValue && [...bookingStart.options].some((option) => option.value === previousValue)) {
      bookingStart.value = previousValue;
    }
  };

  const createDurationOptions = () => {
    if (!bookingDuration) return;

    const previousValue = bookingDuration.value;
    const minHours = getMinimumHours();
    const maxHours = getMaximumDurationForStart();
    const durations = [];

    for (let hours = minHours; hours <= maxHours; hours += 1) {
      let label = `${hours} Stunden`;
      if (hours === studioBookingConfig.maxDailyBookingHours) {
        label = `${hours} Stunden - voller Studientag`;
      } else if (hours > studioBookingConfig.maxDirectBookingHours) {
        label = `${hours} Stunden - Unterkunft / Folgeprogramm prüfen`;
      }
      durations.push([hours, label]);
    }

    createOptions(
      bookingDuration,
      durations.map(([value, label]) => [String(value), label])
    );

    if (previousValue && [...bookingDuration.options].some((option) => option.value === previousValue)) {
      bookingDuration.value = previousValue;
    }
  };

  const calculatePrice = (payload = getPayload()) => {
    const days = payload.dayCount || 0;

    if (payload.isMultiDay) {
      const dayPrice =
        days >= 3 ? studioBookingConfig.multiDayDiscountPriceNet : studioBookingConfig.dailyPriceNet;
      return {
        price: dayPrice * days,
        label: `${days} Tage · ${dayPrice} Euro netto pro Tag`
      };
    }

    const minimumPrice = isWeekend(payload.date)
      ? studioBookingConfig.weekendMinPriceNet
      : studioBookingConfig.weekdayMinPriceNet;

    if (payload.duration >= studioBookingConfig.maxDailyBookingHours) {
      return {
        price: studioBookingConfig.dailyPriceNet,
        label: `1 voller Tag · ${studioBookingConfig.dailyPriceNet} Euro netto`
      };
    }

    if (payload.duration === getMinimumHours()) {
      return {
        price: minimumPrice,
        label: `${payload.duration} Stunden Mindestbuchung`
      };
    }

    return {
      price: minimumPrice,
      label: `ab ${minimumPrice} Euro netto · finale Kalkulation nach Ausstattung und Service`
    };
  };

  const updateRundumOption = () => {
    const payload = getPayload();
    const rundum = document.querySelector('[data-addon][value="rundum"]');
    if (!rundum) return;

    const enabled = payload.isMultiDay || payload.duration >= studioBookingConfig.maxDailyBookingHours;
    rundum.disabled = !enabled;

    if (!enabled) {
      rundum.checked = false;
    }

    const label = rundum.closest("label");
    label?.classList.toggle("is-disabled", !enabled);
  };

  const updatePrice = () => {
    if (!bookingPrice) return;
    const payload = getPayload();

    if (!payload.date) {
      bookingPrice.innerHTML = "<strong>Preisindikation</strong>Bitte zuerst einen Buchungstag auswählen.";
      return;
    }

    const price = calculatePrice(payload);
    const extra =
      payload.isMultiDay && payload.dayCount > studioBookingConfig.maxMultiDayDays
        ? " Längere Nutzungen bitte individuell anfragen."
        : "";

    bookingPrice.innerHTML = `<strong>${price.price} Euro netto</strong>${price.label}.${extra}`;
  };

  const updateDateControls = () => {
    const multiDay = isMultiDaySelection();
    const days = selectedStartDate ? dayCountBetween(selectedStartDate, selectedEndDate || selectedStartDate) : 0;

    if (bookingDateSummary) {
      if (!selectedStartDate) {
        bookingDateSummary.textContent = "Ersten Buchungstag im Kalender auswählen.";
      } else if (multiDay) {
        bookingDateSummary.textContent = `${formatDate(fromIsoDate(selectedStartDate))} bis ${formatDate(fromIsoDate(selectedEndDate))} · ${days} Tage · Stundenauswahl deaktiviert.`;
      } else {
        bookingDateSummary.textContent = `${formatDate(fromIsoDate(selectedStartDate))} · Stundenauswahl aktiv. Ein zweiter Klick auf einen späteren Tag macht daraus eine mehrtägige Nutzung.`;
      }
    }

    if (bookingTimeRow) {
      bookingTimeRow.hidden = multiDay;
    }

    if (bookingStart) {
      bookingStart.disabled = multiDay;
      if (!multiDay) {
        createStartOptions();
      }
    }

    if (bookingDuration) {
      bookingDuration.disabled = multiDay;
      createDurationOptions();
    }

    updateRundumOption();
    updatePrice();
    setStatus();
  };

  const getPayload = () => {
    const checkedAddons = [...document.querySelectorAll("[data-addon]:checked")].map((input) => input.value);
    const startDate = selectedStartDate || bookingDate?.value || "";
    const endDate = selectedEndDate || bookingEndDate?.value || startDate;
    const multiDay = startDate && endDate && endDate !== startDate;
    const days = startDate ? dayCountBetween(startDate, endDate) : 0;
    const duration = multiDay ? days * studioBookingConfig.maxDailyBookingHours : Number(bookingDuration?.value || 0);

    return {
      mode: "request",
      type: bookingType?.value || "",
      typeLabel: bookingType?.selectedOptions?.[0]?.textContent || "",
      date: startDate,
      endDate,
      isMultiDay: multiDay,
      dayCount: days,
      start: multiDay ? "" : bookingStart?.value || "",
      duration,
      guests: Number(bookingGuests?.value || 0),
      seating: bookingSeating?.selectedOptions?.[0]?.textContent || "",
      addons: checkedAddons,
      lodging: bookingLodging?.selectedOptions?.[0]?.textContent || "",
      name: bookingName?.value.trim() || "",
      email: bookingEmail?.value.trim() || "",
      phone: bookingPhone?.value.trim() || "",
      company: bookingCompany?.value.trim() || "",
      privacyAccepted: Boolean(bookingConsent?.checked),
      privacyVersion: "2026-07-16",
      notes: document.querySelector("#booking-notes")?.value.trim() || ""
    };
  };

  const escapeHtml = (value) =>
    String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");

  const renderBookingReview = () => {
    if (!bookingReview) return;
    const payload = getPayload();
    const price = calculatePrice(payload);
    const dateLabel = payload.isMultiDay
      ? `${formatDate(fromIsoDate(payload.date))} bis ${formatDate(fromIsoDate(payload.endDate))}`
      : payload.date
        ? `${formatDate(fromIsoDate(payload.date))}, ${payload.start} Uhr · ${payload.duration} Std.`
        : "Noch nicht ausgewählt";
    const addonLabels = [...document.querySelectorAll("[data-addon]:checked")]
      .map((input) => input.closest("label")?.querySelector("strong")?.textContent)
      .filter(Boolean)
      .join(", ");

    bookingReview.innerHTML = `
      <strong>Ihre Anfrage im Überblick</strong>
      <dl>
        <div><dt>Anlass</dt><dd>${escapeHtml(payload.typeLabel)} · ${payload.guests} Personen</dd></div>
        <div><dt>Termin</dt><dd>${escapeHtml(dateLabel)}</dd></div>
        <div><dt>Bestuhlung</dt><dd>${escapeHtml(payload.seating)}</dd></div>
        <div><dt>Optionen</dt><dd>${escapeHtml(addonLabels || "Keine Zusatzoptionen")}</dd></div>
        <div><dt>Preisindikation</dt><dd>${price.price} Euro netto · ${escapeHtml(price.label)}</dd></div>
      </dl>`;
  };

  const setStatus = () => {
    if (!bookingStatus) return;

    const payload = getPayload();
    const isBlocked = overlapsBlockedSlot(payload);
    const needsLodging = payload.duration > studioBookingConfig.maxDirectBookingHours;
    const fullCare = payload.isMultiDay || payload.duration >= studioBookingConfig.maxDailyBookingHours;

    if (bookingLodgingRow) {
      bookingLodgingRow.hidden = !needsLodging;
    }
    bookingStatus.classList.toggle("is-caution", isBlocked || needsLodging || fullCare);
    bookingStatus.classList.toggle("is-ready", !isBlocked && !needsLodging && !fullCare);

    if (!payload.date) {
      bookingStatus.innerHTML =
        "<strong>Kalenderauswahl</strong>Wählen Sie einen Tag. Ein zweiter Klick auf einen späteren Tag legt den Endtag für eine mehrtägige Nutzung fest.";
      return;
    }

    if (isBlocked) {
      bookingStatus.innerHTML = "<strong>Termin bereits angefragt oder belegt</strong>Sie können den Termin weiterhin anfragen. Wir prüfen den genauen Zeitraum und schlagen bei Bedarf eine passende Alternative vor.";
      return;
    }

    if (payload.isMultiDay) {
      bookingStatus.innerHTML =
        `<strong>Mehrtägige Nutzung</strong>${payload.dayCount} Tage sind vorbereitet. Pro Tag werden 12 Stunden angesetzt; genaue Übergabe, Übernachtung und Folgeprogramm werden persönlich abgestimmt.`;
      return;
    }

    if (fullCare) {
      bookingStatus.innerHTML =
        "<strong>Rundumbetreuung möglich</strong>Ab 12 Stunden kann das Special „Wir kümmern uns um alles“ gewählt werden: Hochzeitsempfang, Anschlusslokalität und passende Übernachtung.";
      return;
    }

    if (needsLodging) {
      bookingStatus.innerHTML =
        "<strong>Längere Nutzung erkannt</strong>Für mehr als 6 Stunden wird zusätzlich Unterkunft oder Folgeprogramm vorbereitet. Direkte Bestätigung erfolgt nach persönlicher Prüfung.";
      return;
    }

    bookingStatus.innerHTML =
      "<strong>Gut planbar</strong>Der gewählte Rahmen liegt innerhalb unserer Standardnutzung. Die Verfügbarkeit wird nach dem Absenden persönlich bestätigt.";
  };

  const applyTypeDefaults = () => {
    const selected = studioBookingConfig.eventTypes.find((type) => type.value === bookingType?.value);
    if (!selected) return;

    if (bookingDuration) {
      bookingDuration.value = String(selected.defaultDuration);
    }

    document.querySelectorAll("[data-addon]").forEach((input) => {
      input.checked = selected.addons.includes(input.value);
    });

    setStatus();
  };

  const updateBookingStep = () => {
    const labels = [
      "Schritt 1 von 4 · Anlass",
      "Schritt 2 von 4 · Termin",
      "Schritt 3 von 4 · Optionen",
      "Schritt 4 von 4 · Kontakt & Datenschutz"
    ];

    bookingSteps.forEach((step, index) => {
      step.classList.toggle("is-active", index === currentBookingStep);
    });

    bookingStepDots.forEach((dot, index) => {
      dot.classList.toggle("is-active", index <= currentBookingStep);
    });

    if (bookingStepLabel) {
      bookingStepLabel.textContent = labels[currentBookingStep] || labels[0];
    }

    if (bookingBackButton) {
      bookingBackButton.disabled = currentBookingStep === 0;
    }

    if (bookingNextButton) {
      bookingNextButton.hidden = currentBookingStep === bookingSteps.length - 1;
    }

    if (bookingSubmit) {
      bookingSubmit.hidden = currentBookingStep !== bookingSteps.length - 1;
    }

    if (currentBookingStep === bookingSteps.length - 1) {
      renderBookingReview();
    }

    setStatus();
  };

  const validateCurrentStep = () => {
    const currentStep = bookingSteps[currentBookingStep];
    if (!currentStep) return true;

    if (currentStep.querySelector("[data-calendar-picker]") && !selectedStartDate) {
      if (bookingStatus) {
        bookingStatus.innerHTML = "<strong>Datum fehlt</strong>Bitte wählen Sie zuerst einen Buchungstag im Kalender aus.";
        bookingStatus.classList.add("is-caution");
      }
      return false;
    }

    const fields = [...currentStep.querySelectorAll("input, select, textarea")].filter(
      (field) => !field.disabled && !field.closest("[hidden]")
    );
    const invalidField = fields.find((field) => !field.checkValidity());

    if (invalidField) {
      if (bookingSubmitStatus) {
        bookingSubmitStatus.hidden = false;
        bookingSubmitStatus.classList.add("is-caution");
        bookingSubmitStatus.innerHTML = "<strong>Angabe fehlt oder ist ungültig</strong>Bitte prüfen Sie das markierte Feld und versuchen Sie es erneut.";
      }
      invalidField.reportValidity();
      invalidField.focus();
      return false;
    }

    if (bookingSubmitStatus) {
      bookingSubmitStatus.hidden = true;
      bookingSubmitStatus.textContent = "";
    }
    return true;
  };

  const openBookingDialog = () => {
    if (!bookingDialog) return;

    currentBookingStep = 0;
    updateBookingStep();

    if (typeof bookingDialog.showModal === "function") {
      bookingDialog.showModal();
    } else {
      bookingDialog.setAttribute("open", "");
    }
  };

  const closeBookingDialog = () => {
    if (!bookingDialog) return;

    if (typeof bookingDialog.close === "function") {
      bookingDialog.close();
    } else {
      bookingDialog.removeAttribute("open");
    }
  };

  const initBookingSystem = () => {
    if (!bookingForm) return;

    createOptions(
      bookingType,
      studioBookingConfig.eventTypes.map((type) => [type.value, type.label])
    );
    createOptions(bookingSeating, studioBookingConfig.seatingOptions);
    createOptions(bookingLodging, studioBookingConfig.lodgingOptions);
    createStartOptions();
    createDurationOptions();

    if (bookingDate) {
      bookingDate.min = toIsoDate(new Date());
    }

    if (bookingAddons) {
      bookingAddons.replaceChildren();
      studioBookingConfig.addons.forEach(([value, label, description]) => {
        const checkboxLabel = document.createElement("label");
        checkboxLabel.innerHTML = `<input type="checkbox" value="${value}" data-addon><span><strong>${label}</strong><br>${description}</span>`;
        bookingAddons.append(checkboxLabel);
      });
    }

    renderCalendar();
    loadAvailability();

    calendarPrev?.addEventListener("click", () => {
      visibleCalendarMonth = new Date(visibleCalendarMonth.getFullYear(), visibleCalendarMonth.getMonth() - 1, 1);
      renderCalendar();
    });

    calendarNext?.addEventListener("click", () => {
      visibleCalendarMonth = new Date(visibleCalendarMonth.getFullYear(), visibleCalendarMonth.getMonth() + 1, 1);
      renderCalendar();
    });

    bookingResetDate?.addEventListener("click", resetCalendarSelection);

    bookingStart?.addEventListener("change", () => {
      createDurationOptions();
      updateRundumOption();
      updatePrice();
      setStatus();
    });

    bookingDuration?.addEventListener("change", () => {
      updateRundumOption();
      updatePrice();
      setStatus();
    });

    [bookingType, bookingDate, bookingGuests, bookingSeating, bookingLodging].forEach((field) => {
      field?.addEventListener("change", field === bookingType ? applyTypeDefaults : setStatus);
    });
    bookingAddons?.addEventListener("change", () => {
      updateRundumOption();
      updatePrice();
      setStatus();
    });
    bookingOpenButton?.addEventListener("click", openBookingDialog);
    bookingCloseButton?.addEventListener("click", closeBookingDialog);
    bookingBackButton?.addEventListener("click", () => {
      currentBookingStep = Math.max(0, currentBookingStep - 1);
      updateBookingStep();
    });
    bookingNextButton?.addEventListener("click", () => {
      if (!validateCurrentStep()) return;
      currentBookingStep = Math.min(bookingSteps.length - 1, currentBookingStep + 1);
      updateBookingStep();
    });

    bookingDialog?.addEventListener("click", (event) => {
      const dialogRect = bookingDialog.getBoundingClientRect();

      const clickedOutside =
        event.clientX < dialogRect.left ||
        event.clientX > dialogRect.right ||
        event.clientY < dialogRect.top ||
        event.clientY > dialogRect.bottom;

      if (clickedOutside) {
        closeBookingDialog();
      }
    });

    applyTypeDefaults();
    updateBookingStep();
    updateRundumOption();
    updatePrice();

    bookingForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      if (!validateCurrentStep()) return;
      const payload = getPayload();
      const price = calculatePrice(payload);
      payload.priceNet = price.price;
      payload.priceLabel = price.label;

      if (studioBookingConfig.backendEndpoint) {
        if (bookingSubmitStatus) {
          bookingSubmitStatus.hidden = false;
          bookingSubmitStatus.classList.remove("is-caution");
          bookingSubmitStatus.innerHTML = "<strong>Anfrage wird übertragen</strong>Bitte einen Moment warten …";
        }
        bookingSubmit.disabled = true;
        bookingSubmit.textContent = "Wird gesendet …";
        try {
          const response = await fetch(studioBookingConfig.backendEndpoint, {
            method: "POST",
            headers: { "Content-Type": "application/json", "Accept": "application/json" },
            body: JSON.stringify(payload)
          });
          const result = await response.json();
          if (!response.ok || !result.success) throw new Error(result.message || "Anfrage konnte nicht gespeichert werden.");

          bookingForm.innerHTML = `
            <div class="booking-success" role="status">
              <p class="eyebrow">Anfrage eingegangen</p>
              <h3>Vielen Dank, ${escapeHtml(payload.name)}.</h3>
              <p>Ihre Terminanfrage wurde sicher gespeichert. Katja meldet sich nach der persönlichen Prüfung bei Ihnen.</p>
              <p class="booking-reference"><span>Referenznummer</span><strong>${escapeHtml(result.reference)}</strong></p>
              <button class="button button-dark" type="button" data-success-close>Fenster schließen</button>
            </div>`;
          bookingForm.querySelector("[data-success-close]")?.addEventListener("click", closeBookingDialog);
        } catch (error) {
          const visibleStatus = bookingSubmitStatus || bookingStatus;
          visibleStatus.hidden = false;
          visibleStatus.innerHTML = `<strong>Übertragung nicht möglich</strong>${escapeHtml(error.message)} Bitte versuchen Sie es erneut oder schreiben Sie an <a href="mailto:${studioBookingConfig.ownerEmail}">${studioBookingConfig.ownerEmail}</a>.`;
          visibleStatus.classList.add("is-caution");
          bookingSubmit.disabled = false;
          bookingSubmit.textContent = "Terminanfrage senden";
        }
        return;
      }

      if (studioBookingConfig.ownerEmail) {
        const subject = encodeURIComponent(`Studio Johanna Anfrage: ${payload.typeLabel}`);
        const body = encodeURIComponent(
        [
          `Veranstaltungsart: ${payload.typeLabel}`,
          `Datum: ${payload.date}`,
          `Enddatum: ${payload.isMultiDay ? payload.endDate : "-"}`,
          `Buchungstage: ${payload.dayCount || 1}`,
          `Beginn: ${payload.start || "Mehrtägige Nutzung"}`,
          `Dauer: ${payload.duration} Stunden`,
          `Preisindikation: ${payload.priceNet} Euro netto (${payload.priceLabel})`,
          `Personen: ${payload.guests}`,
          `Name: ${payload.name}`,
          `E-Mail: ${payload.email}`,
          `Telefon: ${payload.phone || "-"}`,
          `Bestuhlung: ${payload.seating}`,
          `Optionen: ${payload.addons.join(", ") || "Keine"}`,
          `Unterkunft: ${payload.lodging || "Nicht benötigt"}`,
            `Hinweise: ${payload.notes || "-"}`
          ].join("\n")
        );
        window.location.href = `mailto:${studioBookingConfig.ownerEmail}?subject=${subject}&body=${body}`;
        return;
      }

      bookingStatus.innerHTML =
        '<strong>Anfrage vorbereitet</strong>Für den Live-Betrieb bitte `backendEndpoint` oder `ownerEmail` in `js/main.js` setzen. Bis dahin bleibt die Anfrage lokal; Katja Klante ist telefonisch unter <a href="tel:+491749450240">+49 174 9450240</a> erreichbar.';
      bookingStatus.classList.add("is-caution");
    });
  };

  initBookingSystem();

  tourOpenButtons.forEach((button) => {
    button.addEventListener("click", () => {
      if (!tourDialog) return;

      if (typeof tourDialog.showModal === "function") {
        tourDialog.showModal();
      } else {
        tourDialog.setAttribute("open", "");
      }
    });
  });

  if (tourCloseButton && tourDialog) {
    tourCloseButton.addEventListener("click", () => {
      tourDialog.close();
    });

    tourDialog.addEventListener("click", (event) => {
      const dialogRect = tourDialog.getBoundingClientRect();

      const clickedOutside =
        event.clientX < dialogRect.left ||
        event.clientX > dialogRect.right ||
        event.clientY < dialogRect.top ||
        event.clientY > dialogRect.bottom;

      if (clickedOutside) {
        tourDialog.close();
      }
    });
  }

  /*
    Ausbaupunkte für Codex:
    1. Echte 360°-Tour initialisieren.
    2. Hotspot-Daten als Array auslagern.
    3. Video-Intro vor Tourstart einbauen.
    4. Galerie-Lightbox ergänzen.
    5. STUDIO_BOOKING_CONFIG mit DSGVO-konformem Backend und Kalender-Sync verbinden.
    6. Anfrageformular mit E-Mail-, iCal- und Status-Workflow verbinden.
    7. Katja-Klante-Profil optional um Portraitbild erweitern.
  */
})();
