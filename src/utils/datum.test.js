import { test } from 'node:test';
import assert from 'node:assert/strict';
import { tageSeit } from './datum.js';

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
