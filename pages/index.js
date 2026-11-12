import Link from 'next/link';
import { api, money, dt } from '../lib/api';
import { useAuth } from '../lib/auth';
import { useT } from '../lib/i18n';
import { Card, Badge, Spinner, useLoad } from '../components/ui';

// Core USPs as defined in the official project PDF specification
const USPs = [
  {
    icon: '🛡️',
    tag: 'KILLER USP',
    title: 'Condition-Locked & Protected Repair',
    desc: 'Jootein pickup se delivery tak documented. 8-angle photo intake + hub grading locked for zero disputes.',
    badgeClass: 'badge-gold'
  },
  {
    icon: '🔍',
    tag: 'USP 1',
    title: 'Instant AI Repairability Verdict',
    desc: 'Photo upload se OpenRouter AI damage detect karta hai; instant verdict: DIY safe, worth it, ya borderline.',
    badgeClass: 'badge'
  },
  {
    icon: '💎',
    tag: 'USP 3',
    title: 'Declared-Value Damage Cover',
    desc: 'Transit aur repair custody ke dauran loss/damage par aapke declared value tak full compensation guarantee.',
    badgeClass: 'badge'
  },
  {
    icon: '⏱️',
    tag: 'USP 4',
    title: 'Committed Date + SLA Auto-Credit',
    desc: 'Agar humari taraf se 1 din bhi late hua, to bina maange har din wallet mein automatic compensation credit.',
    badgeClass: 'badge'
  },
  {
    icon: '🔒',
    tag: 'USP 5',
    title: 'Fixed Price Cap & Pay After Approval',
    desc: 'Transparent rate card, capped budget. Quote approve hone ke baad hi payment; extra charges par advance approval.',
    badgeClass: 'badge'
  },
  {
    icon: '🏪',
    tag: 'USP 6',
    title: 'Drop-Point & Luxury Partner Network',
    desc: 'Home doorstep pickup ya pass ke verified laundry/retail drop-point se seamless QR + 4-digit OTP handover.',
    badgeClass: 'badge'
  }
];

function Landing() {
  const { t } = useT();
  return (
    <>
      {/* Luxury Hero Banner */}
      <div className="hero">
        <div style={{ display: 'inline-block', padding: '4px 14px', background: 'rgba(198, 161, 107, 0.25)', border: '1px solid #C6A16B', borderRadius: 999, color: '#C6A16B', fontSize: '0.78rem', letterSpacing: '0.25em', fontWeight: 700, marginBottom: 14 }}>
          PAGH FOOTWEAR CARE & RESTORATION
        </div>
        <h1>Walk in Elegance. <br /><span style={{ fontStyle: 'italic', color: '#EAD5BF' }}>Protected in Every Step.</span></h1>
        <p>
          India's premier luxury shoe restoration platform. Jootein pickup se delivery tak fully documented,
          guaranteed delivery date, aur declared-value protection cover ke saath.
        </p>
        <div className="row" style={{ marginTop: 24, gap: 14 }}>
          <Link className="btn" href="/check">
            🔍 Check Shoe Repairability (AI Verdict)
          </Link>
          <Link className="btn ghost" href="/login?tab=signup">
            Create Free Account
          </Link>
          <Link className="btn ghost" href="/login">
            {t('login')}
          </Link>
        </div>
      </div>

      {/* Core USPs Grid */}
      <div style={{ margin: '36px 0 20px' }}>
        <h2 style={{ textAlign: 'center', marginBottom: 8 }}>Six Pillars of Protected Footwear Care</h2>
        <p className="mute" style={{ textAlign: 'center', maxWidth: 640, margin: '0 auto 30px' }}>
          Har feature aapke luxury footwear ki safety, fair pricing aur transparent service ke liye banaya gaya hai.
        </p>

        <div className="grid g3">
          {USPs.map((u) => (
            <Card key={u.tag}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <span style={{ fontSize: '2rem' }}>{u.icon}</span>
                <span className="badge" style={{ background: u.tag.includes('KILLER') ? '#321D14' : 'rgba(198, 161, 107, 0.2)', color: u.tag.includes('KILLER') ? '#FFF9F0' : '#321D14' }}>
                  {u.tag}
                </span>
              </div>
              <h3 style={{ fontSize: '1.15rem' }}>{u.title}</h3>
              <p className="mute" style={{ fontSize: '0.9rem', lineHeight: 1.5 }}>{u.desc}</p>
            </Card>
          ))}
        </div>
      </div>

      {/* 4-Step Protected Process */}
      <Card title="How PAGH Protected Restoration Works">
        <div className="grid g4" style={{ marginTop: 14 }}>
          <div style={{ padding: 12 }}>
            <div className="big" style={{ color: 'var(--accent-gold)' }}>01</div>
            <b>AI Verdict & Quote</b>
            <p className="small mute">Photo upload karke material/damage aur estimated repair feasibility dekhein.</p>
          </div>
          <div style={{ padding: 12 }}>
            <div className="big" style={{ color: 'var(--accent-gold)' }}>02</div>
            <b>Condition-Locked Pickup</b>
            <p className="small mute">Doorstep ya drop-point par QR + OTP scan se custody log create hota hai.</p>
          </div>
          <div style={{ padding: 12 }}>
            <div className="big" style={{ color: 'var(--accent-gold)' }}>03</div>
            <b>Hub Inspection & Grade</b>
            <p className="small mute">Hub par 8-angle inspection report banti hai. Aapke approve karne par hi repair shuru.</p>
          </div>
          <div style={{ padding: 12 }}>
            <div className="big" style={{ color: 'var(--accent-gold)' }}>04</div>
            <b>Guaranteed Delivery</b>
            <p className="small mute">Committed date par safely return. Late hone par automatic wallet credit.</p>
          </div>
        </div>
      </Card>
    </>
  );
}

const ACTIVE = [
  'BOOKED', 'PICKED_UP', 'AT_HUB', 'CONDITION_CONFIRMED', 'QUOTE_SENT',
  'QUOTE_APPROVED', 'IN_REPAIR', 'QC', 'READY', 'OUT_FOR_DELIVERY',
  'QUOTE_REJECTED', 'NOT_REPAIRABLE', 'RETURN_READY'
];

function Dashboard({ user }) {
  const { t } = useT();
  const o = useLoad(() => api('/orders'));
  const w = useLoad(() => api('/wallet'));
  const active = (o.d || []).filter((x) => ACTIVE.includes(x.status));
  const needs = (x) => ({
    QUOTE_SENT: t('needQuote'),
    CONDITION_CONFIRMED: t('needCond'),
    QUOTE_APPROVED: x.paid ? null : t('needPay')
  }[x.status]);

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', flexWrap: 'wrap', gap: 10 }}>
        <h1>Welcome, {user.name.split(' ')[0]} 👞</h1>
        <span className="mute small">PAGH Protected Customer Dashboard</span>
      </div>

      <div className="grid g3" style={{ margin: '14px 0 24px' }}>
        <Card>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div className="mute small">AI Repair Check (U1)</div>
              <h3>Start Verdict</h3>
            </div>
            <span style={{ fontSize: '1.8rem' }}>📸</span>
          </div>
          <p className="small mute">Upload damage photos to get AI feasibility, time & price cap.</p>
          <Link className="btn sm" href="/check">Start Free Check</Link>
        </Card>

        <Card>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div className="mute small">Wallet & SLA Credits (U4)</div>
              <div className="big">{w.d ? money(w.d.balance) : '…'}</div>
            </div>
            <span style={{ fontSize: '1.8rem' }}>💰</span>
          </div>
          <p className="small mute">Auto-credits for any turnaround delays applied here.</p>
          <Link href="/wallet" className="small">View Wallet Ledger →</Link>
        </Card>

        <Card>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div className="mute small">Active Protected Orders</div>
              <div className="big">{o.d ? active.length : '…'}</div>
            </div>
            <span style={{ fontSize: '1.8rem' }}>📦</span>
          </div>
          <p className="small mute">Tracking, custody chain, & condition reports.</p>
          <Link href="/orders" className="small">Track All Orders →</Link>
        </Card>
      </div>

      <Card title="Active Restorations & Tracking">
        {o.busy ? (
          <Spinner />
        ) : !active.length ? (
          <div style={{ padding: '24px 0', textAlign: 'center' }}>
            <p className="mute">Koi active order nahi hai.</p>
            <Link href="/check" className="btn sm" style={{ marginTop: 8 }}>Apne jootein repair ke liye check karo</Link>
          </div>
        ) : (
          active.slice(0, 5).map((x) => (
            <Link key={x._id} href={`/order/${x._id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
              <div className="row between" style={{ padding: '12px 0', borderBottom: '1px solid var(--line)' }}>
                <div>
                  <b>{x.orderNo}</b>
                  <div className="small mute">{x.shoe?.brand || x.shoe?.material} · {dt(x.createdAt)}</div>
                  {needs(x) && <div className="small" style={{ color: 'var(--warn)', fontWeight: 600 }}>{needs(x)}</div>}
                </div>
                <Badge s={x.status}>{t('st_' + x.status)}</Badge>
              </div>
            </Link>
          ))
        )}
      </Card>

      <div className="grid g3" style={{ marginTop: 20 }}>
        <Link href="/shop" className="card" style={{ textDecoration: 'none', color: 'inherit' }}>
          <b>🛍️ Care Products & Accessories</b>
          <div className="mute small">Shoe trees, waterproofing sprays, premium horsehair brushes.</div>
        </Link>
        <Link href="/wardrobe" className="card" style={{ textDecoration: 'none', color: 'inherit' }}>
          <b>👟 Digital Shoe Wardrobe</b>
          <div className="mute small">Save your luxury footwear collection & track maintenance history.</div>
        </Link>
        <Link href="/claims" className="card" style={{ textDecoration: 'none', color: 'inherit' }}>
          <b>🛡️ Declared Value Claims</b>
          <div className="mute small">File and track protection coverage settlements.</div>
        </Link>
      </div>
    </>
  );
}

export default function Home() {
  const { user } = useAuth();
  return user ? <Dashboard user={user} /> : <Landing />;
}
