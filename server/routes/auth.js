const express = require('express');
const users = require('../stores/users');
const loginSperre = require('../lib/loginSperre');
const { makeToken, requireAuth } = require('../middleware/auth');

const router = express.Router();

router.get('/setup', (_req, res) => {
  res.json({ setupRequired: !users.istEingerichtet() });
});

router.post('/setup', async (req, res) => {
  if (users.istEingerichtet()) return res.status(400).json({ error: 'Bereits eingerichtet' });
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ error: 'Benutzername und Passwort erforderlich' });
  try {
    const user = await users.richteErstenAdminEin(username, password);
    res.json({ token: makeToken(user) });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

router.post('/login', async (req, res) => {
  const ip = req.ip;
  if (loginSperre.checkLockout(ip)) {
    const secs = loginSperre.remainingLockoutSeconds(ip);
    return res.status(429).json({ error: `IP gesperrt. Bitte ${Math.ceil(secs / 60)} Minuten warten.` });
  }
  const { username, password } = req.body;
  try {
    const user = await users.verifyPassword(username, password);
    if (!user) {
      loginSperre.recordFailure(ip);
      return res.status(401).json({ error: 'Benutzername oder Passwort falsch' });
    }
    loginSperre.clearLockout(ip);
    res.json({ token: makeToken(user) });
  } catch {
    res.status(500).json({ error: 'Interner Fehler' });
  }
});

router.post('/logout', (_req, res) => res.json({ ok: true }));

router.get('/me', requireAuth, (req, res) => {
  const user = users.findById(req.user.userId);
  if (!user) return res.status(401).json({ error: 'Benutzer nicht gefunden' });
  res.json({ userId: user.id, username: user.username, role: user.role, mustChangePassword: !!user.mustChangePassword });
});

router.post('/me/password', requireAuth, async (req, res) => {
  const { password } = req.body;
  if (!password) return res.status(400).json({ error: 'Passwort darf nicht leer sein' });
  await users.setPassword(req.user.userId, password);
  res.json({ token: makeToken(users.findById(req.user.userId)) });
});

module.exports = router;
