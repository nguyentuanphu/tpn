// The clothes shop and the wardrobe (round S, owner plan 8 Oct: Round R Part 2 item 6; Studio switch 'shop').
//   the place   a striped stall by Chợ Ba Miền (the Three Regions market), at the end of its market row (T1b: js/content/map.js rowSlot)
//   the bag     the Bag button opens the backpack (owner, 10 Oct, Bug #29: "bag is bag"); inside it is one small shop button
//               that opens the shop right there, with no travel (js/ui.js, drawBag). The stall in the valley stays.
//   the screen  one big card: round ✕, a picture tab for each kind of thing, prices as a coin picture and a number,
//               nothing that needs reading; under-5s get 64 px buttons
//   wardrobe    what the child owns, worn with one tap (the character changes at once behind the sheet)
// Owned things: profile.owned.clothes (js/content/shop.js, which also holds the prices). Game coins only.
import { THREE, P, merge, toonVC } from './gfx.js';
import { T } from './i18n.js';
import { featureOn } from './custom.js';
import { farm, profiles, saveProfiles } from './state.js';
import { heightAt } from './world.js';
import { rowSlot } from './content/map.js';
import { modal } from './popups.js';
import { pic } from './art.js';
import { esc as escName } from './util.js';
import { SFX } from './audio.js';
import { SLOTS, CLOTHES, ITEM, forSlot, priceOf, owns, adoptWorn, buy, wear, setOf, forSet } from './content/shop.js';
import { HAT_ICON, HAT_NAME } from './data.js';

// what is said ([en, vi]; to be recorded: docs/cores/play.md)
export const SHOP_LINES = {
  hello: ['Welcome to the clothes shop! Tap something you like.', 'Chào mừng con đến cửa hàng quần áo! Chạm vào món con thích nhé.'],
  go: ['Off to the clothes shop!', 'Mình đi cửa hàng quần áo nào!'],
  bought: ['Thank you! It is yours now.', 'Cảm ơn con! Giờ nó là của con rồi.'],
  saving: ['Not enough coins yet. Play some games to earn more!', 'Chưa đủ tiền. Chơi thêm trò chơi để có thêm tiền nhé!'],
  wear: ['You look wonderful!', 'Con trông tuyệt quá!'],
  dress: ['Dress up time! Tap the pictures to try things on.', 'Thay đồ nào! Chạm vào hình để thử nhé.'],
  // (r79) clothes of the other collection are gifts
  gift: ['Wrapped as a gift! It is in your Backpack, ready to give to a friend.', 'Đã gói quà! Quà nằm trong Ba lô, sẵn sàng tặng bạn.'],
  forGirl: ['That is made for boys. Choose from the girls\' collection for her.', 'Món này dành cho bé trai. Chọn trong bộ đồ bé gái cho bạn ấy nhé.'],
  forBoy: ['That is made for girls. Choose from the boys\' collection for him.', 'Món này dành cho bé gái. Chọn trong bộ đồ bé trai cho bạn ấy nhé.']
};

// ---------- a picture of each thing, in the colours it really has (the game's own drawing style: js/art.js) ----------
const O = '#3b2a4f', W = `stroke="${O}" stroke-width="2.4" stroke-linejoin="round" stroke-linecap="round"`;
const SH = {
  cap: (c) => `<path d="M8 30a16 14 0 0 1 32 0z" fill="${c}" ${W}/><path d="M24 30h20a4 4 0 0 1-4 5H24z" fill="${c}" ${W}/><circle cx="24" cy="16" r="2" fill="${O}"/>`,
  bow: (c) => `<path d="M24 24L8 14v20zM24 24l16-10v20z" fill="${c}" ${W}/><circle cx="24" cy="24" r="5" fill="${c}" ${W}/>`,
  flower: (c) => [0, 1, 2, 3, 4].map(i => `<circle cx="${24 + Math.cos(i * 1.26) * 9}" cy="${24 + Math.sin(i * 1.26) * 9}" r="7" fill="${c}" ${W}/>`).join('') + `<circle cx="24" cy="24" r="5" fill="#ffd23f" ${W}/>`,
  bunny: (c) => `<path d="M14 40c-4-10-4-30 2-32s6 22 4 32zM34 40c4-10 4-30-2-32s-6 22-4 32z" fill="${c}" ${W}/><path d="M16 34c-1-8-1-18 1-20M32 34c1-8 1-18-1-20" stroke="#ffb3cf" stroke-width="4" stroke-linecap="round"/><path d="M8 40h32" ${W}/>`,
  nonla: (c) => `<path d="M24 8L4 36h40z" fill="${c}" ${W}/><path d="M12 30h24" stroke="#c94a4a" stroke-width="2.6"/><path d="M15 25l9-12 9 12" stroke="#c9a85a" stroke-width="1.6" fill="none"/>`,
  crown: (c) => `<path d="M8 36V14l8 9 8-13 8 13 8-9v22z" fill="${c}" ${W}/><circle cx="24" cy="29" r="3" fill="#e8434a" ${W}/><circle cx="14" cy="30" r="2.2" fill="#3cc7e8"/><circle cx="34" cy="30" r="2.2" fill="#5fd39a"/>`,
  beanie: (c, t) => `<path d="M9 32a15 17 0 0 1 30 0z" fill="${c}" ${W}/><rect x="7" y="30" width="34" height="8" rx="3" fill="${t}" ${W}/><circle cx="24" cy="12" r="5" fill="${t}" ${W}/>`,
  bucket: (c) => `<path d="M14 14h20l3 16H11z" fill="${c}" ${W}/><path d="M4 34c6-5 34-5 40 0-6 4-34 4-40 0z" fill="${c}" ${W}/><path d="M12 27h24" stroke="#3a5a2a" stroke-width="3"/>`,
  dino: (c, t) => `<path d="M8 38a16 18 0 0 1 32 0z" fill="${c}" ${W}/><path d="M14 22l3-8 4 6 3-9 3 9 4-6 3 8" fill="${t}" ${W}/><circle cx="18" cy="31" r="2" fill="${O}"/><circle cx="30" cy="31" r="2" fill="${O}"/>`,
  sunhat: (c, t) => `<ellipse cx="24" cy="32" rx="21" ry="7" fill="${c}" ${W}/><path d="M14 31c0-12 4-17 10-17s10 5 10 17z" fill="${c}" ${W}/><path d="M14 27h20" stroke="${t}" stroke-width="4"/><circle cx="34" cy="27" r="3.5" fill="${t}" ${W}/>`,
  tiara: (c, t) => `<path d="M6 36c6-6 30-6 36 0l-3-14-6 7-9-14-9 14-6-7z" fill="${c}" ${W}/><path d="M24 20l4 5-4 5-4-5z" fill="${t}" ${W}/>`,
  catears: (c, t) => `<path d="M6 38a18 16 0 0 1 36 0" fill="none" ${W}/><path d="M8 30L11 10l12 12zM40 30L37 10 25 22z" fill="${c}" ${W}/><path d="M12 24l1-8 5 5zM36 24l-1-8-5 5z" fill="${t}"/>`,
  beads: (c) => `<path d="M8 10c0 16 8 26 16 26s16-10 16-26" fill="none" stroke="${O}" stroke-width="1.4"/>` + Array.from({ length: 9 }, (_, i) => { const a = Math.PI * (i / 8); return `<circle cx="${24 - Math.cos(a) * 16}" cy="${10 + Math.sin(a) * 26}" r="3.6" fill="${c}" ${W}/>`; }).join(''),
  lei: (c, t) => Array.from({ length: 10 }, (_, i) => { const a = Math.PI * 2 * i / 10; return `<circle cx="${24 + Math.cos(a) * 14}" cy="${24 + Math.sin(a) * 14}" r="6" fill="${i % 2 ? t : c}" ${W}/>`; }).join(''),
  locket: (c, t) => `<path d="M10 6c0 14 6 22 14 22s14-8 14-22" fill="none" stroke="${c}" stroke-width="3"/><path d="M24 44c-8-6-12-10-12-15a6 6 0 0 1 12-2 6 6 0 0 1 12 2c0 5-4 9-12 15z" fill="${t}" ${W}/>`,
  medal: (c, t) => `<path d="M14 4l10 18 10-18" fill="none" stroke="${t}" stroke-width="6"/><circle cx="24" cy="32" r="11" fill="${c}" ${W}/><path d="M24 26l2 4h4l-3 3 1 4-4-2-4 2 1-4-3-3h4z" fill="#fff6b0"/>`,
  scarf: (c, t) => `<path d="M8 14c10 6 22 6 32 0v8c-10 6-22 6-32 0z" fill="${c}" ${W}/><path d="M28 22l2 20h8l-2-22z" fill="${c}" ${W}/><path d="M30 36h7" stroke="${t}" stroke-width="3"/>`,
  tee: (c, t) => `<path d="M16 8l-10 7 4 8 5-3v20h18V20l5 3 4-8-10-7c-1 4-4 6-8 6s-7-2-8-6z" fill="${c}" ${W}/>` + (t ? `<path d="M15 24h18M15 30h18M15 36h18" stroke="${t}" stroke-width="3"/>` : ''),
  hoodie: (c) => `<path d="M16 10l-10 7 3 20 6-1v6h18v-6l6 1 3-20-10-7c-2 3-5 4-8 4s-6-1-8-4z" fill="${c}" ${W}/><path d="M17 10c0-4 3-6 7-6s7 2 7 6c-2 3-5 4-7 4s-5-1-7-4z" fill="${c}" ${W}/><rect x="18" y="28" width="12" height="6" rx="2" fill="${c}" ${W}/>`,
  aodai: (c) => `<path d="M19 6h10l3 4 6 4-3 6-3-2 2 26H14l2-26-3 2-3-6 6-4z" fill="${c}" ${W}/><path d="M24 7v4l4 3" fill="none" ${W}/><circle cx="27" cy="16" r="1.2" fill="#ffd84a"/><circle cx="28" cy="20" r="1.2" fill="#ffd84a"/>`,
  tunic: (c) => `<path d="M16 8l-10 8 4 7 5-3v22h18V20l5 3 4-7-10-8-8 6z" fill="${c}" ${W}/><path d="M24 14v26" stroke="#ffd23f" stroke-width="1.6"/><circle cx="24" cy="20" r="1.4" fill="#ffd23f"/><circle cx="24" cy="27" r="1.4" fill="#ffd23f"/><circle cx="24" cy="34" r="1.4" fill="#ffd23f"/>`,
  overalls: (c) => `<path d="M14 6v18h20V6" fill="none" stroke="${c}" stroke-width="4"/><path d="M14 18h20v8l2 18h-9l-3-12-3 12h-9l2-18z" fill="${c}" ${W}/><rect x="19" y="20" width="10" height="6" rx="1" fill="${c}" ${W}/>`,
  dress: (c, t) => `<path d="M18 6h12l2 12 10 24H6l10-24z" fill="${c}" ${W}/><path d="M16 18h16" stroke="${t || '#fff'}" stroke-width="3"/><path d="M8 38h32" stroke="${t || '#fff'}" stroke-width="2.4"/>`,
  shorts: (c) => `<path d="M10 10h28l3 22H27l-3-12-3 12H7z" fill="${c}" ${W}/><path d="M10 15h28" ${W}/>`,
  pants: (c) => `<path d="M12 6h24l3 36h-10l-5-24-5 24H9z" fill="${c}" ${W}/><path d="M12 11h24" ${W}/>`,
  skirt: (c) => `<path d="M14 10h20l8 24c-12 6-24 6-36 0z" fill="${c}" ${W}/><path d="M14 14h20" ${W}/><path d="M20 16l-4 20M28 16l4 20" stroke="${O}" stroke-width="1.2" opacity=".5"/>`,
  shoe: (c) => `<path d="M6 34c0-8 4-14 12-14 4 6 10 6 14 6 7 0 11 3 11 8z" fill="${c}" ${W}/><path d="M5 34h38v4H5z" fill="#fff8ee" ${W}/><path d="M18 24l4 4M22 22l4 4" stroke="#fff" stroke-width="2"/>`,
  sandal: (c) => `<path d="M5 34c0-4 6-6 19-6s19 2 19 6v3H5z" fill="${c}" ${W}/><path d="M12 30c2-8 10-10 14-2M26 28c4-6 10-4 10 2" fill="none" stroke="${c}" stroke-width="4"/><path d="M12 30c2-8 10-10 14-2" fill="none" ${W}/>`,
  boot: (c) => `<path d="M12 6h14v22c8 0 16 2 16 10v4H10V8z" fill="${c}" ${W}/><path d="M10 38h32" ${W}/><path d="M12 12h14" stroke="#fff" stroke-width="2" opacity=".7"/>`,
  wings: (c) => `<path d="M24 24C14 4 2 8 4 18s12 10 20 6zM24 24C34 4 46 8 44 18s-12 10-20 6z" fill="${c}" ${W}/><path d="M24 24c-8 6-16 16-10 18s10-10 10-18zM24 24c8 6 16 16 10 18s-10-10-10-18z" fill="${c}" opacity=".85" ${W}/>`,
  cape: (c) => `<path d="M14 8h20l8 34H6z" fill="${c}" ${W}/><path d="M14 8c3 4 17 4 20 0" fill="none" ${W}/><circle cx="24" cy="11" r="3" fill="#ffcf3a" ${W}/>`,
  dragonwings: (c) => `<path d="M24 26L4 10l4 12-4 4 8 2-2 8zM24 26L44 10l-4 12 4 4-8 2 2 8z" fill="${c}" ${W}/>`,
  backpack: (c, t) => `<path d="M16 14c0-6 4-8 8-8s8 2 8 8" fill="none" ${W}/><rect x="10" y="12" width="28" height="30" rx="8" fill="${c}" ${W}/><rect x="10" y="12" width="28" height="10" rx="5" fill="${t}" ${W}/><rect x="16" y="28" width="16" height="9" rx="3" fill="${t}" ${W}/>`,
  shell: (c, t) => `<path d="M6 34a18 22 0 0 1 36 0z" fill="${c}" ${W}/><path d="M24 14l6 6-2 8h-8l-2-8zM12 28l6 0M30 28h6" fill="none" stroke="${t}" stroke-width="2.4"/><path d="M4 34h40" ${W}/>`
};
export const itemSVG = it => `<svg class="art kpic" viewBox="0 0 48 48" aria-hidden="true">${(SH[it.shape] || SH.tee)(it.color, it.trim)}</svg>`;
const coins = n => `<span class="kcoin">${pic('🪙')}<b>${n}</b></span>`;

export function createShop(G, { say, save }) {
  const { scene, world } = G;
  const on = () => featureOn('shop', true);

  // ---------- the stall by the market ----------
  // (T1b, owner 11 Oct) at the south end of the market row, its counter to the street (js/content/map.js rowSlot)
  const S = rowSlot('market', 10.1, 2.1), spot = { x: S.x, z: S.z }, face = S.face;
  const parts = [P(new THREE.BoxGeometry(3.4, .95, 1.1), '#c98a4a', [0, .48, .5]), P(new THREE.BoxGeometry(3.6, .1, 1.3), '#f6e7c8', [0, 1, .5]),
    P(new THREE.BoxGeometry(3.4, 2.6, .12), '#f6e7c8', [0, 1.3, -.9])];
  [[-1.65, .95], [1.65, .95], [-1.65, -.9], [1.65, -.9]].forEach(([x, z]) => parts.push(P(new THREE.CylinderGeometry(.06, .06, 2.7, 6), '#8a5a3b', [x, 1.35, z])));
  for (let i = 0; i < 7; i++) parts.push(P(new THREE.BoxGeometry(.52, .08, 2.3), i % 2 ? '#ffffff' : '#ff5fa2', [-1.56 + i * .52, 2.75, 0], [.14, 0, 0]));
  // a rail of little shirts and dresses on the back wall, hats on the counter
  ['#e8434a', '#ffd23f', '#3cc7e8', '#a66bff', '#5fd39a', '#ff9f43'].forEach((c, k) => parts.push(P(new THREE.BoxGeometry(.38, .46, .06), c, [-1.3 + k * .52, 1.7, -.8]), P(new THREE.BoxGeometry(.5, .1, .06), c, [-1.3 + k * .52, 1.88, -.8])));
  parts.push(P(new THREE.CylinderGeometry(.03, .03, 3.2, 6), '#8a5a3b', [0, 2.0, -.78], [0, 0, Math.PI / 2]));
  ([['#ecd9a0', -1.1], ['#e8434a', -.3], ['#ff7eb8', .5], ['#3b6fe0', 1.2]] as [string, number][]).forEach(([c, x], k) => parts.push(k ? P(new THREE.SphereGeometry(.2, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2), c, [x, 1.05, .5]) : P(new THREE.ConeGeometry(.32, .22, 16), c, [x, 1.16, .5])));
  const stall = new THREE.Mesh(merge(parts), toonVC()); stall.castShadow = true; stall.position.set(spot.x, heightAt(spot.x, spot.z), spot.z); stall.rotation.y = face; scene.add(stall);
  world.colliders.push({ x: spot.x, z: spot.z, r: 1.8 }); world.stalls.push({ id: 'shop_clothes', place: 'market', kind: 'stall', x: spot.x, z: spot.z, w: 3.6, d: 2.1, face, tap: 'shop_clothes' });
  const front = { x: spot.x + Math.sin(face) * 1.8, z: spot.z + Math.cos(face) * 1.8 };
  G.interactables.push({ id: 'shop_clothes', x: front.x, z: front.z, r: 3, icon: '🛍️', label: () => T('Clothes shop', 'Cửa hàng quần áo'), visible: () => on(), act: h => openShop(h.i) });
  stall.visible = on(); world.updaters.push(() => { stall.visible = on(); });

  // ---------- the companion's hats ----------
  // (owner, 30 Oct 2026 AEDT: "where do I manage accessories for companions?") a tab in the shop and the mirror, shown once
  // a child has a companion: the hats bought with the coin goal are put on or taken off with a tap, and in the shop the
  // next hat can be bought (the same rule as the coin goal: the hats come in order; js/kidplay.js)
  const PET_ICON = { party: '🎉', flower: '🌸', nonla: '👒', crown: '👑' };
  const petOf = p => { if (!G.kidplay || !(p.lanterns && p.lanterns.companion)) return null; const s = p.lanterns.pet = p.lanterns.pet || {}; s.hats = s.hats || []; return s; };
  const petTab = (p, on, attr) => petOf(p) ? `<button class="ktab ${on ? 'on' : ''}" ${attr} aria-label="${T('My companion’s hats', 'Mũ của bạn đồng hành')}">${pic('🐾')}</button>` : '';
  const petGrid = (h, shop) => { const s = petOf(h.profile), next = G.kidplay.nextHat(h);
    return G.kidplay.HATS.map(x => { const have = s.hats.includes(x.id), on = s.hat === x.id, buyable = !!next && next.id === x.id, cls = shop ? 'kitem' : 'wit';
      return `<button class="${cls} ${have ? 'have' : ''} ${on ? 'on' : ''} ${!have && !(shop && buyable) ? 'locked' : ''} ${buyable && farm.coins < x.price ? 'poor' : ''}" data-pet="${x.id}" aria-pressed="${on}" aria-label="${T(x.en, x.vi)}"${!have && !(shop && buyable) ? ' disabled' : ''}>${pic(PET_ICON[x.id] || '🎩')}<small>${escName(T(x.en, x.vi))}</small>${have ? (on ? `<span class="ktick">${pic('✅')}</span>` : '') : buyable ? coins(x.price) : `<span class="klock">${pic('🔒')}</span>`}</button>`; }).join(''); };
  // a tap on a hat the companion has: put it on, or take it off; in the shop, the next hat is bought
  const petTap = (h, id, done) => { const s = petOf(h.profile); if (!s) return;
    if (s.hats.includes(id)) { s.hat = s.hat === id ? null : id; save(); SFX.pop(1); done(); return; }
    const next = G.kidplay.nextHat(h); if (next && next.id === id) { G.kidplay.buy(h, id); done(); } };

  // ---------- the shop screen ----------
  let tab = 'hat';
  function openShop(i, host?) {
    if (!host && twoOpen(i)) return;
    const h = G.heroes[i], p = h.profile; adoptWorn(p);
    const little = p.age !== 'big', m = host ? { close: () => {}, addEventListener: () => {} } : modal('kcard shopk' + (little ? ' little' : ''), ''), card = host || m.querySelector('.card');
    card.classList.add('shop-content', 'kcard'); if (little) card.classList.add('little'); let collection = setOf(p.look)==='girl'?'g':'b'; let recipient = p;
    let pick = null, more = false;   // more: the other set too (Round U)
    // (r79, owner 16 Oct) clothes of the other set are bought only as a gift (wrapped in the Backpack), never worn
    const isGift = it => recipient === p && !forSet(it, setOf(p.look));
    const close = () => { if (host) return; m.close(); G.paused = false; };
    m.addEventListener('click', e => { if (e.target === m) close(); }); // (tap outside to leave)
    const draw = () => {
      const all = [...forSlot(tab), ...CLOTHES.filter(it => it.tester && it.slot === tab && owns(p, it.id))], list = all.filter(it => collection === 'all' || forSet(it, collection==='g'?'girl':'boy')), hidden = 0;
      card.innerHTML = `${host ? '' : `<button class="x" aria-label="${T('Close', 'Đóng')}">✕</button>`}
        <div class="khead"><span class="kbig">${pic('🛍️')}</span><h2>${T('Clothes shop', 'Cửa hàng quần áo')}</h2>${coins(farm.coins)}</div>
        <div class="shop-collections">${[['all', 'All', 'Tất cả'], ['b', 'Men / boys', 'Nam / bé trai'], ['g', 'Ladies / girls', 'Nữ / bé gái']].map(([key, en, vi]) => `<button class="btn ${collection === key ? 'primary' : ''}" data-set="${key}">${T(en, vi)}</button>`).join('')}</div><label>${T('Buying for', 'Mua cho')} <select class="shop-recipient">${profiles.map(q => `<option value="${q.id}" ${recipient.id === q.id ? 'selected' : ''}>${escName(q.name)}</option>`).join('')}</select></label><p class="note">${T('Your own collection is for you to wear. Clothes from the other collection are gifts: they wait, wrapped, in your Backpack until you give them to a friend.', 'Bộ đồ của con là để con mặc. Đồ của bộ kia là quà: được gói trong Ba lô cho đến khi con tặng bạn.')}</p><img class="shop-preview" alt="${T('Your outfit preview', 'Xem trước trang phục')}" src="${G.avatarPreview(i)}"><div class="ktabs">${SLOTS.map(s => `<button class="ktab ${s.id === tab ? 'on' : ''}" data-tab="${s.id}" aria-label="${T(s.en, s.vi)}">${pic(s.icon)}</button>`).join('')}
          ${petTab(p, tab === 'pet', 'data-ptab="1"')}<button class="ktab alt" data-go="wardrobe" aria-label="${T('My wardrobe', 'Tủ đồ của con')}">${pic('🪞')}</button></div>
        <div class="kgrid">${list.map(it => { const gift = isGift(it), have = !gift && owns(recipient, it.id), worn = recipient === p && p.look[it.slot] === it.id;
          return `<button class="kitem ${have ? 'have' : ''} ${worn ? 'on' : ''} ${gift ? 'gift' : ''} ${!have && farm.coins < priceOf(it) ? 'poor' : ''}" data-id="${it.id}" aria-label="${T(it.en, it.vi)}${gift ? ' · ' + T('a gift to give', 'quà để tặng') : ''}">${itemSVG(it)}${gift ? `<span class="kgift">${pic('🎁')}</span>` : ''}${have ? `<span class="ktick">${pic('✅')}</span>` : coins(priceOf(it))}</button>`; }).join('')}</div>
        ${hidden || more ? `<button class="btn kmore">${more ? T('Fewer', 'Bớt lại') : T('More', 'Xem thêm')}</button>` : ''}
        ${pick ? `<div class="kask"><div class="kaskbox">${itemSVG(pick)}${isGift(pick) ? `<b class="kgiftnote">${pic('🎁')} ${T('A gift to give: it waits, wrapped, in your Backpack', 'Quà để tặng: được gói sẵn trong Ba lô')}</b>` : ''}${coins(priceOf(pick))}<div class="kbtns"><button class="kno" aria-label="${T('Not now', 'Để sau')}">✕</button><button class="kyes ${farm.coins < priceOf(pick) ? 'poor' : ''}" aria-label="${T('Buy', 'Mua')}">${pic('🛍️')}</button></div></div></div>` : ''}`;
      if (card.querySelector('.x')) card.querySelector('.x').onclick = close;
      card.querySelectorAll('[data-set]').forEach(b => b.onclick = () => { collection = b.dataset.set; pick = null; draw(); });
      card.querySelector('.shop-recipient').onchange = e => { recipient = profiles.find(q => q.id === e.target.value) || p; collection=setOf(recipient.look)==='girl'?'g':'b'; pick = null; draw(); };
      const mb = card.querySelector('.kmore'); if (mb) mb.onclick = () => { more = !more; SFX.tap(); draw(); };
      card.querySelectorAll('[data-tab]').forEach(b => b.onclick = () => { tab = b.dataset.tab; pick = null; SFX.tap(); const s = SLOTS.find(x => x.id === tab); say(s.en, s.vi); draw(); });
      card.querySelector('[data-go="wardrobe"]').onclick = () => { openWardrobe(i, draw, card); };
      const pt = card.querySelector('[data-ptab]'); if (pt) pt.onclick = () => { tab = 'pet'; pick = null; SFX.tap(); say('Save coins for a hat for your companion. Choose Buy when you are ready.', 'Để dành tiền mua mũ cho bạn đồng hành. Chọn Mua khi con đã sẵn sàng.'); draw(); };
      if (tab === 'pet') { if (!petOf(p)) { tab = 'hat'; draw(); return; } const g = card.querySelector('.kgrid'); if (g) g.innerHTML = petGrid(h, true); card.querySelectorAll('.shop-collections, .kmore').forEach(e => e.remove());
        card.querySelectorAll('[data-pet]').forEach(b => b.onclick = () => petTap(h, b.dataset.pet, draw)); return; }
      card.querySelectorAll('.kitem').forEach(b => b.onclick = () => {
        const it = ITEM[b.dataset.id];
        // owned: one tap puts it on (or takes it off), right away
        if (!isGift(it) && owns(recipient, it.id)) { if (recipient !== p) { say('This player already owns it.', 'Người chơi này đã có món này.'); return; } wear(p, it.slot, p.look[it.slot] === it.id ? 'none' : it.id); saveProfiles(); G.rebuildHero(i); SFX.pop(1); say(...SHOP_LINES.wear); draw(); return; }
        pick = it; SFX.tap(); say(it.en, it.vi); draw();
      });
      const no = card.querySelector('.kno'); if (no) no.onclick = () => { pick = null; SFX.tap(); draw(); };
      const yes = card.querySelector('.kyes'); if (yes) yes.onclick = () => {
        if (recipient !== p && !forSet(pick, setOf(recipient.look))) { SFX.no && SFX.no(); say(...(setOf(recipient.look) === 'girl' ? SHOP_LINES.forGirl : SHOP_LINES.forBoy)); return; }
        const r = buy(recipient, farm.coins, pick.id);
        if (!r.ok) { if (r.why === 'coins') { SFX.no && SFX.no(); say(...SHOP_LINES.saving); yes.classList.add('shake'); setTimeout(() => yes.classList.remove('shake'), 500); } return; }
        G.addCoins(-r.price); if (recipient === p && !r.gift) wear(p, pick.slot, pick.id); saveProfiles(true); save(); G.rebuildHero(i); SFX.coin && SFX.coin(); say(...(r.gift ? SHOP_LINES.gift : SHOP_LINES.bought));
        G.job && G.job('buy', 1, h); pick = null; draw();
      };
    };
    draw(); say(...SHOP_LINES.hello);
    return m;
  }
  const twoOpen = i => { if (G.heroes.length > 1) G.lastPlayer = i; if (G.paused) return true; G.paused = true; return false; };

  // ---------- the mirror (wardrobe) ----------
  // (r79, owner points 18 and A4, 16 Oct: "I could not understand the mirror"; a Remove button in every row was confusing)
  // a big picture of the child at the top; under it a tab for each kind of thing (hats, necklaces, tops, bottoms, shoes,
  // the back) showing only the clothes the child owns of their own set; tap a picture to wear it (a tick shows), tap it
  // again to take it off. No Remove buttons. Clothes of the other set are gift boxes in the Backpack, not here.
  let wtab = 'hat';
  function openWardrobe(i, onClose, host) {
    dispatchEvent(new Event('sv-hide-caption')); const p = G.heroes[i].profile; adoptWorn(p);
    const scroller = host && (host.closest('.pad-body') || host), keepY = scroller ? scroller.scrollTop : 0;
    const m = host || document.createElement('div'); if (!host) { m.className = 'wardrobe kward' + (p.age !== 'big' ? ' little' : ''); document.body.appendChild(m); } m.classList.add('wardrobe-content', 'mirror'); if (p.age !== 'big') m.classList.add('little');
    // (hats won on the passport pages are kept and worn here too)
    const won = () => (p.owned.hats || []).filter(x => x !== 'none' && !ITEM[x] && HAT_ICON[x]);
    const mine = slot => CLOTHES.filter(it => it.slot === slot && owns(p, it.id) && forSet(it, setOf(p.look)));
    const count = slot => mine(slot).length + (slot === 'hat' ? won().length : 0);
    const draw = () => {
      const s = SLOTS.find(x => x.id === wtab) || SLOTS[0], list = mine(s.id), hats = s.id === 'hat' ? won() : [];
      m.innerHTML = `<div class="whead"><h2>${pic('🪞')} ${T('My mirror', 'Gương của con')}</h2><button class="x btn" aria-label="${T('Done', 'Xong')}">${T('Done', 'Xong')}</button></div>
        <div class="wmirror"><img class="wbig" alt="${T('You, in what you are wearing', 'Con, với đồ đang mặc')}" src="${G.avatarPreview(i)}"></div>
        <p class="note whow">${T('Tap a picture to wear it. Tap it again to take it off.', 'Chạm vào hình để mặc. Chạm lần nữa để cởi ra.')}</p>
        <div class="ktabs wtabs" role="tablist">${SLOTS.map(x => `<button class="ktab ${x.id === s.id ? 'on' : ''}" role="tab" aria-selected="${x.id === s.id}" data-wtab="${x.id}" aria-label="${T(x.en, x.vi)}">${pic(x.icon)}<b class="wn">${count(x.id)}</b></button>`).join('')}${petTab(p, wtab === 'pet', 'data-pwtab="1"')}</div>
        <h3 class="wkind">${T(s.en, s.vi)}</h3>
        <div class="wgrid">${list.map(it => { const on = p.look[s.id] === it.id; return `<button class="wit ${on ? 'on' : ''}" data-k="${s.id}" data-v="${it.id}" aria-pressed="${on}" aria-label="${T(it.en, it.vi)}">${itemSVG(it)}<small>${escName(T(it.en, it.vi))}</small>${on ? `<span class="ktick">${pic('✅')}</span>` : ''}</button>`; }).join('')}${hats.map(x => { const on = p.look.hat === x; return `<button class="wit ${on ? 'on' : ''}" data-k="hat" data-v="${x}" data-won="1" aria-pressed="${on}">${pic(HAT_ICON[x])}<small>${escName(HAT_NAME[x] ? HAT_NAME[x]() : '')}</small>${on ? `<span class="ktick">${pic('✅')}</span>` : ''}</button>`; }).join('')}
          ${list.length + hats.length ? '' : `<p class="note wnone">${T('Nothing here yet. Find some in the Shop!', 'Chưa có gì. Tìm mua ở Cửa hàng nhé!')}</p>`}</div>`;
      m.querySelector('.x').onclick = () => { if (!host) m.remove(); else m.classList.remove('wardrobe-content', 'mirror', 'little'); saveProfiles(); SFX.chime(); say(...SHOP_LINES.wear); onClose && onClose(); if (scroller) requestAnimationFrame(() => { scroller.scrollTop = keepY; }); };
      const pw = m.querySelector('[data-pwtab]'); if (pw) pw.onclick = () => { wtab = 'pet'; SFX.tap(); say('Save coins for a hat for your companion. Choose Buy when you are ready.', 'Để dành tiền mua mũ cho bạn đồng hành. Chọn Mua khi con đã sẵn sàng.'); draw(); };
      if (wtab === 'pet') { if (!petOf(p)) { wtab = 'hat'; draw(); return; } const h = G.heroes[i], kind = m.querySelector('.wkind'), g = m.querySelector('.wgrid');
        if (kind) kind.textContent = T('My companion’s hats', 'Mũ của bạn đồng hành'); if (g) g.innerHTML = petGrid(h, false) + (G.kidplay.nextHat(h) ? `<p class="note wnone">${T('The next hat is in the Shop.', 'Mũ tiếp theo có ở Cửa hàng.')}</p>` : '');
        m.querySelectorAll('[data-pet]').forEach(b => b.onclick = () => petTap(h, b.dataset.pet, draw)); }
      m.querySelectorAll('[data-wtab]').forEach(b => b.onclick = () => { wtab = b.dataset.wtab; SFX.tap(); const x = SLOTS.find(y => y.id === wtab); say(x.en, x.vi); draw(); });
      m.querySelectorAll('.wit:not([data-pet])').forEach(b => b.onclick = () => {
        const k = b.dataset.k, v = b.dataset.v, off = p.look[k] === v;
        const ok = b.dataset.won ? (p.look.hat = off ? 'none' : v, true) : wear(p, k, off ? 'none' : v);
        if (ok) { SFX.pop(1); G.rebuildHero(i); saveProfiles(); if (!off) say(...SHOP_LINES.wear); draw(); }
      });
    };
    if (scroller) scroller.scrollTop = 0;
    draw(); say(...SHOP_LINES.dress);
  }
  return { on, spot, front, stall, openShop, openWardrobe, itemSVG, LINES: SHOP_LINES };
}
