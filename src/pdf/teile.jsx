import { Text, View, Image } from '@react-pdf/renderer';
import { s } from './styles';

function firmenZeile(f) {
  return [f.name, f.strasse, [f.plz, f.ort].filter(Boolean).join(' ')].filter(Boolean).join('  ·  ');
}

// Kopfzeile mit Logo bzw. Firmenname – auf jeder Seite.
export function Kopfzeile({ firma }) {
  return (
    <View fixed style={{ position: 'absolute', top: 0, left: 0, right: 0 }}>
      <View style={s.header}>
        {firma.logo
          ? <Image src={firma.logo} style={s.headerLogo} />
          : <Text style={s.headerFirmaName}>{firma.name || 'Firmenname'}</Text>
        }
      </View>
      <View style={s.accentBar} />
    </View>
  );
}

// DIN-5008-Adressfenster mit Absenderzeile.
export function Adressfeld({ firma, kunde }) {
  return (
    <View style={s.addrCol}>
      <Text style={s.absender}>{firmenZeile(firma)}</Text>
      {kunde.firma && <Text style={s.addrName}>{kunde.firma}</Text>}
      {kunde.name && (
        <Text style={[s.addrLine, !kunde.firma && s.addrName]}>
          {kunde.name}
        </Text>
      )}
      {kunde.strasse && <Text style={s.addrLine}>{kunde.strasse}</Text>}
      {kunde.ort     && <Text style={s.addrLine}>{kunde.plz} {kunde.ort}</Text>}
    </View>
  );
}

export function MetaZeile({ label, wert, style }) {
  return (
    <View style={[s.docMetaRow, style]}>
      <Text style={s.docMetaLabel}>{label}</Text>
      <Text style={s.docMetaValue}>{wert}</Text>
    </View>
  );
}

// Fußzeile mit Firmen- und Bankdaten sowie Seitenzahl – auf jeder Seite.
export function Fusszeile({ firma: f }) {
  return (
    <View style={s.footer} fixed>
      <View style={s.footerLeft}>
        <Text style={s.footerText}>
          {firmenZeile(f)}
          {f.ustId ? `  ·  USt-ID: ${f.ustId}` : ''}
        </Text>
        {f.iban && (
          <Text style={s.footerUstId}>
            {[
              f.kontoinhaber && `Inh.: ${f.kontoinhaber}`,
              f.iban && `IBAN: ${f.iban}`,
              f.bic && `BIC: ${f.bic}`,
              f.bank,
            ].filter(Boolean).join('  ·  ')}
          </Text>
        )}
      </View>
      <Text style={s.footerPage} render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`} />
    </View>
  );
}
