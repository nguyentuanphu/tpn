import assert from 'node:assert/strict';
import { launch, open, clear } from './harness.mts';
const browser=await launch(),live={releases:{autoplay:{on:true,devices:['navprobe0001']}},festivals:{}};
try {
 const P=await open(browser,{w:390,h:844,touch:true,settings:{voice:false,autoPack:false},pre:`localStorage.setItem('sv2_playerid','navprobe0001');localStorage.setItem('sv2_live',${JSON.stringify(JSON.stringify(live))});`,route:async ctx=>{await ctx.route('**/api/live**',r=>r.fulfill({json:live}));await ctx.route('**/api/tester**',r=>r.fulfill({json:{ok:true,rid:'synthetic-nav-receipt',mine:[],open:[]}}));}});await clear(P.page);
 await P.page.waitForFunction(()=>!!__sv.autoplay);
 const walk=await P.page.evaluate(async()=>{
  const G=__sv,h=G.heroes[0],oldSpot=G.goodSpot,oldLand=G.landBy,target={x:h.pos.x+5,z:h.pos.z};
  try{G.goodSpot=()=>false;G.landBy=async()=>{};const result=await G.autoplay.walkTo(target.x,target.z,'watch');return {...result,distance:Math.hypot(h.pos.x-target.x,h.pos.z-target.z)};}finally{G.goodSpot=oldSpot;G.landBy=oldLand;}
 });
 await P.page.evaluate(()=>{
  const G=__sv,q=G.currentQuest(G.heroes[0].profile);window.__savedQuest=G.currentQuest;window.__savedTarget=G.questTarget;window.__savedObjective=G.sayObjective;
  G.currentQuest=()=>({...q,id:'controlled_unavailable_quest'});G.questTarget=()=>null;G.sayObjective=()=>{};G.autoplay.start(['quests'],'x5');
 });
 await P.page.waitForFunction(()=>!__sv.autoplay.running()&&JSON.parse(localStorage.getItem('sv2_autoplay_report')||'{}').done?.length===1,null,{timeout:60000});
 const report=await P.page.evaluate(()=>{const r=JSON.parse(localStorage.getItem('sv2_autoplay_report'));__sv.currentQuest=window.__savedQuest;__sv.questTarget=window.__savedTarget;__sv.sayObjective=window.__savedObjective;return r;});
 assert.ok(walk.distance>2&&walk.problems.length,'Failed landing/path must not silently count as arrival: '+JSON.stringify(walk));
 const row=report.done[0];assert.ok(row.ok===false&&row.problems.length,'A quest that never advances must be reported incomplete: '+JSON.stringify(row));
 assert.deepEqual(P.errors,[]);await P.ctx.close();console.log('Unavailable landing/path produces a navigation problem; a non-advancing quest is explicitly incomplete after bounded attempts');
}finally{await browser.close();}
