import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import type {Browser} from 'playwright';
import {open,clear,noWelcome} from './harness.mjs';
const IDS=['meochuot','cuopco','keocua','danhdao','nemcon','duathuyen'];
export async function folkCourtBrowserCheck(browser:Browser){
 const P=await open(browser,{w:390,h:844,touch:true,lang:'vi',settings:{voice:false,sound:false,music:false,autoPack:false,online:false,countPlayers:false}});await clear(P.page);await noWelcome(P.page);
 // The play-through fixture earns the original category prerequisites; it does not bypass runtime gates.
 await P.page.evaluate(async()=>{const U=await import(String('/js/content/unlocks.js'));for(const id of U.FIRST_SET_GAMES.vietnam)window.__sv.heroes[0].profile.wins[id]=3;});
 const close=async()=>{if(await P.page.locator('.gl-win').count())await P.page.locator('.gl-win').waitFor({state:'detached',timeout:10000});if(await P.page.locator('.gl .gl-x').count()){await P.page.locator('.gl .gl-x').click();await P.page.locator('.gl').waitFor({state:'detached'});}await clear(P.page);};
 const start=async(id:string,little:boolean,lang:string)=>{
  await close();await P.page.evaluate(async({id,little,lang})=>{const G=window.__sv as unknown as import('../js/main.js').SvMain,S=await import(String('/js/state.js'));S.settings.lang=lang;G.heroes[0].profile.age=little?'little':'big';void G.playGame(0,id,'replay');},{id,little,lang});
  await P.page.locator('.folk-court').waitFor();await P.page.waitForFunction(()=>{const l=document.querySelector('.gl');return !!l&&getComputedStyle(l).opacity==='1';});
 };
 const tapPlan=async()=>{
  const ready=await P.page.evaluate(async()=>{document.querySelectorAll('[data-folk-probe]').forEach(e=>e.removeAttribute('data-folk-probe'));const target=(await import(String('/js/games/playwatch.js'))).playWatch.plan?.();if(target instanceof HTMLButtonElement&&!target.disabled&&!target.hidden&&target.isConnected){target.dataset.folkProbe='true';return true;}return false;});
  if(ready)await P.page.locator('[data-folk-probe]').click();else await P.page.waitForTimeout(60);return ready;
 };
 const counts:Record<string,number>={};
 try{
  for(const id of IDS)for(const little of[true,false]){
   await start(id,little,little?'vi':'en');
   if(id==='nemcon'||id==='danhdao'){
    await P.page.locator('[data-folk-action=left]').click({clickCount:3});await P.page.locator('[data-folk-action=throw]').click();
    await P.page.waitForFunction(()=>!(document.querySelector('[data-folk-action=throw]')as HTMLButtonElement)?.disabled);
    assert.equal(await P.page.locator('.gl-win').count(),0,'an off-target throw must not win');assert.equal(await P.page.locator('.folk-controls').count(),1,'misses must not recursively append control groups');
   }else if(id==='cuopco'){
    await P.page.locator('[data-folk-action="1"]').click();assert.equal(await P.page.locator('[data-folk-action=home]').isVisible(),false,'uncalled runner cannot take the flag');
   }else if(id==='meochuot'){
    await P.page.locator('[data-folk-action="1"]').click();assert.equal(await P.page.locator('.gl-dots .on').count(),0,'closed gate must not advance');
   }
   let actions=0;const deadline=Date.now()+65000;
   while(!await P.page.locator('.gl-win').count()&&Date.now()<deadline&&actions<180){if(await tapPlan())actions++;}
   assert.ok(await P.page.locator('.gl-win').count(),id+' '+(little?'gentle':'older')+' did not finish through actual controls');counts[id+'-'+(little?'gentle':'older')]=actions;
   const on=await P.page.locator('.gl-dots .on').count(),all=await P.page.locator('.gl-dots i').count();assert.equal(on,all,'completed activity fills its own progress dots');
  }
  await fs.mkdir('out/folk-courts',{recursive:true});
  for(const id of IDS)for(const[device,w,h,little]of[['phone',390,844,true],['tablet',820,1180,false],['computer',1280,800,false]]as const)for(const lang of['en','vi']){
   await P.page.setViewportSize({width:w,height:h});await start(id,little,lang);
   assert.equal(await P.page.locator('.folk-field svg').count(),1);assert.ok(await P.page.locator('.folk-field svg path,.folk-field svg circle').count()>10,'original scene must contain the real play context');
   const bad=await P.page.locator('.folk-controls button:visible').evaluateAll(buttons=>buttons.map(b=>{const r=b.getBoundingClientRect();return{label:b.textContent,w:r.width,h:r.height};}).filter(r=>r.w<63||r.h<63));assert.deepEqual(bad,[],'folk control size: '+JSON.stringify(bad));
   assert.equal(await P.page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),true,'no horizontal overflow');await P.page.locator('.gl-stage').evaluate(e=>{e.scrollTop=0;});await P.page.screenshot({path:`out/folk-courts/${id}-${device}-${lang}.png`});
  }
  await close();assert.equal(await P.page.evaluate(async()=>(await import(String('/js/games/playwatch.js'))).playWatch.plan===null),true,'closing the game clears its plan');assert.deepEqual(P.errors,[]);
  return 'Six contextual folk games complete through real controls in both age modes, misses keep one board, called runners/gates enforced, rhythm/rowing finish, all progress dots,36 EN/VI device layouts: '+JSON.stringify(counts);
 }finally{await P.ctx.close();}
}
