// More famous places from the wider region of each city, just outside it: Marble Mountains and Hội An's lantern
// streets near Đà Nẵng (central Vietnam), the red Thê Húc bridge in Hà Nội, the Cái Răng floating market near
// Hồ Chí Minh City (the Mekong), the Twelve Apostles near Melbourne (Victoria) and Story Bridge in Brisbane
// (Queensland). Each has an ℹ️ sign, a postcard, real photos and a 360° look round (js/realworld.js REAL).
import { THREE, P, merge, toonVC, sprite, outline } from './gfx.js';
import { T } from './i18n.js';
import { heightAt, oldHeightAt, CITIES, roadDist, riverDist, WATER, BAMBOO, APOSTLES, LAKE, ULURU, HALF, HOIAN, PONDS, BRIDGES } from './world.js';
import { LANDMARKS, postcard } from './regions.js';
import { REAL } from './realworld.js';

const B = (w, h, d) => new THREE.BoxGeometry(w, h, d), C = (r1, r2, h, s = 12) => new THREE.CylinderGeometry(r1, r2, h, s), S = (r, w = 12, h = 8) => new THREE.SphereGeometry(r, w, h);
const water = (r, sx = 1, sz = 1) => P(C(r, r, .08, 28), '#4fa8d8', [0, .06, 0], [0, 0, 0], [sx, 1, sz]);
const MODELS = {
  marble: () => { const p = []; [[-3, 0, 4, 6], [2, -1, 3.2, 5], [0, 3, 2.6, 4], [4.5, 2.5, 2, 3.2]].forEach(([x, z, r, h]) => p.push(P(new THREE.DodecahedronGeometry(r, 0), '#b9b8b0', [x, h * .45, z], [0, x, 0], [1, h / r * .8, 1])));
    p.push(P(B(1.6, 1.2, 1.4), '#c0392b', [-2.8, 5.6, .8]), P(new THREE.ConeGeometry(1.4, .9, 4), '#7a3a2a', [-2.8, 6.6, .8], [0, Math.PI / 4, 0]), P(C(.9, 1.1, .1, 16), '#2a2a2e', [1.6, 1.2, 2.2], [Math.PI / 2, 0, 0]));
    for (let i = 0; i < 9; i++) p.push(P(new THREE.ConeGeometry(.5, 1.6, 6), '#3f7d4a', [-5 + i * 1.3, 4 + Math.sin(i) * 1.2, -2 + Math.cos(i * 2) * 2]));
    return p; },
  hoian: () => { const p = [P(B(12, .15, 7), '#d9c9a8', [0, .07, 0])];
    [[-4, '#f2c230'], [0, '#f6d35a'], [4, '#e9b830']].forEach(([x, wall]) => { p.push(P(B(3.6, 2.6, 4), wall, [x, 1.4, -1.2]), P(B(4.2, .2, 4.8), '#8a4a2a', [x, 2.85, -1.2], [.25, 0, 0]), P(B(1, 1.8, .1), '#5a3a2a', [x, 1.0, .82]), P(B(.8, .7, .1), '#3a6a5a', [x + 1.1, 1.8, .82])); });
    const cols = ['#e8433a', '#ffd23f', '#ff9f43', '#e8433a', '#b03ab0', '#3cc7e8'];
    for (let i = 0; i < 12; i++) p.push(P(S(.28, 10, 8), cols[i % 6], [-5.5 + i, 3.2 - Math.sin(i / 11 * Math.PI) * .5, 1.4], [0, 0, 0], [1, 1.25, 1]));
    p.push(P(C(.02, .02, 12, 4), '#3a2a1a', [0, 3.5, 1.4], [0, 0, Math.PI / 2]));
    return p; },
  thehuc: () => { const p = [water(7, 1.3, .8)]; for (let i = 0; i <= 10; i++) { const t = i / 10, x = -7 + t * 14, y = .5 + Math.sin(t * Math.PI) * 1.4; p.push(P(B(1.5, .2, 2), '#d9302a', [x, y, 0], [0, 0, Math.cos(t * Math.PI) * -.35])); [-1, 1].forEach(s => p.push(P(B(1.4, .5, .12), '#e8433a', [x, y + .35, s * 1])));
      if (i % 2 === 0) [-1, 1].forEach(s => p.push(P(C(.06, .06, 1.2, 6), '#b8262a', [x, y - .5, s * .9]))); }
    p.push(P(B(2.4, 2.6, 2.4), '#f2e6c8', [8.2, 1.3, 0]), P(new THREE.ConeGeometry(2, 1, 4), '#4a6a4a', [8.2, 3.1, 0], [0, Math.PI / 4, 0]));
    return p; },
  cairang: () => { const p = [water(8, 1, .7)]; const fruit = ['#ffd23f', '#5fd36a', '#e8433a', '#ff9f43'];
    [[-4, -1.5, .2], [0, 1.5, -.15], [4, -1, .1], [-1, -3.2, .3]].forEach(([x, z, r], k) => { p.push(P(B(4.2, .5, 1.4), '#7a4a2a', [x, .35, z], [0, r, 0]), P(B(1.6, .9, 1.2), '#3a6ab0', [x - .9, .95, z], [0, r, 0]), P(C(.03, .03, 3, 4), '#5a3a1a', [x + 1.4, 1.9, z]), P(S(.3, 8, 6), fruit[k], [x + 1.4, 3.4, z]));
      for (let i = 0; i < 6; i++) p.push(P(S(.22, 8, 6), fruit[(i + k) % 4], [x + .5 + (i % 3) * .4, .8, z - .3 + Math.floor(i / 3) * .5])); });
    return p; },
  apostles: () => { const p = [water(9, 1.2, .8), P(B(20, 2.4, 3), '#d9a86a', [0, 1.2, -6.4]), P(B(20, .2, 3.2), '#5f9a4a', [0, 2.45, -6.4])];
    [[-6, 1, 5.5], [-3, -1, 7], [0, 1.5, 6], [3, 0, 7.5], [6, 2, 5], [8, -1.5, 4]].forEach(([x, z, h]) => p.push(P(C(.7, 1.2, h, 7), '#e0b07a', [x, h / 2, z], [0, x, 0]), P(new THREE.DodecahedronGeometry(.8, 0), '#e8bf8a', [x, h, z])));
    return p; }
};
// [id, city, icon, model, size (for the camera), name, fact, which way out of the city to look first]
const SITES = [
  ['marble', 'danang', '⛰️', 'marble', ['Marble Mountains (Ngũ Hành Sơn)', 'Ngũ Hành Sơn'], ['Near Đà Nẵng, five marble and limestone hills are named after the five elements: metal, wood, water, fire and earth. Inside are caves with pagodas, and stone carvers have worked here for hundreds of years.', 'Gần Đà Nẵng có năm ngọn núi đá vôi và cẩm thạch mang tên Kim, Mộc, Thủy, Hỏa, Thổ. Trong núi có hang động và chùa chiền, còn làng đá Non Nước đã chạm khắc đá hàng trăm năm.']],
  ['hoian', 'danang', '🏮', 'hoian', ['Hội An Ancient Town', 'Phố cổ Hội An'], ['Hội An is an old trading port in central Vietnam with yellow houses and thousands of silk lanterns. On full-moon nights the lights go out and the streets glow only with lanterns. UNESCO protects it.', 'Hội An là thương cảng cổ ở miền Trung với những ngôi nhà vàng và hàng nghìn chiếc đèn lồng lụa. Đêm rằm phố tắt đèn điện, chỉ còn ánh đèn lồng lung linh. UNESCO công nhận là di sản thế giới.']],
  ['thehuc', 'hanoi', '🌉', 'thehuc', ['Thê Húc Bridge, Hoàn Kiếm Lake', 'Cầu Thê Húc, Hồ Gươm'], ['The red wooden Thê Húc bridge crosses Hoàn Kiếm Lake to Ngọc Sơn Temple. Its name means “where the morning sunlight rests”.', 'Cầu Thê Húc bằng gỗ sơn đỏ bắc qua Hồ Gươm vào đền Ngọc Sơn. Tên cầu có nghĩa là “nơi đậu ánh sáng ban mai”.']],
  ['cairang', 'saigon', '🛶', 'cairang', ['Cái Răng Floating Market (Mekong)', 'Chợ nổi Cái Răng (miền Tây)'], ['In the Mekong Delta, people sell fruit and vegetables from boats. Each boat hangs what it sells on a tall pole, so you can see from far away: pineapples, watermelons, pumpkins!', 'Ở miền Tây sông nước, người ta mua bán trái cây, rau củ ngay trên ghe. Ghe bán gì thì treo món đó lên cây sào cao để ai ở xa cũng thấy: khóm, dưa hấu, bí đỏ!']],
  ['apostles', 'melbourne', '🪨', 'apostles', ['The Twelve Apostles (Victoria)', 'Mười Hai Tông Đồ (bang Victoria)'], ['Along the Great Ocean Road in Victoria, tall rock towers stand in the sea. The waves carved them from the cliffs over thousands of years. Even though they are called “twelve”, there were never more than nine!', 'Dọc Great Ocean Road ở bang Victoria, những cột đá cao đứng giữa biển. Sóng biển đã khoét chúng ra từ vách đá suốt hàng nghìn năm. Dù gọi là “mười hai” nhưng chưa bao giờ có quá chín cột!']],
  ['storybridge', 'brisbane', '🌉', 'storybridge', ['Story Bridge (Queensland)', 'Cầu Story (bang Queensland)'], ['Story Bridge is a big steel bridge over the Brisbane River, opened in 1940. Brave people can climb right to the top, and at night it shines in different colours.', 'Cầu Story là cây cầu thép lớn bắc qua sông Brisbane, khánh thành năm 1940. Người gan dạ có thể leo lên tận đỉnh, và ban đêm cầu sáng đèn nhiều màu.']]
];
Object.assign(REAL, {
  marble: [['en:Marble Mountains (Vietnam)'], 16.0040, 108.2627], hoian: [['en:Hội An', 'en:Hoi An Ancient Town', 'en:Japanese Covered Bridge'], 15.8801, 108.3380], thehuc: [['en:The Huc Bridge', 'en:Ngọc Sơn Temple'], 21.0306, 105.8526],
  cairang: [['en:Cái Răng floating market', 'en:Mekong Delta'], 10.0055, 105.7469], apostles: [['en:The Twelve Apostles (Victoria)', 'en:Port Campbell National Park', 'en:Great Ocean Road'], -38.6655, 143.1044], storybridge: [['en:Story Bridge'], -27.4636, 153.0359]
});

export function createRegionSites(G) {
  const { scene, world } = G, mat = toonVC();
  const used = [];
  // an open, fairly flat spot 20–34 m out from the city, away from roads, buildings and other new places
  const findSpot = c => {
    for (let R = 22; R <= 64; R += 3) for (let k = 0; k < 24; k++) {
      const a = k / 24 * Math.PI * 2 + c.x * .01, x = c.x + Math.cos(a) * R, z = c.z + Math.sin(a) * R;
      if (Math.abs(x) > HALF - 15 || Math.abs(z) > HALF - 15 || Math.hypot(x - BAMBOO.x, z - BAMBOO.z) < BAMBOO.r - 10 || Math.hypot(x - ULURU.x, z - ULURU.z + 2) < 40 || Math.hypot(x - LAKE.x, z - LAKE.z) < LAKE.r + 16 || riverDist(x, z) < 16 || roadDist(x, z).d < 11 || used.some(([ux, uz]) => Math.hypot(ux - x, uz - z) < 22)) continue;
      const hs = [[0, 0], [7, 0], [-7, 0], [0, 6], [0, -6]].map(([dx, dz]) => oldHeightAt(x + dx, z + dz));
      if (Math.min(...hs) < WATER + .5 || Math.max(...hs) - Math.min(...hs) > (R > 40 ? 3.2 : 2.2)) continue;
      if (world.boxes.some(b => x > b.x0 - 9 && x < b.x1 + 9 && z > b.z0 - 9 && z < b.z1 + 9) || world.colliders.some(o => o.r > .3 && Math.hypot(o.x - x, o.z - z) < o.r + 8)) continue;
      return [x, z, Math.min(...hs)];
    }
    return null;
  };
  for (const [id, city, icon, model, name, fact] of SITES) {
    const c = CITIES.find(k => k.id === city); if (!c) continue;
    // every site goes round its own city (Hồ Gươm and the Thê Húc bridge are in Hà Nội)
    const near = null;
    // (round T2) some sites have their real place on the map: the Thê Húc bridge on Hồ Gươm, Hội An's houses by its
    // canal, the Story Bridge is the real bridge over the Brisbane River (only its ℹ️ sign is added here)
    const pond = PONDS.find(P => P.id === 'hoguom'), bridge = BRIDGES.find(B => B.landmark === id);
    const s = id === 'apostles' ? [APOSTLES.x, APOSTLES.z, heightAt(APOSTLES.x, APOSTLES.z) - .3] : id === 'thehuc' && pond ? [pond.x - pond.r * .55, pond.z, WATER + .05] : id === 'hoian' ? [HOIAN.x + 13, HOIAN.z + 4, heightAt(HOIAN.x + 13, HOIAN.z + 4)]
      : bridge ? [...(B => B.axis === 'z' ? [B.c - B.w / 2 - 5, B.a0 - 4] : [B.a0 - 4, B.c - B.w / 2 - 5])(bridge), 0] : (near && findSpot({ x: near.mx ?? near.x, z: near.mz ?? near.z })) || findSpot(c); if (!s) { console.warn('no room for', id); continue; }
    const [x, z, y] = s; used.push([x, z]);
    const rot = id === 'thehuc' ? Math.PI / 2 : Math.atan2(c.x - x, c.z - z); // facing the city (the Thê Húc bridge reaches out across the lake)
    if (!bridge) { const m = new THREE.Mesh(merge(MODELS[model]()), mat); m.position.set(x, y - .05, z); m.rotation.y = rot; m.castShadow = m.receiveShadow = true; scene.add(m); outline(m, .025, '#4a3a3f');
          if (id === 'thehuc') {
            m.userData.walk = true; // (r89) a walkway: the solid map leaves it out (a plank's tilted edge stood a little above the deck and counted as a wall); the temple keeps its collider
            world.colliders.push({ x: x + Math.cos(rot) * 8.2, z: z - Math.sin(rot) * 8.2, r: 1.9 }); // (only its temple, on the shore: the bridge reaches out over the water)
            // walkable deck: 11 planks from local x = -7 to 7, arch y = .5 + sin(t*PI)*1.4, turned with the model.
            // (r89, owner's screenshot: "stop me from accessing it") the deck's height used world.WATER, which does not exist,
            // so every plank's height was NaN and the child stopped at the first one; and a quarter turn swaps a plank's
            // length and width. Three.js turns local (lx, 0) to (x + lx cos, z - lx sin).
            const c = Math.abs(Math.cos(rot)), sn = Math.abs(Math.sin(rot));
            // (the planks are 1.4 m apart and up to .43 m higher than the last: walked in thin slices, so each step is small)
            for (let i = 0; i <= 28; i++) {
              const t = i / 28, lx = -7 + t * 14, ly = .5 + Math.sin(t * Math.PI) * 1.4, hl = 14 / 28 / 2 + .05;
              const wx = x + Math.cos(rot) * lx, wz = z - Math.sin(rot) * lx, ex = c * hl + sn * 1, ez = sn * hl + c * 1;
              world.platforms.push({ x0: wx - ex, x1: wx + ex, z0: wz - ez, z1: wz + ez, y: y - .05 + ly + .1 }); // (the deck's top there)
            }
          } else world.colliders.push({ x, z, r: 6 }); }
    // the ℹ️ sign stands on the side facing the city, outside the model
    const [ix, iz] = bridge ? [x, z] : id === 'thehuc' ? [x - 7, z] : [x + Math.sin(rot) * 9, z + Math.cos(rot) * 9]; // (on the shore for the lake, by the bridge's end for a bridge)
    const sg = sprite('ℹ️', 1.5); sg.position.set(ix, heightAt(ix, iz) + 3.2, iz); scene.add(sg); world.updaters.push((dt, t) => { sg.position.y = heightAt(ix, iz) + 3.2 + Math.sin(t * 2 + x) * .25; });
    const lm = { id, icon, cc: c.cc, x: ix, z: iz, mx: x, mz: z, name: () => T(name[0], name[1]), fact }; LANDMARKS.push(lm);
    const pc = { id: 'pc_' + id, x: ix, z: iz, r: 3.4, icon: 'ℹ️', label: () => T('About: ', 'Tìm hiểu: ') + lm.name(), act: h => postcard(G, h, lm) };
    G.interactables.push(pc); sg.userData.it = pc; (G.tapTargets = G.tapTargets || []).push(sg); // (tester's notes, 12 Oct) tap the sign: walk up and read it
  }
}
