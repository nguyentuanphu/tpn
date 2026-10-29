// Actual game save/voice sources in an isolated browser document. Synthetic data only.
import assert from 'node:assert/strict';
import { URL, open, noWelcome } from './harness.mjs';
export async function managementRuntimeBrowserCheck(browser){
 const context=await browser.newContext();
 try{
  await context.route('**/__management-runtime-check',r=>r.fulfill({contentType:'text/html',body:'<!doctype html><title>Management evidence fixture</title><body></body>'}));
  const page=await context.newPage();await page.goto(URL+'__management-runtime-check');
  const result=await page.evaluate(async()=>{
   localStorage.setItem('sv2_profiles','[]');
   const S=await import('/js/state.js'),E=(await import('/js/core/events.js')).managementEvidence;
   E.setEnabled(true);const evidence=[];E.subscribe(e=>evidence.push(e));
   // Stub browser handoffs; run the actual export implementation.
   const click=HTMLAnchorElement.prototype.click;HTMLAnchorElement.prototype.click=function(){};
   await S.exportBackup({share:false});HTMLAnchorElement.prototype.click=click;
   Object.defineProperty(navigator,'canShare',{configurable:true,value:()=>true});
   Object.defineProperty(navigator,'share',{configurable:true,value:async()=>{}});await S.exportBackup();
   Object.defineProperty(navigator,'share',{configurable:true,value:async()=>{throw new DOMException('Cancelled','AbortError');}});await S.exportBackup();
   await S.importBackup({text:async()=>JSON.stringify({app:'sparkle-valley',profiles:[],farm:{...S.farm}})});
   const set=Storage.prototype.setItem;Storage.prototype.setItem=function(){throw new DOMException('Full','QuotaExceededError');};
   await S.importBackup({text:async()=>JSON.stringify({app:'sparkle-valley',profiles:[],settings:{...S.settings,lang:'vi'}})});Storage.prototype.setItem=set;
   try{await S.importBackup({text:async()=>'{broken'});}catch{}
   const backups=evidence.filter(e=>e.eventName==='backup.result').map(e=>e.data);
   // Exercise the real recorded player while controlling browser callbacks.
   Object.defineProperty(AudioContext.prototype,'state',{configurable:true,get:()=> 'suspended'});AudioContext.prototype.resume=()=>Promise.resolve();
   let mode='success';Object.defineProperty(HTMLMediaElement.prototype,'duration',{configurable:true,get:()=>0.01});
   HTMLMediaElement.prototype.pause=function(){};
   HTMLMediaElement.prototype.play=function(){if(mode==='failure')return Promise.reject(new Error('Synthetic audio rejection'));setTimeout(()=>{this.onplaying?.();if(mode==='success')this.onended?.();},0);return Promise.resolve();};
   speechSynthesis.speak=u=>setTimeout(()=>u.onend?.(),0);
   const V=await import('/js/voice.js');S.settings.voice=true;S.settings.lang='vi';S.settings.bilingual=false;window.dispatchEvent(new Event('click')); 
   for(let n=0;n<80&&!V.voicePack()?.signatures?.vi;n++)await new Promise(r=>setTimeout(r,100));
   let line=null;window.__svVoiceLog=(lang,text,recorded)=>{if(recorded)line=text;};
   for(const p of V.FAMILY_PHRASES){await V.sayIn('vi',p.vi);if(line)break;}V.hush();
   if(!line)throw new Error('No recorded fixture phrase');evidence.length=0;
   mode='success';await V.sayAsync(line,line);
   mode='unknown';await V.sayAsync(line,line);
   mode='cancel';const pending=V.sayAsync(line,line);setTimeout(()=>V.hush(),30);await pending;
   mode='failure';await V.sayAsync(line,line);
   const voices=evidence.filter(e=>e.eventName==='voice.result').map(e=>e.data);
   // Repeat export/restore capture after voice outcomes to preserve separate result sets.
   return {voices,backups,hasLine:!!line};
  });
  assert.equal(result.hasLine,true);
  assert.deepEqual(result.backups.map(b=>[b.operation,b.outcome,b.reasonCode]),[
    ['export','initiated','none'],['export','success','none'],['export','cancelled','user_cancelled'],
    ['restore','success','none'],['restore','failed','storage'],['restore','failed','invalid']]);
  for(const outcome of ['success','unknown','cancelled','failed'])assert.ok(result.voices.some(v=>v.source==='recorded'&&v.outcome===outcome),'missing recorded '+outcome);
 }finally{await context.close();}
 const received=[];
 const game=await open(browser,{w:390,h:844,touch:true,settings:{countPlayers:true,reportNames:true},pre: `window.__svHelloTest=true;localStorage.setItem('sv2_live',JSON.stringify({releases:{managementTelemetry:{on:true}}}));`,route:async ctx=>{
   await ctx.route('**/api/live',r=>r.fulfill({json:{releases:{managementTelemetry:{on:true}}}}));
   await ctx.route('**/api/management/events',async r=>{const b=r.request().postDataJSON();received.push(...b.events);await r.fulfill({json:{accepted:b.events.map(e=>e.eventId),duplicates:[]}});});
   await ctx.route('**/api/hello',r=>r.fulfill({json:{ok:true}}));
 }});
 try{
  await game.page.waitForFunction(()=>window.__sv?.bootTimes);
  // Keep the unrelated 8-second welcome sticker outside this policy-preservation window.
  await noWelcome(game.page);
  await game.page.waitForTimeout(1800);
  const queue=await game.page.evaluate(()=>['sv2_management_out','sv2_management_bot_out'].flatMap(k=>{try{return JSON.parse(localStorage.getItem(k)||'{}').events||[];}catch{return [];}}));
  const events=[...received,...queue],started=events.find(e=>e.eventName==='boot.started'),ready=events.find(e=>e.eventName==='boot.ready');
  assert.ok(started,'real game boot emits started');assert.ok(ready,'real game boot emits ready');assert.equal(started.attemptId,ready.attemptId);assert.ok(ready.data.elapsedMs>=0);
  await game.page.evaluate(async()=>{const S=await import('/js/state.js');S.settings.countPlayers=false;(await import('/js/core/events.js')).events.emit('SettingsChanged');});
  assert.equal(await game.page.evaluate(()=>localStorage.getItem('sv2_management_out')),null);
  const privacy=await game.page.evaluate(async()=>{
   const S=await import('/js/state.js'),C=await import('/js/custom.js'),E=await import('/js/core/events.js');
   const before=JSON.stringify(S.profiles),beforeValues=JSON.parse(before),policy={schemaVersion:1,collect:true,process:true,show:true,expiresAt:new Date(Date.now()+60000).toISOString()};
   C.CUSTOM.reportingPolicy=policy;S.settings.countPlayers=false;E.events.emit('SettingsChanged');
   const parentWins=E.managementEvidence.emit('voice.result',{source:'device',language:'en',outcome:'unknown'})===null;
   S.settings.countPlayers=true;C.CUSTOM.reportingPolicy={...policy,expiresAt:new Date(Date.now()+1500).toISOString()};E.events.emit('SettingsChanged');
   await new Promise(r=>setTimeout(r,50));
   const enabled=!!E.managementEvidence.emit('voice.result',{source:'device',language:'en',outcome:'unknown'});
   await new Promise(r=>setTimeout(r,1800));
   const expired=E.managementEvidence.emit('voice.result',{source:'device',language:'en',outcome:'unknown'})===null;
   return {parentWins,enabled,expired,queueCleared:['sv2_management_out','sv2_management_bot_out'].every(k=>localStorage.getItem(k)===null),progressPreserved:JSON.stringify(S.profiles)===before,changedProfileFields:S.profiles.flatMap((p,i)=>[...new Set([...Object.keys(p),...Object.keys(beforeValues[i]||{})])].filter(k=>JSON.stringify(p[k])!==JSON.stringify(beforeValues[i]?.[k])).map(k=>i+'.'+k)),parentChoiceUnchanged:S.settings.countPlayers===true};
  });
  for(const [name,value]of Object.entries(privacy))if(name!=='changedProfileFields')assert.equal(value,true,name+(name==='progressPreserved'?' changed fields: '+privacy.changedProfileFields.join(', '):''));
  const blockedOnline=await game.page.evaluate(async()=>{
   const C=await import('/js/custom.js'),G=window.__sv,before={acts:G.actCount,paused:G.paused,progress:JSON.stringify(G.heroes[0].profile)},old=C.CUSTOM.itemAvailability;
   C.CUSTOM.itemAvailability={...old,'game:oanquan':false};await G.playGameOnline('oanquan',1,{});C.CUSTOM.itemAvailability=old;
   return {noAttempt:G.actCount===before.acts,pauseUnchanged:G.paused===before.paused,progressPreserved:JSON.stringify(G.heroes[0].profile)===before.progress,noFrame:!document.querySelector('.gl')};
  });
  for(const [name,value]of Object.entries(blockedOnline))assert.equal(value,true,'blocked online '+name);

  assert.deepEqual(game.errors,[]);
 }finally{await game.ctx.close();}
 const offRequests=[],offPolicy={schemaVersion:1,collect:false,process:false,show:true,expiresAt:null};
 const off=await open(browser,{play:false,settings:{countPlayers:true},pre:`window.__svHelloTest=true;localStorage.setItem('sv2_live',JSON.stringify({releases:{managementTelemetry:{on:true}},content:{reportingPolicy:${JSON.stringify(offPolicy)}}}));`,route:async ctx=>{
  await ctx.route('**/api/live',r=>r.fulfill({json:{releases:{managementTelemetry:{on:true}},content:{reportingPolicy:offPolicy}}}));
  ctx.on('request',r=>offRequests.push(r.url()));
 }});
 try{
  await off.page.waitForTimeout(1200);
  assert.equal(offRequests.some(u=>u.includes('/js/management-telemetry.js')||u.includes('/api/management/')),false,'Off before startup does not load or upload optional management telemetry');
  assert.equal(await off.page.evaluate(()=>localStorage.getItem('sv2_management_bot_out')),null);
  assert.deepEqual(off.errors,[]);
 }finally{await off.ctx.close();}
}
