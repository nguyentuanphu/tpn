import assert from 'node:assert/strict';
import fs from 'node:fs';
import { launch, open, clear } from './harness.mjs';
const arg=(key,fallback)=>process.argv.find(v=>v.startsWith(key+'='))?.slice(key.length+1)||fallback;
const speed=arg('--speed','x5'),langs=arg('--lang',process.argv.includes('--baseline')?'en':'en,vi').split(',');
assert.ok(['x1','x2','x3','x5'].includes(speed));
const browser=await launch(),rows=[],ids=arg('--ids',process.argv.includes('--baseline')?'robot':'robot,maze,duckmaze,sortout').split(',');
const live={releases:{autoplay:{on:true,devices:['planprobe001']}},festivals:{}};
try{
 for(const lang of langs){
  const P=await open(browser,{w:390,h:844,touch:true,lang,settings:{voice:false,autoPack:false},pre:`localStorage.setItem('sv2_playerid','planprobe001');localStorage.setItem('sv2_live',${JSON.stringify(JSON.stringify(live))});`,route:async ctx=>{await ctx.route('**/api/live**',r=>r.fulfill({json:live}));await ctx.route('**/api/tester**',r=>r.fulfill({json:{ok:true,rid:'synthetic-plan-receipt',mine:[],open:[]}}));}});await clear(P.page);
  await P.page.waitForFunction(()=>!!__sv.autoplay);
  await P.page.evaluate(({ids,speed})=>{const G=__sv,p=G.heroes[0].profile;p.age='big';p.difficulty='hard';p.gameDiff={...p.gameDiff,...Object.fromEntries(ids.map(id=>[id,'hard']))};G.gameSpot=()=>null;G.autoplay.start(ids.map(id=>'game:'+id),speed);},{ids,speed});
  await P.page.waitForFunction(n=>!__sv.autoplay.running()&&JSON.parse(localStorage.getItem('sv2_autoplay_report')||'{}').done?.length===n,ids.length,{timeout:360000});
  const report=await P.page.evaluate(()=>JSON.parse(localStorage.getItem('sv2_autoplay_report')));
  for(const id of ids){const row=report.done.find(r=>r.key==='game:'+id);rows.push({id,lang,speed,...row});}
  const cleaned=await P.page.evaluate(async()=>{const W=(await import('/js/games/frame.js')).playWatch;return {plan:!!W.plan,maxActions:W.maxActions};});assert.deepEqual(cleaned,{plan:false,maxActions:0},'Completed games must release their plan and action allowance');
  assert.deepEqual(P.errors,[]);await P.ctx.close();
 }
}finally{await browser.close();fs.mkdirSync('out/owner-autoplay-plans',{recursive:true});fs.writeFileSync(`out/owner-autoplay-plans/${speed}-${langs.join('-')}.json`,JSON.stringify(rows,null,2)+'\n');}
console.log(JSON.stringify(rows));
