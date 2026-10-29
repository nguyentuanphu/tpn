import { cleanManagementEvidence as cleanManagementData } from './core/events.js';
// Optional management measurements. Independent of saves and legacy analytics: a failed queue or
// request never interrupts play. This module is imported only after its release switch is enabled.
export type ManagementProfile = { id: string; name?: string; age: 'little' | 'big' };
export type ManagementEvent = {
  schemaVersion: 1; eventId: string; deviceId: string; sessionId: string; attemptId: string;
  eventName: string; occurredAt: string; deviceDay: string; offsetMinutes: number;
  build: string; sourceCommit: string | null; environment: 'production' | 'staging' | 'local';
  traffic: 'ordinary' | 'authorised_test' | 'synthetic_bot'; profiles?: ManagementProfile[];
  data: Record<string, string | number>;
};
export type ConfigReceipt = {
  schemaVersion: 1; deviceId: string; scopeKey: string; revision: number; effectiveHash: string;
  fetchedAt: string; appliedAt: string | null; result: 'applied' | 'rejected' | 'unsupported';
  reasonCode: 'none' | 'invalid_config' | 'incompatible_build' | 'scope_mismatch' | 'storage_failure';
};
type Queue = { events: ManagementEvent[]; receipts: ConfigReceipt[]; dropped: number };
type StorageLike = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;
type ResponseLike = { ok: boolean; status: number; headers?: { get(name: string): string | null }; json(): Promise<unknown> };
export type ManagementOptions = {
  storage: StorageLike | null; fetcher: (url: string, options: RequestInit) => Promise<ResponseLike>;
  enabled: () => boolean; deviceId: () => string; sessionId: string; build: string;
  profiles?: () => ManagementProfile[]; reportNames?: () => boolean;
  sourceCommit?: string | null; environment?: ManagementEvent['environment']; traffic?: ManagementEvent['traffic'];
  now?: () => number; uuid?: () => string; random?: () => number;
  online?: () => boolean; visible?: () => boolean;
  schedule?: (fn: () => void, delay: number) => ReturnType<typeof globalThis.setTimeout> | number;
  cancel?: (id: ReturnType<typeof globalThis.setTimeout> | number) => void;
  maxEvents?: number; maxBytes?: number; key?: string;
};

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const ID = /^[a-z0-9]{12}$/, SESSION = /^[a-z0-9]{16}$/, ACTIVITY = /^[a-z0-9_-]{1,32}$/;
const BUILD = /^(v\d{1,2}\.\d{2}|r\d{1,4}(\.\d{1,2})?)$/;
const DAY = 86400000, KEEP = 30 * DAY, MAX_BATCH_BYTES = 64000;
const object = (value: unknown): value is Record<string, unknown> => !!value && typeof value === 'object' && !Array.isArray(value);
const bytes = (value: unknown) => new TextEncoder().encode(JSON.stringify(value)).length;
const iso = (value: unknown): value is string => typeof value === 'string' && /^\d{4}-\d\d-\d\dT.*Z$/.test(value) && Number.isFinite(Date.parse(value));
export { cleanManagementEvidence as cleanManagementData } from './core/events.js';

const profilesFor = (profiles: ManagementProfile[], names: boolean): ManagementProfile[] => profiles.slice(0, 6).filter(p => p && typeof p.id === 'string' && /^[A-Za-z0-9_-]{1,64}$/.test(p.id) && ['little', 'big'].includes(p.age)).map(p => ({
  id: p.id, age: p.age, ...(names && typeof p.name === 'string' && p.name.trim() ? { name: p.name.trim().split(/\s+/)[0].replace(/[^\p{L}'-]/gu, '').slice(0, 20) } : {})
}));

export function cleanConfigReceipt(value: unknown, deviceId: string): ConfigReceipt | null {
  if (!ID.test(deviceId) || !object(value) || typeof value.scopeKey !== 'string' || !/^(global|device:[a-z0-9]{12}|feature:[a-z0-9_-]{1,60})$/.test(value.scopeKey) ||
      !Number.isSafeInteger(value.revision) || Number(value.revision) < 1 || typeof value.effectiveHash !== 'string' || !/^[0-9a-f]{64}$/.test(value.effectiveHash) || !iso(value.fetchedAt)) return null;
  const result = value.result, reason = value.reasonCode;
  if (result === 'applied') { if (!iso(value.appliedAt) || reason !== 'none') return null; }
  else if (!['rejected', 'unsupported'].includes(String(result)) || value.appliedAt !== null || !['invalid_config', 'incompatible_build', 'scope_mismatch', 'storage_failure'].includes(String(reason))) return null;
  return { schemaVersion: 1, deviceId, scopeKey: value.scopeKey, revision: Number(value.revision), effectiveHash: value.effectiveHash,
    fetchedAt: value.fetchedAt, appliedAt: value.appliedAt as string | null, result: result as ConfigReceipt['result'], reasonCode: reason as ConfigReceipt['reasonCode'] };
}

/** Factory is dependency-injected so quota, offline and lost-ack behavior can be checked without a browser. */
export function createManagementTelemetry(options: ManagementOptions) {
  const now = options.now || Date.now, uuid = options.uuid || (() => crypto.randomUUID()), random = options.random || Math.random;
  const schedule = options.schedule || setTimeout, cancel = options.cancel || clearTimeout;
  const traffic = options.traffic || 'ordinary';
  const key = options.key || (traffic === 'synthetic_bot' ? 'sv2_management_bot_out' : 'sv2_management_out');
  const maxEvents = Math.max(1, Math.min(5000, options.maxEvents || 5000));
  const maxBytes = Math.max(2048, Math.min(1000000, options.maxBytes || 1000000));
  let queue: Queue = { events: [], receipts: [], dropped: 0 }, timer: ReturnType<typeof globalThis.setTimeout> | number | null = null;
  let sending = false, retries = 0, nextAttemptAt = 0, stopped = false, generation = 0, storageFailure = false;
  let batchLimit = 50, serverDisabled=false;
  let requestController:AbortController|null=null;
  const receiptKey = (r: ConfigReceipt) => `${r.deviceId}|${r.scopeKey}|${r.revision}|${r.effectiveHash}|${r.result}`;
  const eligible = () => !stopped && options.enabled() && ID.test(options.deviceId()) && SESSION.test(options.sessionId) && BUILD.test(options.build);
  const cancelTimer = () => { if (timer !== null) cancel(timer); timer = null; };
  const save = () => {
    if (!options.storage) { storageFailure = true; return false; }
    try { options.storage?.setItem(key, JSON.stringify(queue)); storageFailure = false; return !!options.storage; }
    catch { storageFailure = true; return false; }
  };
  const clear = () => {
    generation++; requestController?.abort(); queue = { events: [], receipts: [], dropped: 0 }; retries = 0; nextAttemptAt = 0; cancelTimer();
    try { options.storage?.removeItem(key); } catch { storageFailure = true; }
  };
  const prune = () => {
    const oldest = now() - KEEP, before = queue.events.length + queue.receipts.length;
    queue.events = queue.events.filter(e => Date.parse(e.occurredAt) >= oldest);
    queue.receipts = queue.receipts.filter(e => Date.parse(e.fetchedAt) >= oldest).slice(-100);
    queue.dropped += before - queue.events.length - queue.receipts.length;
    // Evict whole attempts first, so a retained start does not lose only its terminal event.
    while (queue.events.length > maxEvents || bytes(queue) > maxBytes) {
      const first = queue.events[0];
      if (first) { const previous = queue.events.length; queue.events = queue.events.filter(e => e.attemptId !== first.attemptId); queue.dropped += previous - queue.events.length; }
      else if (queue.receipts.length) { queue.receipts.shift(); queue.dropped++; }
      else break;
    }
  };
  const arm = (delay = 1000) => {
    if (!eligible() || timer !== null || (!queue.events.length && !queue.receipts.length)) return;
    timer = schedule(() => { timer = null; void flush(); }, Math.min(900000, Math.max(delay, nextAttemptAt - now(), 0)));
  };
  const retry = (response?: ResponseLike) => {
    retries++;
    const raw = response?.headers?.get('retry-after');
    const seconds = raw && /^\d+$/.test(raw) ? Number(raw) * 1000 : raw ? Date.parse(raw) - now() : 0;
    const jitter = Math.floor(random() * Math.min(900000, 1000 * 2 ** Math.min(retries - 1, 10)));
    const wait = Math.max(250, jitter, Number.isFinite(seconds) ? seconds : 0);
    nextAttemptAt = now() + wait; arm(wait);
  };

  // Treat local queue contents as untrusted. Never forward newly injected arbitrary keys from disk.
  try {
    const saved = options.storage?.getItem(key) || 'null';
    const stored: unknown = saved.length <= maxBytes ? JSON.parse(saved) : null;
    if (object(stored)) {
      if (Array.isArray(stored.events)) for (const raw of stored.events.slice(0, 5000)) {
        if (!object(raw) || !UUID.test(String(raw.eventId || '')) || !UUID.test(String(raw.attemptId || '')) || !iso(raw.occurredAt) || raw.deviceId !== options.deviceId() || raw.traffic !== traffic || raw.schemaVersion !== 1 || !SESSION.test(String(raw.sessionId)) || !BUILD.test(String(raw.build)) ||
            (raw.sourceCommit !== null && (typeof raw.sourceCommit !== 'string' || !/^[0-9a-f]{40}$/.test(raw.sourceCommit))) || !['production', 'staging', 'local'].includes(String(raw.environment))) continue;
        const data = cleanManagementData(String(raw.eventName), raw.data);
        if (!data || !/^\d{4}-\d\d-\d\d$/.test(String(raw.deviceDay)) || !Number.isInteger(raw.offsetMinutes) || Math.abs(Number(raw.offsetMinutes)) > 840) continue;
        // A retry must keep the same payload. Discard named pending events on opt-out rather than
        // rewriting the body under an event ID that may already have reached the server.
        if (options.reportNames?.() === false && Array.isArray(raw.profiles) && raw.profiles.some(p => object(p) && p.name !== undefined)) { queue.dropped++; continue; }
        const profiles = Array.isArray(raw.profiles) ? profilesFor(raw.profiles as ManagementProfile[], true) : [];
        queue.events.push({ schemaVersion: 1, eventId: String(raw.eventId), deviceId: String(raw.deviceId), sessionId: String(raw.sessionId), attemptId: String(raw.attemptId), eventName: String(raw.eventName), occurredAt: raw.occurredAt, deviceDay: String(raw.deviceDay), offsetMinutes: Number(raw.offsetMinutes), build: String(raw.build), sourceCommit: raw.sourceCommit as string | null, environment: raw.environment as ManagementEvent['environment'], traffic,
          ...(profiles.length ? { profiles } : {}), data });
      }
      if (Array.isArray(stored.receipts)) queue.receipts = stored.receipts.map(r => cleanConfigReceipt(r, options.deviceId())).filter((r): r is ConfigReceipt => !!r).slice(-100);
      if (Number.isSafeInteger(stored.dropped) && Number(stored.dropped) >= 0) queue.dropped = Number(stored.dropped);
    }
  } catch { storageFailure = true; }
  prune();

  function synchroniseConsent() {
    if (!options.enabled()) { clear(); return false; }
    if (options.reportNames?.() === false) {
      const before = queue.events.length;
      queue.events = queue.events.filter(e => !e.profiles?.some(p => p.name !== undefined));
      if (before !== queue.events.length) { queue.dropped += before - queue.events.length; save(); }
    }
    return true;
  }

  function enqueue(eventName: string, value: unknown, attemptId = uuid(), occurredAt = now()): ManagementEvent | null {
    try {
      if (!synchroniseConsent() || !eligible() || !UUID.test(attemptId)) return null;
      const data = cleanManagementData(eventName, value); if (!data) return null;
      if (!Number.isFinite(occurredAt) || occurredAt>now()+1000 || occurredAt<now()-30*DAY) return null;
      const date = new Date(occurredAt), eventId = uuid(); if (!UUID.test(eventId)) return null;
      const profiles = profilesFor(options.profiles?.() || [], options.reportNames?.() !== false);
      const event: ManagementEvent = { schemaVersion: 1, eventId, deviceId: options.deviceId(), sessionId: options.sessionId, attemptId, eventName,
        occurredAt: date.toISOString(), deviceDay: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`,
        offsetMinutes: -date.getTimezoneOffset() || 0, build: options.build, sourceCommit: /^[0-9a-f]{40}$/.test(options.sourceCommit || '') ? options.sourceCommit! : null,
        environment: options.environment || 'production', traffic, ...(profiles.length ? { profiles } : {}), data };
      queue.events.push(event); prune();
      // Do not transmit a newly collected event until it has reached durable storage.
      if (!save()) { queue.events = queue.events.filter(e => e.eventId !== eventId); queue.dropped++; return null; }
      arm(); return event;
    } catch { return null; }
  }

  function receipt(value: unknown) {
    try {
      if (!synchroniseConsent() || !eligible()) return false;
      const row = cleanConfigReceipt(value, options.deviceId()); if (!row) return false;
      const k = receiptKey(row); if (queue.receipts.some(r => receiptKey(r) === k)) return true;
      queue.receipts.push(row); prune();
      if (!save()) { queue.receipts = queue.receipts.filter(r => receiptKey(r) !== k); return false; }
      arm(); return true;
    } catch { return false; }
  }

  async function flush(closing = false): Promise<boolean> {
    if (!synchroniseConsent() || !eligible() || sending || options.online?.() === false || (!closing && options.visible?.() === false)) return false;
    if (now() < nextAttemptAt) { arm(nextAttemptAt - now()); return false; }
    cancelTimer(); prune();
    if (!queue.events.length && !queue.receipts.length) return true;
    sending = true; const epoch = generation;requestController=new AbortController();
    try {
      const batch: ManagementEvent[] = [];
      for (const event of queue.events.slice(0, batchLimit)) { if (bytes({ schemaVersion: 1, events: [...batch, event] }) > MAX_BATCH_BYTES) break; batch.push(event); }
      if (batch.length) {
        const res = await options.fetcher('/api/management/events', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ schemaVersion: 1, events: batch }), keepalive: closing,signal:requestController.signal });
        if (epoch !== generation || !synchroniseConsent()) return false;
        if (!res.ok) {
          if(res.status===410){clear();serverDisabled=true;stopped=true;return false;}
          if ([409, 413, 422].includes(res.status)) {
            if (batch.length > 1) batchLimit = Math.max(1, Math.floor(batch.length / 2));
            else {
              // Isolate a permanently rejected attempt without rewriting its stable IDs
              // or treating it as acknowledged. Other valid reports must still progress.
              const before = queue.events.length;
              queue.events = queue.events.filter(e => e.attemptId !== batch[0].attemptId);
              queue.dropped += before - queue.events.length; save(); batchLimit = 50;
            }
          }
          retry(res); return false;
        }
        const ack = await res.json();
        if (!object(ack) || !Array.isArray(ack.accepted) || !Array.isArray(ack.duplicates)) { retry(); return false; }
        const sent = new Set(batch.map(e => e.eventId)), got = new Set([...ack.accepted, ...ack.duplicates].filter((v): v is string => typeof v === 'string' && sent.has(v)));
        if (!got.size) { retry(); return false; }
        queue.events = queue.events.filter(e => !got.has(e.eventId)); save(); batchLimit = 50;
      }
      const row = queue.receipts[0];
      if (row) {
        const res = await options.fetcher('/api/management/config-receipts', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(row), keepalive: closing,signal:requestController.signal });
        if (epoch !== generation || !synchroniseConsent()) return false;
        const ack = res.ok ? await res.json() : null;
        if (!res.ok || !object(ack) || ack.ok !== true) { retry(res); return false; }
        queue.receipts = queue.receipts.filter(r => receiptKey(r) !== receiptKey(row)); save();
      }
      retries = 0; nextAttemptAt = 0; arm(); return true;
    } catch { if (epoch === generation) retry(); return false; }
    finally { sending = false;requestController=null; }
  }

  return { enqueue, receipt, flush, synchroniseConsent, start: () => { if (synchroniseConsent()) arm(); }, clear,
    stop: () => { stopped = true; generation++;requestController?.abort(); cancelTimer(); },
    status: () => ({ serverDisabled,events: queue.events.length, receipts: queue.receipts.length, dropped: queue.dropped, storageFailure, sending, nextAttemptAt }) };
}

type Bus = { on(name: string, handler: (payload: Record<string, unknown>) => void): () => void };
/** One game attempt regardless of participating profile count. Never derives identity from display names. */
export function attachActivityTelemetry(client: ReturnType<typeof createManagementTelemetry>, bus: Bus,
  context: (payload: Record<string, unknown>) => { difficulty: 'easy' | 'medium' | 'hard'; mode: 'solo' | 'local_two' | 'online' }, uuid = () => crypto.randomUUID()) {
  const active = new Map<string, { attemptId: string; activityId: string }>();
  const off = [bus.on('ActivityStarted', e => {
    if (typeof e.activityId !== 'string' || typeof e.defId !== 'string') return;
    const activityId = e.defId.replace(/^game:/, ''); if (!ACTIVITY.test(activityId) || active.has(e.activityId)) return;
    const attemptId = uuid();
    if (client.enqueue('activity.started', { activityId, ...context(e) }, attemptId)) active.set(e.activityId, { attemptId, activityId });
  })];
  const terminal = (e: Record<string, unknown>, won: boolean) => {
    if (typeof e.activityId !== 'string') return;
    const a = active.get(e.activityId); if (!a) return;
    active.delete(e.activityId);
    client.enqueue(won ? 'activity.completed' : 'activity.abandoned', won ? { activityId: a.activityId } : { activityId: a.activityId, reason: e.reason === 'level' ? 'cancelled' : 'closed' }, a.attemptId);
  };
  off.push(bus.on('ActivityCompleted', e => terminal(e, true)), bus.on('ActivityAbandoned', e => terminal(e, false)));
  return () => { off.forEach(f => f()); active.clear(); };
}
