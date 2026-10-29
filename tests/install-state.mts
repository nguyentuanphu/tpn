import test from 'node:test';
import assert from 'node:assert/strict';
import {installEvidence,combineInstallEvidence,standaloneDisplay} from '../js/content/install-state.ts';
import {clean} from '../netlify/lib/hello-clean.mts';
import {hello,report} from '../netlify/lib/players.mts';
const NOW=Date.UTC(2026,9,29,1),DAY='2026-10-29';
function memory(){const values=new Map<string,string>();return {get:async(key:string,o?:{type?:string})=>values.has(key)?o?.type==='json'?JSON.parse(values.get(key)!):values.get(key):null,set:async(key:string,v:unknown)=>{values.set(key,String(v));},setJSON:async(key:string,v:unknown)=>{values.set(key,JSON.stringify(v));},delete:async(key:string)=>{values.delete(key);},list:async({prefix=''}={})=>({blobs:[...values.keys()].filter(k=>k.startsWith(prefix)).map(key=>({key}))})};}

test('only a native install event or actual app display mode is installation evidence',()=>{
 for(const bad of[null,undefined,true,1,'1','accepted','dismissed','installed',{name:'a child'}])assert.equal(installEvidence(bad), '');
 assert.equal(installEvidence('native'),'native');assert.equal(installEvidence('standalone'),'standalone');assert.equal(installEvidence('',true),'standalone');
 assert.equal(standaloneDisplay(false,false,false),false);assert.equal(standaloneDisplay('true',false,false),false);assert.equal(standaloneDisplay(true,false,false),true);assert.equal(standaloneDisplay(false,true,false),true);assert.equal(standaloneDisplay(false,false,true),true);
 for(const previous of['','native','standalone'])for(const next of['','native','standalone'])assert.equal(combineInstallEvidence(previous,next),previous==='standalone'||next==='standalone'?'standalone':previous==='native'||next==='native'?'native':'');
});
test('hello bounds install evidence and treats legacy actual app launches as observations',()=>{
 const base={id:'device000001',b:'v1.02'};
 assert.equal(clean({...base,a:true},NOW)?.install,'standalone');
 for(const value of['false','true',1,{},[]]){const got=clean({...base,a:value,install:'untrusted'},NOW);assert.equal(got?.app,false);assert.equal(got?.install,'');}
 assert.equal(clean({...base,a:false,install:'native'},NOW)?.install,'native');assert.equal(clean({...base,a:false,install:'standalone'},NOW)?.install,'standalone');
 assert.equal(clean({...base,install:{name:'private'}},NOW)?.install,'');
});
test('confirmed history survives later browser and stale hellos; missing evidence stays unconfirmed',async()=>{
 const S=memory(),id='device000001',base={id,b:'v1.02',sid:'a'.repeat(16),started:NOW-1000,days:[{d:DAY,build:'v1.02',m:1}]};
 await hello(S,{...base,a:false,install:'native'},NOW);
 const first=await S.get('info/'+id,{type:'json'});assert.equal(first.installation,'native');assert.equal(first.installationSeen,DAY);
 await hello(S,{...base,sid:'b'.repeat(16),started:NOW,a:true},NOW+1000);
 await hello(S,{...base,sid:'c'.repeat(16),started:NOW+2000,a:false,install:''},NOW+2000);
 await hello(S,{...base,a:true,install:'native'},NOW+3000); // stale session cannot replace the latest browser context
 const current=await S.get('info/'+id,{type:'json'});assert.equal(current.app,false);assert.equal(current.installation,'standalone');assert.equal(current.installationSeen,DAY);
 await hello(S,{id:'device000002',b:'v1.02',days:[{d:DAY,build:'v1.02',m:1}]},NOW);
 await S.setJSON('info/device000003',{app:true,first:DAY,last:DAY,kind:'tablet'}); // genuine old-format standalone observation; no date invented
 const result=await report(S,NOW+3000),known=result.devices.find(d=>d.id===id),unknown=result.devices.find(d=>d.id==='device000002'),legacy=result.devices.find(d=>d.id==='device000003');
 assert.equal(known?.installation,'standalone');assert.equal(known?.app,false);assert.equal(unknown?.installation,'');assert.equal(legacy?.installation,'standalone');assert.equal(legacy?.installationSeen,'');
 assert.deepEqual(result.installations,{confirmed:2,lastStandalone:1,unconfirmed:1});
});
