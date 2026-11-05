// (v1.08d polish, brief docs/cores/tasks/v108d/polish-brief.md part 2) Hands-on versions where doing teaches better than
// a picture quiz:
//   fg_tet     Wrap the Bánh Chưng (the Tết festival game, was a picture quiz): lay the dong leaves in the square mould,
//              fill it in the real order (sticky rice, mung beans, pork, mung beans, sticky rice), fold the leaves over
//              and tie the bamboo string across and down.
//   mazebuild  Maze Builder (the thinking corner): lay stepping stones from the duckling to its mother, round the rocks.
// Levels: Easy, Medium, Hard and Talent play differently (more cakes and a wrong bowl; bigger mazes, more rocks, and on
// Talent only as many stones as the shortest way needs). Under-5s get the gentlest version, with the right one wiggling.
// Every picture is our own drawing (js/art.ts); the stepping stones, mould and string are drawn here with CSS.
import { register, untilRight, tapOne } from './frame.js';
import { playWatch } from './playwatch.js';
import { pic } from '../art.js';
import { T } from '../i18n.js';
import { el, wait } from '../util.js';

const lv = <V,>(api, e: V, m: V, h: V, t: V): V => { const v = api.little ? e : [e, m, h, t][api.smart || 0] ?? e; api.lvNote?.([e, m, h, t], v); return v; };
// the computer player and the checks: the right one of what the game is asking for now (playWatch.ask)
const planRight = api => api.plan(() => { const a = playWatch.ask; return a ? a.els.find(x => x.isConnected && a.check(x)) || null : null; });
const mixUp = <V,>(a: V[]): V[] => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };

let styled = false;
function style() {
  if (styled) return; styled = true;
  document.head.appendChild(el('style', '', `
.ho-wrap { display: flex; flex-wrap: wrap; gap: 14px; align-items: center; justify-content: center; width: 100%; }
.ho-say { width: 100%; text-align: center; font: 800 20px var(--font, sans-serif); color: #3b2a4f; min-height: 26px; }
.ho-mould { position: relative; width: min(54vmin, 380px); height: min(54vmin, 380px); flex: 0 0 auto; }
.ho-box { position: absolute; inset: 22%; border-radius: 6px; background: #f6ead0; border: 3px dashed #b89a6a; overflow: hidden; }
.ho-leaf { position: absolute; background: #3f9a4a; border: 2px solid #2a6a33; border-radius: 40% 40% 12px 12px; transition: all .35s; box-sizing: border-box; padding: 0; min-width: 44px; min-height: 44px; }
.ho-leaf.t { left: 22%; right: 22%; top: 0; height: 24%; } .ho-leaf.b { left: 22%; right: 22%; bottom: 0; height: 24%; border-radius: 12px 12px 40% 40%; }
.ho-leaf.l { top: 22%; bottom: 22%; left: 0; width: 24%; border-radius: 40% 12px 12px 40%; } .ho-leaf.r { top: 22%; bottom: 22%; right: 0; width: 24%; border-radius: 12px 40% 40% 12px; }
.ho-leaf.loose { opacity: .55; filter: saturate(.6); cursor: pointer; } .ho-leaf.loose.t { top: -6%; } .ho-leaf.loose.b { bottom: -6%; } .ho-leaf.loose.l { left: -6%; } .ho-leaf.loose.r { right: -6%; }
.ho-leaf.in { opacity: 1; } .ho-leaf.fold { background: #2f8a3c; z-index: 3; }
.ho-leaf.fold.t { top: 22%; height: 30%; } .ho-leaf.fold.b { bottom: 22%; height: 30%; } .ho-leaf.fold.l { left: 22%; width: 30%; } .ho-leaf.fold.r { right: 22%; width: 30%; }
.ho-layer { position: absolute; left: 6%; right: 6%; height: 15%; border-radius: 4px; opacity: 0; transform: translateY(-30px); transition: all .3s; }
.ho-layer.on { opacity: 1; transform: none; }
.ho-layer.rice { background: #fffaf0; border: 2px solid #e8dcc0; } .ho-layer.bean { background: #f2c64a; border: 2px solid #c89a2a; } .ho-layer.pork { background: #e89a8a; border: 2px solid #b86a5a; }
.ho-line { position: absolute; background: #c8a46a; border: 1.5px solid #8a6a3a; z-index: 4; opacity: 0; transition: opacity .3s; pointer-events: none; }
.ho-line.h { left: 18%; right: 18%; top: calc(50% - 4px); height: 8px; } .ho-line.v { top: 18%; bottom: 18%; left: calc(50% - 4px); width: 8px; }
.ho-line.tied { opacity: 1; }
.ho-str { position: absolute; z-index: 5; width: 48px; height: 48px; border-radius: 50%; background: #fff3d6; border: 3px solid #c8a46a; padding: 0; display: flex; align-items: center; justify-content: center; }
.ho-str .art { width: 34px; height: 34px; } .ho-str.h { left: -2%; top: calc(50% - 24px); } .ho-str.v { top: -2%; left: calc(50% - 24px); }
.ho-str.tied { opacity: .4; }
.ho-bowls { display: flex; flex-wrap: wrap; gap: 10px; justify-content: center; max-width: 420px; }
.ho-bowl { display: flex; flex-direction: column; align-items: center; justify-content: center; min-width: 96px; min-height: 96px; border-radius: 18px; background: #fff3d6; border: 3px solid #e8c88a; font: 800 17px var(--font, sans-serif); color: #3b2a4f; padding: 6px; }
.ho-bowl .art { width: 52px; height: 52px; }
.gl.little .ho-bowl { min-width: 110px; min-height: 110px; }
.ho-grid { display: grid; gap: 4px; touch-action: manipulation; }
.ho-cell { width: var(--c); height: var(--c); border-radius: 10px; background: #bfe6a6; border: 2px solid #8ac070; padding: 0; display: flex; align-items: center; justify-content: center; }
.ho-cell .art { width: 78%; height: 78%; }
.ho-cell.rock { background: #d8d0c0; border-color: #a89a80; }
.ho-cell.stone { background: radial-gradient(circle, #a8b8c8 0 52%, #bfe6a6 54%); }
.ho-cell.walk { background: radial-gradient(circle, #ffd23f 0 52%, #bfe6a6 54%); }
.ho-cell.start, .ho-cell.goal { background: #e8f4ff; border-color: #9ac0e8; }
.ho-left { font: 800 18px var(--font, sans-serif); color: #3b2a4f; }
.ho-side { display: flex; flex-wrap: wrap; gap: 4px 16px; justify-content: center; align-items: center; width: 100%; }
.ho-wrap.wide { flex-wrap: nowrap; } .ho-wrap.wide .ho-side { flex-direction: column; width: 30%; } .ho-wrap.wide .ho-say { width: auto; }
`));
}

// ---------- fg_tet: Wrap the Bánh Chưng ----------
const FILL = [
  { id: 'rice', icon: '🌾', name: ['sticky rice', 'gạo nếp'] },
  { id: 'bean', icon: '🫘', name: ['mung beans', 'đỗ xanh'] },
  { id: 'pork', icon: '🥩', name: ['pork', 'thịt lợn'] }
];
const NOT_IN = [{ id: 'carrot', icon: '🥕', name: ['carrot', 'cà rốt'] }, { id: 'sweet', icon: '🍬', name: ['sweets', 'kẹo'] }];
const ORDER = ['rice', 'bean', 'pork', 'bean', 'rice'];
const SIDES = ['t', 'r', 'b', 'l'], OPP = { t: 'b', b: 't', l: 'r', r: 'l' };
register({
  id: 'fg_tet', learn: true, icon: 'fg:tet', name: () => T('Wrap the Bánh Chưng', 'Gói Bánh Chưng'),
  async run(api) {
    style(); planRight(api);
    const cakes = lv(api, 1, 1, 2, 2), odd = lv(api, 0, 1, 1, 2), pairs = !api.little && api.smart >= 3;
    api.stage.dataset.lv = [cakes, odd, pairs ? 'pairs' : '', api.talent ? 'words' : ''].join(',');
    api.say('Let us wrap a square bánh chưng for Tết! First lay the dong leaves in the mould.', 'Cùng gói bánh chưng vuông đón Tết nhé! Trước tiên xếp lá dong vào khuôn.');
    const STEPS = 4; // (the dots: leaves, filling, folding, the string, for each cake)
    for (let c = 0; c < cakes; c++) {
      if (c) { api.stage.innerHTML = ''; api.say('One more cake for the family!', 'Gói thêm một cái cho cả nhà nào!'); }
      const ok = await wrapOne(api, c, cakes, STEPS, odd, pairs);
      if (!ok || api.closed) return;
    }
    api.say('A square, green bánh chưng for Tết. Now it boils all night!', 'Bánh chưng xanh vuông vắn cho ngày Tết. Giờ luộc bánh cả đêm nhé!');
    await wait(1200);
    return api.win({ title: T('All wrapped for Tết!', 'Gói xong bánh chưng!') });
  }
});
async function wrapOne(api, c: number, cakes: number, STEPS: number, odd: number, pairs: boolean) {
  let done = 0; const tick = (stage?: boolean) => { if (stage) { done++; api.dots(STEPS * cakes, STEPS * c + done); } };
  api.dots(STEPS * cakes, STEPS * c);
  const wrap = el('div', 'ho-wrap'), line = el('div', 'ho-say'), mould = el('div', 'ho-mould'), box = el('div', 'ho-box'), bowls = el('div', 'ho-bowls');
  api.stage.appendChild(wrap); wrap.append(line, mould, bowls); mould.appendChild(box);
  const show = (en: string, vi: string) => { line.textContent = T(en, vi); };
  // 1. the four leaves, loose beside the mould: tap each to lay it in
  const leaves = SIDES.map(s => { const b = el('button', `ho-leaf loose ${s}`); b.dataset.side = s; b.setAttribute('aria-label', T('Dong leaf', 'Lá dong')); mould.appendChild(b); return b; });
  show('Lay the four dong leaves in the mould', 'Xếp bốn lá dong vào khuôn');
  const left = new Set(leaves);
  while (left.size) {
    const e = await untilRight(api, [...left], x => left.has(x)); if (!e || api.closed) return false;
    left.delete(e); e.classList.remove('loose'); e.classList.add('in'); api.sfx?.pop?.(left.size); tick();
  }
  tick(true);
  // 2. the filling, in the real order; Medium and up add something that does not go in a bánh chưng
  api.say('Now fill it: sticky rice, mung beans, pork, mung beans, then sticky rice on top.', 'Giờ cho nhân vào: gạo nếp, đỗ xanh, thịt, đỗ xanh, rồi gạo nếp lên trên cùng.');
  const kinds = mixUp([...FILL, ...NOT_IN.slice(0, odd)]);
  const btns = kinds.map(k => { const b = el('button', 'ho-bowl', `${api.talent ? '' : pic(k.icon)}<span>${T(k.name[0], k.name[1])}</span>`); b.dataset.kind = k.id; bowls.appendChild(b); return b; });
  ORDER.forEach((k, i) => { const l = el('div', `ho-layer ${k}`); l.style.bottom = `${6 + i * 17}%`; box.appendChild(l); });
  for (let i = 0; i < ORDER.length; i++) {
    const want = ORDER[i], name = FILL.find(f => f.id === want).name;
    show(`Next: ${name[0]}`, `Tiếp theo: ${name[1]}`);
    const e = await untilRight(api, btns, b => b.dataset.kind === want); if (!e || api.closed) return false;
    box.querySelectorAll('.ho-layer')[i].classList.add('on'); tick();
    if (api.smart >= 2 && !api.little) mixUp(btns).forEach(b => bowls.appendChild(b)); // (Hard and Talent: the bowls move)
  }
  btns.forEach(b => b.remove()); tick(true);
  // 3. fold the leaves over the filling; on Talent, fold opposite sides one after the other, as at home
  api.say(pairs ? 'Fold the leaves over. Fold the opposite side next, so it stays square!' : 'Fold the leaves over the filling.', pairs ? 'Gấp lá lại. Gấp cạnh đối diện ngay sau đó cho bánh vuông nhé!' : 'Gấp lá phủ lên nhân bánh.');
  show('Fold the leaves over', 'Gấp lá lại');
  const open = new Set(leaves); let last = '';
  while (open.size) {
    const need = pairs && last && open.size % 2 === 1 ? OPP[last] : '';
    const e = await untilRight(api, [...open], x => open.has(x) && (!need || x.dataset.side === need)); if (!e || api.closed) return false;
    open.delete(e); e.classList.add('fold'); last = e.dataset.side; tick();
  }
  tick(true);
  // 4. tie the bamboo string across and down
  api.say('Tie the bamboo string, across and down!', 'Buộc lạt giang, ngang rồi dọc!');
  show('Tie the string across and down', 'Buộc lạt ngang và dọc');
  // (a knot at the edge for each string, so the two never cover each other where they cross)
  const strings = ['h', 'v'].map(d => { mould.appendChild(el('div', `ho-line ${d}`)); const b = el('button', `ho-str ${d}`, pic('🎋')); b.dataset.dir = d; b.setAttribute('aria-label', d === 'h' ? T('String across', 'Lạt ngang') : T('String down', 'Lạt dọc')); mould.appendChild(b); return b; });
  const loose = new Set(strings);
  while (loose.size) {
    const e = await untilRight(api, [...loose], x => loose.has(x)); if (!e || api.closed) return false;
    loose.delete(e); e.classList.add('tied'); e.disabled = true; mould.querySelector(`.ho-line.${e.dataset.dir}`).classList.add('tied'); tick();
  }
  tick(true); api.sfx?.ding?.(); show('A square bánh chưng!', 'Bánh chưng vuông rồi!');
  await wait(700);
  return true;
}

// ---------- mazebuild: Maze Builder ----------
type Cell = { r: number, c: number };
function makeMaze(n: number, rocks: number) {
  for (let tries = 0; tries < 200; tries++) {
    const rock = new Set<number>(), start = (n - 1) * n, goal = n - 1; // bottom-left to top-right
    while (rock.size < rocks) { const k = Math.floor(Math.random() * n * n); if (k !== start && k !== goal) rock.add(k); }
    const dist = bfs(n, rock, goal);
    if (dist[start] >= 0 && dist[start] >= n) return { n, rock, start, goal, dist };
  }
  return { n, rock: new Set<number>(), start: (n - 1) * n, goal: n - 1, dist: bfs(n, new Set(), n - 1) };
}
function bfs(n: number, rock: Set<number>, from: number) {
  const d = new Array(n * n).fill(-1); d[from] = 0; const q = [from];
  while (q.length) { const k = q.shift(); for (const m of near(n, k)) if (d[m] < 0 && !rock.has(m)) { d[m] = d[k] + 1; q.push(m); } }
  return d;
}
const near = (n: number, k: number) => { const r = Math.floor(k / n), c = k % n, out = []; if (r > 0) out.push(k - n); if (r < n - 1) out.push(k + n); if (c > 0) out.push(k - 1); if (c < n - 1) out.push(k + 1); return out; };
register({
  id: 'mazebuild', learn: true, icon: 'ho:maze', name: () => T('Maze Builder', 'Xây Mê Cung'),
  async run(api) {
    style(); planRight(api);
    const want = lv(api, 4, 5, 5, 6), mazes = lv(api, 2, 2, 3, 3), budget = api.talent;
    // (one screen) a short screen, such as a phone on its side, holds fewer rows of 44 px stones: the maze is made smaller
    // to fit (its rocks in proportion), never scrolled
    const sr = api.stage.getBoundingClientRect(), H = sr.height || 420, W = sr.width || 360, wide = W > H * 1.3, min = api.little ? 66 : 46;
    const fit = Math.floor(((wide ? Math.min(H - 16, W * .66) : Math.min(W - 8, H - (budget ? 86 : 60))) + 2) / min);
    const n = Math.max(4, Math.min(want, fit)), rocks = Math.round(lv(api, 3, 6, 8, 11) * (n * n) / (want * want));
    api.stage.dataset.lv = [n, rocks, mazes, budget ? 'budget' : ''].join(',');
    api.say('Help the duckling get home! Lay stepping stones from the duckling to its mother, around the rocks.', 'Giúp vịt con về nhà! Đặt đá kê chân từ vịt con tới vịt mẹ, đi vòng qua những tảng đá.');
    for (let m = 0; m < mazes; m++) {
      if (m) { api.stage.innerHTML = ''; api.say('Another maze!', 'Thêm một mê cung nữa!'); }
      const ok = await buildOne(api, makeMaze(n, rocks), m, mazes, budget);
      if (!ok || api.closed) return;
    }
    api.say('Every duckling is home. You are a great maze builder!', 'Vịt con nào cũng về nhà rồi. Con xây mê cung giỏi quá!');
    await wait(1000);
    return api.win({ title: T('Mazes built!', 'Xây xong mê cung!') });
  }
});
async function buildOne(api, M, m: number, mazes: number, budget: boolean) {
  const { n, rock, start, goal, dist } = M;
  api.dots(mazes, m);
  const wrap = el('div', 'ho-wrap'), side = el('div', 'ho-side'), line = el('div', 'ho-say'), grid = el('div', 'ho-grid'), left = el('div', 'ho-left');
  // the cell size fits the stage: the whole maze on one screen on a phone (both ways), a tablet and a computer; on a
  // wide, short screen the words go beside the maze
  const sr = api.stage.getBoundingClientRect(), W = sr.width || 360, H = sr.height || 420, wide = W > H * 1.3;
  const room = wide ? Math.min(W * .66, H - 16) : Math.min(W - 8, H - (budget ? 70 : 44)), gap = room < n * 50 ? 2 : 4;
  const cs = Math.max(api.little ? 64 : 44, Math.min(84, Math.floor((room - gap * (n - 1)) / n)));
  grid.style.cssText = `--c:${cs}px;gap:${gap}px;grid-template-columns:repeat(${n}, ${cs}px)`;
  if (wide) wrap.classList.add('wide');
  api.stage.appendChild(wrap); side.appendChild(line); if (budget) side.appendChild(left); wrap.append(side, grid);
  const cells = Array.from({ length: n * n }, (_, k) => {
    const b = el('button', 'ho-cell' + (rock.has(k) ? ' rock' : k === start ? ' start' : k === goal ? ' goal' : ''), rock.has(k) ? pic('🪨') : k === start ? pic('🐥') : k === goal ? pic('🦆') : '');
    b.dataset.k = String(k); b.setAttribute('aria-label', rock.has(k) ? T('Rock', 'Tảng đá') : k === start ? T('Duckling', 'Vịt con') : k === goal ? T('Mother duck', 'Vịt mẹ') : T('Grass', 'Bãi cỏ'));
    grid.appendChild(b); return b;
  });
  const chain = [start], placed = () => chain.length - 1;
  let stones = dist[start] - 1; // (Talent) only as many stones as the shortest way needs
  const say = (en: string, vi: string) => { line.textContent = T(en, vi); };
  const showLeft = () => { left.textContent = T(`Stones left: ${stones}`, `Còn ${stones} viên đá`); };
  say('Tap the grass next to the duckling', 'Chạm vào bãi cỏ cạnh vịt con'); if (budget) showLeft();
  const end = () => chain[chain.length - 1];
  for (let guard = 0; guard < 200; guard++) {
    if (near(n, end()).includes(goal)) break;
    // the best next stones (one step nearer the mother along the shortest way), for the hint and the computer player
    const best = (k: number) => near(n, end()).includes(k) && !rock.has(k) && !chain.includes(k) && dist[k] >= 0 && dist[k] === dist[end()] - 1;
    const open = cells.filter((b, k) => k !== start && k !== goal) as HTMLElement[];
    playWatch.ask = { els: open, check: (b: Element) => best(+(b as HTMLElement).dataset.k) };
    let hintT: ReturnType<typeof setTimeout> | 0 = 0; if (api.little) hintT = setTimeout(() => { const h = open.find(b => best(+b.dataset.k)); if (h) h.classList.add('hint'); }, 8000);
    const e = await tapOne(open, api); clearTimeout(hintT); playWatch.ask = null; open.forEach(b => b.classList.remove('hint'));
    if (!e || api.closed) return false;
    const k = +e.dataset.k;
    if (k === end() && chain.length > 1) { chain.pop(); e.classList.remove('stone'); if (budget) { stones++; showLeft(); } continue; } // (a tap on the last stone takes it back)
    if (rock.has(k)) { api.wrong(e, 'A rock is in the way. Go around it!', 'Có tảng đá chắn đường. Đi vòng qua nhé!'); continue; }
    if (chain.includes(k)) continue;
    if (!near(n, end()).includes(k)) { api.wrong(e, 'Put the next stone right beside the last one.', 'Đặt viên đá tiếp theo ngay cạnh viên trước nhé.'); continue; }
    chain.push(k); e.classList.add('stone'); if (best(k) || dist[k] === dist[chain[chain.length - 2]] - 1) api.right(e); else api.sfx?.pop?.(1);
    if (budget) { stones--; showLeft(); }
    if (budget && stones <= 0 && !near(n, k).includes(goal)) {
      api.wrong(e, 'Out of stones! Find a shorter way.', 'Hết đá rồi! Tìm đường ngắn hơn nhé.');
      chain.splice(1).forEach(x => cells[x].classList.remove('stone')); stones = dist[start] - 1; showLeft();
    }
    say('Keep going to the mother duck', 'Đi tiếp tới chỗ vịt mẹ');
  }
  // the duckling walks home along the stones
  say('Off you go, duckling!', 'Vịt con đi nào!'); api.say('Quack quack! Off you go, duckling!', 'Cạp cạp! Vịt con đi nào!');
  for (const k of [...chain.slice(1), goal]) { cells[k].classList.add('walk'); await wait(api.little ? 260 : 180); }
  api.right(cells[goal]); api.dots(mazes, m + 1);
  await wait(600);
  return true;
}
