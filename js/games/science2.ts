// (v1.08 science, owner's plan 3 Nov 2026 AEDT, docs/plans/v108-owner-batch-20261103.md part D) Twelve more science
// experiments for Học vui › Khoa học: Grow a Plant, Water Cycle, Day and Night, Four Seasons, Animal Homes, My Body,
// Mixing Colours, Ice Melts, Rainbow Light, Light the Bulb, Gears Turn and Recycle Sort.
// Each one plays like the first six (js/games/science.ts, the same three steps): Guess (the child picks what will
// happen), Try (the child taps or drags the thing, or the tool, and it happens on screen), Why (one short spoken
// sentence); after the last round a fact line is said and shown before the win.
// Levels: under-5s (api.little) play gently and nobody can lose; Easy, Medium, Hard and Talent (api.smart 0-3,
// api.talent) bring more rounds, harder things, more choices, and at Talent three things predicted before any is tried.
// Every picture is our own drawing (js/art/science2.ts, or an emoji drawn in js/art.ts).
import { register } from './frame.js';
import { T } from '../i18n.js';
import { pic } from '../art.js';
import { el, shuffle, wait } from '../util.js';
import { experiment, dragOrTap, item, bg, slow, lvOf, mark, band, PLAN, style } from './science.js';
import type { Pair, Choice, Round, Ctx } from './science.js';

type It = { k: string; p?: string; html?: string; name: Pair; ans: string; hard: number; why: Pair; ask?: Pair; badge?: string[]; opts?: string[]; after?: string; v?: any };
type Opt = { pic?: string; html?: string; label: Pair };
type Game = {
  pool: It[]; opts: Record<string, Opt>; nOpt: number[]; ask?: Pair; scene: string; fact: Pair;
  y?: number; pos?: (per: number) => number[][]; place?: (it: It, i: number, per: number) => number[]; cls?: string;
  tool?: { p: string; label: Pair; x: number; y: number }; act?: Pair; actMany?: Pair;
  draw?: (x: Ctx, set: It[], btns: HTMLElement[]) => void; clash?: (a: It, b: It) => boolean;
  show: (x: Ctx, it: It, b: HTMLElement, i: number) => Promise<void>;
};

let styled = false;
function style2() {
  if (styled) return; styled = true;
  document.head.appendChild(el('style', '', `
.sx-item .sx2-art { display: block; width: 100%; height: 100%; pointer-events: none; transition: transform .5s ease; }
.sx-item .sx2-art svg.art { width: 100%; height: 100%; }
.sx-item .sx2-badges { position: absolute; left: 50%; bottom: -12px; transform: translateX(-50%); display: flex; gap: 2px; padding: 1px 4px; border-radius: 14px; background: #fff; box-shadow: 0 1px 4px rgba(0, 0, 0, .28); pointer-events: none; white-space: nowrap; }
.sx-item .sx2-badges svg.art { width: 24px; height: 24px; }
.sx-item .sx-badge svg.art { width: 30px; height: 30px; }
.sx2-tool { z-index: 4; }
.sx2-tool.sx2-used { filter: saturate(.5); }
.sx2-shake .sx2-art { animation: sx2-shake .5s ease; }
.sx2-grow .sx2-art { animation: sx2-grow .8s ease-out; }
.sx2-droop .sx2-art { transform: rotate(8deg); filter: grayscale(.6); }
.sx2-big .sx2-art { transform: scale(1.3); }
.sx2-small .sx2-art { transform: scale(.68); }
.sx2-beatfast .sx2-art { animation: sx2-beat .36s ease-in-out infinite; }
.sx2-beatslow .sx2-art { animation: sx2-beat 1.5s ease-in-out infinite; }
.sx2-jump .sx2-art { animation: sx2-jump .3s ease-in-out 4; }
.sx2-in { transform: translate(-50%, -50%) scale(.62) !important; }
.sx2-gone { opacity: 0; transition: opacity .5s ease .3s, left .5s ease, top .5s ease; }
.sx2-day { filter: drop-shadow(0 0 8px #ffd23f); }
.sx2-night { filter: drop-shadow(0 0 7px #9aa8ff); }
.sx2-glow { filter: drop-shadow(0 0 12px #ffe14a) drop-shadow(0 0 5px #fff07a); }
.sx2-earth { position: absolute; left: 60%; top: 50%; width: 52%; height: 70%; transform: translate(-50%, -50%); z-index: 1; pointer-events: none; }
.sx2-earth svg { width: 100%; height: 100%; }
.sx2-earth .sx2-shade { opacity: 0; transition: opacity .9s ease; }
.sx2-earth.lit .sx2-shade { opacity: .72; }
.sx2-prop { position: absolute; width: 64px; height: 64px; transform: translate(-50%, -50%); z-index: 2; pointer-events: none; }
.sx2-prop svg.art { width: 100%; height: 100%; }
.sx2-prop.sx2-pop { animation: sx2-grow .6s ease-out; }
.sx2-prop.sx2-hop svg.art { animation: sx2-shake .5s ease; }
.sx2-bin { width: 54px; height: 54px; z-index: 1; }
.sx2-puff { position: absolute; width: 26px; height: 26px; transform: translate(-50%, -50%); z-index: 5; pointer-events: none; animation: sx2-up 1.1s ease-out forwards; }
.sx2-puff.sx2-fall { animation-name: sx2-down; }
.sx2-puff svg.art { width: 100%; height: 100%; }
.sx-item.sx2-wide { width: min(300px, 86%); height: 80px; min-height: 80px; border-radius: 16px; background: rgba(255, 255, 255, .6); box-shadow: 0 1px 4px rgba(40, 30, 60, .2); }
.gl.little .sx-item.sx2-wide { width: min(300px, 86%); height: 84px; }
.sx2-wide .sx2-art svg { width: 100%; height: 100%; }
.sx2-run .sx2-g { animation: sx2-rot var(--d) linear infinite; }
@keyframes sx2-shake { 0%, 100% { transform: rotate(0); } 25% { transform: rotate(-8deg); } 75% { transform: rotate(8deg); } }
@keyframes sx2-grow { from { transform: scale(.55); } 70% { transform: scale(1.12); } to { transform: scale(1); } }
@keyframes sx2-beat { 0%, 100% { transform: scale(1); } 40% { transform: scale(1.18); } }
@keyframes sx2-jump { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-14px); } }
@keyframes sx2-up { from { transform: translate(-50%, -50%); opacity: 1; } to { transform: translate(-50%, -260%); opacity: 0; } }
@keyframes sx2-down { from { transform: translate(-50%, -50%); opacity: 1; } to { transform: translate(-50%, 220%); opacity: 0; } }
@keyframes sx2-rot { to { transform: rotate(360deg); } }
body.calm .sx2-beatfast .sx2-art, body.calm .sx2-beatslow .sx2-art, body.calm .sx2-run .sx2-g, body.calm .sx2-jump .sx2-art { animation: none; }
`));
}

// ---------- the shared engine ----------
const ASK: Pair = ['What will happen? Make a guess!', 'Điều gì sẽ xảy ra? Con đoán xem!'];
const ACT: Pair = ['Now tap it and watch what happens.', 'Giờ chạm vào nó và xem chuyện gì xảy ra nhé.'];
const ACTS: Pair = ['Now tap each one and watch what happens.', 'Giờ chạm vào từng cái và xem chuyện gì xảy ra nhé.'];
// pick n things for a round from the hardness the level allows, with different answers when there are several
function pickVar(pool: It[], lv: number, n: number, used: Set<It>, clash?: (a: It, b: It) => boolean): It[] {
  const lo = lv <= 2 ? 1 : 2, hi = lv <= 1 ? 1 : lv === 2 ? 2 : 3, inBand = pool.filter(v => v.hard >= lo && v.hard <= hi);
  let ok = inBand.filter(v => !used.has(v)); if (ok.length < n) ok = inBand;
  let best: It[] = [];
  for (let t = 0; t < 40; t++) {
    const s: It[] = [];
    for (const v of shuffle(ok)) { if (s.length >= n) break; if (clash && s.some(w => clash(v, w))) continue; s.push(v); }
    if (s.length < n) continue;
    if (n < 2 || new Set(s.map(v => v.ans)).size > 1) { best = s; break; }
    if (!best.length) best = s;
  }
  if (!best.length) best = shuffle(ok).slice(0, n);
  best.forEach(v => used.add(v)); return best;
}
// the answer and some others, in the game's own order (more choices at higher levels)
function choicesFor(G: Game, it: It, lv: number): Choice[] {
  const keys = it.opts || Object.keys(G.opts), n = Math.max(2, Math.min(G.nOpt[lv], keys.length));
  const keep = new Set([it.ans, ...shuffle(keys.filter(k => k !== it.ans)).slice(0, n - 1)]);
  return keys.filter(k => keep.has(k)).map(k => ({ key: k, ...G.opts[k] }));
}
function thing(scene: HTMLElement, it: It, x: number, y: number, cls = '') {
  const b = item(scene, it.p || '❓', it.name, x, y, ('sx-thing ' + cls).trim());
  b.innerHTML = `<span class="sx2-art">${it.html || pic(it.p || '❓')}</span>`;
  if (it.badge && it.badge.length) b.appendChild(el('span', 'sx2-badges', it.badge.map(p => pic(p)).join('')));
  return b;
}
const swap = (b: HTMLElement, p: string, html = '') => { const a = b.querySelector('.sx2-art'); if (a) a.innerHTML = html || pic(p); };
const fx = (b: Element, cls: string) => { b.classList.remove(cls); void (b as HTMLElement).offsetWidth; b.classList.add(cls); };
const posOf = (b: HTMLElement) => ({ x: parseFloat(b.style.left) || 50, y: parseFloat(b.style.top) || 50 });
const moveTo = (b: HTMLElement, x: number, y: number) => { b.style.left = x + '%'; b.style.top = y + '%'; };
const tag = (b: HTMLElement, p: string) => { b.querySelector('.sx-badge')?.remove(); b.appendChild(el('span', 'sx-badge', pic(p))); };
const prop = (scene: HTMLElement, p: string, x: number, y: number, cls = '') => { const e = el('span', ('sx2-prop ' + cls).trim(), pic(p)); moveTo(e, x, y); scene.appendChild(e); return e; };
function puff(scene: HTMLElement, p: string, x: number, y: number, n = 3, down = false) {
  for (let k = 0; k < n; k++) { const e = el('span', 'sx2-puff' + (down ? ' sx2-fall' : ''), pic(p)); moveTo(e, x - 6 + k * 6, y + (k % 2) * 4); e.style.animationDelay = k * .15 + 's'; scene.appendChild(e); setTimeout(() => e.remove(), 1600); }
}

function play(api, G: Game) {
  style(); style2();
  const lv = lvOf(api), [n, per] = PLAN[lv], used = new Set<It>(), rounds: Round[] = [];
  mark(api, n, per, band(lv), G.nOpt[lv]);   // rounds, things guessed before trying, how hard the things are, choices
  const y = G.y ?? 40, at = G.pos ? G.pos(per) : per === 1 ? [[50, y]] : [[20, y], [50, y], [80, y]];
  for (let r = 0; r < n; r++) {
    const set = pickVar(G.pool, lv, per, used, G.clash); let btns: HTMLElement[] = [], tool: HTMLElement = null;
    rounds.push({
      draw: x => {
        bg(x.scene, G.scene);
        btns = set.map((it, i) => { const [px, py] = G.place ? G.place(it, i, per) : at[i]; return thing(x.scene, it, px, py, G.cls); });
        if (G.tool) tool = item(x.scene, G.tool.p, G.tool.label, G.tool.x, G.tool.y, 'sx2-tool');
        G.draw && G.draw(x, set, btns);
      },
      trials: set.map((it, i) => ({ ask: it.ask || G.ask || ASK, answer: it.ans, why: it.why, choices: choicesFor(G, it, lv),
        focus: () => btns.forEach((b, j) => b.classList.toggle('sx-focus', j === i && per > 1)), done: () => btns.forEach(b => b.classList.remove('sx-focus')) })),
      act: G.tool ? G.act : per > 1 ? (G.actMany || ACTS) : (G.act || ACT),
      tryIt: x => new Promise<void>(res => {
        x.api.onCleanup(res);
        if (tool) {   // one tool tried on everything: the sun, the calendar
          x.target(tool);
          dragOrTap(x.api, x.scene, tool, async () => {
            x.target(null); tool.classList.add('sx2-used'); x.api.sfx.pop && x.api.sfx.pop(2);
            for (let i = 0; i < set.length; i++) { if (x.api.closed) return res(); await G.show(x, set[i], btns[i], i); }
            res();
          });
          return;
        }
        // each thing tapped (or dragged) in turn; what happens plays one at a time
        let left = set.length, chain = Promise.resolve(); const next = () => x.target(btns.find(b => !b.dataset.in) || null);
        set.forEach((it, i) => dragOrTap(x.api, x.scene, btns[i], () => {
          btns[i].dataset.in = '1'; next(); x.api.sfx.pop && x.api.sfx.pop(2);
          chain = chain.then(() => x.api.closed ? undefined : G.show(x, it, btns[i], i)).then(() => { if (--left === 0) res(); });
        }));
        next();
      })
    });
  }
  return experiment(api, rounds, G.fact);
}
const it = (k: string, p: string, name: Pair, ans: string, hard: number, ask: Pair, why: Pair, more: Partial<It> = {}): It => ({ k, p, name, ans, hard, ask, why, ...more });
const sky = (top: string, bottom: string) => `<defs><linearGradient id="sx2sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${top}"/><stop offset="1" stop-color="${bottom}"/></linearGradient></defs><rect width="400" height="300" fill="url(#sx2sky)"/>`;
const grass = (y = 236) => `<path d="M0 ${y}q100-14 200 0t200 0V300H0z" fill="#9be08a" stroke="#3b2a4f" stroke-width="4"/>`;
const CAL = { p: 'sci2:week', label: ['Let time pass', 'Cho thời gian trôi'] as Pair, x: 88, y: 15 };

// ---------- 1. Grow a Plant ----------
const PLANT: Game = {
  scene: `<rect width="400" height="300" fill="#fff8e6"/><rect x="40" y="18" width="320" height="168" rx="10" fill="#bfe8ff" stroke="#3b2a4f" stroke-width="5"/><path d="M200 18v168M40 102h320" stroke="#fff" stroke-width="6"/><rect x="16" y="198" width="368" height="16" rx="6" fill="#c9a05a" stroke="#3b2a4f" stroke-width="4"/>`,
  y: 58, tool: CAL, act: ['Now tap the calendar and let a week go by.', 'Giờ chạm vào tờ lịch để một tuần trôi qua nhé.'], nOpt: [2, 2, 3, 3, 3],
  opts: { grow: { pic: 'sci2:grown', label: ['Grows well', 'Lớn tốt'] }, weak: { pic: 'sci2:pale', label: ['Grows pale', 'Lớn yếu ớt'] }, none: { pic: 'sci2:pot', label: ["Doesn't grow", 'Không mọc'] } },
  pool: [
    it('sunwater', 'sci2:pot', ['Seed with water and sun', 'Hạt có nước và nắng'], 'grow', 1, ['This seed gets water and sunshine. What will happen?', 'Hạt giống này được tưới nước và có nắng. Điều gì sẽ xảy ra?'], ['Water wakes the seed up, and sunshine helps the little plant make its food. It grows!', 'Nước đánh thức hạt giống, còn ánh nắng giúp cây non tự làm thức ăn. Cây lớn lên!'], { badge: ['💧', '☀️'], opts: ['grow', 'none'] }),
    it('dry', 'sci2:pot', ['Seed with no water', 'Hạt không có nước'], 'none', 1, ['This seed gets sunshine but no water at all. What will happen?', 'Hạt giống này có nắng nhưng không được tưới nước. Điều gì sẽ xảy ra?'], ['Without water, the seed stays asleep. Seeds need water to start growing.', 'Không có nước, hạt giống cứ ngủ yên. Hạt cần nước mới bắt đầu nảy mầm.'], { badge: ['☀️'], opts: ['grow', 'none'] }),
    it('rain', 'sci2:pot', ['Seed in the rain and sun', 'Hạt dưới mưa và nắng'], 'grow', 1, ['Rain falls on this seed, then the sun comes out. What will happen?', 'Mưa rơi trên hạt giống này, rồi nắng lên. Điều gì sẽ xảy ra?'], ['Rain gives the seed water and the sun gives it light, so it grows.', 'Mưa cho hạt nước, nắng cho cây ánh sáng, nên cây lớn lên.'], { badge: ['🌧️', '☀️'], opts: ['grow', 'none'] }),
    it('stone', 'sci2:pot', ['Seed on a dry stone', 'Hạt trên hòn đá khô'], 'none', 1, ['This seed sits on a dry stone, with no water. What will happen?', 'Hạt giống nằm trên hòn đá khô, không có nước. Điều gì sẽ xảy ra?'], ['On a dry stone there is no water for the seed, so it cannot grow.', 'Trên đá khô không có nước cho hạt, nên hạt không mọc được.'], { badge: ['🪨'], opts: ['grow', 'none'] }),
    it('dark', 'sci2:pot', ['Seed in a dark cupboard', 'Hạt trong tủ tối'], 'weak', 2, ['This seed gets water but lives in a dark cupboard. What will happen?', 'Hạt giống được tưới nước nhưng để trong tủ tối. Điều gì sẽ xảy ra?'], ['The seed sprouts, but with no light the plant cannot make food. It grows thin and pale.', 'Hạt nảy mầm, nhưng không có ánh sáng thì cây không làm được thức ăn. Cây mọc gầy và nhợt nhạt.'], { badge: ['💧', 'sci2:dark'] }),
    it('flood', 'sci2:pot', ['Seed under too much water', 'Hạt bị ngập nước'], 'none', 2, ['This pot is filled to the top with water every day. What will happen?', 'Chậu này ngày nào cũng bị đổ đầy nước tới miệng. Điều gì sẽ xảy ra?'], ['Too much water! Roots need air too, so the drowned seed cannot grow.', 'Nhiều nước quá! Rễ cũng cần không khí, nên hạt bị ngập không mọc được.'], { badge: ['💦', '💦'] }),
    it('window', 'sci2:pot', ['Seed by a sunny window', 'Hạt cạnh cửa sổ có nắng'], 'grow', 2, ['This seed gets water and sits by a sunny window. What will happen?', 'Hạt giống được tưới nước và đặt cạnh cửa sổ có nắng. Điều gì sẽ xảy ra?'], ['It grows well, and it leans towards the window to reach the light.', 'Cây lớn tốt, và còn nghiêng về phía cửa sổ để đón ánh sáng.'], { badge: ['💧', '🪟'] }),
    it('shade', 'sci2:pot', ['Seed in deep shade', 'Hạt trong bóng râm'], 'weak', 2, ['This seed gets water, but a big wall keeps the sun away all day. What will happen?', 'Hạt giống được tưới nước, nhưng bức tường to che nắng cả ngày. Điều gì sẽ xảy ra?'], ['With only a little light, the plant grows long and thin, looking for the sun.', 'Có rất ít ánh sáng, cây mọc dài và gầy để tìm nắng.'], { badge: ['💧', '🧱'] }),
    it('cold', 'sci2:pot', ['Seed in the freezer', 'Hạt trong tủ đá'], 'none', 3, ['This seed gets water but is kept in the freezer. What will happen?', 'Hạt giống được tưới nước nhưng để trong tủ đá. Điều gì sẽ xảy ra?'], ['Too cold! Seeds wait for warm days before they start to grow.', 'Lạnh quá! Hạt giống chờ ngày ấm áp mới bắt đầu nảy mầm.'], { badge: ['💧', '❄️'] }),
    it('lamp', 'sci2:pot', ['Seed under a lamp', 'Hạt dưới bóng đèn'], 'grow', 3, ['This seed gets water and a bright lamp, but no sunshine. What will happen?', 'Hạt giống được tưới nước và có đèn sáng, nhưng không có nắng. Điều gì sẽ xảy ra?'], ['A bright lamp gives light like the sun, so the plant can still grow well.', 'Đèn sáng cho ánh sáng giống mặt trời, nên cây vẫn lớn tốt.'], { badge: ['💧', '💡'] }),
    it('cactus', '🌵', ['Cactus in the sun', 'Xương rồng dưới nắng'], 'grow', 3, ['This cactus gets lots of sun and only a little water. What will happen?', 'Cây xương rồng có nhiều nắng mà chỉ được ít nước. Điều gì sẽ xảy ra?'], ['A cactus keeps water inside its fat stem, so a little water is enough to grow.', 'Xương rồng giữ nước trong thân mập của nó, nên ít nước cũng đủ để lớn.'], { badge: ['☀️', '💧'], after: '🌵' }),
    it('hot', 'sci2:pot', ['Seed in a hot, dry place', 'Hạt ở nơi nóng và khô'], 'none', 3, ['This seed sits by a hot fire and nobody waters it. What will happen?', 'Hạt giống để cạnh bếp lửa nóng và không ai tưới nước. Điều gì sẽ xảy ra?'], ['Heat with no water dries the seed out, so it cannot grow.', 'Nóng mà không có nước làm hạt khô héo, nên hạt không mọc được.'], { badge: ['🔥'] })
  ],
  async show(x, it, b) {
    fx(b, 'sx2-shake'); await wait(slow(450));
    swap(b, it.after || (it.ans === 'grow' ? 'sci2:grown' : it.ans === 'weak' ? 'sci2:pale' : 'sci2:pot'));
    if (it.ans === 'none') b.classList.add('sx2-droop'); else fx(b, 'sx2-grow');
    if (it.ans === 'grow') puff(x.scene, '✨', posOf(b).x, posOf(b).y - 12, 2);
    await wait(slow(900));
  },
  fact: ['Plants make their own food from sunlight, water and air. Animals cannot do that!', 'Cây tự làm ra thức ăn từ ánh nắng, nước và không khí. Con vật thì không làm được như vậy!']
};
register({ id: 'sci_plant', learn: true, icon: 'sci:plant', name: () => T('Grow a Plant', 'Trồng Cây'), run: api => play(api, PLANT) });

// ---------- 2. Water Cycle ----------
const WATER: Game = {
  scene: sky('#bfe8ff', '#eaf8ff') + `<path d="M230 240c40-80 80-110 110-110s50 40 60 110z" fill="#9be08a" stroke="#3b2a4f" stroke-width="4"/><path d="M0 236q25-10 50 0t50 0 50 0 50 0 50 0 50 0 50 0 50 0V300H0z" fill="#7fd0f5" stroke="#3b2a4f" stroke-width="4"/>`,
  y: 50, nOpt: [2, 2, 3, 4, 4],
  opts: { rise: { pic: 'sci2:vapour', label: ['Rises up', 'Bay lên'] }, cloud: { pic: '☁️', label: ['Makes a cloud', 'Thành mây'] }, rain: { pic: '🌧️', label: ['Falls as rain', 'Rơi thành mưa'] }, river: { pic: '🌊', label: ['Flows to the sea', 'Chảy ra biển'] }, snow: { pic: '❄️', label: ['Falls as snow', 'Rơi thành tuyết'] } },
  pool: [
    it('sea', 'sci2:seawarm', ['The warm sea', 'Biển ấm'], 'rise', 1, ['The sun warms the sea. What does the water do?', 'Mặt trời sưởi ấm biển. Nước sẽ làm gì?'], ['Warm water turns into a gas we cannot see, called water vapour, and it rises up into the sky.', 'Nước ấm biến thành hơi nước, một chất khí ta không nhìn thấy, rồi bay lên trời.'], { opts: ['rise', 'rain'] }),
    it('vapour', 'sci2:vapour', ['Water vapour', 'Hơi nước'], 'cloud', 1, ['Water vapour rises high, where the air is cold. What does it make?', 'Hơi nước bay lên cao, nơi không khí lạnh. Nó tạo thành gì?'], ['Up high, the cold air turns the vapour into tiny drops, and lots of drops make a cloud.', 'Trên cao, không khí lạnh biến hơi nước thành những giọt nhỏ xíu, nhiều giọt gộp lại thành mây.'], { opts: ['cloud', 'river'] }),
    it('cloud', '☁️', ['A heavy cloud', 'Đám mây nặng nước'], 'rain', 1, ['The cloud gets bigger, darker and heavy with water. What happens?', 'Đám mây to dần, đen lại và nặng nước. Chuyện gì xảy ra?'], ['When the drops get too heavy, they fall down as rain.', 'Khi những giọt nước nặng quá, chúng rơi xuống thành mưa.'], { opts: ['rise', 'rain'] }),
    it('hill', 'sci2:hillrain', ['Rain on the hills', 'Mưa trên đồi'], 'river', 1, ['Rain falls on the hills. Where does the water go?', 'Mưa rơi trên đồi. Nước chảy đi đâu?'], ['The rain runs down the hills into streams and rivers, and back to the sea.', 'Nước mưa chảy xuống đồi thành suối, thành sông, rồi lại về biển.'], { opts: ['cloud', 'river'] }),
    it('puddle', 'sci2:puddle', ['A puddle in the sun', 'Vũng nước dưới nắng'], 'rise', 2, ['After the rain, the sun shines on a puddle. Where does the puddle go?', 'Sau cơn mưa, nắng chiếu lên vũng nước. Vũng nước đi đâu?'], ['The sun turns the puddle into water vapour, so it rises into the air and the puddle dries up.', 'Nắng biến vũng nước thành hơi nước bay lên không khí, nên vũng nước khô dần.']),
    it('washing', 'sci2:washing', ['Wet washing', 'Quần áo ướt'], 'rise', 2, ['Wet clothes hang in the sunny wind. Where does the water go?', 'Quần áo ướt phơi trong nắng gió. Nước đi đâu?'], ['The water turns into vapour and floats away, so the clothes get dry.', 'Nước biến thành hơi bay đi, nên quần áo khô.']),
    it('coldcloud', '☁️', ['A cloud over the mountain', 'Mây trên núi'], 'snow', 2, ['A heavy cloud floats over a very cold mountain. What falls?', 'Đám mây nặng nước bay qua ngọn núi rất lạnh. Cái gì rơi xuống?'], ['When it is very cold, the drops freeze and fall as snow.', 'Khi trời rất lạnh, giọt nước đóng băng và rơi xuống thành tuyết.'], { badge: ['🏔️', '❄️'] }),
    it('river', 'sci2:river', ['A long river', 'Dòng sông dài'], 'river', 2, ['The river runs on and on, down to the end of the land. Where does it go?', 'Dòng sông chảy mãi, xuống tận cuối đất liền. Nó chảy đi đâu?'], ['Rivers carry the water back into the sea, and the journey starts again.', 'Sông đưa nước trở về biển, và chuyến đi lại bắt đầu.']),
    it('snowmelt', '🏔️', ['A snowy mountain in spring', 'Núi tuyết mùa xuân'], 'river', 3, ['Spring sun shines on the snowy mountain. Where does the snow go?', 'Nắng xuân chiếu lên núi tuyết. Tuyết đi đâu?'], ['The snow melts into water and runs down into the rivers.', 'Tuyết tan thành nước rồi chảy xuống sông.'], { badge: ['☀️'] }),
    it('tree', '🌳', ['A tree on a hot day', 'Cây trong ngày nóng'], 'rise', 3, ['On a hot day, a big tree drinks water from the ground. Where does some of it go?', 'Ngày nắng nóng, cây to hút nước từ đất. Một phần nước đi đâu?'], ['Leaves let water out as vapour, which rises up and helps make clouds.', 'Lá cây thoát hơi nước, hơi nước bay lên và góp phần tạo thành mây.'], { badge: ['☀️'] }),
    it('kettle', '🫖', ['A boiling kettle', 'Ấm nước sôi'], 'rise', 3, ['Water boils in a kettle. What does the steam do?', 'Nước sôi trong ấm. Hơi nước làm gì?'], ['Hot steam rises up, just like water vapour from the warm sea.', 'Hơi nước nóng bay lên, giống như hơi nước từ biển ấm.'], { badge: ['🔥'] }),
    it('bigcloud', '☁️', ['A big grey cloud', 'Đám mây xám to'], 'rain', 3, ['Two clouds join into one big grey cloud over the warm valley. What happens?', 'Hai đám mây nhập thành một đám mây xám to trên thung lũng ấm. Chuyện gì xảy ra?'], ['Bigger clouds hold more water, and in warm air it falls as rain, not snow.', 'Mây càng to càng chứa nhiều nước, và trong không khí ấm nước rơi xuống thành mưa, không phải tuyết.'], { badge: ['☁️'] })
  ],
  async show(x, it, b) {
    const { x: px, y: py } = posOf(b); fx(b, 'sx2-shake'); await wait(slow(400));
    if (it.ans === 'rise') { swap(b, 'sci2:vapour'); puff(x.scene, '💨', px, py - 6, 3); moveTo(b, px, Math.max(14, py - 30)); }
    else if (it.ans === 'cloud') { swap(b, '☁️'); moveTo(b, px, 16); fx(b, 'sx2-grow'); }
    else if (it.ans === 'rain') { swap(b, '🌧️'); puff(x.scene, '💧', px, py + 10, 4, true); }
    else if (it.ans === 'snow') { swap(b, '❄️'); puff(x.scene, '❄️', px, py + 10, 4, true); moveTo(b, px, Math.min(66, py + 16)); }
    else { swap(b, '🌊'); moveTo(b, px, 82); }
    await wait(slow(1000));
  },
  fact: ['The water you drink today may once have been rain, a cloud, or even the sea, long, long ago!', 'Nước con uống hôm nay có thể đã từng là mưa, là mây, hay cả nước biển từ rất, rất lâu rồi!']
};
register({ id: 'sci_water', learn: true, icon: 'sci:water', name: () => T('Water Cycle', 'Vòng Tuần Hoàn Của Nước'), run: api => play(api, WATER) });

// ---------- 3. Day and Night ----------
// the Earth turns anticlockwise in the picture, with the Sun on the left: a house at the top is turning into the light
// (sunrise), one at the bottom into the shadow (sunset); angle 0 faces the Sun
const EARTH = `<svg viewBox="0 0 200 200" aria-hidden="true"><circle cx="100" cy="100" r="92" fill="#5fb6ff" stroke="#3b2a4f" stroke-width="5"/><path d="M60 40c20 6 30 26 20 44s-30 16-28 40c2 16 16 22 14 36M140 30c-14 14-6 30 10 36s20 26 8 40" stroke="#43c463" stroke-width="18" stroke-linecap="round" fill="none"/><path class="sx2-shade" d="M100 8a92 92 0 0 1 0 184z" fill="#1d2150"/><circle cx="100" cy="100" r="92" fill="none" stroke="#3b2a4f" stroke-width="5"/><path d="M128 18a86 86 0 0 0-56 0" stroke="#fff" stroke-width="5" stroke-linecap="round" fill="none"/><path d="M76 8l-8 10 12 4" stroke="#fff" stroke-width="5" stroke-linecap="round" stroke-linejoin="round" fill="none"/></svg>`;
const HOUSE: Pair = ['A house on the Earth', 'Ngôi nhà trên Trái Đất'];
const DAY_WHY: Pair = ['This house is on the sunny side of the Earth, so it is daytime there.', 'Ngôi nhà ở phía có nắng của Trái Đất, nên ở đó đang là ban ngày.'];
const NIGHT_WHY: Pair = ['This house is on the dark side of the Earth, away from the Sun, so it is night-time there.', 'Ngôi nhà ở phía tối của Trái Đất, quay lưng với Mặt Trời, nên ở đó đang là ban đêm.'];
const LOOK: Pair = ['Look at this house. Is it day or night there?', 'Nhìn ngôi nhà này. Ở đó là ngày hay đêm?'];
const ang = (a: number) => ({ v: a, opts: ['day', 'night'] });
const DAYNIGHT: Game = {
  scene: `<rect width="400" height="300" fill="#262a63"/>` + [[30, 30], [120, 20], [200, 260], [370, 40], [360, 270], [300, 140], [20, 250], [160, 130]].map(([a, b]) => `<circle cx="${a}" cy="${b}" r="2.4" fill="#fff6b0"/>`).join(''),
  tool: { p: '☀️', label: ['The Sun', 'Mặt Trời'], x: 11, y: 50 }, act: ['Now tap the Sun to make it shine on the Earth.', 'Giờ chạm vào Mặt Trời để nắng chiếu lên Trái Đất nhé.'], nOpt: [2, 2, 2, 4, 4],
  opts: { day: { pic: '☀️', label: ['Day', 'Ngày'] }, night: { pic: '🌙', label: ['Night', 'Đêm'] }, morning: { pic: '🌅', label: ['Sunrise', 'Bình minh'] }, evening: { pic: 'sci2:sunset', label: ['Sunset', 'Hoàng hôn'] } },
  pool: [
    it('d0', 'sci2:house', HOUSE, 'day', 1, ['This house faces the Sun. Is it day or night there?', 'Ngôi nhà này quay về phía Mặt Trời. Ở đó là ngày hay đêm?'], ['The side of the Earth facing the Sun gets its light, so it is daytime.', 'Phía Trái Đất quay về Mặt Trời được chiếu sáng, nên đang là ban ngày.'], ang(0)),
    it('n180', 'sci2:house', HOUSE, 'night', 1, ['This house faces away from the Sun. Is it day or night there?', 'Ngôi nhà này quay lưng lại với Mặt Trời. Ở đó là ngày hay đêm?'], ['The side facing away from the Sun is in the shadow of the Earth, so it is night-time.', 'Phía quay lưng với Mặt Trời nằm trong bóng của Trái Đất, nên đang là ban đêm.'], ang(180)),
    it('d340', 'sci2:house', HOUSE, 'day', 1, LOOK, DAY_WHY, ang(335)),
    it('n200', 'sci2:house', HOUSE, 'night', 1, LOOK, NIGHT_WHY, ang(205)),
    it('d45', 'sci2:house', HOUSE, 'day', 2, LOOK, DAY_WHY, ang(45)),
    it('d315', 'sci2:house', HOUSE, 'day', 2, LOOK, DAY_WHY, ang(300)),
    it('n135', 'sci2:house', HOUSE, 'night', 2, LOOK, NIGHT_WHY, ang(135)),
    it('n225', 'sci2:house', HOUSE, 'night', 2, LOOK, NIGHT_WHY, ang(240)),
    it('m90', 'sci2:house', HOUSE, 'morning', 3, ['The Earth spins the way the arrow shows. This house is just turning towards the Sun. What time is it?', 'Trái Đất quay theo chiều mũi tên. Ngôi nhà này vừa quay về phía Mặt Trời. Bây giờ là lúc nào?'], ['As the Earth spins, this house is just coming into the sunlight: the Sun is rising. Good morning!', 'Khi Trái Đất quay, ngôi nhà vừa đi vào vùng nắng: Mặt Trời đang mọc. Chào buổi sáng!'], { v: 90 }),
    it('e270', 'sci2:house', HOUSE, 'evening', 3, ['The Earth spins the way the arrow shows. This house is just turning away from the Sun. What time is it?', 'Trái Đất quay theo chiều mũi tên. Ngôi nhà này vừa quay khỏi Mặt Trời. Bây giờ là lúc nào?'], ['This house is turning into the shadow: the Sun is setting. Good evening!', 'Ngôi nhà đang đi vào bóng tối: Mặt Trời đang lặn. Chào buổi tối!'], { v: 270 }),
    it('far', 'sci2:house', ['A house far away', 'Ngôi nhà ở rất xa'], 'night', 3, ['It is lunchtime on the side of the Earth facing the Sun. What is it like at this house, on the other side?', 'Phía Trái Đất quay về Mặt Trời đang là giờ ăn trưa. Còn ngôi nhà này, ở phía bên kia thì sao?'], ['When it is the middle of the day on one side of the Earth, it is the middle of the night on the other side.', 'Khi một phía Trái Đất đang giữa trưa, thì phía bên kia đang giữa đêm.'], { v: 180, opts: ['day', 'night', 'morning', 'evening'] })
  ],
  place: it => { const a = it.v * Math.PI / 180; return [60 - 26 * Math.cos(a), 50 - 35 * Math.sin(a)]; },
  clash: (a, b) => { const d = Math.abs(a.v - b.v) % 360; return Math.min(d, 360 - d) < 55; },
  draw: x => { const e = el('div', 'sx2-earth', EARTH); x.scene.insertBefore(e, x.scene.querySelector('.sx-item')); },
  async show(x, it, b) {
    x.scene.querySelector('.sx2-earth')?.classList.add('lit'); await wait(slow(500));
    tag(b, DAYNIGHT.opts[it.ans].pic); b.classList.add(it.ans === 'night' || it.ans === 'evening' ? 'sx2-night' : 'sx2-day'); x.api.sfx.pop && x.api.sfx.pop(3);
    await wait(slow(800));
  },
  fact: ['The Earth spins round once every day, so every place gets a turn in the sunshine.', 'Trái Đất tự quay một vòng mỗi ngày, nên nơi nào cũng đến lượt được nắng chiếu.']
};
register({ id: 'sci_daynight', learn: true, icon: 'sci:daynight', name: () => T('Day and Night', 'Ngày và Đêm'), run: api => play(api, DAYNIGHT) });

// ---------- 4. Four Seasons ----------
const TREE: Pair = ['A tree', 'Một cái cây'];
const SEASONS: Game = {
  scene: sky('#cfeeff', '#f6fbff') + grass(214),
  y: 55, tool: { ...CAL, label: ['Turn the year', 'Lật lịch'] }, act: ['Now tap the calendar and watch the tree change.', 'Giờ chạm vào tờ lịch và xem cái cây thay đổi nhé.'], nOpt: [2, 2, 3, 4, 4],
  opts: { spring: { pic: 'sci2:spring', label: ['Spring', 'Mùa xuân'] }, summer: { pic: 'sci2:summer', label: ['Summer', 'Mùa hè'] }, autumn: { pic: 'sci2:autumn', label: ['Autumn', 'Mùa thu'] }, winter: { pic: 'sci2:winter', label: ['Winter', 'Mùa đông'] } },
  pool: [
    it('blossom', 'sci2:tree', TREE, 'spring', 1, ['Flowers open and baby birds hatch. Which season is it?', 'Hoa nở và chim non ra đời. Đó là mùa nào?'], ['In spring the days get warmer, so flowers open and new leaves grow.', 'Mùa xuân trời ấm dần, hoa nở và lá non mọc ra.'], { badge: ['🌸', '🐣'] }),
    it('hot', 'sci2:tree', TREE, 'summer', 1, ['The sun is hot and the days are long. We go swimming. Which season is it?', 'Nắng nóng và ngày dài. Chúng ta đi bơi. Đó là mùa nào?'], ['Summer is the hottest season, with long sunny days.', 'Mùa hè là mùa nóng nhất, ngày dài và nhiều nắng.'], { badge: ['☀️', '🏖️'] }),
    it('leaves', 'sci2:tree', TREE, 'autumn', 1, ['The leaves turn orange and fall from the trees. Which season is it?', 'Lá cây chuyển màu cam và rụng xuống. Đó là mùa nào?'], ['In autumn the days get cooler and many trees drop their leaves.', 'Mùa thu trời mát dần và nhiều cây rụng lá.'], { badge: ['🍂'] }),
    it('snow', 'sci2:tree', TREE, 'winter', 1, ['It is cold, and snow covers the ground. Which season is it?', 'Trời lạnh, tuyết phủ trắng mặt đất. Đó là mùa nào?'], ['Winter is the coldest season. In cold places, snow can fall.', 'Mùa đông là mùa lạnh nhất. Ở những nơi lạnh, tuyết có thể rơi.'], { badge: ['❄️', '⛄'] }),
    it('bear', 'sci2:tree', TREE, 'winter', 2, ['Bears sleep in their dens until it is warm again. Which season is it?', 'Gấu ngủ trong hang cho tới khi trời ấm trở lại. Đó là mùa nào?'], ['Some animals sleep through winter, when food is hard to find.', 'Một số con vật ngủ suốt mùa đông, khi khó tìm thức ăn.'], { badge: ['🐻', '😴'] }),
    it('fruit', 'sci2:tree', TREE, 'summer', 2, ['Watermelons are ripe and we eat ice cream to cool down. Which season is it?', 'Dưa hấu chín và chúng mình ăn kem cho mát. Đó là mùa nào?'], ['Lots of fruit ripens in the hot summer sun.', 'Nhiều loại quả chín dưới nắng hè.'], { badge: ['🍉', '🍦'] }),
    it('harvest', 'sci2:tree', TREE, 'autumn', 2, ['Cool winds blow and farmers bring in the harvest. Which season is it?', 'Gió mát thổi và bà con thu hoạch mùa màng. Đó là mùa nào?'], ['Autumn is harvest time, when many crops are ready to pick.', 'Mùa thu là mùa thu hoạch, nhiều cây trái đã sẵn sàng để hái.'], { badge: ['🍁', '🌾'] }),
    it('tulip', 'sci2:tree', TREE, 'spring', 2, ['Tulips come up and new green leaves unfold. Which season is it?', 'Hoa tulip nhú lên và lá non xanh mở ra. Đó là mùa nào?'], ['Spring is the season of new life: new flowers, new leaves and baby animals.', 'Mùa xuân là mùa của sự sống mới: hoa mới, lá mới và các con vật non.'], { badge: ['🌷', '🌱'] }),
    it('tet', 'sci2:tree', TREE, 'spring', 3, ['In Hà Nội, peach flowers bloom for Tết, as winter ends. Which season begins?', 'Ở Hà Nội, hoa đào nở đón Tết khi mùa đông sắp hết. Mùa nào bắt đầu?'], ['Tết comes as winter ends in the north of Vietnam, so it is called the spring festival.', 'Tết đến khi mùa đông ở miền Bắc sắp hết, nên Tết còn gọi là lễ hội mùa xuân.'], { badge: ['🌸', '🏮'] }),
    it('xmas', 'sci2:tree', TREE, 'summer', 3, ['In Sydney, children go to the beach on Christmas Day in December. Which season is it there?', 'Ở Sydney, trẻ em đi biển vào ngày Giáng Sinh tháng Mười Hai. Ở đó là mùa nào?'], ['Australia is in the south of the world, so December is summer there.', 'Úc ở nửa phía nam Trái Đất, nên tháng Mười Hai ở đó là mùa hè.'], { badge: ['🎄', '🏖️'] }),
    it('july', 'sci2:tree', TREE, 'winter', 3, ['In July, children in Sydney wear warm jumpers and scarves. Which season is it there?', 'Vào tháng Bảy, trẻ em ở Sydney mặc áo ấm và quàng khăn. Ở đó là mùa nào?'], ['When it is summer in the north of the world, it is winter in Australia.', 'Khi nửa phía bắc Trái Đất là mùa hè, thì ở Úc là mùa đông.'], { badge: ['🧣'] }),
    it('moon', 'sci2:tree', TREE, 'autumn', 3, ['Children carry lanterns under the full moon for Tết Trung Thu. Which season is it?', 'Trẻ em rước đèn dưới trăng rằm dịp Tết Trung Thu. Đó là mùa nào?'], ['Tết Trung Thu means the Mid-Autumn Festival: it is held in the middle of autumn.', 'Tết Trung Thu là lễ hội giữa mùa thu.'], { badge: ['🏮', '🌕'] })
  ],
  async show(x, it, b) {
    const { x: px, y: py } = posOf(b); fx(b, 'sx2-shake'); await wait(slow(350));
    swap(b, 'sci2:' + it.ans); fx(b, 'sx2-grow');
    puff(x.scene, it.ans === 'winter' ? '❄️' : it.ans === 'autumn' ? '🍂' : it.ans === 'spring' ? '🌸' : '✨', px, py - 18, 3, it.ans === 'winter' || it.ans === 'autumn');
    await wait(slow(900));
  },
  fact: ['Seasons come because the Earth is tilted as it travels around the Sun.', 'Có các mùa vì Trái Đất nghiêng khi đi vòng quanh Mặt Trời.']
};
register({ id: 'sci_seasons', learn: true, icon: 'sci:seasons', name: () => T('Four Seasons', 'Bốn Mùa'), run: api => play(api, SEASONS) });

// ---------- 5. Animal Homes ----------
const HOMES: Game = {
  scene: sky('#cfeeff', '#f2fbff') + grass(196),
  y: 32, nOpt: [2, 2, 3, 4, 4],
  opts: { nest: { pic: '🪺', label: ['Nest', 'Tổ chim'] }, hive: { pic: 'sci2:hive', label: ['Hive', 'Tổ ong'] }, burrow: { pic: 'sci2:burrow', label: ['Burrow', 'Hang đất'] }, pond: { pic: 'sci2:pond', label: ['Pond', 'Cái ao'] }, cave: { pic: 'sci2:cave', label: ['Cave', 'Hang đá'] }, treehole: { pic: 'sci2:treehole', label: ['Tree hole', 'Hốc cây'] }, shell: { pic: '🐚', label: ['Shell', 'Vỏ ốc'] }, pouch: { pic: 'sci2:pouch', label: ["Mum's pouch", 'Túi của mẹ'] } },
  pool: [
    it('bird', '🐦', ['Bird', 'Chim'], 'nest', 1, ['Where does the bird lay its eggs? Make a guess!', 'Chim đẻ trứng ở đâu? Con đoán xem!'], ['The bird weaves a nest of twigs and grass, high up where its eggs are safe.', 'Chim đan tổ bằng cành cây và cỏ, ở trên cao để trứng được an toàn.']),
    it('bee', '🐝', ['Bee', 'Ong'], 'hive', 1, ['Where does the bee live? Make a guess!', 'Ong sống ở đâu? Con đoán xem!'], ['Bees live together in a hive, where they make honey.', 'Ong sống cùng nhau trong tổ, nơi chúng làm ra mật.']),
    it('fish', '🐟', ['Fish', 'Cá'], 'pond', 1, ['Where does the fish live? Make a guess!', 'Cá sống ở đâu? Con đoán xem!'], ['A fish breathes in water, so it lives in ponds, rivers and the sea.', 'Cá thở trong nước, nên sống ở ao, sông và biển.']),
    it('rabbit', '🐰', ['Rabbit', 'Thỏ'], 'burrow', 1, ['Where does the wild rabbit live? Make a guess!', 'Thỏ rừng sống ở đâu? Con đoán xem!'], ['Wild rabbits dig burrows under the ground to hide from foxes.', 'Thỏ rừng đào hang dưới đất để trốn cáo.']),
    it('bear', '🐻', ['Bear', 'Gấu'], 'cave', 2, ['Where does the bear sleep through the winter?', 'Gấu ngủ đông ở đâu?'], ['A bear finds a cave or a den to sleep in, safe and out of the snow.', 'Gấu tìm hang để ngủ, an toàn và tránh được tuyết.']),
    it('frog', '🐸', ['Frog', 'Ếch'], 'pond', 2, ['Where does the frog lay its eggs?', 'Ếch đẻ trứng ở đâu?'], ['Frogs lay their eggs in the water of a pond, and tadpoles hatch out.', 'Ếch đẻ trứng trong nước ao, rồi nòng nọc nở ra.']),
    it('owl', '🦉', ['Owl', 'Cú'], 'treehole', 2, ['Where does the owl rest in the daytime?', 'Ban ngày cú nghỉ ở đâu?'], ['Owls hunt at night and rest in a hollow in an old tree during the day.', 'Cú đi săn ban đêm, ban ngày nghỉ trong hốc của cây cổ thụ.']),
    it('squirrel', '🐿️', ['Squirrel', 'Sóc'], 'treehole', 2, ['Where does the squirrel keep its nuts?', 'Sóc cất hạt dẻ ở đâu?'], ['Squirrels often hide their food and sleep in a hole in a tree.', 'Sóc thường giấu thức ăn và ngủ trong hốc cây.']),
    it('fox', '🦊', ['Fox', 'Cáo'], 'burrow', 2, ['Where do baby foxes grow up?', 'Cáo con lớn lên ở đâu?'], ['Foxes dig a den in the ground, where the cubs stay safe and warm.', 'Cáo đào hang dưới đất, nơi cáo con được an toàn và ấm áp.']),
    it('snail', '🐌', ['Snail', 'Ốc sên'], 'shell', 3, ['Where does the snail go when it is scared?', 'Ốc sên trốn vào đâu khi sợ?'], ['A snail carries its home on its back: it pulls itself inside its shell.', 'Ốc sên mang nhà trên lưng: nó rụt người vào trong vỏ.']),
    it('joey', '🦘', ['Baby kangaroo', 'Kangaroo con'], 'pouch', 3, ['Where does a baby kangaroo, a joey, live?', 'Kangaroo con sống ở đâu?'], ['A joey grows up in a warm, cosy pouch on the tummy of its mum.', 'Kangaroo con lớn lên trong chiếc túi ấm trên bụng mẹ.']),
    it('crab', '🦀', ['Hermit crab', 'Ốc mượn hồn'], 'shell', 3, ['Where does the hermit crab live?', 'Con ốc mượn hồn sống ở đâu?'], ['A hermit crab borrows an empty shell, and moves to a bigger one as it grows.', 'Ốc mượn hồn ở nhờ vỏ ốc rỗng, và đổi sang vỏ to hơn khi lớn lên.']),
    it('bat', '🦇', ['Bat', 'Dơi'], 'cave', 3, ['Where do bats hang upside down all day?', 'Dơi treo ngược mình cả ngày ở đâu?'], ['Many bats sleep in dark caves in the day and fly out at night.', 'Nhiều loài dơi ngủ trong hang tối ban ngày và bay ra ngoài vào ban đêm.'])
  ],
  async show(x, it, b) {
    const { x: px } = posOf(b), home = prop(x.scene, HOMES.opts[it.ans].pic, px, 74, 'sx2-pop');
    await wait(slow(450)); moveTo(b, px, 70); b.classList.add('sx2-in'); await wait(slow(550)); fx(home, 'sx2-hop'); x.api.sfx.pop && x.api.sfx.pop(4);
    await wait(slow(700));
  },
  fact: ['Animals choose homes that keep them safe, warm and close to their food.', 'Con vật chọn nhà giúp chúng an toàn, ấm áp và gần thức ăn.']
};
register({ id: 'sci_homes', learn: true, icon: 'sci:homes', name: () => T('Animal Homes', 'Nhà Của Con Vật'), run: api => play(api, HOMES) });

// ---------- 6. My Body ----------
const BEAT = ['faster', 'slower'], SIZE = ['bigger', 'smaller'];
const BODY: Game = {
  scene: `<rect width="400" height="300" fill="#fff0f4"/><g opacity=".22" stroke="#3b2a4f" stroke-width="5" fill="#ff9ecb"><circle cx="200" cy="74" r="40"/><path d="M150 284V160c0-30 22-46 50-46s50 16 50 46v124z"/><path d="M150 168l-50 70M250 168l50 70" fill="none"/></g>`,
  y: 46, act: ['Now tap the picture to try it!', 'Giờ chạm vào hình để thử nhé!'], actMany: ['Now tap each picture to try it!', 'Giờ chạm vào từng hình để thử nhé!'], nOpt: [2, 2, 3, 3, 4],
  opts: { faster: { pic: 'sci2:fastbeat', label: ['Faster', 'Nhanh hơn'] }, slower: { pic: 'sci2:slowbeat', label: ['Slower', 'Chậm hơn'] }, bigger: { pic: 'sci2:bigger', label: ['Bigger', 'To ra'] }, smaller: { pic: 'sci2:smaller', label: ['Smaller', 'Nhỏ lại'] },
    stomach: { pic: 'sci2:stomach', label: ['Stomach', 'Dạ dày'] }, lungs: { pic: 'sci2:lungs', label: ['Lungs', 'Phổi'] }, brain: { pic: '🧠', label: ['Brain', 'Não'] }, heart: { pic: '❤️', label: ['Heart', 'Tim'] }, bones: { pic: '🦴', label: ['Bones', 'Xương'] }, ears: { pic: '👂', label: ['Ears', 'Tai'] }, nose: { pic: '👃', label: ['Nose', 'Mũi'] }, eyes: { pic: '👀', label: ['Eyes', 'Mắt'] } },
  pool: [
    it('jump', '🏃', ['Jumping', 'Nhảy'], 'faster', 1, ['Jump ten times! Will your heart beat faster or slower?', 'Nhảy mười cái nào! Tim con sẽ đập nhanh hơn hay chậm hơn?'], ['Your muscles need more air and food when you jump, so your heart pumps faster.', 'Khi nhảy, cơ bắp cần thêm không khí và thức ăn, nên tim bơm nhanh hơn.'], { opts: BEAT }),
    it('breathein', 'sci2:lungs', ['Breathing in', 'Hít vào'], 'bigger', 1, ['Take a big breath in. Do your lungs get bigger or smaller?', 'Hít một hơi thật sâu. Phổi của con to ra hay nhỏ lại?'], ['Air fills your lungs like two balloons, so they get bigger.', 'Không khí làm phổi phồng lên như hai quả bóng, nên phổi to ra.'], { opts: SIZE }),
    it('think', '❓', ['Thinking', 'Suy nghĩ'], 'brain', 1, ['Which part of your body does your thinking and remembering?', 'Bộ phận nào giúp con suy nghĩ và ghi nhớ?'], ['Your brain, inside your head, does all your thinking and remembering.', 'Bộ não trong đầu con lo mọi việc suy nghĩ và ghi nhớ.'], { badge: ['🧩'], opts: ['brain', 'bones', 'stomach'] }),
    it('hear', '❓', ['Hearing', 'Nghe'], 'ears', 1, ['Which part of you catches sounds, like a bell ringing?', 'Bộ phận nào giúp con nghe âm thanh, như tiếng chuông?'], ['Your ears catch sounds and send them to your brain.', 'Tai đón âm thanh và gửi tới não.'], { badge: ['🔔'], opts: ['ears', 'nose', 'eyes'] }),
    it('smell', '❓', ['Smelling', 'Ngửi'], 'nose', 1, ['Which part of you smells a flower?', 'Bộ phận nào giúp con ngửi bông hoa?'], ['Your nose has tiny sensors that catch smells in the air.', 'Mũi có những phần cảm nhận nhỏ xíu bắt được mùi trong không khí.'], { badge: ['🌸'], opts: ['ears', 'nose', 'eyes'] }),
    it('sleep', '😴', ['Sleeping', 'Ngủ'], 'slower', 2, ['When you are fast asleep, does your heart beat faster or slower?', 'Khi con ngủ say, tim con đập nhanh hơn hay chậm hơn?'], ['Asleep, your body is resting and needs less, so your heart slows down.', 'Khi ngủ, cơ thể nghỉ ngơi và cần ít hơn, nên tim đập chậm lại.'], { opts: BEAT }),
    it('breatheout', 'sci2:lungs', ['Breathing out', 'Thở ra'], 'smaller', 2, ['Now blow all your air out. Do your lungs get bigger or smaller?', 'Giờ thở hết hơi ra. Phổi của con to ra hay nhỏ lại?'], ['When the air goes out, your lungs shrink back, smaller again.', 'Khi không khí đi ra, phổi xẹp lại, nhỏ đi.'], { opts: SIZE }),
    it('food', '❓', ['Eating', 'Ăn'], 'stomach', 2, ['You eat an apple. Where does it go to be mashed up?', 'Con ăn một quả táo. Nó đi đâu để được nghiền nhỏ?'], ['Food goes down a tube into your stomach, which squeezes and mashes it.', 'Thức ăn đi xuống một ống vào dạ dày, dạ dày co bóp và nghiền nhỏ nó.'], { badge: ['🍎'], opts: ['stomach', 'lungs', 'brain', 'heart'] }),
    it('pump', '❓', ['Blood', 'Máu'], 'heart', 2, ['What pumps blood all around your body?', 'Cái gì bơm máu đi khắp cơ thể con?'], ['Your heart is a strong muscle that pumps blood all day and all night.', 'Tim là một cơ rất khỏe, bơm máu suốt ngày đêm.'], { badge: ['💧'], opts: ['heart', 'lungs', 'stomach', 'brain'] }),
    it('stand', '❓', ['Standing tall', 'Đứng thẳng'], 'bones', 2, ['What holds your body up, so you can stand tall?', 'Cái gì giữ cho cơ thể con đứng thẳng?'], ['Your bones make a strong frame, called a skeleton, that holds you up.', 'Xương tạo thành bộ khung chắc chắn, gọi là bộ xương, giữ cho con đứng thẳng.'], { badge: ['🏃'], opts: ['bones', 'stomach', 'lungs', 'heart'] }),
    it('darkeye', '👀', ['Eyes in the dark', 'Mắt trong bóng tối'], 'bigger', 3, ['In a dark room, does the black dot in your eye get bigger or smaller?', 'Trong phòng tối, chấm đen trong mắt con to ra hay nhỏ lại?'], ['In the dark, the black dot, the pupil, opens wide to let in more light.', 'Trong bóng tối, chấm đen là đồng tử mở to để đón thêm ánh sáng.'], { badge: ['🌙'], opts: SIZE }),
    it('brighteye', '👀', ['Eyes in bright light', 'Mắt dưới nắng'], 'smaller', 3, ['In bright sunshine, does the black dot in your eye get bigger or smaller?', 'Dưới nắng chói, chấm đen trong mắt con to ra hay nhỏ lại?'], ['In bright light, your pupil gets small to keep out too much light.', 'Khi sáng chói, đồng tử thu nhỏ lại để chắn bớt ánh sáng.'], { badge: ['☀️'], opts: SIZE }),
    it('run', '🏃', ['After a race', 'Sau khi chạy đua'], 'faster', 3, ['After a running race, do you breathe faster or slower?', 'Sau khi chạy đua, con thở nhanh hơn hay chậm hơn?'], ['Running uses lots of air, so you breathe faster to take more in.', 'Chạy cần nhiều không khí, nên con thở nhanh hơn để hít vào nhiều hơn.'], { opts: BEAT })
  ],
  async show(x, it, b) {
    if (it.ans === 'faster' || it.ans === 'slower') {
      if (it.p === '🏃') { fx(b, 'sx2-jump'); await wait(slow(1200)); b.classList.remove('sx2-jump'); }
      swap(b, BODY.opts[it.ans].pic); b.classList.add(it.ans === 'faster' ? 'sx2-beatfast' : 'sx2-beatslow');
    } else if (it.ans === 'bigger' || it.ans === 'smaller') { b.classList.add(it.ans === 'bigger' ? 'sx2-big' : 'sx2-small'); tag(b, BODY.opts[it.ans].pic); }
    else { swap(b, BODY.opts[it.ans].pic); fx(b, 'sx2-grow'); b.classList.add('sx2-glow'); }
    x.api.sfx.pop && x.api.sfx.pop(3);
    await wait(slow(1100));
  },
  fact: ['Your heart beats about one hundred thousand times every day, even while you sleep!', 'Tim con đập khoảng một trăm nghìn lần mỗi ngày, kể cả khi con đang ngủ!']
};
register({ id: 'sci_body', learn: true, icon: 'sci:body', name: () => T('My Body', 'Cơ Thể Em'), run: api => play(api, BODY) });

// ---------- 7. Mixing Colours ----------
// paint pots and blobs are drawn here as small pictures of our own
const C = { red: '#e8433a', yellow: '#ffd23f', blue: '#3b6fe0', white: '#ffffff', black: '#2b2a33', green: '#43b04a', orange: '#ff8c1a', purple: '#8a4fd6', pink: '#ff9ecb', lightblue: '#9fd4ff', grey: '#9a9aa6', brown: '#8b5a2b', lightgreen: '#a8e6a1', lavender: '#c9a8f0' };
const blob = (c: string) => `<svg class="art" viewBox="0 0 48 48" aria-hidden="true"><path d="M24 6c9 0 18 6 18 16 0 12-9 20-18 20S6 36 6 26C6 14 14 6 24 6z" fill="${c}" stroke="#3b2a4f" stroke-width="2.6" stroke-linejoin="round"/><path d="M15 16c2-3 5-4 8-4" stroke="#fff" stroke-width="2.6" stroke-linecap="round" opacity=".6" fill="none"/></svg>`;
const pots = (cs: string[]) => `<svg class="art" viewBox="0 0 48 48" aria-hidden="true">${cs.map((c, i) => { const w = 44 / cs.length, x = 2 + i * w; return `<path d="M${x + 2} 20h${w - 4}l-2 20h-${w - 8}z" fill="${c}" stroke="#3b2a4f" stroke-width="2.4" stroke-linejoin="round"/><path d="M${x + 1} 17h${w - 2}v4h-${w - 2}z" fill="#e6e6ef" stroke="#3b2a4f" stroke-width="2.2" stroke-linejoin="round"/>`; }).join('')}<path d="M10 12c6-8 22-8 28 0" stroke="#3b2a4f" stroke-width="2.2" stroke-dasharray="3 3" fill="none"/></svg>`;
const CNAME: Record<string, Pair> = { orange: ['Orange', 'Màu cam'], green: ['Green', 'Xanh lá'], purple: ['Purple', 'Màu tím'], pink: ['Pink', 'Màu hồng'], lightblue: ['Light blue', 'Xanh da trời'], grey: ['Grey', 'Màu xám'], brown: ['Brown', 'Màu nâu'], lightgreen: ['Light green', 'Xanh nõn chuối'], lavender: ['Lilac', 'Tím nhạt'] };
const mix = (k: string, cs: string[], ans: string, hard: number, why: Pair, name: Pair): It => ({ k, html: pots(cs.map(c => C[c])), name, ans, hard, why, ask: cs.length > 2 ? ['What colour will these three paints make? Make a guess!', 'Ba màu này trộn lại thành màu gì? Con đoán xem!'] : ['What colour will these two paints make? Make a guess!', 'Hai màu này trộn lại thành màu gì? Con đoán xem!'] });
const COLOURS: Game = {
  scene: `<rect width="400" height="300" fill="#fff8e6"/><rect x="30" y="40" width="340" height="230" rx="12" fill="#fff" stroke="#3b2a4f" stroke-width="5" transform="rotate(-2 200 155)"/><path d="M60 230c40-20 80 10 120-6s70-30 120-4" stroke="#ffd0e6" stroke-width="10" stroke-linecap="round" fill="none"/>`,
  y: 46, nOpt: [2, 2, 3, 3, 4],
  opts: Object.fromEntries(Object.entries(CNAME).map(([k, label]) => [k, { html: blob(C[k]), label }])),
  pool: [
    mix('ry', ['red', 'yellow'], 'orange', 1, ['Red and yellow mix to make orange, like a sunset.', 'Đỏ trộn với vàng thành màu cam, như hoàng hôn.'], ['Red and yellow paint', 'Màu đỏ và màu vàng']),
    mix('yb', ['yellow', 'blue'], 'green', 1, ['Yellow and blue mix to make green, like leaves.', 'Vàng trộn với xanh dương thành xanh lá, như màu lá cây.'], ['Yellow and blue paint', 'Màu vàng và xanh dương']),
    mix('rb', ['red', 'blue'], 'purple', 1, ['Red and blue mix to make purple, like grapes.', 'Đỏ trộn với xanh dương thành màu tím, như quả nho.'], ['Red and blue paint', 'Màu đỏ và xanh dương']),
    mix('rw', ['red', 'white'], 'pink', 2, ['White makes a colour lighter: red and white make pink.', 'Màu trắng làm màu nhạt đi: đỏ và trắng thành màu hồng.'], ['Red and white paint', 'Màu đỏ và màu trắng']),
    mix('bw', ['blue', 'white'], 'lightblue', 2, ['Blue and white make a light blue, like the sky.', 'Xanh dương và trắng thành xanh da trời, như bầu trời.'], ['Blue and white paint', 'Màu xanh dương và trắng']),
    mix('kw', ['black', 'white'], 'grey', 2, ['Black and white mix to make grey, like a rain cloud.', 'Đen và trắng trộn lại thành màu xám, như đám mây mưa.'], ['Black and white paint', 'Màu đen và màu trắng']),
    mix('ryb', ['red', 'yellow', 'blue'], 'brown', 3, ['Mix all three main colours together and you get brown, like mud.', 'Trộn cả ba màu cơ bản lại sẽ ra màu nâu, như màu bùn.'], ['Red, yellow and blue paint', 'Màu đỏ, vàng và xanh dương']),
    mix('rg', ['red', 'green'], 'brown', 3, ['Red and green are opposite colours: mixed together, they make brown.', 'Đỏ và xanh lá là hai màu đối nhau: trộn lại sẽ thành màu nâu.'], ['Red and green paint', 'Màu đỏ và xanh lá']),
    mix('ybw', ['yellow', 'blue', 'white'], 'lightgreen', 3, ['Yellow and blue make green, and white makes it lighter: light green!', 'Vàng và xanh dương thành xanh lá, thêm trắng cho nhạt đi: xanh nõn chuối!'], ['Yellow, blue and white paint', 'Màu vàng, xanh dương và trắng']),
    mix('rbw', ['red', 'blue', 'white'], 'lavender', 3, ['Red and blue make purple, and white makes it soft: lilac!', 'Đỏ và xanh dương thành tím, thêm trắng cho dịu lại: tím nhạt!'], ['Red, blue and white paint', 'Màu đỏ, xanh dương và trắng'])
  ],
  async show(x, it, b) {
    fx(b, 'sx2-shake'); await wait(slow(450)); swap(b, '', blob(C[it.ans])); fx(b, 'sx2-grow');
    puff(x.scene, '✨', posOf(b).x, posOf(b).y - 14, 2); await wait(slow(900));
  },
  fact: ['Red, yellow and blue are the primary colours: you can mix them to make lots of other colours.', 'Đỏ, vàng và xanh dương là ba màu cơ bản: trộn chúng lại sẽ ra rất nhiều màu khác.']
};
register({ id: 'sci_colours', learn: true, icon: 'sci:colours', name: () => T('Mixing Colours', 'Pha Màu'), run: api => play(api, COLOURS) });

// ---------- 8. Ice Melts ----------
const SL = ['solid', 'liquid'], LG = ['liquid', 'gas'];
const ICE: Game = {
  scene: `<rect width="400" height="300" fill="#f2f7ff"/><rect x="0" y="200" width="400" height="100" fill="#e0c9a6"/><rect x="0" y="192" width="400" height="14" fill="#c9a05a" stroke="#3b2a4f" stroke-width="4"/><rect x="300" y="30" width="70" height="90" rx="8" fill="#e8f6ff" stroke="#3b2a4f" stroke-width="4"/><path d="M300 70h70" stroke="#3b2a4f" stroke-width="4"/>`,
  y: 52, nOpt: [2, 2, 3, 3, 3],
  opts: { solid: { pic: '🧊', label: ['Solid', 'Thể rắn'] }, liquid: { pic: '💧', label: ['Liquid', 'Thể lỏng'] }, gas: { pic: '💨', label: ['Gas', 'Thể khí'] } },
  pool: [
    it('icesun', '🧊', ['Ice cube in the sun', 'Đá lạnh dưới nắng'], 'liquid', 1, ['Put the ice cube in the sun. What will it turn into?', 'Đặt viên đá lạnh dưới nắng. Nó sẽ biến thành gì?'], ['The sun warms the ice and it melts into water, a liquid.', 'Nắng làm đá ấm lên và tan thành nước, một chất lỏng.'], { badge: ['☀️'], after: '💧', opts: SL }),
    it('freeze', '💧', ['Water in the freezer', 'Nước trong tủ đá'], 'solid', 1, ['Put water in the freezer. What will it turn into?', 'Cho nước vào tủ đá. Nó sẽ biến thành gì?'], ['In the freezer, water gets so cold it turns into hard ice, a solid.', 'Trong tủ đá, nước lạnh tới mức đông thành đá cứng, một chất rắn.'], { badge: ['sci2:freezer'], after: '🧊', opts: SL }),
    it('icecream', '🍦', ['Ice cream in the sun', 'Kem dưới nắng'], 'liquid', 1, ['Leave an ice cream in the hot sun. What will it turn into?', 'Để que kem dưới nắng nóng. Nó sẽ biến thành gì?'], ['The ice cream melts into a runny liquid. Eat it quickly!', 'Kem tan chảy thành chất lỏng. Ăn nhanh lên nào!'], { badge: ['☀️'], after: 'sci2:melted', opts: SL }),
    it('kettle', '🫖', ['Water boiling', 'Nước đun sôi'], 'gas', 1, ['Boil water in a kettle. What does some of it turn into?', 'Đun sôi nước trong ấm. Một phần nước biến thành gì?'], ['Boiling water turns into steam, a gas, that floats up into the air.', 'Nước sôi biến thành hơi nước, một chất khí, bay lên không trung.'], { badge: ['🔥'], after: '💨', opts: LG }),
    it('snowman', '⛄', ['Snowman in the sun', 'Người tuyết dưới nắng'], 'liquid', 2, ['The sun comes out on the snowman. What will he turn into?', 'Nắng chiếu lên người tuyết. Người tuyết sẽ biến thành gì?'], ['Snow is frozen water, so in the warm sun the snowman melts into water.', 'Tuyết là nước đông lại, nên dưới nắng ấm người tuyết tan thành nước.'], { badge: ['☀️'], after: '💧' }),
    it('choc', '🍫', ['Chocolate in the sun', 'Sô-cô-la dưới nắng'], 'liquid', 2, ['Leave chocolate in a hot car. What will it turn into?', 'Để sô-cô-la trong xe ô tô nóng. Nó sẽ biến thành gì?'], ['Heat melts chocolate into a gooey liquid. In the fridge it goes hard again.', 'Hơi nóng làm sô-cô-la chảy thành chất lỏng sệt. Cho vào tủ lạnh nó lại cứng.'], { badge: ['☀️'], after: 'sci2:melted' }),
    it('candle', '🕯️', ['A burning candle', 'Cây nến đang cháy'], 'liquid', 2, ['A candle burns. What happens to the wax near the flame?', 'Cây nến đang cháy. Sáp gần ngọn lửa thì sao?'], ['The heat of the flame melts the hard wax into a liquid pool.', 'Hơi nóng của ngọn lửa làm sáp cứng chảy thành một vũng chất lỏng.'], { badge: ['🔥'], after: '💧' }),
    it('juice', '🧃', ['Juice in the freezer', 'Nước ép trong tủ đá'], 'solid', 2, ['Pour juice in a mould and put it in the freezer. What will it turn into?', 'Rót nước ép vào khuôn rồi cho vào tủ đá. Nó sẽ biến thành gì?'], ['The juice freezes solid: now it is an icy pole to lick!', 'Nước ép đông cứng lại: giờ thành que kem đá để mút!'], { badge: ['sci2:freezer'], after: '🧊' }),
    it('puddle', 'sci2:puddle', ['A puddle on a hot day', 'Vũng nước ngày nóng'], 'gas', 3, ['A puddle sits in the hot sun all day. What does the water turn into?', 'Vũng nước nằm dưới nắng nóng cả ngày. Nước biến thành gì?'], ['Slowly the water turns into vapour, a gas, and the puddle is gone.', 'Nước dần biến thành hơi nước, một chất khí, và vũng nước biến mất.'], { badge: ['☀️'], after: '💨' }),
    it('egg', '🥚', ['An egg in the pan', 'Quả trứng trong chảo'], 'solid', 3, ['Crack an egg into a hot pan. What does the runny egg turn into?', 'Đập quả trứng vào chảo nóng. Lòng trứng lỏng biến thành gì?'], ['Cooking makes the egg go solid, and it can never turn runny again.', 'Nấu chín làm trứng đặc lại, và không bao giờ lỏng trở lại được.'], { badge: ['🔥'], after: '🍳' }),
    it('mirror', '💨', ['Steam on a cold window', 'Hơi nước trên cửa kính lạnh'], 'liquid', 3, ['Steam from a hot bath touches a cold window. What does it turn into?', 'Hơi nước từ bồn tắm nóng chạm vào cửa kính lạnh. Nó biến thành gì?'], ['The cold glass turns the steam back into tiny drops of water.', 'Kính lạnh biến hơi nước trở lại thành những giọt nước nhỏ.'], { badge: ['🪟'], after: '💧' })
  ],
  async show(x, it, b) {
    const { x: px, y: py } = posOf(b); fx(b, 'sx2-shake'); await wait(slow(500));
    swap(b, it.after || ICE.opts[it.ans].pic); fx(b, 'sx2-grow');
    if (it.ans === 'gas') { puff(x.scene, '💨', px, py - 10, 3); moveTo(b, px, py - 14); }
    else if (it.ans === 'liquid') puff(x.scene, '💧', px, py + 12, 2, true);
    await wait(slow(1000));
  },
  fact: ['Water can be a solid, a liquid or a gas: ice, water and steam are all the same water!', 'Nước có thể ở thể rắn, thể lỏng hoặc thể khí: đá, nước và hơi nước đều là nước cả!']
};
register({ id: 'sci_ice', learn: true, icon: 'sci:ice', name: () => T('Ice Melts', 'Đá Tan'), run: api => play(api, ICE) });

// ---------- 9. Rainbow Light ----------
const BOW: Pair = ['Shine the light. Will we see a rainbow?', 'Chiếu ánh sáng vào. Mình có thấy cầu vồng không?'];
const RAINBOW: Game = {
  scene: sky('#d6eeff', '#fbfdff') + grass(240),
  y: 62, ask: BOW, nOpt: [2, 2, 2, 2, 2], act: ['Now tap it to let the light shine!', 'Giờ chạm vào để ánh sáng chiếu nhé!'], actMany: ['Now tap each one to let the light shine!', 'Giờ chạm vào từng cái để ánh sáng chiếu nhé!'],
  opts: { yes: { pic: '🌈', label: ['Rainbow', 'Có cầu vồng'] }, no: { pic: 'sci2:norainbow', label: ['No rainbow', 'Không có'] } },
  pool: [
    it('prism', 'sci2:prism', ['Glass prism in the sun', 'Lăng kính dưới nắng'], 'yes', 1, BOW, ['A glass prism bends sunlight and splits it into all its colours.', 'Lăng kính thủy tinh bẻ cong ánh nắng và tách nó ra thành đủ màu.'], { badge: ['☀️'] }),
    it('sunrain', '🌧️', ['Rain with the sun out', 'Mưa khi có nắng'], 'yes', 1, ['The sun shines behind you while rain falls in front. Will we see a rainbow?', 'Nắng chiếu sau lưng con trong khi mưa rơi phía trước. Mình có thấy cầu vồng không?'], ['Sunlight shines through raindrops, and each drop splits the light into colours: a rainbow!', 'Ánh nắng chiếu qua hạt mưa, mỗi hạt tách ánh sáng thành nhiều màu: cầu vồng!'], { badge: ['☀️'] }),
    it('night', '🌧️', ['Rain at night', 'Mưa ban đêm'], 'no', 1, ['It rains on a dark night. Will we see a rainbow?', 'Trời mưa vào ban đêm tối. Mình có thấy cầu vồng không?'], ['At night there is no sunlight to split into colours, so there is no rainbow.', 'Ban đêm không có ánh nắng để tách thành màu, nên không có cầu vồng.'], { badge: ['🌙'] }),
    it('cloudy', '☁️', ['A grey day', 'Ngày âm u'], 'no', 1, ['Grey clouds hide the sun, and there is no rain. Will we see a rainbow?', 'Mây xám che mặt trời và không có mưa. Mình có thấy cầu vồng không?'], ['No sunshine and no raindrops, so there is no rainbow today.', 'Không có nắng cũng không có hạt mưa, nên hôm nay không có cầu vồng.']),
    it('hose', 'sci2:hose', ['Garden hose spray', 'Vòi tưới vườn'], 'yes', 2, ['Spray the hose on a sunny day, with the sun behind you. Will we see a rainbow?', 'Phun vòi nước vào ngày nắng, mặt trời sau lưng con. Mình có thấy cầu vồng không?'], ['The tiny drops from the hose split the sunlight, just like rain.', 'Những giọt nước nhỏ từ vòi tách ánh nắng ra, giống hệt hạt mưa.'], { badge: ['☀️'] }),
    it('bubble', '🫧', ['Soap bubble', 'Bong bóng xà phòng'], 'yes', 2, BOW, ['Light bouncing in the thin soap skin makes swirly rainbow colours.', 'Ánh sáng phản chiếu trong lớp xà phòng mỏng tạo ra những vệt màu cầu vồng.'], { badge: ['☀️'] }),
    it('torchwall', 'sci2:torch', ['Torch on a wall', 'Đèn pin chiếu tường'], 'no', 2, ['Shine a torch on a plain wall. Will we see a rainbow?', 'Chiếu đèn pin lên bức tường trơn. Mình có thấy cầu vồng không?'], ['Plain torchlight on a wall stays one colour: there is nothing to split it.', 'Ánh đèn pin chiếu lên tường chỉ có một màu: không có gì tách nó ra cả.']),
    it('dry', '☀️', ['Sunshine alone', 'Chỉ có nắng'], 'no', 2, ['A hot sunny day with no water drops and no glass. Will we see a rainbow?', 'Ngày nắng nóng, không có giọt nước cũng không có thủy tinh. Mình có thấy cầu vồng không?'], ['Sunshine alone is not enough: we need water drops or glass to split the light.', 'Chỉ có nắng thì chưa đủ: cần giọt nước hoặc thủy tinh để tách ánh sáng.'], { badge: ['🌵'] }),
    it('disc', 'sci2:disc', ['Shiny disc', 'Đĩa sáng bóng'], 'yes', 3, BOW, ['The tiny lines on a shiny disc split the light into colours.', 'Những đường rãnh nhỏ trên đĩa sáng bóng tách ánh sáng ra thành nhiều màu.'], { badge: ['☀️'] }),
    it('glass', '🥛', ['Glass of water by the window', 'Cốc nước cạnh cửa sổ'], 'yes', 3, BOW, ['A glass of water in a sunny window can bend light into a little rainbow on the floor.', 'Cốc nước đặt ở cửa sổ có nắng có thể bẻ ánh sáng thành cầu vồng nhỏ trên sàn.'], { badge: ['☀️', '🪟'] }),
    it('torchprism', 'sci2:prism', ['Prism and a torch', 'Lăng kính và đèn pin'], 'yes', 3, BOW, ['White light, like a torch, has all the colours inside it. The prism splits them out.', 'Ánh sáng trắng, như đèn pin, chứa đủ mọi màu. Lăng kính tách chúng ra.'], { badge: ['sci2:torch'] }),
    it('sunahead', '🌧️', ['Looking at the sun', 'Nhìn về phía mặt trời'], 'no', 3, ['You look towards the sun, and the rain is falling far behind you. Will we see a rainbow?', 'Con nhìn về phía mặt trời, còn mưa rơi ở xa sau lưng con. Mình có thấy cầu vồng không?'], ['A rainbow is only seen with the sun behind you and the rain in front.', 'Chỉ thấy cầu vồng khi mặt trời ở sau lưng và mưa ở phía trước.'], { badge: ['☀️'] })
  ],
  async show(x, it, b) {
    const { x: px, y: py } = posOf(b); b.classList.add('sx2-glow'); await wait(slow(500));
    if (it.ans === 'yes') { prop(x.scene, '🌈', px, py - 30, 'sx2-pop'); puff(x.scene, '✨', px, py - 34, 2); x.api.sfx.pop && x.api.sfx.pop(5); }
    else { b.classList.remove('sx2-glow'); fx(b, 'sx2-shake'); tag(b, 'sci2:norainbow'); }
    await wait(slow(1000));
  },
  fact: ['Sunlight looks white, but it is really made of seven colours: red, orange, yellow, green, blue, indigo and violet.', 'Ánh nắng trông màu trắng, nhưng thật ra có bảy màu: đỏ, cam, vàng, lục, lam, chàm, tím.']
};
register({ id: 'sci_rainbow', learn: true, icon: 'sci:rainbow', name: () => T('Rainbow Light', 'Cầu Vồng Ánh Sáng'), run: api => play(api, RAINBOW) });

// ---------- 10. Light the Bulb ----------
// a battery, two wires, a bulb, and a gap between the two metal clips (46 %, 80 %): what is put in the gap closes the
// circuit only if electricity can flow through it
const GAP = { x: 46, y: 80 };
const BULB_Q: Pair = ['Put this in the gap. Will the bulb light up?', 'Đặt vật này vào chỗ hở. Bóng đèn có sáng không?'];
const BULB: Game = {
  scene: `<rect width="400" height="300" fill="#fff8e6"/><rect x="0" y="200" width="400" height="100" fill="#f0dcb4"/><g stroke="#3b2a4f" stroke-width="4" stroke-linejoin="round"><rect x="40" y="208" width="80" height="36" rx="6" fill="#ffd23f"/><rect x="88" y="208" width="32" height="36" fill="#3b2a4f"/><rect x="120" y="218" width="8" height="16" rx="2" fill="#c9c9d6"/></g><text x="56" y="232" font-size="18" font-weight="900" fill="#3b2a4f" font-family="Fredoka,sans-serif">+</text><path d="M128 226H150V240M218 240H330V214M40 226H22V150H294V214" stroke="#e8433a" stroke-width="5" fill="none" stroke-linejoin="round"/><circle cx="150" cy="240" r="7" fill="#c9c9d6" stroke="#3b2a4f" stroke-width="3"/><circle cx="218" cy="240" r="7" fill="#c9c9d6" stroke="#3b2a4f" stroke-width="3"/>`,
  y: 24, ask: BULB_Q, nOpt: [2, 2, 2, 2, 2], act: ['Now put it in the gap: drag it, or tap it.', 'Giờ đặt nó vào chỗ hở: kéo, hoặc chạm vào nó nhé.'], actMany: ['Now test each one in the gap: drag them, or tap them.', 'Giờ thử từng vật ở chỗ hở: kéo, hoặc chạm vào từng vật nhé.'],
  opts: { yes: { pic: '💡', label: ['Lights up', 'Đèn sáng'] }, no: { pic: 'sci2:bulboff', label: ['Stays dark', 'Đèn tắt'] } },
  pool: [
    it('spoon', '🥄', ['Metal spoon', 'Thìa kim loại'], 'yes', 1, BULB_Q, ['The metal spoon lets electricity flow through, so the circuit is closed and the bulb lights up.', 'Thìa kim loại cho dòng điện chạy qua, mạch điện được nối kín nên bóng đèn sáng.']),
    it('key', '🔑', ['Key', 'Chìa khóa'], 'yes', 1, BULB_Q, ['The key is metal, and metal lets electricity through. The bulb lights up!', 'Chìa khóa bằng kim loại, mà kim loại cho dòng điện đi qua. Bóng đèn sáng!']),
    it('wood', '🪵', ['Wooden stick', 'Que gỗ'], 'no', 1, BULB_Q, ['Wood stops electricity, so the bulb stays dark.', 'Gỗ chặn dòng điện, nên bóng đèn vẫn tắt.']),
    it('teddy', '🧸', ['Teddy', 'Gấu bông'], 'no', 1, BULB_Q, ['Soft cloth does not carry electricity, so the bulb stays dark.', 'Vải mềm không dẫn điện, nên bóng đèn vẫn tắt.']),
    it('coin', '🪙', ['Coin', 'Đồng xu'], 'yes', 2, BULB_Q, ['A coin is made of metal, so electricity flows through it and the bulb shines.', 'Đồng xu làm bằng kim loại, dòng điện chạy qua nên bóng đèn sáng.']),
    it('clip', '📎', ['Paper clip', 'Kẹp giấy'], 'yes', 2, BULB_Q, ['The paper clip is a thin piece of steel wire, so it closes the circuit.', 'Kẹp giấy là một đoạn dây thép mảnh, nên nó nối kín mạch điện.']),
    it('paper', '📄', ['Paper', 'Tờ giấy'], 'no', 2, BULB_Q, ['Paper does not let electricity through, so the bulb stays dark.', 'Giấy không cho dòng điện đi qua, nên bóng đèn vẫn tắt.']),
    it('rubber', 'sci2:rubber', ['Eraser', 'Cục tẩy'], 'no', 2, BULB_Q, ['Rubber stops electricity. That is why some tools have rubber handles.', 'Cao su chặn dòng điện. Vì vậy nhiều dụng cụ có tay cầm bằng cao su.']),
    it('leaf', '🍃', ['Dry leaf', 'Lá khô'], 'no', 2, BULB_Q, ['A dry leaf does not carry electricity, so the bulb stays dark.', 'Lá khô không dẫn điện, nên bóng đèn vẫn tắt.']),
    it('foil', 'sci2:foil', ['Kitchen foil', 'Giấy bạc'], 'yes', 3, BULB_Q, ['Kitchen foil is a thin sheet of metal, so electricity flows through it.', 'Giấy bạc là một tấm kim loại mỏng, nên dòng điện chạy qua được.']),
    it('jar', '🫙', ['Glass jar', 'Lọ thủy tinh'], 'no', 3, BULB_Q, ['Glass is hard and shiny, but it does not let electricity through.', 'Thủy tinh cứng và sáng bóng, nhưng không cho dòng điện đi qua.']),
    it('bottle', '🧴', ['Plastic bottle', 'Chai nhựa'], 'no', 3, BULB_Q, ['Plastic stops electricity. Wires are covered in plastic to keep us safe.', 'Nhựa chặn dòng điện. Dây điện được bọc nhựa để giữ an toàn cho chúng ta.']),
    it('scissors', '✂️', ['Scissors', 'Cái kéo'], 'yes', 3, BULB_Q, ['The metal blades of the scissors carry electricity, so the bulb lights up.', 'Lưỡi kéo bằng kim loại dẫn điện, nên bóng đèn sáng.'])
  ],
  draw: x => { const b = prop(x.scene, 'sci2:bulboff', 78, 62, 'sx2-bulb'); b.dataset.bulb = '1'; },
  async show(x, it, b) {
    const home = posOf(b), lamp = x.scene.querySelector('[data-bulb]') as HTMLElement;
    moveTo(b, GAP.x, GAP.y); await wait(slow(600));
    if (it.ans === 'yes') { lamp.innerHTML = pic('💡'); lamp.classList.add('sx2-glow'); x.api.sfx.pop && x.api.sfx.pop(5); }
    else fx(lamp, 'sx2-hop');
    await wait(slow(1000));
    lamp.innerHTML = pic('sci2:bulboff'); lamp.classList.remove('sx2-glow');
    moveTo(b, home.x, home.y); tag(b, it.ans === 'yes' ? '💡' : 'sci2:bulboff'); await wait(slow(500));
  },
  fact: ['Metals let electricity flow, so wires have metal inside a plastic coat. Never play with the power points at home!', 'Kim loại cho dòng điện chạy qua, nên dây điện có lõi kim loại bọc nhựa bên ngoài. Đừng bao giờ nghịch ổ cắm điện ở nhà nhé!']
};
register({ id: 'sci_bulb', learn: true, icon: 'sci:bulb', name: () => T('Light the Bulb', 'Thắp Sáng Bóng Đèn'), run: api => play(api, BULB) });

// ---------- 11. Gears Turn ----------
// a row of gears drawn here (our own drawing): the first has an arrow (it turns clockwise), the one asked about has a
// gold star; gears that touch turn opposite ways, a belt keeps the same way, a small gear turns faster than a big one
const GEAR_COLS = ['#ffb020', '#5fb6ff', '#43c463', '#ff7eb8', '#8a5cf6'];
function train(rs: number[], belt = false, star = rs.length - 1) {
  let x = 14, out = ''; const cy = 40;
  rs.forEach((r, i) => {
    if (i) x += belt ? rs[i - 1] + r + 40 : rs[i - 1] + r + 2; else x += r;
    const n = Math.max(6, Math.round(r / 2.6)); let d = '';
    for (let k = 0; k < n * 2; k++) { const a0 = k * Math.PI / n, a1 = (k + 1) * Math.PI / n, rr = k % 2 ? r - 2 : r + 3; d += `${k ? 'L' : 'M'}${(x + Math.cos(a0) * rr).toFixed(1)} ${(cy + Math.sin(a0) * rr).toFixed(1)}L${(x + Math.cos(a1) * rr).toFixed(1)} ${(cy + Math.sin(a1) * rr).toFixed(1)}`; }
    const dir = belt || i % 2 === 0 ? 'normal' : 'reverse', dur = (r / 9).toFixed(2);
    out += `<g class="sx2-g" style="transform-origin:${x}px ${cy}px;--d:${dur}s;animation-direction:${dir}">${belt ? `<circle cx="${x}" cy="${cy}" r="${r}" fill="${GEAR_COLS[i % 5]}" stroke="#3b2a4f" stroke-width="3"/>` : `<path d="${d}z" fill="${GEAR_COLS[i % 5]}" stroke="#3b2a4f" stroke-width="3" stroke-linejoin="round"/>`}<circle cx="${x}" cy="${cy}" r="${(r * .3).toFixed(1)}" fill="#fff" stroke="#3b2a4f" stroke-width="2.4"/><path d="M${x} ${cy - r * .3}v${(-r * .5).toFixed(1)}" stroke="#3b2a4f" stroke-width="3" stroke-linecap="round"/></g>`;
    if (i === 0) out += `<path d="M${x - r - 4} ${cy - 10}a${r + 6} ${r + 6} 0 0 1 ${r + 4} -${r - 2}" stroke="#3b6fe0" stroke-width="4" fill="none" stroke-linecap="round"/><path d="M${x + 2} ${cy - r - 9}l7 5-8 4z" fill="#3b6fe0"/>`;
    if (i === star) out += `<path d="M${x} ${cy - r - 14}l2.4 5 5.4.6-4 3.6 1.2 5.3-5-2.8-5 2.8 1.2-5.3-4-3.6 5.4-.6z" fill="#ffd23f" stroke="#3b2a4f" stroke-width="1.6" stroke-linejoin="round"/>`;
  });
  if (belt) { const r0 = rs[0], r1 = rs[1], x0 = 14 + r0, x1 = x0 + r0 + r1 + 40; out = `<path d="M${x0} ${cy - r0 - 3}L${x1} ${cy - r1 - 3}M${x0} ${cy + r0 + 3}L${x1} ${cy + r1 + 3}" stroke="#3b2a4f" stroke-width="5" stroke-linecap="round"/>` + out; }
  const w = Math.max(160, x + rs[rs.length - 1] + 18);   // (the row fits its gears, centred in the card)
  return `<svg class="art" viewBox="0 -2 ${w} 84" preserveAspectRatio="xMidYMid meet" aria-hidden="true">${out}</svg>`;
}
const WAY: Pair = ['The first gear turns the way of the arrow. Which way will the gear with the star turn?', 'Bánh răng đầu tiên quay theo chiều mũi tên. Bánh răng có ngôi sao sẽ quay chiều nào?'];
const TURN = ['cw', 'ccw'];
const gears = (k: string, rs: number[], ans: string, hard: number, why: Pair, more: Partial<It> = {}): It => ({ k, html: train(rs, more.v === 'belt', more.v === 'big' ? 0 : rs.length - 1), name: ['A row of gears', 'Một hàng bánh răng'], ans, hard, ask: WAY, why, opts: TURN, ...more });
const GEARS: Game = {
  scene: `<rect width="400" height="300" fill="#eef2f8"/><path d="M0 40h400M0 140h400M0 240h400" stroke="#dfe5ef" stroke-width="6"/>`,
  cls: 'sx2-wide', pos: per => per === 1 ? [[50, 50]] : [[50, 17], [50, 50], [50, 83]], nOpt: [2, 2, 2, 2, 2],
  act: ['Now tap the gears to turn them.', 'Giờ chạm vào các bánh răng để quay chúng nhé.'], actMany: ['Now tap each row of gears to turn it.', 'Giờ chạm vào từng hàng bánh răng để quay nhé.'],
  opts: { cw: { pic: 'sci2:cw', label: ['Clockwise', 'Cùng chiều kim đồng hồ'] }, ccw: { pic: 'sci2:ccw', label: ['Anticlockwise', 'Ngược chiều kim đồng hồ'] }, big: { pic: 'sci2:gearbig', label: ['Big gear', 'Bánh răng to'] }, small: { pic: 'sci2:gearsmall', label: ['Small gear', 'Bánh răng nhỏ'] } },
  pool: [
    gears('two', [22, 22], 'ccw', 1, ['Gears that touch turn opposite ways, so the second gear turns the other way.', 'Hai bánh răng khớp nhau thì quay ngược chiều nhau, nên bánh thứ hai quay chiều kia.']),
    gears('three', [20, 20, 20], 'cw', 1, ['Each gear flips the turn: the middle one goes the other way, and the last turns the same way as the first.', 'Mỗi bánh răng đổi chiều quay: bánh giữa quay chiều kia, bánh cuối quay cùng chiều bánh đầu.']),
    gears('twob', [26, 16], 'ccw', 1, ['Big or small, two gears that touch always turn opposite ways.', 'Dù to hay nhỏ, hai bánh răng khớp nhau luôn quay ngược chiều nhau.']),
    gears('four', [18, 18, 18, 18], 'ccw', 2, ['Count them: this way, that way, this way, that way. The fourth gear turns the other way.', 'Đếm nhé: chiều này, chiều kia, chiều này, chiều kia. Bánh thứ tư quay chiều kia.']),
    gears('threeb', [24, 14, 24], 'cw', 2, ['The first and the third gear turn the same way, whatever their size.', 'Bánh thứ nhất và bánh thứ ba quay cùng chiều, dù to hay nhỏ.']),
    gears('fast', [28, 14], 'small', 2, ['The small gear has fewer teeth, so it must spin round more times to keep up.', 'Bánh nhỏ có ít răng hơn, nên phải quay nhiều vòng hơn để theo kịp.'], { ask: ['A big gear turns a small gear. Which one spins faster?', 'Bánh răng to quay bánh răng nhỏ. Bánh nào quay nhanh hơn?'], opts: ['big', 'small'] }),
    gears('five', [16, 16, 16, 16, 16], 'cw', 3, ['Odd gears, the first, third and fifth, all turn the same way.', 'Các bánh lẻ, thứ nhất, thứ ba và thứ năm, đều quay cùng một chiều.']),
    gears('belt', [22, 22], 'cw', 3, ['A belt does not flip the turn: both wheels turn the same way, like a bicycle chain.', 'Dây curoa không đổi chiều quay: hai bánh quay cùng chiều, giống như xích xe đạp.'], { v: 'belt', ask: ['These two wheels are joined by a belt. Which way will the wheel with the star turn?', 'Hai bánh xe này nối với nhau bằng dây curoa. Bánh có ngôi sao sẽ quay chiều nào?'] }),
    gears('slow', [14, 28], 'big', 3, ['The big gear has more teeth, so it turns slowly, but strongly.', 'Bánh to có nhiều răng hơn, nên quay chậm nhưng khỏe.'], { ask: ['A small gear turns a big gear. Which one spins slower?', 'Bánh răng nhỏ quay bánh răng to. Bánh nào quay chậm hơn?'], opts: ['big', 'small'] }),
    gears('fourb', [14, 24, 14, 24], 'ccw', 3, ['Four gears in a row: the last one turns opposite to the first.', 'Bốn bánh răng thẳng hàng: bánh cuối quay ngược chiều bánh đầu.'])
  ],
  async show(x, it, b) {
    b.classList.add('sx2-run'); x.api.sfx.pop && x.api.sfx.pop(1); await wait(slow(1800));
    tag(b, GEARS.opts[it.ans].pic); await wait(slow(400));
  },
  fact: ['Gears are inside clocks, bicycles and cars. They pass a turn from one wheel to the next.', 'Bánh răng có trong đồng hồ, xe đạp và ô tô. Chúng truyền chuyển động quay từ bánh này sang bánh khác.']
};
register({ id: 'sci_gears', learn: true, icon: 'sci:gears', name: () => T('Gears Turn', 'Bánh Răng Quay'), run: api => play(api, GEARS) });

// ---------- 12. Recycle Sort ----------
const BIN_X = { paper: 12, recycle: 31, food: 50, rest: 69, special: 88 };
const SORT: Pair = ['Which bin does this go in? Make a guess!', 'Vật này bỏ vào thùng nào? Con đoán xem!'];
const RECYCLE: Game = {
  scene: sky('#e6f6ff', '#fffdf6') + `<rect x="0" y="244" width="400" height="56" fill="#cfc6b8" stroke="#3b2a4f" stroke-width="4"/>`,
  y: 30, ask: SORT, nOpt: [2, 2, 3, 4, 5], act: ['Now put it in the right bin: drag it, or tap it.', 'Giờ bỏ vào đúng thùng: kéo, hoặc chạm vào nó nhé.'], actMany: ['Now put each one in its bin: drag them, or tap them.', 'Giờ bỏ từng vật vào thùng của nó: kéo, hoặc chạm vào nhé.'],
  opts: { paper: { pic: 'sci2:binpaper', label: ['Paper bin', 'Thùng giấy'] }, recycle: { pic: 'sci2:binrecycle', label: ['Recycling', 'Thùng tái chế'] }, food: { pic: 'sci2:binfood', label: ['Food scraps', 'Rác thức ăn'] }, rest: { pic: 'sci2:binrest', label: ['Other rubbish', 'Rác còn lại'] }, special: { pic: 'sci2:dropoff', label: ['Special drop-off', 'Điểm thu gom riêng'] } },
  pool: [
    it('news', '📄', ['Old paper', 'Giấy cũ'], 'paper', 1, SORT, ['Paper goes in the paper bin, so it can be made into new paper.', 'Giấy bỏ vào thùng giấy để làm thành giấy mới.']),
    it('box', '📦', ['Cardboard box', 'Hộp các-tông'], 'paper', 1, SORT, ['Flatten the box: cardboard is paper, and it becomes new boxes.', 'Gấp dẹt chiếc hộp: bìa các-tông là giấy, sẽ thành hộp mới.']),
    it('can', '🥫', ['Empty can', 'Lon rỗng'], 'recycle', 1, SORT, ['Cans are melted down and made into new cans.', 'Lon được nấu chảy ra để làm thành lon mới.']),
    it('banana', '🍌', ['Banana peel', 'Vỏ chuối'], 'food', 1, SORT, ['Banana peel rots into compost, which feeds the garden.', 'Vỏ chuối hoai mục thành phân bón cho khu vườn.']),
    it('apple', '🍎', ['Apple core', 'Lõi táo'], 'food', 1, SORT, ['Food scraps turn into rich soil for new plants.', 'Thức ăn thừa biến thành đất màu mỡ cho cây mới.']),
    it('bottle', '🧴', ['Plastic bottle', 'Chai nhựa'], 'recycle', 2, SORT, ['Clean plastic bottles are chopped up and made into new things.', 'Chai nhựa sạch được băm nhỏ để làm thành đồ mới.']),
    it('jar', '🫙', ['Glass jar', 'Lọ thủy tinh'], 'recycle', 2, SORT, ['Glass can be melted and made into new jars again and again.', 'Thủy tinh có thể nấu chảy để làm lọ mới hết lần này tới lần khác.']),
    it('egg', '🥚', ['Egg shells', 'Vỏ trứng'], 'food', 2, SORT, ['Egg shells go with the food scraps and make the compost strong.', 'Vỏ trứng bỏ cùng rác thức ăn và làm phân bón tốt hơn.']),
    it('leaves', '🍃', ['Garden leaves', 'Lá cây trong vườn'], 'food', 2, SORT, ['Leaves and grass clippings rot down into good compost.', 'Lá cây và cỏ cắt hoai mục thành phân bón tốt.']),
    it('juice', '🧃', ['Juice box', 'Hộp nước ép'], 'recycle', 3, SORT, ['A juice box can be recycled: it is pulled apart into card, plastic and foil.', 'Hộp nước ép tái chế được: nó được tách ra thành bìa, nhựa và giấy bạc.']),
    it('battery', '🔋', ['Old battery', 'Pin cũ'], 'special', 3, SORT, ['Batteries never go in a bin: take them to a special drop-off, so they cannot start fires.', 'Pin không bao giờ bỏ vào thùng rác: mang tới điểm thu gom riêng để tránh gây cháy.']),
    it('chips', 'sci2:chips', ['Chip packet', 'Gói bim bim'], 'rest', 3, SORT, ['A chip packet is plastic and foil stuck together, so it goes with other rubbish.', 'Gói bim bim là nhựa và giấy bạc dính liền nhau, nên bỏ vào rác còn lại.']),
    it('toy', '🧸', ['Broken teddy', 'Gấu bông bị rách'], 'rest', 3, SORT, ['A teddy too broken to give away goes with other rubbish. If it is still good, give it to a friend!', 'Gấu bông rách quá không cho ai được thì bỏ vào rác còn lại. Nếu còn tốt, hãy tặng bạn nhé!'])
  ],
  draw: x => { for (const [k, bx] of Object.entries(BIN_X)) { const e = prop(x.scene, RECYCLE.opts[k].pic, bx, 82, 'sx2-bin'); e.dataset.bin = k; } },
  async show(x, it, b) {
    const bx = BIN_X[it.ans], bin = x.scene.querySelector(`[data-bin="${it.ans}"]`);
    moveTo(b, bx, 62); await wait(slow(550)); b.classList.add('sx2-in', 'sx2-gone'); moveTo(b, bx, 76);
    await wait(slow(450)); bin && fx(bin, 'sx2-hop'); x.api.sfx.pop && x.api.sfx.pop(4); puff(x.scene, '✨', bx, 70, 2);
    await wait(slow(700));
  },
  fact: ['Recycling one can saves enough power to run a TV for three hours!', 'Tái chế một chiếc lon tiết kiệm đủ điện để xem ti vi ba tiếng đồng hồ!']
};
register({ id: 'sci_recycle', learn: true, icon: 'sci:recycle', name: () => T('Recycle Sort', 'Phân Loại Rác'), run: api => play(api, RECYCLE) });
