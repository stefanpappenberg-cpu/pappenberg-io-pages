# Showroom

Lokale Projektzentrale für den eindeutigen Ablauf:

`Projekt wählen → lokal bearbeiten → Ziel zuordnen → veröffentlichen`

## Start

Im Finder `Start Showroom.command` doppelklicken. Danach öffnet sich:

`http://127.0.0.1:4310/`

## Was Showroom jetzt übernimmt

- lokale Projekte prüfen und dauerhaft registrieren
- Vorschauordner und `index.html` validieren
- lokalen Quellordner sichtbar einem Git-Repository und Ziel-Unterordner zuordnen
- öffentliche URL direkt an dieser Zuordnung anzeigen
- lokale Vorschau starten und das Projekt in Codex öffnen
- statische Deploy-Dateien sicher synchronisieren
- Git-Änderungen stagen und einen Commit vorbereiten
- GitHub Desktop für den bewussten finalen Push nutzen
- pappenberg.io-Unterordner und externe Domain-Repositories abbilden

## Sicherheitsmodell

- Der Import akzeptiert nur Ordner unter `allowed_root`.
- Zielordner müssen innerhalb eines erkannten lokalen Git-Klons liegen.
- `.git`, `.env*`, `node_modules`, API-, Admin- und Speicherordner werden nicht veröffentlicht.
- Vor jeder Synchronisierung zeigt Showroom Quelle, Ziel und öffentliche URL und verlangt eine Bestätigung.
- Showroom pusht nicht automatisch. Der Push bleibt eine bewusste Aktion in GitHub Desktop.
- Bestehende Zieldateien werden nicht pauschal gelöscht; neue und geänderte Dateien werden übertragen.

## Konfiguration

`projects.json` enthält für jedes Projekt:

- `path`: lokaler Arbeitsordner
- `preview_root`: auszuliefernder Ordner relativ zum Projekt
- `publish.repository_path`: lokaler Git-Klon
- `publish.target_subdir`: Zielordner innerhalb des Repositories
- `publish.production_url`: spätere öffentliche URL
- `publish.target_type`: `pappenberg` oder `external`

Neue Einträge werden über „Projekt einrichten“ automatisch validiert und gespeichert.
