import { apiGet, apiPost } from './client';

export const ladeBackup            = token           => apiGet(token, '/backup');
export const stelleBackupWiederHer = (token, backup) => apiPost(token, '/backup/restore', backup);
