import { ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-react';

// Tabellenkopf, der per Klick sortiert. Ohne feld ist die Spalte nicht sortierbar.
export default function SortierKopf({ label, feld, sortierung, onSortieren, rechts = false, className = '' }) {
  const klassen = `px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide bg-slate-50 ${rechts ? 'text-right' : 'text-left'} ${className}`;
  if (!feld) return <th className={klassen}>{label}</th>;
  const aktiv = sortierung?.feld === feld;
  const Symbol = !aktiv ? ArrowUpDown : sortierung.richtung === 'auf' ? ArrowUp : ArrowDown;
  return (
    <th className={klassen} aria-sort={aktiv ? (sortierung.richtung === 'auf' ? 'ascending' : 'descending') : 'none'}>
      <button
        type="button"
        onClick={() => onSortieren(feld)}
        className={`inline-flex items-center gap-1 uppercase tracking-wide hover:text-slate-700 ${aktiv ? 'text-indigo-600' : ''}`}
      >
        {label}
        <Symbol size={12} className={aktiv ? '' : 'opacity-40'} />
      </button>
    </th>
  );
}
