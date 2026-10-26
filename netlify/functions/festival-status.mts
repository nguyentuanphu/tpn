// Public festival settings only. Never expose family content, device lists or admin identities.
import bundled from '../../content/custom.json' with {type:'json'};
import {FESTCAL} from '../../js/content/festcal.js';
import {festivalVisibleIn,type FestivalVisibility} from '../../js/content/festival-visibility.ts';
import {cleanLive} from '../lib/live.mts';
const blobs=()=>import('@netlify/blobs').then(m=>m.getStore({name:'live',consistency:'strong'}));
export const makeFestivalStatus=({liveStore=blobs,base=bundled as FestivalVisibility,now=()=>new Date()}={})=>async()=>{
 try{
  const store=await liveStore(),raw=await store.get('live',{type:'json'}) as (Parameters<typeof cleanLive>[0]&{at?:unknown})|null,live=cleanLive(raw||{});
  const enabled:string[]=[],festivals:Record<string,{date?:string;buildup?:number|string}>={};
  for(const f of FESTCAL){
   if(!festivalVisibleIn(f.id,live,base,now()))continue;
   enabled.push(f.id);const rule=live.festivals[f.id]??base.festivals?.[f.id];
   if(rule)festivals[f.id]={...(rule.date?{date:rule.date}:{}),...(rule.buildup!=null?{buildup:rule.buildup}:{})};
  }
  return Response.json({schema:1,enabled,festivals,at:typeof raw?.at==='string'?raw.at:null},{headers:{'Cache-Control':'no-store'}});
 }catch{return Response.json({error:'Festival settings temporarily unavailable'},{status:503,headers:{'Cache-Control':'no-store'}});}
};
export default makeFestivalStatus();
export const config={path:'/api/festivals'};
