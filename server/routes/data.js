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

// Ganze Datei ersetzen nur bei den Firmendaten (Admins). Kunden und Katalog werden einzeln
// gespeichert – sonst könnte eine einzige Anfrage die komplette Liste überschreiben.
function nurFirmaDurchAdmins(req, res, next) {
  if (req.params.type !== 'firma') {
    return res.status(400).json({ error: 'Kunden und Leistungen werden einzeln gespeichert' });
  }
  requireAdmin(req, res, next);
}

router.put('/:type', pruefeTyp, nurFirmaDurchAdmins, (req, res) => {
  try {
    dataStore.writeData(req.params.type, req.body);
    broadcastDataUpdate(req.params.type);
    res.json({ ok: true });
  } catch (e) {
    sendeFehler(res, e);
  }
});

router.put('/:type/:id', (req, res) => {
  try {
    const liste = dataStore.speichereEintrag(req.params.type, req.params.id, req.body);
    broadcastDataUpdate(req.params.type);
    res.json(liste);
  } catch (e) {
    sendeFehler(res, e);
  }
});

router.delete('/:type/:id', (req, res) => {
  try {
    const liste = dataStore.loescheEintrag(req.params.type, req.params.id);
    broadcastDataUpdate(req.params.type);
    res.json(liste);
  } catch (e) {
    sendeFehler(res, e);
  }
});

module.exports = router;
