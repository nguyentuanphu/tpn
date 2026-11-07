import assert from 'node:assert/strict';import fs from 'node:fs/promises';import type {Browser} from 'playwright';
import {open,clear,noWelcome} from './harness.mts';
// (v1.08b quality, owner's pop-ups 3-4 Nov 2026 AEDT, docs/plans/links-rollout-install.md part 5) the grown-ups' learning
// report by subject, the level by subject, Lumi as the guide, Play with Mum and Dad and the gentle play time.
const SET={voice:false,sound:false,autoPack:false,online:false,countPlayers:false};
const SIZES=[{name:'phone',w:390,h:844},{name:'tablet',w:820,h:1180},{name:'computer',w:1440,h:900}];

// the level follows the child per subject, and a grown-up's subject level wins (js/content/subjects.ts)
export async function subjectLevelCheck(browser:Browser){
 const P=await open(browser,{w:1024,h:768,lang:'en',settings:SET});
 try{await clear(P.page);await noWelcome(P.page);
  const r=await P.page.evaluate(async()=>{const S=await import(String('/js/content/subjects.js'));const p=window.__sv.heroes[0].profile;
   p.age='big';p.difficulty='medium';p.subjectDiff={};p.gameDiff={};
   // strong in Maths: 3 maths games won 4 times each at level 4; new to English
   p.wins={counting:4,sums:4,numline:4};p.levels={counting:4,sums:4,numline:4};
   const auto={math:S.subjectDifficulty(p,'counting'),en:S.subjectDifficulty(p,'phonics'),play:S.subjectDifficulty(p,'kite'),subjects:['counting','phonics','sci_float','shoppay','words'].map(S.subjectOf)};
   p.subjectDiff={math:'easy'};const set=S.subjectDifficulty(p,'counting');p.subjectDiff={};
   // the game itself starts at that level: the level button of a maths game says Hard
   void window.__sv.playGame(0,'sums','hub');await new Promise(r=>setTimeout(r,1500));
   const lvl=document.querySelector('.gl-lvl')?.textContent||'';(document.querySelector('.gl-x') as HTMLElement|null)?.click();
   return {...auto,set,lvl};});
  assert.equal(r.math,'hard','strong in Maths: one step up from Medium');assert.equal(r.en,'easy','new to English: one step down');
  assert.equal(r.play,'medium','a game with no subject keeps the child level');assert.equal(r.set,'easy','the grown-up subject level wins');
  assert.deepEqual(r.subjects,['math','en','sci','money','vi']);assert.match(r.lvl,/Hard/);assert.deepEqual(P.errors,[]);
  return `subjects ${r.subjects.join(', ')}; Medium child strong in Maths plays Maths at Hard (the game opens at ${r.lvl.trim()}), new to English plays Easy; a grown-up's subject level wins`;
 }finally{await P.ctx.close();}
}

// the learning report by subject in Grown-ups, on a phone, a tablet and a computer: five subjects, what went well, a
// game for next week, the level by subject saved, and the picture to share
export async function learningReportCheck(browser:Browser){
 const out:string[]=[];await fs.mkdir('out/learningreport',{recursive:true});let last:any=null;
 for(const s of SIZES){
  const P=await open(browser,{w:s.w,h:s.h,touch:s.name!=='computer',lang:'vi',settings:SET});
  try{await clear(P.page);await noWelcome(P.page);
   const r=await P.page.evaluate(async()=>{const R=await import(String('/js/report.js'));const p=window.__sv.heroes[0].profile;
    // made-up play: three days of this week (the report's own day keys)
    const key=(k:number)=>{const t=new Date();t.setDate(t.getDate()-k);return R.dayKey(t);};
    p.stats={games:9,days:{[key(0)]:{min:20,games:5,by:{counting:3,phonics:2},won:{counting:2}},[key(2)]:{min:10,games:4,by:{sci_float:2,shoppay:2},won:{shoppay:1}}},played:{counting:3,phonics:2,sci_float:2,shoppay:2}};
    const m=R.openReport(p);await new Promise(r=>setTimeout(r,300));
    const rows=[...m.querySelectorAll('.lr-row')].map(e=>(e as HTMLElement).innerText.replace(/\s+/g,' ').trim());
    const sel=m.querySelector('select[data-subj="math"]') as HTMLSelectElement;sel.value='hard';sel.dispatchEvent(new Event('change'));
    const pic=R.learningPicture(p);
    const card=m.querySelector('.card')||m;const W=innerWidth;
    const small=[...m.querySelectorAll('.lr-row *')].filter(e=>!e.closest('svg')&&e.childNodes.length&&[...e.childNodes].some(n=>n.nodeType===3&&(n.textContent||'').trim())&&parseFloat(getComputedStyle(e).fontSize)<15.5).map(e=>e.tagName+'.'+e.className+'='+getComputedStyle(e).fontSize).slice(0,4);
    const tapSmall=[...m.querySelectorAll('.lr-row select, [data-lrshare]')].filter(e=>{const b=e.getBoundingClientRect();return b.height<43.5;}).length;
    const wide=m.scrollWidth>W+1||(card as HTMLElement).getBoundingClientRect().right>W+1;
    return {rows,next:m.querySelector('.lr-next')?.textContent?.trim()||'',saved:p.subjectDiff?.math,pic:[pic.width,pic.height],share:!!m.querySelector('[data-lrshare]'),small,tapSmall,wide};});
   await P.page.screenshot({path:`out/learningreport/${s.name}.png`});
   if(r.rows.length!==5)out.push(`${s.name}: ${r.rows.length} subjects`);
   if(!/Toán.*3 lượt.*thắng/.test(r.rows[2]||''))out.push(`${s.name}: maths row "${r.rows[2]}"`);
   if(!/Tiền.*2 lượt/.test(r.rows[4]||''))out.push(`${s.name}: money row "${r.rows[4]}"`);
   if(!r.next)out.push(`${s.name}: no game for next week`);if(r.saved!=='hard')out.push(`${s.name}: level by subject not saved`);
   if(!r.share||r.pic[0]!==1080)out.push(`${s.name}: no picture to share`);if(r.small.length)out.push(`${s.name}: texts under 16 px: ${r.small.join(' ')}`);
   if(r.tapSmall)out.push(`${s.name}: ${r.tapSmall} controls under 44 px`);if(r.wide)out.push(`${s.name}: wider than the screen`);
   if(P.errors.length)out.push(`${s.name}: ${P.errors.join(' | ')}`);last=r;
  }finally{await P.ctx.close();}
 }
 assert.deepEqual(out,[]);
 return `phone, tablet, computer: 5 subjects (${last.rows.map((x:string)=>x.split(' ')[0]).join(', ')}), what went well, "${last.next}", the level by subject saved, a 1080x1350 picture to share`;
}

// Lumi welcomes a new child on the Simple screen, then carries the week's news once a week; her lines are recorded
export async function lumiGuideCheck(browser:Browser){
 const P=await open(browser,{w:390,h:844,touch:true,lang:'vi',settings:SET});
 try{await clear(P.page);
  const r=await P.page.evaluate(async()=>{const G=window.__sv,p=G.heroes[0].profile;delete p.lumi;const w=(ms:number)=>new Promise(r=>setTimeout(r,ms));
   const card=()=>document.querySelector('.lumi-card')?.textContent||'';
   G.simple.hide();G.simple.show();await w(400);const first=card();const face=!!document.querySelector('.lumi-card .art, .lumi-card svg');
   document.querySelector('.lumi-card')?.remove();G.simple.hide();p.lumi.news='';G.simple.show();await w(400);const news=card();
   document.querySelector('.lumi-card')?.remove();G.simple.hide();G.simple.show();await w(400);const again=card();
   const guide=document.querySelector('.sp-owl')?.getAttribute('aria-label');
   const blocks=getComputedStyle(document.querySelector('.lumi-card')||document.body).pointerEvents;
   const L=await import(String('/js/content/lumi.js'));
   return {first,face,news,again,guide,blocks,lines:[...L.LUMI_WELCOME,...L.LUMI_NEWS,L.LUMI_SOON,L.LUMI_BYE]};});
  assert.match(r.first,/Lumi.*Xin chào! Tớ là Lumi/);assert.ok(r.face,'Lumi has her own drawing');
  assert.match(r.news,/Tin tuần này/);assert.equal(r.again,'','the news once a week');assert.equal(r.guide,'Lumi');
  // her lines are in the offline voice pack (women's voices: tools/make-voice-pack.mts)
  const H=await import('../js/packhash.js'),man=async(l:string)=>JSON.parse(await fs.readFile(`../voices/manifest-${l}.json`,'utf8')).lines as Record<string,string>;
  const en=await man('en'),vi=await man('vi');
  const missing=r.lines.filter(([e,v]:[string,string])=>!en[H.lineHash('en',e)]||!vi[H.lineHash('vi',v)]);
  assert.deepEqual(P.errors,[]);
  return `Lumi welcomes a new child, then the week's news once a week, as the Simple screen's guide; ${r.lines.length-missing.length}/${r.lines.length} of her lines recorded${missing.length?` (not yet: ${missing.length})`:''}`;
 }finally{await P.ctx.close();}
}

// Play with Mum and Dad in Grown-ups: the list, the guide for the grown-up, and Play opens the game
export async function playTogetherCheck(browser:Browser){
 const out:string[]=[];let n=0;await fs.mkdir('out/playtogether',{recursive:true});
 for(const s of SIZES){
  const P=await open(browser,{w:s.w,h:s.h,touch:s.name!=='computer',lang:'vi',settings:SET});
  try{await clear(P.page);await noWelcome(P.page);
   await P.page.evaluate(()=>import(String('/js/ui.js')).then(m=>m.openGrownups()));
   await P.page.waitForSelector('.gsec.together',{timeout:8000});
   const r=await P.page.evaluate(async()=>{const d=document.querySelector('.gsec.together') as HTMLDetailsElement;d.open=true;d.scrollIntoView();await new Promise(r=>setTimeout(r,200));
    const rows=[...d.querySelectorAll('.pt-row')],guide=d.querySelectorAll('.pt-guide li').length;
    const small=rows.filter(e=>(e.querySelector('[data-together]') as HTMLElement).getBoundingClientRect().height<43.5).length;
    const tiny=[...d.querySelectorAll('.pt-row b, .pt-row small, .pt-guide li')].filter(e=>parseFloat(getComputedStyle(e).fontSize)<15.5).length;
    return {rows:rows.length,guide,small,tiny,title:d.querySelector('summary')?.textContent?.trim(),first:(rows[0]?.querySelector('[data-together]') as HTMLElement)?.dataset.together};});
   await P.page.screenshot({path:`out/playtogether/${s.name}.png`});
   if(r.rows<5)out.push(`${s.name}: ${r.rows} games`);if(r.guide<3)out.push(`${s.name}: no guide`);if(r.small)out.push(`${s.name}: Play under 44 px`);if(r.tiny)out.push(`${s.name}: text under 16 px`);
   if(!/Chơi cùng bố mẹ/.test(r.title||''))out.push(`${s.name}: title ${r.title}`);
   if(s.name==='phone'){await P.page.click(`[data-together="${r.first}"]`);const ok=await P.page.locator(`.gl[data-game-id="${r.first}"]`).waitFor({timeout:10000}).then(()=>true,()=>false);if(!ok)out.push(`Play did not open ${r.first}`);}
   if(P.errors.length)out.push(`${s.name}: ${P.errors.join(' | ')}`);n=r.rows;
  }finally{await P.ctx.close();}
 }
 assert.deepEqual(out,[]);
 return `phone, tablet, computer: "Chơi cùng bố mẹ" lists ${n} games for two on one device with a guide for the grown-up; Play opens the game`;
}

// the gentle play time: Lumi's word two minutes before, and her soft goodbye only once the game in hand is over
export async function playTimeCheck(browser:Browser){
 const P=await open(browser,{w:844,h:390,touch:true,lang:'vi',settings:{...SET,restMins:'30'}});
 try{await clear(P.page);await noWelcome(P.page);
  const r=await P.page.evaluate(async()=>{const G=window.__sv,S=await import(String('/js/state.js')),w=(ms:number)=>new Promise(r=>setTimeout(r,ms));
   const L=await import(String('/js/content/lumi.js'));
   const phases=[L.playTimePhase(10,30),L.playTimePhase(28.5,30),L.playTimePhase(30,30),L.playTimePhase(50,0)];
   S.settings.playDay=new Date().toDateString();S.settings.playMins=28.2;
   await w(5600);const soon=document.querySelector('.lumi-card')?.textContent||'';document.querySelector('.lumi-card')?.remove();
   void G.playGame(0,'counting','hub');await w(1200);
   S.settings.playMins=30.5;await w(5600);
   const midGame={rest:!!document.querySelector('.resttime'),game:!!document.querySelector('.gl')};
   (document.querySelector('.gl-x') as HTMLElement).click();await w(6200);
   const rest=document.querySelector('.resttime');
   return {phases,soon,midGame,bye:rest?.textContent?.replace(/\s+/g,' ')||'',lumi:!!rest?.querySelector('.rt-moon svg')};});
  assert.deepEqual(r.phases,['play','soon','bye','play']);
  assert.match(r.soon,/Còn hai phút nữa/,'Lumi says two minutes before');
  assert.deepEqual(r.midGame,{rest:false,game:true},'never a hard cut mid-game');
  assert.match(r.bye,/Hẹn mai chơi tiếp nhé!/,'her soft goodbye after the game');assert.ok(r.lumi,'with Lumi');
  await P.page.screenshot({path:'out/playtime.png'});assert.deepEqual(P.errors,[]);
  return 'a grown-up set 30 minutes: at 28 Lumi says two minutes are left; time up during a game waits for it to end, then her goodbye "Hẹn mai chơi tiếp nhé!"';
 }finally{await P.ctx.close();}
}
