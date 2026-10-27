/** Optional, pre-recorded public speech. This service never sends text to a speech provider. */
export const HANOI_ROOT='/voices/fpt-leminh-v1/';
export const HANOI_CACHE='sv-voices-fpt-leminh-v1';
export type HanoiManifest={schema:1;provider:'FPT Neo';model:'FPT.AI-VITs';voice:'leminh';language:'vi';signature:string;bytes:number;lines:Record<string,{bytes:number;sha256:string}>};
export type HanoiProgress={state:'loading'|'ready'|'waiting'|'nostore';done:number;total:number;bytes:number;provider:'Lê Minh';known?:boolean};
const valid=(m:HanoiManifest)=>m?.schema===1&&m.provider==='FPT Neo'&&m.model==='FPT.AI-VITs'&&m.voice==='leminh'&&m.language==='vi'&&!!m.lines&&Object.entries(m.lines).every(([id,l])=>/^[a-f0-9-]{8,40}$/.test(id)&&l.bytes>0&&/^[a-f0-9]{64}$/.test(l.sha256));
export function createHanoiPack({fetcher=fetch,storage=globalThis.caches,allowed=():boolean=>false,online=()=>navigator.onLine!==false,emit=(_p:HanoiProgress)=>{},pause=(ms:number)=>new Promise<void>(r=>setTimeout(r,ms)),baseURL=()=>location.href}={}){
 let manifest:HanoiManifest|null=null,loading:Promise<HanoiManifest|null>|null=null,job:Promise<number>|null=null,storageFailed=false;
 const load=():Promise<HanoiManifest|null>=>{
  if(manifest)return Promise.resolve(manifest);if(loading)return loading;
  loading=(async()=>{let cache:Cache|undefined;try{cache=await storage?.open(HANOI_CACHE);}catch{}
   try{const r=await fetcher(HANOI_ROOT+'manifest.json',{cache:'no-store',signal:AbortSignal.timeout(8000)});if(r.ok){const m=await r.clone().json();if(valid(m)){manifest=m;try{await cache?.put(HANOI_ROOT+'manifest.json',r);}catch{}return m;}}}catch{}
   try{const m=await(await cache?.match(HANOI_ROOT+'manifest.json'))?.json();if(valid(m)){manifest=m;return m;}}catch{}return null;
  })().finally(()=>{loading=null;});return loading;
 };
 const url=(m:HanoiManifest,id:string)=>m.lines[id]?HANOI_ROOT+id+'.mp3?v='+m.lines[id].sha256.slice(0,16):null;
 const recording=async(id:string)=>{const m=await load();return m?url(m,id):null;};
 const audio=async(u:string,signal?:AbortSignal):Promise<Response|null>=>{
  const m=await load(),id=u.slice(HANOI_ROOT.length).split('.mp3')[0];if(!m||url(m,id)!==u)return null;
  let cache:Cache|undefined;try{cache=await storage?.open(HANOI_CACHE);const saved=await cache?.match(u);if(saved)return saved;}catch{}
  try{const r=await fetcher(u,{signal:signal||AbortSignal.timeout(15000)});if(!r.ok)return null;
   const data=await r.clone().arrayBuffer();if(data.byteLength!==m.lines[id].bytes)return null;
   const digest=[...new Uint8Array(await crypto.subtle.digest('SHA-256',data))].map(b=>b.toString(16).padStart(2,'0')).join('');
   if(digest!==m.lines[id].sha256)return null;try{await cache?.put(u,r.clone());}catch{storageFailed=true;}return r;
  }catch{return null;}
 };
 const download=():Promise<number>=>{
  if(job)return job;
  job=(async()=>{
   const m=await load();if(!m)return 0;storageFailed=false;const ids=Object.keys(m.lines),total=ids.length;let done=0;
   const notify=(state:HanoiProgress['state'],known=false)=>emit({state,done,total,bytes:m.bytes,provider:'Lê Minh',known});
   let cache:Cache;try{cache=await storage.open(HANOI_CACHE);}catch{notify('nostore');return 0;}
   const have=new Set((await cache.keys()).map(r=>r.url));
   const missing=ids.filter(id=>!have.has(new URL(url(m,id),baseURL()).href));done=total-missing.length;notify(done===total?'ready':'loading',done===total);
   for(let i=0;i<missing.length;i+=3){
    if(!allowed()||!online())break;
    await Promise.all(missing.slice(i,i+3).map(async id=>{const u=url(m,id);if(await audio(u)&&await cache.match(u))done++;}));
    if(storageFailed){notify('nostore');return done;}
    notify(done===total?'ready':'loading');await pause(400);
   }
   if(done<total)notify('waiting');return done;
  })().finally(()=>{job=null;});return job;
 };
 return {load,recording,audio,download};
}
