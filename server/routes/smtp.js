const express = require('express');
const mailer = require('../lib/mailer');
const { readConfig, writeConfig } = require('../config');
const { requireAuth, requireAdmin } = require('../middleware/auth');

const router = express.Router();
router.use(requireAuth, requireAdmin);

router.get('/', (_req, res) => {
  const config = readConfig();
  const smtp = config.smtp || {};
  res.json({
    host: smtp.host || '', port: smtp.port || 587,
    user: smtp.user || '', pass: smtp.pass ? '***' : '',
    from: smtp.from || '', baseUrl: config.baseUrl || '',
  });
});

router.post('/', (req, res) => {
  const { host, port, user, pass, from, baseUrl } = req.body;
  const current = readConfig().smtp || {};
  writeConfig({
    smtp: {
      host: host ?? current.host,
      port: Number(port) || 587,
      user: user ?? current.user,
      pass: (pass && pass !== '***') ? pass : current.pass,
      from: from ?? current.from,
    },
    baseUrl: baseUrl ?? readConfig().baseUrl,
  });
  res.json({ ok: true });
});

router.post('/test', async (req, res) => {
  try {
    await mailer.sendTestMail({ to: req.body.to });
    res.json({ ok: true });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

module.exports = router;
