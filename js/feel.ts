// Feel and sound (owner plan, 16 Oct AEDT, chat A; rules UI-7 and UI-8 in docs/ui-redesign-20261016/README.md): one
// place for how the game answers a tap, so every screen feels the same. Nothing else makes its own press, window,
// reward or "not that one" effect.
//   press(el)                  a button going down: it sinks a little and makes a soft sound (done for every button
//                              by the listener at the end of this file; call it yourself only for something that is
//                              not a button)
//   open(panel) / close(panel) a window's sound. Windows never move (UX-001: no bounce, no slide); js/popups.js calls
//                              these for every modal()
//   reward(kind, from, to, n)  coins, orbs, leafies, stars or a sticker fly from where they were earned (an element, a
//                              screen point {x, y}, or null: the last tap) into their counter, which jiggles; each coin
//                              that lands is a note higher than the one before
//   nope(el)                   a wrong tap: a friendly boing and a little wiggle (never a buzz or a red cross)
//   celebrate({ little })      confetti and a drum-roll ta-da (gentler for under-5s, owner 16 Oct AEDT)
// Calm mode (reduceMotion) keeps every sound and drops every movement.
import { SFX } from './audio.js';
import { reduceMotion } from './state.js';
import { pic } from './art.js';
import { el } from './util.js';

let lastX = innerWidth / 2, lastY = innerHeight / 2;
const kindOf = b => b.matches('.x, .close, [data-round]') ? 'round' : b.matches('.go, .primary, .btn.big, .floatbtn, [data-main]') ? 'main' : '';

export function press(b) {
  SFX.press(b && b.matches ? kindOf(b) : '');
  if (!b || !b.classList || reduceMotion()) return;
  b.classList.remove('sv-spring'); b.classList.add('sv-press');
}
function release(b) {
  if (!b || !b.classList || !b.classList.contains('sv-press')) return;
  b.classList.remove('sv-press');
  if (reduceMotion()) return;
  void b.offsetWidth; b.classList.add('sv-spring'); setTimeout(() => b.classList.remove('sv-spring'), 260);
}

export const open = () => SFX.open();
export const close = () => SFX.shut();

export function nope(e) {
  SFX.no();
  if (!e || !e.classList || reduceMotion()) return;
  e.classList.remove('sv-wiggle'); void e.offsetWidth; e.classList.add('sv-wiggle'); setTimeout(() => e.classList.remove('sv-wiggle'), 450);
}

// what flies for each kind (drawn with the valley's own pictures, js/art.js)
const ICON = { coin: '🪙', orb: '🔮', leaf: '🍃', star: '⭐', sticker: '⭐' };
let ladder = 0, ladderAt = 0;
const pointOf = f => {
  if (f && f.getBoundingClientRect) { const r = f.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; }
  if (f && f.x != null) return f;
  return { x: lastX, y: lastY };
};
function land(kind, to) {
  const now = performance.now(); ladder = now - ladderAt < 1500 ? ladder + 1 : 0; ladderAt = now;
  if (kind === 'sticker') SFX.shhk(); else SFX.pop(ladder);
  if (to && to.classList && !reduceMotion()) { to.classList.remove('sv-jiggle'); void to.offsetWidth; to.classList.add('sv-jiggle'); setTimeout(() => to.classList.remove('sv-jiggle'), 420); }
}
export function reward(kind, from, to, n = 1) {
  n = Math.max(1, Math.min(6, n | 0));
  const target = to && to.isConnected && to.getClientRects().length ? to : null;
  if (reduceMotion() || !target) { for (let i = 0; i < n; i++) setTimeout(() => land(kind, target), i * 110); return; }
  const a = pointOf(from), b = pointOf(target);
  for (let i = 0; i < n; i++) {
    const f = el('div', 'sv-fly' + (kind === 'sticker' ? ' big' : ''), pic(ICON[kind] || ICON.star));
    f.style.left = a.x + 'px'; f.style.top = a.y + 'px';
    document.body.appendChild(f);
    const dx = b.x - a.x, dy = b.y - a.y, lift = Math.min(120, 40 + Math.abs(dx) * .25);
    const anim = f.animate([
      { transform: 'translate(-50%, -50%) scale(.6)', opacity: 0 },
      { transform: 'translate(-50%, -50%) scale(1.15)', opacity: 1, offset: .15 },
      { transform: `translate(calc(-50% + ${dx * .5}px), calc(-50% + ${dy * .5 - lift}px)) scale(1)`, offset: .55 },
      { transform: `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px)) scale(.7)`, opacity: 1 }
    ], { duration: 650, delay: i * 110, easing: 'cubic-bezier(.4, 0, .6, 1)', fill: 'both' });
    anim.onfinish = () => { f.remove(); land(kind, target); };
    anim.oncancel = () => f.remove();
  }
}

// confetti comes from js/popups.js (it imports this file, so it hands its confetti over instead of being imported)
let confettiFn = null;
export const useConfetti = f => { confettiFn = f; };
export function celebrate({ little = false } = {}) {
  SFX.tada();
  if (confettiFn) setTimeout(() => confettiFn(null, little ? 24 : 60, little), 550);
}

// every button: pressed down → sinks with a sound; let go → springs back. The press is on the button the finger is
// on; sliders, text boxes and the valley itself are left alone.
const BTN = 'button, .btn, [role="button"], a.chip';
addEventListener('pointerdown', e => {
  lastX = e.clientX; lastY = e.clientY;
  const b = e.target && e.target.closest && e.target.closest(BTN);
  if (!b || b.disabled || b.closest('[data-nofeel]')) return;
  press(b);
  const up = () => { release(b); removeEventListener('pointerup', up, true); removeEventListener('pointercancel', up, true); };
  addEventListener('pointerup', up, true); addEventListener('pointercancel', up, true);
}, { capture: true, passive: true });
// a key that clicks a button (Enter, Space) feels the same
addEventListener('keydown', e => {
  if (e.repeat || (e.key !== 'Enter' && e.key !== ' ')) return;
  const b = document.activeElement && document.activeElement.closest && document.activeElement.closest(BTN);
  if (b && !b.disabled) { press(b); setTimeout(() => release(b), 120); }
}, { capture: true });
