const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const os = require('os');
const express = require('express');

const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'data-route-test-'));
process.env.DATA_DIR = tmpDir;
delete process.env.JWT_SECRET;

const users = require('../stores/users');
const { makeToken } = require('../middleware/auth');

let server;
let basis;
let adminToken;
let userToken;

before(async () => {
  const app = express();
  app.use(express.json());
  app.use('/api/data', require('./data'));
  await new Promise(resolve => { server = app.listen(0, resolve); });
  basis = `http://127.0.0.1:${server.address().port}`;
  adminToken = makeToken(await users.createUser({ username: 'chef', role: 'admin' }));
  userToken = makeToken(await users.createUser({ username: 'mitarbeiter' }));
});

after(() => {
  server.close();
  fs.rmSync(tmpDir, { recursive: true });
});

async function put(typ, body, token) {
  const res = await fetch(`${basis}/api/data/${typ}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(body),
  });
  return res.status;
}

test('Firmendaten: nur Admins dürfen speichern', async () => {
  assert.equal(await put('firma', { name: 'Neu' }, userToken), 403);
  assert.equal(await put('firma', { name: 'Neu' }, adminToken), 200);
});

test('Kunden und Katalog: auch normale Benutzer dürfen speichern', async () => {
  assert.equal(await put('kunden', [], userToken), 200);
  assert.equal(await put('katalog', [], userToken), 200);
});

async function anfrage(method, pfad, body, token) {
  const res = await fetch(`${basis}/api/data/${pfad}`, {
    method,
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  return { status: res.status, body: await res.json() };
}

test('Einzel-Eintrag: normaler Benutzer kann Kunden anlegen, ändern und löschen', async () => {
  let antwort = await anfrage('PUT', 'kunden/k1', { id: 'k1', name: 'Anna' }, userToken);
  assert.equal(antwort.status, 200);
  assert.deepEqual(antwort.body, [{ id: 'k1', name: 'Anna' }]);
  antwort = await anfrage('PUT', 'kunden/k1', { id: 'k1', name: 'Anna B.' }, userToken);
  assert.deepEqual(antwort.body, [{ id: 'k1', name: 'Anna B.' }]);
  antwort = await anfrage('DELETE', 'kunden/k1', undefined, userToken);
  assert.equal(antwort.status, 200);
  assert.deepEqual(antwort.body, []);
});

test('Einzel-Eintrag: Firmendaten und ungültige Einträge werden abgelehnt', async () => {
  assert.equal((await anfrage('PUT', 'firma/x', {}, adminToken)).status, 400);
  assert.equal((await anfrage('PUT', 'katalog/a', { id: 'b' }, userToken)).status, 400);
  assert.equal((await anfrage('PUT', 'katalog/a', [1, 2], userToken)).status, 400);
});
