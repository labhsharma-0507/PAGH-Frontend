import { useState } from 'react';
import { api } from '../lib/api';
import { Btn, Card, Field, Modal, Table, Err, Spinner, useLoad, useAct } from './ui';
import Photos from './Photos';

// Generic admin CRUD. fields: [{k,label,type:text|number|select|bool|list|json|date|textarea|image|i18n, opts:[], hint, create:true(only on create)}]
const get = (o, k) => o?.[k];
const toForm = (fields, row) => Object.fromEntries(fields.map((f) => {
  let v = get(row, f.k);
  if (f.type === 'list') v = Array.isArray(v) ? v.join(', ') : '';
  else if (f.type === 'json') v = v ? JSON.stringify(v, null, 1) : '';
  else if (f.type === 'date') v = v ? new Date(v).toISOString().slice(0, 16) : '';
  else if (f.type === 'bool') v = v === undefined ? !!f.def : !!v;
  else if (f.type === 'i18n') v = { hg: v?.hg || '', en: v?.en || '', hi: v?.hi || '' };
  else if (f.type === 'image') v = v || [];
  else v = v ?? f.def ?? '';
  return [f.k, v];
}));
const toBody = (fields, form, editing) => {
  const b = {};
  for (const f of fields) {
    if (f.create && editing) continue;
    let v = form[f.k];
    if (f.type === 'number') { if (v === '') continue; v = Number(v); }
    else if (f.type === 'list') v = String(v).split(',').map((x) => x.trim()).filter(Boolean);
    else if (f.type === 'json') { if (!v) continue; v = JSON.parse(v); }
    else if (f.type === 'date') { if (!v) continue; v = new Date(v).toISOString(); }
    else if (f.type === 'i18n') v = Object.fromEntries(Object.entries(v).filter(([, x]) => x));
    else if (f.type === 'text' && v === '' && editing) v = '';
    b[f.k] = v;
  }
  return b;
};
export default function Crud({ title, path, fields, cols, filters = [], canCreate = true, canDelete = false, extraRow, toolbar, defaults = {} }) {
  const act = useAct(), [q, setQ] = useState(''), [flt, setFlt] = useState({}), [m, setM] = useState(null), [form, setForm] = useState({}), [err, setErr] = useState(null);
  const qs = new URLSearchParams({ limit: '100', ...(q ? { q } : {}), ...Object.fromEntries(Object.entries(flt).filter(([, v]) => v)) }).toString();
  const { d, busy, reload } = useLoad(() => api(`${path}?${qs}`), [qs]);
  const open = (row) => { setErr(null); setM(row || {}); setForm({ ...toForm(fields, row || {}), ...(row ? {} : defaults) }); };
  const save = async () => {
    setErr(null);
    try { const body = toBody(fields, form, !!m._id); await api(m._id ? `${path}/${m._id}` : path, { method: m._id ? 'PATCH' : 'POST', body }); setM(null); reload(); }
    catch (e) { setErr(e); }
  };
  const input = (f) => {
    const v = form[f.k], set = (x) => setForm({ ...form, [f.k]: x });
    if (f.type === 'select') return <select value={v} onChange={(e) => set(e.target.value)}>{f.opts.map((o) => <option key={o} value={o}>{o}</option>)}</select>;
    if (f.type === 'bool') return <input type="checkbox" checked={!!v} onChange={(e) => set(e.target.checked)} />;
    if (f.type === 'textarea' || f.type === 'json') return <textarea value={v} onChange={(e) => set(e.target.value)} rows={f.type === 'json' ? 6 : 3} />;
    if (f.type === 'number') return <input type="number" step="any" value={v} onChange={(e) => set(e.target.value)} />;
    if (f.type === 'date') return <input type="datetime-local" value={v} onChange={(e) => set(e.target.value)} />;
    if (f.type === 'image') return <Photos value={v} onChange={set} max={f.max || 3} folder="product" />;
    if (f.type === 'i18n') return <div className="col">{['hg', 'en', 'hi'].map((l) => <textarea key={l} rows={f.rows || 2} placeholder={l.toUpperCase()} value={v[l]} onChange={(e) => set({ ...v, [l]: e.target.value })} />)}</div>;
    return <input value={v} onChange={(e) => set(e.target.value)} />;
  };
  return (
    <Card title={title} actions={<div className="row">{toolbar}<input style={{ width: 160 }} placeholder="search" value={q} onChange={(e) => setQ(e.target.value)} />{filters.map((f) => <select key={f.k} style={{ width: 130 }} value={flt[f.k] || ''} onChange={(e) => setFlt({ ...flt, [f.k]: e.target.value })}><option value="">{f.label}</option>{f.opts.map((o) => <option key={o}>{o}</option>)}</select>)}{canCreate && <Btn small onClick={() => open(null)}>+ Add</Btn>}</div>}>
      {busy && !d ? <Spinner /> : <Table rows={d?.items || []} onRow={open} cols={[...cols, ...(extraRow ? [{ h: '', f: (r) => <span onClick={(e) => e.stopPropagation()}>{extraRow(r, reload)}</span> }] : [])]} />}
      <div className="small mute">{d?.total ?? 0} records · row par click = edit</div>
      {m && <Modal title={m._id ? 'Edit' : 'Add'} onClose={() => setM(null)} wide>
        <div className="grid g2">{fields.filter((f) => !(f.create && m._id)).map((f) => <Field key={f.k} label={f.label || f.k} hint={f.hint}>{input(f)}</Field>)}</div>
        <Err e={err} />
        <div className="row"><Btn onClick={save}>Save</Btn>{canDelete && m._id && <Btn kind="danger" onClick={() => confirm('Delete?') && act(async () => { await api(`${path}/${m._id}`, { method: 'DELETE' }); setM(null); reload(); })}>Delete</Btn>}</div>
      </Modal>}
    </Card>
  );
}
