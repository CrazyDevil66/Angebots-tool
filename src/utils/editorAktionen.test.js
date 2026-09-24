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
