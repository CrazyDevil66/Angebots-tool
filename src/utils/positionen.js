import { neueId } from './id.js';

// Hilfsfunktionen für die Angebotspositionen. Die Reihenfolge im Array ist
// die Reihenfolge in Vorschau und PDF.

export function neuePosition() {
  return { id: neueId(), bezeichnung: '', beschreibung: '', menge: 1, einheit: 'Stk.', einzelpreis: 0, aufschlag: 0 };
}

// Stabile IDs, damit React die Zeilen beim Umsortieren korrekt zuordnet.
// Ältere Angebote haben noch keine – sie bekommen sie beim Öffnen.
export function mitPositionsIds(positionen) {
  if (positionen.every(p => p.id)) return positionen;
  return positionen.map(p => (p.id ? p : { ...p, id: neueId() }));
}

export function verschiebePosition(positionen, von, nach) {
  const gueltig = i => Number.isInteger(i) && i >= 0 && i < positionen.length;
  if (!gueltig(von) || !gueltig(nach) || von === nach) return [...positionen];
  const neu = [...positionen];
  const [position] = neu.splice(von, 1);
  neu.splice(nach, 0, position);
  return neu;
}

// Drag & Drop liefert eine Einfügelücke (0 = vor der ersten Zeile, n = nach der
// letzten). Da die gezogene Zeile vorher entfernt wird, verschiebt sich der
// Zielindex für Lücken hinter ihr um eins.
export function zielIndexBeimEinfuegen(von, luecke) {
  return luecke > von ? luecke - 1 : luecke;
}
