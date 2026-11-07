// (v1.08b platform, owner 5 Nov 2026 AEDT: "the whole studio website still loads very slow and whenever i click go back it
// reloads again which is very annoying"; "redesign the release and sparklelab on studio so it makes it easier to
// understand and use") The online Studio on a pretend Netlify and GitHub (tests/studio-check.mts), desktop and phone:
//   studioback     : going Back shows the kept page and its scroll at once, with no network read, and no "Loading"
//   studioreleases : Releases grouped by purpose, a plain state on every row, one tap to change, search, a timeline of
//                    what opens when (with the release calendar), a "what changes" summary before saving, EN and VI
//   sparklelab     : three parts (Reports from testers, Automatic play, Devices), each with a heading and one line
// Run: node studio-back.mts [studioback|studioreleases|sparklelab|all] [--measure]   (prints one line per part)
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { launch } from './harness.mts';
import { fakeGitHub, routeGitHub, fakeNetlify, memoryBlobs } from './studio-check.mts';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const want = process.argv[2] && !process.argv[2].startsWith('--') ? process.argv[2] : 'all', measure = process.argv.includes('--measure');
const repo = 'family/back', password = 'back-fixture-password-123', PORT = 8797, site = `http://localhost:${PORT}`;
const gh = fakeGitHub(repo, { 'content/custom.json': '{}', 'js/build.js': fs.readFileSync(path.join(root, 'js/build.js')) }); routeGitHub(gh);
const server = await fakeNetlify({ port: PORT, players: memoryBlobs(), env: { STUDIO_PASSWORD: password, GITHUB_TOKEN: 'fixture-token', GITHUB_REPO: repo, URL: site } });
const browser = await launch(), out = [], bad = [];
const ready = pg => pg.waitForFunction(() => { const P = document.querySelector('#page'); return !!P && !P.querySelector('.loading') && !!P.querySelector('.studio-help, .badtxt, .pcard'); }, null, { timeout: 30000 });
try {
  for (const [label, viewport, touch] of [['desktop', { width: 1280, height: 800 }, false], ['phone', { width: 390, height: 844 }, true]] as const) {
    const ctx = await browser.newContext({ viewport, hasTouch: touch, isMobile: touch }), pg = await ctx.newPage(), errors = [], reads = [];
    pg.on('pageerror', e => errors.push(String(e.message).slice(0, 200))); pg.on('dialog', d => d.accept().catch(() => { }));
    pg.on('request', r => { if (/\/studio\/(api|game)\//.test(r.url())) reads.push(r.url().replace(site, '')); });
    await pg.addInitScript(() => { try { if (!localStorage.getItem('studioLang')) localStorage.setItem('studioLang', 'en'); } catch (e) { } });
    await pg.goto(site + '/studio'); await pg.fill('#pw', password); await pg.click('#si button'); await pg.waitForSelector('#tabs button'); await ready(pg);
    // time to the first page: open Studio again (signed in), until Home is drawn
    // (each Studio read waits 250 ms here, about what a Netlify function and GitHub take, so the numbers mean something)
    await ctx.route('**/studio/api/**', async r => { await new Promise(ok => setTimeout(ok, 250)); await r.fallback(); });
    await pg.evaluate(() => sessionStorage.clear()); await pg.goto('about:blank'); reads.length = 0; let t0 = Date.now(); await pg.goto(site + '/studio#home'); await ready(pg); const cold = Date.now() - t0, coldReads = reads.filter(u => /\/studio\/api\//.test(u)).length;
    await pg.goto('about:blank'); reads.length = 0; t0 = Date.now(); await pg.goto(site + '/studio#home'); await ready(pg); const first = Date.now() - t0, firstList = reads.filter(u => /\/studio\/api\//.test(u)), firstReads = firstList.length; if (measure) console.log(firstList.join(" "));
    // Releases, then Sparkle Lab, then Back
    t0 = Date.now(); await pg.evaluate(() => { location.hash = 'game/releases'; }); await pg.waitForSelector('#page .relc[data-id="traffic"]', { timeout: 30000 }); await ready(pg); const openRel = Date.now() - t0; if (measure) console.log('releases reads', reads.slice(-12).join(' '));
    await pg.evaluate(() => window.scrollTo(0, 900)); await pg.waitForTimeout(150); const scrollWas = await pg.evaluate(() => window.scrollY);
    await pg.evaluate(() => { location.hash = 'work/lab'; }); await pg.waitForSelector('#page .relc[data-id="tester"]', { timeout: 30000 }); await ready(pg); await pg.waitForTimeout(300);
    reads.length = 0; t0 = Date.now();
    await pg.goBack(); await pg.waitForSelector('#page .relc[data-id="traffic"]', { timeout: 30000 });
    const back = Date.now() - t0, sawLoading = await pg.evaluate(() => !!document.querySelector('#page .loading')); await pg.waitForTimeout(400);
    const backReads = reads.filter(u => /\/studio\/api\//.test(u)), scrollNow = await pg.evaluate(() => window.scrollY);
    out.push(`${label}: first page ${cold} ms (${coldReads} reads), again in the same tab ${first} ms (${firstReads} reads), Releases ${openRel} ms, Back ${back} ms (${backReads.length} reads, scroll ${scrollWas}->${scrollNow})`);
    if (!measure && ['all', 'studioback'].includes(want)) {
      if (backReads.length) bad.push(`${label} Back read the network: ${backReads.join(' ')}`);
      if (sawLoading) bad.push(`${label} Back showed Loading`);
      if (Math.abs(scrollNow - scrollWas) > 40) bad.push(`${label} Back lost the scroll: ${scrollWas} -> ${scrollNow}`);
      if (back > 1500) bad.push(`${label} Back took ${back} ms`);
      // after a save, a kept page is not shown stale: the switch saved on Releases is still what Releases shows
      const target = await pg.evaluate(() => { const b = document.querySelector<HTMLInputElement>('.relc[data-id="traffic"] [data-r="on"]'); b.checked = !b.checked; b.dispatchEvent(new Event('change', { bubbles: true })); return b.checked; });
      await pg.evaluate(() => document.querySelector<HTMLElement>('#save').click()); await pg.waitForTimeout(400);
      await pg.waitForTimeout(1200);
      await pg.evaluate(() => { location.hash = 'home'; }); await ready(pg);
      await pg.goBack(); await pg.waitForSelector('#page .relc[data-id="traffic"]', { timeout: 30000 }); await pg.waitForTimeout(600);
      const saved = await pg.evaluate(() => fetch('/api/live', { cache: 'no-store' }).then(r => r.json()).then(l => l.releases?.traffic?.on));
      const shown = await pg.evaluate(() => document.querySelector<HTMLInputElement>('.relc[data-id="traffic"] [data-r="on"]').checked);
      const pending = await pg.evaluate(() => !document.querySelector<HTMLElement>('#relchanges')?.hidden);
      if (saved !== target || shown !== target || pending) bad.push(`${label} after saving traffic ${target}: saved ${saved}, Releases shows ${shown}, still listed as not saved ${pending}`);
    }
    if (!measure && ['all', 'studioreleases'].includes(want)) for (const lang of ['en', 'vi']) {
      await pg.evaluate(l => { localStorage.setItem('studioLang', l); }, lang); await pg.goto('about:blank'); await pg.goto(site + '/studio#game/releases'); await pg.waitForSelector('#page .relc[data-id="traffic"]', { timeout: 30000 }); await ready(pg);
      const r = await pg.evaluate(() => {
        const P = document.querySelector('#page'), vis = e => !!e && e.getClientRects().length > 0;
        const groups = [...P.querySelectorAll<HTMLElement>('details.relg')].map(d => d.dataset.g);
        const rows = [...P.querySelectorAll<HTMLElement>('.relc')], noState = rows.filter(c => !c.querySelector('.relc-st .rs')).map(c => c.dataset.id);
        const noPlain = rows.filter(c => !(c.querySelector('.relc-what')?.textContent || '').trim()).map(c => c.dataset.id);
        const small = [...P.querySelectorAll<HTMLElement>('.relc .tog, .relc [data-more], #relview button, #save')].filter(vis).filter(e => { const b = e.getBoundingClientRect(); return b.height < 44 || b.width < 44; }).map(e => e.className || e.id).slice(0, 5);
        const tiny = [...P.querySelectorAll<HTMLElement>('.relc-name, .relc-what, .rs')].filter(vis).filter(e => parseFloat(getComputedStyle(e).fontSize) < 14).length;
        const wide = document.documentElement.scrollWidth > innerWidth + 2;
        return { groups, rows: rows.length, noState, noPlain, small, tiny, wide, search: !!P.querySelector('#relq'), views: [...P.querySelectorAll<HTMLElement>('#relview [data-view]')].map(b => b.dataset.view) };
      });
      const need = ['play', 'story', 'valley', 'festivals', 'money', 'notify', 'tools'];
      if (!need.every(g => r.groups.includes(g))) bad.push(`${label} ${lang} Releases groups: ${r.groups.join()}`);
      if (r.rows < 80 || r.noState.length || r.noPlain.length) bad.push(`${label} ${lang} rows without a state or plain words: ${JSON.stringify({ rows: r.rows, noState: r.noState.slice(0, 5), noPlain: r.noPlain.slice(0, 5) })}`);
      if (!r.search || r.views.join() !== 'list,timeline') bad.push(`${label} ${lang} search or views: ${JSON.stringify(r)}`);
      if (lang === 'vi' && !/Công tắc/.test(await pg.locator('#relview').innerText())) bad.push(`${label} vi: Releases is not in Vietnamese`);
      if (r.small.length || r.tiny || r.wide) bad.push(`${label} ${lang} Releases sizes: ${JSON.stringify({ small: r.small, tiny: r.tiny, wide: r.wide })}`);
      // one tap changes a row's state; search narrows; the timeline lists a scheduled item by its week
      const tap = await pg.evaluate(async () => { const c = document.querySelector<HTMLElement>('.relc[data-id="powerPoles"]'), before = c.querySelector('.relc-st').textContent;
        c.querySelector<HTMLElement>('.tog').click(); await new Promise(r => setTimeout(r, 50)); const after = c.querySelector('.relc-st').textContent;
        const q = document.querySelector<HTMLInputElement>('#relq'); q.value = 'xích lô'; q.dispatchEvent(new Event('input')); await new Promise(r => setTimeout(r, 50));
        const shownRows = [...document.querySelectorAll<HTMLElement>('.relc')].filter(x => !x.hidden).map(x => x.dataset.id); q.value = ''; q.dispatchEvent(new Event('input'));
        const f = document.querySelector<HTMLElement>('.relc[data-id="jobs"]'); f.querySelector<HTMLElement>('[data-more]').click(); f.querySelector<HTMLElement>('[data-in="7"]').click();
        document.querySelector<HTMLElement>('#relview [data-view="timeline"]').click(); await new Promise(r => setTimeout(r, 100));
        const tl = document.querySelector<HTMLElement>('#reltl'), weeks = [...tl.querySelectorAll('.tlweek')].length, hasGate = !!tl.querySelector('[data-tl="jobs"]'), tlVis = tl.getClientRects().length > 0;
        document.querySelector<HTMLElement>('#relview [data-view="list"]').click();
        const sumBox = document.querySelector<HTMLDetailsElement>('#relchanges'), lines = sumBox && !sumBox.hidden ? [...sumBox.querySelectorAll('li')].map(l => l.textContent) : [];
        return { before, after, shownRows, weeks, hasGate, tlVis, lines };
      });
      if (tap.before === tap.after) bad.push(`${label} ${lang} one tap did not change the state`);
      if (!tap.shownRows.includes('xichloRides') || tap.shownRows.length > 6) bad.push(`${label} ${lang} search: ${tap.shownRows.join()}`);
      if (!tap.tlVis || !tap.weeks || !tap.hasGate) bad.push(`${label} ${lang} timeline: ${JSON.stringify(tap)}`);
      if (tap.lines.length !== 2) bad.push(`${label} ${lang} change summary before saving: ${JSON.stringify(tap.lines)}`);
      fs.mkdirSync('out', { recursive: true }); await pg.screenshot({ path: `out/studio-releases-${label}-${lang}.png` });
      await pg.evaluate(() => { document.querySelector<HTMLElement>('#relview [data-view="timeline"]').click(); }); await pg.screenshot({ path: `out/studio-timeline-${label}-${lang}.png` });
      await pg.reload(); // drop the unsaved changes
    }
    if (!measure && ['all', 'sparklelab'].includes(want)) for (const lang of ['en', 'vi']) {
      await pg.evaluate(l => { localStorage.setItem('studioLang', l); }, lang); await pg.goto('about:blank'); await pg.goto(site + '/studio#work/lab'); await pg.waitForSelector('#page .relc[data-id="tester"]', { timeout: 30000 }); await ready(pg); await pg.waitForTimeout(500);
      const r = await pg.evaluate(() => { const P = document.querySelector('#page'), parts = [...P.querySelectorAll<HTMLElement>('section.labpart')].map(s => ({ k: s.dataset.part, h: s.querySelector('h3')?.textContent.trim(), line: s.querySelector('.labwhy')?.textContent.trim() }));
        const wide = document.documentElement.scrollWidth > innerWidth + 2, reports = P.querySelector('section.labpart[data-part="reports"]');
        return { parts, wide, inReports: !!reports?.querySelector('.labreports'), apInAuto: !!P.querySelector('section.labpart[data-part="autoplay"] .relc[data-id="autoplay"]'), devs: !!P.querySelector('section.labpart[data-part="devices"] #devs') }; });
      if (r.parts.map(p => p.k).join() !== 'reports,autoplay,devices' || r.parts.some(p => !p.h || !p.line)) bad.push(`${label} ${lang} Sparkle Lab parts: ${JSON.stringify(r.parts)}`);
      if (!r.inReports || !r.apInAuto || !r.devs || r.wide) bad.push(`${label} ${lang} Sparkle Lab contents: ${JSON.stringify(r)}`);
      fs.mkdirSync('out', { recursive: true }); await pg.screenshot({ path: `out/studio-lab-${label}-${lang}.png`, fullPage: true });
    }
    if (errors.length) bad.push(`${label} page errors: ${errors.join(' | ')}`);
    await ctx.close();
  }
} finally { await browser.close(); await new Promise(r => server.close(r)); }
console.log(out.join('; '));
if (bad.length) { console.error(bad.join('\n')); process.exit(1); }
