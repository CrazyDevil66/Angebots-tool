const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { dataDir } = require('./paths');

const PORT = process.env.PORT || 3000;

function configFile() {
  return path.join(dataDir(), 'config.json');
}

function readConfig() {
  try {
    const f = configFile();
    if (!fs.existsSync(f)) return {};
    return JSON.parse(fs.readFileSync(f, 'utf8'));
  } catch { return {}; }
}

function writeConfig(update) {
  fs.mkdirSync(dataDir(), { recursive: true });
  fs.writeFileSync(configFile(), JSON.stringify({ ...readConfig(), ...update }, null, 2));
}

function getJwtSecret() {
  if (process.env.JWT_SECRET) return process.env.JWT_SECRET;
  const config = readConfig();
  if (!config.jwtSecret) {
    config.jwtSecret = crypto.randomBytes(48).toString('hex');
    fs.mkdirSync(dataDir(), { recursive: true });
    fs.writeFileSync(configFile(), JSON.stringify(config, null, 2));
  }
  return config.jwtSecret;
}

module.exports = { PORT, readConfig, writeConfig, getJwtSecret };
