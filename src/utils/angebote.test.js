import { test } from 'node:test';
import assert from 'node:assert/strict';
import { istAngenommen } from './angebote.js';

test('istAngenommen: angenommen, gemahnt und bezahlt zählen als angenommen', () => {
  for (const status of ['angenommen', 'gemahnt', 'bezahlt']) assert.equal(istAngenommen({ status }), true);
});

test('istAngenommen: offene, abgelehnte und abgelaufene Angebote nicht', () => {
  for (const status of ['entwurf', 'gesendet', 'abgelehnt', 'abgelaufen', undefined]) {
    assert.equal(istAngenommen({ status }), false);
  }
});
