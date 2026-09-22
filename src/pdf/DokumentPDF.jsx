import { Document, Page, Text, View } from '@react-pdf/renderer';
import { vkPreis, positionGesamt, berechneSummen } from '../../shared/berechnung.js';
import { MARKENFARBEN as C } from '../lib/markenfarben';
import { formatEuro } from '../utils/format';
import { heuteDE } from '../utils/datum';
import { s } from './styles';
import { Kopfzeile, Adressfeld, MetaZeile, Fusszeile } from './teile';

function Positionen({ positionen }) {
  return (
    <>
      <View style={s.tableHeader}>
        <Text style={[s.colPos,   s.thText]}>Pos.</Text>
        <Text style={[s.colDesc,  s.thText]}>Beschreibung</Text>
        <Text style={[s.colQty,   s.thText]}>Menge</Text>
        <Text style={[s.colUnit,  s.thText]}>Einheit</Text>
        <Text style={[s.colPrice, s.thText]}>Einzelpreis</Text>
        <Text style={[s.colTotal, s.thText]}>Gesamt</Text>
      </View>

      {positionen.map((p, i) => (
        <View key={i} style={i % 2 === 0 ? s.tableRow : s.tableRowAlt}>
          <Text style={[s.colPos,   s.tdText, { color: C.yellow, fontWeight: 700 }]}>{i + 1}</Text>
          <View style={s.colDesc}>
            <Text style={s.tdText}>{p.bezeichnung || '—'}</Text>
            {p.beschreibung ? <Text style={s.tdSub}>{p.beschreibung}</Text> : null}
          </View>
          <Text style={[s.colQty,   s.tdText]}>{p.menge}</Text>
          <Text style={[s.colUnit,  s.tdText]}>{p.einheit || 'Stk.'}</Text>
          <Text style={[s.colPrice, s.tdText]}>{formatEuro(vkPreis(p))}</Text>
          <Text style={[s.colTotal, s.tdText, { fontWeight: 700 }]}>
            {formatEuro(positionGesamt(p))}
          </Text>
        </View>
      ))}
    </>
  );
}

function Summen({ netto, mwst, brutto, mwstSatz }) {
  return (
    <View style={s.totalsBlock}>
      <View style={s.totalsRow}>
        <Text style={s.totalsLabel}>Nettobetrag</Text>
        <Text style={s.totalsValue}>{formatEuro(netto)}</Text>
      </View>
      <View style={s.totalsRow}>
        <Text style={s.totalsLabel}>MwSt. {mwstSatz} %</Text>
        <Text style={s.totalsValue}>{formatEuro(mwst)}</Text>
      </View>
      <View style={s.grandRow}>
        <Text style={s.grandLabel}>Gesamtbetrag</Text>
        <Text style={s.grandValue}>{formatEuro(brutto)}</Text>
      </View>
    </View>
  );
}

// Angebot oder Rechnung – je nach typ.
export default function DokumentPDF({ data, typ = 'angebot' }) {
  const { netto, mwst, brutto } = berechneSummen(data.positionen, data.mwstSatz);
  const f = data.firma;

  const istRechnung = typ === 'rechnung';
  const titelText   = istRechnung ? 'RECHNUNG' : 'ANGEBOT';
  const nummerLabel = istRechnung ? 'Rechnungs-Nr.' : 'Nummer';
  const nummerWert  = istRechnung ? (data.rechnungsNr || '—') : (data.angebotNr || '—');
  const datumWert   = istRechnung ? (data.rechnungsDatum || heuteDE()) : (data.datum || heuteDE());

  return (
    <Document>
      <Page size="A4" style={s.page}>
        <Kopfzeile firma={f} />

        <View style={s.body}>
          <View style={s.topRow}>
            <Adressfeld firma={f} kunde={data.kunde} />
            <View style={s.docCol}>
              <Text style={s.docTitle}>{titelText}</Text>
              <MetaZeile label={nummerLabel} wert={nummerWert} />
              <MetaZeile label="Datum" wert={datumWert} />
              {f.email && <MetaZeile label="E-Mail" wert={f.email} style={{ marginTop: 6 }} />}
              {f.telefon && <MetaZeile label="Telefon" wert={f.telefon} />}
            </View>
          </View>

          {data.betreff    && <Text style={s.subject}>{data.betreff}</Text>}
          {data.einleitung && <Text style={s.intro}>{data.einleitung}</Text>}

          <Positionen positionen={data.positionen} />
          <Summen netto={netto} mwst={mwst} brutto={brutto} mwstSatz={data.mwstSatz} />

          {data.hinweise && (
            <View style={s.notes}>
              <Text style={s.notesLabel}>HINWEISE</Text>
              <Text style={s.notesText}>{data.hinweise}</Text>
            </View>
          )}
        </View>

        <Fusszeile firma={f} />
      </Page>
    </Document>
  );
}
