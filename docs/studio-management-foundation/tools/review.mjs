// Review the offline documentation artifact, not the proposed management product.
// Run from the repository root: node docs/studio-management-foundation/tools/review.mjs
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
if (!process.env.PLAYWRIGHT_BROWSERS_PATH && fs.existsSync('/workspace/.cache/ms-playwright'))
  process.env.PLAYWRIGHT_BROWSERS_PATH = '/workspace/.cache/ms-playwright';
const { chromium } = await import('../../../tests/node_modules/playwright/index.mjs');
const evidence = path.join(root, 'evidence', 'current-guide'); fs.mkdirSync(evidence, { recursive: true });
const errors = [], network = [], cases = [];
const browser = await chromium.launch();
try {
  for (const width of [390, 820, 1280]) {
    const ctx = await browser.newContext({ viewport: { width, height: 900 }, hasTouch: width < 1000 });
    await ctx.route(/^https?:/, r => { network.push(r.request().url()); return r.abort(); });
    const page = await ctx.newPage();
    page.on('pageerror', e => errors.push(e.message));
    await page.goto(pathToFileURL(path.join(root, 'index.html')).href);
    await page.waitForFunction(() => [...document.images].every(i => i.complete && i.naturalWidth > 0));
    await page.screenshot({ path: path.join(evidence, `guide-${width}.png`), fullPage: true });
    const fit = async label => {
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1);
      assert.equal(overflow, false, `${width}px ${label}: horizontal overflow`);
      cases.push(`${width}px ${label}: fits viewport`);
    };
    await fit('overview');
    await page.getByRole('button',{name:'Implementation status',exact:true}).click();
    assert.equal(await page.locator('#implementation img').count(),4);
    assert.equal(await page.locator('#implementation a[href="FINANCE.md"]').count(),1);
    await fit('current implementation and finance links');
    await page.screenshot({path:path.join(evidence,`implementation-${width}.png`),fullPage:true});
    await page.getByRole('button', { name: 'Explore data', exact: true }).click();
    assert.match(await page.locator('#count').innerText(), /137 of 137/);
    await page.getByLabel('Search data points').fill('battery');
    assert.ok(await page.locator('#rows article').count() > 0, 'Battery search has results');
    await page.getByLabel('Search data points').fill('');
    await page.getByLabel('Filter status').selectOption('proposed');
    await page.getByLabel('Filter domain').selectOption('finance');
    assert.equal(await page.locator('#rows article').count(), 8);
    await page.locator('#rows summary').first().click();
    assert.ok(await page.locator('#rows details[open]').count() === 1);
    await fit('filtered data and expanded lineage');
    if (width === 1280) await page.screenshot({ path: path.join(evidence, 'data-explorer.png'), fullPage: true });
    await page.getByLabel('Search data points').fill('no-match-xyz-123');
    assert.match(await page.locator('#rows').innerText(), /No matching data points/);
    await page.getByRole('button', { name: 'Understand numbers', exact: true }).click();
    await page.getByLabel('Search metric definitions').fill('Play clicks');
    assert.equal(await page.locator('#metric-rows article').count(), 1);
    assert.match(await page.locator('#metric-rows').innerText(), /successful game start/);
    await fit('metric definition');
    await page.reload();
    assert.equal(await page.locator('#metrics').isVisible(), true, 'Section hash survives reload');
    await page.getByRole('button', { name: 'Build in order', exact: true }).click(); await fit('build instructions');
    await page.getByRole('button', { name: 'Visual maps', exact: true }).click();
    assert.equal(await page.locator('#visuals img').count(), 7); await fit('visual maps');
    cases.push(`${width}px: search, combined filters, lineage expansion, empty state, metric meaning and section reload passed`);
    await ctx.close();
  }
  const page = await browser.newPage({ viewport: { width: 1200, height: 780 } });
  await page.goto(pathToFileURL(path.join(root, 'images/01-system.svg')).href);
  await page.screenshot({ path: path.join(root, 'images/01-system.png') });
  await page.goto(pathToFileURL(path.join(root, 'images/07-home-wireframe.svg')).href);
  await page.setViewportSize({ width: 1200, height: 820 });
  await page.screenshot({ path: path.join(evidence, 'home-wireframe.png') });
  await page.goto(pathToFileURL(path.join(root, 'current/finance-flow.svg')).href);
  await page.setViewportSize({width:1200,height:750});
  await page.screenshot({path:path.join(root,'current/finance-flow.png')});
  await page.close();
  assert.deepEqual(errors, [], 'No uncaught browser errors');
  assert.deepEqual(network, [], 'Offline artifact makes no HTTP requests');
  fs.writeFileSync(path.join(evidence, 'browser-review.json'), JSON.stringify({
    scope: 'Offline historical register and current implementation/finance guide; runtime evidence is separate',
    date: new Date().toLocaleDateString('en-CA',{timeZone:'Australia/Sydney'})+' Australia/Sydney', browser: await browser.version(),
    viewports: [390, 820, 1280], cases, errors, httpRequests: network.length,
    passed: true
  }, null, 2) + '\n');
  console.log(`PASS: ${cases.length} browser cases; three viewports; no uncaught errors or HTTP requests.`);
} finally { await browser.close(); }
