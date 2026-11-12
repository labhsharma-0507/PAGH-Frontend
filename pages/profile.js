import { useState, useEffect } from 'react';
import { api, dt, setSession } from '../lib/api';
import { Guard, useAuth } from '../lib/auth';
import { useT } from '../lib/i18n';
import { Btn, Card, Field, Tabs, Err, Spinner, Table, useLoad, useAct } from '../components/ui';
import { QR } from '../components/QR';

function Profile({ me, reload }) {
  const { t } = useT(), act = useAct(), [f, setF] = useState({ name: me.name, phone: me.phone || '', prefs: me.prefs || { email: true, sms: true, whatsapp: false } }), [code, setCode] = useState(''), [dev, setDev] = useState('');
  return (
    <Card title={t('navProfile')}>
      <Field label={t('name')}><input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></Field>
      <div className="grid g2"><Field label="Email"><input value={me.email} disabled /></Field><Field label={t('phone')}><input value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} /></Field></div>
      <div className="row">{me.emailVerified ? <span className="badge ok">Email ✓</span> : <><span className="badge warn">Email ✗</span><Btn small kind="ghost" onClick={() => act(() => api('/auth/resend-verification', { method: 'POST' }), t('linkSent'))}>{t('resendLink')}</Btn></>}
        {me.phoneVerified ? <span className="badge ok">Phone ✓</span> : me.phone && <><span className="badge warn">Phone ✗</span><Btn small kind="ghost" onClick={async () => { const d = await act(() => api('/auth/otp/send', { method: 'POST' }), t('otpSent')); if (d?.devCode) setDev(d.devCode); }}>{t('verifyPhone')}</Btn><input style={{ width: 110 }} value={code} onChange={(e) => setCode(e.target.value)} placeholder={t('code')} /><Btn small onClick={() => act(async () => { await api('/auth/otp/verify', { method: 'POST', body: { code } }); reload(); }, t('saved'))}>OK</Btn>{dev && <small>dev: {dev}</small>}</>}</div>
      <h3 style={{ marginTop: 14 }}>{t('notifPrefs')}</h3>
      <div className="row">{['email', 'sms', 'whatsapp'].map((k) => <label key={k} className="row"><input type="checkbox" checked={!!f.prefs[k]} onChange={(e) => setF({ ...f, prefs: { ...f.prefs, [k]: e.target.checked } })} /> {k}</label>)}</div>
      <p className="small mute">{t('whatsappNote')}</p>
      <Btn onClick={() => act(async () => { await api('/me', { method: 'PATCH', body: { name: f.name, phone: f.phone, prefs: f.prefs } }); reload(); }, t('saved'))}>{t('save')}</Btn>
    </Card>
  );
}
function Security({ me, reload }) {
  const { t } = useT(), act = useAct(), [pw, setPw] = useState({ current: '', password: '' }), [tf, setTf] = useState(null), [code, setCode] = useState(''), ses = useLoad(() => api('/me/sessions'));
  return (
    <>
      {me.role === 'admin' && !me.twoFA && <div className="alert warn"><b>{t('admin2fa')}</b></div>}
      <Card title={t('twofa')}>
        {me.twoFA ? <div className="alert ok">{t('twofaOn')}</div> : <>
          {!tf ? <Btn onClick={async () => setTf(await api('/auth/2fa/setup', { method: 'POST' }))}>{t('enable2fa')}</Btn> : <>
            <p>{t('twofaScan')}</p><QR text={tf.otpauth} size={170} /><p className="small">Secret: <code>{tf.secret}</code></p>
            <div className="row"><input style={{ width: 140 }} value={code} onChange={(e) => setCode(e.target.value)} placeholder="123456" inputMode="numeric" maxLength={6} /><Btn onClick={() => act(async () => { const d = await api('/auth/2fa/verify', { method: 'POST', body: { code } }); setSession(d); reload(); setTf(null); }, t('twofaOn'))}>{t('verify')}</Btn></div></>}</>}
      </Card>
      <Card title={t('changePw')}>
        <Field label={t('currentPw')}><input type="password" value={pw.current} onChange={(e) => setPw({ ...pw, current: e.target.value })} /></Field>
        <Field label={t('newPassword')} hint={t('pwHint')}><input type="password" value={pw.password} onChange={(e) => setPw({ ...pw, password: e.target.value })} /></Field>
        <Btn onClick={() => act(async () => { await api('/auth/change-password', { method: 'POST', body: pw }); setPw({ current: '', password: '' }); ses.reload(); }, t('saved'))}>{t('save')}</Btn>
      </Card>
      <Card title={t('devices')} actions={<Btn small kind="ghost" onClick={() => act(async () => { await api('/auth/logout-all', { method: 'POST' }); setSession(null); location.href = '/login'; })}>{t('logoutAll')}</Btn>}>
        {ses.d && <Table rows={ses.d} cols={[{ h: t('device'), f: (r) => (r.ua || '').slice(0, 60) }, { h: 'IP', f: (r) => r.ip }, { h: t('date'), f: (r) => dt(r.createdAt) }, { h: '', f: (r) => <Btn small kind="ghost" onClick={() => act(async () => { await api(`/me/sessions/${r._id}`, { method: 'DELETE' }); ses.reload(); })}>{t('revoke')}</Btn> }]} />}
      </Card>
    </>
  );
}
function Data({ me }) {
  const { t } = useT(), act = useAct(), [conf, setConf] = useState(false);
  const exp = () => act(async () => { const d = await api('/me/export'); const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([JSON.stringify(d, null, 2)], { type: 'application/json' })); a.download = 'footwear-sos-data.json'; a.click(); });
  return (
    <>
      <Card title={t('exportData')}><p className="mute">{t('exportNote')}</p><Btn onClick={exp}>{t('download')}</Btn></Card>
      {me.role === 'customer' && <Card title={t('deleteAccount')}><p className="mute">{t('deleteNote')}</p>
        <label className="row"><input type="checkbox" checked={conf} onChange={(e) => setConf(e.target.checked)} /> {t('deleteConfirmWallet')}</label>
        <Btn kind="danger" disabled={!conf} onClick={() => confirm(t('deleteAccConfirm')) && act(async () => { await api('/me', { method: 'DELETE', body: { confirmLoseWallet: true } }); setSession(null); location.href = '/'; })}>{t('deleteAccount')}</Btn></Card>}
    </>
  );
}
function P() {
  const { t } = useT(), { d: me, busy, reload } = useLoad(() => api('/me')), [tab, setTab] = useState('profile');
  useEffect(() => { if (location.hash === '#security') setTab('security'); }, []);
  if (busy || !me) return <Spinner />;
  return (<><Tabs value={tab} onChange={setTab} tabs={[['profile', t('navProfile')], ['security', t('security')], ['data', t('myData')]]} />
    {tab === 'profile' && <Profile me={me} reload={reload} />}{tab === 'security' && <Security me={me} reload={reload} />}{tab === 'data' && <Data me={me} />}</>);
}
export default function Page() { return <Guard><P /></Guard>; }
