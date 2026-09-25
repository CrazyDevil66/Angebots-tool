/**
 * Verbindet die App-Navigation mit dem Browserverlauf, damit die Zurück-Taste (Android, Browser)
 * erst offene Ebenen wie Menü oder Kundendetail schließt und dann zur vorherigen Ansicht geht.
 *
 * Jede offene Ebene hat einen eigenen Verlaufseintrag. Schließt der Benutzer sie per Klick,
 * wird der Eintrag mit history.back() wieder entfernt; das dabei ausgelöste popstate wird übersprungen.
 * Weil back() asynchron ist, warten neue Einträge, bis dieses popstate angekommen ist.
 *
 * @param {object} optionen
 * @param {Pick<History, 'pushState'|'replaceState'|'go'>} optionen.history
 * @param {(nav: { view: string, params: object }) => boolean} optionen.onNavigation
 *   Wechselt zur Ansicht aus dem Verlauf; `false`, wenn der Wechsel abgelehnt wurde.
 */
export function erstelleVerlauf({ history, onNavigation }) {
  const ebenen = [];
  const wartend = [];
  let ausstehendeRuecksprunge = 0;
  let aktuell = null;

  function eintragen(state) {
    if (ausstehendeRuecksprunge > 0) wartend.push(state);
    else history.pushState(state, '');
  }

  function zurueck(schritte) {
    ausstehendeRuecksprunge++;
    history.go(-schritte);
  }

  // Einträge offener Ebenen verwaisen beim Ansichtswechsel und werden vorher entfernt.
  function ebenenEintraegeEntfernen() {
    const offen = ebenen.filter(e => !e.eintragWeg);
    offen.forEach(e => { e.eintragWeg = true; });
    if (offen.length > 0) zurueck(offen.length);
  }

  return {
    start(nav) {
      aktuell = nav;
      history.replaceState({ nav }, '');
    },

    navigiert(nav) {
      if (aktuell && aktuell.view === nav.view && JSON.stringify(aktuell.params) === JSON.stringify(nav.params)) return;
      ebenenEintraegeEntfernen();
      aktuell = nav;
      eintragen({ nav });
    },

    /**
     * Meldet eine geöffnete Ebene an. Die Rückgabe meldet sie wieder ab, sobald sie geschlossen ist.
     * @param {() => (boolean|void)} schliessen Wird von der Zurück-Taste aufgerufen; `false` heißt,
     *   die Ebene bleibt offen (Nachfrage abgelehnt oder nur eine Stufe zurück) und behält ihren Eintrag.
     */
    ebeneOeffnen(schliessen) {
      const ebene = { schliessen, eintragWeg: false };
      ebenen.push(ebene);
      eintragen({ nav: aktuell, ebene: true });
      return () => {
        const i = ebenen.indexOf(ebene);
        if (i >= 0) ebenen.splice(i, 1);
        if (ebene.eintragWeg) return;
        ebene.eintragWeg = true;
        zurueck(1);
      };
    },

    beiPopstate(event) {
      if (ausstehendeRuecksprunge > 0) {
        ausstehendeRuecksprunge--;
        if (ausstehendeRuecksprunge === 0) wartend.splice(0).forEach(state => history.pushState(state, ''));
        return;
      }
      const ebene = ebenen.at(-1);
      if (ebene) {
        ebene.eintragWeg = true;
        if (ebene.schliessen() === false) {
          ebene.eintragWeg = false;
          history.pushState({ nav: aktuell, ebene: true }, '');
        } else {
          const i = ebenen.indexOf(ebene);
          if (i >= 0) ebenen.splice(i, 1);
        }
        return;
      }
      const ziel = event.state?.nav;
      if (!ziel) return;
      if (onNavigation(ziel)) aktuell = ziel;
      else history.pushState({ nav: aktuell }, '');
    },
  };
}
