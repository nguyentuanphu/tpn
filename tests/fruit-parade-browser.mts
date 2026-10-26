import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import { launch, open, clear, noWelcome } from './harness.mjs';
import type { createNetGames } from '../js/netgames.js';
declare global { interface Window { __paradeTestNet: ReturnType<typeof createNetGames>; __paradeConnected: boolean; __paradeSend(data: {from: string; [key: string]: unknown}): Promise<void>; __paradeButtons: boolean[]; } }

export async function checkParadeBrowser() {
  const out = new URL('../docs/v1.02-fruit-parade/shots/', import.meta.url);await fs.mkdir(out, { recursive: true });
  const capturesOnly = process.argv.includes('--captures-only');
  const browser = await launch();const observations: unknown[] = [];
  try {
    const P = await open(browser, { w: 390, h: 844, touch: true, lang: 'vi', settings: { countPlayers: false, online: false, calm: true }, route: async ctx => {
      await ctx.route('**/api/**', r => r.fulfill({ json: { releases: { tester: { on: false } } } }));
      await ctx.route('**/content/custom.json*', r => r.fulfill({ json: { releases: { tester: { on: false }, newGames: { on: true }, newStories: { on: true }, sparkleFruitParade_single: { on: true }, sparkleFruitParade_multi: { on: true }, sparkleFruitParade_tester: { on: true } } } }));
    } });
    await clear(P.page);await noWelcome(P.page);
    // Development localhost deliberately does not auto-register; exercise the real production worker explicitly.
    await P.page.evaluate(()=>navigator.serviceWorker.register('/sw.js'));
    await P.page.waitForFunction(()=>!!navigator.serviceWorker.controller,null,{timeout:60000});
    await P.page.waitForFunction(async()=>{const files=['fruitparade','fruitparade-engine','fruitparade-session','fruitparade-input','fruitparade-style','trongnu','trongnu-rules'];return(await Promise.all(files.map(file=>caches.match(new URL(`/js/games/${file}.js`,location.href))))).every(Boolean);},null,{timeout:60000});
    await P.ctx.setOffline(true);

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
    observations.push({trongNuCompleted:true,firstUseBothGamesOffline:true, errors:P.errors});
    await P.ctx.setOffline(false);
    await P.page.locator('.gl-win').click({position:{x:20,y:20}});await P.page.locator('.gl').waitFor({state:'detached'});
    await P.page.evaluate(async()=>{const S=await import('/js/state.js');S.settings.calm=false;void window.__sv.playGame(0,'trongnu','replay');});
    await P.page.locator('[data-tn-jump]').waitFor();await P.page.locator('[data-tn-jump]').click();await P.page.waitForTimeout(370);
    await P.page.screenshot({path:new URL('phone-vi-trongnu-jumping.png',out).pathname});
    const jumpVisible=await P.page.evaluate(()=>{const child=document.querySelector('.tn-jumper')!.getBoundingClientRect(),board=document.querySelector('.tn-picture')!.getBoundingClientRect();return child.top>=board.top&&child.left>=board.left&&child.right<=board.right;});
    assert.equal(jumpVisible,true,'jumper remains inside the enlarged illustration during the arc');
    await P.page.locator('.gl .gl-x').click();await P.page.locator('.gl').waitFor({state:'detached'});await P.page.evaluate(async()=>{const S=await import('/js/state.js');S.settings.calm=true;});
    observations.push({animatedJumperVisible:true});
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
    if(!capturesOnly){
    await P.page.setViewportSize({width:820,height:1180});
    await P.page.evaluate(()=>{void window.__sv.playGame(0,'fruitparade','replay');});await P.page.locator('[data-parade-action=npc]').waitFor();await P.page.locator('[data-parade-action=npc]').click();
    for(let round=0;round<2;round++){
      const targets=await P.page.locator('.parade-stop:not(:disabled)').evaluateAll(buttons=>buttons.map(button=>({seat:button.getAttribute('data-seat'),lane:button.getAttribute('data-lane'),target:button.parentElement!.querySelector<HTMLElement>('.parade-hint')!.dataset.target})));
      for(const target of targets){const lane=P.page.locator(`.parade-player[data-seat="${target.seat}"] .parade-lane[data-lane="${target.lane}"]`);
        for(let i=0;i<10&&target.target&&await lane.locator('.parade-window').getAttribute('data-symbol')!==target.target;i++)await lane.locator('[data-parade-action=change]').click();
        await lane.locator('[data-parade-action=stop]').click();}
      await P.page.locator('.parade-result').waitFor({timeout:25000});
      if(round===0)await P.page.screenshot({path:new URL('tablet-vi-npc-result.png',out).pathname});
      await P.page.locator('[data-parade-action=next]').click();
    }
    await P.page.locator('.gl-win').waitFor();observations.push({npcCompleted:true});
    await P.page.locator('.gl-win').click({position:{x:20,y:20}});await P.page.locator('.gl').waitFor({state:'detached'});
    // An actual keyboard event and a rising-edge controller button use the real scoped input adapter.
    await P.page.evaluate(()=>{void window.__sv.playGame(0,'fruitparade','replay');});await P.page.locator('[data-parade-action=solo]').waitFor();await P.page.locator('[data-parade-action=solo]').click();
    await P.page.keyboard.press('Digit1');await P.page.locator('.parade-lane[data-lane="0"].locked').waitFor();
    await P.page.evaluate(()=>{window.__paradeButtons=[];Object.defineProperty(navigator,'getGamepads',{configurable:true,value:()=>[{index:0,id:'Synthetic test controller',connected:true,mapping:'standard',timestamp:0,axes:[0,0,0,0],buttons:Array.from({length:16},(_,i)=>({pressed:!!window.__paradeButtons[i],touched:false,value:window.__paradeButtons[i]?1:0}))}]});window.__paradeButtons[2]=true;});
    await P.page.locator('.parade-lane[data-lane="1"].locked').waitFor();await P.page.evaluate(()=>{window.__paradeButtons[2]=false;});
    observations.push({keyboardStop:true,controllerStop:true});await P.page.locator('.gl .gl-x').click();await P.page.locator('.gl').waitFor({state:'detached'});
    const Q=await open(browser,{w:820,h:1180,lang:'en',touch:true,settings:{countPlayers:false,online:false,calm:true},route:async ctx=>{
      await ctx.route('**/api/**',r=>r.fulfill({json:{releases:{tester:{on:false}}}}));await ctx.route('**/content/custom.json*',r=>r.fulfill({json:{releases:{tester:{on:false},newGames:{on:true},sparkleFruitParade_single:{on:true},sparkleFruitParade_multi:{on:true}}}}));
    }});await clear(Q.page);await noWelcome(Q.page);
    await P.page.exposeFunction('__paradeSend',async packet=>{await Q.page.evaluate(data=>window.__paradeTestNet.receive(data),packet);});
    await Q.page.exposeFunction('__paradeSend',async packet=>{await P.page.evaluate(data=>window.__paradeTestNet.receive(data),packet);});
    for(const [index,dev]of [P,Q].entries())await dev.page.evaluate(async mine=>{
      const {createNetGames}=await import('/js/netgames.js');window.__paradeConnected=true;
      const id=mine===0?'host':'guest',other=mine===0?'guest':'host';
      const g=createNetGames({net:{ids:()=>[other],send:data=>{void window.__paradeSend({...data,from:id});}},me:()=>id,waitMs:1000,onAsk:data=>g.answer(data,true),onStart:s=>{
        if(!s)return;
        const online={mine:s.mine,names:['Family A','Family B'],seed:s.gid,move:(n,value)=>g.move(n,value),onMove:fn=>g.onMove(fn),next:(n,seat)=>g.next(n,seat),all:n=>g.all(n),connected:()=>window.__paradeConnected,present:()=>window.__paradeConnected,leave:()=>g.leave()};
        void window.__sv.playGameOnline('fruitparade',1,online);
      }});window.__paradeTestNet=g;
    },index);
    await P.page.evaluate(()=>{window.__paradeTestNet.invite('fruitparade',1,'guest');});
    for(const dev of[P,Q])await dev.page.locator('.parade-player').nth(1).waitFor();
    await P.page.screenshot({path:new URL('tablet-vi-online.png',out).pathname});await Q.page.screenshot({path:new URL('tablet-en-online.png',out).pathname});
    await Q.page.evaluate(()=>{window.__paradeConnected=false;});await Q.page.locator('.parade-connection:visible').waitFor();
    assert.equal(await Q.page.locator('.gl').count(),1,'temporary interruption retains the game');
    await Q.page.evaluate(()=>{window.__paradeConnected=true;});await Q.page.locator('.parade-connection').waitFor({state:'hidden'});
    for(let round=0;round<2;round++){
      for(const [seat,dev]of[P,Q].entries()){
        const targets=await dev.page.locator(`.parade-player[data-seat="${seat}"] .parade-stop:not(:disabled)`).evaluateAll(buttons=>buttons.map(button=>({lane:button.getAttribute('data-lane'),target:button.parentElement!.querySelector<HTMLElement>('.parade-hint')!.dataset.target})));
        assert.equal(targets.length,3,'each participant owns three lanes');
        for(const target of targets){const lane=dev.page.locator(`.parade-player[data-seat="${seat}"] .parade-lane[data-lane="${target.lane}"]`);
          for(let i=0;i<10&&target.target&&await lane.locator('.parade-window').getAttribute('data-symbol')!==target.target;i++)await lane.locator('[data-parade-action=change]').click();
          await lane.locator('[data-parade-action=stop]').click();}
      }
      for(const dev of[P,Q]){await dev.page.locator('.parade-result[data-success=true]').waitFor();}
      const progress=await Promise.all([P,Q].map(dev=>dev.page.locator('.parade-status').innerText()));
      assert.ok(progress.every(text=>text.includes('2')),'both show the host committed shared progress');
      await P.page.locator('[data-parade-action=next]').click();
    }
    for(const dev of[P,Q])await dev.page.locator('.gl-win').waitFor();
    observations.push({onlineCompleted:true,reconnectRetained:true,hostResultBothLanguages:true,errors:[...P.errors,...Q.errors]});assert.deepEqual([...P.errors,...Q.errors],[]);
    for(const dev of[P,Q]){await dev.page.locator('.gl-win.ask').waitFor();await dev.page.locator('.gl-win').click({position:{x:20,y:20}});await dev.page.locator('.gl').waitFor({state:'detached'});await dev.page.evaluate(()=>window.__paradeTestNet.leave());}
    await P.page.evaluate(()=>window.__paradeTestNet.invite('fruitparade',1,'guest'));
    await Q.page.locator('.parade-player').nth(1).waitFor();await Q.page.evaluate(()=>{window.__paradeConnected=false;});
    await Q.page.locator('[data-parade-action=helper]').waitFor({timeout:40000});
    await Q.page.screenshot({path:new URL('tablet-en-reconnect-choice.png',out).pathname});
    await Q.page.locator('[data-parade-action=helper]').click();await Q.page.locator('.parade[data-mode=npc]').waitFor();
    assert.equal(await Q.page.locator('.parade-player').count(),2);observations.push({gracePeriodThenNpcContinuation:true});
    await Q.ctx.close();
    }


    assert.deepEqual(P.errors, []);
    await P.ctx.close();
  } finally { await browser.close(); }
  await fs.writeFile(new URL(capturesOnly ? '../docs/v1.02-fruit-parade/capture-results.json' : '../docs/v1.02-fruit-parade/browser-results.json', import.meta.url), JSON.stringify(observations, null, 2));
  return observations;
}
console.log(JSON.stringify(await checkParadeBrowser()));
