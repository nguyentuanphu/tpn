// Actual modules in the isolated compiled release export; synthetic empty profile, API blocked.
import fs from 'node:fs/promises';
import http from 'node:http';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createRequire} from 'node:module';
const {chromium}=createRequire(new URL('../../tests/package.json',import.meta.url))('playwright');
const here=path.dirname(fileURLToPath(import.meta.url)),root=path.resolve(here,'../..');
const base=new URL('./parents-final/',import.meta.url);await fs.mkdir(fileURLToPath(base),{recursive:true});
const TY={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json; charset=utf-8','.png':'image/png','.jpg':'image/jpeg','.woff2':'font/woff2','.mp3':'audio/mpeg'};
const srv=http.createServer(async(q,r)=>{
 const u=decodeURIComponent((q.url||'/').split('?')[0]);
 if(u==='/_parent-capture.html'){r.writeHead(200,{'Content-Type':TY['.html']});r.end('<!doctype html><meta charset="utf-8"><link rel="stylesheet" href="/css/fonts.css"><link rel="stylesheet" href="/css/style.css"><style>body{margin:0;background:url(/marketing/source/stills10/cine-hoian-en.jpg) center/cover no-repeat}</style><body></body>');return;}
 const f=path.join(root,u==='/'?'index.html':u.slice(1));
 try{const b=await fs.readFile(f);r.writeHead(200,{'Content-Type':TY[path.extname(f)]||'application/octet-stream'});r.end(b);}catch{r.writeHead(404);r.end();}
});
await new Promise(res=>srv.listen(0,'127.0.0.1',res));
const port=srv.address().port;
const browser=await chromium.launch(),rows=[];
try{
 for(const [device,w,h] of [['phone',390,844],['tablet',820,1180],['computer',1280,800]])for(const lang of ['en','vi']){
  const ctx=await browser.newContext({viewport:{width:w,height:h}}),p=await ctx.newPage();
  try{
   await p.route('**/api/**',r=>r.abort());await p.goto(`http://127.0.0.1:${port}/_parent-capture.html`);
   await p.evaluate(async lang=>{await import('/js/emojiswap.js');const S=await import('/js/state.js');Object.assign(S.settings,{lang,autoPack:false,voice:false,music:false,sound:false,online:false,countPlayers:false});const child=S.profiles[0]||S.addProfile();child.name=lang==='vi'?'Bé ví dụ':'Example child';child.stats={days:{},played:{}};S.profiles.splice(1);(await import('/js/popups.js')).dialogHooks.little=()=>true;(await import('/js/ui-settings.js')).openGrownups()},lang);
   await p.waitForFunction(()=>getComputedStyle(document.querySelector('.grownups')).opacity==='1');await p.evaluate(()=>document.fonts.ready);
   await p.evaluate(()=>{document.querySelectorAll('details[data-sec]').forEach(d=>d.open=d.dataset.sec==='players');const b=document.querySelector('.grownups-body'),s=document.querySelector('[data-sec=players]');if(b&&s)b.scrollTop=Math.max(0,s.offsetTop-b.offsetTop-8);});
   await p.screenshot({path:fileURLToPath(new URL(device+'-'+lang+'-settings.png',base))});
   if(device==='tablet'&&process.env.SV_REFRESH_WEBSITE_CAPTURES)await p.screenshot({path:fileURLToPath(new URL('../website-review-20261023/assets/parent-controls/settings-'+lang+'.png',new URL('../',base))),clip:await p.locator('.grownups .card').boundingBox()});
   await p.evaluate(()=>{document.querySelectorAll('details[data-sec]').forEach(d=>d.open=d.dataset.sec==='data');document.querySelectorAll('[data-sec=data] details').forEach(d=>d.open=true);const b=document.querySelector('.grownups-body'),s=document.querySelector('[data-sec=data]');if(b&&s)b.scrollTop=Math.max(0,s.offsetTop-b.offsetTop-8);});
   const check=await p.evaluate(()=>{const panel=document.querySelector('.grownups-panel'),head=panel.querySelector('h2').getBoundingClientRect(),body=document.querySelector('.grownups-body').getBoundingClientRect(),done=document.querySelector('#gDone').getBoundingClientRect(),fam=!!document.querySelector('#gFamCodeMake')&&!!document.querySelector('#gFamCodeIn');return {panelScroll:panel.scrollTop,headingTop:head.top,footerTop:done.top,bodyBottom:body.bottom,footerVisible:done.top>=0&&done.bottom<=innerHeight,familyCode:fam}});
   await p.screenshot({path:fileURLToPath(new URL(device+'-'+lang+'-backup.png',base))});
   await p.locator('.grownups .x').click();await p.waitForSelector('.grownups',{state:'detached'});
   await p.evaluate(async()=>{const S=await import('/js/state.js');(await import('/js/report.js')).openReport(S.profiles[0])});
   await p.waitForFunction(()=>getComputedStyle(document.querySelector('.modal.report')).opacity==='1');
   const repCheck=await p.evaluate(()=>{const h=document.querySelector('.modal.report .card > h2'),x=document.querySelector('.modal.report .x').getBoundingClientRect(),w=document.createTreeWalker(h,NodeFilter.SHOW_TEXT),rects=[];while(w.nextNode()){const r=document.createRange();r.selectNodeContents(w.currentNode);rects.push(...r.getClientRects());}const overlap=rects.some(rc=>rc.width>0&&rc.right>x.left+2&&rc.top<x.bottom&&rc.bottom>x.top);return !overlap;});
   check.reportTitleClear=repCheck;
   rows.push({device,lang,...check});
   if(check.panelScroll!==0||check.headingTop<0||!check.footerVisible||check.bodyBottom>check.footerTop||!check.familyCode||!check.reportTitleClear)throw Error(JSON.stringify(rows.at(-1)));
   await p.screenshot({path:fileURLToPath(new URL(device+'-'+lang+'-report.png',base))});
   if(device==='tablet'&&process.env.SV_REFRESH_WEBSITE_CAPTURES)await p.screenshot({path:fileURLToPath(new URL('../website-review-20261023/assets/parent-controls/report-'+lang+'.png',new URL('../',base))),clip:await p.locator('.modal.report .card').boundingBox()});
   console.log(device+'-'+lang+' stable parent header, family code, report title clearance and separate floating action: pass');
  }finally{await ctx.close()}
 }
}finally{await browser.close();srv.close();await fs.writeFile(fileURLToPath(new URL('checks.json',base)),JSON.stringify(rows,null,2)+'\n')}
