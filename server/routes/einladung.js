const express = require('express');
const users = require('../stores/users');
const { makeToken } = require('../middleware/auth');

const router = express.Router();

router.post('/:token', async (req, res) => {
  const user = users.findByInviteToken(req.params.token);
  if (!user) return res.status(400).json({ error: 'Link ungültig oder abgelaufen' });
  const { password } = req.body;
  if (!password) return res.status(400).json({ error: 'Passwort fehlt' });
  try {
    await users.setPassword(user.id, password);
    res.json({ token: makeToken(users.findById(user.id)) });
  } catch {
    res.status(500).json({ error: 'Interner Fehler' });
  }
});

module.exports = router;
