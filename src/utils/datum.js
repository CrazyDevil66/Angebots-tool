// Datumswerte werden im Projekt als deutsche Strings "TT.MM.JJJJ" gespeichert.

import { parseDEDate } from '../../shared/datum.js';

export { parseDEDate };

// Ganze Tage seit einem Datum "TT.MM.JJJJ" (0 = heute), null bei ungültigem Datum.
export function tageSeit(deStr, jetzt = new Date()) {
  const datum = parseDEDate(deStr);
  if (!datum) return null;
  const heute = new Date(jetzt);
  heute.setHours(0, 0, 0, 0);
  return Math.round((heute - datum) / 86400000);
}

function zweistellig(n) {
  return String(n).padStart(2, '0');
}

function alsDE(datum) {
  return `${zweistellig(datum.getDate())}.${zweistellig(datum.getMonth() + 1)}.${datum.getFullYear()}`;
}

// Anzeige immer als TT.MM.JJJJ – ältere Werte sind ohne führende Null gespeichert ("1.9.2026").
export function formatDatum(deStr) {
  const datum = parseDEDate(deStr);
  return datum && !isNaN(datum) ? alsDE(datum) : (deStr || '');
}

export function heuteDE() {
  return alsDE(new Date());
}

export function add14Days(deDatum) {
  if (!deDatum) return '';
  const [d, m, y] = deDatum.split('.').map(Number);
  if (!d || !m || !y) return '';
  const date = new Date(y, m - 1, d);
  date.setDate(date.getDate() + 14);
  return alsDE(date);
}

export function deToIso(de) {
  if (!de) return '';
  const [d, m, y] = de.split('.');
  if (!d || !m || !y || y.length < 4) return '';
  return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
}

export function isoToDe(iso) {
  if (!iso) return '';
  const [y, m, d] = iso.split('-');
  if (!y || !m || !d) return '';
  return `${d}.${m}.${y}`;
}
