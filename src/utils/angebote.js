export { nextAngebotNr, nextRechnungsNr } from '../../shared/nummern.js';

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
