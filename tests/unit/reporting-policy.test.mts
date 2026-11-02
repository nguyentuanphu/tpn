import test from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {effectiveReportingPolicy,parseReportingPolicy} from '../../js/core/reporting-policy.ts';
import {functionWorkspace,saveFunctionDraft} from '../../netlify/lib/management/functions.mts';
import {createManagementService} from '../../netlify/lib/management/transactional/service.mts';
import {MemoryManagementTestDatabase} from '../../netlify/lib/management/storage/memory-test.mts';
import {managementHttp} from '../../netlify/lib/management/http.mts';
import {createManagementTelemetry} from '../../js/management-telemetry.ts';
const time=Date.parse('2026-10-29T03:00:00Z');
const policy=(patch={})=>({schemaVersion:1,collect:true,process:true,show:true,expiresAt:new Date(time+3600000).toISOString(),...patch});
const token=d=>({expectedRevision:d.revision,effectiveHash:d.effectiveHash});
const fixture=()=>{let clock=time;const database=new MemoryManagementTestDatabase(),service=createManagementService({database,now:()=>clock,initialConfig:async()=>({releases:{managementTelemetry:{on:true,devices:['demo12345678']}},festivals:{},content:{message:{en:'Keep'}}})});return {database,service,advance:ms=>clock+=ms};};
const event=()=>({schemaVersion:1,eventId:randomUUID(),attemptId:randomUUID(),deviceId:'demo12345678',sessionId:'demo123456789012',eventName:'boot.started',occurredAt:new Date(time).toISOString(),deviceDay:'2026-10-29',offsetMinutes:660,build:'v1.02',sourceCommit:null,environment:'staging',traffic:'synthetic_bot',data:{stage:'boot'}});
async function publish(s,p){const d=await saveFunctionDraft({expectedRevision:0,baseRevision:(await s.getConfig())?.revision??0,policy:p,reason:'Synthetic function policy'},'owner',s,time),r=await s.reviewDraft(d.id,token(d),'owner');return s.publishDraft(d.id,token(r),'owner',[]);}

test('policy parser fails closed on unsupported/malformed input and expiry preserves separate Show setting',()=>{
 assert.equal(effectiveReportingPolicy(undefined,time).installed,false);
 for(const input of [{},policy({schemaVersion:2}),policy({collect:'true'}),policy({unexpected:'private'}),policy({expiresAt:null}),policy({expiresAt:'invalid'})]){
  assert.equal(parseReportingPolicy(input),null);assert.equal(effectiveReportingPolicy(input,time).collect,false);
 }
 assert.deepEqual(effectiveReportingPolicy(policy(),time+3600001),{installed:true,state:'expired',collect:false,process:false,show:true,expiresAt:policy().expiresAt});
 assert.equal(parseReportingPolicy(policy({collect:false,process:false,expiresAt:null})).show,true);
});
test('function proposals stay private, preserve content and require a fresh review before publication',async()=>{
 const f=fixture(),d=await saveFunctionDraft({expectedRevision:0,baseRevision:0,policy:policy({collect:false,process:false,expiresAt:null}),reason:'Disable optional only'},'owner',f.service,time);
 assert.equal(d.itemKey,'function:managementTelemetry');assert.equal(d.body.content.message.en,'Keep');assert.equal((await f.service.reportingState()).state,'legacy');
 await assert.rejects(f.service.publishDraft(d.id,token(d),'owner',[]),e=>e.code==='draft_review_required');
 const reviewed=await f.service.reviewDraft(d.id,token(d),'owner');await f.service.publishDraft(d.id,token(reviewed),'owner',[]);
 assert.equal((await f.service.reportingState()).collect,false);assert.equal((await f.service.getDraft(d.id)).state,'published');
});
test('independent collection/processing flags gate accepted events and analysis; expiry stops both without deleting data',async()=>{
 const f=fixture();await publish(f.service,policy({process:false,show:false}));
 const accepted=await f.service.ingestEvents({schemaVersion:1,events:[event()]});assert.equal(accepted.accepted.length,1);
 const query={from:'2026-10-29T00:00:00Z',to:'2026-10-29T04:00:00Z',environment:'staging',traffic:'synthetic_bot'};
 await assert.rejects(f.service.eventSummary(query),e=>e.code==='optional_processing_paused');
 await assert.rejects(f.service.attemptSummary(query),e=>e.code==='optional_processing_paused');
 f.advance(3600001);await assert.rejects(f.service.ingestEvents({schemaVersion:1,events:[event()]}),e=>e.status===410);
 assert.equal(f.database.inspect().events.size,1,'policy pause does not delete accepted data');
});
test('Collect Off permits analysis of retained events when Process On; Show does not change collection',async()=>{
 const f=fixture();await f.service.ingestEvents({schemaVersion:1,events:[event()]});
 await publish(f.service,policy({collect:false,show:false}));
 await assert.rejects(f.service.ingestEvents({schemaVersion:1,events:[event()]}),e=>e.code==='optional_collection_disabled');
 const report=await f.service.eventSummary({from:'2026-10-29T00:00:00Z',to:'2026-10-29T04:00:00Z',environment:'staging',traffic:'synthetic_bot'});
 assert.ok(report.boot);assert.equal(f.database.inspect().events.size,1);
});
test('temporary budget cannot be bypassed by advanced config or draft writes; expired reviews cannot publish',async()=>{
 const f=fixture(),long=policy({expiresAt:new Date(time+86400001).toISOString()});
 await assert.rejects(f.service.changeConfig({scopeKey:'global',expectedRevision:0,kind:'content',body:{content:{reportingPolicy:long}},reason:'Long expiry'},'owner'),e=>e.code==='reporting_expiry_out_of_range');
 await assert.rejects(f.service.saveDraft({expectedRevision:0,baseRevision:0,kind:'content',body:{content:{reportingPolicy:long}},reason:'Long expiry'},'owner'),e=>e.code==='reporting_expiry_out_of_range');
 const d=await saveFunctionDraft({expectedRevision:0,baseRevision:0,policy:policy(),reason:'Temporary proposal'},'owner',f.service,time),r=await f.service.reviewDraft(d.id,token(d),'owner');
 f.advance(3600001);await assert.rejects(f.service.publishDraft(d.id,token(r),'owner',[]),e=>e.code==='reporting_policy_expired_or_invalid');assert.equal(await f.service.getConfig(),null);
});
test('registry reads redact device targets and private drafts; writes enforce both existing grants and unknown families fail closed',async()=>{
 const f=fixture(),dependencies={service:f.service,reads:{}},request=(path,body)=>new Request('https://example.test/studio/api/management/'+path,{method:body?'POST':'GET',...(body?{body:JSON.stringify(body)}:{})});
 const read=await managementHttp(request('functions'),{role:'custom',perms:['management.read']},dependencies);assert.equal(read.status,200);assert.ok(!JSON.stringify(await read.json()).includes('demo12345678'));
 for(const perms of [[],['management.read'],['management.configure'],['edit']])assert.equal((await managementHttp(request('functions/draft',{expectedRevision:0,baseRevision:0,policy:policy(),reason:'Permission check'}),{role:'custom',perms},dependencies)).status,403);
 assert.equal((await managementHttp(request('functions/unknown'),{role:'owner'},dependencies)).status,404);
 const unknown=await functionWorkspace(createManagementService());assert.equal(unknown.settingsKnown,false);assert.equal(unknown.effective,null);
});
test('Show and Process independently govern detailed HTTP responses without hiding legacy summaries or inventing unavailable policy',async()=>{
 const f=fixture();let calls=0;
 const service={...f.service,attemptSummary:async(...args)=>{calls++;return f.service.attemptSummary(...args);},eventSummary:async(...args)=>{calls++;return f.service.eventSummary(...args);}};
 const reads={overview:async()=>({quality:[],period:{from:'2026-10-29',to:'2026-10-29'},scope:{traffic:'ordinary',build:'all'},metrics:[],capabilities:{},totals:{activeDevices:7}})};
 const req=()=>new Request('https://example.test/studio/api/management/overview');
 await publish(f.service,policy({collect:false,show:false}));
 const hidden=await (await managementHttp(req(),{role:'owner'},{reads,service})).json();
 assert.equal(hidden.optionalReporting.process,true);assert.equal(hidden.optionalReporting.show,false);assert.equal('telemetry' in hidden,false);assert.equal(calls,0);assert.equal(hidden.totals.activeDevices,7);
 await publish(f.service,policy({collect:false,show:true}));
 const shown=await (await managementHttp(req(),{role:'owner'},{reads,service})).json();assert.ok(shown.telemetry);assert.equal(calls,2);
 await publish(f.service,policy({collect:false,process:false,expiresAt:null}));
 const paused=await (await managementHttp(req(),{role:'owner'},{reads,service})).json();assert.equal(paused.optionalReporting.process,false);assert.equal(calls,2);assert.equal('telemetry' in paused,false);
 const missing=await (await managementHttp(req(),{role:'owner'},{reads,service:{...service,reportingState:async()=>{throw Error('synthetic source failure');}}})).json();
 assert.equal(missing.optionalReporting.state,'unavailable');assert.equal(missing.optionalReporting.collect,null);assert.equal(missing.totals.activeDevices,7);
});
test('a server disable response clears only the optional queue and stops retries without acknowledging events',async()=>{
 const values=new Map([['sv2_profiles','saved progress'],['sv2_hello_out','legacy queue']]),timers=new Set();let calls=0;
 const storage={getItem:k=>values.get(k)||null,setItem:(k,v)=>values.set(k,v),removeItem:k=>values.delete(k)};
 const client=createManagementTelemetry({storage,enabled:()=>true,deviceId:()=> 'demo12345678',sessionId:'demo123456789012',build:'v1.02',now:()=>time,uuid:randomUUID,
  schedule:f=>{timers.add(f);return f;},cancel:f=>timers.delete(f),fetcher:async()=>{calls++;return {ok:false,status:410,json:async()=>({error:'optional_collection_disabled'})};}});
 client.enqueue('boot.started',{stage:'boot'});assert.equal(await client.flush(),false);assert.equal(client.status().serverDisabled,true);assert.equal(client.status().events,0);assert.equal(timers.size,0);
 assert.equal(client.enqueue('boot.started',{stage:'boot'}),null);await client.flush();assert.equal(calls,1);assert.equal(values.get('sv2_profiles'),'saved progress');assert.equal(values.get('sv2_hello_out'),'legacy queue');
});
test('stopping an optional client aborts its in-flight request and cannot retry afterwards',async()=>{
 let aborted=false;const client=createManagementTelemetry({storage:{getItem:()=>null,setItem:()=>{},removeItem:()=>{}},enabled:()=>true,deviceId:()=> 'demo12345678',sessionId:'demo123456789012',build:'v1.02',now:()=>time,uuid:randomUUID,
  schedule:()=>1,cancel:()=>{},fetcher:async(_url,options)=>new Promise((_resolve,reject)=>options.signal.addEventListener('abort',()=>{aborted=true;reject(Error('synthetic abort'));}))});
 client.enqueue('boot.started',{stage:'boot'});const pending=client.flush();client.stop();await pending;assert.equal(aborted,true);assert.equal(await client.flush(),false);
});
