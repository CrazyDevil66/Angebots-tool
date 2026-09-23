import { useState, useEffect, useRef } from 'react';
import { AlertCircle, Building2, CheckCircle2, Settings2, AlignLeft, BookOpen, Users, Mail } from 'lucide-react';
import { saveFirma } from '../../api/stammdaten';
import FirmenPreview from './FirmenPreview';
import FirmaTab from './FirmaTab';
import TexteTab from './TexteTab';
import KatalogTab from './KatalogTab';
import BenutzerTab from './BenutzerTab';
import EmailTab from './EmailTab';

const TABS = [
  { id: 'firma',    label: 'Firmendaten',   icon: Building2 },
  { id: 'texte',    label: 'Textvorlagen',  icon: AlignLeft },
  { id: 'katalog',  label: 'Leistungen',    icon: BookOpen  },
  { id: 'benutzer', label: 'Benutzer',      icon: Users,    adminOnly: true },
  { id: 'email',    label: 'E-Mail',        icon: Mail,     adminOnly: true },
];

export default function Einstellungen({ token, currentUser, onLogout, firma, setFirma, setKunden, setAngebote, katalog, setKatalog }) {
  const [saved,   setSaved]   = useState(false);
  const [speicherFehler, setSpeicherFehler] = useState(null);
  const [tab,     setTab]     = useState('firma');
  const timer     = useRef(null);
  const saveTimer = useRef(null);
  // Zuletzt gespeicherter bzw. vom Server geladener Stand. Ohne diesen Vergleich löst das
  // Neuladen per Live-Update erneut ein Speichern aus – eine Endlosschleife.
  const letzterStand = useRef(null);
  const istAdmin = currentUser?.role === 'admin';

  function triggerSaved() {
    setSpeicherFehler(null);
    setSaved(true);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setSaved(false), 2500);
  }

  useEffect(() => {
    // Nur Admins dürfen Firmendaten ändern – sonst würde ein Live-Update als Echo zurückgespeichert.
    if (!token || !firma || !istAdmin) return;
    const stand = JSON.stringify(firma);
    if (letzterStand.current === null) letzterStand.current = stand;
    if (stand === letzterStand.current) return;
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      try {
        await saveFirma(token, firma);
        letzterStand.current = stand;
        triggerSaved();
      } catch (e) {
        setSpeicherFehler(e.message);
      }
    }, 500);
    return () => clearTimeout(saveTimer.current);
  }, [firma, token, istAdmin]);

  const set = (field, val) => setFirma(prev => ({ ...prev, [field]: val }));

  return (
    <div className="min-h-full bg-gradient-to-br from-slate-50 to-indigo-50/20">

      {/* Topbar */}
      <div className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-sm">
        <div className="px-8 h-14 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <Settings2 size={18} className="text-indigo-500" />
              <h1 className="text-base font-bold text-slate-800">Einstellungen</h1>
            </div>
            {/* Tabs */}
            <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-1">
              {TABS.filter(t => !t.adminOnly || istAdmin).map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => setTab(id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-md transition-all ${
                    tab === id
                      ? 'bg-white text-slate-800 shadow-sm'
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  <Icon size={14} />
                  {label}
                </button>
              ))}
            </div>
          </div>
          {speicherFehler ? (
            <span className="flex items-center gap-1.5 text-xs text-red-600 font-medium">
              <AlertCircle size={13} />
              Nicht gespeichert: {speicherFehler}
            </span>
          ) : (
            <span className={`flex items-center gap-1.5 text-xs text-emerald-600 font-medium transition-opacity duration-500 ${saved ? 'opacity-100' : 'opacity-0'}`}>
              <CheckCircle2 size={13} />
              Gespeichert
            </span>
          )}
        </div>
      </div>

      {/* Zwei-Spalten-Layout */}
      <div className="max-w-6xl mx-auto px-8 py-6">
        <div className="grid gap-6" style={{ gridTemplateColumns: (['katalog', 'benutzer', 'email'].includes(tab)) ? 'minmax(0,1fr)' : 'minmax(0,1fr) 340px' }}>

          {/* ── Linke Spalte: Einstellungen ── */}
          <div className="flex flex-col gap-4">

            {!istAdmin && ['firma', 'texte'].includes(tab) && (
              <div className="bg-amber-50 border border-amber-200 text-amber-800 text-sm rounded-lg px-4 py-2.5">
                Firmendaten und Textvorlagen können nur Admins ändern.
              </div>
            )}
            {['firma', 'texte'].includes(tab) && (
              <fieldset disabled={!istAdmin} className="flex flex-col gap-4 min-w-0">
                {tab === 'firma' && (
                  <FirmaTab
                    firma={firma}
                    setFeld={set}
                    istAdmin={istAdmin}
                    token={token}
                    setFirma={setFirma}
                    setKunden={setKunden}
                    setKatalog={setKatalog}
                    setAngebote={setAngebote}
                  />
                )}
                {tab === 'texte' && <TexteTab firma={firma} setFeld={set} />}
              </fieldset>
            )}
            {tab === 'katalog' && (
              <KatalogTab token={token} katalog={katalog} setKatalog={setKatalog} onGespeichert={triggerSaved} onFehler={setSpeicherFehler} />
            )}
            {tab === 'benutzer' && <BenutzerTab token={token} currentUser={currentUser} onLogout={onLogout} />}
            {tab === 'email' && <EmailTab token={token} />}
          </div>

          {/* ── Rechte Spalte: Live-Vorschau ── */}
          {!['katalog', 'benutzer', 'email'].includes(tab) && <FirmenPreview firma={firma} fokus={tab} />}

        </div>
      </div>
    </div>
  );
}
