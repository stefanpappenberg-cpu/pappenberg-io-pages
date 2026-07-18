const grid = document.querySelector("#project-grid");
const count = document.querySelector("#project-count");
const toast = document.querySelector("#toast");
const projectDialog = document.querySelector("#project-dialog");
const projectForm = document.querySelector("#project-form");
const publishDialog = document.querySelector("#publish-dialog");
const publishForm = document.querySelector("#publish-form");
const publishSummary = document.querySelector("#publish-summary");
const publishRoute = document.querySelector("#publish-route");
const publishConfirm = document.querySelector("#publish-confirm");
const publishSubmit = document.querySelector("#publish-submit");
const filter = document.querySelector("#project-filter");

let projects = [];
let pendingPublishProject = null;
const openProjects = new Set();

const escapeHtml = (value = "") => String(value)
  .replaceAll("&", "&amp;")
  .replaceAll("<", "&lt;")
  .replaceAll(">", "&gt;")
  .replaceAll('"', "&quot;");

const notify = (message, duration = 3800) => {
  toast.textContent = message;
  toast.classList.add("visible");
  window.clearTimeout(notify.timer);
  notify.timer = window.setTimeout(() => toast.classList.remove("visible"), duration);
};

const request = async (url, options = {}) => {
  const response = await fetch(url, {
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
    ...options,
  });
  const result = await response.json();
  if (!response.ok) throw new Error(result.error || "Aktion fehlgeschlagen.");
  return result;
};

const projectAction = async (projectId, name, body = {}) => {
  const result = await request(`/api/projects/${encodeURIComponent(projectId)}/${name}`, {
    method: "POST",
    body: JSON.stringify(body),
  });
  projects = projects.map((project) => project.id === projectId ? result.project : project);
  render();
  return result;
};

const checklistItem = (done, title, detail) => `
  <li class="${done ? "done" : ""}">
    <span class="check-icon">${done ? "✓" : "!"}</span>
    <span><strong>${escapeHtml(title)}</strong><small>${escapeHtml(detail)}</small></span>
  </li>`;

const render = () => {
  const filtered = projects.filter((project) => {
    if (filter.value === "ready") return project.setup.ready_to_publish;
    if (filter.value === "attention") return !project.setup.ready_to_publish;
    return true;
  });

  count.textContent = `${filtered.length} von ${projects.length} Projekten`;
  grid.replaceChildren();

  if (!filtered.length) {
    grid.innerHTML = `<div class="loading-card">Für diesen Filter wurden keine Projekte gefunden.</div>`;
    return;
  }

  filtered.forEach((project, index) => {
    const card = document.createElement("article");
    card.className = `project-card ${openProjects.has(project.id) ? "is-open" : ""}`;
    card.style.setProperty("--project-color", project.color || "#8f2d91");

    const target = project.publish?.target_path || "Noch kein Veröffentlichungsziel";
    const repo = project.publish?.repository_path || "Repository noch nicht zugeordnet";
    const publicUrl = project.publish?.production_url || "";
    const statusClass = project.setup.ready_to_publish ? "ready" : "";
    const statusText = project.setup.ready_to_publish
      ? (project.sync.in_sync ? "Live-Stand aktuell" : "Bereit zum Veröffentlichen")
      : `${project.setup.open_steps} Schritte offen`;

    card.innerHTML = `
      <div class="project-summary">
        <span class="project-number">${String(index + 1).padStart(2, "0")}</span>
        <div class="project-title">
          <h3>${escapeHtml(project.name)}</h3>
          <p title="${escapeHtml(project.path)}">${escapeHtml(project.path)}</p>
        </div>
        <div class="route" aria-label="Synchronisationszuordnung">
          <div class="route-node">
            <span>Lokale Quelle</span>
            <strong title="${escapeHtml(project.preview_path)}">${escapeHtml(project.preview_path)}</strong>
          </div>
          <span class="route-arrow">→</span>
          <div class="route-node">
            <span>${project.publish?.target_type === "external" ? "Externe Domain" : "pappenberg.io · Ziel"}</span>
            <strong title="${escapeHtml(target)}">${escapeHtml(target)}</strong>
          </div>
        </div>
        <div class="project-status">
          <span class="status-pill ${statusClass}">${escapeHtml(statusText)}</span>
          <button class="expand-button" type="button" data-toggle="${project.id}" aria-label="Projektdetails öffnen">${openProjects.has(project.id) ? "−" : "+"}</button>
        </div>
      </div>
      <div class="project-details">
        <ul class="checklist" aria-label="Einrichtungsstatus">
          ${checklistItem(project.setup.source_exists, "Lokaler Ordner", project.setup.source_exists ? "Quelle wurde gefunden." : "Projektordner fehlt.")}
          ${checklistItem(project.setup.preview_ready, "Lokale Vorschau", project.setup.preview_ready ? "index.html ist vorhanden." : "Vorschau-Ordner oder index.html fehlt.")}
          ${checklistItem(project.setup.repository_ready, "Git-Ziel", project.setup.repository_ready ? `Repository erkannt: ${repo}` : "Lokaler Git-Klon muss zugeordnet werden.")}
          ${checklistItem(project.setup.mapping_ready, "Ordner-Zuordnung", project.setup.mapping_ready ? `${project.preview_path} → ${target}` : "Ziel-Unterordner oder URL fehlt.")}
          ${checklistItem(project.sync.in_sync, "Synchronisationsstand", project.sync.in_sync ? "Quelle und Ziel stimmen überein." : project.sync.target_exists ? "Lokale Änderungen warten auf Übertragung." : "Zielordner wird beim ersten Veröffentlichen angelegt.")}
        </ul>

        <div class="project-actions">
          <div class="action-group">
            <div class="action-group-head"><strong>2 · Lokal bearbeiten</strong><span>${project.running ? "Vorschau läuft" : "Noch nicht gestartet"}</span></div>
            <div class="action-buttons">
              <button class="button small" data-action="codex" data-project="${project.id}">In Codex öffnen</button>
              <button class="button small ghost" data-action="${project.running ? "open" : "start"}" data-project="${project.id}">${project.running ? "Vorschau öffnen" : "Vorschau starten"}</button>
              ${project.running ? `<button class="button small ghost" data-action="stop" data-project="${project.id}">Stoppen</button>` : ""}
            </div>
          </div>
          <div class="action-group">
            <div class="action-group-head"><strong>3 · Ziel & URL</strong><span>${escapeHtml(project.publish?.target_type === "external" ? "Externe Domain" : "pappenberg.io")}</span></div>
            <div class="action-buttons">
              ${publicUrl ? `<a class="public-link" href="${escapeHtml(publicUrl)}" target="_blank" rel="noopener">↗ ${escapeHtml(publicUrl)}</a>` : `<span class="status-pill">URL fehlt</span>`}
            </div>
          </div>
          <div class="action-group">
            <div class="action-group-head"><strong>4 · Veröffentlichen</strong><span>${escapeHtml(project.git.branch)} · ${project.git.clean ? "Git sauber" : `${project.git.changes} Änderungen`}</span></div>
            <div class="action-buttons">
              <button class="button small primary" data-publish="${project.id}" ${project.setup.ready_to_publish ? "" : "disabled"}>${project.sync.in_sync ? "Erneut prüfen" : "Synchronisieren & Git vorbereiten"}</button>
              ${project.git.ahead > 0 ? `<button class="button small ghost" data-action="desktop" data-project="${project.id}">GitHub Desktop öffnen</button>` : ""}
            </div>
          </div>
        </div>
      </div>`;
    grid.append(card);
  });
};

const load = async () => {
  try {
    const result = await request("/api/projects", { cache: "no-store" });
    projects = result.projects;
    render();
  } catch (error) {
    grid.innerHTML = `<div class="loading-card">${escapeHtml(error.message)}</div>`;
  }
};

grid.addEventListener("click", async (event) => {
  const toggle = event.target.closest("[data-toggle]");
  if (toggle) {
    const id = toggle.dataset.toggle;
    openProjects.has(id) ? openProjects.delete(id) : openProjects.add(id);
    render();
    return;
  }

  const publishButton = event.target.closest("[data-publish]");
  if (publishButton) {
    const project = projects.find((item) => item.id === publishButton.dataset.publish);
    pendingPublishProject = project;
    publishSummary.textContent = `Showroom kopiert den deploybaren Inhalt, aktualisiert den Zielordner und erstellt anschließend einen Git-Commit. Ein Push erfolgt weiterhin bewusst über GitHub Desktop.`;
    publishRoute.innerHTML = `
      <strong>QUELLE</strong><br>${escapeHtml(project.preview_path)}<br><br>
      <strong>ZIEL</strong><br>${escapeHtml(project.publish.target_path)}<br><br>
      <strong>ÖFFENTLICH</strong><br>${escapeHtml(project.publish.production_url)}`;
    publishConfirm.checked = false;
    publishSubmit.disabled = true;
    publishDialog.showModal();
    return;
  }

  const button = event.target.closest("[data-action]");
  if (!button) return;
  const { action: actionName, project } = button.dataset;
  button.disabled = true;
  try {
    await projectAction(project, actionName);
    notify(actionName === "codex" ? "Projekt wird in Codex geöffnet." : "Aktion ausgeführt.");
  } catch (error) {
    notify(error.message, 5500);
  } finally {
    button.disabled = false;
  }
});

document.querySelector("#import-project").addEventListener("click", () => projectDialog.showModal());
document.querySelectorAll("[data-dialog-close]").forEach((button) => button.addEventListener("click", () => projectDialog.close()));
document.querySelectorAll("[data-publish-close]").forEach((button) => button.addEventListener("click", () => publishDialog.close()));
document.querySelector("#refresh").addEventListener("click", load);
filter.addEventListener("change", render);

document.querySelectorAll('input[name="target_type"]').forEach((radio) => radio.addEventListener("change", () => {
  const external = projectForm.elements.target_type.value === "external";
  document.querySelector("[data-subdir-field]").querySelector("span").textContent = external ? "Ordner im Domain-Repository" : "Unterordner im Repository";
  document.querySelector("[data-subdir-field] small").textContent = external ? "Meist „.“ für die Domainwurzel" : "Ergibt pappenberg.io/unterordner/";
}));

projectForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const data = Object.fromEntries(new FormData(projectForm).entries());
  const submit = projectForm.querySelector('[type="submit"]');
  submit.disabled = true;
  try {
    const result = await request("/api/projects/import", {
      method: "POST",
      body: JSON.stringify(data),
    });
    projects.push(result.project);
    openProjects.add(result.project.id);
    render();
    projectDialog.close();
    projectForm.reset();
    notify("Projekt wurde geprüft und dauerhaft zugeordnet.");
  } catch (error) {
    notify(error.message, 6000);
  } finally {
    submit.disabled = false;
  }
});

publishConfirm.addEventListener("change", () => {
  publishSubmit.disabled = !publishConfirm.checked;
});

publishForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (!pendingPublishProject || !publishConfirm.checked) return;
  publishSubmit.disabled = true;
  publishSubmit.textContent = "Wird vorbereitet …";
  try {
    const result = await projectAction(pendingPublishProject.id, "prepare-publish", { confirmed: true });
    publishDialog.close();
    notify(result.message, 6500);
  } catch (error) {
    notify(error.message, 7000);
  } finally {
    publishSubmit.textContent = "Synchronisieren & Git vorbereiten";
    publishSubmit.disabled = !publishConfirm.checked;
    pendingPublishProject = null;
  }
});

window.setInterval(() => {
  document.querySelector("#clock").textContent = new Intl.DateTimeFormat("de-DE", {
    weekday: "short", hour: "2-digit", minute: "2-digit"
  }).format(new Date());
}, 1000);

load();
