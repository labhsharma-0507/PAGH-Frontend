import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { api, setSession } from '../lib/api';
import { homeFor, safeNext } from '../lib/routes';
import { useT } from '../lib/i18n';
import { Card, Field, Err, Tabs } from '../components/ui';
import GoogleButton from '../components/GoogleButton';

const EMAIL = /^\S+@\S+\.\S+$/, PHONE = /^[6-9]\d{9}$/;
const pwErr = (p) => (p.length < 8 ? 'pwHint' : !/[A-Za-z]/.test(p) || !/\d/.test(p) ? 'pwHint' : null);
const cleanPhone = (p) => { const d = String(p).replace(/\D/g, ''); return d.length === 12 && d.startsWith('91') ? d.slice(2) : d; };

export default function Login() {
  const { t, lang } = useT(), r = useRouter();
  const [mode, setMode] = useState('login'), [f, setF] = useState({ name: '', email: '', phone: '', password: '', confirm: '', code: '', totp: '' });
  const [err, setErr] = useState(null), [info, setInfo] = useState(''), [needTotp, setNeedTotp] = useState(false), [show, setShow] = useState(false), [busy, setBusy] = useState(false), [wait, setWait] = useState(0);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  useEffect(() => { if (r.isReady && r.query.tab === 'signup') setMode('signup'); }, [r.isReady, r.query.tab]);
  useEffect(() => { if (wait <= 0) return; const id = setTimeout(() => setWait(wait - 1), 1000); return () => clearTimeout(id); }, [wait]);
  const tab = ['otp', 'otp2'].includes(mode) ? 'otp' : ['forgot', 'reset'].includes(mode) ? 'login' : mode;
  const switchTab = (m) => { setMode(m); setErr(null); setInfo(''); };

  // login/signup/google ke baad: onboarding steps (password badlo / phone do), warna allowed `next` ya apna role-home
  const done = (d) => {
    setSession(d);
    const u = d.user;
    if (u.mustChangePassword) return r.replace('/change-password');
    const next = r.query.next ? String(r.query.next) : '';
    if (u.needsPhone) return r.replace('/complete-profile' + (next ? '?next=' + encodeURIComponent(next) : ''));
    r.replace(safeNext(next, u) || homeFor(u));
  };
  const run = (fn) => async (e) => {
    e?.preventDefault?.(); setErr(null); setInfo(''); setBusy(true);
    try { await fn(); } catch (x) { if (x.code === 'TOTP') setNeedTotp(true); setErr(x); } finally { setBusy(false); }
  };
  const bad = (cond, key) => { if (cond) throw new Error(t(key)); };
  const login = run(async () => { bad(!EMAIL.test(f.email), 'invalidEmail'); bad(!f.password, 'passwordRequired'); done(await api('/auth/login', { method: 'POST', body: { email: f.email.trim(), password: f.password, totp: f.totp || undefined } })); });
  const signup = run(async () => {
    bad(f.name.trim().length < 2, 'nameShort'); bad(!EMAIL.test(f.email), 'invalidEmail'); bad(!PHONE.test(cleanPhone(f.phone)), 'invalidPhone');
    bad(!!pwErr(f.password), 'pwHint'); bad(f.password !== f.confirm, 'pwMismatch');
    try { done(await api('/auth/signup', { method: 'POST', body: { name: f.name.trim(), email: f.email.trim(), phone: cleanPhone(f.phone), password: f.password, lang } })); }
    catch (x) { if (x.status === 409) { setMode('login'); throw new Error(t('accountExists')); } throw x; }
  });
  const sendOtp = run(async () => { bad(!PHONE.test(cleanPhone(f.phone)), 'invalidPhone'); const d = await api('/auth/otp/login-send', { method: 'POST', body: { phone: cleanPhone(f.phone) } }); setInfo(t('otpSent') + (d.devCode ? ` (dev code: ${d.devCode})` : '')); setMode('otp2'); setWait(30); });
  const otpLogin = run(async () => { bad(f.code.length !== 6, 'codeInvalid'); done(await api('/auth/otp/login', { method: 'POST', body: { phone: cleanPhone(f.phone), code: f.code } })); });
  const forgot = run(async () => { bad(!EMAIL.test(f.email), 'invalidEmail'); const d = await api('/auth/forgot', { method: 'POST', body: { email: f.email.trim() } }); setInfo(t('resetSent') + (d.devCode ? ` (dev code: ${d.devCode})` : '')); setMode('reset'); });
  const reset = run(async () => { bad(f.code.length !== 6, 'codeInvalid'); bad(!!pwErr(f.password), 'pwHint'); await api('/auth/reset', { method: 'POST', body: { email: f.email.trim(), code: f.code, password: f.password } }); setInfo(t('resetDone')); setF({ ...f, password: '', code: '' }); setMode('login'); });
  const pwField = (label, k, auto, hint) => (
    <Field label={label} hint={hint}><div className="row" style={{ flexWrap: 'nowrap' }}><input type={show ? 'text' : 'password'} value={f[k]} onChange={set(k)} autoComplete={auto} /><button type="button" className="btn ghost sm" onClick={() => setShow(!show)} aria-label="show password">{show ? '🙈' : '👁'}</button></div></Field>
  );
  const submit = { login, signup, otp: sendOtp, otp2: otpLogin, forgot, reset }[mode];
  return (
    <div style={{ maxWidth: 440, margin: '0 auto' }}>
      {r.query.reason === 'login' && <div className="alert info">{t('loginFirst')}</div>}
      <Card>
        <Tabs tabs={[['login', t('login')], ['signup', t('signup')], ['otp', t('otpLogin')]]} value={tab} onChange={switchTab} />
        <GoogleButton onDone={done} onError={setErr} />
        <div className="mute small" style={{ margin: '10px 0' }}>— {t('or')} —</div>
        <Err e={err} />{info && <div className="alert ok">{info}</div>}
        <form onSubmit={submit} noValidate>
          {mode === 'signup' && <>
            <Field label={t('name')}><input value={f.name} onChange={set('name')} autoComplete="name" /></Field>
            <Field label={t('phone')} hint={t('phoneHint')}><input value={f.phone} onChange={set('phone')} inputMode="tel" autoComplete="tel" placeholder="98XXXXXXXX" /></Field>
          </>}
          {['login', 'signup', 'forgot', 'reset'].includes(mode) && <Field label="Email"><input type="email" value={f.email} onChange={set('email')} autoComplete="email" /></Field>}
          {['login', 'signup', 'reset'].includes(mode) && pwField(mode === 'reset' ? t('newPassword') : t('password'), 'password', mode === 'login' ? 'current-password' : 'new-password', mode !== 'login' ? t('pwHint') : undefined)}
          {mode === 'signup' && pwField(t('confirmPassword'), 'confirm', 'new-password')}
          {mode === 'login' && needTotp && <Field label={t('totpCode')} hint={t('totpHint')}><input value={f.totp} onChange={set('totp')} inputMode="numeric" maxLength={6} autoFocus /></Field>}
          {['otp', 'otp2'].includes(mode) && <Field label={t('phone')}><input value={f.phone} onChange={set('phone')} inputMode="tel" placeholder="98XXXXXXXX" /></Field>}
          {['otp2', 'reset'].includes(mode) && <Field label={t('code')}><input value={f.code} onChange={set('code')} inputMode="numeric" maxLength={6} autoComplete="one-time-code" /></Field>}
          <div className="row">
            <button type="submit" className="btn" disabled={busy}>{busy ? '…' : { login: t('login'), signup: t('signup'), otp: t('sendOtp'), otp2: t('login'), forgot: t('sendCode'), reset: t('resetPw') }[mode]}</button>
            {mode === 'login' && <button type="button" className="btn ghost sm" onClick={() => switchTab('forgot')}>{t('forgotPw')}</button>}
            {mode === 'otp2' && <button type="button" className="btn ghost sm" disabled={wait > 0} onClick={sendOtp}>{wait > 0 ? t('resendIn', { n: wait }) : t('resendOtp')}</button>}
            {['forgot', 'reset'].includes(mode) && <button type="button" className="btn ghost sm" onClick={() => switchTab('login')}>{t('back')}</button>}
          </div>
        </form>
        <p className="small mute" style={{ marginTop: 12 }}>{mode === 'signup' ? <>{t('haveAccount')} <a href="#" onClick={(e) => { e.preventDefault(); switchTab('login'); }}>{t('login')}</a></> : tab === 'login' ? <>{t('noAccount')} <a href="#" onClick={(e) => { e.preventDefault(); switchTab('signup'); }}>{t('signup')}</a></> : null}</p>
      </Card>
      <p className="small mute">{t('termsAgree')} <Link href="/page/terms">Terms</Link> · <Link href="/page/privacy">Privacy</Link></p>
    </div>
  );
}
