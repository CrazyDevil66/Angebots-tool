const path = require('path');
const crypto = require('crypto');
const { dataDir } = require('./paths');
const { leseJson, schreibeJsonAtomar } = require('./lib/jsonDatei');

const PORT = process.env.PORT || 3000;

function configFile() {
  return path.join(dataDir(), 'config.json');
}

function readConfig() {
  return leseJson(configFile(), {});
}

function writeConfig(update) {
  schreibeJsonAtomar(configFile(), { ...readConfig(), ...update });
}

function getJwtSecret() {
  if (process.env.JWT_SECRET) return process.env.JWT_SECRET;
  const { jwtSecret } = readConfig();
  if (jwtSecret) return jwtSecret;
  const neu = crypto.randomBytes(48).toString('hex');
  writeConfig({ jwtSecret: neu });
  return neu;
}

module.exports = { PORT, readConfig, writeConfig, getJwtSecret };
