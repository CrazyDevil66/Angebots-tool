import { test } from 'node:test';
import assert from 'node:assert/strict';
import { erstelleVerlauf } from './verlauf.js';

// Browserverlauf wie im Browser: pushState/replaceState sofort, go() erst mit dem nächsten popstate.
function browser({ erlauben = () => true } = {}) {
  const b = {
    eintraege: [{ state: null }],
    index: 0,
    geplant: [],
    angezeigt: [],
  };
  b.history = {
    pushState(state) {
      b.eintraege.splice(b.index + 1, Infinity, { state });
      b.index++;
    },
    replaceState(state) { b.eintraege[b.index] = { state }; },
    go(delta) { b.geplant.push(delta); },
  };
  b.verlauf = erstelleVerlauf({
    history: b.history,
    onNavigation: nav => {
      if (!erlauben(nav)) return false;
      b.angezeigt.push(nav.view);
      return true;
    },
  });
  // Führt ausstehende go()-Aufrufe aus, jeweils mit popstate.
  b.abarbeiten = () => {
    while (b.geplant.length > 0) {
      b.index += b.geplant.shift();
      b.verlauf.beiPopstate({ state: b.eintraege[b.index].state });
    }
  };
  b.zurueckTaste = () => { b.history.go(-1); b.abarbeiten(); };
  b.views = () => b.eintraege.slice(0, b.index + 1).map(e => (e.state?.ebene ? `${e.state.nav.view}+` : e.state?.nav.view));
  return b;
}

const nav = view => ({ view, params: {} });

test('verlauf: Zurück geht zur vorherigen Ansicht', () => {
  const b = browser();
  b.verlauf.start(nav('dashboard'));
  b.verlauf.navigiert(nav('angebote'));
  b.verlauf.navigiert({ view: 'angebot-editor', params: { angebotId: 'a1' } });
  b.zurueckTaste();
  assert.deepEqual(b.angezeigt, ['angebote']);
  b.zurueckTaste();
  assert.deepEqual(b.angezeigt, ['angebote', 'dashboard']);
});

test('verlauf: gleiche Ansicht erzeugt keinen neuen Eintrag', () => {
  const b = browser();
  b.verlauf.start(nav('dashboard'));
  b.verlauf.navigiert(nav('dashboard'));
  assert.deepEqual(b.views(), ['dashboard']);
});

test('verlauf: Zurück schließt zuerst die offene Ebene', () => {
  const b = browser();
  b.verlauf.start(nav('dashboard'));
  let menuOffen = true;
  b.verlauf.ebeneOeffnen(() => { menuOffen = false; });
  b.zurueckTaste();
  assert.equal(menuOffen, false);
  assert.deepEqual(b.angezeigt, []);
  assert.deepEqual(b.views(), ['dashboard']);
});

test('verlauf: per Klick geschlossene Ebene hinterlässt keinen Eintrag', () => {
  const b = browser();
  b.verlauf.start(nav('dashboard'));
  b.verlauf.navigiert(nav('kunden'));
  const abmelden = b.verlauf.ebeneOeffnen(() => {});
  abmelden();
  b.abarbeiten();
  assert.deepEqual(b.views(), ['dashboard', 'kunden']);
  b.zurueckTaste();
  assert.deepEqual(b.angezeigt, ['dashboard']);
});

test('verlauf: Abmelden nach Schließen per Zurück-Taste springt nicht erneut zurück', () => {
  const b = browser();
  b.verlauf.start(nav('dashboard'));
  const abmelden = b.verlauf.ebeneOeffnen(() => abmelden());
  b.zurueckTaste();
  assert.equal(b.geplant.length, 0);
  assert.deepEqual(b.views(), ['dashboard']);
});

test('verlauf: Navigation aus offener Ebene ersetzt deren Eintrag, auch vor dem Abmelden', () => {
  const b = browser();
  b.verlauf.start(nav('kunden'));
  const detail = b.verlauf.ebeneOeffnen(() => {});
  const menu = b.verlauf.ebeneOeffnen(() => {});
  // Wie im Menü: erst navigieren, das Abmelden der Ebenen folgt nach dem Rendern.
  b.verlauf.navigiert(nav('dashboard'));
  menu();
  detail();
  b.abarbeiten();
  assert.deepEqual(b.views(), ['kunden', 'dashboard']);
  b.zurueckTaste();
  assert.deepEqual(b.angezeigt, ['kunden']);
});

test('verlauf: Navigation während eines ausstehenden Rücksprungs wartet auf ihn', () => {
  const b = browser();
  b.verlauf.start(nav('dashboard'));
  const menu = b.verlauf.ebeneOeffnen(() => {});
  menu();
  b.verlauf.navigiert(nav('angebote'));
  b.abarbeiten();
  assert.deepEqual(b.views(), ['dashboard', 'angebote']);
});

test('verlauf: abgelehnter Wechsel stellt den Eintrag der aktuellen Ansicht wieder her', () => {
  const b = browser({ erlauben: v => v.view !== 'angebote' });
  b.verlauf.start(nav('angebote'));
  b.verlauf.navigiert({ view: 'angebot-editor', params: {} });
  b.zurueckTaste();
  assert.deepEqual(b.angezeigt, []);
  assert.deepEqual(b.views(), ['angebote', 'angebot-editor']);
});
