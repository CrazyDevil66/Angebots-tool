const { test } = require('node:test');
const assert = require('node:assert/strict');

const { sicherheitsHeader } = require('./sicherheitsHeader');

test('sicherheitsHeader setzt CSP und Schutz-Header', () => {
  const headers = {};
  let weiter = false;
  sicherheitsHeader({}, { setHeader: (k, v) => { headers[k] = v; } }, () => { weiter = true; });
  assert.equal(weiter, true);
  assert.match(headers['Content-Security-Policy'], /default-src 'self'/);
  assert.match(headers['Content-Security-Policy'], /frame-ancestors 'none'/);
  assert.equal(headers['X-Content-Type-Options'], 'nosniff');
  assert.equal(headers['X-Frame-Options'], 'DENY');
  assert.equal(headers['Referrer-Policy'], 'same-origin');
});
