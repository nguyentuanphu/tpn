import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import type {Browser} from 'playwright';
import {open,start,clear,noWelcome} from './harness.mjs';
import {fakeGitHub,routeGitHub,fakeNetlify,memoryBlobs} from './studio-check.mjs';
import {hello} from '../netlify/lib/players.mts';

export async function installFlowCheck(browser:Browser){
 const sent:any[]=[];await fs.mkdir('out/install-flow',{recursive:true});
 const diagnostics:Record<string,unknown>[]=[],unexpectedNavigation:string[]=[];let phase='initial opening',allowNavigation=true;
 const note=(kind:string,detail:Record<string,unknown>={})=>{const entry={at:new Date().toISOString(),phase,kind,...detail};diagnostics.push(entry);console.log('INSTALLFLOW',JSON.stringify(entry));};
 const attachDiagnostics=async(ctx:import('playwright').BrowserContext,label:string)=>{
  const page=ctx.pages()[0];
  page.on('framenavigated',frame=>{if(frame===page.mainFrame()){note('navigation',{label,url:frame.url()});if(label==='primary'&&!allowNavigation)unexpectedNavigation.push(phase+' '+frame.url());}});
  page.on('crash',()=>note('crash',{label}));page.on('close',()=>note('page closed',{label}));
  page.on('console',m=>{if(/context|gpu|reload|SV_INSTALL_PROBE/i.test(m.text()))note('browser console',{label,type:m.type(),text:m.text().slice(0,1200)});});
  page.on('pageerror',e=>note('page error',{label,message:e.message}));
  page.on('request',q=>{if(q.isNavigationRequest())note('navigation request',{label,url:q.url(),method:q.method()});});
  await ctx.addInitScript(()=>{
   const emit=(kind:string,detail:Record<string,unknown>={})=>{let stage='';try{stage=sessionStorage.getItem('install-probe-phase')||'';}catch{}console.info('SV_INSTALL_PROBE',JSON.stringify({kind,stage,ready:document.readyState,at:performance.now(),...detail}));};
   addEventListener('beforeunload',()=>{let reload:unknown=null;try{const r=JSON.parse(localStorage.getItem('sv2_reload')||'null');reload=r?{why:String(r.why||'').slice(0,100),build:r.b||''}:null;}catch{}emit('beforeunload',{reload});});
   addEventListener('pagehide',e=>emit('pagehide',{persisted:e.persisted}));addEventListener('pageshow',e=>emit('pageshow',{persisted:e.persisted}));
   document.addEventListener('visibilitychange',()=>emit('visibility',{state:document.visibilityState}));
  });
 };

 const P=await open(browser,{w:390,h:844,touch:true,play:false,settings:{voice:false,sound:false,autoPack:false,online:false,countPlayers:false},pre:()=>{
  (window as any).__svHelloTest='manual';localStorage.setItem('sv-installed','1');
  Object.defineProperty(navigator,'userAgent',{configurable:true,value:'Mozilla/5.0 (iPad; CPU OS 15_8 like Mac OS X) AppleWebKit/605.1.15 Version/15.0 Mobile/15E148 Safari/604.1'});
 },route:async ctx=>{
  await attachDiagnostics(ctx,'primary');
  await ctx.route('**/api/**',r=>r.fulfill({json:{}}));
  await ctx.route('**/api/hello',async r=>{sent.push(r.request().postDataJSON());await r.fulfill({status:204,body:''});});
 }});
 const checkpoint=async(stage:string)=>{
  phase=stage;
  const state=await P.page.evaluate(stage=>{try{sessionStorage.setItem('install-probe-phase',stage);}catch{}const g=window.__sv as any,r=g?.renderer,c=r?.domElement;return {ready:document.readyState,url:location.href,w:innerWidth,h:innerHeight,visibility:document.visibilityState,heroes:g?.heroes?.length||0,paused:g?.paused,graphicsLost:!!r?.getContext()?.isContextLost(),canvas:c?{w:c.width,h:c.height}:null,graphicsMemory:r?.info?.memory||null,contextNotice:!!document.querySelector('.ctxlost'),quick:!!document.querySelector('.qsettings'),grownups:!!document.querySelector('.grownups'),guide:!!document.querySelector('.installguide')};},stage);
  note('checkpoint',state);assert.deepEqual(unexpectedNavigation,[],'the guide review must not navigate or reload unexpectedly');
 };
 try{
  await checkpoint('opening Welcome guide');allowNavigation=false;
  await P.page.locator('.installchip').waitFor(); // Old prompt acceptance must not count as confirmed installation.
  const welcomePaused=await P.page.evaluate(()=>(window.__sv as any)?.paused);
  await P.page.locator('.installchip').click();await P.page.locator('.installguide').waitFor();assert.equal(await P.page.evaluate(()=>(window.__sv as any)?.paused),true,'Welcome guide pauses its covered 3D picture');
  await P.page.locator('.installguide').click({position:{x:4,y:4}});await P.page.waitForTimeout(300);assert.equal(await P.page.locator('.installguide:not(.out)').count(),1,'backdrop does not hide the guide');
  await P.page.locator('.ig-hide').click();await P.page.locator('.installguide').waitFor({state:'detached'});
  assert.equal(await P.page.evaluate(()=>(window.__sv as any)?.paused),welcomePaused,'explicit Hide restores the prior Welcome pause state');
  assert.equal(await P.page.locator('.installchip').count(),0);await checkpoint('intentional Hide persistence reload');allowNavigation=true;await P.page.reload();await P.page.locator('.screen.title').waitFor();await checkpoint('after intentional reload');allowNavigation=false;assert.equal(await P.page.locator('.installchip').count(),0,'explicit Hide survives reopening');
  await start(P.page);await clear(P.page);await noWelcome(P.page);await checkpoint('ready in valley');
  for(const[device,w,h]of[['phone',390,844],['tablet',820,1180],['computer',1280,800]]as const)for(const lang of['en','vi']){
   await checkpoint(`${device}/${lang}: before viewport`);await P.page.setViewportSize({width:w,height:h});await checkpoint(`${device}/${lang}: after viewport`);
   await P.page.evaluate(async lang=>{(await import(String('/js/state.js'))).settings.lang=lang;(window.__sv as any).openQuick(0);},lang);
   await P.page.locator('.qsettings').waitFor();assert.equal(await P.page.evaluate(()=>(window.__sv as any).paused),true,'real Settings entry pauses the valley');
   const grown=P.page.locator('.qsettings .qgrown');await grown.scrollIntoViewIfNeeded();const point=await grown.boundingBox();assert.ok(point);await P.page.mouse.move(point.x+point.width/2,point.y+point.height/2);await P.page.mouse.down();await P.page.waitForTimeout(1900);await P.page.mouse.up();
   await P.page.locator('.grownups').waitFor();assert.equal(await P.page.evaluate(()=>(window.__sv as any).paused),true,'Grown-ups and its install guide retain the existing pause');await checkpoint(`${device}/${lang}: Grown-ups from held real control`);
   await P.page.locator('.g-install .installrow').waitFor();await P.page.locator('.g-install .installrow').click();await P.page.locator('.installguide').waitFor();
   assert.equal(await P.page.evaluate(()=>(window.__sv as any).paused),true,'visible guide keeps the covered world paused');
   await P.page.locator('.installguide').evaluate(async layer=>{await new Promise<void>(r=>requestAnimationFrame(()=>requestAnimationFrame(()=>r())));await Promise.allSettled(layer.getAnimations().map(a=>a.finished));});
   const hide=P.page.locator('.ig-hide');await hide.scrollIntoViewIfNeeded();const size=await hide.boundingBox();assert.ok(size&&size.width>=64&&size.height>=64);
   const overflow=await P.page.locator('.installguide .card').evaluate(e=>e.scrollWidth>e.clientWidth+1);assert.equal(overflow,false,'guide has no horizontal overflow');
   assert.match(await hide.innerText(),lang==='vi'?/Ẩn/:/Hide/);assert.match(await P.page.locator('.installguide').innerText(),lang==='vi'?/Chia sẻ/:/Share/);
   await checkpoint(`${device}/${lang}: guide settled`);
   await P.page.screenshot({path:`out/install-flow/${device}-${lang}-guide.png`});
   await hide.click();await P.page.locator('.installguide').waitFor({state:'detached'});assert.equal(await P.page.locator('.g-install .installrow').count(),1,'Settings entry survives explicit reminder Hide');
   assert.equal(await P.page.evaluate(()=>(window.__sv as any).paused),true,'Hide restores the still-open Settings pause');
   await P.page.locator('#gDone').click();await P.page.locator('.grownups').waitFor({state:'detached'});
   await P.page.locator('.qsettings .x').click();await P.page.locator('.qsettings').waitFor({state:'detached'});await checkpoint(`${device}/${lang}: returned to valley`);
  }
  await checkpoint('native acceptance and opt-out checks');
  await P.page.evaluate(async()=>{
   const e=new Event('beforeinstallprompt',{cancelable:true});Object.assign(e,{prompt:async()=>{},userChoice:Promise.resolve({outcome:'accepted'})});dispatchEvent(e);
   await(await import(String('/js/install.js'))).installApp();
  });
  assert.equal(await P.page.evaluate(()=>localStorage.getItem('sv2_install_confirmation')),null,'native prompt acceptance is not installation');
  await P.page.evaluate(async()=>{dispatchEvent(new Event('appinstalled'));const p=await import(String('/js/players.js'));p.countPlay('game','memory');await p.flush(false);});
  await P.page.waitForTimeout(100);assert.equal(sent.length,0,'guide/native install and explicit flush send nothing with Analytics off');
  assert.equal(await P.page.evaluate(()=>localStorage.getItem('sv2_install_confirmation')),'native');
  await P.page.evaluate(async()=>{(await import(String('/js/state.js'))).settings.countPlayers=true;const p=await import(String('/js/players.js'));p.countPlay('game','memory');await p.flush(false);});
  assert.ok(sent.some(p=>p.install==='native'&&p.a===false),'opt-in existing hello carries native observation separately from browser context');
  assert.deepEqual(P.errors,[]);
 }catch(error){note('failure',{message:String(error),stack:error instanceof Error?error.stack:''});try{await checkpoint('failure snapshot');}catch(snapshotError){note('failure snapshot unavailable',{message:String(snapshotError)});}throw error;
 }finally{await fs.writeFile('out/install-flow/diagnostics.json',JSON.stringify({phase,unexpectedNavigation,diagnostics},null,2)+'\n');allowNavigation=true;phase='primary teardown';await P.ctx.close();}
 const appSent:any[]=[];phase='standalone observation';
 const A=await open(browser,{play:false,settings:{voice:false,sound:false,autoPack:false,online:false,countPlayers:true},pre:()=>{
  (window as any).__svHelloTest='manual';Object.defineProperty(navigator,'standalone',{configurable:true,value:true});
 },route:async ctx=>{await attachDiagnostics(ctx,'standalone');await ctx.route('**/api/**',r=>r.fulfill({json:{}}));await ctx.route('**/api/hello',async r=>{appSent.push(r.request().postDataJSON());await r.fulfill({status:204,body:''});});}});
 try{
  assert.equal(await A.page.locator('.installchip').count(),0);assert.equal(await A.page.evaluate(()=>localStorage.getItem('sv2_install_confirmation')),'standalone');
  await A.page.evaluate(async()=>{const p=await import(String('/js/players.js'));p.countPlay('game','memory');await p.flush(false);});
  assert.ok(appSent.some(p=>p.install==='standalone'&&p.a===true),'actual app launch confirms its own pseudonymous device record');assert.deepEqual(A.errors,[]);
 }finally{await A.ctx.close();await fs.writeFile('out/install-flow/diagnostics.json',JSON.stringify({phase,unexpectedNavigation,diagnostics},null,2)+'\n');}
 return 'guide stays until explicit Hide or installation; Hide remembered and Settings retained; native acceptance unconfirmed; appinstalled/standalone proofs use existing opt-in hello; Analytics off sends nothing; six EN/VI guide layouts';
}

export async function installStudioCheck(browser:Browser){
 const root=path.resolve(import.meta.dirname,'..'),repo='fixture/install-review',password='synthetic-install-review-123',site='http://localhost:8796';
 const gh=fakeGitHub(repo,{'content/custom.json':'{}','js/build.js':await fs.readFile(path.join(root,'js/build.js'))}),unroute=routeGitHub(gh),players=memoryBlobs(),now=Date.now(),day=new Date(now).toISOString().slice(0,10);
 for(const[id,app,evidence]of[['install00001',false,'native'],['install00002',true,'standalone'],['install00003',false,'']]as const)await hello(players,{id,b:'v1.02',d:'tablet',os:'iPadOS',br:'Safari',a:app,install:evidence,days:[{d:day,build:'v1.02',m:1}]},now);
 const server=await fakeNetlify({port:8796,players,env:{STUDIO_PASSWORD:password,GITHUB_TOKEN:'fixture-token',GITHUB_REPO:repo,URL:site}});
 await fs.mkdir('out/install-studio',{recursive:true});
 try{for(const[device,w,h]of[['phone',390,844],['tablet',820,1180],['computer',1280,800]]as const)for(const lang of['en','vi']){
  const ctx=await browser.newContext({viewport:{width:w,height:h},hasTouch:device!=='computer',isMobile:device!=='computer'}),page=await ctx.newPage(),errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
  try{
   await page.addInitScript(lang=>localStorage.setItem('studioLang',lang),lang);await page.goto(site+'/studio');await page.fill('#pw',password);await page.click('#si button');await page.waitForSelector('#tabs button');await page.evaluate(()=>{location.hash='players';});await page.locator('.analytics-overview').waitFor();
   const tile=page.locator('.analytics-overview .tile').filter({hasText:lang==='vi'?'đã ghi nhận cài đặt':'installation observed'});assert.equal(await tile.locator('b').first().innerText(),'2');
   const details=page.locator('details[data-more=devices]');if(await details.getAttribute('open')===null)await details.locator('summary').click();
   assert.match(await page.locator('[data-devrow=install00001]').innerText(),lang==='vi'?/Trình duyệt đã xác nhận cài/:/Install confirmed by browser/);
   assert.match(await page.locator('[data-devrow=install00002]').innerText(),lang==='vi'?/Lần báo gần nhất trong ứng dụng/:/Last reported in app/);
   assert.match(await page.locator('[data-devrow=install00003]').innerText(),lang==='vi'?/Chưa xác nhận cài/:/Install unconfirmed/);
   assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),true);
   await page.screenshot({path:`out/install-studio/${device}-${lang}.png`,fullPage:true});assert.deepEqual(errors,[]);
  }finally{await ctx.close();}
 }}finally{await new Promise<void>(r=>server.close(()=>r()));unroute();}
 return 'synthetic opt-in installation counters and native/app/unconfirmed device indicators; six EN/VI Studio layouts, no horizontal overflow';
}
