import { test } from 'node:test';
import assert from 'node:assert/strict';
import { sortiere, naechsteSortierung } from './sortierung.js';

const liste = [
  { nr: 'A-2026-010', kunde: 'Müller', betrag: 50, datum: new Date(2026, 8, 1) },
  { nr: 'A-2026-9', kunde: 'becker', betrag: 200, datum: new Date(2026, 7, 1) },
  { nr: 'A-2026-011', kunde: '', betrag: 10, datum: null },
];
const werte = { nr: a => a.nr, kunde: a => a.kunde, betrag: a => a.betrag, datum: a => a.datum };
const nrs = l => l.map(a => a.nr);

test('ohne Sortierung bleibt die Reihenfolge unverändert', () => {
  assert.equal(sortiere(liste, null, werte), liste);
});

test('Nummern werden numerisch sortiert, Texte ohne Beachtung der Groß-/Kleinschreibung', () => {
  assert.deepEqual(nrs(sortiere(liste, { feld: 'nr', richtung: 'auf' }, werte)), ['A-2026-9', 'A-2026-010', 'A-2026-011']);
  assert.deepEqual(nrs(sortiere(liste, { feld: 'kunde', richtung: 'auf' }, werte)), ['A-2026-9', 'A-2026-010', 'A-2026-011']);
});

test('Beträge und Daten in beiden Richtungen, leere Werte immer am Ende', () => {
  assert.deepEqual(nrs(sortiere(liste, { feld: 'betrag', richtung: 'ab' }, werte)), ['A-2026-9', 'A-2026-010', 'A-2026-011']);
  assert.deepEqual(nrs(sortiere(liste, { feld: 'datum', richtung: 'auf' }, werte)), ['A-2026-9', 'A-2026-010', 'A-2026-011']);
  assert.deepEqual(nrs(sortiere(liste, { feld: 'datum', richtung: 'ab' }, werte)), ['A-2026-010', 'A-2026-9', 'A-2026-011']);
});

test('naechsteSortierung: neue Spalte aufsteigend, gleiche Spalte dreht um', () => {
  assert.deepEqual(naechsteSortierung(null, 'nr'), { feld: 'nr', richtung: 'auf' });
  assert.deepEqual(naechsteSortierung({ feld: 'nr', richtung: 'auf' }, 'nr'), { feld: 'nr', richtung: 'ab' });
  assert.deepEqual(naechsteSortierung({ feld: 'nr', richtung: 'ab' }, 'betrag'), { feld: 'betrag', richtung: 'auf' });
});
