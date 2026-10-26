// Package verified recordings only; never makes a provider request or copies private text.
import fs from 'node:fs/promises';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {encodeVoiceDelivery} from './voice-delivery.mts';
import {VOICE_DELIVERY} from './voice-providers.mts';
import {identity,VOICE} from './fpt-recorder.mts';
import {reviewedMixedFragments,assertHanoiReceipt,missingHanoiUnits} from './hanoi-pack-policy.mts';
const digest=(data:string|Uint8Array)=>createHash('sha256').update(data).digest('hex');
const folders=process.argv.slice(2);if(!folders.length)throw Error('Pass verified staging folders, baseline first.');
const read=async(p:string)=>JSON.parse(await fs.readFile(p,'utf8'));
const texts=new Map<string,unknown>();
for(const name of['docs/fpt-leminh-full-20261025/inventory.json','docs/v1.02-orchard-arcade/voice-delta.json','docs/fpt-v102-labels-20261026/inventory.json']){
 try{for(const l of(await read(name)).lines)texts.set(l.id,l);}catch(e){throw e;}
}
const current=await read('voices/manifest-vi.json'),delta=await read('docs/v1.02-orchard-arcade/voice-delta.json');
const baseline=await read('docs/fpt-leminh-full-20261025/inventory.json'),review=await read('docs/v1.02-audit/VOICE-READINESS.json');
const held=new Set<string>([...baseline.privacyHeld.map((l:{id:string})=>l.id),...review.publicNeedsReview.map((l:{id:string})=>l.id)]);
// Only explicitly reviewed, current-source optional VI fragments may extend the default manifest.
const extra=await reviewedMixedFragments(delta.mixedFragments,delta.sourceHashes,held,file=>fs.readFile(file));
for(const[id,line]of extra){
 const prior=texts.get(id)as{ text?:string }|undefined;if(prior&&prior.text!==line.text)throw Error('Conflicting reviewed fragment identity.');
 texts.set(id,line);
}
const allowed=new Set([...Object.keys(current.lines),...extra.keys()]);
const out='voices/fpt-leminh-v1';await fs.mkdir(out,{recursive:true});
const masters=new Map<string,{source:string;receipt:{identity:string;bytes:number;sha256:string;duration:number}}>();
for(const folder of folders){
 for(const file of(await fs.readdir(folder)).filter(f=>/^(manifest-\d+|arcade-delta|labels-delta)\.json$/.test(f))){
  const report=await read(path.join(folder,file));if(JSON.stringify(report.voice)!==JSON.stringify(VOICE))throw Error('Provider identity mismatch: '+file);
  for(const[id,record]of Object.entries<{identity:string;bytes:number;sha256:string;duration:number}>(report.done||{})){
   if(!allowed.has(id))continue;const line=texts.get(id);if(!line)throw Error('Unreviewed text identity: '+id);
   const source=path.join(folder,id+'.mp3'),bytes=await fs.readFile(source);
   assertHanoiReceipt(line as Parameters<typeof identity>[0],record,bytes);
   masters.set(id,{source,receipt:record});
  }
 }
}
const lines:Record<string,{bytes:number;sha256:string}>={};
const unknown=missingHanoiUnits(allowed,new Set(masters.keys()),held);
if(unknown.length)throw Error('New Vietnamese units need reviewed FPT recordings: '+unknown.join(', '));
if(baseline.privacyHeld.some((l:{id:string})=>masters.has(l.id)))throw Error('Private units must never enter this pack.');
// Convert verified masters, never a previous delivery file. A hash-addressed cache safely resumes interrupted builds.
await fs.mkdir('temp/hanoi-delivery-cache',{recursive:true});
const stage=await fs.mkdtemp('temp/hanoi-delivery-stage-');
const audit:Record<string,{masterSha256:string;masterBytes:number;masterDuration:number;deliverySha256:string;deliveryBytes:number;deliveryDuration:number}>={};
const entries=[...masters.entries()].sort(([a],[b])=>a.localeCompare(b));let cursor=0,completed=0;
try{
 const results=await Promise.allSettled(Array.from({length:4},async()=>{
  while(cursor<entries.length){
   const[id,master]=entries[cursor++],key=master.receipt.sha256+'-'+VOICE_DELIVERY.codec+'-'+VOICE_DELIVERY.bitrate+'-'+VOICE_DELIVERY.sampleRate+'-'+(VOICE_DELIVERY.channels===1?'mono':'stereo'),cache='temp/hanoi-delivery-cache/'+key;
   let bytes:Buffer|undefined,duration:number|undefined;
   try{const receipt=await read(cache+'.json'),candidate=await fs.readFile(cache+'.mp3');if(receipt.masterSha256===master.receipt.sha256&&receipt.sha256===digest(candidate)&&receipt.bytes===candidate.length&&JSON.stringify(receipt.encoding)===JSON.stringify(VOICE_DELIVERY)&&Number.isFinite(receipt.duration)&&Math.abs(receipt.duration-master.receipt.duration)<=.20){bytes=candidate;duration=receipt.duration;}}catch{}
   if(!bytes){const encoded=await encodeVoiceDelivery(await fs.readFile(master.source),master.receipt.duration);bytes=encoded.bytes;duration=encoded.duration;await fs.writeFile(cache+'.mp3',bytes);await fs.writeFile(cache+'.json',JSON.stringify({masterSha256:master.receipt.sha256,encoding:VOICE_DELIVERY,bytes:bytes.length,sha256:digest(bytes),duration}));}
   const sha256=digest(bytes);await fs.writeFile(path.join(stage,id+'.mp3'),bytes);lines[id]={bytes:bytes.length,sha256};
   audit[id]={masterSha256:master.receipt.sha256,masterBytes:master.receipt.bytes,masterDuration:master.receipt.duration,deliverySha256:sha256,deliveryBytes:bytes.length,deliveryDuration:duration!};
   if(++completed%250===0)console.log(`Verified32kbps delivery: ${completed}/${entries.length}`);
  }
 }));
 const failed=results.find(r=>r.status==='rejected');if(failed?.status==='rejected')throw failed.reason;
 const sorted=Object.fromEntries(Object.entries(lines).sort(([a],[b])=>a.localeCompare(b)));
 const manifest={schema:1,...VOICE,language:'vi',encoding:VOICE_DELIVERY,signature:digest(JSON.stringify(sorted)),bytes:Object.values(sorted).reduce((n,l)=>n+l.bytes,0),lines:sorted};
 await fs.writeFile(stage+'/manifest.json',JSON.stringify(manifest)+'\n');
 // All encoding/decoding must succeed before the current package is replaced. Preserve its original files too.
 const backup=await fs.mkdtemp('temp/hanoi-originals-');await fs.rmdir(backup);await fs.rename(out,backup);
 try{await fs.rename(stage,out);}catch(error){await fs.rename(backup,out);throw error;}
 await fs.writeFile('js/content/hanoi-pack-info.ts','// Generated by tools/build-hanoi-pack.mts; public pack size only.\nexport const HANOI_PACK_INFO='+JSON.stringify({lines:Object.keys(lines).length,bytes:manifest.bytes,signature:manifest.signature})+';\n');
 await fs.mkdir('docs/voice-bitrate-32k',{recursive:true});await fs.writeFile('docs/voice-bitrate-32k/delivery-audit.json',JSON.stringify({encoding:VOICE_DELIVERY,units:entries.length,masterBytes:Object.values(audit).reduce((n,l)=>n+l.masterBytes,0),deliveryBytes:manifest.bytes,signature:manifest.signature,fullDecode:'passed for every newly encoded clip; resumed clips verified against their completed encoding receipts',originalPackageBackup:backup,files:Object.fromEntries(Object.entries(audit).sort(([a],[b])=>a.localeCompare(b)))},null,2)+'\n');
 console.log(`Packaged ${entries.length} verified32kbps units: ${manifest.bytes} bytes. Original masters unchanged; previous package preserved at ${backup}.`);
}finally{await fs.rm(stage,{recursive:true,force:true});}
