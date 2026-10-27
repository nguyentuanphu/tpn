// Real authenticated Studio UI and read routes; all family records below are synthetic.
import { managementRuntimeBrowserCheck } from './management-runtime-browser.mjs';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { createOperationsControl } from '../netlify/lib/management/operations-control.mts';
import { MemoryManagementTestDatabase } from '../netlify/lib/management/storage/memory-test.mts';
import { fakeGitHub, routeGitHub, fakeNetlify, memoryBlobs } from './studio-check.mjs';

export async function managementBrowserCheck(browser) {
  const repo='family/management-validation',password='synthetic-management-password',site='http://localhost:8796';
  const gh=fakeGitHub(repo,{'content/custom.json':'{}','js/build.js':fs.readFileSync('../js/build.js')});
  const unroute=routeGitHub(gh),players=memoryBlobs(),today=new Date().toISOString().slice(0,10),id='demo12345678';
  await players.setJSON('info/'+id,{first:today,last:today,build:'v1.01',kind:'tablet',os:'iOS',br:'Safari'});
  await players.set('label/'+id,'Synthetic tablet');
  await players.setJSON('d/'+today+'/'+id,{mins:10,tales:1,build:'v1.01',builds:{'v1.01':true},kind:'tablet',games:{oanquan:1},children:{'demo-profile':{n:'Demo',a:'little',m:10,g:{oanquan:[1,1,0]},t:1}}});
  const liveStore=memoryBlobs(),originalSet=liveStore.setJSON;
  let etag=0;
  liveStore.getWithMetadata=async key=>{const data=await liveStore.get(key,{type:'json'});return data?{data,etag:String(etag)}:null;};
  liveStore.setJSON=async(key,value,options)=>{
    if(options?.onlyIfNew&&liveStore._m.has(key)||options?.onlyIfMatch&&options.onlyIfMatch!==String(etag))return {modified:false};
    await originalSet(key,value);etag++;return {modified:true};
  };
  const testerStore=memoryBlobs();
  await testerStore.setJSON('p/1234567890abcdef',{k:'1234567890abcdef',title:'Synthetic activity report',kind:'error',status:'new',firstAt:Date.now(),lastAt:Date.now(),where:{game:'oanquan'},builds:{'v1.01':1},devices:[id]});
  const managementDatabase=new MemoryManagementTestDatabase();let dispatched=null,sends=0;
  const managementOperations=createOperationsControl({database:managementDatabase,config:()=>({githubToken:'synthetic-token',githubRepo:repo,githubBranch:'work'}),fetcher:async(_url,opt)=>{
    if(opt.method==='POST'){sends++;dispatched=JSON.parse(opt.body).inputs.management_operation_id;return new Response(null,{status:204});}
    return Response.json({workflow_runs:dispatched?[{id:42,path:'.github/workflows/nightly-child-bots.yml',display_title:'Child bots management:'+dispatched,status:'completed',conclusion:'failure',head_sha:'a'.repeat(40),run_attempt:1,created_at:new Date().toISOString(),updated_at:new Date().toISOString()}]:[]},{headers:{'x-ratelimit-limit':'5000','x-ratelimit-remaining':'4990'}});
  }});
  const server=await fakeNetlify({port:8796,players,liveStore,testerStore,managementDatabase,managementOperations,env:{STUDIO_PASSWORD:password,GITHUB_TOKEN:'fixture-token',GITHUB_REPO:repo,URL:site}});
  const output=path.resolve('../docs/studio-management-foundation/screenshots/implementation');fs.mkdirSync(output,{recursive:true});
  const captures=[];
  try {
    for(const [width,height] of [[390,844],[820,1180],[1440,1000]]) {
      for(const lang of ['en','vi']) {
        const context=await browser.newContext({viewport:{width,height},hasTouch:width<1000,isMobile:width===390});
        try {
          const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
          await page.addInitScript(lang=>localStorage.setItem('studioLang',lang),lang);
          await page.goto(site+'/studio/');await page.fill('#pw',password);await page.click('#si button');await page.waitForSelector('#tabs button');
          await page.evaluate(()=>{location.hash='players/management';});
          await page.waitForSelector('.mg-content .mg-grid');
          assert.equal(await page.locator('.mg-error').count(),0);
          await page.click('[data-mg-nav=devices]');await page.waitForSelector('[data-mg-open=device]');
          assert.match(await page.locator('.mg-content').innerText(),/Demo/);
          await page.click('[data-mg-open=device]');await page.waitForSelector('.mg-child');
          assert.match(await page.locator('.mg-child').innerText(),/Demo/);
          assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false,'device details overflow');
          const filename=`${lang}-${width}-device.png`;await page.screenshot({path:path.join(output,filename),fullPage:true});captures.push(filename);
          await page.click('[data-mg-nav=activities]');await page.waitForSelector('[data-mg-lookup]');
          await page.locator('[name=activityId]').fill('oanquan');await page.locator('[data-mg-lookup] button').click();
          await page.waitForSelector('.mg-content .mg-facts');assert.equal(await page.locator('.mg-error').count(),0);
          await page.click('[data-mg-nav=devices]');await page.waitForSelector('[data-mg-open=device]');
          await page.locator('[name=search]').fill('nonexistent-synthetic');await page.locator('.mg-filters button').click();
          await page.waitForFunction(()=>!document.querySelector('[data-mg-open=device]')&&!document.querySelector('.mg-loading'));
          assert.equal(await page.locator('.mg-error').count(),0,'same-page filter navigation must reload');
          await page.click('[data-mg-nav=attention]');await page.waitForSelector('[name=problem]');
          await page.locator('[name=owner]').fill('Synthetic operator');await page.locator('[name=nextAction]').fill('Retest the reported activity');
          await page.locator('[name=reason]').fill('Synthetic triage validation');await page.locator('.mg-editor button[type=submit]').click();
          await page.waitForFunction(()=>document.querySelector('.mg-attention')?.textContent.includes('Synthetic operator'));
          await page.click('[data-mg-nav=changes]');await page.waitForSelector('[name=configBody]');
          await page.waitForFunction(()=>!!document.querySelector('[name=configBody]')?.value);
          const before=await page.locator('[name=configBody]').inputValue();
          await page.locator('[name=configBody]').fill(JSON.stringify({...JSON.parse(before),releases:{managementTelemetry:{on:true}}}));
          await page.locator('[name=reason]').fill('Synthetic browser validation');await page.locator('.mg-editor button[type=submit]').click();
          await page.waitForFunction(()=>/Saved and available|Đã lưu và cung cấp/.test(document.querySelector('[data-config-result]')?.textContent||''));
          const publicLive=await (await context.request.get(site+'/api/live')).json();
          assert.ok(publicLive.management.revision>0);assert.equal(publicLive.releases.managementTelemetry.on,true);
          const blocked=await context.request.post(site+'/studio/api/live',{headers:{'X-Studio':'1'},data:{releases:{}}});assert.equal(blocked.status(),409);
          await page.click('[data-mg-nav=operations]');await page.waitForSelector('[name=operationKind]');
          assert.match(await page.locator('.mg-content').innerText(),/4[,.]990/);
          if(width===390&&lang==='en'){
            await page.locator('[name=operationReason]').fill('Synthetic browser operation');await page.locator('.mg-editor button[type=submit]').click();
            await page.waitForFunction(()=>/Recorded operation/.test(document.querySelector('[data-operation-result]')?.textContent||''));
            assert.match(await page.locator('[data-operation-result]').innerText(),/Succeeded/);
            await page.click('[data-mg-nav=overview]');await page.waitForSelector('.mg-content .mg-grid');
            await page.click('[data-mg-nav=operations]');await page.waitForSelector('[name=operationKind]');
            await page.selectOption('[name=operationKind]','bot');await page.locator('[name=operationReason]').fill('Synthetic bounded bot request');
            await page.locator('.mg-editor button[type=submit]').click();await page.waitForFunction(()=>/Recorded operation/.test(document.querySelector('[data-operation-result]')?.textContent||''));
            assert.match(await page.locator('[data-operation-result]').innerText(),/Queued/);assert.equal(sends,1);
            await page.click('[data-mg-nav=overview]');await page.waitForSelector('.mg-content .mg-grid');
            await page.click('[data-mg-nav=operations]');await page.waitForSelector('[name=operationKind]');
            assert.match(await page.locator('.mg-content').innerText(),/42/);assert.match(await page.locator('.mg-content').innerText(),/Failed/);
          }
          assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false,'operations overflow');
          const opsFilename=`${lang}-${width}-operations.png`;await page.screenshot({path:path.join(output,opsFilename),fullPage:true});captures.push(opsFilename);
          await page.click('[data-mg-nav=finance]');
          if(width===390&&lang==='en'){
            await page.waitForSelector('[data-fin-setup]');await page.locator('[data-fin-setup] [name=reason]').fill('Synthetic ledger setup');await page.locator('[data-fin-setup] button').click();
            await page.waitForSelector('[data-fin-line]');
            const f=page.locator('[data-fin-line]');
            for(const [name,value]of Object.entries({provider:'Netlify',accountAlias:'synthetic-browser',sourceDocumentId:'browser-invoice',sourceLineId:'line-1',amount:'42.50',tax:'4.25',reason:'Synthetic browser invoice'}))await f.locator('[name='+name+']').fill(value);
            await f.locator('[name=reconciled]').check();await f.locator('button[type=submit]').click();await page.waitForSelector('[data-fin-confirm]');await page.click('[data-fin-confirm]');
            await page.waitForFunction(()=>document.querySelector('[data-fin-save-result]')?.textContent.includes('Saved'));
            await page.click('[data-mg-nav=overview]');await page.waitForSelector('.mg-grid');await page.click('[data-mg-nav=finance]');await page.waitForSelector('[data-fin-edit]');
            assert.match(await page.locator('[data-fin-main]').innerText(),/AUD 42.50/);
            await page.click('[data-fin-edit]');await page.locator('[data-fin-line] [name=amount]').fill('50.25');await page.locator('[data-fin-line] [name=reason]').fill('Synthetic corrected invoice');await page.locator('[data-fin-line] button[type=submit]').click();await page.waitForSelector('[data-fin-confirm]');await page.click('[data-fin-confirm]');await page.waitForFunction(()=>document.querySelector('[data-fin-save-result]')?.textContent.includes('Saved'));
            await page.click('[data-mg-nav=overview]');await page.waitForSelector('.mg-grid');await page.click('[data-mg-nav=finance]');await page.waitForSelector('[data-fin-history]');await page.click('[data-fin-history]');
            await page.waitForFunction(()=>document.querySelector('[data-fin-history-result]')?.textContent.includes('Synthetic corrected invoice'));
            assert.match(await page.locator('[data-fin-main]').innerText(),/AUD 50.25/);
            const csvResponse=await context.request.get(site+'/studio/api/management/finance/export');assert.equal(csvResponse.status(),200);assert.equal(csvResponse.headers()['cache-control'],'private, no-store');
            const preview=await context.request.post(site+'/studio/api/management/finance/preview',{headers:{'X-Studio':'1'},data:{csv:await csvResponse.text(),expectedSettingsRevision:1}});assert.equal(preview.status(),200);assert.equal((await preview.json()).rows[0].status,'duplicate');
          }else await page.waitForSelector('[data-fin-line]');
          assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false,'finance overflow');
          // Collapse long entry forms for overview screenshots; every field is still accessible.
          await page.locator('[data-fin-controls] details').evaluateAll(nodes=>nodes.forEach(n=>n.open=false));
          await page.evaluate(()=>{window.scrollTo(0,0);document.querySelectorAll('.mg-table-wrap').forEach(el=>el.scrollLeft=0);});
          const finFilename=`${lang}-${width}-finance.png`;await page.screenshot({path:path.join(output,finFilename),fullPage:true});captures.push(finFilename);
          assert.deepEqual(errors,[]);
        } finally {await context.close();}
      }
    }
    // Management reporting remains available when the optional GitHub editor connection is absent.
    process.env.GITHUB_TOKEN='';
    const isolated=await browser.newContext();
    try {
      const page=await isolated.newPage();await page.goto(site+'/studio/#management');
      await page.fill('#pw',password);await page.click('#si button');
      await page.waitForSelector('.mg-content .mg-grid');assert.equal(await page.locator('.mg-error').count(),0);
    } finally {await isolated.close();}
    await managementRuntimeBrowserCheck(browser);
    fs.writeFileSync(path.join(output,'capture-source.json'),JSON.stringify({capturedAt:new Date().toISOString(),fixture:'Synthetic records; real owner sign-in, Studio routes and UI; no production data',captures},null,2)+'\n');
    return 'EN/VI: authenticated summary, child/device linkage, activity lookup and same-page filters at phone/tablet/desktop sizes; eighteen captures; finance setup, preview/save/correction/history/CSV duplicate checks; bounded operation submission, durable results and provider-run reconciliation';
  } finally {server.close();unroute();}
}
