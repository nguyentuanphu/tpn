// v1.08f films: screenshots of "Download all films for offline" in Story time on a phone, a tablet (upright, sideways)
// and a computer (out/v108f-films-*.png). Not a check: the pictures a round report looks at.
import { chromium } from 'playwright';
import { open, clear } from './harness.mts';
const b = await chromium.launch();
const SIZES: [string, number, number, boolean][] = [['phone', 390, 844, true], ['tablet', 820, 1180, true], ['tablet-wide', 1180, 820, true], ['computer', 1440, 900, false]];
for (const [name, w, h, touch] of SIZES) {
  const P = await open(b, { w, h, touch }); await clear(P.page);
  await P.page.evaluate(async () => {
    const B = await import('/js/content/blenderfilms.js'), W = window as any;
    for (const id of B.BLENDER_FOR_ALL) B.BLENDER_FILMS[id] = { v: 'test', bytes: 3.2 * 1048576, pages: [{ s: 0, e: 1 }] };
    const it = W.__sv.interactables.find(x => x.id === 'storytime'); it.act(W.__sv.heroes[0]);
    for (let i = 0; i < 80 && !document.querySelector('.filmpack'); i++) await new Promise(r => setTimeout(r, 50));
  });
  await P.page.waitForTimeout(500);
  await P.page.screenshot({ path: `out/v108f-films-${name}.png` });
  const r = await P.page.evaluate(() => { const c = document.querySelector('.filmpack') as HTMLElement, btn = c && c.querySelector('button') as HTMLElement; return c ? { card: c.getBoundingClientRect().toJSON(), btn: btn.getBoundingClientRect().toJSON(), vw: innerWidth } : null; });
  console.log(name, JSON.stringify(r)); await P.ctx.close();
}
await b.close();
