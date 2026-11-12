import { useEffect, useRef, useState } from 'react';
import QRCode from 'qrcode';
export function QR({ text, size = 180 }) {
  const r = useRef(null);
  useEffect(() => { if (r.current && text) QRCode.toCanvas(r.current, text, { width: size, margin: 1 }); }, [text, size]);
  return <canvas ref={r} aria-label={'QR ' + text} />;
}
// Camera QR scanner (BarcodeDetector support wale browsers mein, jaise Chrome Android). Warna manual code entry.
export function QRScan({ onScan, placeholder = 'QR code (e.g. QRAB12CD)' }) {
  const v = useRef(null), [on, setOn] = useState(false), [txt, setTxt] = useState(''), supported = typeof window !== 'undefined' && 'BarcodeDetector' in window;
  useEffect(() => {
    if (!on) return;
    let stop = false, stream;
    (async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
        v.current.srcObject = stream; await v.current.play();
        const det = new window.BarcodeDetector({ formats: ['qr_code'] });
        const tick = async () => {
          if (stop) return;
          try { const c = await det.detect(v.current); if (c[0]) { setOn(false); onScan(c[0].rawValue); return; } } catch {}
          requestAnimationFrame(tick);
        };
        tick();
      } catch { setOn(false); }
    })();
    return () => { stop = true; stream?.getTracks().forEach((t) => t.stop()); };
  }, [on]); // eslint-disable-line
  return (
    <div className="scan">
      {supported && <button type="button" className="btn ghost" onClick={() => setOn(!on)}>{on ? 'Camera band' : '📷 QR scan karo'}</button>}
      {on && <video ref={v} playsInline muted style={{ width: '100%', maxWidth: 320, borderRadius: 12 }} />}
      <div className="row"><input value={txt} onChange={(e) => setTxt(e.target.value.toUpperCase())} placeholder={placeholder} aria-label="QR code" /><button type="button" className="btn" onClick={() => txt && onScan(txt.trim())}>OK</button></div>
    </div>
  );
}
