// Role-based access map: kaun sa page kis role ke liye hai. Gate (pages/_app.js) isi se redirect karta hai.
export const homeFor = (u) => ({ admin: '/admin', partner: '/partner', agent: '/agent', droppoint: '/droppoint', brand: '/brand' }[u?.role] || '/');
const C = ['customer'];
const RULES = {
  // public (login ke bina)
  '/': { public: true, wait: true }, '/login': { public: true, wait: true }, '/verify-email': { public: true }, '/page/[slug]': { public: true },
  // koi bhi logged-in role
  '/profile': {}, '/notifications': {}, '/complete-profile': { skipProfile: true }, '/change-password': { skipProfile: true },
  // customer features
  '/check': { roles: C }, '/book': { roles: C }, '/orders': { roles: C }, '/wardrobe': { roles: C }, '/wallet': { roles: C }, '/claims': { roles: C },
  '/shop': { roles: C }, '/guides': { roles: C }, '/guides/[slug]': { roles: C }, '/apply': { roles: C },
  '/order/[id]': { roles: ['customer', 'admin'] }, '/invoice/[id]': { roles: ['customer', 'admin'] },
  // role panels
  '/admin': { roles: ['admin'] }, '/partner': { roles: ['partner', 'admin'] }, '/agent': { roles: ['agent', 'admin'] }, '/droppoint': { roles: ['droppoint'] }, '/brand': { roles: ['brand'] },
};
export const ruleFor = (pathname) => RULES[pathname] || {};
export const roleAllows = (pathname, user) => { const r = ruleFor(pathname); return !r.roles || r.roles.includes(user?.role); };
// login ke baad `next` sirf tab maanna jab us role ke liye allowed ho (open-redirect aur galat-role dono se bachav)
export const safeNext = (next, user) => {
  if (!next || typeof next !== 'string' || !next.startsWith('/') || next.startsWith('//')) return homeFor(user);
  const path = next.split(/[?#]/)[0] || '/';
  const key = Object.keys(RULES).find((k) => new RegExp('^' + k.replace(/\[[^\]]+\]/g, '[^/]+') + '$').test(path));
  return key && roleAllows(key, user) && !['/login', '/verify-email'].includes(key) ? next : homeFor(user);
};
