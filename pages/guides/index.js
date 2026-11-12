import Link from 'next/link';
import { useRouter } from 'next/router';
import { api } from '../../lib/api';
import { useT } from '../../lib/i18n';
import { pick } from '../../lib/anon';
import { Card, Spinner, useLoad } from '../../components/ui';
import AdSlot from '../../components/AdSlot';
export default function Guides() {
  const { t, lang } = useT(), r = useRouter(), m = r.query.material || '';
  const { d, busy } = useLoad(() => api('/guides' + (m ? `?material=${m}` : '')), [m]);
  return (
    <>
      <h1>{t('navGuides')}</h1>
      <div className="row">{['', 'canvas', 'leather', 'suede', 'knit'].map((x) => <Link key={x} className={`btn sm ${m === x ? '' : 'ghost'}`} href={x ? `/guides?material=${x}` : '/guides'}>{x ? t('mat_' + x) : t('all')}</Link>)}</div>
      <div className="grid g2" style={{ marginTop: 14 }}>
        <div>{busy ? <Spinner /> : d.map((g) => <Link key={g.slug} href={`/guides/${g.slug}`} style={{ textDecoration: 'none', color: 'inherit' }}><Card><b>{pick(g.title, lang)}</b><div className="small mute">{g.material}</div></Card></Link>)}</div>
        <div><AdSlot slot="guide_sidebar" page="guide" material={m} /></div>
      </div>
    </>
  );
}
