import { useRouter } from 'next/router';
import { api, money, day } from '../../lib/api';
import { Guard } from '../../lib/auth';
import { Card, Err, Spinner, useLoad } from '../../components/ui';
function Inv() {
  const r = useRouter(), { d, e, busy } = useLoad(() => (r.query.id ? api(`/orders/${r.query.id}/invoice`) : Promise.resolve(null)), [r.query.id]);
  if (busy || !d) return e ? <Err e={e} /> : <Spinner />;
  return (
    <Card title={`Invoice ${d.invoiceNo}`} actions={<button className="btn sm" onClick={() => window.print()}>Print / PDF</button>}>
      <div className="grid g2"><div><b>Seller</b><div>{d.seller.name || 'Footwear SOS'}</div><div className="small mute">GSTIN: {d.seller.gstin || '—'}</div></div><div><b>Bill to</b><div>{d.buyer.name}</div><div className="small">{d.buyer.address}</div></div></div>
      <p className="small">Date: {day(d.date)}</p>
      <table><thead><tr><th>Description</th><th className="right">Amount</th></tr></thead><tbody>{d.lines.map((l, i) => <tr key={i}><td>{l.description}</td><td className="right">{money(l.amount)}</td></tr>)}
        <tr><td>Taxable value</td><td className="right">{money(d.taxableValue)}</td></tr><tr><td>GST ({d.gstPct}% incl.)</td><td className="right">{money(d.gst)}</td></tr><tr><td><b>Total</b></td><td className="right"><b>{money(d.total)}</b></td></tr></tbody></table>
      <p className="small mute">{d.note}</p>
    </Card>
  );
}
export default function Page() { return <Guard roles={['customer', 'admin']}><Inv /></Guard>; }
