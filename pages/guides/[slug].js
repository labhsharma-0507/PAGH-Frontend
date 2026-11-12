import Link from 'next/link';
import { useRouter } from 'next/router';
import { api, money } from '../../lib/api';
import { useT } from '../../lib/i18n';
import { pick } from '../../lib/anon';
import { Card, Spinner, Err, useLoad } from '../../components/ui';
import AdSlot from '../../components/AdSlot';
export default function Guide() {
  const { t, lang } = useT(), r = useRouter();
  const { d, e, busy } = useLoad(() => (r.query.slug ? api('/guides/' + r.query.slug) : Promise.resolve(null)), [r.query.slug]);
  const recs = useLoad(() => (d ? api(`/products/recommend?material=${d.material}&damage=${d.tags?.[0] || ''}`) : Promise.resolve([])), [d?.slug]);
  if (busy || !d) return e ? <Err e={e} /> : <Spinner />;
  return (
    <div className="grid g2">
      <Card title={pick(d.title, lang)}><div style={{ whiteSpace: 'pre-wrap' }}>{pick(d.body, lang)}</div><p className="small mute">{t('guideDisclaimer')}</p><Link className="btn" href="/check">{t('startCheck')}</Link></Card>
      <div><Card title={t('careProducts')}>{(recs.d || []).map((p) => <div key={p.sku} className="row between"><span>{p.title} {p.sponsored && <span className="badge">{p.label}</span>}</span><Link href={`/shop?sku=${p.sku}`}>{money(p.price)}</Link></div>)}</Card><AdSlot slot="guide_sidebar" page="guide" material={d.material} /></div>
    </div>
  );
}
