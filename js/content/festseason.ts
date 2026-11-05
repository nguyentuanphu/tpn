// (v1.08b games, owner's plan 3 Nov 2026 AEDT: festival games) when a festival's own game is open. Light on purpose (no
// 3D): js/content/activities.ts asks it for every game it lists. A festival game opens with the decorations (3 weeks
// before a party, 3 days before a quiet day, or the build-up a grown-up set in Sparkle Studio), stays open until 3 days
// after the festival, and is put away until next year; testers (the device accepted as a tester) see it 7 days earlier.
// A date a grown-up moved in Sparkle Studio is followed, as the calendar does (js/festivals.ts festDate).
import { FESTCAL, BUILDUP } from './festcal.js';
import { FEST_OF_GAME } from './festgame-ids.js'; // (v1.08d valley) the map only, not the questions
import { lunarDay, easter, nthWeekday } from '../lunar.js';
import { festivalRule } from '../custom.js';

const DAY = 864e5, AFTER = 3, TESTER_EARLY = 7;
const pad = (n: number) => String(n).padStart(2, '0');
const parse = (s: string | null) => { if (!s) return null; const d = new Date(s + 'T00:00:00'); return Number.isNaN(+d) ? null : d; };
function startIn(F, year: number): Date | null {
  const r = festivalRule(F.id) as { date?: string } | undefined;
  if (r && typeof r.date === 'string') { if (/^\d{4}-\d\d-\d\d$/.test(r.date)) { if (+r.date.slice(0, 4) === year) return parse(r.date); } else if (/^\d\d-\d\d$/.test(r.date)) return parse(`${year}-${r.date}`); }
  const w = F.when;
  if (w.lunar) return parse(lunarDay(w.lunar[0], w.lunar[1], year));
  if (w.date) return parse(`${year}-${pad(w.date[0])}-${pad(w.date[1])}`);
  if (w.easter != null) { const d = parse(easter(year)); return d && new Date(+d + w.easter * DAY); }
  if (w.nth) return parse(nthWeekday(year, w.nth[0], w.nth[1], w.nth[2]));
  if (w.table) return parse(w.table[year] || null);
  return null;
}
const tester = () => { try { const a = JSON.parse(localStorage.getItem('sv2_tester') || 'null'); return !!(a && a.at && !a.stopped); } catch { return false; } };
const buildup = F => { const r = festivalRule(F.id) as { buildup?: number } | undefined; return r && r.buildup >= 0 ? Math.min(60, r.buildup) : BUILDUP[F.kind] || 3; };
/** the season of a festival around a date: { open, close, day } (the open day, the day it is put away, the festival day) */
export function seasonOf(festId: string, now = new Date()) {
  const F = FESTCAL.find(x => x.id === festId); if (!F) return null;
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()), early = buildup(F) + (tester() ? TESTER_EARLY : 0);
  for (const y of [today.getFullYear() - 1, today.getFullYear(), today.getFullYear() + 1]) {
    const day = startIn(F, y); if (!day) continue;
    const open = new Date(+day - early * DAY), close = new Date(+day + ((F.days || 1) + AFTER) * DAY);
    if (close > today) return { open, close, day, on: open <= today };
  }
  return null;
}
/** is this festival game open today? (a game that is not a festival game is always in season) */
export const inSeason = (gameId: string, now = new Date()) => { const f = FEST_OF_GAME[gameId]; if (!f) return true; const s = seasonOf(f, now); return !!(s && s.on); };
/** when a put-away festival game comes back: the day it opens again (for the calendar's "Sẽ quay lại vào …"), or null */
export const backOn = (gameId: string, now = new Date()) => { const f = FEST_OF_GAME[gameId]; const s = f && seasonOf(f, now); return s && !s.on ? s.open : null; };
