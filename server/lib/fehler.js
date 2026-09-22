function httpFehler(status, message) {
  const err = new Error(message);
  err.status = status;
  return err;
}

function sendeFehler(res, e) {
  res.status(e.status || 500).json({ error: e.message });
}

module.exports = { httpFehler, sendeFehler };
