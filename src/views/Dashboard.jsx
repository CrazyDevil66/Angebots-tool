import { useMemo } from 'react';
import {
  TrendingUp, FileText, AlertTriangle, CheckCircle2,
  Plus, ArrowRight, Banknote, Clock, Receipt, Hourglass,
} from 'lucide-react';
import StatusBadge from '../components/StatusBadge';
import { formatBetrag } from '../utils/format';
import { tageSeit } from '../utils/datum';
import { istAngenommen } from '../utils/angebote';

// ── KPI-Kachel ────────────────────────────────────────────────────────────────

function KpiCard({ label, value, sub, icon: Icon, accent = 'indigo', onClick }) {
  const colors = {
    indigo: { bg: 'bg-indigo-50',  icon: 'bg-indigo-500',  val: 'text-slate-900' },
    teal:   { bg: 'bg-teal-50',    icon: 'bg-teal-500',    val: 'text-slate-900' },
    amber:  { bg: 'bg-amber-50',   icon: 'bg-amber-500',   val: 'text-slate-900' },
    red:    { bg: 'bg-red-50',     icon: 'bg-red-500',     val: 'text-red-700'   },
  };
  const c = colors[accent];
  return (
    <div
      className={`rounded-2xl border border-slate-200 p-5 flex flex-col gap-3 ${c.bg} ${onClick ? 'cursor-pointer hover:shadow-md transition-shadow' : ''}`}
      onClick={onClick}
    >
      <div className="flex items-center justify-between">
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${c.icon}`}>
          <Icon size={18} className="text-white" />
        </div>
        {onClick && <ArrowRight size={14} className="text-slate-300" />}
      </div>
      <div>
        <div className={`text-2xl font-bold leading-none mb-1 ${c.val}`}>{value}</div>
        <div className="text-sm font-medium text-slate-600">{label}</div>
        {sub && <div className="text-xs text-slate-400 mt-0.5">{sub}</div>}
      </div>
    </div>
  );
}

// ── Monats-Balkendiagramm ──────────────────────────────────────────────────────

function MonatsChart({ monate }) {
  const maxTotal = Math.max(...monate.map(m => m.total), 1);
  return (
    <div className="space-y-2.5">
      {monate.map(m => (
        <div key={m.label} className="flex items-center gap-3">
          <span className="text-xs text-slate-400 w-8 shrink-0 text-right">{m.label}</span>
          <div className="flex-1 bg-slate-100 rounded-full h-2 overflow-hidden">
            <div
              className="bg-indigo-400 h-2 rounded-full transition-all duration-700"
              style={{ width: m.total > 0 ? `${Math.max((m.total / maxTotal) * 100, 2)}%` : '0%' }}
            />
          </div>
          <span className="text-xs text-slate-500 w-24 text-right font-medium tabular-nums">
            {m.total > 0 ? `${formatBetrag(m.total)} €` : '—'}
          </span>
          {m.anzahl > 0 && (
            <span className="text-xs text-slate-300 w-8 text-right">{m.anzahl}×</span>
          )}
        </div>
      ))}
    </div>
  );
}

// ── Handlungsbedarf-Zeile ─────────────────────────────────────────────────────

function AktionZeile({ icon: Icon, prio, titel, info, onClick }) {
  const farben = {
    hoch:   'text-red-500 bg-red-50 border-red-100',
    mittel: 'text-amber-500 bg-amber-50 border-amber-100',
  };
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-start gap-3 px-4 py-3 rounded-xl border text-left hover:brightness-95 transition-all ${farben[prio]}`}
    >
      <Icon size={15} className="mt-0.5 shrink-0" />
      <div className="min-w-0">
        <div className="text-sm font-semibold text-slate-800 truncate">{titel}</div>
        <div className="text-xs text-slate-500 mt-0.5">{info}</div>
      </div>
      <ArrowRight size={13} className="ml-auto mt-1 shrink-0 text-slate-300" />
    </button>
  );
}

// ── Dashboard ─────────────────────────────────────────────────────────────────

export default function Dashboard({ navigate, angebote = [] }) {

  // ── KPI-Werte ──
  const stats = useMemo(() => {
    const bezahlt  = angebote.filter(a => a.status === 'bezahlt');
    const gemahnt  = angebote.filter(a => a.status === 'gemahnt');
    const offeneR  = angebote.filter(a => a.rechnungsNr && a.status !== 'bezahlt');
    const angenommen = angebote.filter(istAngenommen);
    const abgelehnt  = angebote.filter(a => a.status === 'abgelehnt');
    const entschieden = angenommen.length + abgelehnt.length;

    return {
      bezahltSum: bezahlt.reduce((s, a) => s + (a.brutto || 0), 0),
      bezahltAnz: bezahlt.length,
      offenSum:   offeneR.reduce((s, a) => s + (a.brutto || 0), 0),
      offenAnz:   offeneR.length,
      mahnAnz:    gemahnt.length,
      quote:      entschieden > 0 ? Math.round((angenommen.length / entschieden) * 100) : 0,
      angenommenAnz: angenommen.length,
      entschieden,
    };
  }, [angebote]);

  // ── Monatsübersicht (letzte 6 Monate) ──
  const monate = useMemo(() => {
    const now = new Date();
    return Array.from({ length: 6 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
      const label = d.toLocaleDateString('de-DE', { month: 'short' });
      const items = angebote.filter(a => {
        if (!a.savedAt) return false;
        const s = new Date(a.savedAt);
        return s.getFullYear() === d.getFullYear() && s.getMonth() === d.getMonth();
      });
      return { label, total: items.reduce((s, a) => s + (a.brutto || 0), 0), anzahl: items.length };
    });
  }, [angebote]);

  // ── Handlungsbedarf ──
  const handlung = useMemo(() => {
    const liste = [];

    angebote
      .filter(a => a.status === 'gemahnt')
      .forEach(a => liste.push({
        id:    a.id,
        prio:  'hoch',
        icon:  AlertTriangle,
        titel: `${a.rechnungsNr || a.angebotNr} — ${a.kundeDisplay || '—'}`,
        info:  `Mahnstufe ${a.mahnStufe || '—'} · ${formatBetrag(a.brutto)} €`,
      }));

    angebote
      .filter(a => a.rechnungsNr && a.status === 'angenommen' && a.rechnungsDatum)
      .forEach(a => {
        const tage = tageSeit(a.rechnungsDatum);
        if (tage !== null && tage > 14) {
          liste.push({
            id:    a.id,
            prio:  tage > 30 ? 'hoch' : 'mittel',
            icon:  Clock,
            titel: `${a.rechnungsNr} — ${a.kundeDisplay || '—'}`,
            info:  `Rechnung seit ${tage} Tagen unbezahlt · ${formatBetrag(a.brutto)} €`,
          });
        }
      });

    // Gesendete Angebote, die in den nächsten 3 Tagen ablaufen – rechtzeitig nachfassen
    angebote
      .filter(a => a.status === 'gesendet')
      .forEach(a => {
        const seit = tageSeit(a.gueltigBis);
        if (seit === null) return;
        const bis = -seit;
        if (bis < 0 || bis > 3) return;
        const wann = bis === 0 ? 'läuft heute ab' : bis === 1 ? 'läuft morgen ab' : `läuft in ${bis} Tagen ab`;
        liste.push({
          id:    a.id,
          prio:  'mittel',
          icon:  Hourglass,
          titel: `${a.angebotNr} — ${a.kundeDisplay || '—'}`,
          info:  `${wann} · nachfassen? · ${formatBetrag(a.brutto)} €`,
        });
      });

    return liste.sort((a, b) => (a.prio === 'hoch' && b.prio !== 'hoch' ? -1 : 1));
  }, [angebote]);

  // ── Letzte Aktivitäten: zuletzt geänderte zuerst ──
  const zuletztGeaendert = a => a.updatedAt || a.savedAt || '';
  const letzte = [...angebote]
    .sort((a, b) => zuletztGeaendert(b).localeCompare(zuletztGeaendert(a)))
    .slice(0, 8);

  const heute = new Date().toLocaleDateString('de-DE', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });

  return (
    <div className="min-h-full bg-gradient-to-br from-slate-50 to-indigo-50/20">

      {/* Topbar */}
      <div className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-sm">
        <div className="px-8 h-14 flex items-center justify-between">
          <div>
            <span className="text-base font-bold text-slate-800">Dashboard</span>
            <span className="text-xs text-slate-400 ml-3">{heute}</span>
          </div>
          <button
            onClick={() => navigate('angebot-editor')}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-semibold rounded-xl hover:bg-indigo-700 transition-colors shadow-sm shadow-indigo-200"
          >
            <Plus size={15} />
            Neues Angebot
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-8 py-6 flex flex-col gap-6">

        {/* ── KPI-Kacheln ── */}
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
          <KpiCard
            label="Bezahlter Umsatz"
            value={`${formatBetrag(stats.bezahltSum)} €`}
            sub={`${stats.bezahltAnz} Rechnung${stats.bezahltAnz !== 1 ? 'en' : ''} bezahlt`}
            icon={Banknote}
            accent="teal"
            onClick={() => navigate('rechnungen', { tab: 'bezahlt' })}
          />
          <KpiCard
            label="Offene Rechnungen"
            value={`${formatBetrag(stats.offenSum)} €`}
            sub={`${stats.offenAnz} ausstehend`}
            icon={Receipt}
            accent="amber"
            onClick={() => navigate('rechnungen', { tab: 'angenommen' })}
          />
          <KpiCard
            label="Mahnungen"
            value={stats.mahnAnz}
            sub={stats.mahnAnz > 0 ? 'Sofort handeln' : 'Alles im grünen Bereich'}
            icon={AlertTriangle}
            accent={stats.mahnAnz > 0 ? 'red' : 'indigo'}
            onClick={() => navigate('rechnungen', { tab: 'gemahnt' })}
          />
          <KpiCard
            label="Erfolgsquote"
            value={`${stats.quote} %`}
            sub={`${stats.angenommenAnz} von ${stats.entschieden} entschiedenen Angeboten`}
            icon={TrendingUp}
            accent="indigo"
            onClick={() => navigate('angebote')}
          />
        </div>

        {/* ── Mittlere Zeile ── */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-6">

          {/* Handlungsbedarf */}
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <h2 className="font-semibold text-slate-800 text-sm">Handlungsbedarf</h2>
              {handlung.length > 0 && (
                <span className="text-xs font-semibold text-red-500 bg-red-50 px-2 py-0.5 rounded-full">
                  {handlung.length} offen
                </span>
              )}
            </div>
            <div className="p-4">
              {handlung.length === 0 ? (
                <div className="flex items-center gap-3 text-emerald-600 bg-emerald-50 border border-emerald-100 rounded-xl px-4 py-3">
                  <CheckCircle2 size={16} className="shrink-0" />
                  <div>
                    <div className="text-sm font-semibold">Alles in Ordnung</div>
                    <div className="text-xs text-emerald-600/70 mt-0.5">Keine überfälligen Rechnungen oder Mahnungen</div>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  {handlung.map((item, i) => (
                    <AktionZeile
                      key={i}
                      icon={item.icon}
                      prio={item.prio}
                      titel={item.titel}
                      info={item.info}
                      onClick={() => navigate('angebot-editor', { angebotId: item.id })}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Monatsübersicht */}
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100">
              <h2 className="font-semibold text-slate-800 text-sm">Monatsübersicht</h2>
              <p className="text-xs text-slate-400 mt-0.5">Angebotsvolumen der letzten 6 Monate</p>
            </div>
            <div className="p-5">
              <MonatsChart monate={monate} />
            </div>
          </div>
        </div>

        {/* ── Letzte Aktivitäten ── */}
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
            <h2 className="font-semibold text-slate-800 text-sm">Letzte Aktivitäten</h2>
            <button
              onClick={() => navigate('angebote')}
              className="flex items-center gap-1 text-sm text-indigo-600 hover:text-indigo-700 font-medium transition-colors"
            >
              Alle anzeigen <ArrowRight size={13} />
            </button>
          </div>

          {letzte.length === 0 ? (
            <div className="text-center py-14 text-slate-400">
              <FileText size={36} className="mx-auto mb-3 opacity-20" />
              <p className="font-medium text-slate-500 mb-2">Noch keine Angebote gespeichert</p>
              <button onClick={() => navigate('angebot-editor')} className="text-sm text-indigo-600 hover:underline">
                Erstes Angebot erstellen
              </button>
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50">
                  {['Nummer', 'Kunde', 'Betreff', 'Geändert', 'Betrag', 'Status'].map((h, i) => (
                    <th
                      key={h}
                      className={`px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide ${i === 4 ? 'text-right' : 'text-left'}`}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {letzte.map(a => (
                  <tr
                    key={a.id}
                    onClick={() => navigate('angebot-editor', { angebotId: a.id })}
                    className="hover:bg-slate-50/80 cursor-pointer transition-colors"
                  >
                    <td className="px-5 py-3.5">
                      <div className="flex flex-col">
                        <span className="text-sm font-semibold text-indigo-600">{a.angebotNr}</span>
                        {a.rechnungsNr && (
                          <span className="text-xs text-slate-400">{a.rechnungsNr}</span>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-sm text-slate-700 whitespace-nowrap">{a.kundeDisplay || '—'}</td>
                    <td className="px-5 py-3.5 text-sm text-slate-500 w-full max-w-0 truncate" title={a.betreff || undefined}>
                      {a.betreff || <span className="italic text-slate-300">Kein Betreff</span>}
                    </td>
                    <td className="px-5 py-3.5 text-sm text-slate-400 whitespace-nowrap">
                      {zuletztGeaendert(a)
                        ? new Date(zuletztGeaendert(a)).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' })
                        : '—'}
                    </td>
                    <td className="px-5 py-3.5 text-sm font-semibold text-slate-800 text-right tabular-nums">
                      {formatBetrag(a.brutto)} €
                    </td>
                    <td className="px-5 py-3.5">
                      <StatusBadge status={a.status || 'entwurf'} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

      </div>
    </div>
  );
}
