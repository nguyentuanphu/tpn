// (v1.08e creatures, owner 6 Nov 2026 AEDT) The animals, pets and companions of the 3D world, made in Blender
// (tools/blender/world-creatures.py, tools/make-creatures.mts → models/world/creature-<kind>.glb). Loaded after the start
// (js/main.ts), so nothing here is in the first download.
// - An animal (js/animals.ts) asks for its model the first time a child comes near (tickAnimals only runs for animals
//   within 60 m of a child), at most 3 a moment. The model goes where the code shape stands; the code shape (rig.root) is
//   hidden, not removed: it stays as the fallback when the model cannot load (no network, an old phone).
// - Pets are animals too: they are always near their child, so their models come at once.
// - The child's companion (js/companion.ts) gets its model as soon as the child has one.
// - The clips: idle, walk (companions: fly), the happy move (wag, hop or flap), follow, cheer, and the moods sad,
//   surprised and sleep; every clip blinks, and the face (eyes, brows, mouth) shows the mood.
import { worldModel, worldModelFailed } from './modelkit.js';
import { useCreatureModels } from './animals.js';
import { useCompanionModels, sparkleWings } from './companion.js';

export const creatureModelName = (kind: string) => 'creature-' + kind;
/** each animal's happy move (tools/blender/creatures-built.json "happy") */
export const CREATURE_HAPPY = { puppy: 'wag', kitty: 'hop', bunny: 'hop', panda: 'hop', joey: 'hop', calf: 'wag', cow: 'wag', sheep: 'wag', pig: 'wag', unicorn: 'wag', chicken: 'flap', bear: 'hop', koala: 'hop', platypus: 'hop', penguin: 'flap', emu: 'flap', turtle: 'hop', elephant: 'wag', crane: 'flap', bull: 'wag', buffalo: 'wag', peacock: 'flap' };

let since = 0, asked = 0;
// (owner, 6 Nov 2026 AEDT: "nicer moves") an animal near a child turns its head to look at them (after its clip has moved
// the head, so the two add up); not while it walks, follows or sleeps
const LOOKING = new Set<any>();
const _look = (dt: number) => {
  for (const r of LOOKING) {
    if (!r.g.parent) { LOOKING.delete(r); continue; }
    if (!r.headBone || !G) continue;
    let want = 0, best = 6;
    if (r.clip !== 'sleep' && r.clip !== 'walk' && r.clip !== 'follow' && r.clip !== 'cheer') for (const h of G.heroes) {
      const dx = h.pos.x - r.g.position.x, dz = h.pos.z - r.g.position.z, d = Math.hypot(dx, dz);
      if (d < best) { best = d; let a = Math.atan2(dx, dz) - r.g.rotation.y; a = ((a + Math.PI) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2) - Math.PI; want = Math.abs(a) < 2 ? Math.max(-.75, Math.min(.75, a)) : 0; }
    }
    r.look += (want - r.look) * Math.min(1, dt * 4);
    if (Math.abs(r.look) > .002) r.headBone.rotateY(r.look);
  }
};
// (Meshy pets, 10 Nov 2026) kinds made with Meshy (tools/meshy/fit_animal.py) have two models: creature-<kind>-hd near a
// child (within 16 m), creature-<kind> (lighter: fewer triangles, a smaller picture) farther than 24 m; between, the one
// it has stays (no flicker back and forth). The way the Meshy friends switch (friendsHDNear, js/main.ts).
export const MESHY_CREATURES = new Set(['puppy', 'dragon', 'firefly', 'kitty', 'bunny', 'panda', 'calf', 'joey', 'cow']);
const HD_NEAR = 16, HD_FAR = 24;
function near(g, r) {
  const now = performance.now(); if (now - since > 100) { since = now; asked = 0; }
  if (asked >= 3) return;   // (at most 3 new models a moment, so a frame never stalls)
  asked++; r.asked = true;
  let hd = MESHY_CREATURES.has(r.kind) && nearest(g) < HD_NEAR;
  void worldModel(creatureModelName(r.kind) + (hd ? '-hd' : ''), { clip: 'idle' })
    .then(m => m || !hd ? m : (hd = false, worldModel(creatureModelName(r.kind), { clip: 'idle' })))   // (no near model: the far one)
    .then(m => {
    if (!m) return;   // (blocked or failed: the code shape stays)
    g.add(m.obj); r.root.visible = false; r.model = m; r.clip = 'idle'; r.idleT = 0; g.userData.model = m; r.hd = hd;
    r.g = g; r.headBone = m.obj.getObjectByName('head'); r.look = 0; LOOKING.add(r);
    g.userData.onModel && g.userData.onModel();   // (a pet's hat moves onto the model's head: js/pets.ts putHat)
  });
}
function lod(g, r, d: number) {
  if (r.swapping || !MESHY_CREATURES.has(r.kind) || worldModelFailed(creatureModelName(r.kind) + '-hd')) return;
  const want = d < HD_NEAR ? true : d > HD_FAR ? false : r.hd; if (want === r.hd) return;
  r.swapping = true;
  void worldModel(creatureModelName(r.kind) + (want ? '-hd' : ''), { clip: r.clip || 'idle' }).then(m => {
    r.swapping = false; if (!m || !g.parent) return;
    const was = r.model; g.remove(was.obj); was.stop(); g.add(m.obj); r.model = m; g.userData.model = m; r.hd = want;
    r.headBone = m.obj.getObjectByName('head'); g.userData.onModel && g.userData.onModel();
  });
}
// (owner, 6 Nov 2026 AEDT: "all animals need to show emotions, facial expressions, movements, eye blinks") every clip blinks;
// the moods: an animal is surprised when a child walks up, then happy to see them; sad for a moment when they walk away;
// asleep at night when nobody is near; it cheers on a pet's happy jump, and does its happy move now and then
let G: any = null;
const nearest = (g) => { let d = 1e9; if (G) for (const h of G.heroes) d = Math.min(d, Math.hypot(h.pos.x - g.position.x, h.pos.z - g.position.z)); return d; };
function tick(g, r, dt: number) {
  const d = nearest(g), night = !!(G && G.world && G.world.isNight && G.world.isNight());
  lod(g, r, d);
  r.cheerT = Math.max(0, (r.cheerT || 0) - dt); r.moodT = Math.max(0, (r.moodT || 0) - dt); r.idleT = r.sp < .5 ? (r.idleT || 0) + dt : 0;
  if (d > 5) { if (r.metAt != null && d > 7 && r.moodT <= 0 && !r.byeDone) { r.mood = 'sad'; r.moodT = 3; r.byeDone = true; } r.far = true; }
  else if (d < 2.8 && r.far !== false) { r.far = false; r.byeDone = false; r.metAt = 0; r.mood = 'surprised'; r.moodT = 1.1; r.greet = 2.4; }
  if (r.mood === 'surprised' && r.moodT <= 0 && r.greet) { r.mood = 'happy'; r.moodT = r.greet; r.greet = 0; }
  const happy = CREATURE_HAPPY[r.kind] || 'hop', idleFor = 9 + (r.seed % 5);
  const mood = r.moodT > 0 ? (r.mood === 'happy' ? happy : r.mood) : null;
  // (Meshy pets, 10 Nov 2026) a model with its own moves: a pet's wish first (r.want, js/pets.ts: swim, jump, sit, beg,
  // roll, scratch, dig, carry, bounce, sleep), running when it goes fast; and while still for a while it sits down
  const can = (c: string) => !!(r.model.has && r.model.has(c));
  const want = r.want && can(r.want) ? r.want : null;
  const fast = r.sp > 4.5 && can('run') ? 'run' : 'follow';
  const still = can('sit') && r.idleT > idleFor * 1.5 ? (r.idleT % 14 > 12 && can('scratch') ? 'scratch' : 'sit') : null;
  const clip = want || (r.cheerT > 0 ? (can('bounce') ? 'bounce' : 'cheer') : mood && (r.sp < 2.4 || mood === 'surprised') ? mood : r.sp > 2.4 ? fast : r.sp > .5 ? 'walk'
    : night && d > 4 ? 'sleep' : still || (r.idleT % idleFor > idleFor - 2.4 ? happy : 'idle'));
  if (clip !== r.clip) { r.clip = clip; r.model.play(clip, clip === 'surprised' ? .1 : .3); }
}
// (11 Nov 2026) a companion made with Meshy: its near model (it is always beside the child), the far one when that is
// missing; Sparkle keeps the game's own see-through wings (four, drawn as the sheet has them) and glow, so only the code
// shape's body is hidden
function ask(c, still: () => boolean) {
  const name = creatureModelName(c.kind), meshy = MESHY_CREATURES.has(c.kind);
  void (meshy ? worldModel(name + '-hd', { clip: 'idle' }).then(m => m || worldModel(name, { clip: 'idle' })) : worldModel(name, { clip: 'idle' })).then(m => {
    if (!m || !still()) return; const u = c.o.userData;
    let painted = false; m.obj.traverse((o: any) => { if (o.isMesh && /^meshy-/.test((o.material && o.material.name) || '')) painted = true; });
    if (painted && c.kind === 'firefly') {   // (the code wings move to the Meshy body's back; the code glow ball, which covered it, gives way to the halo at its own tail)
      u.look.children.forEach((k: any) => { if (k.isMesh) k.visible = false; });
      sparkleWings(c, m);   // (11 Nov 2026, owner: "thiếu cánh": the code's two small pale ovals hardly showed; four wings as the sheet draws them, on the body bone)
      if (u.glow) u.glow.visible = false;
      u.body.children.forEach((k: any) => { if (k.isSprite) { k.position.set(0, -.17, -.02); k.scale.setScalar(.55); } });
    } else u.look.visible = false;
    u.body.add(m.obj); c.model = m; c.clip = 'idle'; c.hatId = undefined;   // (its hat goes on again, on the model's head)
  });
}
// a trick: its happy flap; lighting the way: surprised to have spotted it, then follow; flying after the child: fly;
// resting with the child at night: asleep
function flyTick(c, from, dt: number) {
  const sp = from.distanceTo(c.o.position) / Math.max(dt, 1e-3), night = !!(G && G.world && G.world.isNight && G.world.isNight());
  c.stillT = sp < .4 ? (c.stillT || 0) + dt : 0; c.moodT = Math.max(0, (c.moodT || 0) - dt);
  if (c.lead && !c.wasLead) c.moodT = 1.1; c.wasLead = !!c.lead;
  const clip = c.trick ? 'flap' : c.moodT > 0 ? 'surprised' : c.lead ? 'follow' : sp > 1.2 ? 'fly' : night && c.stillT > 6 ? 'sleep' : 'idle';
  if (clip !== c.clip) { c.clip = clip; c.model.play(clip); }
}
export function startCreatureModels(game?: any) { G = game || null; if (G && G.world && G.world.updaters) G.world.updaters.push(_look); useCreatureModels({ near, tick }); useCompanionModels({ ask, tick: flyTick }); }
