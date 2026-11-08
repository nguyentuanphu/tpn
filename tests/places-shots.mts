// (v1.08e places) before/after pictures of the famous landmarks in the valley, on a phone, a tablet and a computer:
// the code shape (before) and the Blender model (after), from where the child stands at the postcard spot.
//   cd tests && node places-shots.mts [id ...]   -> docs/world-models-v108e/places/<id>-<screen>-<before|after>.png
import { launch, open, clear, noWelcome } from './harness.mts';
const IDS = process.argv.slice(2).length ? process.argv.slice(2) : ['opera', 'turtle', 'onepillar', 'benthanh', 'vanmieu', 'thehuc', 'harbour', 'cathedral', 'postoffice', 'flinders', 'hue', 'sydneytower', 'lunapark', 'banana', 'lighthouse', 'goldenbridge', 'uluru'];
const SIZES = [{ name: 'phone', w: 390, h: 844, touch: true }, { name: 'tablet', w: 820, h: 1180, touch: true }, { name: 'computer', w: 1440, h: 900, touch: false }];
const OUT = new URL('../docs/world-models-v108e/places/', import.meta.url).pathname;
const b = await launch();
for (const s of SIZES) {
  const P = await open(b, { w: s.w, h: s.h, touch: s.touch, settings: { voice: false, online: false, quality: 'high' } });
  await clear(P.page); await noWelcome(P.page);
  await P.page.evaluate(() => { const r = (window as any).__sv.renderer; r.setPixelRatio(1); dispatchEvent(new Event('resize')); });
  for (const id of IDS) {
    for (const when of ['before', 'after']) {
      await P.page.evaluate(async ([id, when]) => {
        const G = (window as any).__sv, R = await import(String('/js/regions.js')), K = await import(String('/js/modelkit.js'));
        const l = R.LANDMARKS.find((l: any) => l.id === id), h = G.heroes[0], x = l.mx ?? l.x, z = l.mz ?? l.z;
        // stand back from the landmark on the postcard's side, looking at it
        const dx = l.x - x, dz = l.z - z, d = Math.hypot(dx, dz) || 1, far = id === 'harbour' ? 30 : id === 'opera' ? 20 : 12;
        h.pos.x = x + dx / d * far; h.pos.z = z + dz / d * far; h.pos.y = G.world.groundAt(h.pos.x, h.pos.z) + .1; h.yaw = Math.atan2(-dx, -dz);
        // a fixed camera on the postcard side, a little up, looking at the landmark's middle (the game is paused, so it stays)
        G.paused = true; const cam = h.cam, top = G.world.groundAt(x, z) + (id === 'harbour' ? 8 : 4);
        cam.position.set(x + dx / d * far, top + far * .35, z + dz / d * far); cam.lookAt(x, top, z); cam.updateMatrixWorld(true);
        (window as any).__shotCam = [cam.position.clone(), [x, top, z], when];
        G.scene.traverse((o: any) => { if (o.userData.worldTag) { o.visible = when === 'after'; if (o.userData.fallback) o.userData.fallback.visible = when !== 'after'; } });
        if (when === 'after') { K.adoptWorldTags(); await K.wakeAllWorldModels(); G.scene.traverse((o: any) => { if (o.userData.worldTag && o.userData.fallback) { o.visible = true; o.userData.fallback.visible = false; } }); }
      }, [id, when]);
      await P.page.waitForTimeout(800);
      await P.page.evaluate(() => { const G = (window as any).__sv, [p, t, when] = (window as any).__shotCam, cam = G.heroes[0].cam; G.scene.traverse((o: any) => { if (o.userData.worldTag && o.userData.fallback) { o.visible = when === 'after'; o.userData.fallback.visible = when !== 'after'; } }); cam.position.copy(p); cam.lookAt(...t); cam.updateMatrixWorld(true); G.renderer.render(G.scene, cam); });
      await P.page.evaluate(() => document.querySelectorAll('.hud, .quest, .toast').forEach((e: any) => e.style.visibility = 'hidden'));
      await P.page.screenshot({ path: `${OUT}${id}-${s.name}-${when}.png`, });
      await P.page.evaluate(() => document.querySelectorAll('.hud, .quest, .toast').forEach((e: any) => e.style.visibility = ''));
    }
  }
  await P.ctx.close();
}
await b.close(); console.log('pictures in', OUT);
