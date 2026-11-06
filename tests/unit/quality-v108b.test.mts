// (v1.08b quality) the learning report by subject, the level by subject, Lumi's words and the gentle play time
// (js/content/subjects.ts, js/content/lumi.ts): pure parts, no page.
import test from 'node:test';
import assert from 'node:assert/strict';
import { subjectOf, weekBySubject, learningReport, subjectDifficulty, subjectStrength, useAreas, SUBJECTS } from '../../js/content/subjects.js';
import { playTimePhase, byeNow, newsOfWeek, weekKey, LUMI_NEWS, LUMI_WELCOME, LUMI_BYE, LUMI_SOON, PLAY_TOGETHER, TOGETHER_GUIDE } from '../../js/content/lumi.js';

// (v1.08 games: one home per game, no corner links) each game's subject comes from its own home in GAME_INFO
// (js/content/activities.ts): counting, sums and numline in numbers, phonics in hv_en, words in hv_vi
useAreas(id => ({ kite: 'play', duckmaze: 'animals', bunny: 'animals', letters: 'words', counting: 'numbers', sums: 'numbers', numline: 'numbers', phonics: 'hv_en', words: 'hv_vi' } as Record<string, string>)[id]);

test('every game has its subject, or none for play', () => {
  assert.deepEqual(['counting', 'mx_bonds', 'rd_trace', 'phonics', 'sci_float', 'shoppay', 'words', 'vi_tones', 'duckmaze', 'kite'].map(subjectOf), ['math', 'math', 'en', 'en', 'sci', 'money', 'vi', 'vi', 'sci', null]);
  assert.deepEqual(SUBJECTS.map(s => s.id), ['vi', 'en', 'math', 'sci', 'money']);
});

test('the week by subject counts only the last seven days', () => {
  const days = { '2026-11-05': { by: { counting: 3, phonics: 1 }, won: { counting: 2 } }, '2026-10-30': { by: { sci_float: 2 } }, '2026-10-29': { by: { counting: 9 } } };
  const w = weekBySubject(days, '2026-11-05');
  assert.equal(w.math.plays, 3); assert.equal(w.math.wins, 2); assert.equal(w.en.plays, 1); assert.equal(w.sci.plays, 2); assert.equal(w.money.plays, 0);
  const r = learningReport(w, ['counting', 'phonics', 'sci_float', 'shoppay', 'coinsort', 'words'], { counting: 3, phonics: 1, sci_float: 2 }, id => [id, id]);
  assert.equal(r.rows.length, 5);
  assert.match(r.rows[2].did[0], /3 games this week, most of all counting/); assert.match(r.rows[2].well[0], /won counting 2 times/);
  assert.match(r.rows[4].did[1], /chưa luyện/);
  assert.ok(r.next && ['vi', 'money'].includes(r.next.subject), 'next week: a game of a subject not practised');
});

test('the level follows the child per subject; a grown-up wins', () => {
  const strong = { counting: 4, sums: 4, numline: 4 };
  const p = { difficulty: 'medium', wins: strong, levels: strong, subjectDiff: {} as Record<string, string> };
  assert.equal(subjectStrength(p.levels, p.wins, 'math'), 'strong'); assert.equal(subjectStrength(p.levels, p.wins, 'en'), 'new');
  assert.equal(subjectDifficulty(p, 'sums'), 'hard'); assert.equal(subjectDifficulty(p, 'phonics'), 'easy'); assert.equal(subjectDifficulty(p, 'kite'), 'medium');
  assert.equal(subjectDifficulty({ ...p, subjectDiff: { math: 'easy' } }, 'sums'), 'easy');
  assert.equal(subjectDifficulty({ ...p, subjectAuto: false }, 'sums'), 'medium');
  assert.equal(subjectDifficulty({ ...p, difficulty: 'talent' }, 'phonics'), 'talent', 'Talent is never moved by itself');
  assert.equal(subjectDifficulty({ ...p, difficulty: 'hard' }, 'sums'), 'hard', 'Auto never goes past Hard');
});

test('the gentle play time: a word two minutes before, the goodbye only after the game in hand', () => {
  assert.deepEqual([playTimePhase(5, 30), playTimePhase(28, 30), playTimePhase(31, 30), playTimePhase(99, 0)], ['play', 'soon', 'bye', 'play']);
  assert.equal(byeNow('bye', true), false); assert.equal(byeNow('bye', false), true); assert.equal(byeNow('soon', false), false);
  assert.deepEqual(LUMI_BYE[1], 'Hôm nay bạn chơi giỏi lắm! Hẹn mai chơi tiếp nhé!'); assert.ok(LUMI_SOON[0] && LUMI_SOON[1]);
});

test('Lumi: the news of the week turns over each week; her words in both languages, no names', () => {
  assert.notDeepEqual(newsOfWeek('2026-11-05'), newsOfWeek('2026-11-12'));
  assert.equal(weekKey('2026-11-05'), weekKey('2026-11-06')); assert.notEqual(weekKey('2026-11-05'), weekKey('2026-11-13'));
  for (const [en, vi] of [...LUMI_WELCOME, ...LUMI_NEWS, LUMI_SOON, LUMI_BYE, ...TOGETHER_GUIDE, ...PLAY_TOGETHER.map(x => x.guide)]) { assert.ok(en && vi && en !== vi); assert.doesNotMatch(en + vi, /\{name\}/); }
  assert.ok(PLAY_TOGETHER.length >= 5);
});
