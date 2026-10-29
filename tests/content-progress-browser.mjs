import {contentEvidence} from './content-evidence.mjs';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {open} from './harness.mjs';
const folder='../docs/studio-content-website-20261029';
export async function contentProgressCheck(browser){
 const provenance=contentEvidence(browser,['js/main.ts','js/games/art-pad.ts','js/games/frame.ts']);
 const P=await open(browser,{w:390,h:844,touch:true,lang:'vi'}),page=P.page;
 try{
  const before=await page.evaluate(async()=>{
   const C=await import('/js/custom.js'),U=await import('/js/content/unlocks.js'),S=await import('/js/state.js');C.CUSTOM.releases={newGames:{on:true}};
   const p=__sv.heroes[0].profile;for(const id of U.FIRST_SET_GAMES.art)p.wins[id]=3;
   return {wins:p.wins.nonla||0,album:p.album?.length||0,coins:S.farm.coins};
  });
  await page.evaluate(()=>{window.artProgressDone=false;__sv.playGame(0,'nonla','art-check').then(()=>window.artProgressDone=true);});
  await page.waitForSelector('.artpad-row button');const c=page.locator('.artpad canvas');await c.focus();for(let i=0;i<12;i++){await page.keyboard.press('ArrowRight');await page.keyboard.press('Space');}
  await page.locator('.artpad-row button').last().click();await page.waitForFunction(()=>window.artProgressDone);
  const after=await page.evaluate(async()=>{const S=await import('/js/state.js'),p=__sv.heroes[0].profile;return {wins:p.wins.nonla,album:p.album.length,coins:S.farm.coins,saved:JSON.parse(localStorage.getItem('sv2_profiles')).find(q=>q.id===p.id).album.length};});
  assert.equal(after.wins,before.wins+1);assert.equal(after.album,before.album+1);assert.equal(after.saved,after.album);assert.equal(after.coins,before.coins+5);
  await page.evaluate(()=>{window.artProgressDone=false;__sv.playGame(0,'nonla','art-check').then(()=>window.artProgressDone=true);});await page.locator('.gl:not(.out) .gl-x').click();await page.waitForFunction(()=>window.artProgressDone);
  const exited=await page.evaluate(async()=>{const S=await import('/js/state.js'),p=__sv.heroes[0].profile;return {wins:p.wins.nonla,album:p.album.length,coins:S.farm.coins};});assert.deepEqual(exited,{wins:after.wins,album:after.album,coins:after.coins});
  await page.reload();const restored=await page.evaluate(async()=>{const S=await import('/js/state.js'),p=S.profiles[0];return {wins:p.wins.nonla,album:p.album.length,coins:S.farm.coins};});assert.deepEqual(restored,exited);
  const result={provenance,before,after,exited,restored,oneCompletionOneReward:true,noRewardOnExit:true};fs.writeFileSync(folder+'/progress-validation.json',JSON.stringify(result,null,2)+'\n');return 'actual game orchestration: one win and five coins once, album persistence, exit without reward, reload preserves save';
 }finally{await P.ctx.close();}
}
