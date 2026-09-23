// Sortierung für Tabellen. Ohne gewählte Sortierung bleibt die Reihenfolge des Servers (neueste zuerst).

function istLeer(wert) {
  return wert === null || wert === undefined || wert === '' || (wert instanceof Date && isNaN(wert));
}

function vergleiche(x, y) {
  if (x instanceof Date) return x - y;
  if (typeof x === 'number') return x - y;
  return String(x).localeCompare(String(y), 'de', { numeric: true, sensitivity: 'base' });
}

// werte: { feld: eintrag => Vergleichswert }. Leere Werte stehen immer am Ende.
export function sortiere(liste, sortierung, werte) {
  if (!sortierung) return liste;
  const wert = werte[sortierung.feld];
  const faktor = sortierung.richtung === 'ab' ? -1 : 1;
  return [...liste].sort((a, b) => {
    const x = wert(a);
    const y = wert(b);
    if (istLeer(x) || istLeer(y)) return istLeer(x) - istLeer(y);
    return faktor * vergleiche(x, y);
  });
}

// Erster Klick auf eine Spalte sortiert aufsteigend, jeder weitere dreht die Richtung um.
export function naechsteSortierung(aktuell, feld) {
  if (aktuell?.feld !== feld) return { feld, richtung: 'auf' };
  return { feld, richtung: aktuell.richtung === 'auf' ? 'ab' : 'auf' };
}
