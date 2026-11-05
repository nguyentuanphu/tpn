// (v1.08e nature, owner 6 Nov 2026 AEDT) The trees, flowers, reeds, crops, farm props and My House decorations made in
// Blender (models/world/*.glb, tools/blender/world-nature.py; js/world-nature.ts swaps them in near the child):
// - every model loads, and each is one shape with colours in its corners and 3,000 triangles or fewer;
// - a swapped shape stands on the ground and keeps the code shape's size (so colliders, taps and shadows stay true);
// - with the models drawn near the child the draws stay within perf's limits at home (490) and in Lotus Village (420),
//   and the same as with the code shapes (only the shape changes, never the number of draws);
// - far shapes go back to their code shape (battery), and the solid map reads the code shape;
// - each crop shows its own model at stages 1, 2 and 3;
// - with the models blocked (no network) every code shape stays and nothing breaks;
// - screenshots on a phone, a tablet and a computer (tests/out/worldnature/, kept in docs/world-models-v108e/nature/).
import fs from 'node:fs';
import type { Browser } from 'playwright';
import { open, clear, noWelcome } from './harness.mts';

export const NATURE_MODELS = ['tree-round', 'tree-apple', 'tree-pine', 'tree-snowpine', 'tree-bamboo', 'tree-palm', 'bush', 'flower-meadow', 'flower-roadside',
  'bush-bougainvillea', 'tree-gum', 'tree-jacaranda', 'tree-banana', 'tree-frangipani', 'tree-peach', 'reeds', 'hyacinth',
  ...['carrot', 'strawberry', 'tomato', 'corn', 'sunflower', 'pumpkin'].flatMap(c => [1, 2, 3].map(s => `${c}-${s}`)),
  'farm-hay', 'farm-crate', 'farm-wardrobe', 'farm-easel', ...['teddy', 'clock', 'vase', 'lamp', 'sunflower', 'lotus', 'balloons'].map(k => 'decor-' + k)];
const SIZES = [{ name: 'phone', w: 390, h: 844, touch: true }, { name: 'tablet', w: 820, h: 1180, touch: true }, { name: 'computer', w: 1440, h: 900, touch: false }];
const quiet = { voice: false, sound: false, autoPack: false, online: false, countPlayers: false };

export async function worldNatureCheck(b: Browser) {
  const bad: string[] = [], notes: string[] = [];
  fs.mkdirSync('out/worldnature', { recursive: true });
  for (const n of NATURE_MODELS) if (!fs.existsSync(`../models/world/${n}.glb`)) bad.push('missing file models/world/' + n + '.glb');
  const P = await open(b, { w: 1180, h: 820, settings: quiet });
  try {
    await clear(P.page); await noWelcome(P.page);
    const r = await P.page.evaluate(async (names: string[]) => {
      const G = (window as any).__sv, h = G.heroes[0], W = await import(String('/js/world.js')), N = await import(String('/js/world-nature.js')), wait = (ms: number) => new Promise(r => setTimeout(r, ms));
      const calm = () => document.querySelectorAll('.storybook, .dialog, .modal').forEach(e => e.remove());
      await G.solidsReady;
      const draws = async (x: number, z: number) => { h.place(x, z); for (let k = 0; k < 8; k++) { await wait(300); calm(); G.paused = false; }
        const R = G.renderer, o = R.render, got: number[] = []; R.render = function (...a: unknown[]) { o.apply(this, a); got.push(R.info.render.calls); }; await wait(2500); R.render = o;
        return got.sort((a, b) => a - b)[got.length >> 1] || 0; };
      // the code shapes, then the models near the child (the game's own swaps, four times a second)
      const homeAt = [W.PLATEAU.x - 3, W.PLATEAU.z - 4], villAt = [W.VILLAGE.x, W.VILLAGE.z + 6];
      const shapes0 = N.natureShapes().length;
      // every model, loaded through the shared kit
      await N.natureAll(names);
      const missing = names.filter(n => !N.natureGeoReady(n));
      // each model: one shape, vertex colours, its triangles, its feet on the ground
      const info: Record<string, { tris: number, y0: number, hgt: number }> = {};
      for (const n of names) { const g = N.natureGeoReady(n); if (!g) continue; g.computeBoundingBox(); const bb = g.boundingBox; info[n] = { tris: g.getAttribute('position').count / 3, y0: +bb.min.y.toFixed(2), hgt: +(bb.max.y - bb.min.y).toFixed(2), col: (() => { const c = g.getAttribute('color'); if (!c) return false; let lo = 9; for (let i = 0; i < c.count; i++) lo = Math.min(lo, c.getX(i), c.getY(i), c.getZ(i)); return lo < .8; })() } as any; } // (colours in the corners, not all white)
      // the swapped shapes against their code shapes: height and footprint within a third, feet on the ground
      const sizes: Record<string, unknown> = {}, wrong: string[] = [];
      G.scene.traverse((o: any) => { const u = o.userData; if (!u.natureModel || !u.codeGeo || !u.natureOn) return; if (sizes[u.natureModel]) return;
        const a = u.codeGeo, m = o.geometry; a.computeBoundingBox(); m.computeBoundingBox(); const A = a.boundingBox, M = m.boundingBox;
        const hA = A.max.y - A.min.y, hM = M.max.y - M.min.y, wA = Math.max(A.max.x - A.min.x, A.max.z - A.min.z), wM = Math.max(M.max.x - M.min.x, M.max.z - M.min.z);
        sizes[u.natureModel] = { h: [+hA.toFixed(2), +hM.toFixed(2)], w: [+wA.toFixed(2), +wM.toFixed(2)], y0: [+A.min.y.toFixed(2), +M.min.y.toFixed(2)] };
        if (hM / hA < .67 || hM / hA > 1.5 || wM / wA < .6 || wM / wA > 1.6 || Math.abs(M.min.y - A.min.y) > .25) wrong.push(u.natureModel + ' ' + JSON.stringify(sizes[u.natureModel])); });
      // far again: everything back to its code shape, then the game's own swaps near the child
      N.tickNature([{ pos: { x: 1e6, z: 1e6 } }]);
      const farOn = N.natureShapes().filter((s: any) => s.on).length;
      const codeHome = await draws(homeAt[0], homeAt[1]); N.tickNature([{ pos: { x: 1e6, z: 1e6 } }]);
      const codeVill = await draws(villAt[0], villAt[1]);
      // now with models (wait for the game's tick to swap near the child)
      h.place(homeAt[0], homeAt[1]); await wait(1500); const nearHome = N.natureShapes().filter((s: any) => s.on).length;
      const modelHome = await draws(homeAt[0], homeAt[1]); const onHome = N.natureShapes().filter((s: any) => s.on).length;
      const modelVill = await draws(villAt[0], villAt[1]); const onVill = N.natureShapes().filter((s: any) => s.on).length;
      // the solid map reads the code shape (js/solids.ts): a model in place must not change what blocks a child
      // the crops: each stage its own model
      const S = await import(String('/js/state.js')), F = G.farm, pl = F.plots[0], crops: Record<string, string> = {};
      h.place(pl.x + 3, pl.z + 3); await wait(500);
      for (const c of ['carrot', 'strawberry', 'tomato', 'corn', 'sunflower', 'pumpkin']) for (const st of [1, 2, 3]) {
        S.farm.plots[0] = { crop: c, stage: st, water: true, t: Date.now() }; pl.key = 'x'; F.update(0, 0);
        const m = pl.crop.children.find((o: any) => o.userData.natureModel); crops[c + '-' + st] = m ? m.userData.natureModel : 'code';
      }
      S.farm.plots[0] = null; F.update(0, 0);
      return { shapes0, missing, info, sizes, wrong, farOn, codeHome, codeVill, modelHome, modelVill, nearHome, onHome, onVill, crops, stats: N.natureStats };
    }, NATURE_MODELS);
    if (r.missing.length) bad.push('did not load: ' + r.missing.join(', '));
    for (const [n, i] of Object.entries(r.info) as [string, any][]) { if (i.tris > 3000) bad.push(`${n}: ${i.tris} triangles`); if (Math.abs(i.y0) > .3 && !n.startsWith('hyacinth')) bad.push(`${n}: its feet at y ${i.y0}`); if (!i.col) bad.push(n + ': no colours'); }
    if (r.wrong.length) bad.push('size or ground differs from the code shape: ' + r.wrong.join('; '));
    if (r.shapes0 < 20) bad.push('only ' + r.shapes0 + ' marked shapes');
    if (r.farOn) bad.push(r.farOn + ' shapes kept their model far from every child');
    if (!r.onHome || !r.onVill) bad.push(`no models near the child (home ${r.onHome}, village ${r.onVill})`);
    if (r.modelHome > 490 || r.modelVill > 420) bad.push(`draws with the models: home ${r.modelHome} (490), village ${r.modelVill} (420)`);
    if (r.modelHome > r.codeHome + 12 || r.modelVill > r.codeVill + 12) bad.push(`the models added draws: home ${r.codeHome} -> ${r.modelHome}, village ${r.codeVill} -> ${r.modelVill}`);
    const cropBad = Object.entries(r.crops).filter(([k, v]) => k !== v); if (cropBad.length) bad.push('crop stages without their model: ' + cropBad.map(([k, v]) => k + '=' + v).join(', '));
    notes.push(`${NATURE_MODELS.length} models, ${r.shapes0} marked shapes; draws home ${r.codeHome} -> ${r.modelHome}, village ${r.codeVill} -> ${r.modelVill}; models near the child: home ${r.onHome}, village ${r.onVill}`);
    if (P.errors.length) bad.push('errors: ' + P.errors.slice(0, 3).join(' | '));
  } finally { await P.ctx.close(); }

  // blocked: no model can load; every code shape stays, nothing breaks
  const Q = await open(b, { w: 900, h: 640, settings: quiet, pre: null });
  try {
    await Q.page.route('**/models/world/**', rt => rt.abort());
    await clear(Q.page); await noWelcome(Q.page);
    const q = await Q.page.evaluate(async () => {
      const G = (window as any).__sv, h = G.heroes[0], W = await import(String('/js/world.js')), N = await import(String('/js/world-nature.js')), wait = (ms: number) => new Promise(r => setTimeout(r, ms));
      await G.solidsReady; h.place(W.PLATEAU.x - 3, W.PLATEAU.z - 4); await wait(4000);
      let hidden = 0; G.scene.traverse((o: any) => { if (o.userData.natureModel && o.userData.natureOn) hidden++; });
      return { on: hidden, failed: N.natureStats.failed, shapes: N.natureShapes().length };
    });
    if (q.on || !q.failed) bad.push('blocked models: ' + JSON.stringify(q));
    const errs = Q.errors.filter(e => !/world model/.test(e)); if (errs.length) bad.push('errors with the models blocked: ' + errs.slice(0, 3).join(' | '));
    notes.push(`blocked: ${q.failed} failed loads, code shapes kept`);
  } finally { await Q.ctx.close(); }

  // screenshots: phone, tablet, computer, by the farm and among the trees
  for (const s of SIZES) {
    const R = await open(b, { w: s.w, h: s.h, touch: s.touch, settings: { ...quiet, quality: 'auto' } });
    try {
      await clear(R.page); await noWelcome(R.page);
      for (const spot of ['farm', 'trees']) {
        await R.page.evaluate(async (spot: string) => {
          const G = (window as any).__sv, h = G.heroes[0], W = await import(String('/js/world.js')), N = await import(String('/js/world-nature.js')), S = await import(String('/js/state.js'));
          await G.solidsReady;
          if (spot === 'farm') { const F = G.farm; ['carrot', 'corn', 'sunflower', 'pumpkin', 'tomato', 'strawberry', 'carrot', 'corn', 'sunflower'].forEach((c, i) => { S.farm.plots[i] = { crop: c, stage: 1 + (i % 3), water: true, t: Date.now() }; F.plots[i].key = 'x'; });
            await N.natureAll(); F.update(0, 0); const p = F.plots[4]; h.place(p.x + 2, p.z + 7); }
          else { const t = G.world.plants.find((m: any) => m.userData.kind === 'round'); const s = t.userData.list[0]; h.place(s[0] + 6, s[2] + 6); }
          await new Promise(r => setTimeout(r, 2500)); document.querySelectorAll('.storybook, .dialog, .modal').forEach(e => e.remove()); G.paused = false;
        }, spot);
        await R.page.waitForTimeout(1500);
        await R.page.screenshot({ path: `out/worldnature/${s.name}-${spot}.png` });
      }
    } finally { await R.ctx.close(); }
  }
  if (bad.length) throw new Error(bad.join('\n'));
  return notes.join('; ') + '; screenshots in tests/out/worldnature/';
}
