// (v1.08g props) Before and after pictures of the story and street props, on a phone, a tablet and a computer: the code
// shape (before) and the Blender model (after), from the same camera.
// - market: the five stalls of the Three Regions market and Co Thu with her pole; hawker: Co Ba with her fruit;
//   sizzle: Uncle Robbo's stand at Aussie Corner (all where the game puts them);
// - hanoi, sydney, bridges: the story chapters' and films' props set out on a test spot beside the child (in the game
//   they stand in chapter 2 and 3 places and in the films, which a picture cannot reach without playing the story).
//   cd tests && node props-shots.mts [scene ...]   -> docs/world-models-v108g/props/<scene>-<screen>-<before|after>.png
import { launch, open, clear, noWelcome } from './harness.mts';
const ALL = ['market', 'hawker', 'sizzle', 'hanoi', 'sydney', 'bridges'];
const SCENES = process.argv.slice(2).length ? process.argv.slice(2) : ALL;
const SIZES = [{ name: 'phone', w: 390, h: 844, touch: true }, { name: 'tablet', w: 820, h: 1180, touch: true }, { name: 'computer', w: 1280, h: 800, touch: false }];
const OUT = new URL('../docs/world-models-v108g/props/', import.meta.url).pathname;
const b = await launch();
for (const s of SIZES) {
  const P = await open(b, { w: s.w, h: s.h, touch: s.touch, settings: { voice: false, online: false, quality: 'high' } });
  await clear(P.page); await noWelcome(P.page);
  await P.page.evaluate(() => { const r = (window as any).__sv.renderer; r.setPixelRatio(1); dispatchEvent(new Event('resize')); });
  for (const sc of SCENES) {
    for (const when of ['before', 'after']) {
      await P.page.evaluate(async ([sc, when]) => {
        const G = (window as any).__sv, K = await import(String('/js/modelkit.js')), { THREE } = await import(String('/js/gfx.js'));
        const h = G.heroes[0], st = (id: string) => G.world.stalls.find((x: any) => x.id === id);
        let x = 0, z = 0, face = 0, far = 8, up = 3, lift = 1.2;
        const w = window as any;
        if (sc === 'market') { const ss = ['bahai', 'olai', 'chunam', 'chutam', 'cout'].map(st); x = ss.reduce((t, a) => t + a.x, 0) / 5; z = ss.reduce((t, a) => t + a.z, 0) / 5; face = ss[0].face; far = 10; up = 4; lift = 1.6; }
        else if (sc === 'sizzle') { const a = st('robbo'); x = a.x; z = a.z; face = a.face; far = 7; up = 3; }
        else if (sc === 'hawker') { const H = G.hawkers[0]; x = H.x; z = H.z; face = H.yaw + Math.PI / 2; far = 3; up = 1.7; lift = 1.1; }
        else {
          // the test spot: flat open ground near the child (found below), the props in a row
          if (!w.__propSpot) {
            const C2 = await import(String('/js/content/chapter2props.js')), C3 = await import(String('/js/content/chapter3props.js'));
            // flat open ground: level within 0.8 m over 40 m, nothing solid within 10 m, the nearest such spot to the child
            const yaw = h.yaw || 0, gA = (x: number, z: number) => G.world.groundAt(x, z);
            let sx = h.pos.x, sz = h.pos.z;
            search: for (let r = 30; r <= 260; r += 10) for (let k = 0; k < 24; k++) {
              const a = k / 24 * Math.PI * 2, cx = h.pos.x + Math.cos(a) * r, cz = h.pos.z + Math.sin(a) * r, g0 = gA(cx, cz);
              let ok = true; for (let i = -2; i <= 2 && ok; i++) for (let j = -2; j <= 2 && ok; j++) if (Math.abs(gA(cx + i * 10, cz + j * 10) - g0) > .8) ok = false;
              if (ok && (G.world.colliders || []).some((c: any) => Math.hypot(c.x - cx, c.z - cz) < 10)) ok = false;
              if (ok) { sx = cx; sz = cz; break search; }
            }
            const add = (o: any, set: string, dx: number, dy = 0) => { const g = new THREE.Group(); g.add(o); g.userData.set = set; g.position.set(sx + Math.cos(yaw) * dx, G.world.groundAt(sx, sz) + dy, sz - Math.sin(yaw) * dx); g.rotation.y = yaw + Math.PI; G.scene.add(g); return g; };
            add(C2.buildStoneTurtle(), 'hanoi', -1.6); add(C2.buildStarLantern('#ff4a3a', true), 'hanoi', -.2); add(C2.buildLionHead(), 'hanoi', 1.1, .45); add(C2.buildMooncakes(), 'hanoi', 2.3, .02);
            const tree = C3.buildGumTree(1), koala = C3.buildKoala(); koala.position.set(.25, 2.6, .25); tree.add(koala);
            add(C3.buildFerry(true), 'sydney', -2.2, .02); add(tree, 'sydney', 1.8);
            add(C2.buildBridge(), 'bridges', -16); add(C3.buildHarbourBridge(), 'bridges', 22);
            w.__propSpot = { sx, sz, yaw };
          }
          const p = w.__propSpot; x = p.sx; z = p.sz; face = p.yaw + Math.PI;
          G.scene.traverse((o: any) => { if (o.userData.set) o.visible = o.userData.set === sc; });
          if (sc === 'sydney') { far = 9; up = 3; lift = 2.2; } else if (sc === 'bridges') { far = 34; up = 9; lift = 3; } else { far = 5.5; up = 1.8; lift = .7; }
          if (sc === 'bridges') { x += Math.cos(p.yaw) * 3; z -= Math.sin(p.yaw) * 3; }
        }
        G.paused = true;
        const cam = h.cam, gy = G.world.groundAt(x, z), fx = Math.sin(face), fz = Math.cos(face);
        cam.position.set(x + fx * far, gy + up, z + fz * far); cam.lookAt(x, gy + lift, z); cam.updateMatrixWorld(true);
        w.__shotCam = [cam.position.clone(), [x, gy + lift, z], when];
        K.adoptWorldTags(); await K.wakeAllWorldModels();
        await new Promise(r => setTimeout(r, 1500));
      }, [sc, when]);
      await P.page.waitForTimeout(600);
      await P.page.evaluate(() => {
        const G = (window as any).__sv, [p, t, when] = (window as any).__shotCam, cam = G.heroes[0].cam;
        G.scene.traverse((o: any) => { if (o.userData.worldTag && o.userData.fallback) { o.visible = when === 'after'; o.userData.fallback.visible = when !== 'after'; } });
        cam.position.copy(p); cam.lookAt(t[0], t[1], t[2]); cam.updateMatrixWorld(true); G.renderer.render(G.scene, cam);
        document.querySelectorAll('body *').forEach((e: any) => { if (e.tagName !== 'CANVAS' && !e.querySelector('canvas')) { e.dataset.shotHid = e.style.visibility; e.style.visibility = 'hidden'; } });
      });
      await P.page.screenshot({ path: `${OUT}${sc}-${s.name}-${when}.png` });
      await P.page.evaluate(() => document.querySelectorAll('[data-shot-hid]').forEach((e: any) => { e.style.visibility = e.dataset.shotHid; delete e.dataset.shotHid; }));
    }
  }
  await P.ctx.close();
}
await b.close(); console.log('pictures in', OUT);
