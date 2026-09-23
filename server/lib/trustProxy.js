// Wert für Express' „trust proxy“ aus der Umgebungsvariable TRUST_PROXY.
// Ohne Angabe wird keinem Proxy vertraut: Sonst könnte jeder Client per
// X-Forwarded-For eine beliebige IP vortäuschen und die Login-Sperre umgehen.
function trustProxyAus(wert) {
  const text = (wert ?? '').trim();
  if (text === '' || text === 'false') return false;
  if (text === 'true') return true;
  if (/^\d+$/.test(text)) return Number(text);
  return text;
}

module.exports = { trustProxyAus };
