import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import { fakeGitHub, routeGitHub, fakeNetlify, memoryBlobs } from './studio-check.mjs';

// Exercise real Studio saves during a failed device lookup and late Analytics response.
export async function studioRepairCheck(browser) {
  const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
  const repo = 'family/repair', password = 'repair-fixture-password-123', site = 'http://localhost:8794';
  const gh = fakeGitHub(repo, { 'content/custom.json': '{}', 'js/build.js': fs.readFileSync(path.join(root, 'js/build.js')) });
  const unroute = routeGitHub(gh), liveStore = memoryBlobs();
  const policy = { revert: 'keep', speed: 'x3', autoplay: false }, legacy = { revert: 'autoplay', speed: 'fast', autoplay: true };
  await liveStore.setJSON('live', { releases: { tester: { on: true, revert: 'keep', policies: { unseen000001: policy, unseen000002: legacy }, levels: { unseen000001: 'auto' } }, traffic: { on: false } }, festivals: {} });
  const server = await fakeNetlify({ port: 8794, players: memoryBlobs(), liveStore, env: { STUDIO_PASSWORD: password, GITHUB_TOKEN: 'fixture-token', GITHUB_REPO: repo, URL: site } });
  const ctx = await browser.newContext({ viewport: { width: 1180, height: 800 } }), pg = await ctx.newPage(), bad = [];
  let releaseHeld = () => {};
  try {
    await pg.addInitScript(() => localStorage.setItem('studioLang', 'en'));
    await pg.goto(site + '/studio'); await pg.fill('#pw', password); await pg.click('#si button'); await pg.waitForSelector('#tabs button');
    await pg.route('**/studio/api/players', r => r.fulfill({ status: 503, contentType: 'application/json', body: '{"error":"Device lookup unavailable"}' }));
    await pg.evaluate(() => { location.hash = 'game/lab'; }); await pg.waitForSelector('#save'); await pg.waitForFunction(() => !/Loading the devices/.test(document.querySelector('#tdl')?.textContent || 'Loading the devices'));
    await pg.click('#save'); await pg.waitForFunction(() => document.querySelector('#toast')?.classList.contains('good'));
    fs.mkdirSync(path.join(root, 'tests/out'), { recursive: true });
    await pg.screenshot({ path: path.join(root, 'tests/out/studio-lab-device-error.png'), fullPage: true });
    const saved = JSON.parse(liveStore._m.get('live'));
    if (JSON.stringify(saved.releases.tester?.policies?.unseen000001) !== JSON.stringify(policy) || saved.releases.tester?.levels?.unseen000001 !== 'auto') bad.push('Failed device lookup discarded an unseen device policy or level');
    if (saved.releases.tester?.revert !== 'keep') bad.push('Saving Lab discarded the existing default Keep policy');
    if (JSON.stringify(saved.releases.tester?.policies?.unseen000002) !== JSON.stringify(legacy)) bad.push('Failed device lookup changed legacy checking speed');
    if (!/could not load|unavailable/i.test(await pg.locator('#page').innerText())) bad.push('Failed device lookup was presented as an empty report');
    if (saved.releases.traffic?.on !== false) bad.push('Lab save changed unrelated traffic setting');
    await pg.unroute('**/studio/api/players');
    let requested;
    const started = new Promise(resolve => { requested = resolve; });
    const held = new Promise(resolve => { releaseHeld = resolve; });
    await pg.route('**/studio/api/players', async r => { const response = await r.fetch(); requested(); await held; await r.fulfill({ response }); });
    await pg.evaluate(() => { location.hash = 'players'; }); await started;
    await pg.evaluate(() => { location.hash = 'game/releases'; }); await pg.waitForSelector('[data-id="traffic"]');
    releaseHeld(); await pg.waitForTimeout(1200);
    if (!await pg.locator('[data-id="traffic"]').count() || await pg.locator('.tiles .tile').count()) bad.push('Late Analytics response overwrote Releases after navigation');
    fs.mkdirSync(path.join(root, 'tests/out'), { recursive: true }); await pg.screenshot({ path: path.join(root, 'tests/out/studio-repair-failures.png') });
    await pg.locator('#tabs [data-k=work]').click();await pg.waitForSelector('.desk-body .desk-queue, .desk-body .card');await pg.locator('.desk-tools > summary').click();await pg.waitForSelector('[data-desk-route=lab]');
    await pg.screenshot({ path: path.join(root, 'tests/out/studio-lab-menu.png') });
    fs.writeFileSync(path.join(root, 'tests/out/studio-repair-capture-source.json'),JSON.stringify({capturedAt:new Date().toISOString(),fixture:'Synthetic authenticated Studio with in-memory GitHub/live store; HTTP503 device lookup and held Analytics response',viewport:{width:1180,height:800},sourceFingerprints:Object.fromEntries(['studio/ui/app.js','studio/ui/style.css','studio/ui/owner-desk.js','studio/ui/owner-desk.css','studio/ui/brand.js'].filter(p=>fs.existsSync(path.join(root,p))).map(p=>[p,crypto.createHash('sha256').update(fs.readFileSync(path.join(root,p))).digest('hex')]))},null,2));
    if (bad.length) throw Error(bad.join(' | '));
    return 'Failed device lookup preserves unseen policies/levels with explicit error; late Analytics response cannot overwrite Releases; unrelated traffic retained';
  } finally { releaseHeld(); await ctx.close(); await new Promise(resolve => server.close(resolve)); unroute(); }
}
