# AngebotsTool

Eine selbst gehostete Web-App zum Erstellen und Verwalten von Angeboten – optimiert für den Einsatz auf Unraid-Servern.

## Features

- **Angebote erstellen** – Positionen, Preise, Kundeninfos und PDF-Export
- **Kundenverwaltung** – Kunden anlegen und verwalten
- **Dashboard** – Übersicht über alle Angebote und Aktivitäten
- **Benutzerverwaltung** – Mehrere Benutzer mit Rollen (Admin / Benutzer)
- **Einladungssystem** – Neue Benutzer per E-Mail einladen
- **SMTP-Konfiguration** – E-Mail-Versand direkt aus der App konfigurierbar
- **Authentifizierung** – JWT-basierter Login mit Brute-Force-Schutz
- **Echtzeit-Sync** – Änderungen werden live auf allen geöffneten Tabs aktualisiert

## Installation auf Unraid

### Docker Hub

Das Image ist verfügbar unter:

```
crazydevil35/angebotstool:latest
```

### Über Community Applications

Nach der Installation des CA-Plugins einfach nach **AngebotsTool** suchen und installieren. Alle Pfade und Ports sind vorausgefüllt.

### Manuelle Docker-Installation

```bash
docker run -d \
  --name AngebotsTool \
  -p 3000:3000 \
  -v /mnt/user/appdata/angebots-tool:/app/data \
  -e BASE_URL=http://deine-ip:3000 \
  --restart unless-stopped \
  crazydevil35/angebotstool:latest
```

## Umgebungsvariablen

| Variable | Beschreibung | Standard |
|---|---|---|
| `PORT` | Interner Port des Servers | `3000` |
| `JWT_SECRET` | Geheimer Schlüssel für JWT-Token. Wird automatisch generiert wenn leer. | *(automatisch)* |
| `BASE_URL` | Externe URL der App, z.B. `https://angebote.meinserver.de` | *(optional)* |

## Datenspeicherung

Alle Daten werden im Container-Pfad `/app/data` gespeichert:

- `users.json` – Benutzerdaten
- `config.json` – App-Konfiguration, SMTP-Einstellungen und JWT-Secret
- `firma.json`, `kunden.json`, `katalog.json` – Stammdaten
- `angebote/` – ein JSON pro Angebot plus `index.json`
- `backups/` – automatische Sicherung des alten Stands vor jedem Backup-Import

Über **Einstellungen → Datensicherung** (nur Admins) lassen sich alle Daten als JSON exportieren und wieder importieren. Ein Import ersetzt den kompletten Datenbestand.

Der Host-Pfad `/mnt/user/appdata/angebots-tool` (oder ein beliebiger anderer Pfad) muss als Volume eingebunden werden, damit die Daten bei Container-Updates erhalten bleiben.

## Erster Start

Beim ersten Aufruf der App wird ein **Erstkonfigurations-Assistent** gestartet, in dem der erste Admin-Account angelegt wird.

## Technik

- **Frontend:** React 19, Vite, Tailwind CSS
- **Backend:** Node.js, Express
- **Auth:** JWT mit automatisch generiertem Secret
- **PDF:** @react-pdf/renderer
- **Container:** Docker (Node.js 22 Alpine)

## Projektstruktur

```
shared/     Preisberechnung und Nummernvergabe – von Server und Frontend genutzt
server/     index.js (Start), routes/, middleware/, stores/ (Dateizugriff), lib/
src/        api/ (Server-Aufrufe), features/ (Angebots-Editor, Einstellungen, Auth),
            views/ (Listen, Dashboard), components/, pdf/, utils/, lib/
```

Tests: `npm test` · Lint: `npm run lint`

## Lizenz

MIT – siehe [LICENSE](LICENSE)
