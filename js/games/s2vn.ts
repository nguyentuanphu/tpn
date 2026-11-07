// (v1.08d s2vn, owner 3 and 5 Nov 2026 AEDT: docs/cores/tasks/v108d/s2vn-brief.md) The games of Season 2, Vietnam:
// three for each new region (js/content/s2vn.ts), played on the maths kit's rounds (js/games/maths-kit.ts): a picture,
// a question said aloud in English and Vietnamese, then the right tap on an answer button or on a thing in the picture.
// Levels: Easy and Medium ask about pictures, Hard and Talent count, read and add; under-5s always get Easy. Every
// picture is our own drawing (js/art.ts, js/art/s2vn.ts). Each game has its place and host in its region (js/s2vn.ts).
import { register } from './frame.js';
import { pic } from '../art.js';
import { T } from '../i18n.js';
import { el, esc } from '../util.js';
import { play, lv, mix, pick, distinct, type Round } from './maths-kit.js';
import { customerBoat, poleBoat, basket, coin, islandSVG, netSVG, seasonSVG, gongSVG, elephantSVG, nharongSVG, partSVG, NHARONG_PARTS } from '../art/s2vn.js';
import { shapeSVG } from './maths-kit.js';

type Pair = [string, string];
type Game = { id: string; icon: string; name: Pair; intro: Pair; end: Pair; rounds: (api) => Round[] };

let styled = false;
function style() {
  if (styled) return; styled = true;
  document.head.appendChild(el('style', '', `
.s2-scene { display: flex; align-items: flex-end; justify-content: center; gap: 10px; flex-wrap: wrap; }
.s2-scene > .art { width: 96px; height: 96px; }
.s2-bubble { position: relative; background: #fff; border: 3px solid #3b2a4f; border-radius: 18px; padding: 6px 10px; display: flex; gap: 4px; align-items: center; flex-wrap: wrap; justify-content: center; max-width: 220px; min-height: 56px; }
.s2-bubble .art { width: 48px; height: 48px; }
.s2-bubble.many .art { width: 36px; height: 36px; }
.s2-bubble b { font: 900 24px var(--font, sans-serif); color: #3b2a4f; }
.s2-bubble:after { content: ''; position: absolute; left: -12px; bottom: 12px; border: 8px solid transparent; border-right-color: #3b2a4f; }
.s2-pole { position: relative; width: 96px; height: 120px; display: inline-flex; justify-content: center; }
.s2-pole > svg { position: absolute; bottom: 0; left: 0; width: 96px; height: 96px; }
.s2-hang { position: absolute; top: 0; left: 50%; transform: translateX(-50%); }
.s2-hang .art { width: 40px; height: 40px; }
.s2-boats { display: flex; gap: 6px; justify-content: center; flex-wrap: wrap; }
.s2-boats .mx-tap { padding: 0; }
.s2-want { display: flex; align-items: center; gap: 6px; font: 800 20px var(--font, sans-serif); color: #3b2a4f; background: #fff3d6; border-radius: 14px; padding: 4px 12px; }
.s2-want .art { width: 44px; height: 44px; }
.s2-pile { display: grid; grid-template-columns: repeat(4, 64px); gap: 4px; justify-content: center; background: #c8a060; border: 3px solid #3b2a4f; border-radius: 18px; padding: 8px; }
.s2-pile .mx-tap .art { width: 52px; height: 52px; }
.s2-basket { position: relative; display: inline-flex; flex-direction: column; align-items: center; }
.s2-basket .bk { position: relative; width: 72px; height: 60px; }
.s2-basket .bk > .art { position: absolute; inset: 0; width: 72px; height: 60px; }
.s2-basket .bk .in { position: absolute; left: 6px; right: 6px; top: 0; display: flex; flex-wrap: wrap; justify-content: center; gap: 0; }
.s2-basket .bk .in .art { width: 20px; height: 20px; }
.s2-basket small { font: 800 18px var(--font, sans-serif); color: #3b2a4f; }
.mx-btn.s2-opt { flex-direction: column; min-width: 96px; min-height: 96px; padding: 6px 10px; gap: 2px; }
.mx-btn.s2-opt > .art { width: 56px; height: 56px; }
.mx-btn.s2-opt small { font: 800 18px var(--font, sans-serif); color: #3b2a4f; line-height: 1.15; }
.mx-btn.s2-opt.words small { font-size: 22px; }
.s2-coins { display: flex; gap: 2px; } .s2-coins .art { width: 26px; height: 26px; }
.s2-isles { display: flex; gap: 6px; justify-content: center; align-items: flex-end; flex-wrap: wrap; max-width: 380px; }
.s2-isles .mx-tap { padding: 0; } .s2-isles .art { width: 72px; height: 72px; }
.s2-sea { display: inline-flex; background: linear-gradient(#e8f6ff 60%, #4fa8d8 60%); border-radius: 16px; padding: 4px; }
.s2-sea .art { width: 72px; height: 72px; }
div.s2-sea .art { width: 110px; height: 110px; }
.s2-stone .art { filter: grayscale(1) sepia(.35) brightness(.95) contrast(1.1); }
.s2-net .art { width: 84px; height: 84px; } .s2-net.big .art { width: 150px; height: 150px; }
.s2-plus { font: 900 34px var(--font, sans-serif); color: #3b2a4f; }
.s2-terraces { display: flex; flex-direction: column; align-items: center; gap: 2px; }
.s2-terraces .mx-tap { padding: 0; min-height: 44px; } .s2-terraces .s2-row { max-width: 88vw; }
.s2-seq { display: flex; gap: 6px; align-items: center; justify-content: center; flex-wrap: wrap; max-width: 380px; }
.s2-seq .art { width: 64px; height: 64px; } .s2-seq.gongs .art { transition: transform .15s; } .s2-seq .ring { transform: scale(1.25) rotate(-8deg); }
.s2-gap { display: inline-flex; align-items: center; justify-content: center; width: 56px; height: 56px; border: 3px dashed #3b2a4f; border-radius: 14px; font: 900 30px var(--font, sans-serif); color: #3b2a4f; }
.s2-cloth { display: flex; gap: 4px; align-items: center; justify-content: center; flex-wrap: wrap; background: #2a3a7a; border: 3px solid #ffd23f; border-radius: 12px; padding: 8px; max-width: 380px; }
.s2-cloth .s2-gap { border-color: #ffd23f; color: #ffd23f; width: 48px; height: 48px; }
.s2-house .art { width: 150px; height: 150px; }
.s2-ele .art { width: 96px; height: 96px; } .s2-ele.big .art { width: 160px; height: 160px; }
`));
}
const opt = (art: string, words: Pair | string, showArt = true) => `${showArt && art ? art : ''}<small>${esc(typeof words === 'string' ? words : T(words[0], words[1]))}</small>`;
const SHIRTS = ['#e8433a', '#3b6fe0', '#43c463', '#ff9f43', '#9a6bff', '#ff7eb8'];

// ---------- the Mekong floating market ----------
const FRUIT: [string, Pair][] = [['🥭', ['mango', 'xoài']], ['🍍', ['pineapple', 'khóm']], ['🍉', ['watermelon', 'dưa hấu']], ['🍌', ['banana', 'chuối']], ['🥥', ['coconut', 'dừa']], ['🍊', ['orange', 'cam']]];
// what a boat hangs on its cây bẹo: the fruit, and a few things that are not fruit
const SELLS: [string, Pair][] = [...FRUIT, ['🎃', ['pumpkins', 'bí đỏ']], ['🍠', ['sweet potatoes', 'khoai lang']], ['🍈', ['melons', 'dưa lưới']]];
// "tap every …" in a pile of fruit: one sentence for each fruit, so every line is recorded
const EVERY: Record<string, Pair> = {
  '🥭': ['Tap every mango on the boat!', 'Chạm vào tất cả trái xoài trên ghe!'], '🍍': ['Tap every pineapple on the boat!', 'Chạm vào tất cả trái khóm trên ghe!'],
  '🍉': ['Tap every watermelon on the boat!', 'Chạm vào tất cả trái dưa hấu trên ghe!'], '🍌': ['Tap every banana on the boat!', 'Chạm vào tất cả nải chuối trên ghe!'],
  '🥥': ['Tap every coconut on the boat!', 'Chạm vào tất cả trái dừa trên ghe!'], '🍊': ['Tap every orange on the boat!', 'Chạm vào tất cả trái cam trên ghe!']
};
const fruitsIn = (f: string, n: number) => Array.from({ length: n }, () => pic(f)).join('');
const basketOf = (f: string, n: number, num = false) => `<span class="s2-basket"><span class="bk">${basket}<span class="in">${fruitsIn(f, n)}</span></span>${num ? `<small>${n}</small>` : ''}</span>`;

const MEKONG: Game[] = [
  { id: 'mk_sampan', icon: 's2g:sampan', name: ['Sampan Fruit Seller', 'Chèo Ghe Bán Trái Cây'],
    intro: ['Paddle your sampan to the customers and sell them fruit!', 'Chèo ghe đến chỗ khách và bán trái cây nào!'], end: ['You sold all your fruit at the floating market!', 'Con bán hết trái cây ở chợ nổi rồi!'],
    rounds: api => {
      const kind = lv(api, 'fruit', 'word', 'count', 'pay'), wrongN = lv(api, 2, 2, 3, 3), n = lv(api, 4, 5, 6, 7); api.stage.dataset.lv = [kind, wrongN, n].join(',');
      return distinct(n, () => {
        const [f, name] = FRUIT[pick(0, FRUIT.length - 1)], shirt = SHIRTS[pick(0, SHIRTS.length - 1)];
        const scene = (bubble: string, cls = '') => (stage: HTMLElement) => { stage.appendChild(el('div', 's2-scene', `${customerBoat(shirt)}<div class="s2-bubble ${cls}">${bubble}</div>`)); };
        if (kind === 'fruit' || kind === 'word') {
          const wrong = mix(FRUIT.filter(x => x[0] !== f)).slice(0, wrongN), all = new Map([[f, name], ...wrong]);
          return { ask: ['The customer on the boat wants this fruit. Hand over the right basket!', 'Khách trên ghe muốn mua trái này. Con đưa đúng giỏ nhé!'], answer: f, others: wrong.map(x => x[0]),
            label: v => opt(basketOf(v, 2), all.get(v)), draw: scene(kind === 'fruit' ? pic(f) : `<b>${esc(T(name[0], name[1]))}</b>`) };
        }
        const want = pick(2, kind === 'pay' ? 6 : 5);
        if (kind === 'count') {
          const others = mix([want - 1, want + 1, want + 2, want - 2].filter(k => k >= 1 && k <= 7)).slice(0, wrongN);
          return { ask: ['The customer wants this many. Hand over the basket with the same number!', 'Khách muốn mua chừng này trái. Con đưa giỏ có số trái bằng vậy nhé!'], answer: String(want), others: others.map(String),
            label: v => basketOf(f, +v), draw: scene(fruitsIn(f, want), 'many') };
        }
        const others = mix([want - 1, want + 1, want + 2, want - 2].filter(k => k >= 1)).slice(0, wrongN);
        return { ask: ['Each fruit costs one coin. How many coins will the customer pay?', 'Mỗi trái giá một đồng. Khách trả mấy đồng?'], answer: String(want), others: others.map(String),
          label: v => `<span class="s2-coins">${coin}</span><small>${v}</small>`, draw: scene(fruitsIn(f, want), 'many') };
      });
    } },
  { id: 'mk_caybeo', icon: 's2g:caybeo', name: ['The Cây Bẹo Pole', 'Cây Bẹo Chợ Nổi'],
    intro: ['At the floating market, each boat hangs what it sells on a tall pole: the cây bẹo!', 'Ở chợ nổi, ghe bán gì thì treo cái đó lên cây sào cao: gọi là cây bẹo!'], end: ['You can read the cây bẹo like a real Mekong shopper!', 'Con đọc cây bẹo giỏi như người đi chợ nổi thật rồi!'],
    rounds: api => {
      const kind = lv(api, 'what', 'what', 'which', 'which'), wrongN = lv(api, 2, 3, 2, 3), n = lv(api, 4, 5, 6, 7), words = api.smart === 3; api.stage.dataset.lv = [kind, wrongN, n, words].join(',');
      return distinct(n, () => {
        const [f, name] = SELLS[pick(0, SELLS.length - 1)], wrong = mix(SELLS.filter(x => x[0] !== f)).slice(0, wrongN);
        if (kind === 'what') {
          const all = new Map([[f, name], ...wrong]);
          return { ask: ['What does this boat sell? Look at the top of its pole!', 'Ghe này bán gì? Con nhìn trên ngọn cây bẹo nhé!'], answer: f, others: wrong.map(x => x[0]),
            label: v => opt(pic(v), all.get(v), !api.smart || api.little), draw: stage => { stage.appendChild(el('div', 's2-scene', poleBoat(pic(f)))); } };
        }
        // which boat: several boats, each with its pole; tap the one that sells the wanted thing
        const boats = mix([[f, name], ...wrong]), hulls = ['#8a5a32', '#3b6fe0', '#43c463', '#e8433a'];
        return { ask: ['Which boat sells this? Tap its boat!', 'Ghe nào bán thứ này? Con chạm vào chiếc ghe đó nhé!'], key: f,
          right: e => (e as HTMLElement).dataset.v === f,
          draw: stage => {
            stage.appendChild(el('div', 's2-want', words ? `<b>${esc(T(name[0], name[1]))}</b>` : `${pic(f)}<b>${esc(T(name[0], name[1]))}</b>`));
            const row = el('div', 's2-boats'); stage.appendChild(row);
            return boats.map(([b], k) => { const e = el('button', '', poleBoat(pic(b), hulls[k % hulls.length])); e.dataset.v = b; e.setAttribute('aria-label', T('boat', 'ghe')); row.appendChild(e); return e; });
          } };
      });
    } },
  { id: 'mk_count', icon: 's2g:count', name: ['Floating Market Count', 'Đếm Hàng Chợ Nổi'],
    intro: ['The boats are full of fruit! Find the fruit the customers ask for.', 'Ghe đầy ắp trái cây! Con tìm trái khách cần nhé.'], end: ['You found every fruit. What a sharp-eyed seller!', 'Con tìm được hết rồi. Người bán hàng tinh mắt quá!'],
    rounds: api => {
      const total = lv(api, 6, 8, 10, 12), want = lv(api, 2, 3, 3, 4), kinds = lv(api, 2, 3, 3, 4), n = lv(api, 4, 5, 6, 7); api.stage.dataset.lv = [total, want, kinds, n].join(',');
      return distinct(n, () => {
        const pool = mix(FRUIT).slice(0, kinds), [f] = pool[0], items = mix([...Array(want).fill(f), ...Array.from({ length: total - want }, (_, i) => pool[1 + i % (kinds - 1)][0])]);
        return { ask: EVERY[f], key: f, right: e => (e as HTMLElement).dataset.v === f,
          draw: stage => { const box = el('div', 's2-pile'); stage.appendChild(box); return items.map(x => { const e = el('button', '', pic(x)); e.dataset.v = x; e.setAttribute('aria-label', T('fruit', 'trái cây')); box.appendChild(e); return e; }); } };
      });
    } }
];

// ---------- Hạ Long Bay ----------
// the clue to the hidden cave: what makes its island the only one (the hardest levels join two clues)
type Isle = { tall: boolean; tree: boolean; bird: boolean; boat: boolean; tint: string };
const CLUES: { say: Pair; is: (o: Isle) => boolean; two?: boolean }[] = [
  { say: ['The cave is in the island with a boat beside it.', 'Hang động ở trong hòn đảo có chiếc thuyền bên cạnh.'], is: o => o.boat },
  { say: ['The cave is in the island with a bird on top.', 'Hang động ở trong hòn đảo có con chim trên đỉnh.'], is: o => o.bird },
  { say: ['The cave is in the island with a tree on top.', 'Hang động ở trong hòn đảo có cái cây trên đỉnh.'], is: o => o.tree },
  { say: ['The cave is in the only tall island.', 'Hang động ở trong hòn đảo cao duy nhất.'], is: o => o.tall },
  { say: ['The cave is in the tall island with a boat beside it.', 'Hang động ở trong hòn đảo cao có chiếc thuyền bên cạnh.'], is: o => o.tall && o.boat, two: true },
  { say: ['The cave is in the short island with a bird on top.', 'Hang động ở trong hòn đảo thấp có con chim trên đỉnh.'], is: o => !o.tall && o.bird, two: true },
  { say: ['The cave is in the tall island with a tree on top.', 'Hang động ở trong hòn đảo cao có cái cây trên đỉnh.'], is: o => o.tall && o.tree, two: true }
];
// the rocks of the bay named after what they look like (the animal drawn in stone)
const ROCKS: [string, Pair, Pair][] = [
  ['🐔', ['a rooster', 'con gà trống'], ['Which rock island looks like a rooster?', 'Hòn đảo đá nào trông giống con gà trống?']],
  ['🐸', ['a toad', 'con cóc'], ['Which rock island looks like a toad?', 'Hòn đảo đá nào trông giống con cóc?']],
  ['🐢', ['a turtle', 'con rùa'], ['Which rock island looks like a turtle?', 'Hòn đảo đá nào trông giống con rùa?']],
  ['🐘', ['an elephant', 'con voi'], ['Which rock island looks like an elephant?', 'Hòn đảo đá nào trông giống con voi?']],
  ['🐶', ['a dog', 'con chó'], ['Which rock island looks like a dog?', 'Hòn đảo đá nào trông giống con chó?']]
];
const stone = (e: string) => `<span class="s2-stone">${pic(e)}</span>`;
const HALONG: Game[] = [
  { id: 'hl_cave', icon: 's2g:cave', name: ['Find the Hidden Cave', 'Tìm Hang Động Bí Ẩn'],
    intro: ['A cave is hidden in one of the islands. Listen to the clue and find it!', 'Có một hang động trốn trong một hòn đảo. Nghe gợi ý và tìm ra nhé!'], end: ['You found every hidden cave in the bay!', 'Con tìm được hết hang động trong vịnh rồi!'],
    rounds: api => {
      const isles = lv(api, 3, 4, 5, 6), two = lv(api, false, false, true, true), n = lv(api, 4, 5, 6, 7); api.stage.dataset.lv = [isles, two, n].join(',');
      const tints = ['#a8a092', '#b8ae9e', '#9a9488', '#c0b6a4'];
      return distinct(n, () => {
        const pool = CLUES.filter(c => !c.two || two), clue = pool[pick(0, pool.length - 1)];
        let list: Isle[] = [];
        for (let t = 0; t < 200; t++) { list = Array.from({ length: isles }, (_, i) => ({ tall: Math.random() < .45, tree: Math.random() < .4, bird: Math.random() < .35, boat: Math.random() < .35, tint: tints[i % tints.length] })); if (list.filter(clue.is).length === 1) break; }
        const right = list.findIndex(clue.is);
        return { ask: clue.say, key: clue.say[0], right: e => (e as HTMLElement).dataset.k === String(right),
          draw: stage => { const row = el('div', 's2-isles'); stage.appendChild(row); return list.map((o, k) => { const e = el('button', '', islandSVG(o)); e.dataset.k = String(k); e.setAttribute('aria-label', T('island', 'hòn đảo')); row.appendChild(e); return e; }); } };
      });
    } },
  { id: 'hl_rocks', icon: 's2g:rocks', name: ['Rock Shapes of Hạ Long', 'Đảo Đá Hình Gì?'],
    intro: ['The islands of Hạ Long are named after what they look like. Look closely!', 'Các hòn đảo ở Hạ Long được đặt tên theo hình dáng. Con nhìn thật kỹ nhé!'], end: ['You know the rock shapes of Hạ Long Bay!', 'Con biết hình các đảo đá ở Vịnh Hạ Long rồi!'],
    rounds: api => {
      const kind = lv(api, 'what', 'what', 'which', 'which'), wrongN = lv(api, 2, 3, 2, 3), n = lv(api, 4, 5, 5, 5), words = api.smart === 3; api.stage.dataset.lv = [kind, wrongN, n, words].join(',');
      return distinct(n, () => {
        const [e, name, which] = ROCKS[pick(0, ROCKS.length - 1)], wrong = mix(ROCKS.filter(x => x[0] !== e)).slice(0, wrongN);
        if (kind === 'what') { const all = new Map([[e, name], ...wrong.map(x => [x[0], x[1]] as [string, Pair])]);
          return { ask: ['What does this rock island look like?', 'Hòn đảo đá này trông giống con gì?'], answer: e, others: wrong.map(x => x[0]),
            label: v => opt(pic(v), all.get(v)), draw: stage => { stage.appendChild(el('div', 's2-sea', stone(e))); } }; }
        const rocks = mix([e, ...wrong.map(x => x[0])]);
        return { ask: which, key: e, right: x => (x as HTMLElement).dataset.v === e,
          draw: stage => { if (words) stage.appendChild(el('div', 's2-want', `<b>${esc(T(name[0], name[1]))}</b>`)); const row = el('div', 's2-isles'); stage.appendChild(row);
            return rocks.map(r => { const x = el('button', 's2-sea', stone(r)); x.dataset.v = r; x.setAttribute('aria-label', T('rock island', 'đảo đá')); row.appendChild(x); return x; }); } };
      });
    } },
  { id: 'hl_nets', icon: 's2g:nets', name: ['Fishing Village Nets', 'Kéo Lưới Làng Chài'],
    intro: ['The fishing boats are back! Let us look at the nets.', 'Thuyền đánh cá về rồi! Mình cùng xem lưới nhé.'], end: ['What a good catch for the fishing village!', 'Làng chài được mẻ cá thật to!'],
    rounds: api => {
      const kind = lv(api, 'most', 'most3', 'count', 'add'), wrongN = lv(api, 2, 2, 3, 3), n = lv(api, 4, 5, 6, 7); api.stage.dataset.lv = [kind, wrongN, n].join(',');
      return distinct(n, () => {
        if (kind === 'most' || kind === 'most3') {
          const k = kind === 'most' ? 2 : 3, counts = mix(Array.from({ length: 9 }, (_, i) => i + 1)).slice(0, k), top = Math.max(...counts);
          return { ask: ['Which net has the most fish?', 'Lưới nào có nhiều cá nhất?'], key: 'most', right: e => (e as HTMLElement).dataset.v === String(top),
            draw: stage => { const row = el('div', 's2-isles'); stage.appendChild(row); return counts.map(c => { const e = el('button', 's2-net', netSVG(c)); e.dataset.v = String(c); e.setAttribute('aria-label', T('net', 'lưới')); row.appendChild(e); return e; }); } };
        }
        if (kind === 'count') { const c = pick(3, 9), others = mix([c - 1, c + 1, c + 2, c - 2].filter(x => x >= 1)).slice(0, wrongN);
          return { ask: ['How many fish are in the net?', 'Trong lưới có mấy con cá?'], answer: String(c), others: others.map(String), draw: stage => { stage.appendChild(el('div', 's2-net big', netSVG(c))); } }; }
        const a = pick(2, 7), b = pick(2, 7), sum = a + b, others = mix([sum - 1, sum + 1, sum + 2, sum - 2]).slice(0, wrongN);
        return { ask: ['Two boats caught fish. How many fish are there altogether?', 'Hai thuyền kéo được cá. Tất cả có bao nhiêu con cá?'], answer: String(sum), others: others.map(String),
          draw: stage => { stage.appendChild(el('div', 's2-isles', `<span class="s2-net">${netSVG(a)}</span><b class="s2-plus">+</b><span class="s2-net">${netSVG(b)}</span>`)); } };
      });
    } }
];

// ---------- Sapa ----------
const sprout = (x: number, y: number) => `<path d="M${x} ${y}v-9M${x} ${y - 5}l-4-4M${x} ${y - 6}l4-4" stroke="#2f8a4a" stroke-width="2.4" stroke-linecap="round" fill="none"/>`;
// one terrace as a strip (the top ones are narrower), with its rice plants; empty, it is water
const rowSVG = (c: number, w: number, hi = false) => `<svg class="art s2-row" viewBox="0 0 ${w} 26" style="width:${w * 1.6}px;height:42px" aria-hidden="true"><rect x="1.5" y="1.5" width="${w - 3}" height="23" rx="4" fill="${c ? '#7ac860' : '#4fa8d8'}" stroke="${hi ? '#e8433a' : '#3b2a4f'}" stroke-width="${hi ? 4 : 2.6}"/>${Array.from({ length: c }, (_, k) => sprout(10 + k * ((w - 20) / Math.max(1, c - 1 || 1)), 22)).join('')}</svg>`;
const SEASONS: Pair[] = [['water in spring', 'nước mùa xuân'], ['green rice in summer', 'lúa xanh mùa hè'], ['golden rice in autumn', 'lúa vàng mùa thu'], ['resting fields in winter', 'ruộng nghỉ mùa đông']];
const PAT_COLS = ['#e8433a', '#ffd23f', '#3cc7e8', '#43c463', '#ff7eb8'], PAT_SHAPES = ['diamond', 'triangle', 'square', 'circle', 'star'];
const SAPA: Game[] = [
  { id: 'sp_terrace', icon: 's2g:terrace', name: ['Plant the Rice Terraces', 'Cấy Lúa Ruộng Bậc Thang'],
    intro: ['It is spring in Sapa. Let us plant rice on the terraces!', 'Mùa xuân ở Sapa rồi. Cùng cấy lúa trên ruộng bậc thang nhé!'], end: ['The terraces are green with rice. Well done, farmer!', 'Ruộng bậc thang xanh mướt lúa rồi. Bác nông dân nhỏ giỏi quá!'],
    rounds: api => {
      const kind = lv(api, 'empty', 'most', 'count', 'more'), rowsN = lv(api, 3, 4, 4, 5), wrongN = lv(api, 2, 2, 3, 3), n = lv(api, 4, 5, 6, 7); api.stage.dataset.lv = [kind, rowsN, wrongN, n].join(',');
      return distinct(n, () => {
        let rows = Array.from({ length: rowsN }, () => pick(1, 5));
        if (kind === 'empty') rows[pick(0, rowsN - 1)] = 0;
        if (kind === 'most') { for (let t = 0; t < 50 && rows.filter(c => c === Math.max(...rows)).length > 1; t++) rows = Array.from({ length: rowsN }, () => pick(1, 6)); }
        const top = rows.length - 1, draw = (hi = false) => (stage: HTMLElement) => { const col = el('div', 's2-terraces'); stage.appendChild(col);
          return rows.map((c, i) => [c, i] as [number, number]).reverse().map(([c, i]) => { const e = el('button', '', rowSVG(c, 60 + (rowsN - 1 - i) * 22, hi && i === top)); e.dataset.k = String(i); e.setAttribute('aria-label', T('terrace', 'thửa ruộng')); col.appendChild(e); return e; }); };
        if (kind === 'empty') { const k = rows.indexOf(0); return { ask: ['Tap the terrace with no rice yet!', 'Chạm vào thửa ruộng chưa có lúa!'], key: 'empty', right: e => (e as HTMLElement).dataset.k === String(k), draw: draw() }; }
        if (kind === 'most') { const k = rows.indexOf(Math.max(...rows)); return { ask: ['Which terrace has the most rice plants?', 'Thửa ruộng nào có nhiều cây lúa nhất?'], key: 'most', right: e => (e as HTMLElement).dataset.k === String(k), draw: draw() }; }
        const c = rows[top];
        if (kind === 'count') { const others = mix([c - 1, c + 1, c + 2, c - 2].filter(x => x >= 0)).slice(0, wrongN);
          return { ask: ['How many rice plants are on the top terrace?', 'Thửa ruộng trên cùng có mấy cây lúa?'], answer: String(c), others: others.map(String), draw: stage => { draw(true)(stage).forEach(e => { e.disabled = true; }); } }; }
        const need = 6 - c, others = mix([need - 1, need + 1, need + 2, need - 2].filter(x => x >= 0)).slice(0, wrongN);
        return { ask: ['The top terrace needs six rice plants. How many more must we plant?', 'Thửa ruộng trên cùng cần sáu cây lúa. Mình phải cấy thêm mấy cây?'], answer: String(need), others: others.map(String), draw: stage => { draw(true)(stage).forEach(e => { e.disabled = true; }); } };
      });
    } },
  { id: 'sp_seasons', icon: 's2g:seasons', name: ['Rice Through the Year', 'Mùa Lúa Ruộng Bậc Thang'],
    intro: ['The terraces change colour all year round. What comes next?', 'Ruộng bậc thang đổi màu quanh năm. Tiếp theo là gì nhỉ?'], end: ['You know the rice terraces through the whole year!', 'Con biết ruộng bậc thang cả năm rồi!'],
    rounds: api => {
      const shown = lv(api, 1, 2, 3, 3), kind = lv(api, 'next', 'next', 'missing', 'missing'), wrongN = lv(api, 2, 2, 3, 3), n = lv(api, 4, 4, 4, 4), words = api.smart === 3; api.stage.dataset.lv = [shown, kind, wrongN, words].join(',');
      return distinct(n, k => {
        const start = (k + pick(0, 3)) % 4, seq = Array.from({ length: shown + 1 }, (_, i) => (start + i) % 4), gap = kind === 'next' ? shown : pick(1, shown - 1), ans = seq[gap];
        const wrong = mix([0, 1, 2, 3].filter(x => x !== ans)).slice(0, wrongN);
        return { ask: kind === 'next' ? ['What comes next on the rice terraces?', 'Tiếp theo ruộng bậc thang sẽ thế nào?'] : ['What is missing on the rice terraces?', 'Ruộng bậc thang còn thiếu mùa nào?'],
          answer: String(ans), others: wrong.map(String), label: v => opt(seasonSVG(+v), SEASONS[+v], !words || api.little),
          draw: stage => { stage.appendChild(el('div', 's2-seq', seq.slice(0, kind === 'next' ? shown : seq.length).map((x, i) => i === gap ? '<span class="s2-gap">?</span>' : seasonSVG(x)).join('') + (kind === 'next' ? '<span class="s2-gap">?</span>' : ''))); } };
      });
    } },
  { id: 'sp_brocade', icon: 's2g:brocade', name: ['Brocade Patterns', 'Hoa Văn Thổ Cẩm'],
    intro: ['In Sapa, grandmas stitch bright patterns on blue cloth. Finish the pattern!', 'Ở Sapa, các bà thêu hoa văn rực rỡ trên vải chàm. Con hoàn thành hoa văn nhé!'], end: ['What a beautiful piece of brocade!', 'Tấm thổ cẩm đẹp quá!'],
    rounds: api => {
      const unit = lv(api, ['A', 'B'], ['A', 'B', 'C'], ['A', 'A', 'B'], ['A', 'B', 'B', 'C']), wrongN = lv(api, 2, 2, 3, 3), n = lv(api, 4, 5, 6, 7); api.stage.dataset.lv = [unit.join(''), wrongN, n].join(',');
      return distinct(n, () => {
        const sh = mix(PAT_SHAPES), co = mix(PAT_COLS), letters = [...new Set(unit)], look: Record<string, string> = {}; letters.forEach((L, i) => { look[L] = sh[i] + '|' + co[i]; });
        const len = unit.length * 2 + pick(0, unit.length - 1), seq = Array.from({ length: len + 1 }, (_, i) => look[unit[i % unit.length]]), ans = seq[len];
        const pool = [...new Set([...letters.map(L => look[L]), ...sh.slice(0, 3).map((s2, i) => s2 + '|' + co[(i + 2) % co.length])])].filter(v => v !== ans);
        const art = (v: string) => { const [a, b] = v.split('|'); return shapeSVG(a, b, 44); };
        return { ask: ['What comes next in the brocade pattern?', 'Tiếp theo trong hoa văn thổ cẩm là gì?'], answer: ans, others: mix(pool).slice(0, wrongN), label: v => art(v),
          draw: stage => { stage.appendChild(el('div', 's2-cloth', seq.slice(0, len).map(art).join('') + '<span class="s2-gap">?</span>')); } };
      });
    } }
];

// ---------- the Central Highlands ----------
const GONGS: Pair[] = [['big gong', 'chiêng lớn'], ['middle gong', 'chiêng vừa'], ['small gong', 'chiêng nhỏ']];
const PARTS: Record<string, Pair> = { roof: ['the roof', 'mái nhà'], stilts: ['the stilts', 'cột nhà sàn'], ladder: ['the ladder', 'cầu thang'], door: ['the door', 'cửa ra vào'], tip: ['the roof tip', 'chóp mái'] };
const TAYNGUYEN: Game[] = [
  { id: 'tn_gong', icon: 's2g:gong', name: ['Gong Rhythm', 'Nhịp Cồng Chiêng'],
    intro: ['Big gongs sing low and small gongs sing high. Listen to the rhythm!', 'Chiêng lớn kêu trầm, chiêng nhỏ kêu bổng. Con nghe nhịp nhé!'], end: ['You play the gongs like the Central Highlands!', 'Con đánh cồng chiêng giỏi như người Tây Nguyên!'],
    rounds: api => {
      const unit = lv(api, [0, 2], [0, 1, 2], [0, 0, 2], [0, 2, 1, 2]), wrongN = 2, n = lv(api, 4, 5, 6, 7); api.stage.dataset.lv = [unit.join(''), n].join(',');
      return distinct(n, () => {
        const map = mix([0, 1, 2]), seq = Array.from({ length: unit.length * 2 + pick(0, unit.length - 1) + 1 }, (_, i) => map[unit[i % unit.length]]), ans = seq.pop()!;
        return { ask: ['Listen to the gongs. Which gong comes next?', 'Nghe tiếng cồng chiêng. Chiếc chiêng nào đánh tiếp theo?'], answer: String(ans), others: [0, 1, 2].filter(x => x !== ans).map(String).slice(0, wrongN),
          label: v => opt(gongSVG(+v), GONGS[+v]),
          draw: stage => { const row = el('div', 's2-seq gongs', seq.map(k => gongSVG(k)).join('') + '<span class="s2-gap">?</span>'); stage.appendChild(row);
            // each gong lights and sounds in turn (low for the big one, high for the small one)
            seq.forEach((k, i) => setTimeout(() => { if (api.closed) return; const g = row.children[i] as HTMLElement; g?.classList.add('ring'); api.sfx.note?.([0, 3, 6][k]); setTimeout(() => g?.classList.remove('ring'), 300); }, 700 + i * 450)); } };
      });
    } },
  { id: 'tn_nharong', icon: 's2g:nharong', name: ['Build the Nhà Rông', 'Dựng Nhà Rông'],
    intro: ['The village is building its nhà rông. Find the missing part!', 'Buôn làng đang dựng nhà rông. Con tìm phần còn thiếu nhé!'], end: ['The nhà rông stands tall. The whole village can meet inside!', 'Nhà rông đã dựng xong, cao vút. Cả buôn làng vào họp được rồi!'],
    rounds: api => {
      const wrongN = lv(api, 2, 3, 4, 4), pics = lv(api, 1, 1, 1, 0), n = lv(api, 4, 5, 5, 5); api.stage.dataset.lv = [wrongN, pics, n].join(',');
      return distinct(n, k => {
        const miss = NHARONG_PARTS[(k + pick(0, 4)) % 5], wrong = mix(NHARONG_PARTS.filter(x => x !== miss)).slice(0, wrongN);
        return { ask: ['Which part of the nhà rông is missing?', 'Nhà rông còn thiếu phần nào?'], answer: miss, others: wrong, label: v => opt(partSVG(v), PARTS[v], !!pics || api.little),
          draw: stage => { stage.appendChild(el('div', 's2-house', nharongSVG(miss))); } };
      });
    } },
  { id: 'tn_elephant', icon: 's2g:elephant', name: ['Feed the Elephants', 'Cho Voi Ăn'],
    intro: ['The elephants of Buôn Đôn are hungry. Let us count their bananas!', 'Những chú voi ở Buôn Đôn đói rồi. Mình cùng đếm chuối cho voi nhé!'], end: ['The elephants are full and happy. Thank you!', 'Các chú voi no căng bụng, vui lắm. Cảm ơn con!'],
    rounds: api => {
      const kind = lv(api, 'most', 'most3', 'left', 'share'), wrongN = lv(api, 2, 2, 3, 3), n = lv(api, 4, 5, 6, 7); api.stage.dataset.lv = [kind, wrongN, n].join(',');
      return distinct(n, () => {
        if (kind === 'most' || kind === 'most3') { const counts = mix([1, 2, 3, 4, 5, 6, 7, 8]).slice(0, kind === 'most' ? 2 : 3), top = Math.max(...counts);
          return { ask: ['Which elephant has the most bananas?', 'Chú voi nào có nhiều chuối nhất?'], key: 'most', right: e => (e as HTMLElement).dataset.v === String(top),
            draw: stage => { const row = el('div', 's2-isles'); stage.appendChild(row); return counts.map(c => { const e = el('button', 's2-ele', elephantSVG(c)); e.dataset.v = String(c); e.setAttribute('aria-label', T('elephant', 'chú voi')); row.appendChild(e); return e; }); } }; }
        if (kind === 'left') { const c = pick(4, 10), left = c - 2, others = mix([left - 1, left + 1, left + 2, c]).filter(x => x !== left).slice(0, wrongN);
          return { ask: ['The elephant eats two bananas. How many are left?', 'Chú voi ăn hai quả chuối. Còn lại mấy quả?'], answer: String(left), others: others.map(String), draw: stage => { stage.appendChild(el('div', 's2-ele big', elephantSVG(c))); } }; }
        const c = pick(2, 5) * 2, half = c / 2, others = mix([half - 1, half + 1, half + 2, c]).filter(x => x !== half && x > 0).slice(0, wrongN);
        return { ask: ['Share the bananas between two elephants. How many does each elephant get?', 'Chia đều chuối cho hai chú voi. Mỗi chú được mấy quả?'], answer: String(half), others: others.map(String), draw: stage => { stage.appendChild(el('div', 's2-ele big', elephantSVG(c))); } };
      });
    } }
];

export const S2_GAMES: Game[] = [...MEKONG, ...HALONG, ...SAPA, ...TAYNGUYEN];
for (const G of S2_GAMES) register({
  id: G.id, learn: true, icon: G.icon, name: () => T(G.name[0], G.name[1]),
  run: api => { style(); const list = G.rounds(api);
    // the answer buttons drawn as picture-and-word cards, as each round puts them up
    const mark = new MutationObserver(() => api.stage.querySelectorAll('.mx-btn:not(.s2-opt)').forEach(b => { b.classList.add('s2-opt'); if (!b.querySelector('svg')) b.classList.add('words'); }));
    mark.observe(api.stage, { childList: true, subtree: true }); api.onCleanup?.(() => mark.disconnect());
    return play(api, list, G.intro, G.end).finally(() => mark.disconnect()); }
});
