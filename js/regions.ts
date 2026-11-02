// Places that bring both homes to life:
//  • Chợ Ba Miền (Three Regions Market): street food from the north (Hà Nội), centre (Huế, Hội An) and
//    south (Sài Gòn, Bà Rịa) of Vietnam, each vendor speaking with their own regional words.
//  • Aussie Corner: a milk bar, a fish and chip shop, a bakery, an ice-cream van, a sausage sizzle, a
//    playground with a flying fox, and a cricket pitch, with shopkeepers who love their Aussie slang.
//  • Landmarks to visit and collect as postcards: Opera House, Harbour Bridge, Uluru, the Big Banana,
//    Bondi lifesavers' tower, Vũng Tàu lighthouse, Turtle Tower, One Pillar Pagoda, Hội An's covered bridge
//    and Bến Thành market's clock tower.
import { REAL, openPhotos, openStreetView } from './realworld.js';
import { THREE, toon, toonVC, P, merge, sprite } from './gfx.js';
import { T, nm, onLang, registerName } from './i18n.js';
import { say } from './voice.js';
import { SFX, tone } from './audio.js';
import { heightAt, MARKET, AUSSIE, WATER, ULURU, BRIDGES } from './world.js';
import { landmarkAt, rowSlot, STALL } from './content/map.js';
import { buildAvatar } from './avatar.js';
import { Box, Cyl, gable, hip, win } from './town.js';
import { dialog, reward } from './popups.js';
import { farm, saveFarm } from './state.js';
import { PERSONAS } from './chat.js';
import { AUSSIE_SLANG, VN_WORDS, VN_SLANG, REGION_NAME } from './words.js';
import { dist2, pick } from './util.js';
import { buyFood, greetLine } from './snacks.js';

// ---------- small builders ----------
function signMesh(text, bg = '#c0392b', fg = '#fff8e0', w = 4, h = .9, font = 'Fredoka') {
  // text is 'WORDS' or ['English', 'Tiếng Việt']; it redraws when the language changes
  const c = document.createElement('canvas'); c.width = 512; c.height = Math.round(512 * h / w); const g = c.getContext('2d');
  const draw = () => {
    const tx = Array.isArray(text) ? T(text[0], text[1]) : text;
    g.fillStyle = bg; g.fillRect(0, 0, c.width, c.height); g.strokeStyle = fg; g.lineWidth = 8; g.strokeRect(8, 8, c.width - 16, c.height - 16);
    g.fillStyle = fg; g.textAlign = 'center'; g.textBaseline = 'middle';
    let size = c.height * .55; g.font = `bold ${size}px ${font}, "Baloo 2", sans-serif`;
    while (g.measureText(tx).width > c.width - 40 && size > 10) { size -= 2; g.font = `bold ${size}px ${font}, "Baloo 2", sans-serif`; }
    g.fillText(tx, c.width / 2, c.height / 2 + 2);
  };
  draw();
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  if (Array.isArray(text)) onLang(() => { draw(); t.needsUpdate = true; });
  // two faces back to back, so the words read the right way round from both sides
  const g2 = new THREE.Group(), m = new THREE.MeshBasicMaterial({ map: t });
  const a = new THREE.Mesh(new THREE.PlaneGeometry(w, h), m), b = new THREE.Mesh(new THREE.PlaneGeometry(w, h), m); b.rotation.y = Math.PI; b.position.z = -.01;
  g2.add(a, b); return g2;
}
// a market stall: table, posts, striped canopy
function stall(a, b, w = 3, d = 1.6) {
  const p = [];
  p.push(P(Box(w, .9, d), '#8a5a3b', [0, .45, 0]), P(Box(w + .1, .06, d + .1), '#e8dcc0', [0, .92, 0]));
  [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([x, z]) => p.push(P(Box(.1, 2.6, .1), '#6b4a32', [x * (w / 2 - .05), 1.3, z * (d / 2 - .05)])));
  for (let k = 0; k < 6; k++) p.push(P(Box(w / 6 + .02, .08, d + 1), k % 2 ? a : b, [-w / 2 + w / 12 + k * w / 6, 2.65, .3], [.18, 0, 0]));
  return merge(p);
}
function tag(scene, text, x, y, z) {
  registerName(text);
  const c = document.createElement('canvas'); c.width = 256; c.height = 64; const g = c.getContext('2d');
  const draw = () => { g.clearRect(0, 0, 256, 64); g.fillStyle = 'rgba(40,40,40,.55)'; g.beginPath(); g.roundRect(8, 10, 240, 46, 23); g.fill();
    g.font = 'bold 28px Fredoka, "Baloo 2", sans-serif'; g.fillStyle = '#fff'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(nm(text), 128, 34, 228); };
  draw();
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; onLang(() => { draw(); t.needsUpdate = true; });
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: t, transparent: true, depthWrite: false })); s.scale.set(3, .75, 1); s.position.set(x, y, z); scene.add(s); return s;
}

// ---------- the people who sell things: js/vendors.js (data only; architecture step 2 moved it out so snacks.js needs no regions.js) ----------
import { VENDORS, L } from './vendors.js';
export { VENDORS };

// ---------- landmarks you can collect as postcards ----------
// (round T: where each one stands comes from the map, js/content/map.js LANDMARK_AT)
const at = id => { const [x, z] = landmarkAt(id); return { x, z }; };
export const LANDMARKS = [
  { id: 'opera', icon: '🎭', ...at('opera'), name: () => T('Sydney Opera House', 'Nhà hát Opera Sydney'), fact: ['The Sydney Opera House has roofs shaped like big white sails. Inside, people sing, dance and play music.', 'Nhà hát Opera Sydney có mái hình những cánh buồm trắng khổng lồ. Bên trong, người ta hát, múa và chơi nhạc.'] },
  { id: 'harbour', icon: '🌉', ...at('harbour'), name: () => T('Harbour Bridge', 'Cầu Cảng Sydney'), fact: ['The Sydney Harbour Bridge is nicknamed "the Coathanger" because of its shape. Brave people climb right to the top!', 'Cầu Cảng Sydney có biệt danh là "cái móc áo" vì hình dáng của nó. Có người còn leo lên tận đỉnh cầu!'] },
  { id: 'uluru', icon: '🪨', ...at('uluru'), name: () => T('Uluru', 'Uluru'), fact: ['Uluru is a giant red rock in the middle of Australia. It is a very special place for Aboriginal people, its traditional owners, and it glows orange at sunset.', 'Uluru là một khối đá đỏ khổng lồ ở giữa nước Úc. Đây là nơi rất thiêng liêng của người Thổ dân, chủ nhân truyền thống của vùng đất, và đá rực cam lúc hoàng hôn.'] },
  { id: 'banana', icon: '🍌', ...at('banana'), name: () => T('The Big Banana', 'Quả Chuối Khổng Lồ'), fact: ['Australia loves its "Big Things"! The Big Banana in Coffs Harbour is one of the most famous. There is a Big Pineapple and a Big Prawn too!', 'Nước Úc rất thích "những thứ khổng lồ"! Quả Chuối Khổng Lồ ở Coffs Harbour là nổi tiếng nhất. Còn có Quả Dứa Khổng Lồ và Con Tôm Khổng Lồ nữa!'] },
  { id: 'bondi', icon: '🏖️', ...at('bondi'), name: () => T("Lifesavers' Tower", 'Tháp Cứu Hộ Bãi Biển'), fact: ['On Aussie beaches, lifesavers in red and yellow keep everyone safe. Always swim between the red and yellow flags!', 'Ở bãi biển nước Úc, đội cứu hộ mặc đồ đỏ vàng giữ an toàn cho mọi người. Luôn bơi giữa hai lá cờ đỏ vàng nhé!'] },
  { id: 'lighthouse', icon: '🗼', ...at('lighthouse'), name: () => T('Vũng Tàu Lighthouse', 'Hải Đăng Vũng Tàu'), fact: ['The Vũng Tàu lighthouse stands on a hill by the sea in Bà Rịa–Vũng Tàu. Its light helps ships find their way at night.', 'Hải đăng Vũng Tàu nằm trên đồi bên bờ biển Bà Rịa–Vũng Tàu. Ánh đèn giúp tàu thuyền tìm đường vào ban đêm.'] },
  { id: 'turtle', icon: '🐢', ...at('turtle'), name: () => T('Turtle Tower', 'Tháp Rùa'), fact: ['Tháp Rùa stands in Hoàn Kiếm Lake in Hà Nội. Legend says a golden turtle took back a magic sword there after peace came.', 'Tháp Rùa nằm giữa Hồ Hoàn Kiếm ở Hà Nội. Truyền thuyết kể rằng Rùa Vàng đã nhận lại thanh gươm thần ở đó khi đất nước thanh bình.'] },
  { id: 'onepillar', icon: '🪷', ...at('onepillar'), name: () => T('One Pillar Pagoda', 'Chùa Một Cột'), fact: ['Chùa Một Cột in Hà Nội stands on one stone pillar, like a lotus flower rising from the water.', 'Chùa Một Cột ở Hà Nội đứng trên một cột đá, giống như bông sen vươn lên khỏi mặt nước.'] },
  { id: 'chuacau', icon: '🌉', ...at('chuacau'), name: () => T('Hội An Covered Bridge', 'Chùa Cầu Hội An'), fact: ['Chùa Cầu in Hội An is a covered bridge about 400 years old. At night the old town glows with silk lanterns.', 'Chùa Cầu ở Hội An là cây cầu có mái che khoảng 400 năm tuổi. Ban đêm, phố cổ lung linh đèn lồng.'] },
  { id: 'longbien', icon: '🌉', ...at('longbien'), name: () => T('Long Biên Bridge', 'Cầu Long Biên'), fact: ['Long Biên Bridge in Hà Nội is more than 120 years old. Trains, bicycles and motorbikes cross the Red River on its long steel frame.', 'Cầu Long Biên ở Hà Nội đã hơn 120 tuổi. Tàu hoả, xe đạp và xe máy đi qua sông Hồng trên khung thép dài của cầu.'] },
  { id: 'princes', icon: '🌉', ...at('princes'), name: () => T('Princes Bridge', 'Cầu Princes'), fact: ['Princes Bridge in Melbourne crosses the Yarra River on three big stone arches. Trams rattle over it every day.', 'Cầu Princes ở Melbourne bắc qua sông Yarra bằng ba vòm đá lớn. Ngày nào tàu điện cũng chạy lách cách qua cầu.'] },
  { id: 'benthanh', icon: '🕰️', ...at('benthanh'), name: () => T('Bến Thành Clock Tower', 'Tháp Đồng Hồ Chợ Bến Thành'), fact: ['Chợ Bến Thành in Sài Gòn is famous for its clock tower. Inside you can find almost anything to eat!', 'Chợ Bến Thành ở Sài Gòn nổi tiếng với tháp đồng hồ. Bên trong có gần như đủ món ngon!'] }
];

export function createRegions(G) {
  const { scene, world } = G, mat = toonVC();
  const put = (geo, x, z, rot = 0, dy = 0) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, heightAt(x, z) + dy, z); m.rotation.y = rot; m.castShadow = m.receiveShadow = true; scene.add(m); return m; };
  const box = (x0, x1, z0, z1) => world.boxes.push({ x0, x1, z0, z1 });
  // the solid box round a footprint w × d (w along the street) turned to face `face`
  const boxAround = (x, z, w, d, face) => { const hx = Math.abs(Math.cos(face)) * w / 2 + Math.abs(Math.sin(face)) * d / 2, hz = Math.abs(Math.sin(face)) * w / 2 + Math.abs(Math.cos(face)) * d / 2; box(x - hx, x + hx, z - hz, z + hz); };
  const signAt = (text, x, y, z, rot = 0, bg, fg, w, h) => { const s = signMesh(text, bg, fg, w, h); s.position.set(x, heightAt(x, z) + y, z); s.rotation.y = rot; scene.add(s); return s; };
  const people = [];
  const person = (look, x, z, face) => { const A = buildAvatar(look, null); A.root.position.set(x, heightAt(x, z), z); A.root.rotation.y = face; scene.add(A.root); people.push(A); world.colliders.push({ x, z, r: .4 }); return A; };
  const I = (id, x, z, r, icon, label, act) => G.interactables.push({ id, x, z, r, icon, label, act, bubble: icon });

  // ================= Chợ Ba Miền =================
  const M = MARKET, mz = M.roadZ;
  { const g = [];
    g.push(P(Box(M.x1 - M.x0, .05, 8), '#d8cfbc', [(M.x0 + M.x1) / 2, .03, mz]));
    for (let x = M.x0 + 1; x < M.x1; x += 2) g.push(P(Box(.05, .06, 8), '#c4b9a2', [x, .035, mz]));
    const road = new THREE.Mesh(merge(g), mat); road.position.y = M.h; road.receiveShadow = true; scene.add(road); }
  // region banners across the street
  [[['THE NORTH · HÀ NỘI', 'MIỀN BẮC · HÀ NỘI'], M.x - 15, '#c0392b'], [['THE CENTRE · HUẾ · HỘI AN', 'MIỀN TRUNG · HUẾ · HỘI AN'], M.x, '#7a4aa8'], [['THE SOUTH · SÀI GÒN · BÀ RỊA', 'MIỀN NAM · SÀI GÒN · BÀ RỊA'], M.x + 16, '#2f7ac8']].forEach(([t, x, c]) => {
    const posts = merge([P(Box(.2, 5, .2), '#6b4a32', [0, 2.5, -4.6]), P(Box(.2, 5, .2), '#6b4a32', [0, 2.5, 4.6])]); put(posts, x, mz);
    signAt(t, x, 4.6, mz, Math.PI / 2, c, '#fff8e0', 8.6, 1.1);
    world.colliders.push({ x, z: mz - 4.6, r: .3 }, { x, z: mz + 4.6, r: .3 });
  });
  // the entrance gate on the west
  { const p = [P(Box(1, 6, 1), '#c0392b', [0, 3, -4.8]), P(Box(1, 6, 1), '#c0392b', [0, 3, 4.8]), P(Box(1.4, .5, 11.4), '#e8c03a', [0, 6.2, 0]), P(Box(1.8, .3, 12.4), '#a24e3a', [0, 6.6, 0])];
    put(merge(p), M.x0 + .5, mz).userData.noCam = true; signAt(['THREE REGIONS MARKET', 'CHỢ BA MIỀN'], M.x0 - .1, 5.3, mz, -Math.PI / 2, '#c0392b', '#ffe08a', 7, 1.2);
    world.colliders.push({ x: M.x0 + .5, z: mz - 4.8, r: .7 }, { x: M.x0 + .5, z: mz + 4.8, r: .7 }); }
  // lanterns along the central (Hội An) section
  for (let k = 0; k < 14; k++) { const l = sprite('🏮', .7); l.position.set(M.x - 7 + k, M.h + 4.3 - Math.sin(k / 13 * Math.PI) * .6, mz + (k % 2 ? 1.2 : -1.2)); scene.add(l); }

  // ---- landmarks inside the market ----
  // Tháp Rùa (Turtle Tower) on its little island in Hồ Gươm by Hà Nội (round T2: the real lake, js/content/map.js)
  const pond = (cx, cz, w, d) => { put(merge([P(Box(w + .8, .3, d + .8), '#b9b09c', [0, .15, 0]), P(Box(w, .32, d), '#5f9fb0', [0, .17, 0])]), cx, cz); box(cx - w / 2 - .4, cx + w / 2 + .4, cz - d / 2 - .4, cz + d / 2 + .4); };
  const TURTLE = landmarkAt('turtle'), PILLAR = landmarkAt('onepillar');
  world.colliders.push({ x: TURTLE[0], z: TURTLE[1], r: 2.6 }); // (the island itself is in the map: js/content/map.js, Hồ Gươm's islet)
  put(merge([P(Box(1.6, 1.2, 1.6), '#d8cdb6', [0, .8, 0]), P(Box(1.3, 1, 1.3), '#d8cdb6', [0, 1.9, 0]), P(Box(1, .9, 1), '#d8cdb6', [0, 2.85, 0]), P(new THREE.ConeGeometry(.9, .7, 4), '#8a7a5a', [0, 3.6, 0], [0, Math.PI / 4, 0]),
    P(new THREE.SphereGeometry(.6, 8, 6), '#3f7d5c', [-1.6, .3, .5], [0, 0, 0], [1.4, .4, 1]), P(Box(.35, .7, .05), '#5a4a3a', [0, 1.9, .66])]), ...TURTLE);
  // Chùa Một Cột (One Pillar Pagoda) on its own little pond
  pond(...PILLAR, 4.4, 4.4);
  put(merge([P(Cyl(.25, .3, 1.8, 8), '#cfc3a6', [0, 1, 0]), P(Box(1.9, .2, 1.9), '#8a5a3b', [0, 1.95, 0]), P(Box(1.5, 1, 1.5), '#a24e3a', [0, 2.5, 0]),
    P(new THREE.ConeGeometry(1.6, .9, 4), '#5a4a3a', [0, 3.4, 0], [0, Math.PI / 4, 0]), ...[0, 1, 2, 3].map(k => P(new THREE.ConeGeometry(.12, .5, 4), '#5a4a3a', [Math.cos(k * 1.571 + .785) * 1.1, 3.1, Math.sin(k * 1.571 + .785) * 1.1], [0, 0, 0]))]), ...PILLAR);
  // (Chùa Cầu is the real covered footbridge over the Hội An canal now: js/world.js builds it from the map's bridges)
  // Bến Thành clock tower on the east end
  { const p = [P(Box(3, 6, 10), '#f2e6c2', [0, 3, 0]), P(Box(2.4, 3, 2.4), '#f2e6c2', [0, 7.5, 0]), P(new THREE.ConeGeometry(1.8, 1.4, 4), '#a24e3a', [0, 9.7, 0], [0, Math.PI / 4, 0]),
      P(Cyl(.8, .8, .1, 16), '#ffffff', [-1.22, 7.6, 0], [0, 0, Math.PI / 2]), P(Box(.05, .6, .08), '#333', [-1.3, 7.75, 0]), P(Box(.05, .08, .45), '#333', [-1.3, 7.6, .15]),
      ...[-3, 0, 3].map(z => P(new THREE.TorusGeometry(.9, .12, 4, 10, Math.PI), '#d8b86a', [-1.52, 2.2, z], [0, Math.PI / 2, 0]))];
    put(merge(p), M.x1 + 1.8, mz - 4, 0); box(M.x1 + .3, M.x1 + 3.3, mz - 9, mz + 1);
    signAt(['BẾN THÀNH MARKET', 'CHỢ BẾN THÀNH'], M.x1 + .25, 5.2, mz - 4, -Math.PI / 2, '#2f7ac8', '#ffffff', 5, .8); }

  // ---- market stalls and vendors ----
  // (T1b) each stall in its slot of the market row (js/content/map.js), its seller behind the counter (js/vendors.js)
  for (const v of VENDORS.filter(v => v.region !== 'au')) {
    const s = rowSlot(v.row.place, v.row.i, v.row.d), f = (k, n) => [s.x + s.fx * k + s.ax * n, s.z + s.fz * k + s.az * n];
    if (v.stall) {
      put(stall(v.stall[0], v.stall[1], 2.8), s.x, s.z, s.face);
      const [nx, nz] = f(1.15, 0); signAt(v.sign, nx, 3.2, nz, s.face, v.stall[0], '#fff8e0', 2.8, .55);
      v.goods.forEach((gd, k) => { const sp = sprite(gd, .55), [gx, gz] = f(0, -.6 + k * 1.2); sp.position.set(gx, M.h + 1.25, gz); scene.add(sp); });
      boxAround(s.x, s.z, 2.8, 1.6, s.face);
      world.stalls.push({ id: v.id, place: 'market', kind: 'stall', x: s.x, z: s.z, w: 2.8, d: 1.6, face: s.face, tap: 'v_' + v.id });
    } else if (v.pole) world.stalls.push({ id: v.id, place: 'market', kind: 'pole', x: s.x, z: s.z, w: .8, d: 2.4, face: s.face, tap: 'v_' + v.id });
    const A = person(v.look, v.x, v.z, v.face);
    if (v.pole) { // gánh hàng rong: a bamboo pole with two baskets on her shoulder
      const pole = new THREE.Mesh(merge([P(Box(2.4, .07, .07), '#c9a35a', [0, 0, 0]), ...[-1.1, 1.1].flatMap(x => [P(Cyl(.32, .25, .35, 10), '#b98a4a', [x, -.75, 0]), P(new THREE.SphereGeometry(.26, 8, 5), '#7fc45a', [x, -.55, 0], [0, 0, 0], [1, .5, 1]), P(Box(.02, .6, .02), '#7a5a3a', [x, -.3, 0])])]), mat);
      pole.position.set(0, 1.18, .02); A.root.add(pole);
    }
    tag(scene, v.name, v.x, M.h + 2.5, v.z);
    const [tx, tz] = f(v.row.d / 2 + .75, 0); I('v_' + v.id, tx, tz, 3, v.food[0], () => nm(v.name), h => vendorTalk(G, h, v));
  }

  // ================= Aussie Corner =================
  const A = AUSSIE, az = A.roadZ;
  { const g = [], L2 = A.x1 - A.x0, cx = (A.x0 + A.x1) / 2;
    g.push(P(Box(L2, .06, 7), '#b4b9bc', [cx, .03, az]), P(Box(L2, .07, 3), '#e8d5a8', [cx, .035, az - 5]), P(Box(L2, .07, 3), '#e8d5a8', [cx, .035, az + 5]));
    g.push(P(Box(L2, .08, .16), '#f6f1e4', [cx, .05, az - 3.2]), P(Box(L2, .08, .16), '#f6f1e4', [cx, .05, az + 3.2]));
    for (let x = A.x0 + 2; x < A.x1 - 2; x += 4) g.push(P(Box(1.8, .08, .16), '#f6f1e4', [x, .05, az]));
    // a "wombat crossing" (raised zebra crossing)
    for (let k = -3; k <= 3; k++) g.push(P(Box(.6, .1, 5.6), '#f6f1e4', [A.x - 4 + k * 1.1, .06, az]));
    const road = new THREE.Mesh(merge(g), mat); road.position.y = A.h; road.receiveShadow = true; scene.add(road); }
  // shops along the north side (fronts face the road)
  const shop = (x, w, wall, awn, text, signBg) => {
    const d = 8, p = [], front = az - 6.6, cz = front - d / 2;
    p.push(P(Box(w, 4.2, d), wall, [0, 2.1, 0]), P(Box(w + .2, .7, d + .2), '#f4efe2', [0, 4.45, 0]));
    p.push(P(Box(w - 1.6, 2.2, .1), '#9fd2ee', [-.6, 1.6, d / 2 + .03]), P(Box(1, 2.2, .1), '#6a4a3a', [w / 2 - 1, 1.1, d / 2 + .03]));
    p.push(P(Box(w, .12, 2.4), awn, [0, 3.1, d / 2 + 1.1], [.22, 0, 0]));
    [-1, 1].forEach(sx => p.push(P(Box(.12, 3, .12), '#f4efe2', [sx * (w / 2 - .2), 1.5, d / 2 + 2.2])));
    put(merge(p), x, cz); box(x - w / 2, x + w / 2, cz - d / 2, cz + d / 2);
    world.colliders.push({ x: x - w / 2 + .2, z: front + 2.2, r: .25 }, { x: x + w / 2 - .2, z: front + 2.2, r: .25 });
    signAt(text, x, 3.9, front + .05, 0, signBg, '#ffffff', w - .8, .9);
  };
  shop(A.x - 19, 8.5, '#f2e6c2', '#d9483a', ['MILK BAR · LOLLIES', 'TIỆM TẠP HÓA · KẸO'], '#d9483a');
  shop(A.x - 9, 8.5, '#cfe0e6', '#2f7ac8', ['FISH & CHIPS', 'CÁ & KHOAI CHIÊN'], '#2f7ac8');
  shop(A.x + 1, 8, '#f6d6b8', '#e8a33a', ['BAKERY · PIES', 'TIỆM BÁNH · BÁNH PIE'], '#a24e3a');
  // the Big Banana: a banana-smoothie shop wearing a giant banana
  { const p = [P(Box(7, 3.4, 6), '#fff3c4', [0, 1.7, 0]), P(Box(7.2, .4, 6.2), '#e8c03a', [0, 3.6, 0])];
    for (let k = 0; k <= 10; k++) { const a = -1.1 + k * .22, r = 6; p.push(P(new THREE.SphereGeometry(1.35 - Math.abs(k - 5) * .1, 10, 8), k === 0 || k === 10 ? '#6b5a2a' : '#f2d23a', [Math.sin(a) * r, 4.2 + Math.cos(a) * r - r + 3.2, 0])); }
    put(merge(p), A.x + 12, az - 8); box(A.x + 8.5, A.x + 15.5, az - 11, az - 5); signAt(['THE BIG BANANA', 'QUẢ CHUỐI KHỔNG LỒ'], A.x + 12, 2.9, az - 4.95, 0, '#e8c03a', '#5a3a1a', 5, .8); }
  // the ice-cream van
  const van = new THREE.Group();
  { const p = [P(Box(5, 2.2, 2.2), '#f7c6d9', [0, 1.5, 0]), P(Box(5.02, .5, 2.22), '#ffffff', [0, 2.4, 0]), P(Box(1.4, 1.5, 2.1), '#f7c6d9', [3.1, 1.15, 0]), P(Box(.05, .8, 1.8), '#9fd2ee', [3.82, 1.5, 0]),
      P(Box(2, 1, .05), '#3a3030', [-.4, 1.7, 1.12]), P(Box(2.2, .1, .5), '#ffffff', [-.4, 1.15, 1.3]),
      ...[[-1.6, 1], [-1.6, -1], [2.8, 1], [2.8, -1]].map(([x, z]) => P(Cyl(.42, .42, .25, 12), '#2f3336', [x, .42, z * 1.05], [Math.PI / 2, 0, 0])),
      P(new THREE.ConeGeometry(.5, 1.2, 10), '#e8b36a', [-.5, 3.3, 0], [Math.PI, 0, 0]), P(new THREE.SphereGeometry(.55, 10, 8), '#ffe0ec', [-.5, 4.1, 0]), P(new THREE.SphereGeometry(.2, 8, 6), '#e8433a', [-.5, 4.65, 0])];
    van.add(new THREE.Mesh(merge(p), mat));
    // (T1b) parked in its own bay in the market row, its hatch to the street: a paved bay from the kerb to its back
    const V = VENDORS.find(v => v.id === 'gazza').row, s = rowSlot(V.place, V.i, V.d), W2 = 6.4, d2 = V.d + STALL.road;
    van.position.set(s.x - Math.cos(s.face) * .66, A.h, s.z + Math.sin(s.face) * .66); van.rotation.y = s.face; scene.add(van); boxAround(s.x, s.z, W2, V.d, s.face);
    put(new THREE.BoxGeometry(W2 + .6, .06, d2).translate(0, .04, 0), s.x + s.fx * (STALL.road / 2), s.z + s.fz * (STALL.road / 2), s.face).material = toon('#c3c7c9');
    world.stalls.push({ id: 'gazza', place: 'aussie', kind: 'van', x: s.x, z: s.z, w: W2, d: V.d, face: s.face, tap: 'v_gazza' }); }
  // sausage sizzle tent with a barbie
  { const p = [P(Box(2.4, .9, 1.2), '#4a4a4a', [0, .45, 0]), P(Box(2.2, .06, 1), '#2a2a2a', [0, .93, 0]), ...[-.6, -.2, .2, .6].map(x => P(Cyl(.08, .08, .9, 6), '#b5483c', [x, 1, .1], [0, 0, Math.PI / 2])),
      ...[[-1.6, -1.4], [1.6, -1.4], [-1.6, 1.4], [1.6, 1.4]].map(([x, z]) => P(Box(.08, 2.6, .08), '#dddddd', [x, 1.3, z])), P(Box(3.4, .1, 3), '#2f7ac8', [0, 2.6, 0]), P(new THREE.ConeGeometry(2.4, .7, 4), '#ffffff', [0, 3, 0], [0, Math.PI / 4, 0])];
    const R = VENDORS.find(v => v.id === 'robbo').row, s = rowSlot(R.place, R.i, R.d);   // (T1b) in the market row, facing the street
    put(merge(p), s.x, s.z, s.face); boxAround(s.x, s.z, 2.6, 1.4, s.face); world.stalls.push({ id: 'robbo', place: 'aussie', kind: 'tent', x: s.x, z: s.z, w: 3.4, d: 3, face: s.face, tap: 'v_robbo' }); const smoke = sprite('💨', .8); smoke.position.set(s.x, A.h + 1.6, s.z); scene.add(smoke); world.updaters.push((dt, t) => { smoke.position.y = A.h + 1.5 + (t * .6 % 1); smoke.material.opacity = 1 - (t * .6 % 1); }); }

  // the playground: flying fox, merry-go-round, see-saw
  const play = [];
  play.push(P(Box(20, .05, 16), '#c9a77a', [0, .03, 0]));
  [-9, 9].forEach(x => play.push(P(Box(.25, 4.6, .25), '#2f7ac8', [x, 2.3, -.6], [0, 0, x < 0 ? .12 : -.12]), P(Box(.25, 4.6, .25), '#2f7ac8', [x, 2.3, .6], [0, 0, x < 0 ? .12 : -.12])));
  play.push(P(Cyl(.03, .03, 18, 4), '#555', [0, 4.1, 0], [0, 0, Math.PI / 2]));
  play.push(P(Cyl(1.6, 1.6, .2, 18), '#e8433a', [-3, .45, 5]));
  play.push(P(Box(4, .12, .4), '#ffd23f', [4, .7, 5]), P(new THREE.ConeGeometry(.3, .6, 4), '#555', [4, .3, 5]));
  put(merge(play), A.x - 13, az + 18);
  world.colliders.push({ x: A.x - 22, z: az + 18, r: .5 }, { x: A.x - 4, z: az + 18, r: .5 }, { x: A.x - 16, z: az + 23, r: 1.7 }, { x: A.x - 9, z: az + 23, r: 1.2 });
  const trolley = new THREE.Mesh(merge([P(Box(.4, .3, .3), '#333', [0, 0, 0]), P(Box(.06, 1.8, .06), '#555', [0, -1, 0]), P(Cyl(.35, .35, .12, 12), '#ffd23f', [0, -1.95, 0])]), mat);
  scene.add(trolley);
  const merry = new THREE.Mesh(merge([0, 1, 2, 3].map(k => P(Box(.08, .9, .08), '#ffffff', [Math.cos(k * 1.57) * 1.2, .9, Math.sin(k * 1.57) * 1.2]))), mat); merry.position.set(A.x - 16, A.h, az + 23); scene.add(merry);
  const seesaw = new THREE.Mesh(merge([P(Box(4, .12, .4), '#ffd23f', [0, 0, 0])]), mat); seesaw.position.set(A.x - 9, A.h + .7, az + 23); scene.add(seesaw);
  const kid = buildAvatar(L('shirt', '#e8433a', '#c98b4a', 'short', 'cap', '#ffe3d1'), null); scene.add(kid.root); kid.armL.rotation.x = kid.armR.rotation.x = -2.8;
  // cricket pitch
  { const p = [P(Box(2.4, .04, 12), '#d9c48a', [0, .02, 0])];
    for (const z of [-5.4, 5.4]) for (const x of [-.2, 0, .2]) p.push(P(Cyl(.03, .03, .8, 5), '#f4efe2', [x, .4, z]));
    p.push(P(Box(.12, 1, .3), '#e8c69a', [.7, .5, 4.6], [0, 0, .3]));
    put(merge(p), A.x + 15, az + 18); }
  // a gum tree with a koala, and kangaroos hopping on the edge of the oval
  { const t = [P(Cyl(.25, .4, 6, 6), '#e9e1d2', [0, 3, 0]), P(new THREE.IcosahedronGeometry(1.8, 0), '#7f9a6a', [0, 6.8, 0], [0, 0, 0], [1.3, .7, 1.3]), P(new THREE.IcosahedronGeometry(1.3, 0), '#8aa676', [1.3, 6, .4], [0, 0, 0], [1.2, .7, 1.2])];
    put(merge(t), A.x + 17, az + 24); world.colliders.push({ x: A.x + 17, z: az + 24, r: .5 }); // (round T: inside the corner, clear of the ring road)
    const koala = sprite('🐨', 1.1); koala.position.set(A.x + 17.4, heightAt(A.x + 17, az + 24) + 4.6, az + 24.3); scene.add(koala); }
  const roos = [0, 1, 2].map(k => { const s = sprite('🦘', 1.6); scene.add(s); return { s, a: k * 2.1 }; });

  // shopkeepers
  for (const v of VENDORS.filter(v => v.region === 'au')) {
    person(v.look, v.x, v.z, v.face);
    if (!v.row) world.stalls.push({ id: v.id, place: 'aussie', kind: 'shop', x: v.x, z: v.z, w: .8, d: .8, face: v.face, tap: 'v_' + v.id });
    tag(scene, v.name, v.x, A.h + (v.id === 'gazza' ? 2.9 : 2.5), v.z);
    // (T1b) the spot a child taps is just in front of the seller (Uncle Robbo: in front of his tent), on the footpath, never on the road
    const ahead = v.id === 'robbo' ? 3.85 : v.row ? 1.6 : 1;
    I('v_' + v.id, v.x + Math.sin(v.face) * ahead, v.z + Math.cos(v.face) * ahead, 3, v.food[0], () => nm(v.name), h => vendorTalk(G, h, v));
  }

  // ---- kids and grown-ups who host the folk games ----
  const HOSTS = [
    // (T1b) the market's game hosts stand on the south side, across the street from its market row
    ['datnieu', 'Bông', L('dress', '#ff7eb8', '#1d1412', 'buns'), M.x - 4, mz + 7.5, Math.PI, ['Đập niêu! I will blindfold you, and we all shout where the pot is!', 'Đập niêu nè! Tớ bịt mắt bạn, cả nhóm sẽ hô cho bạn biết niêu ở đâu!']],
    ['chichi', 'Bà Năm', L('aodai', '#5b7fbf', '#d8d8d8', 'buns'), M.x + 7, mz + 8.5, Math.PI, ['Come, grandchild. Put your finger in my hand: chi chi chành chành!', 'Lại đây cháu. Đặt ngón tay vào tay bà nào: chi chi chành chành!']],
    ['words', 'Cô Hạnh', L('aodai', '#ffffff', '#1d1412', 'long'), M.x - 21, mz + 4.6, Math.PI, ['I am a teacher. Did you know a bowl is "bát" in the north and "chén" in the south? Want to learn more?', 'Cô là cô giáo. Con có biết miền Bắc gọi là "bát", miền Nam gọi là "chén" không? Học thêm nhé?']],
    ['sackrace', 'Noah', L('overalls', '#2f7ac8', '#e8c26a', 'short', 'cap', '#ffe3d1'), A.x - 20, az + 10.5, Math.PI, ['Sack race! Like at our school sports day. Ready, set, hop!', 'Đua nhảy bao bố! Giống ngày hội thể thao ở trường tớ. Chuẩn bị, nhảy!']],
    ['parcel', 'Chloe', L('dress', '#ffd23f', '#a8432a', 'long', 'bow', '#ffe3d1'), A.x, az + 23, -1.4, ["It's my birthday party! Let's play pass the parcel!", 'Hôm nay sinh nhật tớ! Chơi chuyền quà đi!']],
    ['cricket', 'Liam', L('shirt', '#ffffff', '#6b4226', 'short', 'cap', '#ffe3d1'), A.x + 16.5, az + 24.5, Math.PI, ["Fancy a hit of backyard cricket, mate? You bat first!", 'Chơi cricket sân sau không bạn? Bạn đánh trước nhé!']]
  ];
  for (const [game, name, look, x, z, face, line] of HOSTS) {
    const pA = person(look, x, z, face); tag(scene, name, x, heightAt(x, z) + 2.5, z); if (G.hostChat && pA) G.hostChat(pA, game);
    I('g_' + game, x, z + (Math.abs(face) > 1 ? -2 : 2), 3, G.GAMES_ICON ? G.GAMES_ICON(game) : '🎮', () => nm(name), h => G.kidTalk(h, game, name, line));
  }
  // party decorations and hanging pots
  { const t = [P(Box(2.4, .1, 1.2), '#ffffff', [0, .8, 0]), ...[[-1, -.5], [1, -.5], [-1, .5], [1, .5]].map(([x, z]) => P(Box(.08, .8, .08), '#dddddd', [x, .4, z]))];
    put(merge(t), A.x - 2, az + 23); world.colliders.push({ x: A.x - 2, z: az + 23, r: 1.2 }); ['🎈', '🎂', '🎁'].forEach((e, k) => { const sp = sprite(e, .7); sp.position.set(A.x - 2.8 + k * .8, A.h + 1.2 + (k === 0 ? .8 : 0), az + 23); scene.add(sp); }); }
  { const t = [P(Box(.15, 3.2, .15), '#6b4a32', [-2.5, 1.6, 0]), P(Box(.15, 3.2, .15), '#6b4a32', [2.5, 1.6, 0]), P(Box(5.2, .12, .12), '#6b4a32', [0, 3.2, 0])];
    for (let k = 0; k < 4; k++) t.push(P(Cyl(.02, .02, .7, 3), '#a08060', [-1.8 + k * 1.2, 2.85, 0]), P(new THREE.SphereGeometry(.32, 8, 6), '#a0603a', [-1.8 + k * 1.2, 2.35, 0], [0, 0, 0], [1, .85, 1]));
    put(merge(t), M.x - 4, mz + 10); world.colliders.push({ x: M.x - 6.5, z: mz + 10, r: .3 }, { x: M.x - 1.5, z: mz + 10, r: .3 }); }

  // ================= landmarks in the wider valley =================
  const [ox, oz] = landmarkAt('opera'), [bx, bz] = landmarkAt('bondi'), [hx, hz] = landmarkAt('lighthouse');
  // Sydney Opera House on the lake's east beach, looking over the water like Bennelong Point
  { const p = [P(Box(16, 1.6, 10), '#cdb89a', [0, .8, 0]), P(Box(16, .3, 2), '#d9c9aa', [0, .15, 6])];
    const sail = (x, z, s, rot) => { p.push(P(new THREE.ConeGeometry(2.4 * s, 5 * s, 12, 1, true, 0, Math.PI), '#f4f1ea', [x, 1.6 + 2.2 * s, z], [-.35, rot, 0])); };
    sail(-4.5, 1, 1.15, 0); sail(-2, .8, 1, 0); sail(.2, .6, .8, 0); sail(3.5, 0, 1, Math.PI); sail(5.6, .2, .8, Math.PI);
    put(merge(p), ox, oz, -Math.PI / 2); world.colliders.push({ x: ox, z: oz, r: 6.5 }); }
  // lifesavers' tower and the red-and-yellow flags
  { const p = [...[[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([x, z]) => P(Box(.15, 3, .15), '#dddddd', [x, 1.5, z])), P(Box(2.6, 1.6, 2.6), '#ffffff', [0, 3.8, 0]), P(Box(2.7, .4, 2.7), '#2f7ac8', [0, 4.4, 0]),
      ...[-6, 6].flatMap(x => [P(Box(.06, 2.4, .06), '#888', [x, 1.2, 4]), P(Box(.8, .3, .04), '#e8433a', [x + .4, 2.2, 4]), P(Box(.8, .3, .04), '#ffd23f', [x + .4, 1.9, 4])])];
    put(merge(p), bx, bz); world.colliders.push({ x: bx, z: bz, r: 1.6 }); }
  // Vũng Tàu lighthouse on the hill
  { const p = [P(Cyl(1.3, 1.7, 8, 12), '#ffffff', [0, 4, 0]), P(Cyl(1.5, 1.5, .3, 12), '#cfd6da', [0, 8.1, 0]), P(Cyl(.9, .9, 1.4, 10), '#ffe9a0', [0, 8.9, 0]), P(new THREE.ConeGeometry(1.2, 1.2, 10), '#c0392b', [0, 10.2, 0]), P(Box(4, 1.8, 3), '#f2e6c2', [2.6, .9, 0])];
    put(merge(p), hx, hz); world.colliders.push({ x: hx, z: hz, r: 1.8 }, { x: hx + 2.6, z: hz, r: 1.8 });
    const beam = new THREE.Mesh(new THREE.ConeGeometry(2.5, 30, 12, 1, true), new THREE.MeshBasicMaterial({ color: '#fff3b0', transparent: true, opacity: .18, depthWrite: false, side: THREE.DoubleSide }));
    beam.geometry.translate(0, -15, 0); beam.geometry.rotateZ(Math.PI / 2); const piv = new THREE.Group(); piv.position.set(hx, heightAt(hx, hz) + 8.9, hz); piv.add(beam); scene.add(piv);
    world.updaters.push((dt, t) => { piv.rotation.y = t * .8; beam.visible = world.isNight(); }); }
  // Uluru in the far south-west
  { const p = [P(new THREE.SphereGeometry(1, 18, 10, 0, Math.PI * 2, 0, Math.PI / 2), '#c4542e', [0, -.5, 0], [0, 0, 0], [30, 11, 13])];
    for (let k = 0; k < 9; k++) p.push(P(Box(.6, 6, 1.5), '#a8442a', [-20 + k * 5, 3, 12.2 - Math.abs(k - 4) * .9]));
    put(merge(p), ULURU.x, ULURU.z, .2); box(ULURU.x - 28, ULURU.x + 28, ULURU.z - 10, ULURU.z + 10); }
  // the Harbour Bridge already carries the road: just add its postcard below

  // Children must not be able to walk inside a landmark (the camera would end up inside its walls), and
  // the postcard spot stands outside on open ground, where the whole building can be seen.
  box(ox - 7, ox + 5, oz - 8, oz + 8); box(bx - 6, bx + 7, bz - 1, bz + 4); // the Opera House and the lifesavers' tower
  const OUT = { opera: 11, bondi: 8, lighthouse: 6.5, banana: 8.5, turtle: 10, onepillar: 6.5, chuacau: 7, benthanh: 8 };
  const clear = (x, z) => heightAt(x, z) > WATER + .4 && world.boxes.every(b => x < b.x0 - .8 || x > b.x1 + .8 || z < b.z0 - .8 || z > b.z1 + .8) && world.colliders.every(c => Math.hypot(c.x - x, c.z - z) > c.r + .8);
  for (const lm of LANDMARKS) {
    if (lm.id === 'uluru') { lm.mx = ULURU.x; lm.mz = ULURU.z; }
    else if (BRIDGES.some(B => B.landmark === lm.id)) { const B = BRIDGES.find(B => B.landmark === lm.id); lm.mx = lm.x; lm.mz = lm.z; // (round T2) on land by the bridge's far end, beside the road, not down in the river
      const u = B.a1 + 3, v = B.w / 2 + 2.6; [lm.x, lm.z] = B.axis === 'z' ? [B.c + v, u] : [u, B.c + v]; }
    else if (OUT[lm.id]) {
      const a0 = Math.atan2(-lm.z, -lm.x); // start looking on the side facing the middle of the valley
      for (let r = OUT[lm.id]; r < OUT[lm.id] + 8; r += 2) {
        let ok = null; for (let k = 0; k < 24 && !ok; k++) { const a = a0 + (k % 2 ? 1 : -1) * Math.ceil(k / 2) * Math.PI / 12, x = lm.x + Math.cos(a) * r, z = lm.z + Math.sin(a) * r; if (clear(x, z)) ok = [x, z]; }
        if (ok) { lm.mx = lm.x; lm.mz = lm.z; [lm.x, lm.z] = ok; break; }
      }
    }
    I('pc_' + lm.id, lm.x, lm.z, lm.id === 'uluru' ? 5 : 3.4, '📮', () => T('Postcard: ', 'Bưu thiếp: ') + lm.name(), h => postcard(G, h, lm));
  }

  // ---------- life ----------
  let jingleT = 5;
  world.updaters.push((dt, t) => {
    const near = (x, z, r) => G.heroes.some(h => dist2(h.pos.x, h.pos.z, x, z) < r);
    if (near(A.x, az + 7, 60)) {
      const k = (Math.sin(t * .5) + 1) / 2; trolley.position.set(A.x - 21.6 + k * 17.2, A.h + 4 - Math.sin(k * Math.PI) * .2, az + 18);
      kid.root.position.set(trolley.position.x, trolley.position.y - 3.4, az + 18); kid.root.rotation.y = Math.cos(t * .5) > 0 ? Math.PI / 2 : -Math.PI / 2;
      merry.rotation.y = t * 1.2; seesaw.rotation.z = Math.sin(t * 1.6) * .25;
      roos.forEach((r, k) => { const a = t * .25 + r.a; r.s.position.set(A.x + 15 + Math.cos(a) * 9, A.h + .8 + Math.abs(Math.sin(t * 4 + k)) * .9, az + 18 + Math.sin(a) * 6); });
      jingleT -= dt;
      if (jingleT < 0 && near(A.x + 14, az + 4, 26)) { jingleT = 22; [659, 587, 523, 587, 659, 659, 659].forEach((f, i) => setTimeout(() => tone(f, .22, { type: 'triangle', vol: .12 }), i * 230)); }
    }
  });
  people.forEach((P2, k) => world.updaters.push((dt, t) => { if (P2.armR) P2.armR.rotation.x = Math.sin(t * 1.5 + k) * .25; }));

  // villagers you can chat with
  for (const v of VENDORS) PERSONAS[v.id] = {
    emoji: v.food[0], name: v.name, age: ['old enough to know the best food in town', 'đủ lớn để biết món nào ngon nhất'],
    about: [v.greet[0], v.greet[1]], likes: [`Making ${v.food[1]} for hungry kids!`, `Làm ${v.food[2]} cho các bạn nhỏ đói bụng!`], mood: v.region === 'au' ? ["Good as gold, mate!", 'Khỏe re, bạn ơi!'] : v.region === 'trung' ? ['Very well, thank you!', 'Khỏe lắm, cảm ơn mi!'] : v.region === 'nam' ? ['Great, thanks!', 'Khỏe re nè con!'] : ['I am very well, thank you, dear!', 'Bà khỏe, cảm ơn cháu!'],
    role: v.role, region: v.region
  };
}

// ---------- talking to a vendor: buy something, or learn a word from their home ----------
async function vendorTalk(G, h, v) {
  const p = h.profile;
  const k = await dialog(v.name, [greetLine(h, v)], [[`${v.food[0]} Buy ${v.food[1]} (${G.fmt(v.food[3])})`, `${v.food[0]} Mua ${v.food[2]} (${G.fmt(v.food[3])})`], ['🗣️ Teach me a word!', '🗣️ Dạy con một từ!'], ['👋 Bye', '👋 Tạm biệt']]);
  if (k === 0) {
    await buyFood(G, h, v, ["Here, this one's on me!", 'Thôi, lần này cho con đó!']);
  }
  if (k === 1) {
    p.words = p.words || {};
    if (v.region === 'au') {
      const left = AUSSIE_SLANG.filter(s => !p.words['au:' + s[0]]), s = left.length ? left[0] : pick(AUSSIE_SLANG);
      p.words['au:' + s[0]] = true; G.save();
      await dialog(v.name, [[`"${s[0]}" means ${s[1].toLowerCase()}! Like this: ${s[4]}`, `"${s[0]}" nghĩa là ${s[2].toLowerCase()}! Ví dụ: ${s[4]}`]]);
      await reward(s[3], `📖 ${s[0]}`, T(`Aussie slang: ${s[1]}`, `Tiếng lóng Úc: ${s[2]}`));
    } else if (Object.keys(p.words).filter(k => k.startsWith('vs:')).length < Object.keys(p.words).filter(k => k.startsWith('vn:')).length) {
      // every other time: a slang word or saying instead of a north / centre / south word
      const left = VN_SLANG.filter(s => !p.words['vs:' + s[0]]), s = left.length ? left[0] : pick(VN_SLANG);
      p.words['vs:' + s[0]] = true; G.save();
      await dialog(v.name, [[`Here's a fun saying: "${s[0]}" means ${s[1].toLowerCase()} Like this: ${s[4]}`, `Học câu này nè: "${s[0]}" nghĩa là ${s[2].toLowerCase()}. Ví dụ: ${s[4]}`]]);
      await reward(s[3], `📖 ${s[0]}`, T(`Vietnamese slang: ${s[1]}`, `Tiếng lóng Việt: ${s[2]}`));
    } else {
      const col = { bac: 2, trung: 3, nam: 4 }[v.region], left = VN_WORDS.filter(w => !p.words['vn:' + w[1]]), w = left.length ? left[0] : pick(VN_WORDS);
      p.words['vn:' + w[1]] = true; G.save();
      const here = w[col], rn = REGION_NAME[v.region];
      await dialog(v.name, [[`Here in the ${rn[0].toLowerCase()} we say "${here}" for ${w[1]}. In the north it's "${w[2]}", in the centre "${w[3]}", and in the south "${w[4]}"!`, `Ở ${rn[1].toLowerCase()} gọi là "${here}". Miền Bắc gọi là "${w[2]}", miền Trung gọi là "${w[3]}", còn miền Nam gọi là "${w[4]}"!`]]);
      await reward(w[0], `📖 ${w[2]} · ${w[3]} · ${w[4]}`, T(`Bắc · Trung · Nam: ${w[1]}`, 'Bắc · Trung · Nam'));
    }
    G.job && G.job('puzzle', 1, h);
  }
}

// ---------- postcards from famous places ----------
// tall landmarks you can ride up: [height of the view, what is said, caption]
const LOOKOUT = {
  sydneytower: [17.6, ['Up, up, up the lift! Look: the whole of Sydney, the harbour, the Opera House and the bridge.', 'Thang máy lên, lên, lên! Nhìn kìa: cả thành phố Sydney, bến cảng, Nhà hát Opera và cây cầu.'], ['Sydney from the top of Sydney Tower', 'Sydney nhìn từ đỉnh tháp Sydney']],
  wheel: [15, ['Round and up we go! Brisbane and its river are all around us.', 'Vòng quay đưa mình lên cao! Brisbane và dòng sông ở quanh mình nè.'], ['Brisbane from the top of the Wheel', 'Brisbane nhìn từ đỉnh vòng quay']],
  bnclock: [12, ['From the clock tower you can see all of Bắc Ninh, the Quan họ villages and the rice fields.', 'Từ tháp đồng hồ nhìn thấy cả Bắc Ninh, các làng Quan họ và đồng lúa.'], ['Bắc Ninh from the clock tower', 'Bắc Ninh nhìn từ tháp đồng hồ']],
  lighthouse: [11, ['From the lighthouse the sea goes on forever, and the boats look tiny!', 'Từ ngọn hải đăng thấy biển xa tít tắp, thuyền bè nhỏ xíu!'], ['The view from the lighthouse', 'Cảnh nhìn từ ngọn hải đăng']]
};
export async function postcard(G, h, lm) {
  const p = h.profile; p.postcards = p.postcards || {};
  const first = !p.postcards[lm.id]; p.postcards[lm.id] = true; G.save();
  if (G.showcase && first) await G.showcase(h, lm); // a short swing round the landmark on the first visit; after that the card opens at once
  // the real place: photos of it, and a 360° look round where it really is (js/realworld.js)
  if (REAL[lm.id]) {
    const top = LOOKOUT[lm.id];
    const k = await dialog(lm.name(), [lm.fact], [['📷 See real photos', '📷 Xem ảnh thật'], ['🚶 Step inside (360°)', '🚶 Bước vào xem 360°'], ...(top ? [['🛗 Go up to the top', '🛗 Lên tới đỉnh']] : []), ['👋 Bye', '👋 Tạm biệt']]);
    if (top && k === 2) { const x = lm.mx ?? lm.x, z = lm.mz ?? lm.z; say(top[1][0], top[1][1]); await G.lookout(h, x, heightAt(x, z) + top[0], z, T(top[2][0], top[2][1])); }
    if (k === 0) await new Promise(r => openPhotos(lm.name(), REAL[lm.id][0], { icon: lm.icon, id: lm.id, onClose: r }));
    if (k === 1) openStreetView(lm.id);
  } else await dialog(lm.name(), [lm.fact]);
  if (first) { G.addCoins(10); const st = G.giveSticker(p); await reward('📮', T('New postcard: ', 'Bưu thiếp mới: ') + lm.name(), T(`+${G.fmt(10)}${st ? ' and a sticker ' + st : ''}`, `+${G.fmt(10)}${st ? ' và hình dán ' + st : ''}`)); }
}
