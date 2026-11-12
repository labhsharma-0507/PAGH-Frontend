import { api, money, dt } from '../lib/api';
import { Guard } from '../lib/auth';
import { Card, Badge, Table, Spinner, useLoad } from '../components/ui';
function B() {
  const s = useLoad(() => api('/brand/summary')), o = useLoad(() => api('/brand/orders'));
  if (s.busy) return <Spinner />;
  const d = s.d;
  return (<><h1>{d.brand.name} · Brand panel</h1><Card>Customers ko ye code do: <b className="big">{d.brand.code}</b> (booking ke time "Brand code" mein). Commission: {d.brand.commissionPct}%</Card>
    <div className="grid g4">{[['Orders', d.orders], ['Delivered', d.delivered], ['Revenue', money(d.revenue)], ['Commission pending', money(d.commissionPending)], ['Commission paid', money(d.commissionPaid)]].map(([k, v]) => <div key={k} className="kpi"><b>{v}</b><span>{k}</span></div>)}</div>
    <Card title="Referred orders">{o.d && <Table rows={o.d} cols={[{ h: 'Order', f: (r) => r.orderNo }, { h: 'Shoe', f: (r) => `${r.shoe?.brand || ''} ${r.shoe?.material || ''}` }, { h: 'Status', f: (r) => <Badge s={r.status} /> }, { h: 'Bill', f: (r) => money(r.total) }, { h: 'Date', f: (r) => dt(r.createdAt) }]} />}</Card></>);
}
export default function Page() { return <Guard roles={['brand']}><B /></Guard>; }
