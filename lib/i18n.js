import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { D } from './dict';
const Ctx = createContext({ t: (k) => k, lang: 'en', setLang: () => {} });

// Abhi ke liye sirf English aur Hindi
export const LANGS = [['en', 'English'], ['hi', 'हिन्दी']];

export function I18nProvider({ children, onChange }) {
  const [lang, setL] = useState('en');

  useEffect(() => {
    try {
      const l = localStorage.getItem('lang');
      if (l && ['en', 'hi'].includes(l)) {
        setL(l);
      } else {
        setL('en');
      }
    } catch {}
  }, []);

  const setLang = useCallback((l) => {
    if (!['en', 'hi'].includes(l)) l = 'en';
    setL(l);
    try { localStorage.setItem('lang', l); } catch {}
    onChange?.(l);
  }, [onChange]);

  // fallback: selected language -> English -> Hindi -> Hinglish -> key
  const t = useCallback((k, vars) => {
    let s = D[lang]?.[k] ?? D.en?.[k] ?? D.hi?.[k] ?? D.hg?.[k] ?? k;
    if (vars) for (const [a, b] of Object.entries(vars)) s = s.replace(`{${a}}`, b);
    return s;
  }, [lang]);

  return <Ctx.Provider value={{ t, lang, setLang }}>{children}</Ctx.Provider>;
}

export const useT = () => useContext(Ctx);
