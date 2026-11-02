// Model an iPhone player whose first line never starts, then a long later line.
// Cancellation must release music immediately and cancel the first line's stale six-second watchdog.
import assert from 'node:assert/strict';
import { launch, open } from './harness.mts';
const browser=await launch();
try{
 const pre=`Object.defineProperty(AudioContext.prototype,'state',{get:()=> 'suspended'});AudioContext.prototype.resume=()=>Promise.resolve();
 Object.defineProperty(HTMLMediaElement.prototype,'duration',{get:()=>30});window.__plainPlays=[];window.__plainPauses=0;
 HTMLMediaElement.prototype.pause=function(){if(this.src.includes('/voices/'))window.__plainPauses++;};
 HTMLMediaElement.prototype.play=function(){if(this.src.includes('/voices/')){const ended=this.onended,playing=this.onplaying;window.__plainPlays.push({finish:()=>ended?.()});if(window.__plainPlays.length>1)setTimeout(()=>playing?.(),0);}return Promise.resolve();};`;
 const P=await open(browser,{w:390,h:844,touch:true,play:false,pre,settings:{voice:true,music:true,bilingual:false,autoPack:false}});
 await P.page.mouse.click(2,2);
 await P.page.evaluate(async()=>{const V=await import('/js/voice.js');for(let n=0;n<80&&!V.voicePack();n++)await new Promise(r=>setTimeout(r,100));if(!V.voicePack())throw new Error('Manifest unavailable');const {Music}=await import('/js/audio.js');window.__counts=[];V.onSpeaking(n=>{window.__counts.push(n);Music.under(n>0);});window.__firstSpeech=V.sayAsync('Great job!','Giỏi quá!');});
 await P.page.waitForFunction(()=>window.__plainPlays.length===1);
 const cancelled=await P.page.evaluate(async()=>{const V=await import('/js/voice.js'),{Music}=await import('/js/audio.js'),before=window.__plainPauses;V.hush();return {low:Music.low,count:window.__counts.at(-1),paused:window.__plainPauses>before};});
 await P.page.evaluate(async()=>{const V=await import('/js/voice.js');window.__secondSpeech=V.sayAsync('Well done!','Làm tốt lắm!');});
 await P.page.waitForFunction(()=>window.__plainPlays.length===2);
 const during=await P.page.evaluate(()=>({pauses:window.__plainPauses,count:window.__counts.at(-1)}));
 await P.page.waitForTimeout(6300);
 const after=await P.page.evaluate(async()=>{window.__plainPlays[0].finish();await Promise.resolve();const {Music}=await import('/js/audio.js');return {pauses:window.__plainPauses,count:window.__counts.at(-1),low:Music.low};});
 await P.page.evaluate(()=>window.__plainPlays[1].finish());await P.page.evaluate(()=>window.__secondSpeech);
 const finished=await P.page.evaluate(async()=>({count:window.__counts.at(-1),low:(await import('/js/audio.js')).Music.low}));
 assert.ok(cancelled.paused&&!cancelled.low&&cancelled.count===0,'Hush must stop the real plain player and release narration ducking immediately: '+JSON.stringify(cancelled));
 assert.ok(during.count===1&&after.count===1&&after.low&&after.pauses===during.pauses,'Cancelled line or late completion disrupted the later narrator: '+JSON.stringify({during,after}));
 assert.ok(finished.count===0&&!finished.low,'Finished narrator must release the bed: '+JSON.stringify(finished));
 assert.deepEqual(P.errors,[]);await P.ctx.close();
 const Q=await open(browser,{w:390,h:844,touch:true,play:false,settings:{voice:false,music:false,sound:false,familyVoice:false,autoPack:false},pre:`window.__heldFamily=[];window.__familyStarts=0;AudioContext.prototype.decodeAudioData=function(){return new Promise(resolve=>window.__heldFamily.push(()=>resolve(this.createBuffer(1,4410,44100))));};const originalStart=AudioBufferSourceNode.prototype.start;AudioBufferSourceNode.prototype.start=function(...args){window.__familyStarts++;return originalStart.apply(this,args);};`});
 await Q.page.mouse.click(2,2);
 await Q.page.evaluate(async()=>{const V=await import('/js/voice.js'),{settings}=await import('/js/state.js'),p=V.FAMILY_PHRASES[0];await V.saveClip('en',p.id,new Blob([new Uint8Array([1,2,3])],{type:'audio/wav'}));settings.voice=true;settings.lang='en';settings.familyVoice=true;window.__familySpeech=V.sayAsync(p.en,p.vi);});
 await Q.page.waitForFunction(()=>window.__heldFamily.length===1);
 const family=await Q.page.evaluate(async()=>{const V=await import('/js/voice.js'),before=window.__familyStarts;V.hush();window.__heldFamily.shift()();await window.__familySpeech;return {before,after:window.__familyStarts};});
 assert.equal(family.after,family.before,'A cancelled family recording must not start after its decoder finishes: '+JSON.stringify(family));
 assert.deepEqual(Q.errors,[]);await Q.ctx.close();
console.log('iPhone fallback cancellation pauses audio and releases the music bed immediately; stale timeout/late completion cannot stop or uncount the next line');
}finally{await browser.close();}
