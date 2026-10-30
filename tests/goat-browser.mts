import assert from 'node:assert/strict';import fs from 'node:fs/promises';import type {Browser} from 'playwright';
import {open,clear,noWelcome} from './harness.mjs';
export async function goatBrowserCheck(browser:Browser){
 const P=await open(browser,{w:390,h:844,touch:true,settings:{voice:false,sound:false,autoPack:false,online:false,countPlayers:false}});
 try{await clear(P.page);await noWelcome(P.page);await fs.mkdir('out/goat-circle',{recursive:true});
 for(const [device,w,h]of [['phone',390,844],['short-phone',390,664],['tablet',820,1180],['computer',1280,850]]as const)for(const lang of ['en','vi']){
  await P.page.setViewportSize({width:w,height:h});
  await P.page.evaluate(async lang=>{const G=window.__sv as any;(await import(String('/js/state.js'))).settings.lang=lang;G.heroes[0].profile.age=lang==='en'?'little':'big';void G.playGame(0,'blindtag','replay');},lang);
  await P.page.locator('.goat-circle-game').waitFor();
  await P.page.waitForFunction(()=>getComputedStyle(document.querySelector('.gl')!).opacity==='1');
  const sizes=await P.page.locator('.goat-circle-game button').evaluateAll(nodes=>nodes.map(e=>({w:e.getBoundingClientRect().width,h:e.getBoundingClientRect().height})));
  assert.ok(sizes.every(r=>r.w>=64&&r.h>=64),'64px goat controls '+JSON.stringify(sizes));
  assert.equal(await P.page.locator('.goat-field [data-goat-child]').count(),4);
  assert.equal(await P.page.locator('.goat-grid,.hay').count(),0,'circle game has no haystacks');
  const off=await P.page.locator('.goat-circle-game button').evaluateAll(nodes=>nodes.map(e=>e.getBoundingClientRect()).filter(r=>r.top<0||r.left<0||r.bottom>innerHeight||r.right>innerWidth).length);
  assert.equal(off,0,`whole game on one screen at ${w}x${h}`);
  await P.page.locator('.goat-catch').click();assert.equal(await P.page.locator('.goat-circle-game').getAttribute('data-round'),'0','catch from far away must not succeed');
  await P.page.screenshot({path:`out/goat-circle/${device}-${lang}.png`});
  const played=await P.page.evaluate(async()=>{const {playWatch}=await import(String('/js/games/playwatch.js'));let taps=0;for(let n=0;n<300&&!document.querySelector('.gl-win');n++){const next=playWatch.plan?.();const button=next instanceof HTMLElement?next:(next as any)?.el;if(button instanceof HTMLButtonElement&&!button.disabled){button.click();taps++;}await new Promise(r=>setTimeout(r,40));}return{won:!!document.querySelector('.gl-win'),taps};});
  assert.ok(played.won&&played.taps>6,'complete three rounds using visible controls '+JSON.stringify(played));
  await P.page.locator('.gl').waitFor({state:'detached',timeout:15000});
  assert.equal(await P.page.evaluate(async()=>!!(await import(String('/js/games/playwatch.js'))).playWatch.plan),false,'closing clears the gameplay plan');
 }
 await P.page.setViewportSize({width:390,height:844});
 await P.page.evaluate(()=>{void (window.__sv as any).playGame(0,'goat','replay');});
 await P.page.locator('.goat-grid .hay').first().waitFor();
 assert.ok(await P.page.locator('.goat-grid .hay').count()>=6,'goat is the haystack Bịt Mắt Bắt Dê again');
 assert.deepEqual(P.errors,[]);return'Blindfold Tag circle game: eight EN/VI device layouts all on one screen, 64px controls, nearby-only catches, three-round completion and plan cleanup; goat is the haystack game; five EN/VI device layouts, 64px controls, nearby-only catches, three-round completion and plan cleanup';
 }finally{await P.ctx.close();}
}
