// Planning and strategy puzzles: Tower of Hanoi, programming a robot, mazes, "Blindfold Goat" (follow the clues to
// deduce where the goat hides) and Blindfold Tag, the circle game (friends take turns as the blindfolded seeker).
import { register, tapOne } from './frame.js';
import { T } from '../i18n.js';
import { shuffle, pick, el, wait } from '../util.js';

// ---------- Tower of Hanoi (Tháp Hà Nội) ----------
register({
  id: 'hanoi', icon: '🗼', name: () => T('Tower Stack', 'Tháp Hà Nội'),
  async run(api) {
    const n = api.level <= 1 ? 2 : api.level === 2 ? 3 : 4;
    const rods = [Array.from({ length: n }, (_, i) => n - i), [], []];
    const COLS = ['#e8434a', '#ffb52e', '#4cbf5c', '#3d7fd6', '#9a6bff'];
    const board = el('div', 'hanoi'); api.stage.appendChild(board);
    const tools = el('div', 'tools', `<button class="pill hint">💡 ${T('Hint', 'Gợi ý')}</button><span class="moves"></span>`); api.stage.appendChild(tools);
    let held = null, moves = 0;
    const rodEls = [0, 1, 2].map(i => { const r = el('button', 'rod'); r._v = i; board.appendChild(r); return r; });
    function draw(hint?: number[] | null) {
      rodEls.forEach((r, i) => {
        r.innerHTML = '<i class="pole"></i>' + (i === 2 ? '<i class="flag">🚩</i>' : '');
        rods[i].forEach((d, k) => { const disc = el('i', 'disc' + (held === i && k === rods[i].length - 1 ? ' up' : '')); disc.style.width = (30 + d * 16) + '%'; disc.style.background = COLS[d - 1]; disc.style.bottom = (8 + k * 18) + 'px'; r.appendChild(disc); });
        r.classList.toggle('hint', !!(hint && hint.includes(i)));
      });
      tools.querySelector('.moves').textContent = T('Moves: ', 'Số bước: ') + moves;
    }
    // Best next move found by searching every arrangement (at most 81 for 4 discs).
    function bestMove() {
      const key = s => s.map(r => r.join(',')).join('|');
      const goal = key([[], [], Array.from({ length: n }, (_, i) => n - i)]);
      const start = rods.map(r => r.slice()), seen = new Map([[key(start), null]]), q = [start];
      while (q.length) {
        const s = q.shift(); if (key(s) === goal) { let k = key(s), path = []; while (seen.get(k)) { path.unshift(seen.get(k).mv); k = seen.get(k).prev; } return path[0]; }
        for (let a = 0; a < 3; a++) for (let b = 0; b < 3; b++) {
          if (a === b || !s[a].length) continue; const d = s[a][s[a].length - 1]; if (s[b].length && s[b][s[b].length - 1] < d) continue;
          const t = s.map(r => r.slice()); t[b].push(t[a].pop()); const k = key(t); if (!seen.has(k)) { seen.set(k, { prev: key(s), mv: [a, b] }); q.push(t); }
        }
      }
      return null;
    }
    api.plan(() => { const m = bestMove(); return m ? rodEls[held == null ? m[0] : m[1]] : null; });
    tools.querySelector('.hint').onclick = () => { const m = bestMove(); if (m) { held = null; draw(m); api.say('Move a disc from the glowing pole to the other glowing pole.', 'Chuyển một đĩa từ cột sáng này sang cột sáng kia nhé.'); } };
    api.say(`Move all the discs to the flag. A big disc can never sit on a small one!`, `Chuyển hết đĩa sang cột có cờ. Đĩa to không được đặt lên đĩa nhỏ nhé!`);
    draw();
    for (;;) {
      const r = await tapOne(rodEls, api); if (!r || api.closed) return;
      const i = (r as HTMLButtonElement & { _v: number })._v;
      if (held == null) { if (rods[i].length) { held = i; api.sfx.tap(); } else api.wrong(r, 'That pole is empty.', 'Cột này trống rồi.'); }
      else if (held === i) { held = null; }
      else {
        const d = rods[held][rods[held].length - 1], top = rods[i][rods[i].length - 1];
        if (top != null && top < d) { api.wrong(r, 'Oops, too big! Big discs go under small ones.', 'Ôi, đĩa to quá! Đĩa to phải ở dưới đĩa nhỏ.'); held = null; }
        else { rods[i].push(rods[held].pop()); held = null; moves++; api.sfx.pop(moves); }
      }
      draw();
      if (rods[2].length === n) break;
    }
    const best = Math.pow(2, n) - 1;
    if (moves === best) api.say(`Perfect! Only ${moves} moves, the smartest way!`, `Hoàn hảo! Chỉ ${moves} bước, cách thông minh nhất!`);
    await wait(1800); return api.win();
  }
});

// ---------- Robot planner: build the whole plan first, then press Go ----------
const DIRS = { up: [0, -1, '⬆️'], down: [0, 1, '⬇️'], left: [-1, 0, '⬅️'], right: [1, 0, '➡️'] };
// A legal path becomes ordinary arrow-button taps; it never moves the character or awards a win itself.
function routeTo(N, start, target, canStep) {
  const queue = [[start, []]], seen = new Set([start.join()]);
  for (let at = 0; at < queue.length; at++) {
    const [p, steps] = queue[at];
    if (p[0] === target[0] && p[1] === target[1]) return steps;
    for (const [key, [dx, dy]] of Object.entries(DIRS)) {
      const x = p[0] + dx, y = p[1] + dy, id = x + ',' + y;
      if (x < 0 || y < 0 || x >= N || y >= N || seen.has(id) || !canStep(p, key, x, y)) continue;
      seen.add(id); queue.push([[x, y], steps.concat(key)]);
    }
  }
  return null;
}
function bfs(N, rocks, s, t) {
  const q = [[s, 0]], seen = new Set([s.join()]);
  while (q.length) { const [[x, y], d] = q.shift(); if (x === t[0] && y === t[1]) return d;
    for (const k in DIRS) { const nx = x + DIRS[k][0], ny = y + DIRS[k][1]; const id = nx + ',' + ny; if (nx < 0 || ny < 0 || nx >= N || ny >= N || rocks.has(id) || seen.has(id)) continue; seen.add(id); q.push([[nx, ny], d + 1]); } }
  return -1;
}
register({
  id: 'robot', icon: '🤖', name: () => T('Robot Planner', 'Lập Trình Rô-bốt'),
  async run(api) {
    const rounds = 3, N = api.level <= 1 ? 4 : 5;
    for (let r = 0; r < rounds; r++) {
      api.dots(rounds, r); api.stage.innerHTML = '';
      let s, t, rocks, d;
      do {
        s = [Math.floor(Math.random() * N), Math.floor(Math.random() * N)]; t = [Math.floor(Math.random() * N), Math.floor(Math.random() * N)];
        rocks = new Set(); const nr = api.level <= 1 ? 0 : Math.min(6, api.level + r);
        while (rocks.size < nr) { const k = Math.floor(Math.random() * N) + ',' + Math.floor(Math.random() * N); if (k !== s.join() && k !== t.join()) rocks.add(k); }
        d = bfs(N, rocks, s, t);
      } while (d < (api.level <= 1 ? 1 + r : 2 + r) || d > (api.level <= 1 ? 3 : 6));
      const grid = el('div', 'rgrid'); grid.style.setProperty('--n', N); api.stage.appendChild(grid);
      const cells = [];
      for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) { const c = el('div', 'rcell', rocks.has(x + ',' + y) ? '🪨' : (x === t[0] && y === t[1] ? '⭐' : '')); grid.appendChild(c); cells.push(c); }
      const bot = el('div', 'rbot', '🤖'); grid.appendChild(bot);
      const place = ([x, y]) => { bot.style.transform = `translate(${x * 100}%, ${y * 100}%)`; };
      bot.style.width = bot.style.height = (100 / N) + '%'; place(s);
      const prog = el('div', 'prog'); api.stage.appendChild(prog);
      const pad = el('div', 'rpad'); api.stage.appendChild(pad);
      const plan = [];
      const drawPlan = () => { prog.innerHTML = plan.length ? plan.map(k => `<span>${DIRS[k][2]}</span>`).join('') : `<em>${T('Tap arrows to make a plan', 'Chạm mũi tên để lập kế hoạch')}</em>`; };
      drawPlan();
      api.say(r === 0 ? 'Help the robot reach the star! Make a plan with the arrows, then press Go.' : 'Plan the path to the star!', r === 0 ? 'Giúp rô-bốt đến ngôi sao! Chọn các mũi tên để lập kế hoạch, rồi bấm Đi.' : 'Lập kế hoạch đường đến ngôi sao nào!');
      const done = await new Promise(res => {
        const arrows = {}, solution = routeTo(N, s, t, (p, key, x, y) => !rocks.has(x + ',' + y));
        ['left', 'up', 'down', 'right'].forEach(k => { const b = el('button', 'pill arrow', DIRS[k][2]); b.onclick = () => { if (plan.length < 12) { plan.push(k); api.sfx.tap(); drawPlan(); } }; arrows[k] = b; pad.appendChild(b); });
        const del = el('button', 'pill', '⌫'); del.onclick = () => { plan.pop(); drawPlan(); }; pad.appendChild(del);
        const go = el('button', 'pill go', '▶ ' + T('Go', 'Đi')); pad.appendChild(go);
        api.plan(() => {
          if (api.closed || pad.classList.contains('busy') || !solution) return null;
          if (plan.length > solution.length || plan.some((key, i) => key !== solution[i])) return del;
          return plan.length < solution.length ? arrows[solution[plan.length]] : go;
        });
        api.onCleanup(() => res(false));
        go.onclick = async () => {
          if (!plan.length) return; pad.classList.add('busy');
          let p = s.slice(), ok = true;
          for (let i = 0; i < plan.length; i++) {
            prog.children[i]?.classList.add('now');
            const [dx, dy] = DIRS[plan[i]], nx = p[0] + dx, ny = p[1] + dy;
            if (nx < 0 || ny < 0 || nx >= N || ny >= N || rocks.has(nx + ',' + ny)) { bot.classList.add('bump'); api.sfx.no(); await wait(500); bot.classList.remove('bump'); ok = false; break; }
            p = [nx, ny]; place(p); api.sfx.step(); await wait(420);
            if (api.closed) return res(false);
          }
          if (ok && p[0] === t[0] && p[1] === t[1]) { api.sfx.chime(); res(true); }
          else {
            api.say('Not quite! The robot goes back to start. Change the plan and try again.', 'Chưa đúng rồi! Rô-bốt quay về chỗ cũ. Sửa kế hoạch rồi thử lại nhé.');
            await wait(900); place(s); plan.length = 0; drawPlan(); pad.classList.remove('busy');
          }
        };
      });
      if (!done) return;
      api.praise(); await wait(1300);
    }
    api.dots(rounds, rounds); return api.win();
  }
});

// ---------- Maze ----------
function makeMaze(W, H) {
  const walls = Array.from({ length: W * H }, () => ({ n: 1, s: 1, e: 1, w: 1 })), seen = new Set(), st = [[0, 0]]; seen.add('0,0');
  while (st.length) {
    const [x, y] = st[st.length - 1];
    const nb = [[0, -1, 'n', 's'], [0, 1, 's', 'n'], [1, 0, 'e', 'w'], [-1, 0, 'w', 'e']].filter(([dx, dy]) => { const nx = x + Number(dx), ny = y + Number(dy); return nx >= 0 && ny >= 0 && nx < W && ny < H && !seen.has(nx + ',' + ny); });
    if (!nb.length) { st.pop(); continue; }
    const [dx, dy, a, b] = pick(nb), nx = x + dx, ny = y + dy;
    walls[y * W + x][a] = 0; walls[ny * W + nx][b] = 0; seen.add(nx + ',' + ny); st.push([nx, ny]);
  }
  return walls;
}
register({
  id: 'maze', icon: '🌀', name: () => T('Mountain Maze', 'Mê Cung Trên Núi'),
  async run(api) {
    const rounds = 2, maxActions = Array.from({length: rounds}, (_, r) => Math.min(8, 3 + api.level + r) ** 2 - 1).reduce((sum, n) => sum + n, 0);
    for (let r = 0; r < rounds; r++) {
      api.dots(rounds, r); api.stage.innerHTML = '';
      const N = Math.min(8, 3 + api.level + r), walls = makeMaze(N, N);
      const grid = el('div', 'maze'); grid.style.setProperty('--n', N); api.stage.appendChild(grid);
      const cells = walls.map((w, i) => { const c = el('div', 'mcell'); ['n', 's', 'e', 'w'].forEach(k => w[k] && c.classList.add('w' + k)); grid.appendChild(c); return c; });
      const duck = api.theme === 'duck';
      cells[N * N - 1].textContent = duck ? '🦆' : '🍉';
      let p = [0, 0]; const me = el('div', 'mme', duck ? '🐥' : api.two ? '👫' : '🧒'); me.style.width = me.style.height = (100 / N) + '%'; grid.appendChild(me);
      const place = () => { me.style.transform = `translate(${p[0] * 100}%, ${p[1] * 100}%)`; cells[p[1] * N + p[0]].classList.add('trail'); };
      place();
      if (duck) api.say('Help the duckling find its mummy!', 'Giúp vịt con tìm vịt mẹ nào!'); else api.say('Find the way to the watermelon!', 'Tìm đường đến quả dưa hấu nào!');
      const pad = el('div', 'rpad'); api.stage.appendChild(pad);
      await new Promise<void>(res => {
        const move = k => {
          const w = walls[p[1] * N + p[0]], d = { up: ['n', 0, -1], down: ['s', 0, 1], left: ['w', -1, 0], right: ['e', 1, 0] }[k];
          if (w[d[0]]) { me.classList.remove('bump'); void me.offsetWidth; me.classList.add('bump'); api.sfx.no(); return; }
          p = [p[0] + d[1], p[1] + d[2]]; place(); api.sfx.step();
          if (p[0] === N - 1 && p[1] === N - 1) { cleanup(); res(); }
        };
        const arrows = {}, wallOf = { up: 'n', down: 's', left: 'w', right: 'e' };
        ['left', 'up', 'down', 'right'].forEach(k => { const b = el('button', 'pill arrow', DIRS[k][2]); b.onclick = () => move(k); arrows[k] = b; pad.appendChild(b); });
        api.plan(() => {
          if (api.closed) return null;
          const route = routeTo(N, p, [N - 1, N - 1], (from, key) => !walls[from[1] * N + from[0]][wallOf[key]]);
          return route?.length ? arrows[route[0]] : null;
        }, { maxActions });
        // Tap a neighbouring square or swipe to move too.
        cells.forEach((c, i) => c.onclick = () => { const x = i % N, y = Math.floor(i / N), dx = x - p[0], dy = y - p[1]; if (Math.abs(dx) + Math.abs(dy) === 1) move(dx === 1 ? 'right' : dx === -1 ? 'left' : dy === 1 ? 'down' : 'up'); });
        const key = e => { const k = { ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right' }[e.key]; if (k) { e.preventDefault(); move(k); } };
        window.addEventListener('keydown', key); const cleanup = () => window.removeEventListener('keydown', key); api.onCleanup(() => { cleanup(); res(); });
      });
      if (api.closed) return;
      api.sfx.chime(); api.praise(); await wait(1300);
    }
    api.dots(rounds, rounds); return api.win();
  }
});

// ---------- Bịt mắt bắt dê: Blindfold Goat ----------
const ARROW = (dx, dy) => ({ '0,-1': '⬆️', '0,1': '⬇️', '-1,0': '⬅️', '1,0': '➡️', '-1,-1': '↖️', '1,-1': '↗️', '-1,1': '↙️', '1,1': '↘️' }[Math.sign(dx) + ',' + Math.sign(dy)]);
register({
  id: 'goat', icon: '🐐', name: () => T('Blindfold Goat', 'Bịt Mắt Bắt Dê'),
  async run(api) {
    const rounds = 3, N = api.level <= 1 ? 3 : api.level === 2 ? 4 : 5;
    api.say('A Vietnamese playground game! The goat is hiding in the hay. Each wrong haystack shows hoof prints pointing to the goat.', 'Trò chơi dân gian Bịt mắt bắt dê! Dê đang trốn trong đống rơm. Mỗi đống rơm sai sẽ có dấu chân chỉ về phía con dê.');
    await wait(400);
    for (let r = 0; r < rounds; r++) {
      api.dots(rounds, r); api.stage.innerHTML = '';
      const gx = Math.floor(Math.random() * N), gy = Math.floor(Math.random() * N);
      const grid = el('div', 'goat-grid'); grid.style.setProperty('--n', N); api.stage.appendChild(grid);
      const hay = Array.from({ length: N * N }, (_, i) => { const b = el('button', 'hay', '🌾'); b._x = i % N; b._y = Math.floor(i / N); grid.appendChild(b); return b; });
      let tries = 0;
      if (r > 0) api.show('Find the goat! Follow the hoof prints.', 'Tìm con dê! Đi theo dấu chân nhé.');
      for (;;) {
        const b = await tapOne(hay.filter(h => !h.disabled)); if (api.closed) return;
        tries++; b.disabled = true;
        if (b._x === gx && b._y === gy) { b.innerHTML = '🐐'; b.classList.add('right'); api.sfx.chime(); api.say(tries <= 2 ? 'Baa! You found me so fast!' : 'Baa! You found me!', tries <= 2 ? 'Be be! Con tìm ra nhanh quá!' : 'Be be! Con tìm thấy tớ rồi!'); break; }
        const near = Math.max(Math.abs(b._x - gx), Math.abs(b._y - gy)) === 1;
        b.innerHTML = `<span class="hoof">🐾</span><span class="dir">${ARROW(gx - b._x, gy - b._y)}</span>`; b.classList.add('miss');
        api.sfx.pop(tries);
        if (near) api.say('Baa! Very close!', 'Be be! Gần lắm rồi!'); else if (tries === 1) api.say('Follow the arrow!', 'Đi theo mũi tên nhé!');
      }
      await wait(1600);
    }
    api.dots(rounds, rounds); return api.win();
  }
});

// ---------- Bịt Mắt Bắt Bạn: children taking turns in a blindfold/tag circle ----------
// (owner, 30 Oct 2026 AEDT: "keep the old blindfold goat; the new one you can change name") the circle game has its own
// id and name; Bịt Mắt Bắt Dê is the haystack game again
register({
  id: 'blindtag', icon: 'kid:blindfold', name: () => T('Blindfold Tag', 'Bịt Mắt Bắt Bạn'),
  async run(api) { return (await import('./goat.js')).runGoat(api); }
});
