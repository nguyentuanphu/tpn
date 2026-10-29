/** Pure shared contract. No browser, storage, timers or network side effects. */
export type ReportingPolicy={schemaVersion:1;collect:boolean;process:boolean;show:boolean;expiresAt:string|null};
export function parseReportingPolicy(value:unknown):ReportingPolicy|null {
 if(!value||typeof value!=='object'||Array.isArray(value))return null;
 const v=value as Record<string,unknown>;
 if(Object.keys(v).length!==5||!['schemaVersion','collect','process','show','expiresAt'].every(k=>k in v)||v.schemaVersion!==1||['collect','process','show'].some(k=>typeof v[k]!=='boolean'))return null;
 if(v.expiresAt!==null&&(typeof v.expiresAt!=='string'||!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/.test(v.expiresAt)||!Number.isFinite(Date.parse(v.expiresAt))))return null;
 if((v.collect||v.process)&&v.expiresAt===null)return null;
 return {schemaVersion:1,collect:v.collect as boolean,process:v.process as boolean,show:v.show as boolean,expiresAt:v.expiresAt as string|null};
}
export function effectiveReportingPolicy(value:unknown,now=Date.now()){
 if(value===undefined)return {installed:false,state:'legacy' as const,collect:true,process:true,show:true,expiresAt:null};
 const p=parseReportingPolicy(value);
 if(!p)return {installed:true,state:'invalid' as const,collect:false,process:false,show:false,expiresAt:null};
 const expired=p.expiresAt!==null&&Date.parse(p.expiresAt)<=now;
 return {installed:true,state:expired?'expired' as const:'active' as const,collect:!expired&&p.collect,process:!expired&&p.process,show:p.show,expiresAt:p.expiresAt};
}
