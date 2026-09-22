import { pdf } from '@react-pdf/renderer';
import './fonts';
import DokumentPDF from './DokumentPDF';
import MahnungPDF from './MahnungPDF';
import { dateiHerunterladen } from '../utils/download';

function dokumentUndDateiname(data, typ, mahnungData) {
  if (typ === 'mahnung') {
    return [<MahnungPDF data={data} mahnung={mahnungData} />, `Mahnung_${mahnungData?.mahnungNr || 'export'}.pdf`];
  }
  const nr     = typ === 'rechnung' ? (data.rechnungsNr || 'export') : (data.angebotNr || 'export');
  const prefix = typ === 'rechnung' ? 'Rechnung' : 'Angebot';
  return [<DokumentPDF data={data} typ={typ} />, `${prefix}_${nr}.pdf`];
}

// Erzeugt das PDF im Browser und startet den Download.
// typ: 'angebot' | 'rechnung' | 'mahnung' (dann mit mahnungData)
export async function generatePDF(data, typ = 'angebot', mahnungData = null) {
  const [dokument, dateiname] = dokumentUndDateiname(data, typ, mahnungData);
  const blob = await pdf(dokument).toBlob();
  dateiHerunterladen(blob, dateiname);
}
