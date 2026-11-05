// (v1.08e faces, part 2) the child's friend in play, then in a close-up moment (a cheer: the camera eases in), on a phone,
// a tablet and a computer, with the high-detail model: node tests/faces-play-shots.mts <out folder> [tag]
import { launch, open, clear } from './harness.mts';
import fs from 'fs';
const out = process.argv[2] || 'docs/world-models-v108e/faces', tag = process.argv[3] || 'after';
fs.mkdirSync(out, { recursive: true });
const b = await launch();
for (const [dev, w, h, touch] of [['phone', 390, 844, true], ['tablet', 820, 1180, true], ['computer', 1280, 800, false]] as [string, number, number, boolean][]) {
  const P = await open(b, { w, h, touch }); await clear(P.page);
  await P.page.evaluate(async () => { const H = (window as any).__sv.heroes[0]; for (let k = 0; k < 80 && !H.av.modelHD; k++) await new Promise(r => setTimeout(r, 250)); });
  await P.page.waitForTimeout(800); await P.page.screenshot({ path: `${out}/${tag}-play-${dev}.png` });
  await P.page.evaluate(() => { const H = (window as any).__sv.heroes[0]; H.cheerT = 6; });
  await P.page.waitForTimeout(3500); await P.page.screenshot({ path: `${out}/${tag}-closeup-${dev}.png` });
  if (P.errors.length) console.log(dev, P.errors.slice(0, 3));
  await P.ctx.close();
}
await b.close(); console.log('shots in', out);
