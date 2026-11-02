// No phone emoji anywhere (owner, round R: "check again everywhere and replace all emoji"). Two swaps, installed once:
//  · on the page: any emoji in text (menus, Grown-ups, toasts, dialogs, Studio…) is replaced by the game's own drawing
//    (js/art.js) or drawn flag (js/icons.js), as soon as the text appears or changes. Text symbols that phones
//    sometimes show as emoji (▶, ⏯ …) get the "plain text" mark so they stay plain. Drop-down choices can't hold
//    pictures, so their emoji are left out. Typing boxes are never touched.
//  · on canvases (3D signs, name tags, bubbles, the mini-map): fillText draws the same drawings in place of emoji,
//    straight away, with a small painter for the few shapes the drawings use (path, rect, circle, ellipse, text, g).
// Anything with no drawing yet is noted in window.__svNoArt so the "noemoji" check can find it.
import { hasArt, pic, artSVG } from './art.js';
import { FLAGS } from './icons.js';

const EMO = /\p{Extended_Pictographic}(?:️|[\u{1F3FB}-\u{1F3FF}])*(?:‍\p{Extended_Pictographic}(?:️|[\u{1F3FB}-\u{1F3FF}])*)*|[\u{1F1E6}-\u{1F1FF}]{2}|[0-9#*]️?⃣/gu;
// symbols that should read as plain marks (their drawing, when there is one, still wins)
// (written as character codes, so the emoji audit doesn't read this list as pictures the game shows)
const TEXTISH = new Set([0x25B6, 0x25C0, 0xA9, 0xAE, 0x2122, 0x2194, 0x2195, 0x23EE, 0x23F8, 0x23EF, 0x23FA, 0x203C, 0x2049, 0x2716, 0x27A1, 0x2B05, 0x2B06, 0x2B07, 0x2197, 0x2198, 0x2611, 0x2733, 0x2734, 0x2747, 0x25AA, 0x25AB, 0x25FB, 0x25FC, 0x25FD, 0x25FE, 0x2934, 0x2935, 0x2640, 0x2642, 0x2695, 0x2702, 0x2712, 0x270F].map(c => String.fromCodePoint(c)));
const FLAG_OF = { '🇻🇳': 'vn', '🇦🇺': 'au', '🇨🇳': 'cn', '🇮🇳': 'in', '🇬🇧': 'gb' };
export const noArt = (typeof window !== 'undefined' && (window.__svNoArt = window.__svNoArt || new Set())) || new Set();
const kind = e => FLAG_OF[e] ? 'flag' : hasArt(e) ? 'art' : TEXTISH.has(e.replace(/️/g, '')) ? 'text' : 'none';

// ---------- the page ----------
const SKIP = 'script,style,textarea,input,svg,code,pre,[contenteditable],[data-noart]';
function swapText(node) {
  const s = node.nodeValue; if (!s || !EMO.test(s)) return; EMO.lastIndex = 0;
  const host = node.parentElement; if (!host || host.closest(SKIP)) return;
  if (host.closest('option,select,title')) {
    // drop-down choices can only hold words: leave the emoji out (or keep a symbol as plain text)
    // (a symbol already marked as plain text is left alone, so this never repeats itself)
    const t = s.replace(EMO, (e, at) => kind(e) !== 'text' ? '' : s[at + e.length] === '\uFE0E' ? e : e.replace(/\uFE0F/g, '') + '\uFE0E').replace(/^\s+/, '');
    if (t !== s) node.nodeValue = t; return;
  }
  const frag = document.createDocumentFragment(); let at = 0, changed = false;
  for (const m of s.matchAll(EMO)) {
    const e = m[0], k = kind(e);
    if (k === 'text' && s[m.index + e.length] === '︎') continue;
    if (k === 'none') { noArt.add(e); continue; }   // (no drawing yet: left as it is, and noted; never swapped for itself)
    frag.appendChild(document.createTextNode(s.slice(at, m.index))); at = m.index + e.length; changed = true;
    if (k === 'flag') { const w = document.createElement('span'); w.className = 'flagi'; w.dataset.e = e; w.innerHTML = FLAGS[FLAG_OF[e]]; frag.appendChild(w); }
    else if (k === 'art') { const w = document.createElement('span'); w.className = 'arti'; w.dataset.e = e; w.innerHTML = pic(e); frag.appendChild(w); } // (data-e: which picture it is, for checks)
    else if (k === 'text') frag.appendChild(document.createTextNode(e.replace(/️/g, '') + '︎'));
  }
  if (!changed) return;
  frag.appendChild(document.createTextNode(s.slice(at)));
  node.replaceWith(frag);
}
function swapAttrs(el) { for (const a of ['placeholder']) { const v = el.getAttribute && el.getAttribute(a); if (v && EMO.test(v)) { EMO.lastIndex = 0; el.setAttribute(a, v.replace(EMO, '').trim()); } } }
export function swapIn(root) {
  if (root.nodeType === 3) { swapText(root); return; }
  if (root.nodeType !== 1 || root.closest && root.closest('svg')) return;
  swapAttrs(root); root.querySelectorAll && root.querySelectorAll('[placeholder]').forEach(swapAttrs);
  const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT), list = []; for (let n = w.nextNode(); n; n = w.nextNode()) list.push(n);
  list.forEach(swapText);
}
export function watchPage(doc = document) {
  if (doc.__svEmoji) return; doc.__svEmoji = true;
  const go = () => { swapIn(doc.body); new MutationObserver(list => { for (const r of list) { if (r.type === 'characterData') swapText(r.target); else r.addedNodes.forEach(swapIn); } }).observe(doc.body, { childList: true, subtree: true, characterData: true }); };
  if (doc.body) go(); else doc.addEventListener('DOMContentLoaded', go);
  const st = doc.createElement('style');
  st.textContent = '.arti,.flagi{display:inline-block;width:1.1em;height:1.1em;vertical-align:-.18em;line-height:0}.arti svg.art{width:100%;height:100%}.flagi{width:1.3em;height:.9em;vertical-align:-.08em}.flagi svg{width:100%;height:100%}';
  (doc.head || doc.documentElement).appendChild(st);
}

// ---------- canvases ----------
const trees = new Map();
function svgTree(e) {
  if (trees.has(e)) return trees.get(e);
  const src = FLAG_OF[e] ? FLAGS[FLAG_OF[e]].replace('<svg ', '<svg xmlns="http://www.w3.org/2000/svg" ') : artSVG(e);
  const t = src ? new DOMParser().parseFromString(src, 'image/svg+xml').documentElement : null; trees.set(e, t); return t;
}
const num = (el, k, d = 0) => { const v = parseFloat(el.getAttribute(k)); return isFinite(v) ? v : d; };
function applyTransform(g, tr) {
  for (const m of tr.matchAll(/(translate|rotate|scale)\(([^)]*)\)/g)) { const a = m[2].split(/[\s,]+/).map(Number);
    if (m[1] === 'translate') g.translate(a[0] || 0, a[1] || 0);
    else if (m[1] === 'scale') g.scale(a[0], a[1] == null || isNaN(a[1]) ? a[0] : a[1]);
    else { const r = (a[0] || 0) * Math.PI / 180; if (a.length >= 3) { g.translate(a[1], a[2]); g.rotate(r); g.translate(-a[1], -a[2]); } else g.rotate(r); } }
}
function paintNode(g, el, inh) {
  const st = { fill: el.getAttribute('fill') ?? inh.fill, stroke: el.getAttribute('stroke') ?? inh.stroke, sw: el.hasAttribute('stroke-width') ? num(el, 'stroke-width', 1) : inh.sw,
    cap: el.getAttribute('stroke-linecap') ?? inh.cap, join: el.getAttribute('stroke-linejoin') ?? inh.join, op: inh.op * (el.hasAttribute('opacity') ? num(el, 'opacity', 1) : 1),
    fop: el.hasAttribute('fill-opacity') ? num(el, 'fill-opacity', 1) : inh.fop, dash: el.getAttribute('stroke-dasharray') ?? inh.dash };
  g.save(); const tr = el.getAttribute('transform'); if (tr) applyTransform(g, tr);
  const tag = el.tagName.toLowerCase();
  if (tag === 'g' || tag === 'svg') { for (const c of el.children) paintNode(g, c, st); g.restore(); return; }
  let p = null;
  if (tag === 'path') p = new Path2D(el.getAttribute('d') || '');
  else if (tag === 'rect') { p = new Path2D(); const x = num(el, 'x'), y = num(el, 'y'), w = num(el, 'width'), h = num(el, 'height'), r = Math.min(num(el, 'rx', num(el, 'ry')), w / 2, h / 2); r > 0 && p.roundRect ? p.roundRect(x, y, w, h, r) : p.rect(x, y, w, h); }
  else if (tag === 'circle') { p = new Path2D(); p.arc(num(el, 'cx'), num(el, 'cy'), num(el, 'r'), 0, Math.PI * 2); }
  else if (tag === 'ellipse') { p = new Path2D(); p.ellipse(num(el, 'cx'), num(el, 'cy'), num(el, 'rx'), num(el, 'ry'), 0, 0, Math.PI * 2); }
  else if (tag === 'line') { p = new Path2D(); p.moveTo(num(el, 'x1'), num(el, 'y1')); p.lineTo(num(el, 'x2'), num(el, 'y2')); }
  else if (tag === 'polygon' || tag === 'polyline') { p = new Path2D('M' + (el.getAttribute('points') || '').trim() + (tag === 'polygon' ? 'Z' : '')); }
  else if (tag === 'text') { g.globalAlpha = st.op; g.fillStyle = st.fill && st.fill !== 'none' ? st.fill : '#000'; g.font = `${el.getAttribute('font-weight') || ''} ${num(el, 'font-size', 12)}px sans-serif`;
    g.textAlign = { middle: 'center', end: 'right' }[el.getAttribute('text-anchor')] || 'left'; g.textBaseline = 'alphabetic'; RAW_FILL.call(g, el.textContent, num(el, 'x'), num(el, 'y')); }
  if (p) {
    if (st.fill !== 'none') { g.globalAlpha = st.op * st.fop; g.fillStyle = st.fill || '#000'; g.fill(p); }
    if (st.stroke && st.stroke !== 'none' && st.sw > 0) { g.globalAlpha = st.op; g.strokeStyle = st.stroke; g.lineWidth = st.sw; g.lineCap = st.cap || 'butt'; g.lineJoin = st.join || 'miter'; g.setLineDash(st.dash ? st.dash.split(/[\s,]+/).map(Number) : []); g.stroke(p); }
  }
  g.restore();
}
// paint the drawing of emoji e, centred on (cx, cy), size px across; false when there is no drawing
export function paintArt(g, e, cx, cy, size) {
  const t = svgTree(e); if (!t) return false;
  const vb = (t.getAttribute('viewBox') || '0 0 48 48').split(/[\s,]+/).map(Number), k = size / Math.max(vb[2], vb[3]);
  g.save(); g.translate(cx - vb[2] * k / 2, cy - vb[3] * k / 2); g.scale(k, k); g.translate(-vb[0], -vb[1]);
  paintNode(g, t, { fill: '#000', stroke: null, sw: 1, cap: null, join: null, op: 1, fop: 1, dash: null }); g.restore(); return true;
}
let RAW_FILL = null;
export function patchCanvas() {
  if (typeof CanvasRenderingContext2D === 'undefined' || RAW_FILL) return;
  const P = CanvasRenderingContext2D.prototype; RAW_FILL = P.fillText;
  P.fillText = function (text, x, y, maxW) {
    const s = String(text); if (!EMO.test(s)) return RAW_FILL.call(this, s, x, y, maxW); EMO.lastIndex = 0;
    const size = parseFloat((/(\d+(?:\.\d+)?)px/.exec(this.font) || [0, 16])[1]), runs = []; let at = 0;
    for (const m of s.matchAll(EMO)) { const e = m[0], k = kind(e); if (k === 'none') { noArt.add(e); continue; } if (k === 'text') continue;
      if (m.index > at) runs.push(['t', s.slice(at, m.index)]); runs.push(['e', e]); at = m.index + e.length; }
    if (at < s.length) runs.push(['t', s.slice(at)]);
    if (!runs.some(r => r[0] === 'e')) return RAW_FILL.call(this, s, x, y, maxW);
    const W = r => r[0] === 'e' ? size * (FLAG_OF[r[1]] ? 1.35 : 1.1) : this.measureText(r[1]).width, total = runs.reduce((a, r) => a + W(r), 0);
    const al = this.textAlign, dir = this.direction === 'rtl';
    let x0 = al === 'center' ? x - total / 2 : (al === 'right' || (al === 'end' && !dir) || (al === 'start' && dir)) ? x - total : x;
    const bl = this.textBaseline, cy = bl === 'middle' ? y : bl === 'top' || bl === 'hanging' ? y + size * .55 : bl === 'bottom' || bl === 'ideographic' ? y - size * .5 : y - size * .36;
    this.save(); this.textAlign = 'left';
    if (maxW && total > maxW) { this.translate(x0, 0); this.scale(maxW / total, 1); this.translate(-x0, 0); }
    for (const r of runs) { const w = W(r); if (r[0] === 't') RAW_FILL.call(this, r[1], x0, y); else { const sz = size * (FLAG_OF[r[1]] ? 1.25 : 1.05); if (!paintArt(this, r[1], x0 + w / 2, cy, sz)) RAW_FILL.call(this, r[1], x0, y); } x0 += w; }
    this.restore();
  };
}
// installed as soon as this file loads (js/main.js imports it first, before anything draws)
if (typeof document !== 'undefined') { patchCanvas(); watchPage(); }
