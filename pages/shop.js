import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { api, money, dt } from '../lib/api';
import { useAuth } from '../lib/auth';
import { useT } from '../lib/i18n';
import { payFlow } from '../lib/pay';
import { Btn, Card, Field, Badge, Modal, Tabs, Empty, Err, Spinner, useLoad, useAct, useToast } from '../components/ui';
import AdSlot from '../components/AdSlot';
import { anon } from '../lib/anon';

const ICON = { CLEANERS: '🧴', SUEDE_CARE: '🧽', LEATHER_CARE: '👞', PROTECTION: '☔', REPAIR_KITS: '🔧', INSOLES_ACCESSORIES: '🧦', TOOLS: '🪥' };
const useCart = () => {
  const [c, setC] = useState({});
  useEffect(() => { try { setC(JSON.parse(localStorage.getItem('cart') || '{}')); } catch {} }, []);
  const save = (n) => { setC(n); try { localStorage.setItem('cart', JSON.stringify(n)); } catch {} };
  return [c, (sku, d) => { const n = { ...c }; n[sku] = Math.max(0, Math.min(20, (n[sku] || 0) + d)); if (!n[sku]) delete n[sku]; save(n); }, () => save({})];
};

function Catalog({ cart, add }) {
  const { t } = useT(), r = useRouter(), toast = useToast();
  const [q, setQ] = useState(''), [cat, setCat] = useState(''), [sort, setSort] = useState('popular'), [sel, setSel] = useState(null);
  const { d, busy } = useLoad(() => api(`/products?limit=100&sort=${sort}${cat ? '&category=' + cat : ''}${q ? '&q=' + encodeURIComponent(q) : ''}`), [cat, sort, q]);
  useEffect(() => { if (r.query.sku && d) setSel(d.items.find((p) => p.sku === r.query.sku) || null); }, [r.query.sku, d]);
  const buyExternal = async (p) => { try { const x = await api(`/products/${p.sku}/click`, { method: 'POST', body: { anon: anon() } }); if (x.url) window.open(x.url, '_blank', 'noopener,noreferrer'); } catch (e) { toast(e.message, 'bad'); } };
  return (
    <>
      <AdSlot slot="shop_banner" page="shop" category={cat} />
      <div className="row"><input style={{ maxWidth: 260 }} value={q} onChange={(e) => setQ(e.target.value)} placeholder={t('search')} aria-label={t('search')} />
        <select style={{ maxWidth: 200 }} value={cat} onChange={(e) => setCat(e.target.value)}><option value="">{t('allCategories')}</option>{(d?.categories || []).map((c) => <option key={c} value={c}>{c.replace(/_/g, ' ')}</option>)}</select>
        <select style={{ maxWidth: 180 }} value={sort} onChange={(e) => setSort(e.target.value)}><option value="popular">{t('popular')}</option><option value="price_asc">{t('priceLow')}</option><option value="price_desc">{t('priceHigh')}</option></select></div>
      {busy ? <Spinner /> : !d.items.length ? <Card><Empty>{t('noProducts')}</Empty></Card> :
        <div className="grid g4" style={{ marginTop: 14 }}>{d.items.map((p) => (
          <Card key={p.sku} className="prod"><div className="img" onClick={() => setSel(p)} style={{ cursor: 'pointer' }}>{p.images?.[0] ? <img src={p.images[0]} alt="" style={{ maxHeight: 110 }} /> : ICON[p.category] || '👟'}</div>
            {p.sponsored && <span className="badge">{p.label || 'Sponsored'}</span>}
            <b onClick={() => setSel(p)} style={{ cursor: 'pointer' }}>{p.title}</b><div className="small mute">{p.brand}</div>
            <div className="price"><b>{money(p.price)}</b>{p.mrp > p.price && <s>{money(p.mrp)}</s>}</div>
            {p.affiliate ? <Btn small kind="ghost" onClick={() => buyExternal(p)}>{t('buyPartner')} ↗</Btn> : cart[p.sku] ? <div className="row"><button className="btn ghost sm" onClick={() => add(p.sku, -1)}>−</button><b>{cart[p.sku]}</b><button className="btn ghost sm" onClick={() => add(p.sku, 1)}>+</button></div> : <button className="btn sm" onClick={() => add(p.sku, 1)}>{t('addToCart')}</button>}
          </Card>))}</div>}
      {sel && <Modal title={sel.title} onClose={() => setSel(null)}><div className="big">{ICON[sel.category] || '👟'}</div>{sel.sponsored && <span className="badge">{sel.label}</span>}<p>{sel.description}</p><div className="small mute">{t('suitableFor')}: {(sel.materialsSuitable || []).join(', ') || '—'}</div>{sel.attrs && Object.entries(sel.attrs).map(([k, v]) => <div key={k} className="small">{k}: {String(v)}</div>)}<div className="price"><b>{money(sel.price)}</b>{sel.mrp > sel.price && <s>{money(sel.mrp)}</s>}</div></Modal>}
    </>
  );
}
function Cart({ cart, add, clear }) {
  const { t } = useT(), { user } = useAuth(), r = useRouter(), act = useAct();
  const all = useLoad(() => api('/products?limit=100')), addrs = useLoad(() => (user ? api('/me/addresses') : Promise.resolve([])), [user]);
  const [a, setA] = useState({ name: '', line1: '', city: '', pincode: '' }), [err, setErr] = useState(null), cfg = useLoad(() => fetch((process.env.NEXT_PUBLIC_API || `http://${typeof location !== 'undefined' ? location.hostname : 'localhost'}:4000/api/v1`) + '/config').then((x) => x.json()));
  useEffect(() => { const d = (addrs.d || []).find((x) => x.isDefault) || (addrs.d || [])[0]; if (d) setA({ name: user?.name || '', line1: d.line1, city: d.city, pincode: d.pincode }); }, [addrs.d]); // eslint-disable-line
  const lines = Object.entries(cart).map(([sku, qty]) => ({ p: (all.d?.items || []).find((x) => x.sku === sku), sku, qty })).filter((l) => l.p);
  const sub = lines.reduce((s, l) => s + l.p.price * l.qty, 0);
  const checkout = async () => {
    setErr(null);
    if (!user) return r.push('/login?next=/shop');
    try { const x = await api('/shop/checkout', { method: 'POST', body: { items: lines.map((l) => ({ sku: l.sku, qty: l.qty })), address: a } }); await payFlow(x.payment); clear(); r.push('/shop?tab=orders'); }
    catch (e) { setErr(e); }
  };
  if (!lines.length) return <Card><Empty>{t('cartEmpty')}</Empty></Card>;
  return (
    <div className="grid g2">
      <Card title={t('cart')}>{lines.map((l) => <div key={l.sku} className="row between"><span>{l.p.title}</span><span className="row"><button className="btn ghost sm" onClick={() => add(l.sku, -1)}>−</button>{l.qty}<button className="btn ghost sm" onClick={() => add(l.sku, 1)}>+</button> <b>{money(l.p.price * l.qty)}</b></span></div>)}<hr /><div className="row between"><b>{t('subtotal')}</b><b>{money(sub)}</b></div><p className="small mute">{t('shipNote')}</p></Card>
      <Card title={t('deliveryAddress')}>
        <Field label={t('name')}><input value={a.name} onChange={(e) => setA({ ...a, name: e.target.value })} /></Field><Field label={t('addrLine')}><input value={a.line1} onChange={(e) => setA({ ...a, line1: e.target.value })} /></Field>
        <div className="grid g2"><Field label={t('city')}><input value={a.city} onChange={(e) => setA({ ...a, city: e.target.value })} /></Field><Field label={t('pincode')}><input value={a.pincode} maxLength={6} onChange={(e) => setA({ ...a, pincode: e.target.value })} /></Field></div>
        <Err e={err} /><Btn onClick={checkout}>{user ? t('payNow') : t('loginToBuy')}</Btn></Card>
    </div>
  );
}
function Orders() {
  const { t } = useT(), act = useAct(), { d, busy, reload } = useLoad(() => api('/shop-orders'));
  if (busy) return <Spinner />;
  return !d.length ? <Card><Empty>{t('noOrders')}</Empty></Card> : d.map((o) => <Card key={o._id}><div className="row between"><b>{o.orderNo}</b><Badge s={o.status}>{o.status}</Badge></div>{o.items.map((i) => <div key={i.sku} className="small">{i.qty} × {i.title}</div>)}<div className="row between"><b>{money(o.total)}</b><span className="small mute">{dt(o.createdAt)}</span></div>
    {o.tracking?.awb && <div className="small">📦 {o.tracking.courier} · {o.tracking.awb} {o.tracking.url && <a href={o.tracking.url} target="_blank" rel="noreferrer">track</a>}</div>}
    {o.status === 'PENDING' && <Btn small kind="ghost" onClick={() => act(async () => { await api(`/shop-orders/${o._id}/cancel`, { method: 'POST' }); reload(); })}>{t('cancelOrder')}</Btn>}</Card>);
}
export default function Shop() {
  const { t } = useT(), { user } = useAuth(), r = useRouter(), [cart, add, clear] = useCart(), [tab, setTab] = useState('catalog');
  useEffect(() => { if (r.query.tab) setTab(String(r.query.tab)); }, [r.query.tab]);
  const n = Object.values(cart).reduce((s, x) => s + x, 0);
  return (<><h1>{t('navShop')}</h1><Tabs value={tab} onChange={setTab} tabs={[['catalog', t('catalog')], ['cart', `${t('cart')} (${n})`], ...(user?.role === 'customer' ? [['orders', t('myShopOrders')]] : [])]} />
    {tab === 'catalog' && <Catalog cart={cart} add={add} />}{tab === 'cart' && <Cart cart={cart} add={add} clear={clear} />}{tab === 'orders' && <Orders />}</>);
}
