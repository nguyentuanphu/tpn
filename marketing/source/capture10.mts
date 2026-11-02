// Ten ads for r82 (owner, 17 Oct 2026 AEDT): stills at 1080x1920 from the live game (r81) and Sparkle Studio, both languages.
// node capture10.mts <lang> [names...]   (game served on :8765; writes stills10/<name>-<lang>.jpg). Not a check.
import fs from 'fs';
import path from 'path';
import { launch, open, clear } from '../../tests/harness.mts';
const DIR = new URL('.', import.meta.url).pathname, out = DIR + 'stills10';
const [lang = 'en', ...only] = process.argv.slice(2), want = n => !only.length || only.includes(n);
fs.mkdirSync(out, { recursive: true });
const b = await launch();
const W = 360, H = 640, DPR = 3, k = lang === 'vi' ? 1 : 0;
const T = (p, ms = 20000) => Promise.race([p, new Promise((_, r) => setTimeout(() => r(new Error('timeout')), ms))]);
const shot = async (page, name) => { await page.screenshot({ path: `${out}/${name}-${lang}.jpg`, type: 'jpeg', quality: 90 }); console.log('saved', name); };
const quiet = page => page.evaluate(() => { document.querySelectorAll('.toast, .htoast, .region-banner, .banner, .vc-pop, .hint, .bubble').forEach(e => e.remove()); });
const clean = page => page.evaluate(() => { document.querySelectorAll('.dialog, .theatre, .storybook, .modal, .toast, .htoast, .reward').forEach(e => e.remove()); __sv.paused = false; });
const tidy = page => page.evaluate(() => { document.querySelectorAll('.modal, .hub, .pad, .howto, .theatre, .gl, .dialog, .storybook, .vc-pop, .wardrobe, .toast, .reward').forEach(e => e.remove()); __sv.paused = false; __sv.closeUp = null; });
const LIVE = { releases: {}, festivals: {}, content: {
  message: { en: 'Great job today! Dinner at six, love Mum', vi: 'Hôm nay con giỏi lắm! Sáu giờ ăn cơm nhé, Mẹ thương' },
  missions: [{ id: 'adwater', en: 'Water the plants with Dad', vi: 'Tưới cây cùng Bố' }, { id: 'adtoys', en: 'Put your toys away', vi: 'Cất đồ chơi gọn gàng' }, { id: 'adbook', en: 'Read a book with Grandma', vi: 'Đọc sách cùng Bà' }] } };
const game = async (o = {}) => {
  const P = await open(b, { w: W, h: H, dpr: DPR, lang, touch: true, fast: false, settings: { quality: 'high', alwaysDay: true, captions: false, familyMsgDay: null }, route: async ctx => { await ctx.route('**/api/live**', r => r.fulfill({ contentType: 'application/json', body: JSON.stringify(LIVE) })); }, ...o });
  await clear(P.page); await P.page.evaluate(() => { window.__sv.renderer.setPixelRatio(3); dispatchEvent(new Event('resize')); });
  await P.page.addStyleTag({ content: '.htoast { display: none !important; }' });
  return P;
};
async function scene(page, name, hero, yaw, cam, look, wait = 6000) {
  await clear(page);
  await page.evaluate(([hx, hz, yaw]) => { const G = window.__sv, h = G.heroes[0]; h.place(hx, hz); h.yaw = yaw; }, [hero[0], hero[1], yaw]);
  await page.waitForTimeout(2000); await clean(page); await quiet(page);
  await page.evaluate(([cam, look]) => {
    const G = window.__sv, h = G.heroes[0], g = (x, z) => G.world.groundAt(x, z);
    G.paused = true; document.querySelector('#huds').style.visibility = 'hidden';
    h.cam.position.set(cam[0], g(cam[0], cam[1]) + cam[2], cam[1]); h.cam.lookAt(look[0], g(look[0], look[1]) + look[2], look[1]);
  }, [cam, look]);
  await page.waitForTimeout(wait); await page.evaluate(() => document.querySelectorAll('.dialog, .theatre, .storybook, .modal').forEach(e => e.remove())); await quiet(page); await shot(page, name);
  await page.evaluate(() => { window.__sv.paused = false; document.querySelector('#huds').style.visibility = ''; });
}
try {
  if (want('title')) { const P = await open(b, { w: W, h: H, dpr: DPR, lang, touch: true, fast: false, play: false, settings: { quality: 'high', alwaysDay: true } });
    await P.page.evaluate(() => { window.__sv.renderer.setPixelRatio(3); dispatchEvent(new Event('resize')); }); await P.page.waitForTimeout(3500); await shot(P.page, 'title'); await P.ctx.close(); }
  // places: a cinematic view with no HUD (the child at hero, camera at cam [x, z, height] looking at look)
  // (the map of r56 on: Lotus Village at [204, -42], Hà Nội [153, -135] with Hồ Gươm 29 m west, Sydney [-132, -4] on its
  // harbour, Hội An [170, 90] with Chùa Cầu over the canal to the north)
  const CINE = [['cine-village', [204, -30], Math.PI, [213, -16, 8], [203, -46, 3]], ['cine-hanoi', [130, -122], Math.PI, [138, -110, 8], [125, -133, 2]],
    ['cine-sydney', [-90, 32], Math.PI, [-84, 42, 9], [-98, 18, 4]], ['cine-hoian', [170, 92], Math.PI, [178, 102, 7], [170, 72, 2]]].filter(([n]) => want(n));
  if (CINE.length) { const P = await game(); for (const [n, hero, yaw, cam, look] of CINE) { try { await T(scene(P.page, n, hero, yaw, cam, look), 60000); } catch (e) { console.log('skip', n, e.message.slice(0, 100)); } } await P.ctx.close(); }
  // the live family message as it arrives
  // (opened without clear(): it would close the family message too)
  if (want('message')) { const P = await open(b, { w: W, h: H, dpr: DPR, lang, touch: true, fast: false, settings: { quality: 'high', alwaysDay: true, captions: false, familyMsgDay: null }, route: async ctx => { await ctx.route('**/api/live**', r => r.fulfill({ contentType: 'application/json', body: JSON.stringify({ ...LIVE, content: { message: LIVE.content.message } }) })); } });
    await P.page.waitForFunction(() => window.__sv && __sv.heroes && __sv.heroes.length, null, { timeout: 90000 }).catch(() => { });
    await P.page.evaluate(() => { window.__sv.renderer.setPixelRatio(3); dispatchEvent(new Event('resize')); }); await P.page.addStyleTag({ content: '.htoast { display: none !important; }' });
    let ok = false; for (let i = 0; i < 40 && !ok; i++) { ok = await P.page.evaluate(() => { const ds = [...document.querySelectorAll('.dialog')], m = ds.find(d => !d.classList.contains('out') && /Mum|Mẹ thương/.test(d.textContent)); if (m) return true; ds.forEach(d => d.remove()); __sv.paused = false; return false; }); if (!ok) await P.page.waitForTimeout(1000); }
    await P.page.waitForTimeout(900); await shot(P.page, 'message'); await P.ctx.close(); }
  // screens opened in the game
  const S = [
    ['hub', 'window.__sv.openGamesHub(0)'], ['map', "window.__sv.openPad(0, 'map')"], ['friends', "window.__sv.openPad(0, 'friend')"], ['wardrobe', 'window.__sv.openWardrobe(0)'],
    ['missions', "window.__sv.openPad(0, 'log')"], ['stickers', "window.__sv.openPad(0, 'album')"],
    ['adventure', "(async () => { __sv.adventure.force(0, 'house'); await new Promise(r => setTimeout(r, 800)); document.querySelector('.hud .advcard .adv-open').click(); })()"],
    ['tale', "(async () => { const L = await import('/js/learn.js'); const t = L.TALES.find(x => /giong|gióng/i.test(String(x.id) + (x.title ? x.title() : ''))) || L.TALES[0]; (await import('/js/tales.js')).openTheatre(t, {}); })()"],
    ['game-count', "window.__sv.playGame(0, 'counting', 'replay')"], ['game-colors', "window.__sv.playGame(0, 'colors', 'replay')"], ['game-letters', "window.__sv.playGame(0, 'letters', 'replay')"],
    ['game-kite', "window.__sv.playGame(0, 'kite', 'replay')"], ['game-money', "window.__sv.playGame(0, 'heodat', 'replay')"],
    ['game-oanquan', "window.__sv.playGame(0, 'oanquan', 'replay')"],
    ['game-reading', "(async () => { await import('/js/games/readingmenu.js'); window.__sv.playGame(0, 'rd_trace', 'replay'); })()"],
    ['festivals', "(async () => (await import('/js/ui.js')).openFestivals(window.__sv, 0))()"],
    ['grownups', "(async () => { (await import('/js/ui.js')).openGrownups(); await new Promise(r => setTimeout(r, 1500)); const g = document.querySelector('.modal details[data-sec=\"time\"]'); if (g) { g.open = true; g.scrollIntoView({ block: 'start' }); } })()"],
    ['grownups-missions', "(async () => { (await import('/js/ui.js')).openGrownups(); await new Promise(r => setTimeout(r, 1500)); const g = [...document.querySelectorAll('.modal details')].find(d => d.querySelector('[data-fmready]')); if (g) { g.open = true; (g.querySelector('[data-fmready]') || g).scrollIntoView({ block: 'center' }); } })()"],
    ['dialog', "window.__sv.dialog('Ông Cú', [['Hoo hoo! One lantern flew away. Will you help me find it?', 'Hú hú! Một chiếc đèn lồng bay mất rồi. Cháu giúp ông tìm nhé?']], [['▶ Yes!', '▶ Có!'], ['👋 Later', '👋 Để sau']])"]
  ].filter(([n]) => want(n));
  if (S.length) { const P = await game();
    for (const [name, js] of S) {
      try { await clean(P.page); await P.page.waitForTimeout(500); await T(P.page.evaluate(`document.querySelectorAll('.dialog').forEach(e => e.remove()); __sv.paused = false; ${js}; 1`), 15000); await P.page.waitForSelector('.modal, .hub, .pad, .theatre, .gl, .dialog:not(.out), .wardrobe', { timeout: 45000 }); await P.page.waitForTimeout(3500); await quiet(P.page); if (name !== 'dialog') await P.page.evaluate(() => document.querySelectorAll('.dialog').forEach(e => e.remove())); await shot(P.page, name); }
      catch (e) { console.log('skip', name, e.message.slice(0, 100)); }
      try { await P.page.evaluate(() => { const x = document.querySelector('.gl .gl-x, .theatre .th-x, .x'); if (x) x.click(); }); await P.page.waitForTimeout(1500); await T(tidy(P.page), 10000); } catch (e) { }
    }
    await P.ctx.close(); }
  if (want('simple')) { const P = await game({ screen: 'simple' }); await P.page.waitForTimeout(3000); await shot(P.page, 'simple'); await P.ctx.close(); }
  if (want('two-players')) { const P = await game({ mode: 'split' }); await P.page.waitForTimeout(4000); await tidy(P.page); await quiet(P.page); await shot(P.page, 'two-players'); await P.ctx.close(); }
  // Sparkle Studio on a phone: the Missions and Message pages (each saved live at once since r81)
  if (want('studio-missions') || want('studio-message')) {
    const { fakeGitHub, routeGitHub, fakeNetlify, memoryBlobs } = await import('../../tests/studio-check.mts');
    const repo = 'family/ads', password = 'ads-fixture-password-123', site = 'http://localhost:8799';
    const content = { message: LIVE.content.message, missions: LIVE.content.missions };
    const gh = fakeGitHub(repo, { 'content/custom.json': JSON.stringify(content), 'js/build.js': fs.readFileSync(path.join(DIR, '../../js/build.js')) }), unroute = routeGitHub(gh);
    const server = await fakeNetlify({ port: 8799, players: memoryBlobs(), env: { STUDIO_PASSWORD: password, GITHUB_TOKEN: 'fixture-token', GITHUB_REPO: repo, URL: site } });
    try { const ctx = await b.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: DPR, hasTouch: true, isMobile: true }), pg = await ctx.newPage();
      await pg.addInitScript(l => localStorage.setItem('studioLang', l), lang);
      await pg.goto(site + '/studio'); await pg.fill('#pw', password); await pg.click('#si button'); await pg.waitForSelector('#tabs button');
      for (const [n, h] of [['studio-missions', 'family/missions'], ['studio-message', 'family/message']].filter(([n]) => want(n))) { await pg.evaluate(h2 => { location.hash = h2; }, h); await pg.waitForTimeout(2500); await pg.evaluate(() => { const m = [...document.querySelectorAll('#page *')].find(x => x.children.length < 3 && /Water the plants|Tưới cây/.test(x.textContent)), e = m || document.querySelector('#page #en'); if (e) e.scrollIntoView({ block: 'center' }); }); await pg.waitForTimeout(400); await shot(pg, n); }
      await ctx.close(); } finally { unroute(); server.close(); }
  }
} finally { await b.close(); }
