import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import type {Browser} from 'playwright';
import {open,clear,noWelcome} from './harness.mjs';
export async function horseBrowserCheck(browser:Browser){
 const P=await open(browser,{w:390,h:844,touch:true,lang:'vi',settings:{voice:false,autoPack:false,online:false,countPlayers:false}});await clear(P.page);await noWelcome(P.page);
 const start=async(little:boolean,lang:string,diff='easy')=>{
  if(await P.page.locator('.gl-win').count())await P.page.locator('.gl-win').waitFor({state:'detached',timeout:10000});
  if(await P.page.locator('.gl .gl-x').count()){await P.page.locator('.gl .gl-x').click();await P.page.locator('.gl').waitFor({state:'detached'});}
  await P.page.evaluate(async({little,lang,diff})=>{const G=window.__sv as unknown as import('../js/main.js').SvMain,S=await import(String('/js/state.js'));S.settings.lang=lang;G.heroes[0].profile.age=little?'little':'big';G.heroes[0].profile.difficulty=diff;G.heroes[0].profile.gameDiff={...G.heroes[0].profile.gameDiff,cacuangua:diff};void G.playGame(0,'cacuangua','replay');},{little,lang,diff});
  await P.page.locator('.horse-race').waitFor();await P.page.waitForFunction(()=>!!document.querySelector('.horse-race[data-mode]'));
  await P.page.waitForFunction(()=>{const layer=document.querySelector('.gl[data-game-id=cacuangua]');return !!layer&&getComputedStyle(layer).opacity==='1';});
 };
 try{
  // (owner, 30 Oct 2026 AEDT) the level picks the rules for every age: Hard is the classic 56-square game, Easy the gentle track
  await start(true,'vi','hard');assert.equal(await P.page.locator('.horse-cell').count(),56,'Hard gives the classic game');
  await start(true,'vi');assert.equal(await P.page.locator('.horse-cell').count(),16);
  // A child uses the real controls while the helper takes its own complete turns.
  let actions=0;const until=Date.now()+150000;
  while(!await P.page.locator('.gl-win').count()&&Date.now()<until&&actions<250){
   const choice=P.page.locator('.horse-moves button:not([disabled])').first(),roll=P.page.locator('[data-horse-roll]:not([disabled])');
   if(await choice.count()){await choice.click();actions++;}else if(await roll.count()){await roll.click();actions++;}else await P.page.waitForTimeout(100);
  }
  assert.ok(await P.page.locator('.gl-win').count(),'gentle human/helper game must actually finish');assert.ok(actions>10,'completion must involve real play');
  await fs.mkdir('out/horse-board',{recursive:true});
  for(const[device,w,h]of[['phone',390,844],['tablet',820,1180],['computer',1280,800]]as const)for(const lang of['en','vi'])for(const little of[true,false]){
   await P.page.setViewportSize({width:w,height:h});await start(little,lang,little?'easy':'medium');
   if(!little){
    await P.page.locator('.horse-race details').last().evaluate((d:HTMLDetailsElement)=>{d.open=true;});
    await P.page.locator('.horse-settings select').nth(1).selectOption('4');await P.page.locator('.horse-settings input').uncheck();await P.page.locator('.horse-settings button').click();
    await P.page.locator('.horse-race details').last().evaluate((d:HTMLDetailsElement)=>{d.open=false;});
    assert.equal(await P.page.locator('.horse-player').count(),4);assert.equal(await P.page.locator('.horse-cell').count(),56);
    let moved=false;
    for(let n=0;n<90&&!moved;n++){
     const choice=P.page.locator('.horse-moves button:not([disabled])').first();
     if(await choice.count())await choice.click();else await P.page.locator('[data-horse-roll]').click();
     moved=await P.page.locator('.horse-board .horse-token').evaluateAll(tokens=>tokens.some(t=>Number((t as HTMLElement).dataset.pos)>0));
    }assert.ok(moved,'the classic board must show actual horse movement');
   }
   await P.page.waitForFunction(()=>!document.querySelector('.horse-race .sv-spring,.horse-race .sv-press'));
   const bad=await P.page.locator('.horse-race button:visible,.horse-race select:visible').evaluateAll(nodes=>nodes.map(e=>{const r=e.getBoundingClientRect(),s=getComputedStyle(e);return{tag:e.tagName,text:e.textContent?.slice(0,70),w:r.width,h:r.height,minw:s.minWidth,minh:s.minHeight,transform:s.transform};}).filter(r=>r.w<63||r.h<63));assert.deepEqual(bad,[],'all horse controls remain at least64px: '+JSON.stringify(bad));
   assert.equal(await P.page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),true);
   await P.page.locator('.gl-stage').evaluate(stage=>{stage.scrollTop=0;});
   const outside=await P.page.locator('.horse-roster,.horse-board,[data-horse-roll]').evaluateAll(nodes=>nodes.map(e=>{const r=e.getBoundingClientRect();return{cls:e.className,top:r.top,bottom:r.bottom,left:r.left,right:r.right};}).filter(r=>r.top<0||r.bottom>innerHeight+1||r.left<0||r.right>innerWidth+1));assert.deepEqual(outside,[],'the board, seats and roll control must fit the reviewed viewport: '+JSON.stringify(outside));
   await P.page.locator('.gl[data-game-id=cacuangua]').evaluate(async layer=>{await new Promise<void>(r=>requestAnimationFrame(()=>requestAnimationFrame(()=>r())));await Promise.allSettled(layer.getAnimations().map(a=>a.finished));});
   await P.page.screenshot({path:`out/horse-board/${device}-${lang}-${little?'gentle':'classic'}.png`});
  }
  assert.deepEqual(P.errors,[]);return `Real human/helper gentle match finished in ${actions} actions; 16/56-cell boards, all four classic seats, real movement and 64px controls in12 bilingual/device layouts`;
 }finally{await P.ctx.close();}
}
