// Horse source-string assertions were replaced by actual four-seat transport/match tests in horse-session.test.mjs.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const source = name => fs.readFileSync(new URL(`../../js/games/${name}`, import.meta.url), 'utf8');

test('legacy Snakes plumbing retains its online calls while board repair proceeds', () => {
  const snakes = source('asia.ts');
  assert.match(snakes, /online\.move\(roundNo/);
  assert.match(snakes, /online\.next\(roundNo/);
});

test('team and board renderers retain offline and online paths', () => {
  const vietnam = source('vietnam.ts');
  const quiz = source('more.ts');
  assert.match(vietnam, /id: 'oanquan'/);
  assert.match(vietnam, /id: 'tug'/);
  assert.match(quiz, /if \(online\)/);
  assert.match(quiz, /untilRight/);
});