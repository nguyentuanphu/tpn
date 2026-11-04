// The Handbook's "now" pictures (helper "handbook", 4 Nov 2026 AEDT; docs/cores/tasks/handbook-brief.md): the current
// game, website and Studio on a phone, a tablet and a computer, in Vietnamese, as small JPEGs. Not a check.
// Based on docs/launch-2027/capture.mts.
//   node tools/build.mts && python3 -m http.server 8765 &
//   CHROMIUM=/opt/pw-browsers/chromium node tools/handbook-shots.mts [names...]
// writes docs/handbook/img/now/<name>-<device>.jpg; then node tools/handbook.mts builds the page with them.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
// @ts-ignore the browser harness is plain test code, typed loosely
import { launch, open, clear, URL as BASE } from '../tests/harness.mts';

type Page = { screenshot(o: object): Promise<unknown>; evaluate(f: unknown, a?: unknown): Promise<unknown>; waitForTimeout(ms: number): Promise<void>;
  waitForSelector(s: string, o?: object): Promise<unknown>; addStyleTag(o: object): Promise<unknown>; goto(u: string, o?: object): Promise<unknown> };
type Opened = { page: Page; ctx: { close(): Promise<void> } };

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(ROOT, 'docs/handbook/img/now');
fs.mkdirSync(OUT, { recursive: true });
const only = process.argv.slice(2);
const want = (n: string) => !only.length || only.includes(n);
const DEVICES: [string, number, number, boolean][] = [['phone', 390, 844, true], ['tablet', 1180, 820, true], ['computer', 1280, 800, false]];
const lang = 'vi';
const limit = <X,>(p: Promise<X>, ms = 60000) => Promise.race([p, new Promise<X>((_, r) => setTimeout(() => r(new Error('timeout')), ms))]);
const shot = async (page: Page, name: string, dev: string) => {
  await page.screenshot({ path: path.join(OUT, `${name}-${dev}.jpg`), type: 'jpeg', quality: 62 });
  console.log('saved', name, dev);
};
const quiet = (page: Page) => page.evaluate(() => { document.querySelectorAll('.toast, .htoast, .region-banner, .banner, .vc-pop, .hint, .bubble').forEach(e => e.remove()); });
const clean = (page: Page) => page.evaluate(() => { document.querySelectorAll('.dialog, .theatre, .storybook, .modal, .toast, .htoast, .reward').forEach(e => e.remove()); (window as any).__sv.paused = false; });

// a wide view with no buttons (places of the r56 map on, as in docs/launch-2027/capture.mts)
const CINE: [string, number[], number[], number[]][] = [
  ['valley-village', [204, -30], [196, -14, 12], [204, -46, 2]],
  ['valley-hanoi', [130, -122], [138, -110, 8], [125, -133, 2]],
  ['valley-sydney', [-90, 32], [-84, 42, 9], [-98, 18, 4]]];
const SCREENS: [string, string][] = [
  ['hub', 'window.__sv.openGamesHub(0)'],
  ['game-oanquan', "window.__sv.playGame(0, 'oanquan', 'replay')"],
  ['game-count', "window.__sv.playGame(0, 'counting', 'replay')"],
  ['grownups', "(async () => (await import('/js/ui.js')).openGrownups())()"]];

const b = await launch();
try {
  for (const [dev, w, h, touch] of DEVICES) {
    const game = async (o: object = {}): Promise<Opened> => {
      const P: Opened = await open(b, { w, h, dpr: 1, lang, touch, fast: false, settings: { quality: 'high', alwaysDay: true, captions: false }, ...o });
      await clear(P.page);
      await P.page.addStyleTag({ content: '.htoast { display: none !important; }' });
      return P;
    };
    if (want('title')) {
      const P: Opened = await open(b, { w, h, dpr: 1, lang, touch, fast: false, play: false, settings: { quality: 'high', alwaysDay: true } });
      await P.page.waitForTimeout(8000); await P.page.addStyleTag({ content: '.launch-progress { display: none !important; }' });
      await P.page.waitForTimeout(500); await shot(P.page, 'title', dev); await P.ctx.close();
    }
    const cine = CINE.filter(([n]) => want(n));
    if (cine.length) {
      const P = await game();
      for (const [n, hero, cam, look] of cine) {
        try {
          await limit((async () => {
            await clear(P.page);
            await P.page.evaluate(([hx, hz]: number[]) => { const g = (window as any).__sv.heroes[0]; g.place(hx, hz); g.yaw = Math.PI; }, hero);
            await P.page.waitForTimeout(2000); await clean(P.page); await quiet(P.page);
            await P.page.evaluate(([c, l]: number[][]) => {
              const G = (window as any).__sv, me = G.heroes[0], g = (x: number, z: number) => G.world.groundAt(x, z);
              G.paused = true; (document.querySelector('#huds') as HTMLElement).style.visibility = 'hidden';
              me.cam.position.set(c[0], g(c[0], c[1]) + c[2], c[1]); me.cam.lookAt(l[0], g(l[0], l[1]) + l[2], l[1]);
            }, [cam, look]);
            await P.page.waitForTimeout(6000); await quiet(P.page); await shot(P.page, n, dev);
            await P.page.evaluate(() => { (window as any).__sv.paused = false; (document.querySelector('#huds') as HTMLElement).style.visibility = ''; });
          })());
        } catch (e) { console.log('skip', n, dev, String((e as Error).message).slice(0, 100)); }
      }
      await P.ctx.close();
    }
    for (const [name, js] of SCREENS.filter(([n]) => want(n))) {
      // a fresh page for each screen, so one that does not close cannot spoil the next
      const P = await game();
      try {
        await P.page.waitForTimeout(1500); await clean(P.page);
        await limit(P.page.evaluate(`document.querySelectorAll('.dialog').forEach(e => e.remove()); __sv.paused = false; ${js}; 1`), 15000);
        await P.page.waitForSelector('.modal, .hub, .pad, .theatre, .gl, .dialog:not(.out)', { timeout: 45000 });
        await P.page.waitForTimeout(3500); await quiet(P.page); await P.page.evaluate(() => document.querySelectorAll('.dialog').forEach(e => e.remove()));
        await shot(P.page, name, dev);
      } catch (e) { console.log('skip', name, dev, String((e as Error).message).slice(0, 100)); }
      await P.ctx.close();
    }
    if (want('simple')) { const P = await game({ screen: 'simple' }); await P.page.waitForTimeout(3500); await quiet(P.page); await shot(P.page, 'simple', dev); await P.ctx.close(); }
    // the website and Studio as they open (Studio, served by Netlify at /studio/ from studio/ui/, shows its sign-in page without a key)
    for (const [name, url] of [['website', 'home/'], ['studio', 'studio/ui/index.html']] as [string, string][]) {
      if (!want(name)) continue;
      const P: Opened = await open(b, { w, h, dpr: 1, lang, touch, play: false });
      try { await P.page.goto(String(BASE) + url, { waitUntil: 'load' }); await P.page.waitForTimeout(2500); await shot(P.page, name, dev); }
      catch (e) { console.log('skip', name, dev, String((e as Error).message).slice(0, 100)); }
      await P.ctx.close();
    }
  }
} finally { await b.close(); }
