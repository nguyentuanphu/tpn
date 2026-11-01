// The ten drawing games (owner's go, 23 Oct 2026 AEDT; brief docs/cores/tasks/drawing-games-r89.md), in the Play hub's
// Pictures area: Dot to Dot · Trace the Picture · Mirror Painting · Colour by Number · Decorate a Lantern · Make a Card ·
// Sand Drawing · Draw the Way · Draw a Shape · Copy the Picture. A finger or a mouse draws; nothing needs reading for the
// little ones; a finished lantern or card is kept in that child's Album on this device (never uploaded). Auto play plays
// each one with real taps and strokes (playwatch.ts plans and presses), like a child would.
import { register, untilRight } from './frame.js';
import { T } from '../i18n.js';
import { saveProfiles } from '../state.js';
import { pic } from '../art.js';
import { el, wait, pick, rand, shuffle, local, flip } from '../util.js';
import { cornersOf } from './drawshape.js';

type Pt = { x: number; y: number };
const NS = 'http://www.w3.org/2000/svg';
const COLOURS = ['#ff5a5f', '#ffb400', '#3cba54', '#2f80ed', '#9b51e0', '#ff7eb6'];
let styled = false;
function style() {
  if (styled) return; styled = true;
  document.head.appendChild(el('style', '', `
.dg-wrap { position: relative; margin: 0 auto; touch-action: none; }
.dg-cv { display: block; border-radius: 18px; box-shadow: 0 4px 14px rgba(40, 30, 60, .18); touch-action: none; background: #fffdf6; }
.dg-svg { position: absolute; inset: 0; width: 100%; height: 100%; pointer-events: none; }
.dg-row { display: flex; flex-wrap: wrap; gap: 8px; justify-content: center; align-items: center; margin: 10px auto 0; max-width: 96vw; }
.dg-sw { width: 44px; height: 44px; min-width: 44px; min-height: 44px; border-radius: 50%; border: 3px solid #fff; box-shadow: 0 2px 6px rgba(0, 0, 0, .25); cursor: pointer; font: 800 18px var(--font, sans-serif); color: #fff; text-shadow: 0 1px 2px rgba(0, 0, 0, .5); }
.dg-sw.on { outline: 4px solid #4a2a78; outline-offset: 2px; }
.dg-btn { min-width: 44px; min-height: 44px; padding: 6px 16px; border: 0; border-radius: 999px; background: #fff; box-shadow: 0 3px 0 rgba(59, 42, 79, .18); font: 800 17px var(--font, sans-serif); color: #3b2a4f; cursor: pointer; display: inline-flex; align-items: center; gap: 6px; }
.dg-btn .art { width: 30px; height: 30px; } .dg-btn.go { background: #3cba54; color: #fff; } .dg-btn[disabled] { opacity: .45; }
.dg-dot { position: absolute; width: 44px; height: 44px; margin: -22px 0 0 -22px; border: 0; background: transparent; cursor: pointer; padding: 0; }
.dg-dot i { position: absolute; left: 50%; top: 50%; width: 14px; height: 14px; margin: -7px 0 0 -7px; border-radius: 50%; background: #4a2a78; }
.dg-dot b { position: absolute; left: 50%; top: -2px; transform: translateX(-50%); font: 800 13px var(--font, sans-serif); color: #4a2a78; }
.dg-dot.done i { background: #3cba54; } .dg-dot.hint i { animation: dg-pulse .8s infinite; }
@keyframes dg-pulse { 50% { transform: scale(1.8); } }
.dg-grid { display: grid; gap: 3px; margin: 0 auto; }
.dg-grid button { width: 44px; height: 44px; min-width: 44px; min-height: 44px; border: 2px solid #d9cfe8; border-radius: 8px; background: #fff; cursor: pointer; padding: 0; }
.dg-grid.small button { width: 26px; height: 26px; min-width: 0; min-height: 0; cursor: default; }
.dg-pair { display: flex; flex-wrap: wrap; gap: 14px; justify-content: center; align-items: center; }
.dg-region { cursor: pointer; pointer-events: auto; stroke: #4a2a78; stroke-width: .8; }
.dg-lbl { pointer-events: none; font: 800 7px sans-serif; fill: #4a2a78; text-anchor: middle; dominant-baseline: middle; }
.gl.little .dg-sw, .gl.little .dg-btn, .gl.little .dg-dot, .gl.little .dg-grid:not(.small) button { min-width: 64px; min-height: 64px; }
.gl.little .dg-sw { width: 64px; height: 64px; } .gl.little .dg-dot { width: 64px; height: 64px; margin: -32px 0 0 -32px; }
`));
}

// (owner, 1 Nov 2026 AEDT: "the levels often don't change anything") one value per level: under-5s keep the first, big kids
// get Easy · Medium · Hard · Talent. Free drawing stays free; the games with a goal ask a little more each level. The values a
// game uses are on its stage (data-lv) for the checks.
const lv = <V>(api, little: V, easy: V, medium: V, hard: V, talent: V): V => api.little ? little : [easy, medium, hard, talent][Math.max(0, Math.min(3, api.smart || 0))];
const mark = (api, ...v: unknown[]) => { api.stage.dataset.lv = v.join(','); };

// ---------- shared pieces ----------
// a drawing pad the size of the stage (logical size w × h, sharp on high-density screens)
function pad(api, aspect = .75, bg = '#fffdf6') {
  const box = api.stage.getBoundingClientRect();
  const w = Math.round(Math.max(260, Math.min(560, box.width - 16, (innerHeight * .5) / aspect))), h = Math.round(w * aspect), dpr = Math.min(2, devicePixelRatio || 1);
  const wrap = el('div', 'dg-wrap'); wrap.style.width = w + 'px'; wrap.style.height = h + 'px';
  const c = el('canvas', 'dg-cv'); c.width = w * dpr; c.height = h * dpr; c.style.width = w + 'px'; c.style.height = h + 'px'; c.style.background = bg;
  const g = c.getContext('2d'); g.scale(dpr, dpr); g.lineCap = 'round'; g.lineJoin = 'round';
  wrap.appendChild(c); api.stage.appendChild(wrap);
  return { wrap, c, g, w, h };
}
// a pad point from a finger, the way the child sees it (also in a window turned face to face)
const at = (c, w, e): Pt => { const q = local(c, e), k = w / q.r.width; return { x: q.x * k, y: q.y * k }; };
// where a pad point is on the screen (auto play's finger)
function screen(c, w, p: Pt): Pt { const r = c.getBoundingClientRect(), k = r.width / w; return flip(c) < 0 ? { x: r.right - p.x * k, y: r.bottom - p.y * k } : { x: r.left + p.x * k, y: r.top + p.y * k }; }
const stroke = (c, w, pts: Pt[], ms = 1200) => { const s = pts.map(p => screen(c, w, p)); return { el: c, x: s[0].x, y: s[0].y, ms, path: s.slice(1) }; };
// fingers drawing on a pad: onPoint for each point, onEnd with the whole stroke
function drawable(c, w, onPoint: (p: Pt, first: boolean) => void, onEnd: (pts: Pt[]) => void) {
  let pts: Pt[] | null = null;
  c.onpointerdown = e => { pts = [at(c, w, e)]; onPoint(pts[0], true); if (e.isTrusted) try { c.setPointerCapture(e.pointerId); } catch (x) { } };
  c.onpointermove = e => { if (!pts) return; const p = at(c, w, e), l = pts[pts.length - 1]; if (Math.hypot(p.x - l.x, p.y - l.y) < 2) return; pts.push(p); onPoint(p, false); };
  c.onpointerup = c.onpointercancel = () => { if (!pts) return; const done = pts; pts = null; onEnd(done); };
}
// colour buttons; returns the buttons and the chosen colour
function palette(api, colours: string[], numbered = false) {
  const row = el('div', 'dg-row'), state = { colour: colours[0] };
  const btns = colours.map((c, i) => { const b = el('button', 'dg-sw' + (i ? '' : ' on'), numbered ? String(i + 1) : ''); b.style.background = c; b._c = c; b.setAttribute('aria-label', T('colour', 'màu') + ' ' + (i + 1)); row.appendChild(b);
    b.onclick = () => { state.colour = c; btns.forEach(x => x.classList.toggle('on', x === b)); api.sfx.tap(); }; return b; });
  api.stage.appendChild(row);
  return { row, btns, state, of: (c: string) => btns.find(b => b._c === c) };
}
const button = (html: string, cls = 'dg-btn') => el('button', cls, html);
// a picture kept in each playing child's Album on this device (the same 12 the camera keeps)
function keep(api, png: string) { for (const p of api.players || []) { if (!p || !Array.isArray(p.album)) continue; p.album.push(png); if (p.album.length > 12) p.album.shift(); } saveProfiles(); }
// evenly spaced points around a closed outline (unit coordinates → pad)
function around(poly: Pt[], n: number, w: number, h: number, m = .12): Pt[] {
  const P = poly.map(p => ({ x: (m + p.x * (1 - 2 * m)) * w, y: (m + p.y * (1 - 2 * m)) * h })), seg = P.map((p, i) => Math.hypot(P[(i + 1) % P.length].x - p.x, P[(i + 1) % P.length].y - p.y)), L = seg.reduce((a, b) => a + b, 0), out: Pt[] = [];
  for (let k = 0; k < n; k++) { let d = k / n * L, i = 0; while (d > seg[i]) { d -= seg[i]; i++; } const a = P[i], b = P[(i + 1) % P.length], t = d / (seg[i] || 1); out.push({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t }); }
  return out;
}
const ring = (n: number, r = .5, rot = -Math.PI / 2, inner = 0): Pt[] => Array.from({ length: inner ? n * 2 : n }, (_, i) => { const a = rot + i / (inner ? n * 2 : n) * Math.PI * 2, rr = inner && i % 2 ? inner : r; return { x: .5 + Math.cos(a) * rr, y: .5 + Math.sin(a) * rr }; });
// the outlines the dot and trace games draw (unit square)
const OUTLINES: { key: string; name: [string, string]; pts: Pt[]; fill: string }[] = [
  { key: 'star', name: ['a star', 'một ngôi sao'], pts: ring(5, .5, -Math.PI / 2, .22), fill: '#ffd23f' },
  { key: 'heart', name: ['a heart', 'một trái tim'], pts: Array.from({ length: 24 }, (_, i) => { const t = i / 24 * Math.PI * 2; return { x: .5 + .03 * 16 * Math.sin(t) ** 3, y: .45 - .03 * (13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t)) }; }), fill: '#ff5a7a' },
  { key: 'house', name: ['a house', 'một ngôi nhà'], pts: [{ x: .5, y: 0 }, { x: 1, y: .42 }, { x: .85, y: .42 }, { x: .85, y: 1 }, { x: .15, y: 1 }, { x: .15, y: .42 }, { x: 0, y: .42 }], fill: '#ffb38a' },
  { key: 'fish', name: ['a fish', 'một con cá'], pts: [{ x: 0, y: .5 }, { x: .2, y: .25 }, { x: .5, y: .15 }, { x: .75, y: .3 }, { x: 1, y: .1 }, { x: .92, y: .5 }, { x: 1, y: .9 }, { x: .75, y: .7 }, { x: .5, y: .85 }, { x: .2, y: .75 }], fill: '#5ac8fa' },
  { key: 'boat', name: ['a boat', 'một con thuyền'], pts: [{ x: .5, y: 0 }, { x: .85, y: .62 }, { x: 1, y: .66 }, { x: .82, y: 1 }, { x: .18, y: 1 }, { x: 0, y: .66 }, { x: .5, y: .66 }], fill: '#ff9f43' },
  { key: 'kite', name: ['a kite', 'một cánh diều'], pts: [{ x: .5, y: 0 }, { x: .95, y: .4 }, { x: .5, y: 1 }, { x: .05, y: .4 }], fill: '#e8433a' }
];

// ---------- 1. Dot to Dot: tap the dots in order and a picture appears ----------
register({
  id: 'dotdot', icon: '🔢', name: () => T('Dot to Dot', 'Nối Điểm'),
  async run(api) {
    // the level sets the dots (Talent: 20) and Talent draws one more picture
    style(); const rounds = api.talent ? 3 : 2, n = api.little ? 6 : [8, 10, 12, 15, 20][Math.max(0, Math.min(4, api.level - 1))];
    mark(api, rounds, n);
    api.say('Tap the dots in order, one, two, three, and see what picture appears!', 'Chạm các chấm theo thứ tự một, hai, ba, xem hiện ra hình gì nhé!');
    for (const [r, shape] of shuffle(OUTLINES).slice(0, rounds).entries()) {
      api.dots(rounds, r); api.stage.innerHTML = '';
      const { wrap, c, g, w, h } = pad(api, .8), P = around(shape.pts, n, w, h);
      const svg = document.createElementNS(NS, 'svg'); svg.setAttribute('class', 'dg-svg'); svg.setAttribute('viewBox', `0 0 ${w} ${h}`); wrap.appendChild(svg);
      const dots = P.map((p, k) => { const b = el('button', 'dg-dot', `<i></i><b>${k + 1}</b>`); b._k = k; b.style.left = p.x + 'px'; b.style.top = p.y + 'px'; b.setAttribute('aria-label', String(k + 1)); wrap.appendChild(b); return b; });
      g.strokeStyle = '#4a2a78'; g.lineWidth = 4;
      for (let k = 0; k < n; k++) {
        if (api.little) dots[k].classList.add('hint');
        const b = await untilRight(api, dots, e => e._k === k); if (!b || api.closed) return;
        b.classList.remove('hint'); b.classList.add('done'); api.sfx.pop(k % 8);
        if (k) { g.beginPath(); g.moveTo(P[k - 1].x, P[k - 1].y); g.lineTo(P[k].x, P[k].y); g.stroke(); }
      }
      g.beginPath(); g.moveTo(P[n - 1].x, P[n - 1].y); g.lineTo(P[0].x, P[0].y); g.stroke();
      g.fillStyle = shape.fill; g.beginPath(); P.forEach((p, i) => i ? g.lineTo(p.x, p.y) : g.moveTo(p.x, p.y)); g.closePath(); g.fill(); g.stroke();
      c.style.animation = 'dg-pulse 1s 1'; api.say(`It is ${shape.name[0]}!`, `Đó là ${shape.name[1]}!`); await wait(1800); if (api.closed) return;
    }
    api.dots(rounds, rounds); return api.win({ title: T('Lovely pictures, dot by dot!', 'Từng chấm một, thành tranh đẹp quá!') });
  }
});

// ---------- 2. Trace the Picture: follow the dotted line with a finger ----------
register({
  id: 'trace', icon: '✏️', name: () => T('Trace the Picture', 'Tô Theo Nét'),
  async run(api) {
    // a narrower path to stay on and more of it to cover each level (Talent: one more picture)
    style(); const rounds = lv(api, 2, 2, 3, 3, 4), tol = lv(api, 30, 26, 20, 15, 12), cover = lv(api, .85, .8, .85, .9, .93);
    mark(api, rounds, tol, cover);
    api.say('Follow the dotted line with your finger, all the way round!', 'Di ngón tay theo đường chấm chấm, đi hết một vòng nhé!');
    for (const [r, shape] of shuffle(OUTLINES).slice(0, rounds).entries()) {
      api.dots(rounds, r); api.stage.innerHTML = '';
      const { c, g, w, h } = pad(api, .8), S = around(shape.pts, 60, w, h), hit = new Set<number>();
      const paint = () => {
        g.clearRect(0, 0, w, h); g.setLineDash([2, 12]); g.strokeStyle = '#b9a6d8'; g.lineWidth = 10; g.beginPath(); S.forEach((p, i) => i ? g.lineTo(p.x, p.y) : g.moveTo(p.x, p.y)); g.closePath(); g.stroke(); g.setLineDash([]);
        g.fillStyle = '#3cba54'; for (const i of hit) { g.beginPath(); g.arc(S[i].x, S[i].y, 6, 0, 7); g.fill(); }
      };
      paint();
      let done: () => void = () => { }; const finished = new Promise<void>(res => done = res);
      drawable(c, w, p => { let more = false; S.forEach((s, i) => { if (!hit.has(i) && Math.hypot(s.x - p.x, s.y - p.y) < tol) { hit.add(i); more = true; } }); if (more) paint(); g.fillStyle = '#ffb400'; g.beginPath(); g.arc(p.x, p.y, 5, 0, 7); g.fill(); },
        () => { if (hit.size >= S.length * cover) done(); });
      api.plan(() => c.isConnected && hit.size < S.length * cover ? stroke(c, w, [...S, S[0]], 2000) : null, { maxActions: rounds * 4 });
      await finished; if (api.closed) return;
      g.fillStyle = shape.fill + 'aa'; g.beginPath(); S.forEach((p, i) => i ? g.lineTo(p.x, p.y) : g.moveTo(p.x, p.y)); g.closePath(); g.fill();
      api.right(); api.say(`You traced ${shape.name[0]}!`, `Con tô được ${shape.name[1]} rồi!`); await wait(1600); if (api.closed) return;
    }
    api.dots(rounds, rounds); return api.win({ title: T('Steady finger, great tracing!', 'Ngón tay vững quá, tô giỏi lắm!') });
  }
});

// ---------- 3. Mirror Painting: paint one side, the other side copies it ----------
const MIRRORS: { name: [string, string]; draw: (g, w: number, h: number) => void }[] = [
  { name: ['butterfly', 'con bướm'], draw: (g, w, h) => { for (const s of [-1, 1]) { g.beginPath(); g.ellipse(w / 2 + s * w * .2, h * .35, w * .18, h * .22, s * .4, 0, 7); g.stroke(); g.beginPath(); g.ellipse(w / 2 + s * w * .16, h * .7, w * .12, h * .14, -s * .4, 0, 7); g.stroke(); } g.beginPath(); g.moveTo(w / 2, h * .2); g.lineTo(w / 2, h * .85); g.stroke(); } },
  { name: ['lotus', 'hoa sen'], draw: (g, w, h) => { for (let k = -2; k <= 2; k++) { g.beginPath(); g.ellipse(w / 2 + k * w * .09, h * .5, w * .07, h * .26, k * .3, 0, 7); g.stroke(); } g.beginPath(); g.moveTo(w * .25, h * .8); g.quadraticCurveTo(w / 2, h * .95, w * .75, h * .8); g.stroke(); } },
  { name: ['kite', 'cánh diều'], draw: (g, w, h) => { g.beginPath(); g.moveTo(w / 2, h * .1); g.lineTo(w * .8, h * .45); g.lineTo(w / 2, h * .9); g.lineTo(w * .2, h * .45); g.closePath(); g.stroke(); g.beginPath(); g.moveTo(w * .2, h * .45); g.lineTo(w * .8, h * .45); g.stroke(); } }
];
register({
  id: 'mirror', icon: '🦋', name: () => T('Mirror Painting', 'Vẽ Đối Xứng'),
  async run(api) {
    // a finer brush and more to paint each level; on Talent the picture's guide lines are gone, only the middle line stays
    style(); const rounds = lv(api, 2, 2, 2, 3, 3), brush = lv(api, 16, 13, 11, 8, 6), fill = lv(api, 1.5, 1.2, 1.5, 2.2, 3);
    mark(api, rounds, brush, fill, api.talent ? 'noguide' : '');
    api.say('Paint on one side. The other side copies you, like a mirror!', 'Con vẽ một bên. Bên kia sẽ vẽ theo con, như soi gương!');
    for (const [r, m] of shuffle(MIRRORS).slice(0, rounds).entries()) {
      api.dots(rounds, r); api.stage.innerHTML = '';
      const { c, g, w, h } = pad(api, .8), pal = palette(api, COLOURS.slice(0, api.little ? 3 : 6));
      const guide = () => { g.save(); g.setLineDash([6, 8]); g.strokeStyle = '#cbbfe0'; g.lineWidth = 3; g.beginPath(); g.moveTo(w / 2, 0); g.lineTo(w / 2, h); g.stroke(); g.setLineDash([]); g.strokeStyle = '#b9a6d8'; if (!api.talent) m.draw(g, w, h); g.restore(); };
      guide();
      const done = button(`${pic('✅')} ${T('Finished', 'Xong rồi')}`, 'dg-btn go'); done.disabled = true; pal.row.appendChild(done);
      let painted = 0, last: Pt | null = null;
      drawable(c, w, (p, first) => {
        g.strokeStyle = pal.state.colour; g.lineWidth = brush;
        if (!first && last) for (const s of [1, -1]) { const f = (q: Pt) => s > 0 ? q : { x: w - q.x, y: q.y }; g.beginPath(); g.moveTo(f(last).x, f(last).y); g.lineTo(f(p).x, f(p).y); g.stroke(); painted += Math.hypot(p.x - last.x, p.y - last.y) / 2; }
        last = p; if (painted > w * fill) done.disabled = false;
      }, () => { last = null; });
      api.plan(() => { if (!c.isConnected) return null; if (!done.disabled) return done;
        const y0 = rand(h * .2, h * .6), pts = Array.from({ length: 14 }, (_, i) => ({ x: w * (.12 + .3 * Math.abs(Math.sin(i * .7))), y: y0 + i * h * .025 }));
        return stroke(c, w, pts, 900); }, { maxActions: rounds * 12 });
      const ok = await new Promise<boolean>(res => { done.onclick = () => res(true); api.onCleanup(() => res(false)); }); if (!ok || api.closed) return;
      api.right(done); api.say(`Your ${m.name[0]} is the same on both sides!`, `${m.name[1][0].toUpperCase() + m.name[1].slice(1)} của con hai bên giống hệt nhau!`); await wait(1500); if (api.closed) return;
    }
    api.dots(rounds, rounds); return api.win({ title: T('Mirror magic!', 'Phép thuật soi gương!') });
  }
});

// ---------- 4. Colour by Number: each number has its colour ----------
type Region = { n: number; svg: string; lx: number; ly: number };
const NUMBERED: { name: [string, string]; regions: Region[] }[] = [
  { name: ['house', 'ngôi nhà'], regions: [
    { n: 1, svg: '<rect x="0" y="80" width="100" height="20"/>', lx: 10, ly: 90 },
    { n: 2, svg: '<rect x="22" y="45" width="56" height="35"/>', lx: 32, ly: 60 },
    { n: 3, svg: '<polygon points="15,46 50,12 85,46"/>', lx: 50, ly: 34 },
    { n: 4, svg: '<rect x="44" y="58" width="16" height="22"/>', lx: 52, ly: 70 },
    { n: 5, svg: '<circle cx="85" cy="16" r="10"/>', lx: 85, ly: 16 },
    { n: 6, svg: '<rect x="62" y="52" width="13" height="13"/>', lx: 68.5, ly: 58.5 }] },
  { name: ['boat', 'con thuyền'], regions: [
    { n: 1, svg: '<rect x="0" y="78" width="100" height="22"/>', lx: 10, ly: 90 },
    { n: 2, svg: '<polygon points="15,62 85,62 72,78 28,78"/>', lx: 50, ly: 70 },
    { n: 3, svg: '<polygon points="50,12 50,58 18,58"/>', lx: 38, ly: 46 },
    { n: 4, svg: '<polygon points="54,18 54,58 82,58"/>', lx: 62, ly: 46 },
    { n: 5, svg: '<circle cx="86" cy="18" r="10"/>', lx: 86, ly: 18 },
    { n: 6, svg: '<polygon points="50,4 66,9 50,14"/>', lx: 56, ly: 9 }] },
  { name: ['flower', 'bông hoa'], regions: [
    { n: 1, svg: '<rect x="0" y="82" width="100" height="18"/>', lx: 10, ly: 91 },
    { n: 2, svg: '<rect x="47" y="45" width="6" height="38"/>', lx: 50, ly: 75 },
    { n: 3, svg: '<ellipse cx="38" cy="66" rx="10" ry="6"/>', lx: 38, ly: 66 },
    { n: 4, svg: '<circle cx="50" cy="16" r="11"/><circle cx="34" cy="32" r="11"/><circle cx="66" cy="32" r="11"/><circle cx="50" cy="44" r="9"/>', lx: 50, ly: 16 },
    { n: 5, svg: '<circle cx="50" cy="30" r="8"/>', lx: 50, ly: 30 },
    { n: 6, svg: '<circle cx="85" cy="14" r="9"/>', lx: 85, ly: 14 }] }
];
register({
  id: 'colournum', icon: '🎨', name: () => T('Colour by Number', 'Tô Màu Theo Số'),
  async run(api) {
    // more numbers and more pictures each level (Talent: all three pictures)
    style(); const rounds = lv(api, 1, 1, 2, 2, 3), k = lv(api, 3, 4, 5, 6, 6);
    mark(api, rounds, k);
    api.say('Each number has its own colour. Tap a colour, then tap every space with that number!', 'Mỗi số có một màu. Chạm vào một màu, rồi chạm vào những ô có số đó nhé!');
    for (const [r, picture] of shuffle(NUMBERED).slice(0, rounds).entries()) {
      api.dots(rounds, r); api.stage.innerHTML = '';
      const box = api.stage.getBoundingClientRect(), size = Math.round(Math.max(240, Math.min(440, box.width - 16, innerHeight * .45)));
      const svg = document.createElementNS(NS, 'svg'); svg.setAttribute('viewBox', '0 0 100 100'); svg.style.width = svg.style.height = size + 'px'; svg.style.display = 'block'; svg.style.margin = '0 auto'; svg.style.background = '#fffdf6'; svg.style.borderRadius = '18px';
      const regions = picture.regions.filter(x => x.n <= k), cols = COLOURS.slice(0, k);
      const shapes = regions.map(x => { const gEl = document.createElementNS(NS, 'g'); gEl.setAttribute('class', 'dg-region'); gEl.setAttribute('fill', '#ffffff'); gEl.innerHTML = x.svg; svg.appendChild(gEl); return { g: gEl, n: x.n, done: false }; });
      regions.forEach(x => { const t = document.createElementNS(NS, 'text'); t.setAttribute('class', 'dg-lbl'); t.setAttribute('x', String(x.lx)); t.setAttribute('y', String(x.ly)); t.textContent = String(x.n); svg.appendChild(t); });
      api.stage.appendChild(svg); const pal = palette(api, cols, true);
      api.plan(() => { const s = shapes.find(x => !x.done); if (!s || !svg.isConnected) return null; return pal.state.colour === cols[s.n - 1] ? s.g : pal.of(cols[s.n - 1]); }, { maxActions: rounds * 14 });
      await new Promise<void>(res => {
        api.onCleanup(res);
        for (const s of shapes) s.g.addEventListener('click', () => {
          if (s.done || api.closed) return;
          if (pal.state.colour !== cols[s.n - 1]) { api.wrong(null, `That space is number ${s.n}. Find colour ${s.n}!`, `Ô này là số ${s.n}. Tìm màu số ${s.n} nhé!`); return; }
          s.done = true; s.g.setAttribute('fill', cols[s.n - 1]); api.sfx.pop(s.n);
          if (shapes.every(x => x.done)) res();
        });
      });
      if (api.closed) return;
      api.right(svg); api.say(`What a colourful ${picture.name[0]}!`, `${picture.name[1][0].toUpperCase() + picture.name[1].slice(1)} nhiều màu đẹp quá!`); await wait(1600); if (api.closed) return;
    }
    api.dots(rounds, rounds); return api.win({ title: T('Every number in its colour!', 'Số nào màu nấy, đúng hết!') });
  }
});

// ---------- 5. Decorate a Lantern (Mid-Autumn): choose a shape, paint it, add stickers; kept in the Album ----------
const LANTERNS: { key: string; name: [string, string]; parts: string[] }[] = [
  { key: 'round', name: ['round lantern', 'đèn lồng tròn'], parts: ['<rect x="38" y="8" width="24" height="8" rx="2"/>', '<ellipse cx="50" cy="45" rx="30" ry="28"/>', '<rect x="38" y="72" width="24" height="7" rx="2"/>', '<polygon points="44,79 56,79 53,96 47,96"/>'] },
  { key: 'star', name: ['star lantern', 'đèn ông sao'], parts: ['<rect x="46" y="2" width="8" height="10" rx="2"/>', '<polygon points="50,12 59,36 85,37 64,52 72,78 50,63 28,78 36,52 15,37 41,36"/>', '<circle cx="50" cy="45" r="9"/>', '<polygon points="46,78 54,78 52,96 48,96"/>'] },
  { key: 'tall', name: ['tall lantern', 'đèn lồng dài'], parts: ['<rect x="34" y="6" width="32" height="8" rx="2"/>', '<rect x="30" y="14" width="40" height="30" rx="8"/>', '<rect x="30" y="44" width="40" height="30" rx="8"/>', '<polygon points="44,74 56,74 53,96 47,96"/>'] }
];
const STICKERS = ['🌙', '⭐', '🐰', '🌸'];
async function svgPNG(svg: SVGSVGElement, size = 512): Promise<string> {
  const src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(new XMLSerializer().serializeToString(svg));
  const img = new Image(); img.src = src; try { await img.decode(); } catch (e) { return ''; }
  const cv = document.createElement('canvas'); cv.width = cv.height = size; const g = cv.getContext('2d'); g.fillStyle = '#1d2a4a'; g.fillRect(0, 0, size, size); g.drawImage(img, 0, 0, size, size);
  return cv.toDataURL('image/jpeg', .85);
}
register({
  id: 'lanternart', icon: '🏮', name: () => T('Decorate a Lantern', 'Trang Trí Đèn Lồng'),
  async run(api) {
    style();
    // free decorating, with a little more to finish each level: parts to paint and stickers to add before "Finished"
    const needParts = lv(api, 2, 2, 3, 4, 4), needStickers = lv(api, 0, 0, 1, 2, 3);
    mark(api, needParts, needStickers);
    api.say('Make your own Mid-Autumn lantern! Choose a shape.', 'Làm đèn Trung Thu của riêng con nào! Chọn một hình đèn nhé.');
    api.dots(2, 0); api.stage.innerHTML = '';
    const row = el('div', 'dg-row'), shapes = LANTERNS.map(L => { const b = button(`<svg viewBox="0 0 100 100" width="56" height="56" fill="#ffd9a0" stroke="#4a2a78" stroke-width="3">${L.parts.join('')}</svg>`); b._L = L; b.setAttribute('aria-label', T(L.name[0], L.name[1])); row.appendChild(b); return b; });
    api.stage.appendChild(row);
    const chosen = await untilRight(api, shapes, () => true); if (!chosen || api.closed) return;
    const L = chosen._L; api.dots(2, 1); api.stage.innerHTML = '';
    api.say(`Your ${L.name[0]}! Tap a colour, then tap each part. Add stickers too!`, `${L.name[1][0].toUpperCase() + L.name[1].slice(1)} của con! Chạm một màu, rồi chạm vào từng phần. Dán thêm hình nữa nhé!`);
    const size = Math.round(Math.max(220, Math.min(380, api.stage.getBoundingClientRect().width - 16, innerHeight * .4)));
    const svg = document.createElementNS(NS, 'svg'); svg.setAttribute('xmlns', NS); svg.setAttribute('viewBox', '0 0 100 100'); svg.style.width = svg.style.height = size + 'px'; svg.style.display = 'block'; svg.style.margin = '0 auto'; svg.style.background = '#1d2a4a'; svg.style.borderRadius = '18px';
    const parts = L.parts.map(p => { const gEl = document.createElementNS(NS, 'g'); gEl.setAttribute('class', 'dg-region'); gEl.setAttribute('fill', '#fff7e6'); gEl.innerHTML = p; svg.appendChild(gEl); return { g: gEl, done: false }; });
    api.stage.appendChild(svg); const pal = palette(api, COLOURS);
    const srow = el('div', 'dg-row'), stick = STICKERS.map(s => { const b = button(pic(s)); b._s = s; b.setAttribute('aria-label', T('sticker', 'hình dán')); srow.appendChild(b); return b; });
    const done = button(`${pic('✅')} ${T('Finished', 'Xong rồi')}`, 'dg-btn go'); done.disabled = true; srow.appendChild(done); api.stage.appendChild(srow);
    if (!api.little && api.smart) api.show(`Paint ${needParts} parts and add ${needStickers} ${needStickers === 1 ? 'sticker' : 'stickers'}.`, `Tô ${needParts} phần và dán ${needStickers} hình nhé.`);
    let stuck = 0; const ready = () => { done.disabled = parts.filter(p => p.done).length < needParts || stuck < needStickers; };
    for (const p of parts) p.g.addEventListener('click', () => { if (api.closed) return; p.g.setAttribute('fill', pal.state.colour); if (!p.done) { p.done = true; api.sfx.pop(2); } ready(); });
    for (const b of stick) b.onclick = () => { if (api.closed || stuck >= 6) return; const t = document.createElementNS(NS, 'text'); t.setAttribute('x', String(32 + (stuck % 3) * 18)); t.setAttribute('y', String(36 + Math.floor(stuck / 3) * 18)); t.setAttribute('font-size', '13'); t.setAttribute('text-anchor', 'middle'); t.textContent = b._s; svg.appendChild(t); stuck++; api.sfx.tap(); ready(); };
    api.plan(() => { if (!svg.isConnected) return null; const p = parts.find(x => !x.done); if (p) { const c = COLOURS[parts.indexOf(p) % COLOURS.length]; return pal.state.colour === c ? p.g : pal.of(c); } return stuck < Math.max(2, needStickers) ? stick[stuck] : done; }, { maxActions: 14 });
    const ok = await new Promise<boolean>(res => { done.onclick = () => res(true); api.onCleanup(() => res(false)); }); if (!ok || api.closed) return;
    api.right(done); const png = await svgPNG(svg); if (png) keep(api, png);
    api.say('Your lantern is in your Album!', 'Đèn lồng của con đã ở trong Album rồi!'); await wait(1400); if (api.closed) return;
    api.dots(2, 2); return api.win({ title: T('A beautiful lantern for Mid-Autumn!', 'Đèn Trung Thu đẹp quá!') });
  }
});

// ---------- 6. Make a Card: Tết, a birthday or Mother's Day; kept in the Album ----------
const CARDS: { key: string; name: [string, string]; title: [string, string]; bg: string; stamps: string[] }[] = [
  { key: 'tet', name: ['Lunar New Year', 'Tết'], title: ['Happy Lunar New Year', 'Chúc Mừng Năm Mới'], bg: '#fff1d0', stamps: ['🧧', '🌸', '🏮', '⭐'] },
  { key: 'birthday', name: ['Birthday', 'Sinh nhật'], title: ['Happy Birthday', 'Chúc Mừng Sinh Nhật'], bg: '#e8f6ff', stamps: ['🎂', '🎈', '🎁', '⭐'] },
  { key: 'mum', name: ["Mother's Day", 'Ngày của Mẹ'], title: ["Happy Mother's Day", 'Mừng Ngày của Mẹ'], bg: '#fff0f6', stamps: ['💐', '💖', '🌷', '🌸'] }
];
register({
  id: 'card', icon: '💌', name: () => T('Make a Card', 'Làm Thiệp'),
  async run(api) {
    style();
    // free making, with a little more on the card each level before "Finished"
    const need = lv(api, 2, 2, 3, 4, 5); mark(api, need);
    api.say('Make a card for someone you love! Who is it for?', 'Làm một tấm thiệp tặng người con yêu nhé! Thiệp cho dịp gì?');
    api.dots(2, 0); api.stage.innerHTML = '';
    const row = el('div', 'dg-row'), kinds = CARDS.map(k => { const b = button(`${pic(k.stamps[0])} ${T(k.name[0], k.name[1])}`); b._k = k; row.appendChild(b); return b; });
    api.stage.appendChild(row);
    const chosen = await untilRight(api, kinds, () => true); if (!chosen || api.closed) return;
    const K = chosen._k; api.dots(2, 1); api.stage.innerHTML = '';
    api.say('Tap a picture, then tap the card to stick it. Or draw with a colour!', 'Chạm một hình, rồi chạm vào thiệp để dán. Hoặc chọn màu để vẽ nhé!');
    const { c, g, w, h } = pad(api, .7, K.bg);
    const head = () => { g.fillStyle = '#4a2a78'; g.textAlign = 'center'; g.font = `800 ${Math.round(w * .06)}px sans-serif`; g.fillText(K.title[0], w / 2, h * .12); g.font = `700 ${Math.round(w * .05)}px sans-serif`; g.fillText(K.title[1], w / 2, h * .21); };
    head();
    const pal = palette(api, COLOURS), srow = el('div', 'dg-row');
    let stamp: string | null = null, things = 0;
    const stamps = K.stamps.map(s => { const b = button(pic(s)); b._s = s; b.setAttribute('aria-label', T('picture', 'hình')); srow.appendChild(b); b.onclick = () => { stamp = s; api.sfx.tap(); stamps.forEach(x => x.classList.toggle('on', x === b)); }; return b; });
    pal.btns.forEach(b => b.addEventListener('click', () => { stamp = null; stamps.forEach(x => x.classList.remove('on')); }));
    const done = button(`${pic('✅')} ${T('Finished', 'Xong rồi')}`, 'dg-btn go'); done.disabled = true; srow.appendChild(done); api.stage.appendChild(srow);
    let last: Pt | null = null;
    drawable(c, w, (p, first) => {
      if (stamp && first) { g.font = `${Math.round(w * .13)}px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(stamp, p.x, p.y); g.textBaseline = 'alphabetic'; things++; api.sfx.pop(things % 8); }
      else if (!stamp) { g.strokeStyle = pal.state.colour; g.lineWidth = 8; if (!first && last) { g.beginPath(); g.moveTo(last.x, last.y); g.lineTo(p.x, p.y); g.stroke(); } }
      last = p; done.disabled = things < need;
    }, pts => { last = null; if (!stamp && pts.length > 8) things++; done.disabled = things < need; });
    if (!api.little && api.smart) api.show(`Add ${need} pictures or drawings.`, `Thêm ${need} hình dán hoặc nét vẽ nhé.`);
    api.plan(() => { if (!c.isConnected) return null; if (things >= Math.max(3, need)) return done; if (stamp !== K.stamps[things % 4]) return stamps[things % 4];
      const p = { x: w * (.2 + .3 * things), y: h * (.45 + .15 * (things % 2)) }; return stroke(c, w, [p, p], 80); }, { maxActions: 12 });
    const ok = await new Promise<boolean>(res => { done.onclick = () => res(true); api.onCleanup(() => res(false)); }); if (!ok || api.closed) return;
    api.right(done); keep(api, c.toDataURL('image/jpeg', .85));
    api.say('Your card is in your Album! You can show it to them.', 'Thiệp của con đã ở trong Album rồi! Con đem tặng nhé.'); await wait(1400); if (api.closed) return;
    api.dots(2, 2); return api.win({ title: T('What a lovely card!', 'Tấm thiệp xinh quá!') });
  }
});

// ---------- 7. Sand Drawing: draw on the beach, a wave washes it away ----------
const SAND_IDEAS: [string, string, string][] = [['☀️', 'a sun', 'ông mặt trời'], ['🐟', 'a fish', 'con cá'], ['❤️', 'a heart', 'trái tim'], ['⭐', 'a star', 'ngôi sao'], ['🐚', 'a shell', 'vỏ sò'], ['🦀', 'a crab', 'con cua']];
register({
  id: 'sand', icon: '🏖️', name: () => T('Sand Drawing', 'Vẽ Trên Cát'),
  async run(api) {
    // free drawing; more drawings and a bigger drawing before the wave each level, with a finer stick (light changes)
    style(); const rounds = lv(api, 3, 2, 3, 4, 5), amount = lv(api, .8, .6, .8, 1.2, 1.6), line = lv(api, 12, 10, 8, 6, 5), beach = pick([['Vũng Tàu', 'Vũng Tàu'], ['Bondi Beach', 'bãi biển Bondi']]);
    mark(api, rounds, amount, line);
    api.say(`Draw in the sand at ${beach[0]}! When you finish, tap the wave to wash it away.`, `Vẽ trên cát ở ${beach[1]} nào! Vẽ xong, chạm vào con sóng để sóng xoá đi nhé.`);
    api.stage.innerHTML = '';
    const { c, g, w, h } = pad(api, .75, '#f3d9a4');
    const sea = () => { g.fillStyle = '#5ac8fa'; g.fillRect(0, 0, w, h * .18); g.fillStyle = '#ffffffaa'; for (let x = 0; x < w; x += 30) { g.beginPath(); g.arc(x + 15, h * .18, 15, Math.PI, 0); g.fill(); } };
    const fresh = () => { g.fillStyle = '#f3d9a4'; g.fillRect(0, 0, w, h); for (let i = 0; i < 160; i++) { g.fillStyle = i % 2 ? '#e8c98d' : '#f8e4b8'; g.fillRect(rand(0, w), rand(h * .2, h), 2, 2); } sea(); };
    fresh();
    const row = el('div', 'dg-row'), wave = button(`${pic('🌊')} ${T('Wave!', 'Sóng ơi!')}`, 'dg-btn go'); wave.disabled = true; row.appendChild(wave); api.stage.appendChild(row);
    let drawn = 0, last: Pt | null = null;
    drawable(c, w, (p, first) => { if (p.y < h * .2) return; g.strokeStyle = '#b98a4a'; g.lineWidth = line; if (!first && last) { g.beginPath(); g.moveTo(last.x, last.y); g.lineTo(p.x, p.y); g.stroke(); drawn += Math.hypot(p.x - last.x, p.y - last.y); } last = p; if (drawn > w * amount) wave.disabled = false; }, () => { last = null; });
    api.plan(() => { if (!c.isConnected) return null; if (!wave.disabled) return wave; const cx = rand(w * .3, w * .7), cy = rand(h * .45, h * .7), R = w * .14;
      return stroke(c, w, Array.from({ length: 26 }, (_, i) => ({ x: cx + Math.cos(i / 24 * Math.PI * 2) * R, y: cy + Math.sin(i / 24 * Math.PI * 2) * R })), 1000); }, { maxActions: rounds * 6 });
    for (let r = 0; r < rounds; r++) {
      api.dots(rounds, r); const idea = pick(SAND_IDEAS); drawn = 0; wave.disabled = true;
      api.show(`Draw ${idea[1]}, or anything you like!`, `Vẽ ${idea[2]}, hay bất cứ gì con thích!`);
      const ok = await new Promise<boolean>(res => { wave.onclick = () => res(true); api.onCleanup(() => res(false)); }); if (!ok || api.closed) return;
      api.right(wave); api.sfx.whoosh();
      for (let k = 0; k <= 10; k++) { g.fillStyle = '#5ac8fa55'; g.fillRect(0, 0, w, h * k / 10); await wait(50); }
      fresh(); await wait(300); if (api.closed) return;
    }
    api.dots(rounds, rounds); return api.win({ title: T('A beach full of drawings!', 'Cả bãi biển đầy tranh của con!') });
  }
});

// ---------- 8. Draw the Way: a line that takes the duckling round the rocks to the pond ----------
register({
  id: 'drawpath', icon: '🦆', name: () => T('Draw the Way', 'Vẽ Đường Đi'),
  async run(api) {
    // the level sets the rocks; on Talent there is one more duckling and the gaps between the rocks are tighter
    style(); const rounds = api.talent ? 4 : 3, nRocks = api.little ? 2 : 2 + api.level + (api.talent ? 1 : 0);
    mark(api, rounds, nRocks, api.talent ? 'tight' : '');
    api.say('Draw a line from the duckling to the pond. Go around the rocks!', 'Vẽ một đường từ chú vịt con đến cái ao. Đi vòng qua những hòn đá nhé!');
    for (let r = 0; r < rounds; r++) {
      api.dots(rounds, r); api.stage.innerHTML = '';
      const { c, g, w, h } = pad(api, .7, '#c8ecb0'), duck = { x: w * .08, y: rand(h * .25, h * .75) }, pond = { x: w * .9, y: rand(h * .25, h * .75) };
      // a safe way first, then rocks beside it (never on it), so every round can be done
      const way: Pt[] = [duck, ...[.3, .5, .7].map(f => ({ x: w * f, y: rand(h * .2, h * .8) })), pond], R = Math.max(16, w * .05), safe = R + (api.little ? 30 : api.talent ? 15 : 22);
      const dense: Pt[] = []; way.forEach((p, i) => { if (!i) return; const a = way[i - 1]; for (let k = 0; k < 12; k++) dense.push({ x: a.x + (p.x - a.x) * k / 12, y: a.y + (p.y - a.y) * k / 12 }); }); dense.push(pond);
      const rocks: Pt[] = []; for (let tries = 0; rocks.length < nRocks && tries < 400; tries++) { const q = { x: rand(w * .2, w * .8), y: rand(R, h - R) }; if (dense.every(d => Math.hypot(d.x - q.x, d.y - q.y) > safe + R) && rocks.every(o => Math.hypot(o.x - q.x, o.y - q.y) > R * 2.4)) rocks.push(q); }
      const font = (s: number) => `${s}px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif`;
      const scene = () => { g.fillStyle = '#c8ecb0'; g.fillRect(0, 0, w, h); g.fillStyle = '#5ac8fa'; g.beginPath(); g.ellipse(pond.x, pond.y, w * .08, h * .1, 0, 0, 7); g.fill(); g.fillStyle = '#8a8f98'; for (const o of rocks) { g.beginPath(); g.arc(o.x, o.y, R, 0, 7); g.fill(); } g.textAlign = 'center'; g.textBaseline = 'middle'; g.font = font(Math.round(w * .07)); g.fillText('🦆', duck.x, duck.y); g.textBaseline = 'alphabetic'; };
      scene();
      let line: Pt[] = [], resolveRound: (ok: boolean) => void = () => { };
      drawable(c, w, (p, first) => { if (first) { scene(); line = []; } line.push(p); g.strokeStyle = '#ffb400'; g.lineWidth = 6; if (line.length > 1) { const a = line[line.length - 2]; g.beginPath(); g.moveTo(a.x, a.y); g.lineTo(p.x, p.y); g.stroke(); } },
        async pts => {
          const start = Math.hypot(pts[0].x - duck.x, pts[0].y - duck.y) < w * .12, end = Math.hypot(pts[pts.length - 1].x - pond.x, pts[pts.length - 1].y - pond.y) < w * .12, hitRock = pts.some(p => rocks.some(o => Math.hypot(o.x - p.x, o.y - p.y) < R));
          if (!start) { api.wrong(null, 'Start at the duckling!', 'Bắt đầu từ chú vịt con nhé!'); scene(); return; }
          if (hitRock) { api.wrong(null, 'Ouch, a rock! Draw around it.', 'Ôi, đụng đá rồi! Vẽ vòng qua nhé.'); scene(); return; }
          if (!end) { api.wrong(null, 'Keep going, all the way to the pond!', 'Vẽ tiếp đến tận cái ao nhé!'); scene(); return; }
          c.onpointerdown = null;
          for (const p of pts.filter((_, i) => i % 2 === 0)) { scene(); g.strokeStyle = '#ffb400'; g.lineWidth = 6; g.beginPath(); pts.forEach((q, i) => i ? g.lineTo(q.x, q.y) : g.moveTo(q.x, q.y)); g.stroke(); g.font = font(Math.round(w * .07)); g.textBaseline = 'middle'; g.fillText('🦆', p.x, p.y); g.textBaseline = 'alphabetic'; await wait(25); if (api.closed) return; }
          resolveRound(true);
        });
      api.plan(() => c.isConnected ? stroke(c, w, dense, 1400) : null, { maxActions: rounds * 4 });
      const ok = await new Promise<boolean>(res => { resolveRound = res; api.onCleanup(() => res(false)); }); if (!ok || api.closed) return;
      api.right(); api.say('Splash! The duckling is in the pond!', 'Tõm! Vịt con xuống ao rồi!'); await wait(1300); if (api.closed) return;
    }
    api.dots(rounds, rounds); return api.win({ title: T('You showed every duckling the way!', 'Con chỉ đường cho các chú vịt giỏi quá!') });
  }
});

// ---------- 9. Draw a Shape: the game knows a circle, a triangle and a square ----------
const SHAPES: { key: string; corners: number; name: [string, string]; pts: (cx: number, cy: number, r: number) => Pt[] }[] = [
  { key: 'circle', corners: 0, name: ['a circle', 'hình tròn'], pts: (cx, cy, r) => Array.from({ length: 37 }, (_, i) => ({ x: cx + Math.cos(i / 36 * Math.PI * 2) * r, y: cy + Math.sin(i / 36 * Math.PI * 2) * r })) },
  { key: 'triangle', corners: 3, name: ['a triangle', 'hình tam giác'], pts: (cx, cy, r) => edges([{ x: cx, y: cy - r }, { x: cx + r, y: cy + r * .8 }, { x: cx - r, y: cy + r * .8 }]) },
  { key: 'square', corners: 4, name: ['a square', 'hình vuông'], pts: (cx, cy, r) => edges([{ x: cx - r, y: cy - r }, { x: cx + r, y: cy - r }, { x: cx + r, y: cy + r }, { x: cx - r, y: cy + r }]) }
];
function edges(P: Pt[]): Pt[] { const out: Pt[] = []; P.forEach((a, i) => { const b = P[(i + 1) % P.length]; for (let k = 0; k < 10; k++) out.push({ x: a.x + (b.x - a.x) * k / 10, y: a.y + (b.y - a.y) * k / 10 }); }); out.push(P[0]); return out; }
register({
  id: 'shapedraw', icon: '🔺', name: () => T('Draw a Shape', 'Vẽ Hình'),
  async run(api) {
    // more shapes each level; Easy keeps to the circle and the square
    style(); const rounds = lv(api, 3, 3, 4, 5, 6), kinds = api.little || !api.smart ? [SHAPES[0], SHAPES[2]] : SHAPES;
    mark(api, rounds, kinds.length);
    api.say('I will ask for a shape. Draw it with your finger, in one go!', 'Cô sẽ đố một hình. Con vẽ bằng ngón tay, một nét liền nhé!');
    let prev = '';
    for (let r = 0; r < rounds; r++) {
      api.dots(rounds, r); api.stage.innerHTML = '';
      let want = pick(kinds); while (want.key === prev && kinds.length > 1) want = pick(kinds); prev = want.key;
      const { c, g, w, h } = pad(api, .8); api.say(`Draw ${want.name[0]}!`, `Vẽ ${want.name[1]} nào!`);
      let last: Pt | null = null, resolveRound: (ok: boolean) => void = () => { };
      drawable(c, w, (p, first) => { if (first) g.clearRect(0, 0, w, h); g.strokeStyle = '#4a2a78'; g.lineWidth = 7; if (!first && last) { g.beginPath(); g.moveTo(last.x, last.y); g.lineTo(p.x, p.y); g.stroke(); } last = p; },
        pts => { last = null; const n = cornersOf(pts), got = SHAPES.find(s => s.corners === n);
          if (n === -1) { api.wrong(null, 'Join the end back to the start!', 'Nối điểm cuối về chỗ bắt đầu nhé!'); return; }
          if (!got || got.key !== want.key) { api.wrong(null, got ? `That looks like ${got.name[0]}. Try ${want.name[0]}!` : `Try ${want.name[0]} again!`, got ? `Trông giống ${got.name[1]}. Thử vẽ ${want.name[1]} nhé!` : `Vẽ lại ${want.name[1]} nhé!`); return; }
          resolveRound(true); });
      api.plan(() => c.isConnected ? stroke(c, w, want.pts(w / 2 + rand(-10, 10), h / 2 + rand(-10, 10), Math.min(w, h) * .3), 1300) : null, { maxActions: rounds * 4 });
      const ok = await new Promise<boolean>(res => { resolveRound = res; api.onCleanup(() => res(false)); }); if (!ok || api.closed) return;
      api.right(); api.say(`Yes! That is ${want.name[0]}!`, `Đúng rồi! Đó là ${want.name[1]}!`); await wait(1300); if (api.closed) return;
    }
    api.dots(rounds, rounds); return api.win({ title: T('Shape artist!', 'Hoạ sĩ vẽ hình giỏi!') });
  }
});

// ---------- 10. Copy the Picture: square by square, the same as the picture beside it ----------
register({
  id: 'copygrid', icon: '🖼️', name: () => T('Copy the Picture', 'Vẽ Lại Tranh'),
  async run(api) {
    // the level sets the grid and the colours; Talent adds a fourth colour and one more picture
    style(); const rounds = api.talent ? 3 : 2, S = api.level <= 2 ? 4 : 5, cols = COLOURS.slice(0, api.talent ? 4 : api.level <= 1 ? 1 : api.level <= 3 ? 2 : 3);
    mark(api, rounds, S, cols.length);
    api.say('Make your picture the same as the little one. Tap a colour, then tap the squares!', 'Vẽ lại cho giống bức tranh nhỏ nhé. Chạm một màu, rồi chạm vào các ô!');
    for (let r = 0; r < rounds; r++) {
      api.dots(rounds, r); api.stage.innerHTML = '';
      const want = Array.from({ length: S * S }, () => Math.random() < .4 ? pick(cols) : null);
      if (want.every(x => !x)) want[0] = cols[0];
      const pair = el('div', 'dg-pair'), ex = el('div', 'dg-grid small'), mine = el('div', 'dg-grid');
      ex.style.gridTemplateColumns = mine.style.gridTemplateColumns = `repeat(${S}, auto)`;
      want.forEach(c => { const b = el('button', ''); b.disabled = true; b.style.background = c || '#fff'; ex.appendChild(b); });
      const cells = want.map((c, i) => { const b = el('button', ''); b._want = c; b._has = null; b.setAttribute('aria-label', T('square', 'ô') + ' ' + (i + 1)); mine.appendChild(b); return b; });
      pair.append(ex, mine); api.stage.appendChild(pair); const pal = palette(api, cols);
      let done: () => void = () => { }; const finished = new Promise<void>(res => done = res);
      for (const b of cells) b.onclick = () => { if (api.closed) return; b._has = b._has === pal.state.colour ? null : pal.state.colour; b.style.background = b._has || '#fff'; api.sfx.tap(); if (cells.every(x => x._has === x._want)) done(); };
      api.plan(() => { if (!mine.isConnected) return null; const b = cells.find(x => x._has !== x._want); if (!b) return null; const need = b._want || b._has; return pal.state.colour === need ? b : pal.of(need); }, { maxActions: rounds * S * S * 2 });
      api.onCleanup(() => done()); await finished; if (api.closed) return;
      api.right(mine); api.say('Exactly the same!', 'Giống hệt luôn!'); await wait(1400); if (api.closed) return;
    }
    api.dots(rounds, rounds); return api.win({ title: T('A perfect copy!', 'Vẽ lại giống y như thật!') });
  }
});

export const DRAWING_GAMES = ['dotdot', 'trace', 'mirror', 'colournum', 'lanternart', 'card', 'sand', 'drawpath', 'shapedraw', 'copygrid'];
