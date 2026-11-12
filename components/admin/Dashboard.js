import { api, money } from '../../lib/api';
import { Card, Badge, Btn, Err, Spinner, useLoad, useAct } from '../ui';
export default function Dashboard({ go }) {
  const s = useLoad(() => api('/admin/stats')), act = useAct();
  if (s.busy) return <Spinner />;
  const d = s.d; if (!d) return <Err e={s.e} />;
  const K = ({ k, v, to, tone }) => <div className="kpi" onClick={() => to && go(to)} style={{ cursor: to ? 'pointer' : 'default', borderColor: tone === 'bad' ? 'var(--bad)' : undefined }}><b>{v}</b><span>{k}</span></div>;
  return (<>
    <div className="grid g4"><K k="Orders" v={d.orders} to="orders" /><K k="Delivered" v={d.delivered} /><K k="Revenue (collected)" v={money(d.revenue)} /><K k="SLA at risk (24h)" v={d.slaAtRisk} to="orders" tone={d.slaAtRisk ? 'bad' : ''} />
      <K k="Open claims" v={d.claimsOpen} to="claims" /><K k="Partner applications" v={d.pendingPartners} to="partners" /><K k="Verdict review queue" v={d.reviewQueue} to="verdict" /></div>
    <Card title="Claims/credits reserve" actions={<Badge s={d.reserve.healthy ? 'APPROVED' : 'REJECTED'}>{d.reserve.healthy ? 'Healthy' : 'Over reserve'}</Badge>}>
      <div className="grid g4"><K k={`Target (${d.reserve.pct}% of revenue)`} v={money(d.reserve.target)} /><K k="Used (claims + SLA credits)" v={money(d.reserve.used)} /></div><p className="small mute">Reserve % ek assumption hai. Pilot data se Settings mein badlo.</p></Card>
    <Card title="Orders by status"><div className="row">{Object.entries(d.byStatus).map(([k, v]) => <span key={k} className="tag">{k}: <b>{v}</b></span>)}</div></Card>
    <Card title="Background jobs"><p className="small mute">SLA credit, quote reminders/expiry, at-risk alerts, auto-close, notification queue — server har 5 min / 20 sec mein khud chalata hai. Yahan manually bhi chala sakte ho.</p>
      <Btn kind="ghost" onClick={() => act(async () => { const r = await api('/admin/jobs/run', { method: 'POST' }); return r; }, 'Jobs chal gaye').then(() => s.reload())}>Run jobs now</Btn></Card>
  </>);
}
