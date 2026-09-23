const express = require('express');
const dataStore = require('../stores/data');
const { requireAuth, requireAdmin } = require('../middleware/auth');
const { broadcastDataUpdate } = require('../sse');
const { sendeFehler } = require('../lib/fehler');

const router = express.Router();
router.use(requireAuth);

function pruefeTyp(req, res, next) {
  if (!dataStore.VALID_TYPES.has(req.params.type)) return res.status(400).json({ error: 'Ungültiger Typ' });
  next();
}

router.get('/:type', pruefeTyp, (req, res) => {
  try {
    res.json(dataStore.readData(req.params.type));
  } catch (e) {
    sendeFehler(res, e);
  }
});

// Firmendaten und Textvorlagen ändern nur Admins, Kunden und Katalog alle Benutzer.
function nurAdminFuerFirma(req, res, next) {
  if (req.params.type === 'firma') return requireAdmin(req, res, next);
  next();
}

router.put('/:type', pruefeTyp, nurAdminFuerFirma, (req, res) => {
  try {
    dataStore.writeData(req.params.type, req.body);
    broadcastDataUpdate(req.params.type);
    res.json({ ok: true });
  } catch (e) {
    sendeFehler(res, e);
  }
});

module.exports = router;
