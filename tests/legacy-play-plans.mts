import assert from 'node:assert/strict';import type {Browser} from 'playwright';import {open,clear,noWelcome} from './harness.mjs';
export async function legacyPlayPlansCheck(browser:Browser){
 const P=await open(browser,{w:900,h:800,settings:{voice:false,sound:false,autoPack:false,online:false,countPlayers:false}});
 try{await clear(P.page);await noWelcome(P.page);const results=[];
 for(const id of ['bunny','mrwolf','tug','dacau','marbles','balloon']){
  console.log('legal input plan',id);
  await P.page.evaluate(id=>{const G=window.__sv as any;G.heroes[0].profile.age=id==='dacau'?'big':'little';void G.playGame(0,id,'replay');},id);
  await P.page.locator(`.gl[data-game-id="${id}"]`).waitFor();
  const result=await P.page.evaluate(async()=>{
   const {playWatch}=await import(String('/js/games/playwatch.js'));let taps=0;const until=Date.now()+90000;
   while(Date.now()<until&&!document.querySelector('.gl-win')){
    const next=playWatch.plan?.();
    if(next instanceof HTMLElement){if(!(next instanceof HTMLButtonElement)||!next.disabled){next.click();taps++;}}
    else if(next?.el instanceof HTMLElement){
     const p=next,options=(x:number,y:number,buttons:number)=>({bubbles:true,cancelable:true,clientX:x,clientY:y,pointerId:7,pointerType:'touch',isPrimary:true,buttons});
     p.el.dispatchEvent(new PointerEvent('pointerdown',options(p.x,p.y,1)));
     for(const point of p.path||[]){p.el.dispatchEvent(new PointerEvent('pointermove',options(point.x,point.y,1)));await new Promise(r=>setTimeout(r,Math.max(10,p.ms/(p.path?.length||1))));}
     const end=p.path?.at(-1)||p;p.el.dispatchEvent(new PointerEvent('pointerup',options(end.x,end.y,0)));taps++;
    }
    await new Promise(r=>setTimeout(r,150));
   }
   return{won:!!document.querySelector('.gl-win'),taps};
  });
  assert.ok(result.won&&result.taps>0,`${id}: visible-input plan did not finish ${JSON.stringify(result)}`);results.push({id,...result});
  await P.page.locator('.gl').waitFor({state:'detached',timeout:15000});
 }
 assert.deepEqual(P.errors,[]);return'Legal visible-input plans complete bunny, Mr Wolf, tug, shuttlecock, marbles and balloon: '+JSON.stringify(results);
 }finally{await P.ctx.close();}
}
