// Point 36 (owner): "Granular admin access appears selectable, but clicking it did not show the permission list. Make custom
// permissions visible/selectable for both existing and new admins; verify persistence and backend enforcement."
// Real taps on Setup → Admins, desktop and phone: Custom for a new admin shows the list, the ticked ones are saved, they
// survive a reload, and Custom for an existing admin opens its list. (The server refusing unticked permissions is the
// studio check: Analytics, content and the admin list answer 403 for a custom admin.)
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { launch } from './harness.mts';
import { fakeGitHub, routeGitHub, fakeNetlify, memoryBlobs } from './studio-check.mts';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const repo = 'family/perms', password = 'perms-fixture-password-123', site = 'http://localhost:8796';
const gh = fakeGitHub(repo, { 'content/custom.json': '{}', 'js/build.js': fs.readFileSync(path.join(root, 'js/build.js')) }), unroute = routeGitHub(gh);
const server = await fakeNetlify({ port: 8796, players: memoryBlobs(), env: { STUDIO_PASSWORD: password, GITHUB_TOKEN: 'fixture-token', GITHUB_REPO: repo, URL: site } });
const browser = await launch(), rows = [], shots = process.env.SV_SHOT;
try {
  for (const [label, viewport, touch] of [['desktop', { width: 1180, height: 800 }, false], ['phone', { width: 390, height: 844 }, true]]) {
    const ctx = await browser.newContext({ viewport, hasTouch: touch, isMobile: touch }), pg = await ctx.newPage(), errors = [], r = { view: label };
    pg.on('pageerror', e => errors.push(String(e.message).slice(0, 160)));
    await pg.addInitScript(() => localStorage.setItem('studioLang', 'en'));
    await pg.goto(site + '/studio'); await pg.fill('#pw', password); await pg.click('#si button'); await pg.waitForSelector('#tabs button');
    await pg.evaluate(() => { location.hash = 'admins'; }); await pg.waitForSelector('#ar', { timeout: 20000 }); await pg.waitForTimeout(800);
    const name = 'new.' + label, existing = 'old.' + label;
    // an existing editor to change later
    await pg.fill('#an', existing); await pg.fill('#ap', 'existing-password-123'); await pg.selectOption('#ar', 'editor'); await pg.locator('#aadd').click(); await pg.waitForSelector(`tr[data-n="${existing}"]`, { timeout: 15000 });
    // a new admin with Custom: the list must appear before adding
    await pg.fill('#an', name); await pg.fill('#ap', 'chosen-password-123'); await pg.selectOption('#ar', 'custom'); await pg.waitForTimeout(300);
    r.newList = await pg.evaluate(() => { const box = document.querySelector('.new-admin-perms'), boxes = box ? [...box.querySelectorAll('[data-perm]')] : []; return { shown: !!box && !box.hidden && box.getClientRects().length > 0, count: boxes.length, visible: boxes.filter(b => b.closest('label').getBoundingClientRect().height >= 44).length }; });
    if (shots) { fs.mkdirSync(shots, { recursive: true }); await pg.locator('#ar').scrollIntoViewIfNeeded(); await pg.screenshot({ path: path.join(shots, `${label}-new-admin-custom.png`) }); }
    for (const k of ['releases', 'analytics']) { const cb = pg.locator(`.new-admin-perms [data-perm="${k}"]`); if (await cb.count()) await cb.check(); }
    await pg.locator('#aadd').click(); await pg.waitForSelector(`tr[data-n="${name}"]`, { timeout: 15000 });
    // after a reload, the new admin's own list still shows exactly what was ticked
    await pg.reload(); await pg.waitForSelector('#tabs button'); await pg.evaluate(() => { location.hash = 'admins'; }); await pg.waitForSelector(`tr[data-pn="${name}"]`, { timeout: 20000 }); await pg.waitForTimeout(600);
    r.saved = await pg.evaluate(n => { const row = document.querySelector(`tr[data-pn="${n}"]`), role = document.querySelector(`tr[data-n="${n}"] [data-role]`)?.value; return { role, on: row ? [...row.querySelectorAll('[data-perm]:checked')].map(x => x.dataset.perm).sort() : null }; }, name);
    // an existing editor changed to Custom: its list opens, shown and tickable
    await pg.selectOption(`tr[data-n="${existing}"] [data-role]`, 'custom'); await pg.waitForTimeout(1500);
    r.existing = await pg.evaluate(n => { const row = document.querySelector(`tr[data-pn="${n}"]`), d = row?.querySelector('details'), boxes = row ? [...row.querySelectorAll('[data-perm]')] : []; return { role: document.querySelector(`tr[data-n="${n}"] [data-role]`)?.value, open: !!d?.open, shown: boxes.filter(b => b.checkVisibility && b.checkVisibility()).length, count: boxes.length }; }, existing);
    if (shots) { await pg.locator(`tr[data-pn="${existing}"]`).scrollIntoViewIfNeeded(); await pg.screenshot({ path: path.join(shots, `${label}-existing-admin-custom.png`) }); }
    r.errors = errors; rows.push(r); await ctx.close();
  }
} finally { await browser.close(); unroute(); server.close(); fs.mkdirSync('out/owner-studio-perms', { recursive: true }); fs.writeFileSync('out/owner-studio-perms/results.json', JSON.stringify(rows, null, 2) + '\n'); }
console.log(JSON.stringify(rows));
for (const r of rows.filter(r => r.view)) {
  assert.ok(r.newList.shown && r.newList.count >= 10 && r.newList.visible === r.newList.count, `${r.view}: choosing Custom for a new admin must show every permission at a 44 px target: ` + JSON.stringify(r.newList));
  assert.deepEqual(r.saved, { role: 'custom', on: ['analytics', 'releases'] }, `${r.view}: the ticked permissions must be saved and shown after a reload`);
  assert.ok(r.existing.role === 'custom' && r.existing.open && r.existing.shown === r.existing.count && r.existing.count >= 10, `${r.view}: choosing Custom for an existing admin must open its permission list: ` + JSON.stringify(r.existing));
  assert.deepEqual(r.errors, []);
}
