import { useEffect, useState } from 'react';
import { api, apiRoot } from '../lib/api';
import { anon } from '../lib/anon';
// Server-side blocked pages par ye hamesha null aata hai. Ad par hamesha "Ad" label.
export default function AdSlot({ slot, page, material, category }) {
  const [ad, setAd] = useState(null);
  useEffect(() => { const qs = new URLSearchParams({ anon: anon(), page, ...(material ? { material } : {}), ...(category ? { category } : {}) }); api(`/ads/placement/${slot}?${qs}`).then((d) => setAd(d.ad)).catch(() => {}); }, [slot, page, material, category]);
  if (!ad) return null;
  return <a className="card ad" href={`${apiRoot()}${ad.url}?anon=${anon()}`} target="_blank" rel="noopener sponsored" style={{ display: 'block', textDecoration: 'none', color: 'inherit' }}>
    <span className="badge">Ad</span> {ad.image && <img src={ad.image} alt="" style={{ maxWidth: '100%', borderRadius: 8, display: 'block', marginTop: 6 }} />}<b style={{ display: 'block', marginTop: 6 }}>{ad.title}</b></a>;
}
