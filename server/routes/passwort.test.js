const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const os = require('os');
const express = require('express');

const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'passwort-route-test-'));
process.env.DATA_DIR = tmpDir;
delete process.env.JWT_SECRET;

const users = require('../stores/users');
const { makeToken } = require('../middleware/auth');

let server;
let basis;

before(async () => {
  const app = express();
  app.use(express.json());
  app.use('/api', require('./auth'));
  app.use('/invite', require('./einladung'));
  await new Promise(resolve => { server = app.listen(0, resolve); });
  basis = `http://127.0.0.1:${server.address().port}`;
});

after(() => {
  server.close();
  fs.rmSync(tmpDir, { recursive: true });
});

async function post(pfad, body, token) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(basis + pfad, { method: 'POST', headers, body: JSON.stringify(body) });
  return { status: res.status, body: await res.json() };
}

test('POST /api/me/password: zu kurzes Passwort gibt 400 mit Meldung', async () => {
  const user = await users.createUser({ username: 'gerda' });
  await users.setInitialPassword(user.id);
  const antwort = await post('/api/me/password', { password: 'kurz' }, makeToken(users.findById(user.id)));
  assert.equal(antwort.status, 400);
  assert.match(antwort.body.error, /mindestens 8 Zeichen/);
});

test('POST /api/me/password: gültiges Passwort liefert ein neues Token', async () => {
  const user = users.findByUsername('gerda');
  const antwort = await post('/api/me/password', { password: 'neuesgeheim' }, makeToken(user));
  assert.equal(antwort.status, 200);
  assert.ok(antwort.body.token);
  assert.equal(users.findById(user.id).mustChangePassword, false);
});

test('POST /invite/:token: zu kurzes Passwort gibt 400 statt 500', async () => {
  const user = await users.createUser({ username: 'hans' });
  const inviteToken = users.generateInviteToken(user.id);
  const antwort = await post(`/invite/${inviteToken}`, { password: 'kurz' });
  assert.equal(antwort.status, 400);
  assert.match(antwort.body.error, /mindestens 8 Zeichen/);
});
