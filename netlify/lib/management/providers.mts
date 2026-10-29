/** Allowlisted, read-only provider adapters. No provider response body enters Studio errors. */
export type ProviderConfig = { githubToken?: string; githubRepo?: string; githubBranch?: string; netlifyToken?: string; netlifySite?: string; azureKey?: string; azureRegion?: string };
export type ProviderJob = { id: string; provider: 'github'|'netlify'; kind: 'ci'|'bot'|'voice'|'deploy'; state: string; sourceCommit?: string; startedAt?: string; finishedAt?: string; attempt: number; operationId?: string };
export type ProviderFailure = 'unauthorised'|'forbidden'|'rate_limited'|'timeout'|'network'|'provider_unavailable'|'unsupported'|'invalid_response';
export class ProviderError extends Error { readonly code: ProviderFailure; readonly definiteRejection: boolean; constructor(code: ProviderFailure, definiteRejection = false) { super(code); this.code=code; this.definiteRejection=definiteRejection; } }
const object = (x): Record<string,any> => x && typeof x==='object'&&!Array.isArray(x)?x:{};
const time = (x) => typeof x==='string'&&Number.isFinite(Date.parse(x))?new Date(x).toISOString():undefined;
const sha = (x) => typeof x==='string'&&/^[a-f0-9]{40}$/.test(x)?x:undefined;
const integer = (x,max=1000000) => /^\d+$/.test(String(x))&&Number.isSafeInteger(Number(x))&&Number(x)<=max?Number(x):null;
const operationID = (title) => typeof title==='string'?/management:([a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12})(?:\s|$)/i.exec(title)?.[1].toLowerCase():undefined;
export function providerAdapters(config: ProviderConfig, fetcher: typeof fetch = fetch, now = () => Date.now()) {
  const repo = /^[\w.-]+\/[\w.-]+$/.test(config.githubRepo||'')?config.githubRepo!:'';
  const site = /^[a-zA-Z0-9_-]{1,100}$/.test(config.netlifySite||'')?config.netlifySite!:'';
  async function request(url: string, headers: Record<string,string>, method='GET', body?: unknown) {
    const signal=AbortSignal.timeout(5000);let response: Response;
    try {response=await fetcher(url,{method,headers,signal,redirect:'error',...(body===undefined?{}:{body:JSON.stringify(body)})});}
    catch {throw new ProviderError(signal.aborted?'timeout':'network');}
    if(!response.ok) {
      await response.body?.cancel().catch(()=>{});
      const code=response.status===401?'unauthorised':response.status===403?'forbidden':response.status===429?'rate_limited':response.status===404?'unsupported':'provider_unavailable';
      throw new ProviderError(code,[400,401,403,404,422].includes(response.status));
    }
    const remaining=integer(response.headers.get('x-ratelimit-remaining')),limit=integer(response.headers.get('x-ratelimit-limit'));
    const reset=integer(response.headers.get('x-ratelimit-reset'),9999999999);
    const quota=remaining!==null&&limit!==null&&remaining<=limit?{status:'observed',remaining,limit,resetAt:reset&&reset*1000<=now()+7*86400000?new Date(reset*1000).toISOString():null}:{status:'unavailable',remaining:null,limit:null,resetAt:null};
    if(response.status===204)return {data:null,quota,status:response.status};
    const reader=response.body?.getReader();const chunks:Uint8Array[]=[];let size=0;
    if(!reader)throw new ProviderError('invalid_response');
    try {while(true){const part=await reader.read();if(part.done)break;size+=part.value.byteLength;if(size>1000000){await reader.cancel();throw new ProviderError('invalid_response');}chunks.push(part.value);}}
    catch(error){if(error instanceof ProviderError)throw error;throw new ProviderError(signal.aborted?'timeout':'network');}
    try {return {data:JSON.parse(Buffer.concat(chunks).toString('utf8')),quota,status:response.status};}catch{throw new ProviderError('invalid_response');}
  }
  const ghHeaders=()=>({Authorization:'Bearer '+config.githubToken,Accept:'application/vnd.github+json','X-GitHub-Api-Version':'2022-11-28','Content-Type':'application/json'});
  return {
    configured:{github:!!config.githubToken&&!!repo,netlify:!!config.netlifyToken&&!!site,azure:!!config.azureKey&&/^[a-z0-9-]{2,40}$/.test(config.azureRegion||'')},
    async github() {
      if(!config.githubToken||!repo)throw new ProviderError('unsupported');
      const {data,quota}=await request(`https://api.github.com/repos/${repo}/actions/runs?per_page=20`,ghHeaders());
      if(!Array.isArray(data?.workflow_runs))throw new ProviderError('invalid_response');
      const jobs:ProviderJob[]=data.workflow_runs.slice(0,20).flatMap(raw=>{
        const r=object(raw),id=integer(r.id,Number.MAX_SAFE_INTEGER);if(!id)return [];
        const workflow=String(r.path||'').split('/').at(-1)?.split('@')[0]||'';
        const conclusion=r.conclusion;
        const state=r.status==='completed'?(conclusion==='success'?'succeeded':['failure','timed_out','startup_failure','action_required'].includes(conclusion)?'failed':conclusion==='cancelled'?'cancelled':conclusion==='skipped'?'skipped':'unknown'):r.status==='in_progress'?'running':['queued','requested','waiting','pending'].includes(r.status)?'queued':'unknown';
        return [{id:String(id),provider:'github',kind:workflow==='nightly-child-bots.yml'?'bot':workflow==='voices-daily.yml'?'voice':'ci',state,
          sourceCommit:sha(r.head_sha),startedAt:time(r.run_started_at||r.created_at),finishedAt:r.status==='completed'?time(r.updated_at):undefined,
          attempt:integer(r.run_attempt,100)||1,operationId:operationID(r.display_title)}];
      });
      return {jobs,quota};
    },
    async netlify() {
      if(!config.netlifyToken||!site)throw new ProviderError('unsupported');
      const {data,quota}=await request(`https://api.netlify.com/api/v1/sites/${encodeURIComponent(site)}/deploys?per_page=10`,{Authorization:'Bearer '+config.netlifyToken});
      if(!Array.isArray(data))throw new ProviderError('invalid_response');
      const jobs:ProviderJob[]=data.slice(0,10).flatMap(raw=>{
        const r=object(raw);if(typeof r.id!=='string'||!/^[-a-zA-Z0-9]{1,100}$/.test(r.id))return [];
        const state=r.state==='ready'?'succeeded':r.state==='error'?'failed':['canceled','cancelled'].includes(r.state)?'cancelled':['building','processing','uploading','uploaded'].includes(r.state)?'running':['new','enqueued'].includes(r.state)?'queued':'unknown';
        return [{id:r.id,provider:'netlify',kind:'deploy',state,sourceCommit:sha(r.commit_ref),startedAt:time(r.created_at),finishedAt:['succeeded','failed','cancelled'].includes(state)?time(r.published_at||r.updated_at):undefined,attempt:1}];
      });return {jobs,quota};
    },
    async azure() {
      if(!config.azureKey||!/^[a-z0-9-]{2,40}$/.test(config.azureRegion||''))throw new ProviderError('unsupported');
      const {data}=await request(`https://${config.azureRegion}.tts.speech.microsoft.com/cognitiveservices/voices/list`,{'Ocp-Apim-Subscription-Key':config.azureKey});
      if(!Array.isArray(data))throw new ProviderError('invalid_response');
      return {voices:data.length,generation:'not_tested',quota:{status:'unavailable'}};
    },
    async dispatchBot(input:{count:number;duration:number;profile:string},operationId:string) {
      if(!config.githubToken||!repo)throw new ProviderError('unsupported',true);
      const branch=config.githubBranch||'main';if(!/^[\w./-]{1,160}$/.test(branch)||branch.includes('..'))throw new ProviderError('unsupported',true);
      const result=await request(`https://api.github.com/repos/${repo}/actions/workflows/nightly-child-bots.yml/dispatches`,ghHeaders(),'POST',{
        ref:branch,inputs:{count:String(input.count),duration:String(input.duration),profile:input.profile,management_operation_id:operationId}});
      if(result.status!==204)throw new ProviderError('invalid_response');
      return {accepted:true};
    }
  };
}
