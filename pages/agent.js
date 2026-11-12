import { useState } from 'react';
import { api, dt } from '../lib/api';
import { Guard } from '../lib/auth';
import { Btn, Card, Field, Badge, Modal, Empty, Err, Spinner, useLoad, useAct } from '../components/ui';
import { QRScan } from '../components/QR';

const TASK = {
  PICKUP: ['📦 Pickup', 'PICKUP', true], COLLECT_FROM_DROPPOINT: ['🏪 Drop-point se uthao', 'AGENT_PICKUP', false], HUB_DROP: ['🏭 Hub par intake', 'HUB_INTAKE', false],
  START_DELIVERY: ['🚚 Delivery shuru', null, false], DELIVERY: ['✅ Delivery (OTP)', 'DELIVERY', true], AT_DROPPOINT_AWAIT_CUSTOMER: ['⏳ Drop-point par customer ka wait', null, false],
};
function Scan({ t, o, onClose, onDone }) {
  const act = useAct(), [qr, setQr] = useState(''), [otp, setOtp] = useState(''), [err, setErr] = useState(null);
  const [label, type, needOtp] = TASK[t];
  const go = async () => { setErr(null); try { const geo = await new Promise((res) => navigator.geolocation ? navigator.geolocation.getCurrentPosition((p) => res({ lat: p.coords.latitude, lng: p.coords.longitude }), () => res(undefined), { timeout: 3000 }) : res(undefined)); await api('/custody/scan', { method: 'POST', body: { qr, type, otp: needOtp ? otp : undefined, geo } }); onDone(); } catch (e) { setErr(e); } };
  return <Modal title={`${label} · ${o.orderNo}`} onClose={onClose}>
    <p className="small">{o.address}</p><QRScan onScan={setQr} />{qr && <div className="alert ok">QR: <b>{qr}</b></div>}
    {needOtp && <Field label="Customer ka OTP"><input value={otp} onChange={(e) => setOtp(e.target.value)} inputMode="numeric" maxLength={4} /></Field>}
    <Err e={err} /><Btn disabled={!qr || (needOtp && otp.length < 4)} onClick={go}>Confirm scan</Btn></Modal>;
}
function A() {
  const act = useAct(), { d, busy, e, reload } = useLoad(() => api('/agent/tasks')), [sel, setSel] = useState(null);
  if (busy) return <Spinner />;
  const groups = (d || []).reduce((m, o) => { (m[o.batchKey] ||= []).push(o); return m; }, {});
  return (<><div className="row between"><h1>Agent tasks</h1><Btn kind="ghost" onClick={reload}>Refresh</Btn></div><Err e={e} />
    {!d?.length && <Card><Empty>Abhi koi task nahi</Empty></Card>}
    {Object.entries(groups).map(([k, list]) => <Card key={k} title={`Area/Slot: ${k.replace('|', ' · ')}`}>{list.map((o) => (
      <div key={o._id} className="row between" style={{ padding: '8px 0', borderBottom: '1px solid var(--line)' }}>
        <div><b>{o.orderNo}</b> <Badge s={o.status} /><div className="small">{TASK[o.task][0]} · {o.address}</div><div className="small mute">{o.shoe?.brand} {o.slot}</div></div>
        {o.task === 'START_DELIVERY' ? <Btn small onClick={() => act(async () => { await api(`/orders/${o._id}/status`, { method: 'POST', body: { to: 'OUT_FOR_DELIVERY' } }); reload(); }, 'Delivery shuru')}>Nikalo</Btn> : TASK[o.task][1] ? <Btn small onClick={() => setSel(o)}>Scan</Btn> : <span className="small mute">—</span>}
      </div>))}</Card>)}
    {sel && <Scan t={sel.task} o={sel} onClose={() => setSel(null)} onDone={() => { setSel(null); reload(); }} />}</>);
}
export default function Page() { return <Guard roles={['agent', 'admin']}><A /></Guard>; }
