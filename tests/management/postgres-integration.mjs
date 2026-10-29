// Real SQL integration checks. Run only against the isolated loopback *_test database.
import assert from 'node:assert/strict';
import { randomUUID, createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { PostgresManagementDatabase, migrateManagement } from '../../netlify/lib/management/storage/postgres.mts';
import { createManagementService } from '../../netlify/lib/management/transactional/service.mts';
import { managementPreflight } from '../../netlify/lib/management/preflight.mts';
import { createFinanceService } from '../../netlify/lib/management/finance.mts';
import { saveFunctionDraft } from '../../netlify/lib/management/functions.mts';
import { createOperationsControl } from '../../netlify/lib/management/operations-control.mts';
import { makeManagement } from '../../netlify/functions/management.mts';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');
const require=createRequire(path.join(root,'package.json'));
const {Pool}=require('pg');
const connectionString=process.env.MANAGEMENT_TEST_DATABASE_URL || 'postgresql://agent@127.0.0.1:55432/sparkle_management_test';
const destination=new URL(connectionString);
if(!['127.0.0.1','localhost','[::1]'].includes(destination.hostname) || !/^\/[a-z_][a-z0-9_]*_test$/.test(destination.pathname))
  throw new Error('This integration test requires an isolated loopback database ending in _test.');
const admin=new Pool({connectionString,max:2,connectionTimeoutMillis:5000});
const schema='management_it_'+randomUUID().replaceAll('-','');
let pool;
const passed=[];
async function check(name,work){await work();passed.push(name);console.log('PASS:',name);}
const now=Date.parse('2026-10-26T00:00:00Z');
const makeEvent=(overrides={})=>({schemaVersion:1,eventId:randomUUID(),deviceId:'demo12345678',sessionId:'demo123456789012',attemptId:randomUUID(),
  eventName:'activity.started',occurredAt:'2026-10-25T23:59:00Z',deviceDay:'2026-10-26',offsetMinutes:660,build:'v1.01',sourceCommit:null,
  environment:'staging',traffic:'synthetic_bot',profiles:[{id:'profile-a',name:'Demo',age:'little'}],data:{activityId:'oanquan',difficulty:'easy',mode:'solo'},...overrides});
const batch=events=>({schemaVersion:1,events});
const rejectedStatus=status=>error=>error?.status===status;
let version='';
try{
  version=(await admin.query('SELECT version() AS version')).rows[0].version;
  await admin.query(`CREATE SCHEMA ${schema}`);
  pool=new Pool({connectionString,max:12,connectionTimeoutMillis:5000,options:`-c search_path=${schema}`});
  const database=new PostgresManagementDatabase(pool);
  await check('read-only preflight detects a missing schema without creating tables',async()=>{
    const result=await managementPreflight(pool,{local:true});assert.equal(result.ready,false);assert.equal(result.migration,'not_applied');
    assert.equal((await pool.query("SELECT count(*)::int AS n FROM information_schema.tables WHERE table_schema=$1",[schema])).rows[0].n,0);
  });
  await check('real PostgreSQL migration applies once and repeats safely',async()=>{
    assert.deepEqual(await migrateManagement(pool),{version:3,applied:true});
    assert.deepEqual(await migrateManagement(pool),{version:3,applied:false});
    const repeated=await Promise.all([migrateManagement(pool),migrateManagement(pool)]);
    assert.ok(repeated.every(r=>r.applied===false));
  });
  await check('read-only preflight confirms migration and detects checksum drift',async()=>{
    const result=await managementPreflight(pool,{local:true});assert.equal(result.ready,true);assert.equal(result.writeAccess,'not_tested_read_only_preflight');
    await pool.query("UPDATE management_schema_migrations SET sha256=$1 WHERE version=1",['0'.repeat(64)]);
    assert.equal((await managementPreflight(pool,{local:true})).migration,'mismatch');
    await pool.query('UPDATE management_schema_migrations SET sha256=$1 WHERE version=1',[createHash('sha256').update(fs.readFileSync(path.join(root,'netlify/lib/management/storage/001-management.sql'))).digest('hex')]);
    assert.equal((await managementPreflight(pool,{local:true})).ready,true);
  });
  await check('existing migration v1 upgrades through finance v2 and private drafts v3 without changing prior management records',async()=>{
    const legacy=schema+'_v1';await admin.query(`CREATE SCHEMA ${legacy}`);const legacyPool=new Pool({connectionString,max:2,options:`-c search_path=${legacy}`});
    try{
      const sql=fs.readFileSync(path.join(root,'netlify/lib/management/storage/001-management.sql'),'utf8');await legacyPool.query(sql);
      await legacyPool.query('CREATE TABLE management_schema_migrations(version integer PRIMARY KEY,sha256 text NOT NULL,applied_at timestamptz NOT NULL DEFAULT now())');
      await legacyPool.query('INSERT INTO management_schema_migrations(version,sha256) VALUES(1,$1)',[createHash('sha256').update(sql).digest('hex')]);
      await legacyPool.query("INSERT INTO management_records(namespace,record_key,record_json) VALUES('configs','preserved','{\"revision\":7}'::jsonb)");
      assert.equal((await managementPreflight(legacyPool,{local:true})).ready,false);assert.deepEqual(await migrateManagement(legacyPool),{version:3,applied:true});
      assert.equal((await legacyPool.query("SELECT record_json FROM management_records WHERE namespace='configs' AND record_key='preserved'")).rows[0].record_json.revision,7);
      assert.equal((await managementPreflight(legacyPool,{local:true})).ready,true);
    }finally{await legacyPool.end();await admin.query(`DROP SCHEMA ${legacy} CASCADE`);}
  });
  await check('existing finance v2 upgrades to draft v3 while preserving financial records',async()=>{
    const legacy=schema+'_v2';await admin.query(`CREATE SCHEMA ${legacy}`);const legacyPool=new Pool({connectionString,max:2,options:`-c search_path=${legacy}`});
    try{
      await legacyPool.query('CREATE TABLE management_schema_migrations(version integer PRIMARY KEY,sha256 text NOT NULL,applied_at timestamptz NOT NULL DEFAULT now())');
      for(const [index,name]of ['001-management.sql','002-finance.sql'].entries()){
        const sql=fs.readFileSync(path.join(root,'netlify/lib/management/storage',name),'utf8');await legacyPool.query(sql);
        await legacyPool.query('INSERT INTO management_schema_migrations(version,sha256) VALUES($1,$2)',[index+1,createHash('sha256').update(sql).digest('hex')]);
      }
      await legacyPool.query(`INSERT INTO management_records(namespace,record_key,record_json) VALUES('finance_settings','preserved','{"revision":5,"reportingCurrency":"AUD"}'::jsonb)`);
      assert.deepEqual(await migrateManagement(legacyPool),{version:3,applied:true});
      assert.equal((await legacyPool.query("SELECT record_json FROM management_records WHERE namespace='finance_settings' AND record_key='preserved'")).rows[0].record_json.revision,5);
      const db=new PostgresManagementDatabase(legacyPool);await db.transaction([],tx=>tx.put('config_drafts','synthetic-upgrade',{revision:1,state:'draft'}));
      assert.equal((await managementPreflight(legacyPool,{local:true})).ready,true);
    }finally{await legacyPool.end();await admin.query(`DROP SCHEMA ${legacy} CASCADE`);}
  });
  await check('SQL transaction rolls back all writes after failure',async()=>{
    await assert.rejects(database.transaction(['rollback-fixture'],async tx=>{
      await tx.put('operations','rollback-a',{count:1});
      await tx.put('operations','rollback-b',{count:2});
      throw new Error('deliberate rollback fixture');
    }),/deliberate rollback fixture/);
    await database.transaction([],async tx=>{
      assert.equal(await tx.get('operations','rollback-a'),null);
      assert.equal(await tx.get('operations','rollback-b'),null);
    });
  });
  await check('real advisory locks serialize concurrent read-modify-write',async()=>{
    await Promise.all(Array.from({length:20},()=>database.transaction(['concurrency-fixture'],async tx=>{
      const old=await tx.get('operations','concurrency-counter');
      await tx.put('operations','concurrency-counter',{count:Number(old?.count||0)+1});
    })));
    await database.transaction([],async tx=>assert.equal((await tx.get('operations','concurrency-counter')).count,20));
  });
  const projections=[];
  const service=createManagementService({database,now:()=>now,catalogue:{activityIds:new Set(['oanquan']),storyIds:new Set(['banhchung'])},
    initialConfig:async()=>({releases:{},festivals:{},content:{}}),
    projector:async record=>{projections.push(record);return {revision:record.revision,effectiveHash:record.effectiveHash};}});
  await check('concurrent duplicate event ingestion stores and counts one event',async()=>{
    const event=makeEvent();
    const results=await Promise.all([service.ingestEvents(batch([event])),service.ingestEvents(batch([event]))]);
    assert.equal(results.reduce((n,r)=>n+r.accepted.length,0),1);
    assert.equal(results.reduce((n,r)=>n+r.duplicates.length,0),1);
    const stored=(await pool.query('SELECT payload FROM management_events WHERE device_id=$1 AND event_id=$2',[event.deviceId,event.eventId])).rows;
    assert.equal(stored.length,1);
    assert.equal(stored[0].payload.profiles[0].name,'Demo');
    assert.equal(stored[0].payload.deviceId,event.deviceId);
  });
  await check('changed payload under same event ID is quarantined without replacing original',async()=>{
    const event=makeEvent();await service.ingestEvents(batch([event]));
    await assert.rejects(service.ingestEvents(batch([{...event,data:{...event.data,difficulty:'hard'}}])),rejectedStatus(409));
    const stored=(await pool.query('SELECT payload FROM management_events WHERE device_id=$1 AND event_id=$2',[event.deviceId,event.eventId])).rows[0];
    assert.equal(stored.payload.data.difficulty,'easy');
    const conflicts=(await pool.query('SELECT count(*)::int AS n FROM management_event_conflicts WHERE device_id=$1 AND event_id=$2',[event.deviceId,event.eventId])).rows[0].n;
    assert.equal(conflicts,1);
  });
  await check('invalid event batch has no partial committed events',async()=>{
    const event=makeEvent();
    await assert.rejects(service.ingestEvents(batch([event,{...makeEvent(),data:{activityId:'missing',difficulty:'easy',mode:'solo'}}])));
    assert.equal((await pool.query('SELECT count(*)::int AS n FROM management_events WHERE event_id=$1',[event.eventId])).rows[0].n,0);
  });
  await check('concurrent expected-revision configuration changes admit one editor',async()=>{
    const input={scopeKey:'global',expectedRevision:0,kind:'rules',body:{releases:{managementTelemetry:{on:true}},festivals:{}},reason:'Synthetic concurrency test',eligibleDeviceIds:['demo12345678','demo87654321']};
    const results=await Promise.allSettled([service.changeConfig(input,'owner-test-a'),service.changeConfig(input,'owner-test-b')]);
    assert.equal(results.filter(r=>r.status==='fulfilled').length,1);
    const conflict=results.find(r=>r.status==='rejected');assert.equal(conflict.reason.status,409);
    assert.equal((await service.getConfig('global')).revision,1);
  });
  await check('configuration projection confirms matching revision and hash',async()=>{
    await service.projectLatest('global');
    assert.equal(projections.at(-1).revision,1);
    const config=await service.getConfig('global');assert.equal(config.revision,1);
  });
  await check('applied receipts are idempotent and unknown hashes are rejected',async()=>{
    const config=await service.getConfig('global');
    const receipt={schemaVersion:1,deviceId:'demo12345678',scopeKey:'global',revision:config.revision,effectiveHash:config.effectiveHash,
      fetchedAt:'2026-10-25T23:59:59Z',appliedAt:'2026-10-26T00:00:00Z',result:'applied',reasonCode:'none'};
    const first=await service.receiveConfigReceipt(receipt);assert.equal(first.ok,true);
    const duplicate=await service.receiveConfigReceipt(receipt);assert.equal(duplicate.duplicate,true);
    const refreshed=await service.receiveConfigReceipt({...receipt,fetchedAt:'2026-10-26T00:00:00Z',appliedAt:'2026-10-26T00:00:00.001Z'});
    assert.equal(refreshed.duplicate,true,'fresh fetch timestamps do not conflict with an existing application');
    const rejected={...receipt,deviceId:'demo87654321',appliedAt:null,result:'rejected',reasonCode:'storage_failure'};
    assert.equal((await service.receiveConfigReceipt(rejected)).ok,true);
    assert.equal((await service.receiveConfigReceipt({...receipt,deviceId:'demo87654321'})).ok,true,'application can recover after storage failure');
    const changes=await service.listChanges();
    assert.equal(changes[0].applied,2);assert.equal(changes[0].unconfirmed,0);
    assert.equal(JSON.stringify(changes).includes('demo12345678'),false,'summary history never exposes the private installation cohort');
    await assert.rejects(service.receiveConfigReceipt({...receipt,deviceId:'demo87654321',effectiveHash:'0'.repeat(64)}));
  });
  await check('SQL private draft review survives reload and racing publication commits exactly once',async()=>{
    const c=await service.getConfig(),input={expectedRevision:0,baseRevision:c.revision,kind:'rules',body:{releases:{managementTelemetry:{on:false}}},reason:'Synthetic SQL private draft'};
    const d=await service.saveDraft(input,'draft-owner');assert.equal((await service.getConfig()).revision,c.revision);
    const reload=createManagementService({database});assert.equal((await reload.getDraft(d.id)).state,'draft');
    const r=await reload.reviewDraft(d.id,{expectedRevision:d.revision,effectiveHash:d.effectiveHash},'draft-owner');
    const token={expectedRevision:r.revision,effectiveHash:r.effectiveHash};
    const results=await Promise.allSettled([reload.publishDraft(d.id,token,'draft-owner',[]),reload.publishDraft(d.id,token,'draft-owner',[])]);
    assert.equal(results.filter(x=>x.status==='fulfilled').length,1);assert.equal((await reload.getConfig()).revision,c.revision+1);
    assert.equal((await reload.getDraft(d.id)).state,'published');
    assert.equal((await database.transaction([],tx=>tx.list('config_draft_versions',d.id+'|'))).length,3);
  });
  await check('SQL failed private publication rolls back config and immutable draft history together',async()=>{
    const c=await service.getConfig(),d=await service.saveDraft({expectedRevision:0,baseRevision:c.revision,kind:'rules',body:{releases:{}},reason:'Synthetic SQL draft rollback'},'draft-owner');
    const r=await service.reviewDraft(d.id,{expectedRevision:d.revision,effectiveHash:d.effectiveHash},'draft-owner');
    const failing={transaction:(locks,work)=>database.transaction(locks,tx=>work({...tx,put:async(ns,key,value)=>{if(ns==='config_drafts'&&value.state==='published')throw Error('synthetic draft publication failure');return tx.put(ns,key,value);}}))};
    const broken=createManagementService({database:failing});
    await assert.rejects(broken.publishDraft(d.id,{expectedRevision:r.revision,effectiveHash:r.effectiveHash},'draft-owner',[]),/synthetic draft publication failure/);
    assert.equal((await service.getConfig()).revision,c.revision);assert.equal((await service.getDraft(d.id)).state,'reviewed');
    assert.equal((await database.transaction([],tx=>tx.list('config_draft_versions',d.id+'|'))).length,2);
  });
  await check('database constraints reject invalid event records',async()=>{
    await assert.rejects(pool.query("INSERT INTO management_records(namespace,record_key,record_json) VALUES('invalid','test','{}'::jsonb)"));
    for(const namespace of ['audit','config_draft_versions','config_versions','finance_versions','finance_batches']) {
      await database.transaction([],tx=>tx.put(namespace,'synthetic-immutable-history',{value:1}));
      await assert.rejects(database.transaction([],tx=>tx.put(namespace,'synthetic-immutable-history',{value:2})));
      await database.transaction([],async tx=>assert.equal((await tx.get(namespace,'synthetic-immutable-history')).value,1));
    }
  });
  await check('public HTTP ingestion acknowledges SQL persistence and duplicate retries with child/device context',async()=>{
    const records=new Map(),guard={get:async k=>records.get(k)||null,set:async(k,v)=>records.set(k,v),setJSON:async(k,v)=>records.set(k,v)};
    const endpoint=makeManagement({service:()=>service,guardStore:async()=>guard,now:()=>now}),event=makeEvent();
    const send=()=>endpoint(new Request('https://example.test/api/management/events',{method:'POST',headers:{Origin:'https://example.test','Content-Type':'application/json'},body:JSON.stringify(batch([event]))}),{ip:'192.0.2.9'});
    const first=await send();assert.equal(first.status,200);assert.deepEqual((await first.json()).accepted,[event.eventId]);
    const again=await send();assert.equal(again.status,200);assert.deepEqual((await again.json()).duplicates,[event.eventId]);
    const stored=(await pool.query('SELECT payload FROM management_events WHERE event_id=$1',[event.eventId])).rows[0].payload;
    assert.equal(stored.deviceId,event.deviceId);assert.equal(stored.profiles[0].name,'Demo');
  });
  await check('SQL operation locks persist one dispatch and immutable audit across concurrent requests',async()=>{
    let sends=0;const control=createOperationsControl({database,config:()=>({githubToken:'synthetic',githubRepo:'family/test',githubBranch:'work'}),now:()=>now,fetcher:async()=>{sends++;return new Response(null,{status:204});}});
    const input={operationId:randomUUID(),kind:'bot',count:1,duration:1,profile:'gentle-explorer',reason:'Synthetic SQL dispatch'};
    await Promise.all([control.run(input,'test-owner'),control.run(input,'test-owner')]);assert.equal(sends,1);
    const rows=await database.transaction([],tx=>tx.list('audit','operation|'+input.operationId+'|'));assert.equal(rows.length,2);
    const reloaded=createOperationsControl({database,config:()=>({}),now:()=>now});assert.equal((await reloaded.run(input,'test-owner')).duplicate,true);assert.equal(sends,1);
  });
  await check('real SQL finance commits once under concurrent retry and preserves correction revisions',async()=>{
    const finance=createFinanceService({database,now:()=>now});await finance.configure({expectedRevision:0,reportingCurrency:'AUD',reason:'Synthetic SQL setup'},'owner-test');
    const line={schemaVersion:1,provider:'Netlify',accountAlias:'synthetic',sourceDocumentId:'test-invoice',sourceLineId:'test-line',kind:'actual',amountMinor:1000,taxMinor:100,currency:'AUD',periodStart:'2026-10-01',periodEnd:'2026-10-31',recognisedAt:'2026-10-01T00:00:00Z',paidAt:null,category:'hosting',expectedRevision:0,reconciled:true,costType:'fixed'};
    const input={lines:[line],expectedSettingsRevision:1},preview=await finance.preview(input),commit={...input,operationId:randomUUID(),previewHash:preview.previewHash,reason:'Synthetic SQL import'};
    const results=await Promise.all([finance.commit(commit,'owner-test'),finance.commit(commit,'owner-test')]);assert.equal(results.filter(r=>r.duplicate).length,1);
    const changed={lines:[{...line,amountMinor:2000,expectedRevision:1}],expectedSettingsRevision:1},p2=await finance.preview(changed);await finance.commit({...changed,operationId:randomUUID(),previewHash:p2.previewHash,reason:'Correct synthetic invoice'},'owner-test');
    const versions=(await finance.history(preview.rows[0].id)).versions;assert.deepEqual(versions.map(v=>v.body.amountMinor),[1000,2000]);
    const persisted=(await pool.query("SELECT record_json FROM management_records WHERE namespace='finance_lines' AND record_key=$1",[preview.rows[0].id])).rows[0].record_json;assert.equal(persisted.revision,2);
  });
  await check('real SQL finance import rolls back every ledger, version and audit write on storage failure',async()=>{
    let writes=0;const failing={transaction:(locks,work)=>database.transaction(locks,tx=>work({...tx,put:async(ns,key,value)=>{if(ns==='finance_lines'&&++writes===2)throw new Error('synthetic finance write failure');return tx.put(ns,key,value);}}))};
    const finance=createFinanceService({database:failing,now:()=>now});
    const line={schemaVersion:1,provider:'Netlify',accountAlias:'synthetic',sourceDocumentId:'rollback-invoice',sourceLineId:'one',kind:'actual',amountMinor:100,taxMinor:0,currency:'AUD',periodStart:'2026-10-01',periodEnd:'2026-10-31',recognisedAt:'2026-10-01T00:00:00Z',category:'hosting',expectedRevision:0};
    const input={lines:[line,{...line,sourceLineId:'two'}],expectedSettingsRevision:1},preview=await finance.preview(input);
    await assert.rejects(finance.commit({...input,operationId:randomUUID(),previewHash:preview.previewHash,reason:'Synthetic rollback check'},'owner-test'),/synthetic finance write failure/);
    assert.equal((await pool.query("SELECT count(*)::int AS n FROM management_records WHERE namespace='finance_lines' AND record_json->'body'->>'sourceDocumentId'='rollback-invoice'")).rows[0].n,0);
    assert.equal((await pool.query("SELECT count(*)::int AS n FROM management_records WHERE namespace='finance_versions' AND record_json->'body'->>'sourceDocumentId'='rollback-invoice'")).rows[0].n,0);
  });
  await check('SQL function policy publication preserves private draft history and collection independently from processing',async()=>{
    const baseline=await service.getConfig(),policy={schemaVersion:1,collect:true,process:false,show:false,expiresAt:new Date(now+3600000).toISOString()};
    const d=await saveFunctionDraft({expectedRevision:0,baseRevision:baseline.revision,policy,reason:'Synthetic SQL temporary policy'},'owner-test',service,now);
    assert.equal((await service.getConfig()).revision,baseline.revision);const r=await service.reviewDraft(d.id,{expectedRevision:d.revision,effectiveHash:d.effectiveHash},'owner-test');
    await service.publishDraft(d.id,{expectedRevision:r.revision,effectiveHash:r.effectiveHash},'owner-test',[]);
    assert.equal((await service.reportingState()).process,false);assert.equal((await service.getDraft(d.id)).itemKey,'function:managementTelemetry');
    const event=makeEvent({eventName:'boot.started',data:{stage:'boot'}});assert.equal((await service.ingestEvents(batch([event]))).accepted.length,1);
    await assert.rejects(service.eventSummary({from:'2026-10-25T00:00:00Z',to:'2026-10-26T00:00:01Z'}),e=>e.code==='optional_processing_paused');
  });
  await check('SQL collector disable and expiry reject stale clients without deleting accepted events',async()=>{
    const countBefore=(await pool.query('SELECT count(*)::int AS n FROM management_events')).rows[0].n;
    const baseline=await service.getConfig(),policy={schemaVersion:1,collect:false,process:true,show:true,expiresAt:new Date(now+3600000).toISOString()};
    const d=await saveFunctionDraft({expectedRevision:0,baseRevision:baseline.revision,policy,reason:'Synthetic SQL collect Off'},'owner-test',service,now),r=await service.reviewDraft(d.id,{expectedRevision:d.revision,effectiveHash:d.effectiveHash},'owner-test');
    await service.publishDraft(d.id,{expectedRevision:r.revision,effectiveHash:r.effectiveHash},'owner-test',[]);
    const event=makeEvent({eventName:'boot.started',data:{stage:'boot'}});await assert.rejects(service.ingestEvents(batch([event])),e=>e.status===410);
    const expired=createManagementService({database,now:()=>now+3600001});assert.equal((await expired.reportingState()).process,false);
    await assert.rejects(expired.ingestEvents(batch([event])),e=>e.status===410);
    assert.equal((await pool.query('SELECT count(*)::int AS n FROM management_events')).rows[0].n,countBefore);
  });
  const record={scope:'Real local PostgreSQL transaction and management service integration with synthetic records only',
    date:new Date().toLocaleDateString('en-CA',{timeZone:'Australia/Sydney'})+' Australia/Sydney',server:version,passed:true,cases:passed};
  if(process.env.MANAGEMENT_TEST_RESULT_PATH){fs.writeFileSync(process.env.MANAGEMENT_TEST_RESULT_PATH,JSON.stringify(record,null,2)+'\n');}
  console.log(`PASS: ${passed.length} actual PostgreSQL integration cases.`);
}finally{
  if(pool)await pool.end();
  await admin.query(`DROP SCHEMA IF EXISTS ${schema} CASCADE`);
  await admin.end();
}
