import { useState } from 'react';
import { api, dt } from '../../lib/api';
import { Btn, Card, Badge, Tabs, Table, Spinner, useLoad, useAct } from '../ui';
function Queue() {
  const [st, setSt] = useState(''), { d, busy, reload } = useLoad(() => api('/admin/notifications' + (st ? `?status=${st}` : '')), [st]), act = useAct();
  return <Card title="Notification queue (email/SMS/WhatsApp/webhook)" actions={<select style={{ width: 130 }} value={st} onChange={(e) => setSt(e.target.value)}><option value="">All</option>{['PENDING', 'SENT', 'FAILED'].map((s) => <option key={s}>{s}</option>)}</select>}>
    <p className="small mute">API keys (Resend/Twilio/webhook) na ho to sirf in-app notifications chalte hain aur yahan kuch nahi aata.</p>
    {busy && !d ? <Spinner /> : <Table rows={d || []} empty="Koi external notification nahi" cols={[{ h: 'Date', f: (r) => dt(r.createdAt) }, { h: 'Channel', f: (r) => r.channel }, { h: 'Event', f: (r) => r.event }, { h: 'Status', f: (r) => <Badge s={r.status} /> }, { h: 'Tries', f: (r) => r.attempts }, { h: 'Error', f: (r) => <span className="small">{r.error}</span> }, { h: '', f: (r) => r.status === 'FAILED' && <Btn small kind="ghost" onClick={() => act(async () => { await api(`/admin/notifications/${r._id}/retry`, { method: 'POST' }); reload(); })}>Retry</Btn> }]} />}</Card>;
}
function Audit() {
  const [a, setA] = useState(''), { d, busy } = useLoad(() => api('/admin/audit?limit=100' + (a ? `&action=${encodeURIComponent(a)}` : '')), [a]);
  return <Card title="Audit log (append-only)" actions={<input style={{ width: 180 }} placeholder="action (LOGIN, CLAIM…)" value={a} onChange={(e) => setA(e.target.value)} />}>
    {busy && !d ? <Spinner /> : <Table rows={d || []} cols={[{ h: 'Time', f: (r) => dt(r.createdAt) }, { h: 'Actor', f: (r) => r.role }, { h: 'Action', f: (r) => <b>{r.action}</b> }, { h: 'Entity', f: (r) => `${r.entity} ${r.entityId || ''}` }, { h: 'IP', f: (r) => r.ip }, { h: 'Change', f: (r) => <span className="small">{r.after ? JSON.stringify(r.after).slice(0, 110) : ''}</span> }]} />}</Card>;
}
export default function System({ can }) {
  const [t, setT] = useState(can('notifications') ? 'q' : 'a');
  return <><Tabs value={t} onChange={setT} tabs={[...(can('notifications') ? [['q', 'Notification queue']] : []), ...(can('super') ? [['a', 'Audit log']] : [])]} />{t === 'q' ? <Queue /> : <Audit />}</>;
}
