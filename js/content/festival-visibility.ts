/** Public festival rules shared by game, website and Studio. An explicit off always wins. */
export type FestivalSwitch = { on?: boolean; date?: string; buildup?: number | string; deco?: number | string };
export type FestivalRelease = { on?: boolean; start?: string; days?: number };
export type FestivalVisibility = { festivals?: Record<string,FestivalSwitch>; releases?: Record<string,FestivalRelease> };
export const festivalSwitchedOn=(festival?:FestivalSwitch|null,release?:FestivalRelease|null)=>festival?.on!==false&&release?.on!==false;
export function festivalVisible(festival?:FestivalSwitch|null,release?:FestivalRelease|null,now=new Date()):boolean {
 if(!festivalSwitchedOn(festival,release))return false;
 const parts=Object.fromEntries(new Intl.DateTimeFormat('en-AU',{timeZone:'Australia/Sydney',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(now).map(p=>[p.type,p.value]));
 const today=Date.UTC(+parts.year,+parts.month-1,+parts.day);
 const start=release?.start&&/^\d{4}-\d\d-\d\d$/.test(release.start)?Date.parse(release.start+'T00:00:00Z'):NaN;
 if(Number.isFinite(start)){
  if(today<start)return false;
  if(release?.days>0&&today>=start+release.days*864e5)return false;
 }
 return true;
}
export function festivalVisibleIn(id:string,live:FestivalVisibility={},base:FestivalVisibility={},now=new Date()):boolean {
 return festivalVisible(live.festivals?.[id]??base.festivals?.[id],live.releases?.['fest_'+id]??base.releases?.['fest_'+id],now);
}
