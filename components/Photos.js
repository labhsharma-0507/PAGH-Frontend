import { useState } from 'react';
import { compress } from '../lib/img';
import { uploadImage } from '../lib/api';
import { useT } from '../lib/i18n';
// Photos chun kar turant server/S3 par upload hoti hain; parent ko URLs milte hain (value/onChange).
export default function Photos({ value = [], onChange, max = 4, folder = 'misc', label, onData }) {
  const { t } = useT();
  const [busy, setB] = useState(false), [err, setErr] = useState('');
  const add = async (files) => {
    setErr(''); setB(true);
    try {
      const room = max - value.length, urls = [];
      for (const f of [...files].slice(0, room)) { const d = await compress(f); onData?.(d); urls.push(await uploadImage(d, folder)); }
      onChange([...value, ...urls]);
    } catch (e) { setErr(e.message); } finally { setB(false); }
  };
  return (
    <div className="photos">
      {label && <div className="lbl">{label}</div>}
      <div className="thumbs">
        {value.map((u, i) => <div key={u} className="th"><img src={u} alt="" /><button type="button" aria-label="remove" onClick={() => onChange(value.filter((_, j) => j !== i))}>✕</button></div>)}
        {value.length < max && <label className="th add">{busy ? '…' : '+'}<input type="file" accept="image/*" capture="environment" multiple hidden disabled={busy} onChange={(e) => { add(e.target.files); e.target.value = ''; }} /></label>}
      </div>
      <small>{t('photosHint', { n: value.length, max })}</small>
      {err && <div className="alert bad">{err}</div>}
    </div>
  );
}
