// More games, one or two for each shelf of the Games hub:
//   Learning: More or Less? · Days of the Week · Body Parts
//   Folk: Oẳn Tù Tì (rock, paper, scissors, as Vietnamese children play it)
//   Farm: Egg Hunt (count the eggs into the basket)
//   Puzzles: Picture Sudoku (each picture once in every row and column)
// Same gentle rules as every game: "try again" until it's right, and little ones can't lose.
import { rpsWinners } from '../netgames.js';
import { register, untilRight, choiceButtons, tapOne } from './frame.js';
import { T, numWord } from '../i18n.js';
import { shuffle, pick, el, wait, esc } from '../util.js';

const THINGS = ['🍎', '⭐', '🐟', '🌸', '🎈', '🐞', '🍓', '🚗'];

// ---------- More or Less? ----------
register({
  id: 'moreless', icon: '⚖️', name: () => T('More or Less?', 'Nhiều Hơn hay Ít Hơn?'),
  async run(api) {
    const rounds = 5, max = [5, 6, 8, 10, 12][api.level - 1];
    for (let r = 0; r < rounds; r++) {
      api.dots(rounds, r); api.stage.innerHTML = '';
      let a = 1 + Math.floor(Math.random() * max), b = 1 + Math.floor(Math.random() * max); if (a === b) b = a === max ? a - 1 : a + 1;
      const askMore = api.level <= 1 || Math.random() < .55, ta = pick(THINGS), tb = pick(THINGS.filter(t => t !== ta));
      api.say(askMore ? 'Which side has MORE?' : 'Which side has LESS?', askMore ? 'Bên nào NHIỀU hơn?' : 'Bên nào ÍT hơn?');
      const btns = choiceButtons(api, [[a, ta], [b, tb]], ([n, t]) => `<span class="ml-grp">${Array.from({ length: n }, () => `<i>${t}</i>`).join('')}</span>`, 'choice ml');
      const want = askMore ? Math.max(a, b) : Math.min(a, b);
      const ok = await untilRight(api, btns, e => e._v[0] === want); if (!ok) return;
      api.say(`${want}! That side has ${askMore ? 'more' : 'less'}.`, `${numWord(want)}! Bên đó ${askMore ? 'nhiều hơn' : 'ít hơn'}.`); await wait(1300);
    }
    api.dots(rounds, rounds); return api.win();
  }
});

// ---------- Days of the Week ----------
const DAYS = [['Monday', 'Thứ Hai'], ['Tuesday', 'Thứ Ba'], ['Wednesday', 'Thứ Tư'], ['Thursday', 'Thứ Năm'], ['Friday', 'Thứ Sáu'], ['Saturday', 'Thứ Bảy'], ['Sunday', 'Chủ Nhật']];
register({
  id: 'days', icon: '📅', name: () => T('Days of the Week', 'Các Ngày Trong Tuần'),
  async run(api) {
    const rounds = 5;
    api.say('Seven days make a week. Which day comes next?', 'Bảy ngày là một tuần. Ngày nào đến tiếp theo?');
    for (let r = 0; r < rounds; r++) {
      api.dots(rounds, r); api.stage.innerHTML = '';
      const k = Math.floor(Math.random() * 7), nxt = (k + 1) % 7, before = api.level >= 3 && r % 2;
      const want = before ? (k + 6) % 7 : nxt;
      const strip = el('div', 'daystrip', DAYS.map((d, i) => `<span class="${i === k ? 'on' : ''}">${T(d[0], d[1])}</span>`).join(''));
      api.stage.appendChild(strip);
      if (before) api.say(`Today is ${DAYS[k][0]}. What was yesterday?`, `Hôm nay là ${DAYS[k][1]}. Hôm qua là thứ mấy?`);
      else api.say(`Today is ${DAYS[k][0]}. What is tomorrow?`, `Hôm nay là ${DAYS[k][1]}. Ngày mai là thứ mấy?`);
      const opts = shuffle([want, ...shuffle([0, 1, 2, 3, 4, 5, 6].filter(i => i !== want && i !== k)).slice(0, 2)]);
      // (tester's notes, 12 Oct) whole day names, never "THai" or "Mon", in cards that fit them
      const btns = choiceButtons(api, opts, i => `<b>${T(DAYS[i as number][0], DAYS[i as number][1])}</b>`, 'choice big day');
      const ok = await untilRight(api, btns, e => e._v === want); if (!ok) return;
      api.say(`${DAYS[want][0]}!`, `${DAYS[want][1]}!`); await wait(1200);
    }
    api.dots(rounds, rounds); return api.win();
  }
});

// ---------- Body Parts ----------
const BODY = [['👁️', 'eyes', 'mắt'], ['👃', 'nose', 'mũi'], ['👂', 'ears', 'tai'], ['👄', 'mouth', 'miệng'], ['✋', 'hand', 'bàn tay'], ['🦶', 'foot', 'bàn chân'], ['🦵', 'leg', 'chân'], ['💪', 'arm', 'cánh tay'], ['🦷', 'teeth', 'răng'], ['💇', 'hair', 'tóc']];
const USE = { eyes: ['see', 'nhìn'], nose: ['smell', 'ngửi'], ears: ['hear', 'nghe'], mouth: ['eat and talk', 'ăn và nói'], hand: ['hold things', 'cầm đồ vật'], foot: ['walk', 'đi bộ'], leg: ['jump', 'nhảy'], arm: ['hug', 'ôm'], teeth: ['chew', 'nhai'], hair: ['brush', 'chải'] };
register({
  id: 'bodyparts', icon: '🧒', name: () => T('My Body', 'Cơ Thể Của Em'),
  async run(api) {
    const rounds = 5, pool = shuffle(BODY).slice(0, rounds);
    for (let r = 0; r < rounds; r++) {
      api.dots(rounds, r); api.stage.innerHTML = '';
      const [, en, vi] = pool[r], useIt = api.level >= 2 && r % 2;
      if (useIt) api.say(`What do we use to ${USE[en][0]}?`, `Mình dùng gì để ${USE[en][1]}?`); else api.say(`Where are the ${en}? Tap them!`, `${vi[0].toUpperCase() + vi.slice(1)} đâu? Chạm vào nhé!`);
      const opts = shuffle([pool[r], ...shuffle(BODY.filter(b => b !== pool[r])).slice(0, api.little ? 2 : 3)]);
      const btns = choiceButtons(api, opts, ([i, e, v]) => `<span class="big">${i}</span><small>${T(e, v)}</small>`);
      const ok = await untilRight(api, btns, e => e._v === pool[r]); if (!ok) return;
      api.say(useIt ? `Yes! We ${USE[en][0]} with our ${en}.` : `${en[0].toUpperCase() + en.slice(1)}!`, useIt ? `Đúng rồi! Mình ${USE[en][1]} bằng ${vi}.` : `${vi[0].toUpperCase() + vi.slice(1)}!`); await wait(1300);
    }
    api.dots(rounds, rounds); return api.win();
  }
});

// ---------- Oẳn Tù Tì (rock, paper, scissors) ----------
const RPS = [['✊', 'Rock', 'Búa'], ['✋', 'Paper', 'Bao'], ['✌️', 'Scissors', 'Kéo']]; // búa > kéo, kéo > bao, bao > búa
register({
  id: 'oantuti', online: true, icon: '✌️', origin: 'vn', name: () => T('Oẳn Tù Tì', 'Oẳn Tù Tì'),
  async run(api) {
    if (api.online) return rpsOnline(api);
    const need = api.little ? 2 : 3; let wins = 0, round = 0;
    api.say('Oẳn tù tì, ra cái gì, ra cái này! Rock beats scissors, scissors beat paper, paper beats rock.', 'Oẳn tù tì, ra cái gì, ra cái này! Búa thắng kéo, kéo thắng bao, bao thắng búa.');
    while (wins < need && !api.closed) {
      api.dots(need, wins); api.stage.innerHTML = '';
      const face = el('div', 'rps-face', '<span class="you">❔</span><b>VS</b><span class="me">🤜</span>'); api.stage.appendChild(face);
      const btns = choiceButtons(api, RPS, ([i, e, v]) => `<span class="big">${i}</span><small>${T(e, v)}</small>`);
      const b = await tapOne(btns); if (api.closed) return;
      const you = RPS.indexOf(b._v);
      // little ones (and every few rounds) the friend "happens" to lose
      let me = Math.floor(Math.random() * 3); if (api.little || round % 3 === 2) me = (you + 2) % 3;
      round++;
      face.innerHTML = `<span class="you">${RPS[you][0]}</span><b>VS</b><span class="me">${RPS[me][0]}</span>`; api.sfx.pop(3);
      await wait(500);
      if (you === me) { api.say('The same! Again: oẳn tù tì!', 'Hòa rồi! Lại nào: oẳn tù tì!'); }
      else if ((you + 2) % 3 === me) { wins++; api.right(face); api.say(`${RPS[you][1]} beats ${RPS[me][1]}! You win!`, `${RPS[you][2]} thắng ${RPS[me][2]}! Con thắng!`); }
      else api.wrong(face, `${RPS[me][1]} beats ${RPS[you][1]}. Try again!`, `${RPS[me][2]} thắng ${RPS[you][2]}. Thử lại nhé!`);
      await wait(1500);
    }
    if (api.closed) return; api.dots(need, need);
    return api.win({ title: T('Oẳn tù tì champion!', 'Vua oẳn tù tì!') });
  }
});

// Oẳn tù tì with friends online (round G): 2 to 6 children, each on their own device; everyone picks in secret, then
// all the hands are shown together; the winning shape scores a point for each who showed it; first to 3 points wins
async function rpsOnline(api) {
  const O = api.online, need = 3, score = O.names.map(() => 0);
  api.say('Oẳn tù tì with your friends! Everyone picks at the same time.', 'Oẳn tù tì với các bạn! Mọi người cùng ra một lúc nhé.');
  for (let n = 0; !api.closed; n++) {
    api.dots(need, Math.max(...score)); api.stage.innerHTML = '';
    const board = el('div', 'rps-room', O.names.map((nm, s) => `<div class="rps-p ${s === O.mine ? 'me' : ''}"><span class="h">❔</span><b>${esc(nm)}</b><small>${score[s]}</small></div>`).join(''));
    api.stage.appendChild(board);
    const btns = choiceButtons(api, RPS, ([i, e, v]) => `<span class="big">${i}</span><small>${T(e, v)}</small>`);
    const b = await tapOne(btns); if (api.closed) return;
    const mine = RPS.indexOf(b._v); O.move(n, mine); btns.forEach(x => x.disabled = true);
    board.children[O.mine].querySelector('.h').textContent = '✅';
    api.show('Waiting for your friends…', 'Chờ các bạn…');
    const hands = await O.all(n); if (api.closed) return;
    if (hands.filter(h => h != null).length < 2) { api.say('Your friends left the game.', 'Các bạn đã rời trò chơi.'); await wait(1500); return api.win({ title: T('Good game!', 'Chơi vui lắm!') }); }
    hands.forEach((h, s) => { board.children[s].querySelector('.h').textContent = h == null ? '👋' : RPS[h][0]; }); api.sfx.pop(3);
    const winners = rpsWinners(hands); winners.forEach(s => score[s]++);
    await wait(500);
    if (!winners.length) api.say('A draw! Again: oẳn tù tì!', 'Hòa rồi! Lại nào: oẳn tù tì!');
    else if (winners.includes(O.mine)) { api.right(board.children[O.mine]); api.say(`${RPS[hands[winners[0]]][1]} wins!`, `${RPS[hands[winners[0]]][2]} thắng!`); }
    else api.say(`${RPS[hands[winners[0]]][1]} wins this time!`, `Lần này ${RPS[hands[winners[0]]][2]} thắng!`);
    winners.forEach(s => board.children[s].classList.add('won')); board.querySelectorAll('small').forEach((e, s) => { e.textContent = score[s]; });
    await wait(1800);
    const best = Math.max(...score);
    if (best >= need) { const who = O.names.filter((_, s) => score[s] === best).join(' & '); api.dots(need, need); return api.win({ title: score[O.mine] === best ? T('Oẳn tù tì champion!', 'Vua oẳn tù tì!') : T(`${who} won! Good game!`, `${who} thắng! Chơi vui lắm!`) }); }
  }
}

// ---------- Egg Hunt (farm) ----------
register({
  id: 'eggs', icon: '🥚', name: () => T('Egg Hunt', 'Nhặt Trứng'),
  async run(api) {
    const rounds = 3;
    for (let r = 0; r < rounds; r++) {
      api.dots(rounds, r); api.stage.innerHTML = '';
      const n = (api.little ? 2 : 3) + r + Math.floor(Math.random() * (api.level + 1)), hay = el('div', 'egghay');
      const spots = shuffle(Array.from({ length: 12 }, (_, i) => i)).slice(0, n);
      for (let i = 0; i < 12; i++) { const s = el('button', 'eggspot', spots.includes(i) ? '🥚' : pick(['🌾', '🌾', '🪺', '🌿'])); s._egg = spots.includes(i); hay.appendChild(s); }
      const basket = el('div', 'eggbasket', `🧺 <b>0</b>`); api.stage.append(hay, basket);
      api.say(`The hens laid eggs in the hay! Find all ${n} eggs.`, `Gà mái đẻ trứng trong rơm! Tìm đủ ${numWord(n)} quả trứng nhé.`);
      let got = 0;
      await new Promise<void>(res => hay.querySelectorAll('.eggspot').forEach(s => s.onclick = () => {
        if (s._egg) { s._egg = false; s.textContent = '✨'; got++; basket.querySelector('b').textContent = got; api.right(s); api.say(`${got}`, numWord(got)); if (got === n) res(); }
        else { api.sfx.tap(); s.classList.add('wiggle'); setTimeout(() => s.classList.remove('wiggle'), 400); }
      }));
      if (api.closed) return; api.say(`${n} eggs! Well done!`, `${numWord(n)} quả trứng! Giỏi quá!`); await wait(1300);
    }
    api.dots(rounds, rounds); return api.win({ title: T('A basket full of eggs!', 'Đầy một giỏ trứng!') });
  }
});

// ---------- Picture Sudoku (4 × 4, or 3 × 3 for the youngest) ----------
const PICS = ['🍎', '🐟', '⭐', '🌸'];
function latin(n) { // a random latin square: each picture once per row and column
  const base = Array.from({ length: n }, (_, r) => Array.from({ length: n }, (_, c) => (r + c) % n));
  const rows = shuffle(base), perm = shuffle(Array.from({ length: n }, (_, i) => i)), cols = shuffle(Array.from({ length: n }, (_, i) => i));
  return rows.map(row => cols.map(c => perm[row[c]]));
}
register({
  id: 'sudoku', icon: '🧩', name: () => T('Picture Sudoku', 'Sudoku Hình'),
  async run(api) {
    const rounds = 2, n = api.little || api.level <= 1 ? 3 : 4, holes = n === 3 ? 3 : [4, 5, 6, 7, 8][api.level - 1];
    api.say('Each picture once in every row and every column. Tap an empty square, then the picture that fits.', 'Mỗi hình chỉ một lần trong mỗi hàng và mỗi cột. Chạm ô trống, rồi chọn hình hợp.');
    for (let r = 0; r < rounds; r++) {
      api.dots(rounds, r); api.stage.innerHTML = '';
      const sol = latin(n), empty = new Set(shuffle(Array.from({ length: n * n }, (_, i) => i)).slice(0, holes));
      const grid = el('div', 'sdk'); grid.style.setProperty('--n', n);
      const cells = Array.from({ length: n * n }, (_, i) => { const c = el('button', 'sdk-c' + (empty.has(i) ? ' hole' : ''), empty.has(i) ? '' : PICS[sol[Math.floor(i / n)][i % n]]); grid.appendChild(c); return c; });
      api.stage.appendChild(grid);
      let left = holes;
      while (left > 0 && !api.closed) {
        const holeBtns = cells.filter((c, i) => empty.has(i)); holeBtns.forEach(c => c.classList.add('pick'));
        const c = await tapOne(holeBtns); if (api.closed) return; holeBtns.forEach(h => h.classList.remove('pick')); c.classList.add('sel');
        const i = cells.indexOf(c), want = sol[Math.floor(i / n)][i % n];
        const row = el('div', 'choices'); api.stage.appendChild(row);
        const opts = PICS.slice(0, n).map((p, k) => { const b = el('button', 'choice', `<span class="big">${p}</span>`); b._v = k; row.appendChild(b); return b; });
        const ok = await untilRight(api, opts, e => e._v === want); row.remove(); c.classList.remove('sel'); if (!ok) return;
        c.textContent = PICS[want]; empty.delete(i); c.classList.remove('hole'); left--;
      }
      if (api.closed) return; api.say('The whole square is full!', 'Cả bảng đã đầy rồi!'); await wait(1300);
    }
    api.dots(rounds, rounds); return api.win();
  }
});

// ---------- Ném Lon (throw a sandal at a stack of cans), as children play it in the south ----------
register({
  id: 'nemlon', icon: '🩴', origin: 'vn', name: () => T('Can Knock-Down', 'Ném Lon'),
  async run(api) {
    const rounds = 3, throws = api.little ? 99 : [6, 5, 5, 4, 4][api.level - 1];
    api.say('Stack the cans, then throw your sandal! Tap THROW when the arrow points at the cans.', 'Chồng lon lên, rồi ném dép! Bấm NÉM khi mũi tên chỉ đúng chồng lon nhé.');
    for (let r = 0; r < rounds; r++) {
      api.dots(rounds, r); api.stage.innerHTML = '';
      const n = [3, 6, 6][r], yard = el('div', 'nl-yard'), stack = el('div', 'nl-stack'), aim = el('div', 'nl-aim', '⬆️'), sandal = el('div', 'nl-sandal', '🩴');
      const rows = n === 3 ? [1, 2] : [1, 2, 3]; let k = 0;
      rows.forEach(c => { const row = el('div', 'nl-row'); for (let i = 0; i < c; i++) { row.appendChild(el('i', 'nl-can', '🥫')); k++; } stack.appendChild(row); });
      const btn = el('button', 'sn-btn', T('THROW!', 'NÉM!'));
      yard.append(stack, aim, sandal); api.stage.append(yard, btn);
      const target = .25 + Math.random() * .5; stack.style.left = target * 100 + '%';
      let x = 0, dir = 1, raf = 0, left = n, used = 0, speed = api.little ? .35 : .45 + api.level * .12, last = performance.now();
      const loop = now => { const dt = (now - last) / 1000; last = now; x += dir * speed * dt; if (x > 1) { x = 1; dir = -1; } if (x < 0) { x = 0; dir = 1; } aim.style.left = x * 100 + '%'; raf = requestAnimationFrame(loop); };
      raf = requestAnimationFrame(loop); api.onCleanup(() => cancelAnimationFrame(raf));
      await new Promise<void>(res => {
        btn.onclick = async () => {
          if (btn.disabled) return; btn.disabled = true; used++;
          sandal.style.transition = 'none'; sandal.style.left = x * 100 + '%'; sandal.style.bottom = '0%'; void sandal.offsetWidth;
          sandal.style.transition = 'bottom .45s ease-out, transform .45s'; sandal.style.bottom = '62%'; sandal.style.transform = 'rotate(540deg)'; api.sfx.whoosh && api.sfx.whoosh();
          await wait(460);
          const near = Math.abs(x - target), hitW = api.little ? .2 : [.16, .13, .11, .09, .08][api.level - 1];
          if (near < hitW) {
            const cans = [...stack.querySelectorAll('.nl-can:not(.down)')], hit = near < hitW / 2 ? cans.length : Math.ceil(cans.length / 2);
            cans.slice(-hit).forEach((c, i) => setTimeout(() => { c.classList.add('down'); c.style.setProperty('--dx', ((Math.random() - .5) * 160) + 'px'); api.sfx.pop(i); }, i * 80));
            left -= hit; api.right(stack); api.say(left > 0 ? `Crash! ${left} left.` : 'All down!', left > 0 ? `Loảng xoảng! Còn ${numWord(left)} lon.` : 'Đổ hết rồi!');
          } else api.wrong(null, 'Missed! Watch the arrow.', 'Trượt rồi! Nhìn mũi tên nhé.');
          await wait(700); sandal.style.transition = 'none'; sandal.style.bottom = '0%'; sandal.style.transform = '';
          if (left <= 0) { cancelAnimationFrame(raf); res(); return; }
          if (used >= throws) { api.say('Out of throws: let’s stack them again!', 'Hết lượt ném: mình chồng lon lại nhé!'); cancelAnimationFrame(raf); r--; res(); return; }
          btn.disabled = false;
        };
      });
      if (api.closed) return; await wait(900);
    }
    api.dots(rounds, rounds); return api.win({ title: T('Can champion!', 'Vua ném lon!') });
  }
});

// Family Quiz has a separate lazy implementation so an invited guest needs no local questions.
