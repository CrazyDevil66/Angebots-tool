const express = require('express');
const backup = require('../lib/backup');
const { writeConfig } = require('../config');
const { pruefeBackupEinstellungen } = require('../lib/backupZeitplan');
const { requireAuth, requireAdmin } = require('../middleware/auth');
const { sendeFehler } = require('../lib/fehler');

const router = express.Router();
router.use(requireAuth, requireAdmin);

function antwort() {
  return { ...backup.backupEinstellungen(), status: backup.backupStatus() };
}

router.get('/', (_req, res) => {
  try {
    res.json(antwort());
  } catch (e) {
    sendeFehler(res, e);
  }
});

router.post('/', (req, res) => {
  try {
    const { haeufigkeit, uhrzeit, wochentag, behalten } = req.body;
    writeConfig({ backup: pruefeBackupEinstellungen({ haeufigkeit, uhrzeit, wochentag, behalten }) });
    res.json(antwort());
  } catch (e) {
    sendeFehler(res, e);
  }
});

module.exports = router;
