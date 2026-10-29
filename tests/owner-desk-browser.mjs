// Actual signed-in Studio + real routes, synthetic stores/providers only.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {itemControlRuntimeCheck} from './item-control-runtime.mjs';
import {fakeGitHub,routeGitHub,fakeNetlify,memoryBlobs} from './studio-check.mjs';
import {MemoryManagementTestDatabase} from '../netlify/lib/management/storage/memory-test.mts';
import {createFinanceService} from '../netlify/lib/management/finance.mts';

export async function ownerDeskBrowserCheck(browser){
 const repo='synthetic/owner-desk',password='synthetic-desk-password-123',site='http://localhost:8897',device='demo12345678',other='demo12345679';
 const output=path.resolve(process.env.STUDIO_OWNER_REVIEW_DIR||'../docs/studio-owner-desk-20261027/screenshots');fs.mkdirSync(output,{recursive:true});
 const gh=fakeGitHub(repo,{'content/custom.json':'{}','js/build.js':fs.readFileSync('../js/build.js'),'sw.js':fs.readFileSync('../sw.js')});const undo=routeGitHub(gh);
 const players=memoryBlobs(),testers=memoryBlobs(),web=memoryBlobs(),database=new MemoryManagementTestDatabase(),today=new Date().toISOString().slice(0,10),month=today.slice(0,7);
 for(const [id,name]of [[device,'Demo Linh'],[other,'Demo Minh']]){
  await players.setJSON('info/'+id,{first:today,last:today,build:'v1.02',kind:'tablet',os:'iOS',br:'Safari'});await players.set('label/'+id,'Synthetic tablet '+id.slice(-2));
  await players.setJSON('d/'+today+'/'+id,{mins:15,tales:1,games:{oanquan:2},kind:'tablet',build:'v1.02',builds:{'v1.02':true},children:{demo:{n:name,a:'little',m:15,g:{oanquan:[2,1,1]},t:1}}});
 }
 await testers.setJSON('p/1234567890abcdef',{k:'1234567890abcdef',title:'Synthetic linked problem',devices:[device],firstAt:Date.now()-1000,lastAt:Date.now(),status:'new',builds:['v1.02'],where:{game:'oanquan'}});
 await testers.setJSON('p/1234567890abcdea',{k:'1234567890abcdea',title:'Other installation problem',devices:[other],firstAt:Date.now()-1000,lastAt:Date.now(),status:'new',builds:['v1.02']});
 await web.setJSON('sum/'+today,{pageViews:{'/':20},playConversions:4,activeTimeTotalSec:90});
 const finance=createFinanceService({database});await finance.configure({expectedRevision:0,reportingCurrency:'AUD',reason:'Synthetic UI review only'},'Synthetic owner');
 const importBody={expectedSettingsRevision:1,lines:[{schemaVersion:1,provider:'ExampleOnly',accountAlias:'synthetic',sourceDocumentId:'DEMO-INVOICE',sourceLineId:'1',kind:'actual',amountMinor:1200,taxMinor:120,currency:'AUD',periodStart:month+'-01',periodEnd:today,recognisedAt:today+'T00:00:00Z',paidAt:null,category:'hosting',expectedRevision:0,costType:'fixed'}]};
 const preview=await finance.preview(importBody);await finance.commit({...importBody,previewHash:preview.previewHash,operationId:crypto.randomUUID(),reason:'Synthetic UI fixture only'},'Synthetic owner');
 const liveStore=memoryBlobs();let liveEtag=0;const liveSet=liveStore.setJSON;
 liveStore.getWithMetadata=async key=>{const data=await liveStore.get(key,{type:'json'});return data?{data,etag:String(liveEtag)}:null;};
 liveStore.setJSON=async(key,value)=>{await liveSet(key,value);liveEtag++;return {modified:true};};
 const server=await fakeNetlify({port:8897,liveStore,players,testerStore:testers,parentAnalyticsStore:web,managementDatabase:database,env:{STUDIO_PASSWORD:password,GITHUB_TOKEN:'synthetic-token',GITHUB_REPO:repo,URL:site}});
 const captures=[],errors=[];let projectedOff=null;
 const area=async(page,key)=>{await page.locator(`#tabs [data-k="${key}"]`).click();await page.waitForFunction(key=>document.querySelector('#tabs [aria-current=page]')?.getAttribute('data-k')===key,key);await page.waitForFunction(()=>!document.querySelector('.desk-body [role=status]')||!!document.querySelector('.desk-source-warning'));await page.waitForTimeout(100);};
 try{
  for(const [width,height]of [[390,844],[820,1180],[1440,1000]])for(const lang of ['en','vi']){
   const ctx=await browser.newContext({viewport:{width,height},isMobile:width===390,hasTouch:width<1000}),page=await ctx.newPage();
   page.on('pageerror',e=>errors.push({width,lang,message:e.message}));page.on('dialog',async d=>{errors.push({width,lang,message:'unexpected-dialog: '+d.message()});await d.dismiss();});await page.addInitScript(lang=>localStorage.setItem('studioLang',lang),lang);
   await page.goto(site+'/studio');await page.fill('#pw',password);await page.click('#si button');await page.waitForSelector('.desk-body [data-chart="G01"]');
   await page.waitForFunction(()=>document.documentElement.dataset.gameBrand==='shared');
   assert.equal(await page.locator('#tabs button').count(),5);assert.equal(await page.locator('#tabs [aria-current="page"]').getAttribute('data-k'),'home');
   assert.equal(await page.locator('.desk-valley').getAttribute('src'),'/studio/game/icons/launch/valley-landscape.jpg');
   assert.equal(await page.locator('.desk-heading h2').innerText(),lang==='vi'?'Trang chủ':'Home');
   assert.equal(await page.locator('.desk-home-summary>div').count(),6,'Home keeps a bounded six-measure snapshot');
   assert.ok(await page.locator('[data-home-priorities] .desk-priority').count()<=3,'Home limits priorities');
   assert.equal(await page.locator('.desk-readiness').count(),1,'Home explains content/control audit limits');
   assert.ok(!(await page.locator('.desk-home-summary').innerText()).includes('Demo Linh'),'Home contains no child names');
   const save=async key=>{assert.deepEqual(await page.evaluate(()=>[...(window.__svNoArt||[])]),[],'game drawings cover every visible icon');assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false,key+' overflow');await page.evaluate(()=>scrollTo(0,0));const file=`${lang}-${width}-${key}.png`;await page.screenshot({path:path.join(output,file),fullPage:true});const viewportFile=file.replace('.png','-viewport.png');await page.screenshot({path:path.join(output,viewportFile)});captures.push({lang,width,height,key,file,viewportFile});};
   assert.equal(await page.locator('.desk-public-links a').last().getAttribute('href'),'/home/');assert.ok((await page.evaluate(()=>getComputedStyle(document.body).fontFamily)).includes(lang==='vi'?'Baloo 2':'Fredoka'));await save('today');await area(page,'people');assert.match(await page.locator('.desk-person-list').innerText(),/Demo Linh/);await save('people');
   await page.locator('.desk-period select').selectOption('7');await page.locator('.desk-period button').click();await page.waitForFunction(()=>new URLSearchParams(location.hash.split('?')[1]).get('days')==='7'&&!!document.querySelector('.desk-person-list'));
   await page.locator(`[data-desk-route="managementdevice:${device}"]`).click();await page.waitForSelector('[data-chart="G04"]');
   assert.match(await page.locator('.mg-content').innerText(),/Synthetic linked problem/);assert.ok(!(await page.locator('.mg-content').innerText()).includes('Other installation problem'));
   await save('device');await page.locator('#crumb .back').click();await page.waitForSelector('.desk-person-list');assert.equal(await page.locator('.desk-period select').inputValue(),'7','Back restores filter');
   await area(page,'game');await page.waitForSelector('[data-desk-search]');await page.locator('[data-desk-search]').fill('__no_match__');assert.equal(await page.locator('.desk-catalogue button:visible').count(),0,'search actually hides unmatched entries');await page.locator('[data-desk-search]').fill('oanquan');await page.waitForTimeout(50);
   const item=page.locator('.desk-catalogue [data-desk-route="managementactivity:game:oanquan"]');assert.equal(await item.isVisible(),true);await save('game');await item.click();await page.waitForSelector('.mg-content .mg-facts');assert.equal(await page.locator('.mg-error').count(),0,'kind:id preserved in navigation');
   await page.waitForSelector('[data-item-editor]');
   const itemForm=page.locator('[data-item-editor]');
   const beforePublic=await (await ctx.request.get(site+'/api/live')).json();
   await itemForm.locator('[name=itemEnabled]').selectOption('false');await itemForm.locator('[name=itemReason]').fill('Synthetic item off review');
   await itemForm.locator('[type=submit]').click();await page.waitForFunction(()=>/Private proposal saved|Đã lưu đề xuất riêng tư/.test(document.querySelector('[data-item-result]')?.textContent||''));
   assert.deepEqual(await (await ctx.request.get(site+'/api/live')).json(),beforePublic,'item Save stays private');
   const itemDraft=await itemForm.locator('[name=itemDraft]').inputValue();assert.ok(itemDraft);assert.equal(await itemForm.locator('[data-item-publish]').isDisabled(),true);
   await page.locator('[data-item-reload]').click();await page.waitForSelector('[data-item-editor] [name=itemDraft]');await page.locator('[name=itemDraft]').selectOption(itemDraft);
   await page.waitForFunction(()=>document.querySelector('[name=itemEnabled]')?.value==='false'&&!document.querySelector('[data-item-review]')?.disabled);
   await page.locator('[data-item-review]').click();await page.waitForFunction(()=>!document.querySelector('[data-item-publish]')?.disabled);await save('item-review');
   await page.locator('[data-item-publish]').click();await page.waitForFunction(()=>/Published and available|Đã xuất bản và cung cấp/.test(document.querySelector('[data-item-result]')?.textContent||''));
   projectedOff=await (await ctx.request.get(site+'/api/live')).json();assert.equal(projectedOff.content.itemAvailability['game:oanquan'],false);
   await page.locator('[data-item-reload]').click();await page.waitForSelector('[data-item-editor]');assert.equal(await page.locator('[name=itemEnabled]').inputValue(),'false');
   await area(page,'game');await page.locator('[data-desk-discovery]').selectOption('declared-only');await page.locator('[data-desk-search]').fill('aodai');
   const declared=page.locator('.desk-catalogue [data-desk-route="managementactivity:game:aodai"]');assert.equal(await declared.isVisible(),true);
   assert.match(await declared.innerText(),lang==='vi'?/Chỉ mới khai báo/:/Declared only/);assert.ok(await page.locator('.desk-catalogue [data-catalogue-state=declared-only]:visible').count()>0);assert.equal(await page.locator('.desk-catalogue [data-catalogue-state=catalogued]:visible').count(),0);await declared.click();
   await page.waitForSelector('.mg-declared-only');await page.waitForSelector('[data-item-workspace]');assert.equal(await page.locator('[data-item-editor]').count(),0,'pending integration cannot be switched on');assert.match(await page.locator('.mg-declared-only').innerText(),lang==='vi'?/chưa được tích hợp/:/not integrated/);await save('declared');await page.locator('#crumb .back').click();await page.waitForSelector('[data-desk-discovery]');assert.equal(await page.locator('[data-desk-discovery]').inputValue(),'declared-only','Back restores the integration filter');assert.equal(await page.locator('[data-desk-search]').inputValue(),'aodai','Back restores the content search');
   await area(page,'work');await save('work');await area(page,'money');await page.waitForSelector('[data-chart="G21"]');await save('money');
   await page.goto(site+'/studio/#setup/settings');await page.waitForSelector('[data-functions-editor]');
   assert.equal(await page.locator('[data-functions-editor] textarea').count(),1,'function editor uses plain-language controls');
   const beforePolicy=await (await ctx.request.get(site+'/api/live')).json();
   for(const field of ['functionCollect','functionProcess','functionShow'])await page.locator('[name='+field+']').uncheck();
   await page.locator('[name=functionReason]').fill('Synthetic policy shutoff review');await page.locator('[data-functions-editor] [type=submit]').click();
   await page.waitForFunction(()=>/Private policy saved|Đã lưu chính sách riêng tư/.test(document.querySelector('[data-functions-result]')?.textContent||''));
   assert.deepEqual(await (await ctx.request.get(site+'/api/live')).json(),beforePolicy,'function proposal remains private');
   const policyDraft=await page.locator('[name=functionDraft]').inputValue();await page.locator('[data-functions-reload]').click();await page.waitForSelector('[name=functionDraft]');
   await page.locator('[name=functionDraft]').selectOption(policyDraft);await page.waitForFunction(()=>!document.querySelector('[data-functions-review]')?.disabled);
   if(width===390&&lang==='en'){
    await page.locator('[name=functionProcess]').check();await page.locator('[data-functions-editor] [type=submit]').click();
    await page.waitForFunction(()=>/Private policy saved/.test(document.querySelector('[data-functions-result]')?.textContent||''));
    await page.locator('[data-functions-review]').click();await page.waitForFunction(()=>!document.querySelector('[data-functions-publish]')?.disabled);
    assert.match(await page.locator('[data-functions-comparison]').innerText(),/AEDT|AEST/,'saved expiry is shown in Sydney time');
    await page.locator('[name=functionProcess]').uncheck();assert.equal(await page.locator('[data-functions-publish]').isDisabled(),true,'editing resets review');
    await page.locator('[data-functions-editor] [type=submit]').click();await page.waitForFunction(()=>/Private policy saved/.test(document.querySelector('[data-functions-result]')?.textContent||''));
   }
   await page.locator('[data-functions-review]').click();await page.waitForFunction(()=>!document.querySelector('[data-functions-publish]')?.disabled);await save('functions');await page.locator('[data-functions-editor]').screenshot({path:path.join(output,`${lang}-${width}-functions-editor.png`)});assert.ok(await page.locator('[data-functions-editor] label.chk').evaluateAll(els=>els.every(e=>e.getBoundingClientRect().height>=44)),'function toggle labels are touch-sized');
   await page.locator('[data-functions-publish]').click();await page.waitForFunction(()=>/Published and available|Đã xuất bản và cung cấp/.test(document.querySelector('[data-functions-result]')?.textContent||''));
   const publishedPolicy=await (await ctx.request.get(site+'/api/live')).json();assert.deepEqual(publishedPolicy.content.reportingPolicy,{schemaVersion:1,collect:false,process:false,show:false,expiresAt:null});
   const overview=await (await ctx.request.get(site+'/studio/api/management/overview')).json();assert.equal(overview.optionalReporting.process,false);assert.equal(overview.optionalReporting.show,false);assert.equal('telemetry' in overview,false);
   const event={schemaVersion:1,eventId:crypto.randomUUID(),attemptId:crypto.randomUUID(),deviceId:device,sessionId:'demo123456789012',eventName:'boot.started',occurredAt:new Date().toISOString(),deviceDay:today,offsetMinutes:660,build:'v1.02',sourceCommit:null,environment:'local',traffic:'synthetic_bot',data:{stage:'boot'}};
   assert.equal((await ctx.request.post(site+'/api/management/events',{data:{schemaVersion:1,events:[event]}})).status(),410,'server rejects stale clients after collection Off');
   await page.locator('#tabs [data-k=home]').click();await page.waitForSelector('.desk-home-summary');await page.waitForSelector('[data-home-functions]');assert.match(await page.locator('[data-home-functions]').innerText(),lang==='vi'?/Thu thập tắt/:/Collect off/);
   await ctx.close();
  }
  // A summary-only account sees no names, private device API, Money or finance request.
  const owner=await browser.newContext();assert.equal((await owner.request.post(site+'/studio/api/login',{data:{password}})).status(),200);
  assert.equal((await owner.request.post(site+'/studio/api/admins/save',{headers:{'X-Studio':'1'},data:{name:'summary-fixture',password:'synthetic-summary-password',role:'custom',perms:['management.read']}})).status(),200);assert.equal((await owner.request.post(site+'/studio/api/admins/twostep',{headers:{'X-Studio':'1'},data:{name:'summary-fixture',on:false}})).status(),200);await owner.close();
  const ctx=await browser.newContext(),requests=[];const login=await ctx.request.post(site+'/studio/api/login',{data:{name:'summary-fixture',password:'synthetic-summary-password'}});assert.equal(login.status(),200);assert.equal((await login.json()).step,undefined);const page=await ctx.newPage();page.on('request',r=>requests.push(r.url()));await page.goto(site+'/studio');await page.waitForSelector('.desk-body [data-chart="G01"]');await area(page,'people');
  assert.equal(await page.locator('#tabs [data-k="money"]').count(),0);assert.ok(!(await page.locator('#page').innerText()).includes('Demo Linh'));assert.ok(!requests.some(url=>/management\/(children|finance)/.test(url)));
  assert.equal((await ctx.request.get(site+'/studio/api/management/devices/'+device)).status(),403);assert.equal((await ctx.request.get(site+'/studio/api/management/finance')).status(),403);await ctx.close();
  // Losing a public catalogue source must not turn unknown coverage into a healthy zero.
  const missing=await browser.newContext();await missing.addInitScript(()=>localStorage.setItem('studioLang','en'));await missing.request.post(site+'/studio/api/login',{data:{password}});
  const failedPage=await missing.newPage();await failedPage.route('**/studio/api/management/activities?summary=1',r=>r.fulfill({status:503,contentType:'application/json',body:JSON.stringify({error:'synthetic_source_unavailable'})}));
  await failedPage.goto(site+'/studio');await failedPage.waitForSelector('.desk-home-summary');
  assert.match(await failedPage.locator('.desk-home-summary>div').nth(3).innerText(),/Unavailable/);
  assert.match(await failedPage.locator('.desk-readiness').innerText(),/No completeness percentage/);
  await failedPage.route('**/studio/api/management/overview?*',r=>r.fulfill({status:200,contentType:'application/json',body:JSON.stringify({metrics:[{id:'M01',value:0},{id:'M04',value:0}],totals:{errors:0},dailySeries:[{date:today,reportingBuckets:0,activeDevices:null}],attention:{open:null}})}));
  await failedPage.reload();await failedPage.waitForSelector('.desk-home-summary');
  for(const index of [0,1,2])assert.match(await failedPage.locator('.desk-home-summary>div').nth(index).innerText(),/Unavailable/,'No retained source days is unknown, not observed zero');
  await missing.close();
  const itemControlEvidence=await itemControlRuntimeCheck(browser,projectedOff);
  assert.deepEqual(errors,[]);
  const sources=['studio/ui/functions.ts','netlify/lib/management/functions.mts','js/core/reporting-policy.ts','js/management-telemetry.ts','js/players.ts','studio/ui/item-workspace.ts','netlify/lib/management/items.mts','js/custom.ts','js/games/frame.ts','js/tales.ts','studio/ui/app.ts','studio/ui/owner-desk.ts','studio/ui/owner-desk.css','studio/ui/brand.ts','studio/ui/desk-charts.ts','studio/ui/management.ts','netlify/lib/management/read.mts','studio/ui/index.html','studio/ui/finance.ts','netlify/lib/management/http.mts','netlify/lib/management/transactional/service.mts','css/style.css','css/fonts.css','js/art.ts','js/icons.js'];
  fs.writeFileSync(path.resolve(output,'../browser-validation.json'),JSON.stringify({passed:true,itemControlEvidence,scope:'Actual Studio UI and authenticated routes, synthetic in-memory data only; browser emulation, not physical devices/live Netlify',captures,errors,sourceHashes:Object.fromEntries(sources.map(file=>[file,createHash('sha256').update(fs.readFileSync('../'+file)).digest('hex')]))},null,2)+'\n');
  return 'Owner’s Desk: 5 areas, shared game palette/art, 54 EN/VI captures at 3 sizes; function policy save/review/publication and server shutoff; item proposal save/resume/review/publish and actual game/story boundary checks, real device/problem links, restored filter, kind:id navigation and summary-only privacy';
 }finally{undo();await new Promise(r=>server.close(r));}
}
