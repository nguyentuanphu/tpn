import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { managementHttp, managementBody } from '../../netlify/lib/management/http.mts';
import { createManagementService } from '../../netlify/lib/management/transactional/service.mts';
import { MemoryManagementTestDatabase } from '../../netlify/lib/management/storage/memory-test.mts';
import { managementService } from '../../netlify/lib/management/runtime.mts';
import { makeLive } from '../../netlify/functions/live.mts';
import { makeManagement } from '../../netlify/functions/management.mts';
import { allowed, PRESETS } from '../../netlify/lib/admins.mts';
import { loadManagementCatalogue } from '../../netlify/lib/management/catalogue.mts';
import { managementOperations } from '../../netlify/lib/management/operations.mts';

const request=(path,body,method=body===undefined?'GET':'POST')=>new Request('https://example.test/studio/api/management/'+path,{method,...(body===undefined?{}:{body:JSON.stringify(body)})});
const owner={name:'owner',role:'owner'}, summary={name:'summary',role:'custom',perms:['management.read']};
const reads={overview:async()=>({totals:{devices:1}}),devices:async(_q,options)=>({devices:[{id:'demo12345678',days:1,...(options?.includeProfileContext?{children:[{name:'Demo'}]}:{})}],nextCursor:null})};
const fixture=()=>({reads,service:createManagementService({database:new MemoryManagementTestDatabase(),initialConfig:async()=>({releases:{},festivals:{},content:{}}),projector:async c=>({revision:c.revision,effectiveHash:c.effectiveHash})})});

test('management private routes require explicit grants; old editor and desktop key do not gain access',async()=>{
  for(const me of [{role:'editor',perms:PRESETS.editor},{role:'exe',perms:[]},{role:'viewer',perms:PRESETS.viewer}]) {
    assert.equal((await managementHttp(request('overview'),me,fixture())).status,403);
  }
  assert.equal((await managementHttp(request('children'),summary,fixture())).status,403);
  assert.equal((await managementHttp(request('devices/demo12345678'),summary,fixture())).status,403);
  assert.equal(allowed({role:'exe',perms:['management.read']},'management/config',true),false);
  assert.equal((await managementHttp(request('overview',undefined,'DELETE'),owner,fixture())).status,405);
});

test('summary device reads omit child context; private detail grants enable it',async()=>{
  const publicResponse=await (await managementHttp(request('devices'),summary,fixture())).json();
  assert.equal(JSON.stringify(publicResponse).includes('Demo'),false);
  const privateResponse=await (await managementHttp(request('devices'),{...summary,perms:['management.read','management.deviceDetail']},fixture())).json();
  assert.equal(privateResponse.devices[0].children[0].name,'Demo');
});

test('revisioned HTTP saves enforce both configuration and existing release permission',async()=>{
  const input={scopeKey:'global',expectedRevision:0,kind:'rules',body:{releases:{managementTelemetry:{on:true}}},reason:'Enable synthetic validation'};
  const dependencies=fixture();
  assert.equal((await managementHttp(request('config',input),{role:'custom',perms:['management.configure']},dependencies)).status,403);
  assert.equal((await managementHttp(request('config',{...input,rollbackRevision:0}),{role:'custom',perms:['management.configure','releases']},dependencies)).status,403,
    'full snapshot rollback cannot bypass content-edit permission through a rules-only grant');
  const saved=await (await managementHttp(request('config',input),owner,dependencies)).json();
  assert.equal(saved.revision,1);assert.equal(saved.projection.ok,true);
  assert.equal((await managementHttp(request('config',input),owner,dependencies)).status,409);
  const history=await (await managementHttp(request('config'),summary,dependencies)).json();
  assert.equal(history.changes[0].eligibleCount,1);assert.equal(history.changes[0].unconfirmed,1);
  assert.equal(JSON.stringify(history).includes('demo12345678'),false);
  assert.equal((await managementHttp(request('config',{...input,scopeKey:'device:demo12345678'}),owner,dependencies)).status,400);
});

test('public live uses one projected snapshot and strips private actor data',async()=>{
  const values=new Map([['live',{releases:{old:{on:true}},festivals:{}}],['content',{content:{}}]]);
  const store={get:async k=>values.get(k)||null,getWithMetadata:async k=>values.has(k)?{data:values.get(k),etag:'fixture-etag'}:null,setJSON:async(k,v)=>{values.set(k,v);return {modified:true};}};
  const service=managementService(async()=>store,new MemoryManagementTestDatabase());
  await service.changeConfig({scopeKey:'global',expectedRevision:0,kind:'rules',body:{releases:{managementTelemetry:{on:true}}},reason:'Projection test'},'private-admin-name');
  assert.equal((await service.projectLatest()).ok,true);
  const live=await (await makeLive({liveStore:async()=>store})()).json();
  assert.equal(live.management.revision,1);assert.equal(live.releases.managementTelemetry.on,true);
  assert.equal(JSON.stringify(live).includes('private-admin-name'),false);
  assert.equal(live.releases.old,undefined);
});

test('database absence and private errors never become fabricated success or leaked diagnostics',async()=>{
  const missing=await managementHttp(request('config'),owner,{reads,service:createManagementService()});
  assert.deepEqual(await missing.json(),{configured:false,config:null,changes:[]});
  const failing=await managementHttp(request('overview'),owner,{...fixture(),reads:{overview:async()=>{throw new Error('secret-dsn-password');}}});
  assert.equal(failing.status,503);assert.equal((await failing.text()).includes('secret-dsn-password'),false);
  const endpoint=makeManagement({service:()=>createManagementService()});
  assert.equal((await endpoint(new Request('https://example.test/api/management/events',{method:'POST',body:'{}'}),{})).status,503);
});

test('public event endpoint rejects cross-origin writes and unsupported methods',async()=>{
  const endpoint=makeManagement();
  assert.equal((await endpoint(new Request('https://example.test/api/management/events'),{})).status,405);
  assert.equal((await endpoint(new Request('https://example.test/api/management/events',{method:'POST',headers:{Origin:'https://other.test'},body:'{}'}),{})).status,403);
  await assert.rejects(managementBody(new Request('https://example.test',{method:'POST',body:'x'.repeat(250001)})),e=>e.status===413);
});

test('catalogue contains public source facts and verified website anchors only',()=>{
  const catalogue=loadManagementCatalogue();
  assert.ok(catalogue.entries.length>200);
  assert.ok(catalogue.entries.every(e=>e.name.en&&e.name.vi));
  assert.ok(catalogue.entries.every(e=>e.guide.href===null||/^\/home\/#[-a-z0-9_]+$/.test(e.guide.href)));
  assert.ok(catalogue.coverage.declaredSecondSetMissingMetadata.length>0);
  const operations=managementOperations({configured:{githubRead:true}});
  assert.equal(operations.services.find(x=>x.id==='githubRead').status,'configured_unverified');
  assert.equal(operations.jobSummary.status,'unavailable');
});

test('attempt completion preserves missing outcomes and rejects conflicting lifecycle evidence',async()=>{
  const now=Date.parse('2026-10-26T12:00:00Z'),database=new MemoryManagementTestDatabase();
  const service=createManagementService({database,now:()=>now,catalogue:{activityIds:new Set(['oanquan']),storyIds:new Set()}});
  const event=(attemptId,eventName,ago)=>({schemaVersion:1,eventId:randomUUID(),deviceId:'demo12345678',sessionId:'demo123456789012',attemptId,eventName,
    occurredAt:new Date(now-ago).toISOString(),deviceDay:new Date(now-ago).toISOString().slice(0,10),offsetMinutes:0,build:'v1.01',sourceCommit:null,environment:'production',traffic:'ordinary',
    data:eventName==='activity.started'?{activityId:'oanquan',difficulty:'easy',mode:'solo'}:eventName==='activity.abandoned'?{activityId:'oanquan',reason:'closed'}:{activityId:'oanquan'}});
  const completed=randomUUID(),unknown=randomUUID(),conflicting=randomUUID();
  await service.ingestEvents({schemaVersion:1,events:[event(completed,'activity.started',60000),event(completed,'activity.completed',30000),event(unknown,'activity.started',2*86400000),
    event(conflicting,'activity.started',60000),event(conflicting,'activity.completed',30000),event(conflicting,'activity.abandoned',20000)]});
  const summary=await service.attemptSummary({from:'2026-10-23T00:00:00Z',to:'2026-10-27T00:00:00Z'});
  assert.equal(summary.counts.started,3);assert.equal(summary.counts.completed,1);assert.equal(summary.counts.outcomeUnknown,1);assert.equal(summary.counts.inconsistent,1);
  assert.equal(summary.eligible,2);assert.equal(summary.completionRate,.5);assert.ok(summary.quality.includes('unknown-source-provenance'));
});

test('conditional publication conflict stays pending and never reports available',async()=>{
  const database=new MemoryManagementTestDatabase();
  const store={get:async()=>null,getWithMetadata:async()=>null,setJSON:async()=>({modified:false})};
  const service=managementService(async()=>store,database);
  await service.changeConfig({scopeKey:'global',expectedRevision:0,kind:'rules',body:{releases:{}},reason:'Synthetic conditional conflict'},'owner-test');
  assert.equal((await service.projectLatest()).ok,false);
  const change=(await service.listChanges())[0];assert.equal(change.state,'pending_projection');assert.equal(change.availableAt,null);
});

test('attention follow-up enforces ordered states, evidence, conflicts and audit history',async()=>{
  const {service}=fixture(),id='1234567890abcdef';
  const change=(expectedRevision,state,evidence={})=>service.updateAttention(id,{expectedRevision,state,reason:'Synthetic lifecycle validation',evidence},'operator-test');
  assert.equal((await change(0,'observed')).revision,1);
  await assert.rejects(change(0,'observed'),e=>e.status===409);
  await assert.rejects(change(1,'fixed_in_code'),e=>e.code==='invalid_attention_transition');
  await change(1,'investigating');await change(2,'reproduced');await change(3,'fixing');await change(4,'fixed_in_code');
  await assert.rejects(change(5,'deployed'),e=>e.code==='deployment_evidence_required');
  await change(5,'deployed',{deployId:'synthetic-deploy'});
  await assert.rejects(change(6,'verified'),e=>e.code==='verification_evidence_required');
  await change(6,'verified',{build:'v1.01',verificationEvidence:'Synthetic device retest'});
  assert.equal((await service.auditHistory('attention',id)).length,7);
  assert.equal((await service.listAttention())[0].state,'verified');
});
