import {effectiveReportingPolicy} from '../../js/core/reporting-policy.ts';
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {stripTypeScriptTypes} from 'node:module';
import {loadManagementCatalogue,explainAvailability,parseManagementCatalogue} from '../../netlify/lib/management/catalogue.mts';
import {managementService} from '../../netlify/lib/management/runtime.mts';
import {MemoryManagementTestDatabase} from '../../netlify/lib/management/storage/memory-test.mts';
import {randomUUID} from 'node:crypto';

// Execute the actual source module with synthetic platform dependencies. No real
// fetch, private content, game save or shared global mutation is used.
async function policy(live={}){
 const source=stripTypeScriptTypes(fs.readFileSync(new URL('../../js/custom.ts',import.meta.url),'utf8'),{mode:'strip'}).replace(/^import[^\n]*$/gm,'').replace(/\bexport\s+/g,'');
 const context=vm.createContext({effectiveReportingPolicy,fetch:async()=>({ok:false}),AbortController,setTimeout,clearTimeout,
  localStorage:{getItem:key=>key==='sv2_live'?JSON.stringify(live):null},navigator:{onLine:false}});
 return await new vm.Script('(async()=>{'+source+';return {CUSTOM,reportingPolicy,keptOn,featureOn,setPlayers,setPeeks,hasTried,markTried};})()').runInContext(context);
}
test('explicit Off wins over tried history, default content and tester peeks without changing progress',async()=>{
 const C=await policy({releases:{readingTrial:{on:false}}});
 const p={tried:{readingTrial:'2026-10-01'},wins:{rd_blend:3}},before=JSON.stringify(p);
 C.setPlayers([p]);C.setPeeks(['readingTrial']);C.CUSTOM.releases={readingTrial:{on:true}};
 assert.equal(C.keptOn('readingTrial'),false,'live explicit Off wins over fallback and retained/preview access');
 assert.equal(JSON.stringify(p),before);
 C.CUSTOM.features={jobs:false};p.tried.jobs='2026-10-01';assert.equal(C.keptOn('jobs'),false);
 C.CUSTOM.features.jobs=true;assert.equal(C.keptOn('jobs'),true);assert.equal(p.tried.jobs,'2026-10-01');
});
test('future rollout can retain used access while a new profile waits',async()=>{
 const C=await policy();C.CUSTOM.releases={jobs:{on:true,start:'2099-01-01'}};
 assert.equal(C.keptOn('jobs',[{tried:{jobs:'2026-10-01'}}]),true);
 assert.equal(C.keptOn('jobs',[{}]),false);
 C.CUSTOM.releases.jobs={on:false};assert.equal(C.keptOn('jobs',[{tried:{jobs:'2026-10-01'}}]),false);
 C.CUSTOM.releases.jobs={on:true};assert.equal(C.keptOn('jobs',[{}]),true);
});
test('declared-only management entries cannot become open from an unlock or release switch',()=>{
 const catalogue=loadManagementCatalogue(),declared=catalogue.entries.filter(e=>e.coverage.discovery==='declared-only');
 assert.equal(declared.length,26);assert.equal(declared.filter(e=>e.coverage.bilingual).length,25);
 assert.ok(declared.every(e=>!e.coverage.implementation&&!e.coverage.metadata));
 assert.equal(new Set(catalogue.entries.map(e=>e.kind+':'+e.id)).size,catalogue.entries.length);
 for(const e of declared){const a=explainAvailability(e,{custom:{releases:{newGames:{on:true},unlockAll:{on:true}}},profiles:[{admin:true,unlockAll:true}]});assert.equal(a.result,'closed');assert.ok(a.gates.some(g=>g.id==='runtime_integration'&&g.state==='closed'));}
 const parsed=parseManagementCatalogue({...catalogue,entries:[{...declared[0],privateData:'excluded'}]});assert.equal('privateData' in parsed.entries[0],false);
 const contradictory=parseManagementCatalogue({...catalogue,entries:[{...declared[0],coverage:{...declared[0].coverage,implementation:true,metadata:true}}]});
 assert.equal(contradictory.entries[0].coverage.implementation,false);assert.equal(contradictory.entries[0].coverage.metadata,false);
});
test('declared-only catalogue rows remain excluded from accepted runtime activity events',async()=>{
 const service=managementService(async()=>null,new MemoryManagementTestDatabase());
 const event={schemaVersion:1,eventId:randomUUID(),deviceId:'demo12345678',sessionId:'demo123456789012',attemptId:randomUUID(),eventName:'activity.started',occurredAt:new Date().toISOString(),deviceDay:new Date().toISOString().slice(0,10),offsetMinutes:0,build:'v1.02',sourceCommit:null,environment:'production',traffic:'ordinary',data:{activityId:'aodai',difficulty:'easy',mode:'solo'}};
 await assert.rejects(service.ingestEvents({schemaVersion:1,events:[event]}),e=>e.code==='unknown_catalogue_id');
});
test('server availability explanation follows explicit Off rather than retained money/reading access',()=>{
 const catalogue=loadManagementCatalogue();
 for(const [id,key]of [['heodat','money_heodat'],['rd_letters','readingTrial']]){
  const entry=catalogue.entries.find(e=>e.id===id)||catalogue.entries.find(e=>e.id.startsWith('rd_'));
  assert.ok(entry);const result=explainAvailability(entry,{custom:{releases:{[key]:{on:false}}},profiles:[{tried:{[key]:'2026-10-01'}}],peeks:[key]});
  assert.equal(result.gates.find(g=>g.id===key).state,'closed');
 }
});

test('malformed cached reporting policy remains an explicit fail-closed restriction rather than falling back to legacy',async()=>{
 for(const raw of [false,null,'on',{schemaVersion:2,collect:true}]){
  const C=await policy({content:{reportingPolicy:raw}});assert.equal(C.reportingPolicy().state,'invalid');assert.equal(C.reportingPolicy().collect,false);
 }
});
