# UI Block 3: Handy und Tablet – Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Das AngebotsTool auf Handy (Nachschlagen + schnelle Aktionen) und Tablet (voller Editor) nutzbar machen, ohne die Desktop-Ansicht zu verändern.

**Architecture:** Nur Tailwind-Breakpoints in den bestehenden Komponenten (`sm` 640, `md` 768, `lg` 1024). Unter `lg` wird die Seitenleiste zum Overlay-Menü, unter `md` werden Tabellen zu Karten. Einzige neue Logik: eine reine Funktion `zusatzAktionen()` (per `node --test` getestet), die festlegt, welche Editor-Aktionen sichtbar sind – Desktop-Buttons und das neue Mehr-Menü lesen dieselbe Liste.

**Tech Stack:** React 19, Vite 8, Tailwind 3.4, lucide-react, node:test. Prüfung im Browser mit dem Playwright-MCP.

**Spec:** `docs/superpowers/specs/2026-09-24-ui-block-3-mobil-design.md`

## Global Constraints

- Keine neuen Dependencies. Einzige Konfigurationsänderung: Tailwind-Variante `touch:` in `tailwind.config.js`.
- Ab 1024 px sieht die App aus wie heute (Desktop-Screenshots vor/nach ohne sichtbare Unterschiede).
- Auf allen Breiten ab 360 px kein horizontaler Seiten-Scroll (Ausnahme: Katalog-Tabelle in den Einstellungen auf dem Handy).
- Keine Änderungen an Backend, Datenformat oder Deployment.
- Projektregeln aus `../CLAUDE.md` gelten: minimal-invasiv, bestehende Patterns, keine unnötigen Kommentare, deutsche Bezeichner wie im Code.
- Commit-Nachrichten im Stil des Repos (`feat(ui): …`, deutsch) und mit Zeile `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.
- Gearbeitet wird auf Branch `feature/ui-block-3-mobil`.

## Review Focus

1. **Wächter bei ungespeicherten Änderungen über das Overlay-Menü:** Wer im Editor etwas ändert und im Handy-Menü einen anderen Punkt antippt, muss die Nachfrage bekommen; bei „Abbrechen“ bleibt der Editor mit den Änderungen offen und das Menü ist zu. → Prüfung in Task 1 Step 6 und Task 10 Step 4.
2. **Klicks in Karten öffnen den Editor nicht ungewollt:** Status-Dropdown, PDF und Löschen auf einer Karte dürfen nicht zusätzlich den Editor öffnen. → Prüfung in Task 2 Step 5 und Task 3 Step 4.
3. **Vorschau nach Umschalten falsch skaliert:** Wechsel Bearbeiten → Vorschau → Bearbeiten → Vorschau und Drehen des Tablets dürfen keine Vorschau mit Breite 0 oder abgeschnittenem Blatt hinterlassen. → Prüfung in Task 6 Step 5.
4. **Mehr-Menü zeigt genau die Aktionen, die der Desktop zeigt:** gleiche Bedingungen (Mail nur mit E-Mail, Mahnung nur bei offener Rechnung usw.). → Unit-Tests in Task 5 Step 1.
5. **Dropdowns laufen aus dem Bildschirm:** Status-Dropdown auf Karten und in der Editor-Topbar sowie das Mehr-Menü am rechten Rand bei 360 px. → Prüfung in Task 2 Step 5 und Task 5 Step 7.

## Datei-Übersicht

| Datei | Änderung |
|---|---|
| `src/App.jsx` | Kopfleiste mit Burger, Zustand `menuOffen`, Escape, `h-dvh` |
| `src/components/Sidebar.jsx` | Props `offen`, `onSchliessen`; Overlay unter `lg` |
| `src/components/StatusDropdown.jsx` | Prop `rechts` |
| `src/views/AngeboteListe.jsx` | `AngebotKarte`, responsive Kopf/Filter |
| `src/views/RechnungenListe.jsx` | `RechnungKarte`, Spalte Angebotsnr. unter `lg` aus |
| `src/views/KundenListe.jsx` | `KundeKarte`, Drawer als Vollbild unter `lg`, Formular einspaltig |
| `src/utils/editorAktionen.js` + `.test.js` | **neu** – `zusatzAktionen()` |
| `src/features/angebot-editor/MehrMenue.jsx` | **neu** – ⋯-Menü |
| `src/features/angebot-editor/EditorTopbar.jsx` | zweizeilig unter `lg`, Umschalter, Mehr-Menü |
| `src/features/angebot-editor/AngebotEditor.jsx` | Zustand `ansicht`, Abstände |
| `src/features/angebot-editor/PreviewPanel.jsx` | `sticky`/Höhe nur ab `lg`, zentriert |
| `src/features/angebot-editor/PositionenTabelle.jsx` | Handy-Raster, Touch-Pfeile, `inputMode` |
| `src/features/angebot-editor/abschnitte/AngebotInfos.jsx` | einspaltig unter `sm` |
| `src/features/angebot-editor/RechnungModal.jsx`, `MahnungModal.jsx` | max. Höhe + Scrollen |
| `tailwind.config.js` | Variante `touch:` |
| `src/views/Dashboard.jsx` | Abstände, Karten für „Letzte Aktivitäten“ |
| `src/features/einstellungen/Einstellungen.jsx` | Topbar umbrechend, Spalten per Klasse |
| `src/features/einstellungen/{FirmaTab,TexteTab,EmailTab,BenutzerVerwaltung,AutomatischeSicherung,KatalogTab}.jsx` | einspaltig unter `sm`, Katalog scrollbar |
| `src/features/auth/{LoginScreen,SetupScreen,InviteScreen,ChangePasswordModal,LadeFehler}.jsx` | Seitenabstand |

## Test-Umgebung (gilt für alle Tasks)

Es gibt keine Komponenten-Tests im Projekt, und laut Spec kommen keine Dependencies hinzu. Deshalb: Unit-Test nur für die reine Logik (`zusatzAktionen`), alle Layout-Änderungen werden mit `npm run lint`, `npm run build` und dem Playwright-MCP im Browser geprüft.

Server und Frontend lokal mit **eigenem Testdaten-Ordner** starten (nie echte Daten):

```bash
# Terminal 1 (im Hintergrund laufen lassen)
cd "/home/tolga/Dokumente/Visual Studio Code/Objektrausch/angebots-tool/server"
DATA_DIR=/tmp/claude-1000/-home-tolga/763ac065-2653-4643-b286-ed21d148e7ef/scratchpad/testdaten npm start
# Terminal 2 (im Hintergrund laufen lassen)
cd "/home/tolga/Dokumente/Visual Studio Code/Objektrausch/angebots-tool"
npm run dev -- --host 127.0.0.1 --port 5173
```

Viewports (Playwright `browser_resize`): **Handy 390×844**, **schmales Handy 360×740**, **Tablet hochkant 924×1480**, **Tablet quer 1480×924**, **Desktop 1440×900**.

Screenshots nach `…/scratchpad/screens/<phase>/<viewport>-<ansicht>.png`.

---

### Task 0: Testdaten und Desktop-Referenz

**Files:** keine Repo-Dateien

- [ ] **Step 1: Server und Vite starten** (Befehle aus „Test-Umgebung“, beide im Hintergrund).

- [ ] **Step 2: Testdaten über die Oberfläche anlegen** (Playwright, Desktop 1440×900, `http://127.0.0.1:5173`):
  1. Einrichtung: Benutzer `admin`, Passwort `Test-Passwort-123`.
  2. Einstellungen → Firmendaten: Name „Muster Bau GmbH“, Straße, PLZ, Ort, IBAN ausfüllen.
  3. Einstellungen → Katalog: 3 Leistungen anlegen.
  4. Kunden: 3 Kunden, einer mit langer Firma „Sehr lange Firmenbezeichnung Gebäudetechnik GmbH & Co. KG“ und E-Mail.
  5. Angebot A: Kunde mit E-Mail, **10 Positionen** (damit die Vorschau 2 Seiten hat), langer Betreff, speichern.
  6. Angebot B: 2 Positionen, Status „Angenommen“, dann „Rechnung erstellen“.
  7. Angebot C: 1 Position, Status „Entwurf“.

- [ ] **Step 3: Desktop-Referenz aufnehmen** (1440×900) nach `screens/vorher/`: Login (vor der Anmeldung abmelden und wieder anmelden), Dashboard, Angebote, Rechnungen, Kunden, Kunden mit geöffnetem Detail, Editor Angebot A, Editor Angebot B (offene Rechnung), Einstellungen alle Tabs. Zusätzlich dieselben Ansichten in 1480×924 (`tablet-quer`).

- [ ] **Step 4: Ist-Zustand Handy festhalten** (390×844) von Dashboard, Angebote und Editor A nach `screens/vorher/` – nur zum späteren Vergleich.

Kein Commit.

---

### Task 1: Overlay-Menü und Grundlayout

**Files:**
- Modify: `src/App.jsx`
- Modify: `src/components/Sidebar.jsx`

**Interfaces:**
- Produces: `Sidebar` akzeptiert zusätzlich `offen: boolean` und `onSchliessen: () => void`. Ab `lg` werden beide ignoriert.

- [ ] **Step 1: `Sidebar.jsx` anpassen**

Signatur und `<aside>`:

```jsx
export default function Sidebar({ currentView, onNavigate, counts = {}, onLogout, offen = false, onSchliessen }) {
  function waehle(view) {
    onSchliessen?.();
    onNavigate(view);
  }

  return (
    <aside
      className={`w-56 bg-[#0f172a] flex flex-col flex-shrink-0 h-dvh border-r border-slate-800
        fixed inset-y-0 left-0 z-50 transition-transform ${offen ? 'translate-x-0' : '-translate-x-full'}
        lg:static lg:translate-x-0 lg:transition-none`}
    >
```

In der Hauptnavigation `onClick={() => onNavigate(item.id)}` ersetzen durch `onClick={() => waehle(item.id)}`, bei Einstellungen `onClick={() => waehle('einstellungen')}`. Beim Abmelden-Button:

```jsx
            onClick={() => { onSchliessen?.(); onLogout(); }}
```

- [ ] **Step 2: `App.jsx` – Zustand und Escape**

Import ergänzen: `import { Menu } from 'lucide-react';`

Direkt nach `const [nav, setNav] = …`:

```jsx
  const [menuOffen, setMenuOffen] = useState(false);
```

Nach dem `useEffect` für `SITZUNG_ABGELAUFEN` (vor den frühen `return`s, Hooks-Reihenfolge):

```jsx
  useEffect(() => {
    if (!menuOffen) return;
    const beiEscape = e => { if (e.key === 'Escape') setMenuOffen(false); };
    window.addEventListener('keydown', beiEscape);
    return () => window.removeEventListener('keydown', beiEscape);
  }, [menuOffen]);
```

- [ ] **Step 3: `App.jsx` – Layout ersetzen**

Das abschließende `return (…)` ersetzen durch:

```jsx
  return (
    <div className="flex flex-col lg:flex-row h-dvh overflow-hidden bg-slate-50">
      <header className="lg:hidden h-14 flex-shrink-0 bg-[#0f172a] border-b border-slate-800 flex items-center gap-3 px-4">
        <button
          onClick={() => setMenuOffen(true)}
          aria-label="Menü öffnen"
          className="p-2 -ml-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <Menu size={20} />
        </button>
        <span className="font-bold text-white text-sm tracking-tight">AngebotsTool</span>
      </header>
      {menuOffen && (
        <div className="lg:hidden fixed inset-0 z-40 bg-black/40" onClick={() => setMenuOffen(false)} />
      )}
      <Sidebar
        currentView={nav.view}
        onNavigate={navigate}
        counts={counts}
        onLogout={abmelden}
        offen={menuOffen}
        onSchliessen={() => setMenuOffen(false)}
      />
      <main className="flex-1 min-h-0 overflow-y-auto">{renderView()}</main>
    </div>
  );
```

- [ ] **Step 4: Lint und Build**

Run: `npm run lint && npm run build`
Expected: keine Fehler.

- [ ] **Step 5: Desktop unverändert prüfen**

Playwright 1440×900 und 1480×924: Dashboard und Angebote aufnehmen nach `screens/task1/`, mit `screens/vorher/` vergleichen (Bilder mit Read-Tool nebeneinander ansehen). Expected: keine sichtbaren Unterschiede, keine Kopfleiste.

- [ ] **Step 6: Menü prüfen** (390×844 und 924×1480)
  - Kopfleiste sichtbar, Seitenleiste nicht sichtbar, Inhalt volle Breite.
  - Burger → Menü fährt herein, Hintergrund dunkel. Tippen auf „Kunden“ → Kundenliste, Menü zu.
  - Menü öffnen, Tippen auf dunklen Bereich → zu. Menü öffnen, `Escape` → zu.
  - **Wächter:** Editor Angebot A öffnen, Betreff ändern, Menü → „Dashboard“ → Dialog erscheint (`browser_handle_dialog` mit `accept: false`) → Editor bleibt, geänderter Betreff steht noch da, Menü ist zu.
  - Abmelden über das Menü → Login-Seite.

- [ ] **Step 7: Commit**

```bash
git add src/App.jsx src/components/Sidebar.jsx
git commit -m "feat(ui): einklappbares Menü unter 1024 px

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 2: Angebotsliste als Karten, StatusDropdown-Ausrichtung

**Files:**
- Modify: `src/components/StatusDropdown.jsx`
- Modify: `src/views/AngeboteListe.jsx`

**Interfaces:**
- Produces: `StatusDropdown` akzeptiert `rechts: boolean` (Standard `false`). `true` richtet das Menü an der rechten Kante aus.

- [ ] **Step 1: `StatusDropdown.jsx`**

Signatur: `export default function StatusDropdown({ status, onChange, disabled = false, rechts = false })`

Menü-Container:

```jsx
        <div className={`absolute top-full mt-1.5 ${rechts ? 'right-0' : 'left-0'} z-50 bg-white rounded-xl shadow-xl border border-slate-100 py-1 min-w-[160px]`}>
```

- [ ] **Step 2: `AngebotKarte` in `AngeboteListe.jsx`** (oberhalb von `export default`, unter `nichtWeiterreichen`)

```jsx
function AngebotKarte({ angebot: a, onOeffnen, onStatus, onPDF, pdfLaedt, onLoeschen }) {
  return (
    <li onClick={onOeffnen} className="p-4 flex flex-col gap-1 cursor-pointer active:bg-slate-50">
      <div className="flex items-baseline justify-between gap-3">
        <div className="min-w-0">
          <span className="text-sm font-semibold text-indigo-600">{a.angebotNr}</span>
          {a.rechnungsNr && <span className="ml-2 text-xs text-emerald-600 font-medium">{a.rechnungsNr}</span>}
        </div>
        <span className="text-sm font-semibold text-slate-800 whitespace-nowrap">{formatBetrag(a.brutto)} €</span>
      </div>
      <div className="text-sm text-slate-700 truncate">{a.kundeDisplay || '—'}</div>
      <div className="text-sm text-slate-500 truncate">
        {a.betreff || <span className="italic text-slate-300">Kein Betreff</span>}
      </div>
      <div className="flex items-center gap-1 mt-1" onClick={nichtWeiterreichen}>
        <span className="text-xs text-slate-400 mr-auto">{formatDatum(a.datum) || '—'}</span>
        <StatusDropdown status={a.status || 'entwurf'} onChange={onStatus} rechts />
        <button
          onClick={onPDF}
          disabled={pdfLaedt}
          className="p-2.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors disabled:opacity-40"
          aria-label={a.rechnungsNr ? 'Rechnung PDF' : 'Angebot PDF'}
        >
          <Download size={16} />
        </button>
        <button
          onClick={onLoeschen}
          className="p-2.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"
          aria-label="Löschen"
        >
          <Trash2 size={16} />
        </button>
      </div>
    </li>
  );
}
```

- [ ] **Step 3: Kopf, Filter, Tabelle/Karten**

- Äußerer Container: `<div className="p-8">` → `<div className="p-4 md:p-8">`
- Kopf: `<div className="flex items-center justify-between mb-6">` → `<div className="flex flex-wrap items-center justify-between gap-3 mb-6">`
- Filterleiste: `<div className="flex items-center gap-3 p-4 border-b border-slate-100">` → `<div className="flex flex-wrap items-center gap-3 p-4 border-b border-slate-100">`
- Suchfeld-Hülle: `<div className="relative flex-1 max-w-sm">` → `<div className="relative w-full sm:w-auto sm:flex-1 sm:max-w-sm">`
- `<table className="w-full">` → `<table className="w-full hidden md:table">`
- Direkt vor `<table …>` innerhalb desselben `else`-Zweigs ein Fragment verwenden: `( <> <ul …/> <table …/> </> )` mit

```jsx
            <ul className="md:hidden divide-y divide-slate-100">
              {sortiert.map(a => (
                <AngebotKarte
                  key={a.id}
                  angebot={a}
                  onOeffnen={() => navigate('angebot-editor', { angebotId: a.id })}
                  onStatus={s => handleStatusChange(a.id, s)}
                  onPDF={() => handlePDF(a)}
                  pdfLaedt={pdfLoading === a.id}
                  onLoeschen={() => handleDelete(a.id)}
                />
              ))}
            </ul>
```

- [ ] **Step 4: Lint und Build**

Run: `npm run lint && npm run build`
Expected: keine Fehler.

- [ ] **Step 5: Im Browser prüfen**
  - 390×844 und 360×740: Karten statt Tabelle, kein horizontaler Scroll (`browser_evaluate`: `document.documentElement.scrollWidth <= innerWidth` und für `main`: `el.scrollWidth <= el.clientWidth` → `true`).
  - Status-Dropdown auf einer Karte öffnen: Menü vollständig im Bild, Auswahl ändert Status, **Editor öffnet sich nicht**.
  - PDF-Button: Download startet, Editor öffnet sich nicht. Löschen → Dialog, mit `accept: false` abbrechen, Editor öffnet sich nicht.
  - Tippen auf den Kartentext → Editor öffnet.
  - 924×1480: Tabelle wie bisher, kein horizontaler Scroll.
  - 1440×900: Screenshot mit `vorher` vergleichen – gleich.

- [ ] **Step 6: Commit**

```bash
git add src/components/StatusDropdown.jsx src/views/AngeboteListe.jsx
git commit -m "feat(ui): Angebotsliste als Karten auf dem Handy

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 3: Rechnungsliste als Karten

**Files:**
- Modify: `src/views/RechnungenListe.jsx`

**Interfaces:**
- Consumes: `OffenSeit`, `OFFEN_STIL`, `getStatus` (bestehend in derselben Datei).

- [ ] **Step 1: Status-Badge herausziehen und `RechnungKarte` anlegen** (unter `OffenSeit`)

```jsx
function RechnungStatus({ status }) {
  const s = status === 'angenommen' ? OFFEN_STIL : getStatus(status);
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-semibold border ${s.bg} ${s.text} ${s.border}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
      {s.label}
    </span>
  );
}

function RechnungKarte({ rechnung: a, onOeffnen, onPDF, pdfLaedt }) {
  const betreff = a.rechnungsBetreff || a.betreff;
  return (
    <li onClick={onOeffnen} className="p-4 flex flex-col gap-1 cursor-pointer active:bg-slate-50">
      <div className="flex items-baseline justify-between gap-3">
        <div className="min-w-0">
          <span className="text-sm font-semibold text-emerald-600">{a.rechnungsNr}</span>
          <span className="ml-2 text-xs text-indigo-600 font-medium">{a.angebotNr}</span>
        </div>
        <span className="text-sm font-semibold text-slate-800 whitespace-nowrap">{formatBetrag(a.brutto)} €</span>
      </div>
      <div className="text-sm text-slate-700 truncate">{a.kundeDisplay || '—'}</div>
      <div className="text-sm text-slate-500 truncate">{betreff || <span className="italic text-slate-300">—</span>}</div>
      <div className="flex items-center gap-2 mt-1 text-xs" onClick={nichtWeiterreichen}>
        <span className="text-slate-400">{formatDatum(a.rechnungsDatum || a.datum) || '—'}</span>
        <span className="mr-auto"><OffenSeit rechnung={a} /></span>
        <RechnungStatus status={a.status} />
        <button
          onClick={onPDF}
          disabled={pdfLaedt}
          className="p-2.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors disabled:opacity-40"
          aria-label="Rechnung PDF"
        >
          <Download size={16} />
        </button>
      </div>
    </li>
  );
}
```

In der Tabellenzeile den bisherigen Badge-`<span …>` in der Status-`<td>` durch `<RechnungStatus status={a.status} />` ersetzen und die dann unbenutzten Variablen `s` und `cfg` entfernen (Lint meldet sie sonst).

- [ ] **Step 2: Spalte „Angebotsnr.“ unter `lg` ausblenden**

`src/components/SortierKopf.jsx` reicht heute keine Klassen durch. Signatur und Klassen erweitern:

```jsx
export default function SortierKopf({ label, feld, sortierung, onSortieren, rechts = false, className = '' }) {
  const klassen = `px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide bg-slate-50 ${rechts ? 'text-right' : 'text-left'} ${className}`;
```

Im `SPALTEN`-Array von `RechnungenListe.jsx`:

```js
  { label: 'Angebotsnr.', feld: 'angebot', className: 'hidden lg:table-cell' },
```

In der Zeile die zweite `<td>` auf `className="px-4 py-3.5 whitespace-nowrap hidden lg:table-cell"` ändern.

- [ ] **Step 3: Kopf, Filter, Tabs, Tabelle/Karten**

- `<div className="p-8">` → `<div className="p-4 md:p-8">`
- Kopf und Filterleiste und Suchfeld-Hülle genau wie in Task 2 Step 3.
- Tabs: `<div className="flex border-b border-slate-100 px-4 bg-slate-50/50">` → `… bg-slate-50/50 overflow-x-auto">`
- `<table className="w-full">` → `<table className="w-full hidden md:table">`, davor im selben Zweig (Fragment):

```jsx
            <ul className="md:hidden divide-y divide-slate-100">
              {sortiert.map(a => (
                <RechnungKarte
                  key={a.id}
                  rechnung={a}
                  onOeffnen={() => navigate('angebot-editor', { angebotId: a.id })}
                  onPDF={() => handlePDF(a)}
                  pdfLaedt={pdfLoading === a.id}
                />
              ))}
            </ul>
```

- [ ] **Step 4: Lint, Build, Browser**

Run: `npm run lint && npm run build` → keine Fehler.
Browser: 390×844/360×740 Karten, kein horizontaler Scroll, PDF öffnet nicht den Editor; 924×1480 Tabelle ohne „Angebotsnr.“, kein horizontaler Scroll; 1440×900 gleich `vorher` (Spalte „Angebotsnr.“ sichtbar).

- [ ] **Step 5: Commit**

```bash
git add src/views/RechnungenListe.jsx src/components/SortierKopf.jsx
git commit -m "feat(ui): Rechnungsliste als Karten auf dem Handy

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 4: Kundenliste, Detail als Vollbild

**Files:**
- Modify: `src/views/KundenListe.jsx`

- [ ] **Step 1: `KundeKarte`** (über `export default`)

```jsx
function KundeKarte({ kunde: k, umsatz, aktiv, onOeffnen }) {
  return (
    <li
      onClick={onOeffnen}
      className={`p-4 flex items-center gap-3 cursor-pointer ${aktiv ? 'bg-indigo-50' : 'active:bg-slate-50'}`}
    >
      <div className="min-w-0 flex-1">
        <div className="font-semibold text-slate-800 text-sm truncate">{k.firma || k.name}</div>
        {k.firma && k.name && <div className="text-xs text-slate-400 truncate">{k.name}</div>}
        <div className="text-xs text-slate-500 mt-0.5">{k.ort ? `${k.plz} ${k.ort}` : '—'}</div>
      </div>
      <span className="text-sm font-semibold text-slate-800 whitespace-nowrap">
        {umsatz > 0 ? `${formatBetrag(umsatz)} €` : '—'}
      </span>
      <ChevronRight size={16} className="text-slate-300 flex-shrink-0" />
    </li>
  );
}
```

- [ ] **Step 2: Layout**

- `<div className="flex h-full min-h-screen">` → `<div className="flex min-h-full">`
- `<div className={\`flex-1 p-8 transition-all …\`}>` → `p-8` durch `p-4 md:p-8` ersetzen.
- Kopf: `flex items-center justify-between mb-6` → `flex flex-wrap items-center justify-between gap-3 mb-6`
- Suche: `<div className="relative mb-4 max-w-sm">` → `<div className="relative mb-4 sm:max-w-sm">`
- `<table className="w-full">` → `<table className="w-full hidden md:table">`, davor (Fragment):

```jsx
            <ul className="md:hidden divide-y divide-slate-100">
              {gefiltert.map(k => (
                <KundeKarte
                  key={k.id}
                  kunde={k}
                  umsatz={kundeStats(k).umsatz}
                  aktiv={selected?.id === k.id}
                  onOeffnen={() => { setSelected(k); setDrawerMode('view'); }}
                />
              ))}
            </ul>
```

- Drawer-Container: `<div className="w-96 border-l border-slate-200 bg-white flex-shrink-0 flex flex-col shadow-xl">` →

```jsx
        <div className="fixed inset-0 z-40 lg:static lg:inset-auto lg:z-auto lg:w-96 border-l border-slate-200 bg-white flex-shrink-0 flex flex-col shadow-xl">
```

- `KundeForm`: `<div className="grid grid-cols-2 gap-3">` → `<div className="grid grid-cols-1 sm:grid-cols-2 gap-3">`

- [ ] **Step 3: Lint, Build, Browser**

Run: `npm run lint && npm run build` → keine Fehler.
Browser:
- 390×844: Karten; Tippen → Detail füllt den Bildschirm, ✕ schließt; „Bearbeiten“ → Formular einspaltig, Speichern funktioniert; „Neuer Kunde“ → Vollbild-Formular, Abbrechen schließt.
- 924×1480: Tabelle; Detail als Vollbild.
- 1440×900: Detail rechts daneben wie `vorher`.

- [ ] **Step 4: Commit**

```bash
git add src/views/KundenListe.jsx
git commit -m "feat(ui): Kundenliste und Kundendetail für Handy und Tablet

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 5: Editor-Topbar mit Mehr-Menü

**Files:**
- Create: `src/utils/editorAktionen.js`
- Create: `src/utils/editorAktionen.test.js`
- Create: `src/features/angebot-editor/MehrMenue.jsx`
- Modify: `src/features/angebot-editor/EditorTopbar.jsx`

**Interfaces:**
- Produces: `zusatzAktionen({ status, rechnungsNr, mahnStufe, kundeEmail }) → Array<{ id: 'mail'|'rechnung'|'rechnungPdf'|'mahnung'|'bezahlt', label: string }>` in Anzeigereihenfolge.
- Produces: `<MehrMenue eintraege={Array<{ id, label, icon, onClick, disabled?, trennerDavor? }>} />`
- Produces (für Task 6): `EditorTopbar` akzeptiert zusätzlich `ansicht: 'bearbeiten'|'vorschau'` und `onAnsicht: (ansicht) => void`.

- [ ] **Step 1: Failing Test schreiben** – `src/utils/editorAktionen.test.js`

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { zusatzAktionen } from './editorAktionen.js';

const ids = liste => liste.map(a => a.id);

test('zusatzAktionen: Entwurf ohne E-Mail hat keine Zusatzaktionen', () => {
  assert.deepEqual(zusatzAktionen({ status: 'entwurf', rechnungsNr: null, mahnStufe: 0, kundeEmail: '' }), []);
});

test('zusatzAktionen: Mail nur mit Kunden-E-Mail', () => {
  assert.deepEqual(ids(zusatzAktionen({ status: 'versendet', kundeEmail: 'a@b.de' })), ['mail']);
});

test('zusatzAktionen: angenommen ohne Rechnung bietet Rechnung erstellen', () => {
  assert.deepEqual(ids(zusatzAktionen({ status: 'angenommen', rechnungsNr: null, kundeEmail: 'a@b.de' })), ['mail', 'rechnung']);
});

test('zusatzAktionen: offene Rechnung bietet PDF, Mahnung und bezahlt in dieser Reihenfolge', () => {
  const liste = zusatzAktionen({ status: 'angenommen', rechnungsNr: 'RE-2026-001', mahnStufe: 0, kundeEmail: '' });
  assert.deepEqual(ids(liste), ['rechnungPdf', 'mahnung', 'bezahlt']);
  assert.equal(liste[0].label, 'RE-2026-001');
  assert.equal(liste[1].label, 'Mahnung erstellen');
});

test('zusatzAktionen: Mahnstufe erscheint im Label', () => {
  const liste = zusatzAktionen({ status: 'gemahnt', rechnungsNr: 'RE-2026-001', mahnStufe: 2 });
  assert.equal(liste.find(a => a.id === 'mahnung').label, 'Mahnung (Stufe 2)');
});

test('zusatzAktionen: bezahlte Rechnung hat keine Rechnungsaktionen', () => {
  assert.deepEqual(ids(zusatzAktionen({ status: 'bezahlt', rechnungsNr: 'RE-2026-001', kundeEmail: 'a@b.de' })), ['mail']);
});
```

- [ ] **Step 2: Test laufen lassen**

Run: `node --test src/utils/editorAktionen.test.js`
Expected: FAIL (`Cannot find module … editorAktionen.js`).

- [ ] **Step 3: Implementierung** – `src/utils/editorAktionen.js`

```js
/**
 * Aktionen der Editor-Topbar nach Speichern und PDF, in Anzeigereihenfolge.
 * Desktop zeigt sie als Buttons, schmale Bildschirme im Mehr-Menü.
 * @returns {{ id: 'mail'|'rechnung'|'rechnungPdf'|'mahnung'|'bezahlt', label: string }[]}
 */
export function zusatzAktionen({ status, rechnungsNr, mahnStufe = 0, kundeEmail }) {
  const offeneRechnung = !!rechnungsNr && status !== 'bezahlt';
  const aktionen = [];
  if (kundeEmail) aktionen.push({ id: 'mail', label: 'Per Mail senden' });
  if (status === 'angenommen' && !rechnungsNr) aktionen.push({ id: 'rechnung', label: 'Rechnung erstellen' });
  if (offeneRechnung) {
    aktionen.push({ id: 'rechnungPdf', label: rechnungsNr });
    aktionen.push({ id: 'mahnung', label: mahnStufe > 0 ? `Mahnung (Stufe ${mahnStufe})` : 'Mahnung erstellen' });
    aktionen.push({ id: 'bezahlt', label: 'Als bezahlt markieren' });
  }
  return aktionen;
}
```

- [ ] **Step 4: Tests laufen lassen**

Run: `npm test`
Expected: alle PASS, inklusive der 6 neuen.

- [ ] **Step 5: `MehrMenue.jsx` anlegen**

```jsx
import { useState, useRef, useEffect } from 'react';
import { MoreHorizontal } from 'lucide-react';

export default function MehrMenue({ eintraege }) {
  const [offen, setOffen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    function handleOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) setOffen(false);
    }
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOffen(!offen)}
        aria-label="Weitere Aktionen"
        aria-expanded={offen}
        className="p-2 rounded-lg text-slate-600 border border-slate-200 bg-white hover:bg-slate-50 transition-colors"
      >
        <MoreHorizontal size={16} />
      </button>

      {offen && (
        <div className="absolute top-full mt-1.5 right-0 z-50 bg-white rounded-xl shadow-xl border border-slate-100 py-1 min-w-[220px]">
          {eintraege.map(({ id, label, icon: Icon, onClick, disabled, trennerDavor }) => (
            <div key={id}>
              {trennerDavor && <div className="my-1 h-px bg-slate-100" />}
              <button
                onClick={() => { setOffen(false); onClick(); }}
                disabled={disabled}
                className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm text-slate-700 hover:bg-slate-50 disabled:opacity-40 transition-colors text-left"
              >
                <Icon size={15} className="text-slate-400 flex-shrink-0" />
                {label}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 6: `EditorTopbar.jsx` umbauen**

Die komplette Datei ersetzen durch:

```jsx
import {
  ChevronRight, Download, Save, CheckCircle2, RotateCcw, Receipt, Mail, AlertTriangle, Banknote,
} from 'lucide-react';
import StatusDropdown from '../../components/StatusDropdown';
import MehrMenue from './MehrMenue';
import { zusatzAktionen } from '../../utils/editorAktionen';

const KNOPF = 'flex items-center gap-2 px-4 py-1.5 text-sm font-semibold rounded-lg transition-all';

const ZUSATZ = {
  mail:        { icon: Mail,          stil: 'text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 hover:border-slate-300' },
  rechnung:    { icon: Receipt,       stil: 'text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60', pdf: true },
  rechnungPdf: { icon: Download,      stil: 'text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60', pdf: true },
  mahnung:     { icon: AlertTriangle, stil: 'text-white bg-red-600 hover:bg-red-700 disabled:opacity-60', pdf: true },
  bezahlt:     { icon: Banknote,      stil: 'text-teal-700 bg-teal-50 border border-teal-200 hover:bg-teal-100' },
};

const ANSICHTEN = [
  { id: 'bearbeiten', label: 'Bearbeiten' },
  { id: 'vorschau',   label: 'Vorschau' },
];

export default function EditorTopbar({
  titel, meta, isNeu, kundeEmail, pdfLoading, savedHint, ungespeichert,
  onZurueck, onStatusChange, onReset, onSpeichern, onAngebotPDF, onMail,
  onRechnungErstellen, onRechnungPDF, onMahnung, onBezahlt,
  ansicht, onAnsicht,
}) {
  const { status, rechnungsNr, mahnStufe } = meta;
  const handler = { mail: onMail, rechnung: onRechnungErstellen, rechnungPdf: onRechnungPDF, mahnung: onMahnung, bezahlt: onBezahlt };
  const aktionen = zusatzAktionen({ status, rechnungsNr, mahnStufe, kundeEmail }).map(a => ({
    ...a,
    ...ZUSATZ[a.id],
    onClick: handler[a.id],
    disabled: ZUSATZ[a.id].pdf && pdfLoading,
  }));
  const menuEintraege = [
    ...aktionen,
    { id: 'reset', label: 'Zurücksetzen', icon: RotateCcw, onClick: onReset, trennerDavor: aktionen.length > 0 },
  ];

  return (
    <div className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-sm">
      <div className="px-4 md:px-8 py-2 lg:py-0 lg:h-14 flex flex-col lg:flex-row lg:items-center justify-between gap-2 lg:gap-4">
        {/* Breadcrumb, auf schmalen Bildschirmen mit Status */}
        <div className="flex items-center gap-2 text-sm min-w-0">
          <button onClick={onZurueck} className="text-slate-400 hover:text-indigo-600 font-medium transition-colors">
            Angebote
          </button>
          <ChevronRight size={14} className="text-slate-300 flex-shrink-0" />
          <span className="font-semibold text-slate-800 truncate">{titel}</span>
          <div className="ml-auto lg:hidden">
            <StatusDropdown status={status} onChange={onStatusChange} rechts />
          </div>
        </div>

        {/* Aktionen */}
        <div className="flex items-center gap-2 lg:gap-3">
          <div className="hidden lg:block">
            <StatusDropdown status={status} onChange={onStatusChange} />
          </div>

          <button onClick={onReset} className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 text-sm text-slate-500 hover:bg-slate-100 rounded-lg transition-colors">
            <RotateCcw size={14} />
            Zurücksetzen
          </button>

          {ungespeichert && !savedHint && (
            <span className="hidden lg:flex items-center gap-1.5 text-xs font-medium text-amber-600 whitespace-nowrap">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
              Nicht gespeichert
            </span>
          )}

          <button
            onClick={onSpeichern}
            className={`${KNOPF} relative
              ${savedHint
                ? 'bg-emerald-500 text-white'
                : isNeu ? 'bg-slate-800 text-white hover:bg-slate-900' : 'bg-amber-500 text-white hover:bg-amber-600'
              }`}
          >
            {savedHint ? <CheckCircle2 size={14} /> : <Save size={14} />}
            {savedHint ? 'Gespeichert!' : isNeu ? 'Speichern' : 'Aktualisieren'}
            {ungespeichert && !savedHint && (
              <span className="lg:hidden absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-amber-400 ring-2 ring-white" aria-label="Nicht gespeichert" />
            )}
          </button>

          <button
            onClick={onAngebotPDF}
            disabled={pdfLoading}
            className={`${KNOPF} text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60`}
          >
            <Download size={14} />
            {pdfLoading ? 'Erstelle…' : 'Angebot PDF'}
          </button>

          <div className="hidden lg:contents">
            {aktionen.map(({ id, label, icon: Icon, stil, onClick, disabled }) => (
              <button
                key={id}
                onClick={onClick}
                disabled={disabled}
                className={`${KNOPF} ${stil}`}
                title={id === 'mail' ? `An ${kundeEmail} senden` : undefined}
              >
                <Icon size={14} />
                {label}
              </button>
            ))}
          </div>

          <div className="ml-auto lg:hidden">
            <MehrMenue eintraege={menuEintraege} />
          </div>
        </div>
      </div>

      {/* Umschalter Bearbeiten/Vorschau unter lg */}
      <div className="lg:hidden px-4 md:px-8 pb-2">
        <div className="flex gap-1 bg-slate-100 rounded-lg p-1">
          {ANSICHTEN.map(({ id, label }) => (
            <button
              key={id}
              onClick={() => onAnsicht(id)}
              aria-pressed={ansicht === id}
              className={`flex-1 px-3 py-1.5 text-sm font-medium rounded-md transition-all ${
                ansicht === id ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
```

Hinweis zur Desktop-Gleichheit: Ab `lg` entspricht das DOM dem bisherigen – der Status sitzt in einer `block`-Hülle, die Zusatz-Buttons in einer `contents`-Hülle (nimmt am Flex-Layout teil wie bisher), Reihenfolge und Klassen unverändert. Der Breadcrumb übernimmt die Rolle „Zurück“ aus der Spec (bestehendes Element, kein neuer Pfeil).

- [ ] **Step 7: `AngebotEditor.jsx` – Props vorläufig durchreichen**

```jsx
  const [ansicht, setAnsicht] = useState('bearbeiten');
```

(bei den anderen `useState`) und an `<EditorTopbar … ansicht={ansicht} onAnsicht={setAnsicht} />`. Die Wirkung auf das Layout folgt in Task 6.

- [ ] **Step 8: Lint, Test, Build, Browser**

Run: `npm run lint && npm test && npm run build` → keine Fehler.
Browser:
- 1440×900 Editor A und B: Screenshot gleich `vorher` (Button-Reihenfolge, Farben, „Nicht gespeichert“ nach einer Änderung).
- 390×844 und 360×740 Editor B (offene Rechnung): zwei Zeilen, nichts läuft über; ⋯ öffnet Menü vollständig im Bild mit „RE-…“, „Mahnung erstellen“, „Als bezahlt markieren“, Trenner, „Zurücksetzen“; „Mahnung erstellen“ öffnet das Mahnungs-Modal; Status-Dropdown oben rechts vollständig sichtbar.
- Editor A: ⋯ enthält „Per Mail senden“ und „Zurücksetzen“. Nach einer Änderung hat der Speichern-Button einen Punkt.

- [ ] **Step 9: Commit**

```bash
git add src/utils/editorAktionen.js src/utils/editorAktionen.test.js src/features/angebot-editor/MehrMenue.jsx src/features/angebot-editor/EditorTopbar.jsx src/features/angebot-editor/AngebotEditor.jsx
git commit -m "feat(ui): Editor-Topbar mit Mehr-Menü auf schmalen Bildschirmen

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 6: Umschalter Bearbeiten/Vorschau, Vorschau, Abstände

**Files:**
- Modify: `src/features/angebot-editor/AngebotEditor.jsx`
- Modify: `src/features/angebot-editor/PreviewPanel.jsx`
- Modify: `src/features/angebot-editor/abschnitte/AngebotInfos.jsx`

**Interfaces:**
- Consumes: `ansicht`, `setAnsicht` aus Task 5 Step 7.

Entscheidung aus der Spec („versteckt oder nicht gerendert“): **per CSS verstecken**. Die Vorschau misst ihre Breite mit `ResizeObserver`; der meldet beim Wechsel von `display:none` auf sichtbar die neue Breite, die Skala wird also neu berechnet. Ab `lg` muss die Vorschau ohnehin immer gerendert sein – ein JS-Media-Query entfällt so. Step 5 prüft das.

- [ ] **Step 1: `AngebotEditor.jsx` – Layout**

- Fehler- und Hinweisbalken: jeweils `px-8` → `px-4 md:px-8`.
- `<div className="max-w-7xl mx-auto px-8 py-6">` → `<div className="max-w-7xl mx-auto px-4 md:px-8 py-4 md:py-6">`
- Formular-Spalte und Vorschau:

```jsx
          <div className={`${ansicht === 'vorschau' ? 'hidden lg:flex' : 'flex'} flex-col gap-5`}>
```

```jsx
          <div className={ansicht === 'bearbeiten' ? 'hidden lg:block' : ''}><PreviewPanel data={data} /></div>
```

- [ ] **Step 2: `PreviewPanel.jsx`**

Container:

```jsx
    <div
      className="rounded-2xl shadow-sm border border-slate-100 overflow-hidden lg:sticky"
      style={{ top: '80px', backgroundColor: '#fff' }}
    >
```

Scroll-Hülle (Inline-`maxHeight` entfernen):

```jsx
      <div ref={huelleRef} className="overflow-y-auto overflow-x-hidden lg:max-h-[calc(100vh-260px)]">
        <div className="mx-auto" style={{ width: SEITENBREITE, zoom: skala }}>
```

- [ ] **Step 3: `AngebotInfos.jsx`**

`grid grid-cols-2 min-[1400px]:grid-cols-4 gap-4` → `grid grid-cols-1 sm:grid-cols-2 min-[1400px]:grid-cols-4 gap-4`

- [ ] **Step 4: Lint und Build**

Run: `npm run lint && npm run build` → keine Fehler.

- [ ] **Step 5: Browser**
  - 1440×900 Editor A: Vorschau rechts, sticky beim Scrollen, eigene Scrollbar – gleich `vorher`.
  - 924×1480 Editor A: nur Formular; „Vorschau“ → beide Seiten der Vorschau über die Breite (Blatt zentriert, max. 540 px), Summen unten; zurück zu „Bearbeiten“ → Formular, Eingaben unverändert. **Viermal hin und her**, dann Viewport auf 1480×924 und zurück auf 924×1480: Vorschau-Blatt weder leer noch abgeschnitten (`browser_evaluate`: Breite von `[style*="zoom"]` > 0).
  - 390×844 und 360×740: Vorschau auf Handybreite verkleinert, nicht abgeschnitten; Angebots-Informationen einspaltig.

- [ ] **Step 6: Commit**

```bash
git add src/features/angebot-editor/AngebotEditor.jsx src/features/angebot-editor/PreviewPanel.jsx src/features/angebot-editor/abschnitte/AngebotInfos.jsx
git commit -m "feat(ui): Umschalter Bearbeiten/Vorschau im Editor unter 1024 px

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 7: Positionen auf Handy und Touch, Modals

**Files:**
- Modify: `tailwind.config.js`
- Modify: `src/features/angebot-editor/PositionenTabelle.jsx`
- Modify: `src/features/angebot-editor/RechnungModal.jsx`
- Modify: `src/features/angebot-editor/MahnungModal.jsx`

- [ ] **Step 1: Tailwind-Variante `touch:`**

`tailwind.config.js`:

```js
  plugins: [
    // Geräte, deren Hauptzeiger ein Finger ist (Tablet, Handy)
    function ({ addVariant }) {
      addVariant('touch', '@media (pointer: coarse)');
    },
  ],
```

- [ ] **Step 2: Raster der Positionszeile**

Zeilen-`div` (bisher `grid grid-cols-[28px_minmax(0,1fr)_auto_36px] gap-2 items-start …`):

```jsx
              className={`grid grid-cols-[28px_minmax(0,1fr)_36px] sm:grid-cols-[28px_minmax(0,1fr)_auto_36px] gap-2 items-start
                bg-slate-50 rounded-xl p-2 hover:bg-indigo-50/40 transition-colors group
                ${ziehtVon === i ? 'opacity-40' : ''} ${linie}`}
```

Pfeil-Spalte: `<div className="flex flex-col items-center text-slate-300 group-hover:text-slate-400">` → `<div className="row-span-2 sm:row-span-1 flex flex-col items-center text-slate-300 group-hover:text-slate-400">`

Beide Pfeil-Buttons: Klasse um `touch:p-1.5` ergänzen:

```jsx
                  className="rounded touch:p-1.5 hover:text-indigo-500 disabled:opacity-20 disabled:cursor-not-allowed"
```

Griff (`draggable`-div): Klasse um `touch:hidden` ergänzen:

```jsx
                  className="cursor-grab active:cursor-grabbing py-0.5 hover:text-indigo-500 touch:hidden"
```

Gesamt-Spalte:

```jsx
              <div className="col-start-2 row-start-2 sm:col-start-auto sm:row-start-auto flex sm:flex-col items-baseline sm:items-end justify-end gap-2 sm:gap-0 sm:pt-2 sm:pl-2 whitespace-nowrap">
```

Löschen-Spalte: `<div className="flex items-center justify-center h-9">` → `<div className="col-start-3 row-start-1 sm:col-start-auto sm:row-start-auto flex items-center justify-center h-9">`

- [ ] **Step 3: Zifferntastatur**

Bei den drei Zahlenfeldern (Menge, EK-Preis, Aufschlag) `inputMode="decimal"` ergänzen, z. B.:

```jsx
                    <Input
                      type="number"
                      inputMode="decimal"
                      min="0"
```

(`Input` reicht zusätzliche Props per `...props` durch.)

- [ ] **Step 4: Modals**

`RechnungModal.jsx`: `relative bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden` → `relative bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 max-h-[90dvh] overflow-y-auto`

`MahnungModal.jsx`: `relative bg-white rounded-2xl shadow-2xl w-full max-w-xl mx-4 overflow-hidden` → `relative bg-white rounded-2xl shadow-2xl w-full max-w-xl mx-4 max-h-[90dvh] overflow-y-auto`

`KatalogPicker.jsx` hat bereits `max-h-[80vh]` und Flex-Scroll – unverändert.

- [ ] **Step 5: Lint, Build, Browser**

Run: `npm run lint && npm run build` → keine Fehler.
Browser:
- 1440×900 Editor A: Positionen gleich `vorher` (Griff sichtbar, Gesamt rechts).
- 390×844 und 360×740 Editor A: Bezeichnung volle Breite, Gesamt unter den Zahlenfeldern rechtsbündig, Löschen oben rechts, kein horizontaler Scroll.
- Touch simulieren: `browser_emulate_media` kann `pointer` nicht setzen → stattdessen `browser_evaluate` prüfen, dass die generierte CSS-Regel existiert: `[...document.styleSheets].some(s => [...s.cssRules].some(r => r.conditionText === '(pointer: coarse)'))` → `true`. Echte Touch-Prüfung macht der User auf dem Tablet (Task 10).
- Pfeil ↓ bei Position 1 → Reihenfolge in Formular und Vorschau getauscht.
- 360×740 Rechnung-Modal (Angebot mit Status angenommen ohne Rechnung – dafür Angebot C auf „Angenommen“ setzen) und Mahnung-Modal (Angebot B): beide Buttons unten per Scrollen erreichbar; Mahnung-Modal abbrechen.

- [ ] **Step 6: Commit**

```bash
git add tailwind.config.js src/features/angebot-editor/PositionenTabelle.jsx src/features/angebot-editor/RechnungModal.jsx src/features/angebot-editor/MahnungModal.jsx
git commit -m "feat(ui): Positionen und Dialoge auf Handy und Touch-Geräten

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 8: Dashboard

**Files:**
- Modify: `src/views/Dashboard.jsx`

- [ ] **Step 1: Topbar und Inhalt**

- `<div className="px-8 h-14 flex items-center justify-between">` → `<div className="px-4 md:px-8 h-14 flex items-center justify-between gap-3">`
- Datum: `<span className="text-xs text-slate-400 ml-3">{heute}</span>` → `<span className="hidden sm:inline text-xs text-slate-400 ml-3">{heute}</span>`
- `<div className="max-w-7xl mx-auto px-8 py-6 flex flex-col gap-6">` → `<div className="max-w-7xl mx-auto px-4 md:px-8 py-4 md:py-6 flex flex-col gap-4 md:gap-6">`

- [ ] **Step 2: „Letzte Aktivitäten“ als Karten**

`<table className="w-full">` → `<table className="w-full hidden md:table">`, davor im selben Zweig (Fragment):

```jsx
            <ul className="md:hidden divide-y divide-slate-100">
              {letzte.map(a => (
                <li
                  key={a.id}
                  onClick={() => navigate('angebot-editor', { angebotId: a.id })}
                  className="px-4 py-3 flex flex-col gap-1 cursor-pointer active:bg-slate-50"
                >
                  <div className="flex items-baseline justify-between gap-3">
                    <span className="text-sm font-semibold text-indigo-600">
                      {a.angebotNr}
                      {a.rechnungsNr && <span className="ml-2 text-xs font-normal text-slate-400">{a.rechnungsNr}</span>}
                    </span>
                    <span className="text-sm font-semibold text-slate-800 tabular-nums whitespace-nowrap">{formatBetrag(a.brutto)} €</span>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm text-slate-600 truncate">{a.kundeDisplay || '—'}</span>
                    <StatusBadge status={a.status || 'entwurf'} />
                  </div>
                </li>
              ))}
            </ul>
```

- [ ] **Step 3: Lint, Build, Browser – Kennzahl-Karten entscheiden**

Run: `npm run lint && npm run build` → keine Fehler.
Browser 360×740: Screenshot. Wenn ein Betrag in den Kennzahl-Karten umbricht oder über den Kartenrand läuft, `grid grid-cols-2 xl:grid-cols-4 gap-4` → `grid grid-cols-1 min-[400px]:grid-cols-2 xl:grid-cols-4 gap-4` und erneut prüfen; sonst unverändert lassen. Ergebnis im Commit-Text nennen.
390×844: Karten „Letzte Aktivitäten“, Tippen öffnet Editor, kein horizontaler Scroll. 1440×900: gleich `vorher`.

- [ ] **Step 4: Commit**

```bash
git add src/views/Dashboard.jsx
git commit -m "feat(ui): Dashboard für Handy und Tablet

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 9: Einstellungen

**Files:**
- Modify: `src/features/einstellungen/Einstellungen.jsx`
- Modify: `src/features/einstellungen/FirmaTab.jsx`, `TexteTab.jsx`, `EmailTab.jsx`, `BenutzerVerwaltung.jsx`, `AutomatischeSicherung.jsx`, `KatalogTab.jsx`

- [ ] **Step 1: Topbar flach und umbrechend**

In `Einstellungen.jsx` den Topbar-Inhalt (`<div className="px-8 h-14 …">` bis zu dessen schließendem `</div>`) ersetzen. Titel, Tabs und Status werden Geschwister; auf schmalen Bildschirmen stehen Titel und Status oben, die Tabs darunter (`order-last`); ab `lg` wie heute nebeneinander, Status rechts (`ml-auto` statt `justify-between`):

```jsx
        <div className="px-4 md:px-8 py-2 lg:py-0 lg:h-14 flex flex-wrap lg:flex-nowrap items-center gap-x-4 gap-y-2">
          <div className="flex items-center gap-3">
            <Settings2 size={18} className="text-indigo-500" />
            <h1 className="text-base font-bold text-slate-800">Einstellungen</h1>
          </div>
          {/* Tabs */}
          <div className="order-last lg:order-none w-full lg:w-auto overflow-x-auto">
            <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-1 w-max">
              {TABS.filter(t => !t.adminOnly || istAdmin).map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => setTab(id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-md whitespace-nowrap transition-all ${
                    tab === id
                      ? 'bg-white text-slate-800 shadow-sm'
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  <Icon size={14} />
                  {label}
                </button>
              ))}
            </div>
          </div>
          <div className="ml-auto">
            {speicherFehler ? (
              <span className="flex items-center gap-1.5 text-xs text-red-600 font-medium">
                <AlertCircle size={13} />
                Nicht gespeichert: {speicherFehler}
              </span>
            ) : (
              <span className={`flex items-center gap-1.5 text-xs text-emerald-600 font-medium transition-opacity duration-500 ${saved ? 'opacity-100' : 'opacity-0'}`}>
                <CheckCircle2 size={13} />
                Gespeichert
              </span>
            )}
          </div>
        </div>
```

- [ ] **Step 2: Spalten per Klasse**

```jsx
      <div className="max-w-6xl mx-auto px-4 md:px-8 py-4 md:py-6">
        <div className={`grid gap-6 grid-cols-1 ${mitVorschau ? 'lg:grid-cols-[minmax(0,1fr)_340px]' : ''}`}>
```

mit, direkt vor dem `return` der Komponente:

```jsx
  const mitVorschau = !['katalog', 'benutzer', 'email'].includes(tab);
```

und unten `{!['katalog', 'benutzer', 'email'].includes(tab) && <FirmenPreview …/>}` → `{mitVorschau && <FirmenPreview firma={firma} fokus={tab} />}`.

- [ ] **Step 3: Formulare einspaltig unter `sm`**

Jeweils `grid grid-cols-2` → `grid grid-cols-1 sm:grid-cols-2` in:
- `FirmaTab.jsx` Zeilen 65 und 97
- `TexteTab.jsx` Zeile 8
- `EmailTab.jsx` Zeile 41
- `BenutzerVerwaltung.jsx` Zeile 209

`AutomatischeSicherung.jsx` Zeile 61: `grid grid-cols-4 gap-3` → `grid grid-cols-2 sm:grid-cols-4 gap-3`

- [ ] **Step 4: Katalog horizontal scrollbar**

In `KatalogTab.jsx` den Tabellen-Kopf (`<div className="grid grid-cols-[1fr_160px_90px_110px_40px] … mb-2">…</div>`) und die folgende Liste (`<div className="flex flex-col gap-1.5">…</div>`) gemeinsam umschließen:

```jsx
      <div className="overflow-x-auto">
        <div className="min-w-[560px]">
          {/* Tabellen-Header */}
          …bestehender Kopf…
          …bestehende Liste…
        </div>
      </div>
```

Der Button „Neue Leistung“ bleibt außerhalb.

- [ ] **Step 5: Lint, Build, Browser**

Run: `npm run lint && npm run build` → keine Fehler.
Browser:
- 1440×900: alle Tabs gleich `vorher` (Tabs neben dem Titel, „Gespeichert“ rechts, Vorschau-Spalte bei Firma/Texte).
- 924×1480 und 390×844: Titel oben, Tabs darunter und seitlich wischbar, Firmen-Vorschau unter den Feldern, Formulare auf dem Handy einspaltig, Katalog seitlich scrollbar, sonst kein horizontaler Scroll. Ein Feld in den Firmendaten ändern → „Gespeichert“ erscheint oben rechts.

- [ ] **Step 6: Commit**

```bash
git add src/features/einstellungen
git commit -m "feat(ui): Einstellungen für Handy und Tablet

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 10: Anmeldeseiten, Gesamtprüfung, Abschluss

**Files:**
- Modify: `src/features/auth/LoginScreen.jsx`, `SetupScreen.jsx`, `InviteScreen.jsx`, `ChangePasswordModal.jsx`, `LadeFehler.jsx`

- [ ] **Step 1: Anmeldeseiten prüfen und anpassen**

Browser 360×740: Login-Seite. Die Karte hat `w-80` (320 px); der äußere Container hat keinen Seitenabstand. In allen fünf Dateien den äußeren Container `min-h-screen bg-[#0f172a] flex items-center justify-center` → `min-h-dvh bg-[#0f172a] flex items-center justify-center px-4` und bei der Karte `w-80` → `w-80 max-w-full` (Login, Setup, Invite, ChangePasswordModal) bzw. `w-96` → `w-96 max-w-full` (LadeFehler). Prüfen: Login bei 360×740 mit Rand, bei 1440×900 gleich `vorher`.

- [ ] **Step 2: Vollständige Prüfung**

Run: `npm run lint && npm test && npm run build`
Expected: alles grün.

- [ ] **Step 3: Screenshot-Satz** nach `screens/nachher/` in allen fünf Viewports: Dashboard, Angebote, Rechnungen, Kunden (+ Detail), Editor A (Bearbeiten, Vorschau, Mehr-Menü offen), Editor B, Einstellungen (alle Tabs), Login. Desktop 1440×900 und 1480×924 jeweils mit `vorher` vergleichen. In jedem Viewport per `browser_evaluate` für `main`: `scrollWidth <= clientWidth` (Katalog-Tab ausgenommen).

- [ ] **Step 4: Abläufe nochmal am Stück** (390×844): Menü → Angebote → Karte → Editor → Betreff ändern → Menü → Dashboard → Dialog abbrechen → Speichern → Mehr-Menü → Zurücksetzen (Dialog abbrechen) → Vorschau → Bearbeiten → Menü → Abmelden.

- [ ] **Step 5: Commit**

```bash
git add src/features/auth
git commit -m "feat(ui): Anmeldeseiten mit Seitenabstand auf dem Handy

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

- [ ] **Step 6: Übergabe an den User**
  - Zusammenfassung im Antwortformat der Projektregeln (geändert / Dateien / Checks / offene Punkte).
  - Hinweis: Merge nach `master`, Image-Build und Push erst nach Freigabe (Befehle in `../CLAUDE.md`).
  - User testet auf Galaxy Tab S10 Ultra (hochkant und quer) und Handy, jeweils über LAN-IP und Cloudflare – insbesondere Pfeile ↑↓ in den Positionen per Finger und dass der Drag-Griff dort ausgeblendet ist.
  - Nach Abnahme: To-Do 29 in `../To-Dos.txt` als erledigt markieren (Datei liegt außerhalb des Repos, nur nach Go).
