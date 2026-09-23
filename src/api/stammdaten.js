import { apiGet, apiPut, apiDelete } from './client';

export const loadFirma   = token => apiGet(token, '/data/firma');
export const loadKunden  = token => apiGet(token, '/data/kunden');
export const loadKatalog = token => apiGet(token, '/data/katalog');

export async function saveFirma(token, firma) {
  await apiPut(token, '/data/firma', firma);
}

// Kunden und Leistungen werden einzeln gespeichert, damit gleichzeitige Änderungen
// an anderen Einträgen nicht überschrieben werden. Liefern jeweils die aktuelle Liste.

export function saveKunde(token, kunde) {
  return apiPut(token, `/data/kunden/${encodeURIComponent(kunde.id)}`, kunde);
}

export function deleteKunde(token, id) {
  return apiDelete(token, `/data/kunden/${encodeURIComponent(id)}`);
}

export function saveLeistung(token, leistung) {
  return apiPut(token, `/data/katalog/${encodeURIComponent(leistung.id)}`, leistung);
}

export function deleteLeistung(token, id) {
  return apiDelete(token, `/data/katalog/${encodeURIComponent(id)}`);
}
