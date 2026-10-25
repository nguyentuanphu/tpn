import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const source = name => fs.readFileSync(new URL(`../../js/games/${name}`, import.meta.url), 'utf8');

test('turn-based multiplayer renderers use authoritative online turns', () => {
  const snakes = source('asia.ts');
  const horses = source('cacuangua.ts');
  assert.match(snakes, /online\.move\(roundNo/);
  assert.match(snakes, /online\.next\(roundNo/);
  assert.match(horses, /online\.onMove/);
  assert.match(horses, /state\.turn !== online\.mine/);
});

test('team and board renderers retain offline and online paths', () => {
  const vietnam = source('vietnam.ts');
  const quiz = source('more.ts');
  assert.match(vietnam, /id: 'oanquan'/);
  assert.match(vietnam, /id: 'tug'/);
  assert.match(quiz, /if \(online\)/);
  assert.match(quiz, /untilRight/);
});