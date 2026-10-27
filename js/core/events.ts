// @ts-check
// The event bus (architecture §6, layer L0): one system says something happened, any other system may listen, and
// neither knows the other. Synchronous; payloads are plain data with ids, never objects. A listener that throws is
// logged and skipped, so it never stops the one who emitted (graceful failure). Only the adopted events (§6 table)
// may be emitted: a typo is caught at once instead of silently reaching nobody.
//   import { events } from './core/events.js';
//   const off = events.on('ActivityCompleted', e => …);  events.emit('ActivityCompleted', { … });  off();

export const EVENT_NAMES = [
  'WorldGenerated', 'WorldValidated', 'WorldReady',
  'PlayerEnteredVillage', 'PlayerLeftVillage', 'InteractionStarted',
  'ActivityStarted', 'ActivityCompleted', 'ActivityAbandoned',
  'ItemsChanged', 'CoinsChanged', 'ProgressChanged',
  'FerryDeparted', 'FerryArrived', 'VehicleBlocked',
  'SettingsChanged', 'LanguageChanged', 'SaveCompleted', 'SaveFailed',
  'PeerJoined', 'PeerLeft', 'DialogRequested', 'ToastRequested', 'HowToRequested',
  // added in round E (docs/ARCHITECTURE.md §6): a sticker, a postcard or a house decoration was earned or placed
  'StickerEarned', 'PostcardEarned', 'HomeDecorated'
];
const KNOWN = new Set(EVENT_NAMES);

/** @typedef {(payload: any, name: string) => void} Listener */
export function createBus({ strict = true, log = (/** @type {any[]} */ ...a) => console.warn(...a) } = {}) {
  /** @type {Map<string, Set<Listener>>} */
  const map = new Map();
  /** @type {{ name: string, payload: any, t: number }[]} */
  const recent = [];
  const check = (/** @type {string} */ name) => { if (strict && !KNOWN.has(name) && name !== '*') throw new Error(`unknown event "${name}" (add it to EVENT_NAMES and §6 first)`); };
  const bus = {
    /** @param {string} name  @param {Listener} fn  @returns {() => void} the way to stop listening */
    on(name, fn) { check(name); if (!map.has(name)) map.set(name, new Set()); map.get(name).add(fn); return () => { const s = map.get(name); if (s) s.delete(fn); }; },
    /** @param {string} name  @param {Listener} fn */
    once(name, fn) { const off = bus.on(name, (p, n) => { off(); fn(p, n); }); return off; },
    /** @param {string} name  @param {any} [payload] @returns {number} how many listeners heard it */
    emit(name, payload = {}) {
      check(name);
      recent.push({ name, payload, t: Date.now() }); if (recent.length > 50) recent.shift();
      let n = 0;
      for (const key of [name, '*']) for (const fn of [...(map.get(key) || [])]) { n++; try { fn(payload, name); } catch (e) { log(`event ${name}: a listener failed`, e); } }
      return n;
    },
    /** the last 50 events (tests and Grown-ups › Advanced) */
    recent: () => recent.slice(),
    clear() { map.clear(); recent.length = 0; }
  };
  return bus;
}
// the game's one bus
export const events = createBus();

const EVIDENCE_ACTIVITY=/^[a-z0-9_-]{1,32}$/;
const evidenceKinds: Record<string, Record<string, RegExp | readonly string[] | number>> = {
  'activity.started': { activityId: /^[a-z0-9_-]{1,32}$/, difficulty: ['easy', 'medium', 'hard'], mode: ['solo', 'local_two', 'online'] },
  'activity.completed': { activityId: EVIDENCE_ACTIVITY },
  'activity.abandoned': { activityId: /^[a-z0-9_-]{1,32}$/, reason: ['closed', 'navigation', 'cancelled'] },
  'boot.started': { stage: ['boot'] },
  'boot.ready': { stage: ['first_playable'], elapsedMs: 600000 },
  'boot.failed': { stage: ['boot', 'resources', 'world', 'first_playable'], reasonCode: ['timeout', 'resource_missing', 'exception', 'unsupported'] },
  'story.opened': { storyId: /^[a-z0-9_-]{1,40}$/ },
  'story.completed': { storyId: /^[a-z0-9_-]{1,40}$/ },
  'connection.attempt': { transport: ['direct', 'relay'] },
  'connection.result': { transport: ['direct', 'relay'], outcome: ['success', 'timeout', 'rejected', 'failed'], elapsedMs: 600000 },
  'voice.result': { source: ['recorded', 'family', 'device'], outcome: ['success', 'failed', 'cancelled', 'unknown'], language: ['en', 'vi', 'zh', 'hi'] },
  'update.result': { outcome: ['success', 'failed', 'cancelled'], reasonCode: ['none', 'timeout', 'storage', 'network', 'invalid', 'unsupported', 'user_cancelled'] },
  'backup.result': { outcome: ['success', 'failed', 'cancelled', 'initiated'], reasonCode: ['none', 'timeout', 'storage', 'network', 'invalid', 'unsupported', 'user_cancelled'] }
};

/** Bounded observation protocol. Never accepts raw text, room codes, photos or save contents. */
export function cleanManagementEvidence(name: string, value: unknown): Record<string, string | number> | null {
  const shape = evidenceKinds[name];
  if (!shape || !value || typeof value !== 'object' || Array.isArray(value)) return null;
  const input = value as Record<string, unknown>, operation = name === 'backup.result' ? input.operation : undefined;
  if (operation !== undefined && !['export','restore'].includes(String(operation))) return null;
  const allowed = Object.keys(shape).concat(name === 'backup.result' ? ['operation'] : []);
  if (Object.keys(input).some(k => !allowed.includes(k)) || Object.keys(shape).some(k => !(k in input))) return null;
  const out: Record<string,string|number> = {};
  for (const [key,rule] of Object.entries(shape)) {
    const v=input[key];
    if (typeof rule === 'number') { if (typeof v !== 'number' || !Number.isInteger(v) || v<0 || v>rule) return null; }
    else if (rule instanceof RegExp) { if (typeof v !== 'string' || !rule.test(v)) return null; }
    else if (typeof v !== 'string' || !rule.includes(v)) return null;
    out[key]=v as string|number;
  }
  if(operation!==undefined)out.operation=String(operation);
  return out;
}
export type ManagementEvidence = { eventName:string; data:Record<string,string|number>; attemptId:string; occurredAt:number };
/** No network, storage, names or global browser hooks. Off means no records or UUID work.
 * A short memory buffer only bridges the already-consented lazy client's import. */
export function createManagementEvidence({now=Date.now,uuid=()=>globalThis.crypto.randomUUID()}:{now?:()=>number;uuid?:()=>string}={}) {
  let enabled=false,epoch=0,boot:string|null=null;
  let sink:((event:ManagementEvidence)=>void)|null=null;
  let waiting:ManagementEvidence[]=[];
  const validId=(id:unknown):id is string=>typeof id==='string'&&/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id);
  const emit=(eventName:string,data:unknown,attemptId?:string|null,occurredAt=now()):string|null=>{
    try {
      if(!enabled)return null;
      const clean=cleanManagementEvidence(eventName,data);if(!clean||!Number.isFinite(occurredAt)||occurredAt>now()+1000||occurredAt<now()-600000)return null;
      const terminal=eventName==='boot.ready'||eventName==='boot.failed';
      const id=attemptId??(terminal?boot:uuid());if(!validId(id))return null;
      if(eventName==='boot.started')boot=id;
      const event={eventName,data:clean,attemptId:id,occurredAt};
      if(sink)sink(event);else {waiting.push(event);if(waiting.length>64)waiting.shift();}
      if(terminal)boot=null;
      return id;
    } catch {return null;}
  };
  const begin=(eventName:string,context:Record<string,string|number>={})=>{
    let done=false,id:string|null=null;const generation=epoch;try{if(enabled)id=uuid();}catch{}
    return (result:Record<string,string|number>)=>{if(done||!id||generation!==epoch)return null;done=true;return emit(eventName,{...context,...result},id);};
  };
  return {emit,begin,
    enabled:()=>enabled,
    setEnabled(value:boolean){if(enabled&&!value){epoch++;waiting=[];boot=null;}enabled=value;},
    subscribe(next:(event:ManagementEvidence)=>void){sink=next;const pending=waiting;waiting=[];if(enabled)for(const event of pending){if(!enabled)break;try{next(event);}catch{}}
      return ()=>{if(sink===next)sink=null;};},
    connection(transport:'direct'|'relay'){
      const started=now(),id=emit('connection.attempt',{transport}),generation=epoch;let done=false;
      return (outcome:'success'|'timeout'|'rejected'|'failed')=>{if(done||!id||generation!==epoch)return null;done=true;const elapsedMs=now()-started;if(elapsedMs<0||elapsedMs>600000)return null;return emit('connection.result',{transport,outcome,elapsedMs:Math.round(elapsedMs)},id);};
    }
  };
}
export const managementEvidence=createManagementEvidence();
