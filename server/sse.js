const clients = new Set();

// Proxys wie Cloudflare trennen Verbindungen ohne Datenverkehr nach ca. 100 s.
// Der Kommentar-Heartbeat hält sie offen; retry verkürzt die Wiederverbindung.
const HEARTBEAT_MS = 25000;
const RETRY_MS = 5000;

function broadcastDataUpdate(dataType) {
  const msg = `data: ${JSON.stringify({ dataType })}\n\n`;
  for (const client of clients) {
    try { client.write(msg); } catch { clients.delete(client); }
  }
}

// Anmeldung prüft requireAuth vorher; das Frontend sendet das Token im Authorization-Header.
function eventsHandler(req, res) {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'X-Accel-Buffering': 'no',
  });
  res.write(`retry: ${RETRY_MS}\n\n`);
  clients.add(res);
  const heartbeat = setInterval(() => {
    try { res.write(':\n\n'); } catch { clearInterval(heartbeat); clients.delete(res); }
  }, HEARTBEAT_MS);
  req.on('close', () => {
    clearInterval(heartbeat);
    clients.delete(res);
  });
}

module.exports = { broadcastDataUpdate, eventsHandler };
