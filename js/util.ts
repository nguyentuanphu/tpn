// Small shared helpers: math, seeded random, value noise, DOM.
// The maths and the seeded random now live in js/core (architecture step 1); they are passed on from here unchanged.
import { clamp, lerp, smooth, dist2, angleLerp } from './core/geo.js';
import { mulberry } from './core/rng.js';
export { clamp, lerp, smooth, dist2, angleLerp };
export const rand = (a, b) => a + Math.random() * (b - a);
export const pick = a => a[Math.floor(Math.random() * a.length)];
export const shuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };

export const seeded = mulberry; // (core/rng.js: the same numbers as before)

// 2D value noise with smooth interpolation, deterministic.
function hash(x, z) { let h = Math.imul(x, 374761393) + Math.imul(z, 668265263); h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967296; }
export function noise2(x, z) {
  const xi = Math.floor(x), zi = Math.floor(z), xf = x - xi, zf = z - zi;
  const u = xf * xf * (3 - 2 * xf), v = zf * zf * (3 - 2 * zf);
  const a = hash(xi, zi), b = hash(xi + 1, zi), c = hash(xi, zi + 1), d = hash(xi + 1, zi + 1);
  return lerp(lerp(a, b, u), lerp(c, d, u), v) * 2 - 1;
}
export function fbm(x, z, oct = 4) { let s = 0, a = 1, f = 1, n = 0; for (let i = 0; i < oct; i++) { s += noise2(x * f, z * f) * a; n += a; a *= 0.5; f *= 2.03; } return s / n; }

export const $ = s => document.querySelector(s);
export function el(tag, cls, html) { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; }
export function esc(s) { return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }
export const wait = ms => new Promise(r => setTimeout(r, ms));
// Two players face to face (owner, round R): a window opened by the player at the far end sits in a .facewrap
// turned half a turn, so a finger's screen position runs the other way inside it. These give the position as the
// player sees it: local(el, e) → {x, y} from the element's own top-left; flip(el) → -1 when a drag runs backwards.
export const flip = node => node && node.closest && node.closest('.facewrap') ? -1 : 1;
export function local(node, e) { const r = node.getBoundingClientRect(); return flip(node) < 0 ? { x: r.right - e.clientX, y: r.bottom - e.clientY, r } : { x: e.clientX - r.left, y: e.clientY - r.top, r }; }
