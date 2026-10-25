import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import { launch, open, clear, noWelcome } from './harness.mjs';
import type { Page } from 'playwright';

const out=new URL('../docs/v1.02-orchard-arcade/shots/',import.meta.url);
const flags={tester:{on:false},newGames:{on:true},sparkleorchard_tester:{on:true},sparkleorchard_single:{on:true},sparkleorchard_multi:{on:true},sparklefruitbar_tester:{on:true},sparklefruitbar_single:{on:true},sparklefruitbar_multi:{on:true}};
async function eligibility(page:Page,on:boolean){await page.evaluate(async on=>{const C=(await import(String('/js/custom.js'))).CUSTOM;C.releases.tester={on};localStorage.setItem('sv2_tester',JSON.stringify({at:Date.now()}));if(!localStorage.getItem('sv2_playerid'))localStorage.setItem('sv2_playerid','arcadefixture01');},on);}
async function play(page:Page){await page.evaluate(()=>{void (window.__sv as unknown as {playGame(i:number,id:string,source:string):Promise<void>}).playGame(0,'sparkleorchard','replay');});}
async function closeGame(page:Page){if(await page.locator('.gl-win').count()){if(await page.locator('.gl-next').count()){await page.locator('.gl-win.ask').waitFor();await page.locator('.gl-win').click({position:{x:20,y:20}});}await page.locator('.gl').waitFor({state:'detached'});return;}const b=page.locator('.gl .gl-x');if(await b.count())await b.click();await page.locator('.gl').waitFor({state:'detached'});}
async function hold(page:Page){const b=page.locator('[data-bar-gate]');await b.waitFor();await b.scrollIntoViewIfNeeded();const box=await b.boundingBox();assert.ok(box);await page.mouse.move(box.x+box.width/2,box.y+box.height/2);await page.mouse.down();await page.waitForTimeout(1800);await page.mouse.up();}
async function nextNeeded(page:Page){return page.locator('.arcade-center .arcade-art').last().locator('svg').getAttribute('data-art');}
async function completeOrchard(page:Page){
 for(let moves=0;moves<35; moves++){
  if(await page.locator('.gl-win').count())return;
  await page.waitForFunction(()=>!!document.querySelector('.gl-win')||!!document.querySelector<HTMLButtonElement>('[data-orchard-stop]:not(:disabled)'));if(await page.locator('.gl-win').count())return;
  // Pick an actual not-yet-found mission picture by comparing the original SVG drawings.
  const target=await page.locator('.arcade-mission > span:not(.found)').first().innerHTML();
  const index=await page.locator('[data-cell]').evaluateAll((cells,target)=>cells.findIndex(c=>c.querySelector('.arcade-art')?.innerHTML===target),target);
  assert.ok(index>=0);
  for(let n=0;n<16&&Number(await page.locator('.orchard').getAttribute('data-position'))!==index;n++)await page.locator('[data-orchard-change]').click();
  await page.locator('[data-orchard-stop]').click();await page.waitForTimeout(70);
 }
 throw Error('Orchard mission did not complete through real controls');
}
export async function orchardFruitBarBrowser(){
 const capturesOnly=process.argv.includes('--captures-only');
 await fs.mkdir(out,{recursive:true});const browser=await launch(),notes:unknown[]=[];
 try{
  const P=await open(browser,{w:390,h:844,touch:true,settings:{countPlayers:false,online:false,calm:true},route:async ctx=>{
   await ctx.route('**/api/**',r=>r.fulfill({json:{}}));await ctx.route('**/content/custom.json*',r=>r.fulfill({json:{releases:flags}}));
  }});await clear(P.page);await noWelcome(P.page);
  await eligibility(P.page,false);await play(P.page);await P.page.waitForTimeout(250);assert.equal(await P.page.locator('.gl').count(),0);
  await P.page.evaluate(async()=>{(await import(String('/js/games/sparklefruitbar.js'))).openFruitBar();});assert.equal(await P.page.locator('.parent-arcade').count(),0);
  notes.push({nonTesterCannotOpenEither:true});await eligibility(P.page,true);
  if(process.argv.includes('--allocations-only')){
   for(const [device,w,h]of[['phone',390,844],['tablet',820,1180],['computer',1280,800]]as const)for(const lang of['en','vi']){
    await P.page.setViewportSize({width:w,height:h});await P.page.evaluate(async lang=>{const S=await import(String('/js/state.js'));S.settings.lang=lang;(await import(String('/js/i18n.js'))).applyLang();},lang);
    await P.page.evaluate(async()=>{(await import(String('/js/games/sparklefruitbar.js'))).openFruitBar();});await hold(P.page);await P.page.locator('[data-bar-mode="2"]').click();assert.equal(await P.page.locator('[data-bar-bet]').count(),8);
    await P.page.locator('.arcade-allocations').scrollIntoViewIfNeeded();await P.page.screenshot({path:new URL(`${device}-${lang}-parent-allocations.png`,out).pathname});
    await P.page.locator('[data-bar-ready]').scrollIntoViewIfNeeded();const bounds=await P.page.locator('.parent-arcade .x,[data-bar-ready]').evaluateAll(bs=>bs.map(b=>{const r=b.getBoundingClientRect();return{w:r.width,h:r.height,top:r.top,bottom:r.bottom};}));assert.ok(bounds.every(r=>r.w>=44&&r.h>=44&&r.top>=0&&r.bottom<=h),`accessible parent footer and fixed close ${device}-${lang}`);const separated=await P.page.evaluate(()=>document.querySelector('.parent-arcade .x')!.getBoundingClientRect().bottom<=document.querySelector('.parent-arcade .arcade')!.getBoundingClientRect().top+1);assert.equal(separated,true,'Close has its own row and cannot cover allocation fields');
    await P.page.screenshot({path:new URL(`${device}-${lang}-parent-actions.png`,out).pathname});await P.page.locator('[data-bar-bet="0"]').fill('10');await P.page.locator('[data-bar-bet="0"]').press('Tab');await P.page.locator('[data-bar-ready]').click();await P.page.locator('[data-bar-bet="1"]').fill('20');await P.page.locator('[data-bar-bet="1"]').press('Tab');await P.page.locator('[data-bar-ready]').click();await P.page.locator('.arcade-adult[data-phase=result]').waitFor();await P.page.waitForTimeout(1900);const stable=await P.page.evaluate(()=>{const body=document.querySelector('.parent-arcade .arcade')!,button=document.querySelector('[data-bar-next]')!;const r=button.getBoundingClientRect();return{scroll:body.scrollTop,buttonVisible:r.top>=0&&r.bottom<=innerHeight};});assert.deepEqual(stable,{scroll:0,buttonVisible:true},'results reset the body and keep the primary action visible');await P.page.screenshot({path:new URL(`${device}-${lang}-parent-bar.png`,out).pathname});await P.page.locator('.parent-arcade .x').click();notes.push({device,lang,parentAllocationFields:8,parentFooterAccessible:true,closeStaysVisible:true,closeOutsideScrollBody:true,actualRoundCompletes:true});
   }assert.deepEqual(P.errors,[]);await P.ctx.close();return;
  }
  if(process.argv.includes('--parent-entry-only')){
   await P.page.evaluate(async()=>{(await import(String('/js/state.js'))).settings.calm=false;});const before=await P.page.evaluate(()=>window.__sv.paused);await P.page.evaluate(async()=>{const M=await import(String('/js/games/sparklefruitbar.js'));M.openFruitBar();M.openFruitBar();});assert.equal(await P.page.locator('.parent-arcade').count(),1);assert.equal(await P.page.locator('[data-bar-bet]').count(),0);await hold(P.page);await P.page.locator('[data-bar-mode="1"]').click();await P.page.locator('[data-bar-bet="0"]').fill('10');await P.page.locator('[data-bar-bet="0"]').press('Tab');await P.page.locator('[data-bar-ready]').click();await P.page.locator('.arcade-adult[data-phase=result]').waitFor();assert.equal(await P.page.locator('[data-bar-next]').isDisabled(),true,'primary action waits for the light to finish');await P.page.waitForFunction(()=>!document.querySelector<HTMLButtonElement>('[data-bar-next]')?.disabled);await P.page.locator('.parent-arcade .x').click();assert.equal(await P.page.evaluate(()=>window.__sv.paused),before);assert.deepEqual(P.errors,[]);notes.push({parentEntryDeduplicates:true,parentGateAndRoundComplete:true,normalLightAnimationFinishes:true,pauseStateRestored:true});
   await P.page.evaluate(async()=>{const w=window as any;w.__lateArcadeSubscriptions=0;w.__lateArcadeLeaves=0;(await import(String('/js/games/sparklefruitbar.js'))).openFruitBar({mine:0,names:['A','B'],seed:'close-during-hold',move:()=>{},onMove:()=>{w.__lateArcadeSubscriptions++;return()=>{};},leave:()=>{w.__lateArcadeLeaves++;}});});
   const gate=await P.page.locator('[data-bar-gate]').boundingBox();assert.ok(gate);await P.page.mouse.move(gate.x+gate.width/2,gate.y+gate.height/2);await P.page.mouse.down();await P.page.waitForTimeout(100);
   // A second touch / shared Close action can close the window while the first hold is still active.
   await P.page.locator('.parent-arcade .x').dispatchEvent('click');await P.page.waitForTimeout(1900);await P.page.mouse.up();
   const late=await P.page.evaluate(()=>({subscriptions:(window as any).__lateArcadeSubscriptions,leaves:(window as any).__lateArcadeLeaves,paused:window.__sv.paused}));assert.deepEqual(late,{subscriptions:0,leaves:1,paused:before});notes.push({closingDuringHoldCannotStartHiddenOnlineSession:true});await P.ctx.close();return;
  }
  if(process.argv.includes('--input-only')){
   await play(P.page);await P.page.locator('[data-orchard-mode=solo]').click();await P.page.keyboard.press('Space');await P.page.waitForFunction(()=>Number(document.querySelector('.orchard')?.getAttribute('data-moves'))===1);
   await P.page.evaluate(()=>{const w=window as any;w.__orchardPad=true;Object.defineProperty(navigator,'getGamepads',{configurable:true,value:()=>[{id:'Synthetic Orchard controller',index:0,connected:true,mapping:'standard',timestamp:0,axes:[0,0,0,0],buttons:Array.from({length:16},(_,i)=>({pressed:i===0&&w.__orchardPad,touched:false,value:i===0&&w.__orchardPad?1:0}))}]});});await P.page.waitForFunction(()=>Number(document.querySelector('.orchard')?.getAttribute('data-moves'))===2);await P.page.evaluate(()=>{(window as any).__orchardPad=false;});
   notes.push({orchardKeyboardFromModeChoice:true,orchardControllerStop:true});assert.deepEqual(P.errors,[]);await closeGame(P.page);await P.ctx.close();return;
  }
  await play(P.page);await P.page.locator('[data-orchard-mode=local]').click();await completeOrchard(P.page);await P.page.locator('.gl-win').waitFor();await closeGame(P.page);
  notes.push({orchardLocalCoopCompletes:true});
  for(const [device,w,h]of[['phone',390,844],['tablet',820,1180],['computer',1280,800]]as const)for(const lang of['en','vi']){
   await P.page.setViewportSize({width:w,height:h});await P.page.evaluate(async lang=>{const S=await import(String('/js/state.js'));S.settings.lang=lang;(await import(String('/js/i18n.js'))).applyLang();},lang);
   await play(P.page);await P.page.locator('[data-orchard-mode=solo]').click();await P.page.waitForTimeout(400);
   const bounds=await P.page.locator('.orchard button').evaluateAll(bs=>bs.map(b=>{const r=b.getBoundingClientRect();return{top:r.top,bottom:r.bottom};}));assert.ok(bounds.every(r=>r.top>=0&&r.bottom<=h),`visible controls ${device}-${lang}: ${JSON.stringify(bounds)}`);
   const sizes=await P.page.locator('.orchard button').evaluateAll(bs=>bs.map(b=>b.getBoundingClientRect().height));assert.ok(sizes.every(n=>n>=64));
   await P.page.screenshot({path:new URL(`${device}-${lang}-orchard.png`,out).pathname});await closeGame(P.page);
   await P.page.evaluate(async()=>{const M=await import(String('/js/games/sparklefruitbar.js'));M.openFruitBar();M.openFruitBar();});assert.equal(await P.page.locator('.parent-arcade').count(),1,'double opening cannot stack parent windows');assert.equal(await P.page.locator('[data-bar-bet]').count(),0);await hold(P.page);await P.page.locator('[data-bar-mode="2"]').click();
   await P.page.locator('[data-bar-bet="0"]').fill('10');await P.page.locator('[data-bar-bet="0"]').press('Tab');await P.page.locator('[data-bar-ready]').click();
   await P.page.locator('[data-bar-bet="1"]').fill('20');await P.page.locator('[data-bar-bet="1"]').press('Tab');await P.page.locator('[data-bar-ready]').click();await P.page.locator('.arcade-adult[data-phase=result]').waitFor();await P.page.waitForTimeout(1900);
   await P.page.screenshot({path:new URL(`${device}-${lang}-parent-bar.png`,out).pathname});
   await P.page.locator('[data-bar-next]').click();await P.page.locator('.arcade-adult[data-phase=allocate]').waitFor();await P.page.locator('.parent-arcade .x').click();await P.page.locator('.parent-arcade').waitFor({state:'detached'});
  }
  notes.push({bilingualDeviceCaptures:12,parentGateBeforeControls:true,parentLocalSharedRound:true});
  if(capturesOnly){assert.deepEqual(P.errors,[]);await P.ctx.close();return;}
  await play(P.page);await P.page.locator('[data-orchard-mode=npc]').click();await completeOrchard(P.page);await closeGame(P.page);notes.push({orchardNpcCompletes:true});
  const Q=await open(browser,{w:820,h:1180,settings:{countPlayers:false,online:false,calm:true},route:async ctx=>{await ctx.route('**/api/**',r=>r.fulfill({json:{}}));await ctx.route('**/content/custom.json*',r=>r.fulfill({json:{releases:flags}}));}});await clear(Q.page);await noWelcome(Q.page);await eligibility(Q.page,true);
  // Real createNetGames identity/session/invitation messages, relayed between two isolated browser pages.
  for(const [here,there]of[[P,Q],[Q,P]])await here.page.exposeFunction('__arcadeSend',async data=>there.page.evaluate(async packet=>(window as any).__arcadeNet.receive(packet),data));
  for(const [mine,dev]of[P,Q].entries())await dev.page.evaluate(async mine=>{
   const {createNetGames}=await import(String('/js/netgames.js'));const w=window as any;const id=mine?'guest':'host',other=mine?'host':'guest';w.__arcadeConnected=true;
   const g=createNetGames({net:{ids:()=>[other],send:data=>{void w.__arcadeSend({...data,from:id});}},me:()=>id,waitMs:1000,onAsk:d=>g.answer(d,true),onStart:s=>{if(!s)return;const online={mine:s.mine,names:['Parent A','Parent B'],seed:s.gid,move:(n,v)=>g.move(n,v),onMove:f=>g.onMove(f),connected:()=>w.__arcadeConnected,present:()=>w.__arcadeConnected,leave:()=>g.leave()};if(s.game==='sparklefruitbar')void import(String('/js/games/sparklefruitbar.js')).then(m=>m.openFruitBar(online));else void w.__sv.playGameOnline(s.game,1,online);}});w.__arcadeNet=g;
  },mine);
  await P.page.evaluate(()=>(window as any).__arcadeNet.invite('sparkleorchard',1,'guest'));
  for(const d of[P,Q])await d.page.locator('.orchard[data-mode=online]').waitFor();
  for(let move=0;move<6;move++){
   if(await P.page.locator('.gl-win').count())break;const dev=move%2===0?P:Q;
   const target=await dev.page.locator('.arcade-mission > span:not(.found)').first().innerHTML();const index=await dev.page.locator('[data-cell]').evaluateAll((cells,target)=>cells.findIndex(c=>c.querySelector('.arcade-art')?.innerHTML===target),target);
   for(let i=0;i<16&&Number(await dev.page.locator('.orchard').getAttribute('data-position'))!==index;i++)await dev.page.locator('[data-orchard-change]').click();
   const before=Number(await dev.page.locator('.orchard').getAttribute('data-moves'));await dev.page.locator('[data-orchard-stop]').click();
   await Promise.all([P,Q].map(d=>d.page.waitForFunction(n=>Number(document.querySelector('.orchard')?.getAttribute('data-moves'))>n,before)));
  }
  for(const dev of[P,Q]){await dev.page.locator('.gl-win').waitFor();await closeGame(dev.page);await dev.page.evaluate(()=>(window as any).__arcadeNet.leave());}
  notes.push({orchardTwoBrowserSharedCompletion:true});
  await P.page.evaluate(()=>(window as any).__arcadeNet.invite('sparkleorchard',1,'guest'));await Q.page.locator('.orchard[data-mode=online]').waitFor();await Q.page.evaluate(()=>{(window as any).__arcadeConnected=false;});
  await Q.page.locator('[data-orchard-continue]').waitFor({timeout:40000});await Q.page.locator('[data-orchard-continue]').click();await Q.page.locator('.orchard[data-mode=npc]').waitFor();await completeOrchard(Q.page);await closeGame(Q.page);await closeGame(P.page);
  for(const d of[P,Q])await d.page.evaluate(()=>(window as any).__arcadeNet.leave());await Q.page.evaluate(()=>{(window as any).__arcadeConnected=true;});notes.push({orchardGuestNpcContinuationCompletes:true});
  const before=await P.page.evaluate(()=>localStorage.getItem('sv2_profiles'));
  await P.page.evaluate(()=>(window as any).__arcadeNet.invite('sparklefruitbar',1,'guest'));
  for(const d of[P,Q])await hold(d.page);
  for(const d of[P,Q]){await d.page.locator('[data-bar-bet="0"]').fill('10');await d.page.locator('[data-bar-bet="0"]').press('Tab');await d.page.locator('[data-bar-ready]').click();}
  for(const d of[P,Q])await d.page.locator('.arcade-adult[data-phase=result]').waitFor();
  assert.equal(await P.page.locator('.arcade-players').innerText(),await Q.page.locator('.arcade-players').innerText());
  assert.equal(await P.page.evaluate(()=>localStorage.getItem('sv2_profiles')),before,'adult arcade never writes child saves');
  await Q.page.evaluate(()=>{(window as any).__arcadeConnected=false;});await Q.page.waitForTimeout(1700);assert.match(await Q.page.locator('.arcade-status').innerText(),/Waiting|chờ/);
  await Q.page.evaluate(()=>{(window as any).__arcadeConnected=true;});await Q.page.waitForTimeout(1700);assert.equal(await Q.page.locator('.arcade-adult').count(),1);
  notes.push({parentTwoBrowserSharedResult:true,parentNoChildSaveWrites:true,parentTemporaryDisconnectRetained:true});
  for(const d of[P,Q]){await d.page.locator('.parent-arcade .x').click();assert.deepEqual(d.errors,[]);await d.ctx.close();}
 }finally{await browser.close();await fs.writeFile(new URL(process.argv.includes('--allocations-only')?'../docs/v1.02-orchard-arcade/allocations-results.json':process.argv.includes('--parent-entry-only')?'../docs/v1.02-orchard-arcade/parent-entry-results.json':process.argv.includes('--input-only')?'../docs/v1.02-orchard-arcade/input-results.json':capturesOnly?'../docs/v1.02-orchard-arcade/capture-results.json':'../docs/v1.02-orchard-arcade/browser-results.json',import.meta.url),JSON.stringify(notes,null,2)+'\n');}
 console.log(JSON.stringify(notes));
}
await orchardFruitBarBrowser();
