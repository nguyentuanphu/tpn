// Inspect and fully decode every delivery route in one reviewed public batch.
import fs from 'node:fs';import path from 'node:path';import {createHash} from 'node:crypto';import {execFileSync,spawnSync} from 'node:child_process';
import {readReviewedVoiceDelta} from './reviewed-voice-delta.mts';import {speechRoutes,VOICE_DELIVERY} from './voice-providers.mts';
const file=process.argv[2]||'',batch=readReviewedVoiceDelta(file),assets:Array<Record<string,unknown>>=[];
const hash=(bytes:Uint8Array|string)=>createHash('sha256').update(bytes).digest('hex');
for(const line of batch.lines)for(const route of speechRoutes(line.lang)){
 const target=`${route.deliveryDirectory}/${line.id}.mp3`,bytes=fs.readFileSync(target);
 const probe=JSON.parse(execFileSync('ffprobe',['-v','error','-show_entries','stream=codec_name,bit_rate,sample_rate,channels:format=duration','-of','json',target],{encoding:'utf8',timeout:30000}));
 const s=probe.streams?.[0],duration=Number(probe.format?.duration);
 if(probe.streams?.length!==1||s.codec_name!==VOICE_DELIVERY.codec||Number(s.bit_rate)!==VOICE_DELIVERY.bitrate||Number(s.sample_rate)!==VOICE_DELIVERY.sampleRate||s.channels!==VOICE_DELIVERY.channels||!Number.isFinite(duration)||duration<=0)throw Error('Delivery encoding mismatch: '+target);
 const decode=spawnSync('ffmpeg',['-nostdin','-v','error','-i',target,'-f','null','-'],{encoding:'utf8',timeout:60000});
 if(decode.error||decode.status!==0||decode.stderr?.trim())throw Error('Delivery decode failed: '+target);
 const digest=hash(bytes);
 if(route.provider==='fpt'){
  const manifest=JSON.parse(fs.readFileSync('voices/fpt-leminh-v1/manifest.json','utf8')),installed=manifest.lines[line.id];
  if(!installed||installed.sha256!==digest||installed.bytes!==bytes.length)throw Error('Optional voice manifest mismatch: '+target);
 }else{
  const manifest=JSON.parse(fs.readFileSync(`voices/manifest-${line.lang}.json`,'utf8'));
  if(!manifest.lines[line.id]?.includes(route.slot))throw Error('Azure manifest slot missing: '+target);
 }
 assets.push({id:line.id,language:line.lang,provider:route.provider,voice:route.voice,path:target,bytes:bytes.length,sha256:digest,duration});
}
const report={schema:1,status:'verified-delivery',batch:file,inventorySha256:hash(fs.readFileSync(file)),encoding:VOICE_DELIVERY,fullDecode:true,assets};
const output=file.replace(/\.json$/,'.recordings.json');fs.writeFileSync(output,JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({publicLines:batch.lines.length,verifiedDeliveries:assets.length,encoding:VOICE_DELIVERY,report:path.normalize(output)}));
