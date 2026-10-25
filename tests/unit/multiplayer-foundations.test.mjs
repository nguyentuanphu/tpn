import test from 'node:test';
import assert from 'node:assert/strict';
import { MULTIPLAYER_FOUNDATIONS, foundationFor, validMove, nextTurn, applySnakesRoll, resolveTugRound, scoreFamilyQuiz } from '../../js/games/multiplayer-foundations.js';

test('adapter metadata declares bounded cooperative/turn-based roster semantics', () => {
  assert.equal(MULTIPLAYER_FOUNDATIONS.oanquan.max, 2);
  assert.equal(MULTIPLAYER_FOUNDATIONS.oanquan.mode, 'turn');
  assert.equal(MULTIPLAYER_FOUNDATIONS.snakes.max, 4);
  assert.equal(MULTIPLAYER_FOUNDATIONS.tug.all, true);
  assert.equal(foundationFor('missing'), null);
});

test('move validators and turn helpers are deterministic', () => {
  assert.equal(validMove('snakes', 6), true);
  assert.equal(validMove('snakes', 7), false);
  assert.equal(nextTurn(2, 3), 0);
  assert.equal(nextTurn(0, 0), 0);
  assert.equal(applySnakesRoll(4, 3, 25, { 7: 12 }), 12);
});

test('team round and quiz adapters resolve bounded results', () => {
  assert.equal(resolveTugRound([1, 1, 1, 1, 1]), 1);
  assert.equal(resolveTugRound([0, 0, 0, 0, 0]), 0);
  assert.deepEqual(scoreFamilyQuiz([2, 1, null], 2), [1, 0, 0]);
});
