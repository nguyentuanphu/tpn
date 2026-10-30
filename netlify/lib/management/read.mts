// Management reads deliberately avoid report()'s capped device list and write-side tidy/cache paths.
import { buildRank, isBuild } from '../build-number.mts';
import { count, day, ManagementReadError, object, pageRows, parseManagementQuery, safeText } from './quality.mts';
import type { ManagementQuery } from './quality.mts';
import { legacyMetrics, metric, performance, sumValues } from './metrics.mts';

export type ManagementStore = {
  get(key: string, options?: {type: 'json'}): Promise<unknown>;
  list(options: {prefix: string, cursor?: string}): Promise<{blobs: {key: string}[], cursor?: string}>;
};
type StoreSource = ManagementStore | (()=>Promise<ManagementStore> | ManagementStore);
export type CatalogueEntry = { id: string; kind: string; name: {en: string,vi: string}; area?: string; sourceCommit?: string; guide?: unknown; coverage?: unknown; [k:string]: unknown };
type Dependencies = {
  playersStore: StoreSource; botStore?: StoreSource; parentAnalyticsStore?: StoreSource; testerStore?: StoreSource;
  catalogue?: CatalogueEntry[] | (()=>Promise<CatalogueEntry[]> | CatalogueEntry[]); now?: ()=>number;
  // (owner, 30 Oct 2026 AEDT: "Studio loads too slow, especially after selecting the date") the live Studio names its
  // store here so finished days are kept between requests; without a name (the tests) every read is fresh
  cacheKey?: string;
};
type ReadOptions = {includeProfileContext?: boolean};
type Daily = {id: string; date: string; value: Record<string,any>};
const DEVICE = /^[a-z0-9]{10,24}$/, PROFILE = /^[\w-]{1,32}$/;
const readJson = async (s: ManagementStore,key: string) => object(await s.get(key,{type:'json'}));
const resolve = async (s: StoreSource) => typeof s === 'function' ? s() : s;
const QUALITY = ['reporting-devices-only','legacy-local-day','late-data-may-revise','legacy-source-watermark-unavailable','live-list-not-snapshot'];

async function keys(s: ManagementStore,prefix: string,max=50000) {
  const out: string[] = [], seen = new Set<string>(); let cursor: string | undefined;
  do {
    const page = await s.list({prefix,...(cursor?{cursor}:{})});
    if (!Array.isArray(page.blobs)) throw new ManagementReadError('source_invalid','The reporting source returned an invalid listing.',503);
    for (const b of page.blobs) if (typeof b.key === 'string' && b.key.startsWith(prefix)) out.push(b.key);
    if (out.length>max) throw new ManagementReadError('source_too_large','This reporting source needs a rollup before it can be read safely.',503);
    const next = page.cursor;
    if (next && seen.has(next)) throw new ManagementReadError('source_invalid','The reporting source repeated a page cursor.',503);
    if(next) seen.add(next); cursor=next;
  } while(cursor);
  return [...new Set(out)];
}
async function mapPool<T,R>(items:T[],fn:(v:T)=>Promise<R>,limit=16):Promise<R[]> {
  const out:R[]=new Array(items.length); let i=0;
  await Promise.all(Array.from({length:Math.min(limit,items.length)},async()=>{while(i<items.length){const j=i++;out[j]=await fn(items[j]);}}));return out;
}
// A finished day (two or more days ago) changes only when a device that was offline sends it late, so it is kept for
// 10 minutes; today and yesterday, and the device names and details (a renamed device shows at once), are always read
// fresh. Shared by every request on this server instance (overview, devices and children each read the whole period).
const DAY_MS = 10 * 60e3, CACHE_MAX = 600;
const cache = new Map<string, {at: number, value: unknown}>();
async function cached<T>(key: string | null, ms: number, load: () => Promise<T>): Promise<T> {
  if (!key) return load();
  const hit = cache.get(key), now = Date.now();
  if (hit && now - hit.at < ms) return hit.value as T;
  const value = await load();
  if (cache.size >= CACHE_MAX) { const oldest = cache.keys().next().value; if (oldest !== undefined) cache.delete(oldest); }
  cache.set(key, {at: now, value}); return value;
}
const active = (r:Record<string,any>) => count(r.mins)>0 || sumValues(r.games)>0 || count(r.tales)>0;
const dateRange = (q:ManagementQuery) => {const a:string[]=[];for(let t=Date.parse(q.from);t<=Date.parse(q.to);t+=864e5)a.push(day(t));return a;};
// Absence of a retained bucket is unknown, not a measured inactive day.
const dailySeries=(q:ManagementQuery,records:Daily[])=>dateRange(q).map(date=>{
  const daily=records.filter(d=>d.date===date),known=daily.length>0;
  return {date,reportingBuckets:daily.length,activeDevices:known?new Set(daily.filter(d=>active(d.value)).map(d=>d.id)).size:null,
    mins:known?daily.reduce((n,d)=>n+count(d.value.mins),0):null,
    errors:known?daily.reduce((n,d)=>n+sumValues(d.value.errs),0):null};
});
const statuses:Record<string,string>={new:'observed',fixing:'fixing',fixed:'fixed_in_code',confirmed:'verified',back:'reopened',notbug:'dismissed',dup:'duplicate'};
const safeBuilds = (v:unknown) => Array.isArray(v)?[...new Set(v.filter(isBuild))]:[];

export function createManagementReadService(deps:Dependencies) {
  const clock=deps.now||Date.now;
  const query=(q:URLSearchParams|Record<string,unknown>={})=>parseManagementQuery(q,clock());
  const envelope=(q:ManagementQuery,quality:string[]=[])=>({schemaVersion:1,generatedAt:new Date(clock()).toISOString(),sourceAsOf:null,period:{from:q.from,to:q.to,basis:'legacy-device-day'},scope:{traffic:q.traffic,build:q.build,deviceClass:q.deviceClass},metrics:[],quality:[...new Set([...QUALITY,...quality])],nextCursor:null});
  async function source(q:ManagementQuery) {
    if(q.traffic==='authorised_test')throw new ManagementReadError('classification_unavailable','Legacy records cannot reliably isolate authorised test devices.',503);
    const v=q.traffic==='synthetic_bot'?deps.botStore:deps.playersStore;
    if(!v)throw new ManagementReadError('source_unavailable','The requested reporting source is not configured.',503);
    return resolve(v);
  }
  async function snapshot(q:ManagementQuery,options:ReadOptions={}) {
    if(q.child&&!options.includeProfileContext)throw new ManagementReadError('permission_required','Child search requires restricted device-detail permission.',403);
    const s=await source(q), quality:string[]=[];
    const base=deps.cacheKey?deps.cacheKey+':'+q.traffic:null, recent=day(clock()-2*864e5);
    // the days are read side by side (they were read one after another: 30 rounds for a 30-day period)
    const days=await mapPool(dateRange(q),date=>cached(base&&date<recent?base+':d:'+date:null,DAY_MS,async()=>{
      const kk=await keys(s,`d/${date}/`), values=await mapPool(kk,k=>readJson(s,k)), rows:Daily[]=[];
      kk.forEach((k,i)=>{const id=k.slice(`d/${date}/`.length);if(DEVICE.test(id)&&Object.keys(values[i]).length)rows.push({id,date,value:values[i]});});
      return rows;
    }),8);
    const daily:Daily[]=days.flat();
    const [ik,lk,pk]=await Promise.all([keys(s,'info/'),keys(s,'label/'),keys(s,'live/')]);
    const infos=new Map<string,Record<string,any>>(),labels=new Map<string,string>(),lives=new Map<string,Record<string,any>>();
    await Promise.all([
      mapPool(ik,async k=>{const id=k.slice(5);if(DEVICE.test(id))infos.set(id,await readJson(s,k));}),
      mapPool(lk,async k=>{const id=k.slice(6);if(DEVICE.test(id))labels.set(id,safeText(await s.get(k),40));}),
      mapPool(pk,async k=>{const id=k.slice(5);if(DEVICE.test(id))lives.set(id,await readJson(s,k));})
    ]);
    const selected:Daily[]=[];
    for(const d of daily){
      const r=d.value;
      if(q.deviceClass!=='all'&&r.kind!==q.deviceClass)continue;
      const builds=Object.keys(object(r.builds)).filter(isBuild);
      if(q.build!=='all'){
        // Old daily buckets combined builds. Membership alone cannot apportion their counters.
        if(builds.length>1){if(builds.includes(q.build))quality.push('mixed-build-buckets-excluded');continue;}
        if((builds[0]||r.build)!==q.build)continue;
      }
      selected.push(d);
    }
    const grouped=new Map<string,Daily[]>();for(const d of selected){if(!grouped.has(d.id))grouped.set(d.id,[]);grouped.get(d.id)!.push(d);}
    const ids=new Set([...infos.keys(),...lives.keys(),...grouped.keys()]);
    const devices:Record<string,any>[]=[];
    for(const id of ids){
      const info=infos.get(id)||{}, ds=(grouped.get(id)||[]).sort((a,b)=>a.date.localeCompare(b.date)), records=ds.map(d=>d.value), l=lives.get(id)||{};
      if(q.build!=='all'&&!records.length)continue;
      if(q.deviceClass!=='all'&&!records.length&&info.kind!==q.deviceClass)continue;
      const perf=performance(records), children=new Map<string,Record<string,any>>();
      for(const d of ds)for(const [profileId,c0]of Object.entries(object(d.value.children))){
        if(!PROFILE.test(profileId))continue;const c=object(c0),kid=children.get(profileId)||{profileId,name:'',age:'little',mins:0,simpleMins:0,tales:0,games:new Map(),places:new Map()};
        // Respect latest reported suppression: do not resurrect a name from an earlier daily bucket.
        kid.name=safeText(c.n,20);kid.age=c.a==='big'?'big':'little';kid.mins+=count(c.m);kid.simpleMins+=count(c.sm);kid.tales+=count(c.t);
        for(const [gameId,v]of Object.entries(object(c.g))){if(!PROFILE.test(gameId)||!Array.isArray(v))continue;const g=kid.games.get(gameId)||{activityId:gameId,started:0,completed:0,abandoned:0};g.started+=count(v[0]);g.completed+=count(v[1]);g.abandoned+=count(v[2]);kid.games.set(gameId,g);}
        for(const [placeId,n]of Object.entries(object(c.p)))if(PROFILE.test(placeId))kid.places.set(placeId,(kid.places.get(placeId)||0)+count(n));
        children.set(profileId,kid);
      }
      const childRows:{profileId:string,name:string,age:string,mins:number,simpleMins:number,tales:number,games:any[],places:{placeId:string,entries:number}[]}[]=[...children.values()].map(c=>({profileId:c.profileId,name:c.name,age:c.age,mins:c.mins,simpleMins:c.simpleMins,tales:c.tales,games:[...c.games.values()].sort((a,b)=>a.activityId.localeCompare(b.activityId)),places:[...c.places].map(([placeId,entries])=>({placeId,entries}))}));
      const mins=records.reduce((n,r)=>n+count(r.mins),0), errors=records.reduce((n,r)=>n+sumValues(r.errs),0), last=safeText(info.last,10)||ds.at(-1)?.date||'';
      const seenAt=count(l.at)?new Date(l.at).toISOString():'';
      const loc=object(info.loc),place={city:safeText(loc.city,40),region:safeText(loc.region,40),country:safeText(loc.country,3)};
      // (owner, 30 Oct 2026 AEDT: "used most should be up") lists put the most-played devices first, then the latest seen
      const device={id,label:labels.get(id)||'',place,kind:['phone','tablet','computer'].includes(info.kind)?info.kind:'?',os:safeText(info.os,20),br:safeText(info.br,20),build:isBuild(info.build)?info.build:'?',first:safeText(info.first,10),last,activityLast:ds.at(-1)?.date||'',seenAt,sortAt:String(Math.min(count(mins),999999999)).padStart(9,'0')+'|'+(seenAt||last),
        online:l.on===true&&count(l.at)>clock()-5*60e3&&count(l.at)<=clock()+300000,mins,days:records.filter(active).length,tales:records.reduce((n,r)=>n+count(r.tales),0),errors,stuck:records.reduce((n,r)=>n+sumValues(r.stuck),0),fps:perf.fps,startup:perf.startup,power:perf.power,
        usageBuilds:[...new Set(records.flatMap(r=>Object.keys(object(r.builds)).length?Object.keys(object(r.builds)):isBuild(r.build)?[r.build]:[]))],...(options.includeProfileContext?{children:childRows}:{})};
      const basic=[id,device.label,device.kind,device.os,device.br,device.build].join(' ').toLocaleLowerCase();
      const names=options.includeProfileContext?childRows.map(c=>c.name).join(' ').toLocaleLowerCase():'';
      if(q.search&&!(basic+' '+names).includes(q.search.toLocaleLowerCase()))continue;
      if(q.child&&!childRows.some(c=>c.profileId===q.child||c.name.toLocaleLowerCase().includes(q.child.toLocaleLowerCase())))continue;
      devices.push(device);
    }
    const eligible=new Set(devices.map(d=>d.id));return {devices,daily:selected.filter(d=>eligible.has(d.id)),quality};
  }
  // (owner, 30 Oct 2026 AEDT) Studio's first page: devices, new devices, play time, favourite games, places and versions,
  // in one answer. Counts only; places are town, state and country from the connection.
  async function todaySummary(q:ManagementQuery,s:{devices:Record<string,any>[],daily:Daily[]}){
    const today=day(clock()),rs=s.daily.map(d=>d.value),names=new Map((await catalogue()).map(a=>[a.id,{en:safeText(object(a.name).en,80),vi:safeText(object(a.name).vi,80)}]));
    const games=new Map<string,{starts:number,quits:number}>(),hours=new Array(24).fill(0),places=new Map<string,{city:string,region:string,country:string,devices:number}>(),builds=new Map<string,number>();
    for(const r of rs){
      for(const [id,n]of Object.entries(object(r.games))){if(!PROFILE.test(id))continue;const g=games.get(id)||{starts:0,quits:0};g.starts+=count(n);games.set(id,g);}
      for(const [id,n]of Object.entries(object(r.quits))){if(!PROFILE.test(id))continue;const g=games.get(id)||{starts:0,quits:0};g.quits+=count(n);games.set(id,g);}
      for(const [h,n]of Object.entries(object(r.hours))){const i=Number(h);if(Number.isInteger(i)&&i>=0&&i<24)hours[i]+=count(n);}
    }
    const active=new Set(s.daily.filter(d=>count(d.value.mins)>0||sumValues(d.value.games)>0).map(d=>d.id));
    for(const d of s.devices){if(!active.has(d.id))continue;
      const pl=object(d.place),key=[pl.city,pl.region,pl.country].join('|');if(pl.city||pl.country){const e=places.get(key)||{city:String(pl.city||''),region:String(pl.region||''),country:String(pl.country||''),devices:0};e.devices++;places.set(key,e);}
      if(isBuild(d.build))builds.set(d.build,(builds.get(d.build)||0)+1);}
    const named=(id:string)=>({id,name:names.get(id)||{en:id,vi:id}});
    const ranked=[...games].map(([id,g])=>({...named(id),starts:g.starts,quits:g.quits}));
    let busiest=-1,best=0;for(let h=0;h<24;h++){const two=hours[h]+hours[(h+1)%24];if(two>best){best=two;busiest=h;}}
    const newest=[...builds.keys()].sort((a,b)=>buildRank(b)-buildRank(a))[0]||null;
    return {
      devicesToday:new Set(s.daily.filter(d=>d.date===today).map(d=>d.id)).size,devicesInPeriod:active.size,newDevices:s.devices.filter(d=>active.has(d.id)&&d.first>=q.from&&d.first<=q.to).length,devicesEver:s.devices.length,
      minsToday:s.daily.filter(d=>d.date===today).reduce((n,d)=>n+count(d.value.mins),0),minsInPeriod:rs.reduce((n,r)=>n+count(r.mins),0),busiestHour:busiest,
      topGames:ranked.sort((a,b)=>b.starts-a.starts).slice(0,5),
      leftEarly:ranked.filter(g=>g.starts>=3&&g.quits*2>=g.starts).sort((a,b)=>b.quits/b.starts-a.quits/a.starts).slice(0,3),
      places:[...places.values()].sort((a,b)=>b.devices-a.devices).slice(0,8),
      versions:{newest,onNewest:newest?builds.get(newest)||0:0,older:[...builds].filter(([b])=>b!==newest).reduce((n,[,c])=>n+c,0)}
    };
  }
  async function parentMetrics(q:ManagementQuery){
    const ids=[['M13','Website page views','events'],['M14','Website Play clicks','clicks'],['M15','Website active reading time','seconds']];
    if(!deps.parentAnalyticsStore||q.build!=='all'||q.deviceClass!=='all'||q.traffic!=='ordinary'||q.search||q.child)return ids.map(([id,label,unit])=>metric(id,label,null,unit,0,'Website event aggregates cannot be joined to this device/build scope.'));
    const s=await resolve(deps.parentAnalyticsStore), rows=await mapPool(dateRange(q),d=>readJson(s,'sum/'+d));
    if(!rows.some(r=>Object.keys(r).length))return ids.map(([id,label,unit])=>metric(id,label,null,unit,0,'No accepted website aggregate was available for this period.'));
    const views=rows.reduce((n,r)=>n+sumValues(r.pageViews),0), clicks=rows.reduce((n,r)=>n+count(r.playConversions),0), seconds=rows.reduce((n,r)=>n+count(r.activeTimeTotalSec),0);
    return [metric('M13','Website page views',views,'events',views,'Best-effort UTC-day page-view events, not unique visitors. Legacy device days differ.'),metric('M14','Website Play clicks',clicks,'clicks',clicks,'A Play click is not a confirmed successful game start.'),metric('M15','Website active reading time',seconds,'seconds',rows.filter(r=>Object.keys(r).length).length,'Best-effort UTC-day counts, not a complete visitor/session funnel.')];
  }
  async function catalogue(){const a=typeof deps.catalogue==='function'?await deps.catalogue():deps.catalogue||[];return Array.isArray(a)?a.filter(x=>x&&typeof x.id==='string'&&PROFILE.test(x.id)):[];}
  async function issueRows(q:ManagementQuery,deviceId?:string){
    if(!deps.testerStore)return {items:[],quality:['tester-source-unavailable']};
    const s=await resolve(deps.testerStore), kk=await keys(s,'p/'), values=await mapPool(kk,k=>readJson(s,k)), items:Record<string,any>[]=[];
    for(const v of values){
      if(deviceId&&(!Array.isArray(v.devices)||!v.devices.includes(deviceId)))continue;
      if(!/^[0-9a-f]{16}$/.test(v.k||''))continue;
      const lastAt=count(v.lastAt), firstAt=count(v.firstAt), builds=safeBuilds(v.builds), activityId=safeText(object(v.where).game,60);
      if(!lastAt||day(lastAt)<q.from||day(lastAt)>q.to||(q.build!=='all'&&!builds.includes(q.build)))continue;
      const sourceStatus=typeof v.status==='string'?v.status:'new',status=statuses[sourceStatus]||'observed';
      if(q.status!=='all'&&q.status!==status&&q.status!==sourceStatus)continue;
      const title=safeText(v.title,240);
      if(q.search&&![title,activityId,sourceStatus].join(' ').toLocaleLowerCase().includes(q.search.toLocaleLowerCase()))continue;
      items.push({id:v.k,status,sourceStatus,kind:safeText(v.kind,20),title,activityId,builds,affectedDevices:Array.isArray(v.devices)?new Set(v.devices.filter(x=>typeof x==='string'&&DEVICE.test(x))).size:0,firstAt,lastAt,sortAt:new Date(lastAt).toISOString(),fixedIn:isBuild(v.fixedIn)?v.fixedIn:'',owner:null,nextAction:'review',evidence:{source:'testers',problemKey:v.k},quality:['observed-symptom-not-confirmed-cause',...(sourceStatus==='fixed'?['deployment-and-device-verification-unconfirmed']:[])]});
    }
    return {items,quality:['tester-receipt-time-basis','affected-device-list-may-be-capped']};
  }
  async function overview(raw:URLSearchParams|Record<string,unknown>={},options:ReadOptions={}){
    const q=query(raw),s=await snapshot(q,options),rs=s.daily.map(d=>d.value),activeIds=new Set(s.daily.filter(d=>active(d.value)).map(d=>d.id));
    const activeDevices=activeIds.size,newDevices=s.devices.filter(d=>activeIds.has(d.id)&&d.first>=q.from&&d.first<=q.to).length;
    const metrics=[...legacyMetrics(rs,activeDevices,s.devices.filter(d=>d.online).length,newDevices),...await parentMetrics(q)];
    const attentionSupported=!!deps.testerStore&&q.traffic==='ordinary'&&q.deviceClass==='all';
    const attention=attentionSupported?await issueRows({...q,cursor:'',search:'',child:'',status:'all'}):{items:[],quality:['tester-scope-unavailable']}, errors=rs.reduce((n,r)=>n+sumValues(r.errs),0),errorIds=new Set(s.daily.filter(d=>sumValues(d.value.errs)>0&&active(d.value)).map(d=>d.id));
    metrics.push(metric('M38','Affected-device error proportion',activeDevices?errorIds.size/activeDevices:null,'ratio',activeDevices,'Reporting active installations with observed game-code errors; not crash-free sessions.'));
    return {...envelope(q,[...s.quality,...attention.quality]),metrics,today:await todaySummary(q,s),dailySeries:dailySeries(q,s.daily),totals:{devices:s.devices.length,activeDevices,mins:rs.reduce((n,r)=>n+count(r.mins),0),tales:rs.reduce((n,r)=>n+count(r.tales),0),onlineMins:rs.reduce((n,r)=>n+count(r.online),0),errors,stuck:rs.reduce((n,r)=>n+sumValues(r.stuck),0),activityStarts:rs.reduce((n,r)=>n+sumValues(r.games),0)},cards:[{id:'attention',status:attentionSupported?'observed':'unavailable',metricIds:[]},{id:'audience',status:'observed',metricIds:['M01','M02','M03']},{id:'experience',status:'observed',metricIds:['M08','M09','M10','M12','M38']},{id:'content',status:'observed',metricIds:['M04','M07']},{id:'release',status:'unavailable',metricIds:['M24']},{id:'operations',status:'unavailable',metricIds:[]}],attention:{open:attentionSupported?attention.items.filter(p=>!['verified','dismissed','duplicate'].includes(p.status)).length:null},capabilities:{exactAttempts:false,retention:false,finance:false}};
  }
  async function devices(raw:URLSearchParams|Record<string,unknown>={},options:ReadOptions={}){const q=query(raw),s=await snapshot(q,options),p=pageRows(s.devices as {id:string,sortAt:string}[],q,'devices');return {...envelope(q,s.quality),devices:p.rows.map(({sortAt,...v})=>v),total:p.total,nextCursor:p.nextCursor};}
  async function device(id:string,raw:URLSearchParams|Record<string,unknown>={},options:ReadOptions={}){
    if(!DEVICE.test(id))throw new ManagementReadError('invalid_device','Invalid installation ID.');const q=query(raw),s=await snapshot(q,options),d=s.devices.find(d=>d.id===id);if(!d)throw new ManagementReadError('device_not_found','Installation not found in this scope.',404);const {sortAt,...v}=d;const related=q.traffic==='ordinary'?await issueRows({...q,search:'',child:'',status:'all'},id):{items:[],quality:['tester-scope-unavailable']};return {...envelope(q,[...s.quality,...related.quality]),device:v,dailySeries:dailySeries(q,s.daily.filter(row=>row.id===id)),relatedIssues:related.items.slice(0,20)};
  }
  async function children(raw:URLSearchParams|Record<string,unknown>={},options:ReadOptions={}){
    if(!options.includeProfileContext)throw new ManagementReadError('permission_required','Child and device information requires restricted device-detail permission.',403);
    const q=query(raw),s=await snapshot(q,options),rows=s.devices.flatMap(d=>(d.children||[]).map(c=>({...c,id:d.id+':'+c.profileId,deviceId:d.id,deviceLabel:d.label,deviceClass:d.kind,build:d.build,last:d.last,sortAt:d.sortAt}))),p=pageRows(rows,q,'children');return {...envelope(q,s.quality),children:p.rows.map(({sortAt,...v})=>v),total:p.total,nextCursor:p.nextCursor};
  }
  async function attention(raw:URLSearchParams|Record<string,unknown>={}){const q=query(raw);if(q.child||q.deviceClass!=='all'||q.traffic!=='ordinary')throw new ManagementReadError('unsupported_scope','Tester problems cannot reliably be filtered to that device/traffic scope.');const a=await issueRows(q),p=pageRows(a.items as {id:string,sortAt:string}[],q,'attention');return {...envelope(q,a.quality),items:p.rows.map(({sortAt,...v})=>v),total:p.total,nextCursor:p.nextCursor};}
  async function activity(id:string,raw:URLSearchParams|Record<string,unknown>={},options:ReadOptions={}){
    const parts=id.split(':'),kind=parts.length===2?parts[0]:null;id=parts.length===2?parts[1]:id;
    if(!PROFILE.test(id)||kind&&!['game','story'].includes(kind))throw new ManagementReadError('invalid_activity','Invalid activity ID.');
    const matches=(await catalogue()).filter(a=>a.id===id&&(!kind||a.kind===kind));
    if(matches.length>1)throw new ManagementReadError('ambiguous_activity','Use game:ID or story:ID to choose the catalogue entry.',409);
    const a=matches[0];if(!a)throw new ManagementReadError('activity_not_found','Activity is not in the reviewed catalogue.',404);
    const q=query(raw),s=await snapshot(q,options),rs=s.daily.map(d=>d.value);let profileStarts=0,completed=0,abandoned=0;
    for(const r of rs)for(const c of Object.values(object(r.children))){const v=object(object(c).g)[id];if(Array.isArray(v)){profileStarts+=count(v[0]);completed+=count(v[1]);abandoned+=count(v[2]);}}
    const starts=rs.reduce((n,r)=>n+count(object(r.games)[id]),0),issues=(await issueRows({...q,child:'',search:'',status:'all'})).items.filter(p=>p.activityId===id);
    const entry={id:a.id,kind:a.kind,name:{en:safeText(object(a.name).en,120),vi:safeText(object(a.name).vi,120)},...(a.area?{area:safeText(a.area,40)}:{}),...(a.sourceCommit?{sourceCommit:a.sourceCommit}:{}),guide:a.guide||null,coverage:a.coverage||null};
    const inconsistent=completed+abandoned>profileStarts;
    return {...envelope(q,[...s.quality,'profile-participations-not-attempts',...(inconsistent?['inconsistent-participation-outcomes']:[])]),activity:entry,usage:a.kind==='story'?{starts:null,profileStarts:null,completed:null,abandoned:null,participationCompletionRatio:null,status:'unavailable',reason:'legacy-story-counts-have-no-story-id'}:{starts,profileStarts,completed,abandoned,participationCompletionRatio:profileStarts&&!inconsistent?completed/profileStarts:null,status:'existing-derived'},issues:issues.map(({sortAt,...v})=>v),coverage:a.coverage||null,guide:a.guide||null};
  }
  async function release(build:string,raw:URLSearchParams|Record<string,unknown>={}){if(!isBuild(build))throw new ManagementReadError('invalid_build','Invalid release build.');const q=query({...Object.fromEntries(raw instanceof URLSearchParams?raw.entries():Object.entries(raw)),build}),s=await snapshot(q),builds:Record<string,number>={};for(const d of s.devices)for(const b of d.usageBuilds)if(isBuild(b))builds[b]=(builds[b]||0)+1;return {...envelope(q,s.quality),release:{build,devices:s.devices.length,reportingBuilds:Object.entries(builds).sort((a,b)=>buildRank(b[0])-buildRank(a[0])).map(([build,devices])=>({build,devices})),checksStatus:'unavailable',deploymentStatus:'unavailable'},comparisonEligibility:['originating-build-only','mixed-build-days-excluded','matching-device-class-required','capped-startup-samples','deployment-evidence-required']};}
  return {overview,devices,device,children,attention,activity,release};
}
