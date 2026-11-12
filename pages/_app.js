import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import '../styles.css';
import { I18nProvider, useT, LANGS } from '../lib/i18n';
import { AuthProvider, useAuth, homeFor, Gate } from '../lib/auth';
import { ToastProvider } from '../components/ui';
import { api, getConfig } from '../lib/api';

function Shell({ Component, pageProps }) {
  const { t, lang, setLang } = useT(), { user, logout } = useAuth(), r = useRouter();
  const [unread, setUnread] = useState(0), [menu, setMenu] = useState(false), [cfg, setCfg] = useState({});
  useEffect(() => { getConfig().then(setCfg); }, []);
  useEffect(() => {
    if (!user) { setUnread(0); return; }
    const f = () => api('/notifications').then((d) => setUnread(d.unread)).catch(() => {});
    f(); const id = setInterval(f, 60000); return () => clearInterval(id);
  }, [user]);
  useEffect(() => setMenu(false), [r.asPath]);
  const changeLang = (l) => { setLang(l); if (user) api('/me', { method: 'PATCH', body: { lang: l } }).catch(() => {}); };
  const L = (href, label) => <Link href={href} className={r.pathname === href ? 'on' : ''}>{label}</Link>;
  const customer = user?.role === 'customer';
  const verifyBanner = customer && user && !user.emailVerified && !user.phoneVerified && !user.needsPhone && !['/profile'].includes(r.pathname);

  return (
    <>
      <Head>
        <title>PAGH — Step Beyond | Luxury Footwear & Protected Restoration</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" type="image/png" href="/images/pagh-logo.png" />
        <meta name="description" content="PAGH Footwear SOS: Documented, dated, protected repair & luxury footwear care." />
      </Head>
      <a className="skip" href="#main">Skip to content</a>
      <header className="top">
        <div className="wrap bar">
          <Link href="/" className="logo">
            <div className="logo-badge-container">
              <img src="/images/pagh-logo.png" alt="PAGH Logo" className="logo-img" />
            </div>
            <div className="logo-text-group">
              <span className="brand-name">PAGH</span>
              <span className="brand-tagline">STEP BEYOND</span>
            </div>
          </Link>
          <button className="burger" aria-label="menu" aria-expanded={menu} onClick={() => setMenu(!menu)}>☰</button>
          <nav className={menu ? 'open' : ''} aria-label="main">
            {customer && (
              <>
                {L('/check', '🔍 AI Repair Verdict')}
                {L('/shop', '🛍️ Luxury Shop')}
                {L('/orders', '📦 Orders & Tracking')}
                {L('/wardrobe', '👟 Shoe Wardrobe')}
                {L('/wallet', '💰 Wallet & SLA')}
                {L('/claims', '🛡️ Protected Claims')}
                {L('/guides', '📖 Care Guides')}
              </>
            )}
            {user && !customer && L(homeFor(user), t('navPanel'))}
            <select value={lang} onChange={(e) => changeLang(e.target.value)} aria-label="language">
              {LANGS.map(([k, n]) => <option key={k} value={k}>{n}</option>)}
            </select>
            {user ? (
              <>
                <Link href="/notifications" className="bell" aria-label="notifications">
                  🔔{unread > 0 && <i>{unread > 9 ? '9+' : unread}</i>}
                </Link>
                {L('/profile', `👤 ${user.name?.split(' ')[0] || t('navProfile')}`)}
                <button
                  type="button"
                  className="btn sm logout-btn"
                  onClick={async () => { await logout(); r.push('/'); }}
                  title="Sign Out"
                >
                  🚪 Sign Out
                </button>
              </>
            ) : (
              <Link href="/login" className="btn sm">{t('login')} / {t('signup')}</Link>
            )}
          </nav>
        </div>
      </header>
      {verifyBanner && (
        <div className="wrap">
          <div className="alert warn" style={{ marginTop: 14 }}>
            {t('verifyBanner')} <Link href="/profile">{t('verifyNow')}</Link>
          </div>
        </div>
      )}
      <main id="main" className="wrap">
        <Gate>
          <Component {...pageProps} />
        </Gate>
      </main>
      <footer className="foot">
        <div className="wrap">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <img src="/images/pagh-logo.png" alt="PAGH" style={{ height: 26, background: '#FFF9F0', borderRadius: 4, padding: '2px 6px' }} />
              <span>© {new Date().getFullYear()} <strong>PAGH</strong> — STEP BEYOND · Protected Footwear Care</span>
            </div>
            <div className="links">
              <Link href="/page/terms">Terms</Link>
              <Link href="/page/privacy">Privacy</Link>
              <Link href="/page/refund-policy">Refund</Link>
              <Link href="/page/warranty-policy">Warranty</Link>
              <Link href="/page/protection-policy">Protection</Link>
              <Link href="/page/faq">FAQ</Link>
              {customer && <Link href="/apply">{t('becomePartner')}</Link>}
            </div>
          </div>
        </div>
      </footer>
    </>
  );
}

export default function App(props) {
  return (
    <I18nProvider>
      <AuthProvider>
        <ToastProvider>
          <Shell {...props} />
        </ToastProvider>
      </AuthProvider>
    </I18nProvider>
  );
}
