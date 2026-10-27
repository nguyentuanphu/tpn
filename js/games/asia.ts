// Games from China Town and India Village:
// First Words (Chinese and Hindi) · Tangram shapes (七巧板) · Snakes and Ladders (Moksha Patam, from
// India) · Rangoli mirror patterns. All are gentle thinking games: listening, shapes, counting, symmetry.
import { register, tapOne } from './frame.js';
import { T, numWord } from '../i18n.js';
import { settings } from '../state.js';
import { sayIn } from '../voice.js';
import { el, wait, pick, shuffle } from '../util.js';
const rand = (a, b) => a + Math.floor(Math.random() * (b - a + 1));   // a whole number from a to b
import {playSnakes} from './snakes.js';
import { LEARN } from '../words2.js';

// ---------- First words: hear a Chinese or Hindi word, pick its picture ----------
register({
  id: 'firstwords', icon: '🌏', origin: 'both', name: () => T('First Words: Chinese and Hindi', 'Từ đầu tiên: tiếng Trung và tiếng Hindi'),
  async run(api) {
    const rounds = api.little ? 5 : 8;
    const langs = settings.learnLang && LEARN[settings.learnLang] ? [settings.learnLang] : ['zh', 'hi'];
    api.say('Friends from China and India are teaching us words. Listen, then tap the picture!', 'Các bạn Trung Quốc và Ấn Độ dạy mình từ mới. Nghe rồi chạm vào hình nhé!');
    for (let r = 0; r < rounds; r++) {
      api.dots(rounds, r); api.stage.innerHTML = '';
      const L = LEARN[langs[r % langs.length]], w = pick(L.words.filter(x => !/️⃣/.test(x[0]) || !api.little));
      const others = shuffle(L.words.filter(x => x !== w && x[0] !== w[0])).slice(0, api.little ? 1 : 2), opts = shuffle([w, ...others]);
      api.stage.appendChild(el('div', 'wq', `<div class="wq-flag">${L.flag}</div><div class="wq-word fw-native">${w[3]}</div><div class="wq-ex">“${w[4]}”</div><button class="btn fw-hear">🔊 ${T('Hear it again', 'Nghe lại')}</button>`));
      const hear = () => sayIn(langs[r % langs.length], w[3]);
      api.stage.querySelector('.fw-hear').onclick = hear;
      api.say(`In ${L.name.en}, how do you say this word? Listen!`, `Trong ${L.name.vi}, từ này là gì? Nghe nhé!`); await wait(1600); hear();
      const row = el('div', 'choices'); const bs = opts.map(o => { const b = el('button', 'choice', o[0]); b._ok = o === w; row.appendChild(b); return b; }); api.stage.appendChild(row);
      for (;;) { const b = await tapOne<HTMLButtonElement & { _ok?: boolean; _c?: string; _o?: number; _v?: number }>(bs); if (api.closed) return; if (b._ok) { api.right(b); api.say(`Yes! ${w[4]} means ${w[1]}.`, `Đúng rồi! ${w[4]} nghĩa là ${w[2]}.`); break; } api.wrong(b); }
      await wait(2400);
    }
    api.dots(rounds, rounds); return api.win({ title: T('You can say hello to the whole world!', 'Con chào được cả thế giới rồi!') });
  }
});

// ---------- Tangram: which shape fills the gap? ----------
// Pictures are made of tangram-style pieces on a 100×100 grid; one piece is missing.
const PUZZLES = [
  { en: 'a house', vi: 'ngôi nhà', pieces: [[[20, 50, 80, 50, 80, 95, 20, 95], '#f6c85a'], [[15, 50, 50, 15, 85, 50], '#e8433a']] },
  { en: 'a fish', vi: 'con cá', pieces: [[[20, 50, 50, 25, 50, 75], '#3cc7e8'], [[50, 25, 75, 50, 50, 75], '#2d84d4'], [[75, 50, 95, 30, 95, 70], '#ff9f43']] },
  { en: 'a boat', vi: 'chiếc thuyền', pieces: [[[10, 65, 90, 65, 75, 85, 25, 85], '#a0602a'], [[50, 15, 50, 60, 20, 60], '#ffffff'], [[52, 25, 80, 60, 52, 60], '#ff7eb8']] },
  { en: 'a tree', vi: 'cái cây', pieces: [[[20, 55, 50, 15, 80, 55], '#2fb04f'], [[42, 55, 58, 55, 58, 90, 42, 90], '#8a5a3b']] },
  { en: 'a rocket', vi: 'tên lửa', pieces: [[[38, 35, 62, 35, 62, 80, 38, 80], '#e8e8f0'], [[38, 35, 50, 10, 62, 35], '#e8433a'], [[38, 60, 25, 85, 38, 80], '#ffb020'], [[62, 60, 75, 85, 62, 80], '#ffb020']] },
  { en: 'a cat', vi: 'con mèo', pieces: [[[30, 45, 70, 45, 70, 85, 30, 85], '#ff9f43'], [[30, 45, 30, 25, 45, 45], '#ff9f43'], [[70, 45, 70, 25, 55, 45], '#ff9f43'], [[70, 70, 92, 55, 92, 62, 70, 80], '#e88a33']] }
];
const svgPoly = (pts, fill, extra = '') => `<polygon points="${pts.join(' ')}" fill="${fill}" stroke="#2b2238" ${/stroke-width/.test(extra) ? '' : 'stroke-width="2"'} stroke-linejoin="round" ${extra}/>`;
// the piece on its own, centred in its own box
function pieceSVG(pts, fill, rot = 0, flip = false) {
  const xs = pts.filter((_, i) => i % 2 === 0), ys = pts.filter((_, i) => i % 2 === 1), cx = (Math.min(...xs) + Math.max(...xs)) / 2, cy = (Math.min(...ys) + Math.max(...ys)) / 2;
  const k = 76 / Math.max(Math.max(...xs) - Math.min(...xs), Math.max(...ys) - Math.min(...ys), 1);   // fill the button
  return `<svg viewBox="0 0 100 100" width="100%" height="100%"><g transform="translate(50 50) rotate(${rot}) scale(${(flip ? -1 : 1) * k} ${k}) translate(${-cx} ${-cy})">${svgPoly(pts, fill, `stroke-width="${(2 / k).toFixed(2)}"`)}</g></svg>`;
}
register({
  id: 'tangram', icon: '🧩', origin: 'cn', name: () => T('Tangram Shapes', 'Xếp hình Tangram'),
  async run(api) {
    const rounds = api.little ? 4 : 6;
    api.say('In China, children make pictures from shapes. One shape is missing. Which one fits?', 'Ở Trung Quốc, các bạn nhỏ xếp hình từ những mảnh ghép. Thiếu một mảnh rồi. Mảnh nào vừa?');
    const order = shuffle(PUZZLES.slice());
    for (let r = 0; r < rounds; r++) {
      api.dots(rounds, r); api.stage.innerHTML = '';
      const pz = order[r % order.length], miss = rand(0, pz.pieces.length - 1), [mp, mc] = pz.pieces[miss];
      const pic = pz.pieces.map(([p, c], i) => i === miss ? svgPoly(p, '#ffffff', 'stroke-dasharray="5 4" fill-opacity=".6"') : svgPoly(p, c)).join('');
      api.stage.appendChild(el('div', 'tg-board', `<svg viewBox="0 0 100 100" width="100%" height="100%">${pic}</svg><div class="tg-what">${T('Make ' + pz.en + '!', 'Xếp ' + pz.vi + '!')}</div>`));
      // choices: the right piece (maybe turned, for big kids), and other shapes that don't fit
      const turn = api.little ? 0 : pick([0, 90, 180]);
      const wrongs = shuffle(PUZZLES.flatMap(q => q.pieces.map(x => x[0])).filter(p => p.length !== mp.length || JSON.stringify(p) !== JSON.stringify(mp)).filter(p => p.length !== mp.length)).slice(0, api.little ? 1 : 2);
      if (wrongs.length < (api.little ? 1 : 2)) wrongs.push(mp.map((v, i) => i % 2 ? v * .6 + 20 : v));
      const opts = shuffle([{ pts: mp, ok: true, rot: turn }, ...wrongs.map(p => ({ pts: p, ok: false, rot: pick([0, 90]) }))]);
      const row = el('div', 'choices tg-choices'); const bs = opts.map(o => { const b = el('button', 'choice tg-piece', pieceSVG(o.pts, mc, o.rot)); b._ok = o.ok; row.appendChild(b); return b; }); api.stage.appendChild(row);
      if (turn) api.say('Tip: you can imagine turning the shape around!', 'Mẹo: con thử tưởng tượng xoay mảnh ghép xem!');
      for (;;) { const b = await tapOne<HTMLButtonElement & { _ok?: boolean; _c?: string; _o?: number; _v?: number }>(bs); if (api.closed) return; if (b._ok) { api.right(b); break; } api.wrong(b, 'Look at the corners and the sides!', 'Nhìn kỹ các góc và các cạnh nhé!'); }
      api.stage.querySelector('.tg-board svg').innerHTML = pz.pieces.map(([p, c]) => svgPoly(p, c)).join('');
      api.say(`You made ${pz.en}!`, `Con xếp được ${pz.vi} rồi!`);
      await wait(1800);
    }
    api.dots(rounds, rounds); return api.win({ title: T('Shape master!', 'Bậc thầy xếp hình!') });
  }
});

// ---------- Snakes and Ladders (Moksha Patam, a very old game from India) ----------
register({id:'snakes',online:true,icon:'🐍',origin:'in',name:()=>T('Snakes and Ladders','Rắn và Thang'),run:playSnakes});

// ---------- Rangoli: finish the mirror pattern ----------
const RCOL = ['#ff4f9a', '#ffd23f', '#3cc7e8', '#2fb04f', '#8a5cf6', '#ff9f43'];
register({
  id: 'rangoli', icon: '🌸', origin: 'in', name: () => T('Rangoli Patterns', 'Tranh Rangoli'),
  async run(api) {
    const rounds = api.little ? 3 : 5;
    api.say('In India, families draw rangoli with coloured powder for Diwali. A rangoli is the same on both sides. Finish the other half!', 'Ở Ấn Độ, các gia đình vẽ tranh rangoli bằng bột màu vào dịp lễ Diwali. Tranh rangoli giống nhau ở hai bên. Con tô nốt nửa còn lại nhé!');
    for (let r = 0; r < rounds; r++) {
      api.dots(rounds, r); api.stage.innerHTML = '';
      const S = api.little ? 4 : 6, half = S / 2, cols = RCOL.slice(0, api.little ? 3 : 4);
      const pat = Array.from({ length: S }, () => Array.from({ length: half }, () => Math.random() < (api.little ? .45 : .6) ? pick(cols) : null));
      let brush = cols[0];
      const grid = el('div', 'rg-grid'); grid.style.gridTemplateColumns = `repeat(${S}, 1fr)`;
      const cells = [];
      for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) {
        const left = x < half, want = left ? pat[y][x] : pat[y][S - 1 - x];
        const c = el('button', 'rg-cell' + (left ? ' fixed' : '') + (x === half ? ' mid' : ''), ''); c.style.background = left && want ? want : '';
        c._want = want; c._has = left ? want : null; if (!left) cells.push(c);
        c.onclick = () => { if (left || api.closed) return; c._has = c._has === brush ? null : brush; c.style.background = c._has || ''; check(); };
        grid.appendChild(c);
      }
      const pal = el('div', 'rg-pal', cols.map((c, i) => `<button data-c="${c}" class="${i ? '' : 'on'}" style="background:${c}" aria-label="colour"></button>`).join(''));
      pal.querySelectorAll('button').forEach(b => b.onclick = () => { brush = b.dataset.c; pal.querySelectorAll('button').forEach(x => x.classList.toggle('on', x === b)); });
      api.stage.append(el('div', 'rg-tip', T('Tap a colour, then tap the squares on the right to copy the left side like a mirror.', 'Chọn màu, rồi chạm vào ô bên phải để tô giống bên trái như soi gương.')), grid, pal);
      let done; const finished = new Promise<void>(res => done = res);
      // (r89) auto play copies the mirror like a child: the colour a square needs (or the one to rub out), then that square
      const paint = (c: string) => [...pal.querySelectorAll('button')].find(b => b.dataset.c === c) || null;
      api.plan(() => { if (!grid.isConnected) return null; const c = cells.find(x => (x._has || null) !== (x._want || null)); if (!c) return null;
        const need = c._want || c._has; return brush === need ? c : paint(need); }, { maxActions: rounds * S * half * 2 });
      function check() { if (cells.every(c => (c._has || null) === (c._want || null))) done(); }
      check(); await finished; if (api.closed) return;
      api.right(); api.say('Beautiful! Both sides match.', 'Đẹp quá! Hai bên giống hệt nhau.'); grid.classList.add('glow'); await wait(1800);
    }
    api.dots(rounds, rounds); return api.win({ title: T('What a beautiful rangoli!', 'Tranh rangoli đẹp quá!') });
  }
});
