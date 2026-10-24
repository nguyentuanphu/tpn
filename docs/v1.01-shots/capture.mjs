// Real v1.01 UI with synthetic profiles/reports only. Run after other browser checks finish.
import fs from 'node:fs/promises';
import http from 'node:http';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {launch,open,clear} from '../../tests/harness.mjs';
const root=new URL('./',import.meta.url),repoRoot=path.resolve(fileURLToPath(root),'../..');
const TY={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json; charset=utf-8','.png':'image/png','.jpg':'image/jpeg','.woff2':'font/woff2','.mp3':'audio/mpeg','.webmanifest':'application/manifest+json'};
let srv=null,url=process.env.SV_URL||'http://localhost:8765/';
try{await fetch(url);}catch{
 srv=http.createServer(async(q,r)=>{
  const u=decodeURIComponent((q.url||'/').split('?')[0]);
  const f=path.join(repoRoot,u==='/'?'index.html':u.slice(1));
  try{const b=await fs.readFile(f);r.writeHead(200,{'Content-Type':TY[path.extname(f)]||'application/octet-stream'});r.end(b);}catch{r.writeHead(404);r.end();}
 });
 await new Promise(res=>srv.listen(8765,'127.0.0.1',res));
}
const browser=await launch(),checks=[];
const live={releases:{tester:{on:true,devices:['release00001']}},festivals:{}};
const mine=[{k:'aaaaaaaaaaaaaaaa',title:'Example: bridge picture',status:'fixed',fixedIn:'r89.1',kind:'looks'},{k:'bbbbbbbbbbbbbbbb',title:'Example: sound button',status:'fixed',fixedIn:'v1.01',kind:'sound'}];
const shots=async(page,name)=>{await page.evaluate(()=>document.fonts.ready);await page.waitForTimeout(300);await page.screenshot({path:fileURLToPath(new URL(name+'.png',root))});};
try{
 for(const [device,w,h,touch] of [['phone',390,844,true],['tablet',820,1180,true],['computer',1280,800,false]])for(const lang of ['en','vi']){
  const name=device+'-'+lang;if(process.env.SV_SHOTS_ONLY&&process.env.SV_SHOTS_ONLY!==name)continue;
  const P=await open(browser,{w,h,touch,lang,url,settings:{voice:false,autoPack:false,online:false},pre:`localStorage.setItem('sv2_playerid','release00001');localStorage.setItem('sv2_tester',JSON.stringify({at:1,b:'v1.01'}));localStorage.setItem('sv2_live',${JSON.stringify(JSON.stringify(live))});`,route:async ctx=>{
   await ctx.route('**/api/live**',r=>r.fulfill({json:live}));
   await ctx.route('**/api/tester**',r=>r.fulfill({json:{ok:true,mine,open:[],retest:[],helped:0,reports:2}}));
  }});
  try{
   await clear(P.page);
   await P.page.evaluate(async lang=>{const S=await import('/js/state.js');S.profiles[0].name=lang==='vi'?'Bé ví dụ':'Example child';S.profiles[0].age='little';__sv.heroes[0].profile=S.profiles[0];__sv.huds[0].refreshWho();},lang);
   await P.page.evaluate(()=>__sv.openQuick(0));await P.page.waitForSelector('.qsettings #qDone');
   await shots(P.page,name+'-settings');
   await P.page.evaluate(()=>{const m=document.querySelector('.modal.qsettings');m.scrollTop=m.scrollHeight});
   await shots(P.page,name+'-settings-scrolled');
   const quick=await P.page.evaluate(()=>{const m=document.querySelector('.qsettings'),x=m.querySelector('.x').getBoundingClientRect(),head=m.querySelector('.qs-head').getBoundingClientRect(),vs=[...m.querySelectorAll('.seg.vstyle button')].map(b=>b.getBoundingClientRect());return {scroll:m.scrollTop,xTop:x.top,xBottom:x.bottom,headBottom:head.bottom,closeVisible:x.top>=0&&x.bottom<=innerHeight,vstyleRow:vs.length===3&&Math.max(...vs.map(r=>r.top))-Math.min(...vs.map(r=>r.top))<6}});
   checks.push({name,quick});
   await clear(P.page);await P.page.evaluate(async()=>(await import('/js/ui.js')).openGrownups());await P.page.waitForSelector('.grownups #gDone');
   await P.page.evaluate(()=>{document.querySelectorAll('.grownups details[data-sec]').forEach(d=>d.open=d.dataset.sec==='players');const b=document.querySelector('.grownups-body'),s=document.querySelector('[data-sec=players]');if(b&&s)b.scrollTop=Math.max(0,s.offsetTop-b.offsetTop-8);});
   await shots(P.page,name+'-grownups');if(device==='tablet'&&process.env.SV_REFRESH_WEBSITE_CAPTURES)await P.page.screenshot({path:fileURLToPath(new URL('../website-review-20261023/assets/parent-controls/settings-'+lang+'.png',root)),clip:await P.page.locator('.grownups .card').boundingBox()});
   await P.page.evaluate(()=>{document.querySelectorAll('.grownups details[data-sec]').forEach(d=>d.open=d.dataset.sec==='sound');document.querySelectorAll('.grownups [data-sec=sound] details').forEach(d=>d.open=true);const b=document.querySelector('.grownups-body'),s=document.querySelector('[data-sec=sound]');if(b&&s)b.scrollTop=Math.max(0,s.offsetTop-b.offsetTop-8);});
   await shots(P.page,name+'-voices');
   await P.page.evaluate(()=>{document.querySelectorAll('.grownups details[data-sec]').forEach(d=>d.open=d.dataset.sec==='data');document.querySelectorAll('.grownups [data-sec=data] details').forEach(d=>d.open=true);const b=document.querySelector('.grownups-body'),s=document.querySelector('[data-sec=data]');if(b&&s)b.scrollTop=Math.max(0,s.offsetTop-b.offsetTop-8);});
   await shots(P.page,name+'-backup');
   const backup=await P.page.evaluate(()=>({save:!!document.querySelector('#gSaveCopy'),load:!!document.querySelector('#gLoadCopy'),familyCode:!!document.querySelector('#gFamCodeMake'),old:!!document.querySelector('#gBackup'),done:(()=>{const r=document.querySelector('#gDone').getBoundingClientRect();return r.top>=0&&r.bottom<=innerHeight})()}));checks.at(-1).backup=backup;
   await clear(P.page);await P.page.waitForFunction(()=>!!__sv.testerRewards);
   await P.page.evaluate(async()=>{await (await import('/js/tester.js')).openPanel(0,'fixed')});await P.page.waitForSelector('.testing-fixed:not([hidden])');
   await shots(P.page,name+'-fixed-reports');
   const targets=await P.page.evaluate(()=>[...document.querySelectorAll('.testing-fixed button')].map(b=>{const r=b.getBoundingClientRect();return {text:b.textContent.trim(),width:r.width,height:r.height}}));checks.at(-1).targets=targets;
   await clear(P.page);await P.page.evaluate(()=>__sv.simple.show());await P.page.waitForSelector('.simple-screen:not([hidden]) .sp-home');
   await shots(P.page,name+'-simple');
   const simple=await P.page.evaluate(()=>({homeTop:!!document.querySelector('.sp-tools .sp-home'),width:document.querySelector('.sp-home').getBoundingClientRect().width,height:document.querySelector('.sp-home').getBoundingClientRect().height,overflow:document.querySelector('.simple-screen').scrollWidth>innerWidth}));checks.at(-1).simple=simple;
   checks.at(-1).errors=P.errors;console.log(name,JSON.stringify(checks.at(-1)));
  }finally{await P.ctx.close()}
 }
}finally{await browser.close();if(srv)srv.close();await fs.writeFile(fileURLToPath(new URL('checks.json',root)),JSON.stringify(checks,null,2)+'\n')}
if(checks.some(c=>!c.quick.closeVisible||!c.quick.vstyleRow||!c.backup.done||!c.backup.save||!c.backup.load||!c.backup.familyCode||c.backup.old||!c.simple.homeTop||c.simple.width<64||c.simple.height<64||c.simple.overflow||c.targets.some(t=>t.width<64||t.height<64)||c.errors.length))throw Error('Screenshot geometry/error review required; see checks.json');
