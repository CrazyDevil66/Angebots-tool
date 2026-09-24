# UI Block 3: Handy und Tablet – Design

Stand: 24.09.2026 · To-Do 29

## Ziel

Das AngebotsTool soll auf Handy und Tablet nutzbar sein. Heute nimmt die feste Seitenleiste (224 px) auf dem Handy mehr als die halbe Breite ein, Tabellen und die Editor-Topbar laufen über.

**Nutzung (vom User festgelegt):**

- **Handy:** Nachschlagen und schnelle Aktionen – Angebote/Rechnungen finden, Status ändern, PDF öffnen, per Mail senden, als bezahlt markieren. Der Editor muss nicht komfortabel, aber benutzbar und nicht kaputt sein.
- **Tablet (Galaxy Tab S10 Ultra), hochkant und quer:** voller Editor inkl. Positionen.

**Erfolgskriterien:**

- Auf allen Breiten ab 360 px gibt es keinen horizontalen Seiten-Scroll (Ausnahme: Katalog-Tabelle in den Einstellungen auf dem Handy, bewusst).
- Ab 1024 px sieht die App aus wie heute (Desktop-Screenshots vor/nach ohne sichtbare Unterschiede).
- Alle Handy-Aktionen aus der Nutzungsbeschreibung sind ohne Zoomen erreichbar.

## Randbedingungen

- Nur Tailwind-Breakpoints, dieselben Komponenten, keine eigenen Mobil-Ansichten.
- Keine neuen Dependencies. Einzige Konfigurationsänderung: eine Tailwind-Variante `touch:` in `tailwind.config.js`.
- Keine Änderungen an Backend, Datenformat oder Deployment.

## Breakpoints

| Breite | Gerät (ca., CSS-Pixel) | Wirkung |
|---|---|---|
| < 640 px (`sm`) | Handy | Formulare einspaltig, Positionen kompakt |
| < 768 px (`md`) | Handy | Karten statt Tabellen, Abstände `p-4`/`px-4` |
| < 1024 px (`lg`) | Tablet hochkant (~924 px) | Seitenleiste als Overlay-Menü, Editor-Topbar zweizeilig mit Mehr-Menü, Umschalter Bearbeiten/Vorschau |
| ≥ 1024 px | Tablet quer (~1480 px), Desktop | unverändert |

Die Gerätebreiten des Tablets werden beim Testen gemessen; die Breakpoints hängen nicht davon ab.

## 1. Navigation und Grundlayout

**Dateien:** `src/App.jsx`, `src/components/Sidebar.jsx`

- Unter `lg` zeigt `App.jsx` eine schmale, dunkle Kopfleiste (Farbe wie Seitenleiste) mit Burger-Button und Logo. Ab `lg` ist sie ausgeblendet.
- `App.jsx` hält den Zustand `menuOffen`. `Sidebar` bekommt die Props `offen` und `onSchliessen`.
- Unter `lg` ist die Seitenleiste `fixed` und per `-translate-x-full` ausgeblendet; offen fährt sie über den Inhalt, dahinter ein abgedunkelter Hintergrund. Ab `lg` ist sie `static` wie heute.
- Schließen durch: Tippen auf einen Menüpunkt (auch Einstellungen/Abmelden), auf den Hintergrund oder Escape.
- Die Navigation läuft weiter über `navigate`, der Wächter für ungespeicherte Änderungen greift also. Bricht der User die Nachfrage ab, schließt das Menü trotzdem, die Ansicht bleibt.
- Äußerer Container `h-dvh` statt `h-screen`, damit die Browser-Adressleiste auf dem Handy den unteren Rand nicht verdeckt.
- Unter `lg` ist das Layout eine Spalte (Kopfleiste, darunter `main`); sticky Topbars in den Ansichten kleben direkt unter der Kopfleiste.

## 2. Listen

**Dateien:** `src/views/AngeboteListe.jsx`, `src/views/RechnungenListe.jsx`, `src/views/KundenListe.jsx`, `src/components/StatusDropdown.jsx`

**Unter `md`: Karten statt Tabelle.**

- Pro Liste eine kleine Kartenkomponente in derselben Datei. Sie nutzt dieselben Daten und Handler wie die Tabellenzeile; unter `md` sind nur die Karten sichtbar, ab `md` nur die Tabelle.
- Angebotskarte: oben Nummer (darunter ggf. Rechnungsnummer) und Betrag; dann Kunde; dann Betreff gekürzt; unten Datum, Status-Dropdown und Aktionen (PDF, Löschen).
- Rechnungskarte: oben Rechnungsnummer (klein darunter Angebotsnummer) und Betrag; dann Kunde, Betreff; unten Datum, „Offen seit“, Status, Aktionen.
- Tippen auf die Karte öffnet den Editor wie der Zeilenklick heute; ein eigener Bearbeiten-Button entfällt auf der Karte.
- Aktionsbuttons auf Karten mindestens ca. 40 px Tippfläche.
- `StatusDropdown` bekommt ein Prop für die Öffnungsrichtung (`rechts`), damit das Menü auf Karten nicht über den Bildschirmrand läuft.
- Filterleiste: Suche volle Breite, Kundenfilter bricht darunter um. Status-Tabs scrollen horizontal (wie heute).
- Kopfbereich: Titel und „Neu“-Button brechen bei Bedarf um; Innenabstand `p-4 md:p-8`.
- Keine eigene Sortier-Auswahl auf dem Handy; die gewählte Sortierung gilt weiter.

**768–1023 px:** Tabelle bleibt. In der Rechnungsliste wird die Spalte „Angebotsnr.“ unter `lg` ausgeblendet.

**Kunden:**

- Liste unter `md` als Karten (Name/Firma, Ort, Umsatz).
- Das Detail-Panel (`KundeDrawer`) ist unter `lg` ein Vollbild-Overlay mit Schließen-Button, ab `lg` wie heute rechts daneben.
- Das Bearbeiten-Formular ist unter `sm` einspaltig.

## 3. Editor

**Dateien:** `src/features/angebot-editor/AngebotEditor.jsx`, `EditorTopbar.jsx`, `PreviewPanel.jsx`, `PositionenTabelle.jsx`, `abschnitte/AngebotInfos.jsx`, `RechnungModal.jsx`, `MahnungModal.jsx`, `KatalogPicker.jsx`, neu `MehrMenue.jsx`, `tailwind.config.js`

**Topbar unter `lg`:**

- Zeile 1: Zurück (Pfeil), Angebotsnummer (gekürzt), Status-Dropdown.
- Zeile 2: Speichern/Aktualisieren, Angebot PDF, Mehr-Button (⋯).
- „Nicht gespeichert“ erscheint als Punkt am Speichern-Button statt als Text.
- Mehr-Menü enthält: Per Mail senden, Rechnung erstellen bzw. Rechnungs-PDF, Mahnung, Als bezahlt markieren, Trennlinie, Zurücksetzen. Es gelten dieselben Bedingungen wie heute (z. B. Mahnung nur bei offener Rechnung).
- Die Zusatzaktionen sind einmal als Liste definiert. Ab `lg` werden sie wie heute als Buttons gerendert, darunter als Einträge in `MehrMenue`.
- `MehrMenue` ist eine kleine Komponente nach dem Muster von `StatusDropdown` (Klick außerhalb schließt).
- Ab `lg` ist die Topbar unverändert.

**Umschalter „Bearbeiten | Vorschau“ unter `lg`:**

- Zustand `ansicht` in `AngebotEditor`. Unter `lg` wird entweder das Formular oder die Vorschau angezeigt, ab `lg` beide nebeneinander wie heute.
- `PreviewPanel`: `sticky` und die Höhenbegrenzung (`calc(100vh - 260px)`) gelten nur ab `lg`; darunter scrollt die Vorschau mit der Seite über die volle Breite.
- Ob die ausgeblendete Vorschau per CSS versteckt oder nicht gerendert wird, entscheidet die Umsetzung danach, ob die automatische Skalierung beim Wiedereinblenden korrekt rechnet.

**Positionen:**

- Tablet: Layout wie heute.
- Unter `sm`: Der Gesamtbetrag rutscht aus der eigenen Spalte unter die Zahlenfelder.
- Drag & Drop per Finger ist in Chrome/Samsung Internet nicht zuverlässig. Auf Touch-Geräten sind die vorhandenen Pfeile ↑↓ der Weg zum Sortieren; sie werden dort größer. Dafür neue Tailwind-Variante `touch:` = `@media (pointer: coarse)` in `tailwind.config.js`.
- Zahlenfelder erhalten `inputMode="decimal"`.

**Sonstiges:**

- Abstände `px-4 md:px-8`, auch für Fehler- und Hinweisbalken.
- `AngebotInfos` unter `sm` einspaltig.
- Rechnung-, Mahnung- und Katalog-Modal: Seitenabstand, maximale Höhe, eigenes Scrollen, damit Buttons erreichbar bleiben.

## 4. Dashboard, Einstellungen, Anmeldeseiten

**Dashboard** (`src/views/Dashboard.jsx`):

- Topbar und Inhalt `px-4 md:px-8`.
- Kennzahl-Karten bleiben auf dem Handy zweispaltig (ab `xl` vierspaltig). Passen Beträge bei 360 px nicht, unter `sm` einspaltig – Entscheidung per Screenshot.
- „Letzte Aktivitäten“ unter `md` als Karten.
- Handlungsbedarf und Monatsübersicht: unverändert (stapeln bereits unter `lg`).

**Einstellungen** (`src/features/einstellungen/`):

- Topbar unter `lg` zweizeilig: Titel und Speicherstatus, darunter horizontal scrollbare Tabs.
- Spaltenlayout von Inline-Style auf Tailwind-Klassen; die rechte Spalte (Firmen-Vorschau, 340 px) liegt unter `lg` unter den Einstellungen.
- Zweispaltige Formulare (Firma, E-Mail, Texte, Benutzer, automatische Sicherung) unter `sm` einspaltig.
- Katalog-Tabelle: auf dem Handy horizontal scrollbar, kein Umbau.

**Login, Setup, Einladung, Passwortwechsel:** nur prüfen, dass sie auf dem Handy Seitenabstand haben; bei Bedarf minimal anpassen.

## Nicht enthalten

- Sortier-Auswahl auf dem Handy
- Drag & Drop per Touch
- Katalog-Pflege optimiert für Handy
- Offline-Fähigkeit / PWA

## Testen

- `npm run lint`, `npm test`, `npm run build`.
- Playwright gegen den lokalen Dev-Server, Screenshots in 390×844, ca. 924×1480, ca. 1480×924 und 1440×900 für Dashboard, Angebote, Rechnungen, Kunden (inkl. Detail), Editor (Bearbeiten, Vorschau, Mehr-Menü, Modals), Einstellungen (alle Tabs) und Login.
- Desktop-Screenshots (1440×900) werden vor Beginn der Umsetzung aufgenommen und am Ende verglichen – keine sichtbaren Unterschiede.
- Abläufe: Menü öffnen/navigieren/schließen (auch Escape, Hintergrund), Wächter bei ungespeicherten Änderungen über das Menü, Mehr-Menü-Aktionen, Umschalter Bearbeiten/Vorschau, Positionen per Pfeil verschieben.
- Abschluss durch den User auf Galaxy Tab S10 Ultra und Handy, über LAN-IP und Cloudflare.
