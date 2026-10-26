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
// the 8 spots in the room (room coordinates; the door is at +z): 4 on the floor, 4 on the walls
export const SPOTS = [
  { x: -2.6, z: -3.6, y: .7 }, { x: 1.4, z: -3.8, y: .7 }, { x: -5.6, z: 1.6, y: .7 }, { x: 5.4, z: 1.4, y: .7 },
  { x: -2.2, z: -5.2, y: 1.7, wall: 1 }, { x: 2.2, z: -5.2, y: 1.7, wall: 1 }, { x: -6.75, z: 0, y: 1.7, wall: 1 }, { x: 6.75, z: 0, y: 1.7, wall: 1 } // (between the windows)
];
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
  ['🎨', 'Tap a decoration again to change it or take it away. Make your house more beautiful step by step!', 'Chạm lại vào món đồ để đổi hoặc cất đi. Làm cho nhà mình đẹp hơn từng chút một nhé!']
];
export function createMyHouse(G) {
  const guide = async h => { G.paused = true; await G.dialog(T('My house', 'Nhà của con'), HOUSE_GUIDE.map(([, en, vi]) => [en.replace(/✨ /g, ''), vi.replace(/✨ /g, '')])); G.paused = false; if (h && h.profile) { h.profile.houseGuideSeen = true; if (G.tried) G.tried(h, 'houseGuide'); saveProfiles(); } };
  const guideOn = () => !G.keep || G.keep('houseGuide');   // (batch rollout) Studio switch 'houseGuide'
  const door = { x: HOME.x, z: HOME.z + 14 - 3.55 - 1.3 };
  const home = { extra: undefined as ((group: THREE.Group, context: any) => void) | undefined, id: 'myhouse', mine: true, kind: 'mine', room: 'mine', H: null, people: [], door, hs: { x: HOME.x, z: HOME.z + 14, rot: Math.PI, d: 7 },
    name: () => T('My house', 'Nhà của con'), where: () => T('Sunny Farm', 'Nông Trại Nắng Mai'), owner: null };
  // what the room shows: the visitor's own decorations
  home.extra = (g, { RX, RY, RZ, add }) => {
    const p = home.owner ? home.owner.profile : G.heroes[0].profile, d = deco(p);
    SPOTS.forEach((s, k) => {
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
        label: () => key ? T('Change this', 'Đổi món này') : T('Decorate here', 'Trang trí chỗ này'), act: h => choose(h, k) });
    });
  };
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
      ${d[k] ? `<button class="btn wide" data-clear>${pic('🧹')} ${T('Take it away', 'Cất đi')}</button>` : ''}`);
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
    const clr = card.querySelector('[data-clear]'); if (clr) clr.onclick = () => { delete d[k]; saveProfiles(); SFX.tap(); done(); G.homes.rebuild(); events.emit('HomeDecorated', { playerId: makeId('player', p.id || 'guest'), spot: k, item: null, price: 0 }); };
  }
  return { home, choose, deco, known, guide };
}
