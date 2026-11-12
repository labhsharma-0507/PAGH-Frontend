import { useState } from 'react';
import { useRouter } from 'next/router';
import { api, refresh, getUser } from '../lib/api';
import { homeFor } from '../lib/routes';
import { useT } from '../lib/i18n';
import { Card, Field, Err } from '../components/ui';
// Admin ne jo account banaya (partner/agent/staff...) usme temporary password hota hai: pehle login par badalna zaroori.
export default function ChangePassword() {
  const { t } = useT(), r = useRouter(), [f, setF] = useState({ current: '', password: '', confirm: '' }), [err, setErr] = useState(null), [busy, setBusy] = useState(false);
  const go = async (e) => {
    e.preventDefault(); setErr(null); setBusy(true);
    try {
      if (f.password.length < 8 || !/[A-Za-z]/.test(f.password) || !/\d/.test(f.password)) throw new Error(t('pwHint'));
      if (f.password !== f.confirm) throw new Error(t('pwMismatch'));
      await api('/auth/change-password', { method: 'POST', body: { current: f.current, password: f.password } });
      await refresh(); r.replace(homeFor(getUser()));
    } catch (x) { setErr(x); } finally { setBusy(false); }
  };
  return (
    <div style={{ maxWidth: 440, margin: '0 auto' }}><Card title={t('changeTitle')}><div className="alert warn">{t('changeNote')}</div>
      <form onSubmit={go} noValidate>
        <Field label={t('currentPw')}><input type="password" value={f.current} onChange={(e) => setF({ ...f, current: e.target.value })} autoComplete="current-password" /></Field>
        <Field label={t('newPassword')} hint={t('pwHint')}><input type="password" value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} autoComplete="new-password" /></Field>
        <Field label={t('confirmPassword')}><input type="password" value={f.confirm} onChange={(e) => setF({ ...f, confirm: e.target.value })} autoComplete="new-password" /></Field>
        <Err e={err} /><button className="btn" disabled={busy}>{busy ? '…' : t('save')}</button></form></Card></div>
  );
}
