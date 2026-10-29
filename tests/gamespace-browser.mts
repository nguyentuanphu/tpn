import assert from 'node:assert/strict';import fs from 'node:fs/promises';import type {Browser} from 'playwright';
import {open,clear,noWelcome} from './harness.mjs';
// (owner, 30 Oct 2026 AEDT: "put in the tool to ensure the game space is large enough; the space issue is across all
// games") every game on a phone, big kid and under-5: the top (Leave, name, film, guide, level, stars) stays a small
// band, the playing area keeps most of the screen, and the guide is at most two lines (its box keeps up to half a
// line more so a longer hint never moves the board)
const TOP_MAX={big:130,little:150},STAGE_MIN=.78;
// the tester arcades open only on a tester's device, in their own screen
const SKIP=new Set(['sparklefruitbar','sparkleorchard']);
export async function gameSpaceCheck(browser:Browser){
 const P=await open(browser,{w:390,h:844,touch:true,lang:'vi',settings:{voice:false,sound:false,autoPack:false,online:false,countPlayers:false}});
 try{await clear(P.page);await noWelcome(P.page);await fs.mkdir('out/gamespace',{recursive:true});
  const ids:string[]=await P.page.evaluate(async()=>(await import(String('/js/games/catalog.js'))).GAME_CATALOG.map((g:{id:string})=>g.id)).then((all:string[])=>all.filter(id=>!SKIP.has(id)));
  const bad:string[]=[],rows:unknown[]=[];
  for(const age of ['big','little']as const)for(const id of ids){
   await P.page.evaluate(([id,age])=>{const G=window.__sv as any;G.heroes[0].profile.age=age;G.heroes[0].profile.unlockAll=true;void G.playGame(0,id,'replay');},[id,age]);
   if(!await P.page.locator('.gl .gl-stage').waitFor({timeout:10000}).then(()=>true,()=>false)){bad.push(`${id} (${age}) did not open`);await P.page.screenshot({path:`out/gamespace/${id}-${age}.png`});await P.page.evaluate(()=>(document.querySelector('.gl-x') as HTMLElement|null)?.click());await P.page.waitForTimeout(800);continue;}
   await P.page.waitForTimeout(500);
   const r=await P.page.evaluate(()=>{const q=(s:string)=>document.querySelector(s)!.getBoundingClientRect(),stage=q('.gl-stage'),help=document.querySelector('.gl-help') as HTMLElement,lh=parseFloat(getComputedStyle(help).lineHeight)||20;
    return {top:Math.round(stage.top),share:+(stage.height/innerHeight).toFixed(2),guideLines:+(help.getBoundingClientRect().height/lh).toFixed(1),wide:document.querySelector('.gl-head')!.scrollWidth>innerWidth+1};});
   rows.push({id,age,...r});
   if(r.top>TOP_MAX[age]||r.share<STAGE_MIN||r.guideLines>2.6||r.wide){bad.push(`${id} (${age}) ${JSON.stringify(r)}`);await P.page.screenshot({path:`out/gamespace/${id}-${age}.png`});}
   await P.page.evaluate(()=>(document.querySelector('.gl-x') as HTMLElement).click());await P.page.locator('.gl').first().waitFor({state:'detached',timeout:15000}).catch(()=>{});
  }
  await fs.writeFile('out/gamespace/rows.json',JSON.stringify(rows,null,1));
  assert.deepEqual(bad,[],'games whose top band is too big');assert.deepEqual(P.errors,[]);
  return `${ids.length} games, big kid and under-5, phone 390x844: top band at most ${TOP_MAX.big}/${TOP_MAX.little} px, playing area at least ${STAGE_MIN*100}% of the screen, guide at most two lines`;
 }finally{await P.ctx.close();}
}
