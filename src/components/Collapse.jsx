import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

export default function Collapse({ title, icon: Icon, children, defaultOpen = true }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between gap-3 px-6 py-4 border-b border-slate-100 bg-slate-50 hover:bg-slate-100 transition-colors text-left"
      >
        <div className="flex items-center gap-3">
          {Icon && <Icon size={18} className="text-indigo-500" />}
          <h3 className="font-semibold text-slate-700 text-sm">{title}</h3>
        </div>
        {open ? <ChevronUp size={16} className="text-slate-400" /> : <ChevronDown size={16} className="text-slate-400" />}
      </button>
      {open && <div className="p-6">{children}</div>}
    </div>
  );
}
