import {
  ChevronRight, Download, Save, CheckCircle2, RotateCcw, Receipt, Mail, AlertTriangle, Banknote,
} from 'lucide-react';
import StatusDropdown from '../../components/StatusDropdown';
import MehrMenue from './MehrMenue';
import { zusatzAktionen } from '../../utils/editorAktionen';

const KNOPF = 'flex items-center gap-2 px-3 lg:px-4 py-1.5 text-sm font-semibold rounded-lg whitespace-nowrap lg:whitespace-normal transition-all';

const ZUSATZ = {
  mail:        { icon: Mail,          stil: 'text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 hover:border-slate-300' },
  rechnung:    { icon: Receipt,       stil: 'text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60', pdf: true },
  rechnungPdf: { icon: Download,      stil: 'text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60', pdf: true },
  mahnung:     { icon: AlertTriangle, stil: 'text-white bg-red-600 hover:bg-red-700 disabled:opacity-60', pdf: true },
  bezahlt:     { icon: Banknote,      stil: 'text-teal-700 bg-teal-50 border border-teal-200 hover:bg-teal-100' },
};

const ANSICHTEN = [
  { id: 'bearbeiten', label: 'Bearbeiten' },
  { id: 'vorschau',   label: 'Vorschau' },
];

export default function EditorTopbar({
  titel, meta, isNeu, kundeEmail, pdfLoading, savedHint, ungespeichert,
  onZurueck, onStatusChange, onReset, onSpeichern, onAngebotPDF, onMail,
  onRechnungErstellen, onRechnungPDF, onMahnung, onBezahlt,
  ansicht, onAnsicht,
}) {
  const { status, rechnungsNr, mahnStufe } = meta;
  const handler = { mail: onMail, rechnung: onRechnungErstellen, rechnungPdf: onRechnungPDF, mahnung: onMahnung, bezahlt: onBezahlt };
  const aktionen = zusatzAktionen({ status, rechnungsNr, mahnStufe, kundeEmail }).map(a => ({
    ...a,
    ...ZUSATZ[a.id],
    onClick: handler[a.id],
    disabled: ZUSATZ[a.id].pdf && pdfLoading,
  }));
  const menuEintraege = [
    ...aktionen,
    { id: 'reset', label: 'Zurücksetzen', icon: RotateCcw, onClick: onReset, trennerDavor: aktionen.length > 0 },
  ];

  return (
    <div className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-sm">
      <div className="px-4 md:px-8 py-2 lg:py-0 lg:h-14 flex flex-col lg:flex-row lg:items-center justify-between gap-2 lg:gap-4">
        {/* Breadcrumb, auf schmalen Bildschirmen mit Status */}
        <div className="flex items-center gap-2 text-sm min-w-0 lg:min-w-[auto]">
          <button onClick={onZurueck} className="text-slate-400 hover:text-indigo-600 font-medium transition-colors">
            Angebote
          </button>
          <ChevronRight size={14} className="text-slate-300 flex-shrink-0 lg:flex-shrink" />
          <span className="font-semibold text-slate-800 truncate lg:overflow-visible lg:whitespace-normal">{titel}</span>
          <div className="ml-auto lg:hidden">
            <StatusDropdown status={status} onChange={onStatusChange} rechts />
          </div>
        </div>

        {/* Aktionen */}
        <div className="flex items-center gap-2 lg:gap-3">
          <div className="hidden lg:block">
            <StatusDropdown status={status} onChange={onStatusChange} />
          </div>

          <button onClick={onReset} className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 text-sm text-slate-500 hover:bg-slate-100 rounded-lg transition-colors">
            <RotateCcw size={14} />
            Zurücksetzen
          </button>

          {ungespeichert && !savedHint && (
            <span className="hidden lg:flex items-center gap-1.5 text-xs font-medium text-amber-600 whitespace-nowrap">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
              Nicht gespeichert
            </span>
          )}

          <button
            onClick={onSpeichern}
            className={`${KNOPF} relative lg:static
              ${savedHint
                ? 'bg-emerald-500 text-white'
                : isNeu ? 'bg-slate-800 text-white hover:bg-slate-900' : 'bg-amber-500 text-white hover:bg-amber-600'
              }`}
          >
            {savedHint ? <CheckCircle2 size={14} /> : <Save size={14} />}
            {savedHint ? 'Gespeichert!' : isNeu ? 'Speichern' : 'Aktualisieren'}
            {ungespeichert && !savedHint && (
              <span className="lg:hidden absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-amber-400 ring-2 ring-white" aria-label="Nicht gespeichert" />
            )}
          </button>

          <button
            onClick={onAngebotPDF}
            disabled={pdfLoading}
            className={`${KNOPF} text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60`}
          >
            <Download size={14} />
            {pdfLoading ? 'Erstelle…' : 'Angebot PDF'}
          </button>

          <div className="hidden lg:contents">
            {aktionen.map(({ id, label, icon: Icon, stil, onClick, disabled }) => (
              <button
                key={id}
                onClick={onClick}
                disabled={disabled}
                className={`${KNOPF} ${stil}`}
                title={id === 'mail' ? `An ${kundeEmail} senden` : undefined}
              >
                <Icon size={14} />
                {label}
              </button>
            ))}
          </div>

          <div className="ml-auto lg:hidden">
            <MehrMenue eintraege={menuEintraege} />
          </div>
        </div>
      </div>

      {/* Umschalter Bearbeiten/Vorschau unter lg */}
      <div className="lg:hidden px-4 md:px-8 pb-2">
        <div className="flex gap-1 bg-slate-100 rounded-lg p-1">
          {ANSICHTEN.map(({ id, label }) => (
            <button
              key={id}
              onClick={() => onAnsicht(id)}
              aria-pressed={ansicht === id}
              className={`flex-1 px-3 py-1.5 text-sm font-medium rounded-md transition-all ${
                ansicht === id ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
