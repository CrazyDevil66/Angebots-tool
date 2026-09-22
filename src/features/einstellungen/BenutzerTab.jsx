import BenutzerVerwaltung from './BenutzerVerwaltung';

export default function BenutzerTab({ token, currentUser, onLogout }) {
  return (
    <>
      <BenutzerVerwaltung token={token} currentUser={currentUser} />
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4">
          <span className="text-sm text-slate-600">
            Eingeloggt als <strong className="text-slate-800">{currentUser?.username}</strong>
            {currentUser?.role === 'admin' && <span className="ml-2 text-xs text-indigo-600 font-semibold">(Admin)</span>}
          </span>
          <button
            onClick={onLogout}
            className="flex items-center gap-2 px-3 py-1.5 text-sm text-slate-500 border border-slate-200 rounded-lg hover:bg-red-50 hover:text-red-500 hover:border-red-200 transition-all"
          >
            Abmelden
          </button>
        </div>
      </div>
    </>
  );
}
