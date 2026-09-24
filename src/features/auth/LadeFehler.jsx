import { AlertTriangle } from 'lucide-react';

export default function LadeFehler({ meldung, onErneut, onAbmelden }) {
  return (
    <div className="min-h-dvh bg-[#0f172a] flex items-center justify-center px-4">
      <div className="bg-slate-800 border border-slate-700 rounded-2xl p-10 w-96 max-w-full shadow-2xl">
        <div className="flex items-center gap-3 mb-4">
          <AlertTriangle size={20} className="text-amber-400" />
          <h1 className="text-lg font-bold text-white">Daten konnten nicht geladen werden</h1>
        </div>
        <p className="text-slate-400 text-sm mb-4">
          Der Server ist gerade nicht erreichbar oder hat einen Fehler gemeldet.
        </p>
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2 text-red-300 text-xs mb-6 break-words">
          {meldung}
        </div>
        <div className="flex gap-2">
          <button
            onClick={onErneut}
            className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-lg py-2.5 text-sm transition-colors"
          >
            Erneut versuchen
          </button>
          <button
            onClick={onAbmelden}
            className="px-4 border border-slate-600 hover:bg-slate-700 text-slate-300 rounded-lg py-2.5 text-sm transition-colors"
          >
            Abmelden
          </button>
        </div>
      </div>
    </div>
  );
}
