// Push notifications for grown-ups (v1.08 notifications, owner plan docs/plans/push-notifications.md, 2 Nov 2026 AEDT).
// The pure rules, shared by the game (Grown-ups, js/notify.ts), the server (netlify/lib/push.mts) and the checks:
//   · the 12 kinds, their defaults and when each goes out, in the family's own time zone;
//   · quiet hours (20:00 to 8:00 and school hours, Monday to Friday 9:00 to 15:00; a grown-up can change them);
//   · bundling: one Saturday message (new content + game of the week, with a festival or event of the coming week in
//     front of it, and the everyday-life tip twice a month), one Sunday message (summary + balance tip + achievement);
//   · the texts that are the same for every family, in English and Vietnamese.
// Notifications are for grown-ups, never for the child: no "you have not played", no streaks, no child's name. The
// server knows only the kinds a grown-up chose; everything about the child is written on the device (cache "sv-notify")
// and read by the service worker when a push arrives (sw.ts).
import { FESTCAL } from './festcal.js';
import { lunarDay, nthWeekday } from '../lunar.js';

export type KindId = 'festival' | 'event' | 'new' | 'gotw' | 'weekly' | 'balance' | 'achieve' | 'word' | 'bedtime' | 'life' | 'invite' | 'tester';
export type Kind = { id: KindId, n: number, en: string, vi: string, hintEn: string, hintVi: string, def: boolean, testers?: boolean };
// the order is the plan's table (n = its number)
export const KINDS: Kind[] = [
  { id: 'festival', n: 1, en: 'Vietnamese festivals', vi: 'Lễ hội Việt Nam', hintEn: 'Tết, Rằm tháng Giêng, Giỗ Tổ, Đoan Ngọ, Trung Thu: the morning before', hintVi: 'Tết, Rằm tháng Giêng, Giỗ Tổ, Đoan Ngọ, Trung Thu: sáng hôm trước', def: true },
  { id: 'event', n: 2, en: 'Events in Australia', vi: 'Sự kiện ở Úc', hintEn: 'Lunar New Year, Harmony Day, Book Week, Mother’s Day, Father’s Day: the Saturday before', hintVi: 'Tết ở Sydney, Ngày Hòa hợp, Tuần lễ Sách, Ngày của Mẹ, Ngày của Bố: thứ Bảy trước đó', def: true },
  { id: 'new', n: 3, en: 'New games and stories', vi: 'Trò chơi và truyện mới', hintEn: 'Once a week, Saturday 9:30', hintVi: 'Mỗi tuần một lần, thứ Bảy 9:30', def: true },
  { id: 'gotw', n: 4, en: 'Game of the week', vi: 'Trò chơi của tuần', hintEn: 'For your child’s age, with the Saturday message', hintVi: 'Hợp với tuổi của bé, đi cùng tin thứ Bảy', def: true },
  { id: 'weekly', n: 5, en: 'Weekly summary', vi: 'Tóm tắt tuần', hintEn: 'Minutes, words and games: Sunday 18:00', hintVi: 'Số phút, số từ, số trò: Chủ nhật 18:00', def: true },
  { id: 'balance', n: 6, en: 'Skill balance tip', vi: 'Gợi ý cân bằng kỹ năng', hintEn: 'With the Sunday summary', hintVi: 'Đi cùng tóm tắt Chủ nhật', def: true },
  { id: 'achieve', n: 7, en: 'Level ups and achievements', vi: 'Lên cấp và thành tích', hintEn: 'In the Sunday summary', hintVi: 'Trong tóm tắt Chủ nhật', def: false },
  { id: 'word', n: 8, en: 'Word of the week', vi: 'Từ của tuần', hintEn: 'English and Vietnamese, Monday morning', hintVi: 'Tiếng Anh và tiếng Việt, sáng thứ Hai', def: false },
  { id: 'bedtime', n: 9, en: 'Bedtime story', vi: 'Truyện trước giờ ngủ', hintEn: '19:00 on the days you pick (up to 2)', hintVi: '19:00 vào ngày bạn chọn (tối đa 2)', def: false },
  { id: 'life', n: 10, en: 'Everyday life ideas', vi: 'Gợi ý đời thường', hintEn: 'Rainy weekends, holidays, calling grandparents: twice a month', hintVi: 'Cuối tuần mưa, ngày nghỉ, gọi ông bà: hai lần mỗi tháng', def: false },
  { id: 'invite', n: 11, en: 'Play invites from friends', vi: 'Lời mời chơi từ bạn bè', hintEn: 'Only for a real invite, outside quiet hours', hintVi: 'Chỉ khi có lời mời thật, ngoài giờ yên lặng', def: true },
  { id: 'tester', n: 12, en: 'Testers: a problem you reported is fixed', vi: 'Người thử: lỗi bạn báo đã được sửa', hintEn: 'At most once a day, 18:00', hintVi: 'Tối đa mỗi ngày một lần, 18:00', def: true, testers: true },
];
export const KIND_IDS = KINDS.map(k => k.id);
// Studio's switch for each kind (js/content/releases.ts, group "notify")
export const studioSwitch = (k: KindId) => 'push_' + k;

// ---------- the grown-up's choices (kept on the device and, once turned on, on the server with the push address) ----------
export type Quiet = { from: number, to: number, school: boolean };   // minutes after midnight; night from → to (over midnight)
export type Prefs = { kinds: Record<string, boolean>, quiet: Quiet, bedDays: number[], tz: string, lang: 'en' | 'vi', tester?: string };
export const QUIET_DEFAULT: Quiet = { from: 20 * 60, to: 8 * 60, school: true };
export const SCHOOL = { from: 9 * 60, to: 15 * 60 };
export const BED_DAYS_MAX = 2;
const TZ_RE = /^[A-Za-z_]+(?:\/[A-Za-z0-9_+-]+){0,2}$/;
export const validTZ = (tz: unknown): tz is string => { if (typeof tz !== 'string' || !TZ_RE.test(tz) || tz.length > 40) return false; try { new Intl.DateTimeFormat('en', { timeZone: tz }); return true; } catch { return false; } };
const minute = (v: unknown, d: number) => Number.isInteger(+v) && +v >= 0 && +v < 1440 && v !== '' && v !== null ? +v : d;
/** every value checked again: unknown kinds dropped, defaults filled in (testers only get kind 12 when they are testers) */
export function cleanPrefs(p: Partial<Prefs> | null | undefined): Prefs {
  const src = (p && typeof p === 'object' ? p : {}) as Partial<Prefs>, kinds: Record<string, boolean> = {};
  const tester = typeof src.tester === 'string' && /^[a-z0-9]{12}$/.test(src.tester) ? src.tester : undefined;
  for (const k of KINDS) { const v = src.kinds && src.kinds[k.id]; kinds[k.id] = k.testers && !tester ? false : typeof v === 'boolean' ? v : k.def; }
  const q = (src.quiet && typeof src.quiet === 'object' ? src.quiet : {}) as Partial<Quiet>;
  const bed = Array.isArray(src.bedDays) ? [...new Set(src.bedDays.filter(d => Number.isInteger(d) && d >= 0 && d <= 6))].slice(0, BED_DAYS_MAX) : [5, 6];
  const out: Prefs = { kinds, quiet: { from: minute(q.from, QUIET_DEFAULT.from), to: minute(q.to, QUIET_DEFAULT.to), school: typeof q.school === 'boolean' ? q.school : true },
    bedDays: bed, tz: validTZ(src.tz) ? src.tz : 'Australia/Sydney', lang: src.lang === 'vi' ? 'vi' : 'en' };
  if (tester) out.tester = tester;
  return out;
}

// ---------- time in the family's own time zone ----------
export type Local = { date: string, wd: number, min: number, y: number, m: number, d: number };
const WD: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
const fmts = new Map<string, Intl.DateTimeFormat>();
export function localOf(ms: number, tz: string): Local {
  let f = fmts.get(tz);
  if (!f) { f = new Intl.DateTimeFormat('en-US', { timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit', weekday: 'short', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }); fmts.set(tz, f); }
  const p: Record<string, string> = {}; for (const x of f.formatToParts(new Date(ms))) p[x.type] = x.value;
  const y = +p.year, m = +p.month, d = +p.day;
  return { date: `${p.year}-${p.month}-${p.day}`, wd: WD[p.weekday], min: (+p.hour % 24) * 60 + +p.minute, y, m, d };
}
/** a plain date moved by n days (YYYY-MM-DD, no time zone) */
export const addDays = (date: string, n: number) => new Date(Date.UTC(+date.slice(0, 4), +date.slice(5, 7) - 1, +date.slice(8, 10)) + n * 864e5).toISOString().slice(0, 10);
const dayNo = (date: string) => Math.round(Date.UTC(+date.slice(0, 4), +date.slice(5, 7) - 1, +date.slice(8, 10)) / 864e5);
/** quiet now? the night (over midnight when from > to) and, when on, school hours on weekdays */
export function isQuiet(l: Pick<Local, 'wd' | 'min'>, q: Quiet = QUIET_DEFAULT): boolean {
  const night = q.from === q.to ? false : q.from > q.to ? (l.min >= q.from || l.min < q.to) : (l.min >= q.from && l.min < q.to);
  const school = q.school && l.wd >= 1 && l.wd <= 5 && l.min >= SCHOOL.from && l.min < SCHOOL.to;
  return night || school;
}

// ---------- festivals and Australian events (kinds 1 and 2) ----------
export const VN_FESTIVALS = ['tet', 'ramthang1', 'giotohung', 'doanngo', 'midautumn'];
type Dated = { id: string, en: string, vi: string, date: string };
const FEST = new Map(FESTCAL.map(f => [f.id, f]));
const pad2 = (n: number) => String(n).padStart(2, '0');
/** the Vietnamese festivals of a year, on their real (lunar) dates */
export function vnFestivals(year: number): Dated[] {
  return VN_FESTIVALS.map(id => { const F = FEST.get(id), w = F && F.when; const date = w && w.lunar ? lunarDay(w.lunar[0], w.lunar[1], year) : null; return F && date ? { id, en: F.en, vi: F.vi, date } : null; }).filter(Boolean);
}
/** the Australian events of a year: Lunar New Year in Sydney (the weekend of Tết), Harmony Day (21 March), Book Week
 * (CBCA, the week from the third Saturday of August, assumed), Mother's Day (2nd Sunday of May), Father's Day (1st Sunday of September) */
export function auEvents(year: number): Dated[] {
  const tet = lunarDay(1, 1, year), out: Dated[] = [];
  if (tet) out.push({ id: 'lunarsydney', en: 'Lunar New Year in Sydney', vi: 'Tết Nguyên Đán ở Sydney', date: tet });
  out.push({ id: 'harmony', en: 'Harmony Day', vi: 'Ngày Hòa hợp', date: `${year}-03-21` });
  out.push({ id: 'bookweek', en: 'Book Week', vi: 'Tuần lễ Sách thiếu nhi', date: nthWeekday(year, 8, 6, 3) });
  out.push({ id: 'mothersday', en: 'Mother’s Day', vi: 'Ngày của Mẹ', date: nthWeekday(year, 5, 0, 2) });
  out.push({ id: 'fathersday', en: 'Father’s Day', vi: 'Ngày của Bố', date: nthWeekday(year, 9, 0, 1) });
  return out.sort((a, b) => a.date < b.date ? -1 : 1);
}
const datedBetween = (list: (y: number) => Dated[], from: string, to: string) => [+from.slice(0, 4), +to.slice(0, 4)].filter((y, i, a) => a.indexOf(y) === i).flatMap(list).filter(x => x.date >= from && x.date <= to);

// ---------- the texts that are the same for every family ----------
export type Text = { en: string, vi: string };
export const WORDS: [string, string][] = [['rain', 'mưa'], ['moon', 'trăng'], ['lantern', 'đèn lồng'], ['family', 'gia đình'], ['river', 'dòng sông'], ['market', 'chợ'], ['friend', 'bạn'], ['star', 'ngôi sao'],
  ['rice', 'cơm'], ['grandmother', 'bà'], ['grandfather', 'ông'], ['flower', 'bông hoa'], ['kite', 'con diều'], ['boat', 'con thuyền'], ['tree', 'cái cây'], ['sun', 'mặt trời'],
  ['bird', 'con chim'], ['fish', 'con cá'], ['school', 'trường học'], ['book', 'quyển sách'], ['song', 'bài hát'], ['house', 'ngôi nhà'], ['bread', 'bánh mì'], ['mango', 'quả xoài'], ['thank you', 'cảm ơn'], ['hello', 'xin chào']];
const weekNo = (date: string) => Math.floor((dayNo(date) + 4) / 7);   // weeks since 1970 (a week starts on Monday)
export const wordOfWeek = (date: string) => WORDS[((weekNo(date) % WORDS.length) + WORDS.length) % WORDS.length];
export const LIFE: Text[] = [
  { en: 'A rainy day idea: build a blanket fort and read a story from the valley together.', vi: 'Gợi ý ngày mưa: dựng một lều chăn và cùng đọc một truyện trong thung lũng.' },
  { en: 'Market day: let your child count the coins for a piece of fruit, just like the valley market.', vi: 'Ngày đi chợ: cho bé đếm tiền mua một quả trái cây, giống như chợ trong thung lũng.' },
  { en: 'Call the grandparents this weekend and say one new word in Vietnamese together.', vi: 'Cuối tuần này gọi cho ông bà và cùng nói một từ tiếng Việt mới nhé.' },
  { en: 'School holidays: a short walk to spot birds, trees and boats, like in the valley.', vi: 'Ngày nghỉ học: đi dạo một chút để tìm chim, cây và thuyền, như trong thung lũng.' },
  { en: 'Cook something simple together and name each food in English and Vietnamese.', vi: 'Cùng nấu một món đơn giản và gọi tên từng món bằng tiếng Anh và tiếng Việt.' },
  { en: 'Make a paper lantern or a kite together this weekend.', vi: 'Cuối tuần này cùng làm một chiếc đèn lồng giấy hoặc một con diều.' },
];
/** the everyday-life tip goes out on the first and third Saturday of a month (at most twice a month) */
export const lifeDay = (l: Pick<Local, 'd' | 'wd'>) => l.wd === 6 && (l.d <= 7 || (l.d >= 15 && l.d <= 21));
export const lifeTip = (date: string) => LIFE[((weekNo(date) % LIFE.length) + LIFE.length) % LIFE.length];
export const TEXTS = {
  satTitle: { en: 'This week in Sparkle Valley', vi: 'Tuần này ở Thung Lũng Lấp Lánh' },
  sunTitle: { en: 'Your week in Sparkle Valley', vi: 'Một tuần ở Thung Lũng Lấp Lánh' },
  festTitle: { en: 'A festival in Sparkle Valley', vi: 'Lễ hội ở Thung Lũng Lấp Lánh' },
  wordTitle: { en: 'Word of the week', vi: 'Từ của tuần' },
  bedTitle: { en: 'Bedtime story', vi: 'Truyện trước giờ ngủ' },
  inviteTitle: { en: 'A play invite', vi: 'Lời mời cùng chơi' },
  testerTitle: { en: 'Fixed: thank you for reporting', vi: 'Đã sửa: cảm ơn bạn đã báo lỗi' },
  // fallbacks the service worker shows when the device has nothing of its own yet
  gotw: { en: 'A game picked for this week is waiting in the valley.', vi: 'Một trò chơi được chọn cho tuần này đang chờ trong thung lũng.' },
  weekly: { en: 'Open Grown-ups to see this week’s play report.', vi: 'Mở mục Phụ huynh để xem báo cáo chơi tuần này.' },
  balance: { en: 'Try a mix of games this week: maths, words, stories and music.', vi: 'Tuần này thử nhiều loại trò: toán, chữ, truyện và âm nhạc.' },
  bed: { en: 'A calm story is ready on the story shelf. Sweet dreams.', vi: 'Một câu chuyện nhẹ nhàng đang chờ trên kệ truyện. Chúc ngủ ngon.' },
  invite: { en: 'A friend’s family would like to play together. Open the game to say yes or no.', vi: 'Gia đình một người bạn muốn cùng chơi. Mở trò chơi để đồng ý hoặc từ chối.' },
  tester: { en: 'A problem you reported is fixed in the newest version. Please try it again.', vi: 'Một lỗi bạn báo đã được sửa trong bản mới nhất. Bạn thử lại nhé.' },
};
export const festivalText = (f: Dated, tomorrow: boolean): Text => tomorrow
  ? { en: `${f.en} is tomorrow: the valley is decorating, with a festival game and a story.`, vi: `Ngày mai là ${f.vi}: thung lũng đang trang trí, có trò chơi và truyện lễ hội.` }
  : { en: `${f.en} is this week (${f.date.slice(8)}/${f.date.slice(5, 7)}): festival games and stories in the valley.`, vi: `${f.vi} vào tuần này (${f.date.slice(8)}/${f.date.slice(5, 7)}): có trò chơi và truyện lễ hội trong thung lũng.` };
export const wordText = (w: [string, string]): Text => ({ en: `“${w[0]}” in Vietnamese is “${w[1]}”. Say it together at dinner.`, vi: `“${w[1]}” trong tiếng Anh là “${w[0]}”. Cùng nói trong bữa tối nhé.` });

// ---------- when: the slots and bundling ----------
export const SLOT = { sat: { wd: 6, at: 9 * 60 + 30 }, sun: { wd: 0, at: 18 * 60 }, mon: { wd: 1, at: 7 * 60 + 30 }, bed: { at: 19 * 60 }, fest: { at: 9 * 60 + 30 }, tester: { at: 18 * 60 } };
// a slot that falls in quiet hours waits until they end; after this long it is dropped for that week
export const SLOT_WINDOW = 12 * 60;
export type Message = { key: string, also?: string[], slot: string, kinds: KindId[], title: Text, parts: Partial<Record<KindId, Text>>, lead?: Text, open: string, tag: string };
export type PlanInput = { now: number, prefs: Prefs, sent: Record<string, number>, studioOff?: (k: KindId) => boolean, news?: Text | null, testerFixed?: number, invite?: boolean };
const on = (inp: PlanInput, k: KindId) => !!inp.prefs.kinds[k] && !(inp.studioOff && inp.studioOff(k));
const due = (l: Local, at: number) => l.min >= at && l.min - at < SLOT_WINDOW;
/** the messages due now for one family (each at most once: its key goes into `sent`); empty in quiet hours */
export function plan(inp: PlanInput): Message[] {
  const l = localOf(inp.now, inp.prefs.tz), out: Message[] = [];
  if (isQuiet(l, inp.prefs.quiet)) return out;
  const fresh = (key: string) => !inp.sent[key];
  // Saturday: a festival or event of the coming week leads; new content, game of the week; the life tip twice a month
  if (l.wd === SLOT.sat.wd && due(l, SLOT.sat.at) && fresh('sat:' + l.date)) {
    const parts: Partial<Record<KindId, Text>> = {}, kinds: KindId[] = [];
    if (on(inp, 'new') && inp.news) { parts.new = inp.news; kinds.push('new'); }
    if (on(inp, 'gotw')) kinds.push('gotw');
    if (on(inp, 'life') && lifeDay(l)) { parts.life = lifeTip(l.date); kinds.push('life'); }
    const week = [addDays(l.date, 1), addDays(l.date, 7)];
    const fests = on(inp, 'festival') ? datedBetween(vnFestivals, week[0], week[1]).filter(f => fresh('fest:' + f.id + ':' + f.date)) : [];
    const events = on(inp, 'event') ? datedBetween(auEvents, week[0], week[1]).filter(f => fresh('fest:' + f.id + ':' + f.date)) : [];
    const lead = [...fests, ...events].sort((a, b) => a.date < b.date ? -1 : 1)[0];
    if (lead) kinds.unshift(fests.includes(lead) ? 'festival' : 'event');
    if (kinds.length) out.push({ key: 'sat:' + l.date, slot: 'sat', kinds, title: lead ? TEXTS.festTitle : TEXTS.satTitle, parts, lead: lead ? festivalText(lead, lead.date === addDays(l.date, 1)) : undefined,
      open: lead ? 'festival' : kinds.includes('gotw') ? 'gotw' : 'new', tag: 'sv-sat', also: lead ? ['fest:' + lead.id + ':' + lead.date] : undefined });
  }
  // a Vietnamese festival the morning before (when no Saturday message announced it already)
  if (on(inp, 'festival') && due(l, SLOT.fest.at)) {
    const f = vnFestivals(l.y).concat(vnFestivals(l.y + 1)).find(x => x.date === addDays(l.date, 1));
    if (f && fresh('fest:' + f.id + ':' + f.date) && !out.some(m => (m.also || []).includes('fest:' + f.id + ':' + f.date)))
      out.push({ key: 'fest:' + f.id + ':' + f.date, slot: 'fest', kinds: ['festival'], title: TEXTS.festTitle, parts: { festival: festivalText(f, true) }, open: 'festival', tag: 'sv-fest' });
  }
  // Sunday: the summary, the balance tip and (when on) achievements, all written on the device
  if (l.wd === SLOT.sun.wd && due(l, SLOT.sun.at) && fresh('sun:' + l.date)) {
    const kinds = (['weekly', 'balance', 'achieve'] as KindId[]).filter(k => on(inp, k));
    if (kinds.length) out.push({ key: 'sun:' + l.date, slot: 'sun', kinds, title: TEXTS.sunTitle, parts: {}, open: kinds.includes('weekly') ? 'weekly' : 'balance', tag: 'sv-sun' });
  }
  if (on(inp, 'word') && l.wd === SLOT.mon.wd && due(l, SLOT.mon.at) && fresh('mon:' + l.date))
    out.push({ key: 'mon:' + l.date, slot: 'mon', kinds: ['word'], title: TEXTS.wordTitle, parts: { word: wordText(wordOfWeek(l.date)) }, open: 'word', tag: 'sv-word' });
  if (on(inp, 'bedtime') && inp.prefs.bedDays.includes(l.wd) && due(l, SLOT.bed.at) && fresh('bed:' + l.date))
    out.push({ key: 'bed:' + l.date, slot: 'bed', kinds: ['bedtime'], title: TEXTS.bedTitle, parts: { bedtime: TEXTS.bed }, open: 'bedtime', tag: 'sv-bed' });
  if (on(inp, 'tester') && inp.testerFixed > 0 && due(l, SLOT.tester.at) && fresh('tester:' + l.date))
    out.push({ key: 'tester:' + l.date, slot: 'tester', kinds: ['tester'], title: TEXTS.testerTitle, parts: { tester: TEXTS.tester }, open: 'tester', tag: 'sv-tester' });
  return out;
}
/** how many scheduled messages a family with these choices gets in the weeks from `from` (for the cap check and Studio) */
export function messagesIn(prefs: Prefs, from: number, weeks: number, extra: Omit<PlanInput, 'now' | 'prefs' | 'sent'> = {}): Message[] {
  const sent: Record<string, number> = {}, all: Message[] = [];
  for (let t = from; t < from + weeks * 7 * 864e5; t += 30 * 60e3) for (const m of plan({ ...extra, now: t, prefs, sent })) { for (const k of [m.key, ...(m.also || [])]) sent[k] = t; all.push(m); }
  return all;
}

// ---------- what a push carries, and what the service worker shows ----------
// The payload holds only the grown-up's language's texts; the device's own lines (summary, balance, game of the week,
// achievements) come from its cache, in that language.
export type Payload = { v: 1, kinds: KindId[], title: string, lead?: string, parts: Partial<Record<KindId, string>>, open: string, tag: string, lang: 'en' | 'vi' };
export const payloadOf = (m: Message, lang: 'en' | 'vi'): Payload => ({ v: 1, kinds: m.kinds, title: m.title[lang], lead: m.lead ? m.lead[lang] : undefined, parts: Object.fromEntries(Object.entries(m.parts).map(([k, t]) => [k, t[lang]])), open: m.open, tag: m.tag, lang });
export type LocalLines = Partial<Record<KindId, Text>> & { gotwId?: string };
const FALLBACK: Partial<Record<KindId, Text>> = { gotw: TEXTS.gotw, weekly: TEXTS.weekly, balance: TEXTS.balance, invite: TEXTS.invite, tester: TEXTS.tester };
/** the text shown: the lead, then each kind's line (the device's own line first, then the payload's, then a fallback) */
export function compose(p: Payload, local: LocalLines | null): { title: string, body: string, open: string, tag: string } {
  const lang = p.lang === 'vi' ? 'vi' : 'en', lines: string[] = [];
  if (p.lead) lines.push(p.lead);
  for (const k of p.kinds) { if ((k === 'festival' || k === 'event') && p.lead) continue; const own = local && local[k]; const t = (own && own[lang]) || p.parts[k] || (FALLBACK[k] && FALLBACK[k][lang]); if (t) lines.push(t); }
  return { title: p.title, body: lines.join('\n').slice(0, 600), open: p.open, tag: p.tag };
}
// where a tap opens: the game with ?open=<where> (js/notify.ts takes it from there)
export const OPENS = ['new', 'gotw', 'weekly', 'balance', 'achieve', 'word', 'bedtime', 'life', 'festival', 'event', 'invite', 'tester'];
export const openURL = (open: string, scope: string, gameId?: string) => { const u = new URL('./', scope); u.searchParams.set('open', OPENS.includes(open) ? open : 'home'); if (open === 'gotw' && gameId && /^[\w-]{1,40}$/.test(gameId)) u.searchParams.set('game', gameId); return u.href; };
