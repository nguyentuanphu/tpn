// (v1.08e creatures, owner 6 Nov 2026 AEDT) The animals, pets and companions of the 3D world, made in Blender
// (tools/blender/world-creatures.py, tools/make-creatures.mts → models/world/creature-<kind>.glb). Loaded after the start
// (js/main.ts), so nothing here is in the first download.
// - An animal (js/animals.ts) asks for its model the first time a child comes near (tickAnimals only runs for animals
//   within 60 m of a child), at most 3 a moment. The model goes where the code shape stands; the code shape (rig.root) is
//   hidden, not removed: it stays as the fallback when the model cannot load (no network, an old phone).
// - Pets are animals too: they are always near their child, so their models come at once.
// - The child's companion (js/companion.ts) gets its model as soon as the child has one.
// - The clips: idle, walk (companions: fly), the happy move (wag, hop or flap), follow and cheer.
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
// walking, following, cheering (a pet's happy jump, js/pets.ts animalCheer), and now and then its happy move
function tick(g, r, dt: number) {
  r.cheerT = Math.max(0, (r.cheerT || 0) - dt); r.idleT = r.sp < .5 ? (r.idleT || 0) + dt : 0;
  const happy = CREATURE_HAPPY[r.kind] || 'hop', idleFor = 9 + (r.seed % 5);
  const clip = r.cheerT > 0 ? 'cheer' : r.sp > 2.4 ? 'follow' : r.sp > .5 ? 'walk' : r.idleT % idleFor > idleFor - 2.4 ? happy : 'idle';
  if (clip !== r.clip) { r.clip = clip; r.model.play(clip); }
}
function ask(c, still: () => boolean) {
  void worldModel(creatureModelName(c.kind), { clip: 'idle' }).then(m => {
    if (!m || !still()) return; const u = c.o.userData; u.look.visible = false; u.body.add(m.obj); c.model = m; c.clip = 'idle';
  });
}
// a trick: its happy flap; lighting the way: follow; flying after the child: fly
function flyTick(c, from, dt: number) {
  const sp = from.distanceTo(c.o.position) / Math.max(dt, 1e-3), clip = c.trick ? 'flap' : c.lead ? 'follow' : sp > 1.2 ? 'fly' : 'idle';
  if (clip !== c.clip) { c.clip = clip; c.model.play(clip); }
}
export function startCreatureModels() { useCreatureModels({ near, tick }); useCompanionModels({ ask, tick: flyTick }); }
