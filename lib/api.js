// Access token sirf MEMORY mein rehta hai (localStorage mein nahi: XSS se chori ka risk kam).
// Refresh token httpOnly cookie mein hai; page reload par /auth/refresh se naya access token milta hai.
let token = null, user = null, cfg = null;
const subs = new Set();
export const base = () => process.env.NEXT_PUBLIC_API || (typeof location !== 'undefined' ? `${location.protocol}//${location.hostname}:4000/api/v1` : 'http://localhost:4000/api/v1');
export const apiRoot = () => base().replace(/\/api\/v1$/, '');
export const getToken = () => token;
export const getUser = () => user;
export const subscribe = (f) => { subs.add(f); return () => subs.delete(f); };
export const setSession = (s) => { token = s?.token || null; user = s?.user || null; subs.forEach((f) => f(user)); };
let refreshing = null;
export const refresh = () => {
  if (!refreshing) {
    refreshing = fetch(base() + '/auth/refresh', { method: 'POST', credentials: 'include' })
      .then(async (r) => { if (!r.ok) { setSession(null); return false; } setSession(await r.json()); return true; })
      .catch(() => false)
      .finally(() => { refreshing = null; });
  }
  return refreshing;
};
export async function api(path, { method = 'GET', body, text, retry = true } = {}) {
  const headers = {};
  if (!text) headers['Content-Type'] = 'application/json'; else headers['Content-Type'] = 'text/csv';
  if (token) headers.Authorization = 'Bearer ' + token;
  const r = await fetch(base() + path, { method, credentials: 'include', headers, body: text ?? (body ? JSON.stringify(body) : undefined) });
  if (r.status === 401 && retry && !path.startsWith('/auth/login') && !path.startsWith('/auth/otp')) {
    if (await refresh()) return api(path, { method, body, text, retry: false });
    if (typeof location !== 'undefined' && !['/login', '/'].includes(location.pathname)) location.href = '/login';
    throw new Error('Session expire ho gaya, dobara login karo');
  }
  if (r.status === 403 && retry && token && !path.startsWith('/auth/') && (await refresh())) return api(path, { method, body, text, retry: false }); // role badla ho sakta hai: naya token lo, ek baar retry
  const ct = r.headers.get('content-type') || '';
  const d = ct.includes('json') ? await r.json().catch(() => ({})) : await r.text();
  if (!r.ok) {
    if (r.status === 403 && d?.code === 'CHANGE_PW' && typeof location !== 'undefined' && location.pathname !== '/change-password') location.href = '/change-password';
    if (r.status === 403 && d?.code === '2FA' && typeof location !== 'undefined' && !location.pathname.startsWith('/profile')) location.href = '/profile#security';
    const e = new Error(d?.error || 'Kuch galat hua'); e.code = d?.code; e.status = r.status; throw e;
  }
  return d;
}
export const getConfig = async () => (cfg ||= await fetch(base() + '/config').then((r) => r.json()).catch(() => ({})));
const dataToBlob = (d) => { const [h, b] = d.split(','); const bin = atob(b); const u = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i); return new Blob([u], { type: h.match(/:(.*?);/)[1] }); };
// Photo upload: S3 configured ho to browser se seedha bucket (signed URL), warna backend ke through
export async function uploadImage(dataUrl, folder = 'misc') {
  const c = await getConfig();
  if (c.directUpload) {
    try {
      const blob = dataToBlob(dataUrl);
      const s = await api('/uploads/sign', { method: 'POST', body: { folder, contentType: blob.type } });
      if (s.mode === 'direct') {
        const r = await fetch(s.url, { method: 'PUT', headers: s.headers, body: blob });
        if (r.ok) return s.publicUrl;
      }
    } catch { /* server upload par fallback */ }
  }
  return (await api('/uploads', { method: 'POST', body: { image: dataUrl, folder } })).url;
}
export const money = (n) => '₹' + Number(n || 0).toLocaleString('en-IN');
export const dt = (d) => (d ? new Date(d).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : '');
export const day = (d) => (d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '');
