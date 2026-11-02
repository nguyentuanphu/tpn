// Games with friends online (js/netgames.js), on a pretend network of 3 devices: invitations, seats, moves, leaving.
import test from 'node:test';
import assert from 'node:assert/strict';
import { createNetGames, onlineDef, rpsWinners } from '../../js/netgames.js';

function room(ids, answer = () => true) {
  const devs = {};
  for (const id of ids) {
    const log = { asks: [], starts: [], ends: [] };
    const net = { ids: () => ids.filter(x => x !== id), send: d => { const out = { ...d, from: id }; for (const to of d.to ? [d.to] : ids.filter(x => x !== id)) queueMicrotask(() => devs[to].g.receive(out)); } };
    const g = createNetGames({ net, me: () => id, waitMs: 50, onAsk: d => { log.asks.push(d); g.answer(d, answer(id, d)); }, onStart: s => log.starts.push(s), onEnd: who => log.ends.push(who) });
    devs[id] = { g, log };
  }
  return devs;
}
const tick = (ms = 5) => new Promise(r => setTimeout(r, ms));

test('Caro: one friend is asked, says yes, both get the same seats', async () => {
  const d = room(['A', 'B', 'C']);
  d.A.g.invite('caro', 2, 'B'); await tick();
  assert.equal(d.B.log.asks.length, 1); assert.equal(d.C.log.asks.length, 0);
  const sa = d.A.g.session, sb = d.B.g.session;
  assert.deepEqual(sa.seats, ['A', 'B']); assert.deepEqual(sb.seats, ['A', 'B']); assert.equal(sa.mine, 0); assert.equal(sb.mine, 1); assert.equal(sb.level, 2);
  assert.equal(d.C.g.session, null);
});
test('Caro: moves arrive in order on the other device', async () => {
  const d = room(['A', 'B']);
  d.A.g.invite('caro', 1, 'B'); await tick();
  d.A.g.move(0, 4); assert.equal(await d.B.g.next(0, 0), 4);
  const wait = d.A.g.next(1, 1); d.B.g.move(1, 7); assert.equal(await wait, 7);
});
test('Oẳn tù tì: everyone is asked; those who say no are left out; all hands are shown together', async () => {
  const d = room(['A', 'B', 'C', 'D'], id => id !== 'C');
  d.A.g.invite('oantuti', 1); await tick(80);
  assert.deepEqual(d.A.g.session.seats, ['A', 'B', 'D']); assert.equal(d.C.g.session, null);
  d.A.g.move(0, 0); d.B.g.move(0, 1); d.D.g.move(0, 1);
  const hands = await d.A.g.all(0); assert.deepEqual(hands, [0, 1, 1]); assert.deepEqual(rpsWinners(hands), [1, 2]);
});
test('a player who leaves ends their waits with null, and the others are told', async () => {
  const d = room(['A', 'B']);
  d.A.g.invite('caro', 1, 'B'); await tick();
  const wait = d.A.g.next(0, 1); d.B.g.leave(); assert.equal(await wait, null); assert.deepEqual(d.A.log.ends, ['B']);
});
test('nobody says yes: the inviter is told, no game starts', async () => {
  const d = room(['A', 'B'], () => false);
  d.A.g.invite('caro', 1, 'B'); await tick();
  assert.equal(d.A.g.session, null); assert.equal(d.A.log.starts[0], null);
});
test('moves from someone not in the game, or for another game, are ignored', async () => {
  const d = room(['A', 'B', 'C']);
  d.A.g.invite('caro', 1, 'B'); await tick();
  d.A.g.receive({ t: 'gmove', gid: d.A.g.session.gid, n: 0, mv: 3, from: 'C' }); d.A.g.receive({ t: 'gmove', gid: 'other', n: 0, mv: 5, from: 'B' });
  assert.equal(d.A.g.session.moves.size, 0);
});
test('rpsWinners: rock, paper, scissors for any number of hands', () => {
  assert.deepEqual(rpsWinners([0, 0]), []); assert.deepEqual(rpsWinners([0, 1, 2]), []);
  assert.deepEqual(rpsWinners([0, 1]), [1]); assert.deepEqual(rpsWinners([1, 2]), [1]); assert.deepEqual(rpsWinners([2, 0]), [1]);
  assert.deepEqual(rpsWinners([2, null, 1]), [0]);
});
test('(round R privacy) a game opens only after this child said yes to the one who asked', async () => {
  const d = room(['A', 'B', 'C'], id => id !== 'C');
  d.B.g.receive({ t: 'gstart', gid: 'zzz', game: 'caro', level: 1, seats: ['B', 'C'], from: 'B' }); // (nobody asked C)
  d.C.g.receive({ t: 'gstart', gid: 'zzz', game: 'caro', level: 1, seats: ['B', 'C'], from: 'B' });
  assert.equal(d.C.g.session, null);
  d.A.g.invite('caro', 1, 'C'); await tick(); // C says no
  assert.equal(d.C.g.session, null);
  d.A.g.invite('caro', 1, 'B'); await tick(); // B says yes; a gstart for that game from someone else is still ignored
  assert.equal(d.B.g.session.seats.join(), 'A,B');
});
test('Caro (r63): the board size the inviter chose reaches every device, and a size out of range is dropped', async () => {
  const d = room(['A', 'B']);
  d.A.g.invite('caro', 3, 'B', { size: 15 }); await tick();
  assert.equal(d.B.log.asks[0].size, 15); assert.equal(d.A.g.session.size, 15); assert.equal(d.B.g.session.size, 15);
  const e = room(['A', 'B']);
  e.A.g.invite('caro', 3, 'B', { size: 40 }); await tick();
  assert.equal(e.A.g.session.size, undefined); assert.equal(e.B.g.session.size, undefined);
});

// (Round V, owner 13 Oct) Tiến Lên miền Bắc: follow the suit
test('Tiến Lên miền Bắc: same suit for singles and runs, same colours for pairs, only four of a kind cuts a 2', async () => {
  const TL = await import('../../js/games/tienlenrules.js');
  const c = (r, s) => ({ r, s, v: r * 4 + s }), { classify, beats, setNorth } = TL;
  setNorth(true);
  try {
    assert.ok(beats(classify([c(5, 3)]), classify([c(4, 3)])), 'a higher heart beats a heart');
    assert.ok(!beats(classify([c(5, 0)]), classify([c(4, 3)])), 'a spade does not beat a heart');
    assert.ok(beats(classify([c(12, 0)]), classify([c(11, 3)])), 'a 2 beats any other single');
    assert.equal(classify([c(2, 0), c(3, 1), c(4, 0)]), null, 'a mixed-suit run is not a play');
    assert.ok(classify([c(2, 1), c(3, 1), c(4, 1)]), 'a one-suit run is a play');
    assert.ok(beats(classify([c(6, 2), c(6, 3)]), classify([c(5, 2), c(5, 3)])), 'red pair beats red pair');
    assert.ok(!beats(classify([c(6, 0), c(6, 3)]), classify([c(5, 2), c(5, 3)])), 'mixed pair does not beat a red pair');
    assert.ok(beats(classify([c(3, 0), c(3, 1), c(3, 2), c(3, 3)]), classify([c(12, 3)])), 'four of a kind cuts a 2');
    assert.equal(classify([c(2, 0), c(2, 1), c(3, 0), c(3, 1), c(4, 0), c(4, 1)]), null, 'no pairs in a row in the north');
  } finally { setNorth(false); }
  assert.ok(beats(classify([c(5, 0)]), classify([c(4, 3)])), 'miền Nam: any higher card');
});


test('Snakes metadata invites four seats and transport rejects client-selected dice/reserved-slot payloads', async () => {
  const def = onlineDef('snakes');
  assert.equal(def.max, 4);assert.equal(def.all,true);assert.equal(def.foundation.turnBased, true);
  const d = room(['A', 'B']);d.A.g.invite('snakes', 1, 'B');await tick();
  assert.equal(d.A.g.move(0,7),false);assert.equal(d.A.g.move(0,3),false);
  assert.equal(d.A.g.move(4998,0),false);assert.equal(d.A.g.move(9997,2),false);assert.equal(d.A.g.move(9999,9999),false);
  assert.equal(d.A.g.session.moves.size,0);
  assert.equal(d.A.g.move(0,0),true);await tick();assert.equal(await d.B.g.next(0,0),0);
});

test('Tug transport accepts pull requests and rejects forged strengths or malformed reserved slots',async()=>{
 const d=room(['A','B']);d.A.g.invite('tug',1);await tick();
 assert.equal(d.A.g.move(0,2),false);assert.equal(d.A.g.move(0,0),false);assert.equal(d.A.g.move(4997,1),false);
 assert.equal(d.A.g.move(0,1),true);await tick();assert.equal(await d.B.g.next(0,0),1);
});
