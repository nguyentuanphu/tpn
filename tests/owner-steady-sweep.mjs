// (owner, 16 Oct AEDT: "windows, panels and the Pad must stay fixed: never move up and down, bounce or recentre as the
// content changes") a sweep over every window and panel on a phone, a tablet and a computer (EN). For each, the outer
// box (and, for full-screen layers, their main parts) is measured every 100 ms for 2.5 s after it opens and for 1.5 s
// after each tap inside it; a change of top, left, width or height over 2 px (after the first 600 ms of opening) is
// MOVED. Also: startup timings with pictures at 0.5, 1, 2 and 4 s, and the drawn size of every Bag item's picture.
// Usage: node owner-steady-sweep.mjs [devices, e.g. phone,tablet,computer]   (SV_URL picks the game)
// Results: docs/owner-repair-20261014/evidence/steady-sweep/results.json and pictures of every MOVED case.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { launch, start, seedPlayers, URL as GAME_URL } from './harness.mjs';
const root = fileURLToPath(new URL('../', import.meta.url)), out = path.join(root, 'docs/owner-repair-20261014/evidence', process.env.SV_OUT || 'steady-sweep');
fs.mkdirSync(out, { recursive: true });
const SIZES = { phone: [390, 844, true], tablet: [820, 1180, true], computer: [1280, 800, false] };
const want = (process.argv[2] || 'phone,tablet,computer').split(',');
const TOL = 2, OPEN_SETTLE = 600, OPEN_WATCH = 2500, ACT_WATCH = 1500;
const results = { when: new Date().toISOString(), url: GAME_URL, tolerancePx: TOL, devices: {} };
// SV_MERGE=1: keep the devices already in results.json (run one device at a time)
if (process.env.SV_MERGE === '1') { try { results.devices = JSON.parse(fs.readFileSync(path.join(out, 'results.json'), 'utf8')).devices || {}; } catch (e) { } }
const save = () => fs.writeFileSync(path.join(out, 'results.json'), JSON.stringify(results, null, 1) + '\n');

// ---- in-page sampler: the boxes of the named parts, every 100 ms, from the moment it starts ----
const SAMPLER = () => {
  window.__stStart = sels => {
    const S = { t0: performance.now(), samples: [] };
    const take = () => {
      const row = { t: Math.round(performance.now() - S.t0), r: {} };
      for (const [name, sel] of sels) {
        const e = [...document.querySelectorAll(sel)].filter(x => x.getClientRects().length && getComputedStyle(x).visibility !== 'hidden' && getComputedStyle(x).display !== 'none').pop();
        if (!e) { row.r[name] = null; continue; }
        const b = e.getBoundingClientRect(); row.r[name] = [b.left, b.top, b.width, b.height].map(v => Math.round(v * 10) / 10);
      }
      S.samples.push(row);
    };
    take(); S.iv = setInterval(take, 100); window.__st = S;
  };
  window.__stStop = () => { const S = window.__st; if (!S) return []; clearInterval(S.iv); S.iv = 0; return S.samples; };
};
const KEYS = ['left', 'top', 'width', 'height'];
// compare every sample from `from` on with the baseline (per part); the largest change of each side
function diff(samples, base, from) {
  const parts = {}; let moved = false;
  for (const name of Object.keys(base.r)) {
    const b = base.r[name]; if (!b) continue;
    const mx = { left: 0, top: 0, width: 0, height: 0 }; let gone = false, firstAt = null, path = [];
    for (const s of samples) {
      if (s.t < from) continue; const r = s.r[name];
      if (!r) { gone = true; continue; }
      KEYS.forEach((k, i) => { const d = Math.round((r[i] - b[i]) * 10) / 10; if (Math.abs(d) > Math.abs(mx[k])) mx[k] = d; if (Math.abs(d) > TOL && firstAt === null) firstAt = s.t; });
      const last = path[path.length - 1]; if (!last || r.some((v, i) => Math.abs(v - last.r[i]) > TOL)) path.push({ t: s.t, r });
    }
    const m = KEYS.some(k => Math.abs(mx[k]) > TOL);
    if (m) moved = true;
    parts[name] = { base: b, maxChange: mx, moved: m, firstMoveAtMs: firstAt, gone, track: m ? path.slice(0, 12) : undefined };
  }
  return { moved, parts };
}

const PICK = process.env.SV_PANELS ? new Set(process.env.SV_PANELS.split(',')) : null;
async function sweepDevice(b, dev) {
  // SV_ONLY_BAG=1: only measure the Bag pictures again (the panels and startup already in results.json are kept)
  const ONLY = process.env.SV_ONLY_BAG === '1', prev = results.devices[dev];
  const [w, h, touch] = SIZES[dev], R = results.devices[dev] = ONLY && prev ? prev : { panels: {}, startup: null, bagIcons: null, errors: [] }; save();
  const ctx = await b.newContext({ viewport: { width: w, height: h }, hasTouch: touch, isMobile: touch, deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  page.on('dialog', d => d.accept().catch(() => { }));
  page.on('pageerror', e => R.errors.push('pageerror: ' + e.message));
  await page.addInitScript(s => { try { const o = JSON.parse(localStorage.getItem('sv2_settings') || '{}'); Object.assign(o, s, { familyMsgDay: new Date().toDateString() }); localStorage.setItem('sv2_settings', JSON.stringify(o)); } catch (e) { } }, { lang: 'en', voice: false, sound: false, music: false, quality: 'low', autoPack: false, online: true });
  await page.addInitScript(seedPlayers);
  await page.addInitScript(SAMPLER);
  // startup marks: first paint, the title's element timing, the first frame the Welcome screen is there and not white
  await page.addInitScript(() => {
    const M = window.__stBoot = { welcomeAt: null, welcomeBg: null, fcp: null, titleRender: null };
    try { new PerformanceObserver(l => { for (const e of l.getEntries()) if (e.name === 'first-contentful-paint') M.fcp = Math.round(e.startTime); }).observe({ type: 'paint', buffered: true }); } catch (e) { }
    try { new PerformanceObserver(l => { for (const e of l.getEntries()) if (e.identifier === 'title') M.titleRender = Math.round(e.renderTime || e.loadTime); }).observe({ type: 'element', buffered: true }); } catch (e) { }
    const white = c => /rgba?\(255, 255, 255(, 1)?\)/.test(c) || /rgba\(0, 0, 0, 0\)/.test(c);
    const poll = () => { if (M.welcomeAt !== null) return; const s = document.querySelector('.screen.title');
      if (s && s.getClientRects().length) { const cs = getComputedStyle(s), bg = cs.backgroundImage !== 'none' ? cs.backgroundImage.slice(0, 60) : cs.backgroundColor;
        if (cs.backgroundImage !== 'none' || !white(cs.backgroundColor)) { M.welcomeAt = Math.round(performance.now()); M.welcomeBg = bg; return; } }
      requestAnimationFrame(poll); };
    requestAnimationFrame(poll);
  });
  await ctx.route('**/api/tester**', rt => rt.fulfill({ status: 200, contentType: 'application/json', body: '{"mine":[],"open":[]}' }));

  // ---------- (a) startup ----------
  {
    const t0 = Date.now(), shots = {};
    const timed = [500, 1000, 2000, 4000].map(ms => (async () => { const wait = ms - (Date.now() - t0); if (wait > 0) await new Promise(r => setTimeout(r, wait));
      const at = Date.now() - t0, file = `${dev}-startup-${ms}ms.png`;
      try { await page.screenshot({ path: path.join(out, file) }); const s = await page.evaluate(() => ({ title: !!document.querySelector('.screen.title'), launch: [...document.body.children].filter(e => e.getClientRects().length).map(e => (e.className || e.tagName) + '').slice(0, 6), bodyBg: getComputedStyle(document.body).backgroundColor })).catch(() => null); shots[ms] = { file, takenAtMs: at, screen: s }; } catch (e) { shots[ms] = { error: String(e.message || e).slice(0, 120), takenAtMs: at }; } })());
    await page.goto(GAME_URL);
    await page.waitForSelector('.screen.title', { timeout: 90000 });
    await Promise.all(timed);
    const ready = await page.waitForFunction(() => window.__sv && window.__sv.bootTimes && window.__sv.bootTimes.ready, null, { timeout: 120000 }).then(() => true).catch(() => false);
    const m = await page.evaluate(() => ({ boot: window.__stBoot, bootTimes: window.__sv && window.__sv.bootTimes, nav: (() => { const n = performance.getEntriesByType('navigation')[0]; return n ? { domContentLoaded: Math.round(n.domContentLoadedEventEnd), load: Math.round(n.loadEventEnd) } : null; })() }));
    R[ONLY && R.startup ? 'startupBagRun' : 'startup'] = { welcomeFirstNonWhiteFrameMs: m.boot.welcomeAt, welcomeBackground: m.boot.welcomeBg, firstContentfulPaintMs: m.boot.fcp, titleTextRenderMs: m.boot.titleRender,
      worldReadyMs: ready && m.bootTimes ? m.bootTimes.start + m.bootTimes.ready : null, bootTimes: m.bootTimes, navigation: m.nav, wallClockToReadyMs: Date.now() - t0, shots };
    save();
  }
  // the test browser draws in software: fewer pixels (as tests/harness.mjs does)
  await page.evaluate(() => { const r = window.__sv.renderer; if (r) { r.setPixelRatio(.35); dispatchEvent(new Event('resize')); } });

  let shotN = 0;
  const shot = async name => { const f = `${dev}-${String(++shotN).padStart(3, '0')}-${name.replace(/[^a-z0-9]+/gi, '-').slice(0, 60)}.png`; await page.screenshot({ path: path.join(out, f) }).catch(() => { }); return f; };
  const snap = async () => page.screenshot().catch(() => null);
  const keep = (buf, name) => { if (!buf) return null; const f = `${dev}-${String(++shotN).padStart(3, '0')}-${name.replace(/[^a-z0-9]+/gi, '-').slice(0, 60)}.png`; fs.writeFileSync(path.join(out, f), buf); return f; };

  // ---- one panel: open it, watch it, then each tap inside it ----
  // parts: [[name, selector], ...] (the first is the outer box); opener: async fn; actions: [[label, async fn or selector]]
  async function panel(key, parts, opener, actions = [], { waitFor = parts[0][1], after = null, prep = null } = {}) {
    // SV_PANELS=story-film,shop checks only those (the start screens always run: they lead into the game)
    if (PICK && !PICK.has(key) && !/^(welcome|who)$/.test(key)) return;
    if (ONLY) { await opener(); await page.waitForTimeout(800); if (after) await after(); return; }
    const P = R.panels[key] = { shell: parts[0][1], parts: Object.fromEntries(parts), opened: false, open: null, actions: [] };
    try {
      await page.evaluate(sels => window.__stStart(sels), parts);
      await Promise.race([opener(), new Promise(r => setTimeout(r, 20000))]);
      const ok = await page.waitForFunction(sel => [...document.querySelectorAll(sel)].some(x => x.getClientRects().length), waitFor, { timeout: 30000 }).then(() => true).catch(() => false);
      if (!ok) { await page.evaluate(() => window.__stStop()); P.notOpened = 'its box never appeared within 30 s (' + waitFor + ')'; await shot(key + '-not-opened'); save(); return; }
      P.opened = true;
      const appearedAt = await page.evaluate(([sel]) => { const s = window.__st.samples.find(x => x.r[Object.keys(x.r)[0]]); return s ? s.t : Math.round(performance.now() - window.__st.t0); }, parts[0]);
      await page.waitForTimeout(700); const early = await snap();
      await page.waitForTimeout(Math.max(0, OPEN_WATCH - 700));
      const samples = await page.evaluate(() => window.__stStop());
      const base = samples.find(s => s.t >= appearedAt + OPEN_SETTLE && s.r[parts[0][0]]) || samples[samples.length - 1];
      const d = diff(samples, base, base.t);
      P.open = { appearedAtMs: appearedAt, baselineAtMs: base.t, samples: samples.length, ...d };
      if (d.moved) { P.open.shots = [keep(early, `${key}-open-at-700ms`), await shot(`${key}-open-at-2500ms`)]; }
      else P.open.shot = await shot(`${key}-open`);
      save();
      for (const [label, act] of actions) {
        const A = { action: label };
        try {
          if (prep) A.prep = await prep();
          // the tap target is scrolled into view first (as a child would scroll to it), so the watch sees only what the tap does
          let loc = null; if (typeof act === 'string') { loc = page.locator(act).first(); if (!(await loc.count())) { A.skipped = 'not on screen: ' + act; P.actions.push(A); continue; } await loc.scrollIntoViewIfNeeded({ timeout: 3000 }).catch(() => { }); await page.waitForTimeout(250); }
          const before = await snap();
          await page.evaluate(sels => window.__stStart(sels), parts);
          if (loc) await loc.click({ force: true, timeout: 5000 });
          else { const r = await act(); if (r === false) { await page.evaluate(() => window.__stStop()); A.skipped = 'not available'; P.actions.push(A); continue; } }
          await page.waitForTimeout(ACT_WATCH);
          const s2 = await page.evaluate(() => window.__stStop());
          const base2 = s2[0]; Object.assign(A, diff(s2, base2, 0));
          if (!base2.r[parts[0][0]]) A.note = 'outer box not visible before the tap';
          if (A.moved) A.shots = [keep(before, `${key}-before-${label}`), await shot(`${key}-after-${label}`)];
        } catch (e) { A.error = String(e.message || e).slice(0, 200); await page.evaluate(() => window.__stStop()).catch(() => { }); }
        P.actions.push(A); save();
      }
      if (after) await after();
    } catch (e) { P.error = String(e.message || e).slice(0, 300); if (!P.opened) P.notOpened = P.error; await page.evaluate(() => window.__stStop && window.__stStop()).catch(() => { }); }
    save();
  }
  // close whatever is open and go back to the valley
  const reset = async () => {
    await page.evaluate(() => {
      for (const s of ['.modal.pad .pad-head .x', '.gl .gl-x', '.theatre .th-x', '.howto .ht-x', '.wardrobe .x']) { const x = document.querySelector(s); if (x) try { x.click(); } catch (e) { } }
      document.querySelector('.audio-tray')?.close?.();
      document.querySelectorAll('.zoomer.open').forEach(z => z.classList.remove('open'));
    }).catch(() => { });
    await page.waitForTimeout(400);
    await page.evaluate(() => { document.querySelectorAll('.modal, .storybook, .dialog, .vc-pop, .reward, .wardrobe, .theatre, .howto, .update-notice, .caption').forEach(e => e.remove()); if (window.__sv) { window.__sv.paused = false; window.__sv.closeUp = null; } }).catch(() => { });
    await page.waitForTimeout(300);
  };

  // ---------- Welcome screen ----------
  await panel('welcome', [['cover', '.screen.title .tt-cover'], ['logo', '.screen.title .logo'], ['start', '.screen.title .press'], ['languages', '.screen.title .tt-panel']], async () => { }, [
    ['Tieng Viet', '.screen.title .seg.lang button[data-l="vi"]'], ['English', '.screen.title .seg.lang button[data-l="en"]'],
    ['learn Chinese on', '.screen.title .learnrow [data-learn="zh"]'], ['learn Chinese off', '.screen.title .learnrow [data-learn="zh"]']]);
  // ---------- Who is playing ----------
  await panel('who', [['card', '.screen.who .who-card'], ['go button', '.screen.who .who-card .go'], ['grown-ups button', '.screen.who .grown']], async () => { await page.click('.screen.title .press', { force: true, timeout: 90000 }); }, [
    ['pick player 1', '.screen.who .pick[data-id]:nth-child(1)'], ['pick player 2', '.screen.who .pick[data-id]:nth-child(2)'],
    ['mode two players', '.screen.who .modes button[data-m="split"]'], ['pick player 1 (two)', '.screen.who .pick[data-id]:nth-child(1)'], ['view side by side', '.screen.who .views button[data-v="side"]'], ['view face to face', '.screen.who .views button[data-v="face"]'],
    ['mode friend far away', '.screen.who .modes button[data-m="online"]'], ['mode play alone', '.screen.who .modes button[data-m="solo"]'], ['pick player 1 again', '.screen.who .pick[data-id]:nth-child(1)']]);
  // ---------- the character maker (from "New" on Who is playing): outfit preview ----------
  await panel('who-character-maker', [['card', '.modal.editor .card']], async () => { await page.click('.screen.who .pick.add', { force: true }); }, [
    ['outfit boy', '.modal.editor #cOut .chip:nth-child(2)'], ['outfit girl', '.modal.editor #cOut .chip:nth-child(1)'],
    ['age big kid', '.modal.editor .seg.age:not(.scr) button[data-a="big"]'], ['age little', '.modal.editor .seg.age:not(.scr) button[data-a="little"]'],
    ['hair style 3', '.modal.editor #cHs .chip:nth-child(3)'], ['hair colour 2', '.modal.editor #cHair .chip:nth-child(2)'], ['skin 3', '.modal.editor #cSkin .chip:nth-child(3)'],
    ['difficulty hard', '.modal.editor .seg.diff button[data-d="hard"]'], ['type a name', async () => { await page.locator('.modal.editor #nm').fill('Test Kid'); }]],
    { after: async () => { await page.click('.modal.editor #eCancel', { force: true }).catch(() => { }); await page.waitForTimeout(400); } });
  // into the valley as player 1 (as tests/harness.mjs start does from Who is playing)
  await page.evaluate(() => document.querySelectorAll('.modal').forEach(m => m.remove()));
  if (!(await page.locator('.screen.who .pick[data-id].on').count())) await page.locator('.screen.who .pick[data-id]').nth(0).click({ timeout: 30000 });
  await page.evaluate(async () => { const S = await import('/js/state.js'); S.profiles.forEach(p => { p.screen = 'valley'; }); window.__sv._owlAuto = true; });
  await page.click('.screen.who .go', { timeout: 30000 });
  await page.waitForFunction(() => window.__sv && window.__sv.heroes.length > 0, null, { timeout: 90000 });
  for (let i = 0; i < 40; i++) { if (!(await page.$('.storybook'))) break; await page.evaluate(() => { const x = document.querySelector('.storybook .sb-next, .storybook .next, .storybook button:last-of-type'); x && x.click(); }); await page.waitForTimeout(80); }
  await page.evaluate(async () => { document.querySelectorAll('.storybook').forEach(e => e.remove()); window.__sv.paused = false; const C = (await import('/js/custom.js')).CUSTOM; C.features = { ...(C.features || {}), hoilang: false, surprises: false, danceBreak: false }; });
  await page.waitForTimeout(1500); await reset();
  // a full Backpack, so every kind of item is there to measure
  await page.evaluate(async () => {
    const p = window.__sv.heroes[0].profile, D = await import('/js/data.js'), Gt = await import('/js/gather.js'), Rg = await import('/js/regions.js'), Sh = await import('/js/content/shop.js');
    Object.keys(D.ITEMS).forEach(k => { p.inv[k] = 2; }); Object.entries(Gt.WILD).filter(([, v]) => v.kind === 'gem').forEach(([k]) => { p.inv[k] = 1; });
    D.RECIPES.forEach(r => { p.dishes[r.id] = 1; }); p.bought = p.bought || {}; Rg.VENDORS.slice(0, 6).forEach(v => { p.bought[v.id] = 1; });
    p.owned.clothes = Sh.CLOTHES.filter(c => !c.tester).slice(0, 14).map(c => c.id); p.kite = true; p.glider = true;
  });
  const G = (fn, arg) => page.evaluate(fn, arg);

  // ---------- Grown-ups ----------
  const gsecs = await G(async () => { (await import('/js/ui.js')).openGrownups(); await new Promise(r => setTimeout(r, 400)); const l = [...document.querySelectorAll('.modal.grownups details.gsec')].map(d => d.dataset.sec); document.querySelectorAll('.modal.grownups').forEach(m => m.remove()); return l; });
  await panel('grown-ups', [['card', '.modal.grownups .card']], () => G(async () => { (await import('/js/ui.js')).openGrownups(); }), [
    ...gsecs.map(s => [`open section ${s}`, `.modal.grownups details.gsec[data-sec="${s}"] > summary`]),
    ['captions toggle off', '.modal.grownups #gCap'], ['captions toggle on', '.modal.grownups #gCap'], ['bilingual on', '.modal.grownups #gBil'], ['bilingual off', '.modal.grownups #gBil'],
    ['close section players', '.modal.grownups details.gsec[data-sec="players"] > summary']]);
  await reset();
  // ---------- Bag (the Pad) ----------
  const padTabs = await G(async () => { window.__sv.openPad(0, 'bag'); await new Promise(r => setTimeout(r, 400)); const l = [...document.querySelectorAll('.modal.pad .pad-tabs button')].map(b => b.dataset.t); return l; });
  await reset();
  const bagActions = [];
  for (const t of padTabs) bagActions.push([`pad tab ${t}`, `.modal.pad .pad-tabs button[data-t="${t}"]`]);
  bagActions.push(['pad tab bag (back)', '.modal.pad .pad-tabs button[data-t="bag"]']);
  for (let k = 1; k <= 8; k++) bagActions.push([`bag section button ${k}`, `.modal.pad .pad-body .jumpnav button:nth-child(${k})`]);
  for (const [label, sel] of [['tap food', '[data-eat]'], ['close help', '.bh-close'], ['tap shop food', '[data-snack]'], ['close help 2', '.bh-close'], ['tap treasure', '[data-sellgem]'], ['close help 3', '.bh-close'], ['tap ingredient', '[data-ing]'], ['close help 4', '.bh-close'], ['tap clothes (wear)', '[data-wear]'], ['tap coins chip', '.bag-top [data-chip="money"]'], ['fold a section', 'details.hfold > summary']])
    bagActions.push([label, `.modal.pad .pad-body ${sel}`]);
  await panel('bag', [['pad', '.modal.pad .card']], () => G(() => { window.__sv.openPad(0, 'bag'); }), bagActions);
  // (b) the Bag items' pictures
  try {
    await reset(); await G(() => { window.__sv.openPad(0, 'bag'); }); await page.waitForSelector('.modal.pad .pad-body .slot', { timeout: 20000, state: 'attached' }); await page.waitForTimeout(1200);
    const shots = [await shot('bag-tabs-top')];
    const icons = await G(() => [...document.querySelectorAll('.modal.pad .pad-body .slot')].filter(s => s.getClientRects().length).map(s => {
      const tile = s.getBoundingClientRect(), g = s.querySelector('svg, img, canvas');
      let ib = null, kind = null;
      if (g) { ib = g.getBoundingClientRect(); kind = g.tagName.toLowerCase() + (g.getAttribute('class') ? '.' + g.getAttribute('class').split(' ').join('.') : ''); }
      else { const sp = s.querySelector('span'); if (sp && sp.firstChild) { const rg = document.createRange(); rg.selectNodeContents(sp); ib = rg.getBoundingClientRect(); kind = 'text glyph "' + sp.textContent.trim().slice(0, 4) + '"'; } }
      const sec = (() => { let d = s.closest('details.hfold'); const h = d ? d.querySelector('summary h3') : null; return h ? h.textContent.trim().replace(/\s+/g, ' ').slice(0, 40) : ''; })();
      const id = Object.entries(s.dataset).map(([k, v]) => k + '=' + v).join(' ');
      return { id, section: sec, label: (s.querySelector('small') || s).textContent.trim().slice(0, 40), kind, tile: [tile.width, tile.height].map(Math.round), icon: ib ? [ib.width, ib.height].map(v => Math.round(v * 10) / 10) : null };
    }));
    for (const it of icons) it.size = it.icon ? Math.max(it.icon[0], it.icon[1]) : 0;
    for (const it of icons) it.ofTile = it.icon ? Math.round(100 * it.size / Math.min(it.tile[0], it.tile[1])) : 0;
    const sizes = icons.map(i => i.size).sort((a, b) => a - b), median = sizes.length ? sizes[Math.floor(sizes.length / 2)] : 0;
    const navN = await page.locator('.modal.pad .pad-body .jumpnav button').count();
    for (let k = 0; k < navN; k++) { await page.locator('.modal.pad .pad-body .jumpnav button').nth(k).click({ force: true }).catch(() => { }); await page.waitForTimeout(900); shots.push(await shot(`bag-tabs-section-${k + 1}`)); }
    R.bagIcons = { count: icons.length, medianPx: median, limitPx: Math.round(median * .6 * 10) / 10, tiny: icons.filter(i => i.size < median * .6), items: icons, shots };
  } catch (e) { R.bagIcons = { error: String(e.message || e).slice(0, 200) }; }
  save(); await reset();
  if (ONLY) { R.bagIcons.rerunAt = new Date().toISOString(); save(); await ctx.close(); return; }
  // ---------- Map (the Pad) ----------
  await panel('map', [['pad', '.modal.pad .card']], () => G(() => { window.__sv.openPad(0, 'map'); }), [
    ...[1, 2, 3, 4, 5].map(k => [`country chip ${k}`, `.modal.pad .mapchips button:nth-child(${k})`]),
    ['country chip 2 again', '.modal.pad .mapchips button:nth-child(2)'], ...[2, 3, 4].map(k => [`city chip ${k}`, `.modal.pad .mapcities button:nth-child(${k})`])]);
  await reset();
  // ---------- Shop, and the wardrobe (mirror) inside it ----------
  await panel('shop', [['card', '.modal.shopk .card']], () => G(() => { window.__sv.shop.openShop(0); }), [
    ['Men / boys', '.modal.shopk [data-set="b"]'], ['Ladies / girls', '.modal.shopk [data-set="g"]'], ['All', '.modal.shopk [data-set="all"]'],
    ['gift: buying for player 2', async () => { const s = page.locator('.modal.shopk .shop-recipient'); if (!(await s.count())) return false; const v = await s.locator('option').nth(1).getAttribute('value'); await s.selectOption(v); }],
    ['buying for player 1', async () => { const s = page.locator('.modal.shopk .shop-recipient'); if (!(await s.count())) return false; const v = await s.locator('option').nth(0).getAttribute('value'); await s.selectOption(v); }],
    ...[0, 1, 2, 3, 4, 5].map(k => [`kind tab ${k + 1}`, `.modal.shopk [data-tab] >> nth=${k}`]),
    ['tap item 1', '.modal.shopk .kitem >> nth=0'], ['not now', '.modal.shopk .kno'], ['tap item 3', '.modal.shopk .kitem >> nth=2'], ['not now 2', '.modal.shopk .kno'],
    ['open wardrobe (mirror)', '.modal.shopk [data-go="wardrobe"]'], ['mirror item 1 on', '.modal.shopk .mirror .wit >> nth=0'], ['mirror item 1 off', '.modal.shopk .mirror .wit >> nth=0'], ['mirror tab tops', '.modal.shopk .mirror [data-wtab="top"]'], ['mirror tab hats', '.modal.shopk .mirror [data-wtab="hat"]'], ['wardrobe done', '.modal.shopk .whead .x']]);
  await reset();
  // ---------- the wardrobe / mirror on its own ----------
  await panel('wardrobe', [['wardrobe', '.wardrobe']], () => G(() => { window.__sv.openWardrobe(0); }), [
    // (r79: the mirror is a tab for each kind and a grid of pictures; tap to wear, tap again to take off)
    ['item 1 on', '.wardrobe .wit >> nth=0'], ['item 1 off', '.wardrobe .wit >> nth=0'], ...['neck', 'top', 'bottom', 'feet', 'back', 'hat'].map(k => [`tab ${k}`, `.wardrobe [data-wtab="${k}"]`]), ['item 1 on again', '.wardrobe .wit >> nth=0']]);
  await reset();
  // ---------- Play hub ----------
  const hubTabs = await G(async () => { window.__sv.openGamesHub(0); await new Promise(r => setTimeout(r, 400)); return [...document.querySelectorAll('.modal.hub .hubtabs [data-tab]')].map(b => b.dataset.tab); });
  await reset();
  await panel('play-hub', [['card', '.modal.hub .card']], () => G(() => { window.__sv.openGamesHub(0); }), [...hubTabs.map(t => [`tab ${t}`, `.modal.hub .hubtabs [data-tab="${t}"]`]), [`tab ${hubTabs[0]} again`, `.modal.hub .hubtabs [data-tab="${hubTabs[0]}"]`]]);
  await reset();
  // ---------- Audio tray ----------
  await panel('audio-tray', [['tray', '.audio-tray']], () => page.locator('.hud .dk.snd').first().click({ force: true }), [
    ['music on', '.audio-tray .ss-sw[data-k="music"]'], ['music off', '.audio-tray .ss-sw[data-k="music"]'], ['sounds on', '.audio-tray .ss-sw[data-k="sound"]'], ['sounds off', '.audio-tray .ss-sw[data-k="sound"]'], ['voice on', '.audio-tray .ss-sw[data-k="voice"]'], ['voice off', '.audio-tray .ss-sw[data-k="voice"]']]);
  await reset();
  // ---------- View (eye) tray ----------
  await panel('view-tray', [['tray', '.hud .zoomer.open .ztray'], ['view button', '.hud .zoomer .z-tray']], () => page.locator('.hud .z-tray').first().click({ force: true }), [
    ['zoom in', '.hud .zoomer .z-in'], ['zoom out', '.hud .zoomer .z-out'], ['camera view', '.hud .zoomer .z-view'], ['camera view again', '.hud .zoomer .z-view']],
    { prep: async () => { if (await page.locator('.hud .zoomer.open').count()) return 'tray already open'; await page.locator('.hud .z-tray').first().click({ force: true }); await page.waitForTimeout(800); return 'tray had closed by itself: opened again before the tap'; } });
  await reset();
  // ---------- a game's frame ----------
  const gameId = await G(async () => { const F = await import('/js/games/frame.js'); return ['counting', 'colors', 'shapes'].find(id => F.GAMES[id]) || Object.keys(F.GAMES)[0]; });
  await panel('game-frame', [['layer', '.gl'], ['head', '.gl .gl-head'], ['guidance line', '.gl .gl-help'], ['stage', '.gl .gl-stage']], () => G(id => { window.__sv.playGame(0, id, 'hub'); }, gameId), [
    ['tap answer 1', '.gl .gl-stage button >> nth=0'], ['tap answer 2', '.gl .gl-stage button >> nth=1'], ['tap answer 3', '.gl .gl-stage button >> nth=2'], ['tap answer 1 again', '.gl .gl-stage button >> nth=0']], { waitFor: '.gl:not(.out)' });
  if (R.panels['game-frame']) R.panels['game-frame'].game = gameId;
  await reset();
  // (r79 learning) SV_GAMES=sayfind,marketcount sweeps those games' screens too: three taps, then a wrong-answer explanation
  for (const id of (process.env.SV_GAMES || '').split(',').filter(Boolean)) {
    await panel('game-' + id, [['layer', '.gl'], ['head', '.gl .gl-head'], ['guidance line', '.gl .gl-help'], ['stage', '.gl .gl-stage']], () => G(id => { window.__sv.playGame(0, id, 'hub'); }, id), [
      ['tap 1', '.gl .gl-stage button >> nth=0'], ['tap 2', '.gl .gl-stage button >> nth=1'], ['tap 3', '.gl .gl-stage button >> nth=2'], ['tap 4', '.gl .gl-stage button >> nth=3'], ['hear again', '.gl .bt-repeat']], { waitFor: '.gl:not(.out)' });
    await reset();
  }
  // ---------- How to play ----------
  await panel('how-to-play', [['film', '.howto .ht-film'], ['controls', '.howto .ht-ctl'], ['words', '.howto .ht-cap'], ['close', '.howto .ht-x']], () => G(async id => { (await import('/js/howto.js')).openHowTo(id, {}); }, gameId), [
    ['next', '.howto .ht-next'], ['next 2', '.howto .ht-next'], ['pause', '.howto .ht-pp'], ['play', '.howto .ht-pp'], ['back', '.howto .ht-prev'], ['next 3', '.howto .ht-next']]);
  await reset();
  // ---------- a story film ----------
  const tale = await G(() => (window.__sv.TALES || [])[0]?.id || null);
  await panel('story-film', [['top bar', '.theatre .th-top'], ['picture', '.theatre .th-stage'], ['words', '.theatre .th-text'], ['buttons', '.theatre .th-bar']], () => G(async () => { const { openTheatre } = await import('/js/tales.js'); window.__sv.paused = true; openTheatre(window.__sv.TALES[0], {}); }), [
    ['next page', '.theatre .th-next'], ['next page 2', '.theatre .th-next'], ['pause', '.theatre .th-pause'], ['back', '.theatre .th-prev'], ['next page 3', '.theatre .th-next']]);
  if (R.panels['story-film']) R.panels['story-film'].tale = tale;
  await reset();
  // ---------- the update notice ----------
  await panel('update-notice', [['notice', '.update-notice']], () => G(() => { window.svOfferUpdate && window.svOfferUpdate(); }), []);
  await reset();
  await ctx.close();

  // ---------- the ladybird tester panel (a tester device: its own window) ----------
  {
    const ctx2 = await b.newContext({ viewport: { width: w, height: h }, hasTouch: touch, isMobile: touch, deviceScaleFactor: 1 });
    const pg = await ctx2.newPage(); pg.on('dialog', d => d.accept().catch(() => { }));
    await pg.addInitScript(s => { try { const o = JSON.parse(localStorage.getItem('sv2_settings') || '{}'); Object.assign(o, s, { familyMsgDay: new Date().toDateString() }); localStorage.setItem('sv2_settings', JSON.stringify(o)); } catch (e) { } }, { lang: 'en', voice: false, sound: false, music: false, quality: 'low', autoPack: false, online: true });
    await pg.addInitScript(seedPlayers); await pg.addInitScript(SAMPLER);
    await pg.addInitScript(`try { localStorage.setItem('sv2_playerid', 'tester000001'); localStorage.setItem('sv2_live', JSON.stringify({ releases: { tester: { on: true, devices: ['tester000001'] } }, festivals: {} })); localStorage.setItem('sv2_tester', JSON.stringify({ at: 1, b: 'r1' })); } catch (e) { }`);
    await ctx2.route('**/api/tester**', async rt => rt.request().method() === 'POST' ? rt.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ok: true, k: '0123456789abcdef', rid: 'fedcba9876543210', status: 'new' }) }) : rt.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ mine: [], open: [], retest: [], helped: 0, reports: 0 }) }));
    await pg.goto(GAME_URL); await pg.waitForSelector('.screen.title', { timeout: 90000 });
    await pg.evaluate(() => { const r = window.__sv.renderer; if (r) { r.setPixelRatio(.35); dispatchEvent(new Event('resize')); } });
    await start(pg);
    const lb = await pg.waitForFunction(() => window.__sv.tester && document.querySelector('.tester-floating.z-lb'), null, { timeout: 20000 }).then(() => true).catch(() => false);
    await pg.evaluate(() => { document.querySelectorAll('.storybook, .dialog, .modal, .vc-pop, .reward').forEach(e => e.remove()); window.__sv.paused = false; });
    await testerPanel(pg, lb);
    await ctx2.close();
  }
  async function testerPanel(pg, lb) {
    const P = R.panels['ladybird-tester'] = { shell: '.modal.tpanel .card', opened: false, actions: [] };
    if (!lb) { P.notOpened = 'no ladybird button (.tester-floating.z-lb) appeared within 20 s on a tester device'; save(); return; }
    const parts = [['card', '.modal.tpanel .card']];
    try {
      await pg.evaluate(sels => window.__stStart(sels), parts);
      const l = pg.locator('.tester-floating.z-lb').first(); await l.click();
      const ok = await pg.waitForSelector('.modal.tpanel .card', { timeout: 20000 }).then(() => true).catch(() => false);
      if (!ok) { await pg.evaluate(() => window.__stStop()); P.notOpened = 'the panel did not open within 20 s of a tap on the ladybird'; save(); return; }
      P.opened = true;
      const appearedAt = await pg.evaluate(() => { const s = window.__st.samples.find(x => x.r.card); return s ? s.t : Math.round(performance.now() - window.__st.t0); });
      await pg.waitForTimeout(700); const early = await pg.screenshot().catch(() => null); await pg.waitForTimeout(OPEN_WATCH - 700);
      const samples = await pg.evaluate(() => window.__stStop());
      const base = samples.find(s => s.t >= appearedAt + OPEN_SETTLE && s.r.card) || samples[samples.length - 1];
      const d = diff(samples, base, base.t); P.open = { appearedAtMs: appearedAt, baselineAtMs: base.t, samples: samples.length, ...d };
      const sh = async n => { const f = `${dev}-${String(++shotN).padStart(3, '0')}-${n.replace(/[^a-z0-9]+/gi, '-')}.png`; await pg.screenshot({ path: path.join(out, f) }).catch(() => { }); return f; };
      if (d.moved) { const f = `${dev}-${String(++shotN).padStart(3, '0')}-ladybird-open-at-700ms.png`; if (early) fs.writeFileSync(path.join(out, f), early); P.open.shots = [f, await sh('ladybird-open-at-2500ms')]; } else P.open.shot = await sh('ladybird-open');
      save();
      const kinds = await pg.evaluate(() => [...document.querySelectorAll('.modal.tpanel .tp-k')].map(b => b.dataset.k));
      const acts = [...kinds.map(k => [`kind ${k}`, `.modal.tpanel .tp-k[data-k="${k}"]`]), ['type a note', async () => { await pg.locator('.modal.tpanel textarea').fill('The window moved when I tapped. '.repeat(4)); }],
        ['picture: scene only', '.modal.tpanel .tp-full'], ['picture: whole interface', '.modal.tpanel .tp-full'],
        ['Auto play tab', '.modal.tpanel [data-test-tab="autoplay"]'], ['wait in Auto play', async () => { }], ['Tester tab', '.modal.tpanel [data-test-tab="tester"]'], ['Auto play tab again', '.modal.tpanel [data-test-tab="autoplay"]']];
      for (const [label, act] of acts) {
        const A = { action: label };
        try {
          let loc = null; if (typeof act === 'string') { loc = pg.locator(act).first(); if (!(await loc.count())) { A.skipped = 'not on screen: ' + act; P.actions.push(A); continue; } await loc.scrollIntoViewIfNeeded({ timeout: 3000 }).catch(() => { }); await pg.waitForTimeout(250); }
          const before = await pg.screenshot().catch(() => null);
          await pg.evaluate(sels => window.__stStart(sels), parts);
          if (loc) await loc.click({ force: true, timeout: 5000 }); else await act();
          await pg.waitForTimeout(ACT_WATCH);
          const s2 = await pg.evaluate(() => window.__stStop()); Object.assign(A, diff(s2, s2[0], 0));
          if (A.moved) { const f = `${dev}-${String(++shotN).padStart(3, '0')}-ladybird-before-${label.replace(/[^a-z0-9]+/gi, '-')}.png`; if (before) fs.writeFileSync(path.join(out, f), before); A.shots = [f, await sh(`ladybird-after-${label}`)]; }
          if (label === 'Auto play tab') A.autoplayShot = await sh('ladybird-autoplay-tab');
        } catch (e) { A.error = String(e.message || e).slice(0, 200); await pg.evaluate(() => window.__stStop()).catch(() => { }); }
        P.actions.push(A); save();
      }
    } catch (e) { P.error = String(e.message || e).slice(0, 300); if (!P.opened) P.notOpened = P.error; }
    save();
  }
}

const b = await launch();
try { for (const dev of want) { try { await sweepDevice(b, dev); } catch (e) { (results.devices[dev] = results.devices[dev] || {}).fatal = String(e.stack || e).slice(0, 600); save(); } } }
finally { await b.close(); save(); }
// a short table on the terminal
for (const [dev, D] of Object.entries(results.devices)) {
  console.log(`\n== ${dev}  startup: welcome ${D.startup?.welcomeFirstNonWhiteFrameMs} ms, FCP ${D.startup?.firstContentfulPaintMs} ms, world ready ${D.startup?.worldReadyMs} ms` + (D.fatal ? '  FATAL ' + D.fatal.slice(0, 200) : ''));
  for (const [k, P] of Object.entries(D.panels || {})) {
    if (!P.opened) { console.log(`${k}: NOT OPENED (${P.notOpened || P.error})`); continue; }
    const mv = [];
    if (P.open?.moved) mv.push('opening: ' + Object.entries(P.open.parts).filter(([, x]) => x.moved).map(([n, x]) => `${n} ${JSON.stringify(x.maxChange)}`).join('; '));
    for (const A of P.actions) if (A.moved) mv.push(`${A.action}: ` + Object.entries(A.parts).filter(([, x]) => x.moved).map(([n, x]) => `${n} ${JSON.stringify(x.maxChange)}${x.gone ? ' (gone)' : ''}`).join('; '));
    const sk = P.actions.filter(a => a.skipped || a.error).length;
    console.log(`${k}: ${mv.length ? 'MOVED  ' + mv.join(' | ') : 'STEADY'}  (${P.actions.length} taps, ${sk} skipped/errored)`);
  }
  if (D.bagIcons) console.log(`bag icons: ${D.bagIcons.count} items, median ${D.bagIcons.medianPx}px, tiny: ${(D.bagIcons.tiny || []).map(i => `${i.label} ${i.size}px`).join(', ')}`);
}
