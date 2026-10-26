import fs from 'node:fs';
import { createHash } from 'node:crypto';
import { collectLines } from './voice-lines.mts';
import { packHash } from '../js/packhash.js';
const digest=(b:string|Uint8Array)=>createHash('sha256').update(b).digest('hex');
const baseline=fs.readFileSync('docs/fpt-leminh-full-20261025/inventory.json','utf8'),existing=new Set<string>(JSON.parse(baseline).lines.map(l=>l.id));
const wanted=new Set(['js/games/fruitparade.js','js/games/trongnu.js','js/games/sparkleorchard.js','js/games/sparklefruitbar.js','js/games/cacuangua.js','js/games/folk-court.js','js/games/snakes.js','js/games/oanquan-online.js','js/games/tug-online.js','js/games/familyquiz.js']);
const lines=new Map<string,{id:string;lang:string;text:string;area:string;part:boolean;source:string[]}>();
// Preserve previously reviewed fixed entries (including family titles and turtle numbers).
const previous=JSON.parse(fs.readFileSync('docs/v1.02-orchard-arcade/voice-delta.json','utf8'));
for(const line of previous.lines){if(line.lang!=='vi'||/\$\{|\{name\}/.test(line.text))throw Error('Only static reviewed Vietnamese lines belong here.');lines.set(line.id,line);}
for(const line of collectLines())if(line.from.split(',').some(f=>wanted.has(f))){const text=line.vi.replace(/\s+/g,' ').trim(),id=packHash('vi',text);if(!existing.has(id))lines.set(id,{id,lang:'vi',text,area:'games',part:false,source:line.from.split(',').filter(f=>wanted.has(f))});}
const sources=new Set([...Object.keys(previous.sourceHashes),...wanted,'js/games/snakes-core.ts','js/games/shared-board-session.ts','js/games/oanquan-core.ts','js/games/vietnam.ts','js/games/board-agreement.ts','js/games/tug-core.ts','js/games/tug-session.ts'].map(f=>f.replace(/\.js$/,'.ts')));
const sourceHashes=Object.fromEntries([...sources].map(source=>[source,digest(fs.readFileSync(source))]));
const result={source:'Reviewed static arcade, horse and folk-game lines; previously reviewed titles and turtle numbers retained. Frozen baseline excluded; private user speech excluded.',baselineSha256:digest(baseline),sourceHashes,lines:[...lines.values()].sort((a,b)=>a.id.localeCompare(b.id))};
fs.mkdirSync('docs/v1.02-orchard-arcade',{recursive:true});fs.writeFileSync('docs/v1.02-orchard-arcade/voice-delta.json',JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify({lines:lines.size,characters:[...lines.values()].reduce((n,l)=>n+l.text.length,0)}));
