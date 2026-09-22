// Datumswerte werden im Projekt als deutsche Strings "TT.MM.JJJJ" gespeichert.

export function parseDEDate(str) {
  if (!str) return null;
  const [d, m, y] = str.split('.');
  if (!d || !m || !y) return null;
  return new Date(Number(y), Number(m) - 1, Number(d));
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
