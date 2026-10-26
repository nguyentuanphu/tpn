import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import type {Browser} from 'playwright';
import {open,clear,noWelcome} from './harness.mjs';
declare global{interface Window{__oaqTest?:{advance:()=>boolean;seeds:()=>number[];scores:()=>number[];complete:()=>boolean;gentle:()=>boolean;close:()=>void};}}
export async function oaqBrowserCheck(browser:Browser){
 const P=await open(browser,{w:390,h:844,touch:true,lang:'vi',settings:{voice:false,sound:false,music:false,autoPack:false,online:false,countPlayers:false}});await clear(P.page);await noWelcome(P.page);
 const start=async(lang:string,little:boolean)=>{
  if(await P.page.locator('.gl-win').count()){await P.page.locator('.gl-win.ask').waitFor();await P.page.locator('.gl-tapout').click();await P.page.locator('.gl-win').waitFor({state:'detached'});}
  if(await P.page.locator('.gl .gl-x').count()){await P.page.locator('.gl .gl-x').click();await P.page.locator('.gl').waitFor({state:'detached'});}await clear(P.page);
  await P.page.evaluate(async({lang,little})=>{
   window.__oaqTest?.close();const N=await import(String('/js/netgames.js'))as typeof import('../js/netgames.js'),C=await import(String('/js/games/oanquan-core.js'))as typeof import('../js/games/oanquan-core.js'),B=await import(String('/js/games/shared-board-session.js'))as typeof import('../js/games/shared-board-session.js'),S=await import(String('/js/state.js'));
   const ids=['one','two'],games=new Map<string,ReturnType<typeof N.createNetGames>>();for(const id of ids){let g:ReturnType<typeof N.createNetGames>;g=N.createNetGames({net:{ids:()=>ids.filter(x=>x!==id),send:(d:Record<string,unknown>)=>{for(const to of ids)if(to!==id&&(!d.to||d.to===to))queueMicrotask(()=>games.get(to)!.receive({...d,from:id}));}},me:()=>id,onAsk:d=>g.answer(d,true),onStart:()=>{},onEnd:()=>{},waitMs:1000});games.set(id,g);}
   games.get('one')!.invite('oanquan',2,'two');for(let i=0;i<10;i++)await Promise.resolve();
   const channels=ids.map(id=>{const g=games.get(id)!,s=g.session!;return{mine:s.mine,names:['Na','Bin'],seed:s.gid,move:(n:number,v:number)=>{g.move(n,v);},onMove:(fn:(seat:number,n:number,v:number)=>void)=>g.onMove(fn),peek:(n:number,seat:number)=>g.session?.moves.get(n)?.get(seat),connected:()=>true,present:()=>true,leave:()=>g.leave()};});
   const guest=new B.SharedBoardSession({online:channels[1],gentle:little,seats:2,seed:channels[1].seed,initial:C.oaqStart,reduce:C.oaqCommand,changed:()=>{}});
   window.__oaqTest={advance:()=>{const s=guest.state;if(!s||s.complete||s.turn===0)return false;const value=C.oaqChoose(s);return value!==null&&guest.submit(value);},seeds:()=>guest.state?.seeds||[],scores:()=>guest.state?.score||[],complete:()=>!!guest.state?.complete,gentle:()=>!!guest.state?.gentle,close:()=>{guest.close();games.forEach(g=>g.leave());}};
   S.settings.lang=lang;const G=window.__sv as unknown as import('../js/main.js').SvMain;G.heroes[0].profile.age=little?'little':'big';void G.playGameOnline!('oanquan',2,channels[0]);
  },{lang,little});
  await P.page.locator('.oaq-shared[data-mode]').waitFor();await P.page.waitForFunction(()=>{const l=document.querySelector('.gl');return!!l&&getComputedStyle(l).opacity==='1';});
 };
 const act=async()=>{
  const found=await P.page.evaluate(async()=>{document.querySelectorAll('[data-oaq-probe]').forEach(e=>e.removeAttribute('data-oaq-probe'));const target=(await import(String('/js/games/playwatch.js'))).playWatch.plan?.();if(target instanceof HTMLButtonElement&&!target.disabled&&target.isConnected){target.dataset.oaqProbe='true';return true;}return false;});
  if(found)await P.page.locator('[data-oaq-probe]').click();else{await P.page.evaluate(()=>window.__oaqTest!.advance());await P.page.waitForTimeout(40);}return found;
 };
 try{
  await start('vi',true);assert.equal(await P.page.locator('.oaq-c.sq:disabled').count(),5,'opponent row is not a legal local choice');assert.equal(await P.page.locator('.oaq-directions button:disabled').count(),2,'choose a pit before choosing a direction');
  let clicks=0,attempts=0;while(!await P.page.locator('.gl-win').count()&&attempts++<1500){if(await act())clicks++;if(!await P.page.locator('.gl-win').count()){assert.equal(await P.page.locator('.oaq-shared').getAttribute('data-seeds'),await P.page.evaluate(()=>window.__oaqTest!.seeds().join(',')));assert.equal(await P.page.locator('.oaq-shared').getAttribute('data-scores'),await P.page.evaluate(()=>window.__oaqTest!.scores().join(',')));}}
  assert.ok(await P.page.locator('.gl-win').count(),'shared actual sowing game must finish');assert.ok(clicks>4);assert.equal(await P.page.evaluate(()=>window.__oaqTest!.complete()),true);assert.equal(await P.page.evaluate(()=>window.__oaqTest!.scores().reduce((a,b)=>a+b,0)),70);
  await fs.mkdir('out/oanquan-shared',{recursive:true});
  for(const[device,w,h]of[['phone',390,844],['tablet',820,1180],['computer',1280,800]]as const)for(const lang of['en','vi'])for(const little of[true,false]){
   await P.page.setViewportSize({width:w,height:h});await start(lang,little);assert.equal(await P.page.locator('.oaq-c.sq').count(),10);assert.equal(await P.page.locator('.oaq-c.quan').count(),2);assert.equal(await P.page.evaluate(()=>window.__oaqTest!.gentle()),little);
   await P.page.locator('[data-pit="1"]').click();assert.equal(await P.page.locator('.oaq-directions button:enabled').count(),2);await P.page.waitForFunction(()=>!document.querySelector('.oaq-shared .sv-spring,.oaq-shared .sv-press'));await P.page.locator('.gl-stage').evaluate(e=>{e.scrollTop=0;});
   const small=await P.page.locator('.oaq-c.sq,.oaq-directions button').evaluateAll(nodes=>nodes.map(e=>{const r=e.getBoundingClientRect();return{w:r.width,h:r.height,pit:(e as HTMLElement).dataset.pit};}).filter(r=>r.w<63||r.h<63));assert.deepEqual(small,[],'all pit/direction targets64px: '+JSON.stringify(small));
   assert.equal(await P.page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),true);const bounds=await P.page.locator('.oaq-shared .oaq').evaluate(e=>{const r=e.getBoundingClientRect();return{top:r.top,bottom:r.bottom,viewport:innerHeight};});assert.ok(bounds.top>=0&&bounds.bottom<=bounds.viewport-8,'whole board fits with breathing space: '+JSON.stringify(bounds));await P.page.screenshot({path:`out/oanquan-shared/${device}-${lang}-${little?'gentle':'classic'}.png`});
  }
  assert.deepEqual(P.errors,[]);return `Real invited two-seat sow/capture/refill match completed through${clicks} host taps; both states agree after every click, score70 at end, wrong-side/empty choices rejected,12 bilingual/device64px layouts`;
 }catch(error){await fs.mkdir('out',{recursive:true});await P.page.screenshot({path:'out/fail-oaqplay.png'}).catch(()=>{});throw error;}finally{await P.page.evaluate(()=>window.__oaqTest?.close()).catch(()=>{});await P.ctx.close();}
}
