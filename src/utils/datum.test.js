import { test } from 'node:test';
import assert from 'node:assert/strict';
import { tageSeit, formatDatum, heuteDE, add14Days } from './datum.js';

const JETZT = new Date(2026, 8, 23, 15, 30);

test('tageSeit zählt ganze Kalendertage unabhängig von der Uhrzeit', () => {
  assert.equal(tageSeit('23.9.2026', JETZT), 0);
  assert.equal(tageSeit('22.9.2026', JETZT), 1);
  assert.equal(tageSeit('1.9.2026', JETZT), 22);
  assert.equal(tageSeit('24.8.2026', JETZT), 30);
});

test('tageSeit über die Umstellung auf Sommerzeit rundet richtig', () => {
  assert.equal(tageSeit('28.3.2026', new Date(2026, 2, 30, 9, 0)), 2);
});

test('tageSeit liefert null bei fehlendem oder ungültigem Datum', () => {
  assert.equal(tageSeit('', JETZT), null);
  assert.equal(tageSeit(undefined, JETZT), null);
  assert.equal(tageSeit('23.9', JETZT), null);
});

test('formatDatum ergänzt führende Nullen und lässt Ungültiges unverändert', () => {
  assert.equal(formatDatum('1.9.2026'), '01.09.2026');
  assert.equal(formatDatum('18.09.2026'), '18.09.2026');
  assert.equal(formatDatum(''), '');
  assert.equal(formatDatum(undefined), '');
  assert.equal(formatDatum('irgendwas'), 'irgendwas');
});

test('heuteDE und add14Days liefern TT.MM.JJJJ mit führenden Nullen', () => {
  assert.match(heuteDE(), /^\d{2}\.\d{2}\.\d{4}$/);
  assert.equal(add14Days('20.8.2026'), '03.09.2026');
  assert.equal(add14Days('25.12.2026'), '08.01.2027');
});
