// The auto play check's rules (owner, 13 Oct AEDT): which devices see it, what goes back and what stays when progress
// is put back (js/keepcopy.js), and Studio's choice of what goes back.
import test from 'node:test';
import assert from 'node:assert/strict';
import { apGameSeconds, apAllowed, keepRewards, revertOf, KEEP_FIELDS, AP_SPEEDS, AP_RIGHT, AP_GROUPS, AUTOPLAY_PROFILES, childAction, stochasticAutoplayChoice } from '../../js/content/autoplay.js';

test('the window shows only where Studio allows it', () => {
  assert.equal(apAllowed(false, { devices: [] }, 'abc'), false);
  assert.equal(apAllowed(true, {}, 'abc'), true, 'no devices ticked: every device');
  assert.equal(apAllowed(true, { devices: ['abc'] }, 'abc'), true);
  assert.equal(apAllowed(true, { devices: ['xyz'] }, 'abc'), false);
});
test('progress goes back, rewards and grown-up settings stay', () => {
  const old = { id: 'k1', name: 'Na', quests: { a: true }, wins: { memory: 1 }, leafies: {}, stickers: ['s1'], look: { hat: 'bow' }, owned: { hats: ['none'] }, album: [], age: 'little' };
  const now = { id: 'k1', name: 'Na Na', quests: { a: true, b: true, c: true }, wins: { memory: 4, sums: 2 }, leafies: { l1: 1 }, stickers: ['s1', 's2'], look: { hat: 'bug', badge: 'b1' }, owned: { hats: ['none', 'bug'] }, album: ['p1'], age: 'big' };
  const m = keepRewards(old, now);
  assert.deepEqual(m.quests, { a: true }, 'quests go back'); assert.deepEqual(m.wins, { memory: 1 }); assert.deepEqual(m.leafies, {});
  assert.deepEqual(m.stickers, ['s1', 's2'], 'stickers stay'); assert.equal(m.look.badge, 'b1', 'the badge stays'); assert.deepEqual(m.owned.hats, ['none', 'bug'], 'clothes stay');
  assert.deepEqual(m.album, ['p1'], 'the album stays'); assert.equal(m.name, 'Na Na', 'a grown-up\'s change stays'); assert.equal(m.age, 'big');
  assert.ok(KEEP_FIELDS.includes('testerStickers'));
});
test('what goes back is Studio\'s choice; everything since becoming a tester by default', () => {
  assert.equal(revertOf(null), 'progress'); assert.equal(revertOf({}), 'progress'); assert.equal(revertOf({ revert: 'odd' }), 'progress');
  assert.equal(revertOf({ revert: 'autoplay' }), 'autoplay');
});
test('both speeds move like a child; answers are mostly right; quests come first', () => {
  for (const s of Object.values(AP_SPEEDS)) { assert.ok(s.fly >= 40, 'short trips are walked'); assert.ok(s.think[0] > .2 && s.think[1] >= s.think[0], 'a pause before each tap'); }
  assert.ok(AP_RIGHT > .5 && AP_RIGHT < 1, 'mostly right, some wrong');
  assert.equal(AP_GROUPS[0].key, 'quests');
});


test('each device can keep progress or choose a different restore policy', () => {
  const rule = { revert: 'progress', policies: { one: { revert: 'keep' }, two: { revert: 'autoplay' } } };
  assert.equal(revertOf(rule, 'one'), 'keep'); assert.equal(revertOf(rule, 'two'), 'autoplay'); assert.equal(revertOf(rule, 'other'), 'progress');
  for (const rate of [1,2,3,5]) { const s = AP_SPEEDS['x'+rate]; assert.equal(s.rate,rate); assert.equal(s.game,AP_SPEEDS.watch.game, 'fast checking keeps the game timeout'); assert.equal(s.idle,AP_SPEEDS.watch.idle,'fast checking must not invent stuck failures'); }
});

test('legal-plan allowance follows child speed and is bounded without extending random play', () => {
  assert.equal(apGameSeconds(AP_SPEEDS.x1),90);
  assert.equal(apGameSeconds(AP_SPEEDS.x1,0,3),270);
  assert.equal(apGameSeconds(AP_SPEEDS.x1,NaN),90);
  assert.equal(apGameSeconds(AP_SPEEDS.x1,Infinity),90);
  assert.equal(apGameSeconds(AP_SPEEDS.x1,-5),90);
  // Two simple6x6/7x7 mazes have at most35+48 legal shortest-path steps.
  assert.ok(apGameSeconds(AP_SPEEDS.x1,83)>=83*(2.2+.65+.05)+12);
  assert.ok(apGameSeconds(AP_SPEEDS.x1,83)>apGameSeconds(AP_SPEEDS.x2,83));
  assert.equal(apGameSeconds(AP_SPEEDS.x5,83),90);
  assert.equal(apGameSeconds(AP_SPEEDS.x1,1e9),600);
});

test('autoplay profiles support stochastic child behavior and optimal solver', () => {
  assert.deepEqual(AUTOPLAY_PROFILES, ['chaos-toddler', 'gentle-explorer', 'max-competence']);
  
  // Test chaos-toddler / gentle-explorer actions
  const toddlerAction = childAction('chaos-toddler', () => 0.1);
  assert.equal(toddlerAction, 'spam');
  const explorerAction = childAction('gentle-explorer', () => 0.1);
  assert.equal(explorerAction, 'wander');
  const maxAction = childAction('max-competence', () => 0.1);
  assert.equal(maxAction, 'tap');

  // Test stochastic choices and 100% win rate / optimal solver behavior for max-competence
  const choices = [1, 2, 3];
  const score = x => x;
  assert.equal(stochasticAutoplayChoice(choices, 'max-competence', score), 3);
  assert.equal(stochasticAutoplayChoice([], 'max-competence', score), null);

  // 100 consecutive trials of max-competence choice always yield the optimal element (100% optimal selection)
  let optimalWins = 0;
  for (let i = 0; i < 100; i++) {
    if (stochasticAutoplayChoice([10, 50, 30, 20], 'max-competence', x => x) === 50) {
      optimalWins++;
    }
  }
  assert.equal(optimalWins, 100);
});
