import { defaultData } from '../../lib/defaultData';
import { nextAngebotNr } from '../../utils/angebote';
import { add14Days, heuteDE } from '../../utils/datum';

// Rechnungs- und Mahnungsdaten eines Angebots – entspricht den Metadaten auf dem Server.
export function metaAus(eintrag) {
  return {
    status:              eintrag?.status              || 'entwurf',
    rechnungsNr:         eintrag?.rechnungsNr         || null,
    rechnungsDatum:      eintrag?.rechnungsDatum      || null,
    rechnungsBetreff:    eintrag?.rechnungsBetreff    || null,
    rechnungsEinleitung: eintrag?.rechnungsEinleitung || null,
    rechnungsHinweise:   eintrag?.rechnungsHinweise   || null,
    mahnStufe:           eintrag?.mahnStufe           || 0,
    mahnGebuehren:       eintrag?.mahnGebuehren       || [],
  };
}

export function kundeAusAdressbuch(k) {
  return {
    id: k.id || null,
    anrede: k.anrede || '',
    firma: k.firma || '',
    name: k.name || '',
    strasse: k.strasse || '',
    plz: k.plz || '',
    ort: k.ort || '',
    email: k.email || '',
    telefon: k.telefon || '',
  };
}

export function initData(params, firmaData, angeboteData) {
  const firma = firmaData || defaultData.firma;

  // Für bestehende Angebote: Snapshot wird async nachgeladen
  if (params?.angebotId) return { ...defaultData, firma };

  const datum = heuteDE();
  const base = {
    ...defaultData,
    angebotNr: nextAngebotNr(angeboteData),
    datum,
    gueltigBis: add14Days(datum),
    betreff: 'Angebot',
    firma,
    hinweise: firma.hinweiseAngebot ?? defaultData.firma.hinweiseAngebot,
  };

  if (params?.prefillKunde) {
    const { anrede: _anrede, ...kunde } = kundeAusAdressbuch(params.prefillKunde);
    base.kunde = kunde;
  }

  return base;
}
