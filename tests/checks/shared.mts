// Sparkle Valley checks: what every group of checks shares (v1.07 split-tests, 2 Nov 2026 AEDT).
// Moved here unchanged from tests/run.mts: the browser `b` (replaced when it stops answering, so it is a live
// binding: always use it as `b`, never copy it), `check`, `ok`, `open`, `clear` and the helpers several checks use.
// Importing this module builds the game (unless SV_BUILT) and starts the browser, once per run.
import {managementPolicyBudgetCheck} from '../management-policy-budget-browser.mts';
import { contentProgressCheck } from '../content-progress-browser.mts';
import { contentWebsiteCheck, contentVoiceCheck } from '../content-website-browser.mts';
import { contentArtCheck, contentPairCheck, contentCaptureCheck } from '../content-art-browser.mts';
import { installReportInputProbe, readReportInputProbe } from '../report-input-probe.mts';
import { waitObserved } from '../wait-observed.mts';
import { adventureWalkSnapshot, adventureDaySnapshot, seedAdventureWalk } from '../adventure-snapshot.mts';
import fs from 'fs';
import os from 'os';
import { launch, open, clear, noWelcome, start, URL, seedPlayers, takeCoverage, openAllGamesFixture } from '../harness.mts';
import { groundAudit } from '../world-audit.mts';
import { studioCheck } from '../studio-check.mts';
import { studioRepairCheck } from '../studio-repair-check.mts';
import { managementBrowserCheck } from '../management-browser.mts';
import { ownerDeskBrowserCheck } from '../owner-desk-browser.mts';
// (round R privacy) friends save each other's device key when they first play together (＋👫); two test devices that are
// already friends by code get each other's key here, the way that first game would have given it
// the text of an element with each swapped drawing read back as its emoji (js/emojiswap.js keeps it in data-e)
export const withEmo = `window.withEmo = el => [...el.childNodes].map(n => n.nodeType === 3 ? n.textContent : n.dataset && n.dataset.e ? n.dataset.e : window.withEmo(n)).join('');`;
export async function pairKeys(A, B) {
  const pub = P => P.page.evaluate(async () => (await import('/js/net.js')).myPub());
  const [pa, pb] = [await pub(A), await pub(B)];
  const put = (P, other) => P.page.evaluate(async other => { const S = await import('/js/state.js'); (S.settings.friends || []).forEach(f => { f.pub = other; }); S.saveSettings(); window.__sv.listenFriends && window.__sv.listenFriends(); }, other);
  await put(A, pb); await put(B, pa);
}
// (owner, 13 Oct: "smarter slow checks") with SV_SAMPLE=1 (tests/suite.mts sets it) the slowest checks try a part that
// changes every run (SV_SEED), and everything when their own files changed (SV_FULL=reading,films,… from suite.mts)
export const sampled = name => process.env.SV_SAMPLE === '1' && !(process.env.SV_FULL || '').split(',').includes(name);
export const SEED = Number(process.env.SV_SEED) || Math.floor(Date.now() / 36e5);
// (owner, 16 Oct AEDT: TypeScript, batch 0) the game's .ts files are made into the .js the browser loads before any
// check runs (tools/build.mts; suite.mts does it once for all its runs and says so with SV_BUILT)
if (!process.env.SV_BUILT) {
  const { execFileSync } = await import('child_process');
  const { fileURLToPath } = await import('url');
  const path = await import('path');
  const here = path.dirname(fileURLToPath(import.meta.url));
  execFileSync(process.execPath, [path.resolve(here, '../../tools/build.mts')], { stdio: 'inherit' });
}
export const only = process.argv.slice(2).filter(a => !a.startsWith('--'));
export const want = k => !only.length || only.includes(k);
export const results = [];
// (repair round, 15 Oct AEDT) a check that never finishes is a failure, not a stalled machine: on GitHub one check that
// hung after its browser stopped answering held its whole share for two hours, so none of the share's checks reported
export const CHECK_LIMIT = (Number(process.env.SV_CHECK_MIN) || 45) * 60000, pause = ms => new Promise(r => setTimeout(r, ms));
export const check = async (name, fn) => {
  if (!want(name)) return;
  const t0 = Date.now(); let timer;
  const limit = new Promise((_, no) => { timer = setTimeout(() => no(new Error(`did not finish within ${CHECK_LIMIT / 60000} min (stopped so the later checks still run)`)), CHECK_LIMIT); });
  try { const running = fn(); running.catch(() => { }); const note = await Promise.race([running, limit]); results.push([name, true, note || '']); console.log(`✅ ${name} (${((Date.now() - t0) / 1000).toFixed(0)}s) ${note || ''}`); }
  catch (e) {
    const detail=String(e.message||e).replace(/\s+/g,' ').trim();results.push([name,false,detail]);console.log(`❌ ${name}: ${detail}`);
    // a picture of what was on screen when it failed (out/fail-<check>.png)
    try { const pg = b.contexts().flatMap(c => c.pages()).pop(); if (pg) await pg.screenshot({ path: `out/fail-${name}.png`, timeout: 10000 }); } catch (e2) { }
  }
  // (round R) close every window the check left open, passed or failed: a failed check's window kept drawing the valley
  // and slowed every later check until they timed out
  finally {
    clearTimeout(timer);
    // a browser that no longer answers is replaced, so one stuck check cannot stop the rest
    const closed = await Promise.race([Promise.all(b.contexts().map(c => c.close().catch(() => { }))).then(() => true), pause(30000).then(() => false)]);
    if (!closed) { console.log(`   (${name}: the browser stopped answering; starting a fresh one)`); await Promise.race([b.close().catch(() => { }), pause(10000)]); b = await launch(); }
    // (owner, 13 Oct: "changed-files checks") with SV_COVER=1 each check writes which game code it ran (tests/suite.mts
    // turns that into tests/check-map.json); a check that opened no game page writes nothing and always runs
    if (process.env.SV_COVER === '1') { const cov = takeCoverage(); fs.mkdirSync('out/cover', { recursive: true }); fs.writeFileSync(`out/cover/${name}.json`, JSON.stringify(cov)); }
  }
};
export const ok = (c, msg) => { if (!c) throw new Error(msg); };
fs.mkdirSync('out', { recursive: true });
// ---- (Analytics & Infra, 11 Oct, #36) the packed copy the website serves (tools/bundle.mts), built once a run in
// out/packed (the big folders are linked, not copied), and a little server for a folder on 127.0.0.2 (the game skips its
// service worker on localhost): compressed like Netlify when asked, and able to stop answering (a dead connection) ----
export let packedDir = null;
export async function packedSite() {
  if (packedDir) return packedDir;
  const path = await import('path'), { execFileSync } = await import('child_process'), dir = path.resolve('out/packed'), repo = path.resolve('..');
  fs.rmSync(dir, { recursive: true, force: true }); fs.mkdirSync(dir, { recursive: true });
  for (const f of ['index.html', 'sw.js']) fs.copyFileSync(path.join(repo, f), path.join(dir, f));
  for (const f of ['manifest.webmanifest', 'css', 'fonts', 'icons', 'js', 'vendor', 'content', 'videos', 'voices', 'photos', 'sounds']) if (fs.existsSync(path.join(repo, f))) fs.symlinkSync(path.join(repo, f), path.join(dir, f));
  execFileSync(process.execPath, [path.join(repo, 'tools/bundle.mts'), dir], { encoding: 'utf8' });
  ok(fs.existsSync(path.join(dir, 'bundle')), 'the packed copy was not built (tools/bundle.mts: esbuild missing?)');
  return (packedDir = dir);
}
export async function serveFolder(root, { gzip = false } = {}) {
  const http = await import('http'), path = await import('path'), zlib = await import('zlib');
  const TY = { '.html': 'text/html', '.js': 'text/javascript', '.mts': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.webmanifest': 'application/manifest+json', '.png': 'image/png', '.woff2': 'font/woff2', '.mp3': 'audio/mpeg', '.mp4': 'video/mp4', '.jpg': 'image/jpeg' };
  const S = { hang: false };
  const srv = http.createServer((q, r) => {
    if (S.hang) return;
    let f = decodeURIComponent(q.url.split('?')[0]); if (f.endsWith('/')) f += 'index.html'; f = path.join(root, f);
    if (!f.startsWith(root) || !fs.existsSync(f) || !fs.statSync(f).isFile()) { r.writeHead(404); return r.end(); }
    const type = TY[path.extname(f)] || 'application/octet-stream', z = gzip && /text|javascript|json|manifest/.test(type) && /gzip/.test(q.headers['accept-encoding'] || '');
    r.writeHead(200, { 'Content-Type': type, 'Cache-Control': 'no-cache', ...(z ? { 'Content-Encoding': 'gzip' } : {}) });
    (z ? fs.createReadStream(f).pipe(zlib.createGzip()) : fs.createReadStream(f)).pipe(r);
  });
  await new Promise(res => srv.listen(0, '127.0.0.2', res));
  return Object.assign(S, { url: `http://127.0.0.2:${srv.address().port}/`, close: () => { srv.closeAllConnections(); srv.close(); } });
}
export let b = await launch();
// (owner, 12 Oct 2026 AEDT: tester reports, PRIV-016) shared by the three tester checks: a device made a tester (or not)
// by the Releases rule, the website's /api/tester pretended (what it was sent, and what it answers)
export const testerPre = (rule, extra = '') => `try { localStorage.setItem('sv2_playerid', 'tester000001'); localStorage.setItem('sv2_live', JSON.stringify({ releases: { tester: ${JSON.stringify(rule)} }, festivals: {} })); ${extra} } catch (e) { }`;
export const testerSite = async (ctx, status) => { const got = []; await ctx.route('**/api/tester**', async rt => { const q = rt.request();
  if (q.method() === 'POST') { let b = null; try { b = JSON.parse(q.postData() || 'null'); } catch (e) { } got.push(b); return rt.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ok: true, k: '0123456789abcdef', rid: 'fedcba9876543210', status: 'new' }) }); }
  return rt.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(status()) }); }); return got; };
export const ACCEPTED = `localStorage.setItem('sv2_tester', JSON.stringify({ at: 1, b: 'r1' }));`;
// Owner-approved interface contracts: end-to-end screen, privacy and composed-capture regressions.
export async function ownerSmoke(file, args = [], timeout = 600000) {
  const { execFileSync } = await import('node:child_process');
  try { return execFileSync(process.execPath, [file, ...args], { encoding:'utf8', timeout, maxBuffer:1048576 }).trim().replace(/\s+/g,' '); }
  catch (error) {
    // Preserve assertion/timeout diagnostics from the synthetic owner fixtures; the wrapper's
    // generic 'Command failed' otherwise hides the reason in shard and isolated retries.
    const detail = [error.stderr,error.stdout,error.message].filter(Boolean).join(' ').slice(-12000).replace(/\s+/g,' ').trim();
    throw new Error(`${file} (status ${error.status}, signal ${error.signal || 'none'}): ${detail}`);
  }
}

export { managementPolicyBudgetCheck, contentProgressCheck, contentWebsiteCheck, contentVoiceCheck, contentArtCheck, contentPairCheck, contentCaptureCheck, installReportInputProbe, readReportInputProbe, waitObserved, adventureWalkSnapshot, adventureDaySnapshot, seedAdventureWalk, fs, os, launch, open, clear, noWelcome, start, URL, seedPlayers, takeCoverage, openAllGamesFixture, groundAudit, studioCheck, studioRepairCheck, managementBrowserCheck, ownerDeskBrowserCheck };
