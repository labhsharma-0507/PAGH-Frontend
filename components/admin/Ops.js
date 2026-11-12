import { useState } from 'react';
import { api, money, dt } from '../../lib/api';
import { Btn, Card, Field, Badge, Table, Err, Spinner, useLoad, useAct } from '../ui';
export default function Ops() {
  const act = useAct(), batches = useLoad(() => api('/admin/batches')), orders = useLoad(() => api('/admin/orders?limit=100')), agents = useLoad(() => api('/admin/partners?status=APPROVED&type=AGENT'));
  const [sel, setSel] = useState([]), [agent, setAgent] = useState(''), [slot, setSlot] = useState('morning'), [err, setErr] = useState(null);
  const todo = (orders.d?.items || []).filter((o) => ['BOOKED', 'PICKED_UP', 'READY', 'RETURN_READY'].includes(o.status) && !o.agentId);
  const byPin = todo.reduce((m, o) => { (m[o.pincode] ||= []).push(o); return m; }, {});
  const create = async () => { setErr(null); try { await api('/admin/batches', { method: 'POST', body: { agentId: agent, orderIds: sel, slot } }); setSel([]); batches.reload(); orders.reload(); } catch (e) { setErr(e); } };
  return (<>
    <Card title="Batch pickup/delivery (ek agent, ek route)"><p className="small mute">Same pincode ke orders ek agent ko do: pickup cost per pair kam hoti hai (unit economics ka sabse bada lever).</p>
      {Object.entries(byPin).map(([pin, l]) => <div key={pin} className="card"><b>{pin}</b> <span className="mute small">({l.length} orders)</span><div className="row">{l.map((o) => <label key={o._id} className="tag"><input type="checkbox" checked={sel.includes(o._id)} onChange={() => setSel(sel.includes(o._id) ? sel.filter((x) => x !== o._id) : [...sel, o._id])} /> {o.orderNo} <Badge s={o.status} /></label>)}</div></div>)}
      {!todo.length && <p className="mute">Koi unassigned task nahi</p>}
      <div className="row"><select value={agent} onChange={(e) => setAgent(e.target.value)}><option value="">Agent…</option>{(agents.d || []).map((a) => <option key={a._id} value={a.userId}>{a.businessName}</option>)}</select><input style={{ width: 140 }} value={slot} onChange={(e) => setSlot(e.target.value)} /><Btn disabled={!sel.length || !agent} onClick={create}>Batch banao ({sel.length})</Btn></div><Err e={err} /></Card>
    <Card title="Batches">{batches.busy ? <Spinner /> : <Table rows={batches.d || []} cols={[{ h: 'Date', f: (r) => dt(r.createdAt) }, { h: 'Slot', f: (r) => r.slot }, { h: 'Orders', f: (r) => r.orderIds.length }, { h: 'Status', f: (r) => <Badge s={r.status === 'OPEN' ? 'APPROVED' : 'REJECTED'}>{r.status}</Badge> }, { h: '', f: (r) => r.status === 'OPEN' && <Btn small kind="ghost" onClick={() => act(async () => { await api(`/admin/batches/${r._id}`, { method: 'DELETE' }); batches.reload(); })}>Cancel</Btn> }]} />}</Card></>);
}
