// Generates release facts and a fail-closed review gate, never publishes the game.
// (r89, Release) home/ is not a game source any more: it is this folder's design made real by tools/build-website.mts,
// checked by `node tools/build-website.mts --check` in the website workflow.
import fs from 'node:fs';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
const here=path.dirname(fileURLToPath(import.meta.url)),root=path.resolve(here,'../..');
const git=args=>execFileSync('git',args,{cwd:root,encoding:'utf8',maxBuffer:32*1024*1024}).trim();
const source=git(['rev-parse',process.env.SV_WEBSITE_SOURCE||'origin/main']);
const tree=git(['ls-tree','-r',source,'--','js','css','fonts','icons','content','sounds','voices','photos','videos','vendor','manifest.webmanifest','sw.ts','sw.js','index.html','studio/version.json']).split('\n').map(l=>{const [info,file]=l.split('\t');return{file,hash:info.split(' ')[2]}}).filter(x=>/^(js\/|css\/|home\/|fonts\/|icons\/|content\/|sounds\/|voices\/|photos\/|videos\/|vendor\/|manifest\.webmanifest$|sw\.|index\.html$|studio\/version\.json$)/.test(x.file));
const lockFile=path.join(here,'game-review-lock.json'),previous=fs.existsSync(lockFile)?JSON.parse(fs.readFileSync(lockFile)):null;
const old=new Map((previous?.files||[]).map(x=>[x.file,x.hash])),current=new Map(tree.map(x=>[x.file,x.hash]));
const changed=[...new Set([...old.keys(),...current.keys()])].filter(f=>old.get(f)!==current.get(f));
for(const script of ['refresh-quest-snapshot.mts','build-preview.mts'])execFileSync(process.execPath,[path.join(here,script)],{cwd:root,env:{...process.env,SV_WEBSITE_SOURCE:source},stdio:'inherit'});
// Factual snapshots all come from one commit. Editorial explanations retain a review gate.
for(const file of ['quest','reward','festival']){const s=JSON.parse(fs.readFileSync(path.join(here,file+'-snapshot.json')));if(s.source!==source)throw Error('Mixed source in '+file)}
const q=JSON.parse(fs.readFileSync(path.join(here,'quest-snapshot.json')));
const coverage={valley:q.quests.length,lantern:q.chapters.reduce((n,c)=>n+c.steps.length,0),daily:q.adventures.length,family:q.family.length,festivals:q.hunts.length};
const expected={valley:17,lantern:24,daily:56,family:15,festivals:24};
const coverageChanged=Object.keys(expected).filter(k=>expected[k]!==coverage[k]);
if(process.argv.includes('--record-reviewed')){
 if(coverageChanged.length)throw Error('Review all displayed catalogue counts first: '+coverageChanged.join(', '));
 fs.writeFileSync(lockFile,JSON.stringify({source,files:tree},null,2)+'\n');
 console.log('Recorded game sources reviewed with the bilingual website; commit the lock with the explanation changes.');
}else{
 const report={source,reviewedSource:previous?.source||null,coverage,changed,coverageChanged,requiresEditorialReview:!previous||changed.length>0||coverageChanged.length>0};
 fs.writeFileSync(path.join(here,'website-drift.json'),JSON.stringify(report,null,2)+'\n');
 execFileSync(process.execPath,[path.join(here,'export-hosted-preview.mts'),process.env.SV_WEBSITE_OUTPUT||'/tmp/sparkle-website-preview'],{cwd:root,stdio:'inherit'});
 console.log(JSON.stringify(report,null,2));
 if(report.requiresEditorialReview)process.exitCode=1;
}
