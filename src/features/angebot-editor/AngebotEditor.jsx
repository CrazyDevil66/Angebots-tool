import { useEffect, useRef, useState } from 'react';
import PreviewPanel from './PreviewPanel';
import RechnungModal from './RechnungModal';
import MahnungModal from './MahnungModal';
import KatalogPicker from './KatalogPicker';
import EditorTopbar from './EditorTopbar';
import AngebotInfos from './abschnitte/AngebotInfos';
import FirmendatenInfo from './abschnitte/FirmendatenInfo';
import KundenDaten from './abschnitte/KundenDaten';
import Anschreiben from './abschnitte/Anschreiben';
import Positionen from './abschnitte/Positionen';
import Hinweise from './abschnitte/Hinweise';
import useAngebotDaten from './useAngebotDaten';
import useAngebotAktionen from './useAngebotAktionen';

export default function AngebotEditor({
  navigate, params = {}, firma, kunden = [], angebote = [], setAngebote, katalog = [], token, registriereWaechter,
}) {
  const formular = useAngebotDaten({ params, firma, angebote, token });
  const { data, meta, set } = formular;
  const aktionen = useAngebotAktionen({ token, setAngebote, ...formular });

  // Vor dem Verlassen mit ungespeicherten Änderungen nachfragen – in der App und beim Schließen des Tabs
  const ungespeichertRef = useRef(false);
  useEffect(() => { ungespeichertRef.current = formular.ungespeichert; });
  useEffect(() => registriereWaechter?.(() =>
    !ungespeichertRef.current || confirm('Es gibt ungespeicherte Änderungen. Trotzdem verlassen?'),
  ), [registriereWaechter]);
  useEffect(() => {
    if (!formular.ungespeichert) return;
    const warnen = e => { e.preventDefault(); e.returnValue = ''; };
    window.addEventListener('beforeunload', warnen);
    return () => window.removeEventListener('beforeunload', warnen);
  }, [formular.ungespeichert]);

  const [rechnungModalOffen, setRechnungModalOffen] = useState(false);
  const [mahnModalOffen, setMahnModalOffen] = useState(false);
  const [katalogPickerOffen, setKatalogPickerOffen] = useState(false);

  function handleReset() {
    if (confirm('Eingaben zurücksetzen?')) formular.zuruecksetzen();
  }

  function rechnungModalSchliessen() {
    setRechnungModalOffen(false);
    aktionen.setRechnungFehler(null);
  }

  if (formular.loading) {
    return (
      <div className="min-h-full flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-full bg-gradient-to-br from-slate-50 to-indigo-50/20">
      {aktionen.saveError && (
        <div className="sticky top-0 z-50 bg-red-500 text-white text-sm font-medium px-8 py-2 flex items-center justify-between">
          <span>Fehler beim Speichern: {aktionen.saveError}</span>
          <button onClick={() => aktionen.setSaveError(null)} className="ml-4 hover:opacity-70">✕</button>
        </div>
      )}
      {aktionen.hinweis && (
        <div className="sticky top-0 z-50 bg-amber-500 text-white text-sm font-medium px-8 py-2 flex items-center justify-between">
          <span>{aktionen.hinweis}</span>
          <button onClick={() => aktionen.setHinweis(null)} className="ml-4 hover:opacity-70">✕</button>
        </div>
      )}

      <EditorTopbar
        titel={data.angebotNr || 'Neues Angebot'}
        meta={meta}
        isNeu={!formular.aktivesId}
        kundeEmail={data.kunde.email}
        pdfLoading={aktionen.pdfLoading}
        savedHint={aktionen.savedHint}
        ungespeichert={formular.ungespeichert}
        onZurueck={() => navigate('angebote')}
        onStatusChange={aktionen.statusAendern}
        onReset={handleReset}
        onSpeichern={aktionen.speichern}
        onAngebotPDF={aktionen.angebotPDF}
        onMail={aktionen.perMailSenden}
        onRechnungErstellen={() => setRechnungModalOffen(true)}
        onRechnungPDF={aktionen.rechnungPDF}
        onMahnung={() => setMahnModalOffen(true)}
        onBezahlt={aktionen.alsBezahltMarkieren}
      />

      <div className="max-w-7xl mx-auto px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(360px,42%)] gap-6">
          <div className="flex flex-col gap-5">
            <AngebotInfos data={data} set={set} setDatum={formular.setDatum} />
            <FirmendatenInfo firma={data.firma} onEinstellungen={() => navigate('einstellungen')} />
            <KundenDaten
              kunde={data.kunde}
              kunden={kunden}
              set={set}
              setAnrede={formular.setAnrede}
              setKundeName={formular.setKundeName}
              onKundeWaehlen={formular.kundeUebernehmen}
              onLeeren={formular.kundeLeeren}
              onKundenVerwalten={() => navigate('kunden')}
            />
            <Anschreiben data={data} set={set} />
            <Positionen
              positionen={data.positionen}
              onChange={formular.setPositionen}
              onAusKatalog={() => setKatalogPickerOffen(true)}
            />
            <Hinweise hinweise={data.hinweise} set={set} />
          </div>

          <div><PreviewPanel data={data} /></div>
        </div>
      </div>

      {rechnungModalOffen && (
        <RechnungModal
          data={data}
          angebote={angebote}
          fehler={aktionen.rechnungFehler}
          onConfirm={werte => aktionen.rechnungErstellen(werte, () => setRechnungModalOffen(false))}
          onClose={rechnungModalSchliessen}
        />
      )}

      {katalogPickerOffen && (
        <KatalogPicker
          katalog={katalog}
          onAdd={formular.positionenAusKatalog}
          onClose={() => setKatalogPickerOffen(false)}
        />
      )}

      {mahnModalOffen && (
        <MahnungModal
          data={{ ...data, rechnungsNr: meta.rechnungsNr, rechnungsDatum: meta.rechnungsDatum }}
          mahnStufeAktuell={meta.mahnStufe}
          vorherigeGebuehren={meta.mahnGebuehren}
          onConfirm={werte => { setMahnModalOffen(false); aktionen.mahnungErstellen(werte); }}
          onClose={() => setMahnModalOffen(false)}
        />
      )}
    </div>
  );
}
