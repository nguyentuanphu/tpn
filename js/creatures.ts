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
import { worldModel } from './modelkit.js';
import { useCreatureModels } from './animals.js';
import { useCompanionModels } from './companion.js';

export const creatureModelName = (kind: string) => 'creature-' + kind;
/** each animal's happy move (tools/blender/creatures-built.json "happy") */
export const CREATURE_HAPPY = { puppy: 'wag', kitty: 'hop', bunny: 'hop', panda: 'hop', joey: 'hop', calf: 'wag', cow: 'wag', sheep: 'wag', pig: 'wag', unicorn: 'wag', chicken: 'flap', bear: 'hop', koala: 'hop', platypus: 'hop', penguin: 'flap', emu: 'flap', turtle: 'hop', elephant: 'wag', crane: 'flap', bull: 'wag', buffalo: 'wag', peacock: 'flap' };

let since = 0, asked = 0;
function near(g, r) {
  const now = performance.now(); if (now - since > 100) { since = now; asked = 0; }
  if (asked >= 3) return;   // (at most 3 new models a moment, so a frame never stalls)
  asked++; r.asked = true;
  void worldModel(creatureModelName(r.kind), { clip: 'idle' }).then(m => {
    if (!m) return;   // (blocked or failed: the code shape stays)
    g.add(m.obj); r.root.visible = false; r.model = m; r.clip = 'idle'; r.idleT = 0; g.userData.model = m;
  });
}
// (owner, 6 Nov 2026 AEDT: "all animals need to show emotions, facial expressions, movements, eye blinks") every clip blinks;
// the moods: an animal is surprised when a child walks up, then happy to see them; sad for a moment when they walk away;
// asleep at night when nobody is near; it cheers on a pet's happy jump, and does its happy move now and then
let G: any = null;
const nearest = (g) => { let d = 1e9; if (G) for (const h of G.heroes) d = Math.min(d, Math.hypot(h.pos.x - g.position.x, h.pos.z - g.position.z)); return d; };
function tick(g, r, dt: number) {
  const d = nearest(g), night = !!(G && G.world && G.world.isNight && G.world.isNight());
  r.cheerT = Math.max(0, (r.cheerT || 0) - dt); r.moodT = Math.max(0, (r.moodT || 0) - dt); r.idleT = r.sp < .5 ? (r.idleT || 0) + dt : 0;
  if (d > 5) { if (r.metAt != null && d > 7 && r.moodT <= 0 && !r.byeDone) { r.mood = 'sad'; r.moodT = 3; r.byeDone = true; } r.far = true; }
  else if (d < 2.8 && r.far !== false) { r.far = false; r.byeDone = false; r.metAt = 0; r.mood = 'surprised'; r.moodT = 1.1; r.greet = 2.4; }
  if (r.mood === 'surprised' && r.moodT <= 0 && r.greet) { r.mood = 'happy'; r.moodT = r.greet; r.greet = 0; }
  const happy = CREATURE_HAPPY[r.kind] || 'hop', idleFor = 9 + (r.seed % 5);
  const mood = r.moodT > 0 ? (r.mood === 'happy' ? happy : r.mood) : null;
  const clip = r.cheerT > 0 ? 'cheer' : mood && (r.sp < 2.4 || mood === 'surprised') ? mood : r.sp > 2.4 ? 'follow' : r.sp > .5 ? 'walk'
    : night && d > 4 ? 'sleep' : r.idleT % idleFor > idleFor - 2.4 ? happy : 'idle';
  if (clip !== r.clip) { r.clip = clip; r.model.play(clip, clip === 'surprised' ? .1 : .3); }
}
function ask(c, still: () => boolean) {
  void worldModel(creatureModelName(c.kind), { clip: 'idle' }).then(m => {
    if (!m || !still()) return; const u = c.o.userData; u.look.visible = false; u.body.add(m.obj); c.model = m; c.clip = 'idle';
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
export function startCreatureModels(game?: any) { G = game || null; useCreatureModels({ near, tick }); useCompanionModels({ ask, tick: flyTick }); }
