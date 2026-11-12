import { useState } from 'react';
import Crud from '../Crud';
import { Tabs, Badge } from '../ui';
export default function Content() {
  const [t, setT] = useState('g');
  return (<><Tabs value={t} onChange={setT} tabs={[['g', 'Guides (DIY)'], ['p', 'Pages (legal/FAQ)']]} />
    {t === 'g' && <Crud title="DIY guides" path="/admin/guides" canDelete defaults={{ status: 'PUBLISHED', material: 'canvas' }} filters={[{ k: 'status', label: 'Status', opts: ['PUBLISHED', 'DRAFT'] }]}
      fields={[{ k: 'slug', label: 'Slug (a-z0-9-)', create: true }, { k: 'title', label: 'Title (HG / EN / HI)', type: 'i18n' }, { k: 'body', label: 'Body (HG / EN / HI)', type: 'i18n', rows: 6 }, { k: 'material', label: 'Material', type: 'select', opts: ['canvas', 'leather', 'suede', 'knit', 'luxury'] }, { k: 'tags', label: 'Tags (clean, sole…)', type: 'list' }, { k: 'status', label: 'Status', type: 'select', opts: ['PUBLISHED', 'DRAFT'] }]}
      cols={[{ h: 'Slug', f: (r) => <code>{r.slug}</code> }, { h: 'Title', f: (r) => r.title?.hg || r.title?.en }, { h: 'Material', f: (r) => r.material }, { h: 'Status', f: (r) => <Badge s={r.status} /> }]} />}
    {t === 'p' && <Crud title="Legal & info pages" path="/admin/pages" canDelete defaults={{ status: 'PUBLISHED' }}
      fields={[{ k: 'slug', label: 'Slug', create: true }, { k: 'title', label: 'Title', type: 'i18n' }, { k: 'body', label: 'Body', type: 'i18n', rows: 8 }, { k: 'needsLegalReview', label: 'Draft banner dikhao (lawyer review baaki)', type: 'bool' }, { k: 'status', label: 'Status', type: 'select', opts: ['PUBLISHED', 'DRAFT'] }]}
      cols={[{ h: 'Slug', f: (r) => <code>{r.slug}</code> }, { h: 'Title', f: (r) => r.title?.hg || r.title?.en }, { h: 'Legal review', f: (r) => (r.needsLegalReview ? <Badge s="PENDING">pending</Badge> : <Badge s="APPROVED">done</Badge>) }]} />}</>);
}
