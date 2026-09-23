import { useState, useRef } from 'react';
import {
  saveAngebot, updateAngebot, setAngebotStatus,
  setAngebotRechnung, setMahnung, setBezahlt,
} from '../../api/angebote';
import { generatePDF } from '../../pdf/ladePDF';
import { rechnungsDokument } from '../../utils/angebote';
import { mailEntwurfLink } from './mailEntwurf';

// Server-Aktionen und PDF-Erzeugung des Editors.
export default function useAngebotAktionen({
  token, data, set, meta, setMeta, aktivesId, setAktivesId, setAngebote, alsGespeichertMarkieren,
}) {
  const [pdfLoading, setPdfLoading] = useState(false);
  const [savedHint, setSavedHint] = useState(false);
  const [saveError, setSaveError] = useState(null);
  const [rechnungFehler, setRechnungFehler] = useState(null);
  const [hinweis, setHinweis] = useState(null);
  const savedTimer = useRef(null);

  // Legt das Angebot beim ersten Bedarf an und liefert dessen ID sowie die Daten mit der
  // tatsächlich vergebenen Nummer – der Server ersetzt eine inzwischen vergebene Nummer.
  async function sicherGespeichert() {
    if (aktivesId) return { id: aktivesId, dokument: data };
    const { eintrag, updated } = await saveAngebot(token, data);
    setAktivesId(eintrag.id);
    setAngebote(updated);
    if (eintrag.angebotNr === data.angebotNr) {
      alsGespeichertMarkieren(data);
      return { id: eintrag.id, dokument: data };
    }
    const dokument = { ...data, angebotNr: eintrag.angebotNr };
    set('angebotNr', eintrag.angebotNr);
    alsGespeichertMarkieren(dokument);
    setHinweis(`Die Angebotsnummer ${data.angebotNr || '(leer)'} war bereits vergeben – das Angebot wurde als ${eintrag.angebotNr} gespeichert.`);
    return { id: eintrag.id, dokument };
  }

  async function pdfErzeugen(...args) {
    setPdfLoading(true);
    try { await generatePDF(...args); }
    catch (e) {
      console.error(e);
      alert(`PDF konnte nicht erstellt werden: ${e.message}`);
    }
    finally { setPdfLoading(false); }
  }

  async function speichern() {
    setSaveError(null);
    try {
      if (aktivesId) {
        setAngebote(await updateAngebot(token, aktivesId, data, meta.status));
        alsGespeichertMarkieren(data);
      } else {
        await sicherGespeichert();
      }
      setSavedHint(true);
      clearTimeout(savedTimer.current);
      savedTimer.current = setTimeout(() => setSavedHint(false), 2500);
    } catch (e) {
      setSaveError(e.message || 'Speichern fehlgeschlagen');
    }
  }

  async function statusAendern(neuerStatus) {
    const alterStatus = meta.status;
    setMeta(m => ({ ...m, status: neuerStatus }));
    if (!aktivesId) return;
    try {
      setAngebote(await setAngebotStatus(token, aktivesId, neuerStatus));
    } catch (e) {
      setMeta(m => ({ ...m, status: alterStatus }));
      setSaveError(e.message);
    }
  }

  function angebotPDF() {
    return pdfErzeugen(data, 'angebot');
  }

  function rechnungPDF() {
    return pdfErzeugen(rechnungsDokument(data, meta), 'rechnung');
  }

  function perMailSenden() {
    window.location.href = mailEntwurfLink(data);
  }

  // beiErfolg wird aufgerufen, sobald die Rechnung gespeichert ist – vor der PDF-Erzeugung.
  async function rechnungErstellen({ rechnungsNr, datum, betreff, einleitung, hinweise }, beiErfolg) {
    setRechnungFehler(null);
    let dokument;
    try {
      const gespeichert = await sicherGespeichert();
      const id = gespeichert.id;
      dokument = gespeichert.dokument;
      await setAngebotStatus(token, id, 'angenommen');
      setMeta(m => ({ ...m, status: 'angenommen' }));
      setAngebote(await setAngebotRechnung(token, id, rechnungsNr, datum, betreff, einleitung, hinweise));
    } catch (e) {
      setRechnungFehler(e.message);
      return;
    }
    beiErfolg();

    const neueMeta = {
      ...meta,
      status: 'angenommen',
      rechnungsNr,
      rechnungsDatum: datum,
      rechnungsBetreff: betreff,
      rechnungsEinleitung: einleitung,
      rechnungsHinweise: hinweise,
    };
    setMeta(neueMeta);
    await pdfErzeugen(rechnungsDokument(dokument, neueMeta), 'rechnung');
  }

  async function mahnungErstellen({ stufe, mahnungNr, datum, frist, mahngebuehr, text }) {
    // Mahngebühren früherer Stufen (für PDF-Ausweis)
    const vorherigeGebuehren = meta.mahnGebuehren.filter(g => g.stufe < stufe && g.betrag > 0);

    // Aktuellen Eintrag in den Verlauf aufnehmen (Stufe ggf. ersetzen)
    const neueGebuehren = [
      ...meta.mahnGebuehren.filter(g => g.stufe !== stufe),
      { stufe, betrag: Number(mahngebuehr || 0) },
    ];
    let dokument;
    try {
      const gespeichert = await sicherGespeichert();
      dokument = gespeichert.dokument;
      setAngebote(await setMahnung(token, gespeichert.id, stufe, mahnungNr, datum, neueGebuehren));
    } catch (e) {
      setSaveError(e.message);
      return;
    }
    setMeta(m => ({ ...m, status: 'gemahnt', mahnStufe: stufe, mahnGebuehren: neueGebuehren }));

    const mahnungData = { stufe, mahnungNr, datum, frist, mahngebuehr, text, vorherigeGebuehren };
    await pdfErzeugen({ ...dokument, rechnungsNr: meta.rechnungsNr, rechnungsDatum: meta.rechnungsDatum }, 'mahnung', mahnungData);
  }

  async function alsBezahltMarkieren() {
    if (!confirm('Angebot/Rechnung als bezahlt markieren?')) return;
    const alterStatus = meta.status;
    setMeta(m => ({ ...m, status: 'bezahlt' }));
    if (!aktivesId) return;
    try {
      setAngebote(await setBezahlt(token, aktivesId));
    } catch (e) {
      setMeta(m => ({ ...m, status: alterStatus }));
      setSaveError(e.message);
    }
  }

  return {
    pdfLoading, savedHint, saveError, setSaveError, rechnungFehler, setRechnungFehler, hinweis, setHinweis,
    speichern, statusAendern, angebotPDF, rechnungPDF, perMailSenden,
    rechnungErstellen, mahnungErstellen, alsBezahltMarkieren,
  };
}
