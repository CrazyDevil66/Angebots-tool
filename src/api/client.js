async function fehlerAusAntwort(res, beschreibung) {
  const body = await res.json().catch(() => null);
  return new Error(body?.error || `${beschreibung} fehlgeschlagen (${res.status})`);
}

async function anfrage(token, method, endpoint, body) {
  const headers = { Authorization: `Bearer ${token}` };
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  const res = await fetch(`/api${endpoint}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  if (!res.ok) throw await fehlerAusAntwort(res, `${method} ${endpoint}`);
  return res.json();
}

export const apiGet    = (token, endpoint)       => anfrage(token, 'GET', endpoint);
export const apiPost   = (token, endpoint, body) => anfrage(token, 'POST', endpoint, body);
export const apiPut    = (token, endpoint, body) => anfrage(token, 'PUT', endpoint, body);
export const apiPatch  = (token, endpoint, body) => anfrage(token, 'PATCH', endpoint, body);
export const apiDelete = (token, endpoint)       => anfrage(token, 'DELETE', endpoint);
