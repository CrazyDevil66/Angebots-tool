const { test, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const os = require('os');

const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'angebote-test-'));
process.env.DATA_DIR = tmpDir;

const store = require('./angebote');

after(() => fs.rmSync(tmpDir, { recursive: true }));

const sampleData = {
  angebotNr: 'A-2026-001',
  datum: '10.6.2026',
  gueltigBis: '24.6.2026',
  betreff: 'Testangebot',
  mwstSatz: 19,
  positionen: [{ menge: 2, einzelpreis: 100, bezeichnung: 'Pos 1', einheit: 'Stk.', aufschlag: 0 }],
  kunde: { id: null, firma: 'Test GmbH', name: '', strasse: '', plz: '', ort: '', email: '', telefon: '' },
  firma: { name: 'Meine Firma', logo: 'data:image/png;base64,AAAA' },
};

test('readIndex: leer wenn keine Dateien vorhanden', () => {
  assert.deepEqual(store.readIndex(), []);
});

test('createOffer: Angebot wird angelegt und in Index eingetragen', () => {
  const { entry, index } = store.createOffer(sampleData);
  assert.ok(entry.id);
  assert.equal(entry.angebotNr, 'A-2026-001');
  assert.equal(entry.kundeDisplay, 'Test GmbH');
  assert.equal(entry.gueltigBis, '24.6.2026');
  assert.equal(index.length, 1);
  assert.equal(index[0].id, entry.id);
});

test('createOffer: Logo wird nicht im Snapshot gespeichert', () => {
  const { entry } = store.createOffer(sampleData);
  const full = store.readOffer(entry.id);
  assert.equal(full.snapshot.firma.logo, undefined);
});

test('createOffer: Netto/Brutto korrekt berechnet', () => {
  const { entry } = store.createOffer(sampleData);
  assert.equal(entry.netto, 200);
  assert.ok(Math.abs(entry.brutto - 238) < 0.01);
});

test('readOffer: gibt null für unbekannte ID', () => {
  assert.equal(store.readOffer('nicht-vorhanden'), null);
});

test('updateOffer: Snapshot und Metadaten werden aktualisiert', () => {
  const { entry } = store.createOffer(sampleData);
  const updated = { ...sampleData, angebotNr: entry.angebotNr, betreff: 'Geändertes Angebot' };
  const index = store.updateOffer(entry.id, updated, 'gesendet');
  const full = store.readOffer(entry.id);
  assert.equal(full.betreff, 'Geändertes Angebot');
  assert.equal(full.status, 'gesendet');
  assert.ok(full.updatedAt);
  assert.equal(index.find(e => e.id === entry.id).betreff, 'Geändertes Angebot');
});

test('updateOffer: Logo bleibt nach Update rausgestripped', () => {
  const { entry } = store.createOffer(sampleData);
  store.updateOffer(entry.id, { ...sampleData, angebotNr: entry.angebotNr, firma: { ...sampleData.firma, logo: 'data:image/png;base64,BBBB' } }, 'entwurf');
  const full = store.readOffer(entry.id);
  assert.equal(full.snapshot.firma.logo, undefined);
});

test('patchOffer: Status-Patch aktualisiert nur Metadaten', () => {
  const { entry } = store.createOffer(sampleData);
  const index = store.patchOffer(entry.id, { status: 'abgelaufen' });
  const full = store.readOffer(entry.id);
  assert.equal(full.status, 'abgelaufen');
  assert.equal(index.find(e => e.id === entry.id).status, 'abgelaufen');
  assert.equal(full.snapshot.betreff, sampleData.betreff);
});

test('patchOffer: id und savedAt können nicht überschrieben werden', () => {
  const { entry } = store.createOffer(sampleData);
  const originalId = entry.id;
  const originalSavedAt = entry.savedAt;
  store.patchOffer(entry.id, { id: 'gehackt', savedAt: '1970-01-01T00:00:00.000Z', status: 'entwurf' });
  const full = store.readOffer(originalId);
  assert.equal(full.id, originalId);
  assert.equal(full.savedAt, originalSavedAt);
});

test('removeOffer: Datei und Index-Eintrag werden gelöscht', () => {
  const { entry } = store.createOffer(sampleData);
  const index = store.removeOffer(entry.id);
  assert.equal(store.readOffer(entry.id), null);
  assert.equal(index.find(e => e.id === entry.id), undefined);
});

test('migrateIfNeeded: migriert altes angebote.json', () => {
  const oldAngebote = [{
    id: 'alt-id-001',
    savedAt: '2026-01-01T00:00:00.000Z',
    angebotNr: 'A-2026-OLD',
    datum: '1.1.2026',
    betreff: 'Altes Angebot',
    kundeDisplay: 'Alter Kunde',
    netto: 500,
    brutto: 595,
    mwstSatz: 19,
    status: 'entwurf',
    snapshot: {
      angebotNr: 'A-2026-OLD',
      datum: '1.1.2026',
      gueltigBis: '15.1.2026',
      betreff: 'Altes Angebot',
      firma: { name: 'Meine Firma', logo: 'data:image/png;base64,CCCC' },
      kunde: { firma: 'Alter Kunde' },
      positionen: [],
      mwstSatz: 19,
    },
  }];
  const oldFile = path.join(tmpDir, 'angebote.json');
  const indexFile = path.join(tmpDir, 'angebote', 'index.json');
  if (fs.existsSync(indexFile)) fs.unlinkSync(indexFile);
  fs.writeFileSync(oldFile, JSON.stringify(oldAngebote));

  store.migrateIfNeeded();

  assert.ok(fs.existsSync(oldFile + '.migrated'));
  assert.ok(!fs.existsSync(oldFile));

  const full = store.readOffer('alt-id-001');
  assert.ok(full);
  assert.equal(full.angebotNr, 'A-2026-OLD');
  assert.equal(full.gueltigBis, '15.1.2026');
  assert.equal(full.snapshot.firma.logo, undefined);

  const index = store.readIndex();
  assert.ok(index.find(e => e.id === 'alt-id-001'));
});

test('migrateIfNeeded: zweiter Aufruf ist idempotent', () => {
  const indexBefore = store.readIndex();
  store.migrateIfNeeded();
  assert.deepEqual(store.readIndex(), indexBefore);
});

const mitAufschlag = {
  ...sampleData,
  positionen: [
    { menge: 2, einzelpreis: 100, aufschlag: 25, bezeichnung: 'Pos A', einheit: 'Stk.' },
    { menge: 1, einzelpreis: 50, aufschlag: 0, bezeichnung: 'Pos B', einheit: 'Stk.' },
  ],
};

test('createOffer: Netto/Brutto berücksichtigen den Aufschlag', () => {
  const { entry } = store.createOffer(mitAufschlag);
  assert.equal(entry.netto, 300);
  assert.ok(Math.abs(entry.brutto - 357) < 0.01);
});

test('updateOffer: Netto/Brutto berücksichtigen den Aufschlag', () => {
  const { entry } = store.createOffer(sampleData);
  const index = store.updateOffer(entry.id, { ...mitAufschlag, angebotNr: entry.angebotNr }, 'entwurf');
  assert.equal(index.find(e => e.id === entry.id).netto, 300);
});

test('patchOffer: Netto/Brutto berücksichtigen den Aufschlag', () => {
  const { entry } = store.createOffer(mitAufschlag);
  const index = store.patchOffer(entry.id, { status: 'gesendet' });
  assert.equal(index.find(e => e.id === entry.id).netto, 300);
});

test('recalcBrutto: korrigiert gespeicherte Beträge ohne Aufschlag', () => {
  const { entry } = store.createOffer(mitAufschlag);
  const indexFile = path.join(tmpDir, 'angebote', 'index.json');
  const falsch = store.readIndex().map(e => e.id === entry.id ? { ...e, netto: 250, brutto: 297.5 } : e);
  fs.writeFileSync(indexFile, JSON.stringify(falsch));

  store.recalcBrutto();

  const korrigiert = store.readIndex().find(e => e.id === entry.id);
  assert.equal(korrigiert.netto, 300);
  assert.ok(Math.abs(korrigiert.brutto - 357) < 0.01);
  assert.equal(store.readOffer(entry.id).netto, 300);
});

test('patchOffer: doppelte Rechnungsnummer wird mit Status 409 abgelehnt', () => {
  const a = store.createOffer(sampleData).entry;
  const b = store.createOffer(sampleData).entry;
  store.patchOffer(a.id, { rechnungsNr: 'R-2026-900' });
  assert.throws(
    () => store.patchOffer(b.id, { rechnungsNr: 'R-2026-900' }),
    e => e.status === 409 && /R-2026-900/.test(e.message)
  );
  assert.equal(store.readOffer(b.id).rechnungsNr, null);
});

test('patchOffer: eigene Rechnungsnummer erneut setzen ist erlaubt', () => {
  const a = store.createOffer(sampleData).entry;
  store.patchOffer(a.id, { rechnungsNr: 'R-2026-901' });
  store.patchOffer(a.id, { rechnungsNr: 'R-2026-901', status: 'bezahlt' });
  assert.equal(store.readOffer(a.id).status, 'bezahlt');
});

test('Angebots-IDs mit Pfadbestandteilen werden abgelehnt (kein Zugriff außerhalb von angebote/)', () => {
  fs.writeFileSync(path.join(tmpDir, 'users.json'), '[{"geheim":true}]');
  for (const id of ['../users', '..', 'a/b', 'a\\b', '']) {
    assert.throws(() => store.readOffer(id), e => e.status === 400, `readOffer(${JSON.stringify(id)})`);
    assert.throws(() => store.removeOffer(id), e => e.status === 400, `removeOffer(${JSON.stringify(id)})`);
    assert.throws(() => store.updateOffer(id, sampleData, 'entwurf'), e => e.status === 400);
    assert.throws(() => store.patchOffer(id, { status: 'x' }), e => e.status === 400);
  }
  assert.equal(fs.readFileSync(path.join(tmpDir, 'users.json'), 'utf8'), '[{"geheim":true}]');
});

test('createOffer: vergebene oder leere Angebotsnummer wird durch die nächste freie ersetzt', () => {
  const jahr = new Date().getFullYear();
  const erstes = store.createOffer({ ...sampleData, angebotNr: `A-${jahr}-900` }).entry;
  assert.equal(erstes.angebotNr, `A-${jahr}-900`);
  const doppelt = store.createOffer({ ...sampleData, angebotNr: `A-${jahr}-900` }).entry;
  assert.equal(doppelt.angebotNr, `A-${jahr}-901`);
  assert.equal(store.readOffer(doppelt.id).snapshot.angebotNr, `A-${jahr}-901`);
  const leer = store.createOffer({ ...sampleData, angebotNr: '  ' }).entry;
  assert.equal(leer.angebotNr, `A-${jahr}-902`);
});

test('updateOffer: Ändern auf eine vergebene Angebotsnummer gibt 409', () => {
  const a = store.createOffer({ ...sampleData, angebotNr: 'X-1' }).entry;
  const b = store.createOffer({ ...sampleData, angebotNr: 'X-2' }).entry;
  assert.throws(
    () => store.updateOffer(b.id, { ...sampleData, angebotNr: 'X-1' }, 'entwurf'),
    e => e.status === 409 && /X-1 ist bereits vergeben/.test(e.message),
  );
  assert.equal(store.readOffer(b.id).angebotNr, 'X-2');
  assert.equal(a.angebotNr, 'X-1');
});

test('updateOffer: unveränderte doppelte Nummer blockiert das Speichern nicht', () => {
  const a = store.createOffer({ ...sampleData, angebotNr: 'Y-1' }).entry;
  const b = store.createOffer({ ...sampleData, angebotNr: 'Y-2' }).entry;
  // Doppel aus der Zeit vor der Prüfung nachstellen
  const alt = store.readOffer(b.id);
  const index = store.readIndex().map(e => e.id === b.id ? { ...e, angebotNr: 'Y-1' } : e);
  fs.writeFileSync(path.join(tmpDir, 'angebote', `${b.id}.json`), JSON.stringify({ ...alt, angebotNr: 'Y-1' }));
  fs.writeFileSync(path.join(tmpDir, 'angebote', 'index.json'), JSON.stringify(index));
  store.updateOffer(b.id, { ...sampleData, angebotNr: 'Y-1', betreff: 'geändert' }, 'entwurf');
  assert.equal(store.readOffer(b.id).betreff, 'geändert');
  assert.equal(a.angebotNr, 'Y-1');
});
