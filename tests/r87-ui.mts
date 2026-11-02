import fs from 'node:fs';
import path from 'node:path';
import type { Browser } from 'playwright';
import { open, clear, noWelcome } from './harness.mts';
import { fakeGitHub, routeGitHub, fakeNetlify, memoryBlobs } from './studio-check.mjs';

export async function r87UiCheck(browser: Browser): Promise<string> {
  const out = process.env.SV_R87_SHOTS || 'out/r87-ui', bad: string[] = [];
  fs.mkdirSync(out, { recursive: true });
  const P = await open(browser, { w: 390, h: 844, touch: true });
  try {
    await clear(P.page); await noWelcome(P.page);
    const early = await P.page.evaluate(() => performance.getEntriesByType('resource').map(e => new URL(e.name).pathname).filter(p => /\/(?:chat-player|howto-data|howto-player|ui-settings)\.js$/.test(p)));
    if (early.length) bad.push('Optional chat/film content fetched during startup: ' + early.join(', '));
    await P.ctx.route('**/photos/index.json*', r => r.fulfill({ contentType: 'application/json', body: JSON.stringify({ 'r87-fixture': [{ url: 'https://thumb.wikimedia.org/r87-fixture.png', credit: 'Fixture author / CC0', caption: 'A test photo' }] }) }));
    await P.ctx.route('https://thumb.wikimedia.org/r87-fixture.png', r => r.fulfill({ contentType: 'image/png', body: Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+a1xkAAAAASUVORK5CYII=', 'base64') }));
    for (const lang of ['en', 'vi']) for (const [kind, width, height] of [['phone', 390, 844], ['tablet', 820, 1180], ['computer', 1280, 800]] as const) {
      await P.page.setViewportSize({ width, height });
      await P.page.evaluate(async lang => { const S = await import('../js/state.js'); S.settings.lang = lang; }, lang);
      await P.page.evaluate(async () => { const bar = document.createElement('div'); bar.className = 'packbar'; bar.textContent = 'Getting the voices ready… 45%'; document.body.append(bar); (await import('../js/realworld.js')).openPhotos('Fixture', ['r87 fixture']); });
      await P.page.waitForSelector('.rv-credit');
      const photo = await P.page.evaluate(() => { const credit = document.querySelector('.rv-credit').getBoundingClientRect(), viewer = getComputedStyle(document.querySelector('.realview')), bar = getComputedStyle(document.querySelector('.packbar')); return { inside: credit.top >= 0 && credit.bottom <= innerHeight, behind: +bar.opacity < .05 || +bar.zIndex < +viewer.zIndex }; });
      if (!photo.inside || !photo.behind) bad.push(`${kind}/${lang}: voice bar obscures photo credit ${JSON.stringify(photo)}`);
      await P.page.screenshot({ animations: 'disabled', path: path.join(out, `${kind}-${lang}-photo.png`) });
      await P.page.locator('.rv-x').click(); await P.page.waitForSelector('.realview', { state: 'detached' });
      await P.page.evaluate(() => document.querySelectorAll('.packbar').forEach(e => e.remove()));
      await P.page.evaluate(async () => { await import('../js/games/vietnam.js'); void window.__sv.playGame(0, 'oanquan', 'replay'); });
      await P.page.waitForSelector('.oaq-row.bot .oaq-c');
      const pits = await P.page.locator('.oaq-c').evaluateAll(nodes => nodes.map(n => { const r = n.getBoundingClientRect(); return { w: r.width, h: r.height }; }));
      if (pits.some(r => r.w < 63.5 || r.h < 63.5)) bad.push(`${kind}/${lang}: under-5 pit below 64 px: ${JSON.stringify(pits)}`);
      await P.page.locator('.oaq-row.bot .oaq-c').first().click(); await P.page.waitForSelector('.oaq-arrows button');
      const arrows = await P.page.locator('.oaq-arrows button').evaluateAll(nodes => nodes.map(n => { const r = n.getBoundingClientRect(); return { w: r.width, h: r.height }; }));
      if (arrows.some(r => r.w < 63.5 || r.h < 63.5)) bad.push(`${kind}/${lang}: under-5 direction below 64 px: ${JSON.stringify(arrows)}`);
      await P.page.screenshot({ animations: 'disabled', path: path.join(out, `${kind}-${lang}-oanquan.png`) });
      await P.page.locator('.gl-x').click(); await P.page.waitForSelector('.gl', { state: 'detached' });
    }
    await P.page.evaluate(async () => { (await import('../js/state.js')).settings.lang = 'en'; await (await import('../js/chat.js')).openChat(window.__sv, 0, 'teo', () => {}, 'how do i play ô ăn quan'); });
    await P.page.waitForSelector('.cb-msg.them');
    const reply = await P.page.locator('.cb-log').textContent();
    if (!reply?.includes('drop one seed')) bad.push('Deferred offline chat did not load the actual game instructions: ' + reply);
    await P.page.locator('.cb-x').click();
    await P.page.evaluate(async () => { await (await import('../js/howto.js')).openHowTo('oanquan'); });
    await P.page.waitForSelector('.howto'); await P.page.locator('.ht-x').click();
    if (P.errors.length) bad.push(...P.errors);
  } finally { await P.ctx.close(); }
  const repo = 'family/r87-fixture', password = 'r87-synthetic-password', site = 'http://localhost:8798';
  const gh = fakeGitHub(repo, { 'content/custom.json': '{}', 'js/build.js': fs.readFileSync('../js/build.js') }), unroute = routeGitHub(gh);
  const server = await fakeNetlify({ port: 8798, players: memoryBlobs(), env: { STUDIO_PASSWORD: password, GITHUB_TOKEN: 'fixture-token', GITHUB_REPO: repo, URL: site } });
  try {
    for (const lang of ['en', 'vi']) for (const mode of ['online', 'exe-live', 'local']) {
      const live = mode !== 'local';
      const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
      try {
        const page = await ctx.newPage(); await page.addInitScript(lang => localStorage.setItem('studioLang', lang), lang);
        if (mode !== 'online') await ctx.route('**/studio/api/info', async route => { const response = await route.fetch(), info = await response.json(); await route.fulfill({json:{...info,online:false,conf:{...info.conf,players:live?'https://family.example.test':null}}}); });
        await page.goto(site + '/studio'); await page.fill('#pw', password); await page.click('#si button'); await page.waitForSelector('#tabs button');
        for (const section of ['stories', 'home', 'publish']) {
          await page.evaluate(section => { location.hash = section; }, section); await page.waitForSelector('#page .studio-help'); await page.waitForTimeout(200);
          const text = await page.locator('#page').textContent();
          const misleading = lang === 'en' ? /Changes you save here wait in a draft|Everything you save here online waits in a draft|nothing reaches the children until you press Publish/ : /Thay đổi bạn lưu ở đây chờ trong bản nháp|Mọi thứ bạn lưu ở đây trên mạng nằm chờ trong bản nháp|các con chưa thấy gì cho đến khi bạn bấm Phát hành/;
          if (live && (misleading.test(text || '') || /Nothing goes online until you publish|children see changes after you Publish|Chưa có gì lên mạng cho tới khi bạn phát hành|các con thấy thay đổi sau khi bạn Phát hành/.test(text || ''))) bad.push(`Studio ${mode}/${section}/${lang}: live save described as waiting for Publish`);
          if (section === 'stories' && !(await page.locator(`.livebadge[data-live="${live ? 1 : 0}"]`).count())) bad.push(`Studio stories/${lang}: missing live badge`);
          await page.screenshot({ animations: 'disabled', path: path.join(out, `studio-${mode}-${section}-${lang}.png`) });
        }
      } finally { await ctx.close(); }
    }
  } finally { unroute(); server.close(); }
  fs.writeFileSync(path.join(out, 'results.json'), JSON.stringify({ bad }, null, 2));
  if (bad.length) throw Error(bad.join(' | '));
  return 'EN/VI phone/tablet/computer: photo credits clear, 64 px Ô Ăn Quan targets; Studio live-save help agrees with its live badge';
}
