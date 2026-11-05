// (v1.08b story) the release calendar (js/content/releasecal.ts) and Saturday's push written from it (netlify/lib/push.mts)
import test from 'node:test';
import assert from 'node:assert/strict';
import { CAL_DEFAULT, calendar, whatsNew, countLine, weekOf, openDate } from '../../js/content/releasecal.js';
import { calendarNews } from '../../netlify/lib/push.mts';

test('weeks start on Monday and every game and story opens on one', () => {
  assert.equal(weekOf('2026-11-19'), '2026-11-16'); assert.equal(weekOf('2026-11-16'), '2026-11-16'); assert.equal(weekOf('2026-11-22'), '2026-11-16');
  for (const it of CAL_DEFAULT) if (it.kind === 'game' || it.kind === 'story') assert.equal(weekOf(it.date), it.date, it.key);
});
test('the owner moves an item to another week', () => {
  const l = calendar({ 'game:crabwalk': '2027-01-04' }); assert.equal(l.find(i => i.key === 'game:crabwalk')!.date, '2027-01-04');
  assert.equal(openDate('game:crabwalk', { 'game:crabwalk': 'x' }), CAL_DEFAULT.find(i => i.key === 'game:crabwalk')!.date);
});
test('what is new this week and the count line', () => {
  const W = whatsNew(CAL_DEFAULT, new Date('2026-11-18T12:00:00'));
  assert.ok(W.thisWeek.length >= 4 && W.thisWeek.every(i => i.date === '2026-11-16'));
  assert.match(countLine(W.thisWeek)[0], /^\d new games? and \d new stor(y|ies)$/); assert.match(countLine(W.thisWeek)[1], /trò chơi mới và \d truyện mới/);
});
test('Saturday push text from the calendar, with the owner\'s moves', () => {
  const n = calendarNews(null, '2026-11-21')!; assert.ok(n && /New in Sparkle Valley this week/.test(n.en) && /Tuần này có gì mới/.test(n.vi), JSON.stringify(n));
  assert.equal(calendarNews(null, '2026-11-07'), null, 'nothing opened yet');
  const moved = calendarNews({ content: { releaseCalendar: { moves: { 'game:crabwalk': '2026-11-02' } } } }, '2026-11-07')!;
  assert.match(moved.en, /1 new game, like Crab Walk/);
});
