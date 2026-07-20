# Studio Johanna – Buchungssystem

## Zielbild

Die Kundenseite sendet qualifizierte Terminanfragen an `api/bookings.php`. Jede Anfrage wird als versionierte Terminkarte gespeichert und ist unter `/intern/` einsehbar. Eine Anfrage ist noch keine verbindliche Buchung. Erst der interne Status `bestaetigt` kennzeichnet einen zugesagten Termin.

Die Anwendung nutzt keine externen Kalender-, Formular- oder Analysedienste. Damit bleiben Datenfluss, Verfügbarkeit und spätere Erweiterungen unter eigener Kontrolle.

## Vor dem Livegang zwingend erledigen

1. PHP 8.1 oder neuer beim Hoster aktivieren.
2. HTTPS für die gesamte Website erzwingen.
3. Die Umgebungsvariablen `STUDIO_ADMIN_USER` und `STUDIO_ADMIN_PASSWORD` mit starken, individuellen Zugangsdaten setzen. Ohne geändertes Passwort verweigert die API den Verwaltungszugriff.
4. Schreibrechte für den Webserver auf `storage/bookings.json` einrichten; die Datei darf nicht öffentlich abrufbar sein. Bei Nginx muss das Verzeichnis `storage` zusätzlich in der Serverkonfiguration gesperrt werden, weil `.htaccess` dort nicht wirkt.
5. Hostingdienstleister, Auftragsverarbeitungsvertrag, Serverstandort und tatsächliche Logfristen prüfen und `datenschutz.html` entsprechend finalisieren.
6. Verantwortliche Stelle und Pflichtangaben juristisch prüfen; zusätzlich eine vollständige Impressumsseite bereitstellen.
7. Optional serverseitigen Mailversand für Eingangsbestätigung und interne Benachrichtigung konfigurieren. Kontaktdaten dürfen dabei nicht an nicht beauftragte Drittanbieter übermittelt werden.

## Statusmodell

- `neu`: Anfrage ist eingegangen.
- `in_pruefung`: Termin und Leistungen werden geklärt.
- `option`: Zeitraum wird vorläufig freigehalten und erscheint öffentlich als belegt/angefragt.
- `bestaetigt`: Termin ist zugesagt und erscheint öffentlich als belegt.
- `abgelehnt`: Anfrage kommt nicht zustande.
- `storniert`: Zuvor bearbeiteter Termin wurde aufgehoben.

Abgelehnte und stornierte Terminkarten werden nach 365 Tagen automatisch aus der JSON-Ablage entfernt. Für bestätigte Aufträge sind die tatsächlich geltenden handels- und steuerrechtlichen Aufbewahrungspflichten gesondert festzulegen.

## Wechsel auf MySQL/MariaDB

Die Speicherlogik ist hinter `BookingRepositoryInterface.php` gekapselt. Für den Datenbankwechsel wird eine `DatabaseBookingRepository`-Klasse mit denselben vier Methoden erstellt und in `api/bookings.php` instanziiert. Das Frontend und der interne Bereich bleiben dabei unverändert.

Empfohlene Tabellen:

- `bookings`: Kerndaten, Status, Termin, Kontakt, Preise und Zeitstempel
- `booking_addons`: normalisierte Zusatzleistungen je Auftrag
- `booking_status_history`: nachvollziehbare Statuswechsel mit Bearbeiter und Zeitpunkt
- `booking_notes`: interne Notizen getrennt von Kundenangaben

## Sinnvolle nächste Ausbaustufen

- E-Mail-Eingangsbestätigung mit Referenznummer
- Interne Benachrichtigung bei neuen Terminkarten
- Statushistorie und Bearbeiterkonten statt HTTP-Basic-Auth
- iCal-Export bestätigter Termine, ohne Kundendaten im Feed
- CSRF-Schutz und sitzungsbasierte Anmeldung für mehrere Mitarbeitende
- Datenexport und dokumentierter Löschworkflow für Betroffenenanfragen
- Datenbankmigration mit einmaligem JSON-Import
