// Matching pictures for points 7 (closing a game opened from Play returns to Play), 22/23 (the view tray opens up, no
// compass unless Studio switches it on), 39-44 (Grown-ups: family photos and devices) and 50 (tapping the hearts).
// Phone EN and computer. SV_ONLY=hearts captures point 50 alone.
// Usage: SV_URL=<served source> SV_EVIDENCE_COMMIT=<commit> node owner-point-shots.mts <evidence folder>
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { launch, open, start, clear, URL as gameURL } from './harness.mts';
import { fileURLToPath } from 'node:url';
const repoRoot = fileURLToPath(new URL('../', import.meta.url)), phase = process.argv[2]; if (!phase) throw Error('Name the evidence folder');
const sourceCommit = execFileSync('git', ['-C', repoRoot, 'rev-parse', '--verify', process.env.SV_EVIDENCE_COMMIT || 'HEAD'], { encoding: 'utf8' }).trim(), fingerprints = {};
for (const file of execFileSync('git', ['-C', repoRoot, 'ls-tree', '-r', '--name-only', sourceCommit, '--', 'js', 'css', 'index.html'], { encoding: 'utf8' }).trim().split('\n')) {
  const want = execFileSync('git', ['-C', repoRoot, 'show', `${sourceCommit}:${file}`], { maxBuffer: 8 << 20 }), got = Buffer.from(await (await fetch(new URL(file, gameURL))).arrayBuffer());
  if (!got.equals(want)) throw Error(`Served source differs from ${sourceCommit}: ${file}`); fingerprints[file] = createHash('sha256').update(got).digest('hex'); }
const dir = path.join(repoRoot, 'docs/owner-repair-20261014/evidence', phase); fs.mkdirSync(dir, { recursive: true });
const browser = await launch(), results = [];
try {
  for (const [device, w, h, touch] of [['phone', 390, 844, true], ['computer', 1280, 800, false]]) {
    const P = await open(browser, { w, h, touch, lang: 'en', play: false, route: async ctx => { await ctx.route('**/content/custom.json*', r => r.fulfill({ contentType: 'application/json', body: '{}' })); await ctx.route('**/api/**', r => r.fulfill({ status: 204 })); } });
    await start(P.page); await clear(P.page); const shot = async n => { await P.page.waitForTimeout(500); await P.page.screenshot({ path: path.join(dir, `${device}-en-${n}.png`) }); }, st = { device };
    // 50: tap the hearts
    await P.page.locator('.hud .hearts').first().click(); await P.page.waitForTimeout(700);
    st.hearts = await P.page.evaluate(() => { const v = e => e && e.getClientRects().length > 0; const t = [...document.querySelectorAll('.toast, .htoast.show, .caption.show')].filter(v).map(e => e.textContent.trim().slice(0, 200)); return { toast: t, settingsOpen: v(document.querySelector('.modal.settings, .settings')), modals: [...document.querySelectorAll('.modal')].filter(v).map(m => m.className.slice(0, 40)) }; });
    await shot('hearts-tap'); await clear(P.page);
    if (process.env.SV_ONLY === 'hearts') { results.push({ ...st, errors: P.errors }); await P.ctx.close(); continue; }
    // 22/23: the view tray
    await P.page.locator('.z-tray').first().click(); await P.page.waitForTimeout(400);
    st.tray = await P.page.evaluate(() => { const z = document.querySelector('.zoomer'), b = [...z.querySelectorAll('button')].filter(x => x.getClientRects().length).map(x => { const r = x.getBoundingClientRect(); return { cls: x.className.split(' ')[0], x: Math.round(r.x), y: Math.round(r.y) }; }); return { open: z.classList.contains('open'), buttons: b, where: !!z.querySelector('.z-where') && z.querySelector('.z-where').getClientRects().length > 0 }; });
    await shot('view-tray-open'); await P.page.locator('.z-tray').first().click(); await clear(P.page);
    // 7: Play → a game → close
    await P.page.evaluate(() => __sv.openGamesHub ? __sv.openGamesHub(0) : null); await P.page.waitForSelector('.hplay', { timeout: 15000 }); await shot('play-hub');
    st.playFirst = await P.page.evaluate(() => document.querySelector('.hplay')?.dataset.play || null);
    await P.page.locator('.hplay').first().click(); await P.page.waitForSelector('.gl:not(.out)', { timeout: 20000 }); await P.page.waitForTimeout(800); await shot('play-game-open');
    await P.page.locator('.gl-x').first().click(); await P.page.waitForSelector('.gl', { state: 'detached', timeout: 20000 }).catch(() => { }); await P.page.waitForTimeout(1200);
    st.afterClose = await P.page.evaluate(() => ({ hub: !!document.querySelector('.hplay') && document.querySelector('.hplay').getClientRects().length > 0, modal: [...document.querySelectorAll('.modal')].map(m => m.className.slice(0, 40)) }));
    await shot('play-after-close'); await clear(P.page);
    // 39-44: Grown-ups → Children → family photos and devices
    await P.page.evaluate(async () => (await import('/js/ui.js')).openGrownups()); await P.page.waitForSelector('.grownups', { timeout: 15000 });
    st.family = await P.page.evaluate(() => { const fd = document.querySelector('details.gsec[data-sec="familydevices"]'); if (fd) { fd.open = true; fd.scrollIntoView({ block: 'start' }); return 'familydevices: ' + fd.textContent.replace(/\s+/g, ' ').trim().slice(0, 160); }
      const d = document.querySelector('details.gsec[data-sec="players"]'); if (d) d.open = true; const t = [...document.querySelectorAll('.grownups summary, .grownups h3, .grownups b, .grownups label')].find(e => /family code|Family photos|mã gia đình/i.test(e.textContent)); t?.scrollIntoView({ block: 'start' }); return t ? 'older: ' + t.textContent.trim().slice(0, 120) : null; });
    await shot('grownups-family');
    results.push({ ...st, errors: P.errors }); await P.ctx.close();
  }
} finally { await browser.close(); fs.writeFileSync(path.join(dir, 'point-shots-results.json'), JSON.stringify({ sourceCommit, servedAt: gameURL, capturedAt: new Date().toISOString(), fingerprintCount: Object.keys(fingerprints).length, fingerprints, results }, null, 2) + '\n'); }
console.log(JSON.stringify(results).slice(0, 1500));
