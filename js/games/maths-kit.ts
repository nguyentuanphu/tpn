// (v1.08 maths) The shared engine of the 21 new maths games (js/games/maths3.ts and maths4.ts). Each round draws a
// picture on the stage, says its question (a fixed sentence, or a template whose gaps are only numbers, so every line is
// recorded: tools/voice-lines.mts), then waits for the right tap: an answer button under the picture, or a thing in the
// picture itself (a hunt asks for every right thing in turn). The levels Easy, Medium, Hard and Talent come from lv(),
// which notes what each level picked (the levelsall check); under-5s always get Easy.
import { untilRight } from './frame.js';
import { T } from '../i18n.js';
import { el, wait } from '../util.js';

let styled = false;
function style() {
  if (styled) return; styled = true;
  document.head.appendChild(el('style', '', `
.mx-board { display: flex; flex-direction: column; align-items: center; gap: 12px; padding: 10px; margin: 0 auto; max-width: 96vw; }
.mx-stage { width: min(400px, 92vw); min-height: 170px; background: #fffdf6; border-radius: 20px; box-shadow: 0 4px 16px rgba(40, 30, 60, .14); display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 10px; padding: 12px; box-sizing: border-box; }
.mx-controls { display: flex; flex-wrap: wrap; gap: 10px; justify-content: center; max-width: 400px; }
.mx-btn { min-width: 64px; min-height: 64px; padding: 6px 14px; border-radius: 22px; border: 2px solid #3b2a4f; background: #fff; box-shadow: 0 3px 0 rgba(59, 42, 79, .2); font: 800 22px var(--font, sans-serif); color: #3b2a4f; cursor: pointer; display: inline-flex; align-items: center; justify-content: center; gap: 6px; touch-action: manipulation; }
.mx-btn svg { width: 54px; height: 54px; }
.mx-art { flex: none; display: block; }
.mx-btn .mx-art { width: auto; height: auto; max-width: 120px; max-height: 120px; }
.mx-btn.pic { padding: 4px; }
.mx-btn.found, .mx-tap.found { outline: 4px solid #43c463; outline-offset: 2px; pointer-events: none; }
.mx-tap { min-width: 64px; min-height: 64px; border: 0; background: transparent; padding: 2px; border-radius: 16px; cursor: pointer; display: inline-flex; align-items: center; justify-content: center; touch-action: manipulation; font: 800 20px var(--font, sans-serif); color: #3b2a4f; }
.mx-tap .art { width: 48px; height: 48px; }
.mx-row { display: flex; flex-wrap: wrap; gap: 6px; justify-content: center; align-items: flex-end; }
.mx-big { font: 900 44px var(--font, sans-serif); color: #3b6fe0; letter-spacing: 4px; text-align: center; }
.mx-big b { display: inline-block; min-width: 40px; border-bottom: 5px solid #e2483d; color: #e2483d; }
.mx-pics { display: flex; flex-wrap: wrap; justify-content: center; gap: 2px; max-width: 340px; }
.mx-pics .art { width: 38px; height: 38px; }
.mx-pics .gone { opacity: .25; filter: grayscale(1); position: relative; }
.mx-note { font: 700 15px var(--font, sans-serif); color: #6b5a7d; text-align: center; }
.mx-svg { width: min(300px, 80vw); height: auto; }
.mx-pan .art { width: 44px; height: 44px; }
.mx-pan.small .art { width: 34px; height: 34px; }
`));
}

/** a question: what it draws, how it is said, and its answer (a button value, or the things in the picture to tap) */
export type Round = {
  draw: (stage: HTMLElement) => void | HTMLElement[];   // returns the things to tap in the picture, when the answer is there
  ask: [string, string] | (() => void);                 // [en, vi] said as it is, or a function that calls api.say with numbers
  answer?: string; others?: string[];                    // answer buttons (values); the right one and the wrong ones
  label?: (v: string) => string;                         // a button's inside (HTML) when it is not just its value
  right?: (e: HTMLElement) => boolean;                  // which things in the picture are right (every one of them is asked for)
  key?: string;                                          // what was missed, for api.missed / api.got
};

export const mix = <V,>(list: V[]): V[] => { const a = [...list]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
export const pick = (from: number, to: number) => from + Math.floor(Math.random() * (to - from + 1));
export const range = (from: number, to: number) => Array.from({ length: to - from + 1 }, (_, i) => from + i);
// numbers near the answer that are not the answer, inside lo..hi, k of them
export const near = (n: number, lo: number, hi: number, k = 2, step = 1): string[] => {
  const c: number[] = [];
  for (let d = 1; c.length < 8 && d < 40; d++) for (const v of [n - d * step, n + d * step]) if (v >= lo && v <= hi && !c.includes(v)) c.push(v);
  return mix(c.slice(0, Math.max(k, 4))).slice(0, k).map(String);
};
/** wrong answers taken from a list of values, k of them */
export const othersFrom = (answer: string, from: string[], k: number) => mix(from.filter(v => v !== answer)).slice(0, k);
// the value for the chosen level: Easy, Medium, Hard, Talent; under-5s always get Easy (noted for the levelsall check)
export const lv = <V,>(api, e: V, m: V, h: V, t: V): V => { const v = api.little ? e : [e, m, h, t][api.smart || 0] ?? e; api.lvNote?.([e, m, h, t], v); return v; };
/** how many rounds, and how many wrong answers sit beside the right one */
export const rounds = api => lv(api, 4, 5, 6, 7), wrongs = api => lv(api, 2, 2, 3, 3);

/** play a list of rounds: intro and end are [en, vi] said as they are */
export async function play(api, list: Round[], intro: [string, string], end: [string, string]) {
  style();
  api.say(intro[0], intro[1]);
  api.dots(list.length, 0);
  const wrap = el('div', 'mx-board'); api.stage.appendChild(wrap);
  const stage = el('div', 'mx-stage'); wrap.appendChild(stage);
  const controls = el('div', 'mx-controls'); wrap.appendChild(controls);
  await wait(1100);
  for (let k = 0; k < list.length; k++) {
    if (api.closed) return;
    const q = list[k];
    stage.innerHTML = ''; controls.innerHTML = '';
    const things = q.draw(stage) || [];
    if (typeof q.ask === 'function') q.ask(); else api.say(q.ask[0], q.ask[1]);
    if (q.right) {
      // the answer is in the picture: every right thing is tapped, one after another
      const want = things.filter(q.right), found = new Set<HTMLElement>();
      for (const e of things) e.classList.add('mx-tap');
      while (found.size < want.length) {
        api.plan(() => want.find(e => !found.has(e)), { maxActions: 4 });
        const hit = await untilRight(api, things.filter(e => !found.has(e)), e => q.right(e));
        if (!hit || api.closed) return;
        found.add(hit as HTMLElement); hit.classList.add('found'); api.sfx.ding?.();
      }
      api.plan(() => null);
    } else {
      const btns = mix([q.answer, ...q.others]).map(v => { const b = el('button', 'mx-btn' + (q.label ? ' pic' : ''), q.label ? q.label(v) : v); b.dataset.v = v; controls.appendChild(b); return b; });
      const target = btns.find(b => b.dataset.v === q.answer);
      api.plan(() => target, { maxActions: 5 });
      let missed = false;
      const clicked = await untilRight(api, btns, e => { const r = e === target; if (!r) missed = true; return r; });
      if (!clicked || api.closed) return;
      api.plan(() => null);
      if (q.key) { if (missed) api.missed?.(q.key); else api.got?.(q.key); }
      api.sfx.ding?.();
    }
    api.dots(list.length, k + 1);
    await wait(650);
  }
  api.say(end[0], end[1]); await wait(900);
  return api.win({ title: T(end[0], end[1]) });
}

// ---------- small drawings used by several games (SVG drawn here, never a phone emoji) ----------
export const OUT = '#3b2a4f';
export const svgBox = (w: number, h: number, body: string, cls = 'mx-svg') => `<svg class="${cls}" viewBox="0 0 ${w} ${h}" aria-hidden="true">${body}</svg>`;
/** a flat shape drawn in a 48 by 48 box: circle, square, triangle, rectangle, star, heart, oval, diamond, pentagon, hexagon */
export function shapeSVG(kind: string, fill: string, size = 48) {
  const s = `fill="${fill}" stroke="${OUT}" stroke-width="2.6" stroke-linejoin="round"`;
  const poly = (n: number, r = 19, rot = -Math.PI / 2) => Array.from({ length: n }, (_, i) => { const a = rot + i * 2 * Math.PI / n; return `${(24 + Math.cos(a) * r).toFixed(1)},${(25 + Math.sin(a) * r).toFixed(1)}`; }).join(' ');
  const body = ({
    circle: `<circle cx="24" cy="24" r="18" ${s}/>`,
    square: `<rect x="7" y="7" width="34" height="34" rx="2" ${s}/>`,
    triangle: `<path d="M24 6L43 40H5z" ${s}/>`,
    rectangle: `<rect x="3" y="13" width="42" height="22" rx="2" ${s}/>`,
    star: `<path d="${Array.from({ length: 10 }, (_, i) => { const a = -Math.PI / 2 + i * Math.PI / 5, k = i % 2 ? 8 : 20; return (i ? 'L' : 'M') + (24 + Math.cos(a) * k).toFixed(1) + ' ' + (26 + Math.sin(a) * k).toFixed(1); }).join('')}z" ${s}/>`,
    heart: `<path d="M24 41C10 31 4 23 7 15c3-7 12-7 17 0 5-7 14-7 17 0 3 8-3 16-17 26z" ${s}/>`,
    oval: `<ellipse cx="24" cy="24" rx="21" ry="13" ${s}/>`,
    diamond: `<path d="M24 4l16 20-16 20L8 24z" ${s}/>`,
    pentagon: `<polygon points="${poly(5)}" ${s}/>`,
    hexagon: `<polygon points="${poly(6, 19, 0)}" ${s}/>`
  })[kind] || '';
  return `<svg class="mx-art" viewBox="0 0 48 48" width="${size}" height="${size}" aria-hidden="true">${body}</svg>`;
}
export const SHAPE_NAMES: Record<string, [string, string]> = {
  circle: ['circle', 'hình tròn'], square: ['square', 'hình vuông'], triangle: ['triangle', 'hình tam giác'], rectangle: ['rectangle', 'hình chữ nhật'],
  star: ['star', 'ngôi sao'], heart: ['heart', 'trái tim'], oval: ['oval', 'hình bầu dục'], diamond: ['diamond', 'hình thoi'], pentagon: ['pentagon', 'hình ngũ giác'], hexagon: ['hexagon', 'hình lục giác']
};
export const shapeName = (k: string) => T(SHAPE_NAMES[k][0], SHAPE_NAMES[k][1]);
export const COLOURS = ['#e8433a', '#3b6fe0', '#43c463', '#ffd23f', '#ff7eb8', '#9a6bff', '#ff9f43'];
