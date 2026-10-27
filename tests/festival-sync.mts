import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import type {Browser,Page} from 'playwright';
import {open,clear,noWelcome} from './harness.mjs';
import {fakeGitHub,routeGitHub,fakeNetlify,memoryBlobs} from './studio-check.mjs';

export async function festivalSyncCheck(browser:Browser){
 const root=path.resolve(import.meta.dirname,'..'),site='http://localhost:8799',password='synthetic-festival-check-123',repo='family/festival-check';
 const env={STUDIO_PASSWORD:password,GITHUB_TOKEN:'fixture-only',GITHUB_REPO:repo,URL:site},before=Object.fromEntries(Object.keys(env).map(k=>[k,process.env[k]]));
 const store=memoryBlobs(),players=memoryBlobs();await store.setJSON('live',{festivals:{halloween:{date:'10-30',deco:3}},releases:{traffic:{on:false}}});
 const unroute=routeGitHub(fakeGitHub(repo,{'content/custom.json':'{}','js/build.js':await fs.readFile(path.join(root,'js/build.js'),'utf8')}));
 const server=await fakeNetlify({port:8799,env,players,liveStore:store});
 const admin=await browser.newContext(),web=await browser.newContext({viewport:{width:390,height:844},hasTouch:true});
 await web.addInitScript(()=>localStorage.setItem('sv_parent_analytics_consent','no'));
 let game:Awaited<ReturnType<typeof open>>|undefined;
 const errors:string[]=[],seen:string[]=[];
 try{
  const studio=await admin.newPage();studio.on('pageerror',e=>errors.push(e.message));await studio.goto(site+'/studio');await studio.fill('#pw',password);await studio.click('#si button');await studio.locator('#tabs button').first().waitFor();
  await studio.evaluate(()=>{location.hash='game/festivals';});await studio.locator('tr[data-id=halloween]').waitFor();
  const save=async(on:boolean)=>{await studio.locator('tr[data-id=halloween] [data-f=on]').selectOption(String(on));await Promise.all([studio.waitForResponse(r=>r.url().endsWith('/studio/api/live')&&r.request().method()==='POST'),studio.click('#save')]);};
  const state=async()=>{const response=await fetch(site+'/api/festivals');assert.equal(response.status,200);return response.json();};
  await save(false);assert.ok(!(await state()).enabled.includes('halloween'));
  const page=await web.newPage();page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>{const p=new URL(r.url()).pathname;if(p.startsWith('/api/'))seen.push(p);});await page.goto(site+'/home/#festivals');
  await page.waitForFunction(()=>document.querySelector('#festival-halloween')?.getAttribute('data-festival-visible')==='false');assert.equal(await page.locator('#festival-halloween').isVisible(),false);
  game=await open(browser,{url:site+'/',settings:{festival:'halloween',voice:false,online:false,countPlayers:false}});await clear(game.page);await noWelcome(game.page);
  await game.page.evaluate(()=>{window.__sv.paused=true;});
  const refresh=async(p:Page)=>{await p.evaluate(async()=>{await(await import(String('/js/festival-live.js'))).refreshPublicFestivals();});};
  const active=()=>game!.page.evaluate(async()=>{const F=await import(String('/js/festivals.js'));return F.activeFestivals().some(a=>a.F.id==='halloween');});
  await refresh(game.page);assert.equal(await active(),false,'manual selection cannot override Studio off');
  await game.page.evaluate(async()=>{(await import(String('/js/custom.js'))).setPeeks(['fest_halloween']);});assert.equal(await active(),false,'tester preview cannot override Studio off');
  await save(true);assert.ok((await state()).enabled.includes('halloween'));await refresh(page);await refresh(game.page);assert.equal(await active(),true);
  await page.locator('[data-festival-filter=all]').click();assert.equal(await page.locator('#festival-halloween').isVisible(),true);
  const raw=await store.get('live',{type:'json'});assert.equal(raw.releases.fest_halloween.on,true);assert.equal(raw.festivals.halloween.on,true);assert.equal(raw.releases.traffic.on,false);assert.equal(raw.festivals.halloween.date,'10-30');assert.equal(raw.festivals.halloween.deco,3);
  await game.page.evaluate(()=>{void(window.__sv as unknown as import('../js/main.js').SvMain).festivals.visit(0,'halloween');});await game.page.locator('[data-festival-owner=halloween]').waitFor();
  await save(false);await refresh(page);await refresh(game.page);await game.page.locator('[data-festival-owner=halloween]:not(.out)').waitFor({state:'detached'});assert.equal(await active(),false);
  // A stale guide link must not reveal an off festival.
  await page.evaluate(()=>{location.hash='quest-hunt-halloween';});assert.equal(await page.locator('#quest-hunt-halloween').isVisible(),false);
  assert.ok(seen.length&&seen.every(p=>p==='/api/festivals'),'website reads public festival settings only');
  await fs.mkdir('out/festival-sync',{recursive:true});
  for(const[device,w,h]of[['phone',390,844],['tablet',820,1180],['computer',1280,800]]as const)for(const lang of['en','vi']){
   await page.setViewportSize({width:w,height:h});if(await page.locator('html').getAttribute('lang')!==lang)await page.locator('#language-button').click();await page.evaluate(()=>{location.hash='festivals';});await page.screenshot({path:`out/festival-sync/${device}-${lang}-off.png`});
  }
  // Both Studio controls must publish the same switches, including all-off.
  await studio.evaluate(()=>{location.hash='game/releases';});
  await studio.locator('.relc[data-id=fest_halloween]').waitFor();
  const toggle=studio.locator('.relc[data-id=fest_halloween] [data-r=on]');
  assert.equal(await toggle.isChecked(),false);
  await toggle.check();await Promise.all([studio.waitForResponse(r=>r.url().endsWith('/studio/api/live')&&r.request().method()==='POST'),studio.click('#save')]);
  assert.ok((await state()).enabled.includes('halloween'));assert.equal((await store.get('live',{type:'json'})).festivals.halloween.on,true);
  await studio.locator('.relc[data-id^=fest_] [data-r=on]').evaluateAll(inputs=>inputs.forEach(input=>{(input as HTMLInputElement).checked=false;input.dispatchEvent(new Event('change',{bubbles:true}));}));
  await Promise.all([studio.waitForResponse(r=>r.url().endsWith('/studio/api/live')&&r.request().method()==='POST'),studio.click('#save')]);
  assert.deepEqual((await state()).enabled,[]);await refresh(page);await refresh(game.page);
  assert.equal(await page.locator('#festival').isVisible(),false);assert.equal(await page.locator('#festival-overview').isVisible(),false);assert.equal(await active(),false);
  await page.route('**/api/festivals',route=>route.abort());await refresh(page);
  assert.equal(await page.locator('#festival-halloween').isVisible(),false);
  assert.deepEqual(errors,[]);assert.deepEqual(game.errors,[]);
  return 'Real Studio off/on/off updates public website, related guides, game selection/preview and open notices; dates, decorations and other releases preserved';
 }finally{await game?.ctx.close();await admin.close();await web.close();await new Promise<void>(r=>server.close(()=>r()));unroute();for(const[k,v]of Object.entries(before)){if(v===undefined)delete process.env[k];else process.env[k]=v;}}
}
