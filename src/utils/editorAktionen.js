/**
 * Aktionen der Editor-Topbar nach Speichern und PDF, in Anzeigereihenfolge.
 * Desktop zeigt sie als Buttons, schmale Bildschirme im Mehr-Menü.
 * @returns {{ id: 'mail'|'rechnung'|'rechnungPdf'|'mahnung'|'bezahlt', label: string }[]}
 */
export function zusatzAktionen({ status, rechnungsNr, mahnStufe = 0, kundeEmail }) {
  const offeneRechnung = !!rechnungsNr && status !== 'bezahlt';
  const aktionen = [];
  if (kundeEmail) aktionen.push({ id: 'mail', label: 'Per Mail senden' });
  if (status === 'angenommen' && !rechnungsNr) aktionen.push({ id: 'rechnung', label: 'Rechnung erstellen' });
  if (offeneRechnung) {
    aktionen.push({ id: 'rechnungPdf', label: rechnungsNr });
    aktionen.push({ id: 'mahnung', label: mahnStufe > 0 ? `Mahnung (Stufe ${mahnStufe})` : 'Mahnung erstellen' });
    aktionen.push({ id: 'bezahlt', label: 'Als bezahlt markieren' });
  }
  return aktionen;
}
