import test from 'node:test';
import { Client } from 'pg';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { createOperationsControl } from '../../netlify/lib/management/operations-control.mts';
import { providerAdapters } from '../../netlify/lib/management/providers.mts';
import { MemoryManagementTestDatabase } from '../../netlify/lib/management/storage/memory-test.mts';
import { managementConnection, managementBinding } from '../../netlify/lib/management/connection.mts';
import { managementHttp } from '../../netlify/lib/management/http.mts';

const NOW=Date.parse('2026-10-27T00:00:00Z');
const config={githubToken:'synthetic-secret-token',githubRepo:'family/synthetic',githubBranch:'work'};
const body=(extra={})=>({operationId:randomUUID(),kind:'bot',count:1,duration:1,profile:'gentle-explorer',reason:'Synthetic operation validation',...extra});
const response=(value,status=200,headers={})=>new Response(status===204?null:JSON.stringify(value),{status,headers:{'Content-Type':'application/json',...headers}});
const run=(id,extra={})=>({id:42,path:'.github/workflows/nightly-child-bots.yml',display_title:'Child bots management:'+id,status:'completed',conclusion:'failure',head_sha:'a'.repeat(40),run_attempt:1,created_at:'2026-10-26T23:00:00Z',run_started_at:'2026-10-26T23:01:00Z',updated_at:'2026-10-26T23:02:00Z',...extra});

test('production database URLs require verified TLS even when URL parameters try to disable it',()=>{
  const remote=managementConnection('postgresql://user:synthetic@db.example.test/service?sslmode=no-verify');
  assert.equal(remote.local,false);assert.equal(remote.options.ssl.rejectUnauthorized,true);assert.equal(new URL(remote.options.connectionString).searchParams.has('sslmode'),false);
  assert.equal(managementConnection('postgresql://agent@127.0.0.1:55432/sparkle_management_test').options.ssl,false);
  for(const query of ['ssl=0','sslmode=disable','sslmode=no-verify&uselibpqcompat=true','sslnegotiation=direct&ssl=0']) {
    const actual=new Client(managementConnection('postgresql://user:synthetic@db.example.test/service?'+query).options);
    assert.equal(actual.connectionParameters.ssl.rejectUnauthorized,true,'pg must retain verification for '+query);
  }
  assert.throws(()=>managementConnection('not-a-url-with-synthetic-secret'),e=>!e.message.includes('synthetic-secret'));
});

test('provider feeds keep exact run IDs, attempts, quota observations and sanitized outcomes',async()=>{
  const id=randomUUID(),calls=[];
  const adapter=providerAdapters(config,async(url,options)=>{calls.push({url,options});return response({workflow_runs:[run(id),run(id,{id:43,status:'in_progress',conclusion:null,run_attempt:2}),run(id,{id:44,conclusion:'neutral'}),run(id,{id:'invalid'})]},200,{'x-ratelimit-limit':'5000','x-ratelimit-remaining':'4990','x-ratelimit-reset':String(NOW/1000+600)});},()=>NOW);
  const result=await adapter.github();assert.equal(calls.length,1);assert.match(calls[0].url,/^https:\/\/api.github.com\/repos\/family\/synthetic\//);
  assert.deepEqual(result.jobs.map(j=>j.state),['failed','running','unknown']);assert.equal(result.jobs[0].operationId,id);assert.equal(result.jobs[1].attempt,2);
  assert.equal(result.quota.remaining,4990);assert.equal(JSON.stringify(result).includes(config.githubToken),false);assert.equal(JSON.stringify(result).includes('display_title'),false);
});

test('concurrent duplicate dispatches send one provider request and immutable request bodies conflict',async()=>{
  let sends=0;
  const control=createOperationsControl({database:new MemoryManagementTestDatabase(),config:()=>config,now:()=>NOW,
    fetcher:async(url,options)=>{assert.equal(options.method,'POST');assert.match(url,/nightly-child-bots.yml\/dispatches$/);sends++;const sent=JSON.parse(options.body);assert.equal(sent.ref,'work');assert.equal(sent.inputs.management_operation_id,input.operationId);return response(null,204);}});
  const input=body(),results=await Promise.all([control.run(input,'owner-test'),control.run(input,'owner-test')]);
  assert.equal(sends,1);assert.equal(results.filter(r=>r.duplicate).length,1);assert.equal(results.find(r=>!r.duplicate).operation.status,'queued');
  await assert.rejects(control.run({...input,count:2},'owner-test'),e=>e.status===409);
  await assert.rejects(control.run(body(),'owner-test'),e=>e.status===429);
  for(const invalid of [{count:11},{duration:31},{profile:'anything'},{kind:'deploy'},{branch:'main'}])await assert.rejects(control.run(body(invalid),'owner-test'),e=>e.status===422);
  assert.equal(sends,1);
});

test('uncertain delivery is not retried and a later exact provider run resolves its failed outcome',async()=>{
  const input=body();let sends=0;
  const control=createOperationsControl({database:new MemoryManagementTestDatabase(),config:()=>config,now:()=>NOW,fetcher:async(_url,options)=>{
    if(options.method==='POST'){sends++;throw new Error('synthetic-secret-token must not leak');}
    return response({workflow_runs:[run(input.operationId)]});
  }});
  const first=await control.run(input,'operator-test');assert.equal(first.operation.status,'unknown');assert.equal(first.operation.dispatchState,'uncertain');
  const duplicate=await control.run(input,'operator-test');assert.equal(duplicate.duplicate,true);assert.equal(sends,1);
  const snapshot=await control.snapshot();assert.equal(snapshot.operations[0].status,'failed');assert.equal(snapshot.operations[0].runId,'42');
  assert.equal(snapshot.jobSummary.successCount,0);assert.equal(snapshot.jobSummary.terminalCount,1);
  assert.equal(JSON.stringify(snapshot).includes('synthetic-secret-token'),false);
});

test('stale feeds preserve prior observations without presenting old jobs as fresh successful checks',async()=>{
  let time=NOW,requests=0;
  const control=createOperationsControl({config:()=>config,now:()=>time,fetcher:async()=>{requests++;return requests===1?response({workflow_runs:[run(randomUUID(),{conclusion:'success'})]}):response({message:'synthetic-secret-token'},403);}});
  const first=await control.snapshot();assert.equal(first.feeds.github.status,'observed');assert.equal(first.jobSummary.successCount,1);
  await control.snapshot(true);assert.equal(requests,1,'refreshes share the minimum probe interval');
  time+=61000;const stale=await control.snapshot();assert.equal(stale.feeds.github.status,'stale');assert.equal(stale.jobs.length,1);assert.equal(stale.jobSummary.status,'stale');assert.equal(stale.jobSummary.successCount,null);
  assert.equal(stale.feeds.github.errorCode,'forbidden');assert.equal(JSON.stringify(stale).includes('synthetic-secret-token'),false);
});

test('database checks and configuration retries record actual maintenance outcomes',async()=>{
  const database=new MemoryManagementTestDatabase();
  const control=createOperationsControl({database,config:()=>({}),now:()=>NOW,retryConfiguration:async()=>({ok:false})});
  const check=await control.run(body({kind:'database_check',count:undefined,profile:undefined,duration:undefined}),'operator-test');assert.equal(check.operation.status,'succeeded');
  const retry=await control.run(body({kind:'retry_configuration',count:undefined,profile:undefined,duration:undefined}),'operator-test');assert.equal(retry.operation.status,'failed');assert.equal(retry.operation.reasonCode,'projection_pending');
  const absent=createOperationsControl({config:()=>config,fetcher:async()=>{throw new Error('must not be contacted');}});
  await assert.rejects(absent.run(body(),'operator-test'),e=>e.status===503);
});

test('operation routes enforce run/read scopes and existing website or configuration permission',async()=>{
  let called=0;
  const dependencies={reads:{},service:{},operations:{run:async()=>{called++;return {ok:true};},snapshot:async()=>({services:[]})}};
  const request=(path,input)=>new Request('https://example.test/studio/api/management/'+path,{method:'POST',body:JSON.stringify(input)});
  for(const me of [{role:'editor'},{role:'custom',perms:['operations.read']},{role:'exe',perms:['operations.read','operations.run']}])assert.equal((await managementHttp(request('operations/run',body()),me,dependencies)).status,403);
  const runner={name:'operator-test',role:'custom',perms:['operations.run']};
  assert.equal((await managementHttp(request('operations/run',body()),runner,dependencies)).status,403);
  assert.equal((await managementHttp(request('operations/run',body({kind:'retry_configuration'})),runner,dependencies)).status,403);
  assert.equal((await managementHttp(request('operations/run',body({kind:'database_check'})),runner,dependencies)).status,200);assert.equal(called,1);
  assert.equal((await managementHttp(request('operations/refresh',{}),{role:'custom',perms:['operations.read']},dependencies)).status,200);
});

test('a malformed provider payload stays unavailable and missing quotas are not fabricated',async()=>{
  const control=createOperationsControl({config:()=>config,now:()=>NOW,fetcher:async()=>response({not_workflow_runs:[]})});
  const snapshot=await control.snapshot();assert.equal(snapshot.feeds.github.status,'unavailable');assert.equal(snapshot.jobs.length,0);assert.equal(snapshot.jobSummary.terminalCount,null);
  assert.equal(snapshot.feeds.github.quota.status,'unavailable');
});


test('Netlify native database binding takes precedence to preserve deploy-context branch isolation',()=>{
 const values={NETLIFY_DB_URL:'  postgresql://branch.example.test/preview  ',MANAGEMENT_DATABASE_URL:'postgresql://other.example.test/production'};
 assert.equal(managementBinding(name=>values[name]),values.NETLIFY_DB_URL.trim());
 delete values.NETLIFY_DB_URL;assert.equal(managementBinding(name=>values[name]),values.MANAGEMENT_DATABASE_URL);
 assert.equal(managementBinding(()=>undefined),'');
});

test('unrelated workflows cannot resolve a bot operation even with the same title UUID',async()=>{
 const input=body();const control=createOperationsControl({database:new MemoryManagementTestDatabase(),config:()=>config,now:()=>NOW,fetcher:async(_url,opt)=>opt.method==='POST'?response(null,204):response({workflow_runs:[run(input.operationId,{path:'.github/workflows/full-suite.yml'})]})});
 await control.run(input,'operator-test');assert.equal((await control.snapshot()).operations[0].status,'queued');
});
