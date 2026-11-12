import { useState } from 'react';
import { api, money, dt } from '../../lib/api';
import { Btn, Card, Field, Badge, Modal, Table, Err, Spinner, useLoad, useAct } from '../ui';
function Review({ v, onClose, reload }) {
  const act = useAct(), [f, setF] = useState({ verdict: v.output.verdict, priceMin: v.output.priceBand.min, priceMax: v.output.priceBand.max, note: '' }), [err, setErr] = useState(null);
  const go = async () => { setErr(null); try { await api(`/admin/verdict-review/${v._id}`, { method: 'POST', body: { ...f, priceMin: +f.priceMin, priceMax: +f.priceMax } }); onClose(); reload(); } catch (e) { setErr(e); } };
  return (<Modal title="Verdict expert review" onClose={onClose}>
    <div className="thumbs">{v.photos.map((u) => <a key={u} className="th" href={u} target="_blank" rel="noreferrer"><img src={u} alt="" /></a>)}</div>
    <p className="small">Inputs: {JSON.stringify(v.inputs)}<br />Rules v{v.rulesVersion}: {v.output.verdict} · {money(v.output.priceBand.min)}–{money(v.output.priceBand.max)} · conf {v.output.confidence}</p>
    <Field label="Final verdict"><select value={f.verdict} onChange={(e) => setF({ ...f, verdict: e.target.value })}>{['DIY_SAFE', 'REPAIR_WORTH_IT', 'BORDERLINE', 'NOT_WORTH_OR_NOT_REPAIRABLE'].map((x) => <option key={x}>{x}</option>)}</select></Field>
    <div className="grid g2"><Field label="Price min"><input type="number" value={f.priceMin} onChange={(e) => setF({ ...f, priceMin: e.target.value })} /></Field><Field label="Price max"><input type="number" value={f.priceMax} onChange={(e) => setF({ ...f, priceMax: e.target.value })} /></Field></div>
    <Field label="Note (customer ko dikhega)"><input value={f.note} onChange={(e) => setF({ ...f, note: e.target.value })} /></Field><Err e={err} /><Btn onClick={go}>Review complete</Btn></Modal>);
}
export default function Verdict() {
  const q = useLoad(() => api('/admin/verdict-review')), rules = useLoad(() => api('/admin/verdict-rules')), act = useAct(), [sel, setSel] = useState(null), [txt, setTxt] = useState(null), [note, setNote] = useState(''), [err, setErr] = useState(null);
  const active = rules.d?.find((r) => r.status === 'ACTIVE');
  const publish = async () => { setErr(null); try { await api('/admin/verdict-rules', { method: 'POST', body: { rules: JSON.parse(txt), note } }); setTxt(null); rules.reload(); } catch (e) { setErr(e); } };
  return (<>
    <Card title="Low-confidence review queue">{q.busy ? <Spinner /> : <Table rows={q.d || []} onRow={setSel} empty="Queue khaali" cols={[{ h: 'Date', f: (r) => dt(r.createdAt) }, { h: 'Inputs', f: (r) => `${r.inputs.material} / ${r.inputs.damage} / Rs ${r.inputs.value}` }, { h: 'Auto verdict', f: (r) => <Badge s={r.output.verdict} /> }, { h: 'Photos', f: (r) => r.photos.length }]} />}
      {sel && <Review v={sel} onClose={() => setSel(null)} reload={q.reload} />}</Card>
    <Card title={`Rules engine (active: v${active?.version ?? '?'})`} actions={<Btn small onClick={() => setTxt(JSON.stringify(active?.rules, null, 2))}>Edit & publish new version</Btn>}>
      <p className="small mute">AI sirf fields suggest karta hai. Final verdict in rules se aata hai. Har badlav nayi version banata hai, purani verdicts apni rules-version ke saath saved rehti hain.</p>
      {txt !== null && <><textarea rows={16} style={{ fontFamily: 'monospace' }} value={txt} onChange={(e) => setTxt(e.target.value)} /><Field label="Change note"><input value={note} onChange={(e) => setNote(e.target.value)} /></Field><Err e={err} /><div className="row"><Btn onClick={publish}>Publish</Btn><Btn kind="ghost" onClick={() => setTxt(null)}>Cancel</Btn></div></>}
      <Table rows={rules.d || []} cols={[{ h: 'Version', f: (r) => `v${r.version}` }, { h: 'Status', f: (r) => <Badge s={r.status === 'ACTIVE' ? 'APPROVED' : 'PENDING'}>{r.status}</Badge> }, { h: 'Note', f: (r) => r.note }, { h: 'Date', f: (r) => dt(r.createdAt) }]} /></Card></>);
}
