import { test } from 'node:test';
import assert from 'node:assert/strict';
import { neueId } from './id.js';

const UUID_V4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

test('neueId: liefert eine UUID v4', () => {
  assert.match(neueId(), UUID_V4);
});

test('neueId: funktioniert ohne crypto.randomUUID (Aufruf über http://IP)', () => {
  const original = crypto.randomUUID;
  crypto.randomUUID = undefined;
  try {
    const ids = new Set(Array.from({ length: 1000 }, () => neueId()));
    assert.equal(ids.size, 1000);
    for (const id of ids) assert.match(id, UUID_V4);
  } finally {
    crypto.randomUUID = original;
  }
});
