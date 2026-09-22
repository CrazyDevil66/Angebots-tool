export default function Section({ icon: Icon, title, children }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
      <div className="flex items-center gap-3 px-5 py-3.5 border-b border-slate-100 bg-slate-50">
        <Icon size={16} className="text-indigo-500" />
        <h2 className="font-semibold text-slate-700 text-sm">{title}</h2>
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}
