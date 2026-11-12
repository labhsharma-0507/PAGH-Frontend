import { useRouter } from 'next/router';
import Link from 'next/link';
import { useState } from 'react';
import { api, money, dt, day, getConfig } from '../../lib/api';
import { Guard } from '../../lib/auth';
import { useT } from '../../lib/i18n';
import { payFlow } from '../../lib/pay';
import { Btn, Card, Field, Badge, Err, Modal, Spinner, useLoad, useAct } from '../../components/ui';
import Photos from '../../components/Photos';
import { QR } from '../../components/QR';

const FLOW = ['BOOKED', 'PICKED_UP', 'AT_HUB', 'CONDITION_CONFIRMED', 'QUOTE_SENT', 'QUOTE_APPROVED', 'IN_REPAIR', 'QC', 'READY', 'OUT_FOR_DELIVERY', 'DELIVERED'];

function ClaimModal({ order, onClose, onDone, warrantyActive }) {
  const { t } = useT(), act = useAct();
  const [f, setF] = useState({ type: warrantyActive ? 'warranty' : 'damage', text: '' }), [ev, setEv] = useState([]), [err, setErr] = useState(null);
  const go = async () => { setErr(null); try { await api('/claims', { method: 'POST', body: { orderId: order._id, ...f, evidence: ev } }); onDone(); } catch (e) { setErr(e); } };
  return (
    <Modal title={t('fileClaim')} onClose={onClose}>
      <Field label={t('claimType')}><select value={f.type} onChange={(e) => setF({ ...f, type: e.target.value })}>{['damage', 'loss', 'delay', 'warranty', 'other'].map((x) => <option key={x} value={x}>{t('claim_' + x)}</option>)}</select></Field>
      <Field label={t('claimText')}><textarea value={f.text} onChange={(e) => setF({ ...f, text: e.target.value })} maxLength={1000} /></Field>
      <Photos value={ev} onChange={setEv} max={6} folder="claim" label={t('evidence')} />
      <Err e={err} /><Btn onClick={go}>{t('submit')}</Btn>
    </Modal>
  );
}

function Detail() {
  const { t } = useT(), r = useRouter(), act = useAct(), id = r.query.id;
  const { d, e, busy, reload } = useLoad(() => (id ? api('/orders/' + id) : Promise.resolve(null)), [id]);
  const wal = useLoad(() => api('/wallet'));
  const [claim, setClaim] = useState(false), [useCredits, setUC] = useState(true), [rv, setRv] = useState({ quality: 5, communication: 5, delivery: 5, text: '' }), [dispute, setDispute] = useState(''), [query, setQuery] = useState(''), [addPh, setAddPh] = useState([]);
  if (busy || !d) return e ? <Err e={e} /> : <Spinner />;
  const { order: o, condition: c, quotes, warranty, review, milestones, custody, cover, payable } = d;
  const post = (p, b, ok) => act(async () => { const x = await api(p, { method: 'POST', body: b }); await reload(); return x; }, ok);
  const q = [...quotes].reverse().find((x) => ['SENT', 'QUERY'].includes(x.status) && !x.extraWorkOf);
  const extra = quotes.find((x) => x.extraWorkOf && ['SENT', 'QUERY'].includes(x.status));
  const pay = async () => act(async () => {
    const p = await api('/payments/create', { method: 'POST', body: { orderId: o._id, useCredits } });
    await payFlow(p); await reload(); wal.reload();
  }, t('paid'));
  const idx = FLOW.indexOf(o.status), warrantyActive = warranty && new Date(warranty.endDate) > new Date();
  const late = o.committedDate && new Date(o.committedDate) < new Date() && ['QUOTE_APPROVED', 'IN_REPAIR', 'QC', 'READY'].includes(o.status);
  const mustPay = (o.status === 'QUOTE_APPROVED' && !o.paid) || (o.status === 'IN_REPAIR' && o.dueExtra > 0) || (o.status === 'QUOTE_REJECTED' && o.dueExtra > 0);
  const payAmt = o.status === 'QUOTE_APPROVED' ? payable : o.dueExtra;
  return (
    <>
      {r.query.new && <div className="alert ok">{t('bookedOk')}</div>}
      <div className="row between"><h1>{o.orderNo} {o.rework && <Badge s="info">Redo</Badge>}</h1><div className="row"><Badge s={o.status}>{t('st_' + o.status)}</Badge>{o.hold?.active && <Badge s="HOLD">{t('onHold')}: {o.hold.reason}</Badge>}</div></div>
      <div className="grid g2">
        <div>
          {o.status === 'BOOKED' && <Card title={t('handoverTitle')}>
            <div className="row"><QR text={o.qrId} /><div><div className="mute small">{t('pickupOtp')}</div><div className="big" style={{ letterSpacing: 6 }}>{o.pickupOtp}</div><p className="small mute">{o.pickupMode === 'DROPPOINT' ? t('handoverDp') : t('handoverPickup')}</p></div></div>
            <p className="small"><b>{o.pickupMode === 'DROPPOINT' ? t('dropAt') : t('pickupFrom')}:</b> {o.address} {o.slot && `· ${o.slot}`}</p>
            {!(c?.customerPhotos?.length) && <div className="alert warn">{t('addPhotosFirst')}</div>}
            <Photos value={addPh} onChange={setAddPh} max={8} folder="condition" label={t('addCondPhotos')} />
            {addPh.length > 0 && <Btn small onClick={() => post(`/orders/${o._id}/condition/customer-photos`, { photos: [...(c?.customerPhotos || []), ...addPh].slice(0, 8), preExisting: c?.preExisting || [] }, t('saved')).then(() => setAddPh([]))}>{t('savePhotos')}</Btn>}
            <hr /><Btn kind="ghost" onClick={() => confirm(t('cancelConfirm')) && post(`/orders/${o._id}/cancel`, {}, t('cancelled'))}>{t('cancelOrder')}</Btn>
          </Card>}

          {o.status === 'OUT_FOR_DELIVERY' && <Card title={t('deliveryTitle')}>
            <div className="row"><QR text={o.qrId} /><div><div className="mute small">{t('deliveryOtp')}</div><div className="big" style={{ letterSpacing: 6 }}>{o.deliveryOtp}</div><p className="small mute">{o.pickupMode === 'DROPPOINT' ? t('collectDp', { a: o.address }) : t('deliveryHint')}</p></div></div>
          </Card>}

          {mustPay && <Card title={t('payTitle')}>
            <div className="big">{money(payAmt)}</div>
            {o.status === 'QUOTE_APPROVED' && <ul className="small"><li>{t('service')}: {money(o.total)}</li>{o.fees?.delivery > 0 && <li>{t('feeDeliveryL')}: {money(o.fees.delivery)}</li>}{o.fees?.express > 0 && <li>Express: {money(o.fees.express)}</li>}{o.fees?.protection > 0 && <li>{t('protection')}: {money(o.fees.protection)}</li>}</ul>}
            {o.status === 'QUOTE_REJECTED' && <p className="small">{t('returnFeeNote')}</p>}
            {wal.d?.balance > 0 && <label className="row"><input type="checkbox" checked={useCredits} onChange={(e) => setUC(e.target.checked)} /> {t('useCredits', { n: money(wal.d.balance) })}</label>}
            <Btn onClick={pay}>{t('payNow')}</Btn>
            {o.status === 'QUOTE_APPROVED' && <p className="small mute">{t('payInfo', { d: day(o.committedDate) })}</p>}
          </Card>}

          {o.committedDate && !['DELIVERED', 'CLOSED', 'CANCELLED'].includes(o.status) && <Card title={t('promiseTitle')}>
            <div className="big">{dt(o.committedDate)}</div>
            {late ? <div className="alert warn">{t('lateNote')} {o.slaCreditTotal > 0 && <b>{t('creditedSoFar', { n: money(o.slaCreditTotal) })}</b>}</div> : <p className="small mute">{t('promiseNote')}</p>}
            {o.hold?.active && <div className="alert info">{o.hold.reason}{o.hold.note ? `: ${o.hold.note}` : ''} — {t('holdNote')}</div>}
          </Card>}

          {c?.grade && <Card title={t('conditionTitle')}>
            <div className="row between"><span>{t('grade')}: <b className="big">{c.grade}</b></span>{c.lockedAt ? <Badge s="APPROVED">{t('locked')}</Badge> : c.disputedReason ? <Badge s="PENDING">{t('disputed')}</Badge> : <Badge s="PENDING">{t('awaitingYou')}</Badge>}</div>
            {c.preExisting?.length > 0 && <div className="small"><b>{t('preExisting')}:</b> {c.preExisting.map((x) => <span key={x} className="tag">{x}</span>)}</div>}
            <div className="lbl">{t('yourPhotos')}</div><div className="thumbs">{c.customerPhotos.map((u) => <a key={u} className="th" href={u} target="_blank" rel="noreferrer"><img src={u} alt="" /></a>)}</div>
            <div className="lbl">{t('hubPhotos')}</div><div className="thumbs">{c.hubPhotos.map((u) => <a key={u} className="th" href={u} target="_blank" rel="noreferrer"><img src={u} alt="" /></a>)}</div>
            {c.disputedReason && <div className="alert warn">{t('yourDispute')}: {c.disputedReason}</div>}
            {!c.lockedAt && !c.disputedReason && <><div className="row"><Btn kind="ok" onClick={() => post(`/orders/${o._id}/condition/accept`, {}, t('accepted'))}>{t('accept')}</Btn></div>
              <Field label={t('disputeReason')}><textarea value={dispute} onChange={(e) => setDispute(e.target.value)} /></Field><Btn kind="ghost" disabled={!dispute} onClick={() => post(`/orders/${o._id}/condition/dispute`, { reason: dispute }, t('disputeSent'))}>{t('dispute')}</Btn></>}
          </Card>}

          {q && o.status === 'QUOTE_SENT' && <Card title={t('quoteTitle')}>
            <table><tbody>{q.items.map((i, k) => <tr key={k}><td>{i.name}</td><td className="right">{money(i.price)}</td></tr>)}<tr><td><b>{t('total')}</b></td><td className="right"><b>{money(q.total)}</b></td></tr></tbody></table>
            <ul className="small"><li>{t('priceCap')}: <b>{money(q.cap)}</b> {t('priceCapNote')}</li><li>TAT: {q.tatDays} {t('days')}{o.express ? ` (${t('express')})` : ''}</li><li>{t('warranty')}: {q.warrantyDays} {t('days')}</li></ul>
            {q.queryText && <div className="alert info">{t('yourQuery')}: {q.queryText}</div>}
            <div className="row"><Btn kind="ok" onClick={() => post(`/quotes/${q._id}/approve`, {}, t('approved'))}>{t('approveQuote')}</Btn>
              <Btn kind="danger" onClick={() => confirm(t('rejectConfirm', { n: money(d.order.fees?.returnFee || 0) })) && post(`/quotes/${q._id}/reject`, { reason: 'customer' }, t('rejected'))}>{t('rejectQuote')}</Btn></div>
            {q.status === 'SENT' && <div className="row" style={{ marginTop: 8 }}><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={t('askQuote')} /><Btn kind="ghost" disabled={!query} onClick={() => post(`/quotes/${q._id}/query`, { text: query }, t('querySent')).then(() => setQuery(''))}>{t('send')}</Btn></div>}
          </Card>}

          {extra && <Card title={t('extraTitle')}><div className="alert warn">{t('extraNote')}</div>
            <ul>{extra.items.map((i, k) => <li key={k}>{i.name}: {money(i.price)}</li>)}</ul>{extra.note && <p>{extra.note}</p>}
            <div className="row"><Btn kind="ok" onClick={() => post(`/quotes/${extra._id}/approve`, {}, t('approved'))}>{t('approve')}</Btn><Btn kind="danger" onClick={() => post(`/quotes/${extra._id}/reject`, {}, t('rejected'))}>{t('reject')}</Btn></div></Card>}

          {['DELIVERED', 'CLOSED'].includes(o.status) && <>
            {warranty && <Card title={t('warrantyTitle')}><div>{warrantyActive ? <Badge s="APPROVED">{t('active')}</Badge> : <Badge s="REJECTED">{t('expired')}</Badge>} {t('till')} <b>{day(warranty.endDate)}</b></div><p className="small mute">{warranty.scope}. {t('excludes')}: {warranty.exclusions}</p></Card>}
            {!review ? <Card title={t('reviewTitle')}>
              {['quality', 'communication', 'delivery'].map((k) => <Field key={k} label={t('rate_' + k)}><select value={rv[k]} onChange={(e) => setRv({ ...rv, [k]: +e.target.value })}>{[5, 4, 3, 2, 1].map((n) => <option key={n}>{n}</option>)}</select></Field>)}
              <Field label={t('comment')}><textarea value={rv.text} onChange={(e) => setRv({ ...rv, text: e.target.value })} /></Field><Btn onClick={() => post(`/orders/${o._id}/review`, rv, t('thanks'))}>{t('submit')}</Btn></Card>
              : <Card title={t('reviewTitle')}>⭐ {review.quality}/5 · {review.communication}/5 · {review.delivery}/5</Card>}
            <Link className="btn ghost" href={`/invoice/${o._id}`}>🧾 {t('invoice')}</Link>
          </>}
        </div>

        <div>
          <Card title={t('progress')}>
            <ol className="tl">{FLOW.map((s, i) => <li key={s} style={{ opacity: i <= idx ? 1 : 0.35 }}>{t('st_' + s)}{o.events.filter((e) => e.to === s).slice(-1).map((e) => <span key={e.ts} className="mute small"> · {dt(e.ts)}</span>)}</li>)}
              {['QUOTE_REJECTED', 'NOT_REPAIRABLE', 'RETURN_READY', 'CANCELLED'].includes(o.status) && <li><b>{t('st_' + o.status)}</b></li>}</ol>
          </Card>
          {milestones.length > 0 && <Card title={t('repairPhotos')}>{milestones.map((m, i) => <div key={i}><div className="small mute">{m.type} · {dt(m.ts)}</div><div className="thumbs">{m.photos.map((u) => <a key={u} className="th" href={u} target="_blank" rel="noreferrer"><img src={u} alt="" /></a>)}</div></div>)}</Card>}
          <Card title={t('custodyTitle')}>{custody.length ? custody.map((x, i) => <div key={i} className="small">✔ {x.type} · {dt(x.ts)} {x.otpVerified && '· OTP ✓'}</div>) : <span className="mute small">{t('noCustody')}</span>}</Card>
          <Card title={t('coverTitle')}>
            <div>{cover.name || '—'} · {t('declared')}: <b>{money(cover.declared)}</b></div>
            <div className="small mute">{t('coverMax', { n: money(cover.max) })}</div>
            {!['BOOKED', 'CANCELLED'].includes(o.status) && <Btn kind="ghost" onClick={() => setClaim(true)}>{t('fileClaim')}</Btn>}
          </Card>
          <Card title={t('detailsTitle')}><div className="small">{o.shoe?.brand} {o.shoe?.material} {o.shoe?.problem}</div><div className="small mute">{o.address}</div>{d.payments?.length > 0 && <div className="small">{d.payments.map((p) => <div key={p._id}>{p.kind} {money(p.amount + (p.credit || 0))} · {p.status}</div>)}</div>}</Card>
        </div>
      </div>
      {claim && <ClaimModal order={o} warrantyActive={warrantyActive} onClose={() => setClaim(false)} onDone={() => { setClaim(false); r.push('/claims'); }} />}
    </>
  );
}
export default function Page() { return <Guard roles={['customer', 'admin']}><Detail /></Guard>; }
