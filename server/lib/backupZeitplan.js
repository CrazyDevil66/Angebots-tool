const { httpFehler } = require('./fehler');

const STANDARD = { haeufigkeit: 'taeglich', uhrzeit: '02:00', wochentag: 1, behalten: 14 };
const HAEUFIGKEITEN = new Set(['aus', 'taeglich', 'woechentlich']);

// Prüft die Einstellungen aus der Oberfläche; fehlende Felder bekommen den Standardwert.
function pruefeBackupEinstellungen(eingabe = {}) {
  const e = { ...STANDARD, ...eingabe };
  if (!HAEUFIGKEITEN.has(e.haeufigkeit)) throw httpFehler(400, 'Ungültige Häufigkeit');
  if (typeof e.uhrzeit !== 'string' || !/^([01]\d|2[0-3]):[0-5]\d$/.test(e.uhrzeit)) {
    throw httpFehler(400, 'Uhrzeit bitte als HH:MM angeben');
  }
  const wochentag = Number(e.wochentag);
  if (!Number.isInteger(wochentag) || wochentag < 0 || wochentag > 6) throw httpFehler(400, 'Ungültiger Wochentag');
  const behalten = Number(e.behalten);
  if (!Number.isInteger(behalten) || behalten < 1 || behalten > 365) {
    throw httpFehler(400, 'Anzahl der Sicherungen muss zwischen 1 und 365 liegen');
  }
  return { haeufigkeit: e.haeufigkeit, uhrzeit: e.uhrzeit, wochentag, behalten };
}

// Der zuletzt vergangene geplante Zeitpunkt (Ortszeit), oder null wenn abgeschaltet.
function letzterTermin(jetzt, einstellungen) {
  if (einstellungen.haeufigkeit === 'aus') return null;
  const [stunde, minute] = einstellungen.uhrzeit.split(':').map(Number);
  const termin = new Date(jetzt);
  termin.setHours(stunde, minute, 0, 0);
  if (einstellungen.haeufigkeit === 'taeglich') {
    if (termin > jetzt) termin.setDate(termin.getDate() - 1);
    return termin;
  }
  termin.setDate(termin.getDate() - ((termin.getDay() - einstellungen.wochentag + 7) % 7));
  if (termin > jetzt) termin.setDate(termin.getDate() - 7);
  return termin;
}

// Fällig, wenn seit dem letzten Termin keine automatische Sicherung angelegt wurde –
// so wird ein verpasster Termin (Server lief nicht) nach dem Start nachgeholt.
function istFaellig(jetzt, einstellungen, letzteSicherung) {
  const termin = letzterTermin(jetzt, einstellungen);
  if (!termin) return false;
  return !letzteSicherung || letzteSicherung < termin;
}

module.exports = { STANDARD, pruefeBackupEinstellungen, letzterTermin, istFaellig };
