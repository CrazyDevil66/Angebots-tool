const express = require('express');
const path = require('path');
const { PORT, readConfig } = require('./config');
const { dataDir, DIST_DIR } = require('./paths');
const { jwtSecret } = require('./middleware/auth');
const { eventsHandler, broadcastDataUpdate } = require('./sse');
const angeboteStore = require('./stores/angebote');
const users = require('./stores/users');
const { trustProxyAus } = require('./lib/trustProxy');
const { sicherheitsHeader } = require('./lib/sicherheitsHeader');

// Beschädigte Konfigurations- oder Benutzerdaten sollen den Start verhindern,
// statt mit leeren Daten weiterzulaufen.
try {
  readConfig();
  users.readUsers();
} catch (e) {
  console.error(`Start abgebrochen: ${e.message}`);
  process.exit(1);
}

jwtSecret();
angeboteStore.migrateIfNeeded();
angeboteStore.recalcBrutto();

const STUENDLICH = 60 * 60 * 1000;
function abgelaufeneMarkieren() {
  try {
    if (angeboteStore.markiereAbgelaufene() > 0) broadcastDataUpdate('angebote');
  } catch (e) {
    console.error('Markieren abgelaufener Angebote fehlgeschlagen:', e);
  }
}
abgelaufeneMarkieren();
setInterval(abgelaufeneMarkieren, STUENDLICH);

const app = express();
app.set('trust proxy', trustProxyAus(process.env.TRUST_PROXY));
app.disable('x-powered-by');
app.use(sicherheitsHeader);
app.use(express.json({ limit: '10mb' }));

app.use('/api', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/config/smtp', require('./routes/smtp'));
app.get('/api/events', eventsHandler);
app.use('/api/data', require('./routes/data'));
app.use('/api/angebote', require('./routes/angebote'));
app.use('/api/backup', require('./routes/backup'));
app.use('/invite', require('./routes/einladung'));

// Static files + SPA fallback (muss als letztes stehen)
app.use(express.static(DIST_DIR));
app.get('*', (_req, res) => res.sendFile(path.join(DIST_DIR, 'index.html')));

app.listen(PORT, () => {
  console.log(`AngebotsTool läuft auf Port ${PORT}`);
  console.log(`Datenspeicher: ${dataDir()}`);
});
