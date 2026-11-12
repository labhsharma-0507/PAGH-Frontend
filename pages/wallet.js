import { api, money, dt } from '../lib/api';
import { Guard } from '../lib/auth';
import { useT } from '../lib/i18n';
import { Card, Table, Spinner, useLoad } from '../components/ui';
function W() {
  const { t } = useT(), { d, busy } = useLoad(() => api('/wallet'));
  if (busy) return <Spinner />;
  return (<><h1>{t('navWallet')}</h1><Card><div className="mute small">{t('balance')}</div><div className="big">{money(d.balance)}</div><p className="small mute">{t('walletNote')}</p></Card>
    <Card title={t('ledger')}><Table empty={t('noEntries')} rows={d.ledger} cols={[{ h: t('date'), f: (r) => dt(r.createdAt) }, { h: t('reason'), f: (r) => r.reason + (r.note ? ` · ${r.note}` : '') }, { h: t('amount'), f: (r) => <b style={{ color: r.type === 'CREDIT' ? 'var(--ok)' : 'var(--bad)' }}>{r.type === 'CREDIT' ? '+' : '−'}{money(r.amount)}</b> }]} /></Card></>);
}
export default function Page() { return <Guard roles={['customer']}><W /></Guard>; }
