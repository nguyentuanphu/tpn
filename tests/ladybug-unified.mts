import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {open,clear,noWelcome} from './harness.mjs';
export async function ladybugUnifiedCheck(browser,mode='solo'){
 const P=await open(browser,{w:390,h:844,touch:true,mode,settings:{voice:false,online:false,autoPack:false},route:async ctx=>{await ctx.route('**/api/**',r=>r.fulfill({json:{open:[],mine:[]}}));}});
 try {
  await clear(P.page);await noWelcome(P.page);
  if(mode==='split')assert.equal(await P.page.evaluate(()=>window.__sv.heroes.length),2,'fixture must have two real player HUDs');
  await P.page.evaluate(async()=>{const g=window.__sv as any;g.autoplay?.unmount();g.tester?.unmount();localStorage.setItem('sv2_tester',JSON.stringify({at:Date.now()}));(await import(String('/js/autoplay.js'))).mountAutoplay(g);});
  await P.page.locator('.z-ap').first().waitFor(); // Autoplay-only devices retain their entry point.
  await P.page.evaluate(async()=>{(await import(String('/js/tester.js'))).mountTester(window.__sv as any,'ladybird');});
  await P.page.waitForFunction(()=>document.querySelectorAll('.tester-floating.z-lb').length===1&&!document.querySelector('.z-ap'));
  await P.page.evaluate(async()=>{const g=window.__sv as any;g.autoplay.unmount();(await import(String('/js/autoplay.js'))).mountAutoplay(g);});
  assert.equal(await P.page.locator('.z-ap').count(),0,'tester-first mounting also uses the floating control');
  const button=P.page.locator('.tester-floating.z-lb');
  await fs.mkdir('out/ladybug-unified',{recursive:true});
  const devices=mode==='split'?[['tablet',820,1180]as const]:[['phone',390,844],['tablet',820,1180],['computer',1280,850]]as const;
  for(const [device,w,h]of devices)for(const lang of ['en','vi']){
   await P.page.setViewportSize({width:w,height:h});
   await P.page.evaluate(async lang=>{(await import(String('/js/state.js'))).settings.lang=lang;},lang);
   await button.click();await P.page.locator('.tpanel').waitFor();
   await P.page.locator('[data-test-tab=autoplay]').click();await P.page.locator('.apbox').waitFor();
   assert.equal(await P.page.locator('.tester-floating.z-lb').count(),1);
   assert.equal(await P.page.locator('.z-ap').count(),0);
   const bounds=await P.page.evaluate(()=>{const button=document.querySelector('.tester-floating.z-lb'),panel=document.querySelector('.tpanel');return {shared:button.parentElement===document.body&&panel.parentElement===document.body,controls:[button,panel.querySelector('.tp-head .x'),panel.querySelector('[data-test-tab=autoplay]')].map(e=>{const r=e.getBoundingClientRect();return {left:r.left,top:r.top,right:r.right,bottom:r.bottom};}),w:innerWidth,h:innerHeight};});
   assert.equal(bounds.shared,true,'shared reporting control and panel stay outside player-half holders');
   for(const r of bounds.controls)assert.ok(r.left>=0&&r.top>=0&&r.right<=bounds.w+1&&r.bottom<=bounds.h+1,'report controls must remain inside the whole device viewport');
   await P.page.evaluate(async()=>{await new Promise<void>(r=>requestAnimationFrame(()=>requestAnimationFrame(()=>r())));await Promise.allSettled([...document.querySelectorAll('.tpanel')].flatMap(m=>m.getAnimations().map(a=>a.finished)));});
   await P.page.screenshot({path:`out/ladybug-unified/${mode}-${device}-${lang}.png`});
   await P.page.locator('.tpanel .tp-head > .x').click();await P.page.locator('.tpanel').waitFor({state:'detached'});
  }
  // A tester remount must not leave old floating controls or restore the duplicate.
  await P.page.evaluate(async()=>{const g=window.__sv as any;g.tester.unmount();(await import(String('/js/tester.js'))).mountTester(g,'ladybird');});
  await P.page.waitForFunction(()=>document.querySelectorAll('.tester-floating.z-lb').length===1&&!document.querySelector('.z-ap'));
  assert.deepEqual(P.errors,[]);
  return `${mode}: one floating ladybug, autoplay accessible inside it; both mount orders and remount, ${devices.length*2} device/language layouts`;
 }finally{await P.ctx.close();}
}
