// Datumswerte werden im Projekt als deutsche Strings "TT.MM.JJJJ" gespeichert.
export function parseDEDate(str) {
  if (!str) return null;
  const [d, m, y] = str.split('.');
  if (!d || !m || !y) return null;
  return new Date(Number(y), Number(m) - 1, Number(d));
}

// Entwürfe und gesendete Angebote gelten ab dem Tag nach „gültig bis“ als abgelaufen.
export function istAbgelaufen(eintrag, heute = new Date()) {
  if (eintrag.status !== 'entwurf' && eintrag.status !== 'gesendet') return false;
  const gueltigBis = parseDEDate(eintrag.gueltigBis);
  if (!gueltigBis) return false;
  const tag = new Date(heute);
  tag.setHours(0, 0, 0, 0);
  return gueltigBis < tag;
}
