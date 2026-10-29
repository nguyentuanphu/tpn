import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import type {Browser} from 'playwright';
import {open,clear,noWelcome} from './harness.mjs';
declare global{interface Window{__snakesTest?:{advance:()=>boolean;positions:()=>number[];complete:()=>boolean;gentle:()=>boolean;close:()=>void};}}
export async function snakesBrowserCheck(browser:Browser){
 const P=await open(browser,{w:390,h:844,touch:true,lang:'vi',settings:{voice:false,sound:false,music:false,autoPack:false,online:false,countPlayers:false}});await clear(P.page);await noWelcome(P.page);
 const start=async(lang:string,little:boolean)=>{
  if(await P.page.locator('.gl-win').count()){await P.page.locator('.gl-win.ask').waitFor();await P.page.locator('.gl-tapout').click();await P.page.locator('.gl-win').waitFor({state:'detached',timeout:10000});}
  if(await P.page.locator('.gl .gl-x').count()){await P.page.locator('.gl .gl-x').click();await P.page.locator('.gl').waitFor({state:'detached'});}await clear(P.page);
  await P.page.evaluate(async({lang,little})=>{
   window.__snakesTest?.close();const N=await import(String('/js/netgames.js')) as typeof import('../js/netgames.js'),C=await import(String('/js/games/snakes-core.js')) as typeof import('../js/games/snakes-core.js'),B=await import(String('/js/games/shared-board-session.js')) as typeof import('../js/games/shared-board-session.js'),S=await import(String('/js/state.js'));
   const ids=['one','two','three','four'],games=new Map<string,ReturnType<typeof N.createNetGames>>();
   const flush=async()=>{for(let i=0;i<10;i++)await Promise.resolve();};
   for(const id of ids){let g:ReturnType<typeof N.createNetGames>;g=N.createNetGames({net:{ids:()=>ids.filter(x=>x!==id),send:(d:Record<string,unknown>)=>{for(const to of ids)if(to!==id&&(!d.to||d.to===to))queueMicrotask(()=>games.get(to)!.receive({...d,from:id}));}},me:()=>id,onAsk:d=>g.answer(d,true),onStart:()=>{},onEnd:()=>{},waitMs:1000});games.set(id,g);}
   games.get('one')!.invite('snakes',2,undefined);await flush();
   const channels=ids.map(id=>{const g=games.get(id)!,s=g.session!;return{mine:s.mine,names:['Na','Bin','Lan','Minh'],seed:'snakes-browser-proof',move:(n:number,v:number)=>{g.move(n,v);},onMove:(fn:(seat:number,n:number,v:number)=>void)=>g.onMove(fn),peek:(n:number,seat:number)=>g.session?.moves.get(n)?.get(seat),connected:()=>true,present:()=>true,leave:()=>g.leave()};});
   const sessions=channels.slice(1).map(online=>new B.SharedBoardSession({online,gentle:little,seats:4,seed:online.seed,initial:C.snakesStart,reduce:C.snakesCommand,changed:()=>{}}));
   window.__snakesTest={advance:()=>{const s=sessions[0].state;if(!s||s.complete||s.turn===0)return false;return sessions[s.turn-1].submit(0);},positions:()=>sessions[0].state?.positions||[],complete:()=>!!sessions[0].state?.complete,gentle:()=>!!sessions[0].state?.gentle,close:()=>{sessions.forEach(s=>s.close());games.forEach(g=>g.leave());}};
   S.settings.lang=lang;const G=window.__sv as unknown as import('../js/main.js').SvMain;G.heroes[0].profile.age=little?'little':'big';void G.playGameOnline!('snakes',2,channels[0]);
  },{lang,little});
  await P.page.locator('.snakes-shared[data-mode]').waitFor();await P.page.waitForFunction(()=>{const l=document.querySelector('.gl');return!!l&&getComputedStyle(l).opacity==='1';});
 };
 try{
  await start('vi',true);let clicks=0,rounds=0;
  while(!await P.page.locator('.gl-win').count()&&rounds++<500){
   const button=P.page.locator('.snakes-controls button:not([disabled])');if(await button.count()){await button.click();clicks++;}else{await P.page.evaluate(()=>window.__snakesTest!.advance());await P.page.waitForTimeout(35);}
   // (30 Oct 2026 AEDT) the die tumbles before the counters move (js/games/reveal.ts), so the board catches up within a moment
   if(!await P.page.locator('.gl-win').count())await P.page.waitForFunction(()=>document.querySelector('.gl-win')||document.querySelector('.snakes-shared')?.getAttribute('data-positions')===window.__snakesTest!.positions().join(','),null,{timeout:3000}).catch(()=>{});
   if(!await P.page.locator('.gl-win').count())assert.equal(await P.page.locator('.snakes-shared').getAttribute('data-positions'),await P.page.evaluate(()=>window.__snakesTest!.positions().join(',')),'host board must match real invited peers after every move');
  }
  assert.ok(await P.page.locator('.gl-win').count(),'four-seat gentle board completes through real controls and invited transport');assert.ok(clicks>=3,'even the shortest ladder route takes three real host rolls');assert.ok(rounds>=12,'all four pieces must play the route');assert.equal(await P.page.evaluate(()=>window.__snakesTest!.complete()),true);assert.deepEqual(await P.page.evaluate(()=>window.__snakesTest!.positions()),[25,25,25,25]);
  await fs.mkdir('out/snakes-shared',{recursive:true});
  for(const[device,w,h]of[['phone',390,844],['tablet',820,1180],['computer',1280,800]]as const)for(const lang of['en','vi'])for(const little of[true,false]){
   await P.page.setViewportSize({width:w,height:h});await start(lang,little);
   assert.equal(await P.page.locator('.snakes-cell').count(),25);assert.equal(await P.page.locator('.snakes-token').count(),4);assert.equal(await P.page.locator('.snakes-roster>span').count(),4);assert.equal(await P.page.locator('.snakes-cell.snake').count(),little?0:3);
   assert.equal(await P.page.evaluate(()=>window.__snakesTest!.gentle()),little);await P.page.locator('.snakes-controls button').click();assert.notEqual(await P.page.locator('.snakes-shared').getAttribute('data-positions'),'1,1,1,1');assert.equal(await P.page.locator('.snakes-die .die-pip').count(),Number(await P.page.locator('.snakes-shared').getAttribute('data-roll')),'drawn die must show the actual roll');
   await P.page.waitForFunction(()=>!document.querySelector('.snakes-shared .sv-spring,.snakes-shared .sv-press'));await P.page.locator('.gl-stage').evaluate(e=>{e.scrollTop=0;});
   const bad=await P.page.locator('.snakes-controls button:visible').evaluateAll(nodes=>nodes.map(e=>{const r=e.getBoundingClientRect();return{w:r.width,h:r.height,top:r.top,bottom:r.bottom};}).filter(r=>r.w<63||r.h<63||r.top<0||r.bottom>innerHeight+1));assert.deepEqual(bad,[],'roll remains64px and visible: '+JSON.stringify(bad));
   assert.equal(await P.page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),true);await P.page.screenshot({path:`out/snakes-shared/${device}-${lang}-${little?'gentle':'classic'}.png`});
  }
  assert.deepEqual(P.errors,[]);return `Actual four-seat invited board completes in${clicks} host taps; every peer agrees after every move, all4 gentle pieces finish,25 cells/four tokens and64px visible Roll in12 EN/VI device layouts`;
 }catch(error){await fs.mkdir('out',{recursive:true});await P.page.screenshot({path:'out/fail-snakesplay.png'}).catch(()=>{});throw error;}finally{await P.page.evaluate(()=>window.__snakesTest?.close()).catch(()=>{});await P.ctx.close();}
}
