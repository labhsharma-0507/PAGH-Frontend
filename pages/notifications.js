import { api, dt } from '../lib/api';
import { Guard } from '../lib/auth';
import { useT } from '../lib/i18n';
import { Btn, Card, Empty, Spinner, useLoad } from '../components/ui';
function N() {
  const { t } = useT(), { d, busy, reload } = useLoad(() => api('/notifications'));
  if (busy) return <Spinner />;
  return (<><div className="row between"><h1>{t('notifications')}</h1><Btn kind="ghost" onClick={async () => { await api('/notifications/read-all', { method: 'POST' }); reload(); }}>{t('markRead')}</Btn></div>
    {!d.items.length && <Card><Empty>{t('noNotifs')}</Empty></Card>}
    {d.items.map((n) => <Card key={n._id} className={n.read ? '' : 'unread'}><div className="row between"><b>{n.title}</b><span className="small mute">{dt(n.createdAt)}</span></div><div>{n.body}</div></Card>)}</>);
}
export default function Page() { return <Guard><N /></Guard>; }
