const fs = require('fs');
const path = require('path');
const { dataDir } = require('../paths');
const angeboteStore = require('../stores/angebote');
const dataStore = require('../stores/data');
const { httpFehler } = require('./fehler');

const BACKUP_VERSION = 2;

function erstelleBackup() {
  return {
    version: BACKUP_VERSION,
    exportedAt: new Date().toISOString(),
    firma: dataStore.readData('firma'),
    kunden: dataStore.readData('kunden'),
    katalog: dataStore.readData('katalog'),
    angebote: angeboteStore.readAllOffers(),
  };
}

function pruefeBackup(backup) {
  if (!backup || typeof backup !== 'object' || Array.isArray(backup)) {
    throw httpFehler(400, 'Ungültige Backup-Datei');
  }
  if (typeof backup.firma !== 'object' || Array.isArray(backup.firma)) {
    throw httpFehler(400, 'Backup-Datei unvollständig: „firma“ fehlt');
  }
  for (const feld of ['kunden', 'katalog', 'angebote']) {
    if (!Array.isArray(backup[feld])) throw httpFehler(400, `Backup-Datei unvollständig: „${feld}“ fehlt`);
  }
  if (backup.angebote.some(a => !a?.id || !a.snapshot)) {
    throw httpFehler(400,
      'Die Backup-Datei enthält keine Angebotsinhalte (altes Export-Format). ' +
      'Import abgebrochen, damit keine Angebote verloren gehen.');
  }
  const ungueltig = backup.angebote.find(a => !angeboteStore.istGueltigeId(a.id));
  if (ungueltig) throw httpFehler(400, `Die Backup-Datei enthält eine ungültige Angebots-ID: ${String(ungueltig.id).slice(0, 40)}`);
  const ids = new Set(backup.angebote.map(a => a.id));
  if (ids.size !== backup.angebote.length) {
    throw httpFehler(400, 'Die Backup-Datei enthält doppelte Angebots-IDs');
  }
}

function sichereAktuellenStand() {
  const verzeichnis = path.join(dataDir(), 'backups');
  fs.mkdirSync(verzeichnis, { recursive: true });
  const datei = `vor-import-${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
  fs.writeFileSync(path.join(verzeichnis, datei), JSON.stringify(erstelleBackup(), null, 2));
  return datei;
}

// Ersetzt alle Anwendungsdaten durch das Backup. Der vorherige Stand wird
// vorher unter data/backups/ gesichert.
function stelleWiederHer(backup) {
  pruefeBackup(backup);
  const sicherungsDatei = sichereAktuellenStand();
  dataStore.writeData('firma', backup.firma);
  dataStore.writeData('kunden', backup.kunden);
  dataStore.writeData('katalog', backup.katalog);
  angeboteStore.replaceAll(backup.angebote);
  return { sicherungsDatei };
}

module.exports = { erstelleBackup, stelleWiederHer };
