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

export function heuteDE() {
  return new Date().toLocaleDateString('de-DE');
}

export function add14Days(deDatum) {
  if (!deDatum) return '';
  const [d, m, y] = deDatum.split('.').map(Number);
  if (!d || !m || !y) return '';
  const date = new Date(y, m - 1, d);
  date.setDate(date.getDate() + 14);
  return date.toLocaleDateString('de-DE');
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
