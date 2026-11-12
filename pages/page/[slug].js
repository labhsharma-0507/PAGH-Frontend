import { useRouter } from 'next/router';
import { api } from '../../lib/api';
import { useT } from '../../lib/i18n';
import { pick } from '../../lib/anon';
import { Card, Spinner, Err, useLoad } from '../../components/ui';
export default function P() {
  const { lang } = useT(), r = useRouter();
  const { d, e, busy } = useLoad(() => (r.query.slug ? api('/pages/' + r.query.slug) : Promise.resolve(null)), [r.query.slug]);
  if (busy || !d) return e ? <Err e={e} /> : <Spinner />;
  return <Card title={pick(d.title, lang)}>{d.needsLegalReview && <div className="alert warn small">Draft content</div>}<div style={{ whiteSpace: 'pre-wrap' }}>{pick(d.body, lang)}</div></Card>;
}
