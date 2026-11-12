import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { api, getConfig, money } from '../lib/api';
import { Guard } from '../lib/auth';
import { useT } from '../lib/i18n';
import { compress } from '../lib/img';
import { uploadImage } from '../lib/api';
import { Btn, Card, Field, Err, useLoad, useAct } from '../components/ui';

const ANGLES = [['soles', true], ['toe', true], ['heel', true], ['inside', true], ['stitch', false], ['label', false], ['damage', false], ['full', false]];
const SLOTS = ['9-12 AM', '12-4 PM', '4-8 PM'];

function AngleSlots({ value, onChange }) {
  const { t } = useT(), [busy, setB] = useState(null), [err, setErr] = useState('');
  const put = async (k, f) => {
    setB(k); setErr('');
    try { onChange({ ...value, [k]: await uploadImage(await compress(f), 'condition') }); } catch (e) { setErr(e.message); } finally { setB(null); }
  };
  return (
    <div>
      <div className="grid g4">
        {ANGLES.map(([k, req]) => (
          <label key={k} className="th" style={{ width: '100%', height: 120, display: 'grid', placeItems: 'center', textAlign: 'center', cursor: 'pointer' }}>
            {value[k] ? <img src={value[k]} alt={t('angle_' + k)} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span className="small mute">{busy === k ? '…' : '+'}<br />{t('angle_' + k)}{req && ' *'}</span>}
            <input type="file" accept="image/*" capture="environment" hidden onChange={(e) => e.target.files[0] && put(k, e.target.files[0])} />
          </label>
        ))}
      </div>
      {err && <div className="alert bad">{err}</div>}
    </div>
  );
}

function Book() {
  const { t } = useT(), r = useRouter(), act = useAct(), q = r.query;
  const [step, setStep] = useState(0), [err, setErr] = useState(null), [cfg, setCfg] = useState({});
  const shoes = useLoad(() => api('/me/shoes')), addrs = useLoad(() => api('/me/addresses')), plans = useLoad(() => api('/protection/plans'));
  const [f, setF] = useState({ shoeId: '', brand: '', material: 'leather', type: 'sneaker', problem: '', declaredValue: '', serviceType: 'REPAIR', saveShoe: true, pickupMode: 'PICKUP', addressId: '', newAddr: { line1: '', city: '', state: '', pincode: '' }, dropPointId: '', slot: SLOTS[0], plan: 'BASIC', express: false, brandCode: '' });
  const [photos, setPhotos] = useState({}), [pre, setPre] = useState(''), [svc, setSvc] = useState(null), [dpPin, setDpPin] = useState(''), [dps, setDps] = useState([]);
  const set = (k, v) => setF((x) => ({ ...x, [k]: v }));
  useEffect(() => { getConfig().then(setCfg); }, []);
  useEffect(() => {
    if (!r.isReady) return;
    setF((x) => ({ ...x, material: q.material || x.material, brand: q.brand || x.brand, type: q.type || x.type, problem: q.problem || x.problem, declaredValue: q.value || x.declaredValue }));
  }, [r.isReady]); // eslint-disable-line
  useEffect(() => { const d = (addrs.d || []).find((a) => a.isDefault) || (addrs.d || [])[0]; if (d && !f.addressId) set('addressId', d._id); }, [addrs.d]); // eslint-disable-line
  const pin = f.addressId === 'new' ? f.newAddr.pincode : (addrs.d || []).find((a) => a._id === f.addressId)?.pincode;
  useEffect(() => { if (/^\d{6}$/.test(pin || '') && f.pickupMode === 'PICKUP') api('/serviceability/' + pin).then(setSvc).catch(() => setSvc(null)); else setSvc(null); }, [pin, f.pickupMode]);
  const findDp = async () => { try { setDps((await api('/serviceability/' + dpPin)).dropPoints); } catch (e) { setErr(e); } };
  const chosenPlan = (plans.d || []).find((p) => p.code === f.plan);
  const planFee = chosenPlan ? Math.round(((Number(f.declaredValue) || 0) * (chosenPlan.feePct || 0)) / 100) : 0;
  const required = ANGLES.filter(([, req]) => req).every(([k]) => photos[k]);
  const shoeOk = f.shoeId ? true : (f.material && (f.brand || f.problem)), valueOk = Number(f.declaredValue) >= 0 && f.declaredValue !== '';
  const pickupOk = f.pickupMode === 'DROPPOINT' ? !!f.dropPointId : f.addressId && (f.addressId !== 'new' || (f.newAddr.line1.length >= 5 && f.newAddr.city && /^\d{6}$/.test(f.newAddr.pincode))) && svc?.pickup !== false;
  const ok = [shoeOk && valueOk, pickupOk, required, true][step];
  const submit = async () => {
    setErr(null);
    try {
      let shoeId = f.shoeId || undefined, addressId = f.addressId;
      if (!shoeId && f.saveShoe) shoeId = (await api('/me/shoes', { method: 'POST', body: { brand: f.brand, material: f.material, type: f.type, declaredValue: Number(f.declaredValue) } }))._id;
      if (f.pickupMode === 'PICKUP' && addressId === 'new') addressId = (await api('/me/addresses', { method: 'POST', body: { ...f.newAddr, isDefault: !(addrs.d || []).length } }))._id;
      const o = await api('/orders', { method: 'POST', body: {
        shoeId, shoe: shoeId ? { problem: f.problem } : { brand: f.brand, material: f.material, type: f.type, problem: f.problem }, verdictId: q.verdictId, declaredValue: Number(f.declaredValue), serviceType: f.serviceType,
        pickupMode: f.pickupMode, addressId: f.pickupMode === 'PICKUP' ? addressId : undefined, dropPointId: f.pickupMode === 'DROPPOINT' ? f.dropPointId : undefined, slot: f.slot, plan: f.plan, express: f.express, brandCode: f.brandCode || undefined,
      } });
      await api(`/orders/${o._id}/condition/customer-photos`, { method: 'POST', body: { photos: ANGLES.map(([k]) => photos[k]).filter(Boolean), preExisting: pre.split('\n').map((x) => x.trim()).filter(Boolean) } }).catch(() => {});
      r.push(`/order/${o._id}?new=1`);
    } catch (e) { setErr(e); }
  };
  const steps = ['bookStep1', 'bookStep2', 'bookStep3', 'bookStep4'];
  return (
    <div style={{ maxWidth: 760, margin: '0 auto' }}>
      <h1>{t('bookTitle')}</h1>
      <div className="steps">{steps.map((s, i) => <i key={s} className={i <= step ? 'on' : ''} />)}</div>
      <Card title={`${step + 1}/4 · ${t(steps[step])}`}>
        {step === 0 && <>
          {(shoes.d || []).length > 0 && <Field label={t('fromWardrobe')}><select value={f.shoeId} onChange={(e) => { const s = (shoes.d || []).find((x) => x._id === e.target.value); setF((x) => ({ ...x, shoeId: e.target.value, declaredValue: s?.declaredValue ?? x.declaredValue })); }}><option value="">{t('newShoe')}</option>{shoes.d.map((s) => <option key={s._id} value={s._id}>{s.brand} {s.model}</option>)}</select></Field>}
          {!f.shoeId && <div className="grid g2">
            <Field label={t('brandModel')}><input value={f.brand} onChange={(e) => set('brand', e.target.value)} /></Field>
            <Field label={t('material')}><select value={f.material} onChange={(e) => set('material', e.target.value)}>{['leather', 'canvas', 'suede', 'knit', 'luxury', 'unknown'].map((m) => <option key={m} value={m}>{t('mat_' + m)}</option>)}</select></Field>
          </div>}
          <Field label={t('problem')}><input value={f.problem} onChange={(e) => set('problem', e.target.value)} maxLength={300} placeholder={t('describePh')} /></Field>
          <div className="grid g2">
            <Field label={t('serviceType')}><select value={f.serviceType} onChange={(e) => set('serviceType', e.target.value)}>{['REPAIR', 'CLEANING', 'RESTORATION'].map((m) => <option key={m} value={m}>{t('svc_' + m)}</option>)}</select></Field>
            <Field label={t('declaredValue')} hint={t('declaredHint')}><input type="number" min="0" value={f.declaredValue} onChange={(e) => set('declaredValue', e.target.value)} /></Field>
          </div>
          {!f.shoeId && <label className="row"><input type="checkbox" checked={f.saveShoe} onChange={(e) => set('saveShoe', e.target.checked)} /> {t('saveWardrobe')}</label>}
        </>}
        {step === 1 && <>
          <div className="row" role="radiogroup">{['PICKUP', 'DROPPOINT'].map((m) => <label key={m} className="btn ghost"><input type="radio" checked={f.pickupMode === m} onChange={() => set('pickupMode', m)} /> {t('mode_' + m)}</label>)}</div>
          {f.pickupMode === 'PICKUP' ? <>
            <Field label={t('address')}><select value={f.addressId} onChange={(e) => set('addressId', e.target.value)}>{(addrs.d || []).map((a) => <option key={a._id} value={a._id}>{a.label ? a.label + ': ' : ''}{a.line1}, {a.city} {a.pincode}</option>)}<option value="new">+ {t('newAddress')}</option></select></Field>
            {f.addressId === 'new' && <div className="grid g2">
              <Field label={t('addrLine')}><input value={f.newAddr.line1} onChange={(e) => set('newAddr', { ...f.newAddr, line1: e.target.value })} /></Field>
              <Field label={t('city')}><input value={f.newAddr.city} onChange={(e) => set('newAddr', { ...f.newAddr, city: e.target.value })} /></Field>
              <Field label={t('state')}><input value={f.newAddr.state} onChange={(e) => set('newAddr', { ...f.newAddr, state: e.target.value })} /></Field>
              <Field label={t('pincode')}><input value={f.newAddr.pincode} maxLength={6} inputMode="numeric" onChange={(e) => set('newAddr', { ...f.newAddr, pincode: e.target.value })} /></Field>
            </div>}
            {svc && svc.pickup === false && <div className="alert warn">{t('notServiceable')}</div>}
            {svc?.dropPoints?.length > 0 && svc.pickup && <div className="alert info">{t('dpNearby', { n: svc.dropPoints.length })}</div>}
          </> : <>
            <div className="row"><input style={{ maxWidth: 200 }} value={dpPin} maxLength={6} inputMode="numeric" onChange={(e) => setDpPin(e.target.value)} placeholder={t('pincode')} /><Btn kind="ghost" onClick={findDp}>{t('findDropPoints')}</Btn></div>
            {dps.map((d) => <label key={d.id} className="card row"><input type="radio" checked={f.dropPointId === d.id} onChange={() => set('dropPointId', d.id)} /><div><b>{d.name}</b><div className="small mute">{d.address}, {d.city}</div></div></label>)}
            {dpPin.length === 6 && !dps.length && <div className="alert warn">{t('noDropPoints')}</div>}
            <p className="small mute">{t('dpExplain')}</p>
          </>}
          {f.pickupMode === 'PICKUP' && <Field label={t('slot')}><select value={f.slot} onChange={(e) => set('slot', e.target.value)}>{SLOTS.map((s) => <option key={s}>{s}</option>)}</select></Field>}
        </>}
        {step === 2 && <>
          <div className="alert info">{t('conditionWhy')}</div>
          <AngleSlots value={photos} onChange={setPhotos} />
          <Field label={t('preExisting')} hint={t('preExistingHint')}><textarea value={pre} onChange={(e) => setPre(e.target.value)} placeholder={t('preExistingPh')} /></Field>
        </>}
        {step === 3 && <>
          <div className="grid g2">{(plans.d || []).map((p) => <label key={p.code} className="card"><div className="row"><input type="radio" checked={f.plan === p.code} onChange={() => set('plan', p.code)} /> <b>{p.name}</b></div><div className="small mute">{p.description}</div>{p.feePct > 0 && <b>{money(Math.round(((Number(f.declaredValue) || 0) * p.feePct) / 100))}</b>}</label>)}</div>
          <label className="row"><input type="checkbox" checked={f.express} onChange={(e) => set('express', e.target.checked)} /> {t('express')} (+{money(cfg.fees?.express)})</label>
          <Field label={t('brandCode')} hint={t('brandCodeHint')}><input value={f.brandCode} onChange={(e) => set('brandCode', e.target.value.toUpperCase())} maxLength={12} /></Field>
          <div className="alert ok">{t('noPayNow')}</div>
          <ul className="small"><li>{t('feeDelivery', { a: money(cfg.fees?.delivery), b: money(cfg.fees?.freeDeliveryAbove) })}</li><li>{t('feeSla', { a: money(cfg.fees?.slaCreditPerDay) })}</li><li>{t('feeWarranty', { n: cfg.fees?.warrantyDays })}</li></ul>
        </>}
        <Err e={err} />
        <div className="row between">
          <button className="btn ghost" disabled={!step} onClick={() => setStep(step - 1)}>{t('back')}</button>
          {step < 3 ? <button className="btn" disabled={!ok} onClick={() => setStep(step + 1)}>{t('next')}</button> : <Btn onClick={submit}>{t('confirmBooking')}</Btn>}
        </div>
      </Card>
    </div>
  );
}
export default function Page() { return <Guard roles={['customer']}><Book /></Guard>; }
