// Owner-authorized static Vietnamese delta. API key exists only in Actions; no child text is sent.
import fs from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { recordFpt, FptVoiceTestError } from './fpt-voice-test.mts';
import { VOICE, identity, reusable } from './fpt-recorder.mts';
const inventory=JSON.parse(await fs.readFile('docs/fpt-v102-labels-20261026/inventory.json','utf8'));
const hash=(data:string|Uint8Array)=>createHash('sha256').update(data).digest('hex');
const folder='temp/fpt-recordings',manifest=folder+'/labels-delta.json';
type Done={identity:string;sha256:string;bytes:number;duration:number};
let report:{inventory:string;voice:typeof VOICE;total:number;done:Record<string,Done>;status:string;updated:string}={inventory:hash(JSON.stringify(inventory)),voice:VOICE,total:inventory.lines.length,done:{},status:'running',updated:''};
await fs.mkdir(folder,{recursive:true});try{const old=JSON.parse(await fs.readFile(manifest,'utf8'));if(JSON.stringify(old.voice)===JSON.stringify(VOICE))report={...report,done:old.done||{}};}catch{}
const save=async()=>{report.updated=new Date().toISOString();await fs.writeFile(manifest,JSON.stringify(report,null,2)+'\n');};
if(process.argv.includes('--dry-run'))console.log(JSON.stringify({lines:inventory.lines.length,characters:inventory.lines.reduce((n,l)=>n+l.text.length,0),voice:VOICE}));
else{
 try{
  if(execFileSync('git',['branch','--show-current'],{encoding:'utf8'}).trim()!=='work/fpt-v102-labels-20261026')throw new Error('Wrong delta branch.');
  const key=process.env.FPT_API_KEY||'';if(!key.trim())throw new Error('FPT_API_KEY is required in Actions.');
  for(const [file,expected]of Object.entries(inventory.sourceHashes))if(hash(await fs.readFile(file))!==expected)throw new Error('Source changed after inventory; rebuild the delta before recording.');
  for(const line of inventory.lines){
   if(line.lang!=='vi'||!/^[-a-f0-9]{8,40}$/.test(line.id)||/\$\{|\{name\}/.test(line.text))throw new Error('Invalid static delta line.');
   const file=`${folder}/${line.id}.mp3`;if(await reusable(file,line,report.done[line.id]))continue;
   let bytes:Uint8Array|undefined;
   for(let attempt=0;attempt<3;attempt++){try{bytes=await recordFpt(line.text,key);break;}catch(error){if(error instanceof FptVoiceTestError&&/HTTP (401|402|403)/.test(error.message))throw error;if(attempt===2)throw error;await new Promise(r=>setTimeout(r,15000*(attempt+1)));}}
   if(!bytes)throw new Error('No audio returned.');await fs.writeFile(file,bytes);
   const duration=Number(execFileSync('ffprobe',['-v','error','-show_entries','format=duration','-of','default=noprint_wrappers=1:nokey=1',file],{encoding:'utf8',timeout:30000}).trim());if(!(duration>0))throw new Error('Invalid duration.');
   execFileSync('ffmpeg',['-v','error','-i',file,'-f','null','-'],{stdio:'pipe',timeout:30000});
   report.done[line.id]={identity:identity(line),sha256:hash(bytes),bytes:bytes.length,duration};await save();await new Promise(r=>setTimeout(r,1500));
  }
  report.status='complete';await save();console.log(`Lê Minh delta: ${Object.keys(report.done).length}/${report.total} fully decoded clips.`);
 }catch(error){report.status='stopped';await save();console.error(error instanceof FptVoiceTestError?error.message:'Delta stopped; progress saved, raw provider response withheld.');process.exitCode=1;}
}
