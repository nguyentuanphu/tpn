/** Public festival rules shared by game, website and Studio. An explicit off always wins. */
export type FestivalSwitch = { on?: boolean; date?: string; buildup?: number | string; deco?: number | string };
export type FestivalRelease = { on?: boolean; start?: string; days?: number };
export type FestivalVisibility = { festivals?: Record<string,FestivalSwitch>; releases?: Record<string,FestivalRelease> };
export const festivalSwitchedOn=(festival?:FestivalSwitch|null,release?:FestivalRelease|null)=>festival?.on!==false&&release?.on!==false;
let sydneyDay:Intl.DateTimeFormat|undefined;
export function sydneyFestivalDate(now=new Date()):string{
 sydneyDay??=new Intl.DateTimeFormat('en-AU',{timeZone:'Australia/Sydney',year:'numeric',month:'2-digit',day:'2-digit'});
 const p=Object.fromEntries(sydneyDay.formatToParts(now).map(p=>[p.type,p.value]));
 return `${p.year}-${p.month}-${p.day}`;
}
export function festivalScheduled(release:FestivalRelease|undefined,days=1,now=new Date()):boolean{
 return !!release?.start&&festivalVisible({}, {...release,days:release.days>0?release.days:days},now)&&/^\d{4}-\d\d-\d\d$/.test(release.start)&&Number.isFinite(Date.parse(release.start+'T00:00:00Z'));
}
export function festivalVisible(festival?:FestivalSwitch|null,release?:FestivalRelease|null,now=new Date()):boolean {
 if(!festivalSwitchedOn(festival,release))return false;
 const start=release?.start&&/^\d{4}-\d\d-\d\d$/.test(release.start)?Date.parse(release.start+'T00:00:00Z'):NaN;
 // Most calls have no release window: do no calendar work for them. Reuse the formatter for scheduled rules.
 if(!Number.isFinite(start))return true;
 const today=Date.parse(sydneyFestivalDate(now)+'T00:00:00Z');
 if(today<start)return false;
 if(release?.days>0&&today>=start+release.days*864e5)return false;
 return true;
}
export function festivalVisibleIn(id:string,live:FestivalVisibility={},base:FestivalVisibility={},now=new Date()):boolean {
 return festivalVisible(live.festivals?.[id]??base.festivals?.[id],live.releases?.['fest_'+id]??base.releases?.['fest_'+id],now);
}

export type PublicFestivalSnapshot={schema:1;enabled:string[];festivals:Record<string,{date?:string;buildup?:number|string}>;at:string|null};
/** One projection for the game bootstrap and the public website endpoint; family fields never enter it. */
export function projectPublicFestivals(ids:readonly string[],live:FestivalVisibility&{at?:unknown}={},base:FestivalVisibility={},now=new Date()):PublicFestivalSnapshot{
 const enabled:string[]=[],festivals:PublicFestivalSnapshot['festivals']={};
 for(const id of ids){
  if(!festivalVisibleIn(id,live,base,now))continue;
  enabled.push(id);const rule=live.festivals?.[id]??base.festivals?.[id];
  if(rule)festivals[id]={...(typeof rule.date==='string'?{date:rule.date}:{}),...((typeof rule.buildup==='number'&&Number.isFinite(rule.buildup)||typeof rule.buildup==='string')?{buildup:rule.buildup}:{})};
 }
 return{schema:1,enabled,festivals,at:typeof live.at==='string'?live.at:null};
}
