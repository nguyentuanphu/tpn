import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import type {Browser} from 'playwright';
import {open,clear,noWelcome} from './harness.mjs';
export async function familyUIArtCheck(browser:Browser){
 const P=await open(browser,{w:390,h:844,touch:true,settings:{voice:false,online:false,autoPack:false}}),shots=process.env.SV_SHOTS || '../docs/world-placement-audit-20261027/ui';
 const capture=async(name:string)=>{if(!shots)return;await P.page.evaluate(async()=>{await new Promise<void>(r=>requestAnimationFrame(()=>requestAnimationFrame(()=>r())));await Promise.allSettled([...document.querySelectorAll('.modal')].flatMap(m=>m.getAnimations().map(a=>a.finished)));});await P.page.screenshot({path:shots+'/'+name+'.png'});};
 try{await clear(P.page);await noWelcome(P.page);if(shots)await fs.mkdir(shots,{recursive:true});
 for(const [device,w,h]of[['phone',390,844],['tablet',820,1180],['computer',1280,850]]as const){await P.page.setViewportSize({width:w,height:h});
  for(const lang of['en','vi']){
   await P.page.evaluate(async lang=>{document.querySelectorAll('.modal').forEach(e=>e.remove());const S=await import(String('/js/state.js'));S.settings.lang=lang;S.settings.voiceViVariant='leminh';const C=await import(String('/js/custom.js'));C.CUSTOM.features={...C.CUSTOM.features,familyDevices:true};void(await import(String('/js/ui-settings.js'))).openGrownups();},lang);
   await P.page.locator('#gHanoiPreview').waitFor({state:'attached'});await P.page.evaluate(()=>{document.querySelectorAll<HTMLDetailsElement>('.grownups details').forEach(d=>d.open=true);document.querySelector('#gVietnamesePack')?.scrollIntoView({block:'start'});});
   const r=await P.page.evaluate(()=>{const a=document.querySelector('#gHanoiPreview')!.getBoundingClientRect(),b=document.querySelector('#gHanoiDownload')!.getBoundingClientRect(),select=document.querySelector('#gVietnamesePack')!;
    return{sameRow:Math.abs(a.top-b.top)<2,touch:a.height>=44&&b.height>=44,overflow:a.left<0||b.right>innerWidth,quizFamily:!!document.querySelector('#gFamilyQuiz')?.closest('[data-sec=family]'),font:getComputedStyle(select).fontFamily,border:getComputedStyle(select).borderRadius};});
   assert.ok(r.sameRow&&r.touch&&!r.overflow,device+' '+lang+' voice actions '+JSON.stringify(r));assert.ok(r.quizFamily,'questions stay with family quests');assert.notEqual(r.border,'0px');assert.match(r.font,/Fredoka|Baloo/);
   await capture(device+'-'+lang+'-voices');
   await P.page.locator('.fd-label').waitFor({state:'attached'});await P.page.waitForFunction(()=>!document.querySelector('.fd-status')?.textContent?.trim());await P.page.locator('.fd-label').scrollIntoViewIfNeeded();
   const field=await P.page.locator('.fd-label').evaluate(e=>({height:e.getBoundingClientRect().height,radius:getComputedStyle(e).borderRadius,font:getComputedStyle(e).fontFamily}));assert.ok(field.height>=44);assert.notEqual(field.radius,'0px');assert.match(field.font,/Fredoka|Baloo/);
   await capture(device+'-'+lang+'-family-photos');
   await P.page.evaluate(()=>document.querySelectorAll('.modal').forEach(e=>e.remove()));
   await P.page.evaluate(async()=>{const G=window.__sv;G.paused=true;void(await import(String('/js/ui.js'))).openPad(G,0,'map');});
   assert.ok(await P.page.locator('.mapcities button').filter({hasText:lang==='vi'?'Nhà của con':'My house'}).count(),'My Home map destination');
   await capture(device+'-'+lang+'-map');
   await P.page.locator('.pad .x').click();
   await P.page.evaluate(()=>{const G=window.__sv as unknown as {shop:{openShop(i:number):void}};G.shop.openShop(0);});
   const shopSelect=await P.page.locator('.shop-recipient').evaluate(e=>({height:e.getBoundingClientRect().height,radius:getComputedStyle(e).borderRadius,font:getComputedStyle(e).fontFamily}));assert.ok(shopSelect.height>=64,'child shop recipient is 64px');assert.notEqual(shopSelect.radius,'0px');assert.match(shopSelect.font,/Fredoka|Baloo/);await capture(device+'-'+lang+'-clothes');await P.page.locator('.shopk .x').click();
  }
 }
 assert.deepEqual(P.errors,[]);return'English/Vietnamese phone, tablet and computer: voice actions share a row, 44px targets, styled selector, questions under family quests, My Home map destination';
 }finally{await P.ctx.close();}
}
