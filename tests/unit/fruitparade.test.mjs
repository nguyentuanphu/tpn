// Pure Fruit Parade rules remain browser-independent for deterministic tests.
import test from 'node:test';
import assert from 'node:assert/strict';
import { createRound, isCorrectOrder, scoreRound } from '../../js/games/fruitparade-core.js';

test('createRound is deterministic and produces a bounded playable round', () => {
  const first = createRound('orchard-7', 2);
  const second = createRound('orchard-7', 2);

  assert.deepEqual(first, second);
  assert.ok(Array.isArray(first.items));
  assert.ok(first.items.length >= 3);
  assert.ok(first.items.length <= 8);
  assert.ok(Array.isArray(first.target));
  assert.equal(first.target.length, first.items.length);
  assert.equal(new Set(first.items).size, first.items.length);
  assert.deepEqual(first.target.slice().sort(), first.items.slice().sort());
});

test('createRound changes the challenge when its seed changes', () => {
  const first = createRound('orchard-7', 2);
  const second = createRound('orchard-8', 2);

  assert.notDeepEqual(first, second);
});

test('isCorrectOrder accepts only an exact target permutation', () => {
  const target = ['apple', 'banana', 'pear'];

  assert.equal(isCorrectOrder(['apple', 'banana', 'pear'], target), true);
  assert.equal(isCorrectOrder(['pear', 'banana', 'apple'], target), false);
  assert.equal(isCorrectOrder(['apple', 'banana'], target), false);
  assert.equal(isCorrectOrder(['apple', 'banana', 'pear', 'pear'], target), false);
});

test('scoreRound rewards correct answers and never rewards an incorrect one', () => {
  assert.equal(scoreRound({ correct: true, attempts: 1, level: 1 }), 3);
  assert.equal(scoreRound({ correct: true, attempts: 2, level: 1 }), 2);
  assert.equal(scoreRound({ correct: true, attempts: 1, level: 3 }), 5);
  assert.equal(scoreRound({ correct: false, attempts: 1, level: 3 }), 0);
});
