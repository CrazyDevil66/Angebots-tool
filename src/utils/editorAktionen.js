/**
 * Aktionen der Editor-Topbar nach Speichern und PDF, in Anzeigereihenfolge.
 * Schmale Bildschirme zeigen alle im Mehr-Menü, der Desktop nur die Nebenaktionen (siehe EditorTopbar).
 * `menuLabel` ersetzt im Mehr-Menü das knappe `label` des Buttons.
 * @returns {{ id: 'mail'|'rechnung'|'rechnungPdf'|'mahnung'|'bezahlt', label: string, menuLabel?: string }[]}
 */
export function zusatzAktionen({ status, rechnungsNr, mahnStufe = 0, kundeEmail }) {
  const offeneRechnung = !!rechnungsNr && status !== 'bezahlt';
  const aktionen = [];
  if (kundeEmail) aktionen.push({ id: 'mail', label: 'Per Mail senden' });
  if (status === 'angenommen' && !rechnungsNr) aktionen.push({ id: 'rechnung', label: 'Rechnung erstellen' });
  if (offeneRechnung) {
    aktionen.push({ id: 'rechnungPdf', label: rechnungsNr, menuLabel: `Rechnung ${rechnungsNr} (PDF)` });
    aktionen.push({ id: 'mahnung', label: mahnStufe > 0 ? `Mahnung (Stufe ${mahnStufe})` : 'Mahnung erstellen' });
    aktionen.push({ id: 'bezahlt', label: 'Als bezahlt markieren' });
  }
  return aktionen;
}
