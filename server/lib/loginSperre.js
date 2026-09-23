const LOCKOUT_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 5;

const lockouts = new Map();

function checkLockout(ip) {
  const entry = lockouts.get(ip);
  if (!entry?.lockedUntil) return false;
  if (Date.now() < entry.lockedUntil) return true;
  lockouts.delete(ip);
  return false;
}

function recordFailure(ip) {
  let entry = lockouts.get(ip) || { attempts: 0, lockedUntil: null };
  // Abgelaufene Sperre zurücksetzen — neue Versuche beginnen fresh
  if (entry.lockedUntil && Date.now() >= entry.lockedUntil) {
    entry = { attempts: 0, lockedUntil: null };
  }
  entry.attempts += 1;
  entry.lastFailure = Date.now();
  if (entry.attempts >= MAX_ATTEMPTS) entry.lockedUntil = Date.now() + LOCKOUT_MS;
  lockouts.set(ip, entry);
}

function clearLockout(ip) {
  lockouts.delete(ip);
}

function remainingLockoutSeconds(ip) {
  const entry = lockouts.get(ip);
  if (!entry?.lockedUntil) return 0;
  return Math.max(0, Math.ceil((entry.lockedUntil - Date.now()) / 1000));
}

// Entfernt abgelaufene Sperren und Fehlversuche, die älter als die Sperrdauer sind,
// damit die Liste bei vielen verschiedenen IPs nicht unbegrenzt wächst.
function aufraeumen(jetzt = Date.now()) {
  for (const [ip, entry] of lockouts) {
    const abgelaufen = entry.lockedUntil
      ? jetzt >= entry.lockedUntil
      : jetzt >= entry.lastFailure + LOCKOUT_MS;
    if (abgelaufen) lockouts.delete(ip);
  }
}

setInterval(aufraeumen, LOCKOUT_MS).unref();

function _anzahlEintraege() {
  return lockouts.size;
}

function _resetAll() {
  lockouts.clear();
}

module.exports = { checkLockout, recordFailure, clearLockout, remainingLockoutSeconds, aufraeumen, _anzahlEintraege, _resetAll };
