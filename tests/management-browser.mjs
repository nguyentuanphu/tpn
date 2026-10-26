// Real authenticated Studio UI and read routes; all family records below are synthetic.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
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
  const server=await fakeNetlify({port:8796,players,liveStore,testerStore,managementDatabase:new MemoryManagementTestDatabase(),env:{STUDIO_PASSWORD:password,GITHUB_TOKEN:'fixture-token',GITHUB_REPO:repo,URL:site}});
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
    fs.writeFileSync(path.join(output,'capture-source.json'),JSON.stringify({capturedAt:new Date().toISOString(),fixture:'Synthetic records; real owner sign-in, Studio routes and UI; no production data',captures},null,2)+'\n');
    return 'EN/VI: authenticated summary, child/device linkage, activity lookup and same-page filters at phone/tablet/desktop sizes; six captures';
  } finally {server.close();unroute();}
}
