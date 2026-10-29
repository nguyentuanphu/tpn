import type { StoredEvent } from './transactional/types.mts';
const data=(e:StoredEvent):Record<string,any> => e.payload.data&&typeof e.payload.data==='object'&&!Array.isArray(e.payload.data)?e.payload.data as Record<string,any>:{};
const ratio=(a:number,b:number)=>b?a/b:null;
/** Pure aggregation: never returns profile context or treats missing outcomes as successful. */
export function managementOutcomes(events:StoredEvent[],{from,to,now}:{from:string;to:string;now:number}) {
  const grouped=new Map<string,StoredEvent[]>();
  for(const e of events){const key=e.deviceId+'|'+e.attemptId;const rows=grouped.get(key)||[];rows.push(e);grouped.set(key,rows);}
  const cohort=(startName:string,terminalNames:string[],identity?:string)=>{
    const counts={started:0,succeeded:0,failed:0,pending:0,outcomeUnknown:0,inconsistent:0};const durations:number[]=[];
    for(const rows of grouped.values()) {
      const starts=rows.filter(e=>e.eventName===startName&&e.occurredAt>=from&&e.occurredAt<to);if(!starts.length)continue;
      counts.started++;const first=starts[0],ends=rows.filter(e=>terminalNames.includes(e.eventName));
      const outcomes=new Set(ends.map(e=>e.eventName==='boot.ready'||e.eventName==='story.completed'?'success':e.eventName==='boot.failed'?'failed':String(data(e).outcome)));
      if(starts.length!==1||outcomes.size>1||ends.some(e=>e.occurredAt<first.occurredAt||identity&&data(e)[identity]!==data(first)[identity])){counts.inconsistent++;continue;}
      if(!ends.length){if(now-Date.parse(first.occurredAt)>86400000)counts.outcomeUnknown++;else counts.pending++;continue;}
      if(ends.some(e=>Date.parse(e.occurredAt)-Date.parse(first.occurredAt)>7*86400000)){counts.outcomeUnknown++;continue;}
      const end=ends.sort((a,b)=>a.occurredAt.localeCompare(b.occurredAt))[0];
      if(outcomes.has('success')){counts.succeeded++;if(end.eventName==='boot.ready'&&Number.isInteger(data(end).elapsedMs))durations.push(data(end).elapsedMs);}
      else counts.failed++;
    }
    const eligible=counts.started-counts.inconsistent;durations.sort((a,b)=>a-b);
    return {...counts,eligible,successRate:ratio(counts.succeeded,eligible),phaseP95Ms:durations.length?durations[Math.ceil(.95*durations.length)-1]:null,durationSamples:durations.length};
  };
  const results=(name:string,filter:(d:Record<string,any>)=>boolean=()=>true)=>{
    const counts={success:0,failed:0,cancelled:0,unknown:0,initiated:0};let total=0;
    for(const e of events)if(e.eventName===name&&e.occurredAt>=from&&e.occurredAt<to&&filter(data(e))){const outcome=data(e).outcome;if(Object.hasOwn(counts,outcome)){counts[outcome]++;total++;}}
    return {...counts,total,confirmed:counts.success+counts.failed,confirmedSuccessRate:ratio(counts.success,counts.success+counts.failed)};
  };
  return {schemaVersion:1,from,to,basis:'event-utc',
    boot:{...cohort('boot.started',['boot.ready','boot.failed']),measurement:'players_module_to_first_playable',invisibleEarlierFailures:true},
    stories:cohort('story.opened',['story.completed'],'storyId'),connections:cohort('connection.attempt',['connection.result'],'transport'),
    voice:{recorded:results('voice.result',d=>d.source==='recorded'),family:results('voice.result',d=>d.source==='family'),device:results('voice.result',d=>d.source==='device')},
    updates:results('update.result'),backups:{export:results('backup.result',d=>d.operation==='export'),restore:results('backup.result',d=>d.operation==='restore'),legacyUnknownOperation:results('backup.result',d=>!d.operation)},
    quality:['reporting_devices_only','early_pre_instrumentation_boot_failures_invisible','boot_phase_is_not_navigation_time','watchdog_voice_results_are_unknown',
      'download_initiation_is_not_saved_file_confirmation','cancelled_unknown_initiated_excluded_from_confirmed_result_ratio','missing_attempt_terminals_remain_pending_or_unknown']};
}
