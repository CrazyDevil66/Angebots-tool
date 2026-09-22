import { test } from 'node:test';
import assert from 'node:assert/strict';
import { vkPreis, positionGesamt, berechneSummen } from './berechnung.js';

test('vkPreis: ohne Aufschlag = Einzelpreis', () => {
  assert.equal(vkPreis({ einzelpreis: 100 }), 100);
  assert.equal(vkPreis({ einzelpreis: 100, aufschlag: 0 }), 100);
});

test('vkPreis: Aufschlag in Prozent wird aufgeschlagen', () => {
  assert.equal(vkPreis({ einzelpreis: 100, aufschlag: 25 }), 125);
});

test('vkPreis: Strings aus Formularfeldern werden als Zahlen behandelt', () => {
  assert.equal(vkPreis({ einzelpreis: '80', aufschlag: '50' }), 120);
});

test('vkPreis: leere Werte ergeben 0 statt NaN', () => {
  assert.equal(vkPreis({ einzelpreis: '', aufschlag: '' }), 0);
  assert.equal(vkPreis({}), 0);
});

test('positionGesamt: Menge × VK-Preis', () => {
  assert.ok(Math.abs(positionGesamt({ menge: 3, einzelpreis: 100, aufschlag: 10 }) - 330) < 1e-9);
});

test('berechneSummen: Netto, MwSt. und Brutto inkl. Aufschlag', () => {
  const s = berechneSummen([
    { menge: 2, einzelpreis: 100, aufschlag: 0 },
    { menge: 1, einzelpreis: 200, aufschlag: 50 },
  ], 19);
  assert.equal(s.netto, 500);
  assert.equal(s.mwst, 95);
  assert.equal(s.brutto, 595);
});

test('berechneSummen: fehlende Positionen und MwSt.-Satz als String', () => {
  assert.deepEqual(berechneSummen(undefined, '19'), { netto: 0, mwst: 0, brutto: 0 });
  const s = berechneSummen([{ menge: 1, einzelpreis: 100 }], '7');
  assert.equal(s.brutto, 107);
});
