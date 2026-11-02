import test from 'node:test';
import assert from 'node:assert/strict';
import { createManagementTelemetry, attachActivityTelemetry, cleanManagementData, cleanConfigReceipt } from '../../js/management-telemetry.ts';

const makeStore = () => { const data = new Map(); return { data, getItem: k => data.get(k) ?? null, setItem: (k, v) => data.set(k, v), removeItem: k => data.delete(k) }; };
function fixture(extra = {}) {
  const storage = makeStore(), requests = [], timers = new Map();
  let enabled = true, names = true, time = Date.parse('2026-10-26T00:00:00Z'), serial = 0, timer = 0;
  const uuid = () => `${(++serial).toString(16).padStart(8, '0')}-1111-4111-8111-111111111111`;
  const options = { storage, deviceId: () => 'demo12345678', sessionId: 'demo123456789012', build: 'v1.01', sourceCommit: null,
    environment: 'staging', traffic: 'synthetic_bot', enabled: () => enabled, reportNames: () => names,
    profiles: () => [{ id: 'kid-1', name: 'Na Family', age: 'little' }], now: () => time, uuid, random: () => 0.5,
    schedule: (f, ms) => { const id = ++timer; timers.set(id, { f, ms }); return id; }, cancel: id => timers.delete(id),
    fetcher: async (url, opt) => { const body = JSON.parse(opt.body); requests.push({ url, body }); return { ok: true, status: 200, json: async () => url.endsWith('config-receipts') ? { ok: true } : { accepted: body.events.map(e => e.eventId), duplicates: [] } }; }, ...extra };
  return { storage, requests, timers, options, client: createManagementTelemetry(options), uuid,
    enabled: v => { enabled = v; }, names: v => { names = v; }, advance: ms => { time += ms; } };
}
const start = f => f.client.enqueue('activity.started', { activityId: 'oanquan', difficulty: 'easy', mode: 'solo' });
const receipt = { scopeKey: 'global', revision: 2, effectiveHash: 'a'.repeat(64), fetchedAt: '2026-10-26T00:00:00Z', appliedAt: '2026-10-26T00:00:01Z', result: 'applied', reasonCode: 'none' };

test('permanent rejection isolates an invalid attempt so later valid reports can progress',async()=>{
  const f=fixture({fetcher:async(_url,opt)=>{
    const body=JSON.parse(opt.body);
    return body.events.some(e=>e.data.activityId==='not_in_catalogue')
      ?{ok:false,status:422,json:async()=>({error:'unknown_activity'})}
      :{ok:true,status:200,json:async()=>({accepted:body.events.map(e=>e.eventId),duplicates:[]})};
  }});
  f.client.enqueue('activity.started',{activityId:'not_in_catalogue',difficulty:'easy',mode:'solo'});
  start(f);
  for(let i=0;i<8&&f.client.status().events;i++){await f.client.flush();f.advance(900000);}
  assert.equal(f.client.status().events,0);assert.equal(f.client.status().dropped,1);
});

test('management collection is gated and only durable bounded events are sent with explicit unknown source', async () => {
  const f = fixture(); f.enabled(false);
  assert.equal(start(f), null); assert.equal(f.storage.data.size, 0);
  f.enabled(true); const event = start(f);
  assert.equal(event.sourceCommit, null); assert.equal(event.profiles[0].name, 'Na');
  assert.equal(f.storage.data.has('sv2_management_bot_out'), true);
  assert.equal(f.storage.data.has('sv2_management_out'), false);
  assert.equal(f.requests.length, 0);
  await f.client.flush();
  assert.equal(f.requests[0].body.events[0].eventId, event.eventId);
  assert.equal(f.client.status().events, 0);
});

test('lost acknowledgement retains event ID and retry body across reload; acknowledgement removes only named events', async () => {
  const f = fixture({ fetcher: async () => { throw new Error('offline'); } });
  const first = start(f); await f.client.flush(); assert.equal(f.client.status().events, 1);
  const sent = [];
  const retry = createManagementTelemetry({ ...f.options, fetcher: async (_url, opt) => { sent.push(JSON.parse(opt.body)); return { ok: true, status: 200, json: async () => ({ accepted: [], duplicates: [first.eventId] }) }; } });
  await retry.flush();
  assert.deepEqual(sent[0].events[0], first); assert.equal(retry.status().events, 0);
});

test('HTTP success without a committed-ID acknowledgement does not clear queue', async () => {
  const f = fixture({ fetcher: async () => ({ ok: true, status: 200, json: async () => ({ ok: true }) }) });
  start(f); assert.equal(await f.client.flush(), false); assert.equal(f.client.status().events, 1);
});

test('analytics opt-out clears only management queue, including an in-flight lost acknowledgement', async () => {
  let release;
  const f = fixture({ fetcher: async () => new Promise(resolve => { release = resolve; }) });
  f.storage.setItem('sv2_profiles', 'saved-progress'); start(f);
  const sending = f.client.flush(); f.enabled(false); f.client.synchroniseConsent();
  release({ ok: true, status: 200, json: async () => ({ accepted: [], duplicates: [] }) }); await sending;
  assert.equal(f.client.status().events, 0); assert.equal(f.storage.getItem('sv2_management_bot_out'), null);
  assert.equal(f.storage.getItem('sv2_profiles'), 'saved-progress');
});

test('name reporting opt-out discards old named retry bodies and omits names from new events', () => {
  const f = fixture(); start(f); f.names(false); f.client.synchroniseConsent();
  assert.equal(f.client.status().events, 0); assert.equal(f.client.status().dropped, 1);
  const event = start(f); assert.deepEqual(event.profiles, [{ id: 'kid-1', age: 'little' }]);
});

test('storage quota failures are nonblocking and never transmit an undurable newly collected event', async () => {
  const f = fixture({ storage: { getItem: () => null, setItem: () => { throw new Error('quota'); }, removeItem: () => {} } });
  assert.equal(start(f), null); assert.equal(f.client.status().storageFailure, true);
  await f.client.flush(); assert.equal(f.requests.length, 0);
});

test('retry-after is honoured, only one flush runs, and stopping prevents stale response rewriting queue', async () => {
  let calls = 0, release;
  const f = fixture({ fetcher: async () => { calls++; return new Promise(resolve => { release = resolve; }); } });
  start(f); const first = f.client.flush(); assert.equal(await f.client.flush(), false); assert.equal(calls, 1);
  release({ ok: false, status: 429, headers: { get: () => '1800' }, json: async () => ({}) }); await first;
  assert.equal(f.client.status().nextAttemptAt, f.options.now() + 1800000);
  assert.equal(await f.client.flush(), false); assert.equal(calls, 1);
  f.advance(1800000); const second = f.client.flush(); f.client.stop();
  const preserved = f.storage.getItem('sv2_management_bot_out');
  release({ ok: true, status: 200, json: async () => ({ accepted: [], duplicates: [] }) }); await second;
  assert.equal(f.storage.getItem('sv2_management_bot_out'), preserved);
});

test('queue limits evict a whole attempt rather than only its terminal event; old events expire', () => {
  const f = fixture({ maxEvents: 2 }); const first = start(f);
  f.client.enqueue('activity.completed', { activityId: 'oanquan' }, first.attemptId);
  start(f);
  const stored = JSON.parse(f.storage.getItem('sv2_management_bot_out'));
  assert.equal(stored.events.length, 1); assert.equal(stored.events.some(e => e.attemptId === first.attemptId), false);
  f.advance(31 * 86400000); start(f); assert.equal(f.client.status().events, 1);
});

test('arbitrary payload fields, room codes, unknown names and invalid receipts are refused', () => {
  assert.equal(cleanManagementData('activity.started', { activityId: 'oanquan', difficulty: 'easy', mode: 'solo', photo: 'private' }), null);
  assert.equal(cleanManagementData('connection.attempt', { transport: 'direct', roomCode: 'private' }), null);
  assert.equal(cleanManagementData('unknown', {}), null);
  assert.equal(cleanConfigReceipt({ ...receipt, revision: 0 }, 'demo12345678'), null);
  assert.equal(cleanConfigReceipt({ ...receipt, appliedAt: null }, 'demo12345678'), null);
});

test('config receipt survives failure and is removed only after explicit successful committed response', async () => {
  let good = false;
  const f = fixture({ fetcher: async () => ({ ok: true, status: 200, json: async () => ({ ok: good }) }) });
  assert.equal(f.client.receipt(receipt), true); assert.equal(f.client.receipt(receipt), true);
  assert.equal(f.client.status().receipts, 1); await f.client.flush(); assert.equal(f.client.status().receipts, 1);
  good = true; f.advance(1000); await f.client.flush(); assert.equal(f.client.status().receipts, 0);
});

test('activity adapter counts one attempt for multiple profile participants and one terminal outcome', () => {
  const handlers = new Map();
  const bus = { on: (k, f) => { handlers.set(k, f); return () => handlers.delete(k); } };
  const f = fixture(); const detach = attachActivityTelemetry(f.client, bus, () => ({ difficulty: 'easy', mode: 'local_two' }), f.uuid);
  const payload = { activityId: 'act:oanquan/1', defId: 'game:oanquan', players: ['player:k1', 'player:k2'] };
  handlers.get('ActivityStarted')(payload); handlers.get('ActivityStarted')(payload);
  handlers.get('ActivityCompleted')(payload); handlers.get('ActivityAbandoned')(payload);
  const stored = JSON.parse(f.storage.getItem('sv2_management_bot_out'));
  assert.equal(stored.events.length, 2); assert.equal(stored.events[0].attemptId, stored.events[1].attemptId);
  detach(); assert.equal(handlers.size, 0);
});
