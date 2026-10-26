import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import type{Browser}from 'playwright';
import{open,clear,noWelcome}from './harness.mjs';
declare global{interface Window{__tugTest?:{drive:()=>void;pulls:()=>number[];complete:()=>boolean;close:()=>void};}}
export async function tugBrowserCheck(browser:Browser){
 const P=await open(browser,{w:390,h:844,touch:true,lang:'vi',settings:{voice:false,sound:false,music:false,autoPack:false,online:false,countPlayers:false}});await clear(P.page);await noWelcome(P.page);
 const start=async(lang:string,little:boolean)=>{
  if(await P.page.locator('.gl-win').count()){await P.page.locator('.gl-win.ask').waitFor();await P.page.locator('.gl-tapout').click();await P.page.locator('.gl-win').waitFor({state:'detached'});}
  if(await P.page.locator('.gl .gl-x').count()){await P.page.locator('.gl .gl-x').click();await P.page.locator('.gl').waitFor({state:'detached'});}await clear(P.page);
  await P.page.evaluate(async({lang,little})=>{
   window.__tugTest?.close();const N=await import(String('/js/netgames.js'))as typeof import('../js/netgames.js'),C=await import(String('/js/games/tug-session.js'))as typeof import('../js/games/tug-session.js'),S=await import(String('/js/state.js'));
   const ids=['one','two','three','four','five','six'],names=['Na','Bin','Lan','Minh','Mai','An'],games=new Map<string,ReturnType<typeof N.createNetGames>>();
   for(const id of ids){let g:ReturnType<typeof N.createNetGames>;g=N.createNetGames({net:{ids:()=>ids.filter(x=>x!==id),send:(d:Record<string,unknown>)=>{for(const to of ids)if(to!==id&&(!d.to||d.to===to))queueMicrotask(()=>games.get(to)!.receive({...d,from:id}));}},me:()=>id,onAsk:d=>g.answer(d,true),onStart:()=>{},onEnd:()=>{},waitMs:1000});games.set(id,g);}
   games.get('one')!.invite('tug',2,undefined);for(let i=0;i<10;i++)await Promise.resolve();
   const channels=ids.map(id=>{const g=games.get(id)!,s=g.session!;return{mine:s.mine,names,seed:s.gid,move:(n:number,v:number)=>{g.move(n,v);},onMove:(fn:(seat:number,n:number,v:number)=>void)=>g.onMove(fn),peek:(n:number,seat:number)=>g.session?.moves.get(n)?.get(seat),connected:()=>true,present:()=>true,leave:()=>g.leave()};});
   const sessions=channels.slice(1).map(online=>new C.TugSession({online,gentle:little,changed:()=>{}}));
   window.__tugTest={drive:()=>{for(const s of sessions){s.poll();if(!s.busy&&!s.waiting&&!s.state?.complete)s.submit();}},pulls:()=>sessions[0].state?.pulls||[],complete:()=>!!sessions[0].state?.complete,close:()=>{sessions.forEach(s=>s.close());games.forEach(g=>g.leave());}};
   S.settings.lang=lang;const G=window.__sv as unknown as import('../js/main.js').SvMain;G.heroes[0].profile.age=little?'little':'big';void G.playGameOnline!('tug',2,channels[0]);
  },{lang,little});
  await P.page.locator('.tug-shared[data-mode]').waitFor();await P.page.waitForFunction(()=>{const l=document.querySelector('.gl');return!!l&&getComputedStyle(l).opacity==='1';});
 };
 try{
  await start('vi',true);let taps=0,loops=0;const deadline=Date.now()+90000;
  while(!await P.page.locator('.gl-win').count()&&Date.now()<deadline&&loops++<1000){
   const pull=P.page.locator('[data-tug-pull]:not([disabled])');if(await pull.count()){await pull.click();taps++;}
   await P.page.evaluate(()=>window.__tugTest!.drive());await P.page.waitForTimeout(60);
   assert.equal(await P.page.evaluate(()=>document.querySelector<HTMLElement>('.tug-shared')?.dataset.pulls===window.__tugTest!.pulls().join(',')),true,'rendered rope and invited peers must agree in the same event turn');
  }
  assert.ok(await P.page.locator('.gl-win').count(),'six-seat real cooperative tug completes');assert.ok(taps>=2);assert.equal(await P.page.evaluate(()=>window.__tugTest!.complete()),true);assert.ok((await P.page.evaluate(()=>window.__tugTest!.pulls())).every(n=>n>=2));
  await fs.mkdir('out/tug-shared',{recursive:true});
  for(const[device,w,h]of[['phone',390,844],['tablet',820,1180],['computer',1280,800]]as const)for(const lang of['en','vi'])for(const little of[true,false]){
   await P.page.setViewportSize({width:w,height:h});await start(lang,little);assert.equal(await P.page.locator('.tug-players>span').count(),6);assert.equal(await P.page.locator('.tug-scene svg>g').count(),6);assert.equal(await P.page.locator('.tug-shared').getAttribute('data-mode'),little?'gentle':'classic');await P.page.locator('[data-tug-pull]').click();await P.page.waitForFunction(()=>Number(document.querySelector<HTMLElement>('.tug-shared')?.dataset.commands)>0);
   await P.page.waitForFunction(()=>!document.querySelector('.tug-shared .sv-spring,.tug-shared .sv-press'));await P.page.locator('.gl-stage').evaluate(e=>{e.scrollTop=0;});
   const r=await P.page.locator('[data-tug-pull]').evaluate(e=>{const r=e.getBoundingClientRect();return{w:r.width,h:r.height,top:r.top,bottom:r.bottom,viewport:innerHeight};});assert.ok(r.w>=64&&r.h>=64&&r.top>=0&&r.bottom<=r.viewport-8,'real pull control fits and stays64px: '+JSON.stringify(r));assert.equal(await P.page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),true);await P.page.screenshot({path:`out/tug-shared/${device}-${lang}-${little?'gentle':'classic'}.png`});
  }
  assert.deepEqual(P.errors,[]);return `Six accepted players share one rope; actual human/peer cooperative completion, everybody contributes,12 EN/VI device layouts with six drawn children and64px visible Pull`;
 }catch(error){await fs.mkdir('out',{recursive:true});await P.page.screenshot({path:'out/fail-tugplay.png'}).catch(()=>{});throw error;}finally{await P.page.evaluate(()=>window.__tugTest?.close()).catch(()=>{});await P.ctx.close();}
}
