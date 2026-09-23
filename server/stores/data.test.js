const { test, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const os = require('os');

const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'data-test-'));
process.env.DATA_DIR = tmpDir;

const { readData, writeData, speichereEintrag, loescheEintrag, VALID_TYPES } = require('./data');

after(() => fs.rmSync(tmpDir, { recursive: true }));

test('readData wirft bei ungültigem Typ', () => {
  assert.throws(() => readData('xyz'), /Ungültiger/);
});

test('writeData wirft bei ungültigem Typ', () => {
  assert.throws(() => writeData('xyz', []), /Ungültiger/);
});

test('firma: Default null', () => {
  assert.equal(readData('firma'), null);
});

test('kunden: Default []', () => {
  assert.deepEqual(readData('kunden'), []);
});

test('angebote ist kein gültiger Typ mehr', () => {
  assert.throws(() => readData('angebote'), /Ungültiger/);
});

test('katalog: Default []', () => {
  assert.deepEqual(readData('katalog'), []);
});

test('writeData und readData runden-trip für firma', () => {
  writeData('firma', { name: 'Test GmbH' });
  assert.deepEqual(readData('firma'), { name: 'Test GmbH' });
});

test('writeData und readData runden-trip für kunden', () => {
  writeData('kunden', [{ id: '1', name: 'Kunde A' }]);
  assert.deepEqual(readData('kunden'), [{ id: '1', name: 'Kunde A' }]);
});

test('VALID_TYPES enthält 3 Typen (firma, kunden, katalog)', () => {
  assert.ok(VALID_TYPES.has('firma'));
  assert.ok(VALID_TYPES.has('kunden'));
  assert.ok(VALID_TYPES.has('katalog'));
  assert.equal(VALID_TYPES.size, 3);
});

test('writeData: falscher Datentyp wird mit 400 abgelehnt, bestehende Datei bleibt', () => {
  writeData('kunden', [{ id: 'k1' }]);
  for (const falsch of [{ id: 'k1' }, 'text', 42, null]) {
    assert.throws(() => writeData('kunden', falsch), e => e.status === 400, JSON.stringify(falsch));
  }
  assert.throws(() => writeData('katalog', {}), e => e.status === 400);
  assert.deepEqual(readData('kunden'), [{ id: 'k1' }]);
});

test('writeData: firma darf Objekt oder null sein, aber kein Array oder Text', () => {
  writeData('firma', { name: 'X' });
  writeData('firma', null);
  assert.throws(() => writeData('firma', []), e => e.status === 400);
  assert.throws(() => writeData('firma', 'X'), e => e.status === 400);
});

test('speichereEintrag legt an, ändert und lässt andere Einträge unberührt', () => {
  writeData('kunden', [{ id: 'k1', name: 'Alt' }, { id: 'k2', name: 'Zwei' }]);
  speichereEintrag('kunden', 'k1', { id: 'k1', name: 'Neu' });
  speichereEintrag('kunden', 'k3', { name: 'Drei' });
  assert.deepEqual(readData('kunden'), [
    { id: 'k1', name: 'Neu' },
    { id: 'k2', name: 'Zwei' },
    { id: 'k3', name: 'Drei' },
  ]);
});

test('zwei Änderungen an verschiedenen Einträgen gehen beide nicht verloren', () => {
  writeData('katalog', [{ id: 'a', preis: 1 }, { id: 'b', preis: 2 }]);
  // Beide Nutzer haben die Liste im Stand vor der jeweils anderen Änderung
  speichereEintrag('katalog', 'a', { id: 'a', preis: 10 });
  speichereEintrag('katalog', 'b', { id: 'b', preis: 20 });
  assert.deepEqual(readData('katalog'), [{ id: 'a', preis: 10 }, { id: 'b', preis: 20 }]);
});

test('loescheEintrag entfernt nur den Eintrag und ist bei fehlendem Eintrag kein Fehler', () => {
  writeData('kunden', [{ id: 'k1' }, { id: 'k2' }]);
  assert.deepEqual(loescheEintrag('kunden', 'k1'), [{ id: 'k2' }]);
  assert.deepEqual(loescheEintrag('kunden', 'k1'), [{ id: 'k2' }]);
});

test('speichereEintrag prüft Typ, ID und Eintrag', () => {
  const status400 = e => e.status === 400;
  assert.throws(() => speichereEintrag('firma', 'x', {}), status400);
  assert.throws(() => speichereEintrag('kunden', 'x'.repeat(101), {}), status400);
  assert.throws(() => speichereEintrag('kunden', 'x', []), status400);
  assert.throws(() => speichereEintrag('kunden', 'x', null), status400);
  assert.throws(() => speichereEintrag('kunden', 'x', { id: 'y' }), status400);
});
