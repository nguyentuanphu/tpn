import test from 'node:test';
import assert from 'node:assert/strict';
import { applyParadeStop, evaluateMission, initialParadeState, laneSymbol, makeParadeRound, nextParadeRound, paradeConfig } from '../js/games/fruitparade-engine.js';
import type { ParadeRound, Stop } from '../js/games/fruitparade-engine.js';
import { ParadeSession } from '../js/games/fruitparade-session.js';
import type { ParadeChannel } from '../js/games/fruitparade-session.js';

const tickFor = (r: ParadeRound, seat: number, lane: number) => r.cycles[seat][lane].indexOf(r.goals[seat][lane] || r.config.pool[0]);

test('parade age configs and deterministic lanes are playable for every advertised seat', () => {
  for (let tier = 0; tier <= 3; tier++) for (let seats = 1; seats <= 4; seats++) {
    const round = makeParadeRound('family-garden', tier, seats);
    assert.deepEqual(round, makeParadeRound('family-garden', tier, seats));
    assert.equal(round.cycles.length, seats);
    let state = initialParadeState(round);
    for (let seat = 0; seat < seats; seat++) for (let lane = 0; lane < 3; lane++) {
      const next = applyParadeStop(state, { round: 0, attempt: 0, seat, lane, tick: tickFor(round, seat, lane) });
      assert.ok(next); state = next;
    }
    assert.equal(state.stops.length, seats * 3); assert.equal(state.outcome?.success, true);
  }
  assert.ok(paradeConfig(0).interval > paradeConfig(3).interval);
  assert.equal(paradeConfig(0).quota, 1);assert.equal(paradeConfig(3).quota, 3);
});

test('parade rejects duplicate, stale, out-of-range and future lane actions without changing state', () => {
  const state = initialParadeState(makeParadeRound('validation', 2, 2));
  const action = { round: 0, attempt: 0, seat: 0, lane: 0, tick: 0 };
  const next = applyParadeStop(state, action); assert.ok(next);
  assert.equal(state.stops.length, 0);assert.equal(applyParadeStop(next, action), null);
  for (const bad of [{ round: 1 }, { attempt: 1 }, { seat: 2 }, { lane: 3 }, { tick: -1 }, { tick: 1801 }, { tick: NaN }]) assert.equal(applyParadeStop(state, { ...action, ...bad }), null);
});

test('rainbow substitutes once, specials need their real combinations and partial results have bounded retries', () => {
  const r = makeParadeRound('specials', 2, 1);r.goals = [['apple', 'apple', 'banana']];
  const stops = (ids: Stop['symbol'][]) => ids.map((symbol, lane) => ({ seat: 0, lane, symbol, assisted: false }));
  assert.equal(evaluateMission(r, stops(['apple', 'rainbow', 'banana'])).success, true);
  assert.equal(evaluateMission(r, stops(['rainbow', 'flower', 'banana'])).matched, 2);
  assert.deepEqual(evaluateMission(r, stops(['dragon', 'star', 'star'])).effects, ['dragon']);
  assert.deepEqual(evaluateMission(r, stops(['ladybug', 'ladybug', 'ladybug'])).effects, ['ladybug']);
  assert.deepEqual(evaluateMission(r, stops(['key', 'star', 'banana'])).effects, ['treasure']);
  const partial = { round: r, stops: stops(['flower', 'flower', 'flower']), outcome: evaluateMission(r, stops(['flower', 'flower', 'flower'])) };
  const retry = nextParadeRound(partial);assert.ok(retry);assert.equal(retry.attempt, 1);
  const later = nextParadeRound({ ...partial, round: retry });assert.ok(later);assert.equal(later.round, 1);assert.equal(later.attempt, 0);
});

type Packet = { from: number; to: number; n: number; value: number };
function network(seats: number) {
  const callbacks = new Map<number, (seat: number, n: number, value: number) => void>();
  const cache = Array.from({ length: seats }, () => new Map<string, number>());
  const queue: Packet[] = []; let drop: (p: Packet) => boolean = () => false;
  const channel = (mine: number): ParadeChannel => ({ mine, seats, seed: 'cooperative-session',
    send(n, value) { for (let to = 0; to < seats; to++) queue.push({ from: mine, to, n, value }); },
    listen(fn) { callbacks.set(mine, fn);return () => { callbacks.delete(mine); }; },
    async read(n, seat) { return cache[mine].get(`${seat}:${n}`); }
  });
  const flush = (reverse = false) => {
    let count = 0;
    while (queue.length) {
      if (++count > 5000) throw new Error('Message echo loop');
      const p = (reverse ? queue.pop() : queue.shift())!;
      if (drop(p)) continue;
      const key = `${p.from}:${p.n}`;
      if (cache[p.to].has(key)) continue;
      cache[p.to].set(key, p.value);callbacks.get(p.to)?.(p.from, p.n, p.value);
    }
  };
  return { channel, flush, drop(fn: (p: Packet) => boolean) { drop = fn; }, callbacks };
}

test('four-player host commits shared results, rejects forged seats and resynchronizes lost/reordered packets', async () => {
  const hub = network(4);
  const sessions = Array.from({ length: 4 }, (_, mine) => new ParadeSession({ seed: 'cooperative-session', tier: mine === 3 ? 0 : 3, seats: 4, channel: hub.channel(mine), changed() {} }));
  try {
    hub.flush();await Promise.resolve();hub.flush();
    assert.equal(sessions[0].view.state?.round.config.tier, 0, 'youngest child determines shared difficulty');
    const round = sessions[0].view.state!.round;
    assert.equal(sessions[1].submit(2, 0, 0), false, 'cannot control another seat');
    sessions[1].receive(2, 3000, 1);assert.equal(sessions[1].view.state!.stops.length, 0, 'guests cannot forge host commits');
    // Deliberately lose one guest request and one host commit; retry/replay must recover both.
    hub.drop(p => p.from === 0 && p.to === 2 && p.n === 3000 || p.from === 1 && p.to === 0 && p.n === 10);
    for (let seat = 0; seat < 4; seat++) for (let lane = 0; lane < 3; lane++) sessions[seat].submit(seat, lane, tickFor(round, seat, lane));
    hub.flush(true);
    assert.equal(sessions[0].view.state!.outcome, null);
    hub.drop(() => false);sessions[1].resync();sessions[2].resync();hub.flush(true);
    assert.equal(sessions[0].view.state!.outcome?.success, true);
    for (const session of sessions) {
      assert.equal(session.view.state!.stops.length, 12);
      assert.deepEqual(session.view.state!.outcome, sessions[0].view.state!.outcome);
    }
    sessions[0].advance();hub.flush(true);
    for (const session of sessions) assert.equal(session.view.state!.round.round, 1);
    const before = sessions[0].view.state!.stops.length;
    sessions[0].receive(1, 10, 0);assert.equal(sessions[0].view.state!.stops.length, before, 'stale round cannot poison new round');
    assert.equal(sessions[1].advance(), false);
  } finally { sessions.forEach(s => s.dispose()); }
  assert.equal(hub.callbacks.size, 0, 'all listeners released');
});

test('offline continuation preserves accepted stops and completes without a server', () => {
  const session = new ParadeSession({ seed: 'offline-family', tier: 0, seats: 2, changed() {} });
  try {
    const r = session.view.state!.round;session.submit(0, 0, tickFor(r, 0, 0));
    session.continueLocally();assert.equal(session.view.state!.stops.length, 1);
    for (let seat = 0; seat < 2; seat++) for (let lane = 0; lane < 3; lane++) session.submit(seat, lane, tickFor(r, seat, lane));
    assert.equal(session.view.state!.outcome?.success, true);
    session.advance();const next = session.view.state!.round;
    for (let seat = 0; seat < 2; seat++) for (let lane = 0; lane < 3; lane++) session.submit(seat, lane, tickFor(next, seat, lane));
    session.advance();assert.equal(session.view.finished, true);
  } finally { session.dispose(); }
});
