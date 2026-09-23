const { test, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const os = require('os');
const jwt = require('jsonwebtoken');

const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'auth-test-'));
process.env.DATA_DIR = tmpDir;
delete process.env.JWT_SECRET;

const users = require('../stores/users');
const { makeToken, jwtSecret, requireAuth, requireAuthOhnePasswortPflicht, requireAdmin } = require('./auth');

after(() => fs.rmSync(tmpDir, { recursive: true }));

// Führt die Middleware mit einem Bearer-Token aus und liefert Status und req.user.
function pruefe(middleware, token, user) {
  const req = { headers: { authorization: `Bearer ${token}` }, user };
  let status = 200;
  let weiter = false;
  const res = {
    status(code) { status = code; return this; },
    json() { return this; },
  };
  middleware(req, res, () => { weiter = true; });
  return { status, weiter, user: req.user };
}

async function neuerBenutzer(username, role = 'user') {
  const user = await users.createUser({ username, role });
  await users.setPassword(user.id, 'geheim123');
  return users.findById(user.id);
}

test('requireAuth lässt gültige Tokens durch und nimmt die Rolle aus users.json', async () => {
  const user = await neuerBenutzer('anna', 'admin');
  const ergebnis = pruefe(requireAuth, makeToken(user));
  assert.equal(ergebnis.weiter, true);
  assert.equal(ergebnis.user.userId, user.id);
  assert.equal(ergebnis.user.role, 'admin');
});

test('requireAuth weist Tokens gelöschter Benutzer ab', async () => {
  const user = await neuerBenutzer('bernd');
  const token = makeToken(user);
  users.deleteUser(user.id);
  const ergebnis = pruefe(requireAuth, token);
  assert.equal(ergebnis.weiter, false);
  assert.equal(ergebnis.status, 401);
});

test('herabgestufter Admin verliert sofort den Admin-Zugriff', async () => {
  const user = await neuerBenutzer('clara', 'admin');
  const token = makeToken(user);
  users.updateUser(user.id, { role: 'user' });
  const auth = pruefe(requireAuth, token);
  assert.equal(auth.weiter, true);
  const admin = pruefe(requireAdmin, token, auth.user);
  assert.equal(admin.weiter, false);
  assert.equal(admin.status, 403);
});

test('nach einem Passwort-Reset ist das alte Token ungültig, das neue gültig', async () => {
  const user = await neuerBenutzer('dieter');
  const altesToken = makeToken(user);
  await users.setInitialPassword(user.id);
  assert.equal(pruefe(requireAuth, altesToken).status, 401);
  assert.equal(pruefe(requireAuthOhnePasswortPflicht, makeToken(users.findById(user.id))).weiter, true);
});

test('Tokens ohne tokenVersion bleiben für Benutzer ohne tokenVersion gültig', async () => {
  const user = await users.createUser({ username: 'erika' });
  const altesToken = jwt.sign({ userId: user.id, username: 'erika', role: 'user' }, jwtSecret());
  assert.equal(users.findById(user.id).tokenVersion, undefined);
  assert.equal(pruefe(requireAuth, altesToken).weiter, true);
});

test('mit temporärem Passwort sind nur die Routen für den Passwortwechsel erreichbar', async () => {
  const user = await neuerBenutzer('frank');
  await users.setInitialPassword(user.id);
  const token = makeToken(users.findById(user.id));
  const normal = pruefe(requireAuth, token);
  assert.equal(normal.weiter, false);
  assert.equal(normal.status, 403);
  const wechsel = pruefe(requireAuthOhnePasswortPflicht, token);
  assert.equal(wechsel.weiter, true);
  assert.equal(wechsel.user.mustChangePassword, true);
});
