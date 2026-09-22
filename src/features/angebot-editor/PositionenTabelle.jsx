import { useState } from 'react';
import { Plus, Trash2, GripVertical, ChevronUp, ChevronDown } from 'lucide-react';
import { Input, Select } from '../../components/FormField';
import { einheiten } from '../../lib/defaultData';
import { vkPreis, positionGesamt, berechneSummen } from '../../../shared/berechnung.js';
import { formatBetrag } from '../../utils/format';
import { neuePosition, verschiebePosition, zielIndexBeimEinfuegen } from '../../utils/positionen';

const EINFUEGE_LINIE_OBEN  = 'shadow-[inset_0_2px_0_0_#6366f1]';
const EINFUEGE_LINIE_UNTEN = 'shadow-[inset_0_-2px_0_0_#6366f1]';

export default function PositionenTabelle({ positionen, onChange }) {
  // Drag & Drop: gezogene Zeile und Einfügelücke (0 = vor der ersten, n = nach der letzten Zeile)
  const [ziehtVon, setZiehtVon] = useState(null);
  const [luecke, setLuecke] = useState(null);

  function update(i, field, value) {
    const neu = positionen.map((p, idx) => idx === i ? { ...p, [field]: value } : p);
    onChange(neu);
  }

  function addRow() {
    onChange([...positionen, neuePosition()]);
  }

  function verschiebe(von, nach) {
    onChange(verschiebePosition(positionen, von, nach));
  }

  function handleDragStart(e, i) {
    setZiehtVon(i);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', String(i));
    const zeile = e.currentTarget.closest('[data-position-zeile]');
    if (zeile) e.dataTransfer.setDragImage(zeile, 16, 16);
  }

  function handleDragOver(e, i) {
    if (ziehtVon === null) return;
    e.preventDefault();
    const { top, height } = e.currentTarget.getBoundingClientRect();
    setLuecke(e.clientY < top + height / 2 ? i : i + 1);
  }

  function handleDrop(e) {
    e.preventDefault();
    if (ziehtVon !== null && luecke !== null) {
      verschiebe(ziehtVon, zielIndexBeimEinfuegen(ziehtVon, luecke));
    }
    handleDragEnd();
  }

  function handleDragEnd() {
    setZiehtVon(null);
    setLuecke(null);
  }

  function remove(i) {
    if (positionen.length === 1) return;
    onChange(positionen.filter((_, idx) => idx !== i));
  }

  const { netto } = berechneSummen(positionen);

  return (
    <div>
      {/* Tabellen-Header */}
      <div className="grid grid-cols-[28px_1fr_68px_76px_88px_60px_88px_96px_36px] gap-2 px-2 pb-2 border-b border-slate-100">
        <span />
        <span className="text-xs font-medium text-slate-400 uppercase tracking-wide">Beschreibung</span>
        <span className="text-xs font-medium text-slate-400 uppercase tracking-wide text-center">Menge</span>
        <span className="text-xs font-medium text-slate-400 uppercase tracking-wide text-center">Einheit</span>
        <span className="text-xs font-medium text-slate-400 uppercase tracking-wide text-right">EK-Preis</span>
        <span className="text-xs font-medium text-slate-400 uppercase tracking-wide text-center">Aufschl.</span>
        <span className="text-xs font-medium text-slate-400 uppercase tracking-wide text-right">VK-Preis</span>
        <span className="text-xs font-medium text-slate-400 uppercase tracking-wide text-right">Gesamt</span>
        <span />
      </div>

      {/* Positionen */}
      <div className="flex flex-col gap-1 mt-2">
        {positionen.map((pos, i) => {
          const vk = vkPreis(pos);
          const gesamt = positionGesamt(pos);
          const linie = luecke === i ? EINFUEGE_LINIE_OBEN
            : (luecke === positionen.length && i === positionen.length - 1) ? EINFUEGE_LINIE_UNTEN : '';
          return (
            <div
              key={pos.id ?? i}
              data-position-zeile
              onDragOver={e => handleDragOver(e, i)}
              onDrop={handleDrop}
              className={`grid grid-cols-[28px_1fr_68px_76px_88px_60px_88px_96px_36px] gap-2 items-start
                bg-slate-50 rounded-xl p-2 hover:bg-indigo-50/40 transition-colors group
                ${ziehtVon === i ? 'opacity-40' : ''} ${linie}`}
            >
              <div className="flex flex-col items-center text-slate-300 group-hover:text-slate-400">
                <button
                  type="button"
                  onClick={() => verschiebe(i, i - 1)}
                  disabled={i === 0}
                  title="Nach oben"
                  aria-label={`Position ${i + 1} nach oben`}
                  className="rounded hover:text-indigo-500 disabled:opacity-20 disabled:cursor-not-allowed"
                >
                  <ChevronUp size={14} />
                </button>
                <div
                  draggable
                  onDragStart={e => handleDragStart(e, i)}
                  onDragEnd={handleDragEnd}
                  title="Ziehen zum Verschieben"
                  className="cursor-grab active:cursor-grabbing py-0.5 hover:text-indigo-500"
                >
                  <GripVertical size={16} />
                </div>
                <button
                  type="button"
                  onClick={() => verschiebe(i, i + 1)}
                  disabled={i === positionen.length - 1}
                  title="Nach unten"
                  aria-label={`Position ${i + 1} nach unten`}
                  className="rounded hover:text-indigo-500 disabled:opacity-20 disabled:cursor-not-allowed"
                >
                  <ChevronDown size={14} />
                </button>
              </div>

              <div className="flex flex-col gap-1">
                <Input
                  placeholder="Bezeichnung"
                  value={pos.bezeichnung}
                  onChange={e => update(i, 'bezeichnung', e.target.value)}
                />
                <input
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-xs text-slate-500
                    bg-white focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all
                    placeholder:text-slate-300"
                  placeholder="Zusatzbeschreibung (optional)"
                  value={pos.beschreibung}
                  onChange={e => update(i, 'beschreibung', e.target.value)}
                />
              </div>

              <Input
                type="number"
                min="0"
                step="0.01"
                value={pos.menge}
                onChange={e => update(i, 'menge', e.target.value)}
                className="text-center"
              />

              <Select
                value={pos.einheit}
                onChange={e => update(i, 'einheit', e.target.value)}
              >
                {einheiten.map(e => <option key={e} value={e}>{e}</option>)}
              </Select>

              <Input
                type="number"
                min="0"
                step="0.01"
                value={pos.einzelpreis}
                onChange={e => update(i, 'einzelpreis', e.target.value)}
                className="text-right"
                placeholder="0,00"
              />

              {/* Aufschlag % */}
              <div className="relative flex items-center">
                <input
                  type="number"
                  min="0"
                  step="0.1"
                  value={pos.aufschlag ?? 0}
                  onChange={e => update(i, 'aufschlag', e.target.value)}
                  className="w-full px-2 pr-5 py-2 rounded-lg border border-slate-200 text-sm text-right bg-white
                    focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all"
                  placeholder="0"
                />
                <span className="absolute right-1.5 text-xs text-slate-400 pointer-events-none">%</span>
              </div>

              {/* VK-Preis (berechnet) */}
              <div className="flex items-center justify-end h-9">
                <span className={`text-sm font-medium ${Number(pos.aufschlag) > 0 ? 'text-emerald-600' : 'text-slate-500'}`}>
                  {formatBetrag(vk)} €
                </span>
              </div>

              {/* Gesamt */}
              <div className="flex items-center justify-end h-9">
                <span className="text-sm font-semibold text-slate-700">
                  {formatBetrag(gesamt)} €
                </span>
              </div>

              <div className="flex items-center justify-center h-9">
                <button
                  onClick={() => remove(i)}
                  disabled={positionen.length === 1}
                  className="p-1.5 rounded-lg text-slate-300 hover:text-red-400 hover:bg-red-50
                    disabled:opacity-20 disabled:cursor-not-allowed transition-all"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Hinzufügen */}
      <button
        onClick={addRow}
        className="mt-3 flex items-center gap-2 px-4 py-2 text-sm text-indigo-600 font-medium
          border-2 border-dashed border-indigo-200 rounded-xl w-full justify-center
          hover:border-indigo-400 hover:bg-indigo-50 transition-all"
      >
        <Plus size={16} />
        Position hinzufügen
      </button>

      {/* Summe */}
      <div className="mt-4 pt-4 border-t border-slate-100 flex justify-end">
        <div className="text-sm text-slate-500">
          Netto gesamt:
          <span className="ml-3 font-semibold text-slate-800 text-base">
            {formatBetrag(netto)} €
          </span>
        </div>
      </div>
    </div>
  );
}
