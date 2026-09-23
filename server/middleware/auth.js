const jwt = require('jsonwebtoken');
const { getJwtSecret } = require('../config');
const users = require('../stores/users');

let secret = null;

function jwtSecret() {
  if (!secret) secret = getJwtSecret();
  return secret;
}

function makeToken(user) {
  return jwt.sign({
    userId: user.id,
    username: user.username,
    role: user.role,
    mustChangePassword: !!user.mustChangePassword,
    tokenVersion: user.tokenVersion || 0,
  }, jwtSecret(), { expiresIn: '7d' });
}

function verifyToken(token) {
  return jwt.verify(token, jwtSecret());
}

// Rolle und Gültigkeit kommen aus users.json, nicht aus dem Token: Gelöschte oder
// herabgestufte Benutzer und Tokens von vor einem Passwortwechsel greifen so sofort nicht mehr.
function benutzerZumToken(payload) {
  const user = users.findById(payload.userId);
  if (!user || (user.tokenVersion || 0) !== (payload.tokenVersion || 0)) return null;
  return {
    userId: user.id,
    username: user.username,
    role: user.role,
    mustChangePassword: !!user.mustChangePassword,
  };
}

function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'Nicht authentifiziert' });
  let payload;
  try {
    payload = verifyToken(token);
  } catch {
    return res.status(401).json({ error: 'Ungültiger Token' });
  }
  const user = benutzerZumToken(payload);
  if (!user) return res.status(401).json({ error: 'Sitzung ungültig, bitte neu anmelden' });
  req.user = user;
  next();
}

function requireAdmin(req, res, next) {
  if (req.user?.role !== 'admin') return res.status(403).json({ error: 'Kein Zugriff' });
  next();
}

module.exports = { jwtSecret, makeToken, verifyToken, benutzerZumToken, requireAuth, requireAdmin };
