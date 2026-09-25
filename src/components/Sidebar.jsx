import { LayoutDashboard, FileText, Users, Settings, LogOut, Receipt } from 'lucide-react';
import { version } from '../../package.json';

const MAIN_NAV = [
  { id: 'dashboard',   label: 'Dashboard',  icon: LayoutDashboard },
  { id: 'angebote',    label: 'Angebote',   icon: FileText },
  { id: 'rechnungen',  label: 'Rechnungen', icon: Receipt },
  { id: 'kunden',      label: 'Kunden',     icon: Users },
];

function NavItem({ label, icon: Icon, active, count, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all text-left group
        ${active
          ? 'bg-slate-800 border border-slate-700 text-white'
          : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
        }`}
    >
      <Icon size={16} className={active ? 'text-indigo-400' : 'group-hover:text-slate-300'} />
      <span className="font-medium flex-1">{label}</span>
      {count > 0 && (
        <span className="bg-indigo-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center leading-none">
          {count > 99 ? '99+' : count}
        </span>
      )}
    </button>
  );
}

export default function Sidebar({ currentView, onNavigate, counts = {}, onLogout, offen = false, onSchliessen }) {
  function waehle(view) {
    onSchliessen?.();
    onNavigate(view);
  }

  return (
    <aside
      className={`w-56 bg-[#0f172a] flex flex-col flex-shrink-0 h-dvh border-r border-slate-800
        fixed inset-y-0 left-0 z-[60] transition-[transform,visibility] ${offen ? 'translate-x-0' : '-translate-x-full invisible'}
        lg:static lg:translate-x-0 lg:visible lg:transition-none`}
    >
      {/* Logo */}
      <div className="p-4 border-b border-slate-800/80">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center flex-shrink-0 shadow-lg shadow-indigo-900/50">
            <FileText size={15} className="text-white" />
          </div>
          <div>
            <div className="font-bold text-white text-sm leading-tight tracking-tight">AngebotsTool</div>
          </div>
        </div>
      </div>

      {/* Hauptnavigation */}
      <nav className="flex-1 p-3 flex flex-col gap-0.5 overflow-y-auto">
        {MAIN_NAV.map(item => (
          <NavItem
            key={item.id}
            {...item}
            active={
              currentView === item.id ||
              (item.id === 'angebote' && currentView === 'angebot-editor')
            }
            count={counts[item.id] || 0}
            onClick={() => waehle(item.id)}
          />
        ))}
      </nav>

      {/* Einstellungen + Logout unten */}
      <div className="p-3 border-t border-slate-800/80 flex flex-col gap-0.5">
        <NavItem
          id="einstellungen"
          label="Einstellungen"
          icon={Settings}
          active={currentView === 'einstellungen'}
          onClick={() => waehle('einstellungen')}
        />
        {onLogout && (
          <button
            onClick={() => { onSchliessen?.(); onLogout(); }}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all text-left text-slate-400 hover:text-red-400 hover:bg-red-500/10"
          >
            <LogOut size={16} />
            <span className="font-medium">Abmelden</span>
          </button>
        )}
        <div className="px-3 pt-2 text-[11px] text-slate-500">Version {version}</div>
      </div>
    </aside>
  );
}
