import Link from 'next/link';
import { useState } from 'react';
import { api, money, dt } from '../lib/api';
import { Guard } from '../lib/auth';
import { useT } from '../lib/i18n';
import { Card, Badge, Spinner, Empty, Err, useLoad } from '../components/ui';
const ACTIVE = ['BOOKED', 'PICKED_UP', 'AT_HUB', 'CONDITION_CONFIRMED', 'QUOTE_SENT', 'QUOTE_APPROVED', 'IN_REPAIR', 'QC', 'READY', 'OUT_FOR_DELIVERY', 'QUOTE_REJECTED', 'NOT_REPAIRABLE', 'RETURN_READY'];
function Orders() {
  const { t } = useT(), { d, e, busy } = useLoad(() => api('/orders')), [all, setAll] = useState(false);
  if (busy) return <Spinner />;
  const list = (d || []).filter((o) => all || ACTIVE.includes(o.status));
  const needs = (o) => ({ QUOTE_SENT: t('needQuote'), CONDITION_CONFIRMED: t('needCond'), QUOTE_APPROVED: o.paid ? null : t('needPay') }[o.status]);
  return (
    <>
      <div className="row between"><h1>{t('navOrders')}</h1><div className="row"><button className={`btn sm ${all ? 'ghost' : ''}`} onClick={() => setAll(false)}>{t('active')}</button><button className={`btn sm ${all ? '' : 'ghost'}`} onClick={() => setAll(true)}>{t('all')}</button><Link className="btn sm" href="/book">+ {t('newOrder')}</Link></div></div>
      <Err e={e} />
      {!list.length && <Card><Empty>{t('noOrders')} <Link href="/check">{t("startCheck")}</Link></Empty></Card>}
      <div className="grid g2">{list.map((o) => (
        <Link key={o._id} href={`/order/${o._id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
          <Card><div className="row between"><b>{o.orderNo}</b><Badge s={o.status}>{t('st_' + o.status)}</Badge></div>
            <div>{o.shoe?.brand || o.shoe?.material || ''} {o.shoe?.problem ? `· ${o.shoe.problem}` : ''}</div>
            <div className="small mute">{dt(o.createdAt)} {o.total ? `· ${money(o.total)}` : ''} {o.rework ? '· Redo' : ''}</div>
            {needs(o) && <div className="alert warn small">{needs(o)}</div>}
            {o.committedDate && !['DELIVERED', 'CLOSED'].includes(o.status) && <div className="small">⏱ {t('committed')}: <b>{dt(o.committedDate)}</b></div>}
          </Card>
        </Link>))}</div>
    </>
  );
}
export default function Page() { return <Guard roles={['customer']}><Orders /></Guard>; }
