import { useState } from 'react';
import { useRouter } from 'next/router';
import { api, refresh } from '../lib/api';
import { useAuth } from '../lib/auth';
import { safeNext } from '../lib/routes';
import { useT } from '../lib/i18n';
import { Card, Field, Err } from '../components/ui';
const cleanPhone = (p) => { const d = String(p).replace(/\D/g, ''); return d.length === 12 && d.startsWith('91') ? d.slice(2) : d; };
// Google se signup karne waale users ke paas phone nahi hota: pickup/OTP ke liye zaroori hai.
export default function CompleteProfile() {
  const { t } = useT(), { user } = useAuth(), r = useRouter(), [f, setF] = useState({ name: user?.name || '', phone: '' }), [err, setErr] = useState(null), [busy, setBusy] = useState(false);
  const go = async (e) => {
    e.preventDefault(); setErr(null); setBusy(true);
    try {
      if (!/^[6-9]\d{9}$/.test(cleanPhone(f.phone))) throw new Error(t('invalidPhone'));
      if (f.name.trim().length < 2) throw new Error(t('nameShort'));
      await api('/me', { method: 'PATCH', body: { name: f.name.trim(), phone: cleanPhone(f.phone) } });
      await refresh(); // naye flags (needsPhone=false) ke saath session
      const { getUser } = await import('../lib/api');
      r.replace(safeNext(r.query.next, getUser()));
    } catch (x) { setErr(x); } finally { setBusy(false); }
  };
  return (
    <div style={{ maxWidth: 440, margin: '0 auto' }}><Card title={t('completeTitle')}><p className="mute">{t('completeNote')}</p>
      <form onSubmit={go} noValidate><Field label="Email"><input value={user?.email || ''} disabled /></Field>
        <Field label={t('name')}><input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} autoComplete="name" /></Field>
        <Field label={t('phone')} hint={t('phoneHint')}><input value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} inputMode="tel" autoComplete="tel" placeholder="98XXXXXXXX" autoFocus /></Field>
        <Err e={err} /><button className="btn" disabled={busy}>{busy ? '…' : t('continue')}</button></form></Card></div>
  );
}
