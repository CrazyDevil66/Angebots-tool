import { User } from 'lucide-react';
import Collapse from '../../../components/Collapse';
import FormField, { Input } from '../../../components/FormField';
import KundenPicker from '../KundenPicker';

const ANREDEN = ['', 'Herr', 'Frau', 'Divers'];

export default function KundenDaten({ kunde, kunden, set, setAnrede, setKundeName, onKundeWaehlen, onLeeren, onKundenVerwalten }) {
  return (
    <Collapse title="Kundendaten" icon={User}>
      <div className="flex items-center gap-3 mb-5 pb-4 border-b border-slate-100">
        <KundenPicker kunden={kunden} onSelect={onKundeWaehlen} onManage={onKundenVerwalten} />
        {(kunde.firma || kunde.name) && (
          <button
            onClick={onLeeren}
            className="text-xs text-slate-400 hover:text-red-400 transition-colors ml-auto"
          >
            Leeren
          </button>
        )}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField label="Firmenname (optional)">
          <Input value={kunde.firma} onChange={e => set('kunde.firma', e.target.value)} placeholder="Kunden GmbH" />
        </FormField>
        <FormField label="Anrede">
          <div className="flex gap-1">
            {ANREDEN.map(a => (
              <button
                key={a}
                type="button"
                onClick={() => setAnrede(a)}
                className={`px-3 py-2 text-sm rounded-lg border transition-all ${
                  kunde.anrede === a
                    ? 'bg-indigo-600 text-white border-indigo-600 font-semibold'
                    : 'bg-white text-slate-500 border-slate-200 hover:border-indigo-300'
                }`}
              >
                {a || '—'}
              </button>
            ))}
          </div>
        </FormField>
        <FormField label="Ansprechpartner">
          <Input value={kunde.name} onChange={e => setKundeName(e.target.value)} placeholder="Max Mustermann" />
        </FormField>
        <FormField label="Straße">
          <Input value={kunde.strasse} onChange={e => set('kunde.strasse', e.target.value)} placeholder="Kundenstraße 5" />
        </FormField>
        <div className="grid grid-cols-[110px_1fr] gap-3">
          <FormField label="PLZ">
            <Input value={kunde.plz} onChange={e => set('kunde.plz', e.target.value)} placeholder="10115" />
          </FormField>
          <FormField label="Ort">
            <Input value={kunde.ort} onChange={e => set('kunde.ort', e.target.value)} placeholder="Berlin" />
          </FormField>
        </div>
        <FormField label="E-Mail">
          <Input type="email" value={kunde.email} onChange={e => set('kunde.email', e.target.value)} placeholder="kunde@beispiel.de" />
        </FormField>
        <FormField label="Telefon">
          <Input value={kunde.telefon} onChange={e => set('kunde.telefon', e.target.value)} placeholder="+49 30 654321" />
        </FormField>
      </div>
    </Collapse>
  );
}
