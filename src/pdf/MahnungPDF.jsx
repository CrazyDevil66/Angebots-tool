import { Document, Page, Text, View } from '@react-pdf/renderer';
import { berechneSummen } from '../../shared/berechnung.js';
import { formatEuro } from '../utils/format';
import { s } from './styles';
import { Kopfzeile, Adressfeld, MetaZeile, Fusszeile } from './teile';

const STUFEN_LABEL = { 1: 'Zahlungserinnerung', 2: '1. Mahnung', 3: '2. Mahnung' };
const STUFEN_TITEL = { 1: 'ZAHLUNGSERINNERUNG', 2: '1. MAHNUNG', 3: '2. MAHNUNG' };

function SummenZeile({ label, betrag }) {
  return (
    <View style={s.mahnSummaryRow}>
      <Text style={s.mahnSummaryLabel}>{label}</Text>
      <Text style={s.mahnSummaryValue}>{formatEuro(betrag)}</Text>
    </View>
  );
}

export default function MahnungPDF({ data, mahnung }) {
  const f = data.firma;
  const { brutto } = berechneSummen(data.positionen, data.mwstSatz);
  const gebuehr = Number(mahnung.mahngebuehr || 0);
  const vorherigeGebuehren = (mahnung.vorherigeGebuehren || []).filter(g => g.betrag > 0);
  const vorherigeGebuehrenSum = vorherigeGebuehren.reduce((summe, g) => summe + Number(g.betrag || 0), 0);
  const gesamt = brutto + vorherigeGebuehrenSum + gebuehr;

  const stufe = mahnung.stufe;
  const titelText = STUFEN_TITEL[stufe] || STUFEN_TITEL[2];
  const rechnungRef = `Rechnung ${data.rechnungsNr || '—'} vom ${data.rechnungsDatum || '—'}`;
  const betreffText = `${STUFEN_LABEL[stufe] || STUFEN_LABEL[2]} zu ${rechnungRef}`;

  return (
    <Document>
      <Page size="A4" style={s.page}>
        <Kopfzeile firma={f} />

        <View style={s.body}>
          <View style={s.topRow}>
            <Adressfeld firma={f} kunde={data.kunde} />
            <View style={s.docCol}>
              <Text style={s.mahnTitle}>{titelText}</Text>
              <MetaZeile label="Mahnungs-Nr." wert={mahnung.mahnungNr || '—'} />
              <MetaZeile label="Datum" wert={mahnung.datum || '—'} />
              <MetaZeile label="Zu Rechnung" wert={data.rechnungsNr || '—'} />
              {f.email && <MetaZeile label="E-Mail" wert={f.email} style={{ marginTop: 6 }} />}
            </View>
          </View>

          <Text style={s.subject}>{betreffText}</Text>
          <Text style={s.intro}>{mahnung.text}</Text>

          <View style={s.mahnBox}>
            <Text style={s.mahnBoxTitle}>OFFENER BETRAG</Text>
            <SummenZeile label={`Rechnungsbetrag (${rechnungRef})`} betrag={brutto} />
            {vorherigeGebuehren.map((g, i) => (
              <SummenZeile key={i} label={`Mahngebühr (${STUFEN_LABEL[g.stufe] || `Stufe ${g.stufe}`})`} betrag={g.betrag} />
            ))}
            {gebuehr > 0 && (
              <SummenZeile label={`Mahngebühr (${STUFEN_LABEL[stufe] || `Stufe ${stufe}`})`} betrag={gebuehr} />
            )}
            <View style={s.mahnTotalRow}>
              <Text style={s.mahnTotalLabel}>Zu zahlen bis {mahnung.frist}</Text>
              <Text style={s.mahnTotalValue}>{formatEuro(gesamt)}</Text>
            </View>
          </View>
        </View>

        <Fusszeile firma={f} />
      </Page>
    </Document>
  );
}
