// (v1.08 maths, owner's plan D: "three times as many maths games") The first 11 of the 21 new maths games: Number Bonds,
// Take Away, Skip Counting, Patterns, Shapes Hunt, Symmetry, Heavier or Lighter, Full or Empty, Pizza Fractions, Picture
// Graph and Calendar. Each draws what it asks about, says the question in both languages (fixed sentences, or numbers in
// a template) and plays at Easy, Medium, Hard and Talent (js/games/maths-kit.ts). The rest are in js/games/maths4.ts.
import { register } from './frame.js';
import { T } from '../i18n.js';
import { pic } from '../art.js';
import { el } from '../util.js';
import { play, lv, rounds, wrongs, mix, pick, range, near, othersFrom, svgBox, shapeSVG, shapeName, COLOURS, OUT, distinct, type Round } from './maths-kit.js';

const FRUIT = ['🍎', '🍌', '🍊', '🍓', '🍇', '🍐'];
// dots laid out in rows of five inside a circle at cx, cy
const dotsAt = (cx: number, cy: number, n: number, f = OUT) => { const rows = Math.ceil(n / 5); let s = ''; for (let i = 0; i < n; i++) { const r = Math.floor(i / 5), c = i % 5, inRow = Math.min(5, n - r * 5); s += `<circle cx="${cx + (c - (inRow - 1) / 2) * 9}" cy="${cy + (r - (rows - 1) / 2) * 9}" r="3.4" fill="${f}"/>`; } return s; };
const numText = (x: number, y: number, t: string | number, size = 30, f = OUT) => `<text x="${x}" y="${y}" text-anchor="middle" dominant-baseline="central" font-size="${size}" font-weight="900" fill="${f}" font-family="Fredoka,sans-serif">${t}</text>`;

// ---------- Number Bonds: a whole and one part; find the other part ----------
register({
  id: 'mx_bonds', learn: true, icon: 'mx:bonds', name: () => T('Number Bonds', 'Tách Gộp Số'),
  run: api => {
    // (levels) the biggest whole, and whether dots help: Easy 5 with dots, Medium 10 with dots, Hard 10, Talent 20
    const L = lv(api, { max: 5, dots: true }, { max: 10, dots: true }, { max: 10, dots: false }, { max: 20, dots: false });
    api.stage.dataset.lv = `${L.max},${L.dots ? 1 : 0}`;
    const list: Round[] = distinct(rounds(api), () => {
      const w = pick(Math.min(3, L.max), L.max), a = pick(1, w - 1), b = w - a;
      return {
        ask: () => api.say(`${w} is made of ${a} and how many more?`, `${w} gồm ${a} và mấy?`),
        answer: String(b), others: near(b, 0, w, wrongs(api)), key: 'w' + w,
        draw: stage => {
          const dot = L.dots && w <= 10;
          stage.insertAdjacentHTML('beforeend', svgBox(260, 190, `<path d="M130 52L64 140M130 52l66 88" stroke="${OUT}" stroke-width="4"/>` +
            `<circle cx="130" cy="50" r="40" fill="#ffd23f" stroke="${OUT}" stroke-width="4"/>${numText(130, dot ? 28 : 50, w, dot ? 22 : 34)}${dot ? dotsAt(130, 62, w) : ''}` +
            `<circle cx="64" cy="142" r="38" fill="#bfe6ff" stroke="${OUT}" stroke-width="4"/>${numText(64, dot ? 122 : 142, a, dot ? 22 : 34)}${dot ? dotsAt(64, 152, a, '#3b6fe0') : ''}` +
            `<circle cx="196" cy="142" r="38" fill="#fff6e4" stroke="#e8433a" stroke-width="4" stroke-dasharray="8 6"/>${numText(196, 142, '?', 38, '#e8433a')}`));
        }
      };
    });
    return play(api, list, ['Two parts make a whole. Find the missing part!', 'Hai phần gộp lại thành số lớn. Tìm phần còn thiếu nhé!'], ['You know your number bonds!', 'Bé tách gộp số thật giỏi!']);
  }
});

// ---------- Take Away: some go away; how many are left? ----------
register({
  id: 'mx_takeaway', learn: true, icon: 'mx:takeaway', name: () => T('Take Away', 'Bớt Đi Còn Mấy'),
  run: api => {
    // (levels) Easy up to 5, Medium 10, Hard 15 with the number sentence, Talent 20 with only the number sentence
    const L = lv(api, { max: 5, pics: true, sum: false }, { max: 10, pics: true, sum: false }, { max: 15, pics: true, sum: true }, { max: 20, pics: false, sum: true });
    api.stage.dataset.lv = `${L.max},${L.pics ? 1 : 0}`;
    const list: Round[] = distinct(rounds(api), () => {
      const n = pick(Math.min(3, L.max), L.max), k = pick(1, n - 1), f = FRUIT[pick(0, FRUIT.length - 1)];
      return {
        ask: () => api.say(`There are ${n}. ${k} go away. How many are left?`, `Có ${n}. Bớt đi ${k}. Còn lại mấy?`),
        answer: String(n - k), others: near(n - k, 0, n, wrongs(api)),
        draw: stage => {
          if (L.pics) { const row = el('div', 'mx-pics'); for (let i = 0; i < n; i++) row.insertAdjacentHTML('beforeend', i >= n - k ? `<span class="gone">${pic(f)}</span>` : pic(f)); stage.appendChild(row); }
          if (L.sum) stage.appendChild(el('div', 'mx-big', `${n} − ${k} = <b>?</b>`));
        }
      };
    });
    return play(api, list, ['Some fly away. Count what is left!', 'Có vài quả bay mất. Đếm xem còn lại mấy nhé!'], ['Taking away is easy for you!', 'Phép trừ thật dễ với bé!']);
  }
});

// ---------- Skip Counting: count in twos, fives, tens; find the missing stone ----------
register({
  id: 'mx_skip', learn: true, icon: 'mx:skip', name: () => T('Skip Counting', 'Đếm Cách Quãng'),
  run: api => {
    // (levels) the steps: Easy 2s from 0, Medium 2s and 5s, Hard 5s and 10s, Talent 3s, 4s and 10s from anywhere
    const L = lv(api, { steps: [2], from0: true, len: 5 }, { steps: [2, 5], from0: true, len: 5 }, { steps: [5, 10], from0: false, len: 6 }, { steps: [3, 4, 10], from0: false, len: 6 });
    api.stage.dataset.lv = L.steps.join(',');
    const list: Round[] = distinct(rounds(api), () => {
      const step = L.steps[pick(0, L.steps.length - 1)], start = L.from0 ? 0 : step * pick(1, 4) + (step === 10 ? pick(0, 9) : 0);
      const seq = range(0, L.len - 1).map(i => start + i * step), gap = api.little ? L.len - 1 : pick(1, L.len - 1), x = seq[gap];
      return {
        ask: () => api.say(`Count in ${step}s. Which number is missing?`, `Đếm thêm ${step}. Số nào còn thiếu?`),
        answer: String(x), others: mix([...near(x, 0, 200, 2, step), String(x + 1)]).slice(0, wrongs(api)), key: 's' + step,
        draw: stage => {
          const w = 50, body = seq.map((v, i) => `<rect x="${6 + i * w}" y="62" width="${w - 8}" height="40" rx="10" fill="${i === gap ? '#fff6e4' : '#a8e6a1'}" stroke="${i === gap ? '#e8433a' : OUT}" stroke-width="3" ${i === gap ? 'stroke-dasharray="6 4"' : ''}/>` + numText(6 + i * w + (w - 8) / 2, 82, i === gap ? '?' : v, v > 99 ? 16 : 20, i === gap ? '#e8433a' : OUT) +
            (i ? `<path d="M${6 + (i - 1) * w + 21} 58q${w / 2} -36 ${w} 0" stroke="#ff7eb8" stroke-width="3" fill="none" stroke-dasharray="5 4"/>${numText(6 + (i - .5) * w + 21, 30, '+' + step, 14, '#c2185b')}` : '')).join('');
          stage.insertAdjacentHTML('beforeend', svgBox(seq.length * w + 6, 110, body));
        }
      };
    });
    return play(api, list, ['Hop along, counting in jumps!', 'Nhảy cách quãng, cùng đếm nào!'], ['Great skip counting!', 'Bé đếm cách quãng thật giỏi!']);
  }
});

// ---------- Patterns: what comes next? ----------
const UNITS: [string, string][] = [['circle', '#e8433a'], ['square', '#3b6fe0'], ['triangle', '#43c463'], ['star', '#ffd23f'], ['heart', '#ff7eb8'], ['diamond', '#9a6bff']];
register({
  id: 'mx_patterns', learn: true, icon: 'mx:patterns', name: () => T('Patterns', 'Quy Luật'),
  run: api => {
    // (levels) the kinds of pattern: Easy AB, Medium AAB and ABB, Hard ABC and AABB, Talent ABCD, ABAC and AABC
    const L = lv(api, ['AB'], ['AB', 'AAB', 'ABB'], ['ABC', 'AABB', 'AAB'], ['ABCD', 'ABAC', 'AABC']);
    api.stage.dataset.lv = L.join(',');
    const unit = (i: number, size = 40) => shapeSVG(UNITS[i][0], UNITS[i][1], size);
    const list: Round[] = distinct(rounds(api), () => {
      const pat = L[pick(0, L.length - 1)], use = mix(range(0, UNITS.length - 1)).slice(0, 4), seq = range(0, pat.length * 2 + pick(0, pat.length - 1)).map(i => use[pat.charCodeAt(i % pat.length) - 65]);
      const next = seq.pop(), choices = [...new Set([next, ...use.slice(0, 3), ...mix(range(0, UNITS.length - 1))])];
      return {
        ask: ['What comes next in the pattern?', 'Tiếp theo trong dãy là hình gì?'],
        answer: String(next), others: choices.filter(v => v !== next).slice(0, wrongs(api)).map(String), label: v => unit(+v), key: pat,
        draw: stage => { const row = el('div', 'mx-row'); row.innerHTML = seq.map(i => unit(i, seq.length > 7 ? 32 : 40)).join('') + `<span class="mx-big"><b>?</b></span>`; stage.appendChild(row); }
      };
    });
    return play(api, list, ['Look at the pattern. What comes next?', 'Nhìn dãy hình. Tiếp theo là gì nhỉ?'], ['You spot every pattern!', 'Bé tìm ra mọi quy luật!']);
  }
});

// ---------- Shapes Hunt: find every shape of one kind ----------
const HUNT: Record<string, [string, string]> = {
  circle: ['Find every circle!', 'Tìm tất cả hình tròn!'], square: ['Find every square!', 'Tìm tất cả hình vuông!'], triangle: ['Find every triangle!', 'Tìm tất cả hình tam giác!'],
  rectangle: ['Find every rectangle!', 'Tìm tất cả hình chữ nhật!'], star: ['Find every star!', 'Tìm tất cả ngôi sao!'], heart: ['Find every heart!', 'Tìm tất cả trái tim!'],
  oval: ['Find every oval!', 'Tìm tất cả hình bầu dục!'], diamond: ['Find every diamond!', 'Tìm tất cả hình thoi!'], pentagon: ['Find every pentagon!', 'Tìm tất cả hình ngũ giác!'], hexagon: ['Find every hexagon!', 'Tìm tất cả hình lục giác!']
};
register({
  id: 'mx_shapehunt', learn: true, icon: 'mx:shapehunt', name: () => T('Shapes Hunt', 'Săn Hình'),
  run: api => {
    // (levels) the shapes in the hunt and how many hide: Easy 3 kinds in 6, Medium 4 in 8, Hard 7 in 10, Talent 10 in 12
    const L = lv(api, { kinds: ['circle', 'square', 'triangle'], cells: 6 }, { kinds: ['circle', 'square', 'triangle', 'rectangle'], cells: 8 },
      { kinds: ['circle', 'square', 'triangle', 'rectangle', 'star', 'heart', 'oval'], cells: 10 }, { kinds: Object.keys(HUNT), cells: 12 });
    api.stage.dataset.lv = `${L.kinds.length},${L.cells}`;
    const list: Round[] = distinct(rounds(api), () => {
      const kind = L.kinds[pick(0, L.kinds.length - 1)], n = pick(2, 3), rest = L.kinds.filter(k => k !== kind);
      const cells = mix([...Array(n).fill(kind), ...Array.from({ length: L.cells - n }, () => rest[pick(0, rest.length - 1)])]);
      return {
        ask: HUNT[kind], key: kind, right: e => e.dataset.k === kind,
        draw: stage => {
          stage.appendChild(el('div', 'mx-note', `${shapeSVG(kind, '#fff6e4', 34)} ${shapeName(kind)}`));
          const grid = el('div', 'mx-row');
          const things = cells.map(k => { const b = el('button', '', shapeSVG(k, COLOURS[pick(0, COLOURS.length - 1)], api.talent ? pick(36, 50) : 46)); b.dataset.k = k; b.setAttribute('aria-label', shapeName(k)); grid.appendChild(b); return b; });
          stage.appendChild(grid); return things;
        }
      };
    });
    return play(api, list, ['Go on a shapes hunt!', 'Cùng đi săn hình nào!'], ['You found every shape!', 'Bé tìm được hết các hình!']);
  }
});

// ---------- Symmetry: choose the half that mirrors the picture ----------
register({
  id: 'mx_symmetry', learn: true, icon: 'mx:symmetry', name: () => T('Symmetry', 'Đối Xứng'),
  run: api => {
    // (levels) the size of each half: Easy 2 by 2, Medium 3 rows by 2, Hard 3 by 3 in two colours, Talent 4 rows by 3 in two colours
    const L = lv(api, { rows: 2, cols: 2, cols2: 1 }, { rows: 3, cols: 2, cols2: 1 }, { rows: 3, cols: 3, cols2: 2 }, { rows: 4, cols: 3, cols2: 2 });
    api.stage.dataset.lv = `${L.rows}x${L.cols},${L.cols2}`;
    const C = ['', '#3b6fe0', '#ff7eb8'], S = 26;
    const half = (code: string, cols: number, rows: number, line: 'l' | 'r' | '') => { let s = ''; for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) { const v = +code[r * cols + c]; s += `<rect x="${c * S + 2}" y="${r * S + 2}" width="${S}" height="${S}" fill="${v ? C[v] : '#fff'}" stroke="${OUT}" stroke-width="2"/>`; } return `<svg class="mx-art" viewBox="0 0 ${cols * S + 4} ${rows * S + 4}" width="${cols * S * .9 + 4}" height="${rows * S * .9 + 4}" aria-hidden="true">${s}${line ? `<path d="M${line === 'l' ? 2 : cols * S + 2} 0v${rows * S + 4}" stroke="#e8433a" stroke-width="3" stroke-dasharray="4 3"/>` : ''}</svg>`; };
    const mirror = (code: string) => { let s = ''; for (let r = 0; r < L.rows; r++) s += [...code.slice(r * L.cols, (r + 1) * L.cols)].reverse().join(''); return s; };
    const list: Round[] = distinct(rounds(api), () => {
      let left = '', right = '';
      for (let t = 0; t < 40 && (!left || mirror(left) === left || !/[1-2]/.test(left) || /^[1-2]+$/.test(left)); t++) left = range(1, L.rows * L.cols).map(() => String(Math.random() < .5 ? 0 : pick(1, L.cols2))).join('');
      right = mirror(left);
      const flip = (code: string) => { const i = pick(0, code.length - 1); return code.slice(0, i) + (code[i] === '0' ? '1' : '0') + code.slice(i + 1); };
      const wrong = new Set<string>([left]); for (let t = 0; t < 30 && wrong.size < 4; t++) { const w = flip(right); if (w !== right) wrong.add(w); }
      return {
        ask: ['Which half makes both sides match, like a mirror?', 'Nửa nào làm hai bên giống nhau như soi gương?'],
        answer: right, others: [...wrong].filter(v => v !== right).slice(0, wrongs(api)), label: v => half(v, L.cols, L.rows, ''),
        draw: stage => { const row = el('div', 'mx-row'); row.innerHTML = half(left, L.cols, L.rows, 'r') + `<svg class="mx-art" viewBox="0 0 ${L.cols * S + 4} ${L.rows * S + 4}" width="${L.cols * S * .9 + 4}" height="${L.rows * S * .9 + 4}" aria-hidden="true"><rect x="2" y="2" width="${L.cols * S}" height="${L.rows * S}" fill="#fff6e4" stroke="${OUT}" stroke-width="2" stroke-dasharray="5 4"/>${numText(L.cols * S / 2 + 2, L.rows * S / 2 + 2, '?', 30, '#e8433a')}</svg>`; stage.appendChild(row); }
      };
    });
    return play(api, list, ['Make both sides the same, like a butterfly!', 'Làm hai bên giống nhau, như cánh bướm nhé!'], ['Your pictures are perfectly balanced!', 'Hình của bé cân đối thật đẹp!']);
  }
});

// ---------- Heavier or Lighter: read the balance ----------
const THINGS: [string, number][] = [['🪶', 1], ['🎈', 1], ['🍓', 2], ['🍎', 3], ['🐭', 3], ['🧸', 4], ['🐱', 6], ['🍉', 8], ['🐶', 9], ['🧱', 10], ['🪨', 12], ['🐘', 30]];
const WEIGH: Record<string, [string, string]> = {
  heavier: ['Which one is heavier?', 'Vật nào nặng hơn?'], lighter: ['Which one is lighter?', 'Vật nào nhẹ hơn?'],
  heaviest: ['Which one is the heaviest?', 'Vật nào nặng nhất?'], lightest: ['Which one is the lightest?', 'Vật nào nhẹ nhất?']
};
// a balance with a left and a right thing (HTML in each pan); down: the side that goes down
const balance = (a: string, b: string, down: 'l' | 'r', small = false) => {
  // the beam turns about its middle; each pan hangs straight down from its end, the heavy side lower
  const w = small ? 150 : 260, sc = w / 260, h = 170 * sc, drop = Math.sin(12 * Math.PI / 180) * 100, yl = 40 + (down === 'l' ? drop : -drop), yr = 40 + (down === 'l' ? -drop : drop);
  const box = el('div', ''); box.style.cssText = `position:relative;width:${w}px;height:${h}px;flex:none`;
  const panSVG = (x: number, y: number) => `<path d="M${x} ${y}l-24 50h48z" fill="#ffd23f" stroke="${OUT}" stroke-width="3" stroke-linejoin="round"/>`;
  box.innerHTML = svgBox(260, 170, `<path d="M130 40v110M100 160h60" stroke="${OUT}" stroke-width="6" stroke-linecap="round"/><path d="M130 150l-22 14h44z" fill="#b07a4a" stroke="${OUT}" stroke-width="3"/>` +
    `<path d="M30 ${yl}L230 ${yr}" stroke="${OUT}" stroke-width="6" stroke-linecap="round"/>${panSVG(30, yl)}${panSVG(230, yr)}<circle cx="130" cy="40" r="7" fill="#e8433a" stroke="${OUT}" stroke-width="3"/>`, '');
  (box.firstElementChild as HTMLElement).style.cssText = 'width:100%;height:100%';
  const item = small ? 26 : 44, pw = small ? 44 : 64;
  const pan = (html: string, side: 'l' | 'r') => { const p = el('div', ''); p.innerHTML = html; p.className = 'mx-pan' + (small ? ' small' : '');
    const x = (side === 'l' ? 30 : 230) * sc, y = ((side === 'l' ? yl : yr) + 50) * sc - item - (small ? 2 : 12);
    p.style.cssText = `position:absolute;top:${y}px;left:${x - pw / 2}px;width:${pw}px;display:flex;justify-content:center`; box.appendChild(p); return p.firstElementChild as HTMLElement; };
  return { box, l: pan(a, 'l'), r: pan(b, 'r') };
};
register({
  id: 'mx_heavy', learn: true, icon: 'mx:heavy', name: () => T('Heavier or Lighter', 'Nặng Hay Nhẹ'),
  run: api => {
    // (levels) Easy: one balance, which is heavier; Medium: heavier or lighter; Hard: two balances and three things, which is
    // the heaviest; Talent: the same with three boxes that look alike, so only the balances tell
    const L = lv(api, { two: false, asks: ['heavier'] }, { two: false, asks: ['heavier', 'lighter'] }, { two: true, boxes: false, asks: ['heaviest', 'lightest'] }, { two: true, boxes: true, asks: ['heaviest', 'lightest'] });
    api.stage.dataset.lv = `${L.two ? 3 : 2},${L.boxes ? 1 : 0},${L.asks.length}`;
    const BOX = ['#e8433a', '#3b6fe0', '#43c463', '#ffd23f'];
    const boxSVG = (c: string) => `<svg class="mx-art" viewBox="0 0 48 48" width="44" height="44" aria-hidden="true"><path d="M8 18l16-8 16 8v20l-16 8-16-8z" fill="${c}" stroke="${OUT}" stroke-width="2.6" stroke-linejoin="round"/><path d="M8 18l16 8 16-8M24 26v20" stroke="${OUT}" stroke-width="2.2" fill="none"/></svg>`;
    const list: Round[] = distinct(rounds(api), () => {
      const ask = L.asks[pick(0, L.asks.length - 1)];
      if (!L.two) {
        let [a, b] = mix(THINGS).slice(0, 2); while (a[1] === b[1]) b = THINGS[pick(0, THINGS.length - 1)];
        const want = ask === 'heavier' ? (a[1] > b[1] ? 'a' : 'b') : (a[1] < b[1] ? 'a' : 'b');
        return { ask: WEIGH[ask], key: ask, right: e => e.dataset.k === want, draw: stage => {
          const B = balance(`<button data-k="a">${pic(a[0])}</button>`, `<button data-k="b">${pic(b[0])}</button>`, a[1] > b[1] ? 'l' : 'r'); stage.appendChild(B.box); return [B.l, B.r]; } };
      }
      // three things, heaviest first; two balances show a > b and b > c (in a random order and side)
      const three = L.boxes ? mix(BOX).slice(0, 3).map((c, i) => [boxSVG(c), 3 - i] as [string, number]) : (() => { const t = mix(THINGS.filter(x => x[1] > 1 && x[1] < 30)); const out = [t[0]]; for (const x of t) if (out.length < 3 && out.every(o => o[1] !== x[1])) out.push(x); return out.sort((p, q) => q[1] - p[1]).map(x => [pic(x[0]), x[1]] as [string, number]); })();
      const want = ask === 'heaviest' ? '0' : '2';
      return { ask: WEIGH[ask], key: ask, answer: want, others: ['0', '1', '2'].filter(v => v !== want), label: v => three[+v][0],
        draw: stage => { const row = el('div', 'mx-row'); for (const [p, q] of mix([[0, 1], [1, 2]])) { const sw = Math.random() < .5, B = balance(three[sw ? q : p][0], three[sw ? p : q][0], sw ? 'r' : 'l', true); row.appendChild(B.box); } stage.appendChild(row); } };
    });
    return play(api, list, ['The heavy side of a balance goes down!', 'Bên nặng của cái cân sẽ chúc xuống!'], ['You can read a balance!', 'Bé đọc cân thật giỏi!']);
  }
});

// ---------- Full or Empty: how much is in each glass? ----------
const FILL: Record<string, [string, string]> = {
  full: ['Which glass is full?', 'Cốc nào đầy?'], empty: ['Which glass is empty?', 'Cốc nào rỗng?'], half: ['Which glass is half full?', 'Cốc nào đầy một nửa?'],
  most: ['Which glass has the most water?', 'Cốc nào có nhiều nước nhất?'], least: ['Which glass has the least water?', 'Cốc nào có ít nước nhất?']
};
const glass = (v: number) => `<svg class="mx-art" viewBox="0 0 60 92" width="54" height="84" aria-hidden="true"><defs><clipPath id="mx-glass"><path d="M8 16h44l-5 70H13z"/></clipPath></defs><path d="M8 16h44l-5 70H13z" fill="#e8f6ff"/>${v > 0 ? `<rect x="0" y="${86 - 64 * v}" width="60" height="${64 * v + 2}" fill="#5fb6ff" clip-path="url(#mx-glass)"/>` : ''}<path d="M8 16h44l-5 70H13z" fill="none" stroke="${OUT}" stroke-width="3" stroke-linejoin="round"/></svg>`;
register({
  id: 'mx_full', learn: true, icon: 'mx:full', name: () => T('Full or Empty', 'Đầy Hay Rỗng'),
  run: api => {
    // (levels) Easy: a full and an empty glass; Medium: three, with a half; Hard: four, the most or the least; Talent: five, any question
    const L = lv(api, { n: 2, asks: ['full', 'empty'] }, { n: 3, asks: ['full', 'empty', 'half'] }, { n: 4, asks: ['most', 'least', 'half'] }, { n: 5, asks: ['most', 'least', 'half', 'full', 'empty'] });
    api.stage.dataset.lv = `${L.n},${L.asks.length}`;
    const list: Round[] = distinct(rounds(api), () => {
      const ask = L.asks[pick(0, L.asks.length - 1)];
      // every glass a different level; the right one is the full, empty or half one, or the most or least water
      const target = ({ full: 1, empty: 0, half: .5 })[ask];
      const all = [0, .2, .35, .5, .65, .8, 1], pool = target === undefined ? mix(all).slice(0, L.n) : [target, ...(L.n <= 2 ? [target ? 0 : 1] : mix(all.filter(v => v !== target)).slice(0, L.n - 1))];
      const rightV = target ?? (ask === 'most' ? Math.max(...pool) : Math.min(...pool));
      const levels = mix(pool.map(v => ({ v, i: v === rightV ? 0 : 1 })));
      return { ask: FILL[ask], key: ask, right: e => e.dataset.k === '0', draw: stage => {
        const row = el('div', 'mx-row'); const things = levels.map(({ v, i }) => { const b = el('button', '', glass(v)); b.dataset.k = String(i); row.appendChild(b); return b; }); stage.appendChild(row); return things; } };
    });
    return play(api, list, ['Look at the water in each glass!', 'Nhìn nước trong từng cốc nhé!'], ['Full, empty, half: you know them all!', 'Đầy, rỗng, một nửa: bé biết hết rồi!']);
  }
});

// ---------- Pizza Fractions ----------
const PART: Record<string, [string, string]> = {
  '1/2': ['Which pizza has one half left?', 'Bánh nào còn lại một phần hai?'], '1/3': ['Which pizza has one third left?', 'Bánh nào còn lại một phần ba?'],
  '1/4': ['Which pizza has one quarter left?', 'Bánh nào còn lại một phần tư?'], '2/3': ['Which pizza has two thirds left?', 'Bánh nào còn lại hai phần ba?'],
  '3/4': ['Which pizza has three quarters left?', 'Bánh nào còn lại ba phần tư?']
};
// a pizza cut into n slices, k of them still there (the rest eaten: a dashed outline); equal: false cuts one slice bigger
const pizza = (n: number, k: number, equal = true, size = 54) => {
  let s = ''; const cuts = equal ? range(0, n).map(i => i / n) : ({ 3: [0, .2, .55, 1], 4: [0, .15, .4, .7, 1] }[n] || [0, .32, 1]);
  for (let i = 0; i < cuts.length - 1; i++) {
    const a0 = cuts[i] * 2 * Math.PI - Math.PI / 2, a1 = cuts[i + 1] * 2 * Math.PI - Math.PI / 2, big = cuts[i + 1] - cuts[i] > .5 ? 1 : 0, on = i < k;
    const p = (a: number) => `${(30 + Math.cos(a) * 26).toFixed(1)} ${(30 + Math.sin(a) * 26).toFixed(1)}`;
    const d = cuts.length === 2 ? `M30 4a26 26 0 1 1 -0.01 0z` : `M30 30L${p(a0)}A26 26 0 ${big} 1 ${p(a1)}z`;
    s += `<path d="${d}" fill="${on ? '#ffcf6b' : '#fff6e4'}" stroke="${OUT}" stroke-width="2.4" ${on ? '' : 'stroke-dasharray="4 3"'}/>`;
    if (on) { const m = (a0 + a1) / 2; s += `<circle cx="${(30 + Math.cos(m) * 15).toFixed(1)}" cy="${(30 + Math.sin(m) * 15).toFixed(1)}" r="3.6" fill="#e8433a"/>`; }
  }
  return `<svg class="mx-art" viewBox="0 0 60 60" width="${size}" height="${size}" aria-hidden="true">${s}</svg>`;
};
register({
  id: 'mx_pizza', learn: true, icon: 'mx:pizza', name: () => T('Pizza Fractions', 'Phân Số Bánh Pizza'),
  run: api => {
    // (levels) Easy: which is cut into equal halves; Medium: a half, a third or a quarter left; Hard: also two thirds and three
    // quarters; Talent: what fraction is left, written as a fraction
    const L = lv(api, { mode: 'halves', fr: ['1/2'] }, { mode: 'find', fr: ['1/2', '1/3', '1/4'] }, { mode: 'find', fr: ['1/2', '1/3', '1/4', '2/3', '3/4'] }, { mode: 'name', fr: ['1/2', '1/3', '1/4', '2/3', '3/4', '3/8', '5/6', '2/4'] });
    api.stage.dataset.lv = `${L.mode},${L.fr.length}`;
    const pz = (f: string, size?: number) => { const [k, n] = f.split('/').map(Number); return pizza(n, k, true, size); };
    const list: Round[] = distinct(rounds(api), () => {
      // (v1.08 variety) Easy: two, three or four friends share, so the pizza is cut into that many equal parts; the wrong
      // ones are cut unfairly, not cut, or cut for another number of friends
      if (L.mode === 'halves') {
        const n = pick(2, 4), other = n === 2 ? 4 : 2;
        const EQ: Record<number, [string, string]> = { 2: ['Which pizza is cut into two equal halves?', 'Bánh nào được cắt thành hai nửa bằng nhau?'], 3: ['Which pizza is cut into three equal parts?', 'Bánh nào được cắt thành ba phần bằng nhau?'], 4: ['Which pizza is cut into four equal parts?', 'Bánh nào được cắt thành bốn phần bằng nhau?'] };
        const NOTE: Record<number, [string, string]> = { 2: ['Two friends share fairly.', 'Hai bạn chia đều nhau.'], 3: ['Three friends share fairly.', 'Ba bạn chia đều nhau.'], 4: ['Four friends share fairly.', 'Bốn bạn chia đều nhau.'] };
        return { ask: EQ[n], key: 'halves', answer: 'eq', others: mix(['un', 'whole', 'other']).slice(0, wrongs(api)),
          label: v => v === 'eq' ? pizza(n, n) : v === 'un' ? pizza(n, n, false) : v === 'other' ? pizza(other, other) : pizza(1, 1), draw: stage => { stage.appendChild(el('div', 'mx-note', pic('🍕') + ' ' + T(...NOTE[n]))); } };
      }
      const f = L.fr[pick(0, L.fr.length - 1)];
      if (L.mode === 'find') return { ask: PART[f], key: f, answer: f, others: othersFrom(f, L.fr.length > 3 ? L.fr : [...L.fr, '3/4'], wrongs(api)), label: v => pz(v), draw: stage => { stage.appendChild(el('div', 'mx-big', f.replace('/', '<small>/</small>'))); } };
      const [k, n] = f.split('/').map(Number), wrong = mix([`${n - k}/${n}`, `${k}/${n + 1}`, `${n}/${k}`, `${k + 1}/${n}`].filter(v => v !== f && !v.startsWith('0') && !/\/0$/.test(v)));
      return { ask: ['What fraction of the pizza is left?', 'Phần bánh còn lại là mấy phần mấy?'], key: f, answer: f, others: [...new Set(wrong)].slice(0, wrongs(api)), draw: stage => { stage.insertAdjacentHTML('beforeend', pz(f, 150)); } };
    });
    return play(api, list, ['Share the pizza in equal slices!', 'Chia bánh pizza thành các phần bằng nhau nào!'], ['You are a fractions chef!', 'Bé là đầu bếp phân số tài ba!']);
  }
});

// ---------- Picture Graph ----------
const GRAPH_FRUIT: [string, [string, string]][] = [['🍎', ['How many apples are there?', 'Có bao nhiêu quả táo?']], ['🍌', ['How many bananas are there?', 'Có bao nhiêu quả chuối?']], ['🍓', ['How many strawberries are there?', 'Có bao nhiêu quả dâu?']], ['🍇', ['How many bunches of grapes are there?', 'Có bao nhiêu chùm nho?']]];
register({
  id: 'mx_graph', learn: true, icon: 'mx:graph', name: () => T('Picture Graph', 'Biểu Đồ Tranh'),
  run: api => {
    // (levels) Easy: two columns, which has the most; Medium: three, most or fewest; Hard: four, how many of one fruit;
    // Talent: four, how many more in the tallest column than in the shortest
    const L = lv(api, { cols: 2, asks: ['most'], max: 5 }, { cols: 3, asks: ['most', 'fewest'], max: 6 }, { cols: 4, asks: ['count', 'most'], max: 7 }, { cols: 4, asks: ['diff', 'count'], max: 8 });
    api.stage.dataset.lv = `${L.cols},${L.max},${L.asks.join('+')}`;
    const list: Round[] = distinct(rounds(api), () => {
      const fruit = GRAPH_FRUIT.slice(0, L.cols), counts = mix(range(1, L.max)).slice(0, L.cols), ask = L.asks[pick(0, L.asks.length - 1)];
      const hi = counts.indexOf(Math.max(...counts)), lo = counts.indexOf(Math.min(...counts)), which = pick(0, L.cols - 1);
      const graph = (stage: HTMLElement, tap: boolean) => {
        const g = el('div', 'mx-row'); g.style.alignItems = 'flex-end';
        const things = fruit.map(([f], i) => { const col = el(tap ? 'button' : 'div', '', ''); col.style.cssText = 'display:flex;flex-direction:column-reverse;align-items:center;gap:0;border-bottom:4px solid #3b2a4f;padding:2px 4px;min-width:' + (api.little ? 64 : 56) + 'px';   // (v1.08b fivescreens) 64 px for under-5s
          col.dataset.k = String(i); for (let j = 0; j < counts[i]; j++) col.insertAdjacentHTML('beforeend', pic(f, 'mx-cell')); g.appendChild(col); return col; });
        stage.appendChild(g); stage.querySelectorAll('.mx-cell').forEach((e: Element) => { (e as HTMLElement).style.cssText = 'width:30px;height:30px;flex:none'; }); return things;
      };
      if (ask === 'most' || ask === 'fewest') return { ask: ask === 'most' ? ['Which fruit has the most?', 'Loại quả nào nhiều nhất?'] : ['Which fruit has the fewest?', 'Loại quả nào ít nhất?'], key: ask, right: e => +e.dataset.k === (ask === 'most' ? hi : lo), draw: stage => graph(stage, true) };
      if (ask === 'count') return { ask: fruit[which][1], key: 'count', answer: String(counts[which]), others: near(counts[which], 1, L.max, wrongs(api)), draw: stage => { graph(stage, false); } };
      const d = counts[hi] - counts[lo];
      return { ask: ['How many more in the tallest column than in the shortest?', 'Cột cao nhất nhiều hơn cột thấp nhất mấy quả?'], key: 'diff', answer: String(d), others: near(d, 0, L.max, wrongs(api)), draw: stage => { graph(stage, false); } };
    });
    return play(api, list, ['Read the picture graph!', 'Cùng đọc biểu đồ tranh nào!'], ['You read graphs like a scientist!', 'Bé đọc biểu đồ như nhà khoa học!']);
  }
});

// ---------- Calendar ----------
const DAYS: [string, string][] = [['Mon', 'T2'], ['Tue', 'T3'], ['Wed', 'T4'], ['Thu', 'T5'], ['Fri', 'T6'], ['Sat', 'T7'], ['Sun', 'CN']];
const MONTHS: [string, string][] = [['Jan', 'Th1'], ['Feb', 'Th2'], ['Mar', 'Th3'], ['Apr', 'Th4'], ['May', 'Th5'], ['Jun', 'Th6'], ['Jul', 'Th7'], ['Aug', 'Th8'], ['Sep', 'Th9'], ['Oct', 'Th10'], ['Nov', 'Th11'], ['Dec', 'Th12']];
const CAL: Record<string, [string, string]> = {
  tomorrow: ['The star is today. Which day is tomorrow?', 'Ngôi sao là hôm nay. Ngày mai là thứ mấy?'], yesterday: ['The star is today. Which day was yesterday?', 'Ngôi sao là hôm nay. Hôm qua là thứ mấy?'],
  week: ['The circle is today. What date is it one week later?', 'Vòng tròn là hôm nay. Một tuần sau là ngày mấy?'], twoweeks: ['The circle is today. What date is it two weeks later?', 'Vòng tròn là hôm nay. Hai tuần sau là ngày mấy?'],
  nextmonth: ['The star is this month. Which month comes next?', 'Ngôi sao là tháng này. Tháng tiếp theo là tháng mấy?'], lastmonth: ['The star is this month. Which month came before?', 'Ngôi sao là tháng này. Tháng trước là tháng mấy?']
};
register({
  id: 'mx_calendar', learn: true, icon: 'mx:calendar', name: () => T('Calendar', 'Lịch'),
  run: api => {
    // (levels) Easy: the week, tomorrow; Medium: tomorrow or yesterday; Hard: a month page, one week later; Talent: two weeks
    // later, or the months of the year
    const L = lv(api, { asks: ['tomorrow'] }, { asks: ['tomorrow', 'yesterday'] }, { asks: ['week', 'tomorrow', 'yesterday'] }, { asks: ['twoweeks', 'week', 'nextmonth', 'lastmonth'] });
    api.stage.dataset.lv = L.asks.join('+');
    // (v1.08b fivescreens) an under-5's day and month cards are 64 px, a finger's size for them
    const cellCss = `min-width:${api.little ? 64 : 44}px;min-height:${api.little ? 64 : 52}px;` + 'border:2px solid #3b2a4f;border-radius:10px;background:#fff;font:800 15px var(--font,sans-serif);color:#3b2a4f;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:0 2px';
    const list: Round[] = distinct(rounds(api), () => {
      const ask = L.asks[pick(0, L.asks.length - 1)];
      if (ask === 'tomorrow' || ask === 'yesterday') {
        const today = pick(1, 5), want = ask === 'tomorrow' ? today + 1 : today - 1;
        return { ask: CAL[ask], key: ask, right: e => +e.dataset.k === want, draw: stage => {
          const row = el('div', 'mx-row'); row.style.gap = '3px'; const things = DAYS.map(([en, vi], i) => { const b = el('button', '', `${i === today ? pic('⭐') : ''}<b>${T(en, vi)}</b>`); b.style.cssText = cellCss + (i === today ? ';background:#fff6b0' : ''); b.dataset.k = String(i); b.querySelector('.art')?.setAttribute('style', 'width:20px;height:20px'); row.appendChild(b); return b; });
          stage.appendChild(row); return things; } };
      }
      if (ask === 'nextmonth' || ask === 'lastmonth') {
        const m = pick(0, 11), want = (m + (ask === 'nextmonth' ? 1 : 11)) % 12;
        return { ask: CAL[ask], key: ask, right: e => +e.dataset.k === want, draw: stage => {
          const grid = el('div', 'mx-row'); grid.style.cssText = 'display:grid;grid-template-columns:repeat(4,1fr);gap:4px'; const things = MONTHS.map(([en, vi], i) => { const b = el('button', '', `${i === m ? pic('⭐') : ''}<b>${T(en, vi)}</b>`); b.style.cssText = cellCss + (i === m ? ';background:#fff6b0' : ''); b.dataset.k = String(i); b.querySelector('.art')?.setAttribute('style', 'width:18px;height:18px'); grid.appendChild(b); return b; });
          stage.appendChild(grid); return things; } };
      }
      const add = ask === 'week' ? 7 : 14, len = pick(28, 31), today = pick(1, len - add), start = pick(0, 6);
      return { ask: CAL[ask], key: ask, answer: String(today + add), others: mix([today + add - 1, today + add + 1, today + 1, today + add + 7].filter(v => v !== today + add && v <= len).map(String)).slice(0, wrongs(api)), draw: stage => {
        let s = DAYS.map(([en, vi], i) => numText(18 + i * 34, 12, T(en, vi), 11)).join('');
        for (let d = 1; d <= len; d++) { const c = (start + d - 1) % 7, r = Math.floor((start + d - 1) / 7); s += numText(18 + c * 34, 34 + r * 26, d, 14) + (d === today ? `<circle cx="${18 + c * 34}" cy="${34 + r * 26}" r="12" fill="none" stroke="#e8433a" stroke-width="3"/>` : ''); }
        stage.insertAdjacentHTML('beforeend', svgBox(240, 34 + 6 * 26, `<rect x="1" y="1" width="238" height="${32 + 6 * 26}" rx="10" fill="#fff" stroke="${OUT}" stroke-width="2"/>` + s));
      } };
    });
    return play(api, list, ['Let us read the calendar!', 'Cùng xem lịch nào!'], ['Days, dates and months: well done!', 'Thứ, ngày và tháng: bé giỏi lắm!']);
  }
});
