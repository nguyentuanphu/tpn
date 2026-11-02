// (r79 learning, chat 2, 16 Oct AEDT) before and after pictures of the learning games on a phone (EN and VI), a tablet
// and a computer: each game a moment into its first question at under-5, Easy and Hard; the reward banner after three
// right answers in a row; and the "You did it!" screen. Games that do not exist yet in the code being pictured are
// skipped (the before pictures have no new games). Run it once on the old code and once on the new.
// Usage (from tests/, so the browser package is found): node ../docs/owner-repair-20261014/r79-learning-shots.mts <evidence folder name>   (SV_URL picks the game)
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { launch, open, clear } from '../../tests/harness.mts';
const root = fileURLToPath(new URL('../../', import.meta.url)), out = path.join(root, 'docs/owner-repair-20261014/evidence', process.argv[2] || 'r79-learning-now');
fs.mkdirSync(out, { recursive: true });
const layouts = [['phone', 'en', 390, 844, true], ['phone', 'vi', 390, 844, true], ['tablet', 'en', 820, 1180, true], ['computer', 'en', 1280, 800, false]];
const games = ['rulefinder', 'gardenorder', 'steppingpath', 'remembergarden', 'patternpicnic', 'shapebuilders', 'sayfind', 'marketcount', 'feelings', 'soundhunt'];
const modes = [['under5', true, 1], ['easy', false, 1], ['hard', false, 3]];
const b = await launch(), result = [];
const openIt = (P, id, little, level) => P.page.evaluate(async ({ id, little, level }) => { const F = await import('/js/games/frame.js'); __sv.paused = true; window.__shot = F.openGame(id, { players: [__sv.heroes[0].profile], little, level }); }, { id, little, level });
const close = async P => { if (await P.page.locator('.gl-win').count()) { await P.page.waitForTimeout(700); await P.page.locator('.gl-win p').first().click(); } else await P.page.locator('.gl-x').click(); await P.page.waitForSelector('.gl', { state: 'detached' }); await P.page.waitForTimeout(150); };
// right answers through the auto play hooks (real taps on the real buttons)
const answer = (P, n, stopAtWin = false) => P.page.evaluate(async ({ n, stopAtWin }) => {
  const F = await import('/js/games/frame.js'), wait = ms => new Promise(r => setTimeout(r, ms)); let k = 0; const until = Date.now() + 40000;
  while (Date.now() < until && k < n && !document.querySelector('.gl-win')) {
    const ask = F.playWatch.ask; if (ask) { const e = ask.els.find(x => !x.disabled && ask.check(x)); if (e) { e.click(); k++; } }
    else { const next = F.playWatch.plan?.(); if (next && !next.disabled) next.click(); }
    await wait(stopAtWin ? 80 : 450);
  }
  return k;
}, { n, stopAtWin });
try {
  for (const [name, lang, w, h, touch] of layouts) {
    const P = await open(b, { w, h, touch, lang }); await clear(P.page);
    const have = await P.page.evaluate(async ids => { const F = await import('/js/games/frame.js'); return ids.filter(id => F.GAMES[id]); }, games);
    for (const id of have) for (const [mode, little, level] of modes) {
      await openIt(P, id, little, level); await P.page.waitForSelector('.gl'); await P.page.waitForTimeout(1500);
      const file = `${name}-${lang}-${id}-${mode}.png`; await P.page.screenshot({ path: path.join(out, file) });
      result.push({ file, choices: await P.page.evaluate(() => [...document.querySelectorAll('.gl-stage button')].filter(x => !x.disabled && x.getClientRects().length).length), help: await P.page.evaluate(() => document.querySelector('.gl-help')?.textContent.trim()) });
      await close(P);
    }
    // the reward banner: three right in a row in Find the Rule (Easy), pictured while the banner shows
    await openIt(P, 'rulefinder', false, 1); await P.page.waitForSelector('.gl'); await P.page.waitForTimeout(800);
    await answer(P, 3); await P.page.waitForTimeout(150);
    await P.page.screenshot({ path: path.join(out, `${name}-${lang}-reward-banner.png`) });
    result.push({ file: `${name}-${lang}-reward-banner.png`, banners: await P.page.evaluate(() => document.querySelectorAll('.gl-combo, .gl-reward').length) });
    // the win screen, a moment after it opens (the chest and the two buttons are showing)
    await answer(P, 99, true); await P.page.waitForSelector('.gl-win'); await P.page.waitForTimeout(1900);
    await P.page.screenshot({ path: path.join(out, `${name}-${lang}-win.png`) }); result.push({ file: `${name}-${lang}-win.png` });
    await close(P);
    result.push({ layout: `${name}-${lang}`, errors: P.errors }); await P.ctx.close();
  }
} finally { await b.close(); fs.writeFileSync(path.join(out, 'shots.json'), JSON.stringify(result, null, 2) + '\n'); }
console.log(result.filter(r => r.errors).map(r => r.layout + ' errors ' + r.errors.length).join('; '));
