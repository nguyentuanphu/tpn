import assert from 'node:assert/strict';
import type{Browser}from'playwright';
const cached={schema:1,enabled:['tet'],festivals:{},at:'cached'};
const fresh={schema:1,enabled:['halloween'],festivals:{halloween:{date:'10-30'}},at:'fresh'};
declare global{interface Window{__festivalBootResolve?:(value:unknown)=>void;}}
export async function festivalBootstrapCheck(browser:Browser){
 for(const mode of['shared','failed','late','standalone']){
  const context=await browser.newContext(),page=await context.newPage(),calls:string[]=[];
  try{
   await page.route('**/__festival_boot',r=>r.fulfill({contentType:'text/html',body:'<!doctype html><body>Public festival bootstrap check</body>'}));
   await page.route('**/api/festivals',r=>{calls.push(r.request().url());return r.fulfill({json:fresh});});
   await page.goto('http://localhost:8765/__festival_boot');
   await page.evaluate(async({mode,cached,fresh})=>{
    localStorage.setItem('sv_public_festivals_v1',JSON.stringify(cached));const M=await import(String('/js/festival-live.js'));
    if(mode!=='standalone'){
     const boot=mode==='late'?new Promise(resolve=>{window.__festivalBootResolve=resolve;}):Promise.resolve(mode==='failed'?null:fresh);
     M.configureFestivalStartup(boot);
    }
    M.startPublicFestivals();await Promise.resolve();
   },{mode,cached,fresh});
   if(mode==='standalone')await page.waitForFunction(async()=>(await import(String('/js/festival-live.js'))).publicFestivals()?.at==='fresh');
   else{
    assert.equal(calls.length,0,'shared initial live request must avoid a duplicate API request');
    assert.deepEqual(await page.evaluate(async()=>(await import(String('/js/festival-live.js'))).publicFestivals()),mode==='shared'?fresh:cached);
    await page.evaluate(()=>window.dispatchEvent(new Event('focus')));
    await page.waitForFunction(async()=>(await import(String('/js/festival-live.js'))).publicFestivals()?.at==='fresh');
    if(mode==='late'){
     await page.evaluate(value=>window.__festivalBootResolve!(value),cached);
     assert.deepEqual(await page.evaluate(async()=>(await import(String('/js/festival-live.js'))).publicFestivals()),fresh,'late initial reply cannot replace a newer public refresh');
    }
   }
   assert.equal(calls.length,1,'standalone/focus refresh still reaches the public endpoint exactly once');
  }finally{await context.close();}
 }
 return 'Shared initial live settings avoid duplicate public requests; failed bootstrap keeps cached settings, focus refreshes, late initial responses cannot replace newer public state; standalone website behavior preserved';
}
