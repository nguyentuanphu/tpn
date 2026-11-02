// Point 34 (owner): "Releases and ALL other Studio categories should be collapsible... check actual DOM/CSS/content
// visibility, persistence and touch operation, not only one page." Every Studio tab, desktop and phone: headings outside
// a fold, folds whose content stays visible when closed, and a closed fold coming back closed after a reload.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { launch } from './harness.mts';
import { fakeGitHub, routeGitHub, fakeNetlify, memoryBlobs } from './studio-check.mts';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const repo = 'family/folds', password = 'folds-fixture-password-123', site = 'http://localhost:8795';
const gh = fakeGitHub(repo, { 'content/custom.json': '{}', 'js/build.js': fs.readFileSync(path.join(root, 'js/build.js')) }), unroute = routeGitHub(gh);
const server = await fakeNetlify({ port: 8795, players: memoryBlobs(), env: { STUDIO_PASSWORD: password, GITHUB_TOKEN: 'fixture-token', GITHUB_REPO: repo, URL: site } });
const app = fs.readFileSync(path.join(root, 'studio/ui/app.js'), 'utf8'), about = app.slice(app.indexOf('const ABOUT'), app.indexOf('};', app.indexOf('const ABOUT')));
const PAGES = [...about.matchAll(/^  ([a-z]+): \[/gm)].map(m => m[1]);
if (PAGES.length < 15) throw Error('Studio page list not found: ' + PAGES.join());
const browser = await launch(), rows = [];
try {
  for (const [label, viewport, touch] of [['desktop', { width: 1180, height: 800 }, false], ['phone', { width: 390, height: 844 }, true]]) {
    const ctx = await browser.newContext({ viewport, hasTouch: touch, isMobile: touch }), pg = await ctx.newPage(), errors = [];
    pg.on('pageerror', e => errors.push(String(e.message).slice(0, 160)));
    await pg.addInitScript(() => localStorage.setItem('studioLang', 'en'));
    await pg.goto(site + '/studio'); await pg.fill('#pw', password); await pg.click('#si button'); await pg.waitForSelector('#tabs button');
    const tabs = PAGES;
    for (let i = 0; i < tabs.length; i++) {
      await pg.evaluate(k => { location.hash = k; }, tabs[i]); await pg.waitForTimeout(400);
      const finished = await pg.waitForFunction(() => !!document.querySelector('#page .studio-help') || !!document.querySelector('#page .badtxt'), null, { timeout: 20000 }).then(() => true, () => false); await pg.waitForTimeout(500);
      const r = await pg.evaluate(() => {
        const P = document.querySelector('#page'), vis = e => e.getClientRects().length > 0 && getComputedStyle(e).visibility !== 'hidden';
        const heads = [...P.querySelectorAll('h3, h4')].filter(h => vis(h) && !h.closest('summary') && !h.closest('dialog, .modal'));
        const loose = heads.filter(h => !h.closest('details')).map(h => h.textContent.trim().slice(0, 50));
        const folds = [...P.querySelectorAll('details')].filter(vis);
        // (point 35) each page explains itself: who it affects, the default and when a change applies, not a bare tagline
        const help = (P.querySelector('.studio-help p')?.textContent || '').trim();
        return { title: document.querySelector('#tabs button.on, #tabs button[aria-current]')?.textContent.trim().slice(0, 30) || '', heads: heads.length, loose, folds: folds.length, help: help.length };
      });
      // close every open fold by tapping its summary: its content must really disappear; tap again: it comes back
      const toggled = await pg.evaluate(async () => { const P = document.querySelector('#page'), out = { ok: 0, stuck: [] };
        for (const d of [...P.querySelectorAll('details')].filter(d => d.getClientRects().length && d.open && !d.closest('details:not([open])'))) {
          const body = [...d.children].find(c => c.tagName !== 'SUMMARY'); if (!body) continue;
          d.querySelector(':scope > summary').click(); await new Promise(r => setTimeout(r, 150));
          // what the browser actually draws (a closed section's content may keep its layout boxes while not drawn)
          const shown = e => e.checkVisibility({ contentVisibilityAuto: true, visibilityProperty: true }) && e.getClientRects().length > 0;
          const hidden = !shown(body); d.querySelector(':scope > summary').click(); await new Promise(r => setTimeout(r, 150));
          if (hidden && shown(body)) out.ok++; else out.stuck.push((d.querySelector(':scope > summary')?.textContent || '').trim().slice(0, 40)); }
        return out; });
      rows.push({ view: label, tab: tabs[i], finished, ...r, toggled });
    }
    // persistence: close the first fold of the Releases tab, reload, it is still closed
    const rel = tabs.indexOf('releases'); if (rel >= 0) {
      await pg.evaluate(() => { location.hash = 'releases'; }); await pg.waitForTimeout(1800);
      const shotDir = process.env.SV_SHOT; if (shotDir) { fs.mkdirSync(shotDir, { recursive: true }); await pg.evaluate(() => { const d = [...document.querySelectorAll('#page details')].find(d => d.open && d.getClientRects().length && !d.matches('.studio-help')); d?.scrollIntoView({ block: 'start' }); window.scrollBy(0, -80); }); await pg.waitForTimeout(300); await pg.screenshot({ path: path.join(shotDir, `${label}-releases-open.png`) }); }
      const name = await pg.evaluate(() => { const d = [...document.querySelectorAll('#page details')].find(d => d.open && d.getClientRects().length && !d.matches('.studio-help')); if (!d) return null; d.querySelector(':scope > summary').click(); return d.querySelector(':scope > summary').textContent.trim().slice(0, 40); });
      if (shotDir) { await pg.waitForTimeout(400); await pg.screenshot({ path: path.join(shotDir, `${label}-releases-first-group-tapped-closed.png`) }); }
      await pg.reload(); await pg.waitForSelector('#tabs button'); await pg.evaluate(() => { location.hash = 'releases'; }); await pg.waitForTimeout(1800);
      const still = await pg.evaluate(name => { const d = [...document.querySelectorAll('#page details')].find(d => d.querySelector(':scope > summary')?.textContent.trim().slice(0, 40) === name); return d ? !d.open : null; }, name);
      rows.push({ view: label, persistence: { fold: name, closedAfterReload: still } });
    }
    rows.push({ view: label, errors }); await ctx.close();
  }
} finally { await browser.close(); unroute(); server.close(); fs.mkdirSync('out/owner-studio-folds', { recursive: true }); fs.writeFileSync('out/owner-studio-folds/results.json', JSON.stringify(rows, null, 2) + '\n'); }
const thin = rows.filter(r => r.tab && r.help < 80), loose = rows.filter(r => r.loose?.length), stuck = rows.filter(r => r.toggled?.stuck.length), keep = rows.filter(r => r.persistence && r.persistence.closedAfterReload !== true), errs = rows.filter(r => r.errors?.length);
console.log(JSON.stringify({ thin: thin.map(r => [r.view, r.tab, r.help]), tabs: rows.filter(r => r.tab).length, folds: rows.reduce((a, r) => a + (r.folds || 0), 0), toggledOk: rows.reduce((a, r) => a + (r.toggled?.ok || 0), 0), loose: loose.map(r => [r.view, r.tab, r.loose]), stuck: stuck.map(r => [r.view, r.tab, r.toggled.stuck]), keep: keep.map(r => r.persistence), errs: errs.map(r => r.errors) }));
assert.equal(thin.length + loose.length + stuck.length + keep.length + errs.length, 0, 'Every Studio heading must be in a fold that really closes and stays closed');
