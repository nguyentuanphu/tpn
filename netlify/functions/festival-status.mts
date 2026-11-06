// Public festival settings only. Never expose family content, device lists or admin identities.
// (v1.08) It also carries the release calendar's moves (dates only), so the website's What's new strip and Calendar part
// read nothing but this public snapshot (check festivalsync): `calendar` is there only when Studio has moved something.
import bundled from '../../content/custom.json' with {type:'json'};
import {FESTCAL} from '../../js/content/festcal.js';
import {projectPublicFestivals,type FestivalVisibility} from '../../js/content/festival-visibility.ts';
import {cleanLive,cleanContent,readContent} from '../lib/live.mts';
const blobs=()=>import('@netlify/blobs').then(m=>m.getStore({name:'live',consistency:'strong'}));
type Store={get:(key:string,o:{type:'json'})=>Promise<any>};
// the moves from the same place /api/live takes its content from (netlify/functions/live.mts): the management projection
// when it is valid, else the content pages; cleaned again, so only "<kind>:<id>" -> "YYYY-MM-DD" ever leaves
const calendarMoves=async(S:Store):Promise<Record<string,string>|null>=>{
 const projected=await S.get('management-live',{type:'json'}).catch(()=>null),m=projected?.management;
 const valid=m?.scopeKey==='global'&&Number.isSafeInteger(m.revision)&&m.revision>0&&/^[0-9a-f]{64}$/.test(m.effectiveHash||'');
 const content=valid?projected.content:(await readContent(S)).content,cal=content&&content.releaseCalendar;
 if(!cal)return null;const moves=(cleanContent({releaseCalendar:cal}).releaseCalendar as {moves:Record<string,string>}).moves;
 return Object.keys(moves).length?moves:null;
};
export const makeFestivalStatus=({liveStore=blobs,base=bundled as FestivalVisibility,now=()=>new Date()}={})=>async()=>{
 try{
  const store=await liveStore(),raw=await store.get('live',{type:'json'}) as (Parameters<typeof cleanLive>[0]&{at?:unknown})|null,live=cleanLive(raw||{});
  const moves=await calendarMoves(store as Store).catch(()=>null);
  return Response.json({...projectPublicFestivals(FESTCAL.map(f=>f.id),{...live,at:raw?.at},base,now()),...(moves?{calendar:{moves}}:{})},{headers:{'Cache-Control':'no-store'}});
 }catch{return Response.json({error:'Festival settings temporarily unavailable'},{status:503,headers:{'Cache-Control':'no-store'}});}
};
export default makeFestivalStatus();
export const config={path:'/api/festivals'};
