# Admin- und Kundenbereich

Diese Dateien bereiten den spaeteren produktiven Login fuer pappenberg.design vor.
Die aktuelle Website ist statisch. Ein echter sicherer Login darf deshalb nicht nur
in `index.html` oder JavaScript laufen, weil jeder Besucher Frontend-Code lesen kann.

## Zielsystem All-Inkl

- PHP 8.2 oder neuer aktivieren.
- MySQL/MariaDB Datenbank anlegen und `auth-schema.sql` importieren.
- HTTPS erzwingen und HSTS aktivieren.
- Passwoerter nur mit `password_hash()` speichern, bevorzugt Argon2id.
- Sessions serverseitig fuehren: `HttpOnly`, `Secure`, `SameSite=Lax` oder `Strict`.
- CSRF-Token fuer Login, Upload, Speichern und Veroeffentlichen einsetzen.
- Uploads ausserhalb des Webroots speichern und Downloads ueber eine PHP-Pruefung ausliefern.
- Rollen trennen: `admin` kann Projekte bearbeiten, `client` sieht nur freigegebene Inhalte.
- Login-Versuche begrenzen und in `login_attempts` protokollieren.
- Veraenderungen an Projekten und Dateien in `audit_log` schreiben.
- Datenschutzerklaerung um Kundenbereich, Uploads, Logfiles und Speicherdauer ergaenzen.
- Auftragsverarbeitung, Backups und Loeschkonzept beim Hoster pruefen.

## Sinnvolle Ausbaustufen

1. Admin-Dashboard fuer Projekte, Status, Bilder, Dateien und Veroeffentlichung.
2. Kundenbereiche mit projektbezogenen Freigaben und Ablaufprotokoll.
3. Freigabe-Workflow: Entwurf, Review, veroeffentlicht, archiviert.
4. Zeitlich begrenzte Downloadlinks fuer kundenspezifische Dateien.
5. Zwei-Faktor-Login fuer den Admin.
6. E-Mail-Benachrichtigung bei neuer Datei oder neuer Freigabe.

## Demo-Zugaenge

Die Demo-Zugaenge im Frontend sind nur Platzhalter fuer die Gestaltung und duerfen
nicht als produktive Zugangsdaten verwendet werden.
