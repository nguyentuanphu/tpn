// (T1b) phone, tablet and computer screenshots of the market rows: the child stands in the street, the camera looks at the row.
// Run: cd tests && CHROMIUM=/opt/pw-browsers/chromium node ../docs/t1b/shots.mjs out/t1b-shots [yaw]
import { launch, open } from '../../../tests/harness.mjs';
import fs from 'fs';
const out = process.argv[2]; fs.mkdirSync(out, { recursive: true });
const SIZES = [['phone', 390, 760, true], ['tablet', 820, 1180, true], ['computer', 1280, 800, false]];
const SPOTS = [['market', 20], ['aussie', 14], ['town', 30], ['hanoi', 6], ['china', 6]];
const b = await launch();
for (const [name, w, h, touch] of SIZES) {
  const P = await open(b, { w, h, touch, fast: false });
  for (const [place, t] of SPOTS) {
    await P.page.evaluate(async ([place, t]) => {
      const { rowStreet } = await import('/js/content/map.js'); const S = rowStreet(place), G = __sv, hero = G.heroes[0];
      document.querySelectorAll('.gl-x, .dialog .x').forEach(e => e.click());
      // stand in the middle of the street, the camera looking across at the row
      const x = S.a[0] + S.dx * t, z = S.a[1] + S.dz * t;
      hero.place(x, z); hero.camYaw = Math.atan2(S.nx, S.nz);
    }, [place, t]);
    await P.page.waitForTimeout(2500);
    await P.page.screenshot({ path: `${out}/${name}-${place}.png` });
  }
  await P.ctx.close();
}
await b.close();
