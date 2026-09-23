const fs = require('fs');
const path = require('path');

const { dataDir } = require('../paths');
const { httpFehler } = require('../lib/fehler');

const DATA_DIR = dataDir();
const VALID_TYPES = new Set(['firma', 'kunden', 'katalog']);
const LISTEN_TYPES = new Set(['kunden', 'katalog']);

function dataFile(type) {
  return path.join(DATA_DIR, `${type}.json`);
}

function readData(type) {
  if (!VALID_TYPES.has(type)) throw new Error('Ungültiger Datentyp');
  try {
    return JSON.parse(fs.readFileSync(dataFile(type), 'utf8'));
  } catch (e) {
    if (e.code === 'ENOENT') return type === 'firma' ? null : [];
    throw e;
  }
}

// firma ist ein Objekt (oder null, solange nichts eingetragen ist), kunden und katalog sind Listen.
function pruefeDaten(type, data) {
  const gueltig = type === 'firma'
    ? data === null || (typeof data === 'object' && !Array.isArray(data))
    : Array.isArray(data);
  if (!gueltig) throw httpFehler(400, 'Ungültige Daten');
}

function writeData(type, data) {
  if (!VALID_TYPES.has(type)) throw new Error('Ungültiger Datentyp');
  pruefeDaten(type, data);
  fs.mkdirSync(DATA_DIR, { recursive: true });
  const tmp = dataFile(type) + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify(data, null, 2));
  fs.renameSync(tmp, dataFile(type));
}

function pruefeEintrag(type, id, eintrag) {
  if (!LISTEN_TYPES.has(type)) throw httpFehler(400, 'Einzelne Einträge gibt es nur bei Kunden und Katalog');
  if (typeof id !== 'string' || !id || id.length > 100) throw httpFehler(400, 'Ungültige ID');
  if (eintrag === undefined) return;
  if (!eintrag || typeof eintrag !== 'object' || Array.isArray(eintrag)) throw httpFehler(400, 'Ungültiger Eintrag');
  if (eintrag.id !== undefined && eintrag.id !== id) throw httpFehler(400, 'ID im Eintrag passt nicht zur Adresse');
}

// Ändert nur diesen einen Eintrag – gleichzeitige Änderungen an anderen Einträgen bleiben erhalten.
function speichereEintrag(type, id, eintrag) {
  pruefeEintrag(type, id, eintrag);
  const neu = { ...eintrag, id };
  const liste = readData(type);
  const vorhanden = liste.some(e => e.id === id);
  const aktuell = vorhanden ? liste.map(e => e.id === id ? neu : e) : [...liste, neu];
  writeData(type, aktuell);
  return aktuell;
}

function loescheEintrag(type, id) {
  pruefeEintrag(type, id);
  const aktuell = readData(type).filter(e => e.id !== id);
  writeData(type, aktuell);
  return aktuell;
}

module.exports = { readData, writeData, speichereEintrag, loescheEintrag, VALID_TYPES };
