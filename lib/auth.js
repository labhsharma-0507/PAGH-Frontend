import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/router';
import { api, getUser, refresh, setSession, subscribe } from './api';
import { homeFor, ruleFor, safeNext } from './routes';
import { Spinner } from '../components/ui';
const Ctx = createContext({ user: null, ready: false });
export function AuthProvider({ children }) {
  const [user, setU] = useState(null), [ready, setReady] = useState(false);
  useEffect(() => {
    const un = subscribe((u) => setU(u ? { ...u } : null));
    refresh().finally(() => { setU(getUser()); setReady(true); });
    return un;
  }, []);
  const logout = useCallback(async () => { await api('/auth/logout', { method: 'POST' }).catch(() => {}); setSession(null); }, []);
  return <Ctx.Provider value={{ user, ready, logout }}>{children}</Ctx.Provider>;
}
export const useAuth = () => useContext(Ctx);
export { homeFor };
// Page guard: login nahi to /login, galat role to message
export function Guard({ roles, children }) {
  const { user, ready } = useAuth(), r = useRouter();
  useEffect(() => { if (ready && !user) r.replace('/login?next=' + encodeURIComponent(r.asPath)); }, [ready, user, r]);
  if (!ready || !user) return <div className="center"><Spinner /></div>;
  if (roles && !roles.includes(user.role)) return <div className="card"><h3>Ye page aapke account ke liye nahi hai</h3><a href={homeFor(user)}>Apne panel par jao</a></div>;
  return children;
}

// Central route gate: har page par login/role/onboarding check ek hi jagah se.
// Guest -> /login ; mustChangePassword -> /change-password ; phone nahi -> /complete-profile ; galat role -> apna panel.
export function Gate({ children }) {
  const { user, ready } = useAuth(), r = useRouter(), rule = ruleFor(r.pathname);
  let go = null;
  if (ready) {
    if (!user) { if (!rule.public) go = '/login?reason=login&next=' + encodeURIComponent(r.asPath); }
    else if (user.mustChangePassword && r.pathname !== '/change-password') go = '/change-password';
    else if (user.needsPhone && !rule.skipProfile && !rule.public) go = '/complete-profile?next=' + encodeURIComponent(r.asPath);
    else if (rule.roles && !rule.roles.includes(user.role)) go = homeFor(user);
    else if (r.pathname === '/' && user.role !== 'customer') go = homeFor(user);
    else if (r.pathname === '/login') go = safeNext(r.query.next, user);
  }
  useEffect(() => { if (go) r.replace(go); }, [go]); // eslint-disable-line
  if (!rule.public && (!ready || go)) return <div className="center"><Spinner /></div>;
  if (rule.public && ((rule.wait && !ready) || go)) return <div className="center"><Spinner /></div>;
  return children;
}
