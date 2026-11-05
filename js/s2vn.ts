// (v1.08d s2vn, owner 3 and 5 Nov 2026 AEDT: docs/cores/tasks/v108d/s2vn-brief.md) Season 2, Vietnam in the valley.
// Loaded 2.5 s after the start (js/main.ts), never in the first download. Each region of js/content/s2vn.ts opens on its
// day in the release calendar ("feature:s2_<id>", testers 7 days early, or Studio's peek); an open region at once gets:
//   - its name on the screen when a child walks in (js/world/sites.ts EXTRA_REGIONS), so the story's "visit" step counts;
//   - a place in the fly list (the Pad map, Where is…? and the Simple screen's places: G.PLACES);
//   - a bus stop in the bus's stop list (js/traffic.ts W.busStops): the bus drives there along the roads;
//   - a place for each of its games (G.GAME_SPOT) whose host is the region's friend (G.hostLineOf);
//   - its seller in the food passport (js/vendors.ts VENDORS) and its dish in the cooking pot (js/data.ts RECIPES).
// Its 3D area (the landmark, the friend, the seller's stall, the game stands, a sign and the bus stop's post) is built
// only when a child comes within 140 m or the story needs it (ensureRegion): the regions load when visited.
// Everything stands on open ground: off the roads and the water, clear of other solids (the chapter kit's rule).
import { THREE, P, merge, toonVC, sprite, outline } from './gfx.js';
import { T } from './i18n.js';
import { say } from './voice.js';
import { SFX } from './audio.js';
import { dialog } from './popups.js';
import { heightAt, roadDist, WATER, EXTRA_REGIONS, REGION_NAMES } from './world.js';
import { buildAvatar, nameAvatar } from './avatar.js';
import { VENDORS } from './vendors.js';
import { RECIPES } from './data.js';
import { buyFood } from './snacks.js';
import { calOpen } from './content/releasecal-core.js';
import { calMoves } from './content/secondset.js';
import { earlyDays, isPeek } from './custom.js';
import { S2_REGIONS, S2_LINES, regionOf, regionOfGame, type S2Region } from './content/s2vn.js';
import { GAMES } from './games/frame.js';
import './art/s2vn.js';

const NEAR = 140;
/** is the region open today (its calendar day, a tester's early days, or Studio's peek)? */
export const regionOpen = (r: S2Region, now = new Date()) => calOpen('feature:' + r.key, calMoves(), now, earlyDays()) || isPeek(r.key);

type Built = { r: S2Region; stop: { x: number; z: number } | null; parts: THREE.Object3D[]; spots: Record<string, { x: number; z: number }> };
const opened = new Map<string, { stop: { x: number; z: number } | null }>(), built = new Map<string, Built>();

// ---------- open ground ----------
function freeAt(G, x: number, z: number, r = 1.2) {
  const W = G.world, d = roadDist(x, z);
  return heightAt(x, z) > WATER + .4 && (!d.road || d.d > d.road.w / 2 + r)
    && !W.colliders.some(c => c.r > 0 && c.top == null && Math.hypot(c.x - x, c.z - z) < c.r + r)
    && !W.boxes.some(b => x > b.x0 - r && x < b.x1 + r && z > b.z0 - r && z < b.z1 + r)
    && G.interactables.every(i => !Number.isFinite(i.x) || Math.hypot(i.x - x, i.z - z) > Math.max(r, 2));
}
// the nearest open spot to (x, z), searched outwards in a spiral
function openSpot(G, x: number, z: number, r = 1.2, max = 10) {
  for (let k = 0; k < 400; k++) { const a = k * 2.39996, d = k * (max / 400), px = x + Math.cos(a) * d, pz = z + Math.sin(a) * d; if (freeAt(G, px, pz, r)) return { x: px, z: pz }; }
  return { x, z };
}
// a clear straight walk from the bus's drop-off into the area: no water, no building
function clearWalk(G, x0: number, z0: number, x1: number, z1: number) {
  const L = Math.hypot(x1 - x0, z1 - z0);
  for (let k = 0; k <= L; k += 1) { const x = x0 + (x1 - x0) * k / L, z = z0 + (z1 - z0) * k / L; if (heightAt(x, z) < WATER + .3 || G.world.boxes.some(q => x > q.x0 && x < q.x1 && z > q.z0 && z < q.z1)) return false; }
  return true;
}
// the bus stop: beside the nearest asphalt road, on open ground, facing the region
export function findStop(G, r: { at: [number, number]; r: number }) {
  const [cx, cz] = r.at; let best = null, bd = 1e9;
  for (let k = 0; k < 900; k++) {
    const a = k * 2.39996, d = r.r + 2 + k * (44 / 900), x = cx + Math.cos(a) * d, z = cz + Math.sin(a) * d, q = roadDist(x, z);
    if (!q.road || q.road.kind !== 'asphalt') continue;
    const off = Math.abs(q.d - (q.road.w / 2 + 2.6)); if (off > 1.2 || !freeAt(G, x, z, 1) || !clearWalk(G, x + 1.2, z + 1.2, cx, cz)) continue;
    if (d + off * 4 < bd) { bd = d + off * 4; best = { x, z }; }
  }
  return best;
}

// ---------- the regions' models ----------
const B = (w, h, d) => new THREE.BoxGeometry(w, h, d), C = (r1, r2, h, s = 10) => new THREE.CylinderGeometry(r1, r2, h, s), S = (r, w = 10, h = 8) => new THREE.SphereGeometry(r, w, h);
const boatParts = (fruit: string[], hull = '#8a5a32', pole = true) => { const p = [P(B(4.2, .5, 1.4), hull, [0, .35, 0]), P(B(1.6, .8, 1.2), '#3a6ab0', [-.9, .9, 0])];
  if (pole) p.push(P(C(.05, .05, 3.4, 5), '#6a4a32', [1.3, 2, 0]), P(S(.32), fruit[0], [1.3, 3.8, 0]));
  fruit.forEach((c, i) => p.push(P(S(.24, 8, 6), c, [.4 + (i % 3) * .42, .82, -.3 + Math.floor(i / 3) * .5]))); return p; };
const MODELS: Record<string, () => { parts: { g: THREE.BufferGeometry; color: string }[]; solid: [number, number, number][] }> = {
  // a canal with a monkey bridge (one bamboo pole and a handrail), and a boat with its cây bẹo moored beside it
  mekong: () => {
    const p = [P(B(10, .06, 3.2), '#4fa8d8', [0, .04, 0])];
    p.push(P(C(.09, .09, 9, 6), '#c8a060', [0, 1.1, 0], [0, 0, Math.PI / 2]));                       // the bamboo pole to walk on
    p.push(P(C(.05, .05, 9, 6), '#c8a060', [0, 2.1, -.25], [0, 0, Math.PI / 2]));                     // the handrail
    for (const x of [-4.2, -1.4, 1.4, 4.2]) p.push(P(C(.07, .07, 2.4, 5), '#a87a40', [x, 1, 0], [.2, 0, 0]), P(C(.05, .05, 1.2, 5), '#a87a40', [x, 1.7, -.25]));
    for (const [x, z, r] of [[-3, -.2, .1], [3.2, .3, -.08]]) p.push(...boatParts(['#ffd23f', '#5fd36a', '#ff9f43', '#e8433a'], '#7a4a2a').map(q => (q.g.rotateY(r).translate(x, 0, z), q)));
    return { parts: p, solid: [[-5.6, 0, 1.4], [5.6, 0, 1.4]] };
  },
  // Hòn Trống Mái: two stone rocks face to face like a rooster and a hen, standing in the sea (or on the shore)
  halong: () => {
    const p = [P(new THREE.DodecahedronGeometry(1.6, 0), '#a8a092', [-1.8, 1.6, 0], [0, .4, 0], [1, 1.8, 1]), P(new THREE.DodecahedronGeometry(1.3, 0), '#9a9488', [1.8, 1.3, .2], [0, 1.2, 0], [1, 1.7, 1]),
      P(new THREE.ConeGeometry(.5, .9, 5), '#a8a092', [-1.4, 4.2, 0], [0, 0, -.4]), P(new THREE.ConeGeometry(.4, .7, 5), '#9a9488', [1.5, 3.5, .2], [0, 0, .4]),
      P(new THREE.IcosahedronGeometry(.7, 0), '#4f8f42', [-2, 3.3, -.3], [0, 0, 0], [1.2, .5, 1.2]), P(new THREE.IcosahedronGeometry(.6, 0), '#4f8f42', [2, 2.8, 0], [0, 0, 0], [1.2, .5, 1.2])];
    return { parts: p, solid: [[-1.8, 0, 1.6], [1.8, 0, 1.4]] };
  },
  // the rice terraces: green steps climbing a little hill, the lowest ones still water, and a peach tree in flower
  sapa: () => {
    const p = [], cols = ['#4fa8d8', '#7ac860', '#5fae4a', '#8fd06a', '#4f9a3a'];
    for (let i = 0; i < 5; i++) p.push(P(B(9 - i * 1.5, .5, 6 - i * 1.1), cols[i], [0, .25 + i * .5, -i * .4]));
    p.push(P(C(.12, .16, 1.6, 6), '#6a4a32', [4.2, .8, 2.2]), ...[0, 1, 2, 3, 4, 5].map(k => P(S(.4, 8, 6), '#ff9ec4', [4.2 + Math.cos(k) * .6, 1.8 + (k % 2) * .3, 2.2 + Math.sin(k) * .6])));
    return { parts: p, solid: [[0, 0, 3.4]] };
  },
  // the nhà rông: a tall axe-blade roof on a house on stilts, with a ladder, and a rack of gongs beside it
  taynguyen: () => {
    const p = [P(B(4, 1.6, 3), '#b08a5a', [0, 2.2, 0])];
    for (const x of [-1.6, 0, 1.6]) for (const z of [-1.2, 1.2]) p.push(P(C(.12, .12, 1.4, 6), '#6a4a32', [x, .7, z]));
    p.push(P(new THREE.ConeGeometry(2.6, 6, 4), '#8a6a3a', [0, 6, 0], [0, Math.PI / 4, 0], [.9, 1, .6]), P(new THREE.ConeGeometry(.3, .8, 4), '#e8433a', [0, 9.3, 0]));
    p.push(P(B(.8, .08, 2.2), '#8a5a32', [0, .8, 2.2], [.6, 0, 0]));
    p.push(P(B(2.4, .1, .1), '#6a4a32', [3.6, 2.2, 0]), P(C(.05, .05, 2.2, 5), '#6a4a32', [2.5, 1.1, 0]), P(C(.05, .05, 2.2, 5), '#6a4a32', [4.7, 1.1, 0]));
    for (const [x, r] of [[3, .45], [3.7, .35], [4.3, .28]]) p.push(P(C(r, r, .08, 16), '#e8b830', [x, 2.2 - r - .1, 0], [Math.PI / 2, 0, 0]));
    return { parts: p, solid: [[0, 0, 2.6], [3.6, 0, .9]] };
  }
};
// a junk with brown sails, on the bay
const junkParts = () => [P(B(3.6, .6, 1.2), '#8a5a32', [0, .4, 0]), P(B(1.2, .6, 1), '#6a4a32', [-1, 1, 0]), P(C(.05, .05, 3, 5), '#5a3a1a', [.3, 2.2, 0]),
  P(B(.06, 2.2, 1.6), '#c8643a', [.3, 2.4, 0], [0, Math.PI / 2, 0]), P(B(.06, 1.6, 1.1), '#e07b26', [1.3, 1.9, 0], [0, Math.PI / 2, 0]), P(C(.04, .04, 2.2, 5), '#5a3a1a', [1.3, 1.8, 0])];
// boats of the floating market out on the water, bobbing (only where there is water near the region)
function marketBoats(G, r: S2Region) {
  const out: THREE.Object3D[] = []; if (r.id !== 'mekong' && r.id !== 'halong') return out;
  const cols = [['#ffd23f', '#5fd36a', '#ff9f43'], ['#e8433a', '#ffd23f', '#ff7eb8'], ['#5fd36a', '#ffd23f', '#3cc7e8'], ['#ff9f43', '#e8433a', '#5fd36a']];
  let k = 0;
  for (let i = 0; i < 40 && out.length < 4; i++) {
    const x = r.at[0] - 16 + (i % 8) * 4.6, z = r.at[1] + 20 + Math.floor(i / 8) * 3.2; if (heightAt(x, z) > WATER - .6) continue;
    const m = new THREE.Mesh(merge(r.id === 'halong' ? junkParts() : boatParts(cols[k++ % cols.length])), toonVC()); m.position.set(x, WATER + .05, z); m.rotation.y = i * .7; m.userData.noSolid = true; m.userData.bob = i; G.scene.add(m); out.push(m);
  }
  return out;
}

// the sea in front of a region (south of it), and the open shore facing it
function seaSpot(r: S2Region) { for (let d = r.r; d < r.r + 30; d += 1) for (const dx of [0, -4, 4, -8, 8]) { const x = r.at[0] + dx, z = r.at[1] + d; if (heightAt(x, z) < WATER - .6) return { x, z: z + 3 }; /* (v1.08e water) the sea is 0.8 m deep now (was 1.2 m here) */ } return null; }
function shoreSpot(G, r: S2Region, wet: { x: number; z: number }) { for (let d = 6; d < 30; d += 1) { const x = wet.x + (r.at[0] - wet.x) * d / 30, z = wet.z + (r.at[1] - wet.z) * d / 30; if (heightAt(x, z) > WATER + .5 && freeAt(G, x, z, 1.2)) return { x, z }; } return openSpot(G, r.at[0], r.at[1] + 4, 1.2, 8); }

// ---------- building a region's area (once) ----------
export function ensureRegion(G, id: string) {
  const r = regionOf(id); if (!r) return null;
  if (built.has(r.id)) return built.get(r.id);
  const { scene, world } = G, [cx, cz] = r.at, parts: THREE.Object3D[] = [], spots: Record<string, { x: number; z: number }> = {};
  const add = (o: THREE.Object3D, x: number, z: number, rot = 0) => { o.position.set(x, heightAt(x, z), z); o.rotation.y = rot; scene.add(o); parts.push(o); return o; };
  const face = (x: number, z: number) => Math.atan2(cx - x, cz - z);
  // the landmark, toward the water side of the area
  // (Hạ Long's rocks stand out in the sea when there is sea near: then the sign is on the shore in front of them)
  const M = MODELS[r.id] && MODELS[r.id](), wet = r.id === 'halong' ? seaSpot(r) : null, lm = wet ? shoreSpot(G, r, wet) : openSpot(G, cx, cz + 4, 5.8, 8);
  if (M) { const mesh = new THREE.Mesh(merge(M.parts), toonVC()); mesh.castShadow = true; if (wet) { mesh.position.set(wet.x, WATER - .3, wet.z); scene.add(mesh); parts.push(mesh); } else add(mesh, lm.x, lm.z); outline(mesh, .03, '#4a3a3f');
    if (!wet) for (const [dx, dz, rr] of M.solid) world.colliders.push({ x: lm.x + dx, z: lm.z + dz, r: rr }); }
  spots.landmark = lm;
  G.interactables.push({ id: 's2_lm_' + r.id, x: lm.x, z: lm.z - (wet ? 0 : 3.2), r: 3, icon: r.landmark.icon, bubble: 'ℹ️', label: () => T(r.landmark.name[0], r.landmark.name[1]),
    act: () => { SFX.tap(); dialog(T(r.landmark.name[0], r.landmark.name[1]), [r.landmark.fact, r.festival]); } });
  // the friend
  const fq = openSpot(G, cx - 5, cz - 2, 1.2, 6), fr = nameAvatar(buildAvatar({ back: 'none', glider: 0, ...r.friend.look }, null), r.friend.name);
  add(fr.root, fq.x, fq.z, face(fq.x, fq.z)); world.colliders.push({ x: fq.x, z: fq.z, r: .45 }); spots.friend = fq;
  let said = 0;
  G.interactables.push({ id: 'v_' + r.friend.id, x: fq.x, z: fq.z, r: 2.6, icon: '💬', bubble: '👋', label: () => T('Talk to ' + r.friend.name, 'Nói chuyện với ' + r.friend.name),
    act: h => { SFX.tap(); const p = h.profile, met = (p.s2met = p.s2met || {}); const lines = met[r.id] ? [r.friend.lines[said++ % r.friend.lines.length]] : [r.friend.hello, r.friend.lines[0]]; met[r.id] = true; G.save && G.save(); dialog(r.friend.name, lines); } });
  // the seller's stall
  const sq = openSpot(G, cx + 6, cz - 3, 1.8, 6), stall = new THREE.Mesh(merge([P(B(2.4, .9, 1.2), '#8a5a3b', [0, .45, 0]), P(B(2.5, .06, 1.3), '#e8dcc0', [0, .92, 0]),
    ...[[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([x, z]) => P(B(.08, 2.4, .08), '#6b4a32', [x * 1.15, 1.2, z * .55])), P(B(2.8, .1, 1.8), '#ff9f43', [0, 2.45, .1], [.15, 0, 0])]), toonVC());
  add(stall, sq.x, sq.z, face(sq.x, sq.z)); world.colliders.push({ x: sq.x, z: sq.z, r: 1.2 });
  const seller = buildAvatar({ back: 'none', glider: 0, ...r.food.look }, null), sp = { x: sq.x + Math.sin(face(sq.x, sq.z) + Math.PI) * 1.1, z: sq.z + Math.cos(face(sq.x, sq.z) + Math.PI) * 1.1 };
  add(seller.root, sp.x, sp.z, face(sp.x, sp.z)); const food = sprite(r.food.food[0], .8); food.position.set(sq.x, heightAt(sq.x, sq.z) + 1.4, sq.z); scene.add(food); parts.push(food);
  const vendor = VENDORS.find(v => v.id === r.food.id);
  const fy = { x: sq.x + Math.sin(face(sq.x, sq.z)) * 1.6, z: sq.z + Math.cos(face(sq.x, sq.z)) * 1.6 }; spots.food = fy;
  G.interactables.push({ id: 'v_' + r.food.id, x: fy.x, z: fy.z, r: 2.4, icon: r.food.food[0], bubble: '🛒', label: () => T(r.food.recipe.name[0], r.food.recipe.name[1]),
    act: async h => { SFX.tap(); await dialog(r.food.seller, [r.food.greet]); if (vendor) await buyFood(G, h, vendor); } });
  // a stand for each game (its place); the friend is their host
  const stands = [[-9, 5], [0, -8], [9, 5]];
  r.games.forEach((gid, k) => {
    const q = openSpot(G, cx + stands[k][0], cz + stands[k][1], 1.2, 7), m = new THREE.Mesh(merge([P(C(.08, .08, 2.2, 6), '#8a5a32', [0, 1.1, 0]), P(B(1.4, 1, .12), '#fff3d6', [0, 2.1, 0]), P(B(1.5, .1, .16), '#e8433a', [0, 2.65, 0])]), toonVC());
    add(m, q.x, q.z, face(q.x, q.z)); world.colliders.push({ x: q.x, z: q.z, r: .3 });
    const icon = sprite(gameIcon(gid), 1); icon.position.set(q.x, heightAt(q.x, q.z) + 3.4, q.z); scene.add(icon); parts.push(icon); spots[gid] = q;
    G.interactables.push({ id: 'g_' + gid, x: q.x, z: q.z, r: 2.4, icon: gameIcon(gid), bubble: '🎮', label: () => gameName(gid), act: h => G.playGame(h.i, gid, 'place') });
  });
  // the region's sign at its edge, toward the road
  const st = opened.get(r.id)?.stop, sg = st ? openSpot(G, cx + (st.x - cx) * .55, cz + (st.z - cz) * .55, 1, 5) : openSpot(G, cx, cz - r.r + 2, 1, 5);
  const sign = sprite(r.icon, 1.6); sign.position.set(sg.x, heightAt(sg.x, sg.z) + 2.8, sg.z); scene.add(sign); parts.push(sign);
  add(new THREE.Mesh(merge([P(C(.1, .1, 2.2, 6), '#8a5a32', [0, 1.1, 0])]), toonVC()), sg.x, sg.z);
  if (st) { const post = sprite('🚌', .7); post.position.set(st.x, heightAt(st.x, st.z) + 2.6, st.z); scene.add(post); parts.push(post); add(new THREE.Mesh(merge([P(C(.06, .06, 2.4, 6), '#d8dde0', [0, 1.2, 0]), P(B(.7, .7, .06), '#ffd23f', [0, 2.3, 0])]), toonVC()), st.x, st.z); }
  for (const o of marketBoats(G, r)) parts.push(o);
  const B0 = { r, stop: st || null, parts, spots }; built.set(r.id, B0);
  // the friend waves now and then; the boats bob on the water
  world.updaters.push((dt: number, t: number) => { fr.anim(Math.floor(t * .3) % 4 === 0 ? 'wave' : 'idle', t, 0); seller.anim('idle', t, 0);
    for (const o of parts) if (o.userData.bob != null) { o.position.y = WATER + .05 + Math.sin(t * 1.4 + o.userData.bob) * .08; o.rotation.z = Math.sin(t + o.userData.bob) * .04; } });
  return B0;
}
const ICONS = { mk_sampan: 's2g:sampan', mk_caybeo: 's2g:caybeo', mk_count: 's2g:count', hl_cave: 's2g:cave', hl_rocks: 's2g:rocks', hl_nets: 's2g:nets', sp_terrace: 's2g:terrace', sp_seasons: 's2g:seasons', sp_brocade: 's2g:brocade', tn_gong: 's2g:gong', tn_nharong: 's2g:nharong', tn_elephant: 's2g:elephant' };
const gameIcon = (id: string) => ICONS[id] || '🎮';
const gameName = (id: string) => GAMES[id]?.name?.() || id;   // (the catalogue names every game: js/games/catalog.ts)

// ---------- opening a region (its day has come) ----------
function openRegion(G, r: S2Region) {
  if (opened.has(r.id)) return;
  const stop = findStop(G, r); opened.set(r.id, { stop });
  EXTRA_REGIONS.push({ id: r.key, x: r.at[0], z: r.at[1], r: r.r + 4 }); REGION_NAMES[r.key] = () => T(r.name[0], r.name[1]);
  (G.PLACES = G.PLACES || []).push({ g: 'vn', key: r.key, icon: r.icon, name: () => T(r.name[0], r.name[1]), x: r.at[0], z: r.at[1], s2: true });
  if (stop && G.world.busStops) G.world.busStops.push({ x: stop.x, z: stop.z, cc: 'vn', fare: 3, place: { id: r.key, key: r.key }, name: () => T(r.name[0], r.name[1]), icon: r.icon });
  G.GAME_SPOT = G.GAME_SPOT || {}; for (const gid of r.games) G.GAME_SPOT[gid] = 'g_' + gid;
  if (!VENDORS.some(v => v.id === r.food.id)) VENDORS.push({ id: r.food.id, name: r.food.seller, region: 'nam', look: r.food.look, food: r.food.food, greet: r.food.greet, x: r.at[0], z: r.at[1] });
  if (!RECIPES.some(x => x.id === r.food.recipe.id)) RECIPES.push({ ...r.food.recipe, name: () => T(r.food.recipe.name[0], r.food.recipe.name[1]) });
}

export function installS2vn(G) {
  if (G.s2vn) return G.s2vn;
  const check = () => { for (const r of S2_REGIONS) if (regionOpen(r)) openRegion(G, r); };
  check();
  G.hostLineOf = (gid: string) => { const r = regionOfGame(gid); return r && opened.has(r.id) ? r.friend.hello : null; };
  let acc = 0, checkAcc = 0;
  G.world.updaters.push((dt: number) => {
    acc += dt; checkAcc += dt; if (checkAcc > 60) { checkAcc = 0; check(); }
    if (acc < 1) return; acc = 0;
    for (const id of opened.keys()) { if (built.has(id)) continue; const r = regionOf(id); if (G.heroes.some(h => Math.hypot(h.pos.x - r.at[0], h.pos.z - r.at[1]) < NEAR)) ensureRegion(G, id); }
    // the welcome, once, as a child first walks into a region
    for (const h of G.heroes) { const rg = G.regionOf?.[h.i], r = rg && regionOf(rg); if (!r || !opened.has(r.id)) continue; const p = h.profile, w = (p.s2welcome = p.s2welcome || {}); if (!w[r.id]) { w[r.id] = true; G.save && G.save(); say(r.welcome[0], r.welcome[1]); } }
  });
  G.s2vn = { open: (id: string) => { const r = regionOf(id); if (r) openRegion(G, r); return r; }, ensure: (id: string) => ensureRegion(G, id), opened: () => [...opened.keys()], built: () => [...built.keys()],
    info: (id: string) => { const r = regionOf(id), b = r && built.get(r.id); return r && { stop: opened.get(r.id)?.stop || null, spots: b ? b.spots : null }; }, regions: S2_REGIONS, lines: S2_LINES };
  return G.s2vn;
}
// the story needs a region (its chapter has opened): open it and build it now
export function forStory(G, id: string) { installS2vn(G); G.s2vn.open(id); return ensureRegion(G, id); }
