function naechsteNummer(eintraege, feld, kuerzel) {
  if (!Array.isArray(eintraege)) {
    throw new Error(`Für die nächste ${feld} wird die Angebotsliste benötigt`);
  }
  const prefix = `${kuerzel}-${new Date().getFullYear()}-`;
  let max = 0;
  for (const eintrag of eintraege) {
    const nr = eintrag[feld];
    if (!nr?.startsWith(prefix)) continue;
    const n = parseInt(nr.slice(prefix.length), 10);
    if (!isNaN(n) && n > max) max = n;
  }
  return `${prefix}${String(max + 1).padStart(3, '0')}`;
}

export function nextAngebotNr(angebote) {
  return naechsteNummer(angebote, 'angebotNr', 'A');
}

export function nextRechnungsNr(angebote) {
  return naechsteNummer(angebote, 'rechnungsNr', 'R');
}
