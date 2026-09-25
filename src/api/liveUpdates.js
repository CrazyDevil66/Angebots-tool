import { pruefeSitzung } from './client';
import { zerlegeEreignisse } from '../utils/sse';

const WIEDERVERBINDEN_MS = 5000;

// fetch statt EventSource, damit das Token im Authorization-Header steht und nicht in der URL (Proxy-Logs).
async function verbinden(token, signal, onDatenAenderung) {
  const res = await fetch('/api/events', { headers: { Authorization: `Bearer ${token}` }, signal });
  pruefeSitzung(res);
  // Bei ungültiger Sitzung meldet die App ab; ein neuer Versuch wäre zwecklos.
  if (res.status === 401 || res.status === 403) return false;
  if (!res.ok) throw new Error(`Live-Verbindung fehlgeschlagen (${res.status})`);
  const leser = res.body.pipeThrough(new TextDecoderStream()).getReader();
  let puffer = '';
  for (;;) {
    const { value, done } = await leser.read();
    if (done) return true;
    const { daten, rest } = zerlegeEreignisse(puffer + value);
    puffer = rest;
    for (const d of daten) onDatenAenderung(JSON.parse(d).dataType);
  }
}

/**
 * Hält die Live-Verbindung zum Server offen und verbindet nach Abbrüchen neu.
 * @param {string} token
 * @param {(dataType: string) => void} onDatenAenderung
 * @returns {() => void} beendet die Verbindung
 */
export function verbindeLiveUpdates(token, onDatenAenderung) {
  const controller = new AbortController();
  (async () => {
    while (!controller.signal.aborted) {
      try {
        if (await verbinden(token, controller.signal, onDatenAenderung) === false) return;
      } catch (e) {
        if (controller.signal.aborted) return;
        console.warn('Live-Verbindung unterbrochen – verbinde neu:', e.message);
      }
      await new Promise(weiter => setTimeout(weiter, WIEDERVERBINDEN_MS));
    }
  })();
  return () => controller.abort();
}
