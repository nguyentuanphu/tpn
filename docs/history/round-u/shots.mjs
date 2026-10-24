// (Round U) phone, tablet and computer screenshots of the round's new things.
// Run: cd tests && CHROMIUM=/opt/pw-browsers/chromium node ../docs/round-u/shots.mjs ../docs/round-u/shots
import { launch, open } from '../../../tests/harness.mjs';
import fs from 'fs';
const out = process.argv[2]; fs.mkdirSync(out, { recursive: true });
const SIZES = [['phone', 390, 844, true], ['tablet', 820, 1180, true], ['computer', 1280, 800, false]];
const b = await launch();
const shot = (P, name) => P.page.screenshot({ path: `${out}/${name}.png` });
for (const [dev, w, h, touch] of SIZES) {
  const P = await open(b, { w, h, touch, fast: false });
  const go = (fn, arg) => P.page.evaluate(fn, arg);
  await go(async () => { for (let k = 0; k < 80 && !(__sv.wayfind && __sv.jobs && __sv.dayPlan); k++) await new Promise(r => setTimeout(r, 100)); });
  // the market: price signs, sellers
  await go(async () => { const { rowStreet } = await import('/js/content/map.js'); const S = rowStreet('market'), hero = __sv.heroes[0]; hero.place(S.a[0] + S.dx * 14, S.a[1] + S.dz * 14); hero.camYaw = Math.atan2(S.nx, S.nz); });
  await P.page.waitForTimeout(2500); await shot(P, `${dev}-market-prices`);
  // the job board at Hà Nội
  await go(() => { const B = __sv.jobs.boards.find(x => x.key === 'hanoi'), hero = __sv.heroes[0], a = B.grp.rotation.y + Math.PI; hero.place(B.x - Math.sin(a) * 4, B.z - Math.cos(a) * 4); hero.camYaw = a; });
  await P.page.waitForTimeout(2500); await shot(P, `${dev}-jobboard`);
  // Where is…? the chooser, then the sparkles
  await go(() => { const hero = __sv.heroes[0], f = __sv.PLACES.find(p => p.key === 'farm'); hero.place(f.x, f.z - 20); });
  await P.page.waitForTimeout(1200); await P.page.click('.hud .z-where'); await P.page.waitForTimeout(800); await shot(P, `${dev}-where`);
  await P.page.locator('.wp-pick').nth(4).click(); await P.page.waitForTimeout(600);
  await go(() => { const t = __sv.wayfind.trail, hero = __sv.heroes[0], a = t.pts[3], c = t.pts[9]; hero.place(a[0], a[1]); hero.camYaw = Math.atan2(c[0] - a[0], c[1] - a[1]); });
  await P.page.waitForTimeout(2500); await shot(P, `${dev}-sparkles`);
  await go(() => __sv.wayfind.stop(true));
  // villagers with job pictures (Two Homes Street)
  await go(() => { const v = __sv.dayPlan.list[0], hero = __sv.heroes[0]; hero.place(v.home.x + 4, v.home.z + 4); hero.camYaw = Math.atan2(-1, -1); });
  await P.page.waitForTimeout(2500); await shot(P, `${dev}-villagers`);
  // the Simple screen: category cards and one road
  await go(() => { __sv.simple.show('games'); __sv.simple.openGroup('games', null); document.querySelectorAll('.dialog').forEach(d => d.remove()); });
  await P.page.waitForTimeout(1200); await shot(P, `${dev}-simple-cards`);
  await P.page.locator('.sp-catcard').first().click(); await P.page.waitForTimeout(1000); await shot(P, `${dev}-simple-road`);
  await P.ctx.close();
}
await b.close();
