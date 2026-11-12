import { useState } from 'react';
import { api, money, dt } from '../../lib/api';
import { Btn, Card, Field, Badge, Modal, Table, Err, Spinner, useLoad, useAct } from '../ui';
const NEXT = { SUBMITTED: ['UNDER_REVIEW'], UNDER_REVIEW: ['INFO_NEEDED', 'APPROVED', 'PARTIALLY_APPROVED', 'REJECTED'], INFO_NEEDED: ['UNDER_REVIEW'], APPROVED: ['SETTLED'], PARTIALLY_APPROVED: ['SETTLED'] };
function Detail({ id, onClose, canSettle, reload }) {
  const act = useAct(), { d, busy, reload: rd } = useLoad(() => api(`/admin/claims/${id}/detail`), [id]);
  const [f, setF] = useState({ status: '', settlement: 'COMPENSATION', amount: '', notes: '' }), [err, setErr] = useState(null);
  if (busy || !d) return <Modal title="Claim" onClose={onClose} wide><Spinner /></Modal>;
  const { claim: c, order: o, condition: cond, custody, milestones, cover, user } = d, opts = (NEXT[c.status] || []).filter((s) => s !== 'SETTLED' || canSettle);
  const go = async () => { setErr(null); try { await api(`/admin/claims/${id}`, { method: 'PATCH', body: { status: f.status, settlement: f.settlement, amount: Number(f.amount) || undefined, notes: f.notes } }); rd(); reload(); setF({ ...f, status: '' }); } catch (e) { setErr(e); } };
  return (
    <Modal title={`${c.claimNo} · ${c.type}`} onClose={onClose} wide>
      <div className="row between"><span><b>{user?.name}</b> · {o.orderNo}</span><Badge s={c.status} /></div>
      <p style={{ whiteSpace: 'pre-wrap' }}>{c.text}</p>
      <div className="grid g2">
        <div><h4>Customer evidence</h4><div className="thumbs">{c.evidence.map((u) => <a key={u} className="th" href={u} target="_blank" rel="noreferrer"><img src={u} alt="" /></a>)}</div>
          <h4>Intake: customer photos (grade {cond?.grade})</h4><div className="thumbs">{cond?.customerPhotos.map((u) => <a key={u} className="th" href={u} target="_blank" rel="noreferrer"><img src={u} alt="" /></a>)}</div>{cond?.preExisting?.length > 0 && <div className="small">Pre-existing: {cond.preExisting.join(', ')}</div>}</div>
        <div><h4>Hub photos & milestones</h4><div className="thumbs">{[...(cond?.hubPhotos || []), ...milestones.flatMap((m) => m.photos)].map((u) => <a key={u} className="th" href={u} target="_blank" rel="noreferrer"><img src={u} alt="" /></a>)}</div>
          <h4>Custody</h4>{custody.map((x) => <div key={x._id} className="small">{x.type} · {x.role} · {dt(x.createdAt)}</div>)}</div></div>
      <div className="alert info small">Cover: plan {cover.plan || 'none'} · declared {money(cover.declared)} · depreciated {money(cover.depreciated)} · <b>max compensation {money(cover.maxCompensation)}</b>. Order bill {money(o.total)}, paid {money(o.paidAmount)}.</div>
      {c.settlement && <div className="alert ok">{c.settlement} {money(c.amount)} {c.notes}</div>}
      {opts.length > 0 && <><h4>Decision</h4><div className="grid g3"><Field label="Next status"><select value={f.status} onChange={(e) => setF({ ...f, status: e.target.value })}><option value="">—</option>{opts.map((s) => <option key={s}>{s}</option>)}</select></Field>
        {['APPROVED', 'PARTIALLY_APPROVED'].includes(f.status) && <><Field label="Settlement"><select value={f.settlement} onChange={(e) => setF({ ...f, settlement: e.target.value })}>{['COMPENSATION', 'CREDIT', 'REFUND', 'REDO'].map((s) => <option key={s}>{s}</option>)}</select></Field>{f.settlement !== 'REDO' && <Field label="Amount (Rs)"><input type="number" value={f.amount} onChange={(e) => setF({ ...f, amount: e.target.value })} /></Field>}</>}</div>
        <Field label="Notes (customer ko dikhega)"><input value={f.notes} onChange={(e) => setF({ ...f, notes: e.target.value })} /></Field><Err e={err} /><Btn disabled={!f.status} onClick={go}>Update claim</Btn>
        {!canSettle && c.status.includes('APPROVED') && <p className="small mute">Settlement Finance/Super admin karega.</p>}</>}
    </Modal>
  );
}
export default function Claims({ can }) {
  const [st, setSt] = useState(''), [sel, setSel] = useState(null), { d, busy, reload } = useLoad(() => api('/admin/claims' + (st ? `?status=${st}` : '')), [st]), res = useLoad(() => api('/admin/claims/reserve'));
  return (<>
    {res.d && <Card title="Reserve"><div className="grid g4"><div className="kpi"><b>{money(res.d.reserve)}</b><span>Target ({res.d.reservePct}%)</span></div><div className="kpi"><b>{money(res.d.claimsPaid)}</b><span>Claims paid</span></div><div className="kpi"><b>{money(res.d.slaCredits)}</b><span>SLA credits</span></div><div className="kpi"><b style={{ color: res.d.healthy ? 'var(--ok)' : 'var(--bad)' }}>{money(res.d.remaining)}</b><span>Remaining</span></div></div></Card>}
    <Card title="Claims" actions={<select style={{ width: 170 }} value={st} onChange={(e) => setSt(e.target.value)}><option value="">All</option>{['SUBMITTED', 'UNDER_REVIEW', 'INFO_NEEDED', 'APPROVED', 'PARTIALLY_APPROVED', 'REJECTED', 'SETTLED'].map((s) => <option key={s}>{s}</option>)}</select>}>
      {busy && !d ? <Spinner /> : <Table rows={d || []} onRow={(r) => setSel(r._id)} cols={[{ h: 'Claim', f: (r) => <b>{r.claimNo}</b> }, { h: 'Type', f: (r) => r.type }, { h: 'Status', f: (r) => <Badge s={r.status} /> }, { h: 'Settlement', f: (r) => r.settlement ? `${r.settlement} ${r.amount ? money(r.amount) : ''}` : '' }, { h: 'Date', f: (r) => dt(r.createdAt) }]} />}
      {sel && <Detail id={sel} canSettle={can('claims:settle')} onClose={() => setSel(null)} reload={() => { reload(); res.reload(); }} />}</Card></>);
}
