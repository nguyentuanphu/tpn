import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { createFinanceService } from '../../netlify/lib/management/finance.mts';
import { normalLine,allocate,convert,MAX,round,bounded } from '../../netlify/lib/management/finance-values.mts';
import { financeCsv,parseFinanceCsv } from '../../netlify/lib/management/finance-import.mts';
import { MemoryManagementTestDatabase } from '../../netlify/lib/management/storage/memory-test.mts';
import { managementHttp } from '../../netlify/lib/management/http.mts';
import { PRESETS,allowed } from '../../netlify/lib/admins.mts';
const NOW=Date.parse('2026-10-27T00:00:00Z');
const line=(extra={})=>({schemaVersion:1,provider:'Netlify',accountAlias:'studio-test',sourceDocumentId:'invoice-1',sourceLineId:'line-1',kind:'actual',amountMinor:3100,taxMinor:310,currency:'AUD',periodStart:'2026-10-01',periodEnd:'2026-10-31',recognisedAt:'2026-10-01T00:00:00Z',paidAt:null,category:'hosting',expectedRevision:0,costType:'variable',reconciled:true,...extra});
async function fixture(now=NOW){const database=new MemoryManagementTestDatabase(),finance=createFinanceService({database,now:()=>now});await finance.configure({expectedRevision:0,reportingCurrency:'AUD',reason:'Synthetic finance setup'},'owner-test');return {database,finance};}
async function save(finance,lines,extra={}){const input={lines,expectedSettingsRevision:1},preview=await finance.preview(input);return finance.commit({...input,operationId:randomUUID(),previewHash:preview.previewHash,reason:'Synthetic source verification',...extra},'owner-test');}
const status=n=>e=>e.status===n;
test('finance never activates a ledger without explicit settings and a database',async()=>{
 const absent=createFinanceService();assert.equal((await absent.snapshot({month:'2026-10'})).databaseConfigured,false);await assert.rejects(absent.configure({expectedRevision:0,reportingCurrency:'AUD',reason:'Setup ledger'},'test'),status(503));
 const f=createFinanceService({database:new MemoryManagementTestDatabase()});assert.equal((await f.snapshot({month:'2026-10'})).settings.configured,false);await assert.rejects(f.preview({lines:[line()],expectedSettingsRevision:0}),e=>e.code==='finance_setup_required');
});
test('preview is read-only; concurrent import retries persist one immutable revision and audit',async()=>{
 const {finance,database}=await fixture(),input={lines:[line()],expectedSettingsRevision:1},p=await finance.preview(input);assert.equal(database.inspect().records.has('finance_lines|'+p.rows[0].id),false);
 const body={...input,previewHash:p.previewHash,operationId:randomUUID(),reason:'Synthetic first import'};const results=await Promise.all([finance.commit(body,'owner-test'),finance.commit(body,'owner-test')]);assert.equal(results.filter(r=>r.duplicate).length,1);
 const history=await finance.history(p.rows[0].id);assert.equal(history.versions.length,1);assert.equal(history.versions[0].reason,body.reason);
 const p2=await finance.preview(input);assert.equal(p2.rows[0].status,'duplicate');const again=await save(finance,[line()]);assert.equal(again.changed.length,0);
 await assert.rejects(finance.commit({...body,reason:'A different request'},'owner-test'),status(409));
});
test('corrections require the expected revision and preserve original source evidence',async()=>{
 const {finance}=await fixture();await save(finance,[line()]);const changed=line({amountMinor:6200,expectedRevision:1});const p=await finance.preview({lines:[changed],expectedSettingsRevision:1});assert.equal(p.rows[0].status,'correction');
 await save(finance,[changed]);await assert.rejects(save(finance,[line({amountMinor:9300,expectedRevision:1})]),status(409));const h=await finance.history(p.rows[0].id);assert.deepEqual(h.versions.map(v=>v.body.amountMinor),[3100,6200]);
 await assert.rejects(finance.configure({expectedRevision:1,reportingCurrency:'USD',reason:'Attempt currency change'},'test'),e=>e.code==='finance_currency_locked');
});
test('one stale row rejects an entire multi-line import without partial writes',async()=>{
 const {finance}=await fixture();await save(finance,[line()]);const original=await finance.snapshot({month:'2026-10'});
 await assert.rejects(save(finance,[line({sourceLineId:'new-line'}),line({amountMinor:9000})]),status(409));assert.equal((await finance.snapshot({month:'2026-10'})).lines.length,original.lines.length);
 await assert.rejects(finance.preview({lines:[line(),line()],expectedSettingsRevision:1}),e=>e.code==='finance_duplicate_source_line');
});
test('minor units, tax, currency, signs, timestamps and FX are strictly bounded',()=>{
 for(const bad of [{amountMinor:1.1},{amountMinor:Number.MAX_SAFE_INTEGER,taxMinor:1},{currency:'toString'},{currency:'ZZZ'},{kind:'credit',amountMinor:1},{taxMinor:-1},{kind:'revenue',category:'hosting'},{periodEnd:'2026-02-30'},{fx:{targetCurrency:'AUD',rate:'0',source:'Manual',asOf:'2026-10-01'}},{token:'private'}])assert.throws(()=>normalLine(line(bad)));
 assert.throws(()=>bounded(MAX+1n));assert.equal(round(-15n,10n),-2n);assert.equal(normalLine(line({kind:'credit',amountMinor:-100,taxMinor:-10})).body.amountMinor,-100);
});
test('integer calendar allocation preserves every source minor unit across partial periods',()=>{
 assert.equal(allocate(100,'2026-01-01','2026-01-03','2026-01-01','2026-01-01'),34n);assert.equal(allocate(100,'2026-01-01','2026-01-03','2026-01-02','2026-01-03'),66n);assert.equal(allocate(-100,'2026-01-01','2026-01-03','2026-01-01','2026-01-03'),-100n);
 assert.equal(convert(10000n,{currency:'VND',fx:{targetCurrency:'AUD',rate:'0.00006'}},'AUD'),60n);assert.equal(convert(105n,{currency:'USD',fx:{targetCurrency:'AUD',rate:'1.5'}},'AUD'),158n);assert.equal(convert(100n,{currency:'USD'},'AUD'),null);
});
test('missing FX and incomplete imports never manufacture complete zero cost',async()=>{
 const {finance}=await fixture(Date.parse('2026-11-02T00:00:00Z'));await save(finance,[line({currency:'USD'})]);await finance.budget({month:'2026-10',amountMinor:10000,coverageThrough:'2026-10-31',expectedRevision:0,reason:'All sources entered'},'test');
 const s=(await finance.snapshot({month:'2026-10'})).summary;assert.equal(s.missingFx,1);assert.equal(s.actualCostMinor,null);assert.equal(s.budgetRemainingMinor,null);assert.equal(s.known.expense,0);assert.equal(s.comparable,false);
});
test('invoice and cash views differ honestly, including credits, taxes, revenue refunds and estimates',async()=>{
 const {finance}=await fixture(Date.parse('2026-11-02T00:00:00Z'));
 await save(finance,[line({paidAt:'2026-11-01T00:00:00Z'}),line({sourceLineId:'credit',kind:'credit',amountMinor:-100,taxMinor:-10}),line({sourceLineId:'income',kind:'revenue',category:'revenue',amountMinor:1000,taxMinor:0}),line({sourceLineId:'refund',kind:'revenue',category:'refund',amountMinor:-200,taxMinor:0}),line({sourceLineId:'estimate',kind:'estimate',amountMinor:500,taxMinor:0,reconciled:false})]);
 await finance.budget({month:'2026-10',amountMinor:10000,coverageThrough:'2026-10-31',expectedRevision:0,reason:'All source invoices checked'},'test');
 const invoice=(await finance.snapshot({month:'2026-10'})).summary;assert.equal(invoice.actualCostMinor,3000);assert.equal(invoice.known.tax,300);assert.equal(invoice.known.revenue,800);assert.equal(invoice.known.estimate,500);assert.equal(invoice.budgetRemainingMinor,7000);
 const cash=(await finance.snapshot({month:'2026-10',basis:'cash'})).summary;assert.equal(cash.known.expense,0);assert.equal(cash.unpaid,3);const nov=(await finance.snapshot({month:'2026-11',basis:'cash'})).summary;assert.equal(nov.known.expense,3100);
});
test('settled commitments are not double counted and cannot be voided while still referenced',async()=>{
 const {finance}=await fixture();const commitment=line({sourceLineId:'commitment',kind:'commitment',amountMinor:10000,taxMinor:0,reconciled:false});await save(finance,[commitment]);const id=normalLine(commitment).id;
 await save(finance,[line({amountMinor:3000,taxMinor:0,settles:id})]);const s=(await finance.snapshot({month:'2026-10'})).summary;assert.equal(s.known.commitment,7000);assert.equal(s.known.expense,3000);
 await assert.rejects(save(finance,[{...commitment,voided:true,expectedRevision:1}]),e=>e.code==='finance_invalid_settlement');
 await assert.rejects(save(finance,[line({sourceLineId:'bad',settles:id,currency:'USD'})]),e=>e.code==='finance_invalid_settlement');
});
test('forecast requires complete trailing days and classified, reconciled inputs',async()=>{
 const {finance}=await fixture();await save(finance,[line({periodEnd:'2026-10-26',amountMinor:2600,taxMinor:0})]);let s=(await finance.snapshot({month:'2026-10'})).summary;assert.equal(s.forecastMinor,null);
 await finance.budget({month:'2026-10',amountMinor:10000,coverageThrough:'2026-10-26',expectedRevision:0,reason:'Sources complete through yesterday'},'test');s=(await finance.snapshot({month:'2026-10'})).summary;assert.equal(s.forecastMinor,3100);assert.equal((await finance.snapshot({month:'2026-10',basis:'cash'})).summary.forecastMinor,null);
 await assert.rejects(finance.budget({month:'2026-10',amountMinor:10000,coverageThrough:'2026-10-31',expectedRevision:1,reason:'Impossible future completeness'},'test'),e=>e.code==='finance_future_coverage');
});
test('CSV roundtrips source fields without credentials and rejects malformed or duplicate headers',async()=>{
 const {finance}=await fixture();await save(finance,[line({currency:'USD',fx:{targetCurrency:'AUD',rate:'1.5',source:'Manual bank quote',asOf:'2026-10-01'}})]);const csv=await finance.exportCsv(),parsed=parseFinanceCsv(csv);assert.equal(parsed[0].amountMinor,3100);assert.equal(parsed[0].expectedRevision,1);assert.equal(parsed[0].fx.rate,'1.5');assert.equal(normalLine(parsed[0]).hash,normalLine(line({currency:'USD',fx:{targetCurrency:'AUD',rate:'1.5',source:'Manual bank quote',asOf:'2026-10-01'}})).hash);
 assert.throws(()=>parseFinanceCsv(csv.replace('accountAlias','provider')));assert.throws(()=>parseFinanceCsv(csv+'"unfinished'));assert.equal(csv.includes('token'),false);
});
test('finance routes deny ordinary analytics, editors and desktop keys; grants remain explicit',async()=>{
 const {finance}=await fixture(),deps={finance,reads:{},service:{}},request=(suffix,body)=>new Request('https://example.test/studio/api/management/finance'+suffix,{method:body?'POST':'GET',...(body?{body:JSON.stringify(body)}:{})});
 for(const me of [{role:'editor',perms:PRESETS.editor},{role:'viewer'},{role:'custom',perms:['analytics','management.read']},{role:'exe',perms:['finance.read','finance.write']}]){assert.equal((await managementHttp(request('?month=2026-10'),me,deps)).status,403);assert.equal(allowed(me,'management/finance/export',false),false);}
 const reader={role:'custom',name:'reader',perms:['finance.read']};assert.equal((await managementHttp(request('?month=2026-10'),reader,deps)).status,200);assert.equal((await managementHttp(request('/preview',{lines:[line()],expectedSettingsRevision:1}),reader,deps)).status,403);
 assert.equal((await managementHttp(request('/export'),reader,deps)).headers.get('Cache-Control'),'private, no-store');assert.equal(PRESETS.editor.includes('finance.read'),false);
});

test('budget corrections keep immutable before/after evidence and reject competing editors',async()=>{
 const {finance}=await fixture();const b={month:'2026-10',amountMinor:10000,coverageThrough:'2026-10-26',expectedRevision:0,reason:'Approve synthetic budget'};
 await finance.budget(b,'test-owner');await finance.budget({...b,expectedRevision:1,amountMinor:12000,reason:'Correct synthetic budget'},'test-owner');
 await assert.rejects(finance.budget({...b,expectedRevision:1,amountMinor:50000},'test-owner'),status(409));const h=await finance.budgetHistory('2026-10');assert.equal(h.versions.length,2);assert.equal(h.versions[1].change.before.amountMinor,10000);assert.equal(h.versions[1].change.after.amountMinor,12000);
});
test('cost per reporting installation/hour requires complete finance and non-zero comparable game totals',async()=>{
 const {finance}=await fixture(Date.parse('2026-11-02T00:00:00Z'));await save(finance,[line({amountMinor:1200,taxMinor:0})]);await finance.budget({month:'2026-10',amountMinor:10000,coverageThrough:'2026-10-31',expectedRevision:0,reason:'All sources reconciled'},'test-owner');
 const read={role:'custom',name:'reader',perms:['finance.read']},request=()=>new Request('https://example.test/studio/api/management/finance?month=2026-10');
 const zero=await (await managementHttp(request(),read,{finance,service:{},reads:{overview:async()=>({totals:{activeDevices:0,mins:0}})}})).json();assert.equal(zero.summary.costPerActiveMinor,null);assert.equal(zero.summary.costPerHourMinor,null);
 const measured=await (await managementHttp(request(),read,{finance,service:{},reads:{overview:async()=>({totals:{activeDevices:4,mins:120}})}})).json();assert.equal(measured.summary.costPerActiveMinor,300);assert.equal(measured.summary.costPerHourMinor,600);assert.equal(measured.summary.denominators.limitations.includes('analytics_opt_out_bias'),true);
});

test('overflowing FX is rejected before persistence and aggregate/budget overflow keeps the ledger readable',async()=>{
 assert.throws(()=>normalLine(line({currency:'USD',amountMinor:Number.MAX_SAFE_INTEGER,taxMinor:0,fx:{targetCurrency:'AUD',rate:'100',source:'Synthetic',asOf:'2026-10-01'}})),e=>e.code==='finance_amount_overflow');
 const {finance}=await fixture();await save(finance,[line({amountMinor:Number.MAX_SAFE_INTEGER,taxMinor:0,costType:'fixed'}),line({sourceLineId:'two',amountMinor:Number.MAX_SAFE_INTEGER,taxMinor:0,costType:'fixed'})]);
 const snapshot=await finance.snapshot({month:'2026-10'});assert.equal(snapshot.lines.length,2);assert.equal(snapshot.summary.known.expense,null);assert.equal(snapshot.summary.overflowFields.includes('expense'),true);assert.equal(snapshot.summary.actualCostMinor,null);
});
test('credits cannot create negative net settlement on a linked commitment',async()=>{
 const {finance}=await fixture(),commitment=line({kind:'commitment',sourceLineId:'contract',reconciled:false});await save(finance,[commitment]);await assert.rejects(save(finance,[line({kind:'credit',sourceLineId:'excess-credit',amountMinor:-100,taxMinor:0,settles:normalLine(commitment).id})]),e=>e.code==='finance_invalid_settlement');
});
