/**
 * Zerlegt einen Server-Sent-Events-Datenstrom. Liefert die `data`-Inhalte aller vollständigen
 * Ereignisse und den unvollständigen Rest, der mit dem nächsten Stück des Stroms weitergeht.
 * Kommentarzeilen (Heartbeat) und andere Felder wie `retry` werden übergangen.
 * @param {string} puffer
 * @returns {{ daten: string[], rest: string }}
 */
export function zerlegeEreignisse(puffer) {
  const bloecke = puffer.split('\n\n');
  const rest = bloecke.pop();
  const daten = [];
  for (const block of bloecke) {
    const zeilen = block.split('\n')
      .filter(z => z.startsWith('data:'))
      .map(z => z.slice(5).replace(/^ /, ''));
    if (zeilen.length > 0) daten.push(zeilen.join('\n'));
  }
  return { daten, rest };
}
