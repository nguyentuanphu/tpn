import assert from 'node:assert/strict';import fs from 'node:fs/promises';import type {Browser} from 'playwright';
import {open,clear,noWelcome} from './harness.mjs';
export async function horseStabilityCheck(browser:Browser){
 const P=await open(browser,{w:390,h:844,touch:true,settings:{voice:false,sound:false,autoPack:false,online:false,countPlayers:false}});
 P.page.on('framenavigated',frame=>{if(!frame.parentFrame())console.log('horse navigation',frame.url());});
 P.page.on('console',m=>{if(/context|GPU|reload/i.test(m.text()))console.log('horse renderer',m.type(),m.text().slice(0,240));});
 try{await clear(P.page);await noWelcome(P.page);await fs.mkdir('out/horse-stability',{recursive:true});
 const settled=async()=>{await P.page.waitForFunction(()=>!document.querySelector('.horse-race .sv-press,.horse-race .sv-spring'));};
 const rects=()=>P.page.locator('.horse-board,[data-horse-roll]').evaluateAll(nodes=>nodes.map(e=>{const r=e.getBoundingClientRect();return{x:r.x,y:r.y,w:r.width,h:r.height};}));
 for(const [device,w,h]of [['phone',390,844],['tablet',820,1180],['computer',1280,850]]as const)for(const lang of ['en','vi']){
  console.log('horse stability',device,lang);
  await P.page.setViewportSize({width:w,height:h});await P.page.evaluate(async lang=>{const G=window.__sv as any;(await import(String('/js/state.js'))).settings.lang=lang;G.heroes[0].profile.age=lang==='en'?'little':'big';void G.playGame(0,'cacuangua','replay');},lang);
  await P.page.locator('.horse-race').waitFor();await P.page.locator('.horse-settings-box').evaluate((d:HTMLDetailsElement)=>{d.open=true;});await P.page.locator('.horse-settings input').uncheck();await P.page.locator('.horse-settings button').click();await P.page.locator('.horse-settings-box').evaluate((d:HTMLDetailsElement)=>{d.open=false;});await settled();
  const before=await rects();
  for(let k=0;k<18;k++){
   const choice=P.page.locator('.horse-moves button:not([disabled])').first();if(await choice.count())await choice.click();else await P.page.locator('[data-horse-roll]').click();await settled();
   const after=await rects();for(let i=0;i<2;i++)for(const dim of ['x','y','w','h']as const)assert.ok(Math.abs(after[i][dim]-before[i][dim])<1.1,`${device}/${lang} ${i?'die':'board'} ${dim} moved: ${JSON.stringify({before,after})}`);
  }
  const colours=await P.page.locator('.horse-stable svg,.horse-token svg').evaluateAll(nodes=>nodes.map(n=>n.innerHTML));assert.ok(colours.some(s=>s.includes('#cf475c'))&&colours.some(s=>s.includes('#347fbd')),'horses show team coat colours');
  await P.page.screenshot({path:`out/horse-stability/${device}-${lang}.png`});await P.page.locator('.gl .gl-x').click();await P.page.locator('.gl').waitFor({state:'detached'});
 }
 assert.deepEqual(P.errors,[]);return'board and die stay fixed through108 real roll/move actions in six EN/VI layouts; larger horses show team colours';
 }finally{await P.ctx.close();}
}
