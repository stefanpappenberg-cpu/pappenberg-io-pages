# HOGAhenning-Bau · Statische Webseite

Diese Version ist eine eigenständige, statische HTML/CSS/JS-Webseite ohne Backend, ohne Build-Prozess.

## Inhalt

- `index.html` – Startseite (Hero-Video, Leistungen, Baustellen, Karriere, Kontakt)
- `unternehmen.html` – Unternehmensseite
- `impressum.html` / `datenschutz.html` – Rechtliche Seiten
- `styles.css` – Zusätzliche Styles (Fade-In-Animationen)
- `script.js` – Rendering der Leistungen/Baustellen/Jobs, Modale, Kontaktformular
- `assets/` – Bilder + Hero-Video + Logo

## Verwendung

Einfach in einem Browser öffnen oder auf einen beliebigen Webserver hochladen (z. B. Netlify, GitHub Pages, klassisches Webhosting via FTP).

Für lokale Tests:

```
cd hoga-henning-bau-static
python3 -m http.server 8080
# dann http://localhost:8080 im Browser
```

## Inhalte pflegen

Baustellen, Leistungen und Jobs werden in `script.js` in den Konstanten `LEISTUNGEN`, `BAUSTELLEN`, `JOBS` gepflegt. Hero-Texte stehen direkt in `index.html`.

## Abhängigkeiten

- Tailwind CSS wird per CDN eingebunden (`https://cdn.tailwindcss.com`).
- Google Fonts (Inter, Manrope) werden per CDN eingebunden.

Ein aktiver Internetzugang wird beim ersten Laden im Browser benötigt.
