// A cached-first manifest must become current in the same running game after its network refresh.
// (r82, lighter loading) the game now reads one list per language (voices/manifest-en.json): the same cached-first refresh is checked on it
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import { lineHash } from '../js/packhash.js';
import { launch, open, clear } from './harness.mts';
const root=path.resolve('..'), current=JSON.parse(fs.readFileSync(path.join(root,'voices/manifest-en.json'),'utf8'));
const hash=lineHash('en','Pattern Picnic'), old=structuredClone(current);
assert.ok(current.lines[hash],'New recording must exist before testing refresh');delete old.lines[hash];
let fresh=false,release=null,requests=0;
const types={'.js':'text/javascript','.css':'text/css','.html':'text/html','.json':'application/json','.woff2':'font/woff2','.webmanifest':'application/manifest+json','.png':'image/png','.mp3':'audio/mpeg'};
const server=http.createServer((req,res)=>{
  const pathname=decodeURIComponent(new URL(req.url,'http://test').pathname);
  if(pathname==='/voices/manifest-en.json') {
    const send=()=>{res.writeHead(200,{'Content-Type':'application/json','Cache-Control':'no-store'});res.end(JSON.stringify(fresh?current:old));};
    if(fresh){requests++;release=send;}else send();return;
  }
  const file=path.resolve(root,'.'+(pathname.endsWith('/')?pathname+'index.html':pathname));
  if(!file.startsWith(root+path.sep)||!fs.existsSync(file)||!fs.statSync(file).isFile()){res.writeHead(404);res.end();return;}
  res.writeHead(200,{'Content-Type':types[path.extname(file)]||'application/octet-stream'});fs.createReadStream(file).pipe(res);
});
await new Promise(resolve=>server.listen(0,'127.0.0.2',resolve));
const browser=await launch();
try {
  const url=`http://127.0.0.2:${server.address().port}/`,P=await open(browser,{url,w:390,h:844,touch:true,settings:{voice:false}});await clear(P.page);
  await P.page.waitForFunction(async()=>!!(await navigator.serviceWorker.getRegistration())?.active,null,{timeout:120000});
  await P.page.waitForFunction(()=>!!navigator.serviceWorker.controller,null,{timeout:30000});
  await P.page.waitForFunction(async()=>!!(await import('/js/voice.js')).voicePack(),null,{timeout:30000});
  assert.equal(await P.page.evaluate(async hash=>!!(await import('/js/voice.js')).voicePack().lines[hash],hash),false,'Start from the cached older manifest');
  const before=await P.page.evaluate(async()=>{window.__refreshPack=(await import('/js/voice.js')).voicePack();window.__refreshSentinel='same-page';return Object.keys(window.__refreshPack.lines).length;});
  await P.page.evaluate(async old=>{const c=await caches.open('sv-voices');await c.put(new URL('voices/manifest-en.json',location.href),new Response(JSON.stringify(old),{headers:{'Content-Type':'application/json'}}));},old);
  fresh=true;
  const received=await P.page.evaluate(async()=>await(await fetch('voices/manifest-en.json')).json());
  assert.equal(!!received.lines[hash],false,'Cached manifest must return before delayed network');
  for(let n=0;n<100&&!release;n++)await new Promise(r=>setTimeout(r,50));assert.ok(release&&requests,'Background refresh must reach the server');release();
  let cachedFresh=false,updated=false;
  const deadline=Date.now()+15000;
  while(Date.now()<deadline) {
    cachedFresh=await P.page.evaluate(async hash=>{const r=await(await caches.open('sv-voices')).match(new URL('voices/manifest-en.json',location.href));return !!(r&&(await r.json()).lines[hash]);},hash);
    updated=await P.page.evaluate(async hash=>!!(await import('/js/voice.js')).voicePack()?.lines[hash],hash);
    if(cachedFresh&&updated)break;await new Promise(r=>setTimeout(r,100));
  }
  assert.ok(cachedFresh,'Network refresh must actually update the cached manifest');
  const after=await P.page.evaluate(async hash=>{const pack=(await import('/js/voice.js')).voicePack();return {samePage:window.__refreshSentinel==='same-page',samePack:pack===window.__refreshPack,lines:Object.keys(pack.lines).length,has:!!pack.lines[hash]};},hash);
  assert.ok(updated&&after.has&&after.samePage,'Network refresh updated cache but running voicePack stayed old until reload: '+JSON.stringify({before,after}));
  await P.ctx.setOffline(true);
  const cached=await P.page.evaluate(async hash=>!!(await(await fetch('voices/manifest-en.json')).json()).lines[hash],hash);
  assert.ok(cached,'Fresh recording index remains available offline');
  const errors=P.errors.filter(x=>!/Failed to fetch|NetworkError|ERR_INTERNET_DISCONNECTED|aborted/i.test(x));assert.deepEqual(errors,[]);
  await P.ctx.close();console.log('Older cached manifest returns immediately; delayed fresh index reaches the running game without reload and remains available offline');
} finally {await browser.close();server.closeAllConnections();server.close();}
