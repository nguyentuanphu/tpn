import test from 'node:test';
import assert from 'node:assert/strict';
import { applyMove, initialState, isGameOver, legalMoves, npcChooseMove, rollDice, serialize } from '../../js/games/cacuangua-core.js';

test('initial state is deterministic and mode controls horse count', () => {
  assert.deepEqual(initialState('beginner', 2, 'x'), initialState('beginner', 2, 'x'));
  assert.equal(initialState('beginner').players[0].horses.length, 2);
  assert.equal(initialState('full').players[0].horses.length, 4);
});

test('fixed dice make legal moves deterministic without mutating state', () => {
  const state = initialState('beginner', 2, 'x');
  const before = serialize(state);
  const dice = rollDice(state, [4]);
  assert.deepEqual(dice, [4]);
  assert.equal(serialize(state), before);
  assert.equal(legalMoves({ ...state, dice: [4] }).length, 2);
});

test('beginner move consumes the die and advances turn', () => {
  const state = { ...initialState('beginner', 2), dice: [4], pendingMove: true };
  const next = applyMove(state, 0, 0);
  assert.equal(next.players[0].horses[0].pos, 0);
  assert.equal(next.turn, 1);
  assert.equal(state.players[0].horses[0].pos, -1);
});

test('full mode requires six to leave stable and captures on unsafe landing', () => {
  const state = initialState('full', 2);
  state.dice = [5];
  assert.equal(legalMoves(state).length, 0);
  state.dice = [1]; state.pendingMove = true; state.turn = 0;
  state.players[0].horses[0].pos = 13;
  state.players[1].horses[0].pos = 1;
  const captured = applyMove(state, 0, 0);
  assert.equal(captured.players[1].horses[0].pos, -1);
});

test('NPC choices are deterministic and legal for every difficulty', () => {
  const state = { ...initialState('full', 2, 'npc'), dice: [3, 6], pendingMove: true };
  for (const difficulty of ['easy', 'standard', 'hard']) {
    const move = npcChooseMove(state, difficulty);
    assert.ok(legalMoves(state).some(candidate => candidate.horse === move.horse && candidate.dieIndex === move.dieIndex));
    assert.deepEqual(move, npcChooseMove(state, difficulty));
  }
});

test('winner is reported after all beginner horses finish', () => {
  const state = initialState('beginner', 2);
  state.dice = [1]; state.pendingMove = true; state.turn = 0;
  state.players[0].horses[0].pos = 57;
  state.players[0].horses[1].pos = 57;
  let next = applyMove(state, 0, 0);
  next.dice = [1]; next.pendingMove = true; next.turn = 0;
  next = applyMove(next, 1, 0);
  assert.equal(isGameOver(next), true);
  assert.equal(next.winner, next.players[0].color);
});
