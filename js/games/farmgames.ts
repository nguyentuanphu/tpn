// The original Sparkle Valley activities: order board, sorting baskets, feeding the bunny,
// the photo jigsaw, odd one out, copy the tune, building a tower, the duckling maze,
// the hot-air balloon and the bubble machine.
import { register, untilRight, choiceButtons, tapOne, GAMES } from './frame.js';
import { T, numWord, COLORS } from '../i18n.js';
import { settings } from '../state.js';
import { sayIn } from '../voice.js';
import { SFX } from '../audio.js';
import { shuffle, pick, el, wait } from '../util.js';
import { avatarURL } from '../avatar.js';

const FARM = ['🥕', '🍓', '🍅', '🌽', '🌻', '🎃', '🥚', '🥛'];
const FARM_NAMES = { '🥕': ['carrots', 'cà rốt'], '🍓': ['strawberries', 'dâu tây'], '🍅': ['tomatoes', 'cà chua'], '🌽': ['corn cobs', 'bắp ngô'], '🌻': ['sunflowers', 'hoa hướng dương'], '🎃': ['pumpkins', 'bí ngô'], '🥚': ['eggs', 'trứng'], '🥛': ['bottles of milk', 'chai sữa'] };
const CUSTOMERS = ['🐷', '🐮', '🐔', '🐑', '🦊', '🐼', '🐨', '🐵'];

// ---------- Order board: "Can I have 3 🥕?" ----------
register({
  id: 'order', icon: '📋', name: () => T('Order Board', 'Bảng Đặt Hàng'),
  async run(api) {
    const rounds = 3, max = [3, 5, 7, 10, 12][api.level - 1];
    for (let r = 0; r < rounds; r++) {
      api.dots(rounds, r); api.stage.innerHTML = '';
      const item = pick(FARM), n = 1 + Math.floor(Math.random() * max), who = pick(CUSTOMERS), [en, vi] = FARM_NAMES[item];
      // big kids sometimes get two different things in one order
      const two = !api.little && api.level >= 4 && Math.random() < .5;
      const item2 = two ? pick(FARM.filter(x => x !== item)) : null, n2 = two ? 1 + Math.floor(Math.random() * 4) : 0;
      api.stage.appendChild(el('div', 'customer', `<span class="who">${who}</span><span class="bubble">${n} × ${item}${two ? `<br>${n2} × ${item2}` : ''}</span>`));
      const tray = el('div', 'tray', `<div class="sum"></div><div class="coins"></div>`); api.stage.appendChild(tray);
      const pile = el('div', 'pile'); api.stage.appendChild(pile);
      const want = { [item]: n }; if (two) want[item2] = n2;
      api.say(two ? `Can I have ${n} ${en} and ${n2} ${FARM_NAMES[item2][0]}, please?` : `Can I have ${n} ${en}, please?`, two ? `Cho tớ ${numWord(n)} ${vi} và ${numWord(n2)} ${FARM_NAMES[item2][1]} nhé?` : `Cho tớ ${numWord(n)} ${vi} được không?`);
      const got = {}; const sumEl = tray.querySelector('.sum'), inTray = tray.querySelector('.coins');
      const show = () => { sumEl.textContent = Object.entries(got).map(([k, v]) => `${v} × ${k}`).join('   ') || T('Tap the food to put it in the basket', 'Chạm vào đồ ăn để cho vào giỏ'); };
      show();
      // (r89) auto play fills the order like a child: takes back anything extra, then adds what is still missing
      const kindOf = new Map<Element, string>(), ofKind = (box: Element, k: string) => [...box.children].find((e): e is HTMLElement => e instanceof HTMLElement && kindOf.get(e) === k) || null;
      api.plan(() => { if (!pile.isConnected) return null; const over = Object.keys(got).find(k => got[k] > (want[k] || 0)); if (over) return ofKind(inTray, over);
        const need = Object.keys(want).find(k => (got[k] || 0) < want[k]); return need ? ofKind(pile, need) : null; }, { maxActions: rounds * (max + 6) * 2 });
      await new Promise<void>(res => {
        Object.keys(want).concat(shuffle(FARM.filter(x => !want[x])).slice(0, api.level >= 3 ? 2 : 1)).forEach(k => {
          const b = el('button', 'choice', k); kindOf.set(b, k); pile.appendChild(b);
          b.onclick = () => {
            got[k] = (got[k] || 0) + 1; const total = got[k];
            const t = el('span', 'tray-item', k); kindOf.set(t, k); t.onclick = () => { got[k]--; if (!got[k]) delete got[k]; t.remove(); show(); }; inTray.appendChild(t);
            sayIn(settings.lang, numWord(total)); SFX.pop(total); show();
            const ok = Object.keys(want).every(x => got[x] === want[x]) && Object.keys(got).every(x => want[x]);
            if (ok) { api.right(tray); res(); }
            else if (got[k] > (want[k] || 0)) api.say(want[k] ? 'Oops, one too many! Tap it in the basket to take it out.' : 'Hmm, that is not on the order. Tap it to take it out.', want[k] ? 'Ôi, thừa một rồi! Chạm vào giỏ để lấy ra nhé.' : 'Ừm, món này không có trong đơn. Chạm để lấy ra nhé.');
          };
        });
        api.onCleanup(res);
      });
      if (api.closed) return;
      api.say('Thank you so much!', 'Cảm ơn con nhiều nhé!'); await wait(1400);
    }
    api.dots(rounds, rounds); return api.win();
  }
});

// ---------- Sort it out: into baskets by colour, then by kind ----------
const KINDS = { fruit: ['🍎', '🍌', '🍇', '🍓', '🍊', '🍐'], animal: ['🐶', '🐱', '🐰', '🐸', '🐷', '🐮'], vehicle: ['🚗', '🚌', '🚂', '🚲', '🚀', '🚒'] };
const KIND_NAME = { fruit: ['fruit', 'trái cây'], animal: ['animals', 'con vật'], vehicle: ['things that go', 'xe cộ'] };
register({
  id: 'sortout', icon: '🧺', name: () => T('Sort It Out', 'Phân Loại Nào'),
  async run(api) {
    const rounds = 2;
    for (let r = 0; r < rounds; r++) {
      api.dots(rounds, r); api.stage.innerHTML = '';
      const byKind = api.level >= 3 || r === 1 && api.level >= 2;
      const nb = api.level <= 1 ? 2 : 3, per = api.level <= 2 ? 2 : 3;
      let groups;
      if (byKind) { const ks = shuffle(Object.keys(KINDS)).slice(0, nb); groups = ks.map(k => ({ key: k, label: KINDS[k][0], items: shuffle(KINDS[k]).slice(0, per), say: KIND_NAME[k] })); }
      else { const cs = shuffle(COLORS).slice(0, nb); groups = cs.map(c => ({ key: c.en, color: c.hex, label: '', items: Array(per).fill('●'), say: [c.en, c.vi] })); }
      api.say(byKind ? 'Put each thing in the right basket!' : 'Put each ball in the basket of the same colour!', byKind ? 'Cho mỗi thứ vào đúng giỏ nhé!' : 'Cho mỗi quả bóng vào giỏ cùng màu nhé!');
      const baskets = el('div', 'baskets'); api.stage.appendChild(baskets);
      const bEls = groups.map(g => { const b = el('button', 'basket', `<span class="bl">${g.label || ''}</span><span class="bin">🧺</span><span class="in"></span>`); if (g.color) b.style.setProperty('--bk', g.color); b._g = g; baskets.appendChild(b); return b; });
      const pool = el('div', 'pool'); api.stage.appendChild(pool);
      const items = shuffle(groups.flatMap(g => g.items.map(it => ({ it, g }))));
      for (const x of items) {
        const t = el('button', 'choice sitem2' + (x.g.color ? ' ball' : ''), x.g.color ? '' : x.it); if (x.g.color) t.style.setProperty('--bk', x.g.color); t._x = x; pool.appendChild(t);
      }
      let left = items.length, held = null;
      api.plan(() => held ? bEls.find(b => b._g === held._x.g) : pool.querySelector('.choice:not(.gone)'), { maxActions: rounds * nb * per * 2 });
      while (left > 0) {
        const e = await tapOne([...pool.querySelectorAll('.choice:not(.gone)'), ...bEls], api); if (api.closed) return;
        if (e.classList.contains('basket')) {
          if (!held) { api.say('First tap a thing, then its basket.', 'Chạm vào đồ trước, rồi chạm vào giỏ nhé.'); continue; }
          if (held._x.g === e._g) { held.classList.add('gone'); e.querySelector('.in').insertAdjacentHTML('beforeend', held._x.g.color ? `<i class="dot" style="background:${held._x.g.color}"></i>` : held._x.it); api.right(e); left--; held.classList.remove('held'); held = null; }
          else { api.wrong(e, `Hmm, not that basket. Where do ${held._x.g.say[0]} go?`, `Ừm, không phải giỏ này. ${held._x.g.say[1]} để ở đâu nhỉ?`); }
        } else { if (held) held.classList.remove('held'); held = e; e.classList.add('held'); SFX.tap(); }
      }
      api.praise(); await wait(1300);
    }
    api.dots(rounds, rounds); return api.win();
  }
});

// ---------- Feed the bunny N carrots (then decide when it is enough) ----------
register({
  id: 'bunny', icon: '🐰', name: () => T('Feed the Bunny', 'Cho Thỏ Ăn'),
  async run(api) {
    const rounds = 3, max = [3, 5, 8, 10, 15][api.level - 1];
    for (let r = 0; r < rounds; r++) {
      api.dots(rounds, r); api.stage.innerHTML = '';
      const n = 1 + Math.floor(Math.random() * max);
      const bunny = el('div', 'bunny', `<span class="b">🐰</span><span class="bubble">${n} 🥕</span><span class="tum"></span>`); api.stage.appendChild(bunny);
      api.say(`The bunny is hungry! Give it ${n} carrots, then press the tick.`, `Thỏ con đói rồi! Cho thỏ ăn ${numWord(n)} củ cà rốt, rồi bấm dấu tích.`);
      const tum = bunny.querySelector('.tum');
      const row = el('div', 'choices'); api.stage.appendChild(row);
      const give = el('button', 'choice', '🥕'), done = el('button', 'choice go', '✅'), back = el('button', 'choice', '↩️'); row.append(back, give, done);
      let fed = 0;
      const ok = await new Promise<boolean>(res => {
        give.onclick = () => { fed++; tum.insertAdjacentHTML('beforeend', '<i>🥕</i>'); sayIn(settings.lang, numWord(fed)); SFX.pop(fed); bunny.querySelector('.b').classList.remove('nom'); void bunny.offsetWidth; bunny.querySelector('.b').classList.add('nom'); };
        back.onclick = () => { if (!fed) return; fed--; tum.lastChild && tum.lastChild.remove(); SFX.tap(); };
        done.onclick = () => {
          if (fed === n) return res(true);
          if (fed < n) api.wrong(bunny, `That is ${fed}. The bunny wants ${n}. A few more!`, `Mới có ${numWord(fed)} củ. Thỏ muốn ${numWord(n)} củ cơ. Thêm nữa nào!`);
          else api.wrong(bunny, `That is ${fed}, too many! The bunny wants ${n}. Take some back.`, `${numWord(fed)} củ, nhiều quá rồi! Thỏ chỉ muốn ${numWord(n)} củ. Lấy bớt ra nhé.`);
        };
        api.plan(() => row.isConnected ? fed < n ? give : fed > n ? back : done : null, { maxActions: rounds * (max + 2) });
        api.onCleanup(() => res(false));
      });
      if (!ok || api.closed) return;
      api.right(bunny); api.say(`${n} carrots! Munch munch. Thank you!`, `${numWord(n)} củ cà rốt! Măm măm. Cảm ơn con!`); await wait(1600);
    }
    api.dots(rounds, rounds); return api.win();
  }
});

// ---------- Photo jigsaw of the child's own face ----------
register({
  id: 'jigsaw', icon: '🖼️', name: () => T('Photo Puzzle', 'Ghép Ảnh Của Bé'),
  async run(api) {
    const n = [2, 2, 3, 3, 4][api.level - 1];
    const src = avatarURL(api.players[0]);
    api.say('Put your picture back together! Tap two pieces to swap them.', 'Ghép lại bức ảnh của con nào! Chạm hai mảnh để đổi chỗ.');
    const grid = el('div', 'jig'); grid.style.setProperty('--n', n); api.stage.appendChild(grid);
    const ref = el('div', 'jig-ref', `<img src="${src}" alt="">`); api.stage.appendChild(ref);
    let order = shuffle(Array.from({ length: n * n }, (_, i) => i)); while (order.every((v, i) => v === i)) order = shuffle(order);
    const draw = () => { grid.innerHTML = ''; order.forEach((v, i) => { const b = el('button', 'jp' + (v === i ? ' ok' : '')); b._i = i; b.style.backgroundImage = `url(${src})`; b.style.backgroundSize = `${n * 100}% ${n * 100}%`; b.style.backgroundPosition = `${(v % n) / (n - 1) * 100}% ${Math.floor(v / n) / (n - 1) * 100}%`; grid.appendChild(b); }); };
    draw();
    let first = null;
    // (r89) auto play mends the picture like a child: a piece in the wrong place, then the piece that belongs there
    const piece = (i: number) => { const e = grid.children[i]; return e instanceof HTMLElement ? e : null; };
    api.plan(() => { if (!grid.isConnected) return null; if (first == null) { const i = order.findIndex((v, j) => v !== j); return i < 0 ? null : piece(i); }
      return piece(order.indexOf(first)); }, { maxActions: n * n * 3 });
    while (!order.every((v, i) => v === i)) {
      const b = await tapOne([...grid.children]); if (api.closed) return;
      if (first == null) { first = b._i; b.classList.add('held'); SFX.tap(); continue; }
      const a = first; first = null; if (a === b._i) { draw(); continue; }
      [order[a], order[b._i]] = [order[b._i], order[a]]; SFX.pop(a); draw();
      if (order[b._i] === b._i || order[a] === a) SFX.ok();
    }
    grid.classList.add('done'); await wait(600); return api.win({ title: T('That’s you!', 'Đó là con đấy!'), titleVi: 'Đó là con đấy!' });
  }
});

// ---------- Odd one out ----------
const ODD_SETS = [
  [['🍎', '🍓', '🍒'], ['🍌']], [['🐶', '🐱', '🐰'], ['🚗']], [['🚗', '🚌', '🚒'], ['🐟']], [['⭐', '⭐', '⭐'], ['🌙']], [['🔴', '🔴', '🔴'], ['🔵']],
  [['🐟', '🐠', '🐡'], ['🐦']], [['🌻', '🌷', '🌹'], ['🍄']], [['☀️', '☀️', '☀️'], ['⛅']], [['🐘', '🦒', '🦁'], ['🐧']], [['🧦', '👕', '👖'], ['🍕']],
  [['🎈', '🎈', '🎈'], ['🎁']], [['🐔', '🐤', '🦆'], ['🐄']], [['🥕', '🌽', '🥦'], ['🍰']], [['🚀', '✈️', '🚁'], ['🚲']]
];
register({
  id: 'oddone', icon: '🐸', name: () => T('Odd One Out', 'Tìm Hình Khác Loại'),
  async run(api) {
    const rounds = 4;
    for (let r = 0; r < rounds; r++) {
      api.dots(rounds, r); api.stage.innerHTML = '';
      const [same, odd] = pick(ODD_SETS), k = api.level >= 3 ? 4 : 3;
      const items = shuffle([...shuffle(same.concat(same)).slice(0, k), odd[0]]);
      api.say('Which one is different? Find the odd one out!', 'Cái nào khác loại? Tìm cái khác các bạn còn lại nhé!');
      const btns = choiceButtons(api, items, i => i as string);
      const b = await untilRight(api, btns, e => e._v === odd[0]); if (!b) return;
      api.say('Yes! That one does not belong!', 'Đúng rồi! Cái đó khác loại!'); await wait(1400);
    }
    api.dots(rounds, rounds); return api.win();
  }
});

// ---------- Copy the tune on the xylophone ----------
const BARS = ['#e8434a', '#ff9a2e', '#ffd23f', '#5fd39a', '#3cc7e8', '#3d7fd6', '#9a6bff', '#ff7eb8'];
register({
  id: 'tune', icon: '🎵', name: () => T('Copy the Tune', 'Nhại Giai Điệu'),
  async run(api) {
    const keys = api.level <= 2 ? 4 : api.level <= 4 ? 6 : 8, start = [2, 3, 3, 4, 5][api.level - 1], rounds = 3;
    const xy = el('div', 'xylo'); api.stage.appendChild(xy);
    const bars = Array.from({ length: keys }, (_, i) => { const b = el('button', 'bar'); b.style.background = BARS[i]; b.style.height = (100 - i * 6) + '%'; b._i = i; xy.appendChild(b); return b; });
    const play = async i => { bars[i].classList.add('on'); SFX.xylo(i); await wait(380); bars[i].classList.remove('on'); await wait(120); };
    for (let r = 0; r < rounds; r++) {
      api.dots(rounds, r);
      const seq = Array.from({ length: start + r }, () => Math.floor(Math.random() * keys));
      api.say('Listen and watch…', 'Nghe và nhìn nhé…'); xy.classList.add('busy'); await wait(1200);
      for (const i of seq) { if (api.closed) return; await play(i); }
      xy.classList.remove('busy'); api.say('Your turn! Play it back.', 'Đến lượt con! Chơi lại nhé.');
      // (r89) auto play plays the tune back note by note, and waits while the tune is played again
      let k = 0; api.plan(() => xy.isConnected && !xy.classList.contains('busy') && k < seq.length ? bars[seq[k]] : null, { maxActions: rounds * (start + rounds) * 2 });
      for (; k < seq.length;) {
        const b = await tapOne(bars); if (api.closed) return;
        play(b._i);
        if (b._i === seq[k]) k++;
        else { api.wrong(b, 'Almost! Listen again.', 'Gần đúng rồi! Nghe lại nhé.'); await wait(1300); xy.classList.add('busy'); for (const i of seq) await play(i); xy.classList.remove('busy'); k = 0; }
      }
      api.praise(); await wait(1300);
    }
    api.dots(rounds, rounds); return api.win();
  }
});

// ---------- Build a tower: biggest block first ----------
register({
  id: 'tower', icon: '🧱', name: () => T('Build a Tower', 'Xây Tháp Cao'),
  async run(api) {
    const rounds = 2;
    for (let r = 0; r < rounds; r++) {
      api.dots(rounds, r); api.stage.innerHTML = '';
      const n = Math.min(7, 2 + api.level + r);
      api.say('Build a tower! Start with the biggest block, then the next biggest.', 'Xây tháp nào! Bắt đầu bằng khối to nhất, rồi đến khối to tiếp theo.');
      const tw = el('div', 'tower'); api.stage.appendChild(tw);
      const pool = el('div', 'size-line'); api.stage.appendChild(pool);
      const sizes = Array.from({ length: n }, (_, i) => n - i);
      const btns = shuffle(sizes).map(s => { const b = el('button', 'block'); b._v = s; b.style.width = (40 + s * 22) + 'px'; b.style.background = BARS[s % BARS.length]; pool.appendChild(b); return b; });
      for (let i = 0; i < n; i++) {
        const b = await untilRight(api, btns.filter(x => !x.disabled), e => (e as HTMLButtonElement & { _v: number })._v === sizes[i]); if (!b) return;
        (b as HTMLButtonElement).disabled = true; tw.prepend(b); SFX.pop(i);
      }
      SFX.chime(); api.say('What a tall tower!', 'Tháp cao quá!'); await wait(1400);
    }
    api.dots(rounds, rounds); return api.win();
  }
});

// ---------- Duckling maze: the same maze game with ducks ----------
register({
  id: 'duckmaze', icon: '🦆', name: () => T('Duckling Maze', 'Vịt Con Tìm Mẹ'),
  run(api) { return (GAMES as Record<string, { run(api: unknown): unknown }>).maze.run(Object.assign(Object.create(api), { theme: 'duck' })); }
});

// ---------- Hot-air balloon: tap to rise, bounce off clouds, fly through rings ----------
register({
  id: 'balloon', icon: '🎈', name: () => T('Balloon Flight', 'Khinh Khí Cầu'),
  async run(api) {
    const goal = [5, 6, 8, 10, 12][api.level - 1];
    api.say('Tap to float up! Fly through the rainbow rings. Bumping a cloud is fine, just bounce!', 'Chạm để bay lên! Bay qua các vòng cầu vồng. Chạm mây cũng không sao, nảy lên thôi!');
    const cv = el('canvas', 'sky'); api.stage.appendChild(cv); api.dots(goal, 0);
    const ctx = cv.getContext('2d');
    const W = () => cv.width = cv.clientWidth * devicePixelRatio, H = () => cv.height = cv.clientHeight * devicePixelRatio;
    W(); H();
    let y = .5, vy = 0, x = 0, got = 0, rings = [], clouds = [], last = performance.now(), done = false, flash = 0;
    const tap = e => { e.preventDefault(); vy = -.55; (SFX as typeof SFX & { flap?: () => void }).flap ? (SFX as typeof SFX & { flap?: () => void }).flap() : SFX.jump(); };
    cv.addEventListener('pointerdown', tap);
    api.onCleanup(() => { done = true; cv.removeEventListener('pointerdown', tap); });
    // Follow the next visible ring with normal pointer taps; never move the balloon directly.
    api.plan(() => {
      if (done || api.closed || !cv.isConnected) return null;
      const target = rings.find(r => !r.hit && r.x >= x - .04);
      if (!target || !(y > target.y + .025 || vy > .1 && y > target.y - .07)) return null;
      const r = cv.getBoundingClientRect(); return { el: cv, x: r.left + r.width * .25, y: r.top + r.height * y, ms: 0 };
    }, { maxActions: goal * 12 + 20 });
    const spawn = () => { if (!rings.length || rings[rings.length - 1].x < x + 1.2) rings.push({ x: x + 2 + Math.random() * .4, y: .25 + Math.random() * .5, hit: false }); if (Math.random() < .02) clouds.push({ x: x + 2.2, y: Math.random() < .5 ? .08 + Math.random() * .1 : .82 + Math.random() * .1, s: .5 + Math.random() * .5 }); };
    await new Promise<void>(res => {
      const frame = now => {
        if (done) return res();
        const dt = Math.min(.05, (now - last) / 1000); last = now;
        if (cv.clientWidth * devicePixelRatio !== cv.width) { W(); H(); }
        const w = cv.width, h = cv.height, sc = h;
        vy += .9 * dt; y += vy * dt; x += .45 * dt;
        if (y < .06) { y = .06; vy = Math.abs(vy) * .5; SFX.bump(); } // bounce off the top clouds
        if (y > .92) { y = .92; vy = -.45; SFX.bump(); }                // and off the soft bottom clouds
        spawn();
        // draw sky
        const g = ctx.createLinearGradient(0, 0, 0, h); g.addColorStop(0, '#6cc8ff'); g.addColorStop(1, '#ffe9f6'); ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
        const px = xx => (xx - x) * sc + w * .25;
        ctx.font = `${sc * .12}px serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        for (const c of clouds) ctx.fillText('☁️', px(c.x), c.y * h);
        ctx.fillText('☁️', w * .15, h * .05); ctx.fillText('☁️', w * .7, h * .03); ctx.fillText('☁️', w * .4, h * .97);
        for (const r of rings) {
          const rx = px(r.x), ry = r.y * h, R = sc * .09;
          ['#ff5a5a', '#ff9f43', '#ffd23f', '#5fd39a', '#3cc7e8', '#a66bff'].forEach((c, i) => { ctx.strokeStyle = r.hit ? 'rgba(255,255,255,.4)' : c; ctx.lineWidth = sc * .008; ctx.beginPath(); ctx.ellipse(rx, ry, R * .5 - i * sc * .006, R - i * sc * .008, 0, 0, Math.PI * 2); ctx.stroke(); });
          if (!r.hit && Math.abs(r.x - (x + .0)) < .05 && Math.abs(r.y - y) < .1) { r.hit = true; got++; SFX.coin(); flash = .3; api.dots(goal, got); }
        }
        rings = rings.filter(r => r.x > x - 1); clouds = clouds.filter(c => c.x > x - 1);
        ctx.font = `${sc * .14}px serif`; ctx.fillText('🎈', w * .25, y * h - sc * .03); ctx.font = `${sc * .06}px serif`; ctx.fillText(api.players[0] ? '🧺' : '', w * .25, y * h + sc * .06);
        if (flash > 0) { flash -= dt; ctx.fillStyle = `rgba(255,255,255,${flash})`; ctx.fillRect(0, 0, w, h); }
        if (got >= goal) return res();
        requestAnimationFrame(frame);
      };
      requestAnimationFrame(frame);
    });
    if (api.closed) return;
    return api.win({ title: T(`${got} rings! What a flight!`, `${got} vòng! Bay giỏi quá!`), titleVi: `${got} vòng! Bay giỏi quá!` });
  }
});

// ---------- Bubble machine: pop the bubbles ----------
register({
  id: 'bubbles', icon: '🫧', name: () => T('Bubble Machine', 'Máy Thổi Bong Bóng'),
  async run(api) {
    const goal = [10, 12, 15, 18, 20][api.level - 1];
    api.say('Pop the bubbles! Find the ones with a star for a surprise.', 'Chọc vỡ bong bóng nào! Tìm bong bóng có ngôi sao để nhận bất ngờ nhé.');
    const box = el('div', 'bubbles'); api.stage.appendChild(box);
    let popped = 0; api.dots(goal, 0);
    await new Promise<void>(res => {
      const timer = setInterval(() => {
        if (api.closed) { clearInterval(timer); return res(); }
        if (box.children.length > 9) return;
        const b = el('button', 'bub', Math.random() < .2 ? '⭐' : ''); const s = 60 + Math.random() * 60;
        b.style.width = b.style.height = s + 'px'; b.style.left = Math.random() * 85 + '%'; b.style.animationDuration = (6 + Math.random() * 4) + 's';
        b.onclick = () => { if (b.classList.contains('popped')) return; popped++; /* (audit: a popping bubble counts once) */ SFX.pop(popped); api.dots(goal, Math.min(goal, popped)); if (b.textContent) { SFX.coin(); } b.classList.add('popped'); setTimeout(() => b.remove(), 200); if (popped >= goal) { clearInterval(timer); res(); } };
        b.addEventListener('animationend', () => b.remove());
        box.appendChild(b);
      }, 500);
      api.onCleanup(() => { clearInterval(timer); res(); });
    });
    if (api.closed) return;
    return api.win();
  }
});
