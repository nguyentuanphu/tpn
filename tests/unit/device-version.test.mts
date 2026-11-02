import test from 'node:test';
import assert from 'node:assert/strict';
import { clean, hello, live, report } from '../../netlify/lib/players.mts';
const NOW=Date.UTC(2026,9,14,7), ID='device000001';
const memory=()=>{const m=new Map();return {get:async(k,o)=>m.has(k)?o?.type==='json'?JSON.parse(m.get(k)):m.get(k):null,set:async(k,v)=>m.set(k,String(v)),setJSON:async(k,v)=>m.set(k,JSON.stringify(v)),delete:async k=>m.delete(k),list:async({prefix=''})=>({blobs:[...m.keys()].filter(k=>k.startsWith(prefix)).map(key=>({key}))})};};
const message=(extra={})=>({id:ID,h:'batch00000000001',b:'r75',sid:'a'.repeat(16),started:NOW,l:'en',d:'phone',days:[{d:'2026-10-14',build:'r75',m:5,g:{},t:0,o:0}],...extra});
test('same installation on two versions stays one device; history and latest are distinct',async()=>{
 const S=memory();await hello(S,message({days:[{d:'2026-10-14',build:'r74',m:5},{d:'2026-10-14',build:'r75',m:7}]}),NOW);
 const R=await report(S,NOW);assert.equal(R.week.devices,1);assert.equal(R.allTime,1);assert.equal(R.devices.length,1);assert.equal(R.devices[0].mins,12);
 assert.deepEqual(R.builds,{r74:1,r75:1});assert.deepEqual(R.latestBuilds,{r75:1});
});
test('delayed old tab does not replace the newer session version or double count resend',async()=>{
 const S=memory();await hello(S,message(),NOW);const old=message({h:'batch00000000002',b:'r74',started:NOW-3600000,days:[{d:'2026-10-13',build:'r74',m:9}]});
 await hello(S,old,NOW+1000);await hello(S,old,NOW+2000);const R=await report(S,NOW+3000);
 assert.equal(R.devices[0].build,'r75');assert.equal(R.devices[0].mins,14);assert.equal(R.week.devices,1);assert.equal(R.builds.r74,1);
});
test('older untagged migrated history is unknown, not relabelled as upload-time build',()=>{
 const d=clean(message({days:[{d:'2026-10-13',m:8}]}),NOW);assert.equal(d.days[0].build,'?');
 const legacy=clean(message({sid:undefined,started:undefined,b:'r74',days:[{d:'2026-10-13',m:8}]}),NOW);assert.equal(legacy.days[0].build,'r74');
});
test('duplicates within a day/build are dropped but different originating builds survive',()=>{
 const d=clean(message({days:[{d:'2026-10-14',build:'r74',m:5},{d:'2026-10-14',build:'r74',m:5},{d:'2026-10-14',build:'r75',m:7}]}),NOW);
 assert.equal(d.days.length,2);assert.deepEqual(d.days.map(x=>x.build),['r74','r75']);
});
test('two tabs share identity and ending one leaves the other online',async()=>{
 const S=memory();await hello(S,message(),NOW);await live(S,{id:ID,sid:'a'.repeat(16),b:'r75',live:1},NOW);await live(S,{id:ID,sid:'b'.repeat(16),b:'r74',live:1},NOW+1);
 let R=await report(S,NOW+2);assert.equal(R.onlineNow,1);assert.deepEqual(new Set(R.devices[0].activeVersions),new Set(['r74','r75']));
 await live(S,{id:ID,sid:'b'.repeat(16),b:'r74',live:0},NOW+3);R=await report(S,NOW+4);assert.equal(R.onlineNow,1);assert.deepEqual(R.devices[0].activeVersions,['r75']);
});
test('legacy old-build upload cannot overwrite a known newer-session version',async()=>{
 const S=memory();await hello(S,message(),NOW);await hello(S,message({h:'batch00000000003',sid:undefined,started:undefined,b:'r74'}),NOW+1000);
 assert.equal((await report(S,NOW+1001)).devices[0].build,'r75');
});
test('version totals cover every installation even when detail cards are capped',async()=>{
 const S=memory();for(let i=0;i<105;i++)await hello(S,message({id:'device'+String(i).padStart(6,'0'),h:'batch'+String(i).padStart(11,'0')}),NOW);
 const R=await report(S,NOW);assert.equal(R.week.devices,105);assert.equal(R.latestBuilds.r75,105);assert.equal(R.devices.length,100);assert.equal(R.deviceListTotal,105);
});

test('analytics reads paginated lifetime count while daily totals are still loading', async () => {
 const S=memory(), get=S.get, list=S.list; let release;
 const held=new Promise(resolve=>{release=resolve;}); let countStarted=false;
 S.get=async(k,o)=>{if(k.startsWith('sum/')) await held; return get(k,o);};
 S.list=async opts=>{if(opts.prefix==='dev/'){countStarted=true; return opts.cursor ? {blobs:[{key:'dev/device000003'}]} : {blobs:[{key:'dev/device000001'},{key:'dev/device000002'}],cursor:'next'};} return list(opts);};
 const pending=report(S,NOW);
 await new Promise(resolve=>setImmediate(resolve));
 const overlapped=countStarted; release(); const R=await pending;
 assert.equal(overlapped,true,'lifetime count must not wait for all daily reads');
 assert.equal(R.allTime,3,'all pages still count'); assert.equal(R.perDay.length,30);
});
test('(r80) installations not seen for 30 days or more are listed by the version they last had', async () => {
 const S = memory(), OLD = NOW - 40 * 864e5;
 await hello(S, message({ id: 'device000002', b: 'r75', days: [{ d: new Date(OLD).toISOString().slice(0, 10), build: 'r75', m: 4 }] }), OLD);
 await hello(S, message({ h: 'batch00000000009', b: 'r79', days: [{ d: '2026-10-14', build: 'r79', m: 6 }] }), NOW);
 const R = await report(S, NOW);
 assert.deepEqual(R.away30, { r75: 1 }); assert.deepEqual(R.latestBuilds, { r79: 1 });
});
