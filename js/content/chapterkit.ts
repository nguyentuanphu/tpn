// (v1.08b story) A shared kit for the lantern story's later chapters (4: Christmas and New Year, 5: Huế, Đà Nẵng,
// Melbourne and Uluru, and the Tết finale): each chapter file gives its people, its places and its three hiding spots,
// and this builds them the way chapter 3's own file does (js/content/chapter3sydney.ts), so each new chapter is words
// and a little data, not another 200 lines. Nothing here moves the map (CLAUDE.md helper rule 4): everything stands on
// free ground round places already there, off the roads and streets, and only while a child is in that chapter.
// js/lanterns.ts loads a chapter's file once a child playing has found the chapter before's lantern (PERF-001).
import { THREE, glow } from '../gfx.js';
import { T } from '../i18n.js';
import { heightAt, roadDist, WATER, CITIES } from '../world.js';
import { PLACES as MAP_PLACES } from './map.js';
import { buildAvatar, nameAvatar } from '../avatar.js';
import { buildLantern } from '../dinh.js';
import { STORY_LINES } from './chapters.js';
import type { StoryPair } from '../../types/story.js';

export type PlaceRef = { city?: string; landmark?: string; site?: string; game?: string; gate?: string; at?: [number, number]; dx?: number; dz?: number }; // (v1.08d s2vn: at, a spot itself)
export type KitPerson = { id: string; name: string; look: Record<string, unknown>; at: PlaceRef; small?: boolean };
export type ClueKind = 'tree' | 'gift' | 'star' | 'rock' | 'gum' | 'peach' | 'mai' | 'boat';
export type KitDef = {
  id: string;                              // the chapter id (ch4, ch5, finale)
  people: KitPerson[];                     // stand-ins, each a spot of its own id
  spots: Record<string, PlaceRef>;         // more spots the steps point at (the place to fly to, a game host...)
  find: { step: string; around: PlaceRef; clues: [ClueKind, string, StoryPair][]; found: StoryPair; miss: StoryPair }; // the right one first
  hang: PlaceRef;                          // where the lantern is hung (the landmark lights up)
  show: { line: StoryPair; colors: string[] };
};

const at0 = (r: PlaceRef, G): { x: number; z: number } => {
  let p: { x: number; z: number } | null = null;
  if (r.city) { const c = CITIES.find(c => c.id === r.city); if (c) p = { x: c.x, z: c.z }; }
  if (!p && r.landmark) { const l = (G.LANDMARKS || []).find(l => l.id === r.landmark); if (l) p = { x: l.mx ?? l.x, z: l.mz ?? l.z }; }
  if (r.gate) { const c = CITIES.find(c => c.id === r.gate), g = c && (c.gates || [])[0]; if (g) p = { x: g[0] + 4, z: g[1] }; else if (c) p = { x: c.x1 + 4, z: c.z }; }
  if (!p && r.game) { const i = G.interactables.find(i => i.id === 'g_' + r.game); if (i) p = { x: i.x, z: i.z }; }
  if (!p && r.site) { const s = MAP_PLACES.find(s => s.id === r.site); if (s) p = { x: s.at[0], z: s.at[1] }; }
  if (!p && r.at) p = { x: r.at[0], z: r.at[1] };
  p = p || { x: 0, z: 0 };
  return { x: p.x + (r.dx || 0), z: p.z + (r.dz || 0) };
};

function clueModel(kind: ClueKind) {
  const g = new THREE.Group(), M = (c: string) => new THREE.MeshToonMaterial({ color: c });
  const add = (m: THREE.Mesh, x: number, y: number, z: number) => { m.position.set(x, y, z); g.add(m); return m; };
  if (kind === 'tree' || kind === 'gum') { add(new THREE.Mesh(new THREE.CylinderGeometry(.12, .16, 1, 6), M('#8a5a32')), 0, .5, 0);
    for (let i = 0; i < 3; i++) add(new THREE.Mesh(new THREE.ConeGeometry(.9 - i * .22, .9, 8), M(kind === 'gum' ? '#7aa860' : '#2f8a4a')), 0, 1.1 + i * .5, 0);
    if (kind === 'tree') add(new THREE.Mesh(new THREE.OctahedronGeometry(.18), glow('#ffd23f', .95)), 0, 2.6, 0); }
  if (kind === 'gift') { add(new THREE.Mesh(new THREE.BoxGeometry(.8, .6, .8), M('#e8434a')), 0, .3, 0); add(new THREE.Mesh(new THREE.BoxGeometry(.84, .64, .14), M('#ffd23f')), 0, .3, 0); add(new THREE.Mesh(new THREE.BoxGeometry(.14, .64, .84), M('#ffd23f')), 0, .3, 0); }
  if (kind === 'star') { add(new THREE.Mesh(new THREE.CylinderGeometry(.05, .05, 1.8, 6), M('#8a5a32')), 0, .9, 0); add(new THREE.Mesh(new THREE.OctahedronGeometry(.4), glow('#ffd23f', .9)), 0, 2, 0); }
  if (kind === 'rock') add(new THREE.Mesh(new THREE.DodecahedronGeometry(.8), M('#c8643a')), 0, .5, 0).scale.set(1.4, .7, 1);
  if (kind === 'peach' || kind === 'mai') { add(new THREE.Mesh(new THREE.CylinderGeometry(.08, .12, 1.4, 6), M('#6a4a32')), 0, .7, 0);
    for (let i = 0; i < 7; i++) add(new THREE.Mesh(new THREE.SphereGeometry(.22, 8, 6), M(kind === 'peach' ? '#ff9ec4' : '#ffd23f')), Math.cos(i * 2.4) * .5, 1.4 + (i % 3) * .2, Math.sin(i * 2.4) * .5); }
  if (kind === 'boat') { add(new THREE.Mesh(new THREE.BoxGeometry(1.6, .3, .6), M('#3b6fe0')), 0, .2, 0); add(new THREE.Mesh(new THREE.CylinderGeometry(.04, .04, 1.2, 6), M('#e8e4dc')), 0, .9, 0); }
  return g;
}

export function createKit(G, ctx, def: KitDef) {
  const { scene, world } = G, { say, save, A, isOn, st, big } = ctx;
  const onStreet = (x: number, z: number, r: number) => CITIES.some(c => c.layout && x > c.x0 - 2 && x < c.x1 + 2 && z > c.z0 - 2 && z < c.z1 + 2
    && Math.abs((x - c.x) * Math.cos(c.layout.toward) - (z - c.z) * Math.sin(c.layout.toward)) < 2.6 + r);
  const held: { x: number; z: number }[] = [];
  const free = (x: number, z: number, r: number, ir = 2.2) => heightAt(x, z) > WATER + .4 && (d => !d.road || d.d > d.road.w / 2 + r)(roadDist(x, z)) && !onStreet(x, z, r)
    && !world.colliders.some(c => c.r > 0 && c.top == null && Math.hypot(c.x - x, c.z - z) < c.r + r)
    && !world.boxes.some(b => x > b.x0 - r && x < b.x1 + r && z > b.z0 - r && z < b.z1 + r)
    && G.interactables.every(i => !Number.isFinite(i.x) || Math.hypot(i.x - x, i.z - z) > Math.max(r, ir)) && held.every(q => Math.hypot(q.x - x, q.z - z) > Math.max(r, ir));
  const near = (c: { x: number; z: number }, rmin: number, rmax: number, r = 1, ir = 3) => { for (let k = 0; k < 900; k++) { const a = k * 2.39996, d = rmin + k * ((rmax - rmin) / 900), x = c.x + Math.cos(a) * d, z = c.z + Math.sin(a) * d; if (free(x, z, r, ir)) { const q = { x, z }; held.push(q); return q; } } const q = { x: c.x + rmax, z: c.z }; held.push(q); return q; };

  // ---------- where the lantern is hung: mist until it is lit, then a ring of lanterns and a glow ----------
  const hangC = at0(def.hang, G), front = near(hangC, 4, 14, 1.2, 4.2), hy = heightAt(front.x, front.z);
  const lights = new THREE.Group(); lights.userData.noSolid = true; lights.position.set(front.x, hy, front.z); lights.visible = false; scene.add(lights);
  for (let i = 0; i < 8; i++) { const l = buildLantern(true); l.scale.setScalar(.55); const a = i / 8 * Math.PI * 2; l.position.set(Math.cos(a) * 3.2, 3 + Math.sin(i) * .3, Math.sin(a) * 3.2); lights.add(l); }
  const halo = new THREE.Mesh(new THREE.SphereGeometry(3.6, 16, 10), glow('#ffcf6a', .16)); halo.material.depthWrite = false; halo.position.y = 3; lights.add(halo);
  const mist = new THREE.Group(); mist.userData.noSolid = true; mist.position.set(front.x, hy, front.z); scene.add(mist);
  const mistMat = new THREE.MeshBasicMaterial({ color: '#f4f7fb', transparent: true, opacity: .3, depthWrite: false });
  for (let i = 0; i < 7; i++) { const s = new THREE.Mesh(new THREE.SphereGeometry(2 + (i % 3) * .4, 12, 8), mistMat); s.position.set(-4.5 + i * 1.5, 2 + (i % 3) * .6, Math.sin(i * 2.4) * 1.2); s.scale.y = .55; mist.add(s); }
  const paint = (on: boolean) => { lights.visible = on; mist.visible = !on; };
  const rope = { x: front.x + 1.2, z: front.z + 1.2, y0: hy + .6, y1: hy + 4.2 };

  // ---------- the three hiding spots (the lantern waits at the first) ----------
  const findC = at0(def.find.around, G), clues = def.find.clues.map(([kind, icon, look], k) => {
    const q = near(findC, 6 + k * 2, 22, 1, 4.5), o = clueModel(kind); o.position.set(q.x, heightAt(q.x, q.z), q.z); o.userData.noSolid = true; o.visible = false; scene.add(o);
    const spark = new THREE.Mesh(new THREE.SphereGeometry(.18, 8, 6), glow('#fff2a8', .8)); spark.material.depthWrite = false; spark.position.y = 2.6; o.add(spark);
    return { k, x: q.x, z: q.z, o, spark, icon, look };
  });
  const lanternAt = clues[0], key = 'clue_' + def.id, lk = 'looked_' + def.id;
  const found = buildLantern(true); found.userData.noSolid = true; found.visible = false; scene.add(found);
  found.position.set(lanternAt.x + 1, heightAt(lanternAt.x, lanternAt.z) + .45, lanternAt.z); found.rotation.z = .4;
  const clueFound = p => !!A(p)[key], looked = p => A(p)[lk] || [];
  const lookAt = (h, c) => { const a = A(h.profile); a[lk] = a[lk] || []; if (!a[lk].includes(c.k)) a[lk].push(c.k);
    if (c.k === 0) { a[key] = true; say(...def.find.found); } else say(...def.find.miss); save(); };

  // ---------- the people, only while a child is in this chapter ----------
  const people = def.people.map(P => { const q = near(at0(P.at, G), 2, 12, 1, 3), av = nameAvatar(buildAvatar(P.look, null), P.name);
    av.root.position.set(q.x, heightAt(q.x, q.z), q.z); av.root.rotation.y = Math.atan2(front.x - q.x, front.z - q.z) || 0; if (P.small) av.root.scale.setScalar(.82);
    av.root.visible = false; av.root.userData.noSolid = true; scene.add(av.root); return { id: P.id, x: q.x, z: q.z, A: av }; });

  // ---------- the show after the lantern is hung: fireworks (or lantern lights) over the landmark ----------
  const tex = (() => { const c = document.createElement('canvas'); c.width = c.height = 64; const g = c.getContext('2d')!, r = g.createRadialGradient(32, 32, 0, 32, 32, 32); r.addColorStop(0, 'rgba(255,255,255,1)'); r.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = r; g.fillRect(0, 0, 64, 64); return new THREE.CanvasTexture(c); })();
  const bursts: { s: THREE.Sprite; v: THREE.Vector3; life: number }[] = []; let showUntil = 0, nextBurst = 0;
  const startParade = () => { showUntil = performance.now() / 1000 + 45; say(...def.show.line); };

  const inChapter = () => G.heroes.some(h => { const c = ctx.current(h.profile); return c && c.ch.id === def.id; });
  world.updaters.push((dt: number, t: number) => {
    const on = inChapter();
    for (const q of people) { q.A.root.visible = on; if (on) q.A.anim(Math.floor(t * .4 + q.x) % 3 === 0 ? 'wave' : 'idle', t, 0); }
    const looking = G.heroes.filter(h => isOn(h.profile, def.find.step));
    clues.forEach(c => { c.o.visible = looking.length > 0; c.spark.visible = looking.some(h => !looked(h.profile).includes(c.k) && !clueFound(h.profile)); c.spark.position.y = 2.6 + Math.sin(t * 3 + c.k) * .12; });
    found.visible = looking.some(h => clueFound(h.profile));
    // (an under-5's companion flies over the right spot and leads the way, as in chapter 3)
    for (const h of G.heroes) if (isOn(h.profile, def.find.step) || ctx.companions().of(h)?.lead?.[def.id]) ctx.companions().lead(h, isOn(h.profile, def.find.step) && !big(h.profile) && !clueFound(h.profile) ? { x: lanternAt.x, y: heightAt(lanternAt.x, lanternAt.z) + 1.8, z: lanternAt.z, high: true, [def.id]: true } : null);
    if (lights.visible) { halo.material.opacity = .12 + Math.sin(t * 1.5) * .05; lights.children.forEach((l, i) => { if (l !== halo) l.position.y = 3 + Math.sin(t * 1.2 + i) * .25; }); }
    if (mist.visible) mist.children.forEach((m, i) => { m.position.y = 2 + (i % 3) * .6 + Math.sin(t * .6 + i) * .15; });
    if (performance.now() / 1000 < showUntil && t > nextBurst) { nextBurst = t + .6 + Math.random() * .6;
      const col = def.show.colors[Math.floor(Math.random() * def.show.colors.length)], bx = front.x + (Math.random() - .5) * 20, bz = front.z + (Math.random() - .5) * 20, by = hy + 14 + Math.random() * 6;
      for (let i = 0; i < 14; i++) { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, color: col, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending })); s.scale.setScalar(1.2); s.position.set(bx, by, bz); scene.add(s);
        const a = i / 14 * Math.PI * 2; bursts.push({ s, v: new THREE.Vector3(Math.cos(a) * 6, (Math.random() - .5) * 6, Math.sin(a) * 6), life: 1.4 }); } }
    for (let i = bursts.length - 1; i >= 0; i--) { const b = bursts[i]; b.life -= dt; b.v.y -= dt * 4; b.s.position.addScaledVector(b.v, dt); b.s.material.opacity = Math.max(0, b.life / 1.4); if (b.life <= 0) { scene.remove(b.s); b.s.material.dispose(); bursts.splice(i, 1); } }
  });

  for (const c of clues) G.interactables.push({ id: `story_${def.id}_clue${c.k}`, x: c.x, z: c.z, r: 2.4, icon: c.icon, label: () => T(...c.look),
    visible: h => ctx.actions() && isOn(h.profile, def.find.step) && !clueFound(h.profile) && !looked(h.profile).includes(c.k), act: h => lookAt(h, c) });

  const spots: Record<string, (p?: unknown) => { x: number; z: number }> = {};
  for (const [k, r] of Object.entries(def.spots)) { const c = at0(r, G); spots[k] = () => c; }
  for (const q of people) spots[q.id] = () => ({ x: q.x, z: q.z });
  spots['clues_' + def.id] = (p?: any) => { if (p && (!big(p) || clueFound(p))) return { x: lanternAt.x, z: lanternAt.z };
    const left = p ? clues.filter(c => !looked(p).includes(c.k)) : clues; const c = left[0]; return c ? { x: c.x, z: c.z } : { x: front.x, z: front.z }; };
  spots['hang_' + def.id] = () => ({ x: front.x, z: front.z });
  return { spots, onStreet, front: [front.x, front.z], lanternAt: [lanternAt.x, lanternAt.z], rope, paint, revealed: clueFound, startParade,
    showOn: () => performance.now() / 1000 < showUntil, lit: () => lights.visible, clues: clues.map(c => ({ k: c.k, x: c.x, z: c.z })), people: people.map(q => ({ id: q.id, x: q.x, z: q.z })) };
}
// the words every chapter of the kit shares (no names, so the recordings fit every child)
Object.assign(STORY_LINES, { kitLook: ['Look here!', 'Tìm ở đây!'] });
