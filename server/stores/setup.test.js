const { test, beforeEach, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const os = require('os');

const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'setup-test-'));
process.env.DATA_DIR = tmpDir;

const users = require('./users');

after(() => fs.rmSync(tmpDir, { recursive: true }));

beforeEach(() => {
  fs.rmSync(path.join(tmpDir, 'users.json'), { force: true });
});

test('istEingerichtet: false ohne Benutzer, true sobald jemand ein Passwort hat', async () => {
  assert.equal(users.istEingerichtet(), false);
  await users.richteErstenAdminEin('chef', 'geheim123');
  assert.equal(users.istEingerichtet(), true);
});

test('richteErstenAdminEin: zu kurzes Passwort legt keinen Benutzer an', async () => {
  await assert.rejects(() => users.richteErstenAdminEin('chef', 'kurz'), /mindestens 8 Zeichen/);
  assert.deepEqual(users.readUsers(), []);
  assert.equal(users.istEingerichtet(), false);
});

test('richteErstenAdminEin: legt Admin mit Passwort an, Login funktioniert', async () => {
  const user = await users.richteErstenAdminEin('chef', 'geheim123');
  assert.equal(user.role, 'admin');
  assert.ok(await users.verifyPassword('chef', 'geheim123'));
});

test('richteErstenAdminEin: gesperrte Instanz (Admin ohne Passwort) wird repariert statt doppelt angelegt', async () => {
  await users.createUser({ username: 'chef', role: 'admin' });
  assert.equal(users.istEingerichtet(), false);

  const user = await users.richteErstenAdminEin('chef', 'geheim123');

  assert.equal(users.readUsers().length, 1);
  assert.equal(user.role, 'admin');
  assert.ok(await users.verifyPassword('chef', 'geheim123'));
});

test('richteErstenAdminEin: vorhandener Benutzer ohne Passwort wird zum Admin', async () => {
  await users.createUser({ username: 'anna', role: 'user' });
  const user = await users.richteErstenAdminEin('anna', 'geheim123');
  assert.equal(user.role, 'admin');
});

test('richteErstenAdminEin: nach der Einrichtung gesperrt', async () => {
  await users.richteErstenAdminEin('chef', 'geheim123');
  await assert.rejects(() => users.richteErstenAdminEin('zweiter', 'geheim123'), /Bereits eingerichtet/);
  assert.equal(users.readUsers().length, 1);
});

test('beschädigte users.json öffnet die Erstkonfiguration nicht und bleibt unverändert', async () => {
  const datei = path.join(tmpDir, 'users.json');
  fs.writeFileSync(datei, '[{"id": "a", "passwordHash": "x"');
  assert.throws(() => users.istEingerichtet(), /beschädigt/);
  await assert.rejects(() => users.richteErstenAdminEin('angreifer', 'geheim123'), /beschädigt/);
  assert.equal(fs.readFileSync(datei, 'utf8'), '[{"id": "a", "passwordHash": "x"');
});
