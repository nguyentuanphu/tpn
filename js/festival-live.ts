/** A shared, public-only snapshot. Never read or store family answers, profiles or photos. */
export type PublicFestivals={schema:1;enabled:string[];festivals:Record<string,{date?:string;buildup?:number|string}>;at?:string|null};
const KEY='sv_public_festivals_v1',listeners=new Set<()=>void>();
let snapshot:PublicFestivals|null=null,started=false,inflight:Promise<void>|null=null,revision=0;
let boot:Promise<PublicFestivals|null>|null=null;
/** Only the game supplies this public projection; website consumers keep the standalone public endpoint. */
export function configureFestivalStartup(value:Promise<PublicFestivals|null>){if(!started)boot=value;}
const accept=(next:PublicFestivals)=>{revision++;if(JSON.stringify(snapshot)!==JSON.stringify(next)){snapshot=next;try{localStorage.setItem(KEY,JSON.stringify(next));}catch{}listeners.forEach(fn=>fn());}};
const valid=(v:unknown):v is PublicFestivals=>!!v&&typeof v==='object'&&(v as PublicFestivals).schema===1&&Array.isArray((v as PublicFestivals).enabled)&&(v as PublicFestivals).enabled.length<=100&&(v as PublicFestivals).enabled.every(x=>typeof x==='string'&&/^[\w-]{1,40}$/.test(x))&&!!(v as PublicFestivals).festivals&&typeof (v as PublicFestivals).festivals==='object';
try{if(typeof localStorage!=='undefined'){const saved=JSON.parse(localStorage.getItem(KEY)||'null');if(valid(saved))snapshot=saved;}}catch{}
export const publicFestivals=()=>snapshot;
export const onPublicFestivals=(fn:()=>void)=>{listeners.add(fn);return()=>listeners.delete(fn);};
export function refreshPublicFestivals():Promise<void>{
 if(inflight)return inflight;
 inflight=(async()=>{const ctl=new AbortController(),timer=setTimeout(()=>ctl.abort(),8000);try{
  const response=await fetch('/api/festivals',{cache:'no-store',signal:ctl.signal});
  if(!response.ok||!response.headers.get('content-type')?.includes('json'))return;
  const next=await response.json();if(!valid(next))return;
  accept(next);
 }catch{}finally{clearTimeout(timer);inflight=null;}})();return inflight;
}
export function startPublicFestivals(){
 if(started||typeof document==='undefined')return;started=true;
 if(boot){const before=revision;void boot.then(next=>{if(valid(next)&&revision===before)accept(next);}).catch(()=>{});}
 else void refreshPublicFestivals();
 document.addEventListener('visibilitychange',()=>{if(!document.hidden)void refreshPublicFestivals();});
 window.addEventListener('focus',()=>void refreshPublicFestivals());
 setInterval(()=>{if(!document.hidden)void refreshPublicFestivals();},60000);
}
