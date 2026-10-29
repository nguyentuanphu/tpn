// Comparable cold-context observations, not a Netlify billing or physical-device benchmark.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {open} from './harness.mjs';
export async function managementPolicyBudgetCheck(browser){
 const samples=[];
 for(const collect of [false,true,true,false]){
  const requests=[],policy={schemaVersion:1,collect,process:false,show:false,expiresAt:collect?new Date(Date.now()+60000).toISOString():null};
  const game=await open(browser,{w:390,h:844,touch:true,settings:{countPlayers:true,reportNames:false,voice:false,music:false,sound:false},pre:`window.__svHelloTest='manual';localStorage.setItem('sv2_live',JSON.stringify({releases:{managementTelemetry:{on:true}},content:{reportingPolicy:${JSON.stringify(policy)}}}));`,route:async ctx=>{
   ctx.on('request',r=>requests.push({url:r.url(),method:r.method(),bodyBytes:Buffer.byteLength(r.postData()||'')}));
   await ctx.route('**/api/live',r=>r.fulfill({json:{releases:{managementTelemetry:{on:true}},content:{reportingPolicy:policy}}}));
   await ctx.route('**/api/hello',r=>r.fulfill({json:{ok:true}}));
   await ctx.route('**/api/management/events',r=>{const events=r.request().postDataJSON().events;return r.fulfill({json:{accepted:events.map(e=>e.eventId),duplicates:[]}});});
   await ctx.route('**/api/management/config-receipt',r=>r.fulfill({json:{ok:true}}));
  }});
  try{
   await game.page.waitForFunction(()=>!!window.__sv?.bootTimes);
   const observation=await game.page.evaluate(async()=>{
    const heap=()=>typeof performance.memory?.usedJSHeapSize==='number'?performance.memory.usedJSHeapSize:null;
    const started=performance.now(),before=heap();let frames=0;await new Promise(resolve=>{const frame=now=>{frames++;if(now-started>=1500)resolve();else requestAnimationFrame(frame);};requestAnimationFrame(frame);});
    return {observedMs:performance.now()-started,animationCallbacks:frames,heapBeforeBytes:before,heapAfterBytes:heap(),resources:performance.getEntriesByType('resource').map(r=>({name:r.name,encodedBodySize:r.encodedBodySize,transferSize:r.transferSize})),boot:window.__sv.bootTimes};
   });
   const optional=requests.filter(r=>/\/api\/management\//.test(r.url)),modules=requests.filter(r=>r.url.includes('/js/management-telemetry.js'));
   if(collect){assert.ok(modules.length>0,'On loads the optional client in the eligible fixture');assert.ok(optional.length>0,'On uploads fixture boot events');}
   else{assert.equal(modules.length,0,'Off does not load the optional client');assert.equal(optional.length,0,'Off sends no optional management requests');}
   assert.deepEqual(game.errors,[]);
   samples.push({collect,process:false,show:false,viewport:{width:390,height:844},...observation,requestCount:requests.length,optionalRequests:optional.length,optionalRequestBodyBytes:optional.reduce((n,r)=>n+r.bodyBytes,0),optionalModuleRequests:modules.length,resourceEncodedBytes:observation.resources.reduce((n,r)=>n+r.encodedBodySize,0)});
  }finally{await game.ctx.unrouteAll({behavior:'wait'});await game.ctx.close();}
 }
 const files=['js/players.ts','js/management-telemetry.ts','js/core/reporting-policy.ts','tests/management-policy-budget-browser.mjs'];
 const report={schemaVersion:1,capturedAt:new Date().toISOString(),sourceHead:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),sourceHashes:Object.fromEntries(files.map(f=>[f,createHash('sha256').update(fs.readFileSync('../'+f)).digest('hex')])),synthetic:true,browser:browser.version(),samples,limitations:['Four alternating cold browser contexts; one synthetic phone viewport, local uncompressed source server and mocked ingestion.','Not physical hardware, battery measurement, production traffic, server execution duration, database cost or Netlify billing.','Frame callbacks and non-standard heap observations are descriptive; no performance threshold or statistical equivalence is asserted.','Policy On still requires the existing release gate, parent permission and eligible context; this test does not enable production reporting.','Legacy analytics remains separate. No zero-impact or all-optional-family guarantee.']};
 const output=path.resolve(process.env.STUDIO_BUDGET_RESULT||'../docs/studio-combined-handoff-20261029/evidence/reporting-budget.json');fs.mkdirSync(path.dirname(output),{recursive:true});fs.writeFileSync(output,JSON.stringify(report,null,2)+'\n');
 return '4 alternating cold contexts: optional client/upload absent Off and present On; local transfer, payload, heap and animation observations recorded; no production/battery/cost claim';
}
