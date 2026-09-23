const { test, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const os = require('os');

const { leseJson, schreibeJsonAtomar } = require('./jsonDatei');

const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'jsondatei-test-'));
after(() => fs.rmSync(tmpDir, { recursive: true }));

test('leseJson liefert den Standardwert, wenn die Datei fehlt', () => {
  assert.deepEqual(leseJson(path.join(tmpDir, 'fehlt.json'), []), []);
});

test('leseJson wirft bei beschädigter Datei statt den Standardwert zu liefern', () => {
  const datei = path.join(tmpDir, 'kaputt.json');
  fs.writeFileSync(datei, '[{"id": "a"');
  assert.throws(() => leseJson(datei, []), /kaputt\.json ist beschädigt/);
});

test('schreibeJsonAtomar schreibt lesbar und hinterlässt keine .tmp-Datei', () => {
  const datei = path.join(tmpDir, 'unter', 'daten.json');
  schreibeJsonAtomar(datei, { a: 1 });
  assert.deepEqual(leseJson(datei, null), { a: 1 });
  assert.equal(fs.existsSync(datei + '.tmp'), false);
});
