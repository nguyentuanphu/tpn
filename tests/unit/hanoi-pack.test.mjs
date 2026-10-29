import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {createHanoiPack,HANOI_CACHE,HANOI_ROOT} from '../../js/hanoi-pack.ts';
const body=Buffer.from('synthetic audio bytes'),sha256=createHash('sha256').update(body).digest('hex');
const manifest={schema:1,provider:'FPT Neo',model:'FPT.AI-VITs',voice:'leminh',language:'vi',signature:'test',bytes:body.length*8,lines:Object.fromEntries(Array.from({length:8},(_,n)=>[(n+1).toString(16).padStart(16,'0'),{bytes:body.length,sha256}]))};
function fixture(){
 const stored=new Map(),requests=[],progress=[];let available=true,allowed=true,corrupt=false,stopAfter=Infinity,quota=false;
 const absolute=u=>new URL(typeof u==='string'?u:u.url,'https://game.test/').href;
 const cache={delete:async u=>stored.delete(absolute(u)),keys:async()=>[...stored.keys()].map(url=>({url})),match:async u=>stored.get(absolute(u))?.clone(),put:async(u,r)=>{if(quota&&u.includes('.mp3'))throw Error('quota');stored.set(absolute(u),r.clone());}};
 const storage={open:async name=>{assert.equal(name,HANOI_CACHE);return cache;}};
 const fetcher=async url=>{requests.push(url);if(!available)throw Error('offline');if(url.endsWith('manifest.json'))return Response.json(manifest);if(requests.filter(u=>u.includes('.mp3')).length===stopAfter)available=false;return new Response(corrupt?Buffer.alloc(body.length,1):body);};
 const create=()=>createHanoiPack({fetcher,storage,emit:p=>progress.push(p),allowed:()=>allowed,online:()=>available,pause:async()=>{},baseURL:()=> 'https://game.test/'});
 return {stored,requests,progress,create,setAvailable:v=>available=v,setAllowed:v=>allowed=v,setCorrupt:v=>corrupt=v,stopAfter:n=>stopAfter=n,setQuota:v=>quota=v};
}
test('optional pack shares its job and resumes after an outage without downloading saved clips again',async()=>{
 const f=fixture(),service=f.create();
 // Stop between batches, as a connection change does during a real download.
 const originalFetchCount=()=>f.requests.filter(u=>u.includes('.mp3')).length;
 f.setAllowed(false);assert.equal(await service.download(),0);assert.equal(originalFetchCount(),0);
 f.setAllowed(true);f.stopAfter(3);const first=service.download();assert.equal(service.download(),first);assert.equal(await first,3);
 assert.equal(originalFetchCount(),3);assert.equal(f.progress.at(-1).state,'waiting');f.setAvailable(true);f.stopAfter(Infinity);assert.equal(await service.download(),8);
 assert.equal(originalFetchCount(),8);assert.equal(await service.download(),8);assert.equal(originalFetchCount(),8);
 f.setAvailable(false);const reopened=f.create();assert.equal((await reopened.load()).voice,'leminh');
 assert.equal(await reopened.download(),8);assert.equal(originalFetchCount(),8);
 assert.ok(f.progress.every(p=>p.done<=p.total));assert.equal(f.progress.at(-1).state,'ready');
 assert.ok([...f.stored.keys()].every(u=>u.includes(HANOI_ROOT)));
});
test('wrong provider and corrupt files never become completed recordings',async()=>{
 const wrong=createHanoiPack({fetcher:async()=>Response.json({...manifest,voice:'banmai'}),storage:undefined});assert.equal(await wrong.load(),null);
 const f=fixture();f.setCorrupt(true);assert.equal(await f.create().download(),0);
 assert.equal([...f.stored.keys()].filter(u=>u.includes('.mp3')).length,0);assert.equal(f.progress.at(-1).state,'waiting');
});
test('recording lookup sends only canonical IDs to our own static pack, never private speech',async()=>{
 const f=fixture(),s=f.create();assert.equal(await s.recording('A child’s private answer'),null);
 const id=Object.keys(manifest.lines)[0];assert.ok((await s.recording(id)).startsWith(HANOI_ROOT+id+'.mp3?v='));
 assert.deepEqual(f.requests,[HANOI_ROOT+'manifest.json']);
});

test('a full device never reports uncached downloads as saved',async()=>{const f=fixture();f.setQuota(true);assert.equal(await f.create().download(),0);assert.equal(f.progress.at(-1).state,'nostore');assert.equal([...f.stored.keys()].filter(u=>u.includes('.mp3')).length,0);});

test('smaller pack upgrade retains verified old offline audio until a replacement is safely cached',async()=>{
 const id='1234567812345678',oldBytes=Buffer.from('larger original recording'),newBytes=Buffer.from('compact recording');
 const oldHash=createHash('sha256').update(oldBytes).digest('hex'),newHash=createHash('sha256').update(newBytes).digest('hex');
 const old={...manifest,signature:'old',bytes:oldBytes.length,lines:{[id]:{bytes:oldBytes.length,sha256:oldHash}}};
 const next={...manifest,signature:'new',bytes:newBytes.length,lines:{[id]:{bytes:newBytes.length,sha256:newHash}}};
 const stored=new Map(),absolute=u=>new URL(typeof u==='string'?u:u.url,'https://game.test/').href;
 const cache={match:async u=>stored.get(absolute(u))?.clone(),put:async(u,r)=>stored.set(absolute(u),r.clone()),delete:async u=>stored.delete(absolute(u)),keys:async()=>[...stored.keys()].map(url=>({url}))};
 const oldURL=HANOI_ROOT+id+'.mp3?v='+oldHash.slice(0,16);await cache.put(HANOI_ROOT+'manifest.json',Response.json(old));await cache.put(oldURL,new Response(oldBytes));
 let offline=true;
 const service=createHanoiPack({storage:{open:async()=>cache},baseURL:()=> 'https://game.test/',fetcher:async u=>{if(u.endsWith('manifest.json'))return Response.json(next);if(offline)throw Error('offline');return new Response(newBytes);}});
 const u=await service.recording(id);assert.notEqual(u,oldURL);
 assert.deepEqual(Buffer.from(await(await service.audio(u)).arrayBuffer()),oldBytes);
 assert.ok(await cache.match(oldURL),'old audio retained while offline');assert.equal(await cache.match(u),undefined);
 offline=false;assert.deepEqual(Buffer.from(await(await service.audio(u)).arrayBuffer()),newBytes);
 assert.equal(await cache.match(oldURL),undefined,'only delete original after replacement is verified and stored');assert.ok(await cache.match(u));
});
