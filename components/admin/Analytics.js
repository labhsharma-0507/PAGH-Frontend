import { api, money, base, getToken } from '../../lib/api';
import { Card, Btn, Table, Err, Spinner, useLoad } from '../ui';
export default function Analytics() {
  const a = useLoad(() => api('/admin/analytics'));
  if (a.busy) return <Spinner />;
  const d = a.d; if (!d) return <Err e={a.e} />;
  const csv = async () => { const r = await fetch(base() + '/admin/analytics?format=csv', { headers: { Authorization: 'Bearer ' + getToken() }, credentials: 'include' }); const u = URL.createObjectURL(await r.blob()); Object.assign(document.createElement('a'), { href: u, download: 'analytics.csv' }).click(); };
  const K = ({ k, v }) => <div className="kpi"><b>{v ?? '—'}</b><span>{k}</span></div>;
  const f = d.funnel;
  return (<>
    <div className="row between"><h2>Analytics</h2><Btn kind="ghost" onClick={csv}>Export CSV</Btn></div>
    <Card title="Funnel"><div className="grid g4"><K k="Verdicts" v={f.verdicts} /><K k="Orders" v={f.orders} /><K k="Quotes sent" v={f.quotesSent} /><K k="Quotes approved" v={f.quotesApproved} /><K k="Delivered" v={f.delivered} /></div></Card>
    <div className="grid g4"><K k="Quote approval %" v={d.quoteApprovalPct} /><K k="SLA hit % (hub)" v={d.slaHitRatePct} /><K k="Avg TAT (days)" v={d.avgTatDays} /><K k="Repeat customers %" v={d.repeatPct} />
      <K k="Claim rate %" v={d.claims.ratePct} /><K k="Claims paid" v={money(d.claims.paid)} /><K k="SLA credits" v={money(d.slaCredits)} /><K k="Payouts" v={money(d.payouts)} /></div>
    <Card title="Revenue mix"><div className="grid g3"><K k="Services (collected)" v={money(d.revenueMix.services)} /><K k="Shop" v={money(d.revenueMix.shop)} /><K k="Ads" v={money(d.revenueMix.ads)} /></div>
      <div className="alert info small">Gross margin estimate: <b>{money(d.grossMarginEstimate.amount)}</b>. {d.grossMarginEstimate.note}</div></Card>
    <Card title="CSAT"><div className="grid g4"><K k="Quality" v={d.csat.quality} /><K k="Communication" v={d.csat.communication} /><K k="Delivery" v={d.csat.delivery} /><K k="Reviews" v={d.csat.reviews} /></div></Card>
    <Card title="Cohorts (first order month → repeat within 90 days)"><Table rows={Object.entries(d.cohorts).map(([m, c]) => ({ id: m, m, ...c }))} cols={[{ h: 'Month', f: (r) => r.m }, { h: 'Customers', f: (r) => r.users }, { h: 'Repeat ≤90d', f: (r) => `${r.repeat90} (${r.users ? Math.round((r.repeat90 * 100) / r.users) : 0}%)` }]} /></Card>
  </>);
}
