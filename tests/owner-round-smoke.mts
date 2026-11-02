// Behaviour smoke checks for the combined owner round. Run sequentially after the suite, with the game server.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import { launch, open, clear } from './harness.mts';
const browser = await launch(); fs.mkdirSync('out/owner-round', { recursive: true });
const results = [];
try {
  for (const [w, h, touch, lang] of [[390,844,true,'en'],[390,844,true,'vi'],[820,1180,true,'en'],[1280,800,false,'en'],[844,390,true,'en'],[844,390,true,'vi']]) {
    // (owner, 16 Oct AEDT) family devices is a Studio trial, off by default: switched on here, as Studio would, to check its layout
    const route = ctx => ctx.route('**/content/custom.json*', async r => { let j = {}; try { j = await (await r.fetch()).json(); } catch (e) { } j.features = { ...(j.features || {}), familyDevices: true }; await r.fulfill({ contentType: 'application/json', body: JSON.stringify(j) }); });
    const P = await open(browser, { w, h, touch, lang, route }); const { page } = P; await clear(page);
    await page.evaluate(() => window.__sv.openPad(0, 'shop')); await page.waitForSelector('.pad .shop-content');
    assert.equal(await page.locator('.modal.pad').count(), 1); assert.equal(await page.locator('.modal.shopk').count(), 0);
    assert.equal(await page.locator('.shop-collections button').count(), 3);
    await page.click('.pad [data-go="wardrobe"]'); await page.waitForSelector('.pad .wardrobe-content');
    assert.equal(await page.locator('.pad .mirror .wbig').count(), 1); // (r79: the mirror shows one big picture of the child) await page.screenshot({ path: `out/owner-round/mirror-${w}-${lang}.png` });
    await page.click('.pad .whead .x'); await page.click('.pad [data-t="bag"]');
    await page.evaluate(async () => { const S = await import('/js/state.js'); S.profiles[0].dishes = { ...(S.profiles[0].dishes || {}), steamedrice: 1 }; });
    const sizes = await page.locator('.pad .slot > svg').evaluateAll(nodes => nodes.map(n => { const r = n.getBoundingClientRect(); return [r.width,r.height]; }));
    assert.ok(sizes.every(([x,y]) => x >= 48 && y >= 48), JSON.stringify(sizes));
    const bagAction = page.locator('.pad [data-wear], .pad [data-unwear], .pad [data-hat]').first();
    if (await bagAction.count()) { await bagAction.click(); await page.waitForSelector('.bag-help'); await page.screenshot({ path: `out/owner-round/bag-${w}-${lang}.png` }); await page.click('.bh-close'); }
    await page.click('.pad-head .x'); await page.waitForTimeout(250);
    await page.click('.hud .dk.snd'); await page.waitForSelector('.audio-tray'); await page.screenshot({ path: `out/owner-round/audio-${w}-${lang}.png` }); await page.keyboard.press('Escape');
    const compass = await page.locator('.hud .z-where').isVisible(); assert.equal(compass, false);
    if (touch && w <= 700 && h > 520) {
      const hint = await page.evaluate(() => { const G=window.__sv; G.huds[0].toast('A special surprise is nearby. Touch it gently when you find it.'); const a=document.querySelector('.hud .htoast').getBoundingClientRect(), b=document.querySelector('.hud .moves').getBoundingClientRect(); return { hint:{top:a.top,bottom:a.bottom,left:a.left,right:a.right}, moves:{top:b.top,bottom:b.bottom,left:b.left,right:b.right} }; });
      assert.ok(hint.hint.bottom < hint.moves.top, JSON.stringify(hint)); await page.screenshot({path:`out/owner-round/hint-${w}-${lang}.png`});
    }
    await page.evaluate(() => window.__sv.openGamesHub(0)); await page.waitForSelector('.hubbody');
    await page.locator('.hplay').first().click(); await page.waitForSelector('.gl', { timeout: 60000 }); await page.click('.gl-x');
    await page.waitForSelector('.hubbody'); assert.ok(await page.locator('.hubbody').isVisible());
    await page.locator('.modal.gameshub .x, .modal.playhub .x, .modal.hub .x').first().click().catch(async () => { await page.evaluate(() => { document.querySelectorAll('.modal').forEach(m => m.remove()); window.__sv.paused = false; }); });
    await page.evaluate(async () => { const U = await import('/js/ui.js'); U.openGrownups(); }); await page.waitForSelector('.grownups #gDone');
    await page.screenshot({ path: `out/owner-round/settings-${w}-${lang}.png` });
    assert.ok(await page.locator('.family-device-panel').count());
    const controls = await page.locator('.grownups #gDone').boundingBox(); assert.ok(controls.x >= 0 && controls.x + controls.width <= w && controls.y + controls.height <= h);
    const body=await page.locator('.grownups-body').boundingBox(); assert.ok(body.y+body.height<=controls.y,JSON.stringify({body,controls}));
    assert.equal(P.errors.length, 0, P.errors.join('\n'));
    results.push({ w,h,lang, passed:true }); await P.ctx.close();
  }
  for (const [w,h] of [[390,844],[844,390]]) {
    const Q = await open(browser,{w,h,touch:true,play:false}); await Q.page.click('.screen.title .press',{force:true}); await Q.page.waitForSelector('.screen.who');
    const a=await Q.page.locator('.who-card').boundingBox(); await Q.page.click('.modes [data-m="split"]'); const b=await Q.page.locator('.who-card').boundingBox(); assert.ok(Math.abs(a.y-b.y)<1 && Math.abs(a.height-b.height)<1,JSON.stringify({a,b}));
    const go=await Q.page.locator('.who .go').boundingBox(); assert.ok(go.y>=0 && go.y+go.height<=h,JSON.stringify(go)); await Q.page.screenshot({path:`out/owner-round/who-${w}.png`}); assert.deepEqual(Q.errors,[]); await Q.ctx.close(); results.push({who:w,passed:true});
  }
  const P = await open(browser, { w:390,h:844,touch:true }); await clear(P.page);
  const games = ['rulefinder','gardenorder','steppingpath','rd_listentouch','rd_storychoice'];
  await P.page.evaluate(async () => { await import('/js/games/readingmenu.js'); });
  for (const id of games) {
    await P.page.evaluate(id => { window.__sv.playGame(0,id,'place'); }, id); await P.page.waitForSelector('.gl');
    await P.page.evaluate(async () => {
      const { playWatch } = await import('/js/games/frame.js');
      const end = Date.now() + 30000;
      while (Date.now() < end && !document.querySelector('.gl-win')) { const ask = playWatch.ask; if (ask) { const right = ask.els.find(ask.check); right?.click(); } await new Promise(r => setTimeout(r,100)); }
    });
    assert.ok(await P.page.locator('.gl-win').count(), id + ' cannot complete'); await P.page.screenshot({ path:`out/owner-round/game-${id}.png` });
    await P.page.waitForTimeout(600); await P.page.locator('.gl-win p').first().click(); await P.page.waitForSelector('.gl', { state:'detached' }); await P.page.waitForTimeout(350); await clear(P.page); results.push({ game:id,passed:true });
  }
  assert.equal(P.errors.length,0,P.errors.join('\n')); await P.ctx.close();
} finally { await browser.close(); fs.writeFileSync('out/owner-round/results.json',JSON.stringify(results,null,2)); }
console.log(JSON.stringify(results));
