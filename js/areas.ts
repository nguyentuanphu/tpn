// (v1.08d valley, owner 5 Nov 2026 AEDT: "the valley building as the child walks"; tasks #25 #32 #39 #41, issue #36)
// Parts of the valley a child does not need where they start are built after the valley is ready, one part in each quiet
// moment of the page, while the child plays:
// - each part has a place on the map; the part nearest the child comes first, and of two parts the one the child is
//   walking towards comes first (the walk direction counts as if that part were 40 % nearer);
// - a part farther than NEAR m from the child waits until the child comes within NEAR m, or flies there: G.travel asks
//   areasNear() for the parts round the place it lands on and builds them while its blue fade is up (a short, soft
//   loading moment);
// - what a part adds (scene objects and their every-frame work) is noted; when the child is farther than SLEEP m away
//   the part sleeps: its objects are hidden and its every-frame work stops, and both come back when the child is within
//   WAKE m (the gap keeps a part from blinking at the edge). A part that sleeps is still on the map, so nothing about
//   the places, solids or tapping changes; only its drawing and moving stop.
// Every part is built once and never again: a part's builder places its own things on the ground as it is then (the
// ground is final by the time the parts are built: roads, level land and the land under buildings are done first).
// The checks wait for areasDone() before they play (tests/harness.mts start), and check `areastream` flies to every part.
import type { SvMain } from './main.js';

export const NEAR = 150, SLEEP = 170, WAKE = 140;
type Part = { id: string, x: number, z: number, build: () => unknown, built: boolean, building?: Promise<void>, objects: { o: { visible: boolean }, was: boolean }[], updaters: number[], asleep: boolean, ms?: number };
const parts: Part[] = [];
let G: SvMain = null, started = false, last: { x: number, z: number } = null, dir = { x: 0, z: 0 }, chain: Promise<unknown> = Promise.resolve();
const doneWaiters: (() => void)[] = [];
const waiting: (() => void)[] = [];
let afterEach: () => void = () => { };

/** adds a part of the valley, built after the start (where: its place on the map) */
export function addArea(id: string, [x, z]: [number, number], build: () => unknown) {
  parts.push({ id, x, z, build, built: false, objects: [], updaters: [], asleep: false });
}
/** the parts still to be built, and every part (for the checks) */
export const areasLeft = () => parts.filter(p => !p.built).length;
export const areaList = () => parts.map(p => ({ id: p.id, x: p.x, z: p.z, built: p.built, asleep: p.asleep, ms: p.ms }));
/** resolves when every part is built */
export function areasDone(): Promise<void> { return areasLeft() ? new Promise(r => doneWaiters.push(r)) : Promise.resolve(); }

// (after a flight the landing spot counts for 1.5 s: the child is put there a moment after the parts are built)
let landing: { x: number, z: number, until: number } = null;
const here = () => { if (landing && performance.now() < landing.until) return landing; const h = G && G.heroes && G.heroes[0]; return h ? { x: h.pos.x, z: h.pos.z } : last; };
const idle = () => new Promise<void>(r => (window as any).requestIdleCallback ? (window as any).requestIdleCallback(() => r(), { timeout: 250 }) : setTimeout(r, 60));

function buildPart(p: Part): Promise<void> {
  if (p.built) return Promise.resolve();
  if (p.building) return p.building;
  return (p.building = (async () => {
    const { scene, world } = G, before = new Set(scene.children), ups = world.updaters.length, t0 = performance.now();
    try { await p.build(); } catch (e) { console.warn('area ' + p.id, e); }
    p.ms = Math.round(performance.now() - t0);
    for (const o of scene.children) if (!before.has(o) && !(o.userData && (o.userData.avatar || o.userData.moving))) p.objects.push({ o, was: o.visible });
    // its every-frame work stops while it sleeps (each is wrapped where it is, so the order of the others stays)
    for (let i = ups; i < world.updaters.length; i++) { const u = world.updaters[i]; world.updaters[i] = (dt, t) => { if (!p.asleep) u(dt, t); }; p.updaters.push(i); }
    p.built = true; afterEach();
    if (!areasLeft()) doneWaiters.splice(0).forEach(r => r());
  })());
}

/** builds at once the parts within r m of (x, z) (G.travel, while its fade is up) */
export async function areasNear(x: number, z: number, r = NEAR) {
  for (const p of parts) if (!p.built && Math.hypot(p.x - x, p.z - z) < r) await buildPart(p);
  last = { x, z }; landing = { x, z, until: performance.now() + 1500 }; wakeSleep(x, z);
}

function wakeSleep(x: number, z: number) {
  for (const p of parts) {
    if (!p.built) continue;
    const d = Math.hypot(p.x - x, p.z - z), sleep = p.asleep ? d > WAKE : d > SLEEP;
    if (sleep === p.asleep) continue;
    p.asleep = sleep;
    for (const k of p.objects) { if (sleep) { k.was = k.o.visible; k.o.visible = false; } else k.o.visible = k.was; }
  }
}

// the next part to build: the nearest within NEAR m, the walk direction counting
function next(): Part {
  const at = here(); if (!at) return null;
  let best: Part = null, bs = 1e9;
  for (const p of parts) {
    if (p.built || p.building) continue;
    const dx = p.x - at.x, dz = p.z - at.z, d = Math.hypot(dx, dz); if (d > NEAR) continue;
    const ahead = d ? (dx * dir.x + dz * dir.z) / d : 0, s = d * (1 - .4 * Math.max(0, ahead));
    if (s < bs) { bs = s; best = p; }
  }
  return best;
}

async function run() {
  for (;;) {
    await idle();
    const at = here();
    if (at && last) { const mx = at.x - last.x, mz = at.z - last.z, m = Math.hypot(mx, mz); if (m > .5) { dir = { x: mx / m, z: mz / m }; } }
    if (at) last = at;
    const p = next();
    if (p) { await buildPart(p); continue; }
    if (!areasLeft()) await new Promise<void>(r => { waiting.push(r); setTimeout(r, 1500); });
    else await new Promise(r => setTimeout(r, 500)); // (parts far away: look again in a moment)
    waiting.splice(0);
  }
}

/** starts building the parts (after the valley is ready); where: the child's start (before a child is chosen);
 * each: run after every part is built (the new things' bubbles, claims, solids) */
export function startAreas(main: SvMain, where: { x: number, z: number }, each: () => void) {
  if (started) return; started = true; G = main; last = where; afterEach = each;
  // sleeping and waking: looked at four times a second (a few distances, no drawing)
  let acc = 0; G.world.updaters.push(dt => { acc += dt; if (acc < .25) return; acc = 0; const at = here(); if (at) wakeSleep(at.x, at.z); });
  chain = chain.then(run);
}
