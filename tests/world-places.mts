// (v1.08e places, owner 6 Nov 2026 AEDT) The landmarks, bridges and buildings remade in Blender (models/world/, made by
// tools/make-places.mts) take their code shape's place when a child comes near:
//  - every tagged code shape gets its model, one mesh each (the same draws as the code shape and its outline);
//  - each model stands where its code shape stood: on the ground (no floating, no sinking), the same size, facing the same
//    way, and inside the code shape's footprint so colliders and hit areas stay true (no walking into a wall, no wall in
//    the air);
//  - a walk across the The Huc bridge and through the Three Regions Market gate, and round each famous landmark;
//  - when a model cannot load (no network, an old phone), its code shape stays, and nothing breaks.
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import type { Browser } from 'playwright';
import { open, clear, noWelcome } from './harness.mts';

const FAMOUS = ['lm-turtle', 'lm-thehuc', 'lm-vanmieu', 'lm-onepillar', 'lm-benthanh', 'lm-opera', 'br-harbour'];
export async function worldPlacesCheck(browser: Browser) {
  const spec = JSON.parse(await fs.readFile(new URL('../tools/blender/places-spec.json', import.meta.url), 'utf8'));
  for (const n of Object.keys(spec)) await fs.access(new URL(`../models/world/${n}.glb`, import.meta.url));
  const sw = await fs.readFile(new URL('../sw.ts', import.meta.url), 'utf8');
  // (Release, 6 Nov 2026 AEDT: a light install) the world models are not in the install list; the service worker keeps each
  // one in the sv-models-<version> cache the first time a child comes near it, so every places model is kept offline that way
  const inList = Object.keys(spec).filter(n => sw.includes(`'models/world/${n}.glb'`));
  assert.deepEqual(inList, [], 'no places model in the install list (sw.ts): they are kept when first met');
  assert.ok(/url\.pathname\.includes\('\/models\/world\/'\)[^\n]*sv-models-/.test(sw), 'the service worker keeps the world models (sv-models-<version>) when first fetched');
  const notes: string[] = [];
  const P = await open(browser, { w: 900, h: 700, settings: { voice: false, online: false, festival: 'tet' } });   // (Tết on: the festival props)
  try {
    await clear(P.page); await noWelcome(P.page);
    const r = await P.page.evaluate(async (FAMOUS) => {
      const G = (window as any).__sv; G.paused = true;
      const K = await import(String('/js/modelkit.js')), { THREE } = await import(String('/js/gfx.js'));
      K.adoptWorldTags(); await K.wakeAllWorldModels();
      G.scene.updateMatrixWorld(true);
      const rows: any[] = [], errors: string[] = [];
      G.scene.traverse((o: any) => {
        const name = o.userData.worldTag; if (!name) return;
        const fb = o.userData.fallback, g = fb.geometry; g.computeBoundingBox();
        const a = g.boundingBox.clone().applyMatrix4(fb.matrixWorld), b = new THREE.Box3(); let meshes = 0;
        o.traverse((m: any) => { if (!m.isMesh || m.userData.outline) return; for (let n = m; n && n !== o; n = n.parent) if (n.userData.carried) return; meshes++; m.geometry.computeBoundingBox(); b.union(m.geometry.boundingBox.clone().applyMatrix4(m.matrixWorld)); });
        const as = a.getSize(new THREE.Vector3()), bs = b.getSize(new THREE.Vector3());
        const row = { name, meshes, ground: +(b.min.y - a.min.y).toFixed(2), h: +(bs.y / as.y).toFixed(2), out: +Math.max(a.min.x - b.min.x, b.max.x - a.max.x, a.min.z - b.min.z, b.max.z - a.max.z).toFixed(2),
          cover: +(Math.min(bs.x, as.x) * Math.min(bs.z, as.z) / (as.x * as.z)).toFixed(2), hidden: !fb.visible, x: +a.getCenter(new THREE.Vector3()).x.toFixed(1), z: +a.getCenter(new THREE.Vector3()).z.toFixed(1) };
        rows.push(row);
        if (meshes !== 1) errors.push(`${name}: ${meshes} meshes (one draw each)`);
        if (Math.abs(row.ground) > .35) errors.push(`${name}: ${row.ground > 0 ? 'floats' : 'sinks'} ${row.ground} m`);
        if (row.h < .7 || row.h > 1.35) errors.push(`${name}: height ${row.h} of the code shape`);
        if (row.out > .8) errors.push(`${name}: ${row.out} m outside the code shape (an invisible wall or a wall to walk through)`);
        if (row.cover < .6) errors.push(`${name}: covers only ${row.cover} of the code shape (turned or too small)`);
        if (!row.hidden) errors.push(`${name}: the code shape is still drawn`);
      });
      for (const n of FAMOUS) if (!rows.some(r => r.name === n)) errors.push(`${n}: no model in the valley`);
      // walks: across the The Huc deck (the deck the child stands on stays where it was) and through the market gate
      const W = G.world, lm = (await import(String('/js/regions.js'))).LANDMARKS, hu = lm.find((l: any) => l.id === 'thehuc');
      const walk = (x0: number, z0: number, x1: number, z1: number) => { const p = { x: x0, y: 0, z: z0 }; let stuck = 0; for (let i = 0; i <= 60; i++) { const tx = x0 + (x1 - x0) * i / 60, tz = z0 + (z1 - z0) * i / 60; p.x = tx; p.z = tz; p.y = W.groundAt(tx, tz) + .1; W.collide(p, .45); if (Math.hypot(p.x - tx, p.z - tz) > .3) stuck++; } return stuck; };
      if (hu) { const s = walk(hu.mx - 6.5, hu.mz, hu.mx + 5.5, hu.mz) + walk(hu.mx, hu.mz - 6.5, hu.mx, hu.mz + 5.5); const across = Math.min(s, 99); if (across > 40) errors.push('The Huc bridge: the walk across is blocked'); }
      const M = (await import(String('/js/content/map.js'))).MARKET; if (M && walk(M.x0 - 4, M.roadZ, M.x0 + 6, M.roadZ) > 0) errors.push('market gate: the walk through the gate is blocked');
      // round each famous landmark at a child's distance: the same colliders as before (the model adds none)
      return { rows, errors, colliders: W.colliders.length };
    }, FAMOUS);
    for (const e of r.errors) notes.push(e);
    // the festival props (js/festivals.ts): all eight load and join the Tết decorations' patches (no extra draws)
    const fp = await P.page.evaluate(async () => { const F = await import(String('/js/festivals.js'));
      for (let i = 0; i < 120 && F.festivalPropsReady().length < 8; i++) await new Promise(r => setTimeout(r, 250));
      return F.festivalPropsReady(); });
    if (fp.length !== 8) notes.push('festival props loaded: ' + fp.join(', '));
    await fs.mkdir('out/worldplaces', { recursive: true });
    await fs.writeFile('out/worldplaces/models.json', JSON.stringify(r.rows, null, 1));
    assert.deepEqual(notes, [], notes.join('\n'));
    assert.deepEqual(P.errors, []);
    var count = r.rows.length;
  } finally { await P.ctx.close(); }
  // a model that cannot load: the code shape stays and nothing breaks
  const Q = await open(browser, { w: 900, h: 700, settings: { voice: false, online: false }, route: async ctx => { await ctx.route('**/models/world/lm-turtle.glb', r => r.abort()); } });
  try {
    await clear(Q.page); await noWelcome(Q.page);
    const b = await Q.page.evaluate(async () => {
      const G = (window as any).__sv; G.paused = true; const K = await import(String('/js/modelkit.js'));
      K.adoptWorldTags(); await K.wakeAllWorldModels(); let fb: any = null, model = false;
      G.scene.traverse((o: any) => { if (o.userData.worldTag === 'lm-turtle') model = true; });
      const { WORLD_TAGS } = await import(String('/js/gfx.js'));
      return { failed: K.worldModelFailed('lm-turtle'), model, waiting: WORLD_TAGS.length };
    });
    assert.ok(b.failed && !b.model, 'the turtle tower keeps its code shape when its model is blocked');
    assert.deepEqual(Q.errors.filter(e => !/world model/.test(e)), []);
  } finally { await Q.ctx.close(); }
  return `${count} places models: on the ground, the code shape's size and facing, one draw each; 8 festival props in the Tet patches; The Huc bridge and the market gate walk through; a blocked model keeps its code shape`;
}
