const express = require('express');
const backup = require('../lib/backup');
const { requireAuth, requireAdmin } = require('../middleware/auth');
const { broadcastDataUpdate } = require('../sse');
const { sendeFehler } = require('../lib/fehler');

const router = express.Router();
router.use(requireAuth, requireAdmin);

router.get('/', (_req, res) => {
  try {
    res.json(backup.erstelleBackup());
  } catch (e) {
    sendeFehler(res, e);
  }
});

// Sofortige Sicherung zusätzlich zum Zeitplan; liefert den neuen Status.
router.post('/jetzt', (_req, res) => {
  try {
    const datei = backup.sichereAutomatisch();
    res.json({ datei, status: backup.backupStatus() });
  } catch (e) {
    sendeFehler(res, e);
  }
});

router.post('/restore', (req, res) => {
  try {
    const ergebnis = backup.stelleWiederHer(req.body);
    for (const typ of ['firma', 'kunden', 'katalog', 'angebote']) broadcastDataUpdate(typ);
    res.json({ ok: true, ...ergebnis });
  } catch (e) {
    sendeFehler(res, e);
  }
});

module.exports = router;
