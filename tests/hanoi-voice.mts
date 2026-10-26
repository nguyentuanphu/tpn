import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import type {Browser} from 'playwright';
import {open,clear} from './harness.mjs';
import {lineHash} from '../js/packhash.js';
export async function hanoiVoiceCheck(browser:Browser){
 const root='../voices/fpt-leminh-v1/',manifest=JSON.parse(await fs.readFile(root+'manifest.json','utf8'));
 const welcome=lineHash('vi','Xin chào! Chào mừng con đến Thung Lũng Lấp Lánh.'),two=lineHash('vi','Hai!');
 const ids=[...new Set([welcome,two,...Object.keys(manifest.lines).slice(0,16)])];
 const lines=Object.fromEntries(ids.map(id=>{assert.ok(manifest.lines[id],id);return[id,manifest.lines[id]];}));
 const sample={...manifest,lines,bytes:Object.values<{bytes:number}>(lines).reduce((n,l)=>n+l.bytes,0)},requests:string[]=[];
 const P=await open(browser,{w:390,h:844,touch:true,lang:'vi',settings:{autoPack:false,voice:false,voiceMale:false,packCell:false,voiceViVariant:'standard'},pre:()=>{Object.defineProperty(navigator,'connection',{get:()=>({type:'cellular',saveData:false,addEventListener(){}}),configurable:true});},route:async ctx=>{
  await ctx.route('**/voices/fpt-leminh-v1/**',async rt=>{
   const u=new URL(rt.request().url());requests.push(u.pathname);
   if(u.pathname.endsWith('manifest.json'))return rt.fulfill({json:sample});
   const id=u.pathname.split('/').at(-1)!.replace('.mp3','');assert.ok(lines[id]);await new Promise(r=>setTimeout(r,700));await rt.fulfill({contentType:'audio/mpeg',body:await fs.readFile(root+id+'.mp3')});
  });
 }});
 try{
  await clear(P.page);assert.equal(requests.length,0,'female default must not fetch the optional pack');
  await P.page.evaluate(async()=>{window.__sv.paused=true;await(await import(String('/js/ui.js'))).openGrownups();});
  await P.page.locator('#gVietnamesePack').waitFor({state:'attached'});await P.page.evaluate(()=>document.querySelectorAll<HTMLDetailsElement>('.grownups details').forEach(d=>d.open=true));
  await P.page.locator('#gHanoiPreview').click();
  for(let i=0;i<80&&!requests.some(u=>u.endsWith(welcome+'.mp3'));i++)await P.page.waitForTimeout(100);
  assert.ok(requests.some(u=>u.endsWith(welcome+'.mp3')),'preview requests the actual Lê Minh recording');
  assert.equal(await P.page.locator('#gVietnamesePack').inputValue(),'standard','preview must not change parent choice');
  await P.page.locator('#gHanoiDownload').click();assert.equal(await P.page.locator('#gPackCell').isChecked(),true,'explicit download grants visible mobile permission');
  await P.page.locator('#gPackCell').uncheck();await P.page.waitForTimeout(1500);
  const paused=await P.page.evaluate(async()=>(await(await caches.open('sv-voices-fpt-leminh-v1')).keys()).filter(r=>r.url.includes('.mp3')).length);assert.ok(paused<ids.length,'mobile permission must be revocable');
  await P.page.waitForTimeout(700);assert.equal(await P.page.evaluate(async()=>(await(await caches.open('sv-voices-fpt-leminh-v1')).keys()).filter(r=>r.url.includes('.mp3')).length),paused,'no new files after the in-flight batch');
  await P.page.locator('#gPackCell').check();
  const before=paused;
  await P.page.locator('#gDone').click();await P.page.locator('.grownups').waitFor({state:'detached'});
  let saved=before;for(let i=0;i<300;i++){saved=await P.page.evaluate(async()=>(await(await caches.open('sv-voices-fpt-leminh-v1')).keys()).filter(r=>r.url.includes('.mp3')).length);if(saved===ids.length)break;await P.page.waitForTimeout(100);}
  assert.equal(saved,ids.length);assert.ok(saved>before,'download continued after closing Settings');
  assert.ok((await P.page.locator('.packbar').textContent())?.includes('Lê Minh'));
  // Offline audio must work from the provider cache even without a controlling SW.
  await P.ctx.setOffline(true);
  const result=await P.page.evaluate(async()=>{
   const V=await import(String('/js/voice.js')),S=await import(String('/js/state.js'));S.settings.voice=true;V.setSpeaker('Bà Năm');await V.sayAsync('Two!','Hai!');
   return{provider:V.voiceDiag.recording,selected:S.settings.voiceViVariant,male:S.settings.voiceMale};
  });
  assert.equal(result.provider,'FPT Neo · FPT.AI-VITs · leminh');assert.equal(result.selected,'leminh');assert.equal(result.male,false);
  await P.ctx.setOffline(false);
  await fs.mkdir('out/hanoi-settings',{recursive:true});
  for(const[device,w,h]of[['phone',390,844],['tablet',820,1180],['computer',1280,800]]as const)for(const lang of['en','vi']){
   await P.page.setViewportSize({width:w,height:h});
   await P.page.evaluate(async lang=>{(await import(String('/js/state.js'))).settings.lang=lang;await(await import(String('/js/ui.js'))).openGrownups();},lang);
   await P.page.locator('#gVietnamesePack').waitFor({state:'attached'});await P.page.evaluate(()=>document.querySelectorAll<HTMLDetailsElement>('.grownups details').forEach(d=>d.open=true));
   await P.page.locator('#gVietnamesePack').scrollIntoViewIfNeeded();
   assert.equal(await P.page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),true,'voice settings must fit the viewport');
   await P.page.screenshot({path:`out/hanoi-settings/${device}-${lang}.png`});await P.page.locator('#gDone').click();await P.page.locator('.grownups').waitFor({state:'detached'});
  }
  await P.page.evaluate(async()=>{await(await import(String('/js/voice.js'))).chooseVietnamesePack('standard');});
  assert.equal(await P.page.evaluate(()=>JSON.parse(localStorage.getItem('sv2_settings')||'{}').voiceViVariant),'standard');
  assert.deepEqual(P.errors,[]);
  return `${ids.length} real Lê Minh files: female default avoids optional fetch, preview preserves choice, download survives Settings close, female character uses Lê Minh offline, standard voice remains selectable`;
 }finally{await P.ctx.setOffline(false);await P.ctx.unrouteAll({behavior:'ignoreErrors'});await P.ctx.close();}
}
