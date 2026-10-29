import assert from 'node:assert/strict';
import fs from 'node:fs';
import {URL} from './harness.mjs';
const folder='../docs/studio-content-website-20261029';
export async function contentArtCheck(browser){
 const active=JSON.parse(fs.readFileSync(folder+'/art-audit.json')).filter(r=>r.discovery==='catalogued'),results=[];
 for(const [lang,w,h,little] of [['en',390,844,true],['vi',820,1180,true],['en',1440,900,false],['vi',390,844,false]]){
  const context=await browser.newContext({viewport:{width:w,height:h},hasTouch:little}),page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
  for(const route of ['**/content/custom.json','**/api/live'])await context.route(route,r=>r.fulfill({json:{}}));
  await context.route('**/__content-art',r=>r.fulfill({contentType:'text/html',body:'<!doctype html><link rel="stylesheet" href="/css/style.css"><body></body>'}));
  try{
   await page.goto(URL+'__content-art');
   await page.evaluate(async lang=>{
    localStorage.setItem('sv2_profiles',JSON.stringify([{id:'synthetic-art',name:'Example',age:'little',difficulty:'easy',created:1}]));
    const S=await import('/js/state.js');Object.assign(S.settings,{lang,voice:false,music:false,sound:false});
    const C=await import('/js/custom.js');await C.liveBoot;C.CUSTOM.releases={newGames:{on:true}};C.setPeeks([]);await import('/js/games/all.js');
    const U=await import('/js/content/unlocks.js'),p=S.profiles[0];Object.assign(p,{id:'synthetic-art',age:'little',admin:false,unlockAll:false,wins:Object.fromEntries(U.FIRST_SET_GAMES.art.map(id=>[id,3]))});delete p.album;
    window.artProfile=p;window.artFrame=await import('/js/games/frame.js');window.artCustom=C;
   },lang);
   for(const {id} of active){
    console.log(`art ${id} ${lang} ${w}`);
    const gates=await page.evaluate(async id=>{
     const F=artFrame,C=artCustom,p=artProfile,before=JSON.stringify(p);
     C.CUSTOM.itemAvailability={['game:'+id]:false};const item=F.canStartGame(id,[p]);await F.openGame(id,{players:[p]});if(document.querySelector('.gl'))throw Error('Off opened frame');
     C.CUSTOM.itemAvailability={};C.CUSTOM.releases={newGames:{on:false}};const group=F.canStartGame(id,[p]);
     C.CUSTOM.releases={newGames:{on:true}};const wins=p.wins;p.wins={};const progress=F.canStartGame(id,[p]);p.wins=wins;
     return {item,group,progress,preserved:JSON.stringify(p)===before,allowed:F.canStartGame(id,[p])};
    },id);assert.deepEqual(gates,{item:false,group:false,progress:false,preserved:true,allowed:true},id+' gates');
    const before=await page.evaluate(()=>({album:artProfile.album?.length||0,wins:JSON.stringify(artProfile.wins)}));
    await page.evaluate(({id,little})=>{window.artResult=artFrame.openGame(id,{players:[artProfile],little,completion:'return'});},{id,little});
    await page.waitForFunction(()=>document.querySelectorAll('.artpad-row button').length===7);
    const canvas=page.locator('.artpad canvas');
    if(w===1440){await canvas.focus();for(let i=0;i<12;i++){await page.keyboard.press('ArrowRight');await page.keyboard.press('Space');}}
    else if(little&&w===820){const box=await canvas.boundingBox();for(let i=0;i<12;i++)await page.touchscreen.tap(box.x+20+i*6,box.y+40+i%3*12);}
    else {const box=await canvas.boundingBox();await page.mouse.move(box.x+20,box.y+30);await page.mouse.down();for(let i=0;i<14;i++)await page.mouse.move(box.x+25+i*6,box.y+40+i%3*12);await page.mouse.up();}
    const save=page.locator('.artpad-row button').last();assert.equal(await save.isEnabled(),true,id+' save');
    const layout=await page.evaluate(()=>{const r=document.querySelector('.artpad canvas').getBoundingClientRect();return {fits:r.left>=0&&r.right<=innerWidth,min:Math.min(...[...document.querySelectorAll('.artpad button')].map(b=>b.getBoundingClientRect().height))};});assert.equal(layout.fits,true,id+' fits');assert.ok(layout.min>=(little?64:44),id+' targets');
    if(['stamps','nonla','scratch','pixelpic'].includes(id))await page.screenshot({path:`${folder}/screenshots/${id}-${lang}-${w}.png`});
    await save.click();await page.waitForSelector('.gl-win');await page.waitForFunction(()=>!document.querySelector('.gl'));
    const after=await page.evaluate(async()=>({result:await artResult,album:artProfile.album.length,png:artProfile.album.at(-1).startsWith('data:image/png;base64,'),wins:JSON.stringify(artProfile.wins)}));
    assert.equal(after.result.won,true,id+' complete');assert.equal(after.album,Math.min(12,before.album+1));assert.equal(after.png,true);assert.equal(after.wins,before.wins,'caller progress');
    await page.evaluate(id=>{window.artResult=artFrame.openGame(id,{players:[artProfile]});},id);await page.locator('.gl-x').click();assert.equal((await page.evaluate(()=>artResult)).won,false);await page.waitForSelector('.artpad',{state:'detached'});assert.equal(await page.locator('.artpad').count(),0);
    results.push({id,lang,width:w,little,gates,won:true,album:after.album,earlyExit:true,input:w===1440?'keyboard':little&&w===820?'touch':'pointer'});
   }
   assert.deepEqual(await page.evaluate(()=>['spotdiff','hiddenpic','paperfold','rongran'].filter(id=>artFrame.GAMES[id])),[]);assert.deepEqual(errors,[]);
  }catch(error){await page.screenshot({path:folder+'/screenshots/failed-art.png'});fs.writeFileSync(folder+'/failed-art.txt',String(error)+'\n'+errors.join('\n')+'\n'+await page.locator('body').innerText());throw error;}finally{await context.close();}
 }
 fs.writeFileSync(folder+'/browser-validation.json',JSON.stringify({synthetic:true,results},null,2)+'\n');return `${results.length} art completions, gates, album cap, keyboard/pointer and exit checks`;
}
