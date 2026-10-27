// Missing-only FPT delta: original provider files/receipts stay in temp; delivery clips are compact copies.
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {readReviewedVoiceDelta,type PublicVoiceLine} from './reviewed-voice-delta.mts';
import {recordFpt,FptVoiceTestError} from './fpt-voice-test.mts';
import {identity,VOICE,reusable} from './fpt-recorder.mts';
import {assertHanoiReceipt} from './hanoi-pack-policy.mts';
import {encodeVoiceDelivery} from './voice-delivery.mts';
import {VOICE_DELIVERY} from './voice-providers.mts';
const hash=(bytes:string|Uint8Array)=>createHash('sha256').update(bytes).digest('hex');
const folder='temp/fpt-public-delta',out='voices/fpt-leminh-v1';
type Receipt={identity:string;sha256:string;bytes:number;duration:number};
export async function installedFptLine(line:PublicVoiceLine,manifest:{lines:Record<string,{bytes:number;sha256:string}>},read:(file:string)=>Promise<Uint8Array>=fs.readFile){
 const r=manifest.lines[line.id];if(!r)return false;
 try{const bytes=await read(`${out}/${line.id}.mp3`);return bytes.length===r.bytes&&hash(bytes)===r.sha256;}catch{return false;}
}
export async function missingFptLines(lines:PublicVoiceLine[],manifest:{lines:Record<string,{bytes:number;sha256:string}>},read:(file:string)=>Promise<Uint8Array>=fs.readFile){
 const missing:PublicVoiceLine[]=[];
 for(const line of lines){const present=await installedFptLine(line,manifest,read);if(manifest.lines[line.id]&&!present)throw Error('Installed delivery is corrupt; repair before recording: '+line.id);if(!present)missing.push(line);}
 return missing;
}
export async function main(){
 const file=process.argv[2]||'';const inventory=readReviewedVoiceDelta(file);
 const manifest=JSON.parse(await fs.readFile(out+'/manifest.json','utf8'));
 if(JSON.stringify(manifest.encoding)!==JSON.stringify(VOICE_DELIVERY)||manifest.voice!==VOICE.voice||manifest.model!==VOICE.model)throw Error('Installed pack identity/encoding mismatch');
 const lines=inventory.lines.filter(l=>l.lang==='vi'),missing=await missingFptLines(lines,manifest);
 if(process.argv.includes('--dry-run')){console.log(JSON.stringify({provider:VOICE,reviewed:lines.length,missing:missing.length,characters:missing.reduce((n,l)=>n+l.text.length,0)}));return;}
 const branch=execFileSync('git',['branch','--show-current'],{encoding:'utf8'}).trim();
 if(!/^(work|release|voices)\//.test(branch))throw Error('Record only on a working branch, never main');
 // Prove the decoder exists before sending any paid request.
 execFileSync('ffprobe',['-version'],{stdio:'pipe'});execFileSync('ffmpeg',['-version'],{stdio:'pipe'});
 await fs.mkdir(folder,{recursive:true});
 let report={schema:1,inventory:hash(JSON.stringify(inventory)),voice:VOICE,status:'running',done:{} as Record<string,Receipt>,updated:''};
 try{const prior=JSON.parse(await fs.readFile(folder+'/reviewed-delta.json','utf8'));if(JSON.stringify(prior.voice)===JSON.stringify(VOICE))report.done=prior.done||{};}catch{}
 const save=async()=>{report.updated=new Date().toISOString();await fs.writeFile(folder+'/reviewed-delta.json',JSON.stringify(report,null,2)+'\n');};
 try{
  for(const line of missing){
   const target=`${folder}/${line.id}.mp3`;
   if(await reusable(target,line,report.done[line.id]))continue;
   const key=process.env.FPT_API_KEY||'';if(!key.trim())throw Error('FPT_API_KEY required in Actions');
   let bytes:Uint8Array|undefined;
   for(let attempt=0;attempt<3;attempt++){
    try{bytes=await recordFpt(line.text,key);break;}catch(error){if(error instanceof FptVoiceTestError&&/HTTP (401|402|403)/.test(error.message))throw error;if(attempt===2)throw error;await new Promise(r=>setTimeout(r,15000*(attempt+1)));}
   }
   if(!bytes)throw Error('Empty provider recording');
   await fs.writeFile(target+'.part',bytes);
   const duration=Number(execFileSync('ffprobe',['-v','error','-show_entries','format=duration','-of','default=noprint_wrappers=1:nokey=1',target+'.part'],{encoding:'utf8',timeout:30000}).trim());
   if(!(duration>0))throw Error('Invalid recording duration');
   execFileSync('ffmpeg',['-nostdin','-v','error','-i',target+'.part','-f','null','-'],{stdio:'pipe',timeout:30000});
   await fs.rename(target+'.part',target);report.done[line.id]={identity:identity(line),sha256:hash(bytes),bytes:bytes.length,duration};await save();await new Promise(r=>setTimeout(r,1500));
  }
  report.status='complete';await save();
  // Prepare every new delivery file before publishing any entry in the installed manifest.
  const staged:Array<{line:PublicVoiceLine;bytes:Uint8Array;duration:number;receipt:Receipt}>=[];
  for(const line of missing){const receipt=report.done[line.id],master=await fs.readFile(`${folder}/${line.id}.mp3`);assertHanoiReceipt(line,receipt,master);const delivery=await encodeVoiceDelivery(master,receipt.duration);staged.push({line,...delivery,receipt});}
  const audit=JSON.parse(await fs.readFile('docs/voice-bitrate-32k/delivery-audit.json','utf8'));
  const retained=await Promise.all([out+'/manifest.json','js/content/hanoi-pack-info.ts','docs/voice-bitrate-32k/delivery-audit.json'].map(async file=>({file,bytes:await fs.readFile(file)})));
  const published:string[]=[];
  try {
  for(const {line,bytes,duration,receipt}of staged){
   // Existing installed entries are immutable: a corrupt entry must be repaired separately, not re-recorded.
   if(manifest.lines[line.id])throw Error('Refusing to replace an existing delivery identity: '+line.id);
   await fs.writeFile(`${out}/${line.id}.mp3.part`,bytes);await fs.rename(`${out}/${line.id}.mp3.part`,`${out}/${line.id}.mp3`);
   published.push(`${out}/${line.id}.mp3`);
   manifest.lines[line.id]={bytes:bytes.length,sha256:hash(bytes)};
   audit.files[line.id]={masterSha256:receipt.sha256,masterBytes:receipt.bytes,masterDuration:receipt.duration,deliverySha256:hash(bytes),deliveryBytes:bytes.length,deliveryDuration:duration,inventory:file};
  }
  manifest.lines=Object.fromEntries(Object.entries(manifest.lines).sort(([a],[b])=>a.localeCompare(b)));manifest.signature=hash(JSON.stringify(manifest.lines));manifest.bytes=Object.values<{bytes:number}>(manifest.lines).reduce((n,l)=>n+l.bytes,0);
  await fs.writeFile(out+'/manifest.json.part',JSON.stringify(manifest)+'\n');await fs.rename(out+'/manifest.json.part',out+'/manifest.json');
  await fs.writeFile('js/content/hanoi-pack-info.ts','// Generated by tools/record-public-voice-delta.mts; public pack size only.\nexport const HANOI_PACK_INFO='+JSON.stringify({lines:Object.keys(manifest.lines).length,bytes:manifest.bytes,signature:manifest.signature})+';\n');
  audit.units=Object.keys(audit.files).length;audit.masterBytes=Object.values<{masterBytes:number}>(audit.files).reduce((n,l)=>n+l.masterBytes,0);audit.deliveryBytes=manifest.bytes;audit.signature=manifest.signature;
  await fs.writeFile('docs/voice-bitrate-32k/delivery-audit.json',JSON.stringify(audit,null,2)+'\n');
  } catch(error){for(const old of retained)await fs.writeFile(old.file,old.bytes);for(const file of published)await fs.rm(file,{force:true});for(const {line}of staged)await fs.rm(`${out}/${line.id}.mp3.part`,{force:true});await fs.rm(out+'/manifest.json.part',{force:true});throw error;}
  console.log(`FPT delta complete: ${staged.length} new compact clips; existing deliveries unchanged.`);
 }catch(error){report.status='stopped';await save();throw error;}
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url))main().catch(error=>{console.error(error instanceof FptVoiceTestError?error.message:'Reviewed voice delta stopped; originals and progress preserved.');process.exitCode=1;});
