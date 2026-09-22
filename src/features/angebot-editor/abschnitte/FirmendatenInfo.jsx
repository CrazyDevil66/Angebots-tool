import { Settings } from 'lucide-react';
import Collapse from '../../../components/Collapse';

export default function FirmendatenInfo({ firma, onEinstellungen }) {
  return (
    <Collapse title="Ihre Firmendaten" icon={Settings} defaultOpen={false}>
      <p className="text-xs text-slate-400 mb-4 -mt-1 flex items-center gap-1">
        Gespeicherte Firmendaten aus
        <button onClick={onEinstellungen} className="text-indigo-600 hover:underline font-medium">
          Einstellungen
        </button>
      </p>
      <div className="grid grid-cols-2 gap-3 text-sm">
        {[
          ['Firma', firma.name],
          ['Straße', firma.strasse],
          ['PLZ / Ort', `${firma.plz} ${firma.ort}`],
          ['Telefon', firma.telefon],
          ['E-Mail', firma.email],
          ['USt-ID', firma.ustId],
        ].map(([label, value]) => (
          <div key={label}>
            <div className="text-xs text-slate-400 uppercase tracking-wide font-medium mb-1">{label}</div>
            <div className="text-slate-700 font-medium">{value || <span className="text-slate-300 italic">Nicht gesetzt</span>}</div>
          </div>
        ))}
      </div>
    </Collapse>
  );
}
