// (v1.08d s2au) The models of a Season 2 Australia region (js/content/s2au.ts), built by js/s2au.ts only when a child
// first comes within 110 m (PERF-001: regions load when visited). Each region: its landmark, its friend (a villager in the
// new style), the food stand, three game stands (a post with the game's picture), and its own scenery. Built after the
// valley's solid map, so every model is marked noSolid and the ones a child could bump into get a round collider.
// Before the region's day only the "coming soon" sign stands (the friend, food and stands appear on the day).
import { THREE, P, merge, toonVC, sprite, outline } from './gfx.js';
import { T } from './i18n.js';
import { heightAt, WATER } from './world.js';
import { buildAvatar, nameAvatar } from './avatar.js';
import { anchorOf } from './content/map.js';
import type { S2Region } from './content/s2au.js';

type Ctx = { open: () => boolean; at: (d: [number, number]) => { x: number; z: number } };
const B = (w: number, h: number, d: number) => new THREE.BoxGeometry(w, h, d), C = (r1: number, r2: number, h: number, s = 10) => new THREE.CylinderGeometry(r1, r2, h, s), S = (r: number, w = 10, h = 8) => new THREE.SphereGeometry(r, w, h);

export function buildRegion(G, R: S2Region, ctx: Ctx) {
  const { scene, world } = G, mat = toonVC(), group = new THREE.Group(); group.userData.noSolid = true; scene.add(group);
  const onDay = new THREE.Group(); onDay.userData.noSolid = true; group.add(onDay);   // the friend, food and stands: shown from the region's day
  const soon = new THREE.Group(); soon.userData.noSolid = true; group.add(soon);
  const put = (parts, x: number, z: number, rot = 0, y?: number, to: THREE.Object3D = group, line = true) => { const m = new THREE.Mesh(merge(parts), mat); m.position.set(x, y ?? heightAt(x, z), z); m.rotation.y = rot; m.castShadow = true; to.add(m); if (line) outline(m, .02, '#4a3a3f'); return m; };
  const block = (x: number, z: number, r: number) => { const c = { x, z, r }; world.colliders.push(c); return c; };
  const a = anchorOf(R.place)!;
  const face = (x: number, z: number) => Math.atan2(a[0] - x, a[1] - z);   // looking at the place's middle

  // ---------- the coming-soon sign ----------
  { const s = ctx.at([0, 0]); put([P(C(.12, .12, 2.2, 6), '#8a5a32', [-1.2, 1.1, 0]), P(C(.12, .12, 2.2, 6), '#8a5a32', [1.2, 1.1, 0]), P(B(3, 1.4, .15), '#ffd23f', [0, 1.9, 0]), P(B(3.2, .3, .2), '#e8433a', [0, 2.7, 0])], s.x, s.z, 0, undefined, soon);
    const ic = sprite(R.icon, 1.1); ic.position.set(s.x, heightAt(s.x, s.z) + 3.6, s.z); soon.add(ic); }

  // ---------- the friend ----------
  const F = R.friend, f = ctx.at(F.at), av = nameAvatar(buildAvatar(F.look, null), F.name);
  av.root.position.set(f.x, heightAt(f.x, f.z), f.z); av.root.rotation.y = face(f.x, f.z) + Math.PI; av.root.userData.noSolid = true; onDay.add(av.root);

  // ---------- the food stand: a little table with the food on it ----------
  { const s = ctx.at(R.food.at), rot = face(s.x, s.z);
    put([P(B(2.2, .12, 1.1), '#c89a6a', [0, .95, 0]), ...[[-1, -.45], [1, -.45], [-1, .45], [1, .45]].map(([x, z]) => P(C(.06, .06, .95, 6), '#8a5a32', [x, .47, z])),
      P(C(1.6, .05, .6, 14), '#e8433a', [0, 2.3, 0]), P(C(.05, .05, 2.3, 6), '#e8e4dc', [0, 1.15, 0])], s.x, s.z, rot, undefined, onDay);
    const food = sprite(R.food.id === 'prawns' ? 's2:prawns' : R.food.id === 'crumble' ? 's2:crumble' : 's2:fishchips', .8); food.position.set(s.x, heightAt(s.x, s.z) + 1.4, s.z); onDay.add(food);
    block(s.x, s.z, 1.1); }

  // ---------- the game stands: a post and a board with the game's picture ----------
  const pics: THREE.Sprite[] = [];
  for (const [gid, dx, dz] of R.stands) { const s = ctx.at([dx, dz]), rot = face(s.x, s.z);
    put([P(C(.1, .12, 2.4, 6), '#8a5a32', [0, 1.2, 0]), P(B(1.5, 1.5, .14), '#fff6dc', [0, 2.4, 0]), P(B(1.7, .16, .2), '#2f9a8a', [0, 3.2, 0])], s.x, s.z, rot, undefined, onDay);
    const ic = sprite(GAME_ICON[gid] || '🎮', 1.15); ic.position.set(s.x, heightAt(s.x, s.z) + 4, s.z); onDay.add(ic); pics.push(ic); block(s.x, s.z, .3); }

  // ---------- the region's own scenery and landmark ----------
  SCENERY[R.id]?.(G, R, ctx, put, block);

  const paint = () => { const on = ctx.open(); onDay.visible = on; soon.visible = !on; };
  paint(); let next = 0;
  world.updaters.push((dt: number, t: number) => {
    if (t > next) { next = t + 2; paint(); }
    if (onDay.visible) { av.anim(Math.floor(t * .3) % 4 === 0 ? 'wave' : 'idle', t, 0); pics.forEach((p, i) => { p.position.y += Math.sin(t * 2 + i) * .002; }); }
  });
  return { group, friend: { x: f.x, z: f.z }, paint, name: () => T(R.name[0], R.name[1]) };
}
const GAME_ICON: Record<string, string> = { s2a_snorkel: 's2:snorkel', s2a_turtle: 's2:turtle', s2a_reefquiz: 's2:reefquiz', s2a_wombat: 's2:wombat', s2a_devil: 's2:devil', s2a_cradle: 's2:hike', s2a_quokka: 's2:camera', s2a_swan: 's2:swan', s2a_beach: 's2:beach' };

// ---------- each region's scenery ----------
type Put = (parts, x: number, z: number, rot?: number, y?: number, to?: THREE.Object3D, line?: boolean) => THREE.Mesh;
type Block = (x: number, z: number, r: number) => unknown;
const coralParts = (seed: number) => { const cols = ['#ff6a8a', '#ff9f43', '#c060c0', '#ffd23f', '#5fd3c0', '#ff7eb8'], p = [];
  for (let i = 0; i < 5; i++) { const a = seed * 1.7 + i * 1.3, r = .4 + (i % 3) * .5, x = Math.cos(a) * r, z = Math.sin(a) * r, c = cols[(seed + i) % cols.length], h = .8 + ((seed + i) % 3) * .4;
    if (i % 2) p.push(P(S(.5 + (i % 3) * .15, 10, 8), c, [x, h * .5, z], [0, 0, 0], [1, .7, 1]));
    else { p.push(P(C(.09, .14, h, 6), c, [x, h / 2, z])); p.push(P(C(.07, .09, h * .7, 6), c, [x + .2, h * .8, z], [0, 0, -.6])); p.push(P(C(.07, .09, h * .7, 6), c, [x - .2, h * .75, z], [0, 0, .6])); } }
  return p; };
const SCENERY: Record<string, (G, R: S2Region, ctx: Ctx, put: Put, block: Block) => void> = {
  // the Great Barrier Reef: coral heads in the clear shallow sea round a reef pontoon (the landmark), turtle nests on the
  // beach, the lifesavers' red and yellow flags and a beach umbrella
  gbr: (G, R, ctx, put, block) => {
    const L = ctx.at(R.landmark.at);
    // the shallow water over the reef: a pale turquoise patch just under the surface
    const shallow = new THREE.Mesh(new THREE.CircleGeometry(15, 32).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: '#5fe0d8', transparent: true, opacity: .45, depthWrite: false }));
    shallow.position.set(L.x, WATER + .03, L.z); shallow.userData.noSolid = true; G.scene.add(shallow);
    for (let i = 0; i < 16; i++) { const a = i * 2.39996, d = 4 + (i % 5) * 2.2, x = L.x + Math.cos(a) * d, z = L.z + Math.sin(a) * d * .8; put(coralParts(i), x, z, a, WATER - .7, undefined, false); }
    // the pontoon: a floating deck with a shade roof
    put([P(B(7, .4, 4), '#e8e4dc', [0, .2, 0]), ...[[-3, -1.6], [3, -1.6], [-3, 1.6], [3, 1.6]].map(([x, z]) => P(C(.08, .08, 2.4, 6), '#d8dde0', [x, 1.4, z])), P(B(7.4, .15, 4.4), '#2f9a8a', [0, 2.65, 0]), P(B(7.2, .5, .2), '#ffd23f', [0, .5, 2.1])], L.x, L.z, 0, WATER + .1);
    const sg = sprite(R.landmark.icon, 1.6); sg.position.set(L.x, WATER + 4.2, L.z); G.scene.add(sg);
    // turtle nests: a sandy mound with eggs, and baby turtles heading for the sea
    for (const [dx, dz] of [[-14, 3], [14, 4]] as [number, number][]) { const s = ctx.at([dx, dz]);
      put([P(S(1.2, 12, 8), '#f2d48a', [0, 0, 0], [0, 0, 0], [1, .35, 1]), ...[0, 1, 2, 3].map(i => P(S(.16, 8, 6), '#fffdf2', [Math.cos(i * 1.6) * .35, .35, Math.sin(i * 1.6) * .35]))], s.x, s.z, 0, undefined, undefined, false);
      const t = sprite('s2:babyturtle', .7); t.position.set(s.x + 1.4, heightAt(s.x, s.z) + .4, s.z + 1.6); G.scene.add(t); }
    // the lifesavers' flags and an umbrella
    for (const dx of [-4, 4]) { const s = ctx.at([dx, 9]); put([P(C(.05, .05, 2.6, 6), '#e8e4dc', [0, 1.3, 0]), P(B(.9, .3, .05), '#e8433a', [.45, 2.35, 0]), P(B(.9, .3, .05), '#ffd23f', [.45, 2.05, 0])], s.x, s.z, 0); block(s.x, s.z, .2); }
    { const s = ctx.at([-12, -2]); put([P(C(.05, .05, 2.4, 6), '#e8e4dc', [0, 1.2, 0]), P(new THREE.ConeGeometry(1.6, .7, 10), '#ff7eb8', [0, 2.5, 0]), P(B(1.6, .1, .7), '#3b6fe0', [1.4, .08, .6])], s.x, s.z, .5); block(s.x, s.z, .2); }
  },
  // Tasmania: Cradle Mountain's jagged rocky crown with snow on the island's peak (the landmark), the boatshed, a forest
  // of tall gums and pines round the island, and its animals (a wombat, a devil, an echidna) in the grass
  tas: (G, R, ctx, put, block) => {
    const L = ctx.at(R.landmark.at), top = heightAt(L.x, L.z);
    put([[-1.6, 0, 3.4], [.4, -.6, 4.6], [2, .4, 3.2], [-.4, 1.4, 2.6]].map(([x, z, h], i) => P(new THREE.ConeGeometry(1.4, h, 5), i % 2 ? '#6a6a72' : '#7a7a84', [x, h / 2 - .4, z], [0, i, 0])).concat(
      [[-1.6, 0, 3.4], [.4, -.6, 4.6], [2, .4, 3.2]].map(([x, z, h]) => P(new THREE.ConeGeometry(.6, h * .3, 5), '#ffffff', [x, h * .85 - .4, z]))), L.x, L.z, 0, top - .2);
    block(L.x, L.z, 3.2);
    const sg = sprite(R.landmark.icon, 1.4); sg.position.set(L.x, top + 6, L.z); G.scene.add(sg);
    { const s = ctx.at([-4, 7]); put([P(B(3, 2, 2.4), '#8a5a32', [0, 1, 0]), P(new THREE.ConeGeometry(2.3, 1.2, 4), '#5a3a22', [0, 2.6, 0], [0, Math.PI / 4, 0]), P(B(1.2, 1.4, .1), '#3a2a1a', [0, .7, 1.22])], s.x, s.z, Math.PI); block(s.x, s.z, 1.6); }
    const a = anchorOf(R.place)!;
    for (let i = 0; i < 22; i++) { const ang = i * 2.39996, x = a[0] + Math.cos(ang) * (14 + (i % 4) * 3.5), z = a[1] + Math.sin(ang) * (5 + (i % 3) * 1.5);
      const h = heightAt(x, z); if (h < WATER + .8 || Math.hypot(x - L.x, z - L.z) < 5) continue;
      const pine = i % 3 === 0, parts = pine ? [P(C(.15, .2, 1.2, 6), '#6a4a32', [0, .6, 0]), P(new THREE.ConeGeometry(1.1, 2.6, 8), '#2f6a3a', [0, 2.2, 0]), P(new THREE.ConeGeometry(.8, 1.8, 8), '#3a7a44', [0, 3.3, 0])]
        : [P(C(.14, .2, 2.6, 6), '#d8d0c0', [0, 1.3, 0]), P(S(1.2, 10, 8), '#6a9a5a', [0, 3, 0], [0, 0, 0], [1, .8, 1]), P(S(.8, 10, 8), '#7aa860', [.6, 3.5, .2])];
      put(parts, x, z, i, h, undefined, false); block(x, z, .3); }
    for (const [p, dx, dz] of [['s2:wombat', 16, 3], ['s2:devil', -10, -3], ['s2:echidna', 18, -3]] as [string, number, number][]) { const s = ctx.at([dx, dz]); const t = sprite(p, .9); t.position.set(s.x, heightAt(s.x, s.z) + .5, s.z); G.scene.add(t); }
  }
};
