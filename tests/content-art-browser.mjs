import {contentEvidence} from './content-evidence.mjs';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {URL} from './harness.mjs';
const folder='../docs/studio-content-website-20261029';
export async function contentArtCheck(browser,options={}){
 const provenance=contentEvidence(browser,['js/games/art-pad.ts', 'js/games/drawing2.ts', 'js/games/crafts.ts', 'js/games/catalog.ts', 'js/content/activities.ts','js/art.ts','css/style.css','js/games/frame.ts','js/state.ts','js/howto-data.ts','js/emojiswap.js']);
 const active=JSON.parse(fs.readFileSync(folder+'/art-audit.json')).filter(r=>r.discovery==='catalogued'&&(!options.ids||options.ids.includes(r.id))),results=[];
 assert.ok(active.length>0,'the intended art checks must execute');
 for(const [lang,w,h,little,level,paired=false] of (options.configurations||[['en',390,844,true,1],['vi',820,1180,true,2],['en',1440,900,false,3],['vi',390,844,false,5],['en',844,390,true,1]])){
  const context=await browser.newContext({viewport:{width:w,height:h},hasTouch:little}),page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
  for(const route of ['**/content/custom.json','**/api/live'])await context.route(route,r=>r.fulfill({json:{}}));
  await context.route('**/__content-art',r=>r.fulfill({contentType:'text/html',body:'<!doctype html><link rel="stylesheet" href="/css/style.css"><body></body>'}));
  try{
   await page.goto(URL+'__content-art');
   await page.evaluate(async({lang,little,paired})=>{
    await import('/js/emojiswap.js');
    localStorage.setItem('sv2_profiles',JSON.stringify([{id:'synthetic-art',name:'Example',age:'little',difficulty:'easy',created:1}]));
    const S=await import('/js/state.js');Object.assign(S.settings,{lang,voice:false,music:false,sound:false});
    const C=await import('/js/custom.js');await C.liveBoot;C.CUSTOM.releases={newGames:{on:true}};C.setPeeks([]);await import('/js/games/all.js');
    const U=await import('/js/content/unlocks.js'),p=S.profiles[0];Object.assign(p,{id:'synthetic-art',age:little?'little':'big',admin:false,unlockAll:false,wins:Object.fromEntries(U.FIRST_SET_GAMES.art.map(id=>[id,3]))});delete p.album;
    window.artProfile=p;window.artPlayers=[p];if(paired){const other=S.addProfile();other.age=little?'little':'big';other.name='Example two';delete other.album;window.artPlayers.push(other);}window.artFrame=await import('/js/games/frame.js');window.artCustom=C;
   },{lang,little,paired});
   for(const {id} of active){
    console.log(`art ${id} ${lang} ${w}`);
    const gates=await page.evaluate(async id=>{
     const F=artFrame,C=artCustom,p=artProfile,before=JSON.stringify(p);
     C.CUSTOM.itemAvailability={['game:'+id]:false};const item=F.canStartGame(id,[p]);await F.openGame(id,{players:[p]});if(document.querySelector('.gl'))throw Error('Off opened frame');
     C.CUSTOM.itemAvailability={};C.CUSTOM.releases={newGames:{on:false}};const group=F.canStartGame(id,[p]);
     C.CUSTOM.releases={newGames:{on:true}};const wins=p.wins;p.wins={};const progress=F.canStartGame(id,[p]);p.wins=wins;
     return {item,group,progress,preserved:JSON.stringify(p)===before,allowed:F.canStartGame(id,[p])};
    },id);assert.deepEqual(gates,{item:false,group:false,progress:false,preserved:true,allowed:true},id+' gates');
    const before=await page.evaluate(()=>({album:artProfile.album?.length||0,wins:JSON.stringify(artPlayers.map(p=>p.wins))}));
    await page.evaluate(({id,little,level})=>{window.artResult=artFrame.openGame(id,{players:artPlayers,little,level,completion:'return'});},{id,little,level});
    await page.waitForFunction(()=>document.querySelectorAll('.artpad-row button').length===7);
    await page.locator('.artpad canvas').scrollIntoViewIfNeeded();
    const canvas=page.locator('.artpad canvas');
    if(w===1440){await canvas.focus();for(let i=0;i<12;i++){await page.keyboard.press('ArrowRight');await page.keyboard.press('Space');}}
    else if(little&&w===820){const box=await canvas.boundingBox();for(let i=0;i<12;i++)await page.touchscreen.tap(box.x+20+i*6,box.y+40+i%3*12);}
    else {const box=await canvas.boundingBox();await page.mouse.move(box.x+20,box.y+30);await page.mouse.down();for(let i=0;i<14;i++)await page.mouse.move(box.x+25+i*6,box.y+40+i%3*12);await page.mouse.up();}
    const save=page.locator('.artpad-row button').last();assert.equal(await save.isEnabled(),true,id+' save');
    const layout=await page.evaluate(()=>{const r=document.querySelector('.artpad canvas').getBoundingClientRect();return {fits:r.left>=0&&r.right<=innerWidth,min:Math.min(...[...document.querySelectorAll('.artpad button')].map(b=>b.getBoundingClientRect()).filter(r=>r.width>0).map(r=>r.height))};});assert.equal(layout.fits,true,id+' fits');assert.ok(layout.min>=(little?64:44),id+' targets');
    const actionLayout=await save.evaluate(button=>{const r=button.getBoundingClientRect(),m=document.querySelector('.mascot').getBoundingClientRect();return {visible:r.top>=0&&r.bottom<=innerHeight&&r.left>=0&&r.right<=innerWidth,mascotOverlap:r.left<m.right&&r.right>m.left&&r.top<m.bottom&&r.bottom>m.top};});assert.equal(actionLayout.visible,true,id+' anchored Save');assert.equal(actionLayout.mascotOverlap,false,id+' mascot clearance');
    if(['stamps','nonla','scratch','pixelpic'].includes(id))await page.screenshot({animations:'disabled',path:`${folder}/screenshots/${id}-${lang}-${w}.png`});
    await save.click();await page.waitForSelector('.gl-win');await page.waitForFunction(()=>!document.querySelector('.gl'));
    const after=await page.evaluate(async()=>({result:await artResult,album:artProfile.album.length,png:artProfile.album.at(-1).startsWith('data:image/png;base64,'),wins:JSON.stringify(artPlayers.map(p=>p.wins)),sharedAlbum:artPlayers.every(p=>p.album?.at(-1)===artProfile.album.at(-1))}));
    assert.equal(after.sharedAlbum,true,'same art saved for every participating profile');assert.equal(after.result.won,true,id+' complete');assert.equal(after.album,Math.min(12,before.album+1));assert.equal(after.png,true);assert.equal(after.wins,before.wins,'caller progress');
    await page.evaluate(id=>{window.artResult=artFrame.openGame(id,{players:artPlayers});},id);await page.locator('.gl-x').click();assert.equal((await page.evaluate(()=>artResult)).won,false);await page.waitForSelector('.artpad',{state:'detached'});assert.equal(await page.locator('.artpad').count(),0);
    results.push({id,lang,width:w,little,level,paired,gates,won:true,album:after.album,earlyExit:true,input:w===1440?'keyboard':little&&w===820?'touch':'pointer'});
   }
   assert.deepEqual(await page.evaluate(()=>['spotdiff','hiddenpic','paperfold','rongran'].filter(id=>artFrame.GAMES[id])),[]);assert.deepEqual(errors,[]);
  }catch(error){await page.screenshot({animations:'disabled',path:folder+'/screenshots/failed-art.png'});fs.writeFileSync(folder+'/failed-art.txt',(String(error)+'\n'+errors.join('\n')+'\n'+await page.locator('body').innerText()).replace(/[^\x00-\x7F]/g,c=>'\\u'+c.charCodeAt(0).toString(16).padStart(4,'0')));throw error;}finally{await context.close();}
 }
 fs.writeFileSync(folder+'/'+(options.report||'browser-validation.json'),JSON.stringify({provenance,results},null,2)+'\n');return `${results.length} art completions, gates, album cap, keyboard/pointer and exit checks`;
}

export const contentPairCheck=browser=>contentArtCheck(browser,{configurations:[['vi',320,740,true,1,true]],report:'paired-browser-validation.json'});

export const contentCaptureCheck=browser=>contentArtCheck(browser,{ids:['stamps','nonla','scratch','pixelpic'],configurations:[['en',390,844,true,1],['vi',820,1180,true,2],['en',1440,900,false,3],['vi',390,844,false,5],['en',844,390,true,1],['vi',320,740,true,1,true]],report:'capture-validation.json'});
