import { useState } from 'react';
import { api, money, dt } from '../../lib/api';
import { Btn, Card, Field, Badge, Modal, Table, Err, Spinner, useLoad, useAct } from '../ui';
const STATUSES = ['BOOKED', 'PICKED_UP', 'AT_HUB', 'CONDITION_CONFIRMED', 'QUOTE_SENT', 'QUOTE_APPROVED', 'IN_REPAIR', 'QC', 'READY', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CLOSED', 'QUOTE_REJECTED', 'NOT_REPAIRABLE', 'RETURN_READY', 'CANCELLED'];
function Detail({ id, onClose, canWrite, canOverride }) {
  const act = useAct(), { d, busy, reload } = useLoad(() => api('/admin/orders/' + id), [id]);
  const partners = useLoad(() => (canWrite ? api('/admin/partners?status=APPROVED') : Promise.resolve([])));
  const [f, setF] = useState({ partnerId: '', agentId: '', to: 'QUOTE_SENT', note: '' });
  if (busy || !d) return <Modal title="Order" onClose={onClose} wide><Spinner /></Modal>;
  const { order: o, condition: c, quotes, custody, job, payments, claims, user } = d;
  const post = (p, b, ok) => act(async () => { await api(p, { method: 'POST', body: b }); reload(); }, ok);
  const list = (t) => (partners.d || []).filter((p) => (t === 'agent' ? p.type === 'AGENT' : p.type !== 'AGENT' && p.type !== 'DROP_POINT'));
  return (
    <Modal title={`${o.orderNo} · ${o.status}`} onClose={onClose} wide>
      <div className="grid g2">
        <div>
          <p><b>{user?.name}</b> · {user?.phone} · {user?.email}</p><p className="small">{o.shoe?.brand} {o.shoe?.material} · {o.serviceType} · Declared {money(o.declaredValue)} · Plan {o.plan}<br />{o.pickupMode}: {o.address}</p>
          <p className="small">Total {money(o.total)} (cap {money(o.cap)}) · Paid {money(o.paidAmount)} · Due extra {money(o.dueExtra)}<br />Deadline: {dt(o.committedDate)} {o.hold?.active && <Badge s="HOLD">{o.hold.reason}</Badge>} · SLA credited: {money(o.slaCreditTotal)}</p>
          <h4>Timeline</h4><ul className="tl">{o.events.map((e, i) => <li key={i}>{e.from && e.from !== e.to ? `${e.from} → ` : ''}<b>{e.to}</b> <span className="mute small">{e.by} · {dt(e.ts)} {e.note}</span></li>)}</ul>
          <h4>Custody (append-only)</h4>{custody.map((x) => <div key={x._id} className="small">✔ {x.type} · {x.role} · {dt(x.createdAt)} {x.otpVerified && '· OTP ✓'}</div>)}
        </div>
        <div>
          {c && <><h4>Condition (v{c.version}) grade {c.grade} {c.lockedAt && <Badge s="APPROVED">locked</Badge>}</h4>{c.disputedReason && <div className="alert warn">Dispute: {c.disputedReason}{canWrite && <div className="row"><Btn small kind="ghost" onClick={() => post(`/admin/orders/${o._id}/condition/resolve`, { action: 'REOPEN' }, 'Reopen: hub dobara report banayega')}>Reopen</Btn><Btn small onClick={() => post(`/admin/orders/${o._id}/condition/resolve`, { action: 'CONFIRM' }, 'Report final')}>Report final</Btn></div>}</div>}
            <div className="thumbs">{[...c.customerPhotos, ...c.hubPhotos].map((u) => <a key={u} className="th" href={u} target="_blank" rel="noreferrer"><img src={u} alt="" /></a>)}</div>{c.preExisting?.length > 0 && <div className="small">Pre-existing: {c.preExisting.join(', ')}</div>}</>}
          <h4>Quotes</h4>{quotes.map((q) => <div key={q._id} className="small">v{q.version} {q.extraWorkOf ? '(extra)' : ''} · {money(q.total)} · <Badge s={q.status} /></div>)}
          <h4>Payments</h4>{payments.map((p) => <div key={p._id} className="small">{p.kind} {money(p.amount + (p.credit || 0))} · <Badge s={p.status} /> {p.mock && 'mock'}</div>)}
          {claims.length > 0 && <><h4>Claims</h4>{claims.map((x) => <div key={x._id} className="small">{x.claimNo} {x.type} <Badge s={x.status} /></div>)}</>}
          {job?.milestones?.length > 0 && <><h4>Milestones</h4>{job.milestones.map((m, i) => <div key={i} className="small">{m.type} · {dt(m.ts)} · {m.photos.length} photos</div>)}</>}
        </div>
      </div>
      {canWrite && <><hr /><h4>Assign</h4><div className="row"><select value={f.partnerId} onChange={(e) => setF({ ...f, partnerId: e.target.value })}><option value="">Partner…</option>{list('partner').map((p) => <option key={p._id} value={p.userId}>{p.businessName}</option>)}</select>
        <select value={f.agentId} onChange={(e) => setF({ ...f, agentId: e.target.value })}><option value="">Agent…</option>{list('agent').map((p) => <option key={p._id} value={p.userId}>{p.businessName}</option>)}</select>
        <Btn small disabled={!f.partnerId && !f.agentId} onClick={() => post(`/admin/orders/${o._id}/assign`, { partnerId: f.partnerId || undefined, agentId: f.agentId || undefined }, 'Assign ho gaya')}>Assign</Btn></div></>}
      {canOverride && <><h4>Emergency status override (audit-logged)</h4><div className="row"><select value={f.to} onChange={(e) => setF({ ...f, to: e.target.value })}>{STATUSES.map((s) => <option key={s}>{s}</option>)}</select><input style={{ flex: 1 }} placeholder="Reason (zaroori)" value={f.note} onChange={(e) => setF({ ...f, note: e.target.value })} /><Btn small kind="danger" disabled={!f.note} onClick={() => confirm('Force status change?') && post(`/admin/orders/${o._id}/override`, { to: f.to, note: f.note }, 'Override ho gaya')}>Override</Btn></div></>}
    </Modal>
  );
}
export default function Orders({ me, can }) {
  const [f, setF] = useState({ status: '', q: '', sla: '' }), [sel, setSel] = useState(null);
  const qs = new URLSearchParams(Object.fromEntries(Object.entries(f).filter(([, v]) => v))).toString();
  const { d, busy, e } = useLoad(() => api('/admin/orders?' + qs), [qs]);
  return (<Card title="Orders" actions={<div className="row"><input style={{ width: 150 }} placeholder="Order no" value={f.q} onChange={(e) => setF({ ...f, q: e.target.value })} /><select style={{ width: 170 }} value={f.status} onChange={(e) => setF({ ...f, status: e.target.value })}><option value="">All status</option>{STATUSES.map((s) => <option key={s}>{s}</option>)}</select><label className="row small"><input type="checkbox" checked={f.sla === 'risk'} onChange={(e) => setF({ ...f, sla: e.target.checked ? 'risk' : '' })} /> SLA risk</label></div>}>
    <Err e={e} />{busy && !d ? <Spinner /> : <Table rows={d?.items || []} onRow={(r) => setSel(r._id)} cols={[{ h: 'Order', f: (r) => <b>{r.orderNo}{r.rework ? ' ↻' : ''}</b> }, { h: 'Status', f: (r) => <Badge s={r.status} /> }, { h: 'Shoe', f: (r) => `${r.shoe?.brand || ''} ${r.shoe?.material || ''}` }, { h: 'Pin', f: (r) => r.pincode }, { h: 'Bill', f: (r) => money(r.total) }, { h: 'Deadline', f: (r) => <span style={{ color: r.delayed ? 'var(--bad)' : undefined }}>{dt(r.committedDate)}{r.delayed && ' ⚠'}</span> }, { h: 'Created', f: (r) => dt(r.createdAt) }]} />}
    <div className="small mute">{d?.total ?? 0} orders</div>
    {sel && <Detail id={sel} onClose={() => setSel(null)} canWrite={can('orders')} canOverride={can('orders:override')} />}</Card>);
}
