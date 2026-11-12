import { useState } from 'react';
import { api, money, dt } from '../lib/api';
import { Guard } from '../lib/auth';
import { Btn, Card, Field, Badge, Modal, Tabs, Empty, Err, Spinner, Table, useLoad, useAct } from '../components/ui';
import Photos from '../components/Photos';

const HOLD = ['PARTS_DELAY', 'FORCE_MAJEURE', 'CUSTOMER_REQUEST'];
function Job({ o, rates, reload }) {
  const act = useAct(), [ph, setPh] = useState([]), [grade, setGrade] = useState('A'), [chk, setChk] = useState(''), [pre, setPre] = useState(''), [items, setItems] = useState([]), [extra, setExtra] = useState([]);
  const [note, setNote] = useState(''), [hold, setHold] = useState({ reason: HOLD[0], note: '' }), [mt, setMt] = useState('FINAL_QC');
  const post = (path, body, ok) => act(async () => { const r = await api(path, { method: 'POST', body }); setPh([]); reload(); return r; }, ok);
  const st = (to, n) => post(`/orders/${o._id}/status`, { to, note: n }, 'Update ho gaya');
  const c = o.condition, tog = (arr, set, code) => set(arr.includes(code) ? arr.filter((x) => x !== code) : [...arr, code]);
  const RatePick = ({ v, set }) => <div className="row">{rates.map((r) => <label key={r.code} className="tag"><input type="checkbox" checked={v.includes(r.code)} onChange={() => tog(v, set, r.code)} /> {r.name} ({money(r.price)})</label>)}</div>;
  return (
    <Card title={`${o.orderNo} ${o.rework ? '· REDO' : ''}`} actions={<span className="row"><Badge s={o.status}>{o.status}</Badge>{o.hold?.active && <Badge s="HOLD">HOLD</Badge>}</span>}>
      <div className="small">{o.shoe?.brand} {o.shoe?.material} — {o.shoe?.problem} · {o.serviceType} · Declared {money(o.declaredValue)}</div>
      {o.committedDate && <div className="small">⏱ Deadline: <b>{dt(o.committedDate)}</b></div>}
      {c?.customerPhotos?.length > 0 && <><div className="lbl">Customer photos</div><div className="thumbs">{c.customerPhotos.map((u) => <a key={u} className="th" href={u} target="_blank" rel="noreferrer"><img src={u} alt="" /></a>)}</div>{c.preExisting?.length > 0 && <div className="small">Pehle se: {c.preExisting.join(', ')}</div>}</>}
      {!o.partnerId && ['PICKED_UP', 'AT_HUB'].includes(o.status) && <Btn onClick={() => post(`/partner/jobs/${o._id}/accept`, {}, 'Job accept')}>Job accept karo</Btn>}
      {o.partnerId && o.status === 'AT_HUB' && <>
        <h4>Hub condition report</h4><Photos value={ph} onChange={setPh} max={8} folder="condition" label="Hub photos" />
        <div className="grid g2"><Field label="Grade"><select value={grade} onChange={(e) => setGrade(e.target.value)}>{['A', 'B', 'C', 'D'].map((g) => <option key={g}>{g}</option>)}</select></Field><Field label="Checklist notes"><input value={chk} onChange={(e) => setChk(e.target.value)} placeholder="sole worn, upper ok" /></Field></div>
        <Field label="Pehle se maujood damage (alag line)"><textarea value={pre} onChange={(e) => setPre(e.target.value)} /></Field>
        <div className="row"><Btn disabled={!ph.length} onClick={() => post(`/orders/${o._id}/condition/hub`, { photos: ph, grade, checklist: { notes: chk }, preExisting: pre ? pre.split('\n').map((x) => x.trim()).filter(Boolean) : (c?.preExisting || []) }, 'Report bani')}>Condition confirm</Btn>
          <Field label="Repair nahi ho sakta (reason)"><input value={note} onChange={(e) => setNote(e.target.value)} /></Field><Btn kind="danger" disabled={!note} onClick={() => st('NOT_REPAIRABLE', note)}>Not repairable</Btn></div></>}
      {o.partnerId && ['CONDITION_CONFIRMED', 'QUOTE_SENT'].includes(o.status) && <>
        <h4>Quote</h4><RatePick v={items} set={setItems} /><Field label="Note"><input value={note} onChange={(e) => setNote(e.target.value)} /></Field>
        <Btn disabled={!items.length} onClick={() => post(`/orders/${o._id}/quotes`, { items, note }, 'Quote bheja')}>{o.status === 'QUOTE_SENT' ? 'Naya quote bhejo' : 'Quote bhejo'}</Btn>
        {o.status === 'QUOTE_SENT' && <div className="alert info small">Customer ke jawab ka wait. Price cap: {money(o.cap)}</div>}</>}
      {o.status === 'QUOTE_APPROVED' && <div className="alert info small">{o.paid ? 'Payment aa gaya, repair shuru karo.' : 'Customer payment pending.'}</div>}
      {o.partnerId && o.status === 'QUOTE_APPROVED' && o.paid && <Btn onClick={() => st('IN_REPAIR')}>Repair shuru</Btn>}
      {o.partnerId && o.status === 'CONDITION_CONFIRMED' && o.rework && <Btn onClick={() => st('IN_REPAIR')}>Redo repair shuru</Btn>}
      {o.partnerId && ['IN_REPAIR', 'QC'].includes(o.status) && <>
        <h4>Progress photo</h4><Photos value={ph} onChange={setPh} max={4} folder="milestone" />
        <div className="row"><select style={{ width: 160 }} value={mt} onChange={(e) => setMt(e.target.value)}>{['INTAKE', 'QUOTE_BASIS', 'FINAL_QC'].map((x) => <option key={x}>{x}</option>)}</select><Btn disabled={!ph.length} onClick={() => post(`/partner/jobs/${o._id}/milestone`, { type: mt, photos: ph }, 'Photo save')}>Upload</Btn></div></>}
      {o.partnerId && o.status === 'IN_REPAIR' && <>
        <h4>Extra kaam (customer approval + price cap)</h4><RatePick v={extra} set={setExtra} /><Btn kind="ghost" disabled={!extra.length || o.hold?.active} onClick={() => post(`/orders/${o._id}/extra-quote`, { items: extra }, 'Extra quote bheja')}>Extra quote bhejo</Btn>
        {o.hold?.active ? <div className="row"><span className="small">Hold: {o.hold.reason}</span><Btn small kind="ghost" onClick={() => post(`/orders/${o._id}/resume`, {}, 'Resume')}>Resume</Btn></div> : <div className="row"><select style={{ width: 170 }} value={hold.reason} onChange={(e) => setHold({ ...hold, reason: e.target.value })}>{HOLD.map((h) => <option key={h}>{h}</option>)}</select><input value={hold.note} onChange={(e) => setHold({ ...hold, note: e.target.value })} placeholder="reason (customer ko dikhega)" /><Btn small kind="ghost" disabled={!hold.note} onClick={() => post(`/orders/${o._id}/hold`, hold, 'Hold lagaya (SLA pause)')}>SLA hold</Btn></div>}
        <Btn onClick={() => st('QC')}>QC ke liye bhejo</Btn></>}
      {o.partnerId && o.status === 'QC' && <div className="row"><Btn kind="ok" onClick={() => st('READY')}>QC pass: READY</Btn><Btn kind="danger" onClick={() => st('IN_REPAIR', 'QC fail')}>QC fail: wapas repair</Btn></div>}
      {o.partnerId && o.status === 'READY' && <Btn onClick={() => st('OUT_FOR_DELIVERY')}>Delivery ke liye nikalo</Btn>}
      {o.partnerId && ['QUOTE_REJECTED', 'NOT_REPAIRABLE'].includes(o.status) && <><div className="alert warn small">{o.dueExtra > 0 ? `Customer ko return fee ${money(o.dueExtra)} bharni hai.` : 'Wapsi ke liye ready karo.'}</div><Btn disabled={o.dueExtra > 0} onClick={() => st('RETURN_READY')}>Return ke liye ready</Btn></>}
      {o.status === 'RETURN_READY' && <Btn onClick={() => st('OUT_FOR_DELIVERY')}>Return delivery shuru</Btn>}
    </Card>
  );
}
function Panel() {
  const [tab, setTab] = useState('jobs'), jobs = useLoad(() => api('/partner/jobs')), rates = useLoad(() => api('/rates')), earn = useLoad(() => api('/partner/earnings')), sc = useLoad(() => api('/partner/scorecard'));
  return (<><h1>Partner panel</h1><Tabs value={tab} onChange={setTab} tabs={[['jobs', 'Jobs'], ['earn', 'Earnings'], ['score', 'Scorecard']]} />
    {tab === 'jobs' && (jobs.busy ? <Spinner /> : <><Err e={jobs.e} />{!jobs.d?.length && <Card><Empty>Abhi koi job nahi</Empty></Card>}{(jobs.d || []).map((o) => <Job key={o._id} o={o} rates={rates.d || []} reload={jobs.reload} />)}</>)}
    {tab === 'earn' && earn.d && <><div className="grid g3"><div className="kpi"><b>{money(earn.d.pending)}</b><span>Pending payout</span></div><div className="kpi"><b>{money(earn.d.onHold)}</b><span>On hold (claim)</span></div><div className="kpi"><b>{money(earn.d.paid)}</b><span>Paid</span></div></div>
      <Card title="Payouts"><Table rows={earn.d.payouts} cols={[{ h: 'Date', f: (r) => dt(r.createdAt) }, { h: 'Order bill', f: (r) => money(r.gross) }, { h: 'Share', f: (r) => `${r.pct}%` }, { h: 'Amount', f: (r) => money(r.amount + (r.adjustments || []).reduce((s, a) => s + a.amount, 0)) }, { h: 'Status', f: (r) => <Badge s={r.status} /> }, { h: 'Ref', f: (r) => r.reference || '' }]} /></Card></>}
    {tab === 'score' && sc.d && <div className="grid g4">{[['Jobs', sc.d.jobs], ['Delivered', sc.d.delivered], ['On-time %', sc.d.onTimePct ?? '—'], ['Rework %', sc.d.reworkRatePct ?? '—'], ['Claims', sc.d.claims], ['Quality ⭐', sc.d.ratingQuality ?? '—'], ['Comms ⭐', sc.d.ratingComms ?? '—'], ['Reviews', sc.d.reviews]].map(([k, v]) => <div key={k} className="kpi"><b>{v}</b><span>{k}</span></div>)}</div>}
  </>);
}
export default function Page() { return <Guard roles={['partner', 'admin']}><Panel /></Guard>; }
