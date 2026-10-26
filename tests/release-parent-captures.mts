// Release evidence only: real current modules with fresh synthetic profiles, never family data.
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {launch,open,clear,noWelcome} from './harness.mjs';
import {fakeGitHub,routeGitHub,fakeNetlify,memoryBlobs} from './studio-check.mjs';
const root=path.resolve(import.meta.dirname,'..'),out=path.join(root,'docs/v1.02-traditional-repairs/parent-studio-shots'),assets=path.join(root,'docs/website-review-20261023/assets/parent-controls');
await fs.mkdir(out,{recursive:true});const browser=await launch(),files:unknown[]=[];
try{
 for(const lang of ['en','vi']){
  const P=await open(browser,{w:820,h:1180,lang,settings:{online:false,countPlayers:false,voice:false}});
  try{
   await clear(P.page);await noWelcome(P.page);
   await P.page.evaluate(async(lang)=>{const S=await import(String('/js/state.js'));S.profiles[0].name=lang==='en'?'Example child':'Bé ví dụ';S.profiles[0].stats={};window.__sv.paused=true;await(await import(String('/js/ui.js'))).openGrownups();},lang);
   await P.page.locator('.grownups').waitFor();await P.page.locator('details[data-sec="players"]').evaluate((d:HTMLDetailsElement)=>d.open=true);
   await P.page.evaluate(()=>document.fonts.ready);await P.page.waitForFunction(()=>getComputedStyle(document.querySelector('.grownups')!).opacity==='1');
   for(const [device,w,h]of [['phone',390,844],['tablet',820,1180],['computer',1280,800]]as const){
    await P.page.setViewportSize({width:w,height:h});await P.page.screenshot({path:path.join(out,`settings-${device}-${lang}.png`),animations:'disabled'});
    if(device==='tablet')await P.page.locator('.grownups .card').screenshot({path:path.join(assets,`settings-${lang}.png`),animations:'disabled'});
   }
   await P.page.locator('.grownups [data-rep]').first().click();await P.page.locator('.modal.report').waitFor();await P.page.waitForFunction(()=>getComputedStyle(document.querySelector('.modal.report')!).opacity==='1');
   for(const [device,w,h]of [['phone',390,844],['tablet',820,1180],['computer',1280,800]]as const){
    await P.page.setViewportSize({width:w,height:h});await P.page.screenshot({path:path.join(out,`report-${device}-${lang}.png`),animations:'disabled'});
    if(device==='tablet')await P.page.locator('.report .card').screenshot({path:path.join(assets,`report-${lang}.png`),animations:'disabled'});
   }
   assert.deepEqual(P.errors,[]);
  }finally{await P.ctx.close();}
 }
 const repo='family/release-captures',password='synthetic-capture-password',site='http://localhost:8795';
 const unroute=routeGitHub(fakeGitHub(repo,{'content/custom.json':'{}','js/build.js':await fs.readFile(path.join(root,'js/build.js'),'utf8')}));
 const server=await fakeNetlify({port:8795,env:{STUDIO_PASSWORD:password,GITHUB_TOKEN:'fixture-only',GITHUB_REPO:repo,URL:site},players:memoryBlobs()});
 try{
  for(const lang of ['en','vi']){
   const ctx=await browser.newContext(),page=await ctx.newPage();try{
    await page.addInitScript(lang=>localStorage.setItem('studioLang',lang),lang);await page.goto(site+'/studio');await page.fill('#pw',password);await page.click('#si button');await page.locator('#tabs button').first().waitFor();
    await page.evaluate(()=>location.hash='content/quiz');await page.locator('#page .studio-help').waitFor();
    assert.match(await page.locator('#page').textContent()||'',lang==='en'?/private family/:/riêng/);
    for(const[device,w,h]of[['phone',390,844],['tablet',820,1180],['computer',1280,800]]as const){await page.setViewportSize({width:w,height:h});await page.screenshot({path:path.join(out,`studio-quiz-${device}-${lang}.png`),animations:'disabled'});}
   }finally{await ctx.close();}
  }
 }finally{await new Promise<void>(r=>server.close(()=>r()));unroute();}
 for(const file of await fs.readdir(assets))if(/^(settings|report)-(en|vi)\.png$/.test(file)){const bytes=await fs.readFile(path.join(assets,file));files.push({file,sha256:createHash('sha256').update(bytes).digest('hex')});}
 await fs.writeFile(path.join(assets,'manifest.json'),JSON.stringify({build:'v1.02',captured:'27 October 2026 AEDT',source:'Current release working tree; final immutable source recorded in the release review lock',method:'Actual running game, fresh synthetic profiles and empty report; current Studio with a synthetic server. Phone, tablet and computer, EN/VI. No real family data.',files},null,2)+'\n');
 console.log('Captured current Settings, empty Play reports and Studio quiz guidance: 18 device/language screenshots plus four website assets.');
}finally{await browser.close();}
