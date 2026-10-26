import fs from 'node:fs';
import { createHash } from 'node:crypto';
import { collectLines } from './voice-lines.mts';
import { packHash } from '../js/packhash.js';
import {collectMixedFragmentRecordings} from './mixed-voice-inventory.mts';
Object.assign(globalThis, {document: {documentElement: {}}, localStorage: {getItem: () => null, setItem: () => {}}});
const {swapNames} = await import('../js/i18n.js');
const digest=(b:string|Uint8Array)=>createHash('sha256').update(b).digest('hex');
const baseline=fs.readFileSync('docs/fpt-leminh-full-20261025/inventory.json','utf8'),existing=new Set<string>(JSON.parse(baseline).lines.map(l=>l.id));
const labels=JSON.parse(fs.readFileSync('docs/fpt-v102-labels-20261026/inventory.json','utf8'));
for(const line of labels.lines)existing.add(line.id);
const legacyWanted=new Set(['js/games/fruitparade.js','js/games/trongnu.js','js/games/sparkleorchard.js','js/games/sparklefruitbar.js','js/games/cacuangua.js','js/games/folk-court.js','js/games/snakes.js','js/games/oanquan-online.js','js/games/tug-online.js','js/games/familyquiz.js']);
const lines=new Map<string,{id:string;lang:string;text:string;area:string;part:boolean;source:string[];mixedFragment?:string}>();
// Preserve previously reviewed fixed entries (including family titles and turtle numbers).
const previous=JSON.parse(fs.readFileSync('docs/v1.02-orchard-arcade/voice-delta.json','utf8'));
for(const line of previous.lines){if(line.lang!=='vi'||/\$\{|\{name\}/.test(line.text))throw Error('Only static reviewed Vietnamese lines belong here.');lines.set(line.id,line);}
// Any new game's reviewed public Vietnamese lines qualify; never rely on a fixed list of game files.
const currentVietnamese=JSON.parse(fs.readFileSync('voices/manifest-vi.json','utf8'));
const held=new Set(JSON.parse(baseline).privacyHeld.map(l=>l.id));
const publicSources=new Set<string>();
for(const line of collectLines()){
 const text=line.vi.replace(/\s+/g,' ').trim(),id=packHash('vi',text);
 if(!currentVietnamese.lines[id]||existing.has(id)||held.has(id)||/\b(?:Na|Bin|Kiwi)\b|\$\{|\{[^}]*\}/.test(text))continue;
 const source=line.from.split(',');source.forEach(f=>publicSources.add(f));
 lines.set(id,{id,lang:'vi',text,area:'public',part:false,source});
}
const fragments = collectMixedFragmentRecordings(swapNames).filter(line => line.lang === 'vi');
for (const fragment of fragments) if (!existing.has(fragment.id)) lines.set(fragment.id, fragment);
const fragmentSources = fragments.flatMap(line => line.source);
const sources=new Set([...Object.keys(previous.sourceHashes),...legacyWanted,...publicSources,...fragmentSources,'tools/mixed-voice-inventory.mts','tools/hanoi-pack-policy.mts','tools/fpt-arcade-inventory.mts','docs/fpt-v102-labels-20261026/inventory.json','js/voice-fragments.ts','js/viwords.ts','js/packhash.ts','js/i18n.js','js/games/snakes-core.ts','js/games/shared-board-session.ts','js/games/oanquan-core.ts','js/games/vietnam.ts','js/games/board-agreement.ts','js/games/tug-core.ts','js/games/tug-session.ts'].map(f=>f.endsWith('.js')&&fs.existsSync(f.replace(/\.js$/,'.ts'))?f.replace(/\.js$/,'.ts'):f));
const sourceHashes=Object.fromEntries([...sources].map(source=>[source,digest(fs.readFileSync(source))]));
const result={source:'Reviewed static arcade, horse and folk-game lines and fixed Vietnamese fragments inside English speech; previously reviewed titles and turtle numbers retained. Frozen baseline excluded; private user speech excluded.',baselineSha256:digest(baseline),sourceHashes,mixedFragments:fragments,lines:[...lines.values()].sort((a,b)=>a.id.localeCompare(b.id))};
fs.mkdirSync('docs/v1.02-orchard-arcade',{recursive:true});fs.writeFileSync('docs/v1.02-orchard-arcade/voice-delta.json',JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify({lines:lines.size,characters:[...lines.values()].reduce((n,l)=>n+l.text.length,0)}));
