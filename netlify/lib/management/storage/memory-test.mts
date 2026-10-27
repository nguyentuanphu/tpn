/** Synthetic test adapter only. Runtime configuration must never select this. */
import type { EventQuery, JsonObject, ManagementDatabase, ManagementTransaction, Namespace, StoredEvent } from '../transactional/types.mts';
type State={records:Map<string,JsonObject>;events:Map<string,StoredEvent>;conflicts:Map<string,StoredEvent>};
export class MemoryManagementTestDatabase implements ManagementDatabase {
  private state:State={records:new Map(),events:new Map(),conflicts:new Map()};
  private tail:Promise<void>=Promise.resolve();
  async transaction<T>(_locks:string[],work:(tx:ManagementTransaction)=>Promise<T>):Promise<T> {
    const old=this.tail;let release:()=>void=()=>{};
    this.tail=new Promise<void>(resolve=>{release=resolve;});await old;
    const state=structuredClone(this.state),key=(n:Namespace,k:string)=>n+'|'+k;
    const tx:ManagementTransaction={
      get:async(n,k)=>structuredClone(state.records.get(key(n,k))??null),
      put:async(n,k,v)=>{if(['audit','config_versions','finance_versions','finance_batches'].includes(n)&&state.records.has(key(n,k)))throw new Error('immutable_management_history');state.records.set(key(n,k),structuredClone(v));},
      list:async(n,p='')=>[...state.records].filter(([k])=>k.startsWith(n+'|'+p)).sort(([a],[b])=>a.localeCompare(b)).map(([k,v])=>({key:k.slice(n.length+1),value:structuredClone(v)})),
      getEvent:async(d,i)=>structuredClone(state.events.get(d+'|'+i)??null),
      insertEvent:async(e)=>{const k=e.deviceId+'|'+e.eventId;if(state.events.has(k))throw new Error('duplicate_event');state.events.set(k,structuredClone(e));},
      quarantine:async(e)=>{state.conflicts.set(e.deviceId+'|'+e.eventId+'|'+e.payloadHash,structuredClone(e));},
      events:async(q:EventQuery)=>[...state.events.values()].filter(e=>e.occurredAt>=q.from&&e.occurredAt<q.to&&(!q.build||e.build===q.build)&&(!q.environment||e.environment===q.environment)&&(!q.traffic||e.traffic===q.traffic)).sort((a,b)=>(a.occurredAt+a.deviceId+a.eventId).localeCompare(b.occurredAt+b.deviceId+b.eventId)).slice(0,q.limit??10000).map(e=>structuredClone(e))
    };
    try {const result=await work(tx);this.state=state;return result;}finally {release();}
  }
  inspect(){return structuredClone(this.state);}
}
