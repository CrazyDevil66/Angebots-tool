import { BookOpen, Plus, Trash2 } from 'lucide-react';
import { Input, Select } from '../../components/FormField';
import { einheiten } from '../../lib/defaultData';
import { saveKatalog } from '../../api/stammdaten';
import Section from './Section';

export default function KatalogTab({ token, katalog, setKatalog, onGespeichert }) {
  async function speichere(neu) {
    setKatalog(neu);
    await saveKatalog(token, neu);
    onGespeichert();
  }

  function katalogUpdate(id, field, value) {
    return speichere(katalog.map(item => item.id === id ? { ...item, [field]: value } : item));
  }

  function katalogAdd() {
    return speichere([
      ...katalog,
      { id: crypto.randomUUID(), bezeichnung: '', beschreibung: '', einheit: 'Stk.', einzelpreis: 0 },
    ]);
  }

  function katalogDelete(id) {
    return speichere(katalog.filter(item => item.id !== id));
  }

  return (
    <Section icon={BookOpen} title="Leistungskatalog">
      {/* Tabellen-Header */}
      <div className="grid grid-cols-[1fr_160px_90px_110px_40px] gap-2 px-2 pb-2 border-b border-slate-100 mb-2">
        <span className="text-xs font-medium text-slate-400 uppercase tracking-wide">Bezeichnung / Beschreibung</span>
        <span className="text-xs font-medium text-slate-400 uppercase tracking-wide">Einheit</span>
        <span className="text-xs font-medium text-slate-400 uppercase tracking-wide text-right">Preis (€)</span>
        <span />
        <span />
      </div>

      <div className="flex flex-col gap-1.5">
        {katalog.length === 0 && (
          <p className="text-sm text-slate-400 text-center py-6 italic">
            Noch keine Leistungen angelegt — klicke auf „Neue Leistung"
          </p>
        )}
        {katalog.map(item => (
          <div
            key={item.id}
            className="grid grid-cols-[1fr_160px_90px_110px_40px] gap-2 items-start bg-slate-50 rounded-xl p-2 hover:bg-indigo-50/30 transition-colors group"
          >
            <div className="flex flex-col gap-1">
              <Input
                placeholder="Bezeichnung *"
                value={item.bezeichnung}
                onChange={e => katalogUpdate(item.id, 'bezeichnung', e.target.value)}
              />
              <input
                className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-xs text-slate-500 bg-white focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all placeholder:text-slate-300"
                placeholder="Beschreibung (optional)"
                value={item.beschreibung}
                onChange={e => katalogUpdate(item.id, 'beschreibung', e.target.value)}
              />
            </div>
            <Select
              value={item.einheit}
              onChange={e => katalogUpdate(item.id, 'einheit', e.target.value)}
            >
              {einheiten.map(e => <option key={e} value={e}>{e}</option>)}
            </Select>
            <Input
              type="number"
              min="0"
              step="0.01"
              value={item.einzelpreis}
              onChange={e => katalogUpdate(item.id, 'einzelpreis', e.target.value)}
              className="text-right"
              placeholder="0,00"
            />
            <div className="col-span-2 flex justify-end">
              <button
                onClick={() => katalogDelete(item.id)}
                className="p-1.5 rounded-lg text-slate-300 hover:text-red-400 hover:bg-red-50 transition-all"
              >
                <Trash2 size={15} />
              </button>
            </div>
          </div>
        ))}
      </div>

      <button
        onClick={katalogAdd}
        className="mt-3 flex items-center gap-2 px-4 py-2.5 text-sm text-indigo-600 font-medium border-2 border-dashed border-indigo-200 rounded-xl w-full justify-center hover:border-indigo-400 hover:bg-indigo-50 transition-all"
      >
        <Plus size={16} />
        Neue Leistung
      </button>
    </Section>
  );
}
