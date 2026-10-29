import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {VOICE_DELIVERY}from'./voice-providers.mts';
const exec=promisify(execFile);
export async function encodeVoiceDelivery(source:Uint8Array,masterDuration:number){
 if(!Number.isFinite(masterDuration)||masterDuration<=0)throw Error('Invalid master duration');
 const dir=await fs.mkdtemp(path.join(os.tmpdir(),'sv-voice-delivery-'));
 try{
  const input=path.join(dir,'master.mp3'),output=path.join(dir,'delivery.mp3');await fs.writeFile(input,source);
  await exec('ffmpeg',['-nostdin','-v','error','-i',input,'-map_metadata','-1','-vn','-ac',String(VOICE_DELIVERY.channels),'-ar',String(VOICE_DELIVERY.sampleRate),'-c:a','libmp3lame','-b:a',String(VOICE_DELIVERY.bitrate/1000)+'k','-threads','1',output],{timeout:60000,maxBuffer:1048576});
  const probe=JSON.parse((await exec('ffprobe',['-v','error','-show_entries','stream=codec_name,bit_rate,sample_rate,channels:format=duration','-of','json',output],{timeout:30000})).stdout);
  const s=probe.streams?.[0],duration=Number(probe.format?.duration);
  if(probe.streams?.length!==1||s.codec_name!==VOICE_DELIVERY.codec||Number(s.bit_rate)!==VOICE_DELIVERY.bitrate||Number(s.sample_rate)!==VOICE_DELIVERY.sampleRate||s.channels!==VOICE_DELIVERY.channels||!Number.isFinite(duration)||Math.abs(duration-masterDuration)>.20)throw Error('Delivery format or duration mismatch');
  const decoded=await exec('ffmpeg',['-nostdin','-v','error','-i',output,'-f','null','-'],{timeout:60000,maxBuffer:1048576});
  if(decoded.stderr.trim())throw Error('Delivery MP3 contains decode errors');
  return{bytes:await fs.readFile(output),duration};
 }finally{await fs.rm(dir,{recursive:true,force:true});}
}
