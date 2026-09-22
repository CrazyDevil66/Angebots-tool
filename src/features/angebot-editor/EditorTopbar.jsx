import {
  ChevronRight, Download, Save, CheckCircle2, RotateCcw, Receipt, Mail, AlertTriangle, Banknote,
} from 'lucide-react';
import StatusDropdown from '../../components/StatusDropdown';

const KNOPF = 'flex items-center gap-2 px-4 py-1.5 text-sm font-semibold rounded-lg transition-all';

export default function EditorTopbar({
  titel, meta, isNeu, kundeEmail, pdfLoading, savedHint,
  onZurueck, onStatusChange, onReset, onSpeichern, onAngebotPDF, onMail,
  onRechnungErstellen, onRechnungPDF, onMahnung, onBezahlt,
}) {
  const { status, rechnungsNr, mahnStufe } = meta;
  const offeneRechnung = rechnungsNr && status !== 'bezahlt';

  return (
    <div className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-sm">
      <div className="px-8 h-14 flex items-center justify-between gap-4">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm">
          <button onClick={onZurueck} className="text-slate-400 hover:text-indigo-600 font-medium transition-colors">
            Angebote
          </button>
          <ChevronRight size={14} className="text-slate-300" />
          <span className="font-semibold text-slate-800">{titel}</span>
        </div>

        {/* Aktionen */}
        <div className="flex items-center gap-3">
          <StatusDropdown status={status} onChange={onStatusChange} />

          <button onClick={onReset} className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-slate-500 hover:bg-slate-100 rounded-lg transition-colors">
            <RotateCcw size={14} />
            Zurücksetzen
          </button>

          <button
            onClick={onSpeichern}
            className={`${KNOPF}
              ${savedHint
                ? 'bg-emerald-500 text-white'
                : isNeu ? 'bg-slate-800 text-white hover:bg-slate-900' : 'bg-amber-500 text-white hover:bg-amber-600'
              }`}
          >
            {savedHint ? <CheckCircle2 size={14} /> : <Save size={14} />}
            {savedHint ? 'Gespeichert!' : isNeu ? 'Speichern' : 'Aktualisieren'}
          </button>

          <button
            onClick={onAngebotPDF}
            disabled={pdfLoading}
            className={`${KNOPF} text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60`}
          >
            <Download size={14} />
            {pdfLoading ? 'Erstelle…' : 'Angebot PDF'}
          </button>

          {kundeEmail && (
            <button
              onClick={onMail}
              className={`${KNOPF} text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 hover:border-slate-300`}
              title={`An ${kundeEmail} senden`}
            >
              <Mail size={14} />
              Per Mail senden
            </button>
          )}

          {status === 'angenommen' && !rechnungsNr && (
            <button
              onClick={onRechnungErstellen}
              disabled={pdfLoading}
              className={`${KNOPF} text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60`}
            >
              <Receipt size={14} />
              Rechnung erstellen
            </button>
          )}

          {offeneRechnung && (
            <button
              onClick={onRechnungPDF}
              disabled={pdfLoading}
              className={`${KNOPF} text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60`}
            >
              <Download size={14} />
              {rechnungsNr}
            </button>
          )}

          {offeneRechnung && (
            <button
              onClick={onMahnung}
              disabled={pdfLoading}
              className={`${KNOPF} text-white bg-red-600 hover:bg-red-700 disabled:opacity-60`}
            >
              <AlertTriangle size={14} />
              {mahnStufe > 0 ? `Mahnung (Stufe ${mahnStufe})` : 'Mahnung erstellen'}
            </button>
          )}

          {offeneRechnung && (
            <button
              onClick={onBezahlt}
              className={`${KNOPF} text-teal-700 bg-teal-50 border border-teal-200 hover:bg-teal-100`}
            >
              <Banknote size={14} />
              Als bezahlt markieren
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
