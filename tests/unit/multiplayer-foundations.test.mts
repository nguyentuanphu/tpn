import test from 'node:test';
import assert from 'node:assert/strict';
import { MULTIPLAYER_FOUNDATIONS, foundationFor, validMove, nextTurn, applySnakesRoll, resolveTugRound, scoreFamilyQuiz, orderedBoard, validBoardWire } from '../../js/games/multiplayer-foundations.js';

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
  assert.equal(validMove('cacuangua', 25), false);
  assert.equal(validMove('cacuangua', 26), false);
  assert.equal(nextTurn(2, 3), 0);
  assert.equal(nextTurn(0, 0), 0);
  assert.equal(applySnakesRoll(4, 3, 25, { 7: 12 }), 12);
});

test('team round and quiz adapters resolve bounded results', () => {
  assert.equal(resolveTugRound([1, 1, 1, 1, 1]), 1);
  assert.equal(resolveTugRound([0, 0, 0, 0, 0]), 0);
  assert.deepEqual(scoreFamilyQuiz([2, 1, null], 2), [1, 0, 0]);
});

test('Batch A: new games have valid move ranges and metadata', () => {
  // OĂn QuĆ¢n: pit index 0-23
  assert.equal(validMove('oanquan', 0), true);
  assert.equal(validMove('oanquan', 23), true);
  assert.equal(validMove('oanquan', 24), false);
  assert.equal(validMove('oanquan', -1), false);
  assert.equal(MULTIPLAYER_FOUNDATIONS.oanquan.max, 2);
  assert.equal(MULTIPLAYER_FOUNDATIONS.oanquan.all, false);
  assert.equal(MULTIPLAYER_FOUNDATIONS.oanquan.mode, 'turn');

  // Snakes: die roll 1-6
  assert.equal(validMove('snakes', 1), true);
  assert.equal(validMove('snakes', 6), true);
  assert.equal(validMove('snakes', 0), false);
  assert.equal(validMove('snakes', 7), false);
  assert.equal(MULTIPLAYER_FOUNDATIONS.snakes.max, 4);
  assert.equal(MULTIPLAYER_FOUNDATIONS.snakes.all, true);
  assert.equal(MULTIPLAYER_FOUNDATIONS.snakes.mode, 'turn');

  // Tug: pull 0 (left) or 1 (right)
  assert.equal(validMove('tug', 0), true);
  assert.equal(validMove('tug', 1), true);
  assert.equal(validMove('tug', 2), false);
  assert.equal(MULTIPLAYER_FOUNDATIONS.tug.max, 6);
  assert.equal(MULTIPLAYER_FOUNDATIONS.tug.all, true);
  assert.equal(MULTIPLAYER_FOUNDATIONS.tug.mode, 'round');

  // Family Quiz: answer 0-3
  assert.equal(validMove('familyquiz', 0), true);
  assert.equal(validMove('familyquiz', 3), true);
  assert.equal(validMove('familyquiz', 4), false);
  assert.equal(validMove('familyquiz', -1), false);
  assert.equal(MULTIPLAYER_FOUNDATIONS.familyquiz.max, 6);
  assert.equal(MULTIPLAYER_FOUNDATIONS.familyquiz.all, true);
  assert.equal(MULTIPLAYER_FOUNDATIONS.familyquiz.mode, 'turn');

  // Cờ Cá Ngựa: 0 requests a shared roll; 1–4 choose a horse.
  assert.equal(validMove('cacuangua', 0), true);
  assert.equal(validMove('cacuangua', 1), true);
  assert.equal(validMove('cacuangua', 3), true);
  assert.equal(validMove('cacuangua', 4), true);
  assert.equal(validMove('cacuangua', -1), false);
  assert.equal(validMove('cacuangua', 5), false);
  assert.equal(MULTIPLAYER_FOUNDATIONS.cacuangua.max, 4);
  assert.equal(MULTIPLAYER_FOUNDATIONS.cacuangua.all, true);
  assert.equal(MULTIPLAYER_FOUNDATIONS.cacuangua.mode, 'turn');
});


test('all five shared games use board reducers and distinguish command, config, ACK and replay slots',()=>{
 for(const id of['snakes','oanquan','cacuangua','tug','familyquiz']){assert.equal(orderedBoard(id),true);assert.equal(validBoardWire(id,4997,0),true);assert.equal(validBoardWire(id,4997,1),false);assert.equal(validBoardWire(id,4998,0),false);assert.equal(validBoardWire(id,9997,2),false);assert.equal(validBoardWire(id,9999,4998),false);}
 assert.equal(validBoardWire('familyquiz',0,6),true);assert.equal(validBoardWire('familyquiz',0,7),false);assert.equal(validBoardWire('familyquiz',5000,6),true);assert.equal(orderedBoard('caro'),false);
});
