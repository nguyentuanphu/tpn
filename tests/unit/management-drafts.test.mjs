import test from 'node:test';
import assert from 'node:assert/strict';
import {createManagementService} from '../../netlify/lib/management/transactional/service.mts';
import {MemoryManagementTestDatabase} from '../../netlify/lib/management/storage/memory-test.mts';
import {managementHttp} from '../../netlify/lib/management/http.mts';
const initial={releases:{reading:{on:true}},festivals:{},content:{message:{en:'Before',vi:'Trước'}}};
const fixture=()=>{const database=new MemoryManagementTestDatabase();return {database,service:createManagementService({database,initialConfig:async()=>initial})};};
const proposal={expectedRevision:0,baseRevision:0,kind:'rules',body:{releases:{reading:{on:false}}},reason:'Synthetic owner switch'};
const token=d=>({expectedRevision:d.revision,effectiveHash:d.effectiveHash});
const code=expected=>e=>e.code===expected;

test('private drafts survive service reload and review never changes public config or receipts',async()=>{
 const f=fixture(),d=await f.service.saveDraft(proposal,'operator');
 const reloaded=createManagementService({database:f.database,initialConfig:async()=>initial});
 assert.equal((await reloaded.getDraft(d.id)).body.releases.reading.on,false);
 assert.equal((await reloaded.listDrafts()).length,1);
 const reviewed=await reloaded.reviewDraft(d.id,token(d),'reviewer');
 assert.equal(reviewed.state,'reviewed');assert.deepEqual(reviewed.review.changedPaths,['releases.reading']);
 assert.equal(await reloaded.getConfig(),null);assert.equal((await reloaded.listChanges()).length,0);
 const namespaces=[...f.database.inspect().records.keys()];assert.ok(namespaces.every(k=>k.startsWith('config_draft')));
});
test('publishing requires exact reviewed version; editing resets review and repeated publish cannot create another revision',async()=>{
 const {service:s}=fixture(),d=await s.saveDraft(proposal,'operator');
 await assert.rejects(s.publishDraft(d.id,token(d),'owner',[]),code('draft_review_required'));
 const r=await s.reviewDraft(d.id,token(d),'owner');
 const edited=await s.saveDraft({...proposal,id:d.id,expectedRevision:r.revision,reason:'Changed proposal reason'},'owner');
 assert.equal(edited.review,null);await assert.rejects(s.publishDraft(d.id,token(edited),'owner',[]),code('draft_review_required'));
 const reviewed=await s.reviewDraft(d.id,token(edited),'owner');
 await assert.rejects(s.publishDraft(d.id,{...token(reviewed),effectiveHash:'0'.repeat(64)},'owner',[]),code('draft_revision_conflict'));
 const changed=await s.publishDraft(d.id,token(reviewed),'owner',['demo12345678']);
 assert.equal(changed.revision,1);assert.equal((await s.getConfig()).body.releases.reading.on,false);
 assert.equal((await s.getDraft(d.id)).state,'published');
 await assert.rejects(s.publishDraft(d.id,token(reviewed),'owner',[]),code('draft_revision_conflict'));
 assert.equal((await s.listChanges()).length,1);assert.equal((await s.listChanges())[0].eligibleCount,1);
});
test('racing draft edits serialize and a competing public revision blocks stale review and publication',async()=>{
 const {service:s}=fixture(),d=await s.saveDraft(proposal,'owner');
 const edits=await Promise.allSettled([s.saveDraft({...proposal,id:d.id,expectedRevision:1},'one'),s.saveDraft({...proposal,id:d.id,expectedRevision:1},'two')]);
 assert.equal(edits.filter(x=>x.status==='fulfilled').length,1);
 const r=await s.reviewDraft(d.id,token(await s.getDraft(d.id)),'owner');
 await s.changeConfig({scopeKey:'global',expectedRevision:0,kind:'rules',body:{releases:{}},reason:'Other public change'},'other');
 await assert.rejects(s.publishDraft(d.id,token(r),'owner',[]),code('draft_baseline_conflict'));
 await assert.rejects(s.reviewDraft(d.id,token(r),'owner'),code('draft_baseline_conflict'));
 assert.equal((await s.getDraft(d.id)).state,'reviewed');
});
test('legacy baseline hash drift is detected even before first managed revision; content removal publishes exactly',async()=>{
 const db=new MemoryManagementTestDatabase();let baseline=structuredClone(initial);
 const s=createManagementService({database:db,initialConfig:async()=>baseline});
 const d=await s.saveDraft(proposal,'owner');baseline.content.message.en='Updated elsewhere';
 await assert.rejects(s.reviewDraft(d.id,token(d),'owner'),code('draft_baseline_conflict'));
 const removed=await s.saveDraft({...proposal,kind:'content',body:{content:{message:null}}},'owner');
 const r=await s.reviewDraft(removed.id,token(removed),'owner');await s.publishDraft(r.id,token(r),'owner',[]);
 assert.deepEqual((await s.getConfig()).body.content,{});assert.deepEqual((await s.getConfig()).body,(await s.getDraft(r.id)).body);
});
test('failed atomic draft publication rolls back config, change history and published state',async()=>{
 const f=fixture(),d=await f.service.saveDraft(proposal,'owner'),r=await f.service.reviewDraft(d.id,token(d),'owner');
 const broken={transaction:(locks,work)=>f.database.transaction(locks,tx=>work({...tx,put:async(ns,key,value)=>{if(ns==='config_drafts'&&value.state==='published')throw Error('synthetic draft write failure');return tx.put(ns,key,value);}}))};
 const s=createManagementService({database:broken,initialConfig:async()=>initial});
 await assert.rejects(s.publishDraft(d.id,token(r),'owner',[]),/synthetic draft write failure/);
 assert.equal(await s.getConfig(),null);assert.equal((await s.listChanges()).length,0);assert.equal((await s.getDraft(d.id)).state,'reviewed');
});
test('legacy source changing during publication cannot publish a body different from the reviewed hash',async()=>{
 const database=new MemoryManagementTestDatabase();let reads=0,race=false;
 const service=createManagementService({database,initialConfig:async()=>{reads++;return race&&reads%2===0?{...initial,content:{message:{en:'Racing source'}}}:initial;}});
 const d=await service.saveDraft(proposal,'owner'),r=await service.reviewDraft(d.id,token(d),'owner');
 reads=0;race=true;
 await assert.rejects(service.publishDraft(d.id,token(r),'owner',[]),code('draft_baseline_conflict'));
 assert.equal(await service.getConfig(),null);assert.equal((await service.getDraft(d.id)).state,'reviewed');
});
test('draft HTTP requires configure plus matching edit grant; summaries cannot read private proposals',async()=>{
 const f=fixture(),dependencies={...f,reads:{devices:async()=>({devices:[],nextCursor:null})}};
 const req=(path,body)=>new Request('https://example.test/studio/api/management/'+path,{method:body?'POST':'GET',...(body?{body:JSON.stringify(body)}:{})});
 const owner={name:'owner',role:'owner'},rules={name:'rules',role:'custom',perms:['management.configure','releases']};
 const content=await f.service.saveDraft({...proposal,kind:'content',body:{content:{message:{en:'Private proposal'}}}},'owner');
 for(const perms of [[],['management.read'],['management.configure'],['releases']]){
  const me={name:'limited',role:'custom',perms};assert.equal((await managementHttp(req('drafts',proposal),me,dependencies)).status,403);
 }
 assert.equal((await managementHttp(req('drafts'),{role:'custom',perms:['management.read']},dependencies)).status,403);
 assert.equal((await managementHttp(req('drafts/'+content.id),rules,dependencies)).status,403);
 assert.equal((await managementHttp(req('drafts/'+content.id+'/review',token(content)),rules,dependencies)).status,403);
 assert.equal((await (await managementHttp(req('drafts'),rules,dependencies)).json()).drafts.length,0);
 const saved=await (await managementHttp(req('drafts',proposal),owner,dependencies)).json();
 const review=await (await managementHttp(req('drafts/'+saved.id+'/review',token(saved)),owner,dependencies)).json();
 // No projector configured: SQL publication is saved once and remains explicitly pending.
 const published=await managementHttp(req('drafts/'+saved.id+'/publish',token(review)),owner,dependencies);
 assert.equal(published.status,202);assert.equal((await published.json()).state,'pending_projection');assert.equal((await f.service.getDraft(saved.id)).state,'published');
 assert.equal((await f.service.getConfig()).revision,1);
});
