import { ClipboardList, BookOpen } from 'lucide-react';
import SectionCard from '../../../components/SectionCard';
import PositionenTabelle from '../PositionenTabelle';

export default function Positionen({ positionen, onChange, onAusKatalog }) {
  return (
    <SectionCard
      title="Positionen"
      icon={ClipboardList}
      action={
        <button
          onClick={onAusKatalog}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-indigo-600 bg-indigo-50 border border-indigo-200 rounded-lg hover:bg-indigo-100 transition-all"
        >
          <BookOpen size={13} />
          Aus Katalog
        </button>
      }
    >
      <PositionenTabelle positionen={positionen} onChange={onChange} />
    </SectionCard>
  );
}
