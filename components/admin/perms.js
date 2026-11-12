// Backend PERMS ka mirror (sirf tabs dikhane ke liye; asli enforcement server par hota hai)
export const PERMS = {
  super: '*',
  ops: ['orders:read', 'orders', 'orders:override', 'partners', 'verdict', 'pricing', 'batches', 'claims:review', 'users:read', 'analytics', 'brands', 'notifications'],
  support: ['orders:read', 'orders', 'claims:review', 'users:read', 'notifications'],
  finance: ['orders:read', 'payments', 'payouts', 'claims:review', 'claims:settle', 'analytics', 'wallet', 'users:read'],
  content: ['content', 'shop', 'ads', 'analytics'],
};
export const can = (u, p) => PERMS[u?.adminRole] === '*' || (PERMS[u?.adminRole] || []).includes(p);
