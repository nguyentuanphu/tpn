import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const read = name => fs.readFileSync(new URL(`../../js/games/${name}`, import.meta.url), 'utf8');

test('turn-based multiplayer renderers use authoritative online turns', () => {
  const snakes = read('asia.ts');
  const horses = read('cacuangua.ts');
  assert.match(snakes, /online\.move\(roundNo/);
  assert.match(snakes, /online\.next\(roundNo/);
  assert.match(horses, /online\.onMove/);
  assert.match(horses, /state\.turn !== online\.mine/);
});

test('team and board renderers retain offline and online paths', () => {
  const vietnam = read('vietnam.ts');
  const quiz = read('more.ts');
  assert.match(vietnam, /id: 'oanquan'/);
  assert.match(vietnam, /id: 'tug'/);
  assert.match(quiz, /if \(online\)/);
  assert.match(quiz, /untilRight/);
});