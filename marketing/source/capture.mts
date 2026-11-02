// Takes fresh 1080×1920 stills of the game for the ads: node capture.mts [only,names]  (game served on :8765)
// Uses the test harness to open the game at phone size (360×640 at 3× = 1080×1920) with full graphics.
import { launch, open, clear } from '../../tests/harness.mts';
import fs from 'fs';
const DIR = new URL('./stills/', import.meta.url).pathname, only = (process.argv[2] || '').split(',').filter(Boolean);
const want = n => !only.length || only.includes(n);
const b = await launch();
const shot = async (page, name) => { await page.screenshot({ path: DIR + name + '.jpg', type: 'jpeg', quality: 90 }); console.log('saved', name); };
const game = async lang => {
  const P = await open(b, { w: 360, h: 640, dpr: 3, lang, touch: true, fast: false, settings: { quality: 'high', alwaysDay: true, captions: false } });
  await clear(P.page); await P.page.evaluate(() => { window.__sv.renderer.setPixelRatio(3); dispatchEvent(new Event('resize')); });
  return P;
};
const quiet = page => page.evaluate(() => { document.querySelectorAll('.toast, .region-banner, .banner, .vc-pop, .storybook').forEach(e => e.remove()); });
// a cinematic view: the child stands at hero (facing yaw), the camera sits at cam and looks at look (heights above the ground); no HUD
async function scene(page, name, hero, yaw, cam, look, wait = 5000) {
  await clear(page);
  await page.evaluate(([hx, hz, yaw]) => { const G = window.__sv, h = G.heroes[0]; h.place(hx, hz); h.yaw = yaw; }, [hero[0], hero[1], yaw]);
  await page.waitForTimeout(1500); await quiet(page);
  await page.evaluate(([cam, look]) => {
    const G = window.__sv, h = G.heroes[0], g = (x, z) => G.world.groundAt(x, z);
    G.paused = true; document.querySelector('#huds').style.visibility = 'hidden';
    h.cam.position.set(cam[0], g(cam[0], cam[1]) + cam[2], cam[1]); h.cam.lookAt(look[0], g(look[0], look[1]) + look[2], look[1]);
  }, [cam, look]);
  await page.waitForTimeout(wait); await quiet(page); await shot(page, name);
  await page.evaluate(() => { window.__sv.paused = false; document.querySelector('#huds').style.visibility = ''; });
}
// a view of the world: stand at (x, z), camera on the side camYaw, a little zoomed out
async function view(page, name, x, z, camYaw, zoom = 1.5, wait = 4500) {
  await clear(page);
  await page.evaluate(([x, z, c, zm]) => { const G = window.__sv, h = G.heroes[0]; h.place(x, z); h.yaw = c + Math.PI; h.camYaw = c; h.zoom = zm; h.manualCamT = 30; }, [x, z, camYaw, zoom]);
  await page.waitForTimeout(wait); await quiet(page); await shot(page, name);
}

// title and who's playing
for (const lang of ['en', 'vi']) {
  if (!want('title-' + lang) && !want('who-' + lang)) continue;
  const P = await open(b, { w: 360, h: 640, dpr: 3, lang, touch: true, fast: false, play: false, settings: { quality: 'high', alwaysDay: true } });
  await P.page.evaluate(() => { window.__sv.renderer.setPixelRatio(3); dispatchEvent(new Event('resize')); });
  await P.page.waitForTimeout(3000); if (want('title-' + lang)) await shot(P.page, 'title-' + lang);
  if (want('who-' + lang)) { await P.page.click('.screen.title .press', { force: true }); await P.page.waitForSelector('.screen.who'); await P.page.locator('.pick[data-id]').nth(0).click(); await P.page.waitForTimeout(800); await shot(P.page, 'who-' + lang); }
  await P.ctx.close();
}

const { page, ctx } = await game('en');
const S = [
  ['city-hanoi', [84, -25], Math.PI, [86, -12, 7], [84, -40, 3]],
  ['city-bacninh', [48, -107], Math.PI, [52, -95, 8], [48, -122, 5]],
  ['city-dragon', [44, -62], -Math.PI / 2, [60, -48, 9], [36, -62, 5]],
  ['city-saigon', [-8, 72], 0, [-6, 61, 7], [-8, 88, 4]],
  ['city-sydney', [-70, -18], Math.PI, [-63, -7, 9], [-70, -34, 7]],
  ['city-brisbane', [-20, 52], -Math.PI / 2, [-8, 57, 7], [-36, 50, 6]],
  ['city-melbourne', [-128, 66], -Math.PI / 2, [-117, 70, 6], [-144, 66, 3]],
  ['road-village', [75, 30], Math.PI / 2, [63, 37, 7], [82, 28, 3]],
  ['road-town', [4, 47], Math.PI / 2, [-7, 53, 6], [20, 46, 3]],
  ['road-farm', [-23, 92], 0, [-26, 80, 7], [-22, 104, 2]]
];
for (const [n, hero, yaw, cam, look] of S) if (want(n)) await scene(page, n, hero, yaw, cam, look);
// the whistling kite in the meadow, flying ahead of the child
if (want('kite')) { await page.evaluate(() => { const G = window.__sv, p = G.heroes[0].profile; p.kite = true; p.kiteOn = true; G.kites.sync(); }); await scene(page, 'kite', [0, 12], Math.PI, [3, 24, 3], [-1, 3, 7], 8000); }
// a kiosk: food and a saying
if (want('kiosk')) {
  await view(page, 'kiosk-bg', 84, -26, 0, 1, 2500);
  await page.evaluate(() => { const G = window.__sv, it = G.interactables.find(i => i.id === 'v_k_bunca'); G.heroes[0].place(it.x, it.z); it.act(G.heroes[0], G); });
  await page.waitForTimeout(1500); await quiet(page); await shot(page, 'kiosk');
}
// the map with roads, and the Games hub
if (want('map')) { await clear(page); await page.evaluate(() => window.__sv.openPad(0, 'map')); await page.waitForTimeout(1500); await shot(page, 'map'); }
if (want('hub')) { await clear(page); await page.evaluate(() => window.__sv.openGamesHub(0)); await page.waitForTimeout(1500); await shot(page, 'hub'); }
// city games
for (const g of ['puppets', 'dongho', 'traffic', 'koala', 'tram', 'ferries']) if (want('g-' + g)) { await clear(page); await page.evaluate(g => { window.__sv.playGame(0, g, 'replay'); }, g); await page.waitForTimeout(3500); await shot(page, 'g-' + g); await page.evaluate(() => { document.querySelector('.gl .gl-x')?.click(); }); await page.waitForTimeout(800); await clear(page); }
// a fairy tale in the tale theatre, English then Vietnamese
for (const [lang, n] of [['en', 'tale-en'], ['vi', 'tale-vi']]) if (want(n)) {
  const Q = { page }; // switch the language in the same window (a second full-quality window is too slow here)
  await page.evaluate(async lang => { const S = await import('/js/state.js'), I = await import('/js/i18n.js'); S.settings.lang = lang; I.applyLang(); document.querySelectorAll('.theatre, .tt-wrap, .modal').forEach(e => e.remove()); }, lang);
  await clear(Q.page);
  await Q.page.evaluate(async () => { const T = await import('/js/tales.js'); const D = await import('/js/talesdata.js'); const tale = D.MORE_TALES[0]; T.openTheatre(tale, { name: 'Na', startPage: 1 }); document.querySelector('.theatre .th-auto').click(); /* stay on this page */ });
  await Q.page.waitForTimeout(2200); await shot(Q.page, n); // before it turns the page by itself
}
await ctx.close(); await b.close();
