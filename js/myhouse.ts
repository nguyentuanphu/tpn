// Decorate your house (round E): the farmhouse at Sunny Farm is the child's own house. Its door leads into a room
// (js/homes.js "mine") with 8 spots; tapping a spot opens a chooser: decorations bought with the farm's coins (prices
// stay, owner round D), free ones, and the family postcards the child has (js/familycards.js) in a frame. Each child
// keeps their own house (profile.homeDeco: { spot: key }); in split screen the room shows the first visitor's.
// A change says "HomeDecorated" on the event bus.
import { homeDecoration } from './home-decor-models.js';
import { THREE, sprite } from './gfx.js';
import { T } from './i18n.js';
import { say } from './voice.js';
import { SFX } from './audio.js';
import { farm, saveFarm, saveProfiles } from './state.js';
import { HOME } from './world.js';
import { fmt } from './money.js';
import { customAlbum } from './custom.js';
import { familyCards } from './familycards.js';
import { events } from './core/events.js';
import { id as makeId } from './core/ids.js';
import { pic } from './art.js';
import { el, esc } from './util.js';
import { modal } from './ui.js';
import { FESTCAL } from './content/festcal.js';

// what can go in a spot: key → { icon, price (in coins, shown in the game's money: 5 coins = 50c), en, vi, wall (hangs on a wall) }
type Decoration = { icon: string; price: number; en: string; vi: string; wall?: boolean; keepsake?: boolean };
type DecorationOption = { key: string; icon?: string; photo?: string; name: string; price: number };
export const DECOR: Record<string, Decoration> = {
  teddy: { icon: '🧸', price: 0, en: 'Teddy bear', vi: 'Gấu bông' },
  balloons: { icon: '🎈', price: 3, en: 'Balloons', vi: 'Bóng bay' },
  sunflower: { icon: '🌻', price: 4, en: 'Sunflowers', vi: 'Hoa hướng dương' },
  lotus: { icon: '🪷', price: 5, en: 'Lotus flowers', vi: 'Hoa sen' },
  lamp: { icon: '💡', price: 6, en: 'Lamp', vi: 'Đèn' },
  kite: { icon: '🪁', price: 8, en: 'Kite', vi: 'Con diều' },
  vase: { icon: '🏺', price: 10, en: 'Vase', vi: 'Bình gốm' },
  clock: { icon: '🕰️', price: 12, en: 'Clock', vi: 'Đồng hồ' },
  rainbow: { icon: '🌈', price: 5, en: 'Rainbow picture', vi: 'Tranh cầu vồng', wall: true },
  painting: { icon: '🖼️', price: 8, en: 'Painting', vi: 'Bức tranh', wall: true },
  lantern: { icon: '🏮', price: 8, en: 'Lantern', vi: 'Đèn lồng', wall: true },
  star: { icon: '⭐', price: 0, en: 'Gold star', vi: 'Ngôi sao vàng', wall: true },
  // keepsakes (round R): won, never bought; they show in the chooser only once the child has one (profile.keepsakes)
  pumpkin: { icon: '🎃', price: 0, en: 'Pumpkin lantern (Halloween)', vi: 'Đèn bí ngô (Halloween)', keepsake: true },
  lantern_ch1: { icon: '🏮', price: 0, en: 'The lantern of Lotus Village (story)', vi: 'Đèn lồng Làng Sen (truyện)', keepsake: true },
  lantern_ch2: { icon: '⭐', price: 0, en: 'The star lantern of Hà Nội (story)', vi: 'Đèn ông sao Hà Nội (truyện)', keepsake: true },
  lantern_ch3: { icon: '🎭', price: 0, en: 'The Opera House night-light of Sydney (story)', vi: 'Đèn ngủ Nhà hát Opera Sydney (truyện)', keepsake: true }
};
// (owner, 13 Oct) each festival's keepsake, won by finding all five things of its festival hunt (js/festhunt.js)
for (const F of FESTCAL) DECOR['fh_' + F.id] = { icon: F.icon, price: 0, en: F.en + ' (festival hunt)', vi: F.vi + ' (truy tìm lễ hội)', keepsake: true };
// the spots in the room (room coordinates; the door is at +z): the first 8 (4 on the floor, 4 on the walls) from the
// start; (owner, 30 Oct 2026 AEDT: "is the house upgradable?") each house level opens 4 more (LEVELS below)
export const SPOTS = [
  { x: -2.6, z: -3.6, y: .7 }, { x: 1.4, z: -3.8, y: .7 }, { x: -5.6, z: 1.6, y: .7 }, { x: 5.4, z: 1.4, y: .7 },
  { x: -2.2, z: -5.2, y: 1.7, wall: 1 }, { x: 2.2, z: -5.2, y: 1.7, wall: 1 }, { x: -6.75, z: 0, y: 1.7, wall: 1 }, { x: 6.75, z: 0, y: 1.7, wall: 1 }, // (between the windows)
  { x: -3.4, z: -1, y: .7 }, { x: 3.4, z: -1.2, y: .7 }, { x: -6.75, z: -3.9, y: 1.7, wall: 1 }, { x: 6.75, z: -3.9, y: 1.7, wall: 1 },
  { x: -4.4, z: 3.8, y: .7 }, { x: 4.4, z: 3.8, y: .7 }, { x: -6.75, z: 3.9, y: 1.7, wall: 1 }, { x: 6.75, z: 3.9, y: 1.7, wall: 1 }
];
// (owner, 30 Oct 2026 AEDT) house levels, bought with the farm's coins at the hammer sign inside the door: each opens 4 more
// spots and makes the room a little grander (level 2: bunting over the back wall; level 3: fairy lights and a golden trim)
export const LEVELS = [
  { spots: 8, price: 0 },
  { spots: 12, price: 30, en: '4 more places to decorate and bunting over the wall', vi: 'Thêm 4 chỗ trang trí và dây cờ trên tường' },
  { spots: 16, price: 60, en: '4 more places, fairy lights and a golden trim', vi: 'Thêm 4 chỗ, đèn nháy và viền vàng' }
];
export const houseLevel = p => Math.max(1, Math.min(LEVELS.length, Math.floor(+p.houseLevel || 1)));
const deco = p => (p.homeDeco = p.homeDeco && typeof p.homeDeco === 'object' ? p.homeDeco : {});
// a family postcard as a decoration: 'card:<id>'
const cardOf = key => key && key.startsWith('card:') ? customAlbum().find(c => c.id === key.slice(5)) : null;
const known = key => !!(DECOR[key] || cardOf(key));

// (Round U, owner 11 Oct: "how does a child know how to upgrade their house and decorations? There should be a guide")
// shown the first time a child walks into their own house, and again from the ❓ sign by the door
export const HOUSE_GUIDE = [
  ['🏠', 'This is your very own house! Every ✨ sparkle is a spot you can decorate.', 'Đây là nhà riêng của con! Mỗi chỗ ✨ lấp lánh là một chỗ con có thể trang trí.'],
  ['🪙', 'Decorations cost coins. Earn coins by playing games, helping people and doing family missions.', 'Đồ trang trí cần có đồng xu. Con kiếm xu bằng cách chơi trò chơi, giúp đỡ mọi người và làm nhiệm vụ gia đình.'],
  ['🖼️', 'Family photos you collect can hang on the walls, for free.', 'Những tấm ảnh gia đình con sưu tầm được có thể treo lên tường, miễn phí.'],
  ['🎨', 'Tap a decoration again to change it, move it to another spot or take it away.', 'Chạm lại vào món đồ để đổi, chuyển sang chỗ khác hoặc cất đi.'],
  ['🏆', 'Your stickers and keepsakes show on the board by the back wall all by themselves.', 'Nhãn dán và kỷ vật của con tự hiện lên bảng ở bức tường phía sau.'],
  ['🔨', 'Save coins and tap the hammer by the door to make your house bigger and grander!', 'Để dành xu rồi chạm vào cái búa cạnh cửa để nhà con rộng và đẹp hơn nhé!']
];
export function createMyHouse(G) {
  const guide = async h => { G.paused = true; await G.dialog(T('My house', 'Nhà của con'), HOUSE_GUIDE.map(([, en, vi]) => [en.replace(/✨ /g, ''), vi.replace(/✨ /g, '')])); G.paused = false; if (h && h.profile) { h.profile.houseGuideSeen = true; if (G.tried) G.tried(h, 'houseGuide'); saveProfiles(); } };
  const guideOn = () => !G.keep || G.keep('houseGuide');   // (batch rollout) Studio switch 'houseGuide'
  const door = { x: HOME.x, z: HOME.z + 14 - 3.55 - 1.3 };
  const home = { extra: undefined as ((group: THREE.Group, context: any) => void) | undefined, id: 'myhouse', mine: true, kind: 'mine', room: 'mine', H: null, people: [], door, hs: { x: HOME.x, z: HOME.z + 14, rot: Math.PI, d: 7 },
    name: () => T('My house', 'Nhà của con'), where: () => T('Sunny Farm', 'Nông Trại Nắng Mai'), owner: null };
  // what the room shows: the visitor's own decorations
  // a decoration being moved (owner, 30 Oct 2026 AEDT: "decorations can be moved"): which spot it comes from
  let moving: { k: number; key: string } | null = null;
  // a picture flat on the wall: the game's own drawing on a plane (a sprite always turns to the camera)
  const flatPic = (icon, size) => new THREE.Mesh(new THREE.PlaneGeometry(size, size), new THREE.MeshBasicMaterial({ map: sprite(icon, size).material.map, transparent: true }));
  // what the room shows: the visitor's own decorations
  home.extra = (g, { RX, RY, RZ, add }) => {
    const p = home.owner ? home.owner.profile : G.heroes[0].profile, d = deco(p), lv = houseLevel(p), count = LEVELS[lv - 1].spots;
    SPOTS.slice(0, count).forEach((s, k) => {
      const key = d[k], c = cardOf(key), it = DECOR[key];
      if (c) { // a family photo in a frame on the wall
        const frame = new THREE.Mesh(new THREE.BoxGeometry(1.1, .85, .06), new THREE.MeshStandardMaterial({ color: '#8a5a3b' })), ph = new THREE.Mesh(new THREE.PlaneGeometry(.95, .7), new THREE.MeshBasicMaterial({ color: '#ffffff' }));
        frame.userData.roomShape = true; ph.userData.roomShape = true;
        new THREE.TextureLoader().load(c.photo, tx => { tx.colorSpace = THREE.SRGBColorSpace; ph.material.map = tx; ph.material.needsUpdate = true; });
        const grp = new THREE.Group(); grp.add(frame); ph.position.z = .035; grp.add(ph); grp.position.set(s.x, s.y + .1, s.z); grp.rotation.y = Math.abs(s.x) > 6.5 ? -Math.sign(s.x) * Math.PI / 2 : 0; g.add(grp);
      } else if (it) { const model = homeDecoration(key, it.icon, !!s.wall); model.position.set(s.x, s.wall ? s.y : .12, s.z); model.rotation.y = Math.abs(s.x) > 6.5 ? -Math.sign(s.x) * Math.PI / 2 : 0; g.add(model); }
      else { const sp = sprite('✨', .55); sp.position.set(s.x, s.y, s.z); g.add(sp); }
      if (k === 0 && guideOn()) { const q = sprite('❓', .7); q.position.set(-5, 1.3, 5); g.add(q); }
      if (k === 0 && guideOn()) add({ id: 'house_help', x: RX - 5, z: RZ + 5, y: RY, r: 1.3, icon: '❓', bubble: '❓', label: () => T('How do I decorate?', 'Trang trí thế nào?'), act: h => guide(h) });   // (Round U) the guide again
      add({ id: 'deco_' + k, x: RX + s.x * (s.wall ? .86 : 1), z: RZ + s.z * (s.wall ? .86 : 1) + (s.wall ? 0 : .9), y: RY, r: 1.3, icon: key ? '🎨' : '✨', bubble: '🎨',
        label: () => moving ? T('Put it here', 'Đặt vào đây') : key ? T('Change this', 'Đổi món này') : T('Decorate here', 'Trang trí chỗ này'), act: h => moving ? moveTo(h, k) : choose(h, k) });
    });
    // (owner, 30 Oct 2026 AEDT: "they can also add their achievement badges to their house") the trophy board on the back
    // wall, between the two pictures: the child's keepsakes and newest stickers show on it by themselves
    { const board = new THREE.Group(), wood = new THREE.Mesh(new THREE.BoxGeometry(2.3, 1.5, .06), new THREE.MeshStandardMaterial({ color: '#8a5a3b' })), felt = new THREE.Mesh(new THREE.PlaneGeometry(2.1, 1.3), new THREE.MeshStandardMaterial({ color: '#2f7a5a' }));
      wood.userData.roomShape = felt.userData.roomShape = true; felt.position.z = .035; board.add(wood, felt);
      const won = trophies(p).slice(0, 8);
      won.forEach((t, i) => { const m = flatPic(t.icon, .42); m.position.set(-.75 + (i % 4) * .5, .3 - Math.floor(i / 4) * .55, .04); m.userData.roomShape = true; board.add(m); });
      if (!won.length) { const m = flatPic('🏆', .6); m.position.z = .04; m.material.opacity = .45; m.userData.roomShape = true; board.add(m); }
      board.position.set(0, 2.05, -5.22); g.add(board);
      add({ id: 'house_trophies', x: RX, z: RZ - 4.4, y: RY, r: 1.3, icon: '🏆', bubble: '🏆', label: () => T('My trophy board', 'Bảng thành tích của con'), act: h => showTrophies(h) }); }
    // the house level: bunting from level 2, fairy lights and a golden trim at level 3, and the hammer sign by the door
    if (lv >= 2) for (let i = 0; i < 13; i++) { const f = new THREE.Mesh(new THREE.ConeGeometry(.18, .38, 3), new THREE.MeshStandardMaterial({ color: ['#ff7eb8', '#ffd23f', '#5fd3a0', '#7ab8ff'][i % 4] })); f.rotation.x = Math.PI; f.position.set(-6 + i, 2.85 - Math.sin(i / 12 * Math.PI) * .25, -5.2); f.userData.roomShape = true; g.add(f); }
    if (lv >= 3) { for (let i = 0; i < 26; i++) { const b = new THREE.Mesh(new THREE.SphereGeometry(.06, 6, 4), new THREE.MeshBasicMaterial({ color: ['#fff3a0', '#ffd0e8', '#c8f0ff'][i % 3] })); b.position.set(-6.5 + i * .52, 3.15, -5.18); g.add(b); }
      const trim = new THREE.Mesh(new THREE.BoxGeometry(13.6, .12, .08), new THREE.MeshStandardMaterial({ color: '#e8b84a' })); trim.position.set(0, .45, -5.22); trim.userData.roomShape = true; g.add(trim); }
    { const sign = sprite('🔨', .7); sign.position.set(5, 1.3, 5); g.add(sign);
      add({ id: 'house_upgrade', x: RX + 5, z: RZ + 5, y: RY, r: 1.3, icon: '🔨', bubble: '🔨', label: () => lv >= LEVELS.length ? T('My house is the grandest!', 'Nhà con đẹp nhất rồi!') : T('Make my house grander', 'Nâng cấp nhà'), act: h => upgrade(h) }); }
  };
  // what the child has won: keepsakes first, then the newest stickers (the sticker book's own pictures)
  const trophies = p => [...(Array.isArray(p.keepsakes) ? p.keepsakes : []).filter(k => DECOR[k]).map(k => ({ icon: DECOR[k].icon, name: T(DECOR[k].en, DECOR[k].vi) })),
    ...(Array.isArray(p.stickers) ? p.stickers.slice().reverse() : []).filter(st => typeof st === 'string' && st).map(st => ({ icon: st, name: T('Sticker', 'Nhãn dán') }))];
  function showTrophies(h) {
    const p = h.profile, won = trophies(p); G.paused = true; SFX.tap();
    const m = modal('decor', `<button class="x" aria-label="${T('Close', 'Đóng')}">✕</button><h2>${pic('🏆')} ${T('My trophy board', 'Bảng thành tích của con')}</h2>
      <p class="note center">${T(`${(p.stickers || []).length} stickers · ${(p.keepsakes || []).length} keepsakes · ${(p.stats && p.stats.games) || 0} games played`, `${(p.stickers || []).length} nhãn dán · ${(p.keepsakes || []).length} kỷ vật · đã chơi ${(p.stats && p.stats.games) || 0} trò`)}</p>
      <div class="decor-list">${won.slice(0, 24).map(t => `<div class="decor-it on"><span>${pic(t.icon)}</span><b>${esc(t.name)}</b></div>`).join('') || `<p class="note center">${T('Win games and finish festival hunts: your stickers and keepsakes will show here.', 'Chơi thắng các trò và hoàn thành truy tìm lễ hội: nhãn dán và kỷ vật của con sẽ hiện ở đây.')}</p>`}</div>`);
    m.querySelector('.x').onclick = () => { SFX.tap(); m.close(); G.paused = false; };
  }
  // (owner, 30 Oct 2026 AEDT: "is the house upgradable, are there instructions?") the hammer sign says what the next level
  // brings and what it costs, and builds it when there are enough coins
  function upgrade(h) {
    const p = h.profile, lv = houseLevel(p), next = LEVELS[lv]; G.paused = true; SFX.tap();
    const m = modal('decor', `<button class="x" aria-label="${T('Close', 'Đóng')}">✕</button><h2>${pic('🔨')} ${T('Make my house grander', 'Nâng cấp nhà')}</h2>
      <p class="note center">${T(`My house: level ${lv} of ${LEVELS.length}`, `Nhà của con: cấp ${lv} trên ${LEVELS.length}`)} · ${pic('💰')} ${fmt(farm.coins)}</p>
      ${next ? `<p class="center">${T(`Level ${lv + 1}: ${next.en}`, `Cấp ${lv + 1}: ${next.vi}`)}</p><p class="center"><b>${T('Costs', 'Giá')} ${fmt(next.price)}</b></p>
      <button class="btn wide" data-up ${farm.coins < next.price ? 'disabled' : ''}>${pic('🔨')} ${farm.coins < next.price ? T(`Save ${fmt(next.price - farm.coins)} more`, `Cần thêm ${fmt(next.price - farm.coins)}`) : T('Build it!', 'Xây ngay!')}</button>`
        : `<p class="center">${T('Your house is as grand as it gets!', 'Nhà con đã đẹp nhất rồi!')}</p>`}`);
    const done = () => { m.close(); G.paused = false; };
    m.querySelector('.x').onclick = () => { SFX.tap(); done(); };
    const up = m.querySelector('[data-up]');
    if (up) up.onclick = () => { if (!next || farm.coins < next.price) return; farm.coins -= next.price; saveFarm(); p.houseLevel = lv + 1; saveProfiles(); SFX.coin && SFX.coin(); done(); G.homes.rebuild();
      say('Your house is grander now! There are new places to decorate.', 'Nhà con đẹp hơn rồi! Có thêm chỗ mới để trang trí đó.');
      events.emit('HouseUpgraded', { playerId: makeId('player', p.id || 'guest'), level: lv + 1, price: next.price }); };
    if (!next || farm.coins < next.price) say('Save coins by playing games, then come back to make your house grander.', 'Con để dành xu bằng cách chơi trò chơi, rồi quay lại nâng cấp nhà nhé.');
  }
  // moving a decoration: the chooser's Move button picks it up; tapping another spot of the same kind puts it there
  // (swapping with what was there)
  function moveTo(h, k) {
    const p = h.profile, d = deco(p), from = moving; moving = null; if (!from) return;
    if (k === from.k) { SFX.tap(); G.homes.rebuild(); return; }
    const wall = key => !!(cardOf(key) || (DECOR[key] && DECOR[key].wall));
    if (!!SPOTS[k].wall !== wall(from.key)) { SFX.no(); say(SPOTS[k].wall ? 'That one goes on the floor.' : 'That one hangs on a wall.', SPOTS[k].wall ? 'Món này đặt dưới sàn cơ.' : 'Món này treo trên tường cơ.'); moving = from; return; }
    const there = d[k]; d[k] = from.key; if (there) d[from.k] = there; else delete d[from.k]; saveProfiles(); SFX.tap(); G.homes.rebuild();
    say('There! It looks lovely there.', 'Xong rồi! Đặt ở đây đẹp quá.');
    events.emit('HomeDecorated', { playerId: makeId('player', p.id || 'guest'), spot: k, item: from.key.startsWith('card:') ? makeId('postcard', 'family', from.key.slice(5)) : makeId('decor', from.key), price: 0 });
  }
  G.interactables.push({ id: 'myhouse_door', x: door.x, z: door.z, r: 1.6, icon: '🏠', label: () => T('My house', 'Nhà của con'), act: h => {
    if (G.homes.inside() && G.homes.inside() !== home) return G.homes.enter(h, home);
    if (!G.homes.inside()) home.owner = h; G.homes.enter(h, home);
    // (Round U) the first time: the house guide; afterwards the short welcome
    setTimeout(() => { if (!h.profile.houseGuideSeen && guideOn()) guide(h); else say('Your own house! Tap a sparkle to decorate it.', 'Nhà của con đây! Chạm vào chỗ lấp lánh để trang trí nhé.'); }, 900);
  } });

  // the chooser for one spot
  function choose(h, k) {
    const p = h.profile, d = deco(p), s = SPOTS[k], cards = customAlbum().filter(c => familyCards(p)[c.id]);
    G.paused = true; SFX.tap();
    const opts = Object.entries(DECOR).filter(([key, v]) => !!v.wall === !!s.wall && (!v.keepsake || (Array.isArray(p.keepsakes) && p.keepsakes.includes(key)))).map<DecorationOption>(([key, v]) => ({ key, icon: v.icon, name: T(v.en, v.vi), price: v.price }))
      .concat(s.wall ? cards.map(c => ({ key: 'card:' + c.id, photo: c.photo, name: T(c.en, c.vi) || T('Family photo', 'Ảnh gia đình'), price: 0 })) : []);
    const m = modal('decor', `<button class="x" aria-label="${T('Close', 'Đóng')}">✕</button><h2>${pic('🎨')} ${s.wall ? T('Something for the wall', 'Treo gì lên tường') : T('Something for the floor', 'Đặt gì trên sàn')}</h2>
      <p class="note center">${pic('💰')} ${fmt(farm.coins)}</p>
      <div class="decor-list">${opts.map(o => `<button class="decor-it ${d[k] === o.key ? 'on' : ''} ${o.price > farm.coins && d[k] !== o.key ? 'dear' : ''}" data-k="${esc(o.key)}">${o.photo ? `<img src="${esc(o.photo)}" alt="">` : `<span>${pic(o.icon)}</span>`}<b>${esc(o.name)}</b><small>${o.price ? fmt(o.price) : T('Free', 'Miễn phí')}</small></button>`).join('')}</div>
      ${d[k] ? `<button class="btn wide" data-move>${pic('🔀')} ${T('Move it to another spot', 'Chuyển sang chỗ khác')}</button><button class="btn wide" data-clear>${pic('🧹')} ${T('Take it away', 'Cất đi')}</button>` : ''}`);
    const card = m.querySelector('.card');
    const done = () => { m.close(); G.paused = false; };
    card.querySelector('.x').onclick = () => { SFX.tap(); done(); };
    card.querySelectorAll('[data-k]').forEach(b => b.onclick = () => {
      const key = b.dataset.k, o = opts.find(x => x.key === key); if (!o || d[k] === key) return done();
      if (o.price > farm.coins) { SFX.no(); say('Not enough coins yet. Play games to earn more!', 'Chưa đủ tiền. Chơi trò chơi để có thêm nhé!'); b.classList.add('wrong'); return; }
      farm.coins -= o.price; saveFarm(); d[k] = key; saveProfiles(); SFX.coin && SFX.coin(); done(); G.homes.rebuild();
      say('So pretty!', 'Đẹp quá!');
      events.emit('HomeDecorated', { playerId: makeId('player', p.id || 'guest'), spot: k, item: key.startsWith('card:') ? makeId('postcard', 'family', key.slice(5)) : makeId('decor', key), price: o.price });
    });
    const mv = card.querySelector('[data-move]'); if (mv) mv.onclick = () => { moving = { k, key: d[k] }; SFX.tap(); done(); G.homes.rebuild(); say('Now tap a sparkle where it should go.', 'Giờ chạm vào chỗ con muốn đặt nó nhé.'); };
    const clr = card.querySelector('[data-clear]'); if (clr) clr.onclick = () => { delete d[k]; saveProfiles(); SFX.tap(); done(); G.homes.rebuild(); events.emit('HomeDecorated', { playerId: makeId('player', p.id || 'guest'), spot: k, item: null, price: 0 }); };
  }
  return { home, choose, deco, known, guide, upgrade, moveTo, showTrophies, trophies };
}
