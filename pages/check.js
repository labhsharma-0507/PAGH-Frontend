import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { api, money } from '../lib/api';
import { useAuth } from '../lib/auth';
import { useT } from '../lib/i18n';
import { Btn, Card, Field, Badge, Err, useLoad } from '../components/ui';
import Photos from '../components/Photos';

const MATERIALS = ['leather', 'canvas', 'suede', 'knit', 'luxury', 'unknown'];
const DAMAGES = ['sole', 'stitch', 'upper', 'clean', 'insole'];
const TYPES = ['sneaker', 'casual', 'formal', 'sandal', 'boot', 'luxury', 'other'];

export default function Check() {
  const { t } = useT(), { user } = useAuth(), r = useRouter();
  const [f, setF] = useState({ material: 'unknown', damage: 'sole', type: 'sneaker', value: '', brand: '', description: '' });
  const [photos, setPhotos] = useState([]), [ai, setAi] = useState(null), [res, setRes] = useState(null), [err, setErr] = useState(null), [recs, setRecs] = useState([]);
  const [touched, setTouched] = useState(false);
  const set = (k, v) => { setF((x) => ({ ...x, [k]: v })); setTouched(true); };
  const askAi = async (dataUrl) => {
    if (ai || touched) return;
    try { const a = await api('/verdicts/ai', { method: 'POST', body: { image: dataUrl } }); setAi(a); if (a.source === 'ai' && !touched) setF((x) => ({ ...x, material: a.material, damage: a.damage, type: a.type })); } catch {}
  };
  const submit = async () => {
    setErr(null);
    try {
      const v = await api('/verdicts', { method: 'POST', body: { ...f, value: Number(f.value) || 0, photos, ai } });
      setRes(v);
      const rc = await api(`/products/recommend?context=verdict&material=${f.material}&damage=${f.damage}`).catch(() => []);
      setRecs(rc);
      setTimeout(() => document.getElementById('result')?.scrollIntoView({ behavior: 'smooth' }), 100);
    } catch (e) { setErr(e); }
  };
  const refresh = async () => setRes({ ...(await api('/verdicts/' + res.id)), ...res, final: (await api('/verdicts/' + res.id)).final, reviewStatus: (await api('/verdicts/' + res.id)).reviewStatus });
  const final = res?.final, shown = final ? { ...res, verdict: final.verdict, priceBand: final.priceBand } : res;
  const bookUrl = res ? `/book?verdictId=${res.id}&material=${f.material}&value=${f.value}&brand=${encodeURIComponent(f.brand)}&type=${f.type}&problem=${f.damage}` : '/book';
  return (
    <>
      <h1>{t('checkTitle')}</h1>
      <div id="check" className="grid g2">
        <Card>
          <Photos value={photos} onChange={setPhotos} max={4} folder="verdict" label={t('shoePhotos')} onData={askAi} />
          {ai?.notShoe && <div className="alert warn">{t('notShoe')}</div>}
          {ai?.source === 'ai' && !ai.notShoe && <div className="alert info">{t('aiSuggested')}</div>}
          <div className="grid g2">
            <Field label={t('material')}><select value={f.material} onChange={(e) => set('material', e.target.value)}>{MATERIALS.map((m) => <option key={m} value={m}>{t('mat_' + m)}</option>)}</select></Field>
            <Field label={t('problem')}><select value={f.damage} onChange={(e) => set('damage', e.target.value)}>{DAMAGES.map((m) => <option key={m} value={m}>{t('dmg_' + m)}</option>)}</select></Field>
            <Field label={t('shoeType')}><select value={f.type} onChange={(e) => set('type', e.target.value)}>{TYPES.map((m) => <option key={m} value={m}>{t('type_' + m)}</option>)}</select></Field>
            <Field label={t('shoeValue')} hint={t('shoeValueHint')}><input type="number" min="0" value={f.value} onChange={(e) => set('value', e.target.value)} placeholder="3000" /></Field>
          </div>
          <Field label={t('brandModel')}><input value={f.brand} maxLength={60} onChange={(e) => set('brand', e.target.value)} placeholder="Nike Air Force 1" /></Field>
          <Field label={t('describe')}><textarea value={f.description} maxLength={500} onChange={(e) => set('description', e.target.value)} placeholder={t('describePh')} /></Field>
          <Err e={err} />
          <Btn onClick={submit}>{t('getVerdict')}</Btn>
          <p className="small mute">{t('verdictDisclaimer')}</p>
        </Card>

        <div id="result">
          {shown ? (
            <Card title={t('yourVerdict')}>
              <div className="row between"><Badge s={shown.verdict}>{t('v_' + shown.verdict)}</Badge>{res.reviewStatus === 'PENDING' && <Badge s="PENDING">{t('reviewPending')}</Badge>}{final && <Badge s="APPROVED">{t('expertReviewed')}</Badge>}</div>
              {shown.verdict !== 'DIY_SAFE' && <><div className="price-band">{money(shown.priceBand.min)} – {money(shown.priceBand.max)}</div><div className="mute">{t('estTat', { a: shown.tatDays[0], b: shown.tatDays[1] })}</div></>}
              <ul>{res.reasons.map((x) => <li key={x}>{x}</li>)}</ul>
              {res.diyWarning && <div className="alert warn">{t('diyWarn')}</div>}
              {res.reviewStatus === 'PENDING' && <div className="alert info">{t('reviewInfo')} <button className="btn ghost sm" onClick={refresh}>{t('refresh')}</button></div>}
              {final && res.reviewNote && <div className="alert ok">{res.reviewNote}</div>}
              <details><summary>{t('hubVerifies')}</summary><ul>{res.hubWillVerify.map((x) => <li key={x}>{x}</li>)}</ul></details>
              <p className="small mute">{res.disclaimer}</p>
              <div className="row">
                {shown.verdict !== 'DIY_SAFE' && shown.verdict !== 'NOT_WORTH_OR_NOT_REPAIRABLE' && <Link className="btn" href={bookUrl}>{t('bookRepair')}</Link>}
                {shown.verdict === 'DIY_SAFE' && <Link className="btn ghost" href={bookUrl}>{t('stillPro')}</Link>}
                {shown.verdict === 'NOT_WORTH_OR_NOT_REPAIRABLE' && <Link className="btn ghost" href={bookUrl}>{t('stillRepair')}</Link>}
                <Link className="btn ghost" href={`/guides?material=${f.material}`}>{t('diyGuides')}</Link>
              </div>
            </Card>
          ) : <Card title={t('howItWorks')}><ol className="col">{[1, 2, 3, 4, 5].map((i) => <li key={i}>{t('how' + i)}</li>)}</ol></Card>}
          {recs.length > 0 && <Card title={t('careProducts')}>{recs.map((p) => <div key={p.sku} className="row between"><span>{p.title}</span><Link href={`/shop?sku=${p.sku}`}>{money(p.price)}</Link></div>)}</Card>}
        </div>
      </div>
    </>
  );
}
