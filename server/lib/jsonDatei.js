const fs = require('fs');
const path = require('path');

// Fehlt die Datei, gilt der Standardwert. Eine beschädigte Datei ist dagegen ein Fehler:
// Ein stilles [] bei users.json würde die Erstkonfiguration wieder öffnen.
function leseJson(datei, standardwert) {
  let inhalt;
  try {
    inhalt = fs.readFileSync(datei, 'utf8');
  } catch (e) {
    if (e.code === 'ENOENT') return standardwert;
    throw e;
  }
  try {
    return JSON.parse(inhalt);
  } catch (e) {
    throw new Error(`${datei} ist beschädigt und kann nicht gelesen werden: ${e.message}`, { cause: e });
  }
}

function schreibeJsonAtomar(datei, daten) {
  fs.mkdirSync(path.dirname(datei), { recursive: true });
  const tmp = datei + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify(daten, null, 2));
  fs.renameSync(tmp, datei);
}

module.exports = { leseJson, schreibeJsonAtomar };
