export const compress = (f) => new Promise((res, rej) => {
  const r = new FileReader();
  r.onload = () => {
    const i = new Image();
    i.onload = () => {
      const s = Math.min(1, 1000 / Math.max(i.width, i.height)), c = document.createElement('canvas');
      c.width = Math.round(i.width * s); c.height = Math.round(i.height * s);
      c.getContext('2d').drawImage(i, 0, 0, c.width, c.height);
      res(c.toDataURL('image/jpeg', 0.65));
    };
    i.onerror = () => rej(new Error('Photo padh nahi paaye'));
    i.src = r.result;
  };
  r.onerror = rej; r.readAsDataURL(f);
});
export const loadScript = (src) => new Promise((res, rej) => {
  if (document.querySelector(`script[src="${src}"]`)) return res();
  const s = document.createElement('script'); s.src = src; s.onload = res; s.onerror = rej; document.body.appendChild(s);
});
