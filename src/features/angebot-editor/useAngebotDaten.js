import { useState, useCallback, useEffect } from 'react';
import { defaultData } from '../../lib/defaultData';
import { loadAngebotFull } from '../../api/angebote';
import { add14Days } from '../../utils/datum';
import { einleitungMitAnrede } from '../../utils/anrede';
import { initData, metaAus, kundeAusAdressbuch } from './initData';

function einleitungsVorlage(firma) {
  return firma.einleitungAngebot ?? defaultData.firma.einleitungAngebot;
}

// Formularzustand des Editors: Angebotsdaten (Snapshot) und Rechnungs-/Mahnungs-Metadaten.
export default function useAngebotDaten({ params, firma, angebote, token }) {
  const gespeichert = params?.angebotId ? angebote.find(a => a.id === params.angebotId) : null;

  const [loading, setLoading] = useState(!!params?.angebotId);
  const [data, setData] = useState(() => initData(params, firma, angebote));
  const [meta, setMeta] = useState(() => metaAus(gespeichert));
  const [aktivesId, setAktivesId] = useState(params?.angebotId || null);

  useEffect(() => {
    if (!params?.angebotId) return;
    loadAngebotFull(token, params.angebotId)
      .then(full => {
        setData({ ...full.snapshot, firma: firma || defaultData.firma });
        setMeta(metaAus(full));
        setLoading(false);
      })
      .catch(() => setLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps -- nur beim Öffnen laden
  }, []);

  const set = useCallback((path, value) => {
    setData(prev => {
      const parts = path.split('.');
      if (parts.length === 1) return { ...prev, [path]: value };
      if (parts.length === 2) return { ...prev, [parts[0]]: { ...prev[parts[0]], [parts[1]]: value } };
      return prev;
    });
  }, []);

  function setDatum(val) {
    setData(prev => ({ ...prev, datum: val, gueltigBis: add14Days(val) }));
  }

  function setAnrede(anrede) {
    setData(prev => ({
      ...prev,
      kunde: { ...prev.kunde, anrede },
      einleitung: einleitungMitAnrede(anrede, prev.kunde.name, einleitungsVorlage(prev.firma)),
    }));
  }

  function setKundeName(name) {
    setData(prev => ({
      ...prev,
      kunde: { ...prev.kunde, name },
      einleitung: einleitungMitAnrede(prev.kunde.anrede, name, einleitungsVorlage(prev.firma)),
    }));
  }

  function kundeUebernehmen(k) {
    setData(prev => {
      const kunde = kundeAusAdressbuch(k);
      return {
        ...prev,
        kunde,
        einleitung: einleitungMitAnrede(kunde.anrede, kunde.name, einleitungsVorlage(prev.firma)),
      };
    });
  }

  function kundeLeeren() {
    setData(prev => ({ ...prev, kunde: defaultData.kunde }));
  }

  function setPositionen(positionen) {
    setData(d => ({ ...d, positionen }));
  }

  function positionenAusKatalog(neuePositionen) {
    setData(d => ({
      ...d,
      positionen: [
        ...d.positionen.filter(p => p.bezeichnung || p.einzelpreis),
        ...neuePositionen,
      ],
    }));
  }

  function zuruecksetzen() {
    setData({ ...defaultData, firma: firma || defaultData.firma });
    setAktivesId(null);
    setMeta(m => ({ ...m, status: 'entwurf' }));
  }

  return {
    loading, data, meta, setMeta, aktivesId, setAktivesId,
    set, setDatum, setAnrede, setKundeName, kundeUebernehmen, kundeLeeren,
    setPositionen, positionenAusKatalog, zuruecksetzen,
  };
}
