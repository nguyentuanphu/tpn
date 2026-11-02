// The festival hunt (owner, 13 Oct 2026 AEDT; content in js/content/festhunt.js): in a festival's last week and on its
// day, five festival things are hidden among the decorations of its first place, each with a little sparkle. A child
// who comes near one taps "Found it!"; the fifth gives a keepsake for the child's house (fh_<festival>, js/myhouse.js DECOR) and the
// festival's badge in the Passport (profile.festBadges, shown by js/passport.js). Each child finds their own five (the
// hunt starts again the next year); a thing stays in place until every child playing has found it.
// Loaded by js/festivals.js only while a hunt is on.
import { THREE, P, merge, toonVC } from './gfx.js';
import { T } from './i18n.js';
import { say } from './voice.js';
import { SFX } from './audio.js';
import { saveProfiles } from './state.js';
import { heightAt } from './world.js';
import { HUNT, HUNT_LINES } from './content/festhunt.js';

export const HUNT_SIZE = 5;

const mat = toonVC();
const Sph = (r, w = 8, h = 6) => new THREE.SphereGeometry(r, w, h), Cyl = (a, b, h, s = 8) => new THREE.CylinderGeometry(a, b, h, s), Box = (w, h, d) => new THREE.BoxGeometry(w, h, d);
// one hidden thing, small enough to look for (about a child's hand), standing on the ground at (0, 0, 0)
function thing(shape) {
  const parts = [], glows = [];
  switch (shape) {
    case 'envelope': parts.push(P(Box(.42, .28, .05), '#c62828', [0, .2, 0], [-.25, 0, 0])); glows.push(P(Box(.22, .06, .06), '#ffd23f', [0, .22, .02], [-.25, 0, 0])); break;
    case 'lantern': parts.push(P(Cyl(.12, .12, .05, 8), '#ffd23f', [0, .5, 0])); glows.push(P(Sph(.2), '#ff4a3a', [0, .3, 0], [0, 0, 0], [1, 1.2, 1])); break;
    case 'mooncake': parts.push(P(Cyl(.2, .2, .12, 12), '#c98a3a', [0, .08, 0]), P(Cyl(.1, .1, .02, 10), '#e0a95a', [0, .15, 0])); break;
    case 'carp': parts.push(P(Sph(.18), '#ffb43a', [0, .2, 0], [0, 0, 0], [1.6, .9, .7]), P(new THREE.ConeGeometry(.12, .2, 4), '#ff8a1a', [-.32, .2, 0], [0, 0, Math.PI / 2])); break;
    case 'balloon': parts.push(P(Cyl(.008, .008, .6, 3), '#ffffff', [0, .3, 0])); glows.push(P(Sph(.2), '#ff9a2e', [0, .75, 0], [0, 0, 0], [1, 1.2, 1])); break;
    case 'star': glows.push(P(new THREE.OctahedronGeometry(.22, 0), '#ffd23f', [0, .3, 0], [0, 0, 0], [1, 1, .35])); break;
    case 'egg': parts.push(P(Sph(.15), '#ff9ab8', [0, .2, 0], [0, 0, 0], [1, 1.35, 1]), P(new THREE.TorusGeometry(.15, .02, 4, 12), '#7fd6d0', [0, .2, 0], [Math.PI / 2, 0, 0])); break;
    case 'heart': for (const s of [-1, 1]) parts.push(P(Sph(.12), '#ff4f6a', [s * .08, .32, 0])); parts.push(P(new THREE.ConeGeometry(.17, .22, 8), '#ff4f6a', [0, .17, 0], [Math.PI, 0, 0])); break;
    case 'sweet': parts.push(P(Sph(.11), '#ff4f9a', [0, .15, 0], [0, 0, 0], [1.3, 1, 1])); for (const s of [-1, 1]) parts.push(P(new THREE.ConeGeometry(.08, .12, 4), '#ffd23f', [s * .2, .15, 0], [0, 0, s * Math.PI / 2])); break;
    case 'gift': parts.push(P(Box(.32, .28, .32), '#3a78c8', [0, .14, 0]), P(Box(.34, .05, .06), '#ffd23f', [0, .28, 0]), P(Box(.06, .05, .34), '#ffd23f', [0, .28, 0])); break;
    case 'litter': parts.push(P(Cyl(.06, .06, .2, 8), '#9ad0e0', [0, .06, 0], [0, 0, Math.PI / 2]), P(Box(.18, .02, .14), '#e8e2d0', [.2, .02, .1], [0, .4, 0])); break;
    case 'paint': ['#ff4f9a', '#ffd23f', '#3cc7e8'].forEach((c, k) => { parts.push(P(Cyl(.08, .07, .12, 8), '#ffffff', [(k - 1) * .18, .06, 0])); glows.push(P(Sph(.07, 6, 4), c, [(k - 1) * .18, .14, 0], [0, 0, 0], [1, .5, 1])); }); break;
    case 'hand': parts.push(P(Box(.22, .26, .03), '#e8a24a', [0, .2, 0], [-.3, 0, 0])); for (let k = 0; k < 4; k++) parts.push(P(Box(.04, .12, .03), '#e8a24a', [(k - 1.5) * .055, .38, -.05], [-.3, 0, 0])); break;
    case 'boomerang': for (const s of [-1, 1]) parts.push(P(Box(.32, .04, .08), '#8a3a1a', [s * .1, .05, s * -.06], [0, s * .5, 0])); break;
    case 'diya': parts.push(P(Cyl(.12, .07, .08, 10), '#b8643a', [0, .04, 0])); glows.push(P(new THREE.ConeGeometry(.04, .14, 6), '#ffb43a', [0, .15, 0])); break;
    case 'dumpling': parts.push(P(new THREE.ConeGeometry(.16, .24, 3), '#4f9a3a', [0, .12, 0]), P(Box(.33, .02, .02), '#c9a05a', [0, .1, 0])); break;
    default: parts.push(P(Cyl(.02, .02, .4, 4), '#3a7a2a', [0, .2, 0])); for (let k = 0; k < 5; k++) { const a = k / 5 * Math.PI * 2; parts.push(P(Sph(.07, 6, 4), shape === 'flower' ? '#ffd23f' : '#ff4f6a', [Math.cos(a) * .08, .42, Math.sin(a) * .08])); }
  }
  return { parts, glows };
}
const keyOf = (F, year) => F.id + '_' + year;

export function createHunt(G, spark) {
  const { world: W } = G, root = new THREE.Group(); root.userData.noSolid = true; G.scene.add(root);
  let hunts = [], items = [], t = 0, nearT = 0;
  const unhook = () => { items.forEach(it => { const k = G.interactables.indexOf(it); if (k >= 0) G.interactables.splice(k, 1); }); items = []; };
  const stateOf = (p, F, year) => { p.hunt = p.hunt && typeof p.hunt === 'object' ? p.hunt : {}; const k = keyOf(F, year); return (p.hunt[k] = p.hunt[k] || { found: [] }); };
  // a thing is shown until every child playing has found it
  // (and only while a child is within 70 m: far ones are not drawn)
  const refresh = () => items.forEach(it => { it.left = !G.heroes.length || G.heroes.some(h => h.profile && !stateOf(h.profile, it.F, it.year).found.includes(it.k)); it.obj.visible = it.left && (!G.heroes.length || G.heroes.some(h => Math.hypot(h.pos.x - it.x, h.pos.z - it.z) < 70)); });
  const find = async (h, it) => {
    if (G.tried) G.tried(h, 'festHunt');   // (batch rollout: a child who hunted keeps the hunt)
    const p = h.profile; if (!p) return; const s = stateOf(p, it.F, it.year), H = HUNT[it.F.id];
    if (s.found.includes(it.k)) { say(...HUNT_LINES.again); G.toast(h, T(HUNT_LINES.again[0], HUNT_LINES.again[1])); return; }
    s.found.push(it.k); SFX.ding && SFX.ding(); saveProfiles(); refresh();
    G.toast(h, `${it.F.icon} ${s.found.length} / ${HUNT_SIZE}`);
    if (s.found.length < HUNT_SIZE) { say(...HUNT_LINES.found); return; }
    s.done = true; p.keepsakes = Array.isArray(p.keepsakes) ? p.keepsakes : []; if (!p.keepsakes.includes('fh_' + it.F.id)) p.keepsakes.push('fh_' + it.F.id);
    p.festBadges = p.festBadges && typeof p.festBadges === 'object' ? p.festBadges : {}; p.festBadges[it.F.id] = it.year;
    saveProfiles(); say(...HUNT_LINES.done); G.celebrate && G.celebrate(h);
    await G.reward(it.F.icon, T(`${it.F.en}: all ${H.en} found!`, `${it.F.vi}: tìm đủ ${H.vi}!`), T('A keepsake for your house and a festival badge in your Passport', 'Quà lưu niệm cho nhà con và huy hiệu lễ hội trong Hộ chiếu'));
  };
  // list: [{ F, year, spots: [{ x, z }] (the first place's decorations), at: { x, z } (its middle) }]
  const set = list => {
    unhook(); root.clear(); hunts = [];
    for (const { F, year, spots, at } of list) {
      const H = HUNT[F.id]; if (!H || spots.length < HUNT_SIZE) continue;
      hunts.push({ F, year, at, told: '' });
      // five spread over the place: round its middle, one in each fifth of the circle where there is one
      const around = spots.map(q => ({ ...q, a: Math.atan2(q.z - at.z, q.x - at.x) })).sort((a, b) => a.a - b.a), step = around.length / HUNT_SIZE;
      for (let k = 0; k < HUNT_SIZE; k++) {
        const q = around[Math.floor(k * step + step / 2) % around.length], y = heightAt(q.x, q.z), r = thing(H.shape), obj = new THREE.Group();
        obj.add(new THREE.Mesh(merge(r.parts.concat(r.glows)), mat)); // (one shape each: a few draw calls in all, PERF-003)
        const s = spark(); s.position.set(0, .9, 0); obj.add(s); obj.position.set(q.x, y, q.z); obj.rotation.y = k * 1.3; obj.userData.spark = s; root.add(obj);
        const it = { id: 'hunt_' + F.id + '_' + k, x: q.x, z: q.z, r: 2.2, icon: F.icon, label: () => T('Found it!', 'Tìm thấy rồi!'), act: h => find(h, it), F, year, k, obj };
        items.push(it); G.interactables.push(it);
      }
    }
    refresh();
  };
  // the sparkles bob; Ông Cú tells about the hunt once a day when a child first comes to the festival's place
  W.updaters.push(dt => {
    if (!items.length) return; t += dt; if ((nearT -= dt) <= 0) { nearT = .5; refresh(); }
    for (const it of items) if (it.obj.visible) { const s = it.obj.userData.spark; s.position.y = .9 + Math.sin(t * 3 + it.k) * .15; s.material.opacity = .6 + Math.sin(t * 5 + it.k) * .3; }
    const today = new Date().toDateString();
    for (const hu of hunts) { if (hu.told === today) continue;
      const h = G.heroes.find(h => h.profile && Math.hypot(h.pos.x - hu.at.x, h.pos.z - hu.at.z) < 40 && !stateOf(h.profile, hu.F, hu.year).done); if (!h) continue;
      hu.told = today; say(...HUNT[hu.F.id].say); G.toast(h, `${hu.F.icon} ${T(HUNT[hu.F.id].say[0], HUNT[hu.F.id].say[1])}`); }
  });
  return { set, items: () => items.map(it => ({ id: it.id, x: it.x, z: it.z, F: it.F.id, visible: it.obj.visible, left: it.left })), find: (i, id) => { const it = items.find(x => x.id === id), h = G.heroes[i]; return it && h ? find(h, it) : null; } };
}
