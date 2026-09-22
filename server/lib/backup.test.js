const { test, beforeEach, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const os = require('os');

const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'backup-test-'));
process.env.DATA_DIR = tmpDir;

const backup = require('./backup');
const angeboteStore = require('../stores/angebote');
const dataStore = require('../stores/data');

after(() => fs.rmSync(tmpDir, { recursive: true }));

beforeEach(() => {
  for (const eintrag of fs.readdirSync(tmpDir)) {
    fs.rmSync(path.join(tmpDir, eintrag), { recursive: true });
  }
});

const snapshot = {
  angebotNr: 'A-2026-001',
  datum: '1.6.2026',
  betreff: 'Badsanierung',
  mwstSatz: 19,
  kunde: { id: 'k1', firma: 'Kunde AG' },
  firma: { name: 'Meine Firma' },
  positionen: [{ bezeichnung: 'Fliesen', menge: 10, einzelpreis: 20, aufschlag: 50, einheit: 'm²' }],
};

function beispielDaten() {
  dataStore.writeData('firma', { name: 'Meine Firma', logo: 'data:image/png;base64,AAAA' });
  dataStore.writeData('kunden', [{ id: 'k1', firma: 'Kunde AG' }]);
  dataStore.writeData('katalog', [{ id: 'kat1', bezeichnung: 'Fliesen', einzelpreis: 20 }]);
  const { entry } = angeboteStore.createOffer(snapshot);
  angeboteStore.patchOffer(entry.id, { status: 'angenommen', rechnungsNr: 'R-2026-001', rechnungsDatum: '5.6.2026' });
  return entry.id;
}

test('erstelleBackup: enthält Stammdaten und vollständige Angebote inkl. Positionen', () => {
  const id = beispielDaten();
  const b = backup.erstelleBackup();
  assert.equal(b.version, 2);
  assert.ok(b.exportedAt);
  assert.equal(b.firma.name, 'Meine Firma');
  assert.equal(b.kunden.length, 1);
  assert.equal(b.katalog.length, 1);
  assert.equal(b.angebote.length, 1);
  assert.equal(b.angebote[0].id, id);
  assert.equal(b.angebote[0].rechnungsNr, 'R-2026-001');
  assert.equal(b.angebote[0].snapshot.positionen[0].bezeichnung, 'Fliesen');
});

test('stelleWiederHer: ersetzt alle Daten und übernimmt IDs, Status und Rechnungsdaten', () => {
  const id = beispielDaten();
  const gesichert = backup.erstelleBackup();

  dataStore.writeData('kunden', [{ id: 'k2', firma: 'Andere GmbH' }]);
  angeboteStore.createOffer({ ...snapshot, angebotNr: 'A-2026-099' });

  backup.stelleWiederHer(gesichert);

  assert.deepEqual(dataStore.readData('kunden'), [{ id: 'k1', firma: 'Kunde AG' }]);
  const index = angeboteStore.readIndex();
  assert.equal(index.length, 1);
  assert.equal(index[0].id, id);
  assert.equal(index[0].status, 'angenommen');
  assert.equal(index[0].rechnungsNr, 'R-2026-001');
  assert.equal(index[0].netto, 300);
  assert.equal(angeboteStore.readOffer(id).snapshot.positionen.length, 1);
  const dateien = fs.readdirSync(path.join(tmpDir, 'angebote')).filter(f => f !== 'index.json');
  assert.deepEqual(dateien, [`${id}.json`]);
});

test('stelleWiederHer: sichert den vorherigen Stand in backups/', () => {
  beispielDaten();
  const gesichert = backup.erstelleBackup();
  const { sicherungsDatei } = backup.stelleWiederHer(gesichert);
  const inhalt = JSON.parse(fs.readFileSync(path.join(tmpDir, 'backups', sicherungsDatei), 'utf8'));
  assert.equal(inhalt.angebote.length, 1);
  assert.equal(inhalt.firma.name, 'Meine Firma');
});

test('stelleWiederHer: altes Export-Format ohne Angebotsinhalte wird abgelehnt, Daten bleiben unverändert', () => {
  const id = beispielDaten();
  const altesFormat = {
    exportedAt: '2026-05-01T00:00:00.000Z',
    firma: { name: 'Alt' },
    kunden: [],
    katalog: [],
    angebote: [{ id: 'x1', angebotNr: 'A-2026-005', netto: 100, brutto: 119, status: 'entwurf' }],
  };
  assert.throws(() => backup.stelleWiederHer(altesFormat), e => e.status === 400 && /Angebotsinhalte/.test(e.message));
  assert.equal(angeboteStore.readIndex()[0].id, id);
  assert.equal(dataStore.readData('firma').name, 'Meine Firma');
  assert.equal(fs.existsSync(path.join(tmpDir, 'backups')), false);
});

test('stelleWiederHer: unvollständige Backups und doppelte IDs werden abgelehnt', () => {
  const basis = { firma: {}, kunden: [], katalog: [], angebote: [] };
  assert.throws(() => backup.stelleWiederHer(null), e => e.status === 400);
  assert.throws(() => backup.stelleWiederHer({ ...basis, kunden: undefined }), e => e.status === 400);
  const doppelt = { ...basis, angebote: [{ id: 'a', snapshot }, { id: 'a', snapshot }] };
  assert.throws(() => backup.stelleWiederHer(doppelt), e => e.status === 400 && /doppelt/.test(e.message));
});

test('stelleWiederHer: ungültige Angebots-ID bricht vor jeder Änderung ab', () => {
  beispielDaten();
  const boese = { firma: { name: 'Neu' }, kunden: [], katalog: [], angebote: [{ id: '../users', snapshot }] };
  assert.throws(() => backup.stelleWiederHer(boese), e => e.status === 400 && /ungültige Angebots-ID/.test(e.message));
  assert.equal(dataStore.readData('firma').name, 'Meine Firma');
  assert.equal(dataStore.readData('kunden').length, 1);
});
