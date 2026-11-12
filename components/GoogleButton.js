import { useEffect, useRef, useState } from 'react';
import { api, getConfig, setSession } from '../lib/api';
import { loadScript } from '../lib/img';
import { useT } from '../lib/i18n';
// Google Sign-In (ID token flow). GOOGLE_CLIENT_ID backend .env mein set ho to button dikhta hai.
// Google Cloud Console > Credentials > OAuth client (Web) > "Authorised JavaScript origins" mein is site ka URL daalna zaroori hai.
export default function GoogleButton({ onDone, onError }) {
  const { lang } = useT(), ref = useRef(null), [id, setId] = useState(undefined), [failed, setFailed] = useState(false);
  useEffect(() => { getConfig().then((c) => setId(c.googleClientId || null)); }, []);
  useEffect(() => {
    if (!id || !ref.current) return;
    let dead = false;
    loadScript('https://accounts.google.com/gsi/client').then(() => {
      if (dead || !window.google?.accounts?.id) return setFailed(true);
      window.google.accounts.id.initialize({
        client_id: id, ux_mode: 'popup', auto_select: false, cancel_on_tap_outside: true,
        callback: async (resp) => {
          try { const d = await api('/auth/google', { method: 'POST', body: { idToken: resp.credential, lang } }); setSession(d); onDone(d); }
          catch (e) { onError?.(e); }
        },
      });
      window.google.accounts.id.renderButton(ref.current, { theme: 'outline', size: 'large', width: Math.min(340, ref.current.clientWidth || 320), text: 'continue_with', locale: lang === 'hi' ? 'hi' : 'en', shape: 'pill' });
    }).catch(() => setFailed(true));
    return () => { dead = true; };
  }, [id, lang]); // eslint-disable-line
  if (id === undefined) return null;
  if (!id) return process.env.NODE_ENV !== 'production' ? <p className="small mute">Google login band hai: backend <code>.env</code> mein <code>GOOGLE_CLIENT_ID</code> daalo.</p> : null;
  return <div><div ref={ref} style={{ minHeight: 44 }} />{failed && <p className="small mute">Google load nahi hua (internet/ad-blocker check karo).</p>}</div>;
}
