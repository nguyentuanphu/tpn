// Launch 2027 (v1.07 helper "launch", 2 Nov 2026 AEDT): the still pictures for the three short launch videos and the
// flyer, taken from the game itself (our own art only), in English and Vietnamese, as a phone screen (720 x 1280).
// Not a check. Based on marketing/source/capture10.mjs.
//   node tools/build.mts && python3 -m http.server 8765 &
//   CHROMIUM=/opt/pw-browsers/chromium node docs/launch-2027/capture.mts <en|vi> [names...]
// writes docs/launch-2027/shots/<name>-<lang>.jpg
import fs from 'fs';
import { launch, open, clear } from '../../tests/harness.mjs';

const OUT = new URL('./shots/', import.meta.url).pathname;
const [lang = 'en', ...only] = process.argv.slice(2);
const want = (n: string) => !only.length || only.includes(n);
fs.mkdirSync(OUT, { recursive: true });
const W = 360, H = 640, DPR = 2;
const T = <X>(p: Promise<X>, ms = 20000) => Promise.race([p, new Promise<X>((_, r) => setTimeout(() => r(new Error('timeout')), ms))]);
const shot = async (page: any, name: string) => { await page.screenshot({ path: `${OUT}${name}-${lang}.jpg`, type: 'jpeg', quality: 80 }); console.log('saved', name, lang); };
const quiet = (page: any) => page.evaluate(() => { document.querySelectorAll('.toast, .htoast, .region-banner, .banner, .vc-pop, .hint, .bubble').forEach(e => e.remove()); });
const clean = (page: any) => page.evaluate(() => { document.querySelectorAll('.dialog, .theatre, .storybook, .modal, .toast, .htoast, .reward').forEach(e => e.remove()); (window as any).__sv.paused = false; });
const tidy = (page: any) => page.evaluate(() => { const G = (window as any).__sv; document.querySelectorAll('.modal, .hub, .pad, .howto, .theatre, .gl, .dialog, .storybook, .vc-pop, .wardrobe, .toast, .reward').forEach(e => e.remove()); G.paused = false; G.closeUp = null; });

const b = await launch();
const game = async (o: any = {}) => {
  const P = await open(b, { w: W, h: H, dpr: DPR, lang, touch: true, fast: false, settings: { quality: 'high', alwaysDay: true, captions: false }, ...o });
  await clear(P.page);
  await P.page.evaluate((d: number) => { (window as any).__sv.renderer.setPixelRatio(d); dispatchEvent(new Event('resize')); }, DPR);
  await P.page.addStyleTag({ content: '.htoast { display: none !important; }' });
  return P;
};
// a wide view with no buttons: the child stands at hero, the camera at cam [x, z, height] looks at look [x, z, height]
async function scene(page: any, name: string, hero: number[], yaw: number, cam: number[], look: number[]) {
  await clear(page);
  await page.evaluate(([hx, hz, yaw]: number[]) => { const h = (window as any).__sv.heroes[0]; h.place(hx, hz); h.yaw = yaw; }, [hero[0], hero[1], yaw]);
  await page.waitForTimeout(2000); await clean(page); await quiet(page);
  await page.evaluate(([cam, look]: number[][]) => {
    const G = (window as any).__sv, h = G.heroes[0], g = (x: number, z: number) => G.world.groundAt(x, z);
    G.paused = true; (document.querySelector('#huds') as HTMLElement).style.visibility = 'hidden';
    h.cam.position.set(cam[0], g(cam[0], cam[1]) + cam[2], cam[1]); h.cam.lookAt(look[0], g(look[0], look[1]) + look[2], look[1]);
  }, [cam, look]);
  await page.waitForTimeout(6000); await page.evaluate(() => document.querySelectorAll('.dialog, .theatre, .storybook, .modal').forEach(e => e.remove())); await quiet(page); await shot(page, name);
  await page.evaluate(() => { (window as any).__sv.paused = false; (document.querySelector('#huds') as HTMLElement).style.visibility = ''; });
}

try {
  if (want('title')) {
    const P = await open(b, { w: W, h: H, dpr: DPR, lang, touch: true, fast: false, play: false, settings: { quality: 'high', alwaysDay: true } });
    // the last loading step finishes only after Tap to start: the progress line is taken off this still
    await P.page.waitForTimeout(8000); await P.page.evaluate(() => document.querySelector('.launch-progress')?.remove());
    await P.page.waitForTimeout(500); await shot(P.page, 'title'); await P.ctx.close();
  }
  // places (map of r56 on: Lotus Village [204, -42], Hà Nội [153, -135], Sydney [-132, -4] on its harbour, Hội An [170, 90])
  const CINE: [string, number[], number, number[], number[]][] = [
    ['valley-village', [204, -30], Math.PI, [196, -14, 12], [204, -46, 2]], ['valley-hanoi', [130, -122], Math.PI, [138, -110, 8], [125, -133, 2]],
    ['valley-sydney', [-90, 32], Math.PI, [-84, 42, 9], [-98, 18, 4]], ['valley-hoian', [170, 92], Math.PI, [178, 102, 7], [170, 72, 2]]];
  const cine = CINE.filter(([n]) => want(n));
  if (cine.length) {
    const P = await game();
    for (const [n, hero, yaw, cam, look] of cine) { try { await T(scene(P.page, n, hero, yaw, cam, look), 60000); } catch (e: any) { console.log('skip', n, String(e.message).slice(0, 100)); } }
    await P.ctx.close();
  }
  // screens opened in the game
  const S: [string, string][] = ([
    ['hub', 'window.__sv.openGamesHub(0)'],
    ['map', "window.__sv.openPad(0, 'map')"],
    ['wardrobe', 'window.__sv.openWardrobe(0)'],
    ['stickers', "window.__sv.openPad(0, 'album')"],
    ['tale', "(async () => { const L = await import('/js/learn.js'); const t = L.TALES.find(x => /giong|gióng/i.test(String(x.id) + (x.title ? x.title() : ''))) || L.TALES[0]; (await import('/js/tales.js')).openTheatre(t, {}); })()"],
    ['game-count', "window.__sv.playGame(0, 'counting', 'replay')"],
    ['game-letters', "window.__sv.playGame(0, 'letters', 'replay')"],
    ['game-kite', "window.__sv.playGame(0, 'kite', 'replay')"],
    ['game-money', "window.__sv.playGame(0, 'heodat', 'replay')"],
    ['game-oanquan', "window.__sv.playGame(0, 'oanquan', 'replay')"],
    ['game-reading', "(async () => { await import('/js/games/readingmenu.js'); window.__sv.playGame(0, 'rd_trace', 'replay'); })()"],
    ['festivals', "(async () => (await import('/js/ui.js')).openFestivals(window.__sv, 0))()"],
    ['grownups', "(async () => { (await import('/js/ui.js')).openGrownups(); await new Promise(r => setTimeout(r, 1500)); const g = document.querySelector('.modal details[data-sec=\"time\"]'); if (g) { g.open = true; g.scrollIntoView({ block: 'start' }); } })()"],
  ] as [string, string][]).filter(([n]) => want(n));
  if (S.length) {
    const P = await game();
    for (const [name, js] of S) {
      try {
        await clean(P.page); await P.page.waitForTimeout(500);
        await T(P.page.evaluate(`document.querySelectorAll('.dialog').forEach(e => e.remove()); __sv.paused = false; ${js}; 1`), 15000);
        await P.page.waitForSelector('.modal, .hub, .pad, .theatre, .gl, .dialog:not(.out), .wardrobe', { timeout: 45000 });
        await P.page.waitForTimeout(3500); await quiet(P.page); await P.page.evaluate(() => document.querySelectorAll('.dialog').forEach(e => e.remove()));
        await shot(P.page, name);
      } catch (e: any) { console.log('skip', name, String(e.message).slice(0, 100)); }
      try { await P.page.evaluate(() => { const x = document.querySelector('.gl .gl-x, .theatre .th-x, .x') as HTMLElement | null; if (x) x.click(); }); await P.page.waitForTimeout(1500); await T(tidy(P.page), 10000); } catch (e) { }
    }
    await P.ctx.close();
  }
  if (want('simple')) { const P = await game({ screen: 'simple' }); await P.page.waitForTimeout(3000); await shot(P.page, 'simple'); await P.ctx.close(); }
  if (want('two-players')) { const P = await game({ mode: 'split' }); await P.page.waitForTimeout(4000); await tidy(P.page); await quiet(P.page); await shot(P.page, 'two-players'); await P.ctx.close(); }
} finally { await b.close(); }
