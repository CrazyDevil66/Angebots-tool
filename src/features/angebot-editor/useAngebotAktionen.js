import { useState, useRef } from 'react';
import {
  saveAngebot, updateAngebot, setAngebotStatus,
  setAngebotRechnung, setMahnung, setBezahlt,
} from '../../api/angebote';
import { generatePDF } from '../../pdf/generatePDF';
import { rechnungsDokument } from '../../utils/angebote';
import { mailEntwurfLink } from './mailEntwurf';

// Server-Aktionen und PDF-Erzeugung des Editors.
export default function useAngebotAktionen({ token, data, meta, setMeta, aktivesId, setAktivesId, setAngebote }) {
  const [pdfLoading, setPdfLoading] = useState(false);
  const [savedHint, setSavedHint] = useState(false);
  const [saveError, setSaveError] = useState(null);
  const [rechnungFehler, setRechnungFehler] = useState(null);
  const savedTimer = useRef(null);

  // Legt das Angebot beim ersten Bedarf an und liefert dessen ID.
  async function sicherGespeichert() {
    if (aktivesId) return aktivesId;
    const { eintrag, updated } = await saveAngebot(token, data);
    setAktivesId(eintrag.id);
    setAngebote(updated);
    return eintrag.id;
  }

  async function pdfErzeugen(...args) {
    setPdfLoading(true);
    try { await generatePDF(...args); }
    catch (e) { console.error(e); }
    finally { setPdfLoading(false); }
  }

  async function speichern() {
    setSaveError(null);
    try {
      if (aktivesId) {
        setAngebote(await updateAngebot(token, aktivesId, data, meta.status));
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
    setMeta(m => ({ ...m, status: neuerStatus }));
    if (aktivesId) {
      setAngebote(await setAngebotStatus(token, aktivesId, neuerStatus));
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
    try {
      const id = await sicherGespeichert();
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
    await pdfErzeugen(rechnungsDokument(data, neueMeta), 'rechnung');
  }

  async function mahnungErstellen({ stufe, mahnungNr, datum, frist, mahngebuehr, text }) {
    // Mahngebühren früherer Stufen (für PDF-Ausweis)
    const vorherigeGebuehren = meta.mahnGebuehren.filter(g => g.stufe < stufe && g.betrag > 0);

    // Aktuellen Eintrag in den Verlauf aufnehmen (Stufe ggf. ersetzen)
    const neueGebuehren = [
      ...meta.mahnGebuehren.filter(g => g.stufe !== stufe),
      { stufe, betrag: Number(mahngebuehr || 0) },
    ];
    setMeta(m => ({ ...m, status: 'gemahnt', mahnStufe: stufe, mahnGebuehren: neueGebuehren }));

    const id = await sicherGespeichert();
    setAngebote(await setMahnung(token, id, stufe, mahnungNr, datum, neueGebuehren));

    const mahnungData = { stufe, mahnungNr, datum, frist, mahngebuehr, text, vorherigeGebuehren };
    await pdfErzeugen({ ...data, rechnungsNr: meta.rechnungsNr, rechnungsDatum: meta.rechnungsDatum }, 'mahnung', mahnungData);
  }

  async function alsBezahltMarkieren() {
    if (!confirm('Angebot/Rechnung als bezahlt markieren?')) return;
    setMeta(m => ({ ...m, status: 'bezahlt' }));
    if (aktivesId) {
      setAngebote(await setBezahlt(token, aktivesId));
    }
  }

  return {
    pdfLoading, savedHint, saveError, setSaveError, rechnungFehler, setRechnungFehler,
    speichern, statusAendern, angebotPDF, rechnungPDF, perMailSenden,
    rechnungErstellen, mahnungErstellen, alsBezahltMarkieren,
  };
}
