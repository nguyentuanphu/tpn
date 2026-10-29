import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import type {Browser,Page} from 'playwright';
import {open,clear,noWelcome} from './harness.mjs';

const fruitIds=['fruitparade','sparkleorchard','sparklefruitbar'];
const flags={tester:{on:true},newGames:{on:true},newStories:{on:true},unlockAll:{on:true},sparkleFruitParade_tester:{on:true},sparkleFruitParade_single:{on:false},sparkleFruitParade_multi:{on:false},sparkleorchard_tester:{on:true},sparkleorchard_single:{on:false},sparkleorchard_multi:{on:false},sparklefruitbar_tester:{on:true},sparklefruitbar_single:{on:false},sparklefruitbar_multi:{on:false}};
const position=(page:Page)=>page.locator('.sp-scroll').evaluate(e=>({top:e.scrollTop,left:e.scrollLeft}));
const samePosition=async(page:Page,before:{top:number;left:number},what:string)=>{
 const after=await position(page);for(const axis of['top','left']as const)assert.ok(Math.abs(after[axis]-before[axis])<2,`${what}: ${axis} changed ${before[axis]} → ${after[axis]}`);
};
const inView=async(page:Page,id:string)=>page.evaluate(id=>(window.__sv as any).simple.view.stops.includes(id),id);
const card=async(page:Page,id:string)=>{
 const k=await page.evaluate(id=>(window.__sv as any).simple.view.stops.indexOf(id),id);assert.ok(k>=0,id+' must be available');return page.locator(`.simple-screen .sp-stop[data-k="${k}"]`);
};

export async function simpleReturnFruitCheck(browser:Browser){
 let answerLive!:()=>void;const delayedLive=new Promise<void>(resolve=>{answerLive=resolve;});
 const P=await open(browser,{w:390,h:844,touch:true,screen:'simple',settings:{voice:false,sound:false,autoPack:false,online:false,countPlayers:false},pre:()=>{
  localStorage.setItem('sv2_playerid','simplefixture01');localStorage.setItem('sv2_tester',JSON.stringify({at:1}));
 },route:async ctx=>{
  await ctx.route('**/api/**',r=>r.fulfill({json:{}}));
  await ctx.route('**/api/live',async r=>{await delayedLive;await r.fulfill({json:{content:{activities:{memory:{hide:true}}}}});});
  await ctx.route('**/content/custom.json',r=>r.fulfill({json:{releases:flags}}));
 }});
 try{
  await clear(P.page);await noWelcome(P.page);await P.page.locator('.simple-screen:not([hidden]) .sp-stop').first().waitFor();
  await P.page.evaluate(()=>{(window.__sv as any).tester?.unmount();});
  for(const id of fruitIds)assert.equal(await inView(P.page,id),true,'all three tester previews appear while mode switches are off');
  assert.equal(await inView(P.page,'memory'),true);
  await P.page.locator('.sp-scroll').evaluate(e=>{e.scrollTop=900;});const livePosition=await position(P.page);assert.ok(livePosition.top>100);
  answerLive();await P.page.waitForFunction(()=>!(window.__sv as any).simple.view.stops.includes('memory'));
  await samePosition(P.page,livePosition,'late Studio content response');
  // Local agreement arrives after the first Simple draw. No tab switch or resize may be needed.
  for(const accepted of[false,true]){
   await P.page.evaluate(accepted=>{localStorage.setItem('sv2_tester',JSON.stringify({at:accepted?1:0}));},accepted);
   await P.page.waitForFunction(accepted=>(window.__sv as any).simple.view.stops.includes('sparkleorchard')===accepted,accepted);
   await samePosition(P.page,livePosition,'tester agreement refresh');
  }
  // Preview and requested-mode paths stay tester-only; explicit all-off and global off hide it.
  for(const state of[
   {preview:false,single:false,tester:true,visible:false},
   {preview:false,single:true,tester:true,visible:true},
   {preview:false,single:true,tester:false,visible:false},
   {preview:true,single:false,tester:true,visible:true}
  ]){
   await P.page.evaluate(async state=>{const C=(await import(String('/js/custom.js'))).CUSTOM;C.releases.tester={on:state.tester};C.releases.sparkleorchard_tester={on:state.preview};C.releases.sparkleorchard_single={on:state.single};},state);
   await P.page.waitForFunction(visible=>(window.__sv as any).simple.view.stops.includes('sparkleorchard')===visible,state.visible);
   await samePosition(P.page,livePosition,'Studio preview/mode refresh');
  }
  await fs.mkdir('out/simple-return-fruit',{recursive:true});
  const captures:string[]=[];
  for(const[device,w,h]of[['phone',390,844],['tablet',820,1180],['computer',1280,800],['phone-wide',844,390]]as const)for(const lang of['en','vi']){
   await P.page.setViewportSize({width:w,height:h});
   await P.page.evaluate(async lang=>{(await import(String('/js/state.js'))).settings.lang=lang;(window.__sv as any).simple.show('games');},lang);
   await P.page.waitForTimeout(80);
   const game=await card(P.page,'hopscotch');await game.scrollIntoViewIfNeeded();const gamePosition=await position(P.page);assert.ok(device==='phone-wide'?gamePosition.left>100:gamePosition.top>100,'fixture starts far down the actual games path');
   await game.click();await P.page.locator('.gl[data-game-id=hopscotch]').waitFor();await P.page.locator('.gl .gl-x').click();await P.page.locator('.gl').waitFor({state:'detached'});
   await P.page.waitForFunction(()=>!(window.__sv as any).simple.busy);await samePosition(P.page,gamePosition,`${device}/${lang} game return`);
   assert.equal(await P.page.evaluate(()=>(window.__sv as any).simple.tab),'games');
   await P.page.screenshot({path:`out/simple-return-fruit/${device}-${lang}-game.png`});
   await P.page.locator('.sp-tabs [data-tab=tales]').click();assert.deepEqual(await position(P.page),{top:0,left:0},'an intentional tab change starts its own path at the top');
   const story=await card(P.page,'tiddalik');await story.scrollIntoViewIfNeeded();const storyPosition=await position(P.page);assert.ok(device==='phone-wide'?storyPosition.left>100:storyPosition.top>100,'story fixture also starts far from the top');
   await story.click();await P.page.locator('.theatre').waitFor();await P.page.locator('.theatre .th-x').click();await P.page.locator('.theatre').waitFor({state:'detached'});
   await P.page.waitForFunction(()=>!(window.__sv as any).simple.busy);await samePosition(P.page,storyPosition,`${device}/${lang} story return`);
   assert.equal(await P.page.evaluate(()=>(window.__sv as any).simple.tab),'tales');
   await P.page.screenshot({path:`out/simple-return-fruit/${device}-${lang}-story.png`});captures.push(device+'/'+lang);
  }
  assert.deepEqual(P.errors,[]);return`all three invited fruit previews; consent/global/mode gates and late Studio refresh; game/story return keeps both scroll axes in ${captures.length} device/language layouts; intentional tabs reset`;
 }finally{answerLive();await P.ctx.close();}
}
