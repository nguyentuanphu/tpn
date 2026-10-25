// Read-only release observations with synthetic profiles; no real reports or family data.
import fs from 'node:fs/promises';
import { launch, open, clear, noWelcome } from '../../tests/harness.mjs';
import { initialState, applyMove, legalMoves, rollDice } from '../../js/games/cacuangua-core.ts';
import { createAuthoritativeState, applyAuthoritativeMove } from '../../js/games/multiplayer-foundations.ts';

const out=new URL('./',import.meta.url);await fs.mkdir(new URL('shots/',out),{recursive:true});
const findings={source:'helper 59fe48fd plus Release metadata/catalog/privacy fixes',observations:{},layouts:[]};
const state=initialState('full',2);state.dice=[1];state.pendingMove=true;
let illegalAccepted=false;try{illegalAccepted=applyMove(state,0,0).players[state.turn].horses[0].pos===0;}catch{}
findings.observations.horseIllegalLaunch={legalMoves:legalMoves(state).length,accepted:illegalAccepted};
findings.observations.horseEmptyStableRolls=Array.from({length:4},(_,turn)=>rollDice({...initialState('full',2),turn:turn%2}));
findings.observations.futureMoveAccepted=applyAuthoritativeMove(createAuthoritativeState('snakes',2),0,9999,3);

const browser=await launch();
try{
 const P=await open(browser,{w:390,h:844,touch:true,lang:'vi',settings:{countPlayers:false,online:false},route:async ctx=>{
  await ctx.route('**/api/**',r=>r.fulfill({json:{releases:{tester:{on:false}}}}));
  await ctx.route('**/content/custom.json*',r=>r.fulfill({json:{releases:{newGames:{on:true},newStories:{on:true},tester:{on:false},sparkleFruitParade_single:{on:false},sparkleFruitParade_multi:{on:false},sparkleFruitParade_tester:{on:true}}}}));
 }});
 await clear(P.page);await noWelcome(P.page);
 await P.page.evaluate(async()=>{const S=await import('/js/state.js');S.profiles.forEach(p=>p.unlockAll=true);});
 findings.observations.fruitPreview=await P.page.evaluate(async()=>({tester:!!window.__sv.tester,hidden:(await import('/js/content/activities.js')).gameInfo('fruitparade').hidden}));
 const show=async id=>{
  await P.page.evaluate(()=>document.querySelector('.gl .gl-x')?.click());
  await P.page.locator('.gl').waitFor({state:'detached'});
  await clear(P.page);
  await P.page.evaluate(id=>{window.__sv.heroes[0].profile.age=id==='cacuangua'?'big':'little';void window.__sv.playGame(0,id,'replay');},id);
  await P.page.locator('.gl').waitFor();await P.page.waitForTimeout(600);
 };
 await show('fruitparade');await P.page.locator('[data-mode="npc"]').click();await P.page.locator('.fruit-stop').first().click();await P.page.waitForTimeout(3000);
 findings.observations.fruitNpc=await P.page.evaluate(()=>({buttons:[...document.querySelectorAll('.fruit-stop')].map(b=>({disabled:b.disabled,height:b.getBoundingClientRect().height})),progress:document.querySelector('.fruit-progress i').style.width,lanes:document.querySelectorAll('.fruit-lane').length}));
 await P.page.screenshot({path:new URL('shots/fruit-npc-stuck.png',out).pathname});
 await show('nemcon');
 const before=await P.page.locator('.choices').count();await P.page.locator('.choices button').nth(1).click();await P.page.waitForTimeout(1200);
 findings.observations.throwCentre=await P.page.evaluate(before=>({groupsBefore:before,groupsAfter:document.querySelectorAll('.choices').length,gameStillOpen:!!document.querySelector('.gl')}),before);
 await P.page.screenshot({path:new URL('shots/throw-centre-repeats.png',out).pathname});
 const ids=['meochuot','cuopco','keocua','danhdao','nemcon','trongnu','duathuyen','fruitparade','cacuangua'];
 for(const [device,w,h] of [['phone',390,844],['tablet',820,1180],['computer',1280,800]])for(const lang of ['en','vi']){
  await P.page.setViewportSize({width:w,height:h});
  await P.page.evaluate(async lang=>{const S=await import('/js/state.js');S.settings.lang=lang;(await import('/js/i18n.js')).applyLang();},lang);
  for(const id of ids){
   await show(id);
   const geometry=await P.page.evaluate(()=>({horizontalOverflow:document.documentElement.scrollWidth>innerWidth+1,buttons:[...document.querySelectorAll('.gl-stage button,.fruit-choice button,.ccn-root button')].map(b=>({text:(b.textContent||'').slice(0,40),w:b.getBoundingClientRect().width,h:b.getBoundingClientRect().height}))}));
   findings.layouts.push({device,lang,id,...geometry});
   await P.page.screenshot({path:new URL(`shots/${device}-${lang}-${id}.png`,out).pathname});
  }
 }
 findings.pageErrors=P.errors;await P.ctx.close();
}catch(error){findings.error=String(error);process.exitCode=1;}
finally{await browser.close();}
await fs.writeFile(new URL('observations.json',out),JSON.stringify(findings,null,2)+'\n');
console.log(JSON.stringify({observations:findings.observations,screenshots:findings.layouts.length+2,pageErrors:findings.pageErrors}));
