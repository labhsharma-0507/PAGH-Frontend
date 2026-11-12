import { useState, useEffect, createContext, useContext, useCallback } from 'react';
import { useT } from '../lib/i18n';

export const Spinner = () => <div className="spin" aria-label="loading" />;
export const Btn = ({ onClick, children, kind = 'primary', busy, disabled, type = 'button', small, ...r }) => {
  const [b, setB] = useState(false);
  const run = async (e) => { if (!onClick) return; setB(true); try { await onClick(e); } finally { setB(false); } };
  return <button type={type} className={`btn ${kind} ${small ? 'sm' : ''}`} disabled={disabled || b || busy} onClick={run} {...r}>{b || busy ? '…' : children}</button>;
};
export const Field = ({ label, hint, children }) => <label className="field"><span>{label}</span>{children}{hint && <small>{hint}</small>}</label>;
export const Card = ({ title, children, actions, className = '' }) => (
  <section className={`card ${className}`}>{(title || actions) && <div className="card-h"><h3>{title}</h3><div>{actions}</div></div>}{children}</section>
);
const TONE = { DELIVERED: 'ok', CLOSED: 'ok', APPROVED: 'ok', PAID: 'ok', SETTLED: 'ok', PUBLISHED: 'ok', ACTIVE: 'ok', SENT: 'info', REPAIR_WORTH_IT: 'ok', DIY_SAFE: 'ok',
  CANCELLED: 'bad', REJECTED: 'bad', QUOTE_REJECTED: 'bad', NOT_REPAIRABLE: 'bad', FAILED: 'bad', SUSPENDED: 'bad', NOT_WORTH_OR_NOT_REPAIRABLE: 'bad', blocked: 'bad', HOLD: 'warn', PENDING: 'warn', BORDERLINE: 'warn', INFO_NEEDED: 'warn', UNDER_REVIEW: 'info', QUOTE_SENT: 'warn' };
export const Badge = ({ s, children }) => <span className={`badge ${TONE[s] || 'info'}`}>{children || s}</span>;
export const Empty = ({ children }) => <p className="empty">{children}</p>;
export const Err = ({ e }) => (e ? <div className="alert bad" role="alert">{e.message || String(e)}</div> : null);
export function Modal({ title, onClose, children, wide }) {
  useEffect(() => { const h = (e) => e.key === 'Escape' && onClose(); window.addEventListener('keydown', h); return () => window.removeEventListener('keydown', h); }, [onClose]);
  return (
    <div className="modal-bg" onClick={onClose}>
      <div className={`modal ${wide ? 'wide' : ''}`} role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
        <div className="card-h"><h3>{title}</h3><button className="btn ghost sm" onClick={onClose} aria-label="close">✕</button></div>{children}
      </div>
    </div>
  );
}
export const Tabs = ({ tabs, value, onChange }) => (
  <div className="tabs" role="tablist">{tabs.map(([k, l]) => <button key={k} role="tab" aria-selected={value === k} className={value === k ? 'on' : ''} onClick={() => onChange(k)}>{l}</button>)}</div>
);
export const Table = ({ cols, rows, empty = 'Kuch nahi mila', onRow }) => (
  <div className="tbl"><table><thead><tr>{cols.map((c) => <th key={c.h}>{c.h}</th>)}</tr></thead>
    <tbody>{rows.length ? rows.map((r, i) => <tr key={r._id || r.id || i} onClick={onRow ? () => onRow(r) : undefined} className={onRow ? 'click' : ''}>{cols.map((c) => <td key={c.h}>{c.f(r)}</td>)}</tr>) : <tr><td colSpan={cols.length}><Empty>{empty}</Empty></td></tr>}</tbody></table></div>
);
// ---- toast
const TCtx = createContext(() => {});
export const useToast = () => useContext(TCtx);
export function ToastProvider({ children }) {
  const [l, setL] = useState([]);
  const push = useCallback((m, kind = 'ok') => { const id = Math.random(); setL((x) => [...x, { id, m, kind }]); setTimeout(() => setL((x) => x.filter((y) => y.id !== id)), 4000); }, []);
  return <TCtx.Provider value={push}>{children}<div className="toasts" aria-live="polite">{l.map((x) => <div key={x.id} className={`toast ${x.kind}`}>{x.m}</div>)}</div></TCtx.Provider>;
}
// ---- data hook: loading/error/reload
export function useLoad(fn, deps = []) {
  const [d, setD] = useState(null), [e, setE] = useState(null), [busy, setBusy] = useState(true);
  const load = useCallback(async () => { setBusy(true); try { setD(await fn()); setE(null); } catch (x) { setE(x); } finally { setBusy(false); } }, deps); // eslint-disable-line
  useEffect(() => { load(); }, [load]);
  return { d, e, busy, reload: load, setD };
}
// ---- action helper: toast on success/error
export function useAct() {
  const toast = useToast();
  return useCallback(async (fn, okMsg) => { try { const r = await fn(); if (okMsg) toast(okMsg); return r; } catch (e) { toast(e.message, 'bad'); return undefined; } }, [toast]);
}
export { useT };
