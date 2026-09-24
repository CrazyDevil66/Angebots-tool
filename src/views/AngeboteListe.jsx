import { useState, useMemo } from 'react';
import { Plus, Search, Download, Pencil, Trash2, ChevronDown } from 'lucide-react';
import StatusDropdown from '../components/StatusDropdown';
import SortierKopf from '../components/SortierKopf';
import { deleteAngebot, setAngebotStatus, loadAngebotFull } from '../api/angebote';
import { formatBetrag } from '../utils/format';
import { generatePDF } from '../pdf/ladePDF';
import { rechnungsDokument } from '../utils/angebote';
import { formatDatum, parseDEDate } from '../utils/datum';
import { sortiere, naechsteSortierung } from '../utils/sortierung';
import { STATUS_LIST } from '../lib/statusConfig';

const TABS = [
  { id: 'alle', label: 'Alle' },
  ...STATUS_LIST.map(s => ({ id: s.value, label: s.label })),
];

const SORTIER_WERTE = {
  nummer: a => a.angebotNr,
  kunde:  a => a.kundeDisplay,
  datum:  a => parseDEDate(a.datum),
  betrag: a => a.brutto,
};

const SPALTEN = [
  { label: 'Nummer', feld: 'nummer' },
  { label: 'Kunde', feld: 'kunde' },
  { label: 'Betreff' },
  { label: 'Datum', feld: 'datum' },
  { label: 'Betrag', feld: 'betrag', rechts: true },
  { label: 'Status' },
  { label: '' },
];

// Klicks auf Status-Menü und Aktionen sollen nicht zusätzlich die Zeile öffnen
const nichtWeiterreichen = e => e.stopPropagation();

function AngebotKarte({ angebot: a, onOeffnen, onStatus, onPDF, pdfLaedt, onLoeschen }) {
  return (
    <li onClick={onOeffnen} className="p-4 flex flex-col gap-1 cursor-pointer active:bg-slate-50">
      <div className="flex items-baseline justify-between gap-3">
        <div className="min-w-0">
          <span className="text-sm font-semibold text-indigo-600">{a.angebotNr}</span>
          {a.rechnungsNr && <span className="ml-2 text-xs text-emerald-600 font-medium">{a.rechnungsNr}</span>}
        </div>
        <span className="text-sm font-semibold text-slate-800 whitespace-nowrap">{formatBetrag(a.brutto)} €</span>
      </div>
      <div className="text-sm text-slate-700 truncate">{a.kundeDisplay || '—'}</div>
      <div className="text-sm text-slate-500 truncate">
        {a.betreff || <span className="italic text-slate-300">Kein Betreff</span>}
      </div>
      <div className="flex items-center gap-1 mt-1" onClick={nichtWeiterreichen}>
        <span className="text-xs text-slate-400 mr-auto">{formatDatum(a.datum) || '—'}</span>
        <StatusDropdown status={a.status || 'entwurf'} onChange={onStatus} rechts />
        <button
          onClick={onPDF}
          disabled={pdfLaedt}
          className="p-2.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors disabled:opacity-40"
          aria-label={a.rechnungsNr ? 'Rechnung PDF' : 'Angebot PDF'}
        >
          <Download size={16} />
        </button>
        <button
          onClick={onLoeschen}
          className="p-2.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"
          aria-label="Löschen"
        >
          <Trash2 size={16} />
        </button>
      </div>
    </li>
  );
}

export default function AngeboteListe({ navigate, angebote = [], setAngebote, token, firma, params = {} }) {
  const [suche, setSuche] = useState('');
  const [kundeFilter, setKundeFilter] = useState('alle');
  const [aktiveTab, setAktiveTab] = useState(params.tab || 'alle');
  const [sortierung, setSortierung] = useState(null);
  const [pdfLoading, setPdfLoading] = useState(null);

  const kunden = useMemo(() => (
    [...new Set(angebote.map(a => a.kundeDisplay).filter(Boolean))].sort()
  ), [angebote]);

  const tabCounts = useMemo(() => {
    const counts = { alle: angebote.length };
    STATUS_LIST.forEach(s => {
      counts[s.value] = angebote.filter(a => (a.status || 'entwurf') === s.value).length;
    });
    return counts;
  }, [angebote]);

  const gefiltert = useMemo(() => {
    return angebote.filter(a => {
      const q = suche.toLowerCase();
      const matchSuche = !q || (
        a.angebotNr?.toLowerCase().includes(q) ||
        a.kundeDisplay?.toLowerCase().includes(q) ||
        a.betreff?.toLowerCase().includes(q)
      );
      const matchKunde = kundeFilter === 'alle' || a.kundeDisplay === kundeFilter;
      const matchTab = aktiveTab === 'alle' || (a.status || 'entwurf') === aktiveTab;
      return matchSuche && matchKunde && matchTab;
    });
  }, [angebote, suche, kundeFilter, aktiveTab]);

  const sortiert = useMemo(() => sortiere(gefiltert, sortierung, SORTIER_WERTE), [gefiltert, sortierung]);

  async function handleDelete(id) {
    if (!confirm('Angebot endgültig löschen?')) return;
    try {
      setAngebote(await deleteAngebot(token, id));
    } catch (e) {
      alert(`Löschen fehlgeschlagen: ${e.message}`);
    }
  }

  async function handleStatusChange(id, status) {
    try {
      setAngebote(await setAngebotStatus(token, id, status));
    } catch (e) {
      alert(`Status konnte nicht geändert werden: ${e.message}`);
    }
  }

  async function handlePDF(a) {
    setPdfLoading(a.id);
    try {
      const full = await loadAngebotFull(token, a.id);
      const snapshot = { ...full.snapshot, firma };
      if (a.rechnungsNr) {
        await generatePDF(rechnungsDokument(snapshot, a), 'rechnung');
      } else {
        await generatePDF(snapshot);
      }
    } catch (e) {
      console.error(e);
      alert(`PDF konnte nicht erstellt werden: ${e.message}`);
    }
    finally { setPdfLoading(null); }
  }

  return (
    <div className="p-4 md:p-8">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Angebote</h1>
          <p className="text-slate-500 mt-1 text-sm">{angebote.length} Angebote gespeichert</p>
        </div>
        <button
          onClick={() => navigate('angebot-editor')}
          className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white text-sm font-semibold rounded-xl hover:bg-indigo-700 transition-colors shadow-sm shadow-indigo-200"
        >
          <Plus size={16} />
          Neues Angebot
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 md:overflow-hidden">
        {/* Filter-Leiste */}
        <div className="flex flex-wrap items-center gap-3 p-4 border-b border-slate-100">
          <div className="relative w-full sm:w-auto sm:flex-1 sm:max-w-sm">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" />
            <input
              className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-200 text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all"
              placeholder="Suche nach Nr., Kunde, Betreff…"
              value={suche}
              onChange={e => setSuche(e.target.value)}
            />
          </div>
          <div className="relative w-full sm:w-auto">
            <select
              className="w-full sm:w-auto pl-3 pr-8 py-2 rounded-lg border border-slate-200 text-sm bg-white focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all appearance-none"
              value={kundeFilter}
              onChange={e => setKundeFilter(e.target.value)}
            >
              <option value="alle">Alle Kunden</option>
              {kunden.map(k => <option key={k} value={k}>{k}</option>)}
            </select>
            <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none" />
          </div>
        </div>

        {/* Status-Tabs */}
        <div className="flex border-b border-slate-100 px-4 bg-slate-50/50 overflow-x-auto">
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
            <p className="font-medium text-slate-500">Keine Angebote gefunden</p>
          </div>
        ) : (
          <>
          <ul className="md:hidden divide-y divide-slate-100">
            {sortiert.map(a => (
              <AngebotKarte
                key={a.id}
                angebot={a}
                onOeffnen={() => navigate('angebot-editor', { angebotId: a.id })}
                onStatus={s => handleStatusChange(a.id, s)}
                onPDF={() => handlePDF(a)}
                pdfLaedt={pdfLoading === a.id}
                onLoeschen={() => handleDelete(a.id)}
              />
            ))}
          </ul>
          <table className="w-full hidden md:table">
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
              {sortiert.map(a => (
                <tr
                  key={a.id}
                  onClick={() => navigate('angebot-editor', { angebotId: a.id })}
                  className="hover:bg-slate-50/80 transition-colors group cursor-pointer"
                >
                  <td className="px-4 py-3.5 whitespace-nowrap">
                    <span className="text-sm font-semibold text-indigo-600 group-hover:text-indigo-700 leading-tight">
                      {a.angebotNr}
                    </span>
                    {a.rechnungsNr && (
                      <div className="text-xs text-emerald-600 font-medium mt-0.5">{a.rechnungsNr}</div>
                    )}
                  </td>
                  <td className="px-4 py-3.5 text-sm text-slate-700 whitespace-nowrap">{a.kundeDisplay || '—'}</td>
                  {/* w-full + max-w-0: Betreff nimmt den freien Platz und kürzt erst, wenn der nicht reicht */}
                  <td className="px-4 py-3.5 text-sm text-slate-500 w-full max-w-0 truncate" title={a.betreff || undefined}>
                    {a.betreff || <span className="italic text-slate-300">Kein Betreff</span>}
                  </td>
                  <td className="px-4 py-3.5 text-sm text-slate-500 whitespace-nowrap">{formatDatum(a.datum) || '—'}</td>
                  <td className="px-4 py-3.5 text-sm font-semibold text-slate-800 text-right whitespace-nowrap">{formatBetrag(a.brutto)} €</td>
                  <td className="px-4 py-3.5" onClick={nichtWeiterreichen}>
                    <StatusDropdown
                      status={a.status || 'entwurf'}
                      onChange={s => handleStatusChange(a.id, s)}
                    />
                  </td>
                  <td className="px-4 py-3.5" onClick={nichtWeiterreichen}>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => navigate('angebot-editor', { angebotId: a.id })}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                        title="Bearbeiten"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        onClick={() => handlePDF(a)}
                        disabled={pdfLoading === a.id}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors disabled:opacity-40"
                        title={a.rechnungsNr ? 'Rechnung PDF' : 'Angebot PDF'}
                      >
                        <Download size={14} />
                      </button>
                      <button
                        onClick={() => handleDelete(a.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                        title="Löschen"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </>
        )}
      </div>
    </div>
  );
}
