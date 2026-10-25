import test from 'node:test';
import assert from 'node:assert/strict';
import { MULTIPLAYER_UPGRADES, createGameState, getNextTurn } from '../../js/games/multiplayer-foundations.js';

test('multiplayer upgrades metadata is properly structured', () => {
  assert.equal(MULTIPLAYER_UPGRADES.oanquan.max, 2);
  assert.equal(MULTIPLAYER_UPGRADES.snakes.max, 4);
  assert.equal(MULTIPLAYER_UPGRADES.tug.max, 6);
  assert.equal(MULTIPLAYER_UPGRADES.familyquiz.max, 6);
});

test('createGameState initializes with basic multiplayer fields', () => {
  const state = createGameState('oanquan');
  assert.equal(state.type, 'oanquan');
  assert.ok(state.seed);
});

test('getNextTurn cycles through players correctly', () => {
  assert.equal(getNextTurn(0, 3), 1);
  assert.equal(getNextTurn(2, 3), 0);
});
