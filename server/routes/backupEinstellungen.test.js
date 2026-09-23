const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const os = require('os');
const express = require('express');

const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'backup-route-test-'));
process.env.DATA_DIR = tmpDir;
delete process.env.JWT_SECRET;

const users = require('../stores/users');
const { makeToken } = require('../middleware/auth');
const { readConfig } = require('../config');

let server;
let basis;
let adminToken;
let userToken;

before(async () => {
  const app = express();
  app.use(express.json());
  app.use('/api/config/backup', require('./backupEinstellungen'));
  app.use('/api/backup', require('./backup'));
  await new Promise(resolve => { server = app.listen(0, resolve); });
  basis = `http://127.0.0.1:${server.address().port}`;
  adminToken = makeToken(await users.createUser({ username: 'chef', role: 'admin' }));
  userToken = makeToken(await users.createUser({ username: 'mitarbeiter' }));
});

after(() => {
  server.close();
  fs.rmSync(tmpDir, { recursive: true });
});

async function anfrage(method, pfad, body, token) {
  const res = await fetch(basis + pfad, {
    method,
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  return { status: res.status, body: await res.json() };
}

test('GET liefert Standardwerte und Status', async () => {
  const { status, body } = await anfrage('GET', '/api/config/backup', undefined, adminToken);
  assert.equal(status, 200);
  assert.equal(body.haeufigkeit, 'taeglich');
  assert.equal(body.uhrzeit, '02:00');
  assert.equal(body.behalten, 14);
  assert.deepEqual(body.status, { letzte: null, anzahl: 0 });
});

test('POST speichert gültige Einstellungen in config.json, ohne andere Werte zu verlieren', async () => {
  fs.writeFileSync(path.join(tmpDir, 'config.json'), JSON.stringify({ ...readConfig(), smtp: { host: 'mail.test' } }));
  const einstellungen = { haeufigkeit: 'woechentlich', uhrzeit: '03:15', wochentag: 5, behalten: 8 };
  const { status } = await anfrage('POST', '/api/config/backup', einstellungen, adminToken);
  assert.equal(status, 200);
  assert.deepEqual(readConfig().backup, einstellungen);
  assert.equal(readConfig().smtp.host, 'mail.test');
});

test('POST lehnt ungültige Werte ab und lässt die Einstellungen unverändert', async () => {
  const { status } = await anfrage('POST', '/api/config/backup', { haeufigkeit: 'taeglich', uhrzeit: '25:00', wochentag: 1, behalten: 14 }, adminToken);
  assert.equal(status, 400);
  assert.equal(readConfig().backup.uhrzeit, '03:15');
});

test('„Jetzt sichern“ legt eine Sicherung an und liefert den Status', async () => {
  const { status, body } = await anfrage('POST', '/api/backup/jetzt', {}, adminToken);
  assert.equal(status, 200);
  assert.match(body.datei, /^automatisch-\d{4}-\d{2}-\d{2}-\d{6}\.json$/);
  assert.equal(body.status.anzahl, 1);
});

test('normale Benutzer haben keinen Zugriff', async () => {
  assert.equal((await anfrage('GET', '/api/config/backup', undefined, userToken)).status, 403);
  assert.equal((await anfrage('POST', '/api/config/backup', {}, userToken)).status, 403);
  assert.equal((await anfrage('POST', '/api/backup/jetzt', {}, userToken)).status, 403);
});
