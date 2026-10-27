import { hashJson } from './transactional/validation.mts';
import { ManagementError } from './transactional/types.mts';
import type { JsonObject, ManagementDatabase, ManagementTransaction } from './transactional/types.mts';
import { providerAdapters, ProviderError } from './providers.mts';
import type { ProviderConfig, ProviderJob } from './providers.mts';
import { managementOperations } from './operations.mts';

type Options={database?:ManagementDatabase;config:()=>ProviderConfig;fetcher?:typeof fetch;now?:()=>number;retryConfiguration?:()=>Promise<{ok:boolean}>};
const UUID=/^[a-f0-9]{8}-[a-f0-9]{4}-[1-8][a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i;
const terminal=(r)=>['succeeded','failed','cancelled'].includes(r.status)||!!r.finishedAt;
const iso=(n:number)=>new Date(n).toISOString();
const safe=(r:JsonObject)=>({operationId:r.operationId,kind:r.dispatchType||r.kind,status:r.status,dispatchState:r.dispatchState??null,
  runId:r.runId??null,sourceCommit:r.sourceCommit??null,actor:r.actor??null,createdAt:r.createdAt??r.updatedAt,
  observedAt:r.observedAt,finishedAt:r.finishedAt??null,reasonCode:r.reasonCode,revision:r.revision,inputs:r.inputs??null});
async function audit(tx:ManagementTransaction,row:JsonObject) {
  await tx.put('audit','operation|'+row.operationId+'|'+row.revision,{entityType:'operation',entityId:row.operationId,revision:row.revision,
    actor:row.actor,at:row.updatedAt,reason:row.reasonCode,change:{status:row.status,dispatchState:row.dispatchState??null,runId:row.runId??null}});
}
function input(value:unknown,actor:string) {
  if(!value||typeof value!=='object'||Array.isArray(value))throw new ManagementError(422,'invalid_operation');
  const b=value as Record<string,any>;
  if(Object.keys(b).some(k=>!['operationId','kind','count','profile','duration','reason'].includes(k))||typeof b.operationId!=='string'||!UUID.test(b.operationId)||!['bot','database_check','retry_configuration'].includes(b.kind))throw new ManagementError(422,'invalid_operation');
  if(typeof b.reason!=='string'||b.reason.trim().length<3||b.reason.length>600||/[\u0000-\u001f<>]/.test(b.reason)||!actor||actor.length>80)throw new ManagementError(422,'operation_reason_required');
  const args:JsonObject={};
  if(b.kind==='bot') {
    if(!Number.isInteger(b.count)||b.count<1||b.count>10||!Number.isInteger(b.duration)||b.duration<1||b.duration>30||!['chaos-toddler','gentle-explorer','max-competence'].includes(b.profile))throw new ManagementError(422,'invalid_bot_inputs');
    Object.assign(args,{count:b.count,duration:b.duration,profile:b.profile});
  }else if(['count','profile','duration'].some(k=>b[k]!==undefined))throw new ManagementError(422,'unexpected_operation_inputs');
  return {id:b.operationId.toLowerCase(),kind:b.kind,inputs:args,reason:b.reason.trim(),hash:hashJson({kind:b.kind,inputs:args,reason:b.reason.trim(),actor})};
}

export function createOperationsControl(options:Options) {
  const now=options.now??(()=>Date.now());let cache:any=null,cacheAt=0,inFlight:Promise<any>|null=null;
  let remembered:{github?:any;netlify?:any;azure?:any}={};
  const database=()=>{if(!options.database)throw new ManagementError(503,'management_database_not_configured');return options.database;};
  async function reconcile(jobs:ProviderJob[]) {
    if(!options.database)return;
    jobs=jobs.filter(j=>j.provider==='github'&&j.kind==='bot');
    const ids=[...new Set(jobs.map(j=>j.operationId).filter((id):id is string=>!!id))];
    for(const id of ids)await options.database.transaction(['operation:'+id],async tx=>{
      const old=await tx.get('operations',id);if(!old||old.dispatchType!=='bot'||terminal(old))return;
      const matches=jobs.filter(j=>j.operationId===id),runIds=new Set(matches.map(j=>j.id));
      const job=matches[0];
      const status=runIds.size>1?'unknown':['queued','running','succeeded','failed','cancelled'].includes(job.state)?job.state:'unknown';
      const runId=runIds.size===1?job.id:null,finishedAt=runIds.size===1?job.finishedAt??null:null;
      if(old.status===status&&old.runId===runId&&old.finishedAt===finishedAt)return;
      const next:JsonObject={...old,revision:Number(old.revision)+1,status,runId,finishedAt,sourceCommit:job.sourceCommit??null,
        observedAt:iso(now()),updatedAt:iso(now()),reasonCode:runIds.size>1?'multiple_matching_runs':'provider_run_observed',dispatchState:'accepted'};
      await tx.put('operations',id,next);await audit(tx,next);
    });
  }
  async function collect() {
    const at=now(),adapters=providerAdapters(options.config(),options.fetcher,now),observations:any={},feeds:any={},jobs:ProviderJob[]=[];
    const tasks=Object.entries(adapters.configured).filter(([,on])=>on).map(async([name])=>{
      try {
        const result=await adapters[name]();remembered[name]={result,at};
        feeds[name]={status:'observed',sourceAsOf:iso(at),quota:result.quota??{status:'unavailable'},errorCode:null};
        observations[name==='github'?'githubRead':name==='netlify'?'netlifyRead':'voiceGeneration']={status:name==='azure'?'degraded':'ready',observedAt:iso(at),operation:name==='github'?'github.workflow_runs':name==='netlify'?'netlify.deploys':'azure.voice_catalogue'};
        if(result.jobs)jobs.push(...result.jobs);
      }catch(error){
        const previous=remembered[name],code=error instanceof ProviderError?error.code:'provider_unavailable';
        feeds[name]={status:previous?'stale':'unavailable',sourceAsOf:previous?iso(previous.at):null,quota:{status:'unavailable'},errorCode:code};
        if(previous?.result.jobs)jobs.push(...previous.result.jobs);
        observations[name==='github'?'githubRead':name==='netlify'?'netlifyRead':'voiceGeneration']={status:'unavailable',observedAt:iso(at),operation:name+'.probe',errorCode:code};
      }
    });
    if(options.database)tasks.push((async()=>{try{await options.database!.transaction([],tx=>tx.get('configs','global'));observations.database={status:'ready',observedAt:iso(at),operation:'database.config_read'};}catch{observations.database={status:'unavailable',observedAt:iso(at),operation:'database.config_read',errorCode:'provider_unavailable'};}})());
    await Promise.all(tasks);
    // Only fresh provider evidence advances a durable operation.
    await reconcile(jobs.filter(j=>feeds[j.provider==='github'?'github':'netlify']?.status==='observed')).catch(()=>{});
    let operations:any[]=[],operationSource='not_configured';
    if(options.database)try{operations=(await options.database.transaction([],tx=>tx.list('operations'))).map(r=>safe(r.value)).sort((a,b)=>String(b.createdAt).localeCompare(String(a.createdAt))).slice(0,100);operationSource='observed';}catch{operationSource='unavailable';}
    const accepted=operations.find(r=>r.kind==='bot'&&r.dispatchState==='accepted');
    if(accepted)observations.githubDispatch={status:'ready',observedAt:accepted.createdAt,operation:'github.dispatch_accepted'};
    const projected=managementOperations({configured:{database:!!options.database,githubRead:adapters.configured.github,githubDispatch:adapters.configured.github,
      netlifyRead:adapters.configured.netlify,voiceGeneration:adapters.configured.azure,managementEvents:!!options.database,configurationReceipts:!!options.database},observations,now:new Date(at)});
    const terminalJobs=jobs.filter(j=>['succeeded','failed'].includes(j.state));
    const feedValues=Object.values(feeds) as any[],fresh=feedValues.filter(f=>f.status==='observed');
    const result={...projected,jobs,operations,operationSource,feeds,databaseConfigured:!!options.database,
      jobSummary:!fresh.length?{status:jobs.length?'stale':'unavailable',terminalCount:null,successCount:null}:{status:feedValues.some(f=>f.status!=='observed')?'partial':'observed',terminalCount:terminalJobs.filter(j=>feeds[j.provider]?.status==='observed').length,successCount:terminalJobs.filter(j=>j.state==='succeeded'&&feeds[j.provider]?.status==='observed').length},
      quality:['read_only_provider_probes','recent_feed_not_all_history','dispatch_is_not_completion','cancelled_skipped_unknown_excluded_from_success_ratio',
        ...(adapters.configured.azure?['azure_catalogue_access_does_not_prove_generation']:[]),...(!options.database?['durable_operation_history_not_connected']:[])]};
    cache=result;cacheAt=now();return result;
  }
  async function snapshot(force=false) {
    if(cache&&now()-cacheAt<(force?30000:60000))return cache;
    if(inFlight)return inFlight;
    inFlight=collect();try{return await inFlight;}finally{inFlight=null;}
  }
  async function run(value:unknown,actor:string) {
    const b=input(value,actor),db=database(),at=now();
    const prepared=await db.transaction(['operations:dispatch:'+b.kind,'operation:'+b.id],async tx=>{
      const old=await tx.get('operations',b.id);
      if(old){if(old.requestHash!==b.hash)throw new ManagementError(409,'operation_payload_conflict');return {execute:false,row:old};}
      const recent=(await tx.list('operations')).some(r=>r.value.dispatchType===b.kind&&at-Date.parse(String(r.value.createdAt))<(b.kind==='bot'?60000:10000));
      if(recent)throw new ManagementError(429,'operation_cooldown');
      const row:JsonObject={operationId:b.id,revision:1,kind:'workflow',dispatchType:b.kind,status:'queued',dispatchState:'dispatching',actor,
        reasonCode:'operator_requested',reason:b.reason,inputs:b.inputs,requestHash:b.hash,runId:null,finishedAt:null,createdAt:iso(at),updatedAt:iso(at),observedAt:iso(at)};
      await tx.put('operations',b.id,row);await audit(tx,row);return {execute:true,row};
    });
    if(!prepared.execute)return {duplicate:true,operation:safe(prepared.row)};
    let status='queued',state='accepted',code='dispatch_accepted';
    try {
      if(b.kind==='bot')await providerAdapters(options.config(),options.fetcher,now).dispatchBot(b.inputs as {count:number;duration:number;profile:string},b.id);
      else if(b.kind==='database_check'){await db.transaction([],tx=>tx.get('configs','global'));status='succeeded';state='completed';code='database_read_confirmed';}
      else {if(!options.retryConfiguration)throw new ProviderError('unsupported',true);const result=await options.retryConfiguration();status=result.ok?'succeeded':'failed';state='completed';code=result.ok?'configuration_available':'projection_pending';}
    }catch(error){const definite=error instanceof ProviderError&&error.definiteRejection;status=b.kind==='bot'&&!definite?'unknown':'failed';state=status==='unknown'?'uncertain':'rejected';code=error instanceof ProviderError?error.code:'operation_failed';}
    const row=await db.transaction(['operation:'+b.id],async tx=>{
      const current=await tx.get('operations',b.id);if(!current)throw new ManagementError(503,'operation_record_unavailable');
      const observed=!!current.runId||terminal(current);
      const next:JsonObject={...current,revision:Number(current.revision)+1,status:observed?current.status:status,dispatchState:observed?'accepted':state,
        reasonCode:observed?current.reasonCode:code,updatedAt:iso(now()),observedAt:iso(now()),finishedAt:observed?current.finishedAt??null:status==='succeeded'||status==='failed'?iso(now()):null};
      await tx.put('operations',b.id,next);await audit(tx,next);return next;
    });cache=null;
    return {duplicate:false,operation:safe(row)};
  }
  return {snapshot,run};
}
