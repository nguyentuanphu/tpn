import assert from 'node:assert/strict';
import {launch,open,clear} from './harness.mts';
import {BUILD} from '../js/build.js'; // (a report carries the build the game is running; was 'r76' written in, red once the version moved to r77)
const browser=await launch();
try {
 const P=await open(browser,{w:390,h:844,touch:true,route:async ctx=>{
  await ctx.route('**/content/custom.json*',r=>r.fulfill({contentType:'application/json',body:'{}'}));
  await ctx.route('**/api/live**',r=>r.fulfill({contentType:'application/json',body:JSON.stringify({releases:{tester:{on:true,devices:['tester000001']}}})}));
  await ctx.route('**/api/tester**',r=>r.abort());
 },pre:()=>{localStorage.setItem('sv2_playerid','tester000001');localStorage.setItem('sv2_tester',JSON.stringify({at:1,b:'r76'}));localStorage.setItem('sv2_live',JSON.stringify({releases:{tester:{on:true,devices:['tester000001']}}}));}});
 await clear(P.page);await P.page.waitForFunction(()=>__sv.tester);await P.page.evaluate(()=>__sv.tester.openPanel(0));await P.page.waitForSelector('.tpanel textarea');
 await P.page.fill('.tpanel textarea','Synthetic draft must survive storage failure');
 const old=await P.page.evaluate(()=>{window.originalSet=Storage.prototype.setItem;Storage.prototype.setItem=function(k,v){if(k==='sv2_tester_out')throw new DOMException('quota','QuotaExceededError');return originalSet.call(this,k,v);};return localStorage.getItem('sv2_tester_out');});
 await P.page.click('.tp-send');assert.equal(await P.page.inputValue('.tpanel textarea'),'Synthetic draft must survive storage failure');assert.equal(await P.page.evaluate(()=>localStorage.getItem('sv2_tester_out')),old);
 assert.ok(await P.page.locator('.testertoast').last().textContent().then(t=>t.includes('Could not save')));
 await P.page.evaluate(()=>{Storage.prototype.setItem=originalSet;});await P.page.click('.tp-send');await P.page.waitForSelector('.modal.tpanel',{state:'detached'});
 const saved=await P.page.evaluate(()=>JSON.parse(localStorage.getItem('sv2_tester_out')).find(r=>r.note==='Synthetic draft must survive storage failure'));assert.ok(saved.clientId);assert.equal(saved.b,BUILD);
 await P.ctx.close();console.log('PASS: denied storage preserves report draft and old queue; retry persists with stable identity');
}finally{await browser.close();}
