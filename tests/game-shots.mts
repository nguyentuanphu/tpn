// (v1.08e faces, Release 6 Nov 2026 AEDT) clear in-game pictures of the people, on a phone and a computer at 2x, Pretty
// quality, the high-detail friend loaded: the game's own valley drawn from a camera in front of each one.
//   node tests/game-shots.mts <out folder>      (the game server on :8765)
// friend-<id>-smile-<dev>.png and friend-<id>-blink-<dev>.png (Finn, Sol, Clara, Lumi), villager-<id>-<dev>.png (Mai, Ba,
// Jack, Ruby), market-crowd-<dev>.png, welcome-picker-<dev>.png
import { launch, open, clear } from './harness.mts';
import fs from 'fs';
const out = process.argv[2] || 'docs/world-models-v108e/faces/game';
fs.mkdirSync(out, { recursive: true });
const b = await launch();
const save = (name: string, url: string) => fs.writeFileSync(`${out}/${name}.png`, Buffer.from(url.split(',')[1], 'base64'));
for (const [dev, w, h, touch] of [['phone', 390, 844, true], ['computer', 1280, 800, false]] as [string, number, number, boolean][]) {
  const P = await open(b, { w, h, touch, dpr: 2, settings: { quality: 'high' } }); await clear(P.page);
  // the page's own helpers: close a story chapter, wait, and draw the valley from a camera (the game's renderer and scene)
  await P.page.evaluate(() => {
    const W = window as any, G = W.__sv;
    W.__calm = () => { document.querySelectorAll('.storybook, .dialog, .modal, .reward').forEach(e => e.remove()); G.paused = false; dispatchEvent(new Event('pointermove')); };
    W.__wait = async (ms: number) => { const t = performance.now(); while (performance.now() - t < ms) { W.__calm(); await new Promise(r => setTimeout(r, 150)); } };
    W.__shoot = async (from: number[], to: number[], fov = 30) => {
      const { THREE } = await import(String('/js/gfx.js')), r = G.renderer, c = r.domElement;
      const cam = new THREE.PerspectiveCamera(fov, c.width / c.height, .1, 600); cam.position.set(from[0], from[1], from[2]); cam.lookAt(to[0], to[1], to[2]); cam.updateMatrixWorld(true);
      await new Promise(res => requestAnimationFrame(res)); r.render(G.scene, cam); return c.toDataURL('image/png');
    };
  });
  // 1. each friend, the camera in front at the close-up distance: smiling, then mid-blink
  for (const id of ['finn', 'sol', 'clara', 'lumi']) {
    const shots = await P.page.evaluate(async id => {
      const W = window as any, G = W.__sv, hh = G.heroes[0], WD = await import(String('/js/world.js'));
      hh.profile.look.friend = id; hh.profile.look.set = id === 'clara' || id === 'lumi' ? 'girl' : 'boy'; hh.place(WD.VILLAGE.x + 6, WD.VILLAGE.z - 8); hh.buildModel();
      for (let k = 0; k < 120 && !(hh.av.model && hh.av.modelHD); k++) await W.__wait(250);
      hh.buildModel(); await W.__wait(1500);
      const p = hh.pos, y = hh.yaw, L = hh.av.life, fx = Math.sin(y), fz = Math.cos(y);
      const from = [p.x + fx * 2.4 + fz * .5, p.y + 1.35, p.z + fz * 2.4 - fx * .5], to = [p.x, p.y + 1.05, p.z];
      if (L) { L.blink = L.t + 60; L.feel = ''; }
      const smile = await W.__shoot(from, to, 32);
      if (hh.av.life) { hh.av.life.feel = 'blink'; hh.av.life.feelUntil = hh.av.life.t + 30; } await W.__wait(400);
      const blink = await W.__shoot(from, to, 32); if (hh.av.life) hh.av.life.feel = '';
      return { smile, blink, hd: !!hh.av.modelHD };
    }, id);
    save(`friend-${id}-smile-${dev}`, shots.smile); save(`friend-${id}-blink-${dev}`, shots.blink);
    console.log(dev, id, shots.hd ? 'high-detail' : 'light model');
  }
  // 2. Mai, Ba, Jack and Ruby in the valley, the child beside them, the camera in front of their faces
  for (const id of ['mai', 'ba', 'jack', 'ruby']) {
    const url = await P.page.evaluate(async id => {
      const W = window as any, G = W.__sv, hh = G.heroes[0], n = G.npcs.find((x: any) => x.id === id), r = n.obj.rotation.y, fx = Math.sin(r), fz = Math.cos(r), o = n.obj.position;
      hh.place(o.x + fx * 2.2 + fz * 1.6, o.z + fz * 2.2 - fx * 1.6);
      for (let k = 0; k < 80 && !(n._vm === 'worn' && n.A.rig.visible); k++) await W.__wait(250);
      await W.__wait(1200);
      const top = (n.A.height || 1) * 1.35;
      return W.__shoot([o.x + fx * 3.2, o.y + top + .25, o.z + fz * 3.2], [o.x, o.y + top * .78, o.z], 34);
    }, id);
    save(`villager-${id}-${dev}`, url);
  }
  // 3. the Three Regions market with its crowd (the nearest people in their gallery models)
  const market = await P.page.evaluate(async () => {
    const W = window as any, G = W.__sv, hh = G.heroes[0], M = await import(String('/js/content/map.js'));
    const m = (M.WORLD.places || M.PLACES || []).find((x: any) => x.id === 'market'), at = m ? m.at : [197, 114];
    hh.place(at[0], at[1] + 4); await W.__wait(9000);
    const p = hh.pos; return W.__shoot([p.x + 6, p.y + 4.2, p.z + 9], [p.x, p.y + 1, p.z - 2], 44);
  });
  save(`market-crowd-${dev}`, market);
  if (P.errors.length) console.log(dev, P.errors.slice(0, 3));
  await P.ctx.close();
  // 4. the Welcome friend picker (a new player), the friends turning in their cards
  const Q = await open(b, { w, h, touch, dpr: 2, play: false, settings: { quality: 'high' }, pre: () => { localStorage.setItem('sv2_profiles', '[]'); } });
  await Q.page.click('.screen.title .press', { force: true }); await Q.page.waitForSelector('.screen.who');
  await Q.page.click('.who .make'); await Q.page.waitForSelector('.modal.friendpick .fr-name');
  await Q.page.fill('.fr-name', 'An'); await Q.page.click('.friendpick [data-go="next"]'); await Q.page.click('.friendpick [data-set="girl"]');
  await Q.page.waitForTimeout(5000); await Q.page.screenshot({ path: `${out}/welcome-picker-${dev}.png` });
  await Q.ctx.close();
}
await b.close(); console.log('shots in', out);
