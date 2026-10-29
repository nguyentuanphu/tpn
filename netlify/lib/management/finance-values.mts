import { ManagementError } from './transactional/types.mts';
import { hashJson } from './transactional/validation.mts';
export const currencies:Record<string,number>={AUD:2,USD:2,EUR:2,GBP:2,NZD:2,CAD:2,SGD:2,HKD:2,CNY:2,INR:2,VND:0,JPY:0,KWD:3,BHD:3};
export const categories=['hosting','storage','bandwidth','functions','ci','voice_generation','domain','other','revenue','refund','payment_fee'];
export const kinds=['actual','estimate','commitment','credit','revenue'];
export const DAY=86400000,MAX=BigInt(Number.MAX_SAFE_INTEGER);
export const fail=(code:string):never=>{throw new ManagementError(422,code);};
export const obj=(x:unknown):Record<string,any>=>x&&typeof x==='object'&&!Array.isArray(x)?x as Record<string,any>:fail('finance_object_required');
export function keys(x:Record<string,any>,allowed:string[]){if(Object.keys(x).some(k=>!allowed.includes(k)))fail('finance_unknown_field');}
export const integer=(v:unknown)=>typeof v==='number'&&Number.isSafeInteger(v)?v:fail('finance_minor_units_required');
export const bounded=(v:bigint)=>v>MAX||v< -MAX?fail('finance_amount_overflow'):Number(v);
export function date(v:unknown):string {if(typeof v!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(v)||!Number.isFinite(Date.parse(v+'T00:00:00Z'))||new Date(v+'T00:00:00Z').toISOString().slice(0,10)!==v)fail('finance_invalid_date');return v as string;}
export function month(v:unknown):string {if(typeof v!=='string'||!/^\d{4}-\d{2}$/.test(v))fail('finance_invalid_month');date(v+'-01');return v as string;}
export function bounds(value:string){const m=month(value),start=m+'-01',last=new Date(Date.parse(start)+32*DAY);last.setUTCDate(0);return {start,end:last.toISOString().slice(0,10)};}
export function currency(v:unknown):string {if(typeof v!=='string'||!Object.hasOwn(currencies,v))fail('finance_unsupported_currency');return v as string;}
export function label(v:unknown,max=100):string {if(typeof v!=='string'||!new RegExp('^[A-Za-z0-9][A-Za-z0-9 ._:/-]{0,'+(max-1)+'}$').test(v))fail('finance_identifier_required');return v as string;}
export function reason(v:unknown):string {if(typeof v!=='string'||v.trim().length<3||v.length>600||/[\u0000-\u001f<>]/.test(v))fail('finance_reason_required');return (v as string).trim();}
export function revision(v:unknown):number {const n=integer(v);if(n<0)fail('finance_invalid_revision');return n;}
export function rational(value:unknown):{n:bigint;d:bigint} {if(typeof value!=='string'||!/^\d{1,12}(\.\d{1,12})?$/.test(value))fail('finance_invalid_fx');const [a,b='']=String(value).split('.');const n=BigInt(a+b),d=10n**BigInt(b.length);if(n<=0n)fail('finance_invalid_fx');return {n,d};}
export function round(n:bigint,d:bigint):bigint {const sign=n<0n?-1n:1n;const a=n<0n?-n:n;return sign*((a+d/2n)/d);}
export function normalLine(value:unknown){
 const b=obj(value);keys(b,['schemaVersion','provider','accountAlias','sourceDocumentId','sourceLineId','kind','amountMinor','currency','taxMinor','periodStart','periodEnd','recognisedAt','paidAt','category','expectedRevision','fx','costType','reconciled','voided','settles']);
 if(b.schemaVersion!==1||!kinds.includes(b.kind)||!categories.includes(b.category))fail('finance_invalid_line');
 const amountMinor=integer(b.amountMinor),taxMinor=integer(b.taxMinor);bounded(BigInt(amountMinor)+BigInt(taxMinor));
 if(b.kind==='credit'?(amountMinor>0||taxMinor>0):b.kind!=='revenue'&&(amountMinor<0||taxMinor<0))fail('finance_invalid_sign');
 if(amountMinor>0&&taxMinor<0||amountMinor<0&&taxMinor>0)fail('finance_invalid_sign');
 if(b.kind==='revenue'&&!['revenue','refund'].includes(b.category)||b.kind!=='revenue'&&['revenue','refund'].includes(b.category))fail('finance_category_kind_mismatch');
 if(b.kind==='revenue'&&(b.category==='refund'?(amountMinor>0||taxMinor>0):(amountMinor<0||taxMinor<0)))fail('finance_invalid_sign');
 const start=date(b.periodStart),end=date(b.periodEnd);if(start>end||Date.parse(end)-Date.parse(start)>3660*DAY)fail('finance_invalid_period');
 const stamp=(v)=>{if(typeof v!=='string'||!/^\d{4}-\d{2}-\d{2}T/.test(v)||!Number.isFinite(Date.parse(v)))fail('finance_invalid_date');date(v.slice(0,10));return new Date(v).toISOString();};
 const body:Record<string,any>={schemaVersion:1,provider:label(b.provider,60),accountAlias:label(b.accountAlias,60),sourceDocumentId:label(b.sourceDocumentId),sourceLineId:label(b.sourceLineId),kind:b.kind,amountMinor,currency:currency(b.currency),taxMinor,periodStart:start,periodEnd:end,recognisedAt:stamp(b.recognisedAt),paidAt:b.paidAt==null?null:stamp(b.paidAt),category:b.category,costType:b.costType??'unallocated',reconciled:b.reconciled??false,voided:b.voided??false,settles:b.settles??null};
 if(!['fixed','variable','unallocated'].includes(body.costType)||typeof body.reconciled!=='boolean'||typeof body.voided!=='boolean'||body.settles!==null&&!/^[a-f0-9]{64}$/.test(body.settles))fail('finance_invalid_line');
 if(body.settles&&!['actual','credit'].includes(body.kind)||body.reconciled&&['estimate','commitment'].includes(body.kind))fail('finance_invalid_reconciliation');
 if(b.fx!=null){const f=obj(b.fx);keys(f,['targetCurrency','rate','source','asOf']);const rate=rational(f.rate);if(body.currency===f.targetCurrency&&rate.n!==rate.d)fail('finance_invalid_fx');body.fx={targetCurrency:currency(f.targetCurrency),rate:f.rate,source:label(f.source),asOf:date(f.asOf)};}
 if(body.fx){for(const amount of [BigInt(amountMinor),BigInt(taxMinor),BigInt(amountMinor)+BigInt(taxMinor)])bounded(convert(amount,body,body.fx.targetCurrency)!);}
 const id=hashJson([body.provider,body.accountAlias,body.sourceDocumentId,body.sourceLineId]);return {id,body,expectedRevision:revision(b.expectedRevision),hash:hashJson(body)};
}
/** Allocate exact original minor units evenly over calendar service days, earliest days receive remainder. */
export function allocate(amount:number,start:string,end:string,from:string,to:string):bigint {
 const first=Math.max(Date.parse(start),Date.parse(from)),last=Math.min(Date.parse(end),Date.parse(to));if(first>last)return 0n;
 const days=BigInt((Date.parse(end)-Date.parse(start))/DAY+1),offset=BigInt((first-Date.parse(start))/DAY),length=BigInt((last-first)/DAY+1),sign=amount<0?-1n:1n,a=BigInt(Math.abs(amount)),remainder=a%days;
 const extra=remainder>offset?(remainder-offset<length?remainder-offset:length):0n;return sign*(a/days*length+extra);
}
/** Decimal FX is major-unit to major-unit; preserve source exponents and round half away from zero. */
export function convert(amount:bigint,line:Record<string,any>,target:string):bigint|null {
 if(line.currency===target)return amount;const f=line.fx;if(!f||f.targetCurrency!==target)return null;const rate=rational(f.rate);
 return round(amount*rate.n*10n**BigInt(currencies[target]),rate.d*10n**BigInt(currencies[line.currency]));
}
