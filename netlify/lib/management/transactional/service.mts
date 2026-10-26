import { randomUUID } from 'node:crypto';
import { ManagementError, unavailable } from './types.mts';
import type { EventQuery, Json, JsonObject, ManagementDatabase, ManagementTransaction, StoredEvent } from './types.mts';
import { canonicalJson, configBody, DEVICE, fail, hashJson, instant, integer, jsonObject, keys, one, record, SCOPE, text, UUID, validateEventBatch } from './validation.mts';
import type { Catalogue } from './validation.mts';
export { ManagementError } from './types.mts';
export { hashJson, canonicalJson } from './validation.mts';

export type ConfigRecord={scopeKey:string;revision:number;body:JsonObject;effectiveHash:string;updatedAt:string;actor:string};
type Options={
  database?:ManagementDatabase|null; now?:()=>number; catalogue?:Catalogue;
  initialConfig?:()=>Promise<JsonObject>;
  /** Must perform bounded writes, honor signal and return metadata read back from storage. */
  projector?:(config:ConfigRecord,signal:AbortSignal)=>Promise<{revision:number;effectiveHash:string}>;
};
const clone=(x:JsonObject):JsonObject=>structuredClone(x);
const iso=(n:number)=>new Date(n).toISOString();
const configKey=(scope:string,revision:number)=>scope+'|'+String(revision).padStart(16,'0');
const actorName=(actor:string)=>text(actor,80);
function config(value:JsonObject):ConfigRecord {
  return {scopeKey:String(value.scopeKey),revision:Number(value.revision),body:jsonObject(value.body),effectiveHash:String(value.effectiveHash),updatedAt:String(value.updatedAt),actor:String(value.actor)};
}
function scope(value:unknown,catalogue?:Catalogue):string {
  const key=text(value,100);if(!SCOPE.test(key))fail('invalid_scope');
  if(key.startsWith('feature:')&&(!catalogue?.featureIds||!catalogue.featureIds.has(key.slice(8))))fail('unknown_feature_scope');
  return key;
}
function audit(tx:ManagementTransaction,kind:string,id:string,revision:number,actor:string,reason:string,change:JsonObject,now:number):Promise<void> {
  return tx.put('audit',kind+'|'+id+'|'+revision,{id:randomUUID(),entityType:kind,entityId:id,revision,actor,reason,change,at:iso(now)});
}
async function baseConfig(options:Options):Promise<JsonObject> {
  const raw=record(await options.initialConfig?.()??{});
  const rules=configBody('rules',{releases:raw.releases??{},festivals:raw.festivals??{}},{});
  return raw.content===undefined?rules:configBody('content',{content:raw.content},rules);
}

export function createManagementService(options:Options={}) {
  const now=options.now??(()=>Date.now());
  const db=():ManagementDatabase=>{if(!options.database)throw unavailable();return options.database;};
  const configured=()=>!!options.database;
  async function ingestEvents(input:unknown) {
    const events=validateEventBatch(input,now(),options.catalogue),locks=events.map(e=>'event:'+e.deviceId+':'+e.eventId);
    const result=await db().transaction(locks,async tx=>{
      const accepted:string[]=[],duplicates:string[]=[],seen=new Map<string,StoredEvent>();let conflict=false;
      // Check every identity before inserting any new event. Quarantine survives the rejected batch.
      for(const e of events) {
        const key=e.deviceId+'|'+e.eventId,old=seen.get(key)??await tx.getEvent(e.deviceId,e.eventId);
        if(old&&old.payloadHash!==e.payloadHash){await tx.quarantine(e);conflict=true;}
        else if(old)duplicates.push(e.eventId);else seen.set(key,e);
      }
      if(conflict)return {conflict:true,accepted:[],duplicates:[],rejected:[]};
      for(const e of seen.values()){await tx.insertEvent(e);accepted.push(e.eventId);}
      return {conflict:false,accepted,duplicates:[...new Set(duplicates)],rejected:[]};
    });
    if(result.conflict)throw new ManagementError(409,'event_payload_conflict');
    return {accepted:result.accepted,duplicates:result.duplicates,rejected:result.rejected};
  }

  async function getConfig(scopeKey='global'):Promise<ConfigRecord|null> {
    scopeKey=scope(scopeKey,options.catalogue);
    return db().transaction([],async tx=>{const value=await tx.get('configs',scopeKey);return value?config(value):null;});
  }
  async function changeConfig(input:unknown,actor:string) {
    const b=record(input);keys(b,['scopeKey','expectedRevision','kind','body','reason','eligibleDeviceIds','rollbackRevision'],['scopeKey','expectedRevision','kind','body','reason']);
    const scopeKey=scope(b.scopeKey,options.catalogue),expected=integer(b.expectedRevision),kind=one(b.kind,['rules','content']) as 'rules'|'content',reason=text(b.reason,600,3),by=actorName(actor);
    const ids=b.eligibleDeviceIds===undefined?[]:b.eligibleDeviceIds;
    if(!Array.isArray(ids)||ids.length>10000||ids.some(id=>typeof id!=='string'||!DEVICE.test(id)))fail('invalid_device_cohort');
    const cohort=[...new Set(ids as string[])].sort();
    return db().transaction(['config:'+scopeKey],async tx=>{
      const oldRaw=await tx.get('configs',scopeKey),old=oldRaw?config(oldRaw):null;
      if((old?.revision??0)!==expected)throw new ManagementError(409,'config_revision_conflict');
      const previous=old?.body??await baseConfig(options);
      let body=configBody(kind,b.body,previous);
      if(b.rollbackRevision!==undefined) {
        const target=integer(b.rollbackRevision,0,expected),saved=await tx.get('config_versions',configKey(scopeKey,target));
        if(!saved)fail('unknown_rollback_revision');body=jsonObject(saved.body);
      }
      const revision=expected+1,at=now(),effectiveHash=hashJson(body),changeId=randomUUID();
      const result:ConfigRecord={scopeKey,revision,body,effectiveHash,updatedAt:iso(at),actor:by};
      if(!old)await tx.put('config_versions',configKey(scopeKey,0),{scopeKey,revision:0,body:previous,effectiveHash:hashJson(previous),updatedAt:iso(at),actor:'legacy-baseline'});
      await tx.put('configs',scopeKey,jsonObject(result));
      await tx.put('config_versions',configKey(scopeKey,revision),jsonObject(result));
      await tx.put('changes',changeId,{changeId,scopeKey,revision,previousRevision:expected,beforeHash:hashJson(previous),effectiveHash,actor:by,reason,state:'pending_projection',createdAt:iso(at),availableAt:null,eligibleDeviceIds:cohort});
      await tx.put('projection_jobs',scopeKey,{scopeKey,targetRevision:revision,state:'pending',attempts:0,nextAttemptAt:iso(at),lastErrorCode:null});
      await audit(tx,'config',scopeKey,revision,by,reason,{beforeHash:hashJson(previous),afterHash:effectiveHash},at);
      return {...result,changeId,state:'pending_projection'};
    });
  }

  /** The SQL transaction holds the same advisory lock during write and read-back. */
  async function projectLatest(scopeKey='global') {
    scopeKey=scope(scopeKey,options.catalogue);
    if(!options.projector)throw new ManagementError(503,'management_projector_not_configured');
    return db().transaction(['config:'+scopeKey,'projection:public-live'],async tx=>{
      const raw=await tx.get('configs',scopeKey);if(!raw)fail('config_not_found',404);
      const current=config(raw),job=await tx.get('projection_jobs',scopeKey);
      const at=now();
      try {
        const signal=AbortSignal.timeout(5000),observed=await options.projector(current,signal);
        if(signal.aborted||observed.revision!==current.revision||observed.effectiveHash!==current.effectiveHash)throw new Error('projection_readback_mismatch');
        await tx.put('projection_jobs',scopeKey,{scopeKey,targetRevision:current.revision,state:'available',attempts:Number(job?.attempts??0)+1,nextAttemptAt:null,lastErrorCode:null,availableAt:iso(at)});
        for(const c of await tx.list('changes'))if(c.value.scopeKey===scopeKey&&c.value.state==='pending_projection') {
          const latest=c.value.revision===current.revision;
          await tx.put('changes',c.key,{...c.value,state:latest?'available':'superseded',availableAt:latest?iso(at):null});
        }
        return {ok:true,scopeKey,revision:current.revision,effectiveHash:current.effectiveHash,availableAt:iso(at)};
      }catch {
        // Persist the pending job without publishing a false successful availability result.
        await tx.put('projection_jobs',scopeKey,{scopeKey,targetRevision:current.revision,state:'pending',attempts:Number(job?.attempts??0)+1,nextAttemptAt:iso(at+30000),lastErrorCode:'projection_failed'});
        return {ok:false,scopeKey,revision:current.revision,code:'projection_failed'};
      }
    });
  }

  async function receiveConfigReceipt(input:unknown) {
    const b=record(input);keys(b,['schemaVersion','deviceId','scopeKey','revision','effectiveHash','fetchedAt','appliedAt','result','reasonCode']);
    if(b.schemaVersion!==1||!DEVICE.test(String(b.deviceId))||!/^[0-9a-f]{64}$/.test(String(b.effectiveHash)))fail('invalid_receipt');
    const deviceId=String(b.deviceId),scopeKey=scope(b.scopeKey,options.catalogue),revision=integer(b.revision,1),result=one(b.result,['applied','rejected','unsupported']);
    const fetchedAt=instant(b.fetchedAt),appliedAt=result==='applied'?instant(b.appliedAt):null;
    const reasonCode=one(b.reasonCode,['none','invalid_config','incompatible_build','scope_mismatch','storage_failure']);
    if(result==='applied'&&reasonCode!=='none'||result!=='applied'&&(b.appliedAt!==null||reasonCode==='none'))fail('inconsistent_receipt');
    if(scopeKey.startsWith('device:')&&scopeKey.slice(7)!==deviceId)fail('receipt_scope_mismatch');
    const at=now();if(Date.parse(fetchedAt)>at+300000||appliedAt&&(Date.parse(appliedAt)<Date.parse(fetchedAt)||Date.parse(appliedAt)>at+300000))fail('implausible_receipt_clock');
    const key=deviceId+'|'+configKey(scopeKey,revision),payload:JsonObject={schemaVersion:1,deviceId,scopeKey,revision,effectiveHash:String(b.effectiveHash),fetchedAt,appliedAt,result,reasonCode};
    return db().transaction(['receipt:'+key],async tx=>{
      const known=await tx.get('config_versions',configKey(scopeKey,revision));
      if(!known||known.effectiveHash!==b.effectiveHash)fail('unknown_config_revision');
      const changes=await tx.list('changes');
      if(!changes.some(c=>c.value.scopeKey===scopeKey&&c.value.revision===revision&&c.value.state==='available'))fail('config_not_available');
      const old=await tx.get('receipts',key);
      if(old){
        // A fresh fetch of the same revision naturally has different timestamps.
        // Keep the first successful application, and permit recovery after a storage failure.
        if(old.result==='applied'||old.result===result)return {ok:true,duplicate:true};
        if(result!=='applied')return {ok:true,duplicate:true};
      }
      await tx.put('receipts',key,{...payload,payloadHash:hashJson(payload),receivedAt:iso(at)});
      return {ok:true,duplicate:false};
    });
  }

  async function changeCoverage(changeId:string) {
    if(!UUID.test(changeId))fail('invalid_change_id');
    return db().transaction([],async tx=>{
      const c=await tx.get('changes',changeId);if(!c)fail('change_not_found',404);
      const cohort=Array.isArray(c.eligibleDeviceIds)?c.eligibleDeviceIds.filter((x):x is string=>typeof x==='string'):[];
      const receipts=(await tx.list('receipts')).map(x=>x.value).filter(r=>r.scopeKey===c.scopeKey&&r.revision===c.revision&&r.effectiveHash===c.effectiveHash);
      const byDevice=new Map(receipts.map(r=>[String(r.deviceId),r]));
      let applied=0,rejected=0,unsupported=0,unconfirmed=0;
      for(const id of cohort){const r=byDevice.get(id);if(!r)unconfirmed++;else if(r.result==='applied')applied++;else if(r.result==='rejected')rejected++;else unsupported++;}
      return {...c,eligibleCount:cohort.length,applied,rejected,unsupported,unconfirmed,newDeviceReceipts:receipts.filter(r=>!cohort.includes(String(r.deviceId))).length,coverage:cohort.length?applied/cohort.length:null};
    });
  }

  async function listChanges() {
    return db().transaction([], async tx => {
      const changes = (await tx.list('changes')).map(x => x.value).sort((a,b) => Number(b.revision)-Number(a.revision)).slice(0,100);
      const receipts = (await tx.list('receipts')).map(x => x.value);
      return changes.map(c => {
        const ids = Array.isArray(c.eligibleDeviceIds) ? c.eligibleDeviceIds : [];
        const matching = receipts.filter(r => r.scopeKey===c.scopeKey && r.revision===c.revision && r.effectiveHash===c.effectiveHash && ids.includes(r.deviceId));
        const { eligibleDeviceIds, ...publicChange } = c;
        return { ...publicChange, eligibleCount: ids.length, applied: matching.filter(r=>r.result==='applied').length,
          rejected: matching.filter(r=>r.result==='rejected').length, unsupported: matching.filter(r=>r.result==='unsupported').length,
          unconfirmed: ids.length-matching.length, quality: ['reporting-installations-at-save','self-reported-application'] };
      });
    });
  }

  const attentionStates=['observed','investigating','reproduced','fixing','fixed_in_code','deployed','verified','reopened','dismissed','duplicate'];
  const transitions:Record<string,string[]>={observed:['investigating','dismissed','duplicate'],investigating:['reproduced','dismissed','duplicate'],reproduced:['fixing','dismissed','duplicate'],fixing:['fixed_in_code','investigating'],fixed_in_code:['deployed','fixing'],deployed:['verified','reopened'],verified:['reopened'],reopened:['investigating','fixing'],dismissed:['reopened'],duplicate:['reopened']};
  async function updateAttention(id:string,input:unknown,actor:string) {
    if(!/^[\w:-]{1,100}$/.test(id))fail('invalid_attention_id');
    const b=record(input);keys(b,['expectedRevision','state','owner','reason','nextAction','evidence'],['expectedRevision','state','reason']);
    const expected=integer(b.expectedRevision),state=one(b.state,attentionStates),reason=text(b.reason,600,3),by=actorName(actor);
    const evidence=record(b.evidence??{});keys(evidence,['problemKey','build','sourceCommit','runId','deployId','verificationEvidence'],[]);
    for(const[k,v]of Object.entries(evidence))text(v,k==='verificationEvidence'?300:100);
    if(state==='deployed'&&!evidence.deployId)fail('deployment_evidence_required');
    if(state==='verified'&&(!evidence.verificationEvidence||!evidence.build))fail('verification_evidence_required');
    const owner=b.owner===null?null:b.owner===undefined?undefined:text(b.owner,80),nextAction=b.nextAction===undefined?undefined:text(b.nextAction,600,0);
    return db().transaction(['attention:'+id],async tx=>{
      const old=await tx.get('attention',id),revision=Number(old?.revision??0);
      if(revision!==expected)throw new ManagementError(409,'attention_revision_conflict');
      if(!old&&state!=='observed'||old&&state!==old.state&&!transitions[String(old.state)]?.includes(state))fail('invalid_attention_transition');
      const value:JsonObject={...(old??{}),id,revision:revision+1,state,owner:owner===undefined?old?.owner??null:owner,nextAction:nextAction??old?.nextAction??'',evidence:{...jsonObject(old?.evidence??{}),...jsonObject(evidence)},updatedAt:iso(now())};
      await tx.put('attention',id,value);
      await audit(tx,'attention',id,revision+1,by,reason,{beforeState:old?.state??null,afterState:state},now());
      return clone(value);
    });
  }
  async function listAttention() {return db().transaction([],async tx=>(await tx.list('attention')).map(x=>x.value));}
  async function auditHistory(entityType:string,entityId:string) {
    if(!['config','attention','operation'].includes(entityType))fail('invalid_audit_type');text(entityId,100);
    return db().transaction([],async tx=>(await tx.list('audit',entityType+'|'+entityId+'|')).map(x=>x.value).sort((a,b)=>Number(a.revision)-Number(b.revision)));
  }
  async function recordOperation(input:unknown,actor:string) {
    const b=record(input);keys(b,['operationId','expectedRevision','kind','status','runId','sourceCommit','reasonCode','observedAt'],['operationId','expectedRevision','kind','status','reasonCode','observedAt']);
    if(!UUID.test(String(b.operationId)))fail('invalid_operation_id');const id=String(b.operationId),expected=integer(b.expectedRevision),by=actorName(actor),kind=one(b.kind,['workflow','backup','retention','provider_health']),status=one(b.status,['queued','running','succeeded','failed','cancelled','unknown']),reasonCode=text(b.reasonCode,80),observedAt=instant(b.observedAt);
    const runId=b.runId===undefined?null:text(b.runId,100),sourceCommit=b.sourceCommit===undefined?null:text(b.sourceCommit,40);if(sourceCommit!==null&&!/^[0-9a-f]{40}$/.test(sourceCommit))fail('invalid_source_commit');
    return db().transaction(['operation:'+id],async tx=>{
      const old=await tx.get('operations',id);if(Number(old?.revision??0)!==expected)throw new ManagementError(409,'operation_revision_conflict');
      if(old&&['succeeded','failed','cancelled'].includes(String(old.status))&&old.status!==status)fail('terminal_operation_immutable');
      const value:JsonObject={operationId:id,revision:expected+1,kind,status,runId,sourceCommit,reasonCode,observedAt,updatedAt:iso(now())};
      await tx.put('operations',id,value);await audit(tx,'operation',id,expected+1,by,reasonCode,{beforeState:old?.status??null,afterState:status},now());return value;
    });
  }
  async function operations(){return db().transaction([],async tx=>(await tx.list('operations')).map(x=>x.value));}

  async function attemptSummary(query:EventQuery) {
    const from=instant(query.from),to=instant(query.to);if(from>=to||Date.parse(from)<now()-90*86400000)fail('invalid_event_period');
    const environment=query.environment??'production',traffic=query.traffic??'ordinary';
    one(environment,['production','staging','local']);one(traffic,['ordinary','authorised_test','synthetic_bot']);
    const events=await db().transaction([],tx=>tx.events({...query,from,to:iso(now()+1),environment,traffic,limit:10000}));
    const attempts=new Map<string,StoredEvent[]>();
    for(const e of events){if(!e.eventName.startsWith('activity.'))continue;const k=e.deviceId+'|'+e.attemptId;const list=attempts.get(k)??[];list.push(e);attempts.set(k,list);}
    const counts={started:0,completed:0,abandoned:0,pending:0,outcomeUnknown:0,inconsistent:0,orphanTerminals:0,lateCorrections:0};
    for(const rows of attempts.values()) {
      const starts=rows.filter(e=>e.eventName==='activity.started'&&e.occurredAt>=from&&e.occurredAt<to),terminals=rows.filter(e=>e.eventName!=='activity.started');
      if(!starts.length){if(terminals.length)counts.orphanTerminals++;continue;}
      counts.started++;const start=starts.sort((a,b)=>a.occurredAt.localeCompare(b.occurredAt))[0],id=start.payload.data&&typeof start.payload.data==='object'&&!Array.isArray(start.payload.data)?start.payload.data.activityId:null;
      const ids=new Set(rows.map(e=>{const d=e.payload.data;return d&&typeof d==='object'&&!Array.isArray(d)?d.activityId:null;}));
      if(starts.length!==1||ids.size!==1||!id||new Set(terminals.map(e=>e.eventName)).size>1||terminals.some(e=>e.occurredAt<start.occurredAt)){counts.inconsistent++;continue;}
      if(terminals.some(e=>Date.parse(e.occurredAt)-Date.parse(start.occurredAt)>7*86400000)){counts.lateCorrections++;continue;}
      if(terminals.some(e=>e.eventName==='activity.completed'))counts.completed++;
      else if(terminals.some(e=>e.eventName==='activity.abandoned'))counts.abandoned++;
      else if(now()-Date.parse(start.occurredAt)>86400000)counts.outcomeUnknown++;else counts.pending++;
    }
    const eligible=counts.started-counts.inconsistent-counts.lateCorrections;
    return {schemaVersion:1,from,to,environment,traffic,counts,eligible,completionRate:eligible?counts.completed/eligible:null,quality:['reporting-devices-only',...(events.some(e=>e.sourceCommit===null)?['unknown-source-provenance']:[])],generatedAt:iso(now())};
  }
  return {configured,ingestEvents,getConfig,changeConfig,projectLatest,receiveConfigReceipt,changeCoverage,listChanges,updateAttention,listAttention,auditHistory,recordOperation,operations,attemptSummary};
}
