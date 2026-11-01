// Capture the composed interface, including DOM panels, without requesting screen-sharing permission.
// Foreign-object rendering is used where available; the canvas fallback retains visible controls/text on Safari.
const image = (src: string) => new Promise<HTMLImageElement>((resolve, reject) => { const i = new Image(); i.onload = () => resolve(i); i.onerror = reject; i.src = src; });
const dataURL = blob => new Promise(resolve => { const f = new FileReader(); f.onload = () => resolve(f.result); f.readAsDataURL(blob); });
// (#375, 1 Nov 2026 AEDT) the tester's own floating ladybird is never in the picture of the screen (it showed twice)
const visible = n => { if (n.matches?.('.tester-floating, [data-capture-skip]')) return false; const s = getComputedStyle(n), r = n.getBoundingClientRect(); return s.display !== 'none' && s.visibility !== 'hidden' && +s.opacity > 0 && r.width > 0 && r.height > 0 && r.bottom > 0 && r.top < innerHeight; };
const privateField = n => n.matches?.('input[type="password"], input[type="file"], .fd-code, .fd-paircode, [data-private], [data-capture-private]') || n.closest?.('[data-capture-private]');
export const captureFieldValue = n => privateField(n) ? '••••' : (n.value || n.placeholder || '');
// Parse the resolved style once per node instead of reparsing it for every property.
const inlineStyle = (style: CSSStyleDeclaration) => Array.from(style, key => `${key}:${style.getPropertyValue(key)}`).join(';');
// (#745, a 3.0 s freeze on an Android tablet in "Con Gì Kêu Thế?": the automatic report of a line with no recording copied
// the screen while the child played. Every await below was on a finished value, so the whole copy of the page, a
// getComputedStyle for each of its thousands of nodes and drawings, ran as one block and no frame was drawn until it
// ended; the child's taps on the play button queued up behind it.) The copy now gives the browser a turn every few ms,
// so frames keep coming and taps are answered while a report is being made.
// (1 Nov 2026 AEDT) the slice of work grows with the browser's turn: when a frame takes long to draw (two players on one
// tablet), a fixed 8 ms slice made the copy wait for a frame every 8 ms and the report panel took 43 s to open. Now the
// copy works at least as long as it last waited (8 to 120 ms), so it never takes more than about twice its own time and no
// pause is longer than 120 ms
let sliceAt = 0, slice = 8;
export const captureBreathe = async () => { if (performance.now() - sliceAt < slice) return; const t0 = performance.now(); await new Promise(r => setTimeout(r, 0)); sliceAt = performance.now(); slice = Math.max(8, Math.min(120, sliceAt - t0)); };
// (#745) the copy of each element carried every one of its ~350 resolved styles: 2 MB of text for a game screen, which
// the browser then had to read back as one picture (over a second on its own). A style is now left out where the copy
// gets the same value anyway: an inherited one equal to its parent's, any other equal both to the browser's own default
// for that kind of element (read once from an empty frame) and to its parent's. The root and form fields keep all.
const INHERITED = new Set(('color font font-family font-size font-style font-variant font-weight font-stretch font-kerning font-feature-settings ' +
  'font-variation-settings font-optical-sizing font-size-adjust font-synthesis font-variant-ligatures font-variant-caps font-variant-numeric ' +
  'font-variant-east-asian font-variant-alternates font-variant-position letter-spacing line-height text-align text-align-last text-indent ' +
  'text-transform text-shadow white-space white-space-collapse text-wrap text-wrap-mode word-spacing word-break overflow-wrap word-wrap ' +
  'visibility cursor direction list-style list-style-type list-style-position list-style-image quotes tab-size hyphens hyphenate-character ' +
  'caret-color accent-color color-scheme pointer-events image-rendering text-rendering text-size-adjust -webkit-text-size-adjust ' +
  '-webkit-font-smoothing -webkit-text-fill-color -webkit-text-stroke-color -webkit-text-stroke-width -webkit-text-security ' +
  '-webkit-locale -webkit-tap-highlight-color -webkit-user-modify -webkit-rtl-ordering -webkit-border-horizontal-spacing ' +
  '-webkit-border-vertical-spacing -webkit-text-combine -webkit-text-orientation -webkit-writing-mode -webkit-hyphenate-character ' +
  '-webkit-line-break -webkit-print-color-adjust print-color-adjust line-break writing-mode text-orientation text-combine-upright ' +
  'text-underline-position text-underline-offset text-decoration-skip-ink text-emphasis text-emphasis-color text-emphasis-position ' +
  'text-emphasis-style ruby-position orphans widows border-collapse border-spacing caption-side empty-cells user-select -webkit-user-select ' +
  'fill fill-opacity fill-rule stroke stroke-dasharray stroke-dashoffset stroke-linecap stroke-linejoin stroke-miterlimit stroke-opacity ' +
  'stroke-width paint-order text-anchor dominant-baseline clip-rule color-interpolation color-interpolation-filters color-rendering ' +
  'shape-rendering marker marker-start marker-mid marker-end font-palette math-depth math-style forced-color-adjust').split(' '));
const inherits = (k: string) => k.startsWith('--') || INHERITED.has(k);
type Styles = Record<string, string>;
const valuesOf = (style: CSSStyleDeclaration): Styles => { const o: Styles = {}; for (const k of Array.from(style)) o[k] = style.getPropertyValue(k); return o; };
const fullStyle = (v: Styles) => Object.keys(v).map(k => `${k}:${v[k]}`).join(';');
let uaFrame: HTMLIFrameElement | null = null;
const uaBase = new Map<string, Styles | null>();
function defaultsOf(n: Element): Styles | null {
  const key = (n.namespaceURI || '') + '|' + n.localName;
  if (uaBase.has(key)) return uaBase.get(key);
  let out: Styles | null = null;
  try {
    if (!uaFrame) { uaFrame = document.createElement('iframe'); uaFrame.setAttribute('aria-hidden', 'true'); uaFrame.tabIndex = -1; uaFrame.style.cssText = 'position:fixed;left:-99px;top:-99px;width:1px;height:1px;border:0;visibility:hidden;pointer-events:none'; document.documentElement.appendChild(uaFrame); }
    const d = uaFrame.contentDocument; if (d && d.body) {
      const svg = n.namespaceURI === 'http://www.w3.org/2000/svg' && n.localName !== 'svg';
      const holder = svg ? d.body.appendChild(d.createElementNS('http://www.w3.org/2000/svg', 'svg')) : d.body;
      const e = holder.appendChild(d.createElementNS(n.namespaceURI, n.localName)); out = valuesOf(d.defaultView.getComputedStyle(e)); (svg ? holder : e).remove();
    }
  } catch { out = null; }
  uaBase.set(key, out); return out;
}
const leanStyle = (n: Element, v: Styles, parent: Styles | null) => {
  const base = parent && defaultsOf(n); if (!base) return fullStyle(v);
  const out: string[] = [];
  for (const k in v) { const x = v[k]; if (inherits(k) ? x === parent[k] : x === base[k] && x === parent[k]) continue; out.push(`${k}:${x}`); }
  return out.join(';');
};
async function clone(n, world, parent: Styles | null = null) {
  if (n.nodeType === Node.ELEMENT_NODE) await captureBreathe();
  if (n.nodeType === Node.TEXT_NODE) return document.createTextNode(n.textContent);
  if (n.nodeType !== Node.ELEMENT_NODE || /SCRIPT|STYLE|LINK|NOSCRIPT/.test(n.tagName) || (!n.closest('svg') && !visible(n))) return document.createTextNode('');
  let c;
  if (n instanceof HTMLCanvasElement && n.closest('#stage') && world) { const hidden = document.createElement('div'); const style = getComputedStyle(n); hidden.style.cssText = inlineStyle(style); hidden.style.visibility = 'hidden'; return hidden; }
  if (n instanceof HTMLCanvasElement) { c = document.createElement('img'); try { c.src = (n.closest('#stage') && world ? world : n).toDataURL(); } catch { c.src = ''; } }
  else c = n.cloneNode(false);
  const values = valuesOf(getComputedStyle(n)), field = n instanceof HTMLInputElement || n instanceof HTMLTextAreaElement || n instanceof HTMLCanvasElement; c.style.cssText = field ? fullStyle(values) : leanStyle(n, values, parent);
  c.style.animation = 'none'; c.style.transition = 'none';
  if(privateField(n) && !(n instanceof HTMLInputElement) && !(n instanceof HTMLTextAreaElement)){c.textContent='••••';return c;}
  if (n instanceof HTMLImageElement) { const src = n.currentSrc || n.src; try { c.src = src.startsWith('data:image/') ? src : await dataURL(await (await fetch(src)).blob()); } catch { c.removeAttribute('src'); } c.removeAttribute('srcset'); }
  if (n instanceof HTMLInputElement || n instanceof HTMLTextAreaElement) { const style=c.style.cssText;c = document.createElement('div'); c.style.cssText = style; c.textContent = captureFieldValue(n); }
  else if (!(n instanceof HTMLCanvasElement)) for (const child of n.childNodes) c.appendChild(await clone(child, world, values));
  if (n.scrollTop) { c.style.overflow = 'hidden'; const inner = document.createElement('div'); while (c.firstChild) inner.appendChild(c.firstChild); inner.style.transform = `translateY(-${n.scrollTop}px)`; c.appendChild(inner); }
  return c;
}
async function fallback(c, source) {
  const g = c.getContext('2d'); g.fillStyle = '#dce8dc'; g.fillRect(0, 0, c.width, c.height);
  if (source) g.drawImage(source, 0, 0, c.width, c.height);
  g.save(); g.scale(c.width / innerWidth, c.height / innerHeight);
  const roots = [...document.querySelectorAll('.hud, .modal:not(.out), .gl, .dialog, .storybook, .theatre, .wardrobe, .apbox')].filter(visible);
  const paint = async n => {
    await captureBreathe(); if (!visible(n)) return; const r = n.getBoundingClientRect(), s = getComputedStyle(n); g.save();
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
  sliceAt = performance.now();
  const c = document.createElement('canvas'); c.width = Math.min(720, innerWidth); c.height = Math.round(c.width * innerHeight / innerWidth);
  const g = c.getContext('2d');
  if (source) { const copy = document.createElement('canvas'); copy.width = source.width; copy.height = source.height; copy.getContext('2d').drawImage(source, 0, 0); source = copy; }
  if (sceneOnly) { if (source) g.drawImage(source, 0, 0, c.width, c.height); }
  else {
    try {
      const body = await clone(document.body, source); body.style.background = 'transparent'; body.style.margin = '0'; body.style.width = innerWidth + 'px'; body.style.height = innerHeight + 'px';
      await captureBreathe(); const html = new XMLSerializer().serializeToString(body); await captureBreathe();
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${innerWidth}" height="${innerHeight}"><foreignObject width="100%" height="100%">${html}</foreignObject></svg>`;
      // Keep the captured world outside foreignObject: Safari can omit nested images
      // while still painting an opaque body background and the interface controls.
      const i = await image('data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg));
      const overlay = document.createElement('canvas'); overlay.width = c.width; overlay.height = c.height;
      const ink = overlay.getContext('2d'); ink.drawImage(i, 0, 0, c.width, c.height);
      await captureBreathe(); const pixels = ink.getImageData(0, 0, overlay.width, overlay.height).data;
      let visibleInk = false; for (let p = 3; p < pixels.length; p += 64) if (pixels[p]) { visibleInk = true; break; }
      if (visibleInk) { if (source) g.drawImage(source, 0, 0, c.width, c.height); g.drawImage(overlay, 0, 0); }
      else await fallback(c, source);
    } catch { c.width = c.width; await fallback(c, source); }
    finally { uaFrame?.remove(); uaFrame = null; }
  }
  await captureBreathe(); let shot = c.toDataURL('image/jpeg', .65); if (shot.length > 180000) shot = c.toDataURL('image/jpeg', .35); if (shot.length > 180000) { const small = document.createElement('canvas'); small.width = c.width / 2; small.height = c.height / 2; small.getContext('2d').drawImage(c, 0, 0, small.width, small.height); shot = small.toDataURL('image/jpeg', .5); } return shot;
}
