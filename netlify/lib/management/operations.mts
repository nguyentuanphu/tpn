// Read-only capability/readiness projection. Variable presence never proves access.
// Provider probes and workflow dispatch are intentionally injected/handled elsewhere.
type Capability = 'database' | 'githubRead' | 'githubDispatch' | 'netlifyRead' | 'voiceGeneration' | 'managementEvents' | 'configurationReceipts';
type Observation = { status: 'ready' | 'degraded' | 'unavailable'; observedAt: string; operation: string; errorCode?: string };
type Job = { id: string; kind: 'ci' | 'bot' | 'voice' | 'retention' | 'restore'; state: 'queued' | 'running' | 'succeeded' | 'failed' | 'cancelled'; sourceCommit?: string; startedAt?: string; finishedAt?: string; attempt?: number };
export type OperationsOptions = { configured?: Partial<Record<Capability, boolean>>; observations?: Partial<Record<Capability, Observation>>; jobs?: Job[]; now?: Date; maxObservationAgeMs?: number };
const CAPABILITIES: Capability[] = ['database', 'githubRead', 'githubDispatch', 'netlifyRead', 'voiceGeneration', 'managementEvents', 'configurationReceipts'];
const JOB_KINDS = ['ci', 'bot', 'voice', 'retention', 'restore'], JOB_STATES = ['queued', 'running', 'succeeded', 'failed', 'cancelled'];
const ERROR_CODES = ['forbidden', 'unauthorised', 'timeout', 'network', 'rate_limited', 'provider_unavailable', 'not_configured', 'unsupported'];
const iso = (v: unknown) => typeof v === 'string' && Number.isFinite(Date.parse(v)) ? new Date(v).toISOString() : null;

export function managementOperations(options: OperationsOptions = {}) {
  const now = options.now || new Date(), maxAge = options.maxObservationAgeMs ?? 5 * 60e3;
  const services = CAPABILITIES.map(id => {
    const configured = options.configured?.[id] === true, probe = options.observations?.[id];
    const at = iso(probe?.observedAt), validTime = at !== null && Date.parse(at) <= +now + 60e3;
    const fresh = validTime && +now - Date.parse(at) <= maxAge;
    const status = !configured ? 'not_configured' : !probe || !validTime ? 'configured_unverified' : !fresh ? 'stale' : ['ready', 'degraded', 'unavailable'].includes(probe.status) ? probe.status : 'configured_unverified';
    return { id, configured, status, observedAt: validTime ? at : null,
      operation: probe && /^[a-z][a-z0-9_.-]{0,59}$/.test(probe.operation) ? probe.operation : null,
      errorCode: probe?.errorCode && ERROR_CODES.includes(probe.errorCode) ? probe.errorCode : null };
  });
  const jobs = (options.jobs || []).slice(0, 100).filter(j => /^[a-zA-Z0-9_.:-]{1,100}$/.test(j.id) && JOB_KINDS.includes(j.kind) && JOB_STATES.includes(j.state)).map(j => ({
    id: j.id, kind: j.kind, state: j.state, sourceCommit: typeof j.sourceCommit === 'string' && /^[a-f0-9]{40}$/.test(j.sourceCommit) ? j.sourceCommit : null,
    startedAt: iso(j.startedAt), finishedAt: iso(j.finishedAt), attempt: Number.isInteger(j.attempt) && Number(j.attempt) > 0 && Number(j.attempt) <= 100 ? j.attempt : 1
  }));
  const terminal = jobs.filter(j => ['succeeded', 'failed'].includes(j.state));
  return { schemaVersion: 1, generatedAt: now.toISOString(), services, jobs,
    jobSummary: options.jobs === undefined ? { status: 'unavailable', terminalCount: null, successCount: null } : { status: 'observed', terminalCount: terminal.length, successCount: terminal.filter(j => j.state === 'succeeded').length },
    quality: ['configuration-presence-is-not-provider-authorisation', 'dispatch-is-not-job-completion', ...(options.jobs === undefined ? ['workflow-outcomes-not-connected'] : [])],
    finance: { status: 'deferred', reason: 'Owner deferred finance input.' } };
}
