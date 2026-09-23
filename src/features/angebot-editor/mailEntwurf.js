import { briefAnrede } from '../../utils/anrede';

// mailto-Link für den Versand über das lokale Mailprogramm.
export function mailEntwurfLink(data) {
  const k = data.kunde;
  const f = data.firma;

  const subject = encodeURIComponent(
    `${data.betreff || 'Angebot'} ${data.angebotNr || ''}${k.firma || k.name ? ' – ' + (k.firma || k.name) : ''}`
  );

  const body = encodeURIComponent(
    `${briefAnrede(k.anrede, k.name)}\n\n` +
    `im Anhang erhalten Sie unser ${data.betreff || 'Angebot'} Nr. ${data.angebotNr || ''} vom ${data.datum || ''}.\n\n` +
    (data.hinweise ? `${data.hinweise}\n\n` : '') +
    `Mit freundlichen Grüßen\n${f.name || ''}` +
    (f.telefon ? `\nTel.: ${f.telefon}` : '') +
    (f.email   ? `\nMail: ${f.email}`   : '')
  );

  // Ohne Escaping könnte eine Adresse wie "a@b.de?bcc=…" weitere Empfänger einschleusen.
  const empfaenger = encodeURIComponent(k.email || '').replace(/%40/g, '@');
  return `mailto:${empfaenger}?subject=${subject}&body=${body}`;
}
