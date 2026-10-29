// Actual Studio editors in an isolated document; injected responses are explicit failure scenarios.
import assert from 'node:assert/strict';
import path from 'node:path';
export async function controlRecoveryBrowserCheck(browser,site,output){
 const evidence=[];
 for(const [width,height]of [[390,844],[820,1180],[1440,1000]])for(const lang of ['en','vi']){
  const ctx=await browser.newContext({viewport:{width,height}});
  try{
   await ctx.route('**/__control-recovery',r=>r.fulfill({contentType:'text/html',body:'<!doctype html><html><head><link rel="stylesheet" href="/studio/ui/style.css"></head><body><main id="fixture"></main></body></html>'}));
   const page=await ctx.newPage();await page.goto(site+'/__control-recovery');
   const result=await page.evaluate(async lang=>{
    const {mountFunctions}=await import('/studio/ui/functions.js'),{mountItemWorkspace}=await import('/studio/ui/item-workspace.js');
    const host=document.querySelector('#fixture'),T=(en,vi)=>lang==='vi'?vi:en,can=()=>true,policy={schemaVersion:1,collect:false,process:false,show:true,expiresAt:null};
    const checks=[];const check=(name,value)=>{if(!value)throw Error(name);checks.push(name);};
    for(const family of ['functions','item']){
     const prefix=family==='functions'?'functions':'item',mount=family==='functions'?options=>mountFunctions(host,options):options=>mountItemWorkspace(host,'game:oanquan',options);
     const workspace=family==='functions'?{configured:true,settingsKnown:true,baseRevision:1,policy,effective:{...policy,installed:true},drafts:[]}:{configured:true,settingsKnown:true,baseRevision:1,entry:{id:'oanquan',kind:'game',name:{en:'Mandarin Square',vi:'Ô Ăn Quan'}},settings:{enabled:true},connections:{},drafts:[]};
     const draft={id:'synthetic-draft',itemKey:family==='functions'?'function:managementTelemetry':'game:oanquan',revision:1,state:'draft',reason:'Synthetic retained edits',body:{content:family==='functions'?{reportingPolicy:policy}:{itemAvailability:{'game:oanquan':false}}}};
     let unavailable=true,fail='',writes=0,navigation='';
     const api=async(url,body)=>{if(body!==undefined){writes++;if(fail)throw Object.assign(Error(fail),{raw:fail});if(url.endsWith('/review'))return {...draft,revision:2,state:'reviewed'};if(url.endsWith('/publish'))return {revision:2,projection:{ok:false}};return draft;}if(unavailable)throw Error('synthetic_read_failure');return url.includes('/drafts/')?draft:workspace;};
     const options={T,api,can,go:page=>navigation=page};
     await mount(options);check(family+' unavailable has no editor',!host.querySelector('form'));check(family+' unavailable can retry',!!host.querySelector('[data-'+prefix+'-retry]'));
     unavailable=false;host.querySelector('button').click();await new Promise(r=>setTimeout(r));check(family+' retry loads',!!host.querySelector('form'));
     for(const code of ['draft_baseline_conflict','draft_revision_conflict','reporting_policy_expired_or_invalid','permission_required','synthetic_lost_response']){
      await mount(options);host.querySelector('textarea').value='Synthetic retained edits';fail='';host.querySelector('form').requestSubmit();await new Promise(r=>setTimeout(r));
      host.querySelector('[data-'+prefix+'-review]').click();await new Promise(r=>setTimeout(r));check(family+' reviewed can publish',!host.querySelector('[data-'+prefix+'-publish]').disabled);
      fail=code;host.querySelector('[data-'+prefix+'-publish]').click();await new Promise(r=>setTimeout(r));
      check(family+' '+code+' blocks writes',[...host.querySelectorAll('form button')].every(b=>b.disabled));
      check(family+' '+code+' keeps edits',host.querySelector('textarea').value==='Synthetic retained edits');
      check(family+' '+code+' has recovery copy',host.querySelector('[data-'+prefix+'-result]').textContent.length>70);
      const count=writes;host.querySelector('[data-'+prefix+'-publish]').click();check(family+' no blind publish retry',writes===count);
      // Picking the same draft must not bypass the required workspace reload.
      const picker=host.querySelector('select');picker.value='synthetic-draft';picker.dispatchEvent(new Event('change'));await new Promise(r=>setTimeout(r));check(family+' picker cannot bypass recovery',host.querySelector('[data-'+prefix+'-publish]').disabled);
      const message=host.querySelector('[data-'+prefix+'-result]').textContent;host.querySelector('textarea').dispatchEvent(new Event('input'));check(family+' editing keeps recovery instructions',host.querySelector('[data-'+prefix+'-result]').textContent===message);
      const before=writes;host.querySelector('form').requestSubmit();await new Promise(r=>setTimeout(r));check(family+' form submission cannot bypass recovery',writes===before);
     }
     fail='';host.querySelector('[data-'+prefix+'-reload]').click();await new Promise(r=>setTimeout(r));check(family+' reload recovers save',!host.querySelector('form button[type=submit]').disabled);
     host.querySelector('[data-'+prefix+'-history]').click();check(family+' history route',navigation===(family==='functions'?'managementchanges':'changes'));
     host.querySelector('textarea').value='Synthetic delivery pending';host.querySelector('form').requestSubmit();await new Promise(r=>setTimeout(r));host.querySelector('[data-'+prefix+'-review]').click();await new Promise(r=>setTimeout(r));host.querySelector('[data-'+prefix+'-publish]').click();await new Promise(r=>setTimeout(r));
     check(family+' pending is distinct from available',/pending|đang chờ/.test(host.querySelector('[data-'+prefix+'-result]').textContent));
     check(family+' pending cannot publish twice',host.querySelector('[data-'+prefix+'-publish]').disabled);
    }
    // The advanced JSON editor uses the same uncertain-write recovery boundary.
    const {renderManagement}=await import('/studio/ui/management.js');
    let fail='',writes=0,readFails=false;
    const advanced={id:'synthetic-advanced',revision:1,state:'draft',kind:'content',reason:'Synthetic advanced edits',baseRevision:1,effectiveHash:'synthetic-hash',body:{content:{message:{en:'Synthetic retained value'}}}};
    const api=async(url,body)=>{if(body!==undefined){writes++;if(fail)throw Object.assign(Error(fail),{raw:fail});return url.endsWith('/review')?{...advanced,revision:2,state:'reviewed'}:advanced;}if(url==='management/drafts'){if(readFails)throw Error('synthetic_draft_read_failure');return {drafts:[]};}return {configured:true,config:{revision:1,body:{content:{}}},changes:[]};};
    const mount=()=>renderManagement(host,{T,api,can,kind:'changes',online:true});
    for(const code of ['draft_baseline_conflict','draft_revision_conflict','synthetic_lost_response']){
     fail='';await mount();const form=host.querySelector('form.mg-editor'),input=form.querySelector('[name=configBody]'),reason=form.querySelector('[name=reason]');reason.value='Synthetic advanced edits';input.value='{bad';const initial=writes;form.requestSubmit();await new Promise(r=>setTimeout(r));check('advanced invalid JSON sends no request',writes===initial);check('advanced syntax error can be corrected',!form.querySelector('[type=submit]').disabled);
     input.value=JSON.stringify({content:{message:{en:'Synthetic retained value'}}});form.requestSubmit();await new Promise(r=>setTimeout(r));form.querySelector('[data-draft-review]').click();await new Promise(r=>setTimeout(r));check('advanced review enables publish',!form.querySelector('[data-draft-publish]').disabled);
     const before=input.value;fail=code;form.querySelector('[data-draft-publish]').click();await new Promise(r=>setTimeout(r));check('advanced '+code+' blocks writes',['[type=submit]','[data-draft-review]','[data-draft-publish]'].every(q=>form.querySelector(q).disabled));check('advanced '+code+' retains JSON',input.value===before);const count=writes;form.requestSubmit();form.querySelector('[name=savedDraft]').dispatchEvent(new Event('change'));await new Promise(r=>setTimeout(r));check('advanced recovery cannot be bypassed',writes===count&&form.querySelector('[data-draft-publish]').disabled);
     fail='';form.querySelector('[data-config-reload]').click();await new Promise(r=>setTimeout(r));check('advanced reload recovers',!host.querySelector('form.mg-editor [type=submit]').disabled);
    }
    readFails=true;await mount();check('advanced unavailable draft list blocks saving',host.querySelector('form.mg-editor [type=submit]').disabled);check('advanced failed read allows reload',!host.querySelector('[data-config-reload]').disabled);
    return checks;
   },lang);
   assert.ok(result.length>=60);await page.screenshot({path:path.join(output,`${lang}-${width}-control-recovery.png`),fullPage:true});evidence.push({width,height,lang,assertions:result.length});
  }finally{await ctx.close();}
 }
 return evidence;
}
