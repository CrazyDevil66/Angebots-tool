import { useState, useMemo } from 'react';
import { Search, Download, Pencil, ChevronDown } from 'lucide-react';
import { loadAngebotFull } from '../api/angebote';
import { formatBetrag } from '../utils/format';
import { tageSeit, formatDatum, parseDEDate } from '../utils/datum';
import { sortiere, naechsteSortierung } from '../utils/sortierung';
import SortierKopf from '../components/SortierKopf';
import { generatePDF } from '../pdf/ladePDF';
import { rechnungsDokument } from '../utils/angebote';
import { getStatus } from '../lib/statusConfig';

const RECHNUNGS_STATUS = ['angenommen', 'gemahnt', 'bezahlt'];

const TABS = [
  { id: 'alle',       label: 'Alle' },
  { id: 'angenommen', label: 'Offen' },
  { id: 'gemahnt',    label: 'Gemahnt' },
  { id: 'bezahlt',    label: 'Bezahlt' },
];

const SORTIER_WERTE = {
  rechnung:  a => a.rechnungsNr,
  angebot:   a => a.angebotNr,
  kunde:     a => a.kundeDisplay,
  datum:     a => parseDEDate(a.rechnungsDatum || a.datum),
  offenSeit: a => a.status === 'bezahlt' ? null : tageSeit(a.rechnungsDatum),
  betrag:    a => a.brutto,
};

const SPALTEN = [
  { label: 'Rechnungsnr.', feld: 'rechnung' },
  { label: 'Angebotsnr.', feld: 'angebot' },
  { label: 'Kunde', feld: 'kunde' },
  { label: 'Betreff' },
  { label: 'Datum', feld: 'datum' },
  { label: 'Offen seit', feld: 'offenSeit' },
  { label: 'Betrag', feld: 'betrag', rechts: true },
  { label: 'Status' },
  { label: '' },
];

// Offene Rechnungen gelb statt im Grün von „Angenommen“
const OFFEN_STIL = { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', dot: 'bg-amber-500', label: 'Offen' };

const nichtWeiterreichen = e => e.stopPropagation();

// Wie lange eine Rechnung offen ist; Schwellen wie beim Handlungsbedarf im Dashboard.
function OffenSeit({ rechnung }) {
  if (rechnung.status === 'bezahlt') {
    const am = rechnung.bezahltAm
      ? new Date(rechnung.bezahltAm).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' })
      : null;
    return <span className="text-slate-400">{am ? `bezahlt am ${am}` : 'bezahlt'}</span>;
  }
  const tage = tageSeit(rechnung.rechnungsDatum);
  if (tage === null) return <span className="text-slate-300">—</span>;
  const farbe = tage > 30 ? 'text-red-600 font-semibold' : tage > 14 ? 'text-amber-600 font-medium' : 'text-slate-500';
  const text = tage <= 0 ? 'heute' : tage === 1 ? '1 Tag' : `${tage} Tage`;
  return <span className={farbe}>{text}</span>;
}

export default function RechnungenListe({ navigate, angebote = [], token, firma, params = {} }) {
  const [suche, setSuche] = useState('');
  const [kundeFilter, setKundeFilter] = useState('alle');
  const [aktiveTab, setAktiveTab] = useState(params.tab || 'alle');
  const [sortierung, setSortierung] = useState(null);
  const [pdfLoading, setPdfLoading] = useState(null);

  const rechnungen = useMemo(() =>
    angebote.filter(a => a.rechnungsNr),
  [angebote]);

  const kunden = useMemo(() =>
    [...new Set(rechnungen.map(a => a.kundeDisplay).filter(Boolean))].sort(),
  [rechnungen]);

  const tabCounts = useMemo(() => {
    const counts = { alle: rechnungen.length };
    RECHNUNGS_STATUS.forEach(s => {
      counts[s] = rechnungen.filter(a => a.status === s).length;
    });
    return counts;
  }, [rechnungen]);

  const gefiltert = useMemo(() => {
    const q = suche.toLowerCase();
    return rechnungen.filter(a => {
      const matchSuche = !q || (
        a.rechnungsNr?.toLowerCase().includes(q) ||
        a.angebotNr?.toLowerCase().includes(q) ||
        a.kundeDisplay?.toLowerCase().includes(q) ||
        (a.rechnungsBetreff || a.betreff)?.toLowerCase().includes(q)
      );
      const matchKunde = kundeFilter === 'alle' || a.kundeDisplay === kundeFilter;
      const matchTab   = aktiveTab === 'alle' || a.status === aktiveTab;
      return matchSuche && matchKunde && matchTab;
    });
  }, [rechnungen, suche, kundeFilter, aktiveTab]);

  const sortiert = useMemo(() => sortiere(gefiltert, sortierung, SORTIER_WERTE), [gefiltert, sortierung]);

  async function handlePDF(a) {
    setPdfLoading(a.id);
    try {
      const full = await loadAngebotFull(token, a.id);
      const snapshot = { ...full.snapshot, firma };
      await generatePDF(rechnungsDokument(snapshot, a), 'rechnung');
    } catch (e) {
      console.error(e);
      alert(`PDF konnte nicht erstellt werden: ${e.message}`);
    }
    finally { setPdfLoading(null); }
  }

  const cfg = s => getStatus(s);

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Rechnungen</h1>
          <p className="text-slate-500 mt-1 text-sm">{rechnungen.length} Rechnungen gesamt</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        {/* Filter */}
        <div className="flex items-center gap-3 p-4 border-b border-slate-100">
          <div className="relative flex-1 max-w-sm">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" />
            <input
              className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-200 text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all"
              placeholder="Suche nach Rechnungsnr., Kunde, Betreff…"
              value={suche}
              onChange={e => setSuche(e.target.value)}
            />
          </div>
          <div className="relative">
            <select
              className="pl-3 pr-8 py-2 rounded-lg border border-slate-200 text-sm bg-white focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all appearance-none"
              value={kundeFilter}
              onChange={e => setKundeFilter(e.target.value)}
            >
              <option value="alle">Alle Kunden</option>
              {kunden.map(k => <option key={k} value={k}>{k}</option>)}
            </select>
            <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none" />
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-100 px-4 bg-slate-50/50">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setAktiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-4 py-3 text-sm font-medium border-b-2 transition-colors flex-shrink-0
                ${aktiveTab === tab.id
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
            >
              {tab.label}
              <span className={`text-xs px-1.5 py-0.5 rounded-full font-semibold
                ${aktiveTab === tab.id ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-100 text-slate-500'}`}>
                {tabCounts[tab.id] || 0}
              </span>
            </button>
          ))}
        </div>

        {/* Tabelle */}
        {gefiltert.length === 0 ? (
          <div className="text-center py-16 text-slate-400">
            <p className="font-medium text-slate-500">Keine Rechnungen gefunden</p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100">
                {SPALTEN.map((spalte, i) => (
                  <SortierKopf
                    key={i}
                    {...spalte}
                    sortierung={sortierung}
                    onSortieren={feld => setSortierung(s => naechsteSortierung(s, feld))}
                  />
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {sortiert.map(a => {
                const s = a.status === 'angenommen' ? OFFEN_STIL : cfg(a.status);
                const betreff = a.rechnungsBetreff || a.betreff;
                return (
                  <tr
                    key={a.id}
                    onClick={() => navigate('angebot-editor', { angebotId: a.id })}
                    className="hover:bg-slate-50/80 transition-colors group cursor-pointer"
                  >
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <span className="text-sm font-semibold text-emerald-600">{a.rechnungsNr}</span>
                    </td>
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <span className="text-sm font-medium text-indigo-600 group-hover:text-indigo-700">{a.angebotNr}</span>
                    </td>
                    <td className="px-4 py-3.5 text-sm text-slate-700 whitespace-nowrap">{a.kundeDisplay || '—'}</td>
                    <td className="px-4 py-3.5 text-sm text-slate-500 w-full max-w-0 truncate" title={betreff || undefined}>
                      {betreff || <span className="italic text-slate-300">—</span>}
                    </td>
                    <td className="px-4 py-3.5 text-sm text-slate-500 whitespace-nowrap">
                      {formatDatum(a.rechnungsDatum || a.datum) || '—'}
                    </td>
                    <td className="px-4 py-3.5 text-sm whitespace-nowrap">
                      <OffenSeit rechnung={a} />
                    </td>
                    <td className="px-4 py-3.5 text-sm font-semibold text-slate-800 text-right whitespace-nowrap">
                      {formatBetrag(a.brutto)} €
                    </td>
                    <td className="px-4 py-3.5">
                      <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-semibold border ${s.bg} ${s.text} ${s.border}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
                        {s.label}
                      </span>
                    </td>
                    <td className="px-4 py-3.5" onClick={nichtWeiterreichen}>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => navigate('angebot-editor', { angebotId: a.id })}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                          title="Im Angebot öffnen"
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          onClick={() => handlePDF(a)}
                          disabled={pdfLoading === a.id}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors disabled:opacity-40"
                          title="Rechnung PDF"
                        >
                          <Download size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
