// What keeps little ones coming back (round R, owner 9 Oct: "add these in and add to the studio so we can switch on/off"):
//   companionGrow  feed the companion once a day (a button by the coins); every two days of food it grows a little, its
//                  glow changes, and from size 3 it does a loop-the-loop when asked
//   saveGoal       a coin goal next to the coins: explain a hat for the companion, then explicitly choose Buy
//   dailySurprise  each day a gift box waits by one of the landmarks (a different one each day); open it for coins
// Everything is kept in profile.lanterns.pet and profile.gift. Studio switches in js/content/releases.js (group 'kids').
import { THREE, P, merge, toonVC } from './gfx.js';
import { T } from './i18n.js';
import { featureOn } from './custom.js';
import { farm } from './state.js';
import { LANDMARKS } from './regions.js';
import { heightAt, WATER } from './world.js';
import { pic } from './art.js';
import { explain as explainBrief } from './explain.js';

// the hats to save for, in order (coins)
export const HATS = [
  { id: 'party', price: 30, en: 'Party hat', vi: 'Mũ sinh nhật' },
  { id: 'flower', price: 45, en: 'Flower crown', vi: 'Vòng hoa' },
  { id: 'nonla', price: 60, en: 'Little nón lá', vi: 'Nón lá nhỏ' },
  { id: 'crown', price: 80, en: 'Golden crown', vi: 'Vương miện vàng' }
];
// what is said ([en, vi]; recorded)
export const KID_LINES = {
  fed: ['Yum, thank you! I feel stronger already.', 'Ngon quá, cảm ơn bạn! Mình thấy khỏe hơn rồi.'],
  grew: ['Look, I grew bigger! Feed me again tomorrow.', 'Nhìn nè, mình lớn hơn rồi! Mai cho mình ăn nữa nhé.'],
  trick: ['Watch my loop-the-loop!', 'Xem mình bay vòng tròn nè!'],
  full: ['I am full today. See you tomorrow!', 'Hôm nay mình no rồi. Mai gặp lại nhé!'],
  bought: ['A new hat! Thank you, it is perfect.', 'Mũ mới! Cảm ơn bạn, đẹp quá.'],
  saving: ['Keep collecting coins for my new hat!', 'Cứ gom thêm tiền để mua mũ mới cho mình nhé!'],
  goal: ['Save coins for a hat for your companion. Choose Buy when you are ready.', 'Để dành tiền mua mũ cho bạn đồng hành. Chọn Mua khi con đã sẵn sàng.'],
  gift: ['A surprise gift! Come back tomorrow for another one.', 'Một món quà bất ngờ! Mai quay lại có quà khác nữa nhé.'],
  giftHint: ['There is a surprise gift in the valley today. Can you find it?', 'Hôm nay có một món quà bất ngờ trong thung lũng. Con tìm được không?']
};
const day = () => Math.floor((Date.now() + 10 * 3600e3) / 864e5); // (a day in AEST)

// a small hat that sits on the companion's head
export function buildHat(id) {
  const g = new THREE.Group(); g.position.set(0, .2, .1);
  const parts = id === 'party' ? [P(new THREE.ConeGeometry(.07, .17, 12), '#ff5a7a', [0, .08, 0]), P(new THREE.SphereGeometry(.03, 8, 6), '#ffd23f', [0, .18, 0]), P(new THREE.TorusGeometry(.065, .012, 6, 14), '#ffffff', [0, .02, 0], [Math.PI / 2, 0, 0])]
    : id === 'flower' ? [P(new THREE.TorusGeometry(.08, .018, 6, 16), '#5fa860', [0, 0, 0], [Math.PI / 2, 0, 0]), ...[0, 1, 2, 3, 4, 5].map(k => P(new THREE.SphereGeometry(.03, 8, 6), ['#ff7eb8', '#ffd23f', '#ffffff'][k % 3], [Math.cos(k * 1.05) * .08, .015, Math.sin(k * 1.05) * .08]))]
    : id === 'nonla' ? [P(new THREE.ConeGeometry(.16, .08, 18), '#e8d49a', [0, .03, 0]), P(new THREE.TorusGeometry(.09, .006, 4, 16), '#c8a85a', [0, .005, 0], [Math.PI / 2, 0, 0])]
    : [P(new THREE.CylinderGeometry(.08, .08, .05, 14, 1, true), '#f2c230', [0, .02, 0]), ...[0, 1, 2, 3, 4].map(k => P(new THREE.ConeGeometry(.018, .06, 6), '#f2c230', [Math.cos(k * 1.26) * .075, .07, Math.sin(k * 1.26) * .075])), P(new THREE.SphereGeometry(.018, 8, 6), '#ff5a7a', [0, .04, .08])];
  const m = new THREE.Mesh(merge(parts), toonVC()); g.add(m);
  return g;
}

export function createKidPlay(G, { say, save }) {
  const { scene, world } = G;
  // (batch rollout) the companion growing and the coin goal are kept for a child who already fed it or bought a hat
  const keep = id => G.keep ? G.keep(id) : featureOn(id, true);
  const grow = () => keep('companionGrow'), goal = () => keep('saveGoal'), gifts = () => featureOn('dailySurprise', true);
  const pet = p => { const L = p.lanterns = p.lanterns || {}; const s = L.pet = L.pet || {}; s.feeds = s.feeds || 0; s.hats = s.hats || []; return s; };
  const hasPet = h => !!(h.profile.lanterns && h.profile.lanterns.companion);
  const level = h => grow() && hasPet(h) ? 1 + Math.min(4, Math.floor(pet(h.profile).feeds / 2)) : 1;
  G.petLevel = level; G.buildHat = buildHat;
  const comps = () => G.lanterns && G.lanterns.companions;

  // ---------- feed, and tricks ----------
  function feed(h) {
    const s = pet(h.profile), C = comps();
    if (s.fed === day()) { if (level(h) >= 3) { C && C.trick(h, 'loop'); say(...KID_LINES.trick); } else say(...KID_LINES.full); return; }
    const before = level(h); s.fed = day(); s.feeds++; G.tried && G.tried(h, 'companionGrow'); save();
    C && C.trick(h, 'spin');
    if (level(h) > before) say(...KID_LINES.grew); else say(...KID_LINES.fed);
  }
  // ---------- the coin goal ----------
  const nextHat = h => HATS.find(x => !pet(h.profile).hats.includes(x.id));
  function buy(h, expectedHat) {
    const x = nextHat(h); if (!x || (expectedHat && x.id !== expectedHat)) return;
    if (farm.coins < x.price) { say(...KID_LINES.saving); return; }
    G.addCoins && G.addCoins(-x.price); const s = pet(h.profile); s.hats.push(x.id); s.hat = x.id; G.tried && G.tried(h, 'saveGoal'); save();
    comps() && comps().trick(h, 'spin'); say(...KID_LINES.bought);
  }
  let goalOpening = false;
  async function explainGoal(h) {
    if (goalOpening) return;
    const x = nextHat(h); if (!x || !G.dialog) return;
    goalOpening = true;
    try {
      const can = farm.coins >= x.price;
      const k = await G.dialog(T('Coin goal', 'Mục tiêu để dành'), [[
        `${KID_LINES.goal[0]} ${x.en}: ${x.price} coins. Saved: ${farm.coins}.`,
        `${KID_LINES.goal[1]} ${x.vi}: ${x.price} đồng. Đã để dành: ${farm.coins}.`,
        ...KID_LINES.goal
      ]], can ? [[`Buy · ${x.price} coins`, `Mua · ${x.price} đồng`], ['Cancel', 'Hủy']] : [['Cancel', 'Hủy']]);
      if (can && k === 0) buy(h, x.id); // recheck both the current hat and balance after the explanation
    } finally { goalOpening = false; }
  }
  // the two buttons beside the coins, in each child's own bar
  const chips = new Map();
  function chipsFor(h) {
    const hud = G.huds && G.huds[h.i]; if (!hud || !hud.root) return null;
    let c = chips.get(hud); if (c && c.feed.isConnected) return c;
    // (their own row under the name card: phones hide the coin row, and little ones need these most)
    const tl = hud.root.querySelector('.hud-tl'); if (!tl) return null;
    const row = document.createElement('div'); row.className = 'kidrow'; tl.appendChild(row);
    const feedB = document.createElement('button'); feedB.className = 'chip c-pet'; feedB.onclick = e => { e.stopPropagation(); feed(h); };
    const goalB = document.createElement('button'); goalB.className = 'chip c-goal'; goalB.onclick = e => { e.stopPropagation(); void explainGoal(h); };
    row.append(feedB, goalB); c = { feed: feedB, goal: goalB, key: '' }; chips.set(hud, c); return c;
  }
  function refresh() {
    for (const h of G.heroes) {
      const c = chipsFor(h); if (!c) continue;
      const s = hasPet(h) ? pet(h.profile) : null, x = s && nextHat(h);
      const showFeed = grow() && !!s, fedToday = s && s.fed === day(), showGoal = goal() && !!x, can = x && farm.coins >= x.price;
      const key = [showFeed, fedToday, level(h), showGoal, x && x.id, can, farm.coins, G.huds[h.i] && G.huds[h.i].root.className].join('|'); if (key === c.key) continue; c.key = key;
      // (owner, 30 Oct 2026 AEDT: "small chip should show") a phone's top row has no room beside the mini-map, so there the
      // goal is a small chip (picture and count) under the clock, shown while saving too; it pulses when the hat can be bought
      const narrow = G.huds[h.i] && G.huds[h.i].root.classList.contains('small');
      const home = narrow ? G.huds[h.i].root.querySelector('.hud-tr .zoom') : null;
      if (home && c.goal.previousElementSibling !== home) home.after(c.goal); else if (!home && c.goal.parentElement !== c.feed.parentElement) c.feed.after(c.goal);
      c.feed.hidden = !showFeed; c.goal.hidden = !showGoal;
      if (showFeed) { c.feed.innerHTML = fedToday ? (level(h) >= 3 ? pic('✨') + `<small>${T('Trick', 'Biểu diễn')}</small>` : pic('😊') + `<small>${T('Full', 'No rồi')}</small>`) : pic('🍓') + `<small>${T('Feed', 'Cho ăn')}</small>`;
        c.feed.setAttribute('aria-label', fedToday ? T('Do a trick', 'Biểu diễn') : T('Feed your friend', 'Cho bạn ăn')); c.feed.classList.toggle('ready', !fedToday); }
      if (showGoal) { c.goal.innerHTML = pic('🎯') + `<small>${narrow ? '' : T(x.en, x.vi) + ' '}${Math.min(farm.coins, x.price)}/${x.price}</small>`; c.goal.classList.toggle('ready', !!can); c.goal.setAttribute('aria-label', T('About your companion hat goal', 'Về mục tiêu mũ cho bạn đồng hành')); }
    }
  }

  // ---------- the daily gift ----------
  const sites = LANDMARKS.filter(l => Number.isFinite(l.x) && Number.isFinite(l.z));
  // (Full run 37, 16 Oct: the day's landmark left the gift with no open ground to stand on) the gift stands where a
  // child can walk up to it: dry ground that nothing pushes them out of and that is not inside a building. It is chosen
  // again once the solid map is ready, and the check tries every day's landmark (G.giftSpotFor)
  const open = (x, z) => { if (!(heightAt(x, z) > WATER + .3) || world.solidAt?.(x, z)) return false; const q = { x, z, y: heightAt(x, z) }; world.collide?.(q, .45); return Math.hypot(q.x - x, q.z - z) < .01; };
  const giftAt = (d = day()) => { const L = sites[d % sites.length]; if (!L) return null;
    for (const r of [2.6, 3.4, 4.4, 5.6]) for (let k = 0; k < 16; k++) { const a = k / 16 * Math.PI * 2, x = L.x + Math.cos(a) * r, z = L.z + Math.sin(a) * r; if (open(x, z)) return { x, z, L }; }
    return { x: L.x + 2.6, z: L.z, L }; };
  G.giftSpotFor = giftAt;
  let spot = giftAt(), spotDay = day(), spotSolid = !!world.solidAt;
  const box = new THREE.Group(); box.userData.noSolid = true;
  box.add(new THREE.Mesh(merge([P(new THREE.BoxGeometry(.8, .6, .8), '#ff5a7a', [0, .3, 0]), P(new THREE.BoxGeometry(.86, .14, .86), '#e8433a', [0, .62, 0]), P(new THREE.BoxGeometry(.16, .64, .84), '#ffd23f', [0, .32, 0]), P(new THREE.BoxGeometry(.84, .64, .16), '#ffd23f', [0, .32, 0]),
    P(new THREE.TorusGeometry(.14, .05, 6, 12), '#ffd23f', [-.12, .76, 0], [0, 0, .6]), P(new THREE.TorusGeometry(.14, .05, 6, 12), '#ffd23f', [.12, .76, 0], [0, 0, -.6])]), toonVC()));
  scene.add(box); box.visible = false;
  const opened = h => h.profile.gift === day();
  G.interactables.push({ id: 'gift_today', get x() { return spot ? spot.x : 0; }, get z() { return spot ? spot.z : -1e4; }, r: 2.4, icon: '🎁', label: () => T('Open the surprise gift', 'Mở quà bất ngờ'),
    visible: h => gifts() && !!spot && !opened(h),
    act: h => { h.profile.gift = day(); save(); G.addCoins && G.addCoins(15); G.fx && G.fx(spot.x, heightAt(spot.x, spot.z) + 1, spot.z, '🎁'); say(...KID_LINES.gift);
      const hud = G.huds && G.huds[h.i]; hud && hud.toast && hud.toast(T('+15 coins! A new gift tomorrow.', '+15 đồng! Mai có quà mới.')); } });
  const told = new Set();
  let acc = 0;
  world.updaters.push((dt, t) => {
    if (spotDay !== day() || (!spotSolid && world.solidAt)) { spotDay = day(); spotSolid = !!world.solidAt; spot = giftAt(); }
    box.visible = gifts() && !!spot && G.heroes.some(h => !opened(h));
    if (box.visible) { box.position.set(spot.x, heightAt(spot.x, spot.z) + Math.abs(Math.sin(t * 2)) * .15, spot.z); box.rotation.y = t * .6; }
    acc += dt; if (acc < .5) return; acc = 0;
    // once a day per child: tell them a gift is waiting, and where
    if (gifts() && spot) for (const h of G.heroes) { const k = h.profile.id + ':' + day(); if (told.has(k) || opened(h) || G.paused) continue; told.add(k);
      const hud = G.huds && G.huds[h.i]; explainBrief(hud, 'gift', [`A surprise gift is near ${spot.L.name()} today!`, `Hôm nay có quà gần ${spot.L.name()}!`], KID_LINES.giftHint); }
  });
  // the buttons follow the coins and the switches even while a window is open and the valley is paused
  setInterval(refresh, 500);
  return { feed, buy, level, nextHat, giftSpot: () => spot, HATS, refresh };
}
