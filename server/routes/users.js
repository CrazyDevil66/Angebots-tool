const express = require('express');
const users = require('../stores/users');
const mailer = require('../lib/mailer');
const { PORT, readConfig } = require('../config');
const { requireAuth, requireAdmin } = require('../middleware/auth');

const router = express.Router();
router.use(requireAuth, requireAdmin);

router.get('/', (_req, res) => {
  res.json(users.readUsers().map(u => ({
    id: u.id, username: u.username, email: u.email, role: u.role,
    mustChangePassword: !!u.mustChangePassword, createdAt: u.createdAt,
    hasPassword: !!u.passwordHash,
  })));
});

router.post('/', async (req, res) => {
  const { username, email } = req.body;
  if (!username) return res.status(400).json({ error: 'Benutzername fehlt' });
  try {
    const user = await users.createUser({ username, email });
    res.json({ id: user.id, username: user.username, email: user.email, role: user.role, createdAt: user.createdAt, hasPassword: false });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

router.patch('/:id', (req, res) => {
  try {
    const user = users.updateUser(req.params.id, req.body);
    res.json({ id: user.id, username: user.username, role: user.role, email: user.email });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

router.delete('/:id', (req, res) => {
  try {
    users.deleteUser(req.params.id);
    res.json({ ok: true });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

router.post('/:id/invite', async (req, res) => {
  try {
    const token = users.generateInviteToken(req.params.id);
    const baseUrl = process.env.BASE_URL || readConfig().baseUrl || `http://localhost:${PORT}`;
    const inviteUrl = `${baseUrl}/invite/${token}`;
    const user = users.findById(req.params.id);
    let emailSent = false;
    if (user?.email) {
      emailSent = await mailer.sendInvite({ to: user.email, username: user.username, inviteUrl });
    }
    res.json({ inviteUrl, emailSent });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

router.post('/:id/reset-password', async (req, res) => {
  try {
    const password = await users.setInitialPassword(req.params.id);
    res.json({ password });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

module.exports = router;
