import assert from 'node:assert/strict';import type {Browser} from 'playwright';import {openAllGamesFixture,clear,noWelcome} from './harness.mjs';
export async function autoplayReleaseGatesCheck(browser:Browser){
 const P=await openAllGamesFixture(browser,{w:1000,h:820,settings:{voice:false,sound:false,autoPack:false,online:false,countPlayers:false},route:async ctx=>{await ctx.route('**/*',r=>{const q=r.request();if(!['GET','HEAD'].includes(q.method()))return r.fulfill({json:{ok:true,id:'synthetic-report'}});if(!/^https?:\/\/(localhost|127\.0\.0\.1)(:|\/)/.test(q.url()))return r.abort();return r.continue();});}});
 try{await clear(P.page);await noWelcome(P.page);
 await P.page.evaluate(async()=>{const G=window.__sv as any;G.tester?.unmount();G.autoplay?.unmount();(await import(String('/js/autoplay.js'))).mountAutoplay(G);});
 for(const id of ['fruitparade','sparkleorchard','sparklefruitbar'])for(const enabled of [false,true]){
  await P.page.evaluate(async({id,enabled})=>{const G=window.__sv as any,C=(await import(String('/js/custom.js'))).CUSTOM;const prefix=id==='fruitparade'?'sparkleFruitParade':id;for(const kind of ['single','multi','tester'])C.releases[prefix+'_'+kind]={on:enabled};G.autoplay.open();},{id,enabled});
  const query=P.page.locator('.apbox [data-a=q]');await query.fill('game:'+id);await query.dispatchEvent('change');
  assert.equal(await P.page.locator('.apbox [data-a=start]').isEnabled(),enabled,id+' follows Studio availability');
  assert.match(await P.page.locator('.apbox [data-a=start]').innerText(),enabled?/\(1\)/:/\(0\)/);
  if(!enabled){await P.page.evaluate(id=>{(window.__sv as any).autoplay.start(['game:'+id],'fast');},id);assert.equal(await P.page.evaluate(()=>(window.__sv as any).autoplay.running()),false);continue;}
  await P.page.locator('.apbox [data-a=min]').click();
  await P.page.evaluate(id=>{void(window.__sv as any).playGame(0,id,'replay');},id);await P.page.locator(`.gl[data-game-id="${id}"]`).waitFor();
  await P.page.locator(id==='sparklefruitbar'?'.parent-arcade .x':'.gl .gl-x').click();await P.page.locator('.gl').waitFor({state:'detached'});
 }
 // Isolate reporting from world travel; existing autoplay/path checks still test the real routes.
 await P.page.evaluate(async()=>{const G=window.__sv as any;G.gameSpot=()=>null;G.autoplay.setProfile('max-competence');void G.autoplay.start(['game:memory'],'fast');});
 await P.page.locator('.gl[data-game-id=memory]').waitFor();
 await P.page.evaluate(()=>{dispatchEvent(new ErrorEvent('error',{message:'ResizeObserver loop completed with undelivered notifications.'}));dispatchEvent(new ErrorEvent('error',{message:'fixture genuine exception'}));});
 await P.page.waitForFunction(()=>!(window.__sv as any).autoplay.running(),null,{timeout:180000});
 const problems=await P.page.evaluate(()=>JSON.parse(localStorage.getItem('sv2_autoplay_report')||'{}').done.flatMap(row=>row.problems||[]));
 assert.ok(problems.some(p=>p.includes('fixture genuine exception')),'actual errors remain reported');assert.equal(problems.some(p=>p.includes('ResizeObserver')),false,'only exact delivery notices are classified separately');
 assert.deepEqual(P.errors,[]);return'Studio-off fruit games skipped; all three enabled games really open; exact observer delivery notice ignored while a genuine error is retained';
 }finally{await P.ctx.close();}
}
