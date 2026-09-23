import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './views/Dashboard';
import AngeboteListe from './views/AngeboteListe';
import AngebotEditor from './features/angebot-editor/AngebotEditor';
import RechnungenListe from './views/RechnungenListe';
import KundenListe from './views/KundenListe';
import Einstellungen from './features/einstellungen/Einstellungen';
import LoginScreen from './features/auth/LoginScreen';
import SetupScreen from './features/auth/SetupScreen';
import InviteScreen from './features/auth/InviteScreen';
import ChangePasswordModal from './features/auth/ChangePasswordModal';
import LadeFehler from './features/auth/LadeFehler';
import { loadFirma, loadKunden, loadKatalog } from './api/stammdaten';
import { loadAngebote, setAngebotStatus } from './api/angebote';
import { apiSetupRequired, apiMe, getToken, saveToken, clearToken } from './api/auth';
import { autoMarkAbgelaufen } from './utils/angebote';
import { defaultData } from './lib/defaultData';

function istEinladungsLink() {
  return /^\/invite\/(.+)$/.test(window.location.pathname);
}

function parseJwt(token) {
  try {
    return JSON.parse(atob(token.split('.')[1]));
  } catch { return null; }
}

export default function App() {
  // Einladungslinks brauchen keinen Login-Check – dort wird direkt der InviteScreen gezeigt.
  const [auth, setAuth] = useState(() => ({ loading: !istEinladungsLink(), setupRequired: false, token: null, user: null }));
  const [nav, setNav] = useState({ view: 'dashboard', params: {} });

  const [firma,    setFirma]    = useState(null);
  const [kunden,   setKunden]   = useState([]);
  const [angebote, setAngebote] = useState([]);
  const [katalog,  setKatalog]  = useState([]);
  const [ladeFehler, setLadeFehler] = useState(null);

  const eventSourceRef = useRef(null);

  async function loadAllData(token) {
    const [f, k, a, kat] = await Promise.all([
      loadFirma(token),
      loadKunden(token),
      loadAngebote(token),
      loadKatalog(token),
    ]);
    setFirma(f || defaultData.firma);
    setKunden(k);
    setKatalog(kat);
    const { updated, changed } = autoMarkAbgelaufen(a);
    if (changed) {
      const abgelaufen = updated.filter((u, i) => u !== a[i]);
      let latestIndex = updated;
      for (const entry of abgelaufen) {
        latestIndex = await setAngebotStatus(token, entry.id, 'abgelaufen');
      }
      setAngebote(latestIndex);
    } else {
      setAngebote(a);
    }
  }

  function openSSE(token) {
    if (eventSourceRef.current) eventSourceRef.current.close();
    const es = new EventSource(`/api/events?token=${encodeURIComponent(token)}`);
    es.onmessage = async (e) => {
      const { dataType } = JSON.parse(e.data);
      try {
        if (dataType === 'firma')    setFirma(await loadFirma(token));
        if (dataType === 'kunden')   setKunden(await loadKunden(token));
        if (dataType === 'angebote') setAngebote(await loadAngebote(token));
        if (dataType === 'katalog')  setKatalog(await loadKatalog(token));
      } catch (err) {
        console.error(`Live-Aktualisierung von ${dataType} fehlgeschlagen:`, err);
      }
    };
    // Der Browser verbindet sich selbst neu; der Hinweis hilft bei der Fehlersuche.
    es.onerror = () => { console.warn('Live-Verbindung unterbrochen – Browser verbindet neu'); };
    eventSourceRef.current = es;
  }

  // Lädt alle Daten und startet die Live-Verbindung. Schlägt das Laden fehl,
  // zeigt die App eine Fehlermeldung mit „Erneut versuchen“ statt eines Endlos-Spinners.
  async function starteSitzung(token, user) {
    setLadeFehler(null);
    try {
      await loadAllData(token);
      openSSE(token);
    } catch (e) {
      console.error('Datenladen fehlgeschlagen:', e);
      setLadeFehler(e.message || 'Unbekannter Fehler');
    }
    setAuth({ loading: false, setupRequired: false, token, user });
  }

  useEffect(() => {
    if (istEinladungsLink()) return;
    (async () => {
      const setupRequired = await apiSetupRequired();
      if (setupRequired) {
        setAuth({ loading: false, setupRequired: true, token: null, user: null });
        return;
      }
      const token = getToken();
      if (token) {
        const user = await apiMe(token);
        if (user) {
          await starteSitzung(token, user);
          return;
        }
        clearToken();
      }
      setAuth({ loading: false, setupRequired: false, token: null, user: null });
    })();
    return () => { if (eventSourceRef.current) eventSourceRef.current.close(); };
  // eslint-disable-next-line react-hooks/exhaustive-deps -- nur einmal beim Öffnen der App
  }, []);

  async function handleAuthComplete(token) {
    const payload = parseJwt(token);
    saveToken(token);
    if (payload?.mustChangePassword) {
      setAuth({ loading: false, setupRequired: false, token, user: payload });
      return;
    }
    await starteSitzung(token, payload);
  }

  function handleLogout() {
    if (eventSourceRef.current) { eventSourceRef.current.close(); eventSourceRef.current = null; }
    clearToken();
    setLadeFehler(null);
    setFirma(null);
    setKunden([]);
    setAngebote([]);
    setKatalog([]);
    setAuth({ loading: false, setupRequired: false, token: null, user: null });
  }

  const navigate = useCallback((view, params = {}) => setNav({ view, params }), []);

  const counts = useMemo(() => ({
    angebote: angebote.length,
    rechnungen: angebote.filter(a => a.rechnungsNr && a.status !== 'bezahlt').length,
    kunden: kunden.length,
  }), [angebote, kunden]);

  if (auth.loading) {
    return (
      <div className="min-h-screen bg-[#0f172a] flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const inviteMatch = window.location.pathname.match(/^\/invite\/(.+)$/);
  if (inviteMatch) return <InviteScreen inviteToken={inviteMatch[1]} onComplete={handleAuthComplete} />;
  if (auth.setupRequired) return <SetupScreen onComplete={handleAuthComplete} />;
  if (!auth.token) return <LoginScreen onComplete={handleAuthComplete} />;
  if (auth.user?.mustChangePassword) return <ChangePasswordModal token={auth.token} onComplete={handleAuthComplete} />;
  if (ladeFehler) {
    return <LadeFehler meldung={ladeFehler} onErneut={() => starteSitzung(auth.token, auth.user)} onAbmelden={handleLogout} />;
  }

  const sharedProps = {
    navigate,
    token: auth.token,
    currentUser: auth.user,
    firma, setFirma,
    kunden, setKunden,
    angebote, setAngebote,
    katalog, setKatalog,
  };

  function renderView() {
    switch (nav.view) {
      case 'dashboard':      return <Dashboard {...sharedProps} />;
      case 'angebote':       return <AngeboteListe {...sharedProps} />;
      case 'angebot-editor': return <AngebotEditor {...sharedProps} params={nav.params} />;
      case 'rechnungen':     return <RechnungenListe {...sharedProps} />;
      case 'kunden':         return <KundenListe {...sharedProps} />;
      case 'einstellungen':  return <Einstellungen {...sharedProps} onLogout={handleLogout} />;
      default:               return <Dashboard {...sharedProps} />;
    }
  }

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      <Sidebar currentView={nav.view} onNavigate={navigate} counts={counts} onLogout={handleLogout} />
      <main className="flex-1 overflow-y-auto">{renderView()}</main>
    </div>
  );
}
