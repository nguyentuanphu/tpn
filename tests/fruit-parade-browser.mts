import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import { launch, open, clear, noWelcome } from './harness.mjs';

export async function checkParadeBrowser() {
  const out = new URL('../docs/v1.02-fruit-parade/shots/', import.meta.url);await fs.mkdir(out, { recursive: true });
  const browser = await launch();const observations: unknown[] = [];
  try {
    const P = await open(browser, { w: 390, h: 844, touch: true, lang: 'vi', settings: { countPlayers: false, online: false, calm: true }, route: async ctx => {
      await ctx.route('**/api/**', r => r.fulfill({ json: { releases: { tester: { on: false } } } }));
      await ctx.route('**/content/custom.json*', r => r.fulfill({ json: { releases: { tester: { on: false }, newGames: { on: true }, newStories: { on: true }, sparkleFruitParade_single: { on: true }, sparkleFruitParade_multi: { on: true }, sparkleFruitParade_tester: { on: true } } } }));
    } });
    await clear(P.page);await noWelcome(P.page);
    await P.page.evaluate(() => { void window.__sv.playGame(0, 'fruitparade', 'replay'); });
    await P.page.locator('[data-parade-action=solo]').waitFor();
    await P.page.screenshot({ path: new URL('phone-vi-choices.png', out).pathname });
    await P.page.locator('[data-parade-action=local]').click();
    await P.page.locator('.parade-player').nth(1).waitFor();
    await P.page.waitForTimeout(450);
    await P.page.screenshot({ path: new URL('phone-vi-local.png', out).pathname });
    const heights = await P.page.locator('.parade button').evaluateAll(buttons => buttons.map(button => button.getBoundingClientRect().height));
    assert.ok(heights.every(height => height >= 64), `64px controls: ${JSON.stringify(heights)}`);
    let rounds = 0;
    while (!await P.page.locator('.gl-win').count()) {
      if (++rounds > 4) throw new Error('Parade did not finish within bounded missions');
      const targets = await P.page.locator('.parade-lane').evaluateAll(lanes => lanes.map(lane => ({ seat: Number(lane.closest<HTMLElement>('[data-seat]')!.dataset.seat), lane: Number((lane as HTMLElement).dataset.lane), target: lane.querySelector<HTMLElement>('.parade-hint')!.dataset.target })));
      for (const target of targets) {
        const lane = P.page.locator(`.parade-player[data-seat="${target.seat}"] .parade-lane[data-lane="${target.lane}"]`);
        for (let n = 0; n < 10 && target.target && await lane.locator('.parade-window').getAttribute('data-symbol') !== target.target; n++) await lane.locator('[data-parade-action=change]').click();
        await lane.locator('[data-parade-action=stop]').click();
      }
      await P.page.locator('.parade-result').waitFor();
      assert.equal(await P.page.locator('.parade-result').getAttribute('data-success'), 'true');
      if (rounds === 1) await P.page.screenshot({ path: new URL('phone-vi-success.png', out).pathname });
      await P.page.locator('[data-parade-action=next]').click();
      await P.page.waitForTimeout(100);
    }
    await P.page.locator('.gl-win').click({position:{x:20,y:20}});await P.page.locator('.gl').waitFor({state:'detached'});
    await P.page.waitForFunction(() => window.__sv.heroes[0].profile.wins.fruitparade === 1);
    observations.push({ localCoopCompleted: true, rounds, controls: heights.length, progressSaved: true, errors: P.errors });
    await clear(P.page);
    await P.page.evaluate(() => { void window.__sv.playGame(0, 'trongnu', 'replay'); });
    await P.page.locator('[data-tn-jump]').waitFor();await P.page.waitForTimeout(450);
    await P.page.screenshot({path:new URL('phone-vi-trongnu.png',out).pathname});
    for(let i=0;i<4;i++){await P.page.locator('[data-tn-jump]').click();await P.page.waitForTimeout(500);}
    await P.page.locator('.gl-win').waitFor();
    observations.push({trongNuCompleted:true, errors:P.errors});
    await P.page.locator('.gl-win').click({position:{x:20,y:20}});await P.page.locator('.gl').waitFor({state:'detached'});
    for(const [device,w,h,touch] of [['phone',390,844,true],['tablet',820,1180,true],['computer',1280,800,false]])for(const lang of ['en','vi']){
      await P.page.setViewportSize({width:Number(w),height:Number(h)});
      await P.page.evaluate(async language=>{const S=await import('/js/state.js');S.settings.lang=language;const I=await import('/js/i18n.js');I.applyLang();},lang);
      await clear(P.page);
      await P.page.evaluate(()=>{void window.__sv.playGame(0,'fruitparade','replay');});await P.page.locator('[data-parade-action=local]').waitFor();
      await P.page.locator('[data-parade-action=local]').click();await P.page.locator('.parade-player').nth(1).waitFor();await P.page.waitForTimeout(450);
      await P.page.screenshot({path:new URL(`${device}-${lang}-local.png`,out).pathname});
      await P.page.locator('.gl .gl-x').click();await P.page.locator('.gl').waitFor({state:'detached'});
      await P.page.evaluate(()=>{void window.__sv.playGame(0,'trongnu','replay');});await P.page.locator('[data-tn-jump]').waitFor();await P.page.waitForTimeout(450);
      await P.page.screenshot({path:new URL(`${device}-${lang}-trongnu.png`,out).pathname});
      await P.page.locator('.gl .gl-x').click();await P.page.locator('.gl').waitFor({state:'detached'});
    }
    observations.push({bilingualDeviceCaptures:12});

    assert.deepEqual(P.errors, []);
    await P.ctx.close();
  } finally { await browser.close(); }
  await fs.writeFile(new URL('../docs/v1.02-fruit-parade/browser-results.json', import.meta.url), JSON.stringify(observations, null, 2));
  return observations;
}
console.log(JSON.stringify(await checkParadeBrowser()));
