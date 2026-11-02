// (owner repair round, points 46-48, 16 Oct AEDT) pictures of the six reasoning games at under-5, Easy and Hard, a
// moment into the first question, on a phone (EN and VI), a tablet and a computer. Run it once on the old code and
// once on the new to get matching before and after pictures.
// Usage: node owner-thinking-shots.mts <evidence folder name>   (SV_URL picks the game)
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { launch, open, clear } from './harness.mts';
const root = fileURLToPath(new URL('../', import.meta.url)), out = path.join(root, 'docs/owner-repair-20261014/evidence', process.argv[2] || 'thinking-now');
fs.mkdirSync(out, { recursive: true });
const layouts = [['phone', 'en', 390, 844, true], ['phone', 'vi', 390, 844, true], ['tablet', 'en', 820, 1180, true], ['computer', 'en', 1280, 800, false]];
const games = ['rulefinder', 'gardenorder', 'steppingpath', 'remembergarden', 'patternpicnic', 'shapebuilders'];
const modes = [['under5', true, 1], ['easy', false, 1], ['hard', false, 3]];
const b = await launch(), result = [];
try {
  for (const [name, lang, w, h, touch] of layouts) {
    const P = await open(b, { w, h, touch, lang }); await clear(P.page);
    for (const id of games) for (const [mode, little, level] of modes) {
      await P.page.evaluate(async ({ id, little, level }) => { const F = await import('/js/games/frame.js'); __sv.paused = true; window.__shot = F.openGame(id, { players: [__sv.heroes[0].profile], little, level }); }, { id, little, level });
      await P.page.waitForSelector('.gl'); await P.page.waitForTimeout(1500);
      const file = `${name}-${lang}-${id}-${mode}.png`; await P.page.screenshot({ path: path.join(out, file) });
      result.push({ file, choices: await P.page.evaluate(() => [...document.querySelectorAll('.gl-stage button')].filter(x => !x.disabled && x.getClientRects().length).length), help: await P.page.evaluate(() => document.querySelector('.gl-help')?.textContent.trim()) });
      await P.page.locator('.gl-x').click(); await P.page.waitForSelector('.gl', { state: 'detached' }); await P.page.waitForTimeout(150);
    }
    result.push({ layout: `${name}-${lang}`, errors: P.errors }); await P.ctx.close();
  }
} finally { await b.close(); fs.writeFileSync(path.join(out, 'shots.json'), JSON.stringify(result, null, 2) + '\n'); }
console.log(result.filter(r => r.errors).map(r => r.layout + ' errors ' + r.errors.length).join('; '));
