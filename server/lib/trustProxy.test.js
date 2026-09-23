const { test } = require('node:test');
const assert = require('node:assert/strict');

const { trustProxyAus } = require('./trustProxy');

test('trustProxyAus vertraut ohne Angabe keinem Proxy', () => {
  assert.equal(trustProxyAus(undefined), false);
  assert.equal(trustProxyAus(''), false);
  assert.equal(trustProxyAus('  '), false);
  assert.equal(trustProxyAus('false'), false);
});

test('trustProxyAus wertet Zahlen als Anzahl der Proxys', () => {
  assert.equal(trustProxyAus('1'), 1);
  assert.equal(trustProxyAus(' 2 '), 2);
});

test('trustProxyAus reicht true und Adressangaben an Express weiter', () => {
  assert.equal(trustProxyAus('true'), true);
  assert.equal(trustProxyAus('172.17.0.0/16'), '172.17.0.0/16');
  assert.equal(trustProxyAus('loopback, 10.0.0.5'), 'loopback, 10.0.0.5');
});
