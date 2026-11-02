// Ads (owner, 11 Oct): stills at 1080x1920 for the ad videos. Not a check; not committed.
// node ads-capture2.mjs <lang> <outdir> [cine|screens|all]
import fs from 'fs';
import { launch, open, clear } from '../../tests/harness.mjs';
const [lang = 'en', out = '/tmp/ads', what = 'all'] = process.argv.slice(2);
fs.mkdirSync(out, { recursive: true });
const b = await launch();
const W = 360, H = 640, DPR = 3;
const T = (p, ms = 20000) => Promise.race([p, new Promise((_, r) => setTimeout(() => r(new Error('timeout')), ms))]);
const shot = async (page, name) => { await page.screenshot({ path: `${out}/${name}-${lang}.jpg`, type: 'jpeg', quality: 90 }); console.log('saved', name); };
const quiet = page => page.evaluate(() => { document.querySelectorAll('.toast, .region-banner, .banner, .vc-pop, .storybook, .hint, .bubble').forEach(e => e.remove()); });
const tidy = page => page.evaluate(() => { document.querySelectorAll('.modal, .hub, .pad, .howto, .theatre, .gl, .dialog, .storybook, .vc-pop, .wardrobe, .toast, .reward').forEach(e => e.remove()); __sv.paused = false; __sv.closeUp = null; });
const game = async (o = {}) => {
  const P = await open(b, { w: W, h: H, dpr: DPR, lang, touch: true, fast: false, settings: { quality: 'high', alwaysDay: true, captions: false }, ...o });
  await clear(P.page); await P.page.evaluate(() => { window.__sv.renderer.setPixelRatio(3); dispatchEvent(new Event('resize')); });
  return P;
};
// a cinematic view: the child at hero (facing yaw), camera at cam [x, z, height], looking at look [x, z, height]; no HUD
async function scene(page, name, hero, yaw, cam, look, wait = 6000) {
  await clear(page);
  await page.evaluate(([hx, hz, yaw]) => { const G = window.__sv, h = G.heroes[0]; h.place(hx, hz); h.yaw = yaw; }, [hero[0], hero[1], yaw]);
  await page.waitForTimeout(2000); await quiet(page);
  await page.evaluate(([cam, look]) => {
    const G = window.__sv, h = G.heroes[0], g = (x, z) => G.world.groundAt(x, z);
    G.paused = true; document.querySelector('#huds').style.visibility = 'hidden';
    h.cam.position.set(cam[0], g(cam[0], cam[1]) + cam[2], cam[1]); h.cam.lookAt(look[0], g(look[0], look[1]) + look[2], look[1]);
  }, [cam, look]);
  await page.waitForTimeout(wait); await quiet(page); await shot(page, name);
  await page.evaluate(() => { window.__sv.paused = false; document.querySelector('#huds').style.visibility = ''; });
}
try {
  if (what !== 'screens') {
    // title and who's playing
    let P;
    if (!process.env.CINE || process.env.TITLE) { P = await open(b, { w: W, h: H, dpr: DPR, lang, touch: true, fast: false, play: false, settings: { quality: 'high', alwaysDay: true } });
    await P.page.evaluate(() => { window.__sv.renderer.setPixelRatio(3); dispatchEvent(new Event('resize')); });
    await P.page.waitForTimeout(3500); await shot(P.page, 'title');
    await P.ctx.close(); }
    P = await game();
    const S = process.env.CINE ? JSON.parse(process.env.CINE) : [
      ['cine-village', [200, -34], Math.PI, [207, -22, 7], [199, -46, 3]],
      ['cine-village2', [196, -50], 0, [190, -62, 6], [200, -38, 3]],
      ['cine-hanoi', [113, -126], Math.PI, [119, -114, 7], [113, -134, 2]],
      ['cine-hanoi2', [117, -120], Math.PI, [106, -112, 6], [116, -127, 3]],
      ['cine-sydney', [-80, 27], Math.PI, [-72, 38, 8], [-86, 18, 5]],
      ['cine-sydney2', [-74, 28], Math.PI, [-62, 36, 7], [-80, 18, 4]],
      ['cine-hoian', [178, 94], Math.PI, [186, 104, 7], [180, 85, 3]]
    ];
    for (const [n, hero, yaw, cam, look] of S) { try { await T(scene(P.page, n, hero, yaw, cam, look), 60000); } catch (e) { console.log('skip', n, e.message.slice(0, 100)); } }
    await P.ctx.close();
  }
  if (what !== 'cine') {
    let P = await game();
    const keys = await P.page.evaluate(() => Object.keys(window.__sv.GAMES || {}));
    const pick = re => keys.find(k => re.test(k)) || keys[0];
    const g = { count: 'counting', colors: 'bunny', memory: 'memory' };
    console.log('games', JSON.stringify(g));
    const S = [
      ['hub', 'window.__sv.openGamesHub(0)'], ['map', "window.__sv.openPad(0, 'map')"], ['friends', "window.__sv.openPad(0, 'friend')"], ['wardrobe', 'window.__sv.openWardrobe(0)'],
      ['tale', "(async () => { const L = await import('/js/learn.js'); const t = L.TALES.find(x => /giong|gióng/i.test(String(x.id) + (x.title ? x.title() : ''))) || L.TALES[0]; (await import('/js/tales.js')).openTheatre(t, {}); })()"],
      ['game-count', `window.__sv.playGame(0, '${g.count}', 'replay')`], ['game-colors', `window.__sv.playGame(0, '${g.colors}', 'replay')`], ['game-caro', `window.__sv.playGame(0, '${g.memory}', 'replay')`],
      ['festivals', "(async () => (await import('/js/ui.js')).openFestivals(window.__sv, 0))()"],
      ['grownups', "(async () => { (await import('/js/ui.js')).openGrownups(); await new Promise(r => setTimeout(r, 1500)); const e = [...document.querySelectorAll('.modal h3, .modal summary, .modal label, .modal b')].find(x => /bedtime|giờ đi ngủ|rest|nghỉ/i.test(x.textContent)); if (e) e.scrollIntoView({ block: 'start' }); })()"],
      ['dialog', "window.__sv.dialog('Ông Cú', [['Hoo hoo! One lantern flew away. Will you help me find it?', 'Hú hú! Một chiếc đèn lồng bay mất rồi. Cháu giúp ông tìm nhé?']], [['▶ Yes!', '▶ Có!'], ['👋 Later', '👋 Để sau']])"]
    ];
    for (const [name, js] of S.filter(([n]) => !process.env.ONLY || process.env.ONLY.split(',').includes(n))) {
      try { await T(P.page.evaluate(`${js}; 1`), 15000); await P.page.waitForSelector('.modal, .hub, .pad, .theatre, .gl, .dialog:not(.out), .wardrobe', { timeout: 45000 }); await P.page.waitForTimeout(3500); await quiet(P.page); await shot(P.page, name); }
      catch (e) { console.log('skip', name, e.message.slice(0, 100)); }
      try { await P.page.evaluate(() => { const x = document.querySelector('.gl .gl-x, .theatre .th-x, .x'); if (x) x.click(); }); await P.page.waitForTimeout(1500); await T(tidy(P.page), 10000); } catch (e) { }
    }
    await P.ctx.close();
    P = await game({ screen: 'simple' }); await P.page.waitForTimeout(3000); await shot(P.page, 'simple'); await P.ctx.close();
    P = await game({ mode: 'split' }); await P.page.waitForTimeout(4000); await tidy(P.page); await quiet(P.page); await shot(P.page, 'two-players'); await P.ctx.close();
  }
} finally { await b.close(); }
