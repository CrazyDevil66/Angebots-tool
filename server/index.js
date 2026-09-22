const express = require('express');
const path = require('path');
const { PORT } = require('./config');
const { dataDir, DIST_DIR } = require('./paths');
const { jwtSecret } = require('./middleware/auth');
const { eventsHandler } = require('./sse');
const angeboteStore = require('./stores/angebote');

jwtSecret();
angeboteStore.migrateIfNeeded();
angeboteStore.recalcBrutto();

const app = express();
app.set('trust proxy', 1);
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
