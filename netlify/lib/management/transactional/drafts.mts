import { effectiveReportingPolicy } from '../../../../js/core/reporting-policy.ts';
import { randomUUID } from 'node:crypto';
import { ManagementError } from './types.mts';
import type { JsonObject, ManagementDatabase, ManagementTransaction } from './types.mts';
import { assertReportingPolicyChange, configBody, hashJson, integer, keys, one, record, text, UUID } from './validation.mts';

type Options={database:()=>ManagementDatabase;baseline:()=>Promise<JsonObject>;now:()=>number;
  writeConfig:(input:unknown,actor:string,tx:ManagementTransaction,reviewedHash?:string)=>Promise<{revision:number;changeId:string}>};
const conflict=(code:string):never=>{throw new ManagementError(409,code);};
const idOf=(id:unknown)=>{if(typeof id!=='string'||!UUID.test(id))throw new ManagementError(400,'invalid_draft_id');return id;};
/** Private proposals only. No projector, device read or public Blob write runs here. */
export function createConfigDrafts(options:Options){
  const stamp=()=>new Date(options.now()).toISOString();
  async function current(tx:ManagementTransaction){
    const c=await tx.get('configs','global');
    const body=c?record(c.body) as JsonObject:await options.baseline();
    return {revision:Number(c?.revision??0),body,hash:hashJson(body)};
  }
  async function get(tx:ManagementTransaction,id:string){
    const draft=await tx.get('config_drafts',id);
    if(!draft)throw new ManagementError(404,'draft_not_found');return draft;
  }
  async function persist(tx:ManagementTransaction,draft:JsonObject){
    await tx.put('config_drafts',String(draft.id),draft);
    await tx.put('config_draft_versions',String(draft.id)+'|'+String(draft.revision).padStart(16,'0'),draft);
  }
  function matches(draft:JsonObject,c:{revision:number;hash:string}){
    if(draft.baseRevision!==c.revision||draft.baseHash!==c.hash)conflict('draft_baseline_conflict');
  }
  async function getDraft(id:string){id=idOf(id);return options.database().transaction([],tx=>get(tx,id));}
  async function listDrafts(){return options.database().transaction([],async tx=>(await tx.list('config_drafts')).map(x=>x.value)
    .sort((a,b)=>String(b.updatedAt).localeCompare(String(a.updatedAt))).slice(0,100));}
  async function saveDraft(input:unknown,actor:string,itemKey?:string,expectedBaseHash?:string){
    if(itemKey!==undefined&&!/^(?:(game|story):[a-z0-9][a-z0-9_-]{0,59}|function:managementTelemetry)$/.test(itemKey))throw new ManagementError(400,'invalid_item_key');
    const b=record(input);keys(b,['id','expectedRevision','baseRevision','kind','body','reason'],['expectedRevision','baseRevision','kind','body','reason']);
    const id=b.id===undefined?randomUUID():idOf(b.id),expected=integer(b.expectedRevision),base=integer(b.baseRevision);
    const kind=one(b.kind,['rules','content']) as 'rules'|'content',reason=text(b.reason,600,3),by=text(actor,80);
    return options.database().transaction(['config:global','draft:'+id],async tx=>{
      const old=await tx.get('config_drafts',id),c=await current(tx);
      if(Number(old?.revision??0)!==expected)conflict('draft_revision_conflict');
      if(old&&(old.itemKey??null)!==(itemKey??null))conflict('draft_workspace_mismatch');
      if(old?.state==='published')conflict('draft_already_published');
      if(old&&old.kind!==kind)conflict('draft_kind_immutable');
      if(expectedBaseHash!==undefined&&expectedBaseHash!==c.hash)conflict('draft_baseline_conflict');
      if(c.revision!==base)conflict('draft_baseline_conflict');
      if(old)matches(old,c);
      const body=configBody(kind,b.body,c.body);assertReportingPolicyChange(c.body,body,options.now());
      const draft:JsonObject={id,itemKey:itemKey??null,revision:expected+1,scopeKey:'global',kind,baseRevision:c.revision,baseHash:c.hash,
        body,effectiveHash:hashJson(body),reason,state:'draft',actor:by,updatedAt:stamp(),review:null};
      await persist(tx,draft);return draft;
    });
  }
  async function reviewDraft(id:string,input:unknown,actor:string){
    id=idOf(id);const b=record(input);keys(b,['expectedRevision','effectiveHash']);
    const expected=integer(b.expectedRevision),by=text(actor,80);
    return options.database().transaction(['config:global','draft:'+id],async tx=>{
      const draft=await get(tx,id),c=await current(tx);
      if(draft.itemKey==='function:managementTelemetry'&&['expired','invalid'].includes(effectiveReportingPolicy(record(record(draft.body).content??{}).reportingPolicy,options.now()).state))conflict('reporting_policy_expired_or_invalid');
      if(draft.revision!==expected||draft.effectiveHash!==b.effectiveHash)conflict('draft_revision_conflict');
      if(draft.state==='published')conflict('draft_already_published');matches(draft,c);
      // Report exact changed sections/rules. This is not a claim that a device received them.
      const paths:string[]=[];
      for(const section of ['releases','festivals','content']){
        const before=record(c.body[section]??{}),after=record(record(draft.body)[section]??{});
        for(const key of [...new Set([...Object.keys(before),...Object.keys(after)])].sort())
          if(hashJson({value:before[key]??null})!==hashJson({value:after[key]??null}))paths.push(section+'.'+key);
      }
      const reviewed:JsonObject={...draft,revision:expected+1,state:'reviewed',updatedAt:stamp(),
        review:{actor:by,at:stamp(),effectiveHash:draft.effectiveHash,changedPaths:paths,
          scope:'global',websiteEffect:'consumer-dependent',deviceEffect:'after-fetch-and-consumer-recheck'}};
      await persist(tx,reviewed);return reviewed;
    });
  }
  async function publishDraft(id:string,input:unknown,actor:string,eligibleDeviceIds:string[]){
    id=idOf(id);const b=record(input);keys(b,['expectedRevision','effectiveHash']);const expected=integer(b.expectedRevision);
    return options.database().transaction(['config:global','draft:'+id],async tx=>{
      const draft=await get(tx,id),c=await current(tx);
      if(draft.itemKey==='function:managementTelemetry'&&['expired','invalid'].includes(effectiveReportingPolicy(record(record(draft.body).content??{}).reportingPolicy,options.now()).state))conflict('reporting_policy_expired_or_invalid');
      if(draft.revision!==expected||draft.effectiveHash!==b.effectiveHash)conflict('draft_revision_conflict');
      if(draft.state!=='reviewed'||record(draft.review).effectiveHash!==draft.effectiveHash)conflict('draft_review_required');
      matches(draft,c);
      const full=record(draft.body),content={...record(full.content??{})};
      for(const key of Object.keys(record(c.body.content??{})))if(!(key in content))content[key]=null;
      const body=draft.kind==='rules'?{releases:full.releases??{},festivals:full.festivals??{}}:{content};
      const changed=await options.writeConfig({scopeKey:'global',expectedRevision:c.revision,kind:draft.kind,body,reason:draft.reason,eligibleDeviceIds},actor,tx,String(draft.effectiveHash));
      await persist(tx,{...draft,revision:expected+1,state:'published',updatedAt:stamp(),publishedBy:text(actor,80),publishedRevision:changed.revision,changeId:changed.changeId});
      return changed;
    });
  }
  return {getDraft,listDrafts,saveDraft,reviewDraft,publishDraft};
}
