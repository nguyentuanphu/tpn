// Exercise real instruction/replay controls with decoded recordings, including the iPhone fallback.
import assert from 'node:assert/strict';
import { launch, open, clear } from './harness.mts';
const browser = await launch(), rows = [];
try {
  for (const lang of ['en', 'vi']) for (const asleep of [false, true]) {
    const pre = `window.__deviceSpeech=0;window.__recordedSources=0;window.__recordedPlayers=0;
      speechSynthesis.speak=()=>{window.__deviceSpeech++;};
      const start=AudioBufferSourceNode.prototype.start;
      AudioBufferSourceNode.prototype.start=function(...args){if(this.buffer?.length>1){window.__recordedSources++;setTimeout(()=>this.onended?.(),30);}return start.apply(this,args);};
      HTMLMediaElement.prototype.play=function(){if(!/^data:/.test(this.src))window.__recordedPlayers++;setTimeout(()=>this.onended?.(),30);return Promise.resolve();};
      ${asleep ? "Object.defineProperty(AudioContext.prototype,'state',{get:()=> 'suspended'});AudioContext.prototype.resume=()=>Promise.resolve();" : ''}`;
    const P = await open(browser, { w:390,h:844,touch:true,lang,pre,settings:{voice:true,bilingual:false} });
    await clear(P.page);
    await P.page.evaluate(async()=>{
      const V=await import('/js/voice.js');for(let n=0;n<60&&!V.voicePack();n++)await new Promise(r=>setTimeout(r,250));
      if(!V.voicePack())throw new Error('Voice manifest unavailable');
      window.__instructionLog=[];window.__svVoiceLog=(lang,text,recorded)=>window.__instructionLog.push({lang,text,recorded});
    });
    for(const id of ['patternpicnic','shapebuilders','remembergarden']) {
      await P.page.evaluate(id=>{window.__deviceSpeech=0;window.__recordedSources=0;window.__recordedPlayers=0;window.__instructionLog=[];window.__voiceGame=__sv.playGame(0,id,'replay');},id);
      await P.page.waitForSelector('.bt-repeat');
      await P.page.waitForFunction(()=>window.__recordedSources+window.__recordedPlayers>0);
      const before=await P.page.evaluate(()=>window.__recordedSources+window.__recordedPlayers);
      await P.page.locator('.bt-repeat').click();
      await P.page.waitForFunction(n=>window.__recordedSources+window.__recordedPlayers>n,before);
      const r=await P.page.evaluate(()=>({deviceSpeech:window.__deviceSpeech,sources:window.__recordedSources,players:window.__recordedPlayers,log:window.__instructionLog}));
      assert.equal(r.deviceSpeech,0,JSON.stringify({id,lang,asleep,...r}));
      assert.ok(r.log.length>=2&&r.log.every(x=>x.recorded&&x.lang===lang),JSON.stringify({id,lang,asleep,...r}));
      assert.ok(asleep?r.players>before:r.sources>before,JSON.stringify({id,lang,asleep,...r}));
      rows.push({id,lang,asleep,recordedEvents:r.log.length,replayed:true});
      await P.page.locator('.gl-x').click();await P.page.waitForSelector('.gl',{state:'detached'});await clear(P.page);
    }
    assert.deepEqual(P.errors,[]);await P.ctx.close();
  }
} finally { await browser.close(); }
console.log(JSON.stringify(rows));
