const { test, beforeEach, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const os = require('os');

const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'config-test-'));
process.env.DATA_DIR = tmpDir;
delete process.env.JWT_SECRET;

const { readConfig, getJwtSecret } = require('./config');
const configDatei = path.join(tmpDir, 'config.json');

after(() => fs.rmSync(tmpDir, { recursive: true }));

beforeEach(() => {
  fs.rmSync(configDatei, { force: true });
});

test('readConfig wirft bei beschädigter config.json', () => {
  fs.writeFileSync(configDatei, '{"smtp": {');
  assert.throws(() => readConfig(), /beschädigt/);
});

test('getJwtSecret erzeugt ein Secret und behält vorhandene SMTP-Daten', () => {
  fs.writeFileSync(configDatei, JSON.stringify({ smtp: { host: 'mail.test.de' } }));
  const secret = getJwtSecret();
  assert.ok(secret.length >= 64);
  const config = readConfig();
  assert.equal(config.jwtSecret, secret);
  assert.equal(config.smtp.host, 'mail.test.de');
});

test('getJwtSecret überschreibt eine beschädigte config.json nicht', () => {
  fs.writeFileSync(configDatei, '{"smtp": {');
  assert.throws(() => getJwtSecret(), /beschädigt/);
  assert.equal(fs.readFileSync(configDatei, 'utf8'), '{"smtp": {');
});
