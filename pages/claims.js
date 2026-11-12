import Link from 'next/link';
import { useState } from 'react';
import { api, money, dt } from '../lib/api';
import { Guard } from '../lib/auth';
import { useT } from '../lib/i18n';
import { Btn, Card, Badge, Field, Empty, Spinner, useLoad, useAct } from '../components/ui';
import Photos from '../components/Photos';
function Row({ c, reload }) {
  const { t } = useT(), act = useAct(), [txt, setTxt] = useState(''), [ev, setEv] = useState([]);
  return (
    <Card><div className="row between"><b>{c.claimNo} · {t('claim_' + c.type)}</b><Badge s={c.status}>{c.status}</Badge></div>
      <p style={{ whiteSpace: 'pre-wrap' }}>{c.text}</p>
      <div className="thumbs">{c.evidence.map((u) => <a key={u} className="th" href={u} target="_blank" rel="noreferrer"><img src={u} alt="" /></a>)}</div>
      {c.notes && <div className="alert info">{c.notes}</div>}
      {c.settlement && <div className="alert ok">{c.settlement}{c.amount ? `: ${money(c.amount)}` : ''}</div>}
      {c.redoOrderId && <Link href={`/order/${c.redoOrderId}`}>{t('redoOrder')}</Link>}
      <div className="small mute">{dt(c.createdAt)}</div>
      {c.status === 'INFO_NEEDED' && <><Field label={t('moreInfo')}><textarea value={txt} onChange={(e) => setTxt(e.target.value)} /></Field><Photos value={ev} onChange={setEv} max={6} folder="claim" /><Btn onClick={() => act(async () => { await api(`/claims/${c._id}/info`, { method: 'POST', body: { text: txt, evidence: ev } }); reload(); }, t('saved'))}>{t('submit')}</Btn></>}
    </Card>
  );
}
function C() { const { t } = useT(), { d, busy, reload } = useLoad(() => api('/claims')); if (busy) return <Spinner />; return <><h1>{t('navClaims')}</h1><p className="mute">{t('claimsHint')}</p>{!d?.length && <Card><Empty>{t('noClaims')}</Empty></Card>}{(d || []).map((c) => <Row key={c._id} c={c} reload={reload} />)}</>; }
export default function Page() { return <Guard roles={['customer']}><C /></Guard>; }
