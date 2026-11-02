// (r89, owner 23 Oct AEDT; docs/website-review-20261023/RELEASE-HANDOFF.md checks 3 to 5) the family website:
// 1. Welcome: the Website button opens the website floating over the Welcome screen, in the game's language, without
//    starting the game; Close, Escape (inside the website and on the game's page) and Back to game each close it once,
//    the focus comes back to the button, and no second window is ever left behind after repeated opens.
// 2. The frame can only ask to close: a message from another window, or any other request, leaves it open.
// 3. During play the corner Home button is gone; Settings has Website, which floats over Settings (still open, the game
//    still paused) and comes back to it with the focus on the button, the child where they were, no new tab.
// 4. The website page itself: no review-only controls, Play goes to the game; inside the game it shows Close.
// 5. The goal row: on every layout it sits clear of the player card, the buttons under it, the companion row and the map,
//    and on phones it sits higher than before (the space the Home button left), with Go and the goal text still shown.
import type { Browser, Page, Frame } from 'playwright';
import { open, clear } from './harness.mts';

type Box = { x: number; y: number; w: number; h: number };

async function siteFrame(page: Page): Promise<Frame> {
  await page.waitForSelector('.modal.website.loaded', { timeout: 30000 });
  const f = page.frames().find(x => x.url().includes('/home/?embed=1'));
  if (!f) throw Error('the website frame did not load');
  await f.waitForSelector('#close-site', { state: 'visible', timeout: 15000 });
  return f;
}
const openCount = (page: Page) => page.evaluate(() => document.querySelectorAll('.modal.website:not(.out)').length);
const gone = (page: Page) => page.waitForFunction(() => !document.querySelector('.modal.website'), undefined, { timeout: 5000 });

export async function websiteCheck(browser: Browser): Promise<string> {
  const notes: string[] = [];
  // 1 and 2: the Welcome screen, in Vietnamese on a computer
  {
    const P = await open(browser, { w: 1280, h: 800, lang: 'vi', play: false });
    try {
      const btn = await P.page.evaluate(() => { const b = document.querySelector('.screen.title .sitebtn'); const r = b?.getBoundingClientRect(); return b && r ? { text: b.textContent?.trim(), w: r.width, h: r.height } : null; });
      if (!btn || btn.text !== 'Trang web' || btn.w < 44 || btn.h < 44) throw Error('Welcome: no Website button of 44 px with its Vietnamese name: ' + JSON.stringify(btn));
      for (const how of ['close', 'escape-frame', 'escape-page', 'play'] as const) {
        await P.page.click('.screen.title .sitebtn');
        const f = await siteFrame(P.page);
        if (!f.url().includes('lang=vi')) throw Error('the website did not open in the game language: ' + f.url());
        if (await openCount(P.page) !== 1) throw Error('more than one website window is open');
        if (how === 'close') await f.click('#close-site');
        else if (how === 'escape-frame') { await f.focus('#close-site'); await P.page.keyboard.press('Escape'); }
        else if (how === 'escape-page') { await P.page.evaluate(() => document.querySelector<HTMLElement>('.modal.website .card')?.focus()); await P.page.evaluate(() => dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', code: 'Escape', bubbles: true }))); }
        else await f.click('.hero-actions [data-action=play]');
        await gone(P.page);
        const st = await P.page.evaluate(() => ({ title: !!document.querySelector('.screen.title'), who: !!document.querySelector('.screen.who'), focus: document.activeElement?.className || '' }));
        if (!st.title || st.who) throw Error(`Welcome: closing the website (${how}) started the game`);
        if (st.focus !== 'sitebtn') throw Error(`Welcome: the focus did not come back to Website after ${how}: ${st.focus}`);
      }
      // 2. only the website frame may ask, and only to close
      await P.page.click('.screen.title .sitebtn'); const f = await siteFrame(P.page);
      await P.page.evaluate(() => postMessage({ sv: 'website', do: 'close' }, location.origin));
      await f.evaluate(() => { parent.postMessage({ sv: 'website', do: 'reward', coins: 99 }, location.origin); parent.postMessage('close', location.origin); });
      await P.page.waitForTimeout(400);
      if (await openCount(P.page) !== 1) throw Error('the website closed on a message that was not its own close request');
      await f.click('#close-site'); await gone(P.page);
      const listens = await P.page.evaluate(() => document.querySelectorAll('iframe.site-frame').length);
      if (listens) throw Error('a website frame was left behind after closing');
      if (P.errors.length) throw Error('Welcome: page errors: ' + P.errors.slice(0, 3).join(' | '));
      notes.push('Welcome (computer, Vietnamese): Website opens the website in Vietnamese without starting the game; Close, Escape in the website, Escape on the page and Back to game each close it, the focus back on Website; messages from another window or asking anything else are ignored');
    } finally { await P.ctx.close(); }
  }
  // 3. during play on a phone: Settings → Website
  {
    const P = await open(browser, { w: 390, h: 844, touch: true });
    try {
      await clear(P.page); await P.page.waitForTimeout(600);
      if (await P.page.$('.hud .homebtn')) throw Error('the corner Home button is still in the game');
      const before = await P.page.evaluate(() => { const h = window.__sv.heroes[0]; return { x: h.pos.x, z: h.pos.z, quest: document.querySelector('.hud .q-text')?.textContent || '' }; });
      await P.page.click('.hud .pcard .pav');
      await P.page.waitForSelector('.modal.qsettings #qSite', { timeout: 10000 });
      const row = await P.page.evaluate(() => { const r = document.querySelector('#qSite')!.getBoundingClientRect(); return { w: r.width, h: r.height }; });
      if (row.h < 64) throw Error('Settings: the Website row is smaller than 64 px: ' + JSON.stringify(row));
      for (let k = 0; k < 3; k++) {
        await P.page.click('#qSite');
        const f = await siteFrame(P.page);
        const st = await P.page.evaluate(() => ({ paused: window.__sv.paused, settings: !!document.querySelector('.modal.qsettings:not(.out)') }));
        if (!st.paused || !st.settings) throw Error('Settings: the game was not paused under the website, or Settings closed: ' + JSON.stringify(st));
        if (k === 0) {
          const site = await f.evaluate(() => ({ demo: !!document.querySelector('.demo-bar, #game-stage, [data-mode-button]'), mode: document.body.dataset.mode, label: document.querySelector('.hero-actions .play-label')?.textContent || '' }));
          if (site.demo || site.mode !== 'embedded' || !/Back to game/.test(site.label)) throw Error('the website inside the game is not the embedded page: ' + JSON.stringify(site));
        }
        await (k === 1 ? f.click('.hero-actions [data-action=play]') : f.click('#close-site'));
        await gone(P.page);
        const back = await P.page.evaluate(() => ({ focus: document.activeElement?.id || '', settings: !!document.querySelector('.modal.qsettings:not(.out)') }));
        if (back.focus !== 'qSite' || !back.settings) throw Error('Settings: closing the website did not come back to Settings and Website: ' + JSON.stringify(back));
      }
      await P.page.click('.modal.qsettings #qDone'); await P.page.waitForTimeout(400);
      const after = await P.page.evaluate(() => { const h = window.__sv.heroes[0]; return { x: h.pos.x, z: h.pos.z, quest: document.querySelector('.hud .q-text')?.textContent || '', paused: window.__sv.paused }; });
      if (Math.hypot(after.x - before.x, after.z - before.z) > .5 || after.quest !== before.quest || after.paused) throw Error('play changed behind the website: ' + JSON.stringify({ before, after }));
      if (P.ctx.pages().length !== 1) throw Error('the website opened a new tab');
      if (P.errors.length) throw Error('Settings: page errors: ' + P.errors.slice(0, 3).join(' | '));
      notes.push('phone: no Home button in the corner; Settings → Website (64 px) floats over Settings three times, the game paused, Close and Back to game come back to Settings with the focus on Website; the child, the goal and the tab unchanged');
    } finally { await P.ctx.close(); }
  }
  // 4. the website on its own: Play enters the game; no Close button
  {
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true }), page = await ctx.newPage(), errors: string[] = [];
    page.on('pageerror', e => errors.push(e.message)); const P = { ctx, page };
    try {
      await page.goto('http://localhost:8765/home/'); await page.waitForSelector('.hero-actions [data-action=play]');
      const st = await P.page.evaluate(() => ({ demo: !!document.querySelector('.demo-bar, #game-stage, [data-mode-button]'), close: getComputedStyle(document.querySelector('#close-site')!).display, mode: document.body.dataset.mode, wide: document.documentElement.scrollWidth <= innerWidth + 1 }));
      if (st.demo || st.close !== 'none' || st.mode !== 'website' || !st.wide) throw Error('the website on its own: ' + JSON.stringify(st));
      await P.page.click('.hero-actions [data-action=play]'); await P.page.waitForURL(u => new URL(u.toString()).pathname === '/', { timeout: 15000 });
      if (errors.length) throw Error('the website on its own: page errors: ' + errors.slice(0, 3).join(' | '));
      notes.push('the website on its own (phone): no review controls, no Close, no sideways scrolling, Play goes to the game');
    } finally { await P.ctx.close(); }
  }
  // 5. the goal row on every layout, before and after folding, with and without the companion row
  const rows: string[] = [], bad: string[] = [];
  for (const [name, w, h, touch, mode, lang] of [['phone', 390, 844, true, 'solo', 'en'], ['narrow', 320, 640, true, 'solo', 'vi'], ['landscape', 844, 390, true, 'solo', 'en'], ['tablet', 820, 1180, true, 'solo', 'vi'], ['computer', 1280, 800, false, 'solo', 'en'], ['two', 1280, 800, false, 'split', 'en'], ['face', 820, 1180, true, 'split', 'vi']] as const) {
    const P = await open(browser, { w, h, touch, mode, lang, settings: mode === 'split' ? { twoView: name === 'face' ? 'face' : 'side' } : {} });
    try {
      await clear(P.page); await P.page.waitForTimeout(700);
      const r = await P.page.evaluate(async () => {
        const wait = (ms: number) => new Promise(res => setTimeout(res, ms)), out: { case: string, quest: Box, hit: string[], go: boolean, text: boolean }[] = [];
        let top0 = 0;
        const box = (e: Element | null): Box => { const b = e?.getBoundingClientRect(); return b && b.width ? { x: b.x, y: b.y, w: b.width, h: b.height } : { x: 0, y: 0, w: 0, h: 0 }; };
        const ov = (a: Box, b: Box) => a.w > 0 && b.w > 0 && a.x < b.x + b.w - 1 && b.x < a.x + a.w - 1 && a.y < b.y + b.h - 1 && b.y < a.y + a.h - 1;
        for (const kid of [false, true]) for (const fold of [false, true]) {
          for (const [k, root] of [...document.querySelectorAll<HTMLElement>('.hud')].entries()) {
            const kidrow = root.querySelector('.kidrow');
            if (kidrow) kidrow.innerHTML = kid ? '<button style="width:52px;height:48px">A</button><button style="width:52px;height:48px">B</button>' : '';
            if (root.querySelector('.quest')?.classList.contains('fold') !== fold) root.querySelector<HTMLElement>('.q-say')?.click();
            await wait(350);
            const q = box(root.querySelector('.quest')), hit: string[] = [];
            if (!k && !kid && !fold) top0 = q.y - root.getBoundingClientRect().y;
            for (const sel of ['.pcard', '.chips', '.hud-btns', '.kidrow', '.hud-tr', '.mini-wrap']) for (const e of root.querySelectorAll(sel)) if (ov(q, box(e))) hit.push(sel);
            const go = root.querySelector('.q-go'), text = root.querySelector('.q-text');
            out.push({ case: `p${k + 1}${kid ? ' companion' : ''}${fold ? ' folded' : ''}`, quest: q, hit, go: fold || !!(go instanceof HTMLElement && go.offsetWidth), text: fold || !!(text instanceof HTMLElement && text.offsetWidth) });
          }
        }
        return { out, top: Math.round(top0) };
      });
      for (const c of r.out) if (c.hit.length || !c.go || !c.text) bad.push(`${name} ${c.case}: ${c.hit.length ? 'over ' + c.hit.join(',') : ''}${c.go ? '' : ' no Go'}${c.text ? '' : ' no goal text'}`);
      rows.push(`${name} ${r.top}px`);
      if (P.errors.length) bad.push(`${name}: page errors: ${P.errors.slice(0, 2).join(' | ')}`);
    } finally { await P.ctx.close(); }
  }
  if (bad.length) throw Error('the goal row: ' + bad.join('; '));
  notes.push(`the goal row clear of the player card, buttons, companion row and map, folded and open, with and without companions, Go and the goal shown when open (top: ${rows.join(', ')})`);
  return notes.join('. ');
}
