// Capture real rendered Studio map previews and the mobile bot settings, without live credentials.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { launch } from './harness.mts';
import { fakeGitHub, routeGitHub, fakeNetlify, memoryBlobs } from './studio-check.mts';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const output = path.join(root, 'evidence', 'studio');
fs.mkdirSync(output, { recursive: true });
const repo = 'family/house-evidence', password = 'house-evidence-password-123', site = 'http://localhost:8797';
const gh = fakeGitHub(repo, { 'content/custom.json': '{}', 'js/build.js': fs.readFileSync(path.join(root, 'js/build.js')) });
const unroute = routeGitHub(gh);
const server = await fakeNetlify({ port: 8797, players: memoryBlobs(), env: { STUDIO_PASSWORD: password, GITHUB_TOKEN: 'fixture-token', GITHUB_REPO: repo, URL: site } });
const browser = await launch();
const captures: string[] = [];
try {
  for (const lang of ['en', 'vi']) {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
    const page = await context.newPage();
    const failures: string[] = [];
    page.on('pageerror', e => failures.push(e.message));
    await page.addInitScript(lang => localStorage.setItem('studioLang', lang), lang);
    await page.goto(site + '/studio');
    await page.fill('#pw', password);
    await page.click('#si button');
    await page.waitForSelector('#tabs button');
    await page.evaluate(() => { location.hash = 'map'; });
    await page.waitForSelector('[data-mode="build"]', { timeout: 45000 });
    await page.click('[data-mode="build"]');
    await page.waitForSelector('[data-house-culture="vietnam"]');
    for (const [culture, type] of [['vietnam', 'tube'], ['australia', 'cottage']]) {
      await page.click(`[data-house-culture="${culture}"]`);
      await page.click(`[data-house-type="${type}"]`);
      await page.waitForFunction(() => !!document.querySelector<HTMLImageElement>('[data-house-preview] img')?.naturalWidth);
      assert.ok(await page.locator('[data-house-preview] img').count(), `${culture} 3D preview must render`);
      const filename = `${lang}-mobile-${culture}-house.png`;
      await page.locator('#npcform').screenshot({ path: path.join(output, filename) });
      captures.push(filename);
    }
    await page.evaluate(() => { location.hash = 'lab'; });
    await page.waitForSelector('#bot-duration');
    const filename = `${lang}-mobile-bot-settings.png`;
    await page.locator('.bot-config').screenshot({ path: path.join(output, filename) });
    captures.push(filename);
    assert.deepEqual(failures, []);
    await context.close();
  }
} finally { await browser.close(); unroute(); server.close(); }
console.log('Captured: ' + captures.join(', '));
