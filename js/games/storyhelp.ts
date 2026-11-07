// Story Helpers / Cùng Giúp Trong Truyện (owner, 18 Oct 2026 AEDT: "read story then ask kid to resolve puzzle or work on
// something … then move on, read and then more interactive"; for 5 to 8 and 2 to 5). A story is read a page at a time,
// each word lit as it is said (tap a word to hear it again); then the child helps in the picture: puts things where they
// belong (drag, or tap the thing then tap the place), finds who is hiding, or, from 5, puts what happened in order. Then
// the story reads on. Stories: js/content/storyhelp.ts.
//   2 to 5 (api.little): one thing at a time, big pictures (84 px), the right place glows after a short wait or a miss,
//            everything is spoken, no reading needed, nobody loses
//   5 to 8: two to four things a page, every place labelled with its word (Medium and Hard: the instruction is shown as
//            words to read too), the last page asks for the order of what happened
// Loaded only when the game opens (js/games/readingmenu.js registers it while Studio's readingTrial is on).
import { T } from '../i18n.js';
import { settings } from '../state.js';
import { sayAsync, hush, spoken } from '../voice.js';
import { animalCall, animalRecording, loadAnimalCalls } from '../audio.js';
import { pic } from '../art.js';
import { shuffle, el, wait, esc } from '../util.js';
import { choiceButtons } from './frame.js';
import { STORIES, HELP_LINES } from '../content/storyhelp.js';
import type { Story, Task, Thing, Two } from '../content/storyhelp.js';

// (js/games/frame.js: the game window's helpers this game uses)
type Plan = () => Element | null | undefined;
type Api = { stage: HTMLElement; little?: boolean; level: number; smart?: number; talent?: boolean; tier?: () => number; readonly closed: boolean; sfx: { tap(): void };
  dots(n: number, done: number): void; show(en: string, vi: string): void; right(e?: Element | null): void; wrong(e: Element | null, en?: string, vi?: string): void;
  praise(): void; win(extra?: object): Promise<unknown>; onCleanup(f: () => void): void; hand?(target: Element | null | undefined): void; plan(f: Plan, o?: { maxActions?: number }): void };
const lang = () => (settings.lang === 'vi' ? 1 : 0);
const word = (w: Two) => w[lang()];
// the animals' real voices when they are fed (js/audio.js, sounds/animals/)
const CALL: Record<string, string> = { hen: 'cluck', cow: 'moo', pig: 'oink' };
const HINT_MS = 6000;

let styled = false;
function style(): void {
  if (styled) return; styled = true;
  document.head.appendChild(el('style', '', `
.choice.sh-book { width: auto; min-width: clamp(120px, 26vw, 170px); height: auto; min-height: clamp(120px, 26vw, 170px); flex-direction: column; gap: 4px; padding: 10px; font-size: clamp(16px, 3.4vw, 22px); font-weight: 800; }
.sh-cover { display: inline-flex; width: clamp(64px, 14vw, 96px); height: clamp(64px, 14vw, 96px); } .sh-cover .art { width: 100%; height: 100%; }
/* (v1.08 fix, check fivescreens) a phone on its side (390 px high): the story covers were sized by the screen's width, two
   rows of 170 px, so the second row ran 166 px below the screen; there they are sized by its height */
@media (orientation: landscape) and (max-height: 520px) { .choice.sh-book { min-width: clamp(110px, 20vw, 170px); min-height: clamp(96px, 34vh, 150px); padding: 6px; } .sh-cover { width: clamp(48px, 16vh, 80px); height: clamp(48px, 16vh, 80px); } }
.sh-wrap { display: flex; flex-direction: column; align-items: center; gap: clamp(6px, 1.4vh, 12px); width: min(96vw, 900px); margin: 0 auto; }
.sh-text { display: flex; flex-wrap: wrap; justify-content: center; align-items: center; gap: 4px 6px; background: rgba(255, 255, 255, .94); color: #2a2a3a; border-radius: 20px; padding: 8px 14px; box-shadow: 0 5px 0 rgba(0, 0, 0, .15); max-width: 100%; }
.sh-text .sh-pics { display: inline-flex; gap: 2px; margin-right: 6px; } .sh-text .sh-pics .art { width: clamp(30px, 6vw, 44px); height: clamp(30px, 6vw, 44px); }
.sh-text span.w { padding: 2px 3px; border-radius: 8px; font-weight: 800; color: #3b2a4f; font-size: clamp(22px, 4.6vw, 32px); }
.sh-text span.w.on { background: #ffd23f; }
.sh-text button { min-width: 44px; border: 0; background: none; font-size: clamp(20px, 4.4vw, 30px); font-weight: 800; line-height: 1.25; color: #3b2a4f; padding: 2px 3px; border-radius: 8px; min-height: 44px; cursor: pointer; }
.sh-text button.on { background: #ffd23f; }
.sh-ear { border: 0; border-radius: 50%; width: 52px; height: 52px; background: #fff; box-shadow: 0 3px 0 rgba(0, 0, 0, .18); display: inline-flex; align-items: center; justify-content: center; padding: 8px; }
.sh-ear .art { width: 100%; height: 100%; }
.gl.little .sh-ear { width: 64px; height: 64px; }
.sh-scene { position: relative; width: 100%; aspect-ratio: 16 / 9; max-height: 46vh; border-radius: 22px; overflow: hidden; box-shadow: inset 0 0 0 4px rgba(0, 0, 0, .08), 0 6px 0 rgba(0, 0, 0, .15); touch-action: none; }
.sh-scene.house { background: linear-gradient(#fbe7c6 0 62%, #c9905a 62% 100%); }
.sh-scene.kitchen { background: linear-gradient(#d8f0ef 0 60%, #fff 60% 61%, #e9d9c1 61% 100%), #e9d9c1; }
.sh-scene.garden, .sh-scene.yard, .sh-scene.farm { background: linear-gradient(#9fdcff 0 44%, #8fd16a 44% 100%); }
.sh-scene.farm { background: linear-gradient(#ffe2a8 0 40%, #a6d46e 40% 100%); }
.sh-spot { position: absolute; transform: translate(-50%, -50%); display: flex; flex-direction: column; align-items: center; justify-content: flex-end; border-radius: 14px; transition: box-shadow .2s, transform .2s; }
.sh-spot .sh-word { font-size: clamp(13px, 2.4vw, 18px); font-weight: 800; line-height: 1.1; color: #3b2a4f; background: rgba(255, 255, 255, .92); border-radius: 8px; padding: 2px 6px; margin-top: 3px; white-space: nowrap; }
.sh-spot .sh-pic { width: clamp(52px, 11vw, 96px); height: clamp(52px, 11vw, 96px); display: inline-flex; } .sh-spot .art { width: 100%; height: 100%; }
.sh-spot .sh-got { position: absolute; left: 50%; top: 42%; transform: translate(-50%, -50%); display: flex; gap: 2px; pointer-events: none; }
.sh-spot .sh-got .art { width: clamp(24px, 5vw, 40px); height: clamp(24px, 5vw, 40px); filter: drop-shadow(0 2px 0 rgba(0, 0, 0, .25)); }
.sh-spot.glow { box-shadow: 0 0 0 5px #ffd23f, 0 0 26px 10px rgba(255, 210, 63, .8); transform: translate(-50%, -50%) scale(1.06); }
.sh-spot.right { box-shadow: 0 0 0 5px #5fd36a; } .sh-spot.wrong { animation: shShake .4s; }
@keyframes shShake { 25% { transform: translate(-54%, -50%); } 75% { transform: translate(-46%, -50%); } }
.sh-shape { border: 3px solid rgba(0, 0, 0, .25); }
.sh-shape.cupboard { width: 100%; height: 100%; background: linear-gradient(90deg, #a5683d 0 49%, #7d4b2a 49% 51%, #a5683d 51%); border-radius: 8px; }
.sh-shape.sink { position: relative; width: 100%; height: 100%; background: radial-gradient(ellipse at 50% 30%, #f4fbfd, #9fb7c2); border-radius: 0 0 45% 45%; }
.sh-shape.sink::before { content: ''; position: absolute; left: 44%; top: -38%; width: 12%; height: 40%; background: #8a9aa3; border-radius: 6px 6px 0 0; box-shadow: 10px 0 0 -3px #8a9aa3; }
.sh-shape.shelf { width: 100%; height: 30%; background: #a5683d; border-radius: 4px; }
.sh-shape.table { width: 100%; height: 40%; background: #b5763f; border-radius: 10px; box-shadow: 0 18px 0 -6px #7d4b2a; }
.sh-shape.line { width: 100%; height: 6px; background: #555; border: 0; border-radius: 3px; box-shadow: -4px 0 0 2px #8a5a3b, 4px 0 0 2px #8a5a3b; }
.sh-shape.door { width: 100%; height: 100%; background: linear-gradient(#8a5a3b, #6a4126); border-radius: 10px 10px 0 0; box-shadow: inset -6px 0 0 #5a3519; }
.sh-shape.pond { width: 100%; height: 100%; background: radial-gradient(ellipse, #6fd0ff, #2e9bd6); border-radius: 50%; }
.sh-shape.soil { width: 100%; height: 100%; background: repeating-linear-gradient(90deg, #6b4423 0 12px, #7d5230 12px 24px); border-radius: 10px; }
.sh-tray { display: flex; flex-wrap: wrap; justify-content: center; gap: clamp(8px, 2vw, 14px); min-height: 72px; }
.sh-thing { border: 0; border-radius: 18px; background: #fff; box-shadow: 0 5px 0 rgba(0, 0, 0, .2); width: clamp(64px, 14vw, 96px); min-height: clamp(64px, 14vw, 96px); padding: 6px; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 2px; touch-action: none; cursor: grab; }
.gl.little .sh-thing { width: 96px; min-height: 96px; }
.sh-thing .art { width: clamp(40px, 9vw, 64px); height: clamp(40px, 9vw, 64px); pointer-events: none; }
.sh-thing small { font-size: clamp(13px, 2.6vw, 17px); font-weight: 800; line-height: 1.1; color: #3b2a4f; pointer-events: none; }
.sh-thing.sel { box-shadow: 0 0 0 5px #3cc7e8, 0 5px 0 rgba(0, 0, 0, .2); }
.sh-thing.gone { visibility: hidden; }
.sh-float { position: fixed; z-index: 99; pointer-events: none; transform: translate(-50%, -50%) scale(1.1); opacity: .95; }
.sh-hide { position: absolute; left: 50%; top: 40%; width: 70%; height: 70%; transform: translate(-50%, -50%) scale(.2); opacity: 0; transition: transform .4s, opacity .4s; pointer-events: none; } .sh-hide.out { transform: translate(-50%, -120%) scale(1); opacity: 1; }
.sh-slots { display: flex; gap: clamp(8px, 2vw, 14px); justify-content: center; }
.sh-slot { width: clamp(70px, 16vw, 110px); min-height: clamp(70px, 16vw, 110px); border-radius: 18px; border: 3px dashed rgba(59, 42, 79, .4); display: flex; flex-direction: column; align-items: center; justify-content: center; font-size: 26px; font-weight: 800; line-height: 1; color: rgba(59, 42, 79, .5); background: rgba(255, 255, 255, .5); }
.sh-slot .art { width: 60%; height: 60%; } .sh-slot small { font-size: clamp(12px, 2.4vw, 16px); font-weight: 800; line-height: 1.1; color: #3b2a4f; }
`));
}

// say what to do: shown in the game's help line and said (captions follow it, like every game)
async function say(api: Api, w: Two): Promise<void> {
  if (api.closed) return; api.show(w[0], w[1]);
  const t = settings.lang === 'vi' ? w[1] : w[0]; spoken.forEach(f => { try { f(t); } catch (e) { } });
  await sayAsync(w[0], w[1]);
}
// a sentence in the language being read, each word lit as it is said
async function readLine(api: Api, btns: HTMLElement[], text: string): Promise<void> {
  const speech = sayAsync(text, text);
  for (const b of btns) { if (api.closed) return; btns.forEach(x => x.classList.remove('on')); b.classList.add('on'); await wait(260 + (b.textContent || '').length * 55); }
  await speech; btns.forEach(x => x.classList.remove('on'));
}

function sceneOf(story: Story, used: Set<string>, labels: boolean): { scene: HTMLElement; spots: Map<string, HTMLElement> } {
  const scene = el('div', `sh-scene ${story.scene}`), spots = new Map<string, HTMLElement>();
  const size: Record<string, [number, number]> = { cupboard: [16, 40], sink: [20, 26], shelf: [28, 16], table: [32, 22], line: [56, 14], door: [11, 46], pond: [22, 24], soil: [32, 14], pic: [16, 26] };
  for (const S of story.spots) {
    const [w, h] = size[S.kind], s = el('div', 'sh-spot', S.kind === 'pic' ? `<span class="sh-pic">${pic(S.pic || '')}</span>` : `<div class="sh-shape ${S.kind}"></div>`);
    s.style.left = S.x + '%'; s.style.top = S.y + '%'; s.style.width = w + '%'; if (S.kind !== 'pic') s.style.height = h + '%';
    if (labels || used.has(S.id)) s.appendChild(el('span', 'sh-word', esc(word(S.word))));
    s.appendChild(el('span', 'sh-got')); s.dataset.id = S.id; s.setAttribute('aria-label', word(S.word)); spots.set(S.id, s); scene.appendChild(s);
  }
  return { scene, spots };
}

// put things where they belong: drag one onto its place, or tap it and then tap the place
async function put(api: Api, task: Extract<Task, { kind: 'put' }>, wrap: HTMLElement, scene: HTMLElement, spots: Map<string, HTMLElement>, little: boolean): Promise<boolean> {
  const things: Thing[] = little ? task.things.slice(0, 1) : [...task.things, ...(task.more || [])];
  const tray = el('div', 'sh-tray'); wrap.appendChild(tray);
  let sel: HTMLElement | null = null, left = things.length, hintT: ReturnType<typeof setTimeout> | 0 = 0;
  const thingOf = new Map<HTMLElement, Thing>();
  let stopAnimal = () => {}, endT: ReturnType<typeof setTimeout> | 0 = 0;
  api.onCleanup(() => { stopAnimal(); clearTimeout(endT); });
  const glow = (id: string | null) => spots.forEach((s, k) => s.classList.toggle('glow', k === id));
  const armHint = (th: Thing) => { clearTimeout(hintT); if (little) hintT = setTimeout(() => glow(th.to), HINT_MS); };
  api.onCleanup(() => clearTimeout(hintT));
  return new Promise(res => {
    api.onCleanup(() => res(false));
    const place = (b: HTMLElement, th: Thing, spot: HTMLElement | null) => {
      if (!spot) return;
      if (spot.dataset.id !== th.to) { api.wrong(spot, ...HELP_LINES.notThere); if (little) glow(th.to); return; }
      b.classList.add('gone'); b.classList.remove('sel'); sel = null; glow(null);
      spot.querySelector('.sh-got')!.insertAdjacentHTML('beforeend', pic(th.pic)); api.right(spot);
      const recording = CALL[th.to] && settings.sound ? animalRecording(CALL[th.to]) : null;
      stopAnimal(); if (recording) stopAnimal = animalCall(CALL[th.to], 1.2); else if (!little) sayAsync(word(th.word), word(th.word));
      if (--left <= 0) { clearTimeout(hintT); endT = setTimeout(() => { stopAnimal(); res(true); }, Math.max(700, (recording?.duration || 0) * 1000 + 100)); return; }
      const next = things.find((x, k) => !tray.children[k].classList.contains('gone')); if (next) armHint(next);
    };
    const spotAt = (x: number, y: number) => { for (const s of spots.values()) { const r = s.getBoundingClientRect(), pad = 18; if (x > r.left - pad && x < r.right + pad && y > r.top - pad && y < r.bottom + pad) return s; } return null; };
    things.forEach(th => {
      // (levels) Talent: the things to put away show only their pictures (tap one to hear its word)
      const b = el('button', 'sh-thing', `${pic(th.pic)}${little || api.talent ? '' : `<small>${esc(word(th.word))}</small>`}`); b.setAttribute('aria-label', word(th.word)); tray.appendChild(b);
      let drag: HTMLElement | null = null, sx = 0, sy = 0, moved = false;
      b.addEventListener('pointerdown', e => { sx = e.clientX; sy = e.clientY; moved = false; try { b.setPointerCapture(e.pointerId); } catch (x) { } });
      b.addEventListener('pointermove', e => {
        if (!b.hasPointerCapture || !b.hasPointerCapture(e.pointerId)) return;
        if (!moved && Math.hypot(e.clientX - sx, e.clientY - sy) > 10) { moved = true; drag = el('div', 'sh-float', pic(th.pic)); drag.style.width = drag.style.height = b.offsetWidth + 'px'; document.body.appendChild(drag); b.style.opacity = '.35'; }
        if (drag) { drag.style.left = e.clientX + 'px'; drag.style.top = e.clientY + 'px'; const s = spotAt(e.clientX, e.clientY); spots.forEach(x => x.classList.toggle('glow', x === s)); }
      });
      const end = (e: PointerEvent) => { if (drag) { drag.remove(); drag = null; b.style.opacity = ''; glow(null); if (moved) place(b, th, spotAt(e.clientX, e.clientY)); } };
      b.addEventListener('pointerup', end); b.addEventListener('pointercancel', () => { if (drag) { drag.remove(); drag = null; b.style.opacity = ''; glow(null); } });
      b.addEventListener('click', () => { if (moved) return; api.sfx.tap(); tray.querySelectorAll('.sel').forEach(x => x.classList.remove('sel')); sel = b; b.classList.add('sel'); thingOf.set(b, th); if (!little) sayAsync(word(th.word), word(th.word)); });
    });
    spots.forEach(s => s.addEventListener('click', () => { const th = sel && thingOf.get(sel); if (sel && th) place(sel, th, s); }));
    // (r89) auto play helps like a child: picks the next thing up, then taps the place it belongs
    const btns = [...tray.children].filter((e): e is HTMLElement => e instanceof HTMLElement);
    api.plan(() => { const th = sel && thingOf.get(sel); if (sel && th) return spots.get(th.to) || null; return btns.find(b => !b.classList.contains('gone')) || null; }, { maxActions: things.length * 3 });
    armHint(things[0]);
    if (little && api.hand) api.hand(tray.children[0]);
  });
}

// find who is hiding: tap the right place, and out it pops
async function find(api: Api, task: Extract<Task, { kind: 'find' }>, spots: Map<string, HTMLElement>, little: boolean): Promise<boolean> {
  let misses = 0;
  return new Promise(res => {
    api.onCleanup(() => res(false));
    if (little) setTimeout(() => { for (const id of task.spots) spots.get(id)?.classList.add('glow'); }, 400);
    api.plan(() => spots.get(task.at) || null, { maxActions: 3 }); // (r89) auto play looks in the right place
    spots.forEach((s, id) => s.addEventListener('click', async () => {
      if (id !== task.at) { api.wrong(s, ...HELP_LINES.notHere); if (little && ++misses >= 2) { spots.forEach(x => x.classList.remove('glow')); spots.get(task.at)?.classList.add('glow'); } return; }
      spots.forEach(x => x.classList.remove('glow')); const h = el('span', 'sh-hide', pic(task.hide)); s.appendChild(h); requestAnimationFrame(() => h.classList.add('out'));
      api.right(s); await say(api, task.found); res(true);
    }));
  });
}

// put what happened in order: tap (or drag) the pictures into the numbered boxes
async function order(api: Api, task: Extract<Task, { kind: 'order' }>, wrap: HTMLElement): Promise<boolean> {
  const slots = el('div', 'sh-slots'), tray = el('div', 'sh-tray'); wrap.append(slots, tray);
  const boxes = task.steps.map((_, i) => { const b = el('div', 'sh-slot', String(i + 1)); slots.appendChild(b); return b; });
  let next = 0; const stepBtn = new Map<number, HTMLElement>();
  api.plan(() => stepBtn.get(next) || null, { maxActions: task.steps.length * 2 }); // (r89) auto play: the first thing that happened next
  return new Promise(res => {
    api.onCleanup(() => res(false));
    shuffle(task.steps.map((s, i) => ({ ...s, i }))).forEach(st => {
      const b = el('button', 'sh-thing', `${pic(st.pic)}<small>${esc(word(st.word))}</small>`); b.setAttribute('aria-label', word(st.word)); tray.appendChild(b); stepBtn.set(st.i, b);
      b.onclick = () => {
        if (st.i !== next) { api.wrong(b, ...HELP_LINES.first); return; }
        b.classList.add('gone'); boxes[next].innerHTML = `${pic(st.pic)}<small>${esc(word(st.word))}</small>`; api.right(boxes[next]);
        if (++next >= task.steps.length) setTimeout(() => res(true), 700);
      };
    });
  });
}

export async function play(api: Api): Promise<unknown> {
  style(); api.onCleanup(hush);if(settings.sound)void loadAnimalCalls();
  const little = !!api.little, tier = little ? 0 : (typeof api.tier === 'function' ? api.tier() : Math.max(1, api.level | 0));
  // (v1.07 levels) the real settings, before the first tap: words on places (used, all or none), instruction kept on screen,
  // words on the things to put away, the older (bigger) tasks
  api.stage.dataset.lv = [little ? 'used' : (api.smart || 0) >= 2 ? 'none' : 'all', tier >= 2 ? 1 : 0, little || api.talent ? 0 : 1, little ? 0 : 1].join(',');
  // choose a story (its cover: a picture and its name)
  api.stage.innerHTML = '';
  await say(api, HELP_LINES.choose); if (api.closed) return;
  const covers = choiceButtons(api, STORIES, (s: Story) => `<span class="sh-cover">${pic(s.icon)}</span><span>${esc(word(s.title))}</span>`, 'choice sh-book');
  api.plan(() => covers.find(b => b.isConnected) || null, { maxActions: 2 }); // (r89) auto play opens the first story
  const story: Story | null = await new Promise(res => { covers.forEach(b => b.onclick = () => { api.sfx.tap(); res(b._v); }); api.onCleanup(() => res(null)); });
  if (!story || api.closed) return;
  await sayAsync(word(story.title), word(story.title));
  for (let p = 0; p < story.pages.length; p++) {
    if (api.closed) return;
    api.dots(story.pages.length, p); api.stage.innerHTML = '';
    const page = story.pages[p], text = word(page.text), task: Task = !little && page.older ? page.older : page.task;
    const wrap = el('div', 'sh-wrap'), line = el('div', 'sh-text', `<span class="sh-pics">${page.pics.split(' ').map(x => pic(x)).join('')}</span>`);
    // (from 5 a word can be tapped to hear it again; an under-5 does not read yet: the words are shown, the ear reads them again)
    const words = text.split(' ').map(w => { if (little) { const sp = el('span', 'w', esc(w)); line.appendChild(sp); return sp; }
      const b = el('button', '', esc(w)); b.onclick = () => { api.sfx.tap(); sayAsync(w.replace(/[.,!?]/g, ''), w.replace(/[.,!?]/g, '')); }; line.appendChild(b); return b; });
    const ear = el('button', 'sh-ear', pic('👂')); ear.setAttribute('aria-label', 'Read again / Đọc lại'); ear.onclick = () => { api.sfx.tap(); readLine(api, words, text); }; line.appendChild(ear);
    wrap.appendChild(line); api.stage.appendChild(wrap);
    await readLine(api, words, text); if (api.closed) return;
    // the help: the places this task uses are labelled for everyone; from 5 every place is
    const used = new Set<string>(task.kind === 'put' ? [...task.things, ...(task.more || [])].map(t => t.to) : task.kind === 'find' ? task.spots : []);
    let ok = false;
    if (task.kind === 'order') { await say(api, task.say); ok = await order(api, task, wrap); }
    else {
      // (levels, owner 1 Nov 2026 AEDT) Easy: every place has its word; Medium: the instruction also stays on screen; Hard and
      // Talent: the places have no words, so the child reads the instruction and finds them in the picture
      const plain = !little && (api.smart || 0) >= 2, { scene, spots } = sceneOf(story, plain ? new Set<string>() : used, !little && !plain); wrap.appendChild(scene);
      if (tier >= 2) api.show(task.say[0], task.say[1]); // (Medium and Hard: the instruction stays on screen to read)
      await say(api, task.say); if (p === 0 && task.kind === 'put') await say(api, HELP_LINES.drag); if (api.closed) return;
      ok = task.kind === 'put' ? await put(api, task, wrap, scene, spots, little) : await find(api, task, spots, little);
    }
    if (!ok || api.closed) return;
    api.praise(); await wait(900);
    if (p < story.pages.length - 1) await say(api, HELP_LINES.helped);
  }
  await say(api, HELP_LINES.end);
  return api.win();
}
