import { useEffect, useRef, useState } from 'react';
import { BookOpen, Plus, Trash2 } from 'lucide-react';
import { Input, Select } from '../../components/FormField';
import { einheiten } from '../../lib/defaultData';
import { saveLeistung, deleteLeistung } from '../../api/stammdaten';
import Section from './Section';
import { neueId } from '../../utils/id';

const SPEICHER_VERZOEGERUNG_MS = 500;

function ohne(objekt, schluessel) {
  const { [schluessel]: _entfernt, ...rest } = objekt;
  return rest;
}

export default function KatalogTab({ token, katalog, setKatalog, onGespeichert, onFehler }) {
  // Zeilen mit noch nicht gespeicherten Änderungen. Sie haben Vorrang vor dem Serverstand,
  // damit ein Live-Update beim Tippen keine Eingaben überschreibt.
  const [entwuerfe, setEntwuerfe] = useState({});
  const timer = useRef(new Map());
  const ausstehend = useRef(new Map());

  // Beim Verlassen des Tabs noch wartende Änderungen sofort speichern statt sie zu verwerfen.
  useEffect(() => {
    const timerListe = timer.current;
    const offen = ausstehend.current;
    return () => {
      for (const [id, leistung] of offen) {
        clearTimeout(timerListe.get(id));
        saveLeistung(token, leistung).catch(e => onFehler(e.message));
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps -- nur beim Verlassen des Tabs
  }, []);

  async function speichere(leistung) {
    try {
      setKatalog(await saveLeistung(token, leistung));
      // Entwurf nur verwerfen, wenn seitdem nicht weitergetippt wurde
      setEntwuerfe(e => e[leistung.id] === leistung ? ohne(e, leistung.id) : e);
      onGespeichert();
    } catch (e) {
      onFehler(e.message);
    }
  }

  function verzoegertSpeichern(leistung) {
    clearTimeout(timer.current.get(leistung.id));
    ausstehend.current.set(leistung.id, leistung);
    timer.current.set(leistung.id, setTimeout(() => {
      timer.current.delete(leistung.id);
      ausstehend.current.delete(leistung.id);
      speichere(leistung);
    }, SPEICHER_VERZOEGERUNG_MS));
  }

  function katalogUpdate(id, field, value) {
    const basis = entwuerfe[id] ?? katalog.find(item => item.id === id);
    const neu = { ...basis, [field]: value };
    setEntwuerfe(e => ({ ...e, [id]: neu }));
    verzoegertSpeichern(neu);
  }

  function katalogAdd() {
    const neu = { id: neueId(), bezeichnung: '', beschreibung: '', einheit: 'Stk.', einzelpreis: 0 };
    setKatalog(k => [...k, neu]);
    return speichere(neu);
  }

  async function katalogDelete(id) {
    clearTimeout(timer.current.get(id));
    timer.current.delete(id);
    ausstehend.current.delete(id);
    setEntwuerfe(e => ohne(e, id));
    setKatalog(k => k.filter(item => item.id !== id));
    try {
      setKatalog(await deleteLeistung(token, id));
      onGespeichert();
    } catch (e) {
      onFehler(e.message);
    }
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
        {katalog.map(gespeichert => entwuerfe[gespeichert.id] ?? gespeichert).map(item => (
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
