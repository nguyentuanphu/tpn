// (owner, 16 Oct AEDT: "captions in films are too big, they cover almost everything") pictures of the words in films:
// a story film (the words under the picture, the help pill on the picture) and How to play (its title card and
// caption), on a phone, a tablet and a computer, with the size of each text box against the picture.
// Usage: node owner-film-text-shots.mts <evidence folder>   (SV_URL picks the game; SV_LANG=en|vi)
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { launch, open, start, clear } from './harness.mts';
const root = fileURLToPath(new URL('../', import.meta.url)), out = path.join(root, 'docs/owner-repair-20261014/evidence', process.argv[2] || 'film-text-now');
fs.mkdirSync(out, { recursive: true });
const lang = process.env.SV_LANG || 'en', sizes = { phone: [390, 844, true], tablet: [820, 1180, true], computer: [1280, 800, false] };
const b = await launch(), result = {};
const measure = p => p.evaluate(() => {
  const stage = document.querySelector('.theatre .th-stage, .howto .ht-screen')?.getBoundingClientRect(), box = e => { const r = e.getBoundingClientRect(); return { w: Math.round(r.width), h: Math.round(r.height), top: Math.round(r.top), font: getComputedStyle(e).fontSize, text: e.textContent.trim().slice(0, 90) }; };
  const parts = {}; for (const s of ['.th-text', '.th-text p', '.th-more', '.film-help:not([hidden])', '.ht-titlecard', '.ht-cap', '.caption.show'])
    parts[s] = [...document.querySelectorAll(s)].filter(e => e.getClientRects().length).map(box);
  return { stage: stage && { w: Math.round(stage.width), h: Math.round(stage.height), top: Math.round(stage.top) }, viewport: [innerWidth, innerHeight], parts };
});
try {
  for (const [name, [w, h, touch]] of Object.entries(sizes)) {
    const P = await open(b, { w, h, touch, lang, play: false });
    await start(P.page); await clear(P.page);
    // a story film: the watermelon tale (the one the reports named), page 1, with the story reading itself
    await P.page.evaluate(async () => { const T = await import('/js/tales.js'), D = await import('/js/talesdata.js'); const tl = D.MORE_TALES.find(x => x.id === 'duahau') || D.MORE_TALES[0]; window.__tale = tl.id; T.openTheatre(tl, { name: 'Na' }); });
    await P.page.waitForSelector('.theatre', { timeout: 30000 }); await P.page.waitForTimeout(9000);
    await P.page.screenshot({ path: path.join(out, `${name}-${lang}-story-film.png`) }); result[`${name}-story`] = await measure(P.page);
    await P.page.keyboard.press('Escape').catch(() => { }); await P.page.evaluate(() => document.querySelector('.theatre .th-x, .theatre [aria-label="Close"], .theatre .sb-x')?.click()); await P.page.waitForTimeout(1200);
    await P.page.evaluate(() => document.querySelectorAll('.theatre').forEach(e => e.remove())); await clear(P.page);
    // How to play: the title card first, then a step with its caption
    await P.page.evaluate(async () => (await import('/js/howto.js')).openHowTo('counting', {}));
    await P.page.waitForSelector('.howto', { timeout: 20000 }); await P.page.waitForTimeout(1500);
    await P.page.screenshot({ path: path.join(out, `${name}-${lang}-howto-title.png`) }); result[`${name}-howto-title`] = await measure(P.page);
    await P.page.locator('.ht-next').first().click().catch(() => { }); await P.page.waitForTimeout(3500);
    await P.page.screenshot({ path: path.join(out, `${name}-${lang}-howto-step.png`) }); result[`${name}-howto-step`] = await measure(P.page);
    await P.ctx.close();
  }
} finally { await b.close(); fs.writeFileSync(path.join(out, `sizes-${lang}.json`), JSON.stringify(result, null, 2) + '\n'); }
console.log(JSON.stringify(result));
