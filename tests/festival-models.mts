// (v1.08g festivals, owner 6 Nov 2026 AEDT: "Go, but richer") The festivals' Blender pieces (models/world/fe-*.glb,
// tools/blender/world-festivals.py; js/festivals.ts FEST_MODELS):
// - every model file is there and loads; each is one shape with colours in its corners, about 2,000 triangles at most;
// - a festival on today (scheduled in Studio) fetches its theme's models and the shared ones, and its decorations use
//   them; no colour slot is left unpainted (pure red, blue or green corners); the draws in Lotus Village stay within
//   perf's limit (420) with a festival on;
// - the lantern quest's lantern takes its ribbed body and gold trim; the folk show's post and stage take their models;
// - with the models blocked (no network) the code pieces stay and nothing breaks;
// - screenshots on a phone, a tablet and a computer at Tet, Mid-Autumn (lanterns), Halloween and Diwali
//   (tests/out/festmodels/, kept in docs/world-models-v108g/festivals/).
import fs from 'node:fs';
import type { Browser } from 'playwright';
import { open, clear, noWelcome } from './harness.mts';

export const SINGLES = ['fe-questlantern-body', 'fe-questlantern-trim', 'fe-hoilang-pole', 'fe-hoilang-flag', 'fe-folk-post', 'fe-folk-stage', 'fe-kite'];
const SIZES = [{ name: 'phone', w: 390, h: 844, touch: true }, { name: 'tablet', w: 820, h: 1180, touch: true }, { name: 'computer', w: 1280, h: 800, touch: false }];
const quiet = { voice: false, sound: false, autoPack: false, online: false, countPlayers: false };
// schedule one festival for today (Studio's Releases page, as the festivals check does) and wait for its models
const schedule = async (page, theme: string, wantModels = true) => page.evaluate(async ({ theme, wantModels }) => {
  const G = (window as any).__sv, C = (await import(String('/js/custom.js'))).CUSTOM, { FESTCAL } = await import(String('/js/content/festcal.js')), F = await import(String('/js/festivals.js'));
  const ymd = (await import(String('/js/content/festival-visibility.js'))).sydneyFestivalDate(), f = FESTCAL.find(x => x.theme === theme && x.kind === 'party') || FESTCAL.find(x => x.theme === theme);
  C.releases = { ...(C.releases || {}), ['fest_' + f.id]: { on: true, start: ymd, days: 1 } }; G.festivals.rebuild();
  const need = [...F.FEST_MODELS.shared, ...(F.FEST_MODELS[theme] || [])];
  for (let k = 0; k < 120 && wantModels && !need.every(n => F.festivalPropsReady().includes(n)); k++) await new Promise(r => setTimeout(r, 250));
  G.festivals.rebuild(); await new Promise(r => setTimeout(r, 400));
  return { id: f.id, where: f.where, ready: need.filter(n => F.festivalPropsReady().includes(n)), need };
}, { theme, wantModels });
const unschedule = async (page) => page.evaluate(async () => { const G = (window as any).__sv, C = (await import(String('/js/custom.js'))).CUSTOM; for (const k of Object.keys(C.releases || {})) if (k.startsWith('fest_')) delete C.releases[k]; G.festivals.rebuild(); });

export async function festivalModelsCheck(b: Browser) {
  const bad: string[] = [], notes: string[] = [];
  fs.mkdirSync('out/festmodels', { recursive: true });
  const src = fs.readFileSync('../js/festivals.ts', 'utf8'), names = new Set<string>(SINGLES);
  for (const m of src.matchAll(/'(fe-[a-z0-9-]+)'/g)) names.add(m[1]);
  for (const n of names) if (!fs.existsSync(`../models/world/${n}.glb`)) bad.push('missing models/world/' + n + '.glb');
  const P = await open(b, { w: 1180, h: 820, settings: quiet });
  try {
    await clear(P.page); await noWelcome(P.page);
    // every model loads: one shape, colours in its corners, its triangles
    const info = await P.page.evaluate(async (list: string[]) => { const K = await import(String('/js/modelkit.js')), out: Record<string, unknown> = {};
      for (const n of list) { const r = await K.worldModelParts(n); out[n] = r ? { parts: r.length, tris: r.reduce((a, p) => a + (p.geometry.index ? p.geometry.index.count : p.geometry.getAttribute('position').count) / 3, 0), col: r.every(p => !!p.geometry.getAttribute('color')) } : null; }
      return out; }, [...names]);
    for (const [n, i] of Object.entries(info) as [string, any][]) { if (!i) bad.push(n + ' did not load'); else { if (i.parts !== 1) bad.push(`${n}: ${i.parts} shapes`); if (i.tris > 2100) bad.push(`${n}: ${i.tris} triangles`); if (!i.col) bad.push(n + ': no colours'); } }
    // each theme with models: on today, its models fetched and used, every colour slot painted
    const themes = ['tet', 'pumpkins', 'xmas', 'hearts', 'diyas', 'colours', 'poppies', 'ochre', 'harmony', 'clean', 'kitchen', 'dragonboat', 'teacher', 'flags-vn', 'flags-au'], used: string[] = [];
    for (const th of themes) {
      const s = await schedule(P.page, th);
      if (s.ready.length < s.need.length) bad.push(`${th}: models not fetched ${s.need.filter(n => !s.ready.includes(n)).join(', ')}`);
      const look = await P.page.evaluate(() => { const G = (window as any).__sv; let slots = 0, verts = 0, meshes = 0;
        G.scene.traverse(o => { if (!o.isMesh || o.userData.outline) return; let p = o; while (p && !(p.userData && p.userData.noSolid && p.type === 'Group' && p.parent === G.scene)) p = p.parent; if (!p) return;
          const c = o.geometry.getAttribute('color'); if (!c) return; meshes++; verts += c.count;
          for (let i = 0; i < c.count; i++) { const r = c.getX(i), g = c.getY(i), bb = c.getZ(i); if ((r > .04 && g < .002 && bb < .002) || (bb > .04 && r < .002 && g < .002) || (g > .04 && r < .002 && bb < .002)) slots++; } });
        return { slots, verts, meshes }; });
      if (look.slots) bad.push(`${th}: ${look.slots} corners left in a colour slot`);
      if (!look.meshes) bad.push(`${th}: no decorations drawn`);
      used.push(`${th} ${s.ready.length}/${s.need.length}`);
      await unschedule(P.page);
    }
    notes.push('themes: ' + used.join(', '));
    // draws in Lotus Village on Tet (its decorations with the models)
    await schedule(P.page, 'tet');
    const draws = await P.page.evaluate(async () => { const G = (window as any).__sv, W = await import(String('/js/world.js')), h = G.heroes[0], wait = ms => new Promise(r => setTimeout(r, ms));
      h.place(W.VILLAGE.x, W.VILLAGE.z + 6); for (let k = 0; k < 8; k++) { await wait(300); document.querySelectorAll('.storybook, .dialog, .modal').forEach(e => e.remove()); G.paused = false; }
      const R = G.renderer, o = R.render, got: number[] = []; R.render = function (...a: unknown[]) { o.apply(this, a); got.push(R.info.render.calls); }; await wait(2500); R.render = o;
      return got.sort((a, b) => a - b)[got.length >> 1] || 0; });
    if (draws > 420) bad.push(`draws in Lotus Village on Tet: ${draws} (420)`);
    notes.push(`Lotus Village on Tet ${draws} draws`);
    await unschedule(P.page);
    // the lantern quest's lantern, the folk show's post and stage
    const one = await P.page.evaluate(async () => { const D = await import(String('/js/dinh.js')), K = await import(String('/js/modelkit.js')), G = (window as any).__sv;
      const l = D.buildLantern(true); G.scene.add(l); for (let k = 0; k < 40 && !D.lanternModelsReady(); k++) await new Promise(r => setTimeout(r, 250));
      const trim = l.children.some(c => c.userData.lanternTrim); G.scene.remove(l);
      K.adoptWorldTags(); await K.wakeAllWorldModels(); const tags: Record<string, number> = {};
      G.scene.traverse(o => { const t = o.userData.worldTag; if (t && String(t).startsWith('fe-')) tags[t] = (tags[t] || 0) + 1; });
      return { lantern: D.lanternModelsReady(), trim, tags }; });
    if (!one.lantern || !one.trim) bad.push('the quest lantern did not take its models: ' + JSON.stringify(one));
    if (!one.tags['fe-folk-post'] || !one.tags['fe-folk-stage']) bad.push('folk show models: ' + JSON.stringify(one.tags));
    notes.push('single models: ' + Object.entries(one.tags).map(([k, v]) => `${k} ${v}`).join(', '));
    if (P.errors.length) bad.push('errors: ' + P.errors.slice(0, 3).join(' | '));
  } finally { await P.ctx.close(); }

  // blocked: the code pieces stay
  const Q = await open(b, { w: 900, h: 640, settings: quiet });
  try {
    await Q.page.route('**/models/world/fe-*', rt => rt.abort());
    await clear(Q.page); await noWelcome(Q.page);
    const s = await schedule(Q.page, 'pumpkins', false);
    await Q.page.waitForTimeout(3000);
    const q = await Q.page.evaluate(async () => { const F = await import(String('/js/festivals.js')), G = (window as any).__sv; let meshes = 0;
      G.scene.traverse(o => { if (o.isMesh && o.parent && o.parent.userData && o.parent.userData.at) meshes++; });
      return { ready: F.festivalPropsReady().filter(n => n.startsWith('fe-')), meshes }; });
    if (q.ready.length || !q.meshes) bad.push('blocked: ' + JSON.stringify(q));
    const errs = Q.errors.filter(e => !/world model|festival props/.test(e)); if (errs.length) bad.push('errors with the models blocked: ' + errs.slice(0, 3).join(' | '));
    notes.push(`blocked: code pieces drawn (${q.meshes} patch meshes) for ${s.id}`);
  } finally { await Q.ctx.close(); }

  // screenshots: Tet, Mid-Autumn's lanterns, Halloween, Diwali; phone, tablet, computer
  for (const sz of SIZES) {
    const R = await open(b, { w: sz.w, h: sz.h, touch: sz.touch, settings: { ...quiet, quality: 'auto' } });
    try {
      await clear(R.page); await noWelcome(R.page);
      for (const th of ['tet', 'lanterns', 'pumpkins', 'diyas']) {
        const s = await schedule(R.page, th);
        await R.page.evaluate(async (where: string[]) => { const G = (window as any).__sv, W = await import(String('/js/world.js'));
          const key = where[0], o = ({ village: W.VILLAGE, china: W.CHINA, india: W.INDIA, aussie: W.AUSSIE, town: W.TOWN, market: W.MARKET, home: W.HOME } as any)[key] || W.CITIES.find(c => c.id === key) || W.VILLAGE;
          const c = o.x != null ? o : { x: (o.x0 + o.x1) / 2, z: (o.z0 + o.z1) / 2 }; const sp = G.festivals.streetSpots(key)[3] || c;
          G.heroes[0].place(sp.x + 2, sp.z + 2); await new Promise(r => setTimeout(r, 2500)); document.querySelectorAll('.storybook, .dialog, .modal').forEach(e => e.remove()); G.paused = false; }, s.where);
        await R.page.waitForTimeout(1500); await R.page.screenshot({ path: `out/festmodels/${sz.name}-${th}.png` });
        await unschedule(R.page);
      }
    } finally { await R.ctx.close(); }
  }
  if (bad.length) throw new Error(bad.join('\n'));
  return notes.join('; ') + '; screenshots in tests/out/festmodels/';
}
