// Pictures for r81 (owner, 17 Oct AEDT: the content pages go live without Publish): Studio's Message, Defaults, Ads and
// Music pages on a phone, a tablet and a computer, the Message page in Vietnamese too, each scrolled to its top.
// Usage (from the tests folder of the source to show): SV_SHOT=<folder> node owner-studio-live-shots.mts
// (SV_SRC=<another checkout> takes the pages from there, for the "before" pictures)
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const here = path.dirname(fileURLToPath(import.meta.url)), src = process.env.SV_SRC || path.resolve(here, '..'), out = process.env.SV_SHOT; fs.mkdirSync(out, { recursive: true });
const { launch } = await import(path.join(src, 'tests/harness.mts')), { fakeGitHub, routeGitHub, fakeNetlify, memoryBlobs } = await import(path.join(src, 'tests/studio-check.mts'));
const repo = 'family/shots', password = 'shots-fixture-password-123', site = 'http://localhost:8798';
const content = { message: { en: 'Dinner is at six tonight', vi: 'Tối nay sáu giờ ăn cơm nhé' }, defaults: { restMins: 30 }, features: { traffic: true } };
const gh = fakeGitHub(repo, { 'content/custom.json': JSON.stringify(content), 'js/build.js': fs.readFileSync(path.join(src, 'js/build.js')) }), unroute = routeGitHub(gh);
const server = await fakeNetlify({ port: 8798, players: memoryBlobs(), env: { STUDIO_PASSWORD: password, GITHUB_TOKEN: 'fixture-token', GITHUB_REPO: repo, URL: site } });
const browser = await launch(), notes = [];
try {
  for (const [label, viewport, touch, lang, pages] of [['phone', { width: 390, height: 844 }, true, 'en', ['message', 'play', 'ads', 'music']], ['tablet', { width: 820, height: 1180 }, true, 'en', ['message', 'play', 'ads', 'music']],
    ['computer', { width: 1280, height: 800 }, false, 'en', ['message', 'play', 'ads', 'music']], ['phone-vi', { width: 390, height: 844 }, true, 'vi', ['message']]]) {
    const ctx = await browser.newContext({ viewport, hasTouch: touch, isMobile: touch }), pg = await ctx.newPage();
    await pg.addInitScript(l => localStorage.setItem('studioLang', l), lang);
    await pg.goto(site + '/studio'); await pg.fill('#pw', password); await pg.click('#si button'); await pg.waitForSelector('#tabs button');
    for (const page of pages) {
      await pg.evaluate(p => { location.hash = p; }, page); await pg.waitForTimeout(2200); await pg.evaluate(() => window.scrollTo(0, 0)); await pg.waitForTimeout(200);
      notes.push({ label, page, note: await pg.evaluate(() => ((document.querySelector('#page .livebadge') || {}).textContent || '').trim()) });
      await pg.screenshot({ path: path.join(out, `${label}-${page}.png`) });
    }
    await ctx.close();
  }
} finally { await browser.close(); unroute(); server.close(); fs.writeFileSync(path.join(out, 'results.json'), JSON.stringify(notes, null, 2) + '\n'); }
console.log(JSON.stringify(notes));
