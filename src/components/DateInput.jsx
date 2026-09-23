import { deToIso, isoToDe } from '../utils/datum';

export default function DateInput({ value, onChange, className = '', ...props }) {
  return (
    <div className="relative">
      <input
        type="date"
        value={deToIso(value)}
        onChange={e => onChange(isoToDe(e.target.value))}
        className={`w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white text-slate-700 appearance-none ${className}`}
        {...props}
      />
    </div>
  );
}
