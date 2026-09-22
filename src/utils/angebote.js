import { parseDEDate } from './datum';

export { nextAngebotNr, nextRechnungsNr } from '../../shared/nummern.js';

export function autoMarkAbgelaufen(angebote) {
  const heute = new Date();
  heute.setHours(0, 0, 0, 0);
  let changed = false;
  const updated = angebote.map(a => {
    if (a.status !== 'entwurf' && a.status !== 'gesendet') return a;
    const datum = parseDEDate(a.gueltigBis);
    if (!datum) return a;
    datum.setHours(0, 0, 0, 0);
    if (datum < heute) {
      changed = true;
      return { ...a, status: 'abgelaufen', updatedAt: new Date().toISOString() };
    }
    return a;
  });
  return { updated, changed };
}

// Dokumentdaten für das Rechnungs-PDF: Rechnungstexte ersetzen die Angebotstexte, falls vorhanden.
export function rechnungsDokument(snapshot, meta) {
  return {
    ...snapshot,
    rechnungsNr:    meta.rechnungsNr,
    rechnungsDatum: meta.rechnungsDatum,
    betreff:        meta.rechnungsBetreff    ?? snapshot.betreff,
    einleitung:     meta.rechnungsEinleitung ?? snapshot.einleitung,
    hinweise:       meta.rechnungsHinweise   ?? snapshot.hinweise,
  };
}
