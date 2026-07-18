# Showroom – Architektur

## Zielbild

Showroom ist die lokale Steuerzentrale für Website-Projekte. Er beseitigt die
Trennung zwischen Projektordner, Git-Klon, Ziel-Unterordner und öffentlicher URL,
indem diese vier Informationen als eine dauerhaft sichtbare Route behandelt
werden.

## Kernmodell

```text
Lokale Quelle
  → Vorschau-Ordner
  → lokaler Git-Klon / Ziel-Unterordner
  → öffentliche URL
```

## Workflow

1. **Projekt wählen**
   Ordner importieren, Namen und Vorschau-Root prüfen.
2. **Lokal bearbeiten**
   Projekt in Codex öffnen, lokalen Server starten, Vorschau kontrollieren.
3. **Ziel zuordnen**
   pappenberg.io-Unterordner oder Repository einer externen Domain festlegen.
4. **Veröffentlichen**
   Route bestätigen, deploybare Dateien synchronisieren, Git-Commit erstellen
   und den finalen Push in GitHub Desktop ausführen.

## Backend

Der lokale Python-Dienst übernimmt:

- Registry und Validierung
- Git- und Synchronisationsstatus
- Vorschauprozesse
- Import neuer Projekte
- kontrollierte Dateiübertragung
- Git-Staging und Commit
- Öffnen von Codex, Browser und GitHub Desktop

## Externe Domains

Externe Domains werden als eigenes Deployment-Ziel angeboten. Voraussetzung ist
ein lokaler Klon des Repositorys, das beim jeweiligen Hostinganbieter mit der
Domain verbunden ist. Netlify, GitHub Pages oder andere Git-basierte Hostings
können dadurch denselben Workflow verwenden.

Ein zukünftiger Provider-Adapter kann Netlify-Site-ID, Deploy-Status, DNS und
Deploy-Preview-Links ergänzen. Zugangsdaten gehören nicht in `projects.json`.
