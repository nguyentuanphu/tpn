// (v1.08d s2au) The games of Season 2, Australia (js/content/s2au-games.ts), on the maths kit's rounds
// (js/games/maths-kit.ts: the levels Easy to Talent, under-5s always Easy, no two rounds alike, the answer moves):
//   hunt  a scene full of animals: every one of the kind asked for is tapped (Easy 2 among 4 others, Talent 5 among 9)
//   path  a grid of squares: the squares that join the start to the end are tapped; from Medium on, some paths are dead
//         ends (Talent: three of them on a bigger grid)
//   quiz  a picture question with answer cards (Talent: written answers only, so the child reads)
// Every picture is our own drawing (js/art/s2au.ts), never a phone emoji. Fits one screen on every size (the s2au checks).
import { register } from './frame.js';
import { pic } from '../art.js';
import { T } from '../i18n.js';
import { el, esc } from '../util.js';
import { play, lv, mix, distinct, type Round } from './maths-kit.js';
import { S2_GAMES, type S2Game, type Opt, type Q } from '../content/s2au-games.js';

let styled = false;
function style() {
  if (styled) return; styled = true;
  document.head.appendChild(el('style', '', `
.s2-scene { position: relative; display: grid; gap: 2px; padding: 6px; border-radius: 16px; width: 100%; box-sizing: border-box; }
.s2-scene.reef { background: linear-gradient(#7fd8f0, #2f8fc8); }
.s2-scene.beach { background: linear-gradient(90deg, #f6dfa0 0%, #f2d48a 80%, #5fc0e8 100%); }
.s2-scene.bush { background: linear-gradient(#a8d88a, #5f9a4a); }
.s2-scene.night { background: linear-gradient(#3a4a86, #4f6a4f); }
.s2-scene.river { background: linear-gradient(90deg, #8fcf6a, #4fa8d8 18%, #4fa8d8 82%, #8fcf6a); }
.s2-scene > * { display: flex; align-items: center; justify-content: center; min-height: 54px; }
.s2-scene .art { width: 44px; height: 44px; }
.s2-scene .mx-tap { min-width: 48px; min-height: 54px; padding: 0; }
.s2-scene .mx-tap .art { width: 46px; height: 46px; }
.s2-scene .s2-deco { opacity: .85; pointer-events: none; }
.s2-scene .s2-cell { border-radius: 10px; }
.s2-scene .s2-cell.mx-tap { background: rgba(255,255,255,.35); }
.s2-scene .s2-cell.mx-tap .art { width: 40px; height: 40px; }
.s2-scene .s2-end .art { width: 48px; height: 48px; }
.s2-pics { display: flex; gap: 8px; justify-content: center; }
.s2-pics .art { width: 72px; height: 72px; }
.mx-btn.s2-opt { flex-direction: column; gap: 2px; min-width: 96px; min-height: 92px; padding: 6px 10px; }
.mx-btn.s2-opt .art { width: 52px; height: 52px; }
.mx-btn.s2-opt small { font: 800 18px var(--font, sans-serif); color: #3b2a4f; line-height: 1.15; max-width: 170px; }
.mx-btn.s2-opt.words small { font-size: 20px; }
.s2g .mx-stage { min-height: 0; padding: 6px; }
.s2g .mx-board { gap: 10px; }
/* a wide screen: the answers sit beside the picture, not under it (owner, 3 Nov 2026 AEDT: one screen) */
/* (v1.08 fix, check fivescreens: on a phone on its side the answers' second column ran 10 px off the screen) side by side, the
   picture gives up width to the answers, never the other way round */
@media (min-aspect-ratio: 4/3) { .s2g .mx-board { flex-direction: row; justify-content: center; align-items: center; } .s2g .mx-board { max-width: 100%; min-width: 0; box-sizing: border-box; } .s2g .mx-board > .mx-stage { flex: 0 1 auto; min-width: 0; } .s2g .mx-board > .mx-controls { flex: none; } .s2g .mx-controls { display: grid; grid-template-columns: repeat(2, auto); max-width: 420px; } .s2g .mx-controls:empty { display: none; } }
@media (max-height: 500px) { .s2g .mx-board { padding: 4px; } .s2g .mx-stage { width: min(460px, 60vw); } .s2-scene > * { min-height: 46px; } .s2-scene .art, .s2-scene .mx-tap .art { width: 38px; height: 38px; } .mx-btn.s2-opt { min-height: 72px; } .mx-btn.s2-opt .art { width: 40px; height: 40px; } .s2-pics .art { width: 52px; height: 52px; } }
`));
}
const tap = (p: string, k: string, cls = '') => { const b = el('button', 'mx-tap ' + cls, pic(p)) as HTMLElement; b.dataset.k = k; b.setAttribute('aria-label', k); return b; };

// ---------- hunt: tap every animal of one kind ----------
function hunt(api, G: S2Game): Round[] {
  const n = lv(api, 3, 4, 5, 5), want = lv(api, 2, 3, 4, 5), others = lv(api, 4, 5, 7, 9), cols = lv(api, 4, 5, 6, 6), rows = 3;
  api.stage.dataset.lv = [n, want, others, cols].join(',');
  const kinds = G.kinds || [], order = mix(kinds.map((_, i) => i)); let r = 0;
  return distinct(n, () => {
    const ki = order[r++ % order.length], K = kinds[ki];
    return {
      ask: K.ask,
      right: e => e.dataset.k === String(ki),
      draw: stage => {
        const box = el('div', 's2-scene ' + G.bg) as HTMLElement; box.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;
        const cells: HTMLElement[] = [], things: HTMLElement[] = [];
        for (let i = 0; i < want; i++) { const t = tap(K.p, String(ki)); things.push(t); cells.push(t); }
        const rest = kinds.map((_, i) => i).filter(i => i !== ki);
        for (let i = 0; i < others; i++) { const j = rest[(i + r) % rest.length], t = tap(kinds[j].p, String(j)); things.push(t); cells.push(t); }
        const deco = G.deco || [];
        while (cells.length < cols * rows) cells.push(el('span', 's2-deco', deco.length && cells.length % 2 ? pic(deco[cells.length % deco.length]) : '') as HTMLElement);
        for (const c of mix(cells)) box.appendChild(c);
        stage.appendChild(box);
        return things;
      }
    };
  });
}

// ---------- path: tap the squares that join the start to the end ----------
type Cell = [number, number];
function makePath(cols: number, rows: number, branches: number) {
  // a way from the left column to the right column, moving right or up and down (never back), then dead ends that touch
  // the way at one square only
  const key = (c: number, r: number) => c + ',' + r, way: Cell[] = [], on = new Set<string>();
  let r = Math.floor(Math.random() * rows); const r0 = r;
  for (let c = 0; c < cols; c++) {
    way.push([c, r]); on.add(key(c, r));
    if (c < cols - 1 && Math.random() < .7) { const to = Math.floor(Math.random() * rows); while (r !== to) { r += to > r ? 1 : -1; way.push([c, r]); on.add(key(c, r)); } }
  }
  const nb = (c: number, r: number): Cell[] => ([[c + 1, r], [c - 1, r], [c, r + 1], [c, r - 1]] as Cell[]).filter(([x, y]) => x >= 0 && y >= 0 && x < cols && y < rows);
  const dead: Cell[] = [], used = new Set(on);
  for (let b = 0, tries = 0; b < branches && tries < 60; tries++) {
    const [sc, sr] = way[1 + Math.floor(Math.random() * Math.max(1, way.length - 2))];
    const free = nb(sc, sr).filter(([x, y]) => !used.has(key(x, y)) && nb(x, y).filter(([a, d]) => used.has(key(a, d))).length === 1);
    if (!free.length) continue;
    const [x, y] = free[Math.floor(Math.random() * free.length)]; dead.push([x, y]); used.add(key(x, y)); b++;
  }
  return { way, dead, r0, r1: way[way.length - 1][1], on, used };
}
function path(api, G: S2Game): Round[] {
  const n = lv(api, 3, 4, 5, 5), cols = lv(api, 4, 5, 6, 6), rows = lv(api, 3, 3, 3, 4), branches = lv(api, 0, 1, 2, 3), P = G.path!;
  api.stage.dataset.lv = [n, cols, rows, branches].join(',');
  return distinct(n, () => {
    const M = makePath(cols, rows, branches);
    return {
      ask: P.ask,
      right: e => e.dataset.k === 'way',
      draw: stage => {
        const box = el('div', 's2-scene ' + G.bg) as HTMLElement; box.style.gridTemplateColumns = `48px repeat(${cols}, 1fr) 48px`;
        const things: HTMLElement[] = [], dead = new Set(M.dead.map(([c, r]) => c + ',' + r));
        for (let r = 0; r < rows; r++) {
          box.appendChild(el('span', 's2-end', r === M.r0 ? pic(P.from) : '') as HTMLElement);
          for (let c = 0; c < cols; c++) {
            const id = c + ',' + r;
            if (M.on.has(id) || dead.has(id)) { const t = tap(P.cell, M.on.has(id) ? 'way' : 'dead', 's2-cell'); things.push(t); box.appendChild(t); }
            else box.appendChild(el('span', 's2-deco', pic(G.deco && G.deco.length ? G.deco[(c + r) % G.deco.length] : 'au:rock')) as HTMLElement);
          }
          box.appendChild(el('span', 's2-end', r === M.r1 ? pic(P.to) : '') as HTMLElement);
        }
        stage.appendChild(box);
        return things;
      }
    };
  });
}

// ---------- quiz: a picture question with answer cards ----------
function quiz(api, G: S2Game): Round[] {
  const qs = G.qs || [], n = Math.min(qs.length, lv(api, 4, 5, 6, 7)), wrongN = lv(api, 2, 2, 3, 3), pics = lv(api, 1, 1, 1, 0);
  api.stage.dataset.lv = [n, wrongN, pics].join(',');
  const order = mix(qs); let k = 0;
  return distinct(n, () => {
    const x: Q = order[k++ % order.length], key = (o: Opt) => o[0];
    const pool = (x.w && x.w.length ? x.w : qs.filter(o => o !== x && !(o.w && o.w.length)).map(o => o.a)).filter(o => key(o) !== key(x.a));
    const wrong = mix(pool.filter((o, i) => pool.findIndex(z => key(z) === key(o)) === i)).slice(0, wrongN);
    const opts = new Map([x.a, ...wrong].map(o => [key(o), o]));
    return {
      ask: x.q, key: key(x.a), answer: key(x.a), others: wrong.map(key),
      label: v => { const o = opts.get(v)!; return `${pics || api.little ? pic(o[2]) : ''}<small>${esc(T(o[0], o[1]))}</small>`; },
      draw: stage => { if (x.p) stage.appendChild(el('div', 's2-pics', pic(x.p))); }
    };
  });
}

for (const G of S2_GAMES) {
  register({
    // origin: the Australian flag on the game's card, as the menu catalogue (js/games/catalog.ts) shows it before this loads
    id: G.id, learn: true, icon: G.icon, origin: 'au', name: () => T(G.name[0], G.name[1]),
    run: api => {
      style(); api.stage.classList.add('s2g');
      const list = G.kind === 'hunt' ? hunt(api, G) : G.kind === 'path' ? path(api, G) : quiz(api, G);
      const mark = new MutationObserver(() => api.stage.querySelectorAll('.mx-btn:not(.s2-opt)').forEach(b => { b.classList.add('s2-opt'); if (!b.querySelector('svg')) b.classList.add('words'); }));
      mark.observe(api.stage, { childList: true, subtree: true });
      api.onCleanup?.(() => mark.disconnect());
      return play(api, list, G.intro, G.end).finally(() => mark.disconnect());
    }
  });
}
