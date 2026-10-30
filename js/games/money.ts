// The money games (round S, owner plan 8 Oct, item 7): ten games in the child's home currency, chosen in Grown-ups
// (settings.currency: Australian dollars or Vietnamese đồng; VND uses notes only). Game coins only, never real money.
// Under-5s get small numbers and pictures and can never lose; Easy · Medium · Hard (api.level) make the sums bigger.
// The sums themselves (change, totals, cheaper, jars, growing, fair trades) are in ./moneylogic.js, unit-tested.
import { register, untilRight, choiceButtons, HINT_AFTER } from './frame.js';
import { T } from '../i18n.js';
import { settings } from '../state.js';
import { fmtMinor, spokenMinor, curCode } from '../money.js';
import { pic } from '../art.js';
import { shuffle, pick, el, wait } from '../util.js';
import * as M from './moneylogic.js';

// ---------- shared pieces ----------
const home = () => M.CODES.includes(curCode()) ? curCode() : 'AUD';
// 0 (youngest) … 4 (hardest): under-5s stay on the first two steps (owner: small numbers for little ones)
const step = api => api.little ? Math.min(1, api.level - 1) : Math.min(4, Math.max(0, api.level - 1));
const fmt = (v, code) => fmtMinor(v, code);
const sp = (v, code) => [spokenMinor(v, 'en', code), spokenMinor(v, 'vi', code)];
// "3 coins" (AUD) or "3 notes" (VND: notes only)
const pieces = (n, code) => code === 'VND' ? [`${n} ${n === 1 ? 'note' : 'notes'}`, `${n} tờ tiền`] : [`${n} ${n === 1 ? 'coin' : 'coins'}`, `${n} đồng xu`];
const cap = s => s.charAt(0).toUpperCase() + s.slice(1);
// a coin or note picture (notes are cropped to their own shape so they sit at the same height as coins)
const cash = (code, v) => { const d = M.denom(code, v), a = pic(M.artKey(code, v)); return `<span class="mg-cash ${d ? d.kind : 'coin'}">${d && d.kind === 'note' ? a.replace('viewBox="0 0 48 48"', 'viewBox="0 9 48 30"') : a}</span>`; };
const unitOf = code => code === 'VND' ? 10000 : 100;   // one "coin" in the jars and the money tree: $1 or 10.000đ
const later = (api, f, ms) => { const t = setTimeout(f, ms); api.onCleanup(() => clearTimeout(t)); };

// the money games' own look (kept here so no shared stylesheet changes); added once, the first time one opens
let styled = false;
function style() {
  if (styled) return; styled = true;
  document.head.appendChild(el('style', '', `
.mg-row { display: flex; flex-wrap: wrap; gap: 8px; justify-content: center; align-items: center; max-width: 96vw; }
.mg-cash { display: inline-flex; width: 60px; height: 60px; } .mg-cash.note { width: 96px; height: 60px; } .mg-cash svg.art { width: 100%; height: 100%; }
.mg-pay, .mg-in, .mg-jar, .mg-env, .mg-go, .mg-shelf button { border: 0; background: rgba(255, 255, 255, .9); border-radius: 16px; min-width: 48px; min-height: 48px; padding: 4px 6px; cursor: pointer; box-shadow: 0 5px 0 rgba(90, 60, 130, .18); font: inherit; color: #2a2a3a; }
.gl.little .mg-pay, .gl.little .mg-in, .gl.little .mg-jar, .gl.little .mg-env, .gl.little .mg-go, .gl.little .mg-shelf button { min-width: 72px; min-height: 72px; }
.mg-pay.hint, .mg-jar.hint, .mg-shelf button.hint { animation: hintWiggle 1.2s ease-in-out infinite; outline: 5px solid #ffd23f; outline-offset: 3px; }
body.calm .mg-pay.hint, body.calm .mg-jar.hint, body.calm .mg-shelf button.hint { animation: none; }
@media (prefers-reduced-motion: reduce) { .mg-pay.hint, .mg-jar.hint, .mg-shelf button.hint { animation: none; } }
.mg-tray { display: flex; flex-wrap: wrap; gap: 4px; justify-content: center; align-items: center; min-height: 72px; min-width: min(300px, 90vw); max-width: 94vw; padding: 6px; border: 3px dashed rgba(90, 60, 130, .3); border-radius: 18px; background: rgba(255, 255, 255, .6); }
.mg-in { background: transparent; box-shadow: none; padding: 0; } .mg-in .mg-cash { width: 48px; height: 48px; } .mg-in .mg-cash.note { width: 76px; height: 48px; }
.mg-sum { font-size: clamp(18px, 4vw, 24px); font-weight: 800; color: #5a2f8a; text-align: center; }
.mg-big { font-size: clamp(90px, 22vw, 150px); line-height: 1; display: inline-flex; transition: transform .35s; }
.mg-big .mg-cash { width: 120px; height: 120px; } .mg-big .mg-cash.note { width: 192px; height: 120px; }
.mg-tag { display: inline-block; background: #fff6b0; border: 2px solid #3b2a4f; border-radius: 10px; padding: 2px 10px; font-weight: 900; font-size: clamp(18px, 4.6vw, 24px); color: #3b2a4f; white-space: nowrap; }
.mg-card { flex-direction: column; gap: 4px; width: auto !important; min-width: clamp(110px, 30vw, 170px); height: auto !important; min-height: clamp(110px, 30vw, 170px); padding: 8px; }
.mg-card .mg-pic { font-size: clamp(54px, 13vw, 80px); line-height: 1; display: inline-flex; }
.mg-card small { font-size: 16px; } .mg-card .mg-cash { width: 40px; height: 40px; } .mg-card .mg-cash.note { width: 64px; height: 40px; }
.mg-amt { width: auto !important; min-width: 110px; height: auto !important; min-height: 80px; padding: 8px 14px; }
.mg-jar { display: flex; flex-direction: column; align-items: center; gap: 2px; width: clamp(96px, 28vw, 150px); }
.mg-jar .mg-pic { font-size: clamp(54px, 13vw, 76px); line-height: 1; display: inline-flex; } .mg-jar b { font-size: 17px; } .mg-jar small { font-size: 15px; font-weight: 800; }
.mg-jar .mg-coins { display: flex; flex-wrap: wrap; justify-content: center; gap: 1px; min-height: 22px; font-size: 20px; }
.mg-env { font-size: clamp(56px, 14vw, 80px); line-height: 1; display: inline-flex; flex-direction: column; align-items: center; background: transparent; box-shadow: none; }
.mg-env.open { opacity: .45; } .mg-env .mg-row { gap: 2px; } .mg-env .mg-cash { width: 40px; height: 40px; } .mg-env .mg-cash.note { width: 64px; height: 40px; }
.mg-tet { font-size: 40px; display: flex; gap: 18px; justify-content: space-between; width: min(320px, 90vw); margin: 0 auto; }
.mg-list { display: flex; gap: 10px; padding: 8px 14px; background: #fffbe8; border: 2px solid #c9a05a; border-radius: 14px; font-size: clamp(36px, 9vw, 50px); }
.mg-list .done { opacity: .35; }
.mg-shelf { display: flex; flex-wrap: wrap; gap: 10px; justify-content: center; max-width: 96vw; }
.mg-shelf button { display: flex; flex-direction: column; align-items: center; gap: 2px; font-size: clamp(40px, 10vw, 56px); line-height: 1; }
.mg-shelf button.big .art { transform: scale(1.2); } .mg-shelf button.gone { visibility: hidden; }
.mg-go { font-size: 22px; font-weight: 800; padding: 10px 22px; display: inline-flex; align-items: center; gap: 8px; } .mg-go .art { font-size: 40px; }
.mg-dots { color: #e6a400; font-size: 18px; letter-spacing: 1px; }
.mg-many { gap: 3px; } .mg-many .mg-cash { width: 30px; height: 30px; } .mg-many .mg-cash.note { width: 48px; height: 30px; }
.mg-card .mg-row { max-width: 150px; gap: 2px; } .mg-card .mg-many .mg-cash { width: 26px; height: 26px; } .mg-card .mg-many .mg-cash.note { width: 42px; height: 26px; }
`));
}

// tap coins or notes from the purse into the tray until they add up to `want` (Heo Đất, Bé Bán Hàng). Too much is
// gently refused (nothing is lost); an under-5 who waits or misses twice sees the next right one wiggle.
function fill(api, { code, vals, want, tray, purse, show, onAdd = undefined as ((sum: number) => void) | undefined }) {
  return new Promise<boolean>(res => {
    let sum = 0, misses = 0, t: ReturnType<typeof setTimeout> | number = 0, fin = false;
    const done = ok => { if (fin) return; fin = true; clearTimeout(t); res(ok); };
    api.onCleanup(() => done(false));
    const btns = vals.map(v => { const b = el('button', 'mg-pay', cash(code, v)); b._v = v; b.setAttribute('aria-label', fmt(v, code)); purse.appendChild(b); return b; });
    const hint = () => { if (api.closed || fin) return; const need = M.makeChange(want - sum, code, vals), b = need && btns.find(x => x._v === need[0]); btns.forEach(x => x.classList.remove('hint')); if (b) b.classList.add('hint'); };
    const arm = () => { clearTimeout(t); if (api.little) t = setTimeout(hint, misses >= 2 ? 0 : HINT_AFTER); };
    // (r89) auto play pays like the hint: the next coin or note that still makes the amount exactly
    api.plan(() => { if (fin) return null; const need = M.makeChange(want - sum, code, vals); return need ? btns.find(x => x._v === need[0]) : null; },
      { maxActions: Math.ceil(want / Math.min(...vals)) + 4 });
    btns.forEach(b => b.onclick = () => {
      if (api.closed || fin) return;
      if (sum + b._v > want) { misses++; api.wrong(b, 'That is too much. Try a smaller one.', 'Nhiều quá rồi. Thử tiền nhỏ hơn nhé.'); arm(); return; }
      sum += b._v; api.sfx.coin(); btns.forEach(x => x.classList.remove('hint'));
      const m = el('button', 'mg-in', cash(code, b._v)); m._v = b._v; m.setAttribute('aria-label', fmt(b._v, code));
      m.onclick = () => { if (fin) return; sum -= m._v; m.remove(); api.sfx.tap(); show && show(sum); arm(); };
      tray.appendChild(m); show && show(sum); onAdd && onAdd(sum);
      if (sum === want) { api.right(tray); done(true); } else arm();
    });
    show && show(0); arm();
  });
}

const SHOP = [['🍌', 'bananas', 'chuối'], ['🥭', 'a mango', 'xoài'], ['🍞', 'bread', 'bánh mì'], ['🍦', 'an ice cream', 'kem'], ['🧃', 'a juice', 'nước ép'], ['🍉', 'a watermelon', 'dưa hấu'],
  ['🌽', 'corn', 'bắp ngô'], ['🍎', 'an apple', 'táo'], ['🥛', 'milk', 'sữa'], ['🥚', 'eggs', 'trứng'], ['🥕', 'carrots', 'cà rốt'], ['🧸', 'a teddy', 'gấu bông'], ['🎈', 'a balloon', 'bóng bay'], ['🍭', 'a lollipop', 'kẹo mút']];

// ---------- 1. Heo Đất: feed the piggy bank, watch it grow, count ----------
const PIGGY = {
  AUD: [[[100], 2, 4, 100], [[100], 3, 5, 100], [[100, 200], 300, 700, 100], [[50, 100, 200], 250, 800, 50], [[10, 20, 50, 100, 200, 500], 500, 1500, 10]],
  VND: [[[1000], 2, 4, 1000], [[1000], 3, 5, 1000], [[1000, 2000], 3000, 9000, 1000], [[1000, 2000, 5000], 6000, 20000, 1000], [[2000, 5000, 10000, 20000, 50000], 20000, 100000, 1000]]
};
register({
  id: 'heodat', icon: '🐷', origin: 'vn', name: () => T('Piggy Bank', 'Heo Đất'),
  async run(api) {
    style(); const code = home(), L = step(api), [vals, lo, hi, by] = PIGGY[code][L], rounds = 3, counting = L <= 1;
    let saved = 0;
    for (let r = 0; r < rounds; r++) {
      api.dots(rounds, r); api.stage.innerHTML = '';
      // little ones count one kind of coin; bigger ones save an amount from a few kinds
      let want; do { want = counting ? vals[0] * M.priceIn(lo, hi, 1) : M.priceIn(lo, hi, by); } while (!M.makeChange(want, code, vals));
      const pig = el('div', 'mg-big', pic('🐷')); pig.style.transform = `scale(${(1 + Math.min(.6, saved / (want * 4))).toFixed(2)})`;
      const tray = el('div', 'mg-tray'), sumEl = el('div', 'mg-sum'), purse = el('div', 'mg-row');
      api.stage.append(pig, sumEl, tray, purse);
      const n = want / vals[0], [pe, pv] = pieces(n, code), [we, wv] = sp(want, code);
      if (counting) api.say(`Feed the piggy ${pe}. Count them with me!`, `Cho heo đất ăn ${pv}. Đếm cùng nhé!`);
      else api.say(`Save ${we}. Tap the money to feed the piggy.`, `Hãy để dành ${wv}. Chạm vào tiền để cho heo ăn nhé.`);
      const show = s => { sumEl.textContent = counting ? `${s / vals[0]} / ${n}` : `${fmt(s, code)} / ${fmt(want, code)}`; pig.style.transform = `scale(${(1 + Math.min(.6, (saved + s) / (want * 4))).toFixed(2)})`; };
      const ok = await fill(api, { code, vals, want, tray, purse, show, onAdd: s => { if (counting) api.say(`${s / vals[0]}!`, `${s / vals[0]}!`); } });
      if (!ok || api.closed) return;
      saved += want; const [se, sv] = sp(saved, code);
      api.say(`Oink! The piggy has ${se} now.`, `Ụt ịt! Heo đất có ${sv} rồi.`); await wait(2200); if (api.closed) return;
    }
    api.dots(rounds, rounds);
    return api.win({ title: T('The piggy bank is full! A little at a time makes a lot.', 'Heo đất đầy rồi! Góp gió thành bão.'), titleVi: 'Heo đất đầy rồi! Góp gió thành bão.' });
  }
});

// ---------- 2. Coin or Note? (AUD) / Small change or big note? (VND, notes only: under 10.000 is "tiền lẻ") ----------
const SORT = { AUD: [[5, 20, 100, 200, 500, 1000, 2000], [5, 10, 20, 50, 100, 200, 500, 1000, 2000, 5000, 10000]], VND: [[1000, 2000, 5000, 20000, 50000, 100000], [1000, 2000, 5000, 10000, 20000, 50000, 100000, 200000, 500000]] };
register({
  id: 'coinnote', icon: '🪙', name: () => home() === 'VND' ? T('Small or Big Note?', 'Tiền Lẻ hay Tiền Chẵn?') : T('Coin or Note?', 'Xu hay Tiền Giấy?'),
  async run(api) {
    style(); const code = home(), L = step(api), rounds = [4, 4, 6, 8, 8][L], vnd = code === 'VND';
    const pool = SORT[code][L >= 2 ? 1 : 0], list = []; while (list.length < rounds) list.push(...shuffle(pool)); list.length = rounds;
    // the two boxes: coins and notes (AUD); small change and big notes (VND)
    const BINS = vnd ? [['small', 1000, 'Small change', 'Tiền lẻ'], ['big', 100000, 'Big note', 'Tiền chẵn']] : [['coin', 100, 'Coin', 'Đồng xu'], ['note', 1000, 'Note', 'Tiền giấy']];
    const kindOf = v => vnd ? (v < 10000 ? 'small' : 'big') : M.denom(code, v).kind;
    for (let r = 0; r < rounds; r++) {
      api.dots(rounds, r); api.stage.innerHTML = '';
      const v = list[r], show = el('div', 'mg-big', cash(code, v)); api.stage.appendChild(show);
      if (vnd) api.say('Is this small change or a big note?', 'Đây là tiền lẻ hay tiền chẵn?'); else api.say('Is this a coin or a note?', 'Đây là đồng xu hay tiền giấy?');
      const btns = choiceButtons(api, BINS, ([, s, en, vi]) => `<span class="mg-pic">${cash(code, s)}</span><small>${T(en, vi)}</small>`, 'choice mg-card');
      const b = await untilRight(api, btns, e => e._v[0] === kindOf(v)); if (!b) return;
      const [e1, v1] = sp(v, code), [, , en, vi] = b._v;
      api.say(`${en}: ${e1}.`, `${vi}: ${v1}.`); await wait(1500); if (api.closed) return;
    }
    api.dots(rounds, rounds);
    return api.win();
  }
});

// ---------- 3. Need or Want? ----------
const NEEDS = [['🍚', 'rice', 'cơm'], ['💧', 'water', 'nước uống'], ['🥛', 'milk', 'sữa'], ['🧥', 'a warm coat', 'áo ấm'], ['🪥', 'a toothbrush', 'bàn chải đánh răng'], ['🧼', 'soap', 'xà phòng'],
  ['🍎', 'fruit', 'trái cây'], ['🛏️', 'a bed', 'cái giường'], ['👕', 'clothes', 'quần áo'], ['🥦', 'vegetables', 'rau']];
const WANTS = [['🧸', 'a teddy', 'gấu bông'], ['🎮', 'a video game', 'trò chơi điện tử'], ['🍭', 'a lollipop', 'kẹo mút'], ['🎈', 'a balloon', 'bóng bay'], ['🍦', 'an ice cream', 'kem'],
  ['🪀', 'a yo-yo', 'con quay yo-yo'], ['🪁', 'a kite', 'con diều'], ['🍬', 'lollies', 'kẹo'], ['🎨', 'paints', 'màu vẽ']];
register({
  id: 'needwant', icon: '🤔', name: () => T('Need or Want?', 'Cần hay Muốn?'),
  async run(api) {
    style(); const L = step(api), rounds = [4, 5, 6, 6, 8][L];
    const list = shuffle([...shuffle(NEEDS).slice(0, Math.ceil(rounds / 2)).map(x => [...x, 'need']), ...shuffle(WANTS).slice(0, Math.floor(rounds / 2)).map(x => [...x, 'want'])]);
    for (let r = 0; r < rounds; r++) {
      api.dots(rounds, r); api.stage.innerHTML = '';
      const [ic, en, vi, kind] = list[r];
      api.stage.appendChild(el('div', 'mg-big', pic(ic)));
      api.say(`${cap(en)}: do we need it, or do we just want it?`, `${cap(vi)}: mình cần, hay chỉ muốn thôi?`);
      const btns = choiceButtons(api, [['need', '🏠', 'Need', 'Cần'], ['want', '🎁', 'Want', 'Muốn']], ([, p, e, v]) => `<span class="mg-pic">${pic(p)}</span><small>${T(e, v)}</small>`, 'choice mg-card');
      const b = await untilRight(api, btns, e => e._v[0] === kind); if (!b) return;
      if (kind === 'need') api.say(`We need ${en} to stay healthy and safe.`, `Mình cần ${vi} để khỏe mạnh và an toàn.`);
      else api.say(`${cap(en)} is fun, but we can live without it. A want!`, `${cap(vi)} thật vui, nhưng không có cũng không sao. Đó là điều mình muốn!`);
      await wait(2000); if (api.closed) return;
    }
    api.dots(rounds, rounds);
    return api.win({ title: T('Needs first, then wants!', 'Cần trước, muốn sau!'), titleVi: 'Cần trước, muốn sau!' });
  }
});

// ---------- 4. Ba Hũ: share what you earn between the Save, Spend and Share jars ----------
const JARS = [['🐷', 'Save', 'Để dành'], ['🛒', 'Spend', 'Tiêu'], ['🤝', 'Share', 'Chia sẻ']];
const JAR_PLAN: [number, number[][]][] = [[3, [[1, 1, 1]]], [6, [[1, 1, 1]]], [10, [[5, 3, 2]]], [10, [[5, 3, 2], [4, 4, 2], [6, 3, 1]]], [12, [[2, 1, 1]]]];
register({
  id: 'bahu', icon: '🫙', name: () => T('Three Jars', 'Ba Hũ'),
  async run(api) {
    style(); const code = home(), L = step(api), rounds = 3, u = unitOf(code), [n, partsList] = JAR_PLAN[L];
    for (let r = 0; r < rounds; r++) {
      api.dots(rounds, r); api.stage.innerHTML = '';
      const parts = pick(partsList), want = M.splitJars(n * u, parts, u), got = [0, 0, 0], same = parts.every(p => p === parts[0]);
      const pileEl = el('div', 'mg-row mg-many'); for (let k = 0; k < n; k++) pileEl.insertAdjacentHTML('beforeend', cash(code, u));
      const row = el('div', 'mg-row'), jars = JARS.map(([ic, en, vi], k) => { const b = el('button', 'mg-jar'); b.innerHTML = `<span class="mg-pic">${pic('🫙')}</span><b>${pic(ic)} ${T(en, vi)}</b><small></small><span class="mg-coins"></span>`; b._k = k; row.appendChild(b); return b; });
      const draw = () => jars.forEach((b, k) => { b.querySelector('small').textContent = same && L <= 1 ? `${got[k] / u}` : `${fmt(got[k], code)} / ${fmt(want[k], code)}`; b.querySelector('.mg-coins').innerHTML = Array.from({ length: got[k] / u }, () => pic(code === 'VND' ? 'vnd10000' : 'aud100')).join(''); });
      api.stage.append(pileEl, row); draw();
      const [te, tv] = sp(n * u, code), [pe, pv] = pieces(n, code), [a, b, c] = want.map(x => sp(x, code));
      if (same) api.say(`You earned ${pe}! Put the same in each jar: Save, Spend and Share.`, `Con kiếm được ${pv}! Bỏ vào mỗi hũ bằng nhau: Để dành, Tiêu và Chia sẻ.`);
      else if (L === 4) api.say(`You earned ${te}! Put half in Save, and split the rest evenly between Spend and Share.`, `Con kiếm được ${tv}! Bỏ một nửa vào hũ Để dành, phần còn lại chia đều cho hũ Tiêu và hũ Chia sẻ.`);
      else api.say(`You earned ${te}! Put ${a[0]} in Save, ${b[0]} in Spend and ${c[0]} in Share.`, `Con kiếm được ${tv}! Bỏ ${a[1]} vào hũ Để dành, ${b[1]} vào hũ Tiêu và ${c[1]} vào hũ Chia sẻ.`);
      // tap a jar to drop one coin in; a jar that already has its share says so kindly
      let misses = 0, t: ReturnType<typeof setTimeout> | number = 0;
      const hint = () => { const k = got.findIndex((g, i) => g < want[i]); jars.forEach(j => j.classList.remove('hint')); if (k >= 0 && !api.closed) jars[k].classList.add('hint'); };
      const arm = () => { clearTimeout(t); if (api.little) t = setTimeout(hint, misses >= 2 ? 0 : HINT_AFTER); };
      const ok = await new Promise<boolean>(res => {
        let fin = false; const done = v => { if (!fin) { fin = true; clearTimeout(t); res(v); } }; api.onCleanup(() => done(false));
        jars.forEach(j => j.onclick = () => {
          if (fin) return; const k = j._k;
          if (got[k] >= want[k]) { misses++; api.wrong(j, 'This jar has enough. Try another jar.', 'Hũ này đủ rồi. Thử hũ khác nhé.'); arm(); return; }
          got[k] += u; api.sfx.coin(); jars.forEach(x => x.classList.remove('hint')); pileEl.lastElementChild && pileEl.lastElementChild.remove(); draw();
          if (got.every((g, i) => g === want[i])) { api.right(row); done(true); } else arm();
        });
        arm();
      });
      if (!ok || api.closed) return;
      api.say('Save some for later, spend some on a treat, and share some with a friend!', 'Để dành một ít cho sau này, tiêu một ít cho món mình thích, và chia sẻ một ít với bạn bè!');
      await wait(2600); if (api.closed) return;
    }
    api.dots(rounds, rounds);
    return api.win();
  }
});

// ---------- 5. Lì Xì Count: open the Tết lucky-money envelopes and count ----------
const LIXI = {
  AUD: [[2, 4, [100]], [3, 5, [500]], [3, 3, [500, 1000]], [3, 4, [500, 1000, 2000]], [4, 4, [500, 1000, 2000, 5000], 2]],
  VND: [[2, 4, [10000]], [3, 5, [10000]], [3, 3, [10000, 20000]], [3, 4, [10000, 20000, 50000]], [4, 4, [10000, 20000, 50000, 100000], 2]]
};
register({
  id: 'lixi', icon: '🧧', origin: 'vn', name: () => T('Lucky Money Count', 'Đếm Lì Xì'),
  async run(api) {
    style(); const code = home(), L = step(api), rounds = 3, [lo, hi, vals, most = 1] = LIXI[code][L], countOnly = L === 0;
    for (let r = 0; r < rounds; r++) {
      api.dots(rounds, r); api.stage.innerHTML = '';
      const n = lo + Math.floor(Math.random() * (hi - lo + 1)), inside = Array.from({ length: n }, () => Array.from({ length: 1 + Math.floor(Math.random() * most) }, () => pick(vals)));
      api.stage.appendChild(el('div', 'mg-tet', `${pic('🏮')}${pic('🌼')}${pic('🏮')}`));
      const row = el('div', 'mg-row'); api.stage.appendChild(row);
      const envs = inside.map(notes => { const b = el('button', 'mg-env', pic('lixi')); b._notes = notes; b.setAttribute('aria-label', T('Red envelope', 'Bao lì xì')); row.appendChild(b); return b; });
      api.say('Happy Tết! Tap each red envelope to open it.', 'Chúc mừng năm mới! Chạm vào từng bao lì xì để mở nhé.');
      const ok = await new Promise<boolean>(res => {
        let left = n, fin = false; const done = v => { if (!fin) { fin = true; res(v); } }; api.onCleanup(() => done(false));
        envs.forEach(b => b.onclick = () => { if (fin || b.classList.contains('open')) return; b.classList.add('open'); api.sfx.coin(); b.insertAdjacentHTML('beforeend', `<span class="mg-row">${b._notes.map(v => cash(code, v)).join('')}</span>`); if (--left === 0) later(api, () => done(true), 700); });
      });
      if (!ok || api.closed) return;
      const sum = M.total(inside.flat()), small = Math.min(...vals);
      if (countOnly) {
        api.say('How many red envelopes are there?', 'Có mấy bao lì xì?');
        const btns = choiceButtons(api, shuffle([...new Set([n - 1, n, n + 1].filter(x => x > 0))]), x => `<b class="tnum">${x}</b>`);
        const b = await untilRight(api, btns, e => e._v === n); if (!b) return;
        api.say(`${n} red envelopes!`, `${n} bao lì xì!`);
      } else {
        api.say('How much lucky money altogether?', 'Tất cả được bao nhiêu tiền lì xì?');
        const btns = choiceButtons(api, M.nearAnswers(sum, small), x => `<b class="tnum">${fmt(x, code)}</b>`, 'choice mg-amt');
        const b = await untilRight(api, btns, e => e._v === sum); if (!b) return;
        const [se, sv] = sp(sum, code);
        api.say(`${cap(se)} of lucky money! Remember to say thank you and wish everyone a happy new year.`, `${cap(sv)} tiền lì xì! Con nhớ cảm ơn và chúc Tết mọi người nhé.`);
      }
      await wait(2400); if (api.closed) return;
    }
    api.dots(rounds, rounds);
    return api.win();
  }
});

// ---------- 6. Bé Bán Hàng: run a little shop and give the change ----------
const TILL = {
  AUD: [[100, 400, 100, [100], 0], [100, 400, 100, [100, 200], 0], [150, 900, 50, [50, 100, 200, 500], 0], [200, 1990, 10, [10, 20, 50, 100, 200, 500, 1000], 0], [500, 4500, 5, [5, 10, 20, 50, 100, 200, 500, 1000, 2000], 1]],
  VND: [[1000, 4000, 1000, [1000], 0], [1000, 4000, 1000, [1000, 2000], 0], [2000, 18000, 1000, [1000, 2000, 5000, 10000], 0], [5000, 90000, 1000, [1000, 2000, 5000, 10000, 20000, 50000], 0], [10000, 450000, 1000, [1000, 2000, 5000, 10000, 20000, 50000, 100000, 200000], 1]]
};
const CUSTOMERS = ['🐰', '🐼', '🐨', '🐶', '🐱', '🦆'];
register({
  id: 'shopkeep', icon: '🏪', name: () => T('Little Shopkeeper', 'Bé Bán Hàng'),
  async run(api) {
    style(); const code = home(), L = step(api), rounds = 3, [lo, hi, by, vals, bigger] = TILL[code][L];
    // little ones always get a $5 (or 5.000đ) note and count the change in one or two kinds; up to Medium the change
    // is said out loud, on Hard the child works it out
    const plain = L <= 2;
    for (let r = 0; r < rounds; r++) {
      api.dots(rounds, r); api.stage.innerHTML = '';
      let price, paid; do { price = M.priceIn(lo, hi, by); paid = L <= 1 ? (code === 'VND' ? 5000 : 500) : M.payWith(price, code, bigger); } while (!paid || M.changeDue(price, paid) <= 0 || !M.makeChange(paid - price, code, vals));
      const due = M.changeDue(price, paid), [ic, en, vi] = pick(SHOP);
      api.stage.appendChild(el('div', 'mg-row', `<span class="mg-big">${pic(pick(CUSTOMERS))}</span><span class="mg-big">${pic(ic)}</span><span class="mg-tag">${fmt(price, code)}</span>`));
      api.stage.appendChild(el('div', 'mg-row', `<span class="mg-sum">${T('The customer gives you', 'Khách đưa')}</span>${cash(code, paid)}`));
      const sumEl = el('div', 'mg-sum'), tray = el('div', 'mg-tray'), purse = el('div', 'mg-row'); api.stage.append(sumEl, tray, purse);
      const [pe, pv] = sp(price, code), [ge, gv] = sp(paid, code), [de, dv] = sp(due, code);
      if (plain) api.say(`${cap(en)} costs ${pe}. The customer gives you ${ge}. Give back ${de} change.`, `${cap(vi)} giá ${pv}. Khách đưa con ${gv}. Con trả lại khách ${dv} tiền thừa nhé.`);
      else api.say(`${cap(en)} costs ${pe}. The customer gives you ${ge}. How much change? Count it out.`, `${cap(vi)} giá ${pv}. Khách đưa con ${gv}. Phải trả lại bao nhiêu tiền thừa? Con đếm ra nhé.`);
      const show = s => { sumEl.textContent = `${T('Change', 'Tiền thừa')}: ${fmt(s, code)}${plain ? ' / ' + fmt(due, code) : ''}`; };
      const ok = await fill(api, { code, vals, want: due, tray, purse, show }); if (!ok || api.closed) return;
      api.say(`${cap(de)} change. Thank you, come again!`, `Trả lại ${dv}. Cảm ơn, lần sau lại đến nhé!`); await wait(2200); if (api.closed) return;
    }
    api.dots(rounds, rounds);
    return api.win();
  }
});

// ---------- 7. Shopping List: buy what is on the picture list, within the money we have ----------
const LIST_PLAN = { AUD: [[2, 4, 0, 100, 300, 50], [3, 5, 0, 100, 400, 50], [2, 5, 1, 100, 500, 50], [3, 5, 2, 50, 600, 10], [4, 6, 2, 50, 600, 10]],
  VND: [[2, 4, 0, 5000, 15000, 1000], [3, 5, 0, 5000, 20000, 1000], [2, 5, 1, 5000, 30000, 1000], [3, 5, 2, 5000, 30000, 1000], [4, 6, 2, 5000, 40000, 1000]] };
register({
  id: 'shoplist', icon: '📝', name: () => T('Shopping List', 'Danh Sách Đi Chợ'),
  async run(api) {
    style(); const code = home(), L = step(api), rounds = 2, [need, shelfN, mode, lo, hi, by] = LIST_PLAN[code][L];
    for (let r = 0; r < rounds; r++) {
      api.dots(rounds, r); api.stage.innerHTML = '';
      const kinds = shuffle(SHOP).slice(0, Math.max(shelfN, need)), list = kinds.slice(0, need);
      // mode 0: just find them; 1: prices and a budget; 2: each list thing comes big and small, only the cheaper ones fit
      const goods = kinds.map(k => ({ k, price: M.priceIn(lo, hi, by) }));
      if (mode === 2) list.forEach(k => { const g = goods.find(x => x.k === k); goods.push({ k, price: g.price + by * (2 + Math.floor(Math.random() * 4)), big: true }); });
      const cheapSum = M.total(list.map(k => Math.min(...goods.filter(g => g.k === k).map(g => g.price))));
      const gap = mode === 2 ? Math.min(...list.map(k => { const ps = goods.filter(g => g.k === k).map(g => g.price); return Math.max(...ps) - Math.min(...ps); })) : 0;
      const budget = mode === 0 ? Infinity : mode === 1 ? cheapSum + by * Math.floor(Math.random() * 4) : cheapSum + by * Math.floor(Math.random() * Math.max(1, gap / by));
      const listEl = el('div', 'mg-list', list.map((k, i) => `<span data-i="${i}">${pic(k[0])}</span>`).join(''));
      const wallet = el('div', 'mg-sum'), shelf = el('div', 'mg-shelf'), basket = el('div', 'mg-tray');
      api.stage.append(listEl, wallet, shelf, basket);
      const btns = shuffle(goods).map(g => { const b = el('button', g.big ? 'big' : '', `${pic(g.k[0])}${mode ? `<span class="mg-tag">${fmt(g.price, code)}</span>` : ''}`); b._g = g; b.setAttribute('aria-label', T(g.k[1], g.k[2])); shelf.appendChild(b); return b; });
      let spent = 0; const bought = new Set();
      const draw = () => { wallet.textContent = mode ? `${T('Money left', 'Còn lại')}: ${fmt(budget - spent, code)}` : ''; };
      draw();
      if (mode) { const [be, bv] = sp(budget, code); api.say(`Buy everything on the picture list with ${be}. Choose carefully!`, `Mua hết đồ trong danh sách hình với ${bv}. Chọn cẩn thận nhé!`); }
      else api.say('Buy the things on the picture list. Tap them on the shelf.', 'Mua những thứ trong danh sách hình. Chạm vào chúng trên kệ nhé.');
      let misses = 0, t: ReturnType<typeof setTimeout> | number = 0;
      const hint = () => { const b = btns.find(x => list.includes(x._g.k) && !bought.has(x._g.k) && !x.classList.contains('gone') && (mode < 2 || !x._g.big)); btns.forEach(x => x.classList.remove('hint')); if (b && !api.closed) b.classList.add('hint'); };
      const arm = () => { clearTimeout(t); if (api.little) t = setTimeout(hint, misses >= 2 ? 0 : HINT_AFTER); };
      const ok = await new Promise<boolean>(res => {
        let fin = false; const done = v => { if (!fin) { fin = true; clearTimeout(t); res(v); } }; api.onCleanup(() => done(false));
        btns.forEach(b => b.onclick = () => {
          if (fin) return; const g = b._g;
          if (!list.includes(g.k)) { misses++; api.wrong(b, 'That is not on our list.', 'Cái đó không có trong danh sách.'); arm(); return; }
          if (bought.has(g.k)) { misses++; api.wrong(b, 'We have that one already.', 'Mình mua cái đó rồi.'); arm(); return; }
          // (never a dead end: a pick that leaves too little for the rest of the list is refused, not just one over the money)
          const rest = M.total(list.filter(k => k !== g.k && !bought.has(k)).map(k => Math.min(...goods.filter(x => x.k === k).map(x => x.price))));
          if (spent + g.price + rest > budget) { misses++; api.wrong(b, 'Too much! Then we could not buy everything. Try a cheaper one.', 'Đắt quá! Như vậy mình không đủ tiền mua hết. Thử cái rẻ hơn nhé.'); arm(); return; }
          spent += g.price; bought.add(g.k); api.sfx.coin(); btns.forEach(x => x.classList.remove('hint'));
          b.classList.add('gone'); basket.insertAdjacentHTML('beforeend', `<span class="mg-pic">${pic(g.k[0])}</span>`);
          listEl.querySelector(`[data-i="${list.indexOf(g.k)}"]`).classList.add('done'); draw();
          if (bought.size === list.length) { api.right(basket); done(true); } else arm();
        });
        arm();
      });
      if (!ok || api.closed) return;
      if (mode) { const [se, sv] = sp(spent, code), [le, lv] = sp(budget - spent, code); api.say(`All bought! We spent ${se}${budget - spent ? ` and have ${le} left` : ''}.`, `Mua đủ rồi! Mình tiêu ${sv}${budget - spent ? ` và còn ${lv}` : ''}.`); }
      else api.say('All bought! What a good little shopper.', 'Mua đủ rồi! Bé đi chợ giỏi quá.');
      await wait(2400); if (api.closed) return;
    }
    api.dots(rounds, rounds);
    return api.win();
  }
});

// ---------- 8. Which Is Cheaper? ----------
const CHEAP = { AUD: [[1, 6, 100, 2, true], [1, 5, 100, 2, true], [100, 1000, 100, 2], [50, 990, 10, 2], [50, 300, 5, 3]],
  VND: [[1, 6, 1000, 2, true], [1, 5, 1000, 2, true], [1000, 20000, 1000, 2], [5000, 99000, 1000, 2], [10000, 200000, 1000, 3]] };
register({
  id: 'cheaper', icon: '🏷️', name: () => T('Which Is Cheaper?', 'Món Nào Rẻ Hơn?'),
  async run(api) {
    style(); const code = home(), L = step(api), rounds = api.little ? 4 : 5, [lo, hi, by, n, coins] = CHEAP[code][L];
    for (let r = 0; r < rounds; r++) {
      api.dots(rounds, r); api.stage.innerHTML = '';
      // little ones compare piles of $1 coins (or 1.000đ notes) by counting; bigger ones read the price tags
      let prices; do { prices = coins ? M.distinctPrices(n, lo, hi, 1).map(x => x * by) : M.distinctPrices(n, lo, hi, by); } while (coins && Math.abs(prices[0] - prices[1]) < by * (L ? 1 : 2));
      const items = shuffle(SHOP).slice(0, n).map((it, i) => ({ it, p: prices[i] })), best = M.cheapest(prices);
      api.stage.appendChild(el('div', 'mg-big', pic('🏷️')));
      if (coins) api.say('Which one costs less? Count the money.', 'Món nào ít tiền hơn? Đếm tiền nhé.');
      else if (n > 2) api.say('Which one is the cheapest?', 'Món nào rẻ nhất?'); else api.say('Which one is cheaper?', 'Món nào rẻ hơn?');
      const btns = choiceButtons(api, items, ({ it, p }) => `<span class="mg-pic">${pic(it[0])}</span>${coins ? `<span class="mg-row mg-many">${cash(code, by).repeat(p / by)}</span>` : `<span class="mg-tag">${fmt(p, code)}</span>`}`, 'choice mg-card');
      const b = await untilRight(api, btns, e => e._v === items[best]); if (!b) return;
      const [, en, vi] = items[best].it, [pe, pv] = sp(items[best].p, code);
      api.say(`${cap(en)} is cheaper: ${pe}.`, `${cap(vi)} rẻ hơn: ${pv}.`); await wait(1800); if (api.closed) return;
    }
    api.dots(rounds, rounds);
    return api.win();
  }
});

// ---------- 9. Wait and Grow: saved money grows a little every day (simple interest, as a money plant) ----------
// [coins planted, % it grows each day, days]; Hard says the rate as "1 for every 10 (or 5) you planted"
const GROW = [[[2, 50, 2]], [[4, 25, 3]], [[5, 20, 3]], [[10, 10, 4], [10, 20, 3]], [[20, 10, 5], [20, 20, 3]]];
register({
  id: 'waitgrow', icon: '🌱', name: () => T('Wait and Grow', 'Chờ Cây Lớn'),
  async run(api) {
    style(); const code = home(), L = step(api), rounds = 2, u = unitOf(code);
    for (let r = 0; r < rounds; r++) {
      api.dots(rounds, r); api.stage.innerHTML = '';
      const [n, rate, days] = pick(GROW[L]), k = M.perDay(n, rate), steps = M.growth(n, rate, days), last = steps[days];
      const plant = el('div', 'mg-big', pic('🌱')), coinsEl = el('div', 'mg-row mg-many'), sumEl = el('div', 'mg-sum');
      const drawCoins = c => { coinsEl.innerHTML = Array.from({ length: c }, () => cash(code, u)).join(''); sumEl.textContent = `${c} · ${fmt(c * u, code)}`; };
      api.stage.append(plant, sumEl, coinsEl); drawCoins(n);
      const [ne, nv] = pieces(n, code), [ke, kv] = pieces(k, code);
      if (L === 4) api.say(`You have ${ne}. Plant them in the money tree and wait. Every day it grows 1 more for every ${100 / rate} you planted!`, `Con có ${nv}. Trồng vào cây tiền rồi chờ nhé. Mỗi ngày cây mọc thêm 1 cho mỗi ${100 / rate} con đã trồng!`);
      else api.say(`You have ${ne}. Plant them in the money tree and wait. Every day it grows ${ke} more!`, `Con có ${nv}. Trồng vào cây tiền rồi chờ nhé. Mỗi ngày cây mọc thêm ${kv}!`);
      // bigger kids guess first how many there will be
      if (L >= 2) {
        await wait(2600); if (api.closed) return;
        api.say(`How many after ${days} days?`, `Sau ${days} ngày con có bao nhiêu?`);
        const qs = choiceButtons(api, M.nearAnswers(last, Math.max(1, k)), x => `<b class="tnum">${x}</b><small>${fmt(x * u, code)}</small>`, 'choice mg-amt');
        const b = await untilRight(api, qs, e => e._v === last); if (!b) return;
        b.parentElement.remove();
      }
      // a sunny day at a time: the plant grows and new coins appear on it
      const go = el('button', 'mg-go', `${pic('☀️')}<span>${T('Next day', 'Ngày mai')}</span>`); api.stage.appendChild(go);
      const ok = await new Promise<boolean>(res => {
        let d = 0, fin = false; const done = v => { if (!fin) { fin = true; res(v); } }; api.onCleanup(() => done(false));
        go.onclick = () => {
          if (fin || d >= days) return; d++; api.sfx.coin(); drawCoins(steps[d]);
          plant.innerHTML = pic(d >= days ? '🌳' : d * 2 >= days ? '🪴' : '🌿'); plant.style.transform = `scale(${(1 + d / days * .5).toFixed(2)})`;
          api.say(`Day ${d}: ${pieces(steps[d], code)[0]}!`, `Ngày ${d}: ${pieces(steps[d], code)[1]}!`);
          if (d >= days) { go.disabled = true; later(api, () => done(true), 1600); }
        };
      });
      if (!ok || api.closed) return; go.remove();
      // little ones: which is more, now or after waiting?
      if (L <= 1) {
        api.say(`Which is more: ${ne} now, or ${pieces(last, code)[0]} after waiting?`, `Cái nào nhiều hơn: ${nv} bây giờ, hay ${pieces(last, code)[1]} sau khi chờ?`);
        const qs = choiceButtons(api, shuffle([['now', n], ['later', last]]), ([w, c]) => `<span class="mg-pic">${pic(w === 'now' ? '🌱' : '🌳')}</span><b class="tnum">${c}</b><small>${w === 'now' ? T('Now', 'Bây giờ') : T('After waiting', 'Sau khi chờ')}</small>`, 'choice mg-card');
        const b = await untilRight(api, qs, e => e._v[0] === 'later'); if (!b) return;
      }
      api.say(`Waiting made ${ne} grow into ${pieces(last, code)[0]}!`, `Chờ đợi đã làm ${nv} lớn thành ${pieces(last, code)[1]}!`);
      await wait(2400); if (api.closed) return;
    }
    api.dots(rounds, rounds);
    return api.win({ title: T('Saving now gives you more later!', 'Để dành hôm nay, mai có nhiều hơn!'), titleVi: 'Để dành hôm nay, mai có nhiều hơn!' });
  }
});

// ---------- 10. Đổi Hàng: trade without money, fairly ----------
// [picture, English, Vietnamese, worth]
const GOODS: [string, string, string, number][] = [['🥚', 'an egg', 'một quả trứng', 1], ['🥕', 'a carrot', 'một củ cà rốt', 1], ['🌽', 'some corn', 'một bắp ngô', 2], ['🍎', 'an apple', 'một quả táo', 2],
  ['🍌', 'some bananas', 'một nải chuối', 2], ['🐟', 'a fish', 'một con cá', 3], ['🥥', 'a coconut', 'một quả dừa', 3], ['🍯', 'some honey', 'một hũ mật ong', 4]];
const TRADERS = [['🐔', 'Mrs Hen', 'Cô Gà'], ['🐶', 'Mr Dog', 'Chú Chó'], ['🐐', 'Mr Goat', 'Chú Dê'], ['🦆', 'Mrs Duck', 'Cô Vịt']];
const dots = n => '●'.repeat(n);
register({
  id: 'barter', icon: '🤝', name: () => T('Swap and Trade', 'Đổi Hàng'),
  async run(api) {
    style(); const L = step(api), rounds = 3, worthOf = Object.fromEntries(GOODS.map(g => [g[0], g[3]]));
    for (let r = 0; r < rounds; r++) {
      api.dots(rounds, r); api.stage.innerHTML = '';
      const [tp, tn, tv] = TRADERS[r % TRADERS.length];
      if (L <= 1) {
        // little ones: the friend asks for one picture (or two of it); give exactly that
        const [has, wants] = shuffle(GOODS).slice(0, 2), many = L === 1 ? 2 : 1, others = shuffle(GOODS.filter(g => g !== has && g !== wants)).slice(0, 2);
        api.stage.appendChild(el('div', 'mg-row', `<span class="mg-big">${pic(tp)}</span><span class="mg-big">${pic(has[0])}</span><span class="mg-big">⇄</span><span class="mg-big">${pic(wants[0]).repeat(many)}</span>`));
        if (many === 1) api.say(`${tn} has ${has[1]}. ${tn} would like ${wants[1]}. Give it to swap!`, `${tv} có ${has[2]}. ${tv} muốn đổi lấy ${wants[2]}. Con đưa để đổi nhé!`);
        else api.say(`${tn} has ${has[1]}. ${tn} would like two of these. Give two to swap!`, `${tv} có ${has[2]}. ${tv} muốn đổi lấy hai cái này. Con đưa hai cái để đổi nhé!`);
        for (let k = 0; k < many; k++) {
          const btns = choiceButtons(api, shuffle([wants, ...others]), g => `<span class="mg-pic">${pic(g[0])}</span>`, 'choice mg-card');
          const b = await untilRight(api, btns, e => e._v === wants); if (!b) return;
          b.parentElement.remove(); if (k < many - 1) api.say('One! And one more.', 'Một! Thêm một cái nữa.');
        }
        api.say(`A fair swap! You got ${has[1]}.`, `Đổi công bằng! Con được ${has[2]}.`);
      } else {
        // bigger kids: everything has a worth (the dots); give things that add up to what the friend gives
        const offer = L === 4 ? shuffle(GOODS.filter(g => g[3] >= 2)).slice(0, 2) : [pick(GOODS.filter(g => g[3] >= (L === 2 ? 2 : 3)))], want = M.worth(offer.map(g => g[0]), worthOf);
        const basket = shuffle(GOODS.filter(g => !offer.includes(g) && g[3] < want)).slice(0, 5);
        api.stage.appendChild(el('div', 'mg-row', `<span class="mg-big">${pic(tp)}</span>${offer.map(g => `<span class="mg-card choice" style="pointer-events:none"><span class="mg-pic">${pic(g[0])}</span><span class="mg-dots">${dots(g[3])}</span></span>`).join('')}`));
        const meter = el('div', 'mg-sum'), tray = el('div', 'mg-tray'), shelf = el('div', 'mg-shelf'); api.stage.append(meter, tray, shelf);
        const gw = offer.map(g => g[1]).join(' and '), gv = offer.map(g => g[2]).join(' và ');
        api.say(`${tn} gives ${gw}, worth ${want} dots. Give things that add up to ${want} dots!`, `${tv} đưa ${gv}, đáng giá ${want} chấm. Con đưa những thứ cộng lại bằng ${want} chấm nhé!`);
        let give = 0, misses = 0, t: ReturnType<typeof setTimeout> | number = 0;
        const draw = () => { meter.innerHTML = `${pic('⚖️')} <span class="mg-dots">${dots(give)}</span> / <span class="mg-dots">${dots(want)}</span>`; };
        const btns = basket.map(g => { const b = el('button', '', `${pic(g[0])}<span class="mg-dots">${dots(g[3])}</span>`); b._g = g; b.setAttribute('aria-label', T(g[1], g[2])); shelf.appendChild(b); return b; });
        const hint = () => { const b = btns.find(x => give + x._g[3] <= want); btns.forEach(x => x.classList.remove('hint')); if (b && !api.closed) b.classList.add('hint'); };
        const arm = () => { clearTimeout(t); if (api.little) t = setTimeout(hint, misses >= 2 ? 0 : HINT_AFTER); };
        draw();
        const ok = await new Promise<boolean>(res => {
          let fin = false; const done = v => { if (!fin) { fin = true; clearTimeout(t); res(v); } }; api.onCleanup(() => done(false));
          btns.forEach(b => b.onclick = () => {
            if (fin) return; const g = b._g;
            if (give + g[3] > want) { misses++; api.wrong(b, 'That is worth too much. Try something smaller.', 'Cái đó đáng giá nhiều quá. Thử cái nhỏ hơn nhé.'); arm(); return; }
            give += g[3]; api.sfx.coin(); btns.forEach(x => x.classList.remove('hint'));
            const m = el('button', 'mg-in', pic(g[0])); m.onclick = () => { if (fin) return; give -= g[3]; m.remove(); api.sfx.tap(); draw(); arm(); }; tray.appendChild(m); draw();
            if (give === want) { api.right(tray); done(true); } else arm();
          });
          arm();
        });
        if (!ok || api.closed) return;
        api.say('A fair trade! You both get something you need.', 'Đổi công bằng! Cả hai đều có thứ mình cần.');
      }
      await wait(2200); if (api.closed) return;
    }
    api.dots(rounds, rounds);
    return api.win();
  }
});
