const { test } = require('node:test');
const assert = require('node:assert/strict');

const { STANDARD, pruefeBackupEinstellungen, letzterTermin, istFaellig } = require('./backupZeitplan');

const taeglich = { ...STANDARD, uhrzeit: '02:00' };
// 23.09.2026 ist ein Mittwoch (Wochentag 3)
const MI_1400 = new Date(2026, 8, 23, 14, 0);

test('letzterTermin täglich: heute, wenn die Uhrzeit vorbei ist, sonst gestern', () => {
  assert.deepEqual(letzterTermin(MI_1400, taeglich), new Date(2026, 8, 23, 2, 0));
  assert.deepEqual(letzterTermin(new Date(2026, 8, 23, 1, 59), taeglich), new Date(2026, 8, 22, 2, 0));
  assert.deepEqual(letzterTermin(new Date(2026, 8, 23, 2, 0), taeglich), new Date(2026, 8, 23, 2, 0));
});

test('letzterTermin wöchentlich: letzter passender Wochentag', () => {
  const montags = { ...STANDARD, haeufigkeit: 'woechentlich', wochentag: 1, uhrzeit: '03:30' };
  assert.deepEqual(letzterTermin(MI_1400, montags), new Date(2026, 8, 21, 3, 30));
  const mittwochs = { ...montags, wochentag: 3 };
  assert.deepEqual(letzterTermin(MI_1400, mittwochs), new Date(2026, 8, 23, 3, 30));
  assert.deepEqual(letzterTermin(new Date(2026, 8, 23, 3, 0), mittwochs), new Date(2026, 8, 16, 3, 30));
});

test('istFaellig: ohne Sicherung seit dem letzten Termin, nicht bei „aus“', () => {
  assert.equal(istFaellig(MI_1400, taeglich, null), true);
  assert.equal(istFaellig(MI_1400, taeglich, new Date(2026, 8, 23, 1, 0)), true);
  assert.equal(istFaellig(MI_1400, taeglich, new Date(2026, 8, 23, 2, 0)), false);
  assert.equal(istFaellig(MI_1400, { ...taeglich, haeufigkeit: 'aus' }, null), false);
});

test('pruefeBackupEinstellungen: Standardwerte und ungültige Eingaben', () => {
  assert.deepEqual(pruefeBackupEinstellungen(undefined), STANDARD);
  assert.deepEqual(
    pruefeBackupEinstellungen({ haeufigkeit: 'woechentlich', uhrzeit: '23:59', wochentag: '0', behalten: '30' }),
    { haeufigkeit: 'woechentlich', uhrzeit: '23:59', wochentag: 0, behalten: 30 },
  );
  const status400 = e => e.status === 400;
  assert.throws(() => pruefeBackupEinstellungen({ haeufigkeit: 'stuendlich' }), status400);
  assert.throws(() => pruefeBackupEinstellungen({ uhrzeit: '24:00' }), status400);
  assert.throws(() => pruefeBackupEinstellungen({ uhrzeit: '2:00' }), status400);
  assert.throws(() => pruefeBackupEinstellungen({ wochentag: 7 }), status400);
  assert.throws(() => pruefeBackupEinstellungen({ behalten: 0 }), status400);
  assert.throws(() => pruefeBackupEinstellungen({ behalten: 366 }), status400);
  assert.throws(() => pruefeBackupEinstellungen({ behalten: 2.5 }), status400);
});
