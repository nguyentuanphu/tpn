// (v1.08 maths, owner's plan D) The other 10 of the 21 new maths games: Quarter Past, Number Puzzle, Bigger Number Race,
// Doubles, Tens and Ones, Missing Number, Shapes in 3D, Left and Right, Mental Maths Sprint and Count by Grouping
// (the engine and levels: js/games/maths-kit.ts; the first 11: js/games/maths3.ts).
import { register } from './frame.js';
import { T } from '../i18n.js';
import { pic } from '../art.js';
import { el } from '../util.js';
import { play, lv, rounds, wrongs, mix, pick, range, near, othersFrom, svgBox, OUT, distinct, type Round } from './maths-kit.js';

const numText = (x: number, y: number, t: string | number, size = 30, f = OUT) => `<text x="${x}" y="${y}" text-anchor="middle" dominant-baseline="central" font-size="${size}" font-weight="900" fill="${f}" font-family="Fredoka,sans-serif">${t}</text>`;
const pad2 = (m: number) => (m < 10 ? '0' : '') + m;

// ---------- Quarter Past: read the clock ----------
const clockSVG = (h: number, m: number) => {
  let s = `<circle cx="100" cy="100" r="88" fill="#fff6e4" stroke="${OUT}" stroke-width="6"/>`;
  for (let i = 1; i <= 12; i++) { const a = i * Math.PI / 6; s += numText(100 + Math.sin(a) * 68, 100 - Math.cos(a) * 68, i, 20); }
  for (let i = 0; i < 60; i++) if (i % 5) { const a = i * Math.PI / 30; s += `<path d="M${(100 + Math.sin(a) * 84).toFixed(1)} ${(100 - Math.cos(a) * 84).toFixed(1)}L${(100 + Math.sin(a) * 80).toFixed(1)} ${(100 - Math.cos(a) * 80).toFixed(1)}" stroke="${OUT}" stroke-width="2"/>`; }
  const ha = ((h % 12) + m / 60) * Math.PI / 6, ma = m * Math.PI / 30;
  s += `<path d="M100 100L${(100 + Math.sin(ha) * 42).toFixed(1)} ${(100 - Math.cos(ha) * 42).toFixed(1)}" stroke="${OUT}" stroke-width="9" stroke-linecap="round"/>`;
  s += `<path d="M100 100L${(100 + Math.sin(ma) * 66).toFixed(1)} ${(100 - Math.cos(ma) * 66).toFixed(1)}" stroke="#e8433a" stroke-width="5" stroke-linecap="round"/><circle cx="100" cy="100" r="7" fill="${OUT}"/>`;
  return svgBox(200, 200, s);
};
register({
  id: 'mx_quarter', learn: true, icon: 'mx:quarter', name: () => T('Quarter Past', 'Mấy Giờ Rồi'),
  run: api => {
    // (levels) the minutes the clock can show: Easy o'clock, Medium and half past, Hard and quarter past or to, Talent every 5 minutes
    const L = lv(api, [0], [0, 30], [0, 15, 30, 45], range(0, 11).map(i => i * 5));
    api.stage.dataset.lv = L.join(',');
    const list: Round[] = distinct(rounds(api), () => {
      const h = pick(1, 12), m = L[pick(0, L.length - 1)], fmt = (hh: number, mm: number) => `${((hh + 11) % 12) + 1}:${pad2(mm)}`, ans = fmt(h, m);
      // wrong answers: the hour and minute hands mixed up, one hour off, a quarter off
      const swap = m % 5 === 0 && m ? fmt(m / 5 || 12, (h % 12) * 5) : '';
      const pool = [...new Set([fmt(h + 1, m), fmt(h - 1, m), swap, L.length > 1 ? fmt(h, (m + 30) % 60) : '', L.length > 2 ? fmt(h, (m + 15) % 60) : ''].filter(v => v && v !== ans))];
      return { ask: ['What time does the clock show?', 'Đồng hồ chỉ mấy giờ?'], key: 'm' + m, answer: ans, others: mix(pool).slice(0, wrongs(api)), draw: stage => { stage.insertAdjacentHTML('beforeend', clockSVG(h, m)); } };
    });
    return play(api, list, ['The short hand shows the hour, the long hand the minutes!', 'Kim ngắn chỉ giờ, kim dài chỉ phút!'], ['You can tell the time!', 'Bé xem giờ thật giỏi!']);
  }
});

// ---------- Number Puzzle: a kids' sudoku, one glowing square at a time ----------
function puzzle(n: number, blanks: number) {
  // a full grid: 3 by 3 is a Latin square; 4 by 4 also has its four 2 by 2 boxes
  const base = n === 3 ? [[1, 2, 3], [2, 3, 1], [3, 1, 2]] : [[1, 2, 3, 4], [3, 4, 1, 2], [2, 1, 4, 3], [4, 3, 2, 1]];
  const sym = mix(range(1, n)), rows = n === 3 ? mix([0, 1, 2]) : [...mix([0, 1]), ...mix([2, 3])], cols = n === 3 ? mix([0, 1, 2]) : [...mix([0, 1]), ...mix([2, 3])];
  const full = rows.map(r => cols.map(c => sym[base[r][c] - 1]));
  const box = (r: number, c: number) => n === 4 ? (r >> 1) * 2 + (c >> 1) : -1;
  const options = (g: number[][], r: number, c: number) => range(1, n).filter(v => !g[r].includes(v) && !g.some(row => row[c] === v) && !(n === 4 && g.some((row, rr) => row.some((x, cc) => x === v && box(rr, cc) === box(r, c)))));
  // choose the blanks and an order in which each one has only one possible number when its turn comes
  for (let t = 0; t < 300; t++) {
    const cells = mix(range(0, n * n - 1)).slice(0, blanks), g = full.map(r => r.slice()); for (const k of cells) g[Math.floor(k / n)][k % n] = 0;
    const order: number[] = [], left = cells.slice(), work = g.map(r => r.slice());
    while (left.length) { const i = left.findIndex(k => options(work, Math.floor(k / n), k % n).length === 1); if (i < 0) break; const k = left.splice(i, 1)[0]; order.push(k); work[Math.floor(k / n)][k % n] = full[Math.floor(k / n)][k % n]; }
    if (!left.length) return { full, start: g, order };
  }
  return null;
}
register({
  id: 'mx_sudoku', learn: true, icon: 'mx:sudoku', name: () => T('Number Puzzle', 'Ô Số Vui'),
  run: api => {
    // (levels) Easy: 3 by 3 with 3 empty squares; Medium: 4 by 4 with 4; Hard: 4 by 4 with 6; Talent: 4 by 4 with 9
    const L = lv(api, { n: 3, blanks: 3 }, { n: 4, blanks: 4 }, { n: 4, blanks: 6 }, { n: 4, blanks: 9 });
    api.stage.dataset.lv = `${L.n},${L.blanks}`;
    let P = null; for (let b = L.blanks; !P && b > 1; b--) P = puzzle(L.n, b);
    const C = 52, colours = ['', '#3b6fe0', '#e8433a', '#43c463', '#9a6bff'];
    const list: Round[] = P.order.map((k: number, step: number) => {
      const grid = P.start.map((r: number[]) => r.slice()); for (const j of P.order.slice(0, step)) grid[Math.floor(j / L.n)][j % L.n] = P.full[Math.floor(j / L.n)][j % L.n];
      const r = Math.floor(k / L.n), c = k % L.n, ans = P.full[r][c];
      return { ask: ['Which number goes in the glowing square?', 'Số nào điền vào ô đang sáng?'], answer: String(ans), others: range(1, L.n).filter(v => v !== ans).map(String), draw: stage => {
        let s = '';
        for (let rr = 0; rr < L.n; rr++) for (let cc = 0; cc < L.n; cc++) { const v = grid[rr][cc], on = rr === r && cc === c; s += `<rect x="${4 + cc * C}" y="${4 + rr * C}" width="${C}" height="${C}" fill="${on ? '#fff6b0' : v ? '#fff' : '#f3eefa'}" stroke="${on ? '#ffb020' : OUT}" stroke-width="${on ? 5 : 2}"/>` + (v ? numText(4 + cc * C + C / 2, 4 + rr * C + C / 2, v, 28, colours[v]) : on ? numText(4 + cc * C + C / 2, 4 + rr * C + C / 2, '?', 28, '#e8433a') : ''); }
        if (L.n === 4) s += `<path d="M${4 + 2 * C} 4v${4 * C}M4 ${4 + 2 * C}h${4 * C}" stroke="${OUT}" stroke-width="5"/>`;
        stage.insertAdjacentHTML('beforeend', svgBox(L.n * C + 8, L.n * C + 8, s, 'mx-svg'));
        (stage.lastElementChild as HTMLElement).style.width = Math.min(260, L.n * 60) + 'px';
      } };
    });
    return play(api, list, ['Every row and every column has each number once!', 'Mỗi hàng và mỗi cột có mỗi số một lần!'], ['Puzzle solved!', 'Giải xong ô số rồi!']);
  }
});

// ---------- Bigger Number Race: tap the car with the bigger number ----------
const RACE: Record<string, [string, string]> = {
  bigger: ['Which car has the bigger number?', 'Xe nào mang số lớn hơn?'], smaller: ['Which car has the smaller number?', 'Xe nào mang số bé hơn?'],
  biggest: ['Which car has the biggest number?', 'Xe nào mang số lớn nhất?'], smallest: ['Which car has the smallest number?', 'Xe nào mang số bé nhất?']
};
const car = (n: number, colour: string) => `<svg class="mx-art" viewBox="0 0 110 56" width="110" height="56" aria-hidden="true"><path d="M20 14h48l16 14h18v16H6V28z" fill="${colour}" stroke="${OUT}" stroke-width="3" stroke-linejoin="round"/><path d="M30 18h18v10H24zM54 18h12l10 10H54z" fill="#dff4ff" stroke="${OUT}" stroke-width="2"/><circle cx="26" cy="46" r="8" fill="#5b5268" stroke="${OUT}" stroke-width="3"/><circle cx="84" cy="46" r="8" fill="#5b5268" stroke="${OUT}" stroke-width="3"/><rect x="${n > 99 ? 38 : 44}" y="30" width="${n > 99 ? 34 : 22}" height="14" rx="4" fill="#fff" stroke="${OUT}" stroke-width="1.6"/>${numText(55, 37.5, n, n > 99 ? 12 : 13)}</svg>`;
register({
  id: 'mx_bigger', learn: true, icon: 'mx:bigger', name: () => T('Bigger Number Race', 'Đua Số Lớn'),
  run: api => {
    // (levels) Easy: two cars up to 10; Medium: three up to 20; Hard: three up to 100, bigger or smaller; Talent: four up to 999
    const L = lv(api, { cars: 2, max: 10, asks: ['bigger'] }, { cars: 3, max: 20, asks: ['biggest'] }, { cars: 3, max: 100, asks: ['biggest', 'smallest'] }, { cars: 4, max: 999, asks: ['biggest', 'smallest'] });
    api.stage.dataset.lv = `${L.cars},${L.max}`;
    const CARS = ['#e8433a', '#3b6fe0', '#43c463', '#ff9f43'];
    const list: Round[] = distinct(rounds(api), () => {
      const ask = L.asks[pick(0, L.asks.length - 1)], nums: number[] = [];
      // (Talent) numbers that share digits, so the places matter: 352, 325, 532
      while (nums.length < L.cars) { const v = L.max > 100 && nums.length && Math.random() < .5 ? +mix(String(nums[0]).padStart(3, '1').split('')).join('') : pick(1, L.max); if (!nums.includes(v) && v <= L.max && v > 0) nums.push(v); }
      const want = /big/.test(ask) ? Math.max(...nums) : Math.min(...nums);
      return { ask: RACE[ask], key: ask, right: e => +e.dataset.k === want, draw: stage => {
        const lanes = el('div', ''); lanes.style.cssText = 'display:flex;flex-direction:column;gap:4px;width:100%;align-items:flex-start;border-left:6px solid #3b2a4f;border-right:6px dashed #e8433a;padding:4px 0';
        const things = nums.map((v, i) => { const b = el('button', '', car(v, CARS[i])); b.dataset.k = String(v); b.style.transition = 'transform .5s'; lanes.appendChild(b); return b; });
        stage.appendChild(lanes); return things; } };
    });
    return play(api, list, ['Ready, set, go! The bigger number wins the race!', 'Chuẩn bị, xuất phát! Số lớn hơn thắng cuộc đua!'], ['You know which numbers are bigger!', 'Bé biết số nào lớn hơn rồi!']);
  }
});

// ---------- Doubles: the same on both wings ----------
const spotsAt = (cx: number, cy: number, n: number) => { let s = ''; for (let i = 0; i < n; i++) { const r = Math.floor(i / 2), c = i % 2; s += `<circle cx="${cx + (c ? 13 : -13) * (n === 1 ? 0 : 1)}" cy="${cy - 40 + r * 19 + (n <= 2 ? 30 : 0)}" r="7" fill="${OUT}"/>`; } return s; };
const ladybird = (left: number, right: number | null) => svgBox(220, 170, `<path d="M110 30v130" stroke="${OUT}" stroke-width="4"/>` +
  `<path d="M108 30C40 30 20 90 30 120c10 30 50 42 78 42z" fill="#e8433a" stroke="${OUT}" stroke-width="4"/>${spotsAt(70, 92, left)}` +
  `<path d="M112 30c68 0 88 60 78 90-10 30-50 42-78 42z" fill="${right === null ? '#fff6e4' : '#e8433a'}" stroke="${OUT}" stroke-width="4" ${right === null ? 'stroke-dasharray="8 6"' : ''}/>${right === null ? numText(150, 96, '?', 40, '#e8433a') : spotsAt(150, 92, right)}` +
  `<circle cx="110" cy="24" r="18" fill="${OUT}"/><circle cx="103" cy="20" r="3.4" fill="#fff"/><circle cx="117" cy="20" r="3.4" fill="#fff"/>`);
register({
  id: 'mx_doubles', learn: true, icon: 'mx:doubles', name: () => T('Doubles', 'Gấp Đôi'),
  run: api => {
    // (levels) Easy: doubles to 3 with both wings shown; Medium: to 5, one wing; Hard: to 10, the number only; Talent: halves of
    // doubles to 20
    const L = lv(api, { max: 3, mode: 'both' }, { max: 5, mode: 'one' }, { max: 10, mode: 'sum' }, { max: 10, mode: 'half' });
    api.stage.dataset.lv = `${L.max},${L.mode}`;
    const list: Round[] = mix(range(1, L.max)).concat(mix(range(1, L.max))).slice(0, rounds(api)).map(n => {
      if (L.mode === 'half') return { ask: () => api.say(`Half of ${n * 2} is how many?`, `Một nửa của ${n * 2} là bao nhiêu?`), answer: String(n), others: near(n, 0, 12, wrongs(api)), key: 'h' + n, draw: stage => { stage.appendChild(el('div', 'mx-big', `${n * 2} ÷ 2 = <b>?</b>`)); } };
      return { ask: () => api.say(`Double ${n} is how many?`, `Gấp đôi ${n} là bao nhiêu?`), answer: String(n * 2), others: near(n * 2, 0, 22, wrongs(api)), key: 'd' + n,
        draw: stage => { if (L.mode === 'sum') stage.appendChild(el('div', 'mx-big', `${n} + ${n} = <b>?</b>`)); else stage.insertAdjacentHTML('beforeend', ladybird(Math.min(n, 6), L.mode === 'both' ? Math.min(n, 6) : null)); } };
    });
    return play(api, list, ['Doubles: the same number twice!', 'Gấp đôi: một số cộng với chính nó!'], ['Double the fun, double the clever!', 'Gấp đôi niềm vui, gấp đôi giỏi giang!']);
  }
});

// ---------- Tens and Ones: bundles of ten sticks and single sticks ----------
const sticks = (tens: number, ones: number) => {
  let s = '', x = 6;
  for (let t = 0; t < tens; t++) { for (let i = 0; i < 10; i++) s += `<rect x="${x + i * 3.4}" y="10" width="3" height="70" rx="1.4" fill="#ffcf6b" stroke="${OUT}" stroke-width="1"/>`; s += `<rect x="${x - 1}" y="40" width="${36}" height="8" fill="#e8433a" stroke="${OUT}" stroke-width="1.4"/>`; x += 44; }
  x += 6; for (let i = 0; i < ones; i++) { s += `<rect x="${x}" y="10" width="5" height="70" rx="2" fill="#ffcf6b" stroke="${OUT}" stroke-width="1.4"/>`; x += 10; }
  return svgBox(Math.max(x + 6, 120), 90, s);
};
register({
  id: 'mx_tens', learn: true, icon: 'mx:tens', name: () => T('Tens and Ones', 'Chục và Đơn Vị'),
  run: api => {
    // (levels) Easy: one ten and some ones; Medium: up to 5 tens; Hard: up to 9 tens; Talent: also how many tens a number has
    const L = lv(api, { tens: 1, askTens: false }, { tens: 5, askTens: false }, { tens: 9, askTens: false }, { tens: 9, askTens: true });
    api.stage.dataset.lv = `${L.tens},${L.askTens ? 1 : 0}`;
    const list: Round[] = distinct(rounds(api), i => {
      const t = pick(1, L.tens), o = pick(0, 9), n = t * 10 + o, swap = o ? String(o * 10 + t) : '';
      if (L.askTens && i % 2) return { ask: () => api.say(`How many tens are in ${n}?`, `Số ${n} có mấy chục?`), answer: String(t), others: [...new Set([String(o), ...near(t, 1, 9, 3)])].filter(v => v !== String(t)).slice(0, wrongs(api)), key: 'tens', draw: stage => { stage.appendChild(el('div', 'mx-big', String(n))); } };
      const others = mix([...new Set([swap, ...near(n, 10, 99, 3), String(n + 10), String(n - 10)].filter(v => v && v !== String(n) && +v >= 1 && +v <= 99))]).slice(0, wrongs(api));
      return { ask: ['How many sticks are there altogether?', 'Có tất cả bao nhiêu que tính?'], answer: String(n), others, key: 'n', draw: stage => { stage.insertAdjacentHTML('beforeend', sticks(t, o)); stage.appendChild(el('div', 'mx-note', T('Each red tie holds ten sticks.', 'Mỗi bó buộc dây đỏ có mười que.'))); } };
    });
    return play(api, list, ['Count the bundles of ten, then the single sticks!', 'Đếm các bó mười que, rồi đếm que lẻ!'], ['Tens and ones: you have got it!', 'Chục và đơn vị: bé hiểu rồi!']);
  }
});

// ---------- Missing Number ----------
register({
  id: 'mx_missing', learn: true, icon: 'mx:missing', name: () => T('Missing Number', 'Tìm Số Còn Thiếu'),
  run: api => {
    // (levels) Easy: counting on to 10; Medium: to 20; Hard: counting back to 30; Talent: a number sentence, a + ? = b
    const L = lv(api, { max: 10, back: false, sum: false }, { max: 20, back: false, sum: false }, { max: 30, back: true, sum: false }, { max: 20, back: true, sum: true });
    api.stage.dataset.lv = `${L.max},${L.back ? 1 : 0},${L.sum ? 1 : 0}`;
    const list: Round[] = distinct(rounds(api), i => {
      if (L.sum && i % 2) { const b = pick(6, L.max), a = pick(1, b - 1), x = b - a; return { ask: () => api.say(`${a} and what makes ${b}?`, `${a} cộng mấy bằng ${b}?`), answer: String(x), others: near(x, 0, L.max, wrongs(api)), key: 'sum', draw: stage => { stage.appendChild(el('div', 'mx-big', `${a} + <b>?</b> = ${b}`)); } }; }
      const back = L.back && Math.random() < .5, len = 5, start = back ? pick(len, L.max) : pick(0, L.max - len + 1), seq = range(0, len - 1).map(k => back ? start - k : start + k), gap = pick(1, len - 2), x = seq[gap];
      return { ask: back ? ['Count back. Which number is missing?', 'Đếm lùi. Số nào còn thiếu?'] : ['Count on. Which number is missing?', 'Đếm tiếp. Số nào còn thiếu?'], answer: String(x), others: near(x, 0, L.max + 1, wrongs(api)), key: back ? 'back' : 'on', draw: stage => {
        const w = 54; stage.insertAdjacentHTML('beforeend', svgBox(len * w + 6, 70, seq.map((v, k) => `<rect x="${6 + k * w}" y="10" width="${w - 8}" height="50" rx="12" fill="${k === gap ? '#fff6e4' : '#a8e6a1'}" stroke="${k === gap ? '#e8433a' : OUT}" stroke-width="3" ${k === gap ? 'stroke-dasharray="6 4"' : ''}/>` + numText(6 + k * w + (w - 8) / 2, 35, k === gap ? '?' : v, 22, k === gap ? '#e8433a' : OUT)).join('')));
      } };
    });
    return play(api, list, ['A number stone is missing. Which one?', 'Mất một viên đá số. Là số nào nhỉ?'], ['No number can hide from you!', 'Không số nào trốn được bé!']);
  }
});

// ---------- Shapes in 3D ----------
const SOLIDS: Record<string, [string, string]> = { cube: ['cube', 'khối lập phương'], cuboid: ['cuboid', 'khối hộp chữ nhật'], sphere: ['sphere', 'khối cầu'], cylinder: ['cylinder', 'khối trụ'], cone: ['cone', 'khối nón'], pyramid: ['pyramid', 'khối chóp'] };
const FACES: Record<string, number> = { cube: 6, cuboid: 6, sphere: 0, cylinder: 2, cone: 1, pyramid: 5 };
const solidSVG = (k: string, size = 54) => {
  const s = `stroke="${OUT}" stroke-width="2.6" stroke-linejoin="round"`, body = ({
    cube: `<path d="M8 16l16-8 16 8v18l-16 8-16-8z" fill="#5fb6ff" ${s}/><path d="M8 16l16 8 16-8M24 24v18" fill="none" ${s}/>`,
    cuboid: `<path d="M3 20l12-7 30 0v16l-12 7H3z" fill="#ffb347" ${s}/><path d="M3 20h30l12-7M33 20v16" fill="none" ${s}/>`,
    sphere: `<circle cx="24" cy="24" r="18" fill="#ff7eb8" ${s}/><ellipse cx="24" cy="26" rx="18" ry="6" fill="none" stroke="${OUT}" stroke-width="1.6" stroke-dasharray="3 3"/><circle cx="17" cy="16" r="4" fill="#fff" opacity=".6"/>`,
    cylinder: `<path d="M9 12v24a15 6 0 0 0 30 0V12z" fill="#43c463" ${s}/><ellipse cx="24" cy="12" rx="15" ry="6" fill="#a8e6a1" ${s}/>`,
    cone: `<path d="M24 4L9 38a15 6 0 0 0 30 0z" fill="#ffd23f" ${s}/><path d="M9 38a15 6 0 0 1 30 0" fill="none" stroke="${OUT}" stroke-width="1.6" stroke-dasharray="3 3"/>`,
    pyramid: `<path d="M24 5L5 34l15 9 23-11z" fill="#9a6bff" ${s}/><path d="M24 5l-4 38" fill="none" ${s}/>`
  })[k];
  return `<svg class="mx-art" viewBox="0 0 48 48" width="${size}" height="${size}" aria-hidden="true">${body}</svg>`;
};
// real things and the solid each is like (all our own drawings)
const LIKE: [string, string][] = [['⚽', 'sphere'], ['🍊', 'sphere'], ['🎲', 'cube'], ['🧊', 'cube'], ['🥫', 'cylinder'], ['🥁', 'cylinder'], ['🕯️', 'cylinder'], ['🍦', 'cone'], ['📦', 'cuboid'], ['🧱', 'cuboid']];
register({
  id: 'mx_solids3d', learn: true, icon: 'mx:solids3d', name: () => T('Shapes in 3D', 'Hình Khối 3D'),
  run: api => {
    // (levels) Easy: a thing and three solids to match; Medium: four solids; Hard: the solid's name; Talent: how many flat faces
    const L = lv(api, { mode: 'like', kinds: ['sphere', 'cube', 'cylinder', 'cone'] }, { mode: 'like', kinds: ['sphere', 'cube', 'cylinder', 'cone', 'cuboid'] }, { mode: 'name', kinds: Object.keys(SOLIDS) }, { mode: 'faces', kinds: Object.keys(SOLIDS) });
    api.stage.dataset.lv = `${L.mode},${L.kinds.length}`;
    const list: Round[] = distinct(rounds(api), () => {
      if (L.mode === 'like') { const things = LIKE.filter(t => L.kinds.includes(t[1])), [thing, k] = things[pick(0, things.length - 1)];
        return { ask: ['Which solid shape is this thing like?', 'Đồ vật này giống khối hình nào?'], key: k, answer: k, others: othersFrom(k, L.kinds, wrongs(api)), label: v => solidSVG(v), draw: stage => { stage.insertAdjacentHTML('beforeend', pic(thing, 'mx-thing')); (stage.querySelector('.mx-thing') as HTMLElement)?.setAttribute('style', 'width:110px;height:110px'); } }; }
      const k = L.kinds[pick(0, L.kinds.length - 1)];
      if (L.mode === 'name') return { ask: ['What is this solid shape called?', 'Khối hình này tên là gì?'], key: k, answer: k, others: othersFrom(k, L.kinds, wrongs(api)), label: v => `<span style="font-size:17px">${T(SOLIDS[v][0], SOLIDS[v][1])}</span>`, draw: stage => { stage.insertAdjacentHTML('beforeend', solidSVG(k, 130)); } };
      const f = FACES[k];
      return { ask: ['How many flat faces does this shape have?', 'Khối này có mấy mặt phẳng?'], key: k, answer: String(f), others: othersFrom(String(f), ['0', '1', '2', '4', '5', '6', '8'], wrongs(api)), draw: stage => { stage.insertAdjacentHTML('beforeend', solidSVG(k, 130)); stage.appendChild(el('div', 'mx-note', T(SOLIDS[k][0], SOLIDS[k][1]))); } };
    });
    return play(api, list, ['Balls, boxes, cans and cones: shapes you can hold!', 'Bóng, hộp, lon và nón: những khối cầm được trong tay!'], ['You know your 3D shapes!', 'Bé biết các khối 3D rồi!']);
  }
});

// ---------- Left and Right ----------
const SIDE: Record<string, [string, string]> = {
  left: ['Tap the one on the left.', 'Chạm vào con vật bên trái.'], right: ['Tap the one on the right.', 'Chạm vào con vật bên phải.'],
  leftof: ['Tap the one just left of the star.', 'Chạm vào con vật ngay bên trái ngôi sao.'], rightof: ['Tap the one just right of the star.', 'Chạm vào con vật ngay bên phải ngôi sao.'],
  second_l: ['Tap the second one from the left.', 'Chạm vào con vật thứ hai tính từ bên trái.'], second_r: ['Tap the second one from the right.', 'Chạm vào con vật thứ hai tính từ bên phải.'],
  two_l: ['Tap the one two places left of the star.', 'Chạm vào con vật cách ngôi sao hai chỗ về bên trái.'], two_r: ['Tap the one two places right of the star.', 'Chạm vào con vật cách ngôi sao hai chỗ về bên phải.']
};
const ANIMALS = ['🐶', '🐱', '🐰', '🐸', '🐻', '🐼', '🦊', '🐷', '🐵', '🦁', '🐮', '🐔'];
register({
  id: 'mx_leftright', learn: true, icon: 'mx:leftright', name: () => T('Left and Right', 'Trái và Phải'),
  run: api => {
    // (levels) Easy: two animals, left or right; Medium: four, next to the star; Hard: five, second from a side; Talent: six, two
    // places from the star
    const L = lv(api, { n: 2, asks: ['left', 'right'] }, { n: 4, asks: ['leftof', 'rightof'] }, { n: 5, asks: ['second_l', 'second_r', 'leftof', 'rightof'] }, { n: 6, asks: ['two_l', 'two_r', 'second_l', 'second_r'] });
    api.stage.dataset.lv = `${L.n},${L.asks.length}`;
    const list: Round[] = distinct(rounds(api), () => {
      const ask = L.asks[pick(0, L.asks.length - 1)], d = ask === 'two_l' || ask === 'two_r' ? 2 : 1;
      const star = /_l$|leftof/.test(ask) ? pick(d, L.n - 1) : pick(0, L.n - 1 - d);
      const want = ({ left: 0, right: L.n - 1, second_l: 1, second_r: L.n - 2, leftof: star - 1, rightof: star + 1, two_l: star - 2, two_r: star + 2 })[ask];
      const showStar = /of|two/.test(ask), who = mix(ANIMALS).slice(0, L.n);
      return { ask: SIDE[ask], key: ask, right: e => +e.dataset.k === want, draw: stage => {
        const hands = el('div', 'mx-row'); hands.style.cssText = 'justify-content:space-between;width:100%';
        hands.innerHTML = `<span class="mx-note">${pic('⬅️')} ${T('left', 'trái')}</span><span class="mx-note">${T('right', 'phải')} ${pic('➡️')}</span>`; hands.querySelectorAll('.art').forEach(a => a.setAttribute('style', 'width:26px;height:26px'));
        const row = el('div', 'mx-row'); row.style.flexWrap = 'nowrap'; row.style.gap = '0';
        const things = who.map((a, i) => { const b = el('button', '', `<span style="display:flex;flex-direction:column;align-items:center">${showStar && i === star ? pic('⭐') : '<i style="height:22px"></i>'}${pic(a)}</span>`); b.dataset.k = String(i); b.style.minWidth = L.n > 5 ? '52px' : '64px'; b.querySelectorAll('.art').forEach((x, j) => x.setAttribute('style', j === 0 && showStar && i === star ? 'width:22px;height:22px' : 'width:44px;height:44px')); row.appendChild(b); return b; });
        stage.append(hands, row); return things; } };
    });
    return play(api, list, ['Left or right? Look carefully!', 'Bên trái hay bên phải? Nhìn kỹ nhé!'], ['You know left from right!', 'Bé phân biệt trái phải thật giỏi!']);
  }
});

// ---------- Mental Maths Sprint ----------
register({
  id: 'mx_sprint', learn: true, icon: 'mx:sprint', name: () => T('Mental Maths Sprint', 'Tính Nhẩm Nhanh'),
  run: api => {
    // (levels) Easy: adding to 5; Medium: adding and taking away to 10; Hard: to 20; Talent: tens and ones to 100
    const L = lv(api, { max: 5, minus: false, big: false }, { max: 10, minus: true, big: false }, { max: 20, minus: true, big: false }, { max: 100, minus: true, big: true });
    api.stage.dataset.lv = `${L.max},${L.minus ? 1 : 0}`;
    const n = rounds(api) + 2;
    const list: Round[] = Array.from({ length: n }, (_, k) => {
      const minus = L.minus && Math.random() < .5;
      let a: number, b: number;
      if (L.big) { a = pick(2, 9) * 10 + (Math.random() < .5 ? 0 : pick(1, 9)); b = Math.random() < .5 ? pick(1, 4) * 10 : pick(1, 9); if (minus) b = Math.min(b, a - 1); else if (a + b > 100) a = 100 - b; }
      else { a = pick(1, L.max - 1); b = minus ? pick(1, a) : pick(1, L.max - a); }
      const x = minus ? a - b : a + b, track = (stage: HTMLElement) => stage.insertAdjacentHTML('beforeend', svgBox(300, 40, `<path d="M10 30h280" stroke="${OUT}" stroke-width="3" stroke-dasharray="8 5"/><path d="M286 8v26" stroke="#e8433a" stroke-width="4"/>` +
        `<g transform="translate(${10 + 250 * k / Math.max(1, n - 1)} 2)"><circle cx="14" cy="14" r="12" fill="#ffd23f" stroke="${OUT}" stroke-width="2.6"/><path d="M8 12l4 4 8-8" stroke="${OUT}" stroke-width="2.6" fill="none"/></g>`, 'mx-svg'));
      return { ask: minus ? () => api.say(`${a} take away ${b}?`, `${a} trừ ${b} bằng mấy?`) : () => api.say(`${a} plus ${b}?`, `${a} cộng ${b} bằng mấy?`), answer: String(x), others: near(x, 0, L.max, wrongs(api), L.big && x >= 20 && Math.random() < .5 ? 10 : 1), key: minus ? '-' : '+',
        draw: stage => { track(stage); stage.appendChild(el('div', 'mx-big', `${a} ${minus ? '−' : '+'} ${b} = <b>?</b>`)); } };
    });
    return play(api, list, ['Quick! Work it out in your head!', 'Nhanh nào! Tính nhẩm trong đầu nhé!'], ['What a speedy brain!', 'Bộ não nhanh nhạy quá!']);
  }
});

// ---------- Count by Grouping ----------
register({
  id: 'mx_grouping', learn: true, icon: 'mx:grouping', name: () => T('Count by Grouping', 'Đếm Theo Nhóm'),
  run: api => {
    // (levels) the size of each group: Easy 2s, Medium 5s, Hard 10s, Talent 3s and 4s
    const L = lv(api, { sizes: [2], max: 5 }, { sizes: [5], max: 4 }, { sizes: [10], max: 6 }, { sizes: [3, 4], max: 5 });
    api.stage.dataset.lv = `${L.sizes.join('+')},${L.max}`;
    const THINGS = ['🍎', '🍓', '🐞', '🌸', '⭐', '🍬'];
    const list: Round[] = distinct(rounds(api), () => {
      const s = L.sizes[pick(0, L.sizes.length - 1)], g = pick(2, L.max), x = g * s, thing = THINGS[pick(0, THINGS.length - 1)];
      return { ask: () => api.say(`${g} groups of ${s}. How many altogether?`, `${g} nhóm, mỗi nhóm ${s}. Tất cả có bao nhiêu?`), answer: String(x), others: mix([...near(x, 1, 100, 3, s), String(x + 1), String(x - 1)]).filter(v => v !== String(x)).slice(0, wrongs(api)), key: 'g' + s,
        draw: stage => {
          const row = el('div', 'mx-row'); row.style.gap = '8px';
          for (let i = 0; i < g; i++) { const ring = el('div', ''); ring.style.cssText = `display:grid;grid-template-columns:repeat(${s > 4 ? 5 : 2},${s >= 10 ? 18 : 24}px);gap:1px;padding:6px;border:3px dashed #9a6bff;border-radius:16px;background:#fbf8ff`; ring.innerHTML = pic(thing).repeat(s); ring.querySelectorAll('.art').forEach(a => a.setAttribute('style', `width:${s >= 10 ? 18 : 24}px;height:${s >= 10 ? 18 : 24}px`)); row.appendChild(ring); }
          stage.appendChild(row);
        } };
    });
    return play(api, list, ['Count in groups. It is faster!', 'Đếm theo nhóm. Nhanh hơn nhiều!'], ['Grouping makes counting quick!', 'Đếm theo nhóm thật nhanh!']);
  }
});
