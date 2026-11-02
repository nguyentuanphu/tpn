// Matching festival-day pictures on a real Tết build: the same fixed inspection camera per place and layout, on the pinned
// R74 baseline and the repair candidate. Usage: SV_URL=<served source> SV_EVIDENCE_COMMIT=<its commit> node owner-festival-evidence.mts <folder>
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { launch, open, start, clear, URL as gameURL } from './harness.mts';
import { fileURLToPath } from 'node:url';
const repoRoot = fileURLToPath(new URL('../', import.meta.url)), phase = process.argv[2];
if (!phase) throw Error('Name the evidence folder');
const sourceCommit = execFileSync('git', ['-C', repoRoot, 'rev-parse', '--verify', process.env.SV_EVIDENCE_COMMIT || 'HEAD'], { encoding: 'utf8' }).trim();
const servedFiles = execFileSync('git', ['-C', repoRoot, 'ls-tree', '-r', '--name-only', sourceCommit, '--', 'js', 'css', 'index.html', 'sw.js'], { encoding: 'utf8' }).trim().split('\n').filter(Boolean), fingerprints = {};
if (!servedFiles.length) throw Error('No source files found for evidence attribution');
for (const file of servedFiles) {
  const expected = execFileSync('git', ['-C', repoRoot, 'show', `${sourceCommit}:${file}`], { maxBuffer: 8 << 20 }), r = await fetch(new URL(file, gameURL));
  if (!r.ok) throw Error(`Evidence source unavailable: ${file}`); const actual = Buffer.from(await r.arrayBuffer());
  if (!actual.equals(expected)) throw Error(`Served source differs from ${sourceCommit}: ${file}`); fingerprints[file] = createHash('sha256').update(actual).digest('hex');
}
const dir = path.join(repoRoot, 'docs/owner-repair-20261014/evidence', phase); fs.mkdirSync(dir, { recursive: true });
const browser = await launch(), results = [];
try {
  for (const [device, w, h, touch] of [['phone', 390, 844, true], ['tablet', 820, 1180, true], ['computer', 1280, 800, false]]) {
    const P = await open(browser, { w, h, touch, lang: 'en', play: false, fast: false, route: async ctx => { await ctx.route('**/content/custom.json*', rt => rt.fulfill({ contentType: 'application/json', body: '{}' })); await ctx.route('**/api/**', rt => rt.fulfill({ status: 204 })); } });
    await start(P.page); await clear(P.page);
    await P.page.evaluate(async () => { const G = __sv, C = (await import('/js/custom.js')).CUSTOM, wait = ms => new Promise(r => setTimeout(r, ms)), d = new Date(), ymd = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      for (let k = 0; k < 40 && !G.festivals.count('village', 'tet', 4); k++) { G.festivals.rebuild(); await wait(300); }
      C.festivals = {}; C.releases = { ...(C.releases || {}), fest_tet: { on: true, start: ymd, days: 1 } }; G.festivals.rebuild(); await wait(800); });
    for (const id of ['village', 'china', 'hoian']) {
      const state = await P.page.evaluate(async id => { const G = __sv, h = G.heroes[0], W = await import('/js/world.js'), S = (await import('/js/state.js')).settings, p = { village: W.VILLAGE, china: W.CHINA, hoian: W.HOIAN }[id];
        S.camMode = 'free'; G.paused = false; G.world.time = .4; h.goal = null; h.speed = 0; h.view = 'follow'; h.zoom = 1; G.zoom = 1; h.camYaw = -2.2; h.camPitch = .85; h.camDist = innerWidth < 500 ? 46 : 36; h.manualCamT = 1e6; h.place(p.x, p.z);
        return { id, place: { x: p.x, z: p.z, r: p.r }, active: G.festivals.active().map(a => a.F.id) }; }, id);
      await P.page.waitForTimeout(2500); await clear(P.page); await P.page.waitForTimeout(1200);
      state.frame = await P.page.evaluate(() => { const G = __sv, h = G.heroes[0]; G.paused = true; return { hero: { x: h.pos.x, z: h.pos.z }, camera: { x: h.cam.position.x, y: h.cam.position.y, z: h.cam.position.z }, patches: G.festivals.places3().filter(b => b.visible).length }; });
      await P.page.evaluate(() => document.fonts.ready); await P.page.waitForTimeout(400);
      const file = `${device}-tet-${id}.png`; await P.page.screenshot({ path: path.join(dir, file) });
      await P.page.evaluate(() => { __sv.paused = false; });
      results.push({ device, viewport: [w, h], file, ...state });
    }
    results.push({ device, errors: P.errors }); await P.ctx.close();
  }
} finally { await browser.close(); fs.writeFileSync(path.join(dir, 'festival-results.json'), JSON.stringify({ sourceCommit, servedAt: gameURL, capturedAt: new Date().toISOString(), fingerprintCount: Object.keys(fingerprints).length, fingerprints, results }, null, 2) + '\n'); }
console.log(JSON.stringify(results.map(r => r.file || r.errors)));
