import { apiGet, apiPost } from './client';

export const ladeBackup            = token           => apiGet(token, '/backup');
export const stelleBackupWiederHer = (token, backup) => apiPost(token, '/backup/restore', backup);

export const ladeBackupEinstellungen      = token             => apiGet(token, '/config/backup');
export const speichereBackupEinstellungen = (token, werte)    => apiPost(token, '/config/backup', werte);
export const jetztSichern                 = token             => apiPost(token, '/backup/jetzt', {});
