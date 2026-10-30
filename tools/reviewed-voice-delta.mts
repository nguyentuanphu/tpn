// A reviewed batch contains only fixed public speech found in current, hash-bound game source.
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {collectLines} from './voice-lines.mts';
import {collectMixedFragmentRecordings,MIXED_FRAGMENT_SOURCE} from './mixed-voice-inventory.mts';
import {lineHash} from '../js/packhash.js';
export type PublicVoiceLine={id:string;lang:'en'|'vi';text:string;area:string;part:boolean;mixedFragment?:string;source:string[]};
export type ReviewedVoiceDelta={schema:1;status:'reviewed-public';sourceHashes:Record<string,string>;lines:PublicVoiceLine[]};
const hash=(bytes:string|Uint8Array)=>createHash('sha256').update(bytes).digest('hex');
// (30 Oct 2026 AEDT) My House and the Play menu speak fixed public lines too (the line checks below still refuse names and templates)
export const publicGameSource=(file:string)=>/^js\/games\/[\w-]+\.ts$/.test(file)||file==='js/howto-data.ts'||file==='js/howto-data2.ts'||file==='js/myhouse.ts'||file==='js/ui.ts';
export function validateReviewedVoiceDelta(value:unknown,readSource:(file:string)=>string|Uint8Array=path=>fs.readFileSync(path),pairs=collectLines(),readFragments=()=>collectMixedFragmentRecordings(text=>text)):ReviewedVoiceDelta{
 const d=value as ReviewedVoiceDelta;
 if(!d||d.schema!==1||d.status!=='reviewed-public'||!d.sourceHashes||!Array.isArray(d.lines)||!d.lines.length||d.lines.length>250)throw Error('Invalid reviewed public speech batch');
 const paths=Object.keys(d.sourceHashes);if(!paths.length||paths.some(p=>!publicGameSource(p)))throw Error('Only fixed public game sources are allowed');
 for(const file of paths)if(!/^[a-f0-9]{64}$/.test(d.sourceHashes[file])||hash(readSource(file))!==d.sourceHashes[file])throw Error('Public source changed after review: '+file);
 const fragments=d.lines.some(l=>l.part===true)?readFragments():[];
 const seen=new Set<string>();let characters=0;
 for(const line of d.lines){
  if(!line||!['en','vi'].includes(line.lang)||typeof line.text!=='string'||!line.text.trim()||line.text.length>5000||/\$\{|\{[^}]*\}|\b(?:Na|Bin|Kiwi)\b|[\u0000-\u001f]/.test(line.text)||!(line.part===false||line.part===true&&line.lang==='en'&&line.mixedFragment===MIXED_FRAGMENT_SOURCE)||line.id!==lineHash(line.lang,line.text)||seen.has(line.lang+':'+line.id)||!Array.isArray(line.source)||!line.source.length||line.source.some(p=>!paths.includes(p)))throw Error('Invalid or private speech in reviewed batch');
  const matches=line.part ? fragments.some(p=>p.lang==='en'&&p.id===line.id&&p.text===line.text&&p.source.some(file=>line.source.includes(file.trim().replace(/\.js$/,'.ts')))) : pairs.some(p=>p[line.lang]===line.text&&p.from.split(',').some(file=>line.source.includes(file.trim().replace(/\.js$/,'.ts'))));
  if(!matches)throw Error('Reviewed speech is not a fixed line in its current public source: '+line.id);
  seen.add(line.lang+':'+line.id);characters+=line.text.length;
 }
 if(characters>50000)throw Error('Review batch exceeds character limit');
 return d;
}
export function readReviewedVoiceDelta(file:string):ReviewedVoiceDelta{
 if(!/^docs\/voice-recording-delta\/[\w-]+\.json$/.test(file))throw Error('Reviewed batch must live under docs/voice-recording-delta');
 return validateReviewedVoiceDelta(JSON.parse(fs.readFileSync(file,'utf8')));
}
