import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseDEDate, istAbgelaufen } from './datum.js';

const HEUTE = new Date(2026, 8, 23, 14, 30);

test('parseDEDate liest TT.MM.JJJJ und lehnt Unvollständiges ab', () => {
  assert.equal(parseDEDate('5.3.2026').getTime(), new Date(2026, 2, 5).getTime());
  assert.equal(parseDEDate(''), null);
  assert.equal(parseDEDate('5.3'), null);
});

test('istAbgelaufen: erst ab dem Tag nach „gültig bis“', () => {
  assert.equal(istAbgelaufen({ status: 'entwurf', gueltigBis: '22.9.2026' }, HEUTE), true);
  assert.equal(istAbgelaufen({ status: 'gesendet', gueltigBis: '22.9.2026' }, HEUTE), true);
  assert.equal(istAbgelaufen({ status: 'entwurf', gueltigBis: '23.9.2026' }, HEUTE), false);
});

test('istAbgelaufen: andere Status und fehlendes Datum bleiben unberührt', () => {
  for (const status of ['angenommen', 'abgelehnt', 'abgelaufen', 'gemahnt', 'bezahlt']) {
    assert.equal(istAbgelaufen({ status, gueltigBis: '1.1.2020' }, HEUTE), false);
  }
  assert.equal(istAbgelaufen({ status: 'entwurf', gueltigBis: '' }, HEUTE), false);
});
