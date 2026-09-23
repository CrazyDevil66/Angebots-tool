const path = require('path');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const { dataDir } = require('../paths');
const { leseJson, schreibeJsonAtomar } = require('../lib/jsonDatei');

const USERS_FILE = () => path.join(dataDir(), 'users.json');

function readUsers() {
  return leseJson(USERS_FILE(), []);
}

function writeUsers(users) {
  schreibeJsonAtomar(USERS_FILE(), users);
}

// Jeder Passwortwechsel erhöht die Version und macht damit alle älteren Tokens ungültig.
function erhoeheTokenVersion(user) {
  user.tokenVersion = (user.tokenVersion || 0) + 1;
}

function findById(id) {
  return readUsers().find(u => u.id === id) || null;
}

function findByUsername(username) {
  return readUsers().find(u => u.username === username);
}

function findByInviteToken(token) {
  return readUsers().find(u => u.inviteToken === token && u.inviteExpiry > Date.now()) || null;
}

async function createUser({ username, email = null, role = 'user' }) {
  const all = readUsers();
  if (all.find(u => u.username === username)) throw new Error('Benutzername bereits vergeben');
  const user = {
    id: crypto.randomUUID(),
    username,
    email,
    passwordHash: null,
    role,
    mustChangePassword: false,
    inviteToken: null,
    inviteExpiry: null,
    createdAt: new Date().toISOString(),
  };
  writeUsers([...all, user]);
  return user;
}

function pruefePasswort(password) {
  if (!password || password.length < 8) throw new Error('Passwort muss mindestens 8 Zeichen haben');
}

async function setPassword(id, password) {
  pruefePasswort(password);
  const all = readUsers();
  const idx = all.findIndex(u => u.id === id);
  if (idx === -1) throw new Error('Benutzer nicht gefunden');
  all[idx].passwordHash = await bcrypt.hash(password, 10);
  erhoeheTokenVersion(all[idx]);
  all[idx].mustChangePassword = false;
  all[idx].inviteToken = null;
  all[idx].inviteExpiry = null;
  writeUsers(all);
}

async function setInitialPassword(id) {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%';
  const password = Array.from(
    { length: 12 },
    () => chars[crypto.randomInt(0, chars.length)]
  ).join('');
  const all = readUsers();
  const idx = all.findIndex(u => u.id === id);
  if (idx === -1) throw new Error('Benutzer nicht gefunden');
  all[idx].passwordHash = await bcrypt.hash(password, 10);
  erhoeheTokenVersion(all[idx]);
  all[idx].mustChangePassword = true;
  writeUsers(all);
  return password;
}

function generateInviteToken(id) {
  const all = readUsers();
  const idx = all.findIndex(u => u.id === id);
  if (idx === -1) throw new Error('Benutzer nicht gefunden');
  const token = crypto.randomUUID();
  all[idx].inviteToken = token;
  all[idx].inviteExpiry = Date.now() + 48 * 60 * 60 * 1000;
  writeUsers(all);
  return token;
}

function updateUser(id, updates) {
  const all = readUsers();
  const idx = all.findIndex(u => u.id === id);
  if (idx === -1) throw new Error('Benutzer nicht gefunden');
  for (const key of ['role', 'email']) {
    if (key in updates) all[idx][key] = updates[key];
  }
  writeUsers(all);
  return all[idx];
}

function deleteUser(id) {
  const all = readUsers();
  const target = all.find(u => u.id === id);
  if (!target) throw new Error('Benutzer nicht gefunden');
  if (target.role === 'admin' && all.filter(u => u.role === 'admin').length <= 1) {
    throw new Error('Den letzten Admin kann man nicht löschen');
  }
  writeUsers(all.filter(u => u.id !== id));
}

// Eingerichtet ist die App erst, wenn sich jemand anmelden kann.
function istEingerichtet() {
  return readUsers().some(u => u.passwordHash);
}

// Erstkonfiguration: Passwort wird vor jeder Änderung geprüft. Ein bereits
// vorhandener Benutzer ohne Passwort (z.B. aus einem abgebrochenen Setup)
// wird übernommen statt doppelt angelegt.
async function richteErstenAdminEin(username, password) {
  if (istEingerichtet()) throw new Error('Bereits eingerichtet');
  pruefePasswort(password);
  const vorhanden = findByUsername(username);
  const user = vorhanden
    ? updateUser(vorhanden.id, { role: 'admin' })
    : await createUser({ username, role: 'admin' });
  await setPassword(user.id, password);
  return toPublicUser(findById(user.id));
}

function toPublicUser(u) {
  if (!u) return null;
  const { passwordHash, inviteToken, inviteExpiry, ...pub } = u;
  return pub;
}

async function verifyPassword(username, password) {
  const user = findByUsername(username);
  if (!user || !user.passwordHash) return null;
  return (await bcrypt.compare(password, user.passwordHash)) ? toPublicUser(user) : null;
}

module.exports = {
  readUsers, findById, findByUsername, findByInviteToken,
  createUser, setPassword, setInitialPassword,
  generateInviteToken, updateUser, deleteUser, verifyPassword,
  toPublicUser, pruefePasswort, istEingerichtet, richteErstenAdminEin,
};
