// A panel of big controls at the bottom of the child's own half (round R, owner 9 Oct: "more doing, less watching"):
// big buttons to tap or hold and tall handles to drag, sized for a 4-year-old. Used by the yard (js/yard.js) and the
// story (js/lanterns.js). data-hp on each control names it (the checks press them like a child would).
import { local } from './util.js';
// Every panel has a ✕ "Later" button (audit, 9 Oct: a child must never be stuck in one): it closes the panel, and
// waiting on it with frames(fn, panel) or until(promise, panel) then throws QUIT, so the story can put things back.
export const QUIT = new Error('handpad quit');
export const pad = html => { const d = document.createElement('div'); d.className = 'handpad'; d.innerHTML = `<div class="hp-in"><button class="hp-x" data-hp="x" aria-label="Later">✕</button>${html}</div>`; document.body.appendChild(d);
  d.quit = new Promise((_, rej) => { d.querySelector('.hp-x').onclick = () => { d.remove(); rej(QUIT); }; }); d.quit.catch(() => { }); return d; };
// wait for a promise, unless the panel is closed first
export const until = (pr, d) => d ? Promise.race([pr, d.quit]) : pr;
// run fn(dt) every frame until it returns true (or the panel d is closed: then it throws QUIT)
export const frames = (fn, d) => new Promise((res, rej) => { let last = performance.now(); const f = now => { if (d && !d.isConnected) return rej(QUIT); const dt = Math.min(.1, (now - last) / 1000); last = now; if (fn(dt)) res(); else requestAnimationFrame(f); }; requestAnimationFrame(f); });
// whether a button is being held down
export const holdable = b => { const st = { down: false }; const on = e => { e.preventDefault(); st.down = true; b.classList.add('on'); }, off = () => { st.down = false; b.classList.remove('on'); };
  b.addEventListener('pointerdown', on); b.addEventListener('pointerup', off); b.addEventListener('pointerleave', off); b.addEventListener('pointercancel', off); return st; };
// a handle in a tall slot: v goes from 0 (top) to 1 (bottom) as it is dragged
// (local() turns the finger round on a half of the screen that is turned round, face to face)
export const slot = el => { const st = { v: 0, dragging: false }; const at = e => { const q = local(el, e); st.v = Math.max(0, Math.min(1, q.y / q.r.height)); el.style.setProperty('--v', st.v); };
  el.addEventListener('pointerdown', e => { e.preventDefault(); st.dragging = true; try { el.setPointerCapture(e.pointerId); } catch (x) { } at(e); });
  el.addEventListener('pointermove', e => { if (st.dragging) at(e); }); el.addEventListener('pointerup', () => { st.dragging = false; }); el.addEventListener('pointercancel', () => { st.dragging = false; }); return st; };
