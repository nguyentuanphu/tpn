import fs from 'node:fs';
import { createHash } from 'node:crypto';
import { collectLines } from './voice-lines.mts';
import { packHash } from '../js/packhash.js';
const digest=(b:string|Uint8Array)=>createHash('sha256').update(b).digest('hex');
const baseline=fs.readFileSync('docs/fpt-leminh-full-20261025/inventory.json','utf8'),existing=new Set<string>(JSON.parse(baseline).lines.map(l=>l.id));
const wanted=new Set(['js/games/fruitparade.js','js/games/trongnu.js','js/games/sparkleorchard.js','js/games/sparklefruitbar.js']);
const lines=new Map<string,{id:string;lang:string;text:string;area:string;part:boolean;source:string[]}>();
for(const line of collectLines())if(line.from.split(',').some(f=>wanted.has(f))){const text=line.vi.replace(/\s+/g,' ').trim(),id=packHash('vi',text);if(!existing.has(id))lines.set(id,{id,lang:'vi',text,area:'games',part:false,source:line.from.split(',').filter(f=>wanted.has(f))});}
const sourceHashes=Object.fromEntries([...wanted].map(f=>{const source=f.replace(/\.js$/,'.ts');return[source,digest(fs.readFileSync(source))];}));
const result={source:'v1.02 static arcade source; frozen 6319 baseline excluded',baselineSha256:digest(baseline),sourceHashes,lines:[...lines.values()].sort((a,b)=>a.id.localeCompare(b.id))};
fs.mkdirSync('docs/v1.02-orchard-arcade',{recursive:true});fs.writeFileSync('docs/v1.02-orchard-arcade/voice-delta.json',JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify({lines:lines.size,characters:[...lines.values()].reduce((n,l)=>n+l.text.length,0)}));
