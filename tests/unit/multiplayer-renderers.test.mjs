// Horse source-string assertions were replaced by actual four-seat transport/match tests in horse-session.test.mjs.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const source = name => fs.readFileSync(new URL(`../../js/games/${name}`, import.meta.url), 'utf8');

// Snakes source-string calls replaced by actual four-seat board/recovery tests in snakes-shared.test.mjs.

test('team and board renderers retain offline and online paths', () => {
  const vietnam = source('vietnam.ts');
  assert.match(vietnam, /id: 'oanquan'/);
  assert.match(vietnam, /id: 'tug'/);
  const family=source('familyquiz.ts');assert.match(family,/SharedBoardSession/);assert.match(family,/sayPrivateFamilyLine/);
});