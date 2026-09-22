import { test } from 'node:test';
import assert from 'node:assert/strict';
import { verschiebePosition, zielIndexBeimEinfuegen, mitPositionsIds, neuePosition } from './positionen.js';

const liste = ['A', 'B', 'C', 'D'];

test('verschiebePosition: nach unten', () => {
  assert.deepEqual(verschiebePosition(liste, 0, 2), ['B', 'C', 'A', 'D']);
});

test('verschiebePosition: nach oben', () => {
  assert.deepEqual(verschiebePosition(liste, 3, 1), ['A', 'D', 'B', 'C']);
});

test('verschiebePosition: gleiche Stelle und ungültige Indizes lassen die Reihenfolge unverändert', () => {
  assert.deepEqual(verschiebePosition(liste, 1, 1), liste);
  assert.deepEqual(verschiebePosition(liste, -1, 2), liste);
  assert.deepEqual(verschiebePosition(liste, 0, 4), liste);
});

test('verschiebePosition: verändert die Ausgangsliste nicht', () => {
  const kopie = [...liste];
  verschiebePosition(liste, 0, 3);
  assert.deepEqual(liste, kopie);
});

test('zielIndexBeimEinfuegen: Einfügelücke → Endposition', () => {
  // Lücken 0..4 zwischen A|B|C|D; A (Index 0) ziehen
  assert.equal(zielIndexBeimEinfuegen(0, 0), 0); // vor A → bleibt
  assert.equal(zielIndexBeimEinfuegen(0, 1), 0); // nach A → bleibt
  assert.equal(zielIndexBeimEinfuegen(0, 3), 2); // zwischen C und D
  assert.equal(zielIndexBeimEinfuegen(0, 4), 3); // ans Ende
  // D (Index 3) ganz nach vorne
  assert.equal(zielIndexBeimEinfuegen(3, 0), 0);
});

test('mitPositionsIds: ergänzt fehlende IDs, vorhandene bleiben', () => {
  const ergebnis = mitPositionsIds([{ bezeichnung: 'x' }, { id: 'fest', bezeichnung: 'y' }]);
  assert.ok(ergebnis[0].id);
  assert.equal(ergebnis[0].bezeichnung, 'x');
  assert.equal(ergebnis[1].id, 'fest');
});

test('mitPositionsIds: ohne fehlende IDs wird dieselbe Liste zurückgegeben', () => {
  const positionen = [{ id: 'a' }, { id: 'b' }];
  assert.equal(mitPositionsIds(positionen), positionen);
});

test('neuePosition: leere Position mit eigener ID', () => {
  const a = neuePosition();
  const b = neuePosition();
  assert.notEqual(a.id, b.id);
  assert.deepEqual({ ...a, id: undefined }, {
    id: undefined, bezeichnung: '', beschreibung: '', menge: 1, einheit: 'Stk.', einzelpreis: 0, aufschlag: 0,
  });
});
