import { useState } from 'react';
import Link from 'next/link';
import { api, refresh } from '../lib/api';
import { useAuth } from '../lib/auth';
import { homeFor } from '../lib/routes';
import { Guard } from '../lib/auth';
import { useT } from '../lib/i18n';
import { Btn, Card, Field, Err, Badge, useLoad } from '../components/ui';
import Photos from '../components/Photos';
function A() {
  const { t } = useT(), { user } = useAuth(), me = useLoad(() => api('/partners/me')), [f, setF] = useState({ type: 'COBBLER', businessName: '', address: '', city: '', pincodes: '', capacity: '' }), [docs, setDocs] = useState([]), [err, setErr] = useState(null), [ok, setOk] = useState(false);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  if (me.d || ok) return <Card title={t('partnerApp')}>{me.d && <p>{me.d.businessName} · {me.d.type} · <Badge s={me.d.status}>{me.d.status}</Badge></p>}{ok && <div className="alert ok">{t('applied')}</div>}<p className="mute">{t('appliedNote')}</p>
    {me.d?.status === 'APPROVED' ? <div className="alert ok">{t('approvedGo')} <Btn onClick={async () => { await refresh(); location.href = homeFor(user?.role === 'customer' ? { role: { COBBLER: 'partner', HUB: 'partner', DROP_POINT: 'droppoint', AGENT: 'agent' }[me.d.type] } : user); }}>{t('myPanel')}</Btn></div> : <Btn kind="ghost" onClick={async () => { await me.reload(); await refresh(); }}>{t('checkStatus')}</Btn>}</Card>;
  const go = async () => { setErr(null); try { await api('/partners/apply', { method: 'POST', body: { ...f, capacity: Number(f.capacity) || undefined, docs } }); setOk(true); } catch (e) { setErr(e); } };
  return (
    <div style={{ maxWidth: 560, margin: '0 auto' }}><Card title={t('partnerApp')}><p className="mute">{t('partnerIntro')}</p>
      <Field label={t('partnerType')}><select value={f.type} onChange={set('type')}>{['COBBLER', 'HUB', 'DROP_POINT', 'AGENT'].map((x) => <option key={x} value={x}>{t('ptype_' + x)}</option>)}</select></Field>
      <Field label={t('businessName')}><input value={f.businessName} onChange={set('businessName')} /></Field>
      <Field label={t('address')}><input value={f.address} onChange={set('address')} /></Field>
      <div className="grid g2"><Field label={t('city')}><input value={f.city} onChange={set('city')} /></Field><Field label={t('capacity')}><input type="number" value={f.capacity} onChange={set('capacity')} /></Field></div>
      <Field label={t('servePincodes')} hint="452001, 452002"><input value={f.pincodes} onChange={set('pincodes')} /></Field>
      <Photos value={docs} onChange={setDocs} max={4} folder="partner" label={t('docsPhotos')} />
      <Err e={err} /><Btn onClick={go}>{t('submit')}</Btn></Card></div>
  );
}
export default function Page() { return <Guard roles={['customer']}><A /></Guard>; }
