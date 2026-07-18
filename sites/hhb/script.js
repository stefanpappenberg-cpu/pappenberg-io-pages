// Data
const LEISTUNGEN = [
  { titel: "Hochbau", text: "Wohn- und Geschäftshäuser in Massivbauweise – vom Einfamilienhaus bis zum mehrgeschossigen Quartier.", img: "assets/hochbau.jpg", icon: "🏢" },
  { titel: "Tiefbau", text: "Erdarbeiten, Kanal- und Rohrleitungsbau, Straßen- und Wegebau sowie komplette Erschließungen.", img: "assets/tiefbau.jpg", icon: "🔧" },
  { titel: "Rohbau", text: "Beton- und Stahlbetonarbeiten, Maurerarbeiten und tragende Konstruktionen mit höchster Präzision.", img: "assets/verlegearbeit.jpg", icon: "🧱" },
  { titel: "Sanierung", text: "Denkmalgerechte Instandsetzung und energetische Modernisierung im Bestand.", img: "assets/dach.jpg", icon: "🛡" },
  { titel: "Schlüsselfertig", text: "Von der Planung bis zur Übergabe – ein Ansprechpartner, ein Festpreis, ein Termin.", img: "assets/services-1.jpg", icon: "📐" },
  { titel: "Bauleitung", text: "Erfahrene Bauleiter und Poliere koordinieren Ihre Baustelle termintreu und kostensicher.", img: "assets/team-02.jpg", icon: "👷" },
];

const BAUSTELLEN = [
  { titel: "Wohnquartier am Waldrand", ort: "Gotha", status: "Rohbau", fortschritt: 45, img: "assets/hochbau.jpg", beschreibung: "Neubau von 24 Wohneinheiten in vier Stadtvillen mit Tiefgarage. Massivbauweise, hoher energetischer Standard, Fertigstellung geplant Q3 2027." },
  { titel: "Erschließung Gewerbegebiet Nord", ort: "Erfurt", status: "Tiefbau", fortschritt: 70, img: "assets/tiefbau.jpg", beschreibung: "Komplette Erschließung eines 4,5 ha großen Gewerbegebietes mit Kanal-, Wasser- und Straßenbau." },
  { titel: "Sanierung Verwaltungsgebäude", ort: "Bad Tabarz", status: "Innenausbau", fortschritt: 85, img: "assets/dach.jpg", beschreibung: "Energetische Komplettsanierung eines historischen Verwaltungsgebäudes inkl. Fassade, Dach und Haustechnik." },
];

const JOBS = [
  { titel: "Polier (m/w/d) Hochbau", ort: "Bad Tabarz", beschaeftigung: "Vollzeit", kategorie: "Führung", kurz: "Führungsverantwortung für unsere Hochbau-Baustellen in Thüringen.", aufgaben: "• Leitung und Koordination der Baustelle\n• Führung des Baustellenteams\n• Qualitäts- und Terminüberwachung\n• Abstimmung mit Bauleitung und Subunternehmern", anforderungen: "• Ausbildung als Polier oder Werkpolier Hochbau\n• Mehrjährige Berufserfahrung\n• Führerschein Klasse B" },
  { titel: "Bauingenieur / Bauleiter (m/w/d)", ort: "Bad Tabarz", beschaeftigung: "Vollzeit", kategorie: "Ingenieur", kurz: "Verantwortungsvolle Bauleitung anspruchsvoller Hoch- und Tiefbauprojekte.", aufgaben: "• Eigenständige Bauleitung\n• Termin-, Kosten- und Qualitätskontrolle\n• Nachtrags- und Abrechnungsmanagement", anforderungen: "• Studium Bauingenieurwesen oder vergleichbar\n• Erste Berufserfahrung wünschenswert\n• Sicherer Umgang mit MS Office / branchenüblicher Software" },
  { titel: "Straßenbauer / Tiefbauer (m/w/d)", ort: "Thüringen", beschaeftigung: "Vollzeit", kategorie: "Fachkraft", kurz: "Verstärkung unserer Tiefbaukolonnen.", aufgaben: "• Straßen- und Wegebau\n• Kanal- und Rohrleitungsarbeiten\n• Pflasterarbeiten", anforderungen: "• Abgeschlossene Ausbildung im Tief- oder Straßenbau\n• Teamfähigkeit und Zuverlässigkeit" },
  { titel: "Auszubildende (m/w/d) Bauberufe", ort: "Bad Tabarz", beschaeftigung: "Ausbildung", kategorie: "Ausbildung", kurz: "Starte deine Karriere im Bauhandwerk mit einer Ausbildung bei uns.", aufgaben: "• Einblick in alle Bereiche des Baus\n• Praxisorientierte Ausbildung", anforderungen: "• Guter Schulabschluss\n• Interesse an handwerklicher Arbeit\n• Zuverlässigkeit" },
];

// Render Leistungen
const lg = document.getElementById('leistungenGrid');
if (lg) lg.innerHTML = LEISTUNGEN.map(l => `
  <article class="group h-full p-8 md:p-10 bg-white hover:bg-secondary/70 transition-colors reveal">
    <div class="text-2xl mb-6">${l.icon}</div>
    <h3 class="text-xl font-display text-navy mb-3">${l.titel}</h3>
    <p class="text-sm text-muted leading-relaxed font-light">${l.text}</p>
  </article>`).join('');

// Render Baustellen
const bg = document.getElementById('baustellenGrid');
if (bg) bg.innerHTML = BAUSTELLEN.map((b, i) => `
  <button data-baustelle="${i}" class="group text-left w-full bg-white rounded-2xl border border-border overflow-hidden hover:border-navy/30 hover:shadow-[0_20px_50px_-30px_rgba(0,0,0,0.25)] transition-all reveal">
    <div class="aspect-[16/10] bg-navy/5 overflow-hidden relative">
      <img src="${b.img}" alt="${b.titel}" class="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
      <span class="absolute top-4 left-4 rounded-full bg-white/95 backdrop-blur text-navy text-[10px] font-medium uppercase tracking-widest px-3 py-1.5">${b.status}</span>
    </div>
    <div class="p-6">
      <div class="text-xs text-muted uppercase tracking-widest mb-3">📍 ${b.ort}</div>
      <h3 class="text-lg font-display text-navy mb-2">${b.titel}</h3>
      <p class="text-sm text-muted line-clamp-2 mb-5 font-light">${b.beschreibung}</p>
      <div>
        <div class="flex justify-between text-xs text-muted mb-1.5"><span>Fortschritt</span><span class="text-navy font-medium">${b.fortschritt}%</span></div>
        <div class="h-px bg-border overflow-hidden"><div class="h-full bg-navy" style="width:${b.fortschritt}%"></div></div>
      </div>
    </div>
  </button>`).join('');

// Render Jobs
const jl = document.getElementById('jobsList');
if (jl) jl.innerHTML = JOBS.map((j, i) => `
  <button data-job="${i}" class="group w-full text-left flex items-center justify-between gap-4 p-5 md:p-6 border border-white/10 rounded-xl hover:border-yellow/60 hover:bg-white/5 transition-all">
    <div>
      <h4 class="font-display text-lg text-white">${j.titel}</h4>
      <p class="text-xs text-white/60 uppercase tracking-widest mt-1.5">${j.beschaeftigung}${j.ort ? ' · ' + j.ort : ''}</p>
    </div>
    <span class="text-yellow text-xl transition-transform group-hover:translate-x-1">→</span>
  </button>`).join('');

// Modal
const modal = document.getElementById('modal');
const modalBody = document.getElementById('modalBody');
function openModal(html){ modalBody.innerHTML = html; modal.classList.remove('hidden'); modal.classList.add('flex'); document.body.style.overflow = 'hidden'; }
function closeModal(){ modal.classList.add('hidden'); modal.classList.remove('flex'); document.body.style.overflow=''; }
document.getElementById('modalClose')?.addEventListener('click', closeModal);
modal?.addEventListener('click', e => { if (e.target === modal) closeModal(); });

document.addEventListener('click', e => {
  const b = e.target.closest('[data-baustelle]');
  if (b) {
    const x = BAUSTELLEN[+b.dataset.baustelle];
    openModal(`
      <div class="text-xs uppercase tracking-widest text-muted mb-2">📍 ${x.ort} · ${x.status}</div>
      <h3 class="font-display text-2xl md:text-3xl text-navy mb-4">${x.titel}</h3>
      <img src="${x.img}" class="w-full aspect-[16/9] object-cover rounded-lg mb-6" />
      <div class="flex justify-between text-xs mb-1.5"><span class="text-muted">Fortschritt</span><span class="text-navy font-medium">${x.fortschritt}%</span></div>
      <div class="h-1 bg-border rounded overflow-hidden mb-6"><div class="h-full bg-navy" style="width:${x.fortschritt}%"></div></div>
      <p class="text-muted font-light leading-relaxed whitespace-pre-line">${x.beschreibung}</p>
    `);
  }
  const j = e.target.closest('[data-job]');
  if (j) {
    const x = JOBS[+j.dataset.job];
    openModal(`
      <div class="text-xs uppercase tracking-widest text-muted mb-2">💼 ${x.kategorie} · 📍 ${x.ort} · 🕐 ${x.beschaeftigung}</div>
      <h3 class="font-display text-2xl md:text-3xl text-navy mb-4">${x.titel}</h3>
      <p class="text-muted font-light mb-6">${x.kurz}</p>
      <h4 class="text-xs font-semibold uppercase tracking-widest text-navy mb-2">Aufgaben</h4>
      <p class="text-sm text-muted font-light whitespace-pre-line leading-relaxed mb-6">${x.aufgaben}</p>
      <h4 class="text-xs font-semibold uppercase tracking-widest text-navy mb-2">Anforderungen</h4>
      <p class="text-sm text-muted font-light whitespace-pre-line leading-relaxed mb-8">${x.anforderungen}</p>
      <a href="mailto:bewerbung@hogahenning-bau.com?subject=${encodeURIComponent('Bewerbung: ' + x.titel)}" class="inline-flex items-center gap-2 rounded-full bg-navy text-white px-6 py-3 text-sm font-medium hover:bg-navy-dark transition-colors">✉ Jetzt bewerben</a>
    `);
  }
});

// Mobile menu
document.getElementById('menuBtn')?.addEventListener('click', () => {
  document.getElementById('mobileNav').classList.toggle('hidden');
});
document.querySelectorAll('#mobileNav a').forEach(a => a.addEventListener('click', () => document.getElementById('mobileNav').classList.add('hidden')));

// Kontaktform → mailto
document.getElementById('kontaktForm')?.addEventListener('submit', e => {
  e.preventDefault();
  const d = new FormData(e.target);
  const body = `Name: ${d.get('name')}\nE-Mail: ${d.get('email')}\nTelefon: ${d.get('telefon')||'-'}\n\n${d.get('nachricht')}`;
  window.location.href = `mailto:info@hogahenning-bau.com?subject=${encodeURIComponent('Anfrage über Website')}&body=${encodeURIComponent(body)}`;
});

// Reveal on scroll
const io = new IntersectionObserver(entries => {
  entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }});
}, { threshold: 0.1 });
document.querySelectorAll('.reveal').forEach(el => io.observe(el));

document.getElementById('year').textContent = new Date().getFullYear();
