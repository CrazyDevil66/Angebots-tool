import { apiGet, apiPost, apiPut, apiPatch, apiDelete } from './client';

export const loadAngebote    = token     => apiGet(token, '/angebote');
export const loadAngebotFull = (token, id) => apiGet(token, `/angebote/${id}`);

// Alle Mutationen liefern den aktualisierten Index zurück.

export async function saveAngebot(token, data) {
  const result = await apiPost(token, '/angebote', data);
  return { eintrag: result.entry, updated: result.index };
}

export async function updateAngebot(token, id, data, status) {
  const result = await apiPut(token, `/angebote/${id}`, { snapshot: data, status });
  return result.index;
}

async function patchAngebot(token, id, felder) {
  const result = await apiPatch(token, `/angebote/${id}`, felder);
  return result.index;
}

export function setAngebotStatus(token, id, status) {
  return patchAngebot(token, id, { status });
}

export function setMahnung(token, id, mahnStufe, mahnungNr, mahndatum, mahnGebuehren) {
  return patchAngebot(token, id, { mahnStufe, mahnungNr, mahndatum, mahnGebuehren, status: 'gemahnt' });
}

export function setBezahlt(token, id) {
  return patchAngebot(token, id, { status: 'bezahlt', bezahltAm: new Date().toISOString() });
}

export function setAngebotRechnung(token, id, rechnungsNr, rechnungsDatum, rechnungsBetreff, rechnungsEinleitung, rechnungsHinweise) {
  return patchAngebot(token, id, { rechnungsNr, rechnungsDatum, rechnungsBetreff, rechnungsEinleitung, rechnungsHinweise });
}

export async function deleteAngebot(token, id) {
  const result = await apiDelete(token, `/angebote/${id}`);
  return result.index;
}
