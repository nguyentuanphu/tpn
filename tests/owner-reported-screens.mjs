// Match individual historical offscreen reports to real current controls at their reported viewport.
// A missing/state-dependent control remains unresolved; this never closes a report.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { launch, open, clear, URL as baseURL } from './harness.mjs';
const group=process.argv[2]||'desktop';
const sourceCommit=process.env.SV_EVIDENCE_COMMIT||execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),sourceFingerprints={};
const servedFiles=execFileSync('git',['ls-tree','-r','--name-only',sourceCommit,'--','js','css','vendor','fonts','icons','index.html','sw.js','voices/manifest.json','voices/areas.json'],{cwd:'..',encoding:'utf8'}).trim().split('\n').filter(Boolean);
assert.ok(servedFiles.length,'No served source files found for attribution');
for(const file of servedFiles){
 const expected=execFileSync('git',['show',sourceCommit+':'+file],{maxBuffer:8*1024*1024}),response=await fetch(new URL(file,baseURL));assert.ok(response.ok,file+' unavailable');let actual=Buffer.from(await response.arrayBuffer());
 if(!actual.equals(expected)&&!file.endsWith('.mp3')&&!file.endsWith('.png')&&!file.endsWith('.jpg')&&!file.endsWith('.woff2')&&!file.endsWith('.ttf')){
  let normExpected=expected.toString('utf8').replace(/\r\n/g,'\n');
  let normActual=actual.toString('utf8').replace(/\r\n/g,'\n').replace(/<script[^>]*\/\/local\.adguard\.org[^>]*><\/script>/gi,'');
  if(Buffer.from(normExpected).equals(Buffer.from(normActual)))actual=expected;
 }
 assert.ok(actual.equals(expected),'Served source differs: '+file);sourceFingerprints[file]=createHash('sha256').update(actual).digest('hex');
}
const intake=JSON.parse(fs.readFileSync('../docs/owner-repair-20261014/issue-intake.json','utf8'));
const cases=intake.bugs.filter(x=>x.category==='offscreen'&&x.report_context?.viewport).filter(x=>group==='desktop'?x.report_context.os!=='iOS':x.report_context.os==='iOS'&&x.report_context.language===(group==='phone-vi'?'vi':'en'));
const groups=new Map(),results=[],failures=[];fs.mkdirSync('out/reported-screens',{recursive:true});
const save=()=>fs.writeFileSync('out/reported-screens/'+group+'-results.json',JSON.stringify({sourceCommit,sourceFingerprints,group,scope:'Chromium emulation at reported viewports; synthetic tester services; matched controls only, unresolved states explicit; no issue closed',results,failures},null,2)+'\n');
for(const row of cases){const c=row.report_context,key=c.viewport+'|'+c.language;if(!groups.has(key))groups.set(key,[]);groups.get(key).push(row);}
const browser=await launch(),live={releases:{tester:{on:true,devices:['repairscr001']},autoplay:{on:true,devices:['repairscr001']}},festivals:{}};
try {
 for(const [key,rows] of groups){
  const [viewport,lang]=key.split('|'),[w,h]=viewport.split('x').map(Number),touch=rows.some(x=>x.report_context.os==='iOS');
  const P=await open(browser,{w,h,touch,lang,settings:{voice:false,music:false,sound:false,autoPack:false},pre:`localStorage.setItem('sv2_playerid','repairscr001');localStorage.setItem('sv2_tester',JSON.stringify({at:1,b:'r76'}));localStorage.setItem('sv2_live',${JSON.stringify(JSON.stringify(live))});`,route:async ctx=>{
   await ctx.route('**/api/live**',r=>r.fulfill({json:live}));await ctx.route('**/api/tester**',r=>r.fulfill({json:{ok:true,rid:'synthetic-screen-receipt',mine:[],open:[]}}));
  }});await clear(P.page);
  for(const panel of [...new Set(rows.map(x=>x.report_context.window_class))]){
   const wanted=rows.filter(x=>x.report_context.window_class===panel),found=new Set();
   if(panel==='world/unknown'){results.push(...wanted.map(x=>({issue:x.issue,viewport,lang,status:'unresolved-no-panel-context'})));continue;}
   await P.page.evaluate(async panel=>{const G=__sv;G.paused=false;if(panel==='modal grownups')(await import('/js/ui.js')).openGrownups();else if(panel==='modal qsettings')G.openQuick(0);else if(panel==='modal hub')G.openGamesHub(0);else if(panel==='modal pad')G.openPad(0,'bag');else if(panel==='modal tpanel'){for(let n=0;n<80&&!G.tester;n++)await new Promise(r=>setTimeout(r,100));await G.tester?.openPanel(0);}},panel);
   const selector='.'+panel.split(' ').join('.');await P.page.waitForSelector(selector);await P.page.waitForTimeout(550);
   // Expand real disclosures so their controls can be reached; no action button is synthetically activated.
   await P.page.locator(selector+' details:not([open])').evaluateAll(nodes=>nodes.forEach(n=>n.open=true));
   const variants=[null];
   if(panel==='modal hub')variants.push(...await P.page.locator(selector+' .hubtabs button[data-tab]').evaluateAll(nodes=>nodes.map(n=>({attr:'data-tab',value:n.dataset.tab}))));
   if(panel==='modal pad')variants.push(...await P.page.locator(selector+' .pad-tabs button[data-t]').evaluateAll(nodes=>nodes.map(n=>({attr:'data-t',value:n.dataset.t}))));
   for(const variant of variants){
    if(variant){const tab=P.page.locator(selector+' button['+variant.attr+'="'+variant.value+'"]');if(await tab.count())await tab.first().click();await P.page.waitForTimeout(100);}
    for(const row of wanted){if(found.has(row.issue))continue;const label=row.title.replace(/^\[tester\]\s*offscreen:\s*/,'');
     const matches=await P.page.locator(selector+' button, '+selector+' [role=button], '+selector+' a').evaluateAll((nodes,label)=>{const norm=s=>String(s).replace(/\s+/g,' ').trim();return nodes.map((n,i)=>({n,i})).filter(({n})=>norm((n.getAttribute('aria-label')||n.textContent||n.className).trim().slice(0,40))===norm(label)&&n.getClientRects().length&&getComputedStyle(n).visibility!=='hidden'&&!n.disabled).map(({i})=>i);},label);
     if(!matches.length)continue;found.add(row.issue);
     const control=P.page.locator(selector+' button, '+selector+' [role=button], '+selector+' a').nth(matches[0]);await control.evaluate(n=>n.scrollIntoView({block:'center',inline:'center',behavior:'instant'}));await P.page.waitForTimeout(100);
     const r=await control.evaluate(n=>{const r=n.getBoundingClientRect(),top=document.elementFromPoint(r.x+r.width/2,r.y+r.height/2);return {x:r.x,y:r.y,w:r.width,h:r.height,hit:top===n||n.contains(top),inViewport:r.x>=0&&r.y>=0&&r.right<=innerWidth+1&&r.bottom<=innerHeight+1,className:n.className,label:n.textContent?.trim(),occluder:top?{tag:top.tagName,className:top.className,text:top.textContent?.trim().slice(0,120),html:top.outerHTML.slice(0,350)}:null,reportButtons:[...document.querySelectorAll('.tester-floating')].map(b=>{const q=b.getBoundingClientRect();return{x:q.x,y:q.y,w:q.width,h:q.height};})};});
     const passed=r.hit&&r.inViewport;results.push({issue:row.issue,viewport,lang,panel,status:passed?'matched-current-control-reachable':'matched-current-control-blocked',...r});if(!passed)failures.push(row.issue);save();
     if(!passed)await P.page.screenshot({path:'out/reported-screens/blocked-'+row.issue+'.png'});
    }
   }
   results.push(...wanted.filter(x=>!found.has(x.issue)).map(x=>({issue:x.issue,viewport,lang,panel,status:'unresolved-control-or-state-not-matched'})));
   await P.page.screenshot({path:'out/reported-screens/'+viewport+'-'+lang+'-'+panel.replace(/ /g,'-')+'.png'});save();console.log(group+' '+viewport+' '+lang+' '+panel+': '+found.size+'/'+wanted.length+' controls matched');
   await clear(P.page);
  }
  assert.deepEqual(P.errors,[]);await P.ctx.close();
 }
}finally{await browser.close();save();}
assert.ok(!failures.length,'Real matched reported controls remain blocked: '+failures.join(','));assert.ok(results.some(x=>x.status==='matched-current-control-reachable'),'Must match actual reported controls');
console.log(JSON.stringify({reports:results.length,reachable:results.filter(x=>x.status==='matched-current-control-reachable').length,unresolved:results.filter(x=>x.status.startsWith('unresolved')).length,blocked:failures.length}));
