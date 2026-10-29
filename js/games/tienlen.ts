// Tiến Lên (southern style, "Tiến Lên miền Nam"), played at the card table on Two Homes Street with anh Ba and
// his friend Con Vật. 13 cards each; 3 is the lowest card and 2 the highest; suits ♠ < ♣ < ♦ < ♥.
// You may play one card, a pair, three or four of a kind, a run of 3+ cards in a row (sảnh, no 2s) or 3+ pairs
// in a row (đôi thông). Beat what is on the table with the same kind of play, higher; or pass, and you sit out
// until someone starts again. "Chặt": four of a kind or three pairs in a row can beat a 2.
// The first to play all their cards wins the hand. Hints light up a good play, and little ones always get one.
// (Round V, owner 13 Oct) Tiến Lên miền Bắc too (game 'tienlenbac'): a single card is beaten only by a higher card of the
// same suit (twos trump other singles and compare by suit), ordinary pairs must match colour, triples match all three
// suits, and runs match suit and length; no consecutive pairs. A quad can cut a single or pair of twos.
import { register } from './frame.js';
import { el, esc } from '../util.js';
import { stream } from '../core/rng.js';
import { T } from '../i18n.js';

import { RANKS, SUITS, card, byV, BOMB, classify, beats, choose, setNorth, rulesFor } from './tienlenrules.js';
export { classify, beats, choose, setNorth };

const TL = {
  id: 'tienlen', online: true, icon: '🎴', origin: 'vn', name: () => T('Tiến Lên (cards)', 'Tiến Lên miền Nam'),
  async run(api, north = false) {
    const { classify, beats, choose, BOMB } = rulesFor(north);
    if (north) {
      const guide = el('details', 'tl-north-rules');
      guide.innerHTML = `<summary>${T('Northern rules used here', 'Luật miền Bắc trong trò này')}</summary><p>${T('Singles and runs match suit. Pairs match colour; triples match all three suits. Twos trump other singles or pairs; four of a kind can cut one or two twos. Runs cannot include twos. This gentle version has no betting or last-card penalties.', 'Bài lẻ và sảnh cùng chất. Đôi cùng màu; bộ ba cùng các chất. Quân hai chặn bài lẻ hoặc đôi khác; tứ quý chặt một hoặc đôi hai. Sảnh không có quân hai. Bản nhẹ nhàng này không cá cược, không phạt lá cuối.')}</p>`;
      api.stage.appendChild(guide);
    }
    if (api.online) return tienlenOnline(api, north);
    const little = api.little, strong = api.strong;
    if (north) api.say('Northern Tiến Lên! Singles and runs match suit, pairs match colour, and triples match suits. Twos are special. This gentle game has no last-card penalties.',
      'Tiến Lên miền Bắc! Bài lẻ và sảnh cùng chất, đôi cùng màu, bộ ba cùng các chất. Quân hai có luật riêng. Bản nhẹ nhàng này không phạt lá cuối.');
    else api.say('Tiến Lên! Beat the cards on the table with the same kind of play, but higher. 3 is the lowest, 2 is the highest. Play all your cards first to win!',
      'Tiến Lên! Đánh bài cao hơn bài trên bàn, cùng một kiểu. 3 nhỏ nhất, 2 lớn nhất. Ai đánh hết bài trước là thắng!');
    const t = el('div', 'tl', `<div class="tl-opp"></div><div class="tl-table"><div class="tl-who"></div><div class="tl-pile"></div></div><div class="tl-msg"></div><div class="tl-hand"></div>
      <div class="tl-btns"><button class="tl-b hint">💡 ${T('Hint', 'Gợi ý')}</button><button class="tl-b pass">✋ ${T('Pass', 'Bỏ lượt')}</button><button class="tl-b play">▶ ${T('Play', 'Đánh')}</button></div>`);
    api.stage.appendChild(t);
    const oppEl = t.querySelector('.tl-opp'), pileEl = t.querySelector('.tl-pile'), whoEl = t.querySelector('.tl-who'), msgEl = t.querySelector('.tl-msg'), handEl = t.querySelector('.tl-hand');
    const bPlay = t.querySelector('.play'), bPass = t.querySelector('.pass'), bHint = t.querySelector('.hint');
    const names = [T('You', 'Con'), T('Big Brother Ba', 'Anh Ba'), 'Con Vật'], faces = ['🙂', '🧑🏻', '👦🏻'];
    const cardHTML = (c, cls = '') => `<div class="tl-card ${c.s >= 2 ? 'red' : ''} ${cls}" data-v="${c.v}"><b>${RANKS[c.r]}</b><i>${SUITS[c.s]}</i></div>`;
    const sleep = ms => new Promise<void>(r => setTimeout(r, ms));
    const HANDS = little ? 2 : 3;
    let hands, table, lastBy, passed, turn, sel, finished, game = 0, firstHand = true, shown = null; // shown: cards dealt so far, while dealing

    const say = (en, vi) => { msgEl.textContent = T(en, vi); };
    function drawOpp() {
      oppEl.innerHTML = [1, 2].map(i => `<div class="tl-p ${turn === i ? 'on' : ''} ${passed.has(i) ? 'out' : ''}"><span class="f">${faces[i]}</span><b>${names[i]}</b><span class="n">🂠 ${shown ? shown[i] : hands[i].length}</span>${passed.has(i) ? `<small>${T('passed', 'bỏ')}</small>` : ''}</div>`).join('');
    }
    function drawHand() {
      handEl.innerHTML = (shown ? hands[0].slice(0, shown[0]) : hands[0]).map(c => cardHTML(c, sel.has(c.v) ? 'sel' : '')).join('');
      handEl.querySelectorAll('.tl-card').forEach(e => { e.onclick = () => { if (turn !== 0) return; const v = +e.dataset.v; sel.has(v) ? sel.delete(v) : sel.add(v); api.sfx.tap(); drawHand(); updateBtns(); }; });
      t.classList.toggle('mine', turn === 0);
    }
    function drawTable() {
      pileEl.innerHTML = table ? table.cs.map(c => cardHTML(c)).join('') : `<span class="tl-free">${T('New round: play anything!', 'Vòng mới: đánh gì cũng được!')}</span>`;
      whoEl.textContent = table ? names[lastBy] : '';
    }
    function updateBtns() {
      const cs = hands[0].filter(c => sel.has(c.v)), k = classify(cs), ok = turn === 0 && beats(k, table && table.k);
      bPlay.disabled = !ok; bPass.disabled = turn !== 0 || !table; bHint.disabled = turn !== 0;
      t.classList.toggle('canplay', ok);
    }
    function hint() {
      const cs = choose(hands[0], table && table.k, { strong: true, others: Math.min(hands[1].length, hands[2].length) });
      sel = new Set(cs ? cs.map(c => c.v) : []); drawHand(); updateBtns();
      if (!cs) say('Nothing beats it. Tap Pass!', 'Không có bài nào chặn được. Bấm Bỏ lượt nhé!');
    }
    // dealing, the way it is done at the table: a deck in the middle, one card at a time to each player in turn
    // (owner, round G: "Tiến Lên should show the cards being dealt"); little ones get a quicker deal
    async function dealCards() {
      shown = [0, 0, 0]; drawOpp(); drawHand();
      const deckEl = el('div', 'tl-deck', '<div class="tl-card back"></div><div class="tl-card back"></div><div class="tl-card back"></div>'); t.appendChild(deckEl);
      const box = t.getBoundingClientRect(), mid = (e => { const r = e.getBoundingClientRect(); return [r.left + r.width / 2 - box.left, r.top + r.height / 2 - box.top]; });
      const from = mid(deckEl), to = [() => mid(handEl), () => mid(oppEl.children[0] || oppEl), () => mid(oppEl.children[1] || oppEl)];
      const gap = little ? 28 : 45;
      for (let k = 0; k < 39 && !api.closed; k++) {
        const who = (turn + k) % 3, fly = el('div', 'tl-card back tl-fly'); fly.style.left = from[0] + 'px'; fly.style.top = from[1] + 'px'; t.appendChild(fly);
        const [x, y] = to[who](); requestAnimationFrame(() => { fly.style.transform = `translate(${x - from[0]}px, ${y - from[1]}px) rotate(${(who - 1) * 12}deg) scale(.8)`; fly.style.opacity = '.2'; });
        setTimeout(() => { fly.remove(); shown[who]++; if (who === 0) drawHand(); else drawOpp(); }, 320);
        if (k % 3 === 0) api.sfx.tap();
        await sleep(gap);
      }
      await sleep(360); deckEl.remove(); shown = null;
    }
    async function deal() {
      const deck = []; for (let r = 0; r < 13; r++) for (let s = 0; s < 4; s++) deck.push(card(r, s));
      for (let i = deck.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [deck[i], deck[j]] = [deck[j], deck[i]]; }
      hands = [0, 1, 2].map(i => deck.slice(i * 13, i * 13 + 13).sort(byV));
      table = null; lastBy = -1; passed = new Set(); sel = new Set(); finished = [];
      // the first hand starts with whoever has the lowest card; after that the winner starts
      if (firstHand) { const low = hands.map(h => h[0].v); turn = low.indexOf(Math.min(...low)); }
      drawTable(); await dealCards(); if (api.closed) return;
      drawOpp(); drawHand(); drawTable(); updateBtns();
    }
    function nextTurn() {
      let n = turn;
      for (let k = 0; k < 3; k++) {
        n = (n + 1) % 3;
        if (hands[n].length === 0) continue;
        if (n === lastBy) { // everyone else passed: the last player starts a new round
          table = null; passed.clear(); turn = n; return;
        }
        if (!passed.has(n)) { turn = n; return; }
      }
      table = null; passed.clear(); turn = lastBy >= 0 && hands[lastBy].length ? lastBy : n;
    }
    function play(i, cs) {
      const set = new Set(cs.map(c => c.v)); hands[i] = hands[i].filter(c => !set.has(c.v));
      table = { cs: [...cs].sort(byV), k: classify(cs) }; lastBy = i;
      const bomb = BOMB(table.k); api.sfx.pop(bomb ? 6 : 3);
      if (i !== 0) say(`${names[i]}: ${describe(table.k)}`, `${names[i]}: ${describe(table.k)}`);
      if (bomb) { t.classList.remove('chop'); void t.offsetWidth; t.classList.add('chop'); }
      if (!hands[i].length) finished.push(i);
    }
    function describe(k) {
      const n = { single: T('one card', 'một lá'), pair: T('a pair', 'một đôi'), triple: T('three of a kind', 'sám cô'), quad: T('four of a kind!', 'tứ quý!'), run: T(`a run of ${k.n}`, `sảnh ${k.n} lá`), pairs: T(`${k.len} pairs in a row!`, `${k.len} đôi thông!`) };
      return n[k.type];
    }
    let resolveTurn = null;
    bPlay.onclick = () => { if (turn !== 0 || !resolveTurn) return; const cs = hands[0].filter(c => sel.has(c.v)); if (!beats(classify(cs), table && table.k)) return; sel = new Set(); play(0, cs); api.right(pileEl); resolveTurn && resolveTurn(); };
    bPass.onclick = () => { if (turn !== 0 || !table || !resolveTurn) return; passed.add(0); sel = new Set(); api.sfx.tap(); say('You pass. Wait for the next round!', 'Con bỏ lượt. Chờ vòng sau nhé!'); resolveTurn && resolveTurn(); };
    bHint.onclick = () => { if (turn !== 0) return; api.sfx.tap(); hint(); };
    // (r89) auto play plays its turn like the Hint: it picks the hinted cards one by one, then Play; Pass when nothing beats it
    const cardEl = (v: number) => { const e = handEl.querySelector(`.tl-card[data-v="${v}"]`); return e instanceof HTMLElement ? e : null; };
    api.plan(() => {
      if (turn !== 0 || !resolveTurn || shown) return null;
      const best = choose(hands[0], table && table.k, { strong: true, others: Math.min(hands[1].length, hands[2].length) });
      if (!best) return table ? bPass : null;
      const want = new Set(best.map(c => c.v)), off = [...want].find(v => !sel.has(v)) ?? [...sel].find(v => !want.has(v));
      return off == null ? bPlay : cardEl(off);
    }, { maxActions: HANDS * 13 * 4 });

    let wins = 0;
    for (game = 0; game < HANDS && !api.closed; game++) {
      await deal(); firstHand = false; if (api.closed) return;
      api.dots(HANDS, game);
      while (!api.closed && finished.length === 0) {
        drawOpp(); drawTable(); drawHand(); updateBtns();
        if (turn === 0) {
          if (!table) say('Your turn: start a new round with any play.', 'Tới lượt con: đánh gì cũng được.'); else say('Your turn: beat it, or pass.', 'Tới lượt con: chặn bài, hay bỏ lượt.');
          if (little || api.level <= 1) hint();
          await new Promise<void>(r => { resolveTurn = r; }); resolveTurn = null;
        } else {
          await sleep(little ? 1200 : 900); if (api.closed) return;
          const lazy = !strong && Math.random() < (little ? .45 : [.3, .2, .12, .06, 0][api.level - 1]);
          const cs = table && lazy ? null : choose(hands[turn], table && table.k, { strong, others: Math.min(...[0, 1, 2].filter(j => j !== turn).map(j => hands[j].length || 99)) });
          if (cs) play(turn, cs); else { if (!table) play(turn, [hands[turn][0]]); else { passed.add(turn); say(`${names[turn]} passes.`, `${names[turn]} bỏ lượt.`); } }
        }
        if (finished.length) break;
        nextTurn();
      }
      if (api.closed) return;
      const w = finished[0]; turn = -1;
      drawOpp(); drawTable(); drawHand(); updateBtns();
      if (w === 0) { wins++; api.right(handEl); api.say('You played all your cards! You win this hand!', 'Con đánh hết bài rồi! Con thắng ván này!'); }
      else api.say(`${names[w]} played all their cards first. Good game! Next hand!`, `${names[w]} đánh hết bài trước. Ván hay lắm! Ván tiếp nào!`);
      turn = w; await sleep(2200);
      if (wins >= (little ? 1 : 2)) break;
    }
    if (api.closed) return;
    api.dots(HANDS, HANDS);
    return api.win({ title: wins ? T(`You won ${wins} hand${wins > 1 ? 's' : ''} of Tiến Lên!`, `Con thắng ${wins} ván Tiến Lên!`) : T('Great games of Tiến Lên with anh Ba and Phong!', 'Chơi Tiến Lên với anh Ba và Phong vui quá!') });
  }
};
// (Round V) miền Nam keeps its rules; miền Bắc plays the same game with the northern rules switched on for its length
register({ ...TL, run: async api => TL.run(api, false) });
register({ ...TL, id: 'tienlenbac', name: () => T('Tiến Lên, northern rules (cards)', 'Tiến Lên miền Bắc'), run: async api => TL.run(api, true) });

// Tiến Lên with friends online (round G): 2 to 4 children, each on their own device (r63, owner: games with friends are
// only between the players, so no computer players fill the table any more; with two, each gets 13 cards and the rest
// stay in the deck). The same deal everywhere (shuffled from the game's own code), each child sees only their own
// cards. A child's play travels as one number (which of their cards, or 0 for pass). One hand: the first to play all
// cards wins.
async function tienlenOnline(api, north = false) {
  const { classify, beats, choose } = rulesFor(north);
  const O = api.online, humans = O.names.length, seats = humans;
  const names = [...O.names], me = O.mine, r = stream('tienlen/' + O.seed);
  const RANKS = ['3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A', '2'], SUITS = ['♠', '♣', '♦', '♥'];
  const deck = []; for (let k = 0; k < 13; k++) for (let su = 0; su < 4; su++) deck.push({ r: k, s: su, v: k * 4 + su });
  const sh = r.shuffle(deck), hands = names.map((_, i) => sh.slice(i * 13, i * 13 + 13).sort((a, b) => a.v - b.v));
  const cardHTML = (c, cls = '') => `<div class="tl-card ${c.s >= 2 ? 'red' : ''} ${cls}" data-v="${c.v}"><b>${RANKS[c.r]}</b><i>${SUITS[c.s]}</i></div>`;
  const t = el('div', 'tl', `<div class="tl-opp"></div><div class="tl-table"><div class="tl-who"></div><div class="tl-pile"></div></div><div class="tl-msg"></div><div class="tl-hand"></div>
    <div class="tl-btns"><button class="tl-b hint">💡 ${T('Hint', 'Gợi ý')}</button><button class="tl-b pass">✋ ${T('Pass', 'Bỏ lượt')}</button><button class="tl-b play">▶ ${T('Play', 'Đánh')}</button></div>`);
  api.stage.appendChild(t);
  const oppEl = t.querySelector('.tl-opp'), pileEl = t.querySelector('.tl-pile'), whoEl = t.querySelector('.tl-who'), msgEl = t.querySelector('.tl-msg'), handEl = t.querySelector('.tl-hand');
  const bPlay = t.querySelector('.play'), bPass = t.querySelector('.pass'), bHint = t.querySelector('.hint');
  let table = null, lastBy = -1, passed = new Set(), sel = new Set(), step = 0;
  const lows = hands.map(h => h[0].v); let turn = lows.indexOf(Math.min(...lows));
  const others = () => [...Array(seats).keys()].filter(i => i !== me);
  const draw = () => {
    oppEl.innerHTML = others().map(i => `<div class="tl-p ${turn === i ? 'on' : ''} ${passed.has(i) ? 'out' : ''}"><b>${esc(names[i])}</b><span class="n">🂠 ${hands[i].length}</span></div>`).join('');
    handEl.innerHTML = hands[me].map(c => cardHTML(c, sel.has(c.v) ? 'sel' : '')).join('');
    handEl.querySelectorAll('.tl-card').forEach(e => { e.onclick = () => { if (turn !== me) return; const v = +e.dataset.v; sel.has(v) ? sel.delete(v) : sel.add(v); api.sfx.tap(); draw(); }; });
    pileEl.innerHTML = table ? table.cs.map(c => cardHTML(c)).join('') : `<span class="tl-free">${T('New round: play anything!', 'Vòng mới: đánh gì cũng được!')}</span>`;
    whoEl.textContent = table ? names[lastBy] : '';
    const cs = hands[me].filter(c => sel.has(c.v)), ok = turn === me && beats(classify(cs), table && table.k);
    bPlay.disabled = !ok; bPass.disabled = turn !== me || !table; bHint.disabled = turn !== me; t.classList.toggle('mine', turn === me);
  };
  const play = (i, cs) => { const set = new Set(cs.map(c => c.v)); hands[i] = hands[i].filter(c => !set.has(c.v)); table = { cs: [...cs].sort((a, b) => a.v - b.v), k: classify(cs) }; lastBy = i; api.sfx.pop(3); };
  const nextTurn = () => {
    let n = turn;
    for (let k = 0; k < seats; k++) { n = (n + 1) % seats; if (!hands[n].length) continue; if (n === lastBy) { table = null; passed.clear(); turn = n; return; } if (!passed.has(n)) { turn = n; return; } }
    table = null; passed.clear(); turn = lastBy;
  };
  // a play as one number: which cards of that player's (sorted) hand, as bits; 0 = pass
  const enc = (i, cs) => cs.reduce((m, c) => m | (1 << hands[i].findIndex(x => x.v === c.v)), 0), dec = (i, m) => hands[i].filter((_, k) => m & (1 << k));
  api.say('Tiến Lên with your friends! Beat the cards on the table, or pass.', 'Tiến Lên với các bạn! Chặn bài trên bàn, hoặc bỏ lượt.');
  while (!api.closed && hands.every(h => h.length)) {
    draw(); msgEl.textContent = turn === me ? (table ? T('Your turn: beat it, or pass.', 'Tới lượt con: chặn bài, hay bỏ lượt.') : T('Your turn: play anything.', 'Tới lượt con: đánh gì cũng được.')) : T(`${names[turn]}'s turn…`, `Lượt của ${names[turn]}…`);
    let cs = null;
    if (turn === me) {
      if (api.little) { const h = choose(hands[me], table && table.k, { strong: true }); sel = new Set(h ? h.map(c => c.v) : []); draw(); }
      cs = await new Promise<ReturnType<typeof card>[] | null>(res => {
        bPlay.onclick = () => { const x = hands[me].filter(c => sel.has(c.v)); if (beats(classify(x), table && table.k)) res(x); };
        bPass.onclick = () => { if (table) res(null); };
        bHint.onclick = () => { const h = choose(hands[me], table && table.k, { strong: true }); sel = new Set(h ? h.map(c => c.v) : []); draw(); api.sfx.tap(); };
      });
      if (api.closed) return; sel = new Set(); O.move(step, cs ? enc(me, cs) : 0);
    } else {
      const m = await O.next(step, turn); if (api.closed) return;
      if (m == null) { api.say('A friend left the game.', 'Một bạn đã rời trò chơi.'); await new Promise<void>(r2 => setTimeout(r2, 1500)); return api.win({ title: T('Good game!', 'Chơi vui lắm!') }); }
      cs = m ? dec(turn, m) : null; if (cs && !beats(classify(cs), table && table.k)) cs = null;
    }
    step++;
    if (cs && cs.length) play(turn, cs); else passed.add(turn);
    if (!hands[turn].length) break;
    nextTurn();
  }
  if (api.closed) return;
  draw(); const w = hands.findIndex(h => !h.length);
  return api.win({ title: w === me ? T('You played all your cards first! You win!', 'Con đánh hết bài trước! Con thắng!') : T(`${names[w]} played all their cards first! Good game!`, `${names[w]} đánh hết bài trước! Ván hay lắm!`) });
}
