import { useEffect, useState } from 'react';
import FormField, { Input, Select } from '../../components/FormField';
import { ladeBackupEinstellungen, speichereBackupEinstellungen, jetztSichern } from '../../api/backup';

const WOCHENTAGE = ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'];

function statusText(status) {
  if (!status?.letzte) return 'Noch keine automatische Sicherung vorhanden.';
  const zeit = new Date(status.letzte).toLocaleString('de-DE', { dateStyle: 'medium', timeStyle: 'short' });
  return `Letzte automatische Sicherung: ${zeit} · ${status.anzahl} ${status.anzahl === 1 ? 'Sicherung' : 'Sicherungen'} vorhanden`;
}

export default function AutomatischeSicherung({ token }) {
  const [werte, setWerte] = useState(null);
  const [status, setStatus] = useState(null);
  const [gespeichert, setGespeichert] = useState(false);
  const [laeuft, setLaeuft] = useState(false);
  const [fehler, setFehler] = useState('');

  function uebernehmen({ status: neuerStatus, ...einstellungen }) {
    setWerte({ ...einstellungen, behalten: String(einstellungen.behalten) });
    setStatus(neuerStatus);
  }

  useEffect(() => {
    ladeBackupEinstellungen(token)
      .then(uebernehmen)
      .catch(e => setFehler(`Einstellungen konnten nicht geladen werden: ${e.message}`));
  }, [token]);

  const setze = (feld, wert) => setWerte(w => ({ ...w, [feld]: wert }));

  async function speichern() {
    setFehler('');
    try {
      uebernehmen(await speichereBackupEinstellungen(token, { ...werte, behalten: Number(werte.behalten) }));
      setGespeichert(true);
      setTimeout(() => setGespeichert(false), 2500);
    } catch (e) {
      setFehler(e.message);
    }
  }

  async function sofortSichern() {
    setFehler('');
    setLaeuft(true);
    try {
      setStatus((await jetztSichern(token)).status);
    } catch (e) {
      setFehler(`Sicherung fehlgeschlagen: ${e.message}`);
    } finally {
      setLaeuft(false);
    }
  }

  return (
    <div className="mt-2 pt-4 border-t border-slate-100">
      <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Automatische Sicherung</div>
      {werte && (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <FormField label="Häufigkeit">
              <Select value={werte.haeufigkeit} onChange={e => setze('haeufigkeit', e.target.value)}>
                <option value="aus">Aus</option>
                <option value="taeglich">Täglich</option>
                <option value="woechentlich">Wöchentlich</option>
              </Select>
            </FormField>
            {werte.haeufigkeit === 'woechentlich' && (
              <FormField label="Wochentag">
                <Select value={werte.wochentag} onChange={e => setze('wochentag', Number(e.target.value))}>
                  {WOCHENTAGE.map((tag, i) => <option key={tag} value={i}>{tag}</option>)}
                </Select>
              </FormField>
            )}
            {werte.haeufigkeit !== 'aus' && (
              <>
                <FormField label="Uhrzeit">
                  <Input type="time" value={werte.uhrzeit} onChange={e => setze('uhrzeit', e.target.value)} />
                </FormField>
                <FormField label="Anzahl behalten">
                  <Input type="number" min="1" max="365" value={werte.behalten} onChange={e => setze('behalten', e.target.value)} />
                </FormField>
              </>
            )}
          </div>
          <div className="flex items-center gap-3 mt-4">
            <button
              onClick={speichern}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-lg transition-colors"
            >
              {gespeichert ? '✓ Gespeichert' : 'Speichern'}
            </button>
            <button
              onClick={sofortSichern}
              disabled={laeuft}
              className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-600 text-sm rounded-lg disabled:opacity-50 transition-colors"
            >
              {laeuft ? 'Wird gesichert…' : 'Jetzt sichern'}
            </button>
          </div>
          <div className="text-xs text-slate-400 mt-3">{statusText(status)}</div>
          <div className="text-xs text-slate-400 mt-1">
            Gespeichert wird unter <code>backups/</code> im Datenordner; ältere automatische Sicherungen werden
            bei der nächsten Sicherung gelöscht. Wiederherstellen über „Backup importieren“.
          </div>
        </>
      )}
      {fehler && <div className="text-xs text-red-500 mt-2">{fehler}</div>}
    </div>
  );
}
