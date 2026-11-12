import { useState } from 'react';
import { api } from '../lib/api';
import { Guard } from '../lib/auth';
import { Btn, Card, Field, Badge, Modal, Empty, Err, Spinner, useLoad } from '../components/ui';
import { QRScan } from '../components/QR';
const INFO = { CUSTOMER_DROPS_SHOES: 'Customer jootein dene aayega (OTP + QR)', AGENT_COLLECTS: 'Agent collect karega', CUSTOMER_COLLECTS: 'Customer collect karega (delivery OTP)' };
function D() {
  const { d, busy, e, reload } = useLoad(() => api('/droppoint/orders')), [sel, setSel] = useState(null), [qr, setQr] = useState(''), [otp, setOtp] = useState(''), [err, setErr] = useState(null);
  const type = sel?.status === 'BOOKED' ? 'DROP_INTAKE' : 'DROP_HANDOVER';
  const go = async () => { setErr(null); try { await api('/custody/scan', { method: 'POST', body: { qr, type, otp } }); setSel(null); setQr(''); setOtp(''); reload(); } catch (x) { setErr(x); } };
  if (busy) return <Spinner />;
  return (<><h1>Drop-point panel</h1><Err e={e} />{!d?.length && <Card><Empty>Abhi koi order nahi</Empty></Card>}
    {(d || []).map((o) => <Card key={o._id}><div className="row between"><div><b>{o.orderNo}</b> · {o.customer} <Badge s={o.status} /><div className="small mute">{INFO[o.expect]}</div><div className="small">{o.shoe?.brand} {o.shoe?.material}</div></div>
      {['BOOKED', 'OUT_FOR_DELIVERY'].includes(o.status) && <Btn small onClick={() => setSel(o)}>{o.status === 'BOOKED' ? 'Jootein receive karo' : 'Customer ko handover'}</Btn>}</div></Card>)}
    {sel && <Modal title={`${sel.orderNo} · ${type}`} onClose={() => setSel(null)}><p className="small">{type === 'DROP_INTAKE' ? 'Customer ka QR scan karo aur pickup OTP lo.' : 'Customer ka QR scan karo aur delivery OTP lo.'}</p><QRScan onScan={setQr} />{qr && <div className="alert ok">QR: {qr}</div>}<Field label="OTP"><input value={otp} onChange={(x) => setOtp(x.target.value)} maxLength={4} inputMode="numeric" /></Field><Err e={err} /><Btn disabled={!qr || otp.length < 4} onClick={go}>Confirm</Btn></Modal>}</>);
}
export default function Page() { return <Guard roles={['droppoint']}><D /></Guard>; }
