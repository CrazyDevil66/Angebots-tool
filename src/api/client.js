export const SITZUNG_ABGELAUFEN = 'sitzung-abgelaufen';

// Ein 401 bei einer Anfrage mit Token heißt: Sitzung abgelaufen oder widerrufen. App.jsx meldet dann ab.
export function pruefeSitzung(res) {
  if (res.status === 401) window.dispatchEvent(new Event(SITZUNG_ABGELAUFEN));
}

async function fehlerAusAntwort(res, beschreibung) {
  const body = await res.json().catch(() => null);
  const fehler = new Error(body?.error || `${beschreibung} fehlgeschlagen (${res.status})`);
  fehler.status = res.status;
  return fehler;
}

/**
 * Einzige Stelle für HTTP-Anfragen ans Backend. Ohne Token (Anmeldung, Einrichtung, Einladung)
 * wird kein Authorization-Header gesendet und ein 401 nicht als abgelaufene Sitzung gewertet.
 * Fehlerstatus des Servers werfen einen Error mit `status`.
 * @param {string|null} token
 * @param {string} method
 * @param {string} pfad vollständiger Pfad, z. B. `/api/me` oder `/invite/…`
 * @param {unknown} [body]
 */
export async function anfrage(token, method, pfad, body) {
  const headers = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  const res = await fetch(pfad, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  if (token) pruefeSitzung(res);
  if (!res.ok) throw await fehlerAusAntwort(res, `${method} ${pfad}`);
  return res.json();
}

/** Liefert `null`, wenn der Server mit einem Fehlerstatus antwortet; Netzwerkfehler werden weitergereicht. */
export function nullBeiFehlerstatus(versprechen) {
  return versprechen.catch(e => {
    if (e.status) return null;
    throw e;
  });
}

export const apiGet    = (token, endpoint)       => anfrage(token, 'GET', `/api${endpoint}`);
export const apiPost   = (token, endpoint, body) => anfrage(token, 'POST', `/api${endpoint}`, body);
export const apiPut    = (token, endpoint, body) => anfrage(token, 'PUT', `/api${endpoint}`, body);
export const apiPatch  = (token, endpoint, body) => anfrage(token, 'PATCH', `/api${endpoint}`, body);
export const apiDelete = (token, endpoint)       => anfrage(token, 'DELETE', `/api${endpoint}`);
