export const anon = () => { try { let a = localStorage.getItem('anon'); if (!a) { a = Math.random().toString(36).slice(2) + Date.now().toString(36); localStorage.setItem('anon', a); } return a; } catch { return 'na'; } };
export const pick = (o, lang) => (o && (o[lang] || o.hg || o.en || Object.values(o)[0])) || '';
