import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {open,clear,noWelcome} from './harness.mjs';
export async function ladybugUnifiedCheck(browser){
 const P=await open(browser,{w:390,h:844,touch:true,settings:{voice:false,online:false,autoPack:false},route:async ctx=>{await ctx.route('**/api/**',r=>r.fulfill({json:{open:[],mine:[]}}));}});
 try {
  await clear(P.page);await noWelcome(P.page);
  await P.page.evaluate(async()=>{const g=window.__sv as any;g.autoplay?.unmount();g.tester?.unmount();localStorage.setItem('sv2_tester',JSON.stringify({at:Date.now()}));(await import(String('/js/autoplay.js'))).mountAutoplay(g);});
  await P.page.locator('.z-ap').waitFor(); // Autoplay-only devices retain their entry point.
  await P.page.evaluate(async()=>{(await import(String('/js/tester.js'))).mountTester(window.__sv as any,'ladybird');});
  await P.page.waitForFunction(()=>document.querySelectorAll('.tester-floating.z-lb').length===1&&!document.querySelector('.z-ap'));
  await P.page.evaluate(async()=>{const g=window.__sv as any;g.autoplay.unmount();(await import(String('/js/autoplay.js'))).mountAutoplay(g);});
  assert.equal(await P.page.locator('.z-ap').count(),0,'tester-first mounting also uses the floating control');
  const button=P.page.locator('.tester-floating.z-lb');
  await fs.mkdir('out/ladybug-unified',{recursive:true});
  for(const [device,w,h]of [['phone',390,844],['tablet',820,1180],['computer',1280,850]]as const)for(const lang of ['en','vi']){
   await P.page.setViewportSize({width:w,height:h});
   await P.page.evaluate(async lang=>{(await import(String('/js/state.js'))).settings.lang=lang;},lang);
   await button.click();await P.page.locator('.tpanel').waitFor();
   await P.page.locator('[data-test-tab=autoplay]').click();await P.page.locator('.apbox').waitFor();
   assert.equal(await P.page.locator('.tester-floating.z-lb').count(),1);
   assert.equal(await P.page.locator('.z-ap').count(),0);
   await P.page.evaluate(async()=>{await new Promise<void>(r=>requestAnimationFrame(()=>requestAnimationFrame(()=>r())));await Promise.allSettled([...document.querySelectorAll('.tpanel')].flatMap(m=>m.getAnimations().map(a=>a.finished)));});
   await P.page.screenshot({path:`out/ladybug-unified/${device}-${lang}.png`});
   await P.page.locator('.tpanel .tp-head > .x').click();await P.page.locator('.tpanel').waitFor({state:'detached'});
  }
  // A tester remount must not leave old floating controls or restore the duplicate.
  await P.page.evaluate(async()=>{const g=window.__sv as any;g.tester.unmount();(await import(String('/js/tester.js'))).mountTester(g,'ladybird');});
  await P.page.waitForFunction(()=>document.querySelectorAll('.tester-floating.z-lb').length===1&&!document.querySelector('.z-ap'));
  assert.deepEqual(P.errors,[]);
  return 'one floating ladybug, autoplay accessible inside it; both mount orders, remount, six device/language layouts';
 }finally{await P.ctx.close();}
}
