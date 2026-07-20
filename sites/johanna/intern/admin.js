(() => {
  const api = "../api/bookings.php";
  const cards = document.querySelector("[data-cards]");
  const template = document.querySelector("[data-card-template]");
  const message = document.querySelector("[data-message]");
  const search = document.querySelector("[data-search]");
  const statusFilter = document.querySelector("[data-status-filter]");
  const count = document.querySelector("[data-count]");
  const refresh = document.querySelector("[data-refresh]");
  let items = [];

  const statusLabels = {
    neu: "Neu", in_pruefung: "In Prüfung", option: "Option",
    bestaetigt: "Bestätigt", abgelehnt: "Abgelehnt", storniert: "Storniert"
  };

  const formatDate = (value) => value
    ? new Intl.DateTimeFormat("de-DE", { dateStyle: "medium" }).format(new Date(`${value}T12:00:00`))
    : "–";
  const formatCreated = (value) => value
    ? new Intl.DateTimeFormat("de-DE", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value))
    : "–";

  const contactMarkup = (item) => {
    const email = document.createElement("a");
    email.href = `mailto:${item.email}`;
    email.textContent = item.email;
    const wrapper = document.createElement("span");
    wrapper.append(email);
    if (item.phone) {
      const phone = document.createElement("a");
      phone.href = `tel:${item.phone}`;
      phone.textContent = item.phone;
      wrapper.append(document.createElement("br"), phone);
    }
    return wrapper;
  };

  const render = () => {
    const term = search.value.trim().toLocaleLowerCase("de");
    const wantedStatus = statusFilter.value;
    const filtered = items.filter((item) => {
      const haystack = [item.reference, item.name, item.typeLabel, item.email, item.date].join(" ").toLocaleLowerCase("de");
      return (!term || haystack.includes(term)) && (!wantedStatus || item.status === wantedStatus);
    });

    cards.replaceChildren();
    count.textContent = `${filtered.length} ${filtered.length === 1 ? "Terminkarte" : "Terminkarten"}`;
    message.textContent = filtered.length ? "" : "Keine passenden Terminanfragen vorhanden.";

    filtered.forEach((item) => {
      const card = template.content.firstElementChild.cloneNode(true);
      card.dataset.id = item.id;
      card.querySelector("[data-reference]").textContent = item.reference;
      card.querySelector("[data-title]").textContent = `${item.name} · ${item.typeLabel}`;
      card.querySelector("[data-created]").textContent = `Eingegangen ${formatCreated(item.createdAt)}`;
      const badge = card.querySelector("[data-status-badge]");
      badge.textContent = statusLabels[item.status] || item.status;
      badge.dataset.value = item.status;
      card.querySelector("[data-date]").textContent = item.endDate && item.endDate !== item.date
        ? `${formatDate(item.date)} – ${formatDate(item.endDate)}` : formatDate(item.date);
      card.querySelector("[data-scope]").textContent = item.isMultiDay
        ? `${item.dayCount} Tage` : `${item.start || "–"} Uhr · ${item.duration} Std.`;
      card.querySelector("[data-guests]").textContent = `${item.guests} Personen`;
      card.querySelector("[data-price]").textContent = `${item.priceNet} € netto`;
      card.querySelector("[data-contact]").replaceChildren(contactMarkup(item));
      card.querySelector("[data-seating]").textContent = item.seating || "–";
      card.querySelector("[data-addons]").textContent = item.addons?.join(", ") || "Keine";
      card.querySelector("[data-lodging]").textContent = item.lodging || "Nicht angefragt";
      card.querySelector("[data-notes]").textContent = item.notes || "Keine Hinweise";
      const status = card.querySelector("[data-status]");
      const note = card.querySelector("[data-note]");
      status.value = item.status;
      note.value = item.internalNote || "";
      card.querySelector("[data-save]").addEventListener("click", () => saveCard(item.id, status.value, note.value));
      cards.append(card);
    });
  };

  const load = async () => {
    message.textContent = "Terminkarten werden geladen …";
    try {
      const response = await fetch(`${api}?action=list`, { headers: { Accept: "application/json" }, cache: "no-store" });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.message || "Verwaltung konnte nicht geladen werden.");
      items = result.items;
      render();
    } catch (error) {
      message.textContent = `${error.message} Bitte Zugangsdaten und Serverkonfiguration prüfen.`;
    }
  };

  const saveCard = async (id, status, internalNote) => {
    message.textContent = "Terminkarte wird gespeichert …";
    try {
      const response = await fetch(api, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ id, status, internalNote })
      });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.message || "Speichern fehlgeschlagen.");
      items = items.map((item) => item.id === id ? result.item : item);
      message.textContent = `${result.item.reference} wurde gespeichert.`;
      render();
    } catch (error) {
      message.textContent = error.message;
    }
  };

  search.addEventListener("input", render);
  statusFilter.addEventListener("change", render);
  refresh.addEventListener("click", load);
  load();
})();
