// Out in the wild: fruit bushes to pick, flower patches, rocks to tap three times until they crack
// open with a treasure inside, and sparkly dig spots to dig up (three digs) for buried treasure, where the
// rarest gems are worth the most. Everything found goes in the backpack, is counted in the Album's
// Treasures page, and can be sold to Mr. Bear at the farm.
import { THREE, toon, toonVC, P, merge } from './gfx.js';
import { T } from './i18n.js';
import { ITEMS } from './data.js';
import { heightAt, regionAt, roadDist, riverDist, WATER, LOTS, APOSTLES, FESTGROUNDS } from './world.js';
import { WORLD as MAP_WORLD } from './content/map.js';
const COUNTRY = MAP_WORLD.wild; // (round T) where the countryside is, from the map
import { seeded, dist2 } from './util.js';

export const WILD = {
  // fruit
  mulberry: { kind: 'fruit', icon: '🫐', sell: 6, color: '#4a2a6a', name: () => T('Mulberries', 'Dâu tằm') },
  guava: { kind: 'fruit', icon: '🍐', sell: 7, color: '#9ccf5a', name: () => T('Guava', 'Ổi') },
  strawberry: { kind: 'fruit', icon: '🍓', sell: 8, color: '#e8433a', name: () => T('Wild strawberries', 'Dâu rừng') },
  lime: { kind: 'fruit', icon: '🍋', sell: 5, color: '#e8d84a', name: () => T('Wild lemon', 'Chanh rừng') },
  // flowers
  peach: { kind: 'flower', icon: '🌸', sell: 8, color: '#ffb3cf', name: () => T('Peach blossom', 'Hoa đào') },
  apricot: { kind: 'flower', icon: '🏵️', sell: 8, color: '#ffc93a', name: () => T('Yellow apricot blossom', 'Hoa mai') },
  wattle: { kind: 'flower', icon: '🌼', sell: 7, color: '#ffd23f', name: () => T('Golden wattle', 'Hoa keo vàng') },
  hibiscus: { kind: 'flower', icon: '🌺', sell: 9, color: '#e8435a', name: () => T('Hibiscus', 'Hoa dâm bụt') },
  // inside rocks (weights = how often)
  pebble: { kind: 'gem', icon: '🪨', sell: 5, weight: 40, name: () => T('Pretty pebble', 'Viên sỏi đẹp') },
  fossil: { kind: 'gem', icon: '🐚', sell: 20, weight: 22, name: () => T('Fossil shell', 'Hóa thạch vỏ ốc') },
  crystal: { kind: 'gem', icon: '🔮', sell: 30, weight: 18, name: () => T('Purple crystal', 'Pha lê tím') },
  gold: { kind: 'gem', icon: '🪙', sell: 60, weight: 12, name: () => T('Gold nugget', 'Cục vàng') },
  gem: { kind: 'gem', icon: '💎', sell: 100, weight: 8, name: () => T('Blue gem', 'Đá quý xanh') },
  // only found by digging (dig: weight in the dig spots). The rarer, the more Mr. Bear pays.
  bone: { kind: 'gem', icon: '🦴', sell: 15, dig: 20, name: () => T('Dinosaur bone', 'Xương khủng long') },
  oldcoin: { kind: 'gem', icon: '🏅', sell: 40, dig: 12, name: () => T('Old bronze coin', 'Đồng xu cổ') },
  jade: { kind: 'gem', icon: '🟢', sell: 150, dig: 4, name: () => T('Green jade', 'Ngọc bích') },
  ruby: { kind: 'gem', icon: '❤️', sell: 250, dig: 2, name: () => T('Red ruby', 'Hồng ngọc') },
  diamond: { kind: 'gem', icon: '💠', sell: 500, dig: .8, name: () => T('Sparkling diamond', 'Kim cương lấp lánh') },
  crown: { kind: 'gem', icon: '👑', sell: 1000, dig: .2, name: () => T('Lost golden crown', 'Vương miện vàng thất lạc') }
};
// what a dig spot can hold (how often, out of about 100): mostly pebbles and bones, gems are rare
export const DIG = { pebble: 30, bone: 20, fossil: 14, oldcoin: 12, crystal: 8, gold: 6, gem: 3, jade: 4, ruby: 2, diamond: .8, crown: .2 };
// make them ordinary items so the backpack, toasts and cooking can use them
for (const [k, w] of Object.entries(WILD)) if (!ITEMS[k]) ITEMS[k] = { icon: w.icon, name: w.name };
export const isWild = k => !!WILD[k];

const FRUITS = ['mulberry', 'guava', 'strawberry', 'lime'], FLOWERS = ['peach', 'apricot', 'wattle', 'hibiscus'];
const GEMS = Object.keys(WILD).filter(k => WILD[k].kind === 'gem' && WILD[k].weight);
function rollGem(rnd) { const tot = GEMS.reduce((a, k) => a + WILD[k].weight, 0); let r = rnd() * tot; for (const k of GEMS) { r -= WILD[k].weight; if (r <= 0) return k; } return 'pebble'; }
export function rollDig(r = Math.random()) { const ks = Object.keys(DIG), tot = ks.reduce((a, k) => a + DIG[k], 0); r *= tot; for (const k of ks) { r -= DIG[k]; if (r <= 0) return k; } return 'pebble'; }

// pick spots in open countryside (meadows, bamboo forest, plateau), away from water and each other
let SOLID = null; // the world's buildings and landmarks (set by createGathering): never put a bush, rock or dig spot inside one
function spots(n, seed, minGap, used) {
  const rnd = seeded(seed), out = [];
  for (let tries = 0; out.length < n && tries < 4000; tries++) {
    const x = COUNTRY.x0 + rnd() * (COUNTRY.x1 - COUNTRY.x0), z = COUNTRY.z0 + rnd() * (COUNTRY.z1 - COUNTRY.z0), h = heightAt(x, z), rg = regionAt(x, z);
    if (h < WATER + 1.6 || h > 22 || riverDist(x, z) < 12 || Math.abs(heightAt(x + 1.5, z) - heightAt(x - 1.5, z)) + Math.abs(heightAt(x, z + 1.5) - heightAt(x, z - 1.5)) > 2.2 || !['meadow', 'bamboo', 'plateau'].includes(rg) || roadDist(x, z).d < 6 || LOTS.some(L => dist2(L.x, L.z, x, z) < 12) || [APOSTLES, ...Object.values(FESTGROUNDS)].some(f => dist2(f.x, f.z, x, z) < 17) || (SOLID && SOLID.boxes.some(b => x > b.x0 - 2 && x < b.x1 + 2 && z > b.z0 - 2 && z < b.z1 + 2))) continue;
    if ([...used, ...out].some(([ux, uz]) => dist2(ux, uz, x, z) < minGap)) continue;
    // (never under something already standing: round R, a landmark covered a dig spot)
    if (SOLID && SOLID.colliders.some(c => c.r > 0 && c.top == null && dist2(c.x, c.z, x, z) < c.r + 2.5)) continue;
    out.push([x, z]);
  }
  used.push(...out); return out;
}

export function createGathering(G, { give, sfx, say, toast }) {
  const { scene, world } = G, used = []; SOLID = world;
  const leaves = toon('#5fa04e'), leaves2 = toon('#4f8f42'), stone = toonVC();
  const now = () => performance.now();
  const add = (o, x, z) => { o.position.set(x, heightAt(x, z), z); scene.add(o); return o; };

  // one mesh for all of a group's own parts, coloured as they were (the bush's leaves, or its fruit)
  const bakeParts = grp => { const parts = []; for (const m of [...grp.children]) if (m.isMesh) { m.updateMatrix(); parts.push(P(m.geometry.clone().applyMatrix4(m.matrix), '#' + m.material.color.getHexString())); grp.remove(m); } if (parts.length) { const one = new THREE.Mesh(merge(parts), toonVC()); one.castShadow = true; grp.add(one); } };
  // ---------- fruit bushes ----------
  spots(16, 11, 14, used).forEach(([x, z], k) => {
    const kind = FRUITS[k % FRUITS.length], w = WILD[kind], g = new THREE.Group();
    for (let i = 0; i < 5; i++) { const m = new THREE.Mesh(new THREE.IcosahedronGeometry(.55 + (i % 2) * .2, 1), i % 2 ? leaves : leaves2); m.position.set(Math.cos(i * 1.3) * .5, .55 + (i % 3) * .2, Math.sin(i * 1.3) * .5); m.castShadow = true; g.add(m); }
    const fruit = new THREE.Group(); g.add(fruit);
    for (let i = 0; i < 7; i++) { const f = new THREE.Mesh(new THREE.SphereGeometry(.13, 10, 8), toon(w.color)); f.position.set(Math.cos(i * 2.4) * .75, .5 + (i % 3) * .3, Math.sin(i * 2.4) * .75); fruit.add(f); }
    bakeParts(g); bakeParts(fruit); // (round T2) a bush drawn as two pieces, not twelve
    add(g, x, z); world.colliders.push({ x, z, r: .8 });
    const st = { ready: 0 };
    world.updaters.push(() => { fruit.visible = now() > st.ready; });
    G.interactables.push({ st, id: 'wf' + k, x, z, r: 2.4, icon: w.icon, label: () => T('Pick ', 'Hái ') + w.name(), visible: () => now() > st.ready,
      act: h => { st.ready = now() + 150000; sfx.pop(); give(h, kind, 2); found(h, kind, 2); } });
  });

  // ---------- flower patches ----------
  spots(18, 23, 12, used).forEach(([x, z], k) => {
    const kind = FLOWERS[k % FLOWERS.length], w = WILD[kind], g = new THREE.Group(), heads = new THREE.Group(); g.add(heads);
    for (let i = 0; i < 9; i++) {
      const a = i * 2.1, r = .3 + (i % 3) * .3, sx = Math.cos(a) * r, sz = Math.sin(a) * r;
      const stem = new THREE.Mesh(new THREE.CylinderGeometry(.025, .025, .5, 4), leaves2); stem.position.set(sx, .25, sz); g.add(stem);
      const head = new THREE.Mesh(new THREE.IcosahedronGeometry(.13, 0), toon(i % 4 === 3 ? '#ffffff' : w.color)); head.position.set(sx, .52, sz); heads.add(head);
    }
    add(g, x, z);
    const st = { ready: 0 };
    world.updaters.push((dt, t) => { heads.visible = now() > st.ready; heads.rotation.y = Math.sin(t * .8 + k) * .1; });
    G.interactables.push({ st, id: 'wl' + k, x, z, r: 2, icon: w.icon, label: () => T('Pick ', 'Hái ') + w.name(), visible: () => now() > st.ready,
      act: h => { st.ready = now() + 120000; sfx.pop(); give(h, kind, 1); found(h, kind, 1); } });
  });

  // ---------- rocks: tap three times to crack one open ----------
  const rnd = seeded(77);
  spots(14, 37, 16, used).forEach(([x, z], k) => {
    const g = new THREE.Group();
    const geo = merge([P(new THREE.DodecahedronGeometry(.75, 0), '#9a968c', [0, .45, 0], [.3, k, 0], [1.2, .8, 1]), P(new THREE.DodecahedronGeometry(.45, 0), '#b0aca2', [.55, .3, .2], [0, k * 2, .4])]
      .concat([0, 1, 2].map(i => P(new THREE.OctahedronGeometry(.13), ['#9fdcff', '#c49cff', '#ffe08a'][i], [Math.cos(i * 2.1 + k) * .55, .7, Math.sin(i * 2.1 + k) * .45]))));
    const rock = new THREE.Mesh(geo, stone); rock.castShadow = true; g.add(rock);
    add(g, x, z);
    const col = { x, z, r: 1 }; world.colliders.push(col);
    const st = { hits: 0, ready: 0, shake: 0 };
    world.updaters.push((dt) => {
      const up = now() > st.ready; g.visible = up; col.r = up ? 1 : 0;
      if (st.shake > 0) { st.shake -= dt; rock.position.x = Math.sin(st.shake * 60) * .06; } else rock.position.x = 0;
    });
    G.interactables.push({ st, id: 'wr' + k, x, z, r: 2.6, icon: '⛏️', label: () => st.hits ? T(`Tap again! (${3 - st.hits} more)`, `Gõ tiếp! (còn ${3 - st.hits} lần)`) : T('Tap the rock 3 times', 'Gõ hòn đá 3 lần'), visible: () => now() > st.ready,
      act: h => {
        st.hits++; st.shake = .3; sfx.tap();
        if (st.hits < 3) { say(st.hits === 1 ? 'Tap! Again!' : 'Crack! One more!', st.hits === 1 ? 'Cốc! Gõ nữa!' : 'Rắc! Một lần nữa!'); return; }
        st.hits = 0; st.ready = now() + 180000; sfx.chime();
        const kind = rollGem(rnd), w = WILD[kind];
        G.fx && G.fx(x, heightAt(x, z) + 1.2, z, w.icon);
        give(h, kind, 1); found(h, kind, 1);
        if (WILD[kind].sell >= 60) setTimeout(() => say('Wow! A rare treasure!', 'Ồ! Một báu vật hiếm!'), 900);
      } });
  });

  // ---------- dig spots: a mound of earth with a little sparkle. Dig three times to find what is buried ----------
  const dirt = toonVC(), spark = new THREE.MeshBasicMaterial({ color: '#fff6b0', transparent: true, opacity: .9 });
  spots(18, 51, 14, used).forEach(([x, z], k) => {
    const g = new THREE.Group();
    const mound = new THREE.Mesh(merge([P(new THREE.SphereGeometry(.8, 12, 6, 0, Math.PI * 2, 0, Math.PI / 2), '#8a5a32', [0, 0, 0], [0, 0, 0], [1, .38, 1]),
      ...[0, 1, 2, 3].map(i => P(new THREE.DodecahedronGeometry(.13, 0), '#6e4526', [Math.cos(i * 1.7 + k) * .75, .06, Math.sin(i * 1.7 + k) * .75])),
      P(new THREE.BoxGeometry(.06, .7, .06), '#a0703a', [.25, .55, -.1], [0, 0, .25]), P(new THREE.BoxGeometry(.3, .32, .04), '#b8c0c8', [.17, .2, -.1], [0, 0, .25])]), dirt);
    mound.castShadow = true; g.add(mound);
    const sp = [0, 1, 2].map(i => { const m = new THREE.Mesh(new THREE.OctahedronGeometry(.07), spark); g.add(m); return m; });
    add(g, x, z);
    const st = { digs: 0, ready: 0, shake: 0 };
    world.updaters.push((dt, t) => {
      const up = now() > st.ready; g.visible = up; if (!up) return;
      sp.forEach((m, i) => { const a = t * 1.6 + i * 2.1; m.position.set(Math.cos(a) * .45, .5 + Math.sin(t * 3 + i) * .15, Math.sin(a) * .45); m.rotation.y = t * 3; });
      if (st.shake > 0) { st.shake -= dt; mound.scale.y = 1 - Math.sin(st.shake * 30) * .12; } else mound.scale.y = 1 - st.digs * .2;
    });
    G.interactables.push({ st, id: 'wd' + k, x, z, r: 2.4, icon: '🪏', label: () => st.digs ? T(`Dig again! (${3 - st.digs} more)`, `Đào tiếp! (còn ${3 - st.digs} lần)`) : T('Dig for treasure', 'Đào tìm báu vật'), visible: () => now() > st.ready,
      act: h => {
        st.digs++; st.shake = .3; sfx.tap(); G.fx && G.fx(x, heightAt(x, z) + .8, z, '🟫');
        if (st.digs < 3) { say(st.digs === 1 ? 'Dig, dig!' : 'Something is down there!', st.digs === 1 ? 'Đào, đào!' : 'Có gì ở dưới kìa!'); return; }
        st.digs = 0; st.ready = now() + 240000; sfx.chime();
        const kind = rollDig(), w = WILD[kind];
        G.fx && G.fx(x, heightAt(x, z) + 1.2, z, w.icon);
        give(h, kind, 1); found(h, kind, 1);
        if (w.sell >= 100) setTimeout(() => { say('Wow! A rare treasure! It is worth a lot!', 'Ồ! Báu vật hiếm! Đáng giá lắm đó!'); toast(h, `${w.icon} ${w.name()}: ${G.fmt ? G.fmt(w.sell) : w.sell}`); }, 900);
      } });
  });

  // remember everything each child has ever found, for the Album
  function found(h, kind, n) { const p = h.profile; p.found = p.found || {}; const first = !p.found[kind]; p.found[kind] = (p.found[kind] || 0) + n; if (first) setTimeout(() => toast(h, '✨ ' + T('New in your collection: ', 'Thêm vào bộ sưu tập: ') + WILD[kind].icon + ' ' + WILD[kind].name()), 1200); G.save && G.save(); }
}
