// (v1.08b quality, owner's pop-ups 3-4 Nov 2026 AEDT, docs/plans/links-rollout-install.md part 5) the five school
// subjects of the learning report for grown-ups, and the level that follows the child per subject.
// Pure: no page, no saving. The page side is js/report.ts (the report) and js/main.ts (the level a game starts at).
//   profile.stats.days[YYYY-MM-DD].by  = { gameId: times played that day }
//   profile.stats.days[YYYY-MM-DD].won = { gameId: times won that day }
//   profile.subjectDiff = { vi|en|math|sci|money: 'easy'|'medium'|'hard'|'talent' } (a grown-up's choice; wins)
import { CORNER_LINKS } from './hocvui.js';

export type Subject = 'vi' | 'en' | 'math' | 'sci' | 'money';
export type Diff = 'easy' | 'medium' | 'hard' | 'talent';
export const SUBJECTS: { id: Subject, icon: string, en: string, vi: string }[] = [
  { id: 'vi', icon: 'hv:vi', en: 'Vietnamese', vi: 'Tiếng Việt' },
  { id: 'en', icon: 'hv:en', en: 'English', vi: 'Tiếng Anh' },
  { id: 'math', icon: 'hv:math', en: 'Maths', vi: 'Toán' },
  { id: 'sci', icon: 'hv:sci', en: 'Science', vi: 'Khoa học' },
  { id: 'money', icon: '🪙', en: 'Money', vi: 'Tiền' }
];
// a game's subject: the Học vui corner it is linked into first, then its own area; null for games that are play only
// (art, music, travel, folk games)
const AREA: Record<string, Subject> = { hv_vi: 'vi', hv_en: 'en', hv_math: 'math', hv_sci: 'sci', money: 'money', numbers: 'math', shapes: 'math', thinking: 'math', reading: 'en', words: 'vi', vietnam: 'vi', animals: 'sci' };
// the game's own area (js/content/activities.ts GAME_INFO, which needs the page): the page hands it in with useAreas
let areaOf: (id: string) => string | undefined = () => undefined;
export const useAreas = (f: (id: string) => string | undefined) => { areaOf = f; };
export function subjectOf(id: string): Subject | null {
  if (/^(shoppay|givechange|toysave|needsfirst|pricesort|marketday|coinsort|makeamount|budgetpicnic|chores|twomoney)$/.test(id)) return 'money';
  for (const [corner, ids] of Object.entries(CORNER_LINKS)) if (ids.includes(id) && AREA[corner]) return AREA[corner];
  if (/^rd_/.test(id)) return 'en';
  if (/^(mx_|vi_)/.test(id)) return id.startsWith('mx_') ? 'math' : 'vi';
  if (/^sci_/.test(id)) return 'sci';
  const area = areaOf(id);
  return area ? AREA[area] || null : null;
}

type Day = { min?: number, games?: number, by?: Record<string, number>, won?: Record<string, number> };
const dayKeyOf = (d: Date) => `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`;
/** the last seven days (today included, today as 'YYYY-MM-DD') by subject: plays, wins and the games played */
export function weekBySubject(days: Record<string, Day> = {}, today: string) {
  const t = Date.UTC(+today.slice(0, 4), +today.slice(5, 7) - 1, +today.slice(8, 10));
  const out = Object.fromEntries(SUBJECTS.map(s => [s.id, { plays: 0, wins: 0, games: {} as Record<string, number>, won: {} as Record<string, number> }])) as Record<Subject, { plays: number, wins: number, games: Record<string, number>, won: Record<string, number> }>;
  for (let i = 0; i < 7; i++) {
    const d = days[dayKeyOf(new Date(t - i * 864e5))]; if (!d) continue;
    for (const [id, n] of Object.entries(d.by || {})) { const s = subjectOf(id); if (!s) continue; out[s].plays += n; out[s].games[id] = (out[s].games[id] || 0) + n; }
    for (const [id, n] of Object.entries(d.won || {})) { const s = subjectOf(id); if (!s) continue; out[s].wins += n; out[s].won[id] = (out[s].won[id] || 0) + n; }
  }
  return out;
}

const STEP: Diff[] = ['easy', 'medium', 'hard'];
/** how the child is doing in one subject, from the levels reached in its games: 'strong', 'steady' or 'new' */
export function subjectStrength(levels: Record<string, number> = {}, wins: Record<string, number> = {}, subject: Subject): 'strong' | 'steady' | 'new' {
  const ids = Object.keys(wins).filter(id => subjectOf(id) === subject && wins[id] > 0);
  const won = ids.reduce((a, id) => a + wins[id], 0);
  if (won < 3) return 'new';
  const avg = ids.reduce((a, id) => a + (levels[id] || 1), 0) / ids.length;
  return ids.length >= 3 && won >= 8 && avg >= 3 ? 'strong' : 'steady';
}
/** the level a game starts at: the grown-up's choice for this subject wins; otherwise the child's own level, one step
 *  up in a subject the child is strong in and one step down in a subject the child is new to (Talent is only ever a
 *  grown-up's or the child's own choice) */
export function subjectDifficulty(p: { difficulty?: string, subjectDiff?: Record<string, string>, levels?: Record<string, number>, wins?: Record<string, number>, subjectAuto?: boolean }, id: string): Diff {
  const base = (p.difficulty || 'easy') as Diff, s = subjectOf(id);
  if (!s) return base;
  const set = p.subjectDiff?.[s] as Diff | undefined; if (set) return set;
  if (p.subjectAuto === false || base === 'talent') return base;
  const k = subjectStrength(p.levels, p.wins, s), i = STEP.indexOf(base);
  return k === 'strong' ? STEP[Math.min(2, i + 1)] : k === 'new' ? STEP[Math.max(0, i - 1)] : base;
}

/** the learning report: one line per subject (what was practised, what went well) and one game to try next week:
 *  a game of the subject played least this week that the child has not played yet. names: id -> [en, vi] */
export function learningReport(week: ReturnType<typeof weekBySubject>, allIds: string[], playedEver: Record<string, number>, names: (id: string) => [string, string]) {
  const rows = SUBJECTS.map(s => {
    const w = week[s.id], top = Object.entries(w.games).sort((a, b) => b[1] - a[1])[0], best = Object.entries(w.won).sort((a, b) => b[1] - a[1])[0];
    const did: [string, string] = w.plays ? [`${w.plays} games this week${top ? `, most of all ${names(top[0])[0]}` : ''}.`, `${w.plays} lượt chơi tuần này${top ? `, nhiều nhất là ${names(top[0])[1]}` : ''}.`] : ['Not practised this week.', 'Tuần này chưa luyện.'];
    const well: [string, string] | null = best ? [`Went well: won ${names(best[0])[0]} ${best[1]} times.`, `Làm tốt: thắng ${names(best[0])[1]} ${best[1]} lần.`] : null;
    return { ...s, plays: w.plays, wins: w.wins, did, well };
  });
  const least = [...rows].sort((a, b) => a.plays - b.plays);
  let next: { id: string, subject: Subject } | null = null;
  for (const r of least) { const id = allIds.filter(g => subjectOf(g) === r.id).sort().find(g => !playedEver[g]) || allIds.filter(g => subjectOf(g) === r.id).sort((a, b) => (playedEver[a] || 0) - (playedEver[b] || 0))[0]; if (id) { next = { id, subject: r.id }; break; } }
  return { rows, next };
}
