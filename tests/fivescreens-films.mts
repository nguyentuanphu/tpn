import assert from 'node:assert/strict';import fs from 'node:fs/promises';import type {Browser} from 'playwright';
import {open,clear,noWelcome} from './harness.mts';
import {PHONES,WIDE} from './fivescreens-browser.mts';
// (v1.08b quality, docs/plans/five-screens-check.md) every guide film (How to play), every tale and every story page at
// the five screens: the top row, the picture, the words and the buttons are inside the screen, nothing scrolls, nothing
// overlaps, the words are at least 16 px and every button at least 44 px. A failure saves a picture in out/fivescreens/.
// SV_FIT_SIZES picks sizes; SV_FILM_SAMPLE=n checks every third tale and guide (n = 0, 1, 2), as the films check does.
const SIZES=[...PHONES,...WIDE].filter(s=>!s.age);
type Row={where:string,why:string[]};
// what a reader sees: the parts given (in the order they stand), measured as drawn
const MEASURE=([root,parts]:[string,string[]])=>{
 const m=document.querySelector(root) as HTMLElement|null;if(!m)return {why:['not open']};
 const W=innerWidth,H=innerHeight,why:string[]=[];
 const seen=(e:Element)=>{const s=getComputedStyle(e),b=e.getBoundingClientRect();return s.display!=='none'&&s.visibility!=='hidden'&&+s.opacity>0&&b.width>2&&b.height>2;};
 const boxes=parts.map(p=>[p,m.querySelector(p)] as const).filter(([,e])=>e&&seen(e)).map(([p,e])=>({p,b:e!.getBoundingClientRect()}));
 for(const {p,b} of boxes)if(b.top< -1||b.left< -1||b.bottom>H+1||b.right>W+1)why.push(`${p} outside (${Math.round(b.left)},${Math.round(b.top)})-(${Math.round(b.right)},${Math.round(b.bottom)})`);
 for(let i=0;i<boxes.length;i++)for(let j=i+1;j<boxes.length;j++){const A=boxes[i].b,B=boxes[j].b,ix=Math.min(A.right,B.right)-Math.max(A.left,B.left),iy=Math.min(A.bottom,B.bottom)-Math.max(A.top,B.top);if(ix>4&&iy>4)why.push(`${boxes[i].p} over ${boxes[j].p}`);}
 if(m.scrollHeight>m.clientHeight+2)why.push(`scrolls ${m.scrollHeight-m.clientHeight}px`);
 const taps=[...m.querySelectorAll('button')].filter(seen).filter(b=>{const r=b.getBoundingClientRect();return Math.min(r.width,r.height)<43.5;}).map(b=>`${b.className||b.textContent?.trim().slice(0,6)}=${Math.round(b.getBoundingClientRect().width)}x${Math.round(b.getBoundingClientRect().height)}`);
 if(taps.length)why.push(`buttons under 44 px: ${[...new Set(taps)].slice(0,4).join(' ')}`);
 const small:string[]=[];const tw=document.createTreeWalker(m,NodeFilter.SHOW_TEXT);let t:Node|null;
 while((t=tw.nextNode())){const p=t.parentElement;if(!p||!/[\p{L}\p{N}]/u.test(t.textContent||'')||p.closest('svg, .th-dots, .ht-dots')||!seen(p))continue;const px=parseFloat(getComputedStyle(p).fontSize);if(px<15.5)small.push(`${(t.textContent||'').trim().slice(0,12)}=${Math.round(px)}`);}
 if(small.length)why.push(`text under 16 px: ${[...new Set(small)].slice(0,4).join(' ')}`);
 return {why};
};
const THEATRE:[string,string[]]=['.theatre',['.th-top','.th-stage','.th-text','.th-bar']];
const HOWTO:[string,string[]]=['.howto',['.ht-top','.ht-screen','.ht-cap','.ht-ctl','.ht-x']];
export async function fiveScreensFilmsCheck(browser:Browser,opt:{sample?:number|null}={}){
 const pick=(process.env.SV_FIT_SIZES||'').split(',').filter(Boolean),sizes=SIZES.filter(s=>!pick.length||pick.includes(s.name));
 const sample=process.env.SV_FILM_SAMPLE!=null&&process.env.SV_FILM_SAMPLE!==''?+process.env.SV_FILM_SAMPLE:opt.sample??null;
 await fs.mkdir('out/fivescreens',{recursive:true});
 const bad:string[]=[];let tales=0,pages=0,guides=0;
 const oneSize=async(size:typeof SIZES[number])=>{
  const P=await open(browser,{w:size.w,h:size.h,touch:size.touch,lang:'vi',settings:{voice:false,sound:false,autoPack:false,online:false,countPlayers:false}});
  try{await clear(P.page);await noWelcome(P.page);
   // every tale (picture stage or 3D film) and the story's own tales, every page
   const ids:string[]=await P.page.evaluate(()=>(window.__sv as any).TALES.map((t:{id:string})=>t.id));
   const mine=ids.filter((_,i)=>sample==null||i%3===sample%3);
   for(const id of mine){
    const n:number=await P.page.evaluate(async id=>{const {openTheatre}=await import(String('/js/tales.js'));const t=(window.__sv as any).TALES.find((x:{id:string})=>x.id===id);openTheatre(t,{name:'Na'});
     for(let w=0;w<80&&!document.querySelector('.theatre');w++)await new Promise(r=>setTimeout(r,50));await new Promise(r=>setTimeout(r,700));
     (document.querySelector('.th-pause, .th-auto') as HTMLElement|null)?.click();return t.pages.length;},id);
    for(let k=0;k<n;k++){
     await P.page.waitForTimeout(250);
     const r=await P.page.evaluate(MEASURE,THEATRE);pages++;
     if(r.why.length){bad.push(`tale ${id} p${k+1} (${size.name} ${size.w}x${size.h}) ${r.why.join('; ')}`);if(process.env.SV_FIT_LOG)console.log('fivescreensfilms:',bad[bad.length-1]);if(r.why.length&&k===0)await P.page.screenshot({path:`out/fivescreens/tale-${id}-${size.name}.png`});}
     if(k<n-1)await P.page.evaluate(()=>(document.querySelector('.th-next') as HTMLElement|null)?.click());
    }
    await P.page.evaluate(()=>(document.querySelector('.th-x') as HTMLElement|null)?.click());await P.page.waitForTimeout(300);
    await P.page.evaluate(()=>document.querySelectorAll('.theatre, .dialog, .reward').forEach(e=>e.remove()));
   }
   tales=mine.length;
   // every game's guide film, its first page (the player is the same for every page)
   const gids:string[]=await P.page.evaluate(async()=>Object.keys((await import(String('/js/games/registry.js'))).GAMES));
   const gm=gids.filter((_,i)=>sample==null||i%3===sample%3);
   for(const id of gm){
    const ok=await P.page.evaluate(async id=>{const {openHowTo}=await import(String('/js/howto.js'));openHowTo(id,{});for(let w=0;w<60&&!document.querySelector('.howto');w++)await new Promise(r=>setTimeout(r,50));(document.querySelector('.ht-pp') as HTMLElement|null)?.click();return !!document.querySelector('.howto');},id);
    if(!ok){bad.push(`guide ${id} (${size.name}) did not open`);continue;}
    await P.page.waitForTimeout(400);
    const r=await P.page.evaluate(MEASURE,HOWTO);guides++;
    if(r.why.length){bad.push(`guide ${id} (${size.name} ${size.w}x${size.h}) ${r.why.join('; ')}`);if(process.env.SV_FIT_LOG)console.log('fivescreensfilms:',bad[bad.length-1]);await P.page.screenshot({path:`out/fivescreens/guide-${id}-${size.name}.png`});}
    await P.page.evaluate(()=>{(document.querySelector('.ht-x') as HTMLElement|null)?.click();});await P.page.waitForTimeout(250);
    await P.page.evaluate(()=>document.querySelectorAll('.howto').forEach(e=>e.remove()));
   }
   if(P.errors.length)bad.push(`${size.name}: page errors ${P.errors.slice(0,3).join(' | ')}`);
  }finally{await P.ctx.close();}
 };
 const queue=[...sizes];await Promise.all([0,1].map(async()=>{while(queue.length)await oneSize(queue.shift()!);}));
 assert.deepEqual(bad,[],'films, guides and story pages that do not fit');
 return `${tales} tales (${pages} pages over the sizes) and ${guides} guide films${sample==null?'':' (SAMPLE)'} at ${sizes.map(s=>`${s.name} ${s.w}x${s.h}`).join(', ')}: inside the screen, no scrolling, no overlaps, words at least 16 px, buttons at least 44 px`;
}
