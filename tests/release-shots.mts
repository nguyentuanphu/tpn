// Release screenshots (CLAUDE.md: every round on a phone, a tablet and a computer): the valley, Grown-ups and the
// games list, in each size. Usage: node release-shots.mts <evidence folder> [en|vi]   (SV_URL picks the game)
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { launch, open, start, clear } from './harness.mts';
const root = fileURLToPath(new URL('../', import.meta.url)), out = path.join(root, 'docs/owner-repair-20261014/evidence', process.argv[2] || 'release-now'), lang = process.argv[3] || 'en';
fs.mkdirSync(out, { recursive: true });
const sizes = { phone: [390, 844, true], tablet: [820, 1180, true], computer: [1280, 800, false] };
const b = await launch(), errors = {};
try {
  for (const [name, [w, h, touch]] of Object.entries(sizes)) {
    const P = await open(b, { w, h, touch, lang, play: false });
    await start(P.page); await clear(P.page); await P.page.waitForTimeout(2500);
    await P.page.screenshot({ path: path.join(out, `${name}-${lang}-valley.png`) });
    await P.page.evaluate(async () => (await import('/js/ui.js')).openGrownups()); await P.page.waitForTimeout(1200);
    await P.page.screenshot({ path: path.join(out, `${name}-${lang}-grownups.png`) });
    await P.page.keyboard.press('Escape').catch(() => { }); await clear(P.page);
    await P.page.evaluate(() => __sv.openGamesHub(0)); await P.page.waitForSelector('.hplay', { timeout: 20000 }); await P.page.waitForTimeout(1200);
    await P.page.screenshot({ path: path.join(out, `${name}-${lang}-games.png`) });
    errors[name] = P.errors; await P.ctx.close();
  }
} finally { await b.close(); }
console.log(JSON.stringify(errors));
