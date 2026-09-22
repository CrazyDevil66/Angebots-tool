import { useState, useEffect } from 'react';
import { Mail } from 'lucide-react';
import FormField, { Input } from '../../components/FormField';
import { apiGetSmtp, apiSaveSmtp, apiTestSmtp } from '../../api/auth';
import Section from './Section';

export default function EmailTab({ token }) {
  const [smtp, setSmtp] = useState({ host: '', port: 587, user: '', pass: '', from: '', baseUrl: '' });
  const [smtpSaved, setSmtpSaved] = useState(false);
  const [smtpError, setSmtpError] = useState('');
  const [testEmail, setTestEmail] = useState('');
  const [testResult, setTestResult] = useState('');

  useEffect(() => {
    apiGetSmtp(token).then(d => { if (d) setSmtp(d); }).catch(() => {});
  }, [token]);

  async function saveSmtp() {
    setSmtpError('');
    try {
      await apiSaveSmtp(token, smtp);
      setSmtpSaved(true);
      setTimeout(() => setSmtpSaved(false), 2500);
    } catch (e) {
      setSmtpError(e.message);
    }
  }

  async function sendTestMail() {
    setTestResult('');
    try {
      await apiTestSmtp(token, testEmail);
      setTestResult('✓ Test-Mail gesendet.');
    } catch (e) {
      setTestResult(`Fehler: ${e.message}`);
    }
  }

  return (
    <Section icon={Mail} title="SMTP-Konfiguration">
      <div className="grid grid-cols-2 gap-3">
        <FormField label="SMTP-Host" className="col-span-2">
          <Input value={smtp.host} onChange={e => setSmtp(p => ({ ...p, host: e.target.value }))} placeholder="smtp.gmail.com" />
        </FormField>
        <FormField label="Port">
          <Input type="number" value={smtp.port} onChange={e => setSmtp(p => ({ ...p, port: Number(e.target.value) }))} placeholder="587" />
        </FormField>
        <FormField label="Benutzername">
          <Input value={smtp.user} onChange={e => setSmtp(p => ({ ...p, user: e.target.value }))} placeholder="user@gmail.com" />
        </FormField>
        <FormField label="Passwort">
          <Input type="password" value={smtp.pass} onChange={e => setSmtp(p => ({ ...p, pass: e.target.value }))} placeholder="App-Passwort" />
        </FormField>
        <FormField label="Absender-Adresse">
          <Input value={smtp.from} onChange={e => setSmtp(p => ({ ...p, from: e.target.value }))} placeholder="noreply@firma.de" />
        </FormField>
        <FormField label="App-URL (für Einladungslinks)" className="col-span-2">
          <Input value={smtp.baseUrl} onChange={e => setSmtp(p => ({ ...p, baseUrl: e.target.value }))} placeholder="https://meinserver.de" />
        </FormField>
      </div>
      {smtpError && <div className="text-xs text-red-500 mt-2">{smtpError}</div>}
      <div className="flex items-center gap-3 mt-4">
        <button
          onClick={saveSmtp}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-lg transition-colors"
        >
          {smtpSaved ? '✓ Gespeichert' : 'Speichern'}
        </button>
      </div>
      <div className="mt-5 pt-4 border-t border-slate-100">
        <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Test-Mail senden</div>
        <div className="flex gap-2">
          <input
            type="email"
            value={testEmail}
            onChange={e => setTestEmail(e.target.value)}
            placeholder="empfaenger@beispiel.de"
            className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm focus:border-indigo-400 focus:ring-1 focus:ring-indigo-100 transition-all"
          />
          <button
            onClick={sendTestMail}
            className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-600 text-sm rounded-lg transition-colors"
          >
            Senden
          </button>
        </div>
        {testResult && <div className={`text-xs mt-2 ${testResult.startsWith('✓') ? 'text-emerald-600' : 'text-red-500'}`}>{testResult}</div>}
      </div>
    </Section>
  );
}
