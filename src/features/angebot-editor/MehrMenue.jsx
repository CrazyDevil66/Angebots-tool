import { useState, useRef, useEffect } from 'react';
import { MoreHorizontal } from 'lucide-react';

export default function MehrMenue({ eintraege }) {
  const [offen, setOffen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    function handleOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) setOffen(false);
    }
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, []);

  useEffect(() => {
    if (!offen) return;
    const beiEscape = e => { if (e.key === 'Escape') setOffen(false); };
    window.addEventListener('keydown', beiEscape);
    return () => window.removeEventListener('keydown', beiEscape);
  }, [offen]);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOffen(!offen)}
        aria-label="Weitere Aktionen"
        aria-expanded={offen}
        className="p-2 rounded-lg text-slate-600 border border-slate-200 bg-white hover:bg-slate-50 transition-colors"
      >
        <MoreHorizontal size={16} />
      </button>

      {offen && (
        <div className="absolute top-full mt-1.5 right-0 z-50 bg-white rounded-xl shadow-xl border border-slate-100 py-1 min-w-[240px]">
          {eintraege.map(({ id, label, menuLabel, icon: Icon, onClick, disabled, trennerDavor }) => (
            <div key={id}>
              {trennerDavor && <div className="my-1 h-px bg-slate-100" />}
              <button
                onClick={() => { setOffen(false); onClick(); }}
                disabled={disabled}
                className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm whitespace-nowrap text-slate-700 hover:bg-slate-50 disabled:opacity-40 transition-colors text-left"
              >
                <Icon size={15} className="text-slate-400 flex-shrink-0" />
                {menuLabel ?? label}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
