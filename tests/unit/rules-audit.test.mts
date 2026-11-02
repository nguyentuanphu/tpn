// (v1.07 rules audit, docs/rules-audit/) the rule fixes found by the audit, run on each game's own code without a browser
import test from 'node:test';
import assert from 'node:assert/strict';
import {applyMove,initialState,legalMoves} from '../../js/games/cacuangua-core.js';

test('Cờ Cá Ngựa: a horse cannot climb onto a home slot its own horse already holds', () => {
  const s = { ...initialState('full'), dice: [3], pendingMove: true };
  s.players[0].horses[0].pos = 58; // slot 3
  s.players[0].horses[1].pos = 57; // slot 2: a 3 would climb to slot 3
  assert.ok(!legalMoves(s).some(m => m.horse === 1));
  assert.throws(() => applyMove(s, 1, 0));
  s.players[0].horses[0].pos = 59; // slot 3 free again: the climb is legal
  assert.equal(applyMove(s, 1, 0).players[0].horses[1].pos, 58);
});

test('Picture Sudoku: the empty squares always have exactly one way to fill them', async () => {
  const { latin, sudokuHoles, sudokuSolutions } = await import('../../js/games/sudoku-core.js');
  // a 2 x 2 swap left empty (rows 0-1, columns 0-1 of this square) has two answers: the old random holes allowed it
  const sq = [[0, 1, 2, 3], [1, 0, 3, 2], [2, 3, 0, 1], [3, 2, 1, 0]];
  assert.equal(sudokuSolutions(sq, new Set([0, 1, 4, 5])), 2);
  for (const [n, holes] of [[3, 3], [4, 4], [4, 8], [4, 10]]) for (let k = 0; k < 60; k++) {
    const sol = latin(n), empty = sudokuHoles(sol, holes);
    assert.equal(empty.size, holes);
    assert.equal(sudokuSolutions(sol, empty), 1, `${n} x ${n} with ${holes} empty squares`);
  }
});
