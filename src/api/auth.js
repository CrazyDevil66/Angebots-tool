import { anfrage, apiGet, apiPost, apiPatch, apiDelete, nullBeiFehlerstatus } from './client';

export const apiSetupRequired  = ()              => nullBeiFehlerstatus(apiGet(null, '/setup')).then(d => d?.setupRequired ?? false);
export const apiSetup          = (u, p)          => apiPost(null, '/setup', { username: u, password: p });
export const apiLogin          = (u, p)          => apiPost(null, '/login', { username: u, password: p });
export const apiMe             = (t)             => nullBeiFehlerstatus(apiGet(t, '/me'));
export const apiChangePassword = (t, p)          => apiPost(t, '/me/password', { password: p });
export const apiGetUsers       = (t)             => nullBeiFehlerstatus(apiGet(t, '/users'));
export const apiCreateUser     = (t, d)          => apiPost(t, '/users', d);
export const apiUpdateUser     = (t, id, d)      => apiPatch(t, `/users/${id}`, d);
export const apiDeleteUser     = (t, id)         => apiDelete(t, `/users/${id}`);
export const apiInviteUser     = (t, id)         => apiPost(t, `/users/${id}/invite`, {});
export const apiResetPassword  = (t, id)         => apiPost(t, `/users/${id}/reset-password`, {});
export const apiGetSmtp        = (t)             => nullBeiFehlerstatus(apiGet(t, '/config/smtp'));
export const apiSaveSmtp       = (t, d)          => apiPost(t, '/config/smtp', d);
export const apiTestSmtp       = (t, to)         => apiPost(t, '/config/smtp/test', { to });
export const apiRedeemInvite   = (token, p)      => anfrage(null, 'POST', `/invite/${token}`, { password: p });

export const getToken  = ()  => sessionStorage.getItem('auth_token');
export const saveToken = (t) => sessionStorage.setItem('auth_token', t);
export const clearToken = () => sessionStorage.removeItem('auth_token');
