import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {stripTypeScriptTypes} from 'node:module';
import {loadManagementCatalogue,explainAvailability} from '../../netlify/lib/management/catalogue.mts';
import {itemEntry,itemWorkspace,saveItemDraft} from '../../netlify/lib/management/items.mts';
import {createManagementService} from '../../netlify/lib/management/transactional/service.mts';
import {MemoryManagementTestDatabase} from '../../netlify/lib/management/storage/memory-test.mts';
import {managementHttp} from '../../netlify/lib/management/http.mts';
const entries=loadManagementCatalogue().entries,game=itemEntry(entries,'game:oanquan'),story=itemEntry(entries,'story:banhchung');
const initial={releases:{newGames:{on:false}},festivals:{},content:{message:{en:'Keep this'},activities:{counting:{hide:true}},itemAvailability:{'story:banhchung':false}}};
const fixture=()=>createManagementService({database:new MemoryManagementTestDatabase(),initialConfig:async()=>structuredClone(initial),projector:async c=>({revision:c.revision,effectiveHash:c.effectiveHash})});
const input={expectedRevision:0,baseRevision:0,enabled:false,reason:'Synthetic item control'};
const token=d=>({expectedRevision:d.revision,effectiveHash:d.effectiveHash});

test('every source item has a typed workspace with explicit consumers, dependencies and static website limits',async()=>{
 const s=fixture();for(const entry of entries){
  const key=entry.kind+':'+entry.id,w=await itemWorkspace(entry,s);
  assert.equal(w.key,key);assert.equal(w.settingsKnown,true);assert.ok(w.connections.consumers.length>=3);
  assert.equal(w.connections.website.effect,'static-guide-not-updated-by-item-control');assert.equal(w.connections.scope,'global');
  assert.deepEqual(w.drafts,[]);assert.equal('body' in w,false);assert.equal('profiles' in w,false);
 }
 assert.throws(()=>itemEntry(entries,'oanquan'),e=>e.code==='invalid_item_key');
 assert.throws(()=>itemEntry(entries,'game:missing'),e=>e.code==='item_not_found');
});
test('item proposal changes only the selected typed item and placement while retaining unrelated settings',async()=>{
 const s=fixture(),d=await saveItemDraft(game,{...input,hide:true,area:'vietnam',little:false},'owner',s);
 assert.equal(d.itemKey,'game:oanquan');assert.equal(await s.getConfig(),null);
 assert.deepEqual(d.body.content.message,initial.content.message);assert.deepEqual(d.body.content.activities.counting,{hide:true});
 assert.equal(d.body.content.itemAvailability['story:banhchung'],false);assert.equal(d.body.content.itemAvailability['game:oanquan'],false);
 assert.deepEqual(d.body.content.activities.oanquan,{hide:true,area:'vietnam',little:false});
 const r=await s.reviewDraft(d.id,token(d),'owner');await s.publishDraft(d.id,token(r),'owner',[]);
 assert.equal((await s.getConfig()).body.content.itemAvailability['game:oanquan'],false);
 assert.equal((await s.getDraft(d.id)).state,'published');
});
test('item drafts cannot be overwritten from a different item or generic editor and declared-only enable fails closed',async()=>{
 const s=fixture(),d=await saveItemDraft(game,input,'owner',s);
 await assert.rejects(saveItemDraft(story,{...input,id:d.id,expectedRevision:d.revision},'owner',s),e=>e.code==='draft_workspace_mismatch');
 await assert.rejects(s.saveDraft({id:d.id,expectedRevision:d.revision,baseRevision:0,kind:'content',body:{content:{message:{en:'Wrong editor'}}},reason:'Wrong editor'},'owner'),e=>e.code==='draft_workspace_mismatch');
 const pending=entries.find(e=>e.coverage.discovery==='declared-only');
 await assert.rejects(saveItemDraft(pending,{...input,enabled:true},'owner',s),e=>e.code==='item_integration_required');
 for(const invalid of [{...input,scopeKey:'device:x'},{...input,eligibleDeviceIds:[]},{...input,area:'unknown'},{...input,enabled:'false'}])await assert.rejects(saveItemDraft(game,invalid,'owner',s));
 await assert.rejects(saveItemDraft(story,{...input,hide:false},'owner',s),e=>e.code==='game_setting_on_story');
});
test('stale item draft cannot overwrite newer public settings and unchanged inherited placement is preserved',async()=>{
 const s=fixture();await s.changeConfig({scopeKey:'global',expectedRevision:0,kind:'content',body:{content:{activities:{...initial.content.activities,oanquan:{hide:true,area:'art',little:true}}}},reason:'Synthetic baseline'},'owner');
 await assert.rejects(saveItemDraft(game,input,'owner',s),e=>e.code==='draft_baseline_conflict');
 const d=await saveItemDraft(game,{...input,baseRevision:1,enabled:true,hide:false,area:null,little:null},'owner',s);
 assert.equal(d.body.content.activities.oanquan,undefined,'empty inherited override is removed by existing cleaner');
 assert.deepEqual(d.body.content.activities.counting,{hide:true});
});
test('item reads are available without SQL but cannot invent settings; private drafts need both configure and edit',async()=>{
 const owner={name:'owner',role:'owner'},summary={name:'summary',role:'custom',perms:['management.read']};
 const s=fixture(),d=await saveItemDraft(game,input,'owner',s),deps={service:s,reads:{},catalogue:()=>entries};
 const req=(key,body)=>new Request('https://example.test/studio/api/management/items/'+key+(body?'/draft':''),{method:body?'POST':'GET',...(body?{body:JSON.stringify(body)}:{})});
 const result=await (await managementHttp(req('game:oanquan'),summary,deps)).json();assert.deepEqual(result.drafts,[]);assert.equal(JSON.stringify(result).includes(d.id),false);
 const privateResult=await (await managementHttp(req('game:oanquan'),owner,deps)).json();assert.equal(privateResult.drafts[0].id,d.id);
 for(const perms of [['management.read'],['management.configure'],['edit'],['management.configure','releases']])assert.equal((await managementHttp(req('game:oanquan',input),{role:'custom',perms},deps)).status,403);
 const disconnected=await itemWorkspace(game,createManagementService());assert.equal(disconnected.settingsKnown,false);assert.equal(disconnected.settings,null);assert.equal(disconnected.expectation,null);
});
test('actual shared item policy separates game/story identities and Off overrides every saved profile without mutation',async()=>{
 const source=stripTypeScriptTypes(fs.readFileSync(new URL('../../js/custom.ts',import.meta.url),'utf8'),{mode:'strip'}).replace(/\bexport\s+/g,'');
 const context=vm.createContext({fetch:async()=>({ok:false}),AbortController,setTimeout,clearTimeout,localStorage:{getItem:()=>null},navigator:{onLine:false}});
 const C=await new vm.Script('(async()=>{'+source+';return {CUSTOM,itemEnabled,setPlayers,setPeeks};})()').runInContext(context);
 const profile={admin:true,unlockAll:true,wins:{oanquan:20},tried:{readingTrial:'2026-10-01'}},before=JSON.stringify(profile);C.setPlayers([profile]);C.setPeeks(['newGames']);
 for(const entry of entries){const key=entry.kind+':'+entry.id;C.CUSTOM.itemAvailability={[key]:false};assert.equal(C.itemEnabled(entry.kind,entry.id),false);assert.equal(C.itemEnabled(entry.kind==='game'?'story':'game',entry.id),true);}
 C.CUSTOM.itemAvailability={'game:oanquan':true};assert.equal(C.itemEnabled('game','oanquan'),true);assert.equal(JSON.stringify(profile),before);
 const expected=explainAvailability(game,{custom:{itemAvailability:{'game:oanquan':false}},profiles:[profile]});assert.equal(expected.result,'closed');assert.equal(expected.gates.find(g=>g.id==='item_availability').reason,'explicit_item_off');
});
