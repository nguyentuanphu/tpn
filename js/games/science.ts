// (Học vui, owner's plan 1 Nov 2026 AEDT, docs/learn-tab/PLAN.md) The Science corner: six playable experiments. Each round
// has three steps: Guess (the child picks what will happen), Try (drag or tap, and the thing moves as it really would),
// Why (one short spoken sentence). The ideas match the villagers' science facts (SCIENCE_LINES in
// js/content/villagerlines.js), so a fact heard in the valley can be tried here.
// Levels: under-5s (api.little) play gently and nobody can lose: a wrong guess is simply shown the answer. Easy, Medium,
// Hard and Talent (api.smart 0-3, api.talent) bring more things to test, finer differences, and at Talent the child
// predicts several things before seeing any of them. A big kid's wrong guess counts as a miss (fewer stars) and is
// put right after the try, on screen.
// Autoplay (tester): every step offers its next button through api.plan; the guesses put right use untilRight.
import { register, untilRight, tapOne } from './frame.js';
import { T } from '../i18n.js';
import { pic } from '../art.js';
import { el, esc, shuffle, wait } from '../util.js';
import { tone } from '../audio.js';
import { reduceMotion } from '../state.js';

export type Pair = [string, string];
export type Choice = { key: string; pic?: string; html?: string; label: Pair };
export type Trial = { ask: Pair; choices: Choice[]; answer: string; why: Pair; focus?: () => void; done?: () => void };
export type Ctx = { api: any; scene: HTMLElement; controls: HTMLElement; target: (e: Element | null) => void; lv: number };
export type Round = { draw: (x: Ctx) => void; trials: Trial[]; act: Pair; tryIt: (x: Ctx) => Promise<void> };

let styled = false;
export function style() {
  if (styled) return; styled = true;
  document.head.appendChild(el('style', '', `
.sx-board { display: flex; flex-direction: column; align-items: center; gap: 10px; width: max-content; max-width: 100%; }
.sx-controls { width: min(380px, 92vw) !important; }
.sx-scene { position: relative; width: min(380px, 92vw); aspect-ratio: 4 / 3; border-radius: 20px; background: linear-gradient(#e6f6ff, #fffdf6 70%); box-shadow: 0 4px 16px rgba(40, 30, 60, .16); overflow: hidden; touch-action: none; flex-shrink: 0; }
.sx-scene > svg.sx-bg { position: absolute; inset: 0; width: 100%; height: 100%; }
.sx-controls { display: flex; flex-direction: column; align-items: center; gap: 8px; min-height: 96px; width: 100%; }
.sx-item { position: absolute; width: 64px; height: 64px; min-width: 64px; min-height: 64px; padding: 2px; border: 0; background: transparent; transform: translate(-50%, -50%); touch-action: none; cursor: grab; z-index: 3; transition: left .5s ease, top .5s ease; }
.gl.little .sx-item { width: 76px; height: 76px; }
.sx-item svg.art, .sx-item .emo { width: 100%; height: 100%; font-size: 48px; }
.sx-item.sx-drag { transition: none; cursor: grabbing; z-index: 6; }
.sx-item.sx-focus { filter: drop-shadow(0 0 6px #ffb020) drop-shadow(0 0 2px #ffb020); }
.sx-item.sx-sink { transition: left .4s ease, top 1.5s cubic-bezier(.3, .1, .6, 1); }
.sx-item.sx-bob { animation: sx-bob 1.6s ease-in-out infinite; }
@keyframes sx-bob { 0%, 100% { margin-top: 0; } 50% { margin-top: 4px; } }
.sx-badge { position: absolute; right: -6px; top: -6px; width: 30px; height: 30px; border-radius: 50%; background: #fff; box-shadow: 0 1px 4px rgba(0, 0, 0, .3); }
.sx-badge svg.art { width: 30px; height: 30px; }
.sx-choices .choice.sx-opt { width: clamp(72px, 20vw, 116px); height: clamp(80px, 22vw, 124px); flex-direction: column; gap: 2px; font-size: 14px; font-weight: 800; padding: 4px; }
.sx-choices .choice.sx-opt svg.art, .sx-choices .choice.sx-opt .sx-mini { width: 62%; height: auto; flex: 1; min-height: 0; }
.sx-choices .choice.sx-opt .sx-num { font: 900 34px var(--font, sans-serif); color: #3b2a4f; }
.sx-choices .choice.sx-opt small { font-size: 13px; line-height: 1.1; color: #3b2a4f; }
.sx-choices .choice.sx-picked { outline: 4px dashed #ffb020; outline-offset: 2px; }
.sx-go { min-width: 120px; min-height: 64px; padding: 6px 18px; border-radius: 999px; border: 2px solid #3b2a4f; background: #c9f7c0; font: 800 20px var(--font, sans-serif); color: #3b2a4f; box-shadow: 0 4px 0 rgba(59, 42, 79, .25); display: inline-flex; align-items: center; gap: 8px; }
.sx-go svg.art { width: 40px; height: 40px; }
.sx-pivot { position: absolute; left: 50%; bottom: 22%; width: 0; height: 0; border-left: 22px solid transparent; border-right: 22px solid transparent; border-bottom: 40px solid #b07a4a; transform: translateX(-50%); }
.sx-plank { position: absolute; left: 4%; width: 92%; bottom: calc(22% + 40px); height: 14px; border-radius: 7px; background: #ffd23f; border: 2px solid #3b2a4f; transform-origin: 50% 50%; transition: transform .9s cubic-bezier(.3, 1.4, .5, 1); }
.sx-seat { position: absolute; bottom: 6px; width: 48px; height: 48px; min-width: 48px; min-height: 48px; transform: translateX(-50%); border-radius: 50%; border: 3px dashed #8a5cf6; background: rgba(255, 255, 255, .6); font: 900 18px var(--font, sans-serif); color: #3b2a4f; padding: 0; }
.gl.little .sx-seat, .sx-seat.sx-big { width: 64px; height: 64px; min-width: 64px; min-height: 64px; }
.sx-seat.sx-left { border-style: solid; border-color: #c9b8dc; background: transparent; pointer-events: none; }
.sx-rider { position: absolute; bottom: 4px; width: 60px; height: 60px; transform: translateX(-50%); pointer-events: none; }
.sx-rider svg.art { width: 100%; height: 100%; }
.sx-rider b { position: absolute; right: -4px; top: -6px; min-width: 24px; height: 24px; border-radius: 12px; background: #fff; border: 2px solid #3b2a4f; font: 900 15px var(--font, sans-serif); text-align: center; line-height: 20px; }
.sx-ring { position: absolute; width: 64px; height: 64px; min-width: 64px; min-height: 64px; transform: translate(-50%, -50%); border-radius: 50%; border: 4px dashed #ffb020; background: rgba(255, 246, 176, .35); font: 900 20px var(--font, sans-serif); color: #8a5a00; padding: 0; z-index: 2; }
.sx-lamp { z-index: 4; }
.sx-bottles { position: absolute; inset: 8% 4% 6%; display: flex; justify-content: space-around; align-items: flex-end; }
.sx-bottles.sx-low { top: 28%; }
.sx-hear { position: absolute; top: 6px; left: 50%; transform: translateX(-50%); z-index: 5; }
.sx-bottle { width: 64px; min-width: 64px; min-height: 64px; height: 88%; border: 0; background: transparent; padding: 0; transform-origin: 50% 100%; }
.sx-bottle svg { width: 100%; height: 100%; }
.sx-bottle.sx-ring2 { animation: sx-wobble .5s ease; }
.sx-bottle.sx-heard { filter: drop-shadow(0 0 5px #5fd36a); }
@keyframes sx-wobble { 0%, 100% { transform: rotate(0); } 25% { transform: rotate(-6deg); } 75% { transform: rotate(6deg); } }
.sx-note { position: absolute; font: 900 26px var(--font, sans-serif); color: #8a5cf6; pointer-events: none; animation: sx-note 1s ease-out forwards; }
@keyframes sx-note { from { transform: translateY(0); opacity: 1; } to { transform: translateY(-50px); opacity: 0; } }
body.calm .sx-item.sx-bob, body.calm .sx-bottle.sx-ring2 { animation: none; }
.sx-fact { display: flex; align-items: center; gap: 10px; max-width: min(380px, 92vw); padding: 10px 14px; border-radius: 18px; background: #fff6d8; border: 3px solid #ffb020; font: 800 17px var(--font, sans-serif); color: #3b2a4f; line-height: 1.25; }
.sx-fact svg.art { width: 52px; height: 52px; flex-shrink: 0; }
`));
}

// ---------- the shared three steps ----------
const NEXT: Pair = ['Next', 'Tiếp'];
const FIX: Pair = ['Now you know! Tap what really happened.', 'Giờ con biết rồi! Chạm vào điều đã thật sự xảy ra nhé.'];
export const lvOf = (api): number => api.little ? 0 : 1 + Math.max(0, Math.min(3, api.smart | 0));
// (v1.07 levels) lvOf is only an index, so each experiment writes its real values (things, rounds, choices) on the stage
export const mark = (api, ...v: unknown[]) => { api.stage.dataset.lv = v.join(','); };
export const band = (lv: number) => lv <= 1 ? '1-1' : lv === 2 ? '1-2' : '2-3';   // how hard the things are (pickSet)
const choiceHTML = (c: Choice) => `${c.html || pic(c.pic)}<small>${esc(T(...c.label))}</small>`;
function buttonsFor(api, row: HTMLElement, trial: Trial) {
  return trial.choices.map(c => { const b = Object.assign(el('button', 'choice sx-opt', choiceHTML(c)), { _v: c.key }); b.setAttribute('aria-label', T(...c.label)); row.appendChild(b); return b; });
}
// (v1.08 science) fact: one line said and shown after the last round, before the win (the newer experiments)
export async function experiment(api, rounds: Round[], fact?: Pair) {
  style();
  const lv = lvOf(api), wrap = el('div', 'sx-board'), scene = el('div', 'sx-scene'), controls = el('div', 'sx-controls');
  wrap.append(scene, controls); api.stage.appendChild(wrap);
  let target: Element | null = null;
  const x: Ctx = { api, scene, controls, target: e => { target = e; }, lv };
  api.plan(() => target && target.isConnected && !(target as HTMLButtonElement).disabled ? target : null, { maxActions: rounds.length * 14 });
  for (let r = 0; r < rounds.length; r++) {
    if (api.closed) return;
    const round = rounds[r]; api.dots(rounds.length, r);
    scene.innerHTML = ''; controls.innerHTML = ''; round.draw(x);
    // 1. Guess: every trial of the round first (Talent: several things predicted before any is tried)
    const picks: Choice[] = [];
    for (const trial of round.trials) {
      if (api.closed) return;
      trial.focus?.(); controls.innerHTML = '';
      const row = el('div', 'choices sx-choices'); controls.appendChild(row);
      const btns = buttonsFor(api, row, trial), right = btns.find(b => b._v === trial.answer);
      api.say(...trial.ask); x.target(right);   // (no showing hand here: a guess is the child's own)
      const b = await tapOne(btns, api); if (!b || api.closed) return;
      x.target(null); api.sfx.tap && api.sfx.tap(); b.classList.add('sx-picked');
      picks.push(trial.choices.find(c => c.key === b._v)); trial.done?.();
      await wait(250);
    }
    // 2. Try
    controls.innerHTML = ''; api.say(...round.act);
    // (the first time an under-5 plays, the drawn hand shows what to drag or tap)
    const trying = round.tryIt(x); if (api.hand && target) api.hand(target);
    await trying; if (api.closed) return;
    await wait(300);
    // 3. Why, one trial at a time: a right guess wins a star; a wrong one is shown (under-5) or put right (big kids)
    for (let k = 0; k < round.trials.length; k++) {
      if (api.closed) return;
      const trial = round.trials[k]; trial.focus?.(); controls.innerHTML = '';
      const row = el('div', 'choices sx-choices'); controls.appendChild(row);
      const btns = buttonsFor(api, row, trial), right = btns.find(b => b._v === trial.answer), mine = btns.find(b => b._v === picks[k].key);
      mine.classList.add('sx-picked');
      if (mine === right) { api.right(right); api.say(...trial.why); }
      else if (api.little) { right.classList.add('right'); api.say(...trial.why); }
      else {
        api.wrong(mine, null); api.say(...FIX); x.target(null);
        if (!await untilRight(api, btns, e => e._v === trial.answer)) return;
        api.say(...trial.why);
      }
      btns.forEach(b => { b.disabled = true; });
      const next = el('button', 'sx-go', `${pic('▶️')}<span>${esc(T(...NEXT))}</span>`); controls.appendChild(next);
      x.target(next);
      if (!await tapOne([next], api) || api.closed) return;
      x.target(null); api.sfx.tap && api.sfx.tap(); trial.done?.();
    }
  }
  api.dots(rounds.length, rounds.length);
  if (fact && !api.closed) {
    controls.innerHTML = ''; const card = el('div', 'sx-fact', `${pic('sci2:fact')}<span>${esc(T(...fact))}</span>`); controls.appendChild(card); api.say(...fact);
    const next = el('button', 'sx-go', `${pic('▶️')}<span>${esc(T(...NEXT))}</span>`); controls.appendChild(next); x.target(next);
    if (!await tapOne([next], api) || api.closed) return;
    x.target(null); api.sfx.tap && api.sfx.tap();
  }
  return api.win();
}

// ---------- dragging (or a plain tap) ----------
// The handle follows the finger; dropping it in the zone (or anywhere, with no zone) or simply tapping it calls done
// with the drop point in the scene (0-100 %), or null for a tap. One use only.
export function dragOrTap(api, scene: HTMLElement, handle: HTMLElement, done: (at: { x: number; y: number } | null) => void, opts: { zone?: () => DOMRect | null; move?: (at: { x: number; y: number }) => void } = {}) {
  let start: { x: number; y: number; id: number } | null = null, moved = false, used = false;
  const sceneAt = (cx: number, cy: number) => { const r = scene.getBoundingClientRect(); return { x: (cx - r.left) / r.width * 100, y: (cy - r.top) / r.height * 100 }; };
  const ratio = () => { const r = scene.getBoundingClientRect(); return scene.offsetWidth ? r.width / scene.offsetWidth : 1; };
  const finish = (at) => { if (used) return; used = true; off(); done(at); };
  const down = (e: PointerEvent) => { if (used) return; start = { x: e.clientX, y: e.clientY, id: e.pointerId }; moved = false; };
  const move = (e: PointerEvent) => {
    if (!start || used || e.pointerId !== start.id) return;
    const dx = e.clientX - start.x, dy = e.clientY - start.y;
    if (!moved && Math.hypot(dx, dy) < 10) return;
    moved = true; e.preventDefault(); handle.classList.add('sx-drag');
    const k = ratio(); handle.style.transform = `translate(calc(-50% + ${dx / k}px), calc(-50% + ${dy / k}px))`;
    opts.move && opts.move(sceneAt(e.clientX, e.clientY));
  };
  const up = (e: PointerEvent) => {
    if (!start || used || e.pointerId !== start.id) return;
    const was = moved; start = null; handle.classList.remove('sx-drag');
    if (!was) return; // a tap: the click below does it
    const r = opts.zone ? opts.zone() : null;
    if (!r || (e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom)) {
      const at = sceneAt(e.clientX, e.clientY); handle.style.transform = ''; handle.style.left = at.x + '%'; handle.style.top = at.y + '%'; finish(at);
    } else { handle.style.transform = ''; }
  };
  const click = () => { if (!moved) finish(null); moved = false; };
  handle.addEventListener('pointerdown', down); document.addEventListener('pointermove', move, { passive: false }); document.addEventListener('pointerup', up); handle.addEventListener('click', click);
  const off = () => { handle.removeEventListener('pointerdown', down); document.removeEventListener('pointermove', move); document.removeEventListener('pointerup', up); handle.removeEventListener('click', click); };
  api.onCleanup(off);
}
export const item = (scene: HTMLElement, p: string, label: Pair, x: number, y: number, cls = '') => {
  const b = el('button', 'sx-item ' + cls, pic(p)); b.setAttribute('aria-label', T(...label)); b.style.left = x + '%'; b.style.top = y + '%'; scene.appendChild(b); return b;
};
export const bg = (scene: HTMLElement, body: string, vb = '0 0 400 300') => scene.appendChild(el('div', '', `<svg class="sx-bg" viewBox="${vb}" preserveAspectRatio="none" aria-hidden="true">${body}</svg>`).firstElementChild);
export const slow = (ms: number) => reduceMotion() ? Math.min(ms, 250) : ms;
// pick n things for a round: from the hardness the level allows, both answers present when there are several
function pickSet<V extends { hard: number; yes: boolean }>(pool: V[], lv: number, n: number, used: Set<V>): V[] {
  const lo = lv <= 1 ? 1 : lv === 2 ? 1 : 2, hi = lv <= 1 ? 1 : lv === 2 ? 2 : 3;
  let ok = pool.filter(v => v.hard >= lo && v.hard <= hi && !used.has(v)); if (ok.length < n) ok = pool.filter(v => v.hard >= lo && v.hard <= hi);
  for (let t = 0; t < 30; t++) { const s = shuffle(ok).slice(0, n); if (n < 2 || (s.some(v => v.yes) && s.some(v => !v.yes))) { s.forEach(v => used.add(v)); return s; } }
  const s = shuffle(ok).slice(0, n); s.forEach(v => used.add(v)); return s;
}
// how many rounds and things per round, by level: under-5 and Easy 3 x 1, Medium 4 x 1, Hard 5 x 1, Talent 3 x 3
export const PLAN = [[3, 1], [3, 1], [4, 1], [5, 1], [3, 3]];

// ---------- 1. Float or sink ----------
type Thing = { p: string; name: Pair; yes: boolean; hard: number; why: Pair };
const th = (p: string, name: Pair, yes: boolean, hard: number, why: Pair): Thing => ({ p, name, yes, hard, why });
const FLOAT: Thing[] = [
  th('🍃', ['Leaf', 'Lá'], true, 1, ['The leaf is light and flat, so the water holds it up.', 'Chiếc lá nhẹ và mỏng nên nước đỡ nó lên.']),
  th('🪨', ['Rock', 'Hòn đá'], false, 1, ['The rock is heavy for its size, so it sinks to the bottom.', 'Hòn đá nặng so với kích thước của nó nên chìm xuống đáy.']),
  th('🦆', ['Duck', 'Con vịt'], true, 1, ['The duck has air in its feathers, so it floats.', 'Con vịt có không khí trong lông nên nổi trên mặt nước.']),
  th('🪙', ['Coin', 'Đồng xu'], false, 1, ['The coin is small but heavy for its size, so it sinks.', 'Đồng xu nhỏ nhưng nặng so với kích thước của nó nên chìm.']),
  th('🪶', ['Feather', 'Lông vũ'], true, 1, ['The feather is very light, so it floats on top.', 'Chiếc lông vũ rất nhẹ nên nổi trên mặt nước.']),
  th('🔑', ['Key', 'Chìa khóa'], false, 2, ['The key is metal and heavy for its size, so it sinks.', 'Chìa khóa bằng kim loại, nặng so với kích thước nên chìm.']),
  th('🍎', ['Apple', 'Quả táo'], true, 2, ['The apple has lots of air inside, so it floats.', 'Quả táo có nhiều không khí bên trong nên nổi.']),
  th('🪵', ['Log', 'Khúc gỗ'], true, 2, ['Wood is lighter than water, so even a big log floats.', 'Gỗ nhẹ hơn nước, nên khúc gỗ to cũng nổi.']),
  th('🥄', ['Spoon', 'Cái thìa'], false, 2, ['The metal spoon is heavy for its size, so it sinks.', 'Chiếc thìa kim loại nặng so với kích thước nên chìm.']),
  th('🧊', ['Ice', 'Đá lạnh'], true, 3, ['Ice is a little lighter than water, so it floats.', 'Đá lạnh nhẹ hơn nước một chút nên nổi.']),
  th('🥚', ['Egg', 'Quả trứng'], false, 3, ['A fresh egg is heavier than the water it pushes aside, so it sinks.', 'Quả trứng tươi nặng hơn phần nước nó chiếm chỗ nên chìm.']),
  th('🍊', ['Orange', 'Quả cam'], true, 3, ['The orange peel is full of tiny air pockets, so it floats.', 'Vỏ cam có rất nhiều túi khí nhỏ nên quả cam nổi.']),
  th('🧽', ['Sponge', 'Bọt biển'], true, 3, ['The sponge is full of air holes, so it floats.', 'Miếng bọt biển có nhiều lỗ chứa khí nên nổi.']),
  th('✏️', ['Pencil', 'Bút chì'], true, 3, ['The pencil is made of wood, so it floats.', 'Bút chì làm bằng gỗ nên nổi.'])
];
const SURFACE = 58, FLOOR = 84; // the water's top and the tub's floor (% of the scene's height)
register({ id: 'sci_float', learn: true, icon: 'sci:float', name: () => T('Float or Sink?', 'Nổi hay Chìm?'), async run(api) {
  const lv = lvOf(api), [n, per] = PLAN[lv], used = new Set<Thing>(), rounds: Round[] = [];
  mark(api, n, per, band(lv));   // rounds, things guessed before trying, how hard the things are
  for (let r = 0; r < n; r++) {
    const set = pickSet(FLOAT, lv, per, used); let btns: HTMLElement[] = [];
    const xs = per === 1 ? [50] : [22, 50, 78];
    rounds.push({
      draw: x => {
        bg(x.scene, `<rect x="18" y="160" width="364" height="112" rx="20" fill="#fff3d0" stroke="#3b2a4f" stroke-width="5"/><rect x="26" y="174" width="348" height="92" rx="14" fill="#7fd0f5"/><path d="M40 186q20-8 40 0t40 0 40 0 40 0 40 0 40 0 40 0 40 0" stroke="#e6f7ff" stroke-width="4" fill="none"/><rect x="40" y="70" width="320" height="10" rx="5" fill="#c9a05a" stroke="#3b2a4f" stroke-width="3"/>`);
        btns = set.map((t, i) => item(x.scene, t.p, t.name, xs[i], 16, 'sx-thing'));
      },
      trials: set.map((t, i) => ({ ask: ['Will it float or sink? Make a guess!', 'Vật này nổi hay chìm? Con đoán xem!'], answer: t.yes ? 'float' : 'sink', why: t.why,
        choices: [{ key: 'float', pic: 'sci:floats', label: ['Float', 'Nổi'] }, { key: 'sink', pic: 'sci:sinks', label: ['Sink', 'Chìm'] }],
        focus: () => btns.forEach((b, j) => b.classList.toggle('sx-focus', j === i && per > 1)), done: () => btns.forEach(b => b.classList.remove('sx-focus')) })),
      act: per > 1 ? ['Now drop them in the water: drag them, or tap each one.', 'Giờ thả các vật vào nước: kéo, hoặc chạm vào từng vật nhé.'] : ['Now drop it in the water: drag it, or tap it.', 'Giờ thả vật vào nước: kéo, hoặc chạm vào nó nhé.'],
      tryIt: x => new Promise<void>(res => {
        let left = set.length; const tub = () => { const r = x.scene.getBoundingClientRect(); return new DOMRect(r.left, r.top + r.height * .45, r.width, r.height * .55); };
        const next = () => x.target(btns.find(b => !b.dataset.in) || null);
        set.forEach((t, i) => dragOrTap(x.api, x.scene, btns[i], async at => {
          const b = btns[i]; b.dataset.in = '1'; next(); x.api.sfx.pop && x.api.sfx.pop(2);
          b.style.left = (at ? Math.max(14, Math.min(86, at.x)) : xs[i]) + '%'; b.style.top = SURFACE + '%';
          await wait(slow(520));
          if (t.yes) { b.style.top = (SURFACE - 3) + '%'; b.classList.add('sx-bob'); }
          else { b.classList.add('sx-sink'); b.style.top = FLOOR + '%'; for (let k = 0; k < 4; k++) { const bub = el('i', 'sx-note', '°'); bub.style.left = b.style.left; bub.style.top = (SURFACE + 8 + k * 6) + '%'; x.scene.appendChild(bub); setTimeout(() => bub.remove(), 1000); } }
          await wait(slow(1500));
          if (--left === 0) res();
        }, { zone: tub }));
        next(); x.api.onCleanup(res);
      })
    });
  }
  return experiment(api, rounds);
} });

// ---------- 2. Magnets ----------
const MAGNET: Thing[] = [
  th('📎', ['Paper clip', 'Kẹp giấy'], true, 1, ['The paper clip is made of steel, and magnets pull steel.', 'Chiếc kẹp giấy làm bằng thép, và nam châm hút thép.']),
  th('🔩', ['Bolt', 'Con ốc'], true, 1, ['The bolt is made of iron, so the magnet pulls it.', 'Con ốc làm bằng sắt nên nam châm hút nó.']),
  th('🍃', ['Leaf', 'Lá'], false, 1, ['A leaf is not metal, so the magnet does not pull it.', 'Chiếc lá không phải kim loại nên nam châm không hút.']),
  th('🧸', ['Teddy', 'Gấu bông'], false, 1, ['The teddy is soft cloth, not iron, so it stays still.', 'Gấu bông làm bằng vải, không phải sắt, nên nằm yên.']),
  th('🍎', ['Apple', 'Quả táo'], false, 1, ['An apple has no iron in it, so the magnet cannot pull it.', 'Quả táo không có sắt nên nam châm không hút được.']),
  th('🧷', ['Safety pin', 'Ghim băng'], true, 2, ['The safety pin is steel, so the magnet pulls it.', 'Chiếc ghim băng làm bằng thép nên nam châm hút nó.']),
  th('✂️', ['Scissors', 'Cái kéo'], true, 2, ['The scissors have steel blades, so the magnet pulls them.', 'Cái kéo có lưỡi bằng thép nên nam châm hút.']),
  th('✏️', ['Pencil', 'Bút chì'], false, 2, ['The pencil is wood, so the magnet does not pull it.', 'Bút chì làm bằng gỗ nên nam châm không hút.']),
  th('🪵', ['Wood', 'Khúc gỗ'], false, 2, ['Wood is not metal, so the magnet does not pull it.', 'Gỗ không phải kim loại nên nam châm không hút.']),
  th('🥫', ['Food can', 'Lon đồ hộp'], true, 3, ['Most food cans are made of steel, so the magnet pulls them.', 'Phần lớn lon đồ hộp làm bằng thép nên nam châm hút.']),
  th('🔔', ['Brass bell', 'Chuông đồng'], false, 3, ['The bell is metal, but it is brass. Magnets do not pull every metal.', 'Cái chuông bằng kim loại, nhưng là đồng thau. Nam châm không hút mọi kim loại.']),
  th('🏺', ['Clay pot', 'Bình đất'], false, 3, ['The pot is made of clay, so the magnet does not pull it.', 'Cái bình làm bằng đất nung nên nam châm không hút.'])
];
register({ id: 'sci_magnet', learn: true, icon: 'sci:magnet', name: () => T('Magnet Pull', 'Nam Châm Hút'), async run(api) {
  const lv = lvOf(api), [n, per] = PLAN[lv], used = new Set<Thing>(), rounds: Round[] = [];
  mark(api, n, per, band(lv));   // rounds, things guessed before trying, how hard the things are
  for (let r = 0; r < n; r++) {
    const set = pickSet(MAGNET, lv, per, used); let btns: HTMLElement[] = [], mag: HTMLElement = null;
    const xs = per === 1 ? [66] : [42, 62, 82];
    rounds.push({
      draw: x => {
        bg(x.scene, `<rect x="0" y="232" width="400" height="68" fill="#e9c48f"/><rect x="0" y="226" width="400" height="12" fill="#c9a05a" stroke="#3b2a4f" stroke-width="3"/>`);
        btns = set.map((t, i) => item(x.scene, t.p, t.name, xs[i], 68, 'sx-thing'));
        mag = item(x.scene, '🧲', ['Magnet', 'Nam châm'], 14, 40, 'sx-magnet');
      },
      trials: set.map((t, i) => ({ ask: ['Will the magnet pull it? Make a guess!', 'Nam châm có hút vật này không? Con đoán xem!'], answer: t.yes ? 'yes' : 'no', why: t.why,
        choices: [{ key: 'yes', pic: 'sci:pulls', label: ['Pulls', 'Hút'] }, { key: 'no', pic: 'sci:nopull', label: ['No pull', 'Không hút'] }],
        focus: () => btns.forEach((b, j) => b.classList.toggle('sx-focus', j === i && per > 1)), done: () => btns.forEach(b => b.classList.remove('sx-focus')) })),
      act: ['Now bring the magnet close: drag it, or tap it.', 'Giờ đưa nam châm lại gần: kéo hoặc chạm vào nó nhé.'],
      tryIt: x => new Promise<void>(res => {
        x.target(mag);
        dragOrTap(x.api, x.scene, mag, async () => {
          x.target(null); const stuck: HTMLElement[] = [];
          // the magnet passes each thing in turn; what it pulls jumps to its tip and travels on with it
          const hold = (mx: number) => stuck.forEach((s, k) => { s.style.left = (mx + 7) + '%'; s.style.top = (44 - k * 10) + '%'; });
          for (let i = 0; i < set.length; i++) {
            if (x.api.closed) return res();
            const mx = xs[i] - 14; mag.style.left = mx + '%'; mag.style.top = '56%'; hold(mx); await wait(slow(600));
            if (set[i].yes) { x.api.sfx.pop && x.api.sfx.pop(4); stuck.push(btns[i]); hold(mx); }
            else { btns[i].animate && !reduceMotion() && btns[i].animate([{ marginLeft: '0' }, { marginLeft: '3px' }, { marginLeft: '0' }], { duration: 300 }); }
            await wait(slow(650));
          }
          res();
        });
        x.api.onCleanup(res);
      })
    });
  }
  return experiment(api, rounds);
} });

// ---------- 3. Ramps ----------
const BALLS: { c: string; name: Pair }[] = [{ c: '#e8433a', name: ['Red ball', 'Bóng đỏ'] }, { c: '#3b6fe0', name: ['Blue ball', 'Bóng xanh dương'] }, { c: '#43c463', name: ['Green ball', 'Bóng xanh lá'] }, { c: '#ffb020', name: ['Yellow ball', 'Bóng vàng'] }];
const miniRamp = (h: number, c: string, grass = false) => `<svg class="sx-mini" viewBox="0 0 60 40" aria-hidden="true"><path d="M4 ${36 - h * .5}L34 36H4z" fill="#ffb347" stroke="#3b2a4f" stroke-width="2.4" stroke-linejoin="round"/><path d="M34 36h24" stroke="${grass ? '#43c463' : '#3b2a4f'}" stroke-width="${grass ? 5 : 2.4}"/><circle cx="9" cy="${36 - h * .5 - 6}" r="5" fill="${c}" stroke="#3b2a4f" stroke-width="2"/></svg>`;
register({ id: 'sci_ramp', learn: true, icon: 'sci:ramp', name: () => T('Rolling Ramps', 'Dốc Lăn Bóng'), async run(api) {
  const lv = lvOf(api), n = [3, 3, 3, 4, 3][lv], lanes = [2, 2, 3, 3, 4][lv], rounds: Round[] = [];
  mark(api, n, lanes, lv === 4 ? 'grass' : 'smooth');   // rounds, ramps, a grassy ramp
  const RUN = 300, BASE = 70, G = 420;
  for (let r = 0; r < n; r++) {
    // heights (viewBox units) far apart for little ones and Easy, close together from Hard; Talent adds a grass floor
    const raw = lv <= 1 ? shuffle([14, 52]) : lv === 2 ? shuffle([14, 32, 52]) : (() => { for (;;) { const s = shuffle([22, 30, 38, 46, 54]).slice(0, lanes); if (Math.max(...s) - Math.min(...s) >= 16) return s; } })();
    const hs = raw.map(h => Math.round(h * Math.min(1, (300 / lanes - 26) / 54)));   // (four lanes: a little lower, so the top ball stays in view)
    const grass = lv === 4 ? hs.indexOf(Math.max(...hs)) : -1, mu = hs.map((_, i) => i === grass ? 2.4 : 1);
    const dist = hs.map((h, i) => h * 5 / mu[i]);
    const far = lv === 4 || r % 2 === 0 || lv === 0, best = far ? dist.indexOf(Math.max(...dist)) : dist.indexOf(Math.min(...dist));
    const why: Pair = grass >= 0 && far ? ['Grass rubs the ball and slows it down, so even a high ramp cannot send it far.', 'Cỏ cọ vào bóng làm bóng chậm lại, nên dù dốc cao bóng cũng không lăn xa.']
      : far ? ['The highest, steepest ramp gives the ball the most speed, so it rolls the furthest.', 'Con dốc cao và dốc nhất cho bóng nhiều tốc độ nhất, nên bóng lăn xa nhất.']
        : ['The lowest ramp gives the ball the least speed, so it stops first.', 'Con dốc thấp nhất cho bóng ít tốc độ nhất, nên bóng dừng sớm nhất.'];
    const laneH = 300 / lanes; let balls: SVGCircleElement[] = [], go: HTMLButtonElement = null;
    rounds.push({
      draw: x => {
        const body = hs.map((h, i) => { const y0 = laneH * (i + 1) - 10, c = BALLS[i].c;
          return `<g class="sx-lane"><path d="M10 ${y0}L${10 + BASE} ${y0}L10 ${y0 - h}z" fill="#ffb347" stroke="#3b2a4f" stroke-width="3" stroke-linejoin="round"/>
            <path d="M${10 + BASE} ${y0}H392" stroke="${i === grass ? '#43c463' : '#3b2a4f'}" stroke-width="${i === grass ? 8 : 3}"/>${i === grass ? Array.from({ length: 16 }, (_, k) => `<path d="M${90 + k * 19} ${y0 - 3}l3-7 3 7" stroke="#2e9b4a" stroke-width="2" fill="none"/>`).join('') : ''}
            ${Array.from({ length: 6 }, (_, k) => `<path d="M${80 + (k + 1) * 50} ${y0}v6" stroke="#3b2a4f" stroke-width="2"/>`).join('')}
            <circle class="sx-ball" cx="16" cy="${y0 - h - 8}" r="9" fill="${c}" stroke="#3b2a4f" stroke-width="3"/></g>`; }).join('');
        bg(x.scene, body);
        balls = [...x.scene.querySelectorAll('.sx-ball')] as SVGCircleElement[];
      },
      trials: [{ ask: far ? ['Which ball will roll the furthest? Make a guess!', 'Quả bóng nào sẽ lăn xa nhất? Con đoán xem!'] : ['Which ball will stop first, closest to its ramp?', 'Quả bóng nào sẽ dừng sớm nhất, gần con dốc nhất?'],
        answer: String(best), why, choices: hs.map((h, i) => ({ key: String(i), html: miniRamp(h, BALLS[i].c, i === grass), label: BALLS[i].name })) }],
      act: ['Tap Let go, and watch the balls roll!', 'Chạm Thả bóng và xem các quả bóng lăn nhé!'],
      tryIt: x => new Promise<void>(res => {
        go = el('button', 'sx-go', `${pic('▶️')}<span>${esc(T('Let go', 'Thả bóng'))}</span>`) as HTMLButtonElement; x.controls.appendChild(go); x.target(go);
        dragOrTap(x.api, x.scene, go, () => {
          go.disabled = true; x.target(null); x.api.sfx.pop && x.api.sfx.pop(1);
          // a ball rolls down its slope (speeding up), then along the floor slowing to a stop: v² = 2gh, stopping
          // distance h / friction (grass rubs more); the same physics for every lane, so the sizes tell the story
          const plan = hs.map((h, i) => { const L = Math.hypot(h, BASE), a = G * h / L, t1 = Math.sqrt(2 * L / a), v = a * t1, d = Math.min(RUN, dist[i]), t2 = 2 * d / v; return { h, L, a, t1, v, d, t2, y0: laneH * (i + 1) - 10 }; });
          const speed = reduceMotion() ? 6 : 1, t0 = performance.now();
          const step = () => {
            if (x.api.closed) return res();
            const t = (performance.now() - t0) / 1000 * speed; let moving = false;
            plan.forEach((p, i) => {
              let px: number, py: number;
              if (t < p.t1) { const s = .5 * p.a * t * t, f = s / p.L; px = 16 + BASE * f; py = p.y0 - p.h * (1 - f) - 8; moving = true; }
              else { const tt = Math.min(t - p.t1, p.t2), s = p.v * tt - .5 * (p.v / p.t2) * tt * tt; px = 16 + BASE + s; py = p.y0 - 9; if (t - p.t1 < p.t2) moving = true; }
              balls[i].setAttribute('cx', String(px)); balls[i].setAttribute('cy', String(py));
            });
            if (moving) requestAnimationFrame(step); else res();
          };
          requestAnimationFrame(step);
        });
        x.api.onCleanup(res);
      })
    });
  }
  return experiment(api, rounds);
} });

// ---------- 4. Lever: the seesaw ----------
type Lever = { W: number; dB: number; w: number; seats: number[]; n: number; ask: 'which' | 'closest' };
function leverOf(lv: number, r: number): Lever {
  if (lv <= 1) return { W: 2, dB: 1, w: 1, seats: [1, 3], n: 3, ask: 'which' };
  if (lv === 2) return { W: 2, dB: 1, w: 1, seats: [1, 2, 3], n: 3, ask: 'which' };
  const L3: [number, number, number][] = [[3, 1, 1], [3, 1, 2], [2, 1, 1], [3, 1, 2], [2, 1, 1]];
  const L4: [number, number, number][] = [[3, 2, 2], [2, 2, 1], [3, 1, 1], [3, 1, 2], [2, 1, 1]];
  const [W, dB, w] = (lv === 3 ? L3 : L4)[r % 5], n = lv === 3 ? 4 : 5;
  return { W, dB, w, seats: Array.from({ length: n }, (_, k) => k + 1), n, ask: 'closest' };
}
register({ id: 'sci_seesaw', learn: true, icon: 'sci:seesaw', name: () => T('Seesaw Lift', 'Bập Bênh Nâng Bạn'), async run(api) {
  const lv = lvOf(api), n = [3, 3, 3, 4, 3][lv], rounds: Round[] = [];
  mark(api, n, leverOf(lv, 0).seats.length, lv >= 3 ? 'weights' : 'plain', lv >= 3 ? 'closest' : 'which');   // rounds, seats, numbers shown, question
  for (let r = 0; r < n; r++) {
    const L = leverOf(lv, r), lifts = (d: number) => L.w * d > L.W * L.dB, best = L.seats.find(lifts), numbers = lv >= 3;
    const posOf = (d: number, side: number) => 50 + side * (d / L.n) * 44; // % along the plank (the middle is 50)
    let plank: HTMLElement = null, seats: HTMLElement[] = [], bunny: HTMLElement = null, rider: HTMLElement = null;
    const tilt = (d: number | null) => { const tq = d == null ? 0 : L.w * d - L.W * L.dB, a = d == null ? -10 : tq > 0 ? 10 : tq < 0 ? -10 : 0; plank.style.transform = `rotate(${a}deg)`; return tq; };
    const choices: Choice[] = L.seats.length === 2 ? [{ key: '1', pic: 'sci:near', label: ['Near the middle', 'Gần điểm giữa'] }, { key: String(L.seats[1]), pic: 'sci:far', label: ['At the end', 'Ở cuối'] }]
      : L.seats.map(d => ({ key: String(d), html: `<span class="sx-num">${d}</span>`, label: ['Seat ' + d, 'Chỗ ' + d] as Pair }));
    rounds.push({
      draw: x => {
        x.scene.appendChild(el('div', 'sx-pivot'));
        plank = el('div', 'sx-plank'); x.scene.appendChild(plank);
        const bear = el('div', 'sx-rider', pic('🐻') + (numbers ? `<b>${L.W}</b>` : '')); bear.style.left = posOf(L.dB, -1) + '%'; bear.style.width = bear.style.height = '72px'; plank.appendChild(bear);
        if (numbers) for (let d = 1; d <= L.n; d++) { const s = el('div', 'sx-seat sx-left', String(d)); s.style.left = posOf(d, -1) + '%'; s.style.bottom = '-24px'; plank.appendChild(s); }
        seats = L.seats.map(d => { const s = el('button', 'sx-seat' + (numbers ? '' : ' sx-big'), numbers ? String(d) : ''); s.dataset.d = String(d); s.style.left = posOf(d, 1) + '%'; s.style.bottom = numbers ? '-24px' : '6px'; s.setAttribute('aria-label', T('Seat', 'Chỗ ngồi') + ' ' + d); plank.appendChild(s); return s; });
        bunny = item(x.scene, '🐰', ['Bunny', 'Thỏ con'], 86, 87, 'sx-bunny'); if (numbers) bunny.insertAdjacentHTML('beforeend', `<b class="sx-badge" style="font:900 16px var(--font,sans-serif);line-height:30px;text-align:center">${L.w}</b>`);
        tilt(null);
      },
      trials: [{ ask: L.ask === 'which' ? ['Where should the bunny sit to lift the bear? Make a guess!', 'Thỏ nên ngồi ở đâu để nâng được gấu? Con đoán xem!'] : ['Which is the closest seat that still lifts the bear?', 'Chỗ ngồi nào gần điểm giữa nhất mà vẫn nâng được gấu?'],
        answer: String(best), choices, why: L.ask === 'which' ? ['The further from the middle you sit, the harder you push down, so the big bear goes up!', 'Ngồi càng xa điểm giữa, con đè xuống càng mạnh, nên bạn gấu to được nâng lên!'] : ['Weight times distance from the middle: the bigger side goes down, so the bear goes up.', 'Cân nặng nhân khoảng cách tới điểm giữa: bên nào lớn hơn thì đi xuống, nên gấu được nâng lên.'] }],
      act: ['Now put the bunny on a seat: drag it there, or tap a seat.', 'Giờ cho thỏ ngồi lên bập bênh: kéo thỏ tới, hoặc chạm vào một chỗ ngồi nhé.'],
      tryIt: x => new Promise<void>(res => {
        let tries = 0, busy = false;
        const sit = async (s: HTMLElement) => {
          if (busy || x.api.closed) return; busy = true; tries++; x.target(null);
          const d = +s.dataset.d; if (rider) rider.remove();
          bunny.style.visibility = 'hidden'; rider = el('div', 'sx-rider', pic('🐰') + (numbers ? `<b>${L.w}</b>` : '')); rider.style.left = posOf(d, 1) + '%'; plank.appendChild(rider);
          await wait(200); const tq = tilt(d); await wait(slow(1000));
          if (tq > 0) { x.api.sfx.chime && x.api.sfx.chime(); off.forEach(f => f()); return res(); }
          x.api.say(...(tq === 0 ? ['Balanced! Nobody goes up. Try another seat.', 'Thăng bằng rồi! Không ai lên cả. Thử chỗ khác nhé.'] : ['The bear is still down. Try another seat!', 'Gấu vẫn ở dưới. Thử chỗ khác nhé!']) as Pair);
          if (x.api.little && tries >= 2) seats.find(e => +e.dataset.d === best)?.classList.add('hint');
          busy = false; x.target(seats.find(e => +e.dataset.d === best));
        };
        const off = seats.map(s => { const f = () => sit(s); s.addEventListener('click', f); return () => s.removeEventListener('click', f); });
        // the bunny can be dragged onto a seat too (it goes to the nearest one)
        const dragBunny = () => dragOrTap(x.api, x.scene, bunny, at => {
          if (at) { const near = seats.map(s => { const r = s.getBoundingClientRect(), sr = x.scene.getBoundingClientRect(); return { s, d: Math.abs((r.left + r.width / 2 - sr.left) / sr.width * 100 - at.x) }; }).sort((a, b) => a.d - b.d)[0]; bunny.style.left = '86%'; bunny.style.top = '87%'; sit(near.s); }
          else bunny.animate && bunny.animate([{ marginTop: '0' }, { marginTop: '-10px' }, { marginTop: '0' }], { duration: 300 });
          setTimeout(() => { if (!x.api.closed) dragBunny(); }, 50);
        });
        dragBunny();
        x.target(seats.find(e => +e.dataset.d === best));
        x.api.onCleanup(() => { off.forEach(f => f()); res(); });
      })
    });
  }
  return experiment(api, rounds);
} });

// ---------- 5. Light and shadow ----------
type ShadowRound = { kind: 'dir' | 'high' | 'low' | 'near' | 'away' | 'star'; from: [number, number]; rings: [number, number][]; good: number; star?: number };
const TOY = { x: 200, top: 168, ground: 232 }; // the teddy's middle, the top of its head and the ground (viewBox 400 x 300)
const tipOf = (lx: number, ly: number) => lx + (TOY.x - lx) * (TOY.ground - ly) / (TOY.top - ly);
function shadowRounds(lv: number): ShadowRound[] {
  const side = () => Math.random() < .5 ? -1 : 1;
  const dir = (): ShadowRound => { const s = side(); return { kind: 'dir', from: [200, 50], rings: [[200 + s * 130, 70]], good: 0 }; };
  const high = (): ShadowRound => { const s = side(), up = Math.random() < .5; return { kind: up ? 'high' : 'low', from: [200 + s * 110, up ? 120 : 50], rings: [[200 + s * 110, up ? 40 : 128]], good: 0 }; };
  const near = (): ShadowRound => { const s = side(), close = Math.random() < .5; return { kind: close ? 'near' : 'away', from: [200 + s * (close ? 160 : 70), 100], rings: [[200 + s * (close ? 70 : 160), 100]], good: 0 }; };
  const star = (): ShadowRound => {
    // four rings, far enough apart for a finger; exactly one sends the shadow's tip to the star (the others miss it by
    // a clear gap); the lamp starts on the other side of the teddy
    for (;;) {
      const s = side(), rings = shuffle([[40, 40], [140, 40], [80, 120], [170, 120]].map(([d, y]) => [200 - s * d, y] as [number, number]));
      const tips = rings.map(([a, b]) => tipOf(a, b)), g = Math.floor(Math.random() * 4), far = Math.abs(tips[g] - 200);
      if (far > 60 && tips[g] > 20 && tips[g] < 380 && tips.every((t, i) => i === g || Math.abs(t - tips[g]) > 28)) return { kind: 'star', from: [200 + s * 150, 40], rings, good: g, star: tips[g] };
    }
  };
  return lv <= 1 ? [dir(), dir(), dir()] : lv === 2 ? [dir(), high(), dir(), high()] : lv === 3 ? [high(), near(), dir(), near()] : [star(), star(), star()];
}
const SHADOW_WHY: Record<string, Pair> = {
  dir: ['Light goes in straight lines, so the shadow falls on the side away from the lamp.', 'Ánh sáng đi theo đường thẳng, nên bóng đổ về phía xa đèn.'],
  high: ['A high lamp shines down steeply, so the shadow gets shorter.', 'Đèn ở cao chiếu xuống dốc hơn, nên bóng ngắn lại.'],
  low: ['A low lamp shines from the side, so the shadow gets longer.', 'Đèn ở thấp chiếu xiên từ bên cạnh, nên bóng dài ra.'],
  near: ['When the lamp comes nearer the teddy, it shines down more steeply, so the shadow gets shorter.', 'Khi đèn lại gần gấu bông, ánh sáng chiếu xuống dốc hơn, nên bóng ngắn lại.'],
  away: ['When the lamp moves away, it shines more from the side, so the shadow gets longer.', 'Khi đèn ra xa, ánh sáng chiếu xiên hơn, nên bóng dài ra.'],
  star: ['Light goes in a straight line from the lamp, past the top of the teddy, to the end of the shadow.', 'Ánh sáng đi thẳng từ đèn, qua đỉnh đầu gấu bông, tới cuối cái bóng.']
};
register({ id: 'sci_shadow', learn: true, icon: 'sci:shadow', name: () => T('Lamp and Shadow', 'Đèn và Bóng'), async run(api) {
  const lv = lvOf(api), rounds: Round[] = [], plan = shadowRounds(lv);
  mark(api, plan.length, [...new Set(plan.map(R => R.kind === 'low' ? 'high' : R.kind === 'away' ? 'near' : R.kind))].join('/'), Math.max(...plan.map(R => R.rings.length)), lv >= 3 ? 'ray' : 'noray');   // rounds, kinds, rings, light ray drawn
  for (const R of plan) {
    let lamp: HTMLElement = null, shade: SVGPathElement = null, ray: SVGPathElement = null, rings: HTMLElement[] = [];
    const put = (lx: number, ly: number) => {
      const tip = Math.max(-60, Math.min(460, tipOf(lx, ly))), w = 16;
      // (v1.08f, #812: "the shadow must show more clearly") a dark band lying on the ground from the teddy's feet to the tip,
      // thick at the feet; it was an 11 px grey sliver, half see-through, hidden under the teddy when the lamp was high
      const g = TOY.ground, dir = tip >= TOY.x ? 1 : -1;
      shade.setAttribute('d', `M${TOY.x - w} ${g}L${TOY.x + w} ${g}L${tip} ${g}Q${tip + dir * 7} ${g + 4} ${tip} ${g + 8}Q${(tip + TOY.x) / 2} ${g + 14} ${TOY.x + dir * w} ${g + 16}L${TOY.x - dir * w} ${g + 16}z`);
      if (ray) ray.setAttribute('d', `M${lx} ${ly}L${tip} ${TOY.ground}`);
    };
    const pct = ([a, b]: [number, number]) => [a / 4, b / 3];
    let ask: Pair, choices: Choice[], answer: string;
    if (R.kind === 'dir') { ask = ['The lamp will move to the ring. Which way will the shadow point?', 'Đèn sẽ chuyển tới vòng tròn. Bóng sẽ đổ về phía nào?']; choices = [{ key: 'l', pic: '⬅️', label: ['Left', 'Trái'] }, { key: 'r', pic: '➡️', label: ['Right', 'Phải'] }]; answer = R.rings[0][0] < 200 ? 'r' : 'l'; }
    else if (R.kind === 'star') { ask = ['Which ring should the lamp go to, so the shadow reaches the star?', 'Đèn nên đặt ở vòng nào để bóng chạm tới ngôi sao?']; choices = R.rings.map((_, i) => ({ key: String(i), html: `<span class="sx-num">${i + 1}</span>`, label: ['Ring ' + (i + 1), 'Vòng ' + (i + 1)] as Pair })); answer = String(R.good); }
    else { ask = ['The lamp will move to the ring. Will the shadow get longer or shorter?', 'Đèn sẽ chuyển tới vòng tròn. Bóng sẽ dài ra hay ngắn lại?']; choices = [{ key: 'long', pic: 'sci:longer', label: ['Longer', 'Dài ra'] }, { key: 'short', pic: 'sci:shorter', label: ['Shorter', 'Ngắn lại'] }]; answer = R.kind === 'high' || R.kind === 'near' ? 'short' : 'long'; }
    rounds.push({
      draw: x => {
        bg(x.scene, `<rect x="0" y="${TOY.ground}" width="400" height="${300 - TOY.ground}" fill="#cfe8b8"/><path d="M0 ${TOY.ground}H400" stroke="#3b2a4f" stroke-width="3"/><path class="sx-shade" fill="#2f2840" opacity=".82" stroke="#2f2840" stroke-width="2" stroke-linejoin="round"/>${lv >= 3 ? '<path class="sx-ray" stroke="#ffb020" stroke-width="3" stroke-dasharray="8 6" fill="none"/>' : ''}${R.star != null ? `<path transform="translate(${R.star} ${TOY.ground + 30})" d="M0-14l4 9 10 1-7 7 2 10-9-5-9 5 2-10-7-7 10-1z" fill="#ffd23f" stroke="#3b2a4f" stroke-width="2.5"/>` : ''}`);
        shade = x.scene.querySelector('.sx-shade'); ray = x.scene.querySelector('.sx-ray');
        const toy = el('div', 'sx-rider', pic('🧸')); toy.style.left = '50%'; toy.style.bottom = (100 - TOY.ground / 3) + '%'; toy.style.width = toy.style.height = '64px'; x.scene.appendChild(toy);
        rings = R.rings.map((p, i) => { const [a, b] = pct(p), g = el('button', 'sx-ring', R.rings.length > 1 ? String(i + 1) : ''); g.style.left = a + '%'; g.style.top = b + '%'; g.dataset.i = String(i); g.setAttribute('aria-label', T('Ring', 'Vòng tròn') + ' ' + (i + 1)); x.scene.appendChild(g); return g; });
        const [a, b] = pct(R.from); lamp = item(x.scene, '💡', ['Lamp', 'Đèn'], a, b, 'sx-lamp'); put(...R.from);
      },
      trials: [{ ask, choices, answer, why: SHADOW_WHY[R.kind] }],
      act: ['Now move the lamp to the ring: drag it there, or tap the ring.', 'Giờ đưa đèn tới vòng tròn: kéo đèn tới, hoặc chạm vào vòng tròn nhé.'],
      tryIt: x => new Promise<void>(res => {
        let busy = false;
        const goTo = async (i: number) => {
          if (busy || x.api.closed) return; busy = true; x.target(null);
          const p = R.rings[i], [a, b] = pct(p), from = [parseFloat(lamp.style.left) * 4, parseFloat(lamp.style.top) * 3], t0 = performance.now(), dur = slow(900);
          lamp.style.transition = 'none';
          await new Promise<void>(done => { const step = () => { const f = Math.min(1, (performance.now() - t0) / dur), e = f * f * (3 - 2 * f), lx = from[0] + (p[0] - from[0]) * e, ly = from[1] + (p[1] - from[1]) * e; lamp.style.left = lx / 4 + '%'; lamp.style.top = ly / 3 + '%'; put(lx, ly); if (f < 1 && !x.api.closed) requestAnimationFrame(step); else done(); }; requestAnimationFrame(step); });
          lamp.style.left = a + '%'; lamp.style.top = b + '%'; put(p[0], p[1]);
          if (R.kind !== 'star' || i === R.good) { off.forEach(f => f()); await wait(slow(600)); return res(); }
          x.api.say('The shadow misses the star. Try another ring!', 'Bóng chưa chạm ngôi sao. Thử vòng khác nhé!'); busy = false; x.target(rings[R.good]);
          if (x.api.little) rings[R.good].classList.add('hint');
        };
        const off = rings.map((g, i) => { const f = () => goTo(i); g.addEventListener('click', f); return () => g.removeEventListener('click', f); });
        // the lamp can be dragged: the shadow follows it, and letting go near a ring puts it there
        const dragLamp = () => dragOrTap(x.api, x.scene, lamp, at => {
          if (at && !busy) { const k = R.rings.map((p, i) => ({ i, d: Math.hypot(p[0] / 4 - at.x, p[1] / 3 - at.y) })).sort((a, b) => a.d - b.d)[0]; goTo(k.i); }
          setTimeout(() => { if (!x.api.closed) dragLamp(); }, 50);
        }, { move: at => put(at.x * 4, Math.min(TOY.top - 12, at.y * 3)) });
        dragLamp();
        x.target(rings[R.kind === 'star' ? R.good : 0]);
        x.api.onCleanup(() => { off.forEach(f => f()); res(); });
      })
    });
  }
  return experiment(api, rounds);
} });

// ---------- 6. Sound: water bottles ----------
const BOTTLE_C: { c: string; name: Pair }[] = [{ c: '#e8433a', name: ['Red bottle', 'Chai đỏ'] }, { c: '#3b6fe0', name: ['Blue bottle', 'Chai xanh dương'] }, { c: '#43c463', name: ['Green bottle', 'Chai xanh lá'] }, { c: '#ffb020', name: ['Yellow bottle', 'Chai vàng'] }, { c: '#9a6bff', name: ['Purple bottle', 'Chai tím'] }];
const bottleSVG = (fill: number, c: string) => `<svg viewBox="0 0 40 100" aria-hidden="true"><path d="M15 4h10v14l7 12v62a5 5 0 0 1-5 5H13a5 5 0 0 1-5-5V30l7-12z" fill="#eef9ff" stroke="#3b2a4f" stroke-width="3" stroke-linejoin="round"/><path d="M10 ${94 - fill * 62}h20v${fill * 62 - 2}a4 4 0 0 1-4 4H14a4 4 0 0 1-4-4z" fill="${c}" opacity=".75"/><path d="M14 ${94 - fill * 62}h12" stroke="#fff" stroke-width="2"/></svg>`;
// a tapped bottle: the more water, the lower the note (the water makes it shake more slowly)
const pitch = (fill: number) => 1100 - 640 * fill;
const ring = (fill: number) => { const f = pitch(fill); tone(f, .9, { type: 'sine', vol: .2 }); tone(f * 2.76, .35, { type: 'sine', vol: .05 }); };
register({ id: 'sci_sound', learn: true, icon: 'sci:sound', name: () => T('Bottle Music', 'Nhạc Chai Nước'), async run(api) {
  const lv = lvOf(api), n = [3, 3, 4, 4, 3][lv], count = [2, 2, 3, 4, 5][lv], rounds: Round[] = [];
  mark(api, n, count, lv === 4 ? 'match' : 'high-low');   // rounds, bottles, question
  // (v1.08f, #816: "every round of Bottle Music is the same") each round has bottles of other colours, and the under-5s
  // too are asked for the highest and the lowest note in turn (they had two bottles, red and blue, and "highest" every time)
  const hue0 = Math.floor(Math.random() * BOTTLE_C.length), lowFirst = Math.random() < .5;
  for (let r = 0; r < n; r++) {
    const col = (i: number) => BOTTLE_C[(hue0 + r * count + i) % BOTTLE_C.length];
    const fills = lv <= 1 ? shuffle([.18, .86]) : lv === 2 ? shuffle([.15, .5, .85]) : lv === 3 ? shuffle([.2, .4, .6, .8]) : shuffle([.15, .32, .5, .68, .85]);
    const mode = lv === 4 ? 'match' : (r % 2 === 0) !== lowFirst ? 'high' : 'low';
    const best = mode === 'high' ? fills.indexOf(Math.min(...fills)) : mode === 'low' ? fills.indexOf(Math.max(...fills)) : Math.floor(Math.random() * count);
    let bottles: HTMLElement[] = [];
    const why: Pair = mode === 'high' ? ['Less water lets the bottle shake faster, so its note is higher.', 'Ít nước thì chai rung nhanh hơn, nên tiếng kêu cao hơn.'] : mode === 'low' ? ['More water makes the bottle shake more slowly, so its note is lower.', 'Nhiều nước làm chai rung chậm hơn, nên tiếng kêu trầm hơn.'] : ['The same amount of water makes the same shake, so the notes match.', 'Cùng một mực nước thì rung giống nhau, nên hai tiếng giống nhau.'];
    const play = (b: HTMLElement, i: number, scene: HTMLElement) => { ring(fills[i]); b.classList.remove('sx-ring2'); void b.offsetWidth; b.classList.add('sx-ring2', 'sx-heard'); const note = el('i', 'sx-note', '♪'); const sr = scene.getBoundingClientRect(), br = b.getBoundingClientRect(); note.style.left = ((br.left - sr.left) / sr.width * 100 + 4) + '%'; note.style.top = '10%'; scene.appendChild(note); setTimeout(() => note.remove(), 1000); };
    rounds.push({
      draw: x => {
        const row = el('div', 'sx-bottles' + (mode === 'match' ? ' sx-low' : '')); x.scene.appendChild(row);
        bottles = fills.map((f, i) => { const b = el('button', 'sx-bottle', bottleSVG(f, col(i).c)); b.setAttribute('aria-label', T(...col(i).name)); row.appendChild(b); return b; });
        if (mode === 'match') { const hear = el('button', 'sx-go sx-hear', `${pic('🔊')}<span>${esc(T('Hear the note', 'Nghe nốt nhạc'))}</span>`); hear.onclick = () => ring(fills[best]); x.scene.appendChild(hear); setTimeout(() => { if (!x.api.closed) ring(fills[best]); }, 900); }
      },
      trials: [{ ask: mode === 'high' ? ['Which bottle will make the highest sound when you tap it?', 'Gõ vào thì chai nào kêu cao nhất?'] : mode === 'low' ? ['Which bottle will make the lowest sound when you tap it?', 'Gõ vào thì chai nào kêu trầm nhất?'] : ['Listen to the note. Which bottle plays the same note?', 'Nghe nốt nhạc này. Chai nào kêu giống như vậy?'],
        answer: String(best), why, choices: fills.map((f, i) => ({ key: String(i), html: `<span class="sx-mini">${bottleSVG(f, col(i).c).replace('<svg ', '<svg width="100%" height="100%" ')}</span>`, label: col(i).name })) }],
      act: ['Now tap each bottle with the spoon and listen.', 'Giờ gõ thìa vào từng chai và lắng nghe nhé.'],
      tryIt: x => new Promise<void>(res => {
        const heard = new Set<number>(), next = () => x.target(bottles.find((_, i) => !heard.has(i)) || null);
        const off = bottles.map((b, i) => { const f = () => { play(b, i, x.scene); heard.add(i); next(); if (heard.size === bottles.length) setTimeout(() => { off.forEach(g => g()); res(); }, slow(900)); }; b.addEventListener('click', f); return () => b.removeEventListener('click', f); });
        next(); x.api.onCleanup(() => { off.forEach(g => g()); res(); });
      })
    });
  }
  return experiment(api, rounds);
} });
