import Link from 'next/link';
import { useState } from 'react';
import { api, money, dt } from '../lib/api';
import { Guard } from '../lib/auth';
import { useT } from '../lib/i18n';
import { Btn, Card, Field, Modal, Tabs, Empty, Err, Spinner, useLoad, useAct } from '../components/ui';
import Photos from '../components/Photos';

function Shoes() {
  const { t } = useT(), act = useAct(), { d, busy, reload } = useLoad(() => api('/me/shoes'));
  const [m, setM] = useState(null), [hist, setHist] = useState(null), [err, setErr] = useState(null);
  const save = async () => { setErr(null); try { const b = { ...m, declaredValue: Number(m.declaredValue) || 0 }; delete b._id; delete b.userId; delete b.createdAt; delete b.updatedAt; delete b.__v; delete b.archived; await api(m._id ? `/me/shoes/${m._id}` : '/me/shoes', { method: m._id ? 'PATCH' : 'POST', body: b }); setM(null); reload(); } catch (e) { setErr(e); } };
  if (busy) return <Spinner />;
  return (
    <>
      <div className="row between"><h2>{t('navWardrobe')}</h2><button className="btn sm" onClick={() => setM({ brand: '', model: '', type: 'sneaker', material: 'leather', declaredValue: '', photos: [], notes: '' })}>+ {t('addShoe')}</button></div>
      {!d?.length && <Card><Empty>{t('wardrobeEmpty')}</Empty></Card>}
      <div className="grid g3">{(d || []).map((s) => (
        <Card key={s._id}>{s.photos?.[0] && <img src={s.photos[0]} alt="" style={{ width: '100%', height: 140, objectFit: 'cover', borderRadius: 10 }} />}
          <b>{s.brand} {s.model}</b><div className="small mute">{s.material} · {s.type} · {money(s.declaredValue)}</div>
          <div className="row"><Link className="btn sm" href={`/book?material=${s.material}&brand=${encodeURIComponent(s.brand || '')}&value=${s.declaredValue || ''}`}>{t('repairThis')}</Link>
            <button className="btn ghost sm" onClick={() => setM({ ...s, declaredValue: s.declaredValue ?? '' })}>{t('edit')}</button>
            <button className="btn ghost sm" onClick={async () => setHist({ s, o: await api(`/me/shoes/${s._id}/history`) })}>{t('history')}</button>
            <button className="btn ghost sm" onClick={() => confirm(t('deleteConfirm')) && act(async () => { await api(`/me/shoes/${s._id}`, { method: 'DELETE' }); reload(); })}>🗑</button></div>
        </Card>))}</div>
      {m && <Modal title={m._id ? t('edit') : t('addShoe')} onClose={() => setM(null)}>
        <div className="grid g2"><Field label={t('brand')}><input value={m.brand || ''} onChange={(e) => setM({ ...m, brand: e.target.value })} /></Field><Field label={t('model')}><input value={m.model || ''} onChange={(e) => setM({ ...m, model: e.target.value })} /></Field>
          <Field label={t('material')}><select value={m.material || ''} onChange={(e) => setM({ ...m, material: e.target.value })}>{['leather', 'canvas', 'suede', 'knit', 'luxury'].map((x) => <option key={x} value={x}>{t('mat_' + x)}</option>)}</select></Field>
          <Field label={t('declaredValue')}><input type="number" min="0" value={m.declaredValue} onChange={(e) => setM({ ...m, declaredValue: e.target.value })} /></Field></div>
        <Photos value={m.photos || []} onChange={(p) => setM({ ...m, photos: p })} max={4} folder="shoe" />
        <Field label={t('notes')}><input value={m.notes || ''} onChange={(e) => setM({ ...m, notes: e.target.value })} /></Field><Err e={err} /><Btn onClick={save}>{t('save')}</Btn></Modal>}
      {hist && <Modal title={`${hist.s.brand} ${hist.s.model} · ${t('history')}`} onClose={() => setHist(null)}>{hist.o.length ? hist.o.map((o) => <div key={o._id}><Link href={`/order/${o._id}`}>{o.orderNo}</Link> · {o.status} · {money(o.total)} · {dt(o.createdAt)}</div>) : <Empty>{t('noOrders')}</Empty>}</Modal>}
    </>
  );
}
function Addresses() {
  const { t } = useT(), act = useAct(), { d, busy, reload } = useLoad(() => api('/me/addresses')), [m, setM] = useState(null), [err, setErr] = useState(null);
  const save = async () => { setErr(null); try { const b = { label: m.label, name: m.name, line1: m.line1, line2: m.line2, city: m.city, state: m.state, pincode: m.pincode, isDefault: !!m.isDefault }; await api(m._id ? `/me/addresses/${m._id}` : '/me/addresses', { method: m._id ? 'PATCH' : 'POST', body: b }); setM(null); reload(); } catch (e) { setErr(e); } };
  if (busy) return <Spinner />;
  return (
    <>
      <div className="row between"><h2>{t('addresses')}</h2><button className="btn sm" onClick={() => setM({ label: '', line1: '', city: '', state: '', pincode: '', isDefault: !(d || []).length })}>+ {t('newAddress')}</button></div>
      <div className="grid g2">{(d || []).map((a) => <Card key={a._id}><b>{a.label || t('address')}</b> {a.isDefault && <span className="badge ok">Default</span>}<div>{a.line1} {a.line2}</div><div className="small mute">{a.city}, {a.state} {a.pincode}</div>
        <div className="row"><button className="btn ghost sm" onClick={() => setM(a)}>{t('edit')}</button><button className="btn ghost sm" onClick={() => confirm(t('deleteConfirm')) && act(async () => { await api(`/me/addresses/${a._id}`, { method: 'DELETE' }); reload(); })}>🗑</button></div></Card>)}</div>
      {m && <Modal title={t('address')} onClose={() => setM(null)}>
        <Field label={t('label')}><input value={m.label || ''} onChange={(e) => setM({ ...m, label: e.target.value })} placeholder="Home / Office" /></Field>
        <Field label={t('addrLine')}><input value={m.line1} onChange={(e) => setM({ ...m, line1: e.target.value })} /></Field><Field label="Line 2"><input value={m.line2 || ''} onChange={(e) => setM({ ...m, line2: e.target.value })} /></Field>
        <div className="grid g3"><Field label={t('city')}><input value={m.city} onChange={(e) => setM({ ...m, city: e.target.value })} /></Field><Field label={t('state')}><input value={m.state || ''} onChange={(e) => setM({ ...m, state: e.target.value })} /></Field><Field label={t('pincode')}><input value={m.pincode} maxLength={6} onChange={(e) => setM({ ...m, pincode: e.target.value })} /></Field></div>
        <label className="row"><input type="checkbox" checked={!!m.isDefault} onChange={(e) => setM({ ...m, isDefault: e.target.checked })} /> Default</label><Err e={err} /><Btn onClick={save}>{t('save')}</Btn></Modal>}
    </>
  );
}
function Page() { const { t } = useT(), [tab, setTab] = useState('shoes'); return <><Tabs value={tab} onChange={setTab} tabs={[['shoes', t('navWardrobe')], ['addr', t('addresses')]]} />{tab === 'shoes' ? <Shoes /> : <Addresses />}</>; }
export default function W() { return <Guard roles={['customer']}><Page /></Guard>; }
