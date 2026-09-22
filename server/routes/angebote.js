const express = require('express');
const angeboteStore = require('../stores/angebote');
const { requireAuth } = require('../middleware/auth');
const { broadcastDataUpdate } = require('../sse');
const { sendeFehler } = require('../lib/fehler');

const router = express.Router();
router.use(requireAuth);

router.get('/', (_req, res) => {
  try {
    res.json(angeboteStore.readIndex());
  } catch (e) {
    sendeFehler(res, e);
  }
});

router.post('/', (req, res) => {
  try {
    const result = angeboteStore.createOffer(req.body);
    broadcastDataUpdate('angebote');
    res.json(result);
  } catch (e) {
    sendeFehler(res, e);
  }
});

router.get('/:id', (req, res) => {
  try {
    const offer = angeboteStore.readOffer(req.params.id);
    if (!offer) return res.status(404).json({ error: 'Nicht gefunden' });
    res.json(offer);
  } catch (e) {
    sendeFehler(res, e);
  }
});

router.put('/:id', (req, res) => {
  const { snapshot, status } = req.body;
  try {
    const index = angeboteStore.updateOffer(req.params.id, snapshot, status);
    broadcastDataUpdate('angebote');
    res.json({ index });
  } catch (e) {
    sendeFehler(res, e);
  }
});

router.patch('/:id', (req, res) => {
  try {
    const index = angeboteStore.patchOffer(req.params.id, req.body);
    broadcastDataUpdate('angebote');
    res.json({ index });
  } catch (e) {
    sendeFehler(res, e);
  }
});

router.delete('/:id', (req, res) => {
  try {
    const index = angeboteStore.removeOffer(req.params.id);
    broadcastDataUpdate('angebote');
    res.json({ index });
  } catch (e) {
    sendeFehler(res, e);
  }
});

module.exports = router;
