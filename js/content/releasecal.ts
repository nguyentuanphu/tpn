// (v1.08b story) The release calendar, "Lịch phát hành" (docs/plans/links-rollout-install.md "A slow rollout" and
// "Calendar with start and end dates"). One list, read by the game (items open on their date), the pad's calendar tab,
// Studio's Releases timeline (platform helper), the website's "What's new" strip and Discover calendar, and Saturday's
// "Tuần này có gì mới" push, so all of them always agree (WEBSITE-RULES "same source").
//
// - Every held-back game and story has a week (Release's first fill, js/content/releasecal-items.ts and its names in
//   releasecal-names.ts, made by tools/make-releasecal.mts). The owner moves an item to another week in Studio: the live content section
//   `releaseCalendar` = { moves: { "<kind>:<id>": "YYYY-MM-DD" } } (the Monday of its new week, or any day).
// - An item opens for every child on its day (a tester device 7 days early, as releaseOn does). Games and stories that
//   were already open stay open: only the held-back ones are in the calendar (owner, 3 Nov 2026 AEDT).
// - Unlocking by playing stays: with Studio's New games / New stories on, an area's next items can still open early.
// Pure data and date sums: no DOM and no game state, so Studio and the website import it too.
import { CAL_WEEKS } from './releasecal-items.js';

export type CalKind = 'game' | 'story' | 'chapter' | 'feature' | 'festgame';
export type CalItem = {
  key: string;          // "<kind>:<id>", the same keys as Studio's itemAvailability
  kind: CalKind; id: string;
  en: string; vi: string;
  icon: string;         // a picture drawn by js/art.ts
  date: string;         // the day it opens (YYYY-MM-DD, Sydney); for games and stories the Monday of its week
  end?: string;         // the last day, when it is put away again (festival games)
  moved?: boolean;      // the owner moved it in Studio
};
import { ISO, dayOf, isoDay, weekOf, addDays, daysUntil, CAL_DAYS, inCalendar, openDate, calOpen, type CalMoves } from './releasecal-core.js';
export { dayOf, isoDay, weekOf, addDays, daysUntil, inCalendar, openDate, calOpen, type CalMoves };

// The new things of this round with a fixed day (not moved week by week). Other helpers add theirs in their own block.
export const CAL_FIXED: CalItem[] = [
  // (v1.08b story) the lantern story's next chapters (owner, 3-4 Nov 2026 AEDT: docs/plans/v109-extras.md)
  { key: 'chapter:ch4', kind: 'chapter', id: 'ch4', en: 'Lantern story chapter 4: Christmas and New Year', vi: 'Truyện đèn lồng chương 4: Giáng sinh và Năm mới', icon: '🎄', date: CAL_DAYS['chapter:ch4'] },
  { key: 'chapter:ch5', kind: 'chapter', id: 'ch5', en: 'Lantern story chapter 5: Huế, Đà Nẵng, Melbourne and Uluru', vi: 'Truyện đèn lồng chương 5: Huế, Đà Nẵng, Melbourne và Uluru', icon: '🏯', date: CAL_DAYS['chapter:ch5'] },
  { key: 'chapter:finale', kind: 'chapter', id: 'finale', en: 'Lantern story finale: every lantern home for Tết', vi: 'Truyện đèn lồng phần cuối: mọi đèn lồng về nhà đón Tết', icon: '🧧', date: CAL_DAYS['chapter:finale'] },
];

// the names come with releasecal-names.ts, loaded when a calendar is shown (the start-up download stays small); until
// then an item reads as its id. Studio, the website and the server call loadCalNames() (or useCalNames) first.
let NAMES: Record<string, [string, string, string]> | null = null;
export const calNamesReady = (): boolean => !!NAMES;
export const useCalNames = (n: Record<string, [string, string, string]>): void => { NAMES = n; };
export const loadCalNames = (): Promise<void> => NAMES ? Promise.resolve() : import('./releasecal-names.js').then(m => { NAMES = m.CAL_NAMES; });
const nameOf = (key: string, i: number, fallback: string) => (NAMES && NAMES[key] ? NAMES[key][i] : fallback);
function item(kind: 'game' | 'story', id: string, date: string): CalItem {
  const key = kind + ':' + id;
  return { key, kind, id, date, get en() { return nameOf(key, 0, id); }, get vi() { return nameOf(key, 1, id); }, get icon() { return nameOf(key, 2, kind === 'game' ? '🎮' : '📖'); } } as CalItem;
}
const DEFAULTS: CalItem[] = Object.entries(CAL_WEEKS).flatMap(([date, v]) => { const [g, st] = v.split('|'); return [...g.split(' ').filter(Boolean).map(id => item('game', id, date)), ...(st || '').split(' ').filter(Boolean).map(id => item('story', id, date))]; });
/** Release's first fill, before any move */
export const CAL_DEFAULT: CalItem[] = [...DEFAULTS, ...CAL_FIXED];

/** the calendar with the owner's moves applied (bad dates are ignored), sorted by day */
export function calendar(moves?: CalMoves | null): CalItem[] {
  const m = moves && typeof moves === 'object' ? moves : {};
  return CAL_DEFAULT.map(it => { const d = m[it.key]; return typeof d === 'string' && ISO.test(d) && d !== it.date ? (it.kind === 'game' || it.kind === 'story' ? Object.assign(item(it.kind, it.id, d), { moved: true }) : { ...it, date: d, moved: true }) : it; })
    .sort((a, b) => a.date < b.date ? -1 : a.date > b.date ? 1 : a.key < b.key ? -1 : 1);
}
/** the items whose day is in the week starting on `monday` */
export const itemsInWeek = (list: CalItem[], monday: string): CalItem[] => { const end = addDays(monday, 7); return list.filter(it => it.date >= monday && it.date < end); };
/** this week, next week and what ends soon, as the pad, Grown-ups, the website and the Saturday push show them */
export function whatsNew(list: CalItem[], now: Date = new Date()) {
  const mon = weekOf(now), next = addDays(mon, 7), today = isoDay(now);
  return {
    thisWeek: itemsInWeek(list, mon).filter(it => it.date <= today),
    nextWeek: [...itemsInWeek(list, mon).filter(it => it.date > today), ...itemsInWeek(list, next)],
    endingSoon: list.filter(it => it.end && it.date <= today && it.end >= today && daysUntil(it.end, now) <= 7),
    upcoming: list.filter(it => it.date > today).slice(0, 12)
  };
}
/** a short count line, for the Coming soon tile and the push: "3 new games and 1 new story" */
export function countLine(items: CalItem[]): [string, string] {
  const g = items.filter(i => i.kind === 'game').length, s = items.filter(i => i.kind === 'story').length, c = items.filter(i => i.kind === 'chapter');
  const en: string[] = [], vi: string[] = [];
  if (g) { en.push(`${g} new game${g > 1 ? 's' : ''}`); vi.push(`${g} trò chơi mới`); }
  if (s) { en.push(`${s} new stor${s > 1 ? 'ies' : 'y'}`); vi.push(`${s} truyện mới`); }
  for (const x of c) { en.push(x.en); vi.push(x.vi); }
  return [en.join(' and '), vi.join(' và ')];
}
