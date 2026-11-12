import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { api } from '../lib/api';
import { Card, Spinner } from '../components/ui';
export default function Verify() {
  const r = useRouter(), [s, setS] = useState('wait');
  useEffect(() => { if (!r.isReady) return; api('/auth/verify-email?token=' + encodeURIComponent(r.query.token || '')).then(() => setS('ok')).catch(() => setS('bad')); }, [r.isReady]); // eslint-disable-line
  return <Card title="Email verification">{s === 'wait' ? <Spinner /> : s === 'ok' ? <><div className="alert ok">Email verify ho gaya ✅</div><Link className="btn" href="/">Aage badho</Link></> : <div className="alert bad">Link galat ya expire ho gaya. Profile se naya link mangao.</div>}</Card>;
}
