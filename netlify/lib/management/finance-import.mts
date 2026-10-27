import { normalLine, fail } from './finance-values.mts';
export const CSV_FIELDS=['schemaVersion','provider','accountAlias','sourceDocumentId','sourceLineId','kind','amountMinor','currency','taxMinor','periodStart','periodEnd','recognisedAt','paidAt','category','expectedRevision','costType','reconciled','voided','settles','fxTargetCurrency','fxRate','fxSource','fxAsOf'];
/** Bounded RFC4180 parser; quotes, embedded newlines and commas are parsed before strict field validation. */
export function parseFinanceCsv(text:unknown){
 if(typeof text!=='string'||text.length>180000)fail('finance_csv_too_large');
 const rows:string[][]=[];let row:string[]=[],field='',quoted=false,closed=false;
 const endField=()=>{row.push(field);field='';closed=false;};const endRow=()=>{endField();if(row.some(v=>v!==''))rows.push(row);row=[];if(rows.length>201)fail('finance_import_limit');};
 const source=String(text).replace(/^\uFEFF/,'');
 for(let i=0;i<source.length;i++){const c=source[i];if(quoted){if(c==='"'){if(source[i+1]==='"'){field+='"';i++;}else{quoted=false;closed=true;}}else field+=c;continue;}
  if(c==='"'){if(field||closed)fail('finance_csv_invalid');quoted=true;}else if(c===',')endField();else if(c==='\n'||c==='\r'){if(c==='\r'&&source[i+1]==='\n')i++;endRow();}else{if(closed)fail('finance_csv_invalid');field+=c;}}
 if(quoted)fail('finance_csv_invalid');if(field||row.length||closed)endRow();
 const headers=rows.shift();if(!headers||new Set(headers).size!==headers.length||headers.some(h=>!CSV_FIELDS.includes(h))||CSV_FIELDS.slice(0,15).some(h=>!headers.includes(h)))fail('finance_csv_headers');
 return rows.map(r=>{if(r.length!==headers.length)fail('finance_csv_invalid');const b:any=Object.fromEntries(headers.map((h,i)=>[h,r[i]]));
  for(const k of ['schemaVersion','amountMinor','taxMinor','expectedRevision']){if(!/^-?\d+$/.test(b[k]))fail('finance_minor_units_required');b[k]=Number(b[k]);}
  for(const k of ['reconciled','voided'])if(b[k]!==undefined){if(!['true','false',''].includes(b[k]))fail('finance_csv_invalid');b[k]=b[k]==='true';}
  if(b.paidAt==='')b.paidAt=null;if(b.settles==='')b.settles=null;if(b.costType==='')delete b.costType;
  const f=['fxTargetCurrency','fxRate','fxSource','fxAsOf'];if(f.some(k=>b[k]))b.fx={targetCurrency:b.fxTargetCurrency,rate:b.fxRate,source:b.fxSource,asOf:b.fxAsOf};for(const k of f)delete b[k];return b;});
}
export function financeCsv(records:Array<{id:string;revision:number;body:any}>){
 const quote=(x)=>'"'+String(x??'').replaceAll('"','""')+'"';
 return [CSV_FIELDS.join(','),...records.map(r=>{const b=r.body;const values={...b,expectedRevision:r.revision,fxTargetCurrency:b.fx?.targetCurrency,fxRate:b.fx?.rate,fxSource:b.fx?.source,fxAsOf:b.fx?.asOf};return CSV_FIELDS.map(k=>quote(values[k])).join(',');})].join('\r\n')+'\r\n';
}
export function normalImport(value:unknown){if(!Array.isArray(value)||!value.length||value.length>200)fail('finance_import_limit');const rows=(value as unknown[]).map(normalLine);if(new Set(rows.map(r=>r.id)).size!==rows.length)fail('finance_duplicate_source_line');return rows;}
