const fs = require('fs');
const path = require('path');
const { dataDir } = require('../paths');
const angeboteStore = require('../stores/angebote');
const dataStore = require('../stores/data');
const { httpFehler } = require('./fehler');
const { schreibeJsonAtomar } = require('./jsonDatei');
const { readConfig } = require('../config');
const { pruefeBackupEinstellungen, istFaellig } = require('./backupZeitplan');

const BACKUP_VERSION = 2;
const AUTOMATISCH = /^automatisch-(\d{4})-(\d{2})-(\d{2})-(\d{2})(\d{2})(\d{2})(?:-(\d+))?\.json$/;

function backupVerzeichnis() {
  return path.join(dataDir(), 'backups');
}

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
  const verzeichnis = backupVerzeichnis();
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

function zeitStempel(datum) {
  const zwei = n => String(n).padStart(2, '0');
  return `${datum.getFullYear()}-${zwei(datum.getMonth() + 1)}-${zwei(datum.getDate())}` +
    `-${zwei(datum.getHours())}${zwei(datum.getMinutes())}${zwei(datum.getSeconds())}`;
}

// Automatische Sicherungen, älteste zuerst, mit dem Zeitpunkt aus dem Dateinamen (Ortszeit).
function automatischeSicherungen() {
  const verzeichnis = backupVerzeichnis();
  if (!fs.existsSync(verzeichnis)) return [];
  return fs.readdirSync(verzeichnis)
    .map(datei => ({ datei, teile: AUTOMATISCH.exec(datei) }))
    .filter(({ teile }) => teile)
    .map(({ datei, teile }) => {
      const [j, mo, t, h, mi, s] = teile.slice(1, 7).map(Number);
      return { datei, zeitpunkt: new Date(j, mo - 1, t, h, mi, s), nr: Number(teile[7] || 1) };
    })
    .sort((a, b) => a.zeitpunkt - b.zeitpunkt || a.nr - b.nr);
}

// Löscht die ältesten automatischen Sicherungen. Sicherungen vor einem Import bleiben immer erhalten.
function raeumeAutomatischeAuf(behalten) {
  const alle = automatischeSicherungen();
  for (const { datei } of alle.slice(0, Math.max(0, alle.length - behalten))) {
    fs.unlinkSync(path.join(backupVerzeichnis(), datei));
  }
}

function backupEinstellungen() {
  return pruefeBackupEinstellungen(readConfig().backup);
}

// Sicherung im Format des Exports – lässt sich über „Importieren“ wiederherstellen.
function freierDateiname(jetzt) {
  const basis = `automatisch-${zeitStempel(jetzt)}`;
  let datei = `${basis}.json`;
  // Zwei Sicherungen in derselben Sekunde (z.B. Doppelklick) dürfen sich nicht überschreiben
  for (let nr = 2; fs.existsSync(path.join(backupVerzeichnis(), datei)); nr++) datei = `${basis}-${nr}.json`;
  return datei;
}

function sichereAutomatisch(jetzt = new Date(), behalten = backupEinstellungen().behalten) {
  const datei = freierDateiname(jetzt);
  schreibeJsonAtomar(path.join(backupVerzeichnis(), datei), erstelleBackup());
  raeumeAutomatischeAuf(behalten);
  return datei;
}

// Legt eine Sicherung an, wenn laut Zeitplan fällig. Liefert den Dateinamen oder null.
function sichereWennFaellig(jetzt = new Date()) {
  const einstellungen = backupEinstellungen();
  const letzte = automatischeSicherungen().at(-1)?.zeitpunkt ?? null;
  if (!istFaellig(jetzt, einstellungen, letzte)) return null;
  return sichereAutomatisch(jetzt, einstellungen.behalten);
}

function backupStatus() {
  const alle = automatischeSicherungen();
  return { letzte: alle.at(-1)?.zeitpunkt.toISOString() ?? null, anzahl: alle.length };
}

module.exports = {
  erstelleBackup, stelleWiederHer,
  backupEinstellungen, sichereAutomatisch, sichereWennFaellig, raeumeAutomatischeAuf, backupStatus,
};
