export function formatBetrag(wert) {
  return (Number(wert) || 0).toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function formatEuro(wert) {
  return `${formatBetrag(wert)} €`;
}
