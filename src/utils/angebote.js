export { nextAngebotNr, nextRechnungsNr } from '../../shared/nummern.js';

// Gemahnte und bezahlte Angebote waren vorher angenommen – für Umsatz und Quote zählen sie mit.
const ANGENOMMEN_ODER_WEITER = new Set(['angenommen', 'gemahnt', 'bezahlt']);

export function istAngenommen(angebot) {
  return ANGENOMMEN_ODER_WEITER.has(angebot.status);
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
