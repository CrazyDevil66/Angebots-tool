import { Calendar } from 'lucide-react';
import { deToIso, isoToDe } from '../utils/datum';

export default function DateInput({ value, onChange, className = '', ...props }) {
  return (
    <div className="relative">
      <input
        type="date"
        value={deToIso(value)}
        onChange={e => onChange(isoToDe(e.target.value))}
        className={`w-full pl-3 pr-9 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white text-slate-700 appearance-none ${className}`}
        {...props}
      />
      <Calendar
        size={14}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
      />
    </div>
  );
}
