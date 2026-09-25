import { test } from 'node:test';
import assert from 'node:assert/strict';
import { zerlegeEreignisse } from './sse.js';

test('zerlegeEreignisse: vollständige Ereignisse, Rest bleibt stehen', () => {
  const { daten, rest } = zerlegeEreignisse('data: {"dataType":"kunden"}\n\ndata: {"dataType":"ang');
  assert.deepEqual(daten, ['{"dataType":"kunden"}']);
  assert.equal(rest, 'data: {"dataType":"ang');
});

test('zerlegeEreignisse: über Stückgrenzen hinweg', () => {
  const erstes = zerlegeEreignisse('data: {"dataType":"ang');
  const zweites = zerlegeEreignisse(`${erstes.rest}ebote"}\n\n`);
  assert.deepEqual(erstes.daten, []);
  assert.deepEqual(zweites.daten, ['{"dataType":"angebote"}']);
  assert.equal(zweites.rest, '');
});

test('zerlegeEreignisse: retry und Heartbeat liefern keine Daten', () => {
  const { daten, rest } = zerlegeEreignisse('retry: 5000\n\n:\n\n:\n\ndata: {"dataType":"firma"}\n\n');
  assert.deepEqual(daten, ['{"dataType":"firma"}']);
  assert.equal(rest, '');
});

test('zerlegeEreignisse: mehrzeilige Daten werden mit Zeilenumbruch verbunden', () => {
  assert.deepEqual(zerlegeEreignisse('data: a\ndata:b\n\n').daten, ['a\nb']);
});
