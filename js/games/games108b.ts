// (v1.08b games, owner's plan 3 Nov 2026 AEDT, docs/plans/games-one-home-and-films.md part A5) the picture-quiz engine of
// the new corner games (js/content/games108b.ts): each round shows its picture, says its question, and waits for the
// right answer button (the maths kit's rounds: js/games/maths-kit.ts, so the right answer moves and no two rounds look
// the same). Levels: Easy 4 rounds with 2 wrong answers; Medium 5 and 2; Hard 6 and 3 with the words written larger and
// the pictures smaller; Talent 7 and 3 with written answers only (no pictures), so the child reads. Under-5s always
// get Easy, with pictures. Every picture is our own drawing (js/art.ts), never a phone emoji.
import { register } from './frame.js';
import { pic } from '../art.js';
import { T } from '../i18n.js';
import { el, esc } from '../util.js';
import { play, lv, mix, distinct, type Round } from './maths-kit.js';
import { QUIZ_GAMES, type QuizGame, type Opt, type Q } from '../content/games108b.js';
import { FEST_GAMES } from '../content/festgames108b.js';

let styled = false;
function style() {
  if (styled) return; styled = true;
  document.head.appendChild(el('style', '', `
.g8-pics { display: flex; flex-wrap: wrap; gap: 8px; justify-content: center; align-items: center; max-width: 360px; }
.g8-pics .art { width: 64px; height: 64px; }
.g8-pics.many .art { width: 46px; height: 46px; }
.g8-num { font: 900 72px var(--font, sans-serif); color: #3b6fe0; line-height: 1; }
.g8-rows { display: flex; flex-direction: column; gap: 10px; align-items: center; }
.g8-rows > div { display: flex; gap: 10px; padding: 6px 10px; border-radius: 16px; background: #fff3d6; }
.g8-rows .art { width: 52px; height: 52px; }
.g8-scene { position: relative; width: 200px; height: 150px; }
.g8-scene .g8-box { position: absolute; left: 60px; top: 60px; width: 84px; height: 72px; }
.g8-scene .g8-cat { position: absolute; width: 56px; height: 56px; }
.g8-scene .art { width: 100%; height: 100%; }
.g8-grid { display: grid; grid-template-columns: repeat(3, 52px); grid-template-rows: repeat(3, 52px); gap: 4px; }
.g8-grid i { border-radius: 10px; background: #e8f4ff; border: 2px solid #b8d4f0; display: flex; align-items: center; justify-content: center; }
.g8-grid .art { width: 40px; height: 40px; }
.mx-btn.g8-opt { flex-direction: column; gap: 2px; min-width: 96px; min-height: 96px; padding: 6px 10px; }
.mx-btn.g8-opt .art { width: 56px; height: 56px; }
.mx-btn.g8-opt small { font: 800 18px var(--font, sans-serif); color: #3b2a4f; line-height: 1.15; max-width: 180px; }
.mx-btn.g8-opt.words small { font-size: 21px; }
.mx-btn .g8-num { font-size: 40px; }
.g8-code { display: inline-flex; gap: 2px; }
.g8-code svg { width: 30px; height: 30px; }
`));
}
// a small arrow for the robot's code (drawn here, never a phone emoji)
const arrow = (d: string) => `<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="11" fill="#ffd23f" stroke="#3b2a4f" stroke-width="2"/><path d="${d === 'R' ? 'M6 12h11M13 7l5 5-5 5' : 'M12 18V7M7 11l5-5 5 5'}" fill="none" stroke="#3b2a4f" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
const picOf = (p: string) => p.startsWith('code:') ? `<span class="g8-code">${[...p.slice(5)].map(arrow).join('')}</span>` : p.startsWith('n:') ? `<span class="g8-num">${esc(p.slice(2))}</span>` : pic(p);

// the question's picture: several pictures, a big number, two rows to compare, the cat and the box, or the robot's grid
function drawQ(stage: HTMLElement, p: string) {
  if (!p) return;
  if (p.startsWith('n:')) { stage.appendChild(el('div', 'g8-num', esc(p.slice(2)))); return; }
  if (p.startsWith('row:')) { const [a, b] = p.slice(4).split('|'); stage.appendChild(el('div', 'g8-rows', [a, b].map(r => `<div>${r.split(' ').map(x => pic(x)).join('')}</div>`).join(''))); return; }
  if (p.startsWith('grid:')) {
    const [x, y] = p.slice(5).split(',').map(Number), cells: string[] = [];
    for (let r = 2; r >= 0; r--) for (let c = 0; c < 3; c++) cells.push(`<i>${c === 0 && r === 0 ? pic('🤖') : c === x && r === y ? pic('⭐') : ''}</i>`);
    stage.appendChild(el('div', 'g8-grid', cells.join(''))); return;
  }
  if (['in', 'on', 'under', 'next'].includes(p)) {
    // the box, and the cat in it (half hidden), on it, under it (the box up on a shelf line) or next to it
    const boxTop = p === 'under' ? 8 : 70, cat = { in: 'left:76px;top:76px;width:48px;height:48px', on: 'left:72px;top:16px', under: 'left:72px;top:92px', next: 'left:4px;top:84px' }[p];
    stage.appendChild(el('div', 'g8-scene', `${p === 'in' ? '' : `<span class="g8-box" style="top:${boxTop}px">${pic('📦')}</span>`}<span class="g8-cat" style="${cat}">${pic('🐱')}</span>${p === 'in' ? `<span class="g8-box" style="top:${boxTop + 22}px;height:56px;overflow:hidden">${pic('📦')}</span>` : ''}`));
    return;
  }
  const list = p.split(' ');
  stage.appendChild(el('div', 'g8-pics' + (list.length > 4 ? ' many' : ''), list.map(x => pic(x)).join('')));
}

function rounds(api, G: QuizGame): Round[] {
  const n = Math.min(G.qs.length, lv(api, 4, 5, 6, 7)), wrongN = lv(api, 2, 2, 3, 3), pics = lv(api, 1, 1, 1, 0);
  api.stage.dataset.lv = [n, wrongN, pics].join(',');
  const order = mix(G.qs); let k = 0;
  const key = (o: Opt) => o[0];
  return distinct(n, () => {
    const x: Q = order[k++ % order.length];
    // its own wrong answers first; a question with fewer than the level asks for is not padded (its own are the only
    // safe ones); without its own, the other questions' right answers are the wrong ones
    const pool = (x.w && x.w.length ? x.w : G.qs.filter(o => o !== x).map(o => o.a)).filter(o => key(o) !== key(x.a));
    const wrong = mix(pool.filter((o, i) => pool.findIndex(z => key(z) === key(o)) === i)).slice(0, wrongN);
    const opts = new Map([x.a, ...wrong].map(o => [key(o), o]));
    const showPic = (o: Opt) => o[2] && (pics || api.little || o[2].startsWith('code:'));
    return {
      ask: x.q, key: key(x.a), answer: key(x.a), others: wrong.map(key),
      label: v => { const o = opts.get(v); return `${showPic(o) ? picOf(o[2]) : ''}<small>${esc(T(o[0], o[1]))}</small>`; },
      draw: stage => { drawQ(stage, x.p); }
    };
  });
}

for (const G of [...QUIZ_GAMES, ...FEST_GAMES]) {
  register({
    id: G.id, learn: true, english: !!G.english, icon: G.icon, name: () => T(G.name[0], G.name[1]),
    run: api => { style(); return playStyled(api, rounds(api, G), G); }
  });
}
// the kit's play, with the answer buttons styled as picture-and-word cards as each round draws them
function playStyled(api, list: Round[], G: QuizGame) {
  const mark = new MutationObserver(() => api.stage.querySelectorAll('.mx-btn:not(.g8-opt)').forEach(b => { b.classList.add('g8-opt'); if (!b.querySelector('svg')) b.classList.add('words'); }));
  mark.observe(api.stage, { childList: true, subtree: true });
  api.onCleanup?.(() => mark.disconnect());
  return play(api, list, G.intro, G.end).finally(() => mark.disconnect());
}
