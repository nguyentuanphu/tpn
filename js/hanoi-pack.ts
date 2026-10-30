/** Optional, pre-recorded public speech. This service never sends text to a speech provider. */
import { createVoiceStore, storeKey } from './voicestore.js';
export const HANOI_ROOT='/voices/fpt-leminh-v1/';
export const HANOI_CACHE='sv-voices-fpt-leminh-v1';
// (owner, 29 Oct 2026 AEDT) AbortSignal.timeout is missing before Safari 16 (an iPad Air 2): a signal that aborts after ms
const timeoutSignal=(ms:number):AbortSignal=>{const c=new AbortController();setTimeout(()=>c.abort(),ms);return c.signal;};
export type HanoiManifest={schema:1;provider:'FPT Neo';model:'FPT.AI-VITs';voice:'leminh';language:'vi';signature:string;bytes:number;lines:Record<string,{bytes:number;sha256:string}>};
export type HanoiProgress={state:'loading'|'ready'|'waiting'|'nostore';done:number;total:number;bytes:number;provider:'Lê Minh';known?:boolean};
const valid=(m:HanoiManifest)=>m?.schema===1&&m.provider==='FPT Neo'&&m.model==='FPT.AI-VITs'&&m.voice==='leminh'&&m.language==='vi'&&!!m.lines&&Object.entries(m.lines).every(([id,l])=>/^[a-f0-9-]{8,40}$/.test(id)&&l.bytes>0&&/^[a-f0-9]{64}$/.test(l.sha256));
export function createHanoiPack({fetcher=fetch,storage=globalThis.caches,allowed=():boolean=>false,online=()=>navigator.onLine!==false,emit=(_p:HanoiProgress)=>{},pause=(ms:number)=>new Promise<void>(r=>setTimeout(r,ms)),baseURL=()=>location.href}={}){
 let previous:HanoiManifest|null=null;
 // (31 Oct 2026 AEDT) the recordings are kept as a few big bundles with one index (js/voicestore.ts), not 7,000 single files
 const store=storage?createVoiceStore(HANOI_CACHE,{open:n=>storage.open(n),base:baseURL,dir:HANOI_ROOT.slice(1)+'__store/'}):null;
 let manifest:HanoiManifest|null=null,loading:Promise<HanoiManifest|null>|null=null,job:Promise<number>|null=null,storageFailed=false;
 const load=():Promise<HanoiManifest|null>=>{
  if(manifest)return Promise.resolve(manifest);if(loading)return loading;
  loading=(async()=>{let cache:Cache|undefined;try{cache=await storage?.open(HANOI_CACHE);}catch{}
   try{const r=await fetcher(HANOI_ROOT+'manifest.json',{cache:'no-store',signal:timeoutSignal(8000)});if(r.ok){const m=await r.clone().json();if(valid(m)){
    try{const old=await cache?.match(HANOI_ROOT+'manifest.json'),prior=old&&await old.clone().json();if(valid(prior)&&prior.signature!==m.signature){previous=prior;await cache?.put(HANOI_ROOT+'previous-manifest.json',old!);}
     else{const kept=await(await cache?.match(HANOI_ROOT+'previous-manifest.json'))?.json();if(valid(kept))previous=kept;}}catch{}
    manifest=m;try{await cache?.put(HANOI_ROOT+'manifest.json',r);}catch{}return m;}}}catch{}
   try{const m=await(await cache?.match(HANOI_ROOT+'manifest.json'))?.json();if(valid(m)){manifest=m;const kept=await(await cache?.match(HANOI_ROOT+'previous-manifest.json'))?.json();if(valid(kept))previous=kept;return m;}}catch{}return null;
  })().finally(()=>{loading=null;});return loading;
 };
 const url=(m:HanoiManifest,id:string)=>m.lines[id]?HANOI_ROOT+id+'.mp3?v='+m.lines[id].sha256.slice(0,16):null;
 const recording=async(id:string)=>{const m=await load();return m?url(m,id):null;};
 const audio=async(u:string,signal?:AbortSignal):Promise<Response|null>=>{
  if(signal?.aborted)return null;
  const m=await load(),id=u.slice(HANOI_ROOT.length).split('.mp3')[0];if(!m||url(m,id)!==u)return null;
  try{const saved=await store?.get(u);if(saved)return saved;}catch{}
  // Preserve verified old offline speech until its smaller replacement is safely cached.
  const legacy=async()=>{if(signal?.aborted)return null;if(!previous?.lines[id]||previous.lines[id].sha256===m.lines[id].sha256)return null;try{const r=await store?.get(url(previous,id)!);if(!r)return null;const b=await r.clone().arrayBuffer(),hash=[...new Uint8Array(await crypto.subtle.digest('SHA-256',b))].map(x=>x.toString(16).padStart(2,'0')).join('');return b.byteLength===previous.lines[id].bytes&&hash===previous.lines[id].sha256?r:null;}catch{return null;}};
  try{const r=await fetcher(u,{signal:signal||timeoutSignal(15000)});if(!r.ok)return legacy();
   const data=await r.clone().arrayBuffer();if(data.byteLength!==m.lines[id].bytes)return legacy();
   const digest=[...new Uint8Array(await crypto.subtle.digest('SHA-256',data))].map(b=>b.toString(16).padStart(2,'0')).join('');
   if(digest!==m.lines[id].sha256)return legacy();try{if(!store)throw Error('no store');await store.add(u,data);if(previous?.lines[id]&&url(previous,id)!==u)await store.forget(url(previous,id)!);}catch{storageFailed=true;}return r;
  }catch{return legacy();}
 };
 const download=():Promise<number>=>{
  if(job)return job;
  job=(async()=>{
   const m=await load();if(!m)return 0;storageFailed=false;const ids=Object.keys(m.lines),total=ids.length;let done=0;
   const notify=(state:HanoiProgress['state'],known=false)=>emit({state,done,total,bytes:m.bytes,provider:'Lê Minh',known});
   try{if(!store)throw Error('no store');await storage.open(HANOI_CACHE);}catch{notify('nostore');return 0;}
   await store!.migrate(pause); // (recordings kept the old way, one file each, move into bundles first)
   const have=await store!.keys();
   const missing=ids.filter(id=>!have.has(storeKey(url(m,id)!,baseURL())));done=total-missing.length;notify(done===total?'ready':'loading',done===total);
   for(let i=0;i<missing.length;i+=3){
    if(!allowed()||!online())break;
    await Promise.all(missing.slice(i,i+3).map(async id=>{const u=url(m,id)!;if(await audio(u)&&await store!.has(u))done++;}));
    if(!storageFailed&&(i+3)%30===0)try{await store!.flush();}catch{storageFailed=true;}
    if(storageFailed){notify('nostore');return done;}
    notify(done===total?'ready':'loading');await pause(400);
   }
   try{await store!.flush();}catch{notify('nostore');return 0;}
   if(done<total)notify('waiting');return done;
  })().finally(()=>{job=null;});return job;
 };
 // write the recordings still waiting (the page is going away, or a check wants them kept now)
 const flush=()=>store?store.flush():Promise.resolve();
 return {load,recording,audio,download,flush};
}
