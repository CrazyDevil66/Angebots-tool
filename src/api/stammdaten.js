import { apiGet, apiPut } from './client';

export const loadFirma   = token => apiGet(token, '/data/firma');
export const loadKunden  = token => apiGet(token, '/data/kunden');
export const loadKatalog = token => apiGet(token, '/data/katalog');

export async function saveFirma(token, firma) {
  await apiPut(token, '/data/firma', firma);
}

export async function saveKunden(token, kunden) {
  await apiPut(token, '/data/kunden', kunden);
}

export async function saveKatalog(token, items) {
  await apiPut(token, '/data/katalog', items);
}
