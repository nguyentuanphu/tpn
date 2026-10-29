import assert from 'node:assert/strict';
import fs from 'node:fs';
import {URL} from './harness.mjs';

export async function itemControlRuntimeCheck(browser,published){
 const entries=JSON.parse(fs.readFileSync('../content/management-catalogue.json','utf8')).entries;
 const context=await browser.newContext(),page=await context.newPage(),requests=[];
 await context.route('**/__item-control-check',r=>r.fulfill({contentType:'text/html',body:'<!doctype html><title>Item controls synthetic check</title><body></body>'}));
 await context.route('**/content/custom.json',r=>r.fulfill({json:{}}));
 await context.route('**/api/live',r=>r.fulfill({json:published}));
 page.on('request',r=>requests.push(r.url()));
 try{
  await page.goto(URL+'__item-control-check');
  const result=await page.evaluate(async({entries,published})=>{
   localStorage.setItem('sv2_live',JSON.stringify(published));localStorage.setItem('sv2_profiles','[]');
   const C=await import('/js/custom.js');await C.liveBoot;
   if(C.itemEnabled('game','oanquan')!==false)throw Error('Published item Off did not reach actual game policy');
   C.CUSTOM.quiz=[{q:['Synthetic question','Câu hỏi mẫu'],answers:[['A','A'],['B','B']],right:0}];
   await import('/js/games/all.js');await import('/js/games/readingmenu.js');
   const F=await import('/js/games/frame.js'),S=await import('/js/state.js'),A=await import('/js/content/activities.js'),U=await import('/js/content/unlocks.js'),Theatre=await import('/js/tales.js');
   const p={...S.profiles[0],id:'synthetic',age:'big',admin:true,unlockAll:true,wins:{oanquan:9},levels:{oanquan:3},tales:{banhchung:true}},before=JSON.stringify(p);
   C.CUSTOM.releases={newGames:{on:true},newStories:{on:true},readingTrial:{on:true}};C.setPeeks(['newGames','newStories']);C.setPlayers([p]);
   const games=entries.filter(e=>e.kind==='game'&&e.coverage.discovery!=='declared-only'),stories=entries.filter(e=>e.kind==='story'),missing=games.filter(e=>!F.GAMES[e.id]).map(e=>e.id);
   for(const e of entries)C.CUSTOM.itemAvailability={...C.CUSTOM.itemAvailability,[e.kind+':'+e.id]:false};
   const beforeNodes=document.body.childElementCount,blockedGames=[],blockedStories=[];
   for(const e of games){const result=await F.openGame(e.id,{players:[p]});if(result.won!==false||F.gameOpen())throw Error('Disabled game started: '+e.id);blockedGames.push(e.id);}
   for(const e of stories){if(await Theatre.openTheatre({id:e.id})!==null)throw Error('Disabled story started: '+e.id);blockedStories.push(e.id);}
   const noLayers=!document.querySelector('.gl,.theatre')&&document.body.childElementCount===beforeNodes;
   const hidden=A.gameInfo('oanquan').hidden,held=U.isHeld('banhchung','tale');
   C.CUSTOM.itemAvailability={'game:oanquan':true,'game:crabwalk':true,'game:heodat':true,'game:rd_blend':true};C.setPeeks([]);
   C.CUSTOM.releases={newGames:{on:false},money_heodat:{on:false},readingTrial:{on:false}};
   const groupBlocks=['crabwalk','heodat','rd_blend'].map(id=>({id,allowed:F.canStartGame(id,[p])}));
   C.CUSTOM.releases.newGames={on:true};
   const lockedProfile={...p,admin:false,unlockAll:false,wins:{}};
   const progressBlocked=F.canStartGame('crabwalk',[lockedProfile])===false;
   for(const id of U.FIRST_SET_GAMES.animals)lockedProfile.wins[id]=3;
   const progressUnlocked=F.canStartGame('crabwalk',[lockedProfile])===true;
   const restored=F.canStartGame('oanquan',[p]);
   // Real allowed frame can open and close after restoring this item, without changing progress.
   const pending=F.openGame('oanquan',{players:[p]});const opened=!!document.querySelector('.gl');document.querySelector('.gl-x')?.click();await pending;
   return {blockedGames,blockedStories,missing,noLayers,hidden,held,groupBlocks,progressBlocked,progressUnlocked,restored,opened,profilePreserved:JSON.stringify(p)===before};
  },{entries,published});
  assert.deepEqual(result.missing,[],'every listed game has an actual registered definition');
  assert.equal(result.blockedGames.length,entries.filter(e=>e.kind==='game'&&e.coverage.discovery!=='declared-only').length);
  assert.equal(result.blockedStories.length,entries.filter(e=>e.kind==='story').length);
  for(const key of ['noLayers','hidden','held','progressBlocked','progressUnlocked','restored','opened','profilePreserved'])assert.equal(result[key],true,key);
  assert.ok(result.groupBlocks.every(g=>g.allowed===false),'item On cannot bypass group Off or remembered progress');
  return result;
 }finally{await context.close();}
}
