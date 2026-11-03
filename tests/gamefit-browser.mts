import assert from 'node:assert/strict';import fs from 'node:fs/promises';import type {Browser} from 'playwright';
import {open,clear,noWelcome} from './harness.mts';
// (owner, 3 Nov 2026 AEDT, Android tablet held sideways: "the answers sit below the bottom of the screen") every game
// fits one screen with no scrolling: the question, the play area and every answer and button are inside the window, on a
// phone, a tablet (landscape about 1280x800 and 1340x800, and portrait) and a computer. The level button and the stars
// sit on the title row (not a row of their own), and on a landscape screen the answers stand side by side in a row.
// SV_FIT_SIZES=phone,land picks some sizes; SV_FIT_GAMES=a,b picks some games (for trying one fix quickly).
const SIZES:{name:string,w:number,h:number,touch:boolean,age?:string}[]=[
 {name:'phone',w:390,h:844,touch:true},
 {name:'phonelittle',w:390,h:844,touch:true,age:'little'},
 {name:'land',w:1280,h:800,touch:true},
 {name:'land2',w:1340,h:800,touch:true},
 {name:'port',w:800,h:1280,touch:true},
 {name:'computer',w:1440,h:900,touch:false},
];
// the tester arcades open only on a tester's device, in their own screen
const TEXT_MIN=16;
const SKIP=new Set(['sparklefruitbar','sparkleorchard']);
export async function gameFitCheck(browser:Browser){
 const pick=(process.env.SV_FIT_SIZES||'').split(',').filter(Boolean),games=(process.env.SV_FIT_GAMES||'').split(',').filter(Boolean);
 const sizes=SIZES.filter(s=>!pick.length||pick.includes(s.name));
 await fs.mkdir('out/gamefit',{recursive:true});
 const bad:string[]=[],rows:unknown[]=[];let count=0;
 // (one size per window, three windows at a time, so every game at every size fits in the check's time)
 const oneSize=async(size:typeof SIZES[number])=>{
  const P=await open(browser,{w:size.w,h:size.h,touch:size.touch,lang:'vi',settings:{voice:false,sound:false,autoPack:false,online:false,countPlayers:false}});
  try{await clear(P.page);await noWelcome(P.page);
   // the catalogue, and the reading corner's games (Studio's readingTrial: on with no setting, registered by js/games/readingmenu.ts)
   const ids:string[]=await P.page.evaluate(async()=>{const c=(await import(String('/js/games/catalog.js'))).GAME_CATALOG.map((g:{id:string})=>g.id);const all=Object.keys((await import(String('/js/games/frame.js'))).GAMES);return [...new Set([...c,...all.filter(id=>id.startsWith('rd_'))])];}).then((all:string[])=>all.filter(id=>!SKIP.has(id)&&(!games.length||games.includes(id))));
   count=ids.length;
   for(const id of ids){
    await P.page.evaluate(([id,age])=>{const G=window.__sv as any;G.heroes[0].profile.age=age;G.heroes[0].profile.unlockAll=true;void G.playGame(0,id,'replay');},[id,size.age||'big']);
    if(!await P.page.locator('.gl .gl-stage').waitFor({timeout:10000}).then(()=>true,()=>false)){bad.push(`${id} (${size.name}) did not open`);continue;}
    // wait for the game to set up its first round and for the stage to settle its size (it fits again when a round
    // adds its answers)
    await P.page.waitForTimeout(800);
    for(let k=0,last='';k<12;k++){const z=await P.page.evaluate(()=>{const st=document.querySelector('.gl-stage') as HTMLElement|null;return st?st.style.zoom+'|'+st.scrollHeight+'|'+st.innerHTML.length:'';});if(z===last)break;last=z;await P.page.waitForTimeout(400);}
    const r=await P.page.evaluate((TEXT_MIN)=>{
     const gl=document.querySelector('.gl') as HTMLElement,st=gl.querySelector('.gl-stage') as HTMLElement,W=innerWidth,H=innerHeight;
     const seen=(e:Element)=>{const s=getComputedStyle(e);if(s.visibility==='hidden'||s.display==='none'||+s.opacity===0)return false;const b=e.getBoundingClientRect();return b.width>2&&b.height>2;};
     // every control a child taps: the frame's buttons and the game's buttons and choices (a covering card such as the
     // level picker or the win screen is not open yet)
     const taps=[...gl.querySelectorAll('button, [role=button], .choice, .card, [data-pick]')].filter(e=>seen(e)&&!e.closest('.gl-win, .gl-lvlpick, .mascot-say')
      // a fold's inside while it is closed, and a piece that is moving (a bubble rising from below) are not answers on the screen
      &&!(e.closest('details:not([open])')&&!e.closest('summary'))&&!e.getAnimations({subtree:false}).some(a=>a.playState==='running'&&/transform|top|left|bottom|translate/.test(JSON.stringify((a.effect as KeyframeEffect)?.getKeyframes?.()||[]))));
     const out=taps.map(e=>{const b=e.getBoundingClientRect();return {e,b};}).filter(({b})=>b.bottom>H+1||b.right>W+1||b.top< -1||b.left< -1)
      .map(({e,b})=>`${e.tagName.toLowerCase()}.${String((e as HTMLElement).className).split(' ')[0]}@${Math.round(b.top)}-${Math.round(b.bottom)}`);
     const scroll=Math.max(0,st.scrollHeight-st.clientHeight-2,gl.scrollHeight-gl.clientHeight-2);
     // the level and the stars on the title row
     const head=gl.querySelector('.gl-head')!.getBoundingClientRect(),stars=gl.querySelector('.starbox')!.getBoundingClientRect(),lvl=gl.querySelector('.gl-lvl')?.getBoundingClientRect();
     const onHead=(b?:DOMRect)=>!b||(b.top>=head.top-1&&b.bottom<=head.bottom+1);
     // the answers: a row of two to four choices stands side by side on a landscape screen
     let stacked=false;
     if(W>H)for(const row of gl.querySelectorAll('.gl-stage .choices, .gl-stage .sci-choices, .gl-stage .rd-choices')){const kids=[...row.children].filter(seen).map(k=>k.getBoundingClientRect());if(kids.length>=2&&kids.length<=4&&new Set(kids.map(k=>Math.round(k.top/8))).size===kids.length)stacked=true;}
     // (owner, 3 Nov 2026 AEDT, CLAUDE.md "One screen, big clear text") the text a child reads is at least TEXT_MIN px as
     // drawn (its font size times the stage's zoom), on every screen
     const zoomOf=(e:Element)=>{let z=1;for(let n:Element|null=e;n&&n!==gl;n=n.parentElement){const v=parseFloat((n as HTMLElement).style?.zoom||'');if(v)z*=v;}return z;};
     const small:string[]=[];const tw=document.createTreeWalker(gl,NodeFilter.SHOW_TEXT);let t:Node|null;
     while((t=tw.nextNode())){const p=t.parentElement;if(!p||!(t.textContent||'').trim()||!/[\p{L}\p{N}]/u.test(t.textContent||'')||p.closest('.gl-win, .gl-lvlpick, .mascot-say, svg, .gl-dots')||!seen(p))continue;
      if(p.closest('details:not([open])')&&!p.closest('summary'))continue;const px=parseFloat(getComputedStyle(p).fontSize)*zoomOf(p);if(px<TEXT_MIN-.5)small.push(`${(t.textContent||'').trim().slice(0,14)}=${Math.round(px)}`);}
     return {out,scroll:Math.round(scroll),head:onHead(stars)&&onHead(lvl),stacked,zoom:st.style.zoom||'1',small:[...new Set(small)].slice(0,6)};},TEXT_MIN);
    rows.push({id,size:size.name,...r});
    const why=[r.out.length?`below the fold: ${r.out.slice(0,3).join(' ')}`:'',r.scroll?`scrolls ${r.scroll}px`:'',r.head?'':'level/stars not on the title row',r.stacked?'answers stacked in a column':'',r.small.length?`text under ${TEXT_MIN}px: ${r.small.join(' ')}`:''].filter(Boolean);
    if(why.length){bad.push(`${id} (${size.name} ${size.w}x${size.h}) ${why.join('; ')}`);if(process.env.SV_FIT_LOG)console.log('gamefit:',bad[bad.length-1]);await P.page.screenshot({path:`out/gamefit/${id}-${size.name}.png`});}
    await P.page.evaluate(()=>(document.querySelector('.gl-x') as HTMLElement).click());await P.page.locator('.gl').first().waitFor({state:'detached',timeout:15000}).catch(()=>{});
   }
   if(P.errors.length)bad.push(`${size.name}: page errors ${P.errors.join(' | ')}`);
  }finally{await P.ctx.close();}
 };
 const queue=[...sizes];await Promise.all([0,1,2].map(async()=>{while(queue.length)await oneSize(queue.shift()!);}));
 await fs.writeFile('out/gamefit/rows.json',JSON.stringify(rows,null,1));
 assert.deepEqual(bad,[],'games that do not fit one screen');
 return `${count} games at ${sizes.map(s=>`${s.name} ${s.w}x${s.h}`).join(', ')}: every answer and button inside the screen, no scrolling, level and stars on the title row, answers side by side on landscape, game text at least ${TEXT_MIN}px`;
}
