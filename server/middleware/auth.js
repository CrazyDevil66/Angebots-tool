const jwt = require('jsonwebtoken');
const { getJwtSecret } = require('../config');

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
  }, jwtSecret(), { expiresIn: '7d' });
}

function verifyToken(token) {
  return jwt.verify(token, jwtSecret());
}

function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'Nicht authentifiziert' });
  try {
    req.user = verifyToken(token);
    next();
  } catch {
    res.status(401).json({ error: 'Ungültiger Token' });
  }
}

function requireAdmin(req, res, next) {
  if (req.user?.role !== 'admin') return res.status(403).json({ error: 'Kein Zugriff' });
  next();
}

module.exports = { jwtSecret, makeToken, verifyToken, requireAuth, requireAdmin };
