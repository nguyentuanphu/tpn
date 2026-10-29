// Shared canvas lifecycle for the second art set. Album writes use the existing device save.
import { T } from '../i18n.js';
import { saveProfiles } from '../state.js';
import { artSVG, pic } from '../art.js';
import { el } from '../util.js';

export async function paintArt(g: CanvasRenderingContext2D, key: string, x: number, y: number, size: number) {
  const svg = artSVG(key);
  if (!svg) throw new Error('Missing game artwork: ' + key);
  const image = new Image();
  image.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
  await image.decode();
  g.drawImage(image, x, y - size, size, size);
}

const COLOURS: [string, string, string][] = [
  ['#e63946', 'Red', 'Đỏ'], ['#ffb703', 'Yellow', 'Vàng'], ['#3cba54', 'Green', 'Xanh lá'],
  ['#2f80ed', 'Blue', 'Xanh dương'], ['#9b51e0', 'Purple', 'Tím'], ['#ff7eb6', 'Pink', 'Hồng']
];
let styled = false;
export async function runArtPad(api: any, options: {
  id: string; sayText: [string, string]; winTitle: [string, string];
  drawGuide: (g: CanvasRenderingContext2D, w: number, h: number) => void | Promise<void>;
}) {
  if (!styled) {
    styled = true;
    document.head.appendChild(el('style', '', `
.gl .gl-stage.artpad-stage {align-items:stretch;justify-content:flex-start;overflow:hidden}
.artpad {width:100%;height:100%;max-width:100%;min-height:0;margin:0 auto;text-align:center;display:flex;flex-direction:column}
.artpad-body {flex:1;min-height:0;overflow:auto;overscroll-behavior:contain;padding:4px}
.artpad .artpad-actions {flex:none;width:100%;margin:8px auto}
@media(max-width:380px){.artpad-actions{padding-left:72px;box-sizing:border-box}}
.artpad canvas {display:block;max-width:100%;margin:auto;border-radius:18px;touch-action:none;outline-offset:3px}
.artpad-row {display:flex;flex-wrap:wrap;gap:8px;justify-content:center;margin:12px auto}
.artpad button {min-width:44px;min-height:44px;border:2px solid var(--ink,#3b2a4f);border-radius:18px;font:inherit;cursor:pointer;background:#fff;color:#3b2a4f;padding:8px}
.artpad button[aria-pressed=true] {outline:3px solid var(--ink,#3b2a4f);outline-offset:2px}
.artpad button:disabled {opacity:.5;cursor:default}
.gl.little .artpad button {min-width:64px;min-height:64px}
.artpad .art {width:28px;height:28px;vertical-align:middle}
`));
  }
  api.stage.classList.add('artpad-stage');
  const root = el('div', 'artpad'), body = el('div', 'artpad-body'), canvas = document.createElement('canvas');
  const w = Math.floor(Math.max(180, Math.min(480, api.stage.getBoundingClientRect().width - 24, innerHeight * .52))), h = Math.round(w * .75);
  const dpr = Math.min(2, devicePixelRatio || 1);
  canvas.width = w * dpr; canvas.height = h * dpr;
  canvas.style.width = w + 'px'; canvas.style.height = h + 'px';
  canvas.tabIndex = 0; canvas.setAttribute('role', 'img');
  canvas.setAttribute('aria-label', T('Drawing canvas. Arrow keys move the brush; Space paints. Tab chooses a colour or saves.', 'Khung vẽ. Phím mũi tên di chuyển cọ; phím cách tô. Tab chọn màu hoặc lưu.'));
  const g = canvas.getContext('2d')!; g.scale(dpr, dpr); g.lineCap = 'round'; g.lineJoin = 'round';
  g.fillStyle = '#fffdf6'; g.fillRect(0, 0, w, h);
  body.appendChild(canvas); root.appendChild(body); api.stage.appendChild(root);
  let closed = false, painting = false, marks = 0, x = w / 2, y = h / 2, colour = 0;
  api.onCleanup(() => { closed = true; painting = false; });
  await options.drawGuide(g, w, h);
  if (closed || api.closed) return;
  // Cell guides use the same geometry as the painting tool.
  if (options.id === 'pixelpic' || options.id === 'mosaic') {
    const cell = w / (api.little ? 8 : 12);
    g.fillStyle = options.id === 'mosaic' ? '#e9ecef' : '#f1f5f9'; g.fillRect(0, 0, w, h);
    g.strokeStyle = '#adb5bd'; g.lineWidth = 1;
    for (let x = 0; x <= w; x += cell) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, h); g.stroke(); }
    for (let y = 0; y <= h; y += cell) { g.beginPath(); g.moveTo(0, y); g.lineTo(w, y); g.stroke(); }
  }
  // Scratch/rubbing use a separate image revealed only where the brush moves.
  const reveal = document.createElement('canvas'); reveal.width = canvas.width; reveal.height = canvas.height;
  const rg = reveal.getContext('2d')!;
  if (options.id === 'scratch') {
    const gradient = rg.createLinearGradient(0, 0, reveal.width, reveal.height);
    COLOURS.forEach(([c], i) => gradient.addColorStop(i / (COLOURS.length - 1), c));
    rg.fillStyle = gradient; rg.fillRect(0, 0, reveal.width, reveal.height);
  } else rg.drawImage(canvas, 0, 0);
  if (options.id === 'leafrub') { g.fillStyle = '#fffdf6'; g.fillRect(0, 0, w, h); }
  const row = el('div', 'artpad-row');
  const buttons = COLOURS.map(([c, en, vi], i) => {
    const b = el('button', '', T(en, vi));
    b.style.borderBottom = '8px solid ' + c;
    b.setAttribute('aria-pressed', String(i === colour));
    b.onclick = () => { colour = i; buttons.forEach((button, j) => button.setAttribute('aria-pressed', String(j === i))); };
    row.appendChild(b); return b;
  });
  row.style.display = ['scratch', 'leafrub', 'lacquer'].includes(options.id) ? 'none' : '';
  const done = el('button', '', `${pic('✅')} ${T('Keep in Album', 'Lưu vào Album')}`);
  done.disabled = true;
  const actions = el('div', 'artpad-row artpad-actions'); actions.appendChild(done);
  const hint = el('p', '', T('Paint with your finger or mouse. Keyboard: arrows move, Space paints. Make 12 marks, then keep your picture. Your album keeps the latest 12 pictures.', 'Vẽ bằng ngón tay hoặc chuột. Bàn phím: mũi tên di chuyển, phím cách tô. Tô 12 nét rồi lưu tranh. Album giữ 12 bức tranh mới nhất.'));
  body.append(row, hint); root.appendChild(actions); api.say(...options.sayText); api.dots(3, 0);
  function mark(nx: number, ny: number, join = false) {
    if (closed || api.closed) return;
    nx = Math.max(0, Math.min(w, nx)); ny = Math.max(0, Math.min(h, ny));
    const id = options.id;
    g.strokeStyle = g.fillStyle = id === 'lacquer' ? '#ffb703' : COLOURS[colour][0];
    g.lineWidth = api.little ? 16 : 10;
    if (id === 'scratch' || id === 'leafrub') {
      g.save(); g.beginPath(); g.arc(nx, ny, 18, 0, Math.PI * 2); g.clip();
      g.drawImage(reveal, 0, 0, w, h); g.restore();
    } else if (id === 'pixelpic' || id === 'mosaic') {
      const cell = w / (api.little ? 8 : 12);
      g.fillRect(Math.floor(nx / cell) * cell + 1, Math.floor(ny / cell) * cell + 1, cell - 2, cell - 2);
    } else if (id === 'bubblepaint' || id === 'stamps') {
      g.beginPath(); g.arc(nx, ny, api.little ? 14 : 10, 0, Math.PI * 2);
      if (id === 'stamps') g.fill(); else g.stroke();
    } else if (id === 'scene') {
      g.beginPath(); g.moveTo(nx, ny - 13); g.lineTo(nx + 12, ny + 10); g.lineTo(nx - 12, ny + 10); g.closePath(); g.fill();
    } else if (id === 'fireworks') {
      for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4; g.beginPath(); g.moveTo(nx + 6 * Math.cos(a), ny + 6 * Math.sin(a)); g.lineTo(nx + 20 * Math.cos(a), ny + 20 * Math.sin(a)); g.stroke(); }
    } else {
      g.beginPath(); g.moveTo(join ? x : nx, join ? y : ny); g.lineTo(nx + .1, ny + .1); g.stroke();
    }
    x = nx; y = ny; marks++; done.disabled = marks < 12; api.dots(3, Math.min(2, Math.floor(marks / 6)));
  }
  const point = (e: PointerEvent) => { const r = canvas.getBoundingClientRect(); return [(e.clientX - r.left) * w / r.width, (e.clientY - r.top) * h / r.height]; };
  canvas.onpointerdown = e => { e.preventDefault(); painting = true; if (e.isTrusted) canvas.setPointerCapture(e.pointerId); const p = point(e); mark(p[0], p[1]); };
  canvas.onpointermove = e => { if (painting) { const p = point(e); mark(p[0], p[1], true); } };
  canvas.onpointerup = canvas.onpointercancel = canvas.onlostpointercapture = () => { painting = false; };
  canvas.onkeydown = e => {
    const delta = ({ArrowLeft:[-10,0],ArrowRight:[10,0],ArrowUp:[0,-10],ArrowDown:[0,10]} as Record<string,number[]>)[e.key];
    if (delta) { e.preventDefault(); x = Math.max(0, Math.min(w, x + delta[0])); y = Math.max(0, Math.min(h, y + delta[1])); }
    if (e.code === 'Space' || e.key === 'Enter') { e.preventDefault(); mark(x, y); }
  };
  const stopped = new Promise<boolean>(resolve => api.onCleanup(() => resolve(false)));
  api.plan(() => {
    if (closed) return null;
    if (!done.disabled) return done;
    const rect = canvas.getBoundingClientRect();
    const path = Array.from({length:14}, (_, i) => ({x:rect.left + rect.width * (.15 + i * .045), y:rect.top + rect.height * (.4 + .1 * (i % 2))}));
    return {el:canvas, x:path[0].x, y:path[0].y, ms:700, path};
  }, {maxActions:3});
  const saved = await Promise.race([new Promise<boolean>(resolve => { done.onclick = () => { if (!done.disabled) resolve(true); }; }), stopped]);
  if (!saved || closed || api.closed) return;
  done.disabled = true;
  const png = canvas.toDataURL('image/png');
  for (const p of api.players || []) {
    if (!p) continue;
    if (!Array.isArray(p.album)) p.album = [];
    p.album.push(png); if (p.album.length > 12) p.album.splice(0, p.album.length - 12);
  }
  saveProfiles(); api.dots(3, 3);
  return api.win({title:T(...options.winTitle),titleVi:options.winTitle[1]});
}
