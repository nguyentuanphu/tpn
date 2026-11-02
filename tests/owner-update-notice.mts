// (owner point 10, WO-05) a new version shows a small notice; progress is protected; no reload during an activity; a
// second tab of the same game is checked through the version change. The service worker only runs away from localhost,
// so this serves a copy of the game as http://127.0.0.2:<port>/ (another loopback address: a secure context, not localhost).
// Usage: node owner-update-notice.mts [evidence folder]   (with a folder, phone pictures of each step are saved there)
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import http from 'node:http';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
const repoRoot = fileURLToPath(new URL('../', import.meta.url)), port = 8790 + Math.floor(Math.random() * 100), origin = `http://127.0.0.2:${port}`;
import { chromium } from 'playwright';
import { open, start, clear } from './harness.mts';
const launch = () => chromium.launch({ executablePath: process.env.CHROMIUM || undefined, args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
const shots = process.argv[2] ? path.join(repoRoot, 'docs/owner-repair-20261014/evidence', process.argv[2]) : null; if (shots) fs.mkdirSync(shots, { recursive: true });
// a copy of the working tree's game files (voices left out: the service worker does not keep them)
const copy = fs.mkdtempSync(path.join(os.tmpdir(), 'sv-update-'));
for (const f of execFileSync('git', ['-C', repoRoot, 'ls-files', '-co', '--exclude-standard'], { encoding: 'utf8', maxBuffer: 64 << 20 }).split('\n'))
  if (f && !/^(voices|docs|tests|tools|studio|marketing|netlify)\//.test(f) && fs.existsSync(path.join(repoRoot, f)) && fs.statSync(path.join(repoRoot, f)).isFile()) { fs.mkdirSync(path.dirname(path.join(copy, f)), { recursive: true }); fs.copyFileSync(path.join(repoRoot, f), path.join(copy, f)); }
// (r82, TypeScript) the .js made from each .ts is never committed, so the copy is built as the website builds it
execFileSync(process.execPath, [path.join(repoRoot, 'tools/build.mts'), copy], { stdio: 'ignore' });
const types = { '.js': 'text/javascript', '.mts': 'text/javascript', '.css': 'text/css', '.html': 'text/html', '.json': 'application/json', '.webmanifest': 'application/manifest+json', '.woff2': 'font/woff2', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.mp3': 'audio/mpeg', '.mp4': 'video/mp4', '.svg': 'image/svg+xml' };
const server = http.createServer((req, res) => {
  try {
    const pathname = decodeURIComponent(new URL(req.url, origin).pathname);
    let f = pathname.endsWith('/') ? pathname + 'index.html' : pathname;
    f = path.resolve(copy, '.' + f);
    if (!f.startsWith(path.resolve(copy) + path.sep) && f !== path.resolve(copy)) { res.writeHead(403); return res.end(); }
    if (!fs.existsSync(f) || !fs.statSync(f).isFile()) { res.writeHead(404); return res.end(); }
    res.writeHead(200, { 'Content-Type': types[path.extname(f)] || 'application/octet-stream', 'Cache-Control': 'no-cache' });
    fs.createReadStream(f).pipe(res);
  } catch (e) { res.writeHead(500); res.end(); }
});
await new Promise((resolve, reject) => { server.once('error', reject); server.listen(port, '127.0.0.2', resolve); });
const fail = m => { throw Error(m); }, result = {};
const browser = await launch();
try {
  const response = await fetch(`${origin}/sw.js`);
  if (!response.ok) fail(`static server not ready at ${origin}: ${response.status}`);
  const A = await open(browser, { w: 390, h: 844, touch: true, url: origin + '/', play: false });
  const ready = p => p.waitForFunction(() => !!navigator.serviceWorker.controller, null, { timeout: 120000 });
  // the first visit installs the worker; reload once so it controls the page, then play
  await A.page.waitForFunction(async () => !!(await navigator.serviceWorker.getRegistration())?.active, null, { timeout: 120000 });
  await A.page.reload(); await ready(A.page); await start(A.page); await clear(A.page);
  const keep = () => { const out = {}; for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); if (/^sv2_(profiles|farm)$/.test(k)) out[k] = localStorage.getItem(k); } return out; };
  // nothing the children did is lost: games played (and which), orbs, stickers and album pictures only ever grow (the
  // farm itself keeps living, so its animals, hay and timers change by themselves)
  const lostBetween = (before, after) => { const a = JSON.parse(before.sv2_profiles || '[]'), z = JSON.parse(after.sv2_profiles || '[]'), out = [];
    for (const p of a) { const q = z.find(x => x.id === p.id); if (!q) { out.push(p.id + ' missing'); continue; }
      const n = x => ({ games: x.stats?.games || 0, orbs: x.orbs || 0, stickers: (x.stickers || []).length, album: (x.album || []).length, ...Object.fromEntries(Object.entries(x.stats?.played || {}).map(([k, v]) => ['played.' + k, v])) });
      const P = n(p), Q = n(q); for (const k of Object.keys(P)) if (!((Q[k] ?? 0) >= P[k])) out.push(`${p.id}.${k}: ${P[k]} -> ${Q[k]}`); }
    return out; };
  const held = p => p.evaluate(() => { const h = document.querySelector('.tab-held'); return !!h && h.getClientRects().length > 0 ? h.textContent : ''; });
  const playOneGame = async p => { await p.evaluate(() => __sv.openGamesHub(0)); await p.waitForSelector('.hplay', { timeout: 20000 }); await p.locator('.hplay').first().click(); await p.waitForSelector('.gl:not(.out)', { timeout: 30000 }); await p.waitForTimeout(1200); };
  const closeGame = async p => { await p.locator('.gl-x').first().click({ timeout: 20000 }); await p.waitForSelector('.gl', { state: 'detached', timeout: 20000 }).catch(() => { }); await clear(p); await p.waitForTimeout(1200); };
  // a second tab of the same game takes over: the first one stops saving (its older copy wrote over the new tab's
  // progress) and asks to play here instead
  const B = { page: await A.ctx.newPage(), errors: [] }; B.page.on('pageerror', e => B.errors.push(e.message));
  await B.page.goto(origin + '/'); await ready(B.page); await start(B.page); await clear(B.page);
  result.firstTabHeld = await held(A.page); if (!/another tab/i.test(result.firstTabHeld)) fail('the first tab kept playing beside the second');
  if (shots) await A.page.screenshot({ path: path.join(shots, 'phone-en-older-tab-steps-back.png') });
  await playOneGame(B.page); await closeGame(B.page); await B.page.evaluate(() => __sv.save?.()); const bSaved = await B.page.evaluate(keep);
  await A.page.evaluate(() => { dispatchEvent(new Event('pagehide')); }); await A.page.waitForTimeout(3500);
  result.heldTabWroteNothing = lostBetween(bSaved, await B.page.evaluate(keep)); if (result.heldTabWroteNothing.length) fail('the stepped-back tab wrote over the new one: ' + result.heldTabWroteNothing.join(' ; '));
  // play in the first tab again: it reloads with the newest save, and the second tab steps back
  await Promise.all([A.page.waitForEvent('load', { timeout: 120000 }), A.page.locator('.tab-held button').click()]); await ready(A.page); await start(A.page); await clear(A.page);
  result.secondTabHeld = !!(await held(B.page)); if (!result.secondTabHeld) fail('the second tab did not step back');
  result.keptAfterSwitch = lostBetween(bSaved, await A.page.evaluate(keep)); if (result.keptAfterSwitch.length) fail('progress lost switching tabs: ' + result.keptAfterSwitch.join(' ; '));
  await A.page.evaluate(() => { window.__notReloaded = 1; }); await B.page.evaluate(() => { window.__notReloaded = 1; });
  // publish a new version
  const swFile = path.join(copy, 'sw.js'), oldVersion = /const VERSION = '([^']+)'/.exec(fs.readFileSync(swFile, 'utf8'))[1], newVersion = oldVersion + '-next';
  fs.writeFileSync(swFile, fs.readFileSync(swFile, 'utf8').replace(oldVersion, newVersion));
  await A.page.evaluate(async () => (await navigator.serviceWorker.getRegistration()).update());
  await A.page.waitForSelector('.update-notice', { timeout: 120000 }); await A.page.waitForTimeout(600);
  result.notice = await A.page.evaluate(() => { const n = document.querySelector('.update-notice'), r = n.getBoundingClientRect(), hud = document.querySelector('.hud .hud-tl, .hud .pcard, .hud .pav')?.getBoundingClientRect(); return { text: n.textContent, h: Math.round(r.height), w: Math.round(r.width), top: Math.round(r.top), coversHud: !!hud && r.top < hud.bottom && r.bottom > hud.top && r.left < hud.right && r.right > hud.left, buttons: [...n.querySelectorAll('button')].map(b => Math.round(Math.min(b.getBoundingClientRect().height, b.getBoundingClientRect().width))) }; });
  if (shots) await A.page.screenshot({ path: path.join(shots, 'phone-en-update-notice.png') });
  { const n = result.notice; if (!/update/i.test(n.text) || !/progress stays saved/i.test(n.text)) fail('notice words: ' + n.text); if (n.h > 100) fail('notice too big: ' + n.h); if (n.coversHud) fail('notice covers the HUD'); if (n.buttons.some(h => h < 44)) fail('notice buttons under 44 px: ' + n.buttons); }
  // during an activity the notice steps aside (it covered the game's close button) and nothing reloads
  await playOneGame(A.page);
  result.duringActivity = await A.page.evaluate(() => { const n = document.querySelector('.update-notice'); return { stayed: window.__notReloaded === 1, shown: !!n && n.getClientRects().length > 0 }; });
  if (shots) await A.page.screenshot({ path: path.join(shots, 'phone-en-update-waits-for-activity.png') });
  if (!result.duringActivity.stayed || result.duringActivity.shown) fail('notice over an activity, or reloaded: ' + JSON.stringify(result.duringActivity));
  await closeGame(A.page);
  result.backInValley = await A.page.evaluate(() => { const n = document.querySelector('.update-notice'); return !!n && n.getClientRects().length > 0; });
  if (!result.backInValley) fail('notice did not come back after the activity');
  // update now: the page saves, reloads into the new version, and every child's saved progress is kept
  await A.page.evaluate(() => __sv.save?.()); const before = await A.page.evaluate(keep);
  await Promise.all([A.page.waitForEvent('load', { timeout: 120000 }), A.page.locator('.update-notice button').first().click()]);
  await A.page.waitForSelector('.screen.title', { timeout: 90000 }); await A.page.waitForTimeout(3500);
  result.afterA = await A.page.evaluate(async () => ({ reloaded: window.__notReloaded !== 1, caches: await caches.keys() }));
  if (!result.afterA.reloaded || !result.afterA.caches.includes(newVersion)) fail('tab A did not move to the new version: ' + JSON.stringify(result.afterA.caches));
  result.lostInUpdate = lostBetween(before, await A.page.evaluate(keep)); result.savedKeys = Object.keys(before);
  if (!result.savedKeys.length || result.lostInUpdate.length) fail('saved progress lost across the update: ' + result.lostInUpdate.join(' ; '));
  // the stepped-back tab runs old pages under the new worker: its lazy modules still load, and playing there reloads
  // it into the new version
  result.otherTab = await B.page.evaluate(async () => { let lazy = 'ok'; try { await import('/js/credits.js'); } catch (e) { lazy = String(e.message || e); } return { held: !!document.querySelector('.tab-held'), lazy, stayed: window.__notReloaded === 1 }; });
  if (!result.otherTab.held || result.otherTab.lazy !== 'ok' || !result.otherTab.stayed) fail('second tab: ' + JSON.stringify(result.otherTab));
  await Promise.all([B.page.waitForEvent('load', { timeout: 120000 }), B.page.locator('.tab-held button').click()]);
  await B.page.waitForSelector('.screen.title', { timeout: 90000 });
  result.afterB = await B.page.evaluate(async () => ({ reloaded: window.__notReloaded !== 1, caches: await caches.keys(), controller: navigator.serviceWorker.controller?.state }));
  if (!result.afterB.reloaded || !result.afterB.caches.includes(newVersion)) fail('tab B: ' + JSON.stringify(result.afterB));
  result.firstTabHeldAgain = !!(await held(A.page)); if (!result.firstTabHeldAgain) fail('tab A kept playing after tab B took over');
  // (point 11, #140 #141 #184-#193) a part that loads later is gone (r73 pages lost their files when r74 took over):
  // whether the code catches the failure itself (a story's film) or not, the page offers the update
  result.moduleGone = await B.page.evaluate(async () => {
    const n = () => { const x = document.querySelector('.update-notice'); return !!x && x.getClientRects().length > 0; }, out = { before: n() };
    const err = await import('/js/gone-' + Date.now() + '.js').then(() => null, e => e);
    out.caught = !!err && window.svModuleGone(err) && n(); document.querySelector('.update-notice')?.remove();
    dispatchEvent(new PromiseRejectionEvent('unhandledrejection', { promise: Promise.resolve(), reason: err })); out.uncaught = n();
    out.message = String(err?.message || err); return out; });
  { const g = result.moduleGone; if (g.before || !g.caught || !g.uncaught) fail('a gone module did not offer the update: ' + JSON.stringify(g)); }
  if (shots) await B.page.screenshot({ path: path.join(shots, 'phone-en-update-after-missing-part.png') });
  const errors = [...A.errors, ...B.errors].filter(e => !/peerjs|WebSocket/i.test(e)); if (errors.length) fail('errors: ' + errors.join(' | '));
  result.versions = [oldVersion, newVersion];
} finally {
  await browser.close(); server.closeAllConnections(); await new Promise(resolve => server.close(resolve)); fs.rmSync(copy, { recursive: true, force: true });
  if (shots) fs.writeFileSync(path.join(shots, 'update-notice-results.json'), JSON.stringify({ sourceCommit: execFileSync('git', ['-C', repoRoot, 'rev-parse', 'HEAD'], { encoding: 'utf8' }).trim(), capturedAt: new Date().toISOString(), result }, null, 2) + '\n');
}
console.log(JSON.stringify(result));
