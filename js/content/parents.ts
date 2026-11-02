// For grown-ups (round S, owner plan 8 Oct, ROUND-R item 11): the pure parts, so Node's unit tests can check them.
// The page and the valley side are js/parents.js. Times are on the real clock in AEST (UTC+10), like js/kidplay.js.
//   missions   a grown-up writes one (Grown-ups on the device, or Studio's content pack "missions"); the child sees it;
//              a grown-up ticks ✓ behind the press-and-hold gate and the child gets the reward
//   week note  a few plain sentences from the play report's days (profile.stats.days, js/report.js)
//   dance      a short music-and-movement break after 20 minutes of play; skippable
//   bedtime    a grown-up sets a time; 10 minutes before, a gentle warning; then the valley dims, lullabies play and the
//              game ends kindly with a goodnight card (a grown-up can hold for 10 more minutes)
//   birthday   optional, month and day only, kept on this device: a birthday surprise on the day
export const AEST_MIN = 10 * 60;
const pad = n => String(n).padStart(2, '0');
/** 'YYYY-MM-DD' of a moment, in AEST */
export const aestDate = (ms = Date.now()) => { const d = new Date(ms + AEST_MIN * 60000); return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`; };
/** minutes into the day in AEST */
export const aestMinute = (ms = Date.now()) => (((ms / 60000 + AEST_MIN) % 1440) + 1440) % 1440;

// ---------- family missions ----------
export const MISSION_MAX = 12, MISSION_COINS = 10;
const txt = v => typeof v === 'string' ? v.replace(/[<>]/g, '').trim().slice(0, 120) : '';
/** only well-formed missions: { id, en, vi, who (a child's id, or '' for everyone), at, done: { childId: time } } */
export function cleanMissions(raw, prefix = 'd') {
  return (Array.isArray(raw) ? raw : []).filter(m => m && (txt(m.en) || txt(m.vi))).slice(0, MISSION_MAX).map((m, k) => ({
    id: /^[\w-]{1,40}$/.test(m.id || '') ? m.id : `${prefix}${k}_${(txt(m.en) || txt(m.vi)).length}`, en: txt(m.en) || txt(m.vi), vi: txt(m.vi) || txt(m.en),
    who: typeof m.who === 'string' ? m.who.slice(0, 60) : '', at: +m.at || 0, done: m.done && typeof m.done === 'object' ? Object.fromEntries(Object.entries(m.done).filter(([, v]) => +v > 0).map(([k2, v]) => [k2, +v])) : {} }));
}
/** a new mission at the top (the oldest drops off past MISSION_MAX) */
export function addMission(list, { en, vi, who = '' }, now = Date.now()) {
  const m = { id: 'd' + now.toString(36), en: txt(en) || txt(vi), vi: txt(vi) || txt(en), who: who || '', at: now, done: {} };
  if (!m.en) return list.slice();
  return [m, ...list].slice(0, MISSION_MAX);
}
export const removeMission = (list, id) => list.filter(m => m.id !== id);
/** missions waiting for this child: for everyone or for them, not yet ticked for them */
export const openMissions = (list, childId) => list.filter(m => (!m.who || m.who === childId) && !(m.done || {})[childId]);
/** a grown-up ticks ✓ for this child: { list, rewarded } (rewarded false when it was already ticked or not theirs) */
export function tickMission(list, id, childId, now = Date.now()) {
  let rewarded = false;
  const next = list.map(m => { if (m.id !== id || (m.who && m.who !== childId) || (m.done || {})[childId]) return m; rewarded = true; return { ...m, done: { ...(m.done || {}), [childId]: now } }; });
  return { list: next, rewarded };
}
/** the device's missions and Studio's (content pack) together; Studio's ticks are kept on the device (doneStudio) */
export function allMissions(device, studio, doneStudio = {}) {
  return [...cleanMissions(studio, 's').map(m => ({ ...m, id: 's_' + m.id.replace(/^s_/, ''), studio: true, done: { ...(doneStudio[('s_' + m.id.replace(/^s_/, ''))] || {}) } })), ...cleanMissions(device)];
}

// ---------- the weekly note ----------
const dayKeyOf = d => `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;
/** the last 7 days (to today) and the 7 before, from profile.stats.days { 'YYYY-MM-DD': { min, games } } */
export function weekSummary(days = {}, today = aestDate()) {
  const t = Date.UTC(+today.slice(0, 4), +today.slice(5, 7) - 1, +today.slice(8, 10)), get = k => days[k] || { min: 0, games: 0 };
  const span = from => [...Array(7)].map((_, i) => { const k = dayKeyOf(new Date(t - (from + 6 - i) * 864e5)); return { key: k, ...get(k) }; });
  const now = span(0), before = span(7), sum = (a, f) => a.reduce((s, x) => s + (+x[f] || 0), 0);
  const best = now.reduce((b, x) => x.min > b.min ? x : b, { min: 0, key: null });
  const min = sum(now, 'min'), was = sum(before, 'min');
  return { min, games: sum(now, 'games'), days: now.filter(x => x.min > 0).length, best: best.key, bestMin: best.min, was, trend: !was ? (min ? 'new' : 'none') : min > was * 1.2 ? 'more' : min < was * .8 ? 'less' : 'same', avg: Math.round(min / 7) };
}
/** the note as [en, vi] sentences (numbers are written, never spoken) */
export function weekNote(s, name = '', fav = null) {
  const who = name || 'Your child', whoVi = name || 'Bé';
  const out = [[`${who} played ${s.min} minutes on ${s.days} of the last 7 days (about ${s.avg} a day), ${s.games} games.`, `${whoVi} đã chơi ${s.min} phút trong ${s.days}/7 ngày qua (khoảng ${s.avg} phút mỗi ngày), ${s.games} trò chơi.`]];
  if (s.trend === 'more') out.push(['That is more than the week before. A few more breaks might help.', 'Nhiều hơn tuần trước. Có thể cho bé nghỉ giải lao thêm.']);
  else if (s.trend === 'less') out.push(['That is less than the week before.', 'Ít hơn tuần trước.']);
  else if (s.trend === 'same') out.push(['About the same as the week before.', 'Gần bằng tuần trước.']);
  if (fav) out.push([`Favourite game: ${fav[0]}.`, `Trò yêu thích: ${fav[1]}.`]);
  if (s.bestMin >= 45) out.push(['One day was over 45 minutes: the dance break and bedtime in Grown-ups can help.', 'Có một ngày chơi hơn 45 phút: giờ nhảy múa và giờ đi ngủ trong mục Phụ huynh có thể giúp.']);
  if (!s.min) out.push(['No play this week.', 'Tuần này bé chưa chơi.']);
  return out;
}

// ---------- the dance break ----------
export const DANCE_AFTER = 20;   // minutes of play (owner: "a dance break after 20 min")
/** due once every 20 minutes of play (minutes counted while the valley is not paused) */
export const danceDue = (playMin, lastAt = 0) => playMin - lastAt >= DANCE_AFTER;
export const DANCE_MOVES = [
  { icon: '👏', en: 'Clap your hands!', vi: 'Vỗ tay nào!' },
  { icon: '🦘', en: 'Jump like a kangaroo!', vi: 'Nhảy như chuột túi!' },
  { icon: '🌀', en: 'Spin around slowly!', vi: 'Xoay một vòng thật chậm!' },
  { icon: '🙌', en: 'Reach up high to the sky!', vi: 'Giơ tay thật cao lên trời!' },
  { icon: '🤸', en: 'Touch your toes!', vi: 'Cúi xuống chạm ngón chân!' },
  { icon: '💃', en: 'Dance any way you like!', vi: 'Nhảy múa tùy thích nào!' }
];
export const MOVE_SEC = 7;

// ---------- bedtime ----------
export const BED_WARN = 10, BED_DIM = 3, BED_SONG = 6;   // minutes: warning before; dimming over; lullaby before the goodnight card
/** bedtime 'HH:MM' (AEST) → { phase: 'off' | 'day' | 'soon' | 'bed' | 'night', minsTo }. 'bed' runs 0..BED_SONG minutes after; 'night' until 06:00 */
export function bedtimePhase(ms = Date.now(), bedtime = '') {
  if (!/^\d\d:\d\d$/.test(bedtime || '')) return { phase: 'off', minsTo: null };
  const m = aestMinute(ms), b = +bedtime.slice(0, 2) * 60 + +bedtime.slice(3), morning = 6 * 60;
  const since = ((m - b) % 1440 + 1440) % 1440, to = ((b - m) % 1440 + 1440) % 1440;
  const untilMorning = ((morning - b) % 1440 + 1440) % 1440;
  if (since < BED_SONG) return { phase: 'bed', minsTo: 0 };
  if (since < untilMorning) return { phase: 'night', minsTo: 0 };
  if (to <= BED_WARN) return { phase: 'soon', minsTo: Math.ceil(to) };
  return { phase: 'day', minsTo: Math.ceil(to) };
}

// ---------- birthday ----------
/** 'MM-DD' kept on the device only; true on that day in AEST (29 Feb is kept on 28 Feb in other years) */
export function isBirthday(md = '', ms = Date.now()) {
  if (!/^\d\d-\d\d$/.test(md || '')) return false;
  const today = aestDate(ms).slice(5), y = +aestDate(ms).slice(0, 4), leap = (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0;
  return today === md || (md === '02-29' && !leap && today === '02-28');
}

export const PARENT_LINES = {
  mission: ['Your family has a mission for you! Do it for real, then ask a grown-up to tick it.', 'Gia đình có một nhiệm vụ cho con! Làm thật ngoài đời, rồi nhờ người lớn đánh dấu nhé.'],
  missionDone: ['Mission done! Thank you for helping your family.', 'Xong nhiệm vụ! Cảm ơn con đã giúp gia đình.'],
  dance: ['Dance break! Stand up and move with me.', 'Giờ nhảy múa! Đứng dậy và vận động cùng mình nào.'],
  danceEnd: ['Great dancing! Now back to the valley.', 'Nhảy giỏi lắm! Giờ quay lại thung lũng nhé.'],
  bedSoon: ['It is nearly bedtime. Let us finish what we are doing.', 'Sắp đến giờ đi ngủ rồi. Mình làm nốt việc đang làm nhé.'],
  bed: ['It is bedtime. Let us listen to a lullaby.', 'Đến giờ đi ngủ rồi. Mình cùng nghe hát ru nhé.'],
  goodnight: ['Goodnight! Sweet dreams. See you tomorrow in the valley.', 'Chúc con ngủ ngon! Mơ đẹp nhé. Mai gặp lại ở thung lũng.'],
  birthday: ['Happy birthday! The whole valley has a surprise for you.', 'Chúc mừng sinh nhật! Cả thung lũng có quà bất ngờ cho con.'],
  card: ['Here is your certificate card. A grown-up can save the picture.', 'Đây là thiệp khen của con. Người lớn có thể lưu ảnh nhé.']
};
