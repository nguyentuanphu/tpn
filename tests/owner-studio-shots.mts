// Matching Studio pictures for points 35 and 37: a page with its explanation open, and Analytics' Performance section.
// Usage (from the tests folder of the source to show): SV_SHOT=<folder> node owner-studio-shots.mts
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { launch } from './harness.mts';
import { fakeGitHub, routeGitHub, fakeNetlify, memoryBlobs } from './studio-check.mjs';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..'), out = process.env.SV_SHOT; fs.mkdirSync(out, { recursive: true });
const repo = 'family/shots', password = 'shots-fixture-password-123', site = 'http://localhost:8797';
const gh = fakeGitHub(repo, { 'content/custom.json': '{}', 'js/build.js': fs.readFileSync(path.join(root, 'js/build.js')) }), unroute = routeGitHub(gh);
const players = memoryBlobs();
// two synthetic devices checked in through the server's own hello handler (no names, synthetic ids)
{ const { hello } = await import(path.join(root, 'netlify/lib/players.mts')), now = Date.now(), day = new Date(now).toISOString().slice(0, 10);
  for (const [id, d] of [['labdevice0001', 'phone'], ['labdevice0002', 'tablet']]) await hello(players, { id, b: 'r76', l: 'en', d, os: d === 'phone' ? 'iOS' : 'Android', br: 'Safari', sc: '390x844', k: 1, days: [{ d: day, build: 'r76', m: 12, g: {} }] }, now); }
const server = await fakeNetlify({ port: 8797, players, env: { STUDIO_PASSWORD: password, GITHUB_TOKEN: 'fixture-token', GITHUB_REPO: repo, URL: site } });
const browser = await launch(), notes = [];
try {
  for (const [label, viewport, touch] of [['phone', { width: 390, height: 844 }, true], ['desktop', { width: 1180, height: 800 }, false]]) {
    const ctx = await browser.newContext({ viewport, hasTouch: touch, isMobile: touch }), pg = await ctx.newPage();
    await pg.addInitScript(() => localStorage.setItem('studioLang', 'en'));
    await pg.goto(site + '/studio'); await pg.fill('#pw', password); await pg.click('#si button'); await pg.waitForSelector('#tabs button');
    await pg.evaluate(() => { location.hash = 'album'; }); await pg.waitForTimeout(2500);
    notes.push({ label, album: await pg.evaluate(() => { const h = document.querySelector('#page .studio-help'); if (h) { h.open = true; h.scrollIntoView({ block: 'start' }); } return h ? h.textContent.trim().slice(0, 200) : null; }) });
    await pg.waitForTimeout(300); await pg.screenshot({ path: path.join(out, `${label}-album-help.png`) });
    await pg.evaluate(() => { location.hash = 'players'; }); await pg.waitForTimeout(3500);
    notes.push({ label, performance: await pg.evaluate(() => { const d = [...document.querySelectorAll('#page details')].find(x => /Performance|Hiệu năng/.test(x.querySelector('summary')?.textContent || '')); if (d) { d.open = true; d.scrollIntoView({ block: 'start' }); } return d ? d.textContent.replace(/\s+/g, ' ').trim().slice(0, 300) : null; }) });
    await pg.waitForTimeout(300); await pg.screenshot({ path: path.join(out, `${label}-analytics-performance.png`) });
    // points 33 and 38: per-device testing and auto play settings (Sparkle Lab; in R74 the tester switch on Releases)
    const lab = await pg.evaluate(async () => { location.hash = 'lab'; await new Promise(r => setTimeout(r, 3500)); if (!/Sparkle Lab|Phòng thí nghiệm/i.test(document.querySelector('#page')?.textContent || '')) { location.hash = 'releases'; await new Promise(r => setTimeout(r, 3500)); }
      const t = [...document.querySelectorAll('#page .relc, #page .card, #page details')].find(e => /tester|Tester|auto play|Auto play/.test(e.textContent)); const box = document.querySelector('#page input[type=checkbox][data-dev]'); if (box && !box.checked) box.click(); await new Promise(r => setTimeout(r, 600));
      (document.querySelector('#page [data-policy]') || document.querySelector('#page [data-devrow], #page [data-dev]') || t)?.scrollIntoView({ block: 'center' }); return { policies: document.querySelectorAll('#page [data-policy]').length, devices: document.querySelectorAll('#page [data-devrow], #page [data-dev]').length, page: location.hash, found: t ? t.textContent.replace(/\s+/g, ' ').trim().slice(0, 200) : null }; });
    notes.push({ label, lab }); await pg.waitForTimeout(400); await pg.screenshot({ path: path.join(out, `${label}-testing-policies.png`) });
    await ctx.close();
  }
} finally { await browser.close(); unroute(); server.close(); fs.writeFileSync(path.join(out, 'results.json'), JSON.stringify(notes, null, 2) + '\n'); }
console.log(JSON.stringify(notes).slice(0, 1200));
