import { ManagementError } from './transactional/types.mts';
import { hashJson, integer, keys, record, text } from './transactional/validation.mts';
import { explainAvailability } from './catalogue.mts';
import type { CatalogueEntry } from './catalogue.mts';

export function itemEntry(entries:CatalogueEntry[],key:string){
  if(!/^(game|story):[a-z0-9][a-z0-9_-]{0,59}$/.test(key))throw new ManagementError(400,'invalid_item_key');
  const entry=entries.find(e=>e.kind+':'+e.id===key);
  if(!entry)throw new ManagementError(404,'item_not_found');return entry;
}
const AREAS=['animals','music','art','numbers','shapes','words','me','play','vietnam','travel','thinking','money'];
/** Return item-specific facts only; never the entire config, profile or device cohort. */
export async function itemWorkspace(entry:CatalogueEntry,service,canEdit=false){
  const key=entry.kind+':'+entry.id,connected=service.configured();let current=null,quality:string[]=[];
  if(connected)try{current=await service.getEffectiveConfig();}catch{quality.push('configuration_unavailable');}
  const content=record(current?.body?.content??{}),activity=record(record(content.activities??{})[entry.id]??{});
  const ruleIds=[...(entry.unlock?.secondSet?[entry.kind==='game'?'newGames':'newStories']:[]),
    ...(entry.id.startsWith('rd_')?['readingTrial']:[]),
    ...(['heodat','coinnote','needwant','cheaper','lixi','bahu','shoplist','waitgrow','shopkeep','barter'].includes(entry.id)&&entry.kind==='game'?['money_'+entry.id]:[])];
  const consumers=entry.kind==='game'?['js/main.ts:playGame','js/games/frame.ts:openGame','js/content/activities.ts:gameInfo','js/content/unlocks.ts:isHeld']:['js/learn.ts:readTale','js/tales.ts:openTheatre','js/content/unlocks.ts:isHeld'];
  return {schemaVersion:1,key,entry,configured:connected,settingsKnown:!!current,baseRevision:current?.revision??null,
    settings:current?{enabled:record(content.itemAvailability??{})[key]!==false,
      ...(entry.kind==='game'?{hide:activity.hide===true,area:typeof activity.area==='string'?activity.area:null,little:typeof activity.little==='boolean'?activity.little:null}:{})}:null,
    connections:{write:'content.itemAvailability['+key+']',consumers,
      placement:entry.kind==='game'?'content.activities['+entry.id+'] → js/content/activities.ts → Simple screen':null,
      rules:ruleIds.map(id=>{const rule=record(current?.body?.releases??{})[id];const r=rule&&typeof rule==='object'?record(rule):{};return {id,on:typeof r.on==='boolean'?r.on:null,start:typeof r.start==='string'?r.start:null,days:typeof r.days==='number'?r.days:null,source:rule?'managed-or-legacy-live':'bundled-default-or-unknown'};}),
      prerequisites:entry.unlock?.prerequisites??[],finishesEach:entry.unlock?.finishesEach??0,
      website:{href:entry.guide?.href??null,sourceAligned:entry.guide?.sourceAligned??null,kind:entry.guide?.kind??null,
        effect:'static-guide-not-updated-by-item-control',source:'tools/build-website.mts'},
      measurement:entry.kind==='game'?'management/activities/game:'+entry.id:'management/activities/story:'+entry.id,
      delivery:'management/config',effect:'next-fetch-and-entry-recheck',progress:'preserved',scope:'global'},
    expectation:current?explainAvailability(entry,{live:current.body,custom:content}):null,
    drafts:canEdit&&connected?(await service.listDrafts()).filter(d=>d.itemKey===key).map(d=>({id:d.id,revision:d.revision,state:d.state,reason:d.reason,updatedAt:d.updatedAt})):[],
    quality:[...quality,'expected-settings-not-device-proof','website-static-review-separate']};
}

/** Construct the proposal on the server from the winning baseline. No arbitrary JSON edits. */
export async function saveItemDraft(entry:CatalogueEntry,input:unknown,actor:string,service){
  const b=record(input);keys(b,['id','expectedRevision','baseRevision','enabled','hide','area','little','reason'],['expectedRevision','baseRevision','enabled','reason']);
  const baseRevision=integer(b.baseRevision),expectedRevision=integer(b.expectedRevision),reason=text(b.reason,600,3);
  if(typeof b.enabled!=='boolean')throw new ManagementError(400,'invalid_item_setting');
  if(entry.coverage.discovery==='declared-only'&&b.enabled)throw new ManagementError(409,'item_integration_required');
  if(entry.kind!=='game'&&['hide','area','little'].some(k=>k in b))throw new ManagementError(400,'game_setting_on_story');
  if(b.hide!==undefined&&typeof b.hide!=='boolean'||b.little!==undefined&&b.little!==null&&typeof b.little!=='boolean'||b.area!==undefined&&b.area!==null&&!AREAS.includes(String(b.area)))throw new ManagementError(400,'invalid_item_setting');
  const current=await service.getEffectiveConfig();
  if(current.revision!==baseRevision)throw new ManagementError(409,'draft_baseline_conflict');
  const content=record(current.body.content??{}),key=entry.kind+':'+entry.id;
  const next={...record(content.itemAvailability??{}),[key]:b.enabled};
  const proposal:Record<string,unknown>={itemAvailability:next};
  if(entry.kind==='game'&&['hide','area','little'].some(k=>k in b)){
    const activities={...record(content.activities??{})},setting={...record(activities[entry.id]??{})};
    for(const field of ['hide','area','little'])if(field in b){if(b[field]===null||field==='hide'&&b[field]===false)delete setting[field];else setting[field]=b[field];}
    activities[entry.id]=setting;proposal.activities=activities;
  }
  return service.saveDraft({...(b.id===undefined?{}:{id:b.id}),expectedRevision,baseRevision,kind:'content',body:{content:proposal},reason},actor,key,hashJson(current.body));
}
