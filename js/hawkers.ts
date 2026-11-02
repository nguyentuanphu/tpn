// Street sellers with a shoulder pole (gánh hàng rong): they walk up and down a street with two baskets
// on a bamboo pole, calling out what they sell, and stop to serve a child who comes close. What they sell goes in the
// backpack like kiosk food (snacks.js), and eating it fills the food passport.
import { THREE, toonVC, P, merge, sprite } from './gfx.js';
import { T, nm, registerName } from './i18n.js';
import { heightAt } from './world.js';
import { walkPath } from './content/map.js';
import { buildAvatar, nameAvatar } from './avatar.js';
import { VENDORS } from './regions.js';
import { PERSONAS } from './chat.js';
import { dialog } from './ui.js';
import { say } from './voice.js';
import { buyFood, greetLine } from './snacks.js';

const look = (color, hair, hairStyle, hat = 'nonla') => ({ style: 'aodai', color, hat, back: 'none', hair, hairStyle, skin: '#e8b48c', glider: 0 });
// [id, name, look, goods (two baskets), food [icon, en, vi, price], call [en, vi], greet [en, vi], where]
const HAWKERS = [
  ['h_traicay', 'Cô Ba', look('#f2c230', '#1d1412', 'long'), ['🥭', '🍌'], ['🍉', 'a slice of watermelon', 'miếng dưa hấu', 2],
    ['Fruit! Mangoes, bananas, sweet watermelon!', 'Trái cây đây! Xoài, chuối, dưa hấu ngọt lịm nè!'], ['Fresh fruit from the Bà Rịa orchards. Have a slice, it is so sweet!', 'Trái cây tươi từ vườn Bà Rịa nè con. Ăn miếng dưa hấu đi, ngọt lắm!'], 'town'],
  ['h_tauhu', 'Bà Tư', look('#e8e4dc', '#d8d8d8', 'buns'), ['🍮', '🫚'], ['🍮', 'a bowl of tàu hủ (sweet tofu pudding with ginger syrup)', 'chén tàu hủ nước đường', 2],
    ['Tàu hủ! Soft tofu with ginger syrup!', 'Tàu hủ nước đường đâyyy!'], ['Soft warm tofu with ginger syrup and coconut milk. Sài Gòn kids love it after school!', 'Tàu hủ nước đường gừng, chan nước cốt dừa. Con nít Sài Gòn tan học là ăn liền!'], 'saigon'],
  ['h_bunoc', 'Cô Hằng', look('#5a8ab0', '#1d1412', 'buns'), ['🐌', '🍜'], ['🍜', 'a bowl of bún ốc (snail noodle soup)', 'bát bún ốc', 5],
    ['Bún ốc! Who wants snail noodle soup?', 'Bún ốc đây! Ai ăn bún ốc không nào?'], ['Bún ốc is a Hà Nội favourite: rice noodles, little river snails and a tangy tomato soup.', 'Bún ốc là món quen của người Hà Nội: bún, ốc nhồi và nước dùng chua chua cà chua.'], 'hanoi'],
  ['h_bunrieu', 'Chị Sáu', look('#ff9f43', '#1d1412', 'ponytail'), ['🦀', '🍜'], ['🍜', 'a bowl of bún riêu (crab noodle soup)', 'tô bún riêu', 5],
    ['Bún riêu! Crab noodle soup, nice and red!', 'Bún riêu cua đây! Ngon lắm nè!'], ['Bún riêu has a crab soup, tomatoes and tofu. It is red and yummy!', 'Bún riêu có riêu cua, cà chua và đậu hũ chiên. Đỏ au, ngon lắm!'], 'market'],
  ['h_banhda', 'Cô Út', look('#5fd39a', '#1d1412', 'long'), ['🍡', '🧁'], ['🍡', 'a piece of bánh da lợn (layer cake)', 'miếng bánh da lợn', 2],
    ['Layer cake! Green and yellow layers!', 'Bánh da lợn đây! Xanh xanh vàng vàng nè!'], ['Bánh da lợn has layers: green pandan and yellow mung bean. Peel them one by one!', 'Bánh da lợn có nhiều lớp: lớp lá dứa xanh, lớp đậu xanh vàng. Bóc từng lớp mà ăn!'], 'village']
];

// where each one walks: there and back along the footpath of the place's main street, on the side away from its market
// row (T1b, owner 11 Oct: js/content/map.js walkPath; never on the road, never through a stall or a house)
const routeFor = where => walkPath(where) || [[0, 0], [0, 0]];

function poleModel(goods) {
  const g = new THREE.Group();
  const m = new THREE.Mesh(merge([P(new THREE.BoxGeometry(2.4, .07, .07), '#c9a35a'),
    ...[-1.1, 1.1].flatMap(x => [P(new THREE.CylinderGeometry(.34, .26, .34, 12), '#b98a4a', [x, -.78, 0]), P(new THREE.TorusGeometry(.34, .03, 4, 14), '#8a6a3a', [x, -.62, 0], [Math.PI / 2, 0, 0]),
      ...[-.25, .25].map(dz => P(new THREE.BoxGeometry(.02, .62, .02), '#7a5a3a', [x, -.33, dz]))])]), toonVC());
  g.add(m);
  goods.forEach((e, k) => { const s = sprite(e, .55); s.position.set(k ? 1.1 : -1.1, -.45, 0); g.add(s); });
  g.position.set(0, 1.2, .02); g.rotation.y = Math.PI / 2; // across the shoulder, baskets in front and behind
  return g;
}

export function createHawkers(G) {
  const { scene, world } = G, list = [];
  for (const [id, name, lk, goods, food, call, greet, where] of HAWKERS) {
    const route = routeFor(where); if (!route) continue;
    const A = nameAvatar(buildAvatar(lk, null), name); A.root.add(poleModel(goods)); scene.add(A.root); registerName(name);
    const tag = sprite('📣', .8); scene.add(tag);
    const H = { id, name, A, tag, route, k: 0, t: Math.random(), x: route[0][0], z: route[0][1], yaw: 0, callT: 4 + Math.random() * 8, call, food };
    list.push(H); world.walks.push({ id: 'hk_' + id, place: where, pts: route });
    const v = { id, name, region: where === 'hanoi' ? 'bac' : 'nam', food, greet, saying: null, hawker: true, x: H.x, z: H.z };
    VENDORS.push(v); // in the food passport
    PERSONAS['hk_' + id] = { emoji: food[0], name, age: ['grown-up', 'người lớn'], about: greet, likes: greet, mood: ['Very well, thank you!', 'Khỏe lắm, cảm ơn con!'], role: `a street seller who carries ${food[1]} in two baskets on a bamboo shoulder pole and calls out to people as she walks`, region: v.region };
    const it = { id: 'hk_' + id, x: H.x, z: H.z, r: 2.6, walks: true, icon: food[0], bubble: food[0], label: () => nm(name), act: h => buy(h, H, v) };
    G.interactables.push(it); H.it = it;
  }
  async function buy(h, H, v) {
    H.busy = true;
    const k = await dialog(H.name, [greetLine(h, v)], [[`${v.food[0]} ${T('Buy', 'Mua')} ${T(v.food[1], v.food[2])} (${G.fmt(v.food[3])})`, `${v.food[0]} Mua ${v.food[2]} (${G.fmt(v.food[3])})`], ['👋 Bye', '👋 Tạm biệt']]);
    if (k === 0) await buyFood(G, h, v, ['Here, this one is a gift!', 'Thôi, cái này cô cho con đó!']);
    H.busy = false;
  }
  const near = H => G.heroes.find(h => Math.hypot(h.pos.x - H.x, h.pos.z - H.z) < 3.6);
  world.updaters.push((dt, t) => {
    for (const H of list) {
      const hero = near(H), far = !G.heroes.some(h => Math.abs(h.pos.x - H.x) < 80 && Math.abs(h.pos.z - H.z) < 80);
      let moving = false;
      if (hero || H.busy) H.yaw = Math.atan2(hero ? hero.pos.x - H.x : 0, hero ? hero.pos.z - H.z : 1); // stop and look at the child
      else {
        // walk along the street, there and back, slowly
        const [ax, az] = H.route[H.k], [bx, bz] = H.route[1 - H.k], L = Math.hypot(bx - ax, bz - az) || 1;
        H.t += dt * 1 / L; if (H.t >= 1) { H.t = 0; H.k = 1 - H.k; }
        const u = H.t, nx = ax + (bx - ax) * u, nz = az + (bz - az) * u; H.yaw = Math.atan2(bx - ax, bz - az); H.x = nx; H.z = nz; moving = true;
      }
      const y = world.groundAt(H.x, H.z);
      H.A.root.position.set(H.x, y, H.z); H.A.root.rotation.y = H.yaw;
      if (!far) H.A.anim(moving ? 'walk' : 'idle', t, moving ? 1 : 0);
      H.it.x = H.x; H.it.z = H.z;
      // calling out now and then when a child is near enough to hear
      H.callT -= dt;
      const listener = G.heroes.find(h => Math.hypot(h.pos.x - H.x, h.pos.z - H.z) < 16);
      H.tag.visible = H.callT > 9.5 && !!listener; H.tag.position.set(H.x, y + 2.7 + Math.sin(t * 6) * .1, H.z);
      if (H.callT <= 0) { H.callT = 12 + Math.random() * 6; if (listener && !G.paused && !H.busy) say(H.call[0], H.call[1]); }
    }
  });
  G.hawkers = list;
  return list;
}
