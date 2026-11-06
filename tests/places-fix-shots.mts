// (v1.08f places-fix) before/after pictures on a phone, a tablet and a computer:
//  - Ben Thanh and the Big Banana: before = the v1.08e model that covered the name sign, after = the model with room for it;
//  - Season 2 Australia's three landmarks: before = the code shape, after = the Blender model.
//   cd tests && node places-fix-shots.mts <old models dir>   -> docs/world-models-v108e/places/<id>-<screen>-<before|after>.png (benthanh-sign, banana-sign, s2au-gbr, s2au-tas, s2au-perth)
// (the old dir holds the v1.08e lm-benthanh.glb and lm-banana.glb: git show origin/integrate/v108:models/world/<name>.glb)
import fs from 'node:fs';
import { launch, open, clear, noWelcome } from './harness.mts';
const OLD = process.argv[2];
const SIZES = [{ name: 'phone', w: 390, h: 844, touch: true }, { name: 'tablet', w: 820, h: 1180, touch: true }, { name: 'computer', w: 1440, h: 900, touch: false }];
const OUT = new URL('../docs/world-models-v108e/places/', import.meta.url).pathname;
// [id, the model, how far back, how high to look]
const SHOTS: [string, string, number, number][] = [['benthanh-sign', 'lm-benthanh', 14, 5], ['banana-sign', 'lm-banana', 13, 3], ['s2au-gbr', 'lm-s2au-gbr', 13, 1.5], ['s2au-tas', 'lm-s2au-tas', 15, 2.5], ['s2au-perth', 'lm-s2au-perth', 16, 4.5]];
const b = await launch();
for (const s of SIZES) for (const when of ['before', 'after']) {
  const route = when === 'before' && OLD ? async (ctx: any) => { for (const n of ['lm-benthanh', 'lm-banana']) await ctx.route(`**/models/world/${n}.glb`, (r: any) => r.fulfill({ body: fs.readFileSync(`${OLD}/${n}.glb`), contentType: 'model/gltf-binary' })); } : null;
  const P = await open(b, { w: s.w, h: s.h, touch: s.touch, settings: { voice: false, online: false, quality: 'high' }, route } as any);
  await clear(P.page); await noWelcome(P.page);
  await P.page.evaluate(async () => { const G = (window as any).__sv; G.renderer.setPixelRatio(1); dispatchEvent(new Event('resize')); await Promise.all(G.s2au.regions.map((R: any) => G.s2au.build(R))); });
  for (const [id, tag, far, up] of SHOTS) {
    const model = when === 'after' || id.endsWith('-sign');
    await P.page.evaluate(async ([id, tag, far, up, model]) => {
      const G = (window as any).__sv, K = await import(String('/js/modelkit.js')), M = await import(String('/js/content/map.js'));
      K.adoptWorldTags(); await K.wakeAllWorldModels(); G.scene.updateMatrixWorld(true);
      let obj: any = null; G.scene.traverse((o: any) => { if (o.userData.worldTag === tag) obj = o; });
      const c = obj.getWorldPosition(new (obj.position.constructor)());
      // the side the child sees: Ben Thanh's street side (-x), the Big Banana's front (+z), a Season 2 landmark from its sign
      let dx = 0, dz = 1;
      if (id === 'benthanh-sign') { dx = -1; dz = 0; }
      else if (id.startsWith('s2au')) { const R = G.s2au.regions.find((r: any) => 's2au-' + r.id === id), a = M.anchorOf(R.place), sx = a[0] + R.landmark.sign[0], sz = a[1] + R.landmark.sign[1]; dx = sx - c.x; dz = sz - c.z; const d = Math.hypot(dx, dz) || 1; dx /= d; dz /= d; }
      G.paused = true; const cam = G.heroes[0].cam, gy = c.y + up;
      (window as any).__shot = [[c.x + dx * far, gy + far * .3, c.z + dz * far], [c.x, gy, c.z], tag, model];
      const h = G.heroes[0]; h.pos.x = c.x + dx * far; h.pos.z = c.z + dz * far; h.pos.y = G.world.groundAt(h.pos.x, h.pos.z) + .1;
    }, [id, tag, far, up, model] as any);
    await P.page.waitForTimeout(700);
    await P.page.evaluate(() => { const G = (window as any).__sv, [p, t, tag, model] = (window as any).__shot, cam = G.heroes[0].cam;
      G.scene.traverse((o: any) => { if (o.userData.worldTag === tag && o.userData.fallback) { o.visible = model; o.userData.fallback.visible = !model; } });
      cam.position.set(...p); cam.lookAt(...t); cam.updateMatrixWorld(true); G.renderer.render(G.scene, cam);
      document.querySelectorAll('.hud, .quest, .toast').forEach((e: any) => e.style.visibility = 'hidden'); });
    await P.page.screenshot({ path: `${OUT}${id}-${s.name}-${when}.png` });
  }
  await P.ctx.close();
}
await b.close(); console.log('pictures in', OUT);
