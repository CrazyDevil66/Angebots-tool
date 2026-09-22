import { test } from 'node:test';
import assert from 'node:assert/strict';
import { nextAngebotNr, nextRechnungsNr } from './nummern.js';

const JAHR = new Date().getFullYear();

test('nextAngebotNr: erste Nummer des Jahres', () => {
  assert.equal(nextAngebotNr([]), `A-${JAHR}-001`);
});

test('nextAngebotNr: höchste vorhandene Nummer + 1, Lücken egal', () => {
  const angebote = [
    { angebotNr: `A-${JAHR}-001` },
    { angebotNr: `A-${JAHR}-007` },
    { angebotNr: `A-${JAHR - 1}-099` },
  ];
  assert.equal(nextAngebotNr(angebote), `A-${JAHR}-008`);
});

test('nextRechnungsNr: erste Nummer des Jahres', () => {
  assert.equal(nextRechnungsNr([]), `R-${JAHR}-001`);
});

test('nextRechnungsNr: zählt vorhandene Rechnungen hoch', () => {
  const angebote = [
    { rechnungsNr: `R-${JAHR}-001` },
    { rechnungsNr: `R-${JAHR}-002` },
    { rechnungsNr: null },
    { rechnungsNr: `R-${JAHR - 1}-050` },
  ];
  assert.equal(nextRechnungsNr(angebote), `R-${JAHR}-003`);
});

test('nextRechnungsNr: ohne Argument wird ein Fehler geworfen statt R-…-001 zu raten', () => {
  assert.throws(() => nextRechnungsNr(), /Angebotsliste/);
});
