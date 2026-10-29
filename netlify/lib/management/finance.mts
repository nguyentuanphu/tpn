import { hashJson } from './transactional/validation.mts';
import { ManagementError } from './transactional/types.mts';
import type { ManagementDatabase, ManagementTransaction, JsonObject } from './transactional/types.mts';
import { obj,keys,revision,reason,currency,month,bounds,date,integer,bounded,allocate,convert,round,DAY,currencies,MAX } from './finance-values.mts';
import { normalImport,parseFinanceCsv,financeCsv } from './finance-import.mts';
const UUID=/^[a-f0-9]{8}-[a-f0-9]{4}-[1-8][a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i;
const conflict=(code='finance_revision_conflict'):never=>{throw new ManagementError(409,code);};
export function createFinanceService({database,now=Date.now}:{database?:ManagementDatabase;now?:()=>number}={}){
 const db=()=>{if(!database)throw new ManagementError(503,'management_database_not_configured');return database;};
 const settings=async(tx:ManagementTransaction)=>(await tx.get('finance_settings','global'))??{revision:0,reportingCurrency:'AUD',taxBasis:'exclusive',configured:false};
 async function audit(tx:ManagementTransaction,type:string,id:string,rev:number,actor:string,why:string,before:unknown,after:unknown){
  await tx.put('audit',`finance|${type}|${id}|${rev}`,{entityType:'finance_'+type,entityId:id,revision:rev,actor,reason:why,at:new Date(now()).toISOString(),change:{beforeHash:hashJson(before),afterHash:hashJson(after),...(type==='line'?{}:{before:before as JsonObject|null,after:after as JsonObject|null})}});
 }
 async function configure(value:unknown,actor:string){const b=obj(value);keys(b,['expectedRevision','reportingCurrency','reason']);const expected=revision(b.expectedRevision),target=currency(b.reportingCurrency),why=reason(b.reason);
  return db().transaction(['finance:ledger'],async tx=>{const old=await settings(tx);if(old.revision!==expected)conflict();if(old.reportingCurrency!==target&&(await tx.list('finance_lines')).length)conflict('finance_currency_locked');
   const next={revision:expected+1,reportingCurrency:target,taxBasis:'exclusive',configured:true,updatedAt:new Date(now()).toISOString()};await tx.put('finance_settings','global',next);await audit(tx,'settings','global',next.revision,actor,why,old,next);return next;});
 }
 function importBody(value:unknown){const b=obj(value);keys(b,['lines','csv','expectedSettingsRevision']);if(('lines'in b)===('csv'in b))throw new ManagementError(422,'finance_import_format');return {rows:normalImport('csv'in b?parseFinanceCsv(b.csv):b.lines),expectedSettingsRevision:revision(b.expectedSettingsRevision)};}
 async function inspect(tx:ManagementTransaction,rows:ReturnType<typeof normalImport>,expected:number){const s=await settings(tx);if(!s.configured)throw new ManagementError(409,'finance_setup_required');if(s.revision!==expected)conflict('finance_settings_changed');
  const proposed=new Map((await tx.list('finance_lines')).map(r=>[r.key,r.value]));
  for(const r of rows){if(r.body.fx&&r.body.fx.targetCurrency!==s.reportingCurrency)throw new ManagementError(422,'finance_fx_target_mismatch');const old=proposed.get(r.id);
   if(old?.hash!==r.hash&&Number(old?.revision??0)!==r.expectedRevision)conflict();proposed.set(r.id,{id:r.id,body:r.body});}
  const settled=new Map<string,bigint>();for(const record of proposed.values()){const line=record.body as Record<string,any>;if(line.voided||!line.settles)continue;const c=proposed.get(line.settles)?.body as Record<string,any>|undefined;
   if(!c||c.voided||c.kind!=='commitment'||c.currency!==line.currency||c.provider!==line.provider||c.accountAlias!==line.accountAlias||c.costType!==line.costType)throw new ManagementError(422,'finance_invalid_settlement');settled.set(line.settles,(settled.get(line.settles)??0n)+BigInt(line.amountMinor));}
  if([...settled.values()].some(n=>n<0n))throw new ManagementError(422,'finance_invalid_settlement');
  // A commitment cannot disappear while posted actuals still reference it; void/reassign those first.
  return s;
 }
 async function preview(value:unknown){const b=importBody(value);return db().transaction(['finance:ledger'],async tx=>{const s=await inspect(tx,b.rows,b.expectedSettingsRevision);
  const rows=[];for(const r of b.rows){const old=await tx.get('finance_lines',r.id);rows.push({id:r.id,expectedRevision:r.expectedRevision,status:old?.hash===r.hash?'duplicate':old?'correction':'new',before:old?.body??null,after:r.body});}
  return {schemaVersion:1,settingsRevision:s.revision,previewHash:hashJson(b),rows};});}
 async function commit(value:unknown,actor:string){const raw=obj(value);keys(raw,['lines','csv','expectedSettingsRevision','previewHash','operationId','reason']);const why=reason(raw.reason);
  if(typeof raw.operationId!=='string'||!UUID.test(raw.operationId)||typeof raw.previewHash!=='string')throw new ManagementError(422,'finance_invalid_operation');
  const b=importBody({...(raw.csv===undefined?{lines:raw.lines}:{csv:raw.csv}),expectedSettingsRevision:raw.expectedSettingsRevision});if(hashJson(b)!==raw.previewHash)conflict('finance_preview_changed');
  const requestHash=hashJson({b,actor,why}),id=raw.operationId.toLowerCase();
  return db().transaction(['finance:ledger'],async tx=>{const prior=await tx.get('finance_batches',id);if(prior){if(prior.requestHash!==requestHash)conflict('finance_operation_conflict');return {...prior.result as JsonObject,duplicate:true};}
   await inspect(tx,b.rows,b.expectedSettingsRevision);const changed=[],duplicates=[];
   for(const r of b.rows){const old=await tx.get('finance_lines',r.id);if(old?.hash===r.hash){duplicates.push(r.id);continue;}
    const rev=Number(old?.revision??0)+1,record={id:r.id,revision:rev,hash:r.hash,body:r.body,updatedAt:new Date(now()).toISOString(),actor};
    await tx.put('finance_lines',r.id,record);await tx.put('finance_versions',r.id+'|'+String(rev).padStart(12,'0'),{...record,reason:why});await audit(tx,'line',r.id,rev,actor,why,old?.body??null,r.body);changed.push({id:r.id,revision:rev});}
   const result={ok:true,operationId:id,changed,duplicates};await tx.put('finance_batches',id,{requestHash,result,updatedAt:new Date(now()).toISOString()});return result;});}
 async function budget(value:unknown,actor:string){const b=obj(value);keys(b,['month','amountMinor','coverageThrough','expectedRevision','reason']);const m=month(b.month),amount=integer(b.amountMinor),expected=revision(b.expectedRevision),why=reason(b.reason),period=bounds(m),through=b.coverageThrough==null?null:date(b.coverageThrough);
  if(amount<0||through&&(through<period.start||through>period.end))throw new ManagementError(422,'finance_invalid_budget');
  const today=new Intl.DateTimeFormat('en-CA',{timeZone:'Australia/Sydney',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date(now()));if(through&&through>today)throw new ManagementError(422,'finance_future_coverage');
  return db().transaction(['finance:ledger'],async tx=>{const s=await settings(tx);if(!s.configured)conflict('finance_setup_required');const old=await tx.get('finance_budgets',m);if(Number(old?.revision??0)!==expected)conflict();
   const next={month:m,amountMinor:amount,currency:s.reportingCurrency,coverageThrough:through,revision:expected+1,updatedAt:new Date(now()).toISOString(),actor};await tx.put('finance_budgets',m,next);await audit(tx,'budget',m,next.revision,actor,why,old,next);return next;});}
 async function snapshot(value:{month:string;basis?:string}){const m=month(value.month),basis=value.basis??'invoice';if(!['invoice','cash'].includes(basis))throw new ManagementError(422,'finance_invalid_basis');
  if(!database)return {configured:false,databaseConfigured:false,settings:{configured:false,revision:0,reportingCurrency:'AUD'},currencies,month:m,basis,lines:[],quality:['management_database_not_configured']};
  return database.transaction(['finance:ledger'],async tx=>{const s=await settings(tx),records=(await tx.list('finance_lines')).map(r=>r.value),b=await tx.get('finance_budgets',m),period=bounds(m);return {schemaVersion:1,configured:s.configured,databaseConfigured:true,settings:s,currencies,month:m,basis,budget:b,lines:records,
   summary:summarise(records as any[],s.reportingCurrency as string,m,basis,b as any,now()),quality:['manual_ledger_not_provider_billing','tax_exclusive_with_tax_separate','original_currency_retained','calendar_service_day_allocation','missing_fx_is_not_zero','income_is_not_a_declared_revenue_model','no_payments_or_billing_changes','manual_import_coverage_assertion']};});}
 async function history(id:string){if(!/^[a-f0-9]{64}$/.test(id))throw new ManagementError(422,'finance_invalid_line');return db().transaction([],async tx=>({versions:(await tx.list('finance_versions',id+'|')).map(r=>r.value)}));}
 async function budgetHistory(m:string){month(m);return db().transaction([],async tx=>({versions:(await tx.list('audit','finance|budget|'+m+'|')).map(r=>r.value).sort((a,b)=>Number(a.revision)-Number(b.revision))}));}
 async function exportCsv(){return db().transaction([],async tx=>financeCsv((await tx.list('finance_lines')).map(r=>r.value) as any));}
 return {configure,preview,commit,budget,snapshot,history,budgetHistory,exportCsv};
}
export function summarise(records:Array<{id:string;body:Record<string,any>}>,target:string,m:string,basis:string,budget:any,now:number){
 const {start,end}=bounds(m),today=new Intl.DateTimeFormat('en-CA',{timeZone:'Australia/Sydney',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date(now));
 const totals={expense:0n,tax:0n,revenue:0n,revenueTax:0n,commitment:0n,estimate:0n,fixed:0n,variable:0n};let missingFx=0,unreconciled=0,unallocated=0,unpaid=0;const daily=new Map<string,bigint>();
 const settled=new Map<string,bigint>();for(const r of records){const l=r.body;if(!l.voided&&l.settles)settled.set(l.settles,(settled.get(l.settles)??0n)+BigInt(l.amountMinor));}
 for(const r of records){const l=r.body;if(l.voided)continue;const actual=['actual','credit','revenue'].includes(l.kind);
  if(basis==='cash'&&!actual)continue;if(basis==='cash'&&!l.paidAt){if(l.periodStart<=end)unpaid++;continue;}
  const include=basis==='cash'?l.paidAt.slice(0,10)>=start&&l.paidAt.slice(0,10)<=end:l.periodStart<=end&&l.periodEnd>=start;if(!include)continue;
  let original=BigInt(l.amountMinor);if(l.kind==='commitment'){original-=settled.get(r.id)??0n;if(original<0n)original=0n;}
  const part=basis==='cash'?original:allocate(bounded(original),l.periodStart,l.periodEnd,start,end),taxPart=basis==='cash'?BigInt(l.taxMinor):allocate(l.taxMinor,l.periodStart,l.periodEnd,start,end);
  const amount=convert(part,l,target),tax=convert(taxPart,l,target);if(amount===null||tax===null){missingFx++;continue;}
  if(l.kind==='commitment'){totals.commitment+=amount;if(l.costType!=='fixed')unallocated++;continue;}if(l.kind==='estimate'){totals.estimate+=amount;continue;}
  if(!l.reconciled)unreconciled++;
  if(l.kind==='revenue'){totals.revenue+=amount;totals.revenueTax+=tax;continue;}
  totals.expense+=amount;totals.tax+=tax;if(l.costType==='unallocated')unallocated++;else totals[l.costType]+=amount;
  if(l.costType==='variable')for(let t=Date.parse(start);t<=Date.parse(end);t+=DAY){const d=new Date(t).toISOString().slice(0,10),n=allocate(bounded(amount),l.periodStart>start?l.periodStart:start,l.periodEnd<end?l.periodEnd:end,d,d);daily.set(d,(daily.get(d)??0n)+n);}
 }
 const coverageComplete=!!budget?.coverageThrough&&budget.coverageThrough>=end;let comparable=coverageComplete&&missingFx===0&&unreconciled===0&&(basis!=='cash'||unpaid===0);
 const days=Number(end.slice(8)),day=Number(today.slice(8)),yesterday=new Date(Date.parse(today)-DAY).toISOString().slice(0,10);
 let forecast:bigint|null=null,forecastReason='insufficient_complete_days';
 if(basis!=='invoice')forecastReason='invoice_view_only';else if(m!==today.slice(0,7))forecastReason='current_month_only';else if(missingFx||unreconciled||unallocated)forecastReason='fx_reconciliation_or_cost_allocation_missing';else if(day>=8&&budget?.coverageThrough>=yesterday){let trailing=0n,spent=0n;for(const [d,n]of daily){if(d<today)spent+=n;if(d<today&&d>=new Date(Date.parse(today)-7*DAY).toISOString().slice(0,10))trailing+=n;}
  forecast=totals.fixed+totals.commitment+spent+round(trailing*BigInt(days-day+1),7n);forecastReason='fixed_actual_plus_outstanding_commitments_and_variable_trend';}
 const overflowFields:string[]=[];const safeTotal=(name:string,value:bigint)=>{if(value>MAX||value< -MAX){overflowFields.push(name);return null;}return Number(value);};
 const known=Object.fromEntries(Object.entries(totals).map(([k,v])=>[k,safeTotal(k,v)]));if(overflowFields.length)comparable=false;
 return {currency:target,overflowFields,minorDigits:currencies[target],basis,periodStart:start,periodEnd:end,known,missingFx,unreconciled,unallocated,unpaid,coverageThrough:budget?.coverageThrough??null,coverageComplete,comparable,
  actualCostMinor:comparable?known.expense:null,budgetRemainingMinor:budget&&missingFx===0?safeTotal('budgetRemaining',BigInt(budget.amountMinor)-totals.expense):null,
  commitmentAdjustedRemainingMinor:budget&&missingFx===0?safeTotal('commitmentAdjustedRemaining',BigInt(budget.amountMinor)-totals.expense-totals.commitment):null,
  forecastMinor:forecast===null?null:safeTotal('forecast',forecast),forecastReason,contributionMarginMinor:null,contributionMarginReason:'approved_attribution_and_revenue_model_required'};
}
