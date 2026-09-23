const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { berechneSummen } = require('../../shared/berechnung.js');
const { nextAngebotNr } = require('../../shared/nummern.js');
const { istAbgelaufen } = require('../../shared/datum.js');
const { dataDir } = require('../paths');
const { httpFehler } = require('../lib/fehler');

const DATA_DIR = dataDir();
const ANGEBOTE_DIR = path.join(DATA_DIR, 'angebote');
const INDEX_FILE = path.join(ANGEBOTE_DIR, 'index.json');

const GUELTIGE_ID = /^[A-Za-z0-9_-]{1,100}$/;

function istGueltigeId(id) {
  return typeof id === 'string' && GUELTIGE_ID.test(id);
}

function offerFile(id) {
  // Die ID wird Teil des Dateinamens – ohne Prüfung wären Pfade wie "../users" möglich.
  if (!istGueltigeId(id)) throw httpFehler(400, 'Ungültige Angebots-ID');
  return path.join(ANGEBOTE_DIR, `${id}.json`);
}

function ensureDir() {
  fs.mkdirSync(ANGEBOTE_DIR, { recursive: true });
}

function readIndex() {
  try {
    return JSON.parse(fs.readFileSync(INDEX_FILE, 'utf8'));
  } catch (e) {
    if (e.code === 'ENOENT') return [];
    throw e;
  }
}

function writeIndex(index) {
  ensureDir();
  const tmp = INDEX_FILE + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify(index, null, 2));
  fs.renameSync(tmp, INDEX_FILE);
}

function readOffer(id) {
  try {
    return JSON.parse(fs.readFileSync(offerFile(id), 'utf8'));
  } catch (e) {
    if (e.code === 'ENOENT') return null;
    throw e;
  }
}

function writeOffer(id, data) {
  ensureDir();
  const tmp = offerFile(id) + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify(data, null, 2));
  fs.renameSync(tmp, offerFile(id));
}

function deleteOfferFile(id) {
  try {
    fs.unlinkSync(offerFile(id));
  } catch (e) {
    if (e.code !== 'ENOENT') throw e;
  }
}

function stripLogo(snapshot) {
  if (!snapshot?.firma) return snapshot;
  const { logo, ...rest } = snapshot.firma;
  return { ...snapshot, firma: rest };
}

function summen(snapshot) {
  const { netto, brutto } = berechneSummen(snapshot?.positionen, snapshot?.mwstSatz ?? 19);
  return { netto, brutto };
}

function buildMetadata(id, data, status, extra = {}) {
  const { netto, brutto } = summen(data);
  return {
    id,
    savedAt: extra.savedAt || new Date().toISOString(),
    updatedAt: extra.updatedAt || null,
    angebotNr: data.angebotNr,
    datum: data.datum,
    gueltigBis: data.gueltigBis || '',
    betreff: data.betreff,
    kundeDisplay: data.kunde?.firma || data.kunde?.name || '—',
    kundeId: data.kunde?.id || null,
    netto,
    brutto,
    mwstSatz: data.mwstSatz,
    status: status || 'entwurf',
    rechnungsNr:         extra.rechnungsNr         ?? null,
    rechnungsDatum:      extra.rechnungsDatum       ?? null,
    rechnungsBetreff:    extra.rechnungsBetreff     ?? null,
    rechnungsEinleitung: extra.rechnungsEinleitung  ?? null,
    rechnungsHinweise:   extra.rechnungsHinweise    ?? null,
    mahnStufe:           extra.mahnStufe            ?? 0,
    mahnGebuehren:       extra.mahnGebuehren        ?? [],
    mahnungNr:           extra.mahnungNr            ?? null,
    mahndatum:           extra.mahndatum            ?? null,
    bezahltAm:           extra.bezahltAm            ?? null,
  };
}

// Die Nummer schlägt der Browser vor. Ist sie leer oder inzwischen vergeben (zwei Nutzer legen
// gleichzeitig ein Angebot an), vergibt der Server die nächste freie.
function mitFreierAngebotNr(data, index) {
  const nr = data.angebotNr;
  if (typeof nr === 'string' && nr.trim() && !index.some(e => e.angebotNr === nr)) return data;
  return { ...data, angebotNr: nextAngebotNr(index) };
}

function pruefeAngebotNrFrei(id, angebotNr) {
  const belegt = readIndex().find(e => e.id !== id && e.angebotNr === angebotNr);
  if (!belegt) return;
  throw httpFehler(409, `Angebotsnummer ${angebotNr} ist bereits vergeben`);
}

function createOffer(eingabe) {
  const bisher = readIndex();
  const data = mitFreierAngebotNr(eingabe, bisher);
  const id = crypto.randomUUID();
  const snapshot = stripLogo(data);
  const meta = buildMetadata(id, data, 'entwurf');
  writeOffer(id, { ...meta, snapshot });
  const index = [meta, ...bisher];
  writeIndex(index);
  return { entry: meta, index };
}

function updateOffer(id, data, status) {
  const existing = readOffer(id);
  if (!existing) throw httpFehler(404, `Angebot ${id} nicht gefunden`);
  // Nur bei geänderter Nummer prüfen – bereits vorhandene Doppel sollen das Speichern nicht blockieren.
  if (data.angebotNr !== existing.angebotNr) pruefeAngebotNrFrei(id, data.angebotNr);
  const snapshot = stripLogo(data);
  const meta = buildMetadata(id, data, status, {
    savedAt:             existing.savedAt,
    updatedAt:           new Date().toISOString(),
    rechnungsNr:         existing.rechnungsNr,
    rechnungsDatum:      existing.rechnungsDatum,
    rechnungsBetreff:    existing.rechnungsBetreff,
    rechnungsEinleitung: existing.rechnungsEinleitung,
    rechnungsHinweise:   existing.rechnungsHinweise,
    mahnStufe:           existing.mahnStufe,
    mahnGebuehren:       existing.mahnGebuehren,
    mahnungNr:           existing.mahnungNr,
    mahndatum:           existing.mahndatum,
    bezahltAm:           existing.bezahltAm,
  });
  writeOffer(id, { ...meta, snapshot });
  const index = readIndex().map(e => e.id === id ? meta : e);
  writeIndex(index);
  return index;
}

function pruefeRechnungsNrFrei(id, rechnungsNr) {
  const belegt = readIndex().find(e => e.id !== id && e.rechnungsNr === rechnungsNr);
  if (!belegt) return;
  throw httpFehler(409, `Rechnungsnummer ${rechnungsNr} ist bereits vergeben (Angebot ${belegt.angebotNr})`);
}

function patchOffer(id, patch) {
  const existing = readOffer(id);
  if (!existing) throw httpFehler(404, `Angebot ${id} nicht gefunden`);
  const { snapshot, ...meta } = existing;
  const { id: _id, savedAt: _savedAt, snapshot: _snap, ...safePatch } = patch;
  if (safePatch.rechnungsNr) pruefeRechnungsNrFrei(id, safePatch.rechnungsNr);
  const { netto, brutto } = summen(snapshot);
  const newMeta = { ...meta, ...safePatch, netto, brutto, updatedAt: new Date().toISOString() };
  writeOffer(id, { ...newMeta, snapshot });
  const index = readIndex().map(e => e.id === id ? newMeta : e);
  writeIndex(index);
  return index;
}

// Setzt Entwürfe und gesendete Angebote nach Ablauf von „gültig bis“ auf „abgelaufen“.
// Liefert die Anzahl der geänderten Angebote.
function markiereAbgelaufene(heute = new Date()) {
  const faellig = readIndex().filter(e => istAbgelaufen(e, heute));
  for (const e of faellig) patchOffer(e.id, { status: 'abgelaufen' });
  return faellig.length;
}

function removeOffer(id) {
  offerFile(id); // ID prüfen, bevor der Index verändert wird
  const index = readIndex().filter(e => e.id !== id);
  writeIndex(index);
  deleteOfferFile(id);
  return index;
}

function readAllOffers() {
  return readIndex().map(e => readOffer(e.id)).filter(Boolean);
}

// Ersetzt den kompletten Angebotsbestand (Backup-Wiederherstellung).
// Neue Dateien werden zuerst geschrieben, verwaiste erst danach gelöscht.
function replaceAll(offers) {
  ensureDir();
  const index = offers.map(({ snapshot, ...meta }) => {
    const neu = buildMetadata(meta.id, snapshot, meta.status, meta);
    writeOffer(meta.id, { ...neu, snapshot: stripLogo(snapshot) });
    return neu;
  });
  writeIndex(index);
  const behalten = new Set(index.map(e => e.id));
  for (const datei of fs.readdirSync(ANGEBOTE_DIR)) {
    const id = path.basename(datei, '.json');
    if (datei.endsWith('.json') && id !== 'index' && !behalten.has(id)) deleteOfferFile(id);
  }
  return index;
}

function migrateIfNeeded() {
  const oldFile = path.join(DATA_DIR, 'angebote.json');
  if (!fs.existsSync(oldFile)) return;
  if (fs.existsSync(INDEX_FILE)) return;

  let oldAngebote;
  try {
    oldAngebote = JSON.parse(fs.readFileSync(oldFile, 'utf8'));
    if (!Array.isArray(oldAngebote)) return;
  } catch {
    return;
  }

  ensureDir();
  writeIndex([]); // sentinel — prevents re-run if process crashes mid-migration
  const index = [];
  for (const old of oldAngebote) {
    if (!old.id) continue;
    const snapshot = stripLogo(old.snapshot || {});
    const meta = {
      id:                  old.id,
      savedAt:             old.savedAt             || new Date().toISOString(),
      updatedAt:           old.updatedAt            || null,
      angebotNr:           old.angebotNr            || '',
      datum:               old.datum               || '',
      gueltigBis:          old.snapshot?.gueltigBis || '',
      betreff:             old.betreff             || '',
      kundeDisplay:        old.kundeDisplay         || '—',
      kundeId:             old.kundeId             || null,
      netto:               old.netto               ?? 0,
      brutto:              old.brutto              ?? 0,
      mwstSatz:            old.mwstSatz            ?? 19,
      status:              old.status              || 'entwurf',
      rechnungsNr:         old.rechnungsNr         || null,
      rechnungsDatum:      old.rechnungsDatum      || null,
      rechnungsBetreff:    old.rechnungsBetreff    || null,
      rechnungsEinleitung: old.rechnungsEinleitung || null,
      rechnungsHinweise:   old.rechnungsHinweise   || null,
      mahnStufe:           old.mahnStufe           ?? 0,
      mahnGebuehren:       old.mahnGebuehren       || [],
      mahnungNr:           old.mahnungNr           || null,
      mahndatum:           old.mahndatum           || null,
      bezahltAm:           old.bezahltAm           || null,
    };
    writeOffer(old.id, { ...meta, snapshot });
    index.push(meta);
  }
  writeIndex(index);
  fs.renameSync(oldFile, oldFile + '.migrated');
}

function recalcBrutto() {
  const index = readIndex();
  let changed = false;
  const updated = index.map(entry => {
    const offer = readOffer(entry.id);
    if (!offer?.snapshot) return entry;
    const { netto, brutto } = summen(offer.snapshot);
    if (Math.abs(entry.netto - netto) < 0.001 && Math.abs(entry.brutto - brutto) < 0.001) return entry;
    changed = true;
    const newMeta = { ...entry, netto, brutto };
    writeOffer(entry.id, { ...offer, netto, brutto });
    return newMeta;
  });
  if (changed) writeIndex(updated);
}

module.exports = {
  istGueltigeId,
  readIndex,
  readOffer,
  createOffer,
  updateOffer,
  patchOffer,
  removeOffer,
  readAllOffers,
  replaceAll,
  migrateIfNeeded,
  recalcBrutto,
  markiereAbgelaufene,
};
