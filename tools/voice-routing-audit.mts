// Public inventory only: never reads device reports, family questions or unreviewed runtime text.
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath}from'node:url';
import {speechRoutes,VOICE_DELIVERY}from'./voice-providers.mts';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const read=(file:string)=>JSON.parse(fs.readFileSync(path.join(root,file),'utf8'));
export function auditVoiceRoutes(){
 const held=new Set<string>(read('docs/fpt-leminh-full-20261025/inventory.json').privacyHeld.map((x:{id:string})=>x.id));
 const inventory=read('docs/v1.02-orchard-arcade/voice-delta.json'),optional=read('voices/fpt-leminh-v1/manifest.json');
 const publicTexts=new Map<string,{text:string;source:string}>();
 for(const file of['docs/fpt-leminh-full-20261025/inventory.json','docs/fpt-v102-labels-20261026/inventory.json','docs/v1.02-orchard-arcade/voice-delta.json'])for(const l of read(file).lines)if(!held.has(l.id))publicTexts.set(l.id,{text:l.text,source:file});
 const deltas=path.join(root,'docs/voice-recording-delta');
 if(fs.existsSync(deltas))for(const name of fs.readdirSync(deltas).filter(f=>f.endsWith('.json'))){
  const batch=JSON.parse(fs.readFileSync(path.join(deltas,name),'utf8'));
  if(batch.status==='reviewed-public'&&Array.isArray(batch.lines))for(const line of batch.lines)if(!held.has(line.id))publicTexts.set(line.id,{text:line.text,source:'docs/voice-recording-delta/'+name});
 }
 const missing:Array<{id:string;provider:string;voice:string;language:string;destination:string;reason:string}>=[];
 const counts:Record<string,number>={},ledger:Array<Record<string,unknown>>=[];
 for(const lang of['en','vi','zh','hi']){
  const manifest=read('voices/manifest-'+lang+'.json');
  for(const[id,slots]of Object.entries<string>(manifest.lines)){
   for(const route of speechRoutes(lang)){
    if(route.provider==='fpt'&&held.has(id))continue;
    const destination=`${route.deliveryDirectory}/${id}.mp3`,present=route.provider==='azure'?slots.includes(route.slot):!!optional.lines[id];
    counts[route.provider+':'+route.voice]=(counts[route.provider+':'+route.voice]||0)+1;
    if(!present||!fs.existsSync(path.join(root,destination)))missing.push({id,provider:route.provider,voice:route.voice,language:lang,destination,reason:'Missing required public recording'});
    // FPT has a complete reviewed text ledger. Azure's established source inventory remains authoritative.
    ledger.push({id,language:lang,provider:route.provider,voice:route.voice,...publicTexts.get(id),delivery:destination,masterKind:route.provider==='fpt'?'verified FPT recording receipt':'native32kbps Azure output',textInventory:route.provider==='azure'?'tools/voice-lines.mts and approved tools/voice-extra.json':undefined});
   }
  }
 }
 const vi=read('voices/manifest-vi.json');
 for(const l of inventory.mixedFragments||[])if(l.lang==='vi'&&!vi.lines[l.id]&&!held.has(l.id)){
  const destination=`voices/fpt-leminh-v1/${l.id}.mp3`;counts['fpt:leminh']=(counts['fpt:leminh']||0)+1;
  if(!optional.lines[l.id]||!fs.existsSync(path.join(root,destination)))missing.push({id:l.id,provider:'fpt',voice:'leminh',language:'vi',destination,reason:'Missing reviewed Vietnamese fragment'});
  ledger.push({id:l.id,language:'vi',provider:'fpt',voice:'leminh',text:l.text,source:l.source,delivery:destination});
 }
 const auditFile=path.join(root,'docs/voice-bitrate-32k/delivery-audit.json');
 const audit=fs.existsSync(auditFile)?JSON.parse(fs.readFileSync(auditFile,'utf8')):null;
 for(const row of ledger){const receipt=audit?.files[row.id as string];if(receipt)Object.assign(row,{masterSha256:receipt.masterSha256,deliverySha256:receipt.deliverySha256,masterBytes:receipt.masterBytes,deliveryBytes:receipt.deliveryBytes});}
 return{schema:1,encoding:VOICE_DELIVERY,counts,privacyHeld:held.size,missing,optionalEncodingMatches:JSON.stringify(optional.encoding)===JSON.stringify(VOICE_DELIVERY),ledger};
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const report=auditVoiceRoutes(),dir=path.join(root,'docs/voice-bitrate-32k');fs.mkdirSync(dir,{recursive:true});
 fs.writeFileSync(path.join(dir,'provider-ledger.json'),JSON.stringify(report,null,2)+'\n');
 console.log(JSON.stringify({counts:report.counts,missing:report.missing.length,optionalEncodingMatches:report.optionalEncodingMatches,privacyHeld:report.privacyHeld}));
 if(report.missing.length||!report.optionalEncodingMatches)process.exitCode=1;
}
