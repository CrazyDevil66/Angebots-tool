// Einzige Quelle für Preisberechnungen – wird von Frontend (Vite) und Server (require) genutzt.

function zahl(wert) {
  const n = Number(wert);
  return Number.isFinite(n) ? n : 0;
}

export function vkPreis(position) {
  return zahl(position.einzelpreis) * (1 + zahl(position.aufschlag) / 100);
}

export function positionGesamt(position) {
  return zahl(position.menge) * vkPreis(position);
}

export function berechneSummen(positionen = [], mwstSatz = 0) {
  const netto = positionen.reduce((summe, p) => summe + positionGesamt(p), 0);
  const mwst = netto * (zahl(mwstSatz) / 100);
  return { netto, mwst, brutto: netto + mwst };
}
