import fs from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import { launch } from './harness.mjs';
import { fakeGitHub, routeGitHub, fakeNetlify, memoryBlobs } from './studio-check.mjs';
const root=path.resolve(import.meta.dirname,'..'),folder=path.join(root,'docs/v1.02-orchard-arcade/studio');await fs.mkdir(folder,{recursive:true});
const repo='family/arcade-audit',password='synthetic-arcade-studio-123',site='http://localhost:8798';
const gh=fakeGitHub(repo,{'content/custom.json':'{}','js/build.js':await fs.readFile(path.join(root,'js/build.js'))}),unroute=routeGitHub(gh),players=memoryBlobs();
const {hello}=await import('../netlify/lib/players.mts'),now=Date.now(),day=new Date(now).toISOString().slice(0,10);
for(const[id,d]of[['syntheticphone001','phone'],['synthetictablet01','tablet']])await hello(players,{id,b:'v1.02',l:'en',d,os:d==='phone'?'iOS':'Android',br:'Safari',sc:'390x844',k:1,days:[{d:day,build:'v1.02',m:12,g:{pattern:2}}]},now);
const server=await fakeNetlify({port:8798,players,env:{STUDIO_PASSWORD:password,GITHUB_TOKEN:'fixture-token',GITHUB_REPO:repo,URL:site}});
const browser=await launch(),notes:unknown[]=[];
try{
 for(const[device,width,height]of[['phone',390,844],['tablet',820,1180],['computer',1280,800]]as const)for(const lang of['en','vi']){
  const ctx=await browser.newContext({viewport:{width,height},hasTouch:device!=='computer',isMobile:device!=='computer'}),pg=await ctx.newPage(),errors:string[]=[];pg.on('pageerror',e=>errors.push(e.message));
  await pg.addInitScript(lang=>localStorage.setItem('studioLang',lang),lang);await pg.goto(site+'/studio');await pg.fill('#pw',password);await pg.click('#si button');await pg.waitForSelector('#tabs button');await pg.evaluate(()=>{location.hash='players';});await pg.locator('.analytics-overview').waitFor();
  const count=await pg.locator('.analytics-overview .tile').count();assert.ok(count>=5);
  const summary=pg.locator('.analytics-overview > summary');assert.match(await summary.innerText(),lang==='vi'?/Tổng quan/:/At a glance/);
  await summary.click();assert.equal(await pg.locator('.analytics-overview .tiles').isVisible(),false);await summary.click();assert.equal(await pg.locator('.analytics-overview .tile').count(),count);
  const bounds=await pg.evaluate(()=>({body:document.documentElement.scrollWidth,width:innerWidth,tiles:[...document.querySelectorAll('.analytics-overview .tile')].map(e=>{const r=e.getBoundingClientRect();return{x:r.x,y:r.y,w:r.width};})}));assert.ok(bounds.body<=bounds.width+1,'no document overflow');
  for(const tile of bounds.tiles){assert.ok(tile.x>=0&&tile.x+tile.w<=width+1);const row=bounds.tiles.filter(t=>Math.abs(t.y-tile.y)<1);assert.ok(row.every(t=>Math.abs(t.w-tile.w)<1));}
  await summary.scrollIntoViewIfNeeded();await pg.screenshot({path:path.join(folder,`${device}-${lang}-analytics.png`)});
  // These switches are real Studio release controls, not an unconnected settings mock.
  await pg.evaluate(()=>{location.hash='game/releases';});await pg.locator('[data-id=sparkleorchard_tester]').waitFor();
  for(const id of['sparkleorchard','sparklefruitbar'])for(const mode of['tester','single','multi'])assert.equal(await pg.locator(`[data-id="${id}_${mode}"]`).count(),1);
  await pg.locator('[data-id=sparkleorchard_tester]').scrollIntoViewIfNeeded();await pg.screenshot({path:path.join(folder,`${device}-${lang}-switches.png`)});
  notes.push({device,lang,tiles:count,collapsesAndRestores:true,noDocumentOverflow:true,sixIndependentStudioSwitches:true,errors});assert.deepEqual(errors,[]);await ctx.close();
 }
}finally{await browser.close();unroute();server.close();await fs.writeFile(path.join(folder,'results.json'),JSON.stringify(notes,null,2)+'\n');}
console.log(JSON.stringify(notes));
