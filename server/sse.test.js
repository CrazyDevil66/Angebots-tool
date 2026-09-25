const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const os = require('os');
const express = require('express');

const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'sse-test-'));
process.env.DATA_DIR = tmpDir;
delete process.env.JWT_SECRET;

const users = require('./stores/users');
const { makeToken, requireAuth } = require('./middleware/auth');
const { eventsHandler, broadcastDataUpdate } = require('./sse');

let server;
let basis;
let token;

before(async () => {
  const app = express();
  app.get('/api/events', requireAuth, eventsHandler);
  await new Promise(resolve => { server = app.listen(0, resolve); });
  basis = `http://127.0.0.1:${server.address().port}`;
  const user = await users.createUser({ username: 'sse-test' });
  token = makeToken(users.findById(user.id));
});

after(() => {
  server.closeAllConnections();
  server.close();
  fs.rmSync(tmpDir, { recursive: true });
});

test('GET /api/events: Token in der URL wird nicht mehr akzeptiert', async () => {
  const res = await fetch(`${basis}/api/events?token=${encodeURIComponent(token)}`);
  assert.equal(res.status, 401);
});

test('GET /api/events: mit Authorization-Header kommen Datenänderungen an', async () => {
  const controller = new AbortController();
  const res = await fetch(`${basis}/api/events`, { headers: { Authorization: `Bearer ${token}` }, signal: controller.signal });
  assert.equal(res.status, 200);
  assert.match(res.headers.get('content-type'), /text\/event-stream/);
  const leser = res.body.pipeThrough(new TextDecoderStream()).getReader();
  assert.match((await leser.read()).value, /^retry: /);
  broadcastDataUpdate('kunden');
  assert.equal((await leser.read()).value, 'data: {"dataType":"kunden"}\n\n');
  controller.abort();
});
