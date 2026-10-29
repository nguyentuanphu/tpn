import { effectiveReportingPolicy, parseReportingPolicy } from '../../../js/core/reporting-policy.ts';
import { ManagementError } from './transactional/types.mts';
import { hashJson, integer, keys, record, text } from './transactional/validation.mts';

export const FUNCTION_REGISTRY=[
 {id:'managementTelemetry',capability:'implemented',collect:['js/players.ts','js/management-telemetry.ts','netlify/lib/management/transactional/service.mts:ingestEvents'],process:['attemptSummary','eventSummary'],show:['management/overview','management/activities/:id']},
 {id:'legacyAnalytics',capability:'separate-existing-controls',collect:['js/players.ts:/api/hello'],process:['legacy reporting reads'],show:['Home','People']},
 {id:'marketingAttribution',capability:'not-implemented',collect:[],process:[],show:[]},
 {id:'experiments',capability:'not-implemented',collect:[],process:[],show:[]},
 {id:'providerSync',capability:'not-implemented',collect:[],process:[],show:[]},
 {id:'saves-and-gameplay',capability:'protected',collect:[],process:[],show:[]}
];
export async function functionWorkspace(service,canEdit=false){
 let current=null;if(service.configured())try{current=await service.getEffectiveConfig();}catch{}
 const raw=current?.body?.content?.reportingPolicy;
 return {schemaVersion:1,configured:service.configured(),settingsKnown:!!current,baseRevision:current?.revision??null,
  policy:raw??null,effective:current?effectiveReportingPolicy(raw):null,
  legacyRelease:current?.body?.releases?.managementTelemetry?{on:current.body.releases.managementTelemetry.on??null,start:current.body.releases.managementTelemetry.start??null,days:current.body.releases.managementTelemetry.days??null}:null,
  registry:FUNCTION_REGISTRY,scope:'global',expiryMaximumHours:24,
  budgets:{queueMaxEvents:5000,queueMaxBytes:1000000,batchMaxEvents:50,batchMaxBytes:64000,queueMaxAgeDays:30},
  drafts:canEdit&&current?(await service.listDrafts()).filter(d=>d.itemKey==='function:managementTelemetry').map(d=>({id:d.id,revision:d.revision,state:d.state,reason:d.reason})):[],
  quality:['legacy-analytics-separate','parent-analytics-choice-wins','inflight-requests-cannot-be-recalled','receipts-remain-consent-and-collection-gated','no-background-aggregation-worker']};
}
export async function saveFunctionDraft(input:unknown,actor:string,service,now=Date.now()){
 const b=record(input);keys(b,['id','expectedRevision','baseRevision','policy','reason'],['expectedRevision','baseRevision','policy','reason']);
 const expectedRevision=integer(b.expectedRevision),baseRevision=integer(b.baseRevision),reason=text(b.reason,600,3),policy=parseReportingPolicy(b.policy);
 if(!policy)throw new ManagementError(400,'invalid_reporting_policy');
 if(policy.expiresAt!==null&&(Date.parse(policy.expiresAt)<=now||Date.parse(policy.expiresAt)>now+86400000))throw new ManagementError(400,'reporting_expiry_out_of_range');
 const current=await service.getEffectiveConfig();if(current.revision!==baseRevision)throw new ManagementError(409,'draft_baseline_conflict');
 return service.saveDraft({...(b.id===undefined?{}:{id:b.id}),expectedRevision,baseRevision,kind:'content',body:{content:{reportingPolicy:policy}},reason},actor,'function:managementTelemetry',hashJson(current.body));
}
