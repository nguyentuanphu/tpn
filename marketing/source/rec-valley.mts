// Records the big kids' film (the 3D valley): node rec-valley.mts <en|vi> <land|vert> <framesdir>
// Writes frames and <framesdir>/marks.json. The end card is added by makefilm.sh.
import fs from 'fs';
import { film, cine, walkTo, placeAt } from './filmrec.mts';
globalThis.window = globalThis.window || {}; await import('./films2.js'); const SC = Object.fromEntries(window.FILMS2.valley.map(s => [s.id, s]));
const [lang = 'en', shape = 'land', dir] = process.argv.slice(2);
const L = shape === 'land' ? { w: 1280, h: 720, dpr: 1.5, pixelRatio: .9 } : { w: 540, h: 960, dpr: 2, pixelRatio: 1.2 };
const rec = await film({ ...L, lang, dir, screen: 'valley' });
const page = rec.page, V = shape === 'vert';
await page.evaluate(async () => { const S = await import('/js/state.js'); S.profiles.forEach(p => { p.age = 'big'; }); });
const K = +process.env.SCALE || 1;
const scene = async (id, fn) => { const t = rec.frames(); rec.mark(id); await fn(); const want = Math.round(SC[id].sec * K * 25); if (rec.frames() - t < want) await rec.hold((want - (rec.frames() - t)) / 25); console.log(id, ((rec.frames() - t) / 25).toFixed(1)); };
const clean = () => page.evaluate(() => { document.querySelectorAll('.theatre, .storybook, .region-banner, .banner, .vc-pop, .toast, .modal, .dialog, .gl, .hub, .pad').forEach(e => e.remove()); window.__sv.paused = false; window.__sv.closeUp = null; });
const sec = id => Math.max(1.5, SC[id].sec * K);
// an orbit around a place while the child walks towards it
const orbitShot = async (id, c, r, up, a0, a1, look, from, to, run = false) => scene(id, async () => {
  await placeAt(rec, from[0], from[1], to[0], to[1]); await cine(page, { type: 'orbit', c, r: V ? r * 1.25 : r, up, a0, a1, dur: sec(id), look });
  await walkTo(rec, to[0], to[1], sec(id), run);
});
try {
  await scene('V1', async () => { await cine(page, null); await clean(); await placeAt(rec, 9, 46, 9, 20); await rec.hold(1); await walkTo(rec, 9, 18, sec('V1') - 1); });
  await scene('V2', async () => {
    await placeAt(rec, 7, -79, 7, -84); await rec.hold(1.5);
    await page.evaluate(() => { const G = window.__sv, o = G.interactables.find(i => i.id === 'npc_owl'); if (o) o.act(G.heroes[0]); });
    await rec.hold(sec('V2') - 1.5);
    await page.evaluate(() => { const x = document.querySelector('.theatre .th-x'); if (x) x.click(); }); await page.evaluate(() => document.querySelectorAll('.theatre').forEach(e => e.remove()));
  });
  await scene('V3', async () => { await clean(); await page.evaluate(() => { window.__sv.openPad(0, 'map'); }); await rec.hold(sec('V3') - 1); await clean(); });
  await orbitShot('W1', [9, -14], 75, 48, 0.3, 1.6, [9, -20, 0], [9, 0], [9, -40]);
  // Lotus Village: in along its lane, through the old gate (js/content/map.js village_lane)
  await scene('W2', async () => { await placeAt(rec, 168, -42, 200, -42); await cine(page, { type: 'follow', back: 9, up: 5.5, look: 1.5 }); await walkTo(rec, 202, -42, sec('W2')); });
  // the countryside at the rice fields' place [210, -98]: the buffalo and the cave of Phong Nha
  await orbitShot('W3', [210, -98], 32, 19, 3.75, 4.35, [210, -98, 1], [206, -86], [208, -100]);
  await orbitShot('W4', [153, -128], 28, 14, 0.25, -0.65, [153, -135, 3], [153, -110], [153, -136]);
  await orbitShot('W5', [200, -172], 32, 16, 2.6, 3.6, [200, -172, 3], [200, -152], [200, -172]);
  await orbitShot('W6', [155, 8], 32, 16, -0.4, 0.6, [157, 10, 4], [150, 26], [156, 10]);
  await orbitShot('W7', [172, 88], 28, 13, 0.9, 0.1, [170, 88, 3], [176, 102], [171, 88]);
  // TP. Hồ Chí Minh at [153, 151], in through its north gate
  await orbitShot('W8', [153, 151], 30, 15, 2.4, 3.3, [153, 151, 3], [153, 136], [153, 150]);
  await scene('W9', async () => { await placeAt(rec, -62, 26, -78, 4); await cine(page, { type: 'dolly', from: [-46, 40, 16], to: [-58, 30, 10], look: [-76, 0, 5], dur: sec('W9') }); await walkTo(rec, -78, 4, sec('W9'), false); });
  await orbitShot('W10', [-196, 62], 55, 22, 0.2, 1.2, [-196, 62, 8], [-196, 92], [-196, 76]);
  await orbitShot('W11', [-160, 182], 42, 18, -0.6, 0.4, [-160, 182, 2], [-150, 160], [-158, 176]);
  await scene('W12', async () => { await placeAt(rec, 9, 30, 9, -20); await cine(page, { type: 'dolly', from: [30, 60, 25], to: [90, 140, 150], look: [9, -40, 0], dur: sec('W12') }); await walkTo(rec, 9, -10, sec('W12')); });
  await scene('V4', async () => {
    await cine(page, null); await clean(); await placeAt(rec, 9, 46, 9, 20); await rec.hold(.5);
    await page.evaluate(() => { window.__sv.playGame(0, 'oanquan', 'replay'); }); // (not awaited: it ends when the game does) await rec.hold(2);
    await rec.hold(sec('V4') - 3, async (t, i) => {
      if (i % 40 !== 20) return;
      const xy = await page.evaluate(() => { const gl = document.querySelector('.gl'); if (!gl) return null; const hb = (gl.querySelector('.gl-head') || gl).getBoundingClientRect().bottom; const bs = [...gl.querySelectorAll('button, [data-i], .pit, .hole')].filter(b => { const r = b.getBoundingClientRect(); return r.width > 24 && r.top > hb && r.bottom < innerHeight && !/gl-x|gl-tv|lvl|diff/.test(b.className); }); if (!bs.length) return null; const r = bs[Math.floor(Math.random() * bs.length)].getBoundingClientRect(); return [r.x + r.width / 2, r.y + r.height / 2]; });
      if (xy) await page.mouse.click(xy[0], xy[1]);
    });
    await page.evaluate(() => { const x = document.querySelector('.gl .gl-x'); if (x) x.click(); }); await rec.hold(.5); await clean();
  });
  await scene('V5', async () => { await page.evaluate(() => { window.__sv.openGamesHub(0); }); await rec.hold(2); await rec.hold(sec('V5') - 2.5, () => page.evaluate(() => { const s = document.querySelector('.hub .hub-list, .hub .scroll, .hub'); if (s) s.scrollTop += 6; })); });
} finally {
  fs.writeFileSync(dir + '/marks.json', JSON.stringify(rec.marks)); await rec.close();
}
