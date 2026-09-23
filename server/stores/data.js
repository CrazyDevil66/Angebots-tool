const fs = require('fs');
const path = require('path');

const { dataDir } = require('../paths');
const { httpFehler } = require('../lib/fehler');

const DATA_DIR = dataDir();
const VALID_TYPES = new Set(['firma', 'kunden', 'katalog']);

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

module.exports = { readData, writeData, VALID_TYPES };
