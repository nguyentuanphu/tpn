import { parseReportingPolicy } from '../../../../js/core/reporting-policy.ts';
import { createHash } from 'node:crypto';
import { cleanLive, cleanContent } from '../../live.mts';
import { ManagementError } from './types.mts';
import type { Json, JsonObject, StoredEvent } from './types.mts';

export type Catalogue = { activityIds: ReadonlySet<string>; storyIds: ReadonlySet<string>; featureIds?: ReadonlySet<string>; builds?: ReadonlySet<string> };
export const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
export const DEVICE=/^[a-z0-9]{12}$/;
export const SCOPE=/^(global|device:[a-z0-9]{12}|feature:[a-z0-9_-]{1,60})$/;
const BUILD=/^(v\d{1,2}\.\d{2}|r\d{1,4}(\.\d{1,2})?)$/;
const forbidden=new Set(['__proto__','constructor','prototype']);
export function fail(code:string,status=422):never {throw new ManagementError(status,code);}
export const record=(x:unknown,code='invalid_object'):Record<string,unknown>=>{
  if(!x||typeof x!=='object'||Array.isArray(x)||![Object.prototype,null].includes(Object.getPrototypeOf(x)))return fail(code);
  return x as Record<string,unknown>;
};
export function keys(x:Record<string,unknown>,allowed:string[],required:string[]=allowed):void {
  if(Object.keys(x).some(k=>!allowed.includes(k)||forbidden.has(k))||required.some(k=>!(k in x)))fail('invalid_fields');
}
export const text=(x:unknown,max:number,min=1):string=>typeof x==='string'&&x.length>=min&&[...x].length<=max&&!/[\u0000-\u001f<>]/.test(x)?x:fail('invalid_text');
export const integer=(x:unknown,min=0,max=Number.MAX_SAFE_INTEGER):number=>typeof x==='number'&&Number.isSafeInteger(x)&&x>=min&&x<=max?x:fail('invalid_integer');
export const one=(x:unknown,values:string[]):string=>typeof x==='string'&&values.includes(x)?x:fail('invalid_choice');
export const day=(x:unknown):string=>typeof x==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(x)&&Number.isFinite(Date.parse(x))&&new Date(x).toISOString().slice(0,10)===x?x:fail('invalid_date');
export const instant=(x:unknown):string=>typeof x==='string'&&/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?Z$/.test(x)&&Number.isFinite(Date.parse(x))&&new Date(x).toISOString().slice(0,10)===x.slice(0,10)?x:fail('invalid_timestamp');
function normal(value:unknown,depth=0):Json {
  if(depth>30) return fail('json_depth');
  if(value===null)return null;
  if(typeof value==='boolean'||typeof value==='string')return value;
  if(typeof value==='number')return Number.isFinite(value)?value:fail('invalid_number');
  if(Array.isArray(value))return value.map(v=>normal(v,depth+1));
  const o=record(value);const out:JsonObject={};
  for(const k of Object.keys(o).sort()) {if(forbidden.has(k))fail('invalid_fields');out[k]=normal(o[k],depth+1);}
  return out;
}
export const canonicalJson=(value:unknown):string=>JSON.stringify(normal(value));
export const hashJson=(value:unknown):string=>createHash('sha256').update(canonicalJson(value)).digest('hex');
export const jsonObject=(value:unknown):JsonObject=>normal(record(value)) as JsonObject;

function shape(data:unknown,fields:Record<string,(v:unknown)=>Json>):JsonObject {
  const o=record(data);keys(o,Object.keys(fields));const out:JsonObject={};
  for(const [k,f]of Object.entries(fields))out[k]=f(o[k]);return out;
}
function known(value:unknown,kind:'activity'|'story',catalogue?:Catalogue):string {
  const id=text(value,kind==='activity'?32:40);
  if(!/^[a-z0-9_-]+$/.test(id))fail('invalid_catalogue_id');
  if(!catalogue)fail('management_catalogue_not_configured',503);
  if(!(kind==='activity'?catalogue.activityIds:catalogue.storyIds).has(id))fail('unknown_catalogue_id');
  return id;
}
export function validateEvent(input:unknown,now:number,catalogue?:Catalogue):StoredEvent {
  const o=record(input);keys(o,['schemaVersion','eventId','deviceId','sessionId','attemptId','eventName','occurredAt','deviceDay','offsetMinutes','build','sourceCommit','environment','traffic','data','profiles'],['schemaVersion','eventId','deviceId','sessionId','attemptId','eventName','occurredAt','deviceDay','offsetMinutes','build','sourceCommit','environment','traffic','data']);
  if(o.schemaVersion!==1)fail('unsupported_schema');
  if(!UUID.test(String(o.eventId))||!UUID.test(String(o.attemptId))||!DEVICE.test(String(o.deviceId))||!/^[a-z0-9]{16}$/.test(String(o.sessionId)))fail('invalid_identity');
  const eventName=text(o.eventName,32),at=instant(o.occurredAt),d=day(o.deviceDay),offset=integer(o.offsetMinutes,-840,840),time=Date.parse(at);
  if(time>now+300000||time<now-90*86400000)fail('implausible_event_clock');
  if(new Date(time+offset*60000).toISOString().slice(0,10)!==d)fail('inconsistent_device_day');
  const build=text(o.build,24);if(!BUILD.test(build)||(catalogue?.builds&&!catalogue.builds.has(build)))fail('unknown_build');
  const source=o.sourceCommit===null?null:text(o.sourceCommit,40);if(source!==null&&!/^[0-9a-f]{40}$/.test(source))fail('invalid_source_commit');
  const environment=one(o.environment,['production','staging','local']),traffic=one(o.traffic,['ordinary','authorised_test','synthetic_bot']);
  const ms=(v:unknown)=>integer(v,0,600000),activity=(v:unknown)=>known(v,'activity',catalogue),story=(v:unknown)=>known(v,'story',catalogue);
  let data:JsonObject;
  switch(eventName) {
    case 'activity.started': data=shape(o.data,{activityId:activity,difficulty:v=>one(v,['easy','medium','hard']),mode:v=>one(v,['solo','local_two','online'])});break;
    case 'activity.completed':data=shape(o.data,{activityId:activity});break;
    case 'activity.abandoned':data=shape(o.data,{activityId:activity,reason:v=>one(v,['closed','navigation','cancelled'])});break;
    case 'boot.started':data=shape(o.data,{stage:v=>one(v,['boot'])});break;
    case 'boot.ready':data=shape(o.data,{stage:v=>one(v,['first_playable']),elapsedMs:ms});break;
    case 'boot.failed':data=shape(o.data,{stage:v=>one(v,['boot','resources','world','first_playable']),reasonCode:v=>one(v,['timeout','resource_missing','exception','unsupported'])});break;
    case 'story.opened':case 'story.completed':data=shape(o.data,{storyId:story});break;
    case 'connection.attempt':data=shape(o.data,{transport:v=>one(v,['direct','relay'])});break;
    case 'connection.result':data=shape(o.data,{transport:v=>one(v,['direct','relay']),outcome:v=>one(v,['success','timeout','rejected','failed']),elapsedMs:ms});break;
    case 'voice.result':data=shape(o.data,{source:v=>one(v,['recorded','family','device']),outcome:v=>one(v,['success','failed','cancelled','unknown']),language:v=>one(v,['en','vi','zh','hi'])});break;
    case 'update.result':data=shape(o.data,{outcome:v=>one(v,['success','failed','cancelled']),reasonCode:v=>one(v,['none','timeout','storage','network','invalid','unsupported','user_cancelled'])});break;
    case 'backup.result':data=shape(o.data,{outcome:v=>one(v,['initiated','success','failed','cancelled']),reasonCode:v=>one(v,['none','timeout','storage','network','invalid','unsupported','user_cancelled']),
      ...(record(o.data).operation===undefined?{}:{operation:v=>one(v,['export','restore'])})});break;
    default:return fail('unknown_event');
  }
  const payload:JsonObject={schemaVersion:1,eventId:String(o.eventId).toLowerCase(),deviceId:String(o.deviceId),sessionId:String(o.sessionId),attemptId:String(o.attemptId).toLowerCase(),eventName,occurredAt:at,deviceDay:d,offsetMinutes:offset,build,sourceCommit:source,environment,traffic,data};
  if(o.profiles!==undefined) {
    if(!Array.isArray(o.profiles)||o.profiles.length>6)fail('invalid_profiles');
    const seen=new Set<string>();payload.profiles=o.profiles.map(value=>{
      const p=record(value);keys(p,['id','name','age'],['id','age']);const id=text(p.id,64);
      if(!/^[\w-]+$/.test(id)||seen.has(id))fail('invalid_profile_id');seen.add(id);
      const result:JsonObject={id,age:one(p.age,['little','big'])};
      if(p.name!==undefined){const name=text(p.name,20,0);if(!/^[\p{L}' -]*$/u.test(name))fail('invalid_profile_name');result.name=name;}
      return result;
    });
  }
  return {deviceId:String(payload.deviceId),eventId:String(payload.eventId),attemptId:String(payload.attemptId),sessionId:String(payload.sessionId),eventName,occurredAt:at,receivedAt:new Date(now).toISOString(),build,sourceCommit:source,environment,traffic,payloadHash:hashJson(payload),payload};
}
export function validateEventBatch(input:unknown,now:number,catalogue?:Catalogue):StoredEvent[] {
  const o=record(input);keys(o,['schemaVersion','events']);if(o.schemaVersion!==1)fail('unsupported_schema');
  if(Buffer.byteLength(canonicalJson(o))>65536)fail('event_batch_too_large',413);
  if(!Array.isArray(o.events)||o.events.length<1||o.events.length>50)fail('invalid_event_batch');
  return o.events.map(e=>validateEvent(e,now,catalogue));
}
export function configBody(kind:'rules'|'content',input:unknown,previous:JsonObject):JsonObject {
  const body=record(input);let next:JsonObject;
  if(kind==='rules') {
    keys(body,['releases','festivals'],[]);
    for(const key of ['releases','festivals'])if(body[key]!==undefined)record(body[key]);
    const cleaned=cleanLive(body as Parameters<typeof cleanLive>[0]);
    // Missing rule collections preserve the existing other collection.
    next={...previous,...(body.releases===undefined?{}:{releases:jsonObject(cleaned.releases)}),...(body.festivals===undefined?{}:{festivals:jsonObject(cleaned.festivals)})};
  }else{
    const sent='content' in body?(keys(body,['content']),record(body.content)):body;
    const cleaned=cleanContent(sent);if(Object.keys(cleaned).length!==Object.keys(sent).length)fail('unknown_content_section');
    const content={...record(previous.content??{})};
    for(const[k,v]of Object.entries(cleaned)){if(v===null)delete content[k];else content[k]=v;}
    next={...previous,content:jsonObject(content)};
  }
  if(Buffer.byteLength(canonicalJson(next))>256*1024)fail('config_too_large',413);
  return jsonObject(next);
}

/** All config entry points share the temporary-policy budget, including advanced edits. */
export function assertReportingPolicyChange(previous:JsonObject,next:JsonObject,now:number){
  const before=record(previous.content??{}).reportingPolicy,after=record(next.content??{}).reportingPolicy;
  if(after===undefined||hashJson({policy:before??null})===hashJson({policy:after??null}))return;
  const policy=parseReportingPolicy(after);if(!policy)fail('invalid_reporting_policy');
  if(policy.expiresAt!==null&&(Date.parse(policy.expiresAt)<=now||Date.parse(policy.expiresAt)>now+86400000))fail('reporting_expiry_out_of_range');
}
