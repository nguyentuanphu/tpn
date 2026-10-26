// Capture the composed interface, including DOM panels, without requesting screen-sharing permission.
// Foreign-object rendering is used where available; the canvas fallback retains visible controls/text on Safari.
const image = (src: string) => new Promise<HTMLImageElement>((resolve, reject) => { const i = new Image(); i.onload = () => resolve(i); i.onerror = reject; i.src = src; });
const dataURL = blob => new Promise(resolve => { const f = new FileReader(); f.onload = () => resolve(f.result); f.readAsDataURL(blob); });
const visible = n => { const s = getComputedStyle(n), r = n.getBoundingClientRect(); return s.display !== 'none' && s.visibility !== 'hidden' && +s.opacity > 0 && r.width > 0 && r.height > 0 && r.bottom > 0 && r.top < innerHeight; };
const privateField = n => n.matches?.('input[type="password"], input[type="file"], .fd-code, .fd-paircode, [data-private], [data-capture-private]') || n.closest?.('[data-capture-private]');
export const captureFieldValue = n => privateField(n) ? '••••' : (n.value || n.placeholder || '');
// Parse the resolved style once per node instead of reparsing it for every property.
const inlineStyle = (style: CSSStyleDeclaration) => Array.from(style, key => `${key}:${style.getPropertyValue(key)}`).join(';');
async function clone(n, world) {
  if (n.nodeType === Node.TEXT_NODE) return document.createTextNode(n.textContent);
  if (n.nodeType !== Node.ELEMENT_NODE || /SCRIPT|STYLE|LINK|NOSCRIPT/.test(n.tagName) || (!n.closest('svg') && !visible(n))) return document.createTextNode('');
  let c;
  if (n instanceof HTMLCanvasElement && n.closest('#stage') && world) { const hidden = document.createElement('div'); const style = getComputedStyle(n); hidden.style.cssText = inlineStyle(style); hidden.style.visibility = 'hidden'; return hidden; }
  if (n instanceof HTMLCanvasElement) { c = document.createElement('img'); try { c.src = (n.closest('#stage') && world ? world : n).toDataURL(); } catch { c.src = ''; } }
  else c = n.cloneNode(false);
  const s = getComputedStyle(n); c.style.cssText = inlineStyle(s);
  c.style.animation = 'none'; c.style.transition = 'none';
  if(privateField(n) && !(n instanceof HTMLInputElement) && !(n instanceof HTMLTextAreaElement)){c.textContent='••••';return c;}
  if (n instanceof HTMLImageElement) { const src = n.currentSrc || n.src; try { c.src = src.startsWith('data:image/') ? src : await dataURL(await (await fetch(src)).blob()); } catch { c.removeAttribute('src'); } c.removeAttribute('srcset'); }
  if (n instanceof HTMLInputElement || n instanceof HTMLTextAreaElement) { const style=c.style.cssText;c = document.createElement('div'); c.style.cssText = style; c.textContent = captureFieldValue(n); }
  else if (!(n instanceof HTMLCanvasElement)) for (const child of n.childNodes) c.appendChild(await clone(child, world));
  if (n.scrollTop) { c.style.overflow = 'hidden'; const inner = document.createElement('div'); while (c.firstChild) inner.appendChild(c.firstChild); inner.style.transform = `translateY(-${n.scrollTop}px)`; c.appendChild(inner); }
  return c;
}
async function fallback(c, source) {
  const g = c.getContext('2d'); g.fillStyle = '#dce8dc'; g.fillRect(0, 0, c.width, c.height);
  if (source) g.drawImage(source, 0, 0, c.width, c.height);
  g.save(); g.scale(c.width / innerWidth, c.height / innerHeight);
  const roots = [...document.querySelectorAll('.hud, .modal:not(.out), .gl, .dialog, .storybook, .theatre, .wardrobe, .apbox')].filter(visible);
  const paint = async n => {
    if (!visible(n)) return; const r = n.getBoundingClientRect(), s = getComputedStyle(n); g.save();
    if (s.overflowX !== 'visible' || s.overflowY !== 'visible') { g.beginPath(); g.rect(r.x, r.y, r.width, r.height); g.clip(); }
    if (s.backgroundColor !== 'rgba(0, 0, 0, 0)') { g.fillStyle = s.backgroundColor; g.beginPath(); g.roundRect(r.x, r.y, r.width, r.height, Math.min(parseFloat(s.borderRadius) || 0, r.width / 2, r.height / 2)); g.fill(); }
    if(privateField(n)){g.font=`${s.fontSize} ${s.fontFamily}`;g.fillStyle=s.color;g.fillText('••••',r.x+8,r.y+16);g.restore();return;}
    if (n instanceof HTMLImageElement && n.complete && n.naturalWidth) { try { g.drawImage(n, r.x, r.y, r.width, r.height); } catch {} }
    else if (n instanceof HTMLCanvasElement) { try { g.drawImage(n, r.x, r.y, r.width, r.height); } catch {} }
    else if (n.tagName.toLowerCase() === 'svg') { try { const svg = n.cloneNode(true); svg.setAttribute('xmlns', 'http://www.w3.org/2000/svg'); const i = await image('data:image/svg+xml;charset=utf-8,' + encodeURIComponent(new XMLSerializer().serializeToString(svg))); g.drawImage(i, r.x, r.y, r.width, r.height); } catch {} }
    else {
      for (const child of n.childNodes) {
        if (child.nodeType === Node.ELEMENT_NODE) await paint(child);
        else if (child.nodeType === Node.TEXT_NODE && child.textContent.trim()) {
          const range = document.createRange(); g.font = `${s.fontWeight} ${s.fontSize} ${s.fontFamily}`; g.fillStyle = s.color; g.textBaseline = 'top';
          const text = child.textContent; let line = '', x = 0, y = -1;
          for (let i = 0; i < text.length; i++) { range.setStart(child, i); range.setEnd(child, i + 1); const p = range.getBoundingClientRect(); if (p.top !== y) { if (line) g.fillText(line, x, y); line = ''; x = p.left; y = p.top; } line += text[i]; }
          if (line) g.fillText(line, x, y);
        }
      }
    }
    if (n instanceof HTMLInputElement || n instanceof HTMLTextAreaElement) { g.font = `${s.fontSize} ${s.fontFamily}`; g.fillStyle = s.color; g.fillText(captureFieldValue(n), r.x + 8, r.y + 8); }
    g.restore();
  };
  for (const root of roots) await paint(root); g.restore();
}
export async function captureScreen(source, { sceneOnly = false } = {}) {
  const c = document.createElement('canvas'); c.width = Math.min(720, innerWidth); c.height = Math.round(c.width * innerHeight / innerWidth);
  const g = c.getContext('2d');
  if (source) { const copy = document.createElement('canvas'); copy.width = source.width; copy.height = source.height; copy.getContext('2d').drawImage(source, 0, 0); source = copy; }
  if (sceneOnly) { if (source) g.drawImage(source, 0, 0, c.width, c.height); }
  else {
    try {
      const body = await clone(document.body, source); body.style.background = 'transparent'; body.style.margin = '0'; body.style.width = innerWidth + 'px'; body.style.height = innerHeight + 'px';
      const html = new XMLSerializer().serializeToString(body);
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${innerWidth}" height="${innerHeight}"><foreignObject width="100%" height="100%">${html}</foreignObject></svg>`;
      // Keep the captured world outside foreignObject: Safari can omit nested images
      // while still painting an opaque body background and the interface controls.
      const i = await image('data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg));
      const overlay = document.createElement('canvas'); overlay.width = c.width; overlay.height = c.height;
      const ink = overlay.getContext('2d'); ink.drawImage(i, 0, 0, c.width, c.height);
      const pixels = ink.getImageData(0, 0, overlay.width, overlay.height).data;
      let visibleInk = false; for (let p = 3; p < pixels.length; p += 64) if (pixels[p]) { visibleInk = true; break; }
      if (visibleInk) { if (source) g.drawImage(source, 0, 0, c.width, c.height); g.drawImage(overlay, 0, 0); }
      else await fallback(c, source);
    } catch { c.width = c.width; await fallback(c, source); }
  }
  let shot = c.toDataURL('image/jpeg', .65); if (shot.length > 180000) shot = c.toDataURL('image/jpeg', .35); if (shot.length > 180000) { const small = document.createElement('canvas'); small.width = c.width / 2; small.height = c.height / 2; small.getContext('2d').drawImage(c, 0, 0, small.width, small.height); shot = small.toDataURL('image/jpeg', .5); } return shot;
}
