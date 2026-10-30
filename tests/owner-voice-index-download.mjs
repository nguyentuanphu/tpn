// Tiny policy fixture: refreshing an index during a held download must fetch its new selected-language area.
import assert from 'node:assert/strict';
import { launch, open, clear } from './harness.mjs';
const browser=await launch(), got=[];let newer=false,release,started;
const held=new Promise(r=>{release=r;}),nearStarted=new Promise(r=>{started=r;});
const makePack=extra=>{const lines={},langOf={};for(const lang of ['en','vi'])for(const area of ['core','nearby',...(extra?['games']:[])]){const h='fixture_'+lang+'_'+area;lines[h]='f';langOf[h]=lang;}return {lines,langOf,areas:true,version:999,made:extra?'refreshed':'older'};};
try {
  const P=await open(browser,{w:390,h:844,touch:true,settings:{voice:false,autoPack:false,bilingual:false},pre:"Object.defineProperty(navigator,'connection',{get:()=>({type:'wifi',saveData:false}),configurable:true});",route:async ctx=>{
    await ctx.route('**/voices/areas.json',r=>{const groups={core:'fixture_en_core fixture_vi_core',nearby:'fixture_en_nearby fixture_vi_nearby'};if(newer)groups.games='fixture_en_games fixture_vi_games';return r.fulfill({json:{groups,size:{}}});});
    await ctx.route('**/voices/*/f/fixture_*.mp3',async r=>{const file=new URL(r.request().url()).pathname;got.push(file);if(file.endsWith('/fixture_en_nearby.mp3')){started();await held;}await r.fulfill({status:200,contentType:'audio/mpeg',body:Buffer.from([0xff,0xfb,0x90,0])});});
  }});await clear(P.page);
  await P.page.waitForFunction(async()=>!!(await import('/js/voice.js')).voicePack());
  assert.ok(await P.page.evaluate(async()=>!!(await import('/js/voice.js')).voicePack()),'Initial real manifest must be loaded before replacing the downloader fixture');
  await P.page.evaluate(async pack=>{const S=await import('/js/state.js'),V=await import('/js/voicepack.js');S.settings.autoPack=true;S.settings.packCell=false;S.settings.lang='en';window.__indexProgress=[];V.startPack(pack,e=>window.__indexProgress.push(e),()=> 'nearby');},makePack(false));
  let timer;try{await Promise.race([nearStarted,new Promise((_,reject)=>{timer=setTimeout(()=>reject(new Error('Selected-language nearby request never started')),20000);})]);}finally{clearTimeout(timer);}
  newer=true;
  await P.page.evaluate(async pack=>{const V=await import('/js/voicepack.js');V.startPack(pack,e=>window.__indexProgress.push(e),()=> 'nearby');},makePack(true));release();
  let result;
  for(let n=0;n<200;n++){
    result=await P.page.evaluate(async()=>{const S=(await import(String('/js/voicestore.js'))).voiceStore('sv-voices');return {files:[...await S.keys()],saved:JSON.parse(localStorage.getItem('sv2_settings')||'{}').packSaved,progress:window.__indexProgress};});
    if(result.saved?.endsWith(':refreshed')&&result.files.some(u=>u.endsWith('/fixture_en_games.mp3')))break;await P.page.waitForTimeout(100);
  }
  assert.ok(result.saved?.endsWith(':refreshed'),JSON.stringify({got,result}));
  for(const area of ['core','nearby','games'])assert.ok(result.files.some(u=>u.endsWith('/fixture_en_'+area+'.mp3')),area+' missing after refresh');
  assert.ok(!got.some(u=>u.includes('/vi/')),'Refresh must preserve selected language');
  assert.ok(result.progress.every(e=>e.state!=='loading'||e.done<=e.total),'Progress must remain bounded');
  assert.deepEqual(P.errors,[]);await P.ctx.close();console.log('Held older download restarts against refreshed areas, preserves cached core/nearby, completes new English area and keeps Vietnamese excluded');
}finally{release();await browser.close();}
