export { nextAngebotNr, nextRechnungsNr } from '../../shared/nummern.js';

// ── HTTP-Helfer ───────────────────────────────────────────────────────────────

async function fehlerAusAntwort(res, beschreibung) {
  const body = await res.json().catch(() => null);
  return new Error(body?.error || `${beschreibung} fehlgeschlagen (${res.status})`);
}

async function apiGet(token, endpoint) {
  const res = await fetch(`/api${endpoint}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw await fehlerAusAntwort(res, `GET ${endpoint}`);
  return res.json();
}

async function apiPost(token, endpoint, body) {
  const res = await fetch(`/api${endpoint}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw await fehlerAusAntwort(res, `POST ${endpoint}`);
  return res.json();
}

async function apiPut(token, endpoint, body) {
  const res = await fetch(`/api${endpoint}`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw await fehlerAusAntwort(res, `PUT ${endpoint}`);
  return res.json();
}

async function apiPatch(token, endpoint, body) {
  const res = await fetch(`/api${endpoint}`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw await fehlerAusAntwort(res, `PATCH ${endpoint}`);
  return res.json();
}

async function apiDelete(token, endpoint) {
  const res = await fetch(`/api${endpoint}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw await fehlerAusAntwort(res, `DELETE ${endpoint}`);
  return res.json();
}

// ── Laden ─────────────────────────────────────────────────────────────────────

export async function loadFirma(token) {
  return apiGet(token, '/data/firma');
}

export async function loadKunden(token) {
  return apiGet(token, '/data/kunden');
}

export async function loadAngebote(token) {
  return apiGet(token, '/angebote');
}

export async function loadAngebotFull(token, id) {
  return apiGet(token, `/angebote/${id}`);
}

export async function loadKatalog(token) {
  return apiGet(token, '/data/katalog');
}

// ── Primitiv-Saves ────────────────────────────────────────────────────────────

export async function saveFirma(token, firma) {
  await apiPut(token, '/data/firma', firma);
}

export async function saveKunden(token, kunden) {
  await apiPut(token, '/data/kunden', kunden);
}

export async function saveKatalog(token, items) {
  await apiPut(token, '/data/katalog', items);
}

// ── Angebot-Mutations ─────────────────────────────────────────────────────────

export async function saveAngebot(token, data) {
  const result = await apiPost(token, '/angebote', data);
  return { eintrag: result.entry, updated: result.index };
}

export async function updateAngebot(token, id, data, status) {
  const result = await apiPut(token, `/angebote/${id}`, { snapshot: data, status });
  return result.index;
}

export async function setAngebotStatus(token, id, status) {
  const result = await apiPatch(token, `/angebote/${id}`, { status });
  return result.index;
}

export async function deleteAngebot(token, id) {
  const result = await apiDelete(token, `/angebote/${id}`);
  return result.index;
}

export async function setMahnung(token, id, mahnStufe, mahnungNr, mahndatum, mahnGebuehren) {
  const result = await apiPatch(token, `/angebote/${id}`, {
    mahnStufe, mahnungNr, mahndatum, mahnGebuehren, status: 'gemahnt',
  });
  return result.index;
}

export async function setBezahlt(token, id) {
  const result = await apiPatch(token, `/angebote/${id}`, {
    status: 'bezahlt',
    bezahltAm: new Date().toISOString(),
  });
  return result.index;
}

export async function setAngebotRechnung(token, id, rechnungsNr, rechnungsDatum, rechnungsBetreff, rechnungsEinleitung, rechnungsHinweise) {
  const result = await apiPatch(token, `/angebote/${id}`, {
    rechnungsNr, rechnungsDatum, rechnungsBetreff, rechnungsEinleitung, rechnungsHinweise,
  });
  return result.index;
}

// ── Datensicherung (nur Admins) ───────────────────────────────────────────────

export async function ladeBackup(token) {
  return apiGet(token, '/backup');
}

export async function stelleBackupWiederHer(token, backup) {
  return apiPost(token, '/backup/restore', backup);
}

// ── Pure Helper-Funktionen ────────────────────────────────────────────────────

function parseDEDate(str) {
  if (!str) return null;
  const [d, m, y] = str.split('.');
  if (!d || !m || !y) return null;
  return new Date(Number(y), Number(m) - 1, Number(d));
}

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

export function getAngeboteByKunde(angebote, kundeId, kundeDisplay) {
  return angebote.filter(a =>
    (kundeId && a.kundeId === kundeId) ||
    (kundeDisplay && a.kundeDisplay === kundeDisplay)
  );
}
