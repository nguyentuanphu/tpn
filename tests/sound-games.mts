import type { Browser } from 'playwright';
import { open, clear, noWelcome } from './harness.mts';
declare global { interface Window { __r87AudioEdges?: WeakMap<AudioNode, AudioNode[]> } }
export async function soundGamesCheck(browser: Browser): Promise<string> {
  let release: () => void;
  const gate=new Promise<void>(resolve=>{release=resolve;});
  const P=await open(browser,{w:390,h:844,touch:true,settings:{sound:true,music:false},pre:()=>{
    const edges=window.__r87AudioEdges=new WeakMap<AudioNode,AudioNode[]>(), connect=AudioNode.prototype.connect;
    Object.defineProperty(AudioNode.prototype,'connect',{configurable:true,writable:true,value:function(this:AudioNode,destination:AudioNode|AudioParam,...args:number[]){
      if(destination instanceof AudioNode){const next=edges.get(this)||[];next.push(destination);edges.set(this,next);}return Reflect.apply(connect,this,[destination,...args]);
    }});
  },route:async ctx=>{
    await ctx.route('**/sounds/animals/pig.mp3',async route=>{await gate;await route.continue();});
  }});
  try {
    await clear(P.page);await noWelcome(P.page);await P.page.evaluate(()=>{window.__sv.paused=true;});
    const log=await P.page.evaluateHandle(()=>{
      const log={starts:[] as number[],active:new Set<AudioBufferSourceNode>(),osc:0,maxActive:0,routes:[] as {gain:number,thresholds:number[]}[]};
      const start=AudioBufferSourceNode.prototype.start,stop=AudioBufferSourceNode.prototype.stop,osc=OscillatorNode.prototype.start;
      AudioBufferSourceNode.prototype.start=function(...args:Parameters<AudioBufferSourceNode['start']>){if(this.buffer?.duration>.5){log.starts.push(this.buffer.duration);
        let node:AudioNode=this,gain=1;const thresholds:number[]=[],seen=new Set<AudioNode>();
        while(node&&!seen.has(node)){seen.add(node);if(node instanceof GainNode)gain*=node.gain.value;if(node instanceof DynamicsCompressorNode)thresholds.push(node.threshold.value);node=window.__r87AudioEdges?.get(node)?.[0];}
        log.routes.push({gain,thresholds});log.active.add(this);log.maxActive=Math.max(log.maxActive,log.active.size);this.addEventListener('ended',()=>log.active.delete(this),{once:true});}return start.apply(this,args);};
      AudioBufferSourceNode.prototype.stop=function(...args:Parameters<AudioBufferSourceNode['stop']>){log.active.delete(this);return stop.apply(this,args);};
      OscillatorNode.prototype.start=function(...args:Parameters<OscillatorNode['start']>){log.osc++;return osc.apply(this,args);};return log;
    });
    const early=await P.page.evaluate(async()=>(await import('../js/audio.js')).loadAnimalCalls(120));
    if(early)throw Error('slow pig declared ready');
    const cancel=await P.page.evaluateHandle(async()=>(await import('../js/audio.js')).animalCall('oink'));
    await cancel.evaluate(stop=>stop());await cancel.dispose();
    if(await log.evaluate(l=>l.starts.length||l.osc))throw Error('missing pig substituted a tone or played before ready');
    release();
    if(!(await P.page.evaluate(async()=>(await import('../js/audio.js')).loadAnimalCalls(8000))))throw Error('recordings did not become ready');
    await P.page.waitForTimeout(100);
    if(await log.evaluate(l=>l.starts.length))throw Error('cancelled pending pig played after arrival');
    const rows=await P.page.evaluate(async log=>{
      const A=await import('../js/audio.js'),rows=[];
      for(const name of ['moo','baa','oink','woof','meow','quack','cluck','neigh','ribbit','hoot']){
        log.starts.length=0;log.osc=0;log.routes.length=0;const stop=A.animalCall(name);await new Promise(r=>setTimeout(r,40));
        rows.push({name,starts:log.starts.length,osc:log.osc,duration:A.animalRecording(name)?.duration,routes:log.routes.slice()});stop();
      }return rows;
    },log);
    if(rows.some(r=>r.starts!==1||r.osc||r.duration<.5||r.routes.some(p=>p.gain>.7||!p.thresholds.length||p.thresholds.some(t=>t< -6))))throw Error(JSON.stringify(rows));
    await P.page.evaluate(()=>{void window.__sv.playGame(0,'animalsounds','replay');});await P.page.locator('.bigplay').waitFor();
    await P.page.waitForTimeout(100);await log.evaluate(l=>{l.starts.length=0;l.maxActive=l.active.size;});
    await P.page.locator('.bigplay').evaluate(button=>{if(!(button instanceof HTMLButtonElement))throw Error('No replay button');for(let i=0;i<6;i++)button.click();});
    const replay=await log.evaluate(l=>({active:l.active.size,starts:l.starts.length,maxActive:l.maxActive}));
    if(replay.active>1||replay.maxActive!==1||replay.starts!==6)throw Error('replay overlaps: '+JSON.stringify(replay));
    await P.page.locator('.gl-x').click();await P.page.locator('.gl').waitFor({state:'detached'});
    if(await log.evaluate(l=>l.active.size))throw Error('animal sound continues after closing game');
    if(P.errors.length)throw Error(P.errors.join(' | '));await log.dispose();
  } finally {release();await P.ctx.close();}
  let failPig=true;
  const Q=await open(browser,{w:390,h:844,touch:true,settings:{sound:true,music:false},route:async ctx=>{
    await ctx.route('**/sounds/animals/pig.mp3',route=>failPig?route.abort():route.continue());
  }});
  try {
    await clear(Q.page);await noWelcome(Q.page);await Q.page.evaluate(()=>{void window.__sv.playGame(0,'animalsounds','replay');});
    await Q.page.locator('.animal-retry').waitFor();
    const retry=await Q.page.locator('.animal-retry').boundingBox();
    const retryFits=await Q.page.locator('.animal-retry').evaluate(b=>b.scrollWidth<=b.clientWidth+2&&b.scrollHeight<=b.clientHeight+2);
    if(!retry||retry.width<64||retry.height<64||!retryFits||await Q.page.locator('.bigplay').count())throw Error('missing recording did not hold quiz with an accessible retry');
    failPig=false;await Q.page.locator('.animal-retry').click();await Q.page.locator('.bigplay').waitFor();
    await Q.page.locator('.gl-x').click();await Q.page.locator('.gl').waitFor({state:'detached'});
    const order=await Q.page.evaluateHandle(async()=>{
      const A=await import('../js/audio.js'),V=await import('../js/voice.js'),animalBuffers=new Set(['cluck','moo','oink'].map(n=>A.animalRecording(n))),active=new Set<AudioBufferSourceNode>();
      const log={played:0,after:0,overlap:[] as string[]},start=AudioBufferSourceNode.prototype.start,stop=AudioBufferSourceNode.prototype.stop;
      AudioBufferSourceNode.prototype.start=function(...args:Parameters<AudioBufferSourceNode['start']>){if(animalBuffers.has(this.buffer)){log.played++;active.add(this);this.addEventListener('ended',()=>active.delete(this),{once:true});}return start.apply(this,args);};
      AudioBufferSourceNode.prototype.stop=function(...args:Parameters<AudioBufferSourceNode['stop']>){active.delete(this);return stop.apply(this,args);};
      V.spoken.push(text=>{if(log.played){log.after++;if(active.size)log.overlap.push(text);}});return log;
    });
    await Q.page.evaluate(async()=>{window.__sv.heroes[0].profile.age='little';await import('../js/games/readingmenu.js');void window.__sv.playGame(0,'rd_storyhelp','replay');});
    await Q.page.locator('.sh-book').nth(4).click();await Q.page.locator('.sh-thing').first().waitFor();
    await Q.page.locator('.sh-thing').first().click();await Q.page.locator('.sh-spot[data-id="hen"]').click();
    await Q.page.waitForFunction(log=>log.after>0,order);
    const sequencing=await order.evaluate(log=>({played:log.played,overlap:log.overlap}));
    if(sequencing.played!==1||sequencing.overlap.length)throw Error('story narration overlaps animal: '+JSON.stringify(sequencing));
    await Q.page.locator('.gl-x').click();await Q.page.locator('.gl').waitFor({state:'detached'});await order.dispose();
    if(Q.errors.length)throw Error(Q.errors.join(' | '));
  } finally {await Q.ctx.close();}
  return 'all 10 real calls, no synthetic substitution; delayed pig can be cancelled; replay serialises and close stops it; unavailable clip holds quiz with 64 px retry and recovers; Story Helpers praise waits for its animal call';
}
