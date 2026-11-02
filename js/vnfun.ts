// Village fun of Vietnam, north and south:
//  · Children playing outside Hà Nội (bắn bi, bịt mắt bắt dê, northern style) and outside Sài Gòn (ném lon and
//    bắn bi, southern style). Talk to them to join in.
//  · Buffalo and bull festivals that happen now and then: the buffalo pushing match (hội chọi trâu, as in Đồ Sơn)
//    near Bắc Ninh in the north, and the bull race (đua bò Bảy Núi, An Giang) near Sài Gòn in the south. When a
//    match starts nearby a 📣 bubble and a message appear; tap 👀 to watch (the camera turns to the ring). Gentle:
//    the buffaloes lock horns and push, and whoever walks away first loses; nobody gets hurt.
import { THREE, P, merge, toonVC, sprite, outline } from './gfx.js';
import { T, registerName } from './i18n.js';
import { FESTGROUNDS, oldHeightAt, heightAt, CITIES, roadDist, WATER, VILLAGE, CHINA, INDIA, HOME, PLAYGROUND, PLATEAU, PADDIES, LAKE, BAMBOO, HALF } from './world.js';
import { buildAvatar } from './avatar.js';
import { animalModel } from './animals.js';
import { burstConfetti } from './games/frame.js';

const look = (style, color, hair, hairStyle, hat = 'none', skin = '#e0aa80') => ({ style, color, hair, hairStyle, hat, skin, back: 'none', glider: 0 });
const BLACK = '#1d1412';

export function createVnFun(G, { sfx, say, dialog, toast }) {
  const { scene, world } = G, mat = toonVC(), used = [], PLACES = [VILLAGE, CHINA, INDIA, HOME, PLAYGROUND, PLATEAU, PADDIES, LAKE, { x: BAMBOO.x, z: BAMBOO.z, r: BAMBOO.r - 15 }];
  // an open, fairly flat spot not far from a city, away from roads and buildings
  const spotNear = (cx, cz, R0, R1, need = 8) => {
    for (let R = R0; R <= R1; R += 3) for (let k = 0; k < 24; k++) {
      const a = k / 24 * Math.PI * 2 + cx * .013, x = cx + Math.cos(a) * R, z = cz + Math.sin(a) * R;
      if (Math.abs(x) > HALF - 15 || Math.abs(z) > HALF - 15 || roadDist(x, z).d < need + 3 || PLACES.some(c => Math.hypot(x - c.x, z - c.z) < c.r + need + 6) || CITIES.some(c => Math.abs(x - c.x) < c.w + need + 2 && Math.abs(z - c.z) < c.d + need + 2) || G.interactables.some(it => !it.y && Math.hypot(it.x - x, it.z - z) < need + 3) || used.some(([ux, uz]) => Math.hypot(ux - x, uz - z) < need * 2 + 4)) continue;
      const hs = [[0, 0], [need, 0], [-need, 0], [0, need], [0, -need]].map(([dx, dz]) => oldHeightAt(x + dx, z + dz));
      if (Math.min(...hs) < WATER + .5 || Math.max(...hs) - Math.min(...hs) > 2) continue;
      if (world.boxes.some(b => x > b.x0 - need && x < b.x1 + need && z > b.z0 - need && z < b.z1 + need) || world.colliders.some(o => o.r > .3 && Math.hypot(o.x - x, o.z - z) < o.r + need)) continue;
      used.push([x, z]); return [x, z];
    }
    return null;
  };
  const city = id => CITIES.find(c => c.id === id);
  const kid = (lk, x, z, face, scale = .8) => { const A = buildAvatar(lk, null); A.root.scale.setScalar(scale); A.root.position.set(x, heightAt(x, z), z); A.root.rotation.y = face; scene.add(A.root); world.colliders.push({ x, z, r: .35 }); return A; };
  const live = [];
  world.updaters.push((dt, t) => live.forEach(([A, kind], k) => { const p = A.root.position; if (!G.heroes.some(h => Math.abs(h.pos.x - p.x) < 60 && Math.abs(h.pos.z - p.z) < 60)) return; A.anim(kind === 'crouch' ? 'idle' : (Math.floor(t * .6 + k) % 3 === 0 ? 'cheer' : 'idle'), t + k, 0); if (kind === 'crouch') { A.rig.position.y = -.25; A.legL.rotation.x = A.legR.rotation.x = -1.2; A.armR.rotation.x = -1 + Math.sin(t * 3 + k) * .3; } }));

  // ---------- children playing ----------
  const PLAY = [
    { where: 'hanoi', game: 'marbles', icon: '🔮', name: 'Cu Bin', title: ['Marbles (bắn bi), northern style', 'Bắn bi kiểu miền Bắc'], line: ['Ê! Bắn bi không? Flick your marble into the hole, then hit mine!', 'Ê! Chơi bắn bi không? Búng bi vào lỗ, rồi bắn trúng bi tớ nhé!'], prop: 'marbles' },
    { where: 'hanoi', game: 'goat', icon: '🐐', name: 'Mai Anh', title: ['Blindfold Goat (bịt mắt bắt dê)', 'Bịt mắt bắt dê'], line: ['Bịt mắt bắt dê! I am the goat: be-he-he! Can you catch me with your eyes closed?', 'Bịt mắt bắt dê! Tớ làm dê nè: be be! Bạn bịt mắt bắt được tớ không?'], prop: 'goat' },
    { where: 'saigon', game: 'nemlon', icon: '🩴', name: 'Út Lì', title: ['Can knock-down (ném lon), southern style', 'Ném lon kiểu miền Nam'], line: ['Ê, chơi ném lon hông? Stack the cans and knock them down with your sandal!', 'Ê, chơi ném lon hông? Chồng lon lên rồi lấy dép ném cho đổ nè!'], prop: 'cans' },
    { where: 'saigon', game: 'marbles', icon: '🔮', name: 'Bé Mận', title: ['Marbles (bắn bi), southern style', 'Bắn bi kiểu miền Nam'], line: ['Bắn bi nè! In the south we draw a triangle and knock the marbles out!', 'Bắn bi nè! Ở trong Nam tụi mình vẽ hình tam giác rồi bắn bi văng ra ngoài!'], prop: 'triangle' }
  ];
  for (const pl of PLAY) {
    const c = city(pl.where); if (!c) continue;
    const s = spotNear(c.x, c.z, c.w + 8, 44, 4.5); if (!s) { console.warn('no room for', pl.game, pl.where); continue; }
    const [x, z] = s, y = heightAt(x, z), parts = [];
    if (pl.prop === 'marbles') { parts.push(P(new THREE.CylinderGeometry(1.4, 1.4, .02, 24), '#cbb48a', [0, .02, 0]), P(new THREE.CylinderGeometry(.12, .12, .03, 10), '#5a4a3a', [0, .03, 0])); ['#3cc7e8', '#ff7eb8', '#ffd23f', '#5fd36a'].forEach((col, i) => parts.push(P(new THREE.SphereGeometry(.07, 10, 8), col, [Math.cos(i * 1.6) * .8, .07, Math.sin(i * 1.6) * .8]))); }
    if (pl.prop === 'triangle') { for (let i = 0; i < 3; i++) { const a = i / 3 * Math.PI * 2; parts.push(P(new THREE.BoxGeometry(1.8, .02, .05), '#f6f1e4', [Math.cos(a + Math.PI / 3) * .52, .02, Math.sin(a + Math.PI / 3) * .52], [0, -a + Math.PI / 2 - Math.PI / 3, 0])); } ['#3cc7e8', '#ff7eb8', '#ffd23f'].forEach((col, i) => parts.push(P(new THREE.SphereGeometry(.07, 10, 8), col, [(i - 1) * .2, .07, 0]))); }
    if (pl.prop === 'cans') { [[0, 0], [-.2, 0], [.2, 0], [-.1, .32], [.1, .32], [0, .64]].forEach(([dx, dy]) => parts.push(P(new THREE.CylinderGeometry(.09, .09, .3, 10), '#d9483a', [dx, .16 + dy, -1.4]))); parts.push(P(new THREE.BoxGeometry(2.4, .02, .06), '#f6f1e4', [0, .02, 1.2])); }
    if (pl.prop === 'goat') parts.push(P(new THREE.CylinderGeometry(2.2, 2.2, .02, 28, 1, true), '#f6f1e4', [0, .02, 0]));
    if (parts.length) { const m = new THREE.Mesh(merge(parts), mat); m.position.set(x, y, z); scene.add(m); }
    // the children: the host and two friends
    const host = kid(look(pl.where === 'hanoi' ? 'shirt' : 'tunic', ['#3cc7e8', '#ff7eb8', '#5fd39a', '#ffb52e'][used.length % 4], BLACK, pl.game === 'goat' ? 'ponytail' : 'spiky'), x + 1.6, z + 1.2, Math.PI * 1.3);
    const f1 = kid(look('dress', '#ff9ec4', BLACK, 'buns'), x - 1.5, z + .8, Math.PI * .7), f2 = kid(look('overalls', '#5f86b0', BLACK, 'short', pl.where === 'saigon' ? 'cap' : 'none'), x, z - 1.7, 0);
    if (pl.game === 'goat') { const bf = new THREE.Mesh(new THREE.TorusGeometry(.27, .05, 6, 16), new THREE.MeshToonMaterial({ color: '#e8433a' })); bf.rotation.x = Math.PI / 2; bf.position.y = .2; f2.head.add(bf); }
    live.push([host, 'cheer'], [f1, pl.prop === 'marbles' || pl.prop === 'triangle' ? 'crouch' : 'cheer'], [f2, 'cheer']);
    registerName(pl.name, pl.icon);
    const tag = sprite(pl.icon, 1); tag.position.set(x + 1.6, y + 2.3, z + 1.2); scene.add(tag);
    G.interactables.push({ id: 'pg_' + pl.game + '_' + pl.where, x: x + 1.6, z: z + 2.4, r: 3, icon: pl.icon, bubble: pl.icon, label: () => T(pl.title[0], pl.title[1]), act: h => G.kidTalk(h, pl.game, pl.name, pl.line) });
    if (G.chatGroup) G.chatGroup([host.root, f1.root, f2.root], pl.where === 'hanoi'
      ? [['My turn!', 'Đến lượt tớ!'], ['Got it!', 'Trúng rồi!'], ['No cheating!', 'Ăn gian nhé!'], ['Again, again!', 'Chơi lại đi!']]
      : [['My turn now!', 'Tới lượt tui!'], ['I hit it!', 'Trúng rồi nè!'], ['No fair!', 'Hổng chịu đâu!'], ['Play again?', 'Chơi nữa hông?']], { height: 2.2 });
    G.GAME_SPOT = G.GAME_SPOT || {}; if (!G.GAME_SPOT[pl.game]) G.GAME_SPOT[pl.game] = 'pg_' + pl.game + '_' + pl.where;
  }

  // ---------- buffalo pushing matches and bull races ----------
  const FESTS = [
    { id: 'choitrau', where: ['bacninh', 'hanoi'], kind: 'push', animal: 'calf', scale: 2.3, colours: ['#e8433a', '#3a78c8'], icon: '🐃',
      name: ['Buffalo pushing festival (hội chọi trâu)', 'Hội chọi trâu'],
      intro: [['In the north, villages hold a buffalo festival. The two strongest buffaloes lock horns and push, like a tug of war with heads! The one that walks away first loses.', 'Ở miền Bắc, làng nào cũng mong tới hội chọi trâu. Hai chú trâu khỏe nhất húc sừng vào nhau mà đẩy, như kéo co bằng đầu vậy! Chú nào bỏ chạy trước là thua.'],
        ['The most famous is in Đồ Sơn, near Hải Phòng. In our valley the buffaloes only push, and nobody gets hurt.', 'Nổi tiếng nhất là hội chọi trâu Đồ Sơn, gần Hải Phòng. Ở thung lũng mình, trâu chỉ đẩy nhau thôi, không ai bị đau cả.']] },
    { id: 'duabo', where: ['saigon'], kind: 'race', animal: 'bull', scale: 1.7, colours: ['#e8433a', '#3a78c8'], icon: '🐂',
      name: ['Bull race (đua bò Bảy Núi)', 'Hội đua bò Bảy Núi'],
      intro: [['In An Giang, in the far south, the Khmer people hold bull races after the rice harvest. Two bulls pull a wooden harrow through the muddy field and a rider stands on it!', 'Ở An Giang, đồng bào Khmer tổ chức hội đua bò sau mùa gặt. Hai con bò kéo bừa gỗ chạy trên ruộng bùn, người điều khiển đứng trên bừa!'],
        ['Pick red or blue and cheer for your bulls!', 'Chọn đội đỏ hay đội xanh rồi cổ vũ đôi bò của con nhé!']] }
  ];
  for (const F of FESTS) {
    const c = city(F.where[0]); if (!c) continue;
    const s = [FESTGROUNDS[F.id].x, FESTGROUNDS[F.id].z]; used.push(s);
    const [x, z] = s, y = heightAt(x, z), parts = [], R = F.kind === 'race' ? 0 : 6.5;
    F.x = x; F.z = z; F.y = y; F.rot = Math.atan2(c.x - x, c.z - z);
    if (F.kind === 'push') {
      parts.push(P(new THREE.CylinderGeometry(R, R, .06, 32), '#c9a46a', [0, .03, 0]));
      for (let i = 0; i < 24; i++) { const a = i / 24 * Math.PI * 2; if (i % 6 === 0) continue; parts.push(P(new THREE.CylinderGeometry(.06, .06, 1, 5), '#9a7a4a', [Math.cos(a) * (R + .3), .5, Math.sin(a) * (R + .3)]), P(new THREE.BoxGeometry(1.8, .07, .07), '#b8964a', [Math.cos(a + .13) * (R + .3), .85, Math.sin(a + .13) * (R + .3)], [0, -a - .13 + Math.PI / 2, 0])); }
    } else {
      parts.push(P(new THREE.BoxGeometry(26, .06, 7), '#8a6a4a', [0, .03, 0]), P(new THREE.BoxGeometry(.3, 2.4, .3), '#f6f1e4', [12, 1.2, -3.6]), P(new THREE.BoxGeometry(.3, 2.4, .3), '#f6f1e4', [12, 1.2, 3.6]), P(new THREE.BoxGeometry(.2, .6, 7.4), '#e8433a', [12, 2.3, 0]));
      for (let i = 0; i < 9; i++) parts.push(P(new THREE.BoxGeometry(.08, .08, 7), '#5f9a4a', [-12 + i * 3, .07, 0]));
    }
    // flags on poles
    for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2, rr = F.kind === 'race' ? 15 : R + 2.2; parts.push(P(new THREE.CylinderGeometry(.05, .05, 3.2, 5), '#8a8a8a', [Math.cos(a) * rr, 1.6, Math.sin(a) * rr * (F.kind === 'race' ? .45 : 1)]), P(new THREE.BoxGeometry(.7, .45, .03), ['#e8433a', '#ffd23f', '#5fd36a', '#3cc7e8', '#ff7eb8', '#ff9f43'][i], [Math.cos(a) * rr + .38, 2.9, Math.sin(a) * rr * (F.kind === 'race' ? .45 : 1)])); }
    const m = new THREE.Mesh(merge(parts), mat); m.position.set(x, y, z); m.rotation.y = F.rot; scene.add(m);
    world.colliders.push({ x, z, r: F.kind === 'race' ? 1 : .5 });
    // the two animals, each with a coloured cloth on its back
    const local = (lx, lz) => { const c2 = Math.cos(F.rot), s2 = Math.sin(F.rot); return [x + lx * c2 + lz * s2, z - lx * s2 + lz * c2]; };
    F.animals = [0, 1].map(i => {
      const g = animalModel(F.animal); g.scale.setScalar(F.scale);
      const cloth = new THREE.Mesh(new THREE.BoxGeometry(.5, .06, .55), new THREE.MeshToonMaterial({ color: F.colours[i] })); cloth.position.set(0, F.animal === 'calf' ? .78 : 1.2, 0); g.children[0].add(cloth);
      scene.add(g); return { g, rest: F.kind === 'race' ? local(-11, i ? 1.6 : -1.6) : local(i ? 4.6 : -4.6, 0) };
    });
    // where the race harrows are
    if (F.kind === 'race') F.harrows = F.animals.map(() => { const h2 = new THREE.Mesh(new THREE.BoxGeometry(.3, .25, 1.6), new THREE.MeshToonMaterial({ color: '#7a5236' })); scene.add(h2); return h2; });
    F.animals.forEach(A => { A.g.position.set(A.rest[0], heightAt(A.rest[0], A.rest[1]), A.rest[1]); });
    // a few people watching
    for (let i = 0; i < 5; i++) { const a = (i / 5) * Math.PI * 1.4 + 2.2 + F.rot, rr = F.kind === 'race' ? 9 : R + 1.6, px = x + Math.cos(a) * rr, pz = z + Math.sin(a) * rr; const A = kid(look(['shirt', 'aodai', 'tunic', 'dress', 'shirt'][i], ['#f2f2f2', '#d94a6a', '#6b4a2a', '#ffd23f', '#3a78c8'][i], i === 2 ? '#cfcfcf' : BLACK, ['short', 'long', 'short', 'buns', 'spiky'][i], i === 1 ? 'nonla' : 'none', '#e0aa80'), px, pz, Math.atan2(x - px, z - pz), i === 4 ? .8 : 1); live.push([A, 'cheer']); }
    F.state = 'idle'; F.t = 0; F.next = 40 + Math.random() * 80; F.pick = null;
    const bub = sprite('📣', 1.6); bub.visible = false; scene.add(bub); F.bub = bub;
    G.interactables.push({ id: 'fest_' + F.id, x: x + Math.sin(F.rot) * (F.kind === 'race' ? 9 : R + 2.5), z: z + Math.cos(F.rot) * (F.kind === 'race' ? 9 : R + 2.5), r: 3.4, icon: '👀', bubble: F.icon,
      label: () => F.state === 'idle' ? T(F.name[0], F.name[1]) : T('Watch! ', 'Xem nào! ') + T(F.name[0], F.name[1]), act: h => watch(h, F) });
  }

  G.vnFests = { list: FESTS, start: (id, h) => { const F = FESTS.find(f => f.id === id); if (F) start(F, h); } }; // for the tests
  async function watch(h, F) {
    if (F.state === 'idle') {
      await dialog(T(F.name[0], F.name[1]), F.intro);
      if (F.kind === 'race') { const k = await dialog(T(F.name[0], F.name[1]), [['Who will you cheer for?', 'Con cổ vũ đội nào?']], [['🔴 Red team', '🔴 Đội đỏ'], ['🔵 Blue team', '🔵 Đội xanh']]); F.pick = k === 1 ? 1 : 0; }
      start(F, h);
    }
    // the camera turns to the ring for the match
    if (G.showcase && !G.show) { const p = G.showcase(h, { id: 'fest', icon: F.icon, mx: F.x, mz: F.z, x: F.x, z: F.z, name: () => T(F.name[0], F.name[1]) }); if (G.show) G.show.len = Math.max(3, F.len - F.t); await p; }
  }
  function start(F, h) {
    if (F.state !== 'idle') return;
    F.state = 'on'; F.t = 0; F.len = F.kind === 'race' ? 9 : 13; F.loser = Math.random() < .5 ? 0 : 1;
    if (F.kind === 'race' && F.pick != null) F.loser = (h && h.profile.age !== 'big') ? 1 - F.pick : (Math.random() < .6 ? 1 - F.pick : F.pick);
    F.bub.visible = true; sfx.fanfare && sfx.fanfare();
    G.heroes.forEach(hh => { if (Math.hypot(hh.pos.x - F.x, hh.pos.z - F.z) < 80) toast(hh, `${F.icon} ${T(F.name[0], F.name[1])}: ${T('it’s starting! Tap 👀 to watch.', 'bắt đầu rồi! Chạm 👀 để xem.')}`); });
  }
  function finish(F) {
    F.state = 'idle'; F.next = 90 + Math.random() * 120; F.bub.visible = false;
    const w = 1 - F.loser, col = w ? T('blue', 'xanh') : T('red', 'đỏ');
    const near = G.heroes.filter(hh => Math.hypot(hh.pos.x - F.x, hh.pos.z - F.z) < 40);
    if (!near.length) { F.pick = null; return; }
    sfx.chime && sfx.chime(); sfx.moo && sfx.moo();
    if (F.kind === 'race') {
      const won = F.pick === w;
      say(won ? `The ${w ? 'blue' : 'red'} bulls win! Your team won!` : `The ${w ? 'blue' : 'red'} bulls win this time. What a race!`, won ? `Đôi bò ${w ? 'xanh' : 'đỏ'} thắng! Đội của con thắng rồi!` : `Lần này đôi bò ${w ? 'xanh' : 'đỏ'} thắng. Cuộc đua hay quá!`);
      if (won) { burstConfetti(document.body); near.forEach(hh => { G.addCoins && G.addCoins(5); toast(hh, '🏆 +' + (G.fmt ? G.fmt(5) : 5)); }); }
    } else say(`The ${col} buffalo walked away, so the ${w ? 'blue' : 'red'} one wins! Well pushed, both of you.`, `Trâu ${F.loser ? 'xanh' : 'đỏ'} bỏ đi, trâu ${col} thắng rồi! Hai chú giỏi quá.`);
    F.pick = null;
  }
  const lerp = (a, b, k) => a + (b - a) * k;
  world.updaters.push((dt) => {
    for (const F of FESTS) {
      if (!F.animals) continue;
      const nearAny = G.heroes.some(hh => Math.hypot(hh.pos.x - F.x, hh.pos.z - F.z) < 70);
      if (F.state === 'idle') {
        if (nearAny) { F.next -= dt; if (F.next <= 0) start(F); }
        F.animals.forEach((A, i) => { const p = A.g.position; p.x = lerp(p.x, A.rest[0], Math.min(1, dt * .8)); p.z = lerp(p.z, A.rest[1], Math.min(1, dt * .8)); p.y = heightAt(p.x, p.z); A.g.rotation.y = F.rot + (F.kind === 'race' ? Math.PI / 2 : (i ? -Math.PI / 2 : Math.PI / 2)); });
        if (F.harrows) F.harrows.forEach((hw, i) => { const a = F.animals[i].g.position; hw.position.set(a.x - Math.cos(F.rot) * 1.6, a.y + .15, a.z + Math.sin(F.rot) * 1.6); hw.rotation.y = F.rot; });
        continue;
      }
      F.t += dt; const t = F.t; F.bub.position.set(F.x, F.y + 5 + Math.sin(t * 4) * .2, F.z);
      const c2 = Math.cos(F.rot), s2 = Math.sin(F.rot), at = (lx, lz) => [F.x + lx * c2 + lz * s2, F.z - lx * s2 + lz * c2];
      if (F.kind === 'push') {
        // walk in (0–3 s), lock horns and push back and forth (3–10 s), the loser turns and trots off (10–13 s)
        const push = t < 3 ? 0 : Math.sin((t - 3) * 1.7) * .9 + (t > 6 ? (F.loser ? -1 : 1) * (t - 6) * .25 : 0);
        F.animals.forEach((A, i) => {
          const side = i ? 1 : -1; let lx = t < 3 ? lerp(side * 4.6, side * 1.25, t / 3) : side * 1.25 + push, face = i ? -Math.PI / 2 : Math.PI / 2;
          if (t > 10 && i === F.loser) { lx = side * 1.25 + push + side * (t - 10) * 2; face = i ? Math.PI / 2 : -Math.PI / 2; }
          const [px, pz] = at(lx, 0); A.g.position.set(px, heightAt(px, pz), pz); A.g.rotation.y = F.rot + face;
          const head = A.g.userData.rig && A.g.userData.rig.head; if (head && t > 3 && t < 10) head.rotation.x = .35 + Math.sin(t * 5 + i) * .12;
        });
        if (t > 3 && t < 10 && Math.random() < dt * 1.2) sfx.moo && sfx.moo();
      } else {
        // the bull race: a countdown, then both pairs run down the track; the winner crosses the line first
        F.animals.forEach((A, i) => {
          const sp = i === F.loser ? 2.6 : 2.95, run = Math.max(0, t - 1.5), lx = Math.min(12.5, -11 + run * sp + Math.sin(run * 2 + i) * .4), [px, pz] = at(lx, i ? 1.6 : -1.6);
          A.g.position.set(px, heightAt(px, pz), pz); A.g.rotation.y = F.rot + Math.PI / 2;
          const hw = F.harrows[i]; hw.position.set(px - c2 * 1.8, A.g.position.y + .15, pz + s2 * 1.8); hw.rotation.y = F.rot;
        });
      }
      if (t >= F.len) finish(F);
    }
  });
}
