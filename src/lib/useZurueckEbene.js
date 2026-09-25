import { useEffect, useRef } from 'react';

/**
 * Lässt die Zurück-Taste eine offene Ebene (Menü, Detailansicht) schließen, statt die Ansicht zu verlassen.
 * @param {((schliessen: () => void) => () => void) | undefined} registriereEbene aus der App
 * @param {boolean} offen
 * @param {() => void} schliessen
 */
export default function useZurueckEbene(registriereEbene, offen, schliessen) {
  const schliessenRef = useRef(schliessen);
  useEffect(() => { schliessenRef.current = schliessen; });
  useEffect(() => {
    if (!offen || !registriereEbene) return;
    return registriereEbene(() => schliessenRef.current());
  }, [offen, registriereEbene]);
}
