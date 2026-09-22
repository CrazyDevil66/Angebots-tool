const { verifyToken } = require('./middleware/auth');

const clients = new Set();

function broadcastDataUpdate(dataType) {
  const msg = `data: ${JSON.stringify({ dataType })}\n\n`;
  for (const client of clients) {
    try { client.write(msg); } catch { clients.delete(client); }
  }
}

function eventsHandler(req, res) {
  const token = req.query.token;
  if (!token) return res.status(401).json({ error: 'Token fehlt' });
  try { verifyToken(token); } catch {
    return res.status(401).json({ error: 'Ungültiger Token' });
  }
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'X-Accel-Buffering': 'no',
  });
  res.write(':\n\n');
  clients.add(res);
  req.on('close', () => clients.delete(res));
}

module.exports = { broadcastDataUpdate, eventsHandler };
