import { useRef, useState } from 'react';
import { Download, Upload } from 'lucide-react';
import { ladeBackup, stelleBackupWiederHer } from '../../api/backup';
import { loadFirma, loadKunden, loadKatalog } from '../../api/stammdaten';
import { loadAngebote } from '../../api/angebote';
import { defaultData } from '../../lib/defaultData';
import { dateiHerunterladen } from '../../utils/download';

function dateiLesen(datei) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error);
    reader.readAsText(datei);
  });
}

export default function Datensicherung({ token, setFirma, setKunden, setKatalog, setAngebote }) {
  const importRef = useRef(null);
  const [laeuft, setLaeuft] = useState(false);
  const [meldung, setMeldung] = useState(null);

  async function handleExport() {
    setMeldung(null);
    setLaeuft(true);
    try {
      const backup = await ladeBackup(token);
      const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
      dateiHerunterladen(blob, `objektrausch-backup-${new Date().toISOString().slice(0, 10)}.json`);
    } catch (e) {
      setMeldung({ fehler: true, text: `Export fehlgeschlagen: ${e.message}` });
    } finally {
      setLaeuft(false);
    }
  }

  async function handleImport(e) {
    const datei = e.target.files?.[0];
    e.target.value = '';
    if (!datei) return;
    if (!confirm('Backup importieren? Alle vorhandenen Daten werden ersetzt. Der aktuelle Stand wird vorher auf dem Server gesichert.')) return;

    setMeldung(null);
    setLaeuft(true);
    try {
      let backup;
      try {
        backup = JSON.parse(await dateiLesen(datei));
      } catch {
        throw new Error('Die Datei ist keine gültige JSON-Datei.');
      }
      const { sicherungsDatei } = await stelleBackupWiederHer(token, backup);
      const [firma, kunden, katalog, angebote] = await Promise.all([
        loadFirma(token), loadKunden(token), loadKatalog(token), loadAngebote(token),
      ]);
      setFirma(firma || defaultData.firma);
      setKunden(kunden);
      setKatalog(katalog);
      setAngebote(angebote);
      setMeldung({ fehler: false, text: `Backup importiert. Vorheriger Stand gesichert als backups/${sicherungsDatei}` });
    } catch (err) {
      setMeldung({ fehler: true, text: `Import fehlgeschlagen: ${err.message}` });
    } finally {
      setLaeuft(false);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-3">
        <button
          onClick={handleExport}
          disabled={laeuft}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-700 border border-slate-200 bg-white rounded-lg hover:bg-slate-50 hover:border-slate-300 disabled:opacity-50 transition-all"
        >
          <Download size={14} />
          Alle Daten exportieren
        </button>
        <button
          onClick={() => importRef.current?.click()}
          disabled={laeuft}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-700 border border-slate-200 bg-white rounded-lg hover:bg-slate-50 hover:border-slate-300 disabled:opacity-50 transition-all"
        >
          <Upload size={14} />
          Backup importieren
        </button>
        <input ref={importRef} type="file" accept=".json" className="hidden" onChange={handleImport} />
      </div>
      <span className="text-xs text-slate-400">
        Importieren ersetzt alle vorhandenen Daten. Der bisherige Stand wird vorher auf dem Server gesichert.
      </span>
      {meldung && (
        <div className={`text-xs rounded-lg px-3 py-2 border ${meldung.fehler
          ? 'bg-red-50 border-red-200 text-red-600'
          : 'bg-emerald-50 border-emerald-200 text-emerald-700'}`}>
          {meldung.text}
        </div>
      )}
    </div>
  );
}
