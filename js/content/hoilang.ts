// Hội làng, the village festival (round S, owner plan 8 Oct, ROUND-R item 9): three big events a day in every village
// with a games board, on the real clock in AEST (UTC+10, like js/kidplay.js), the same for every device and friend:
//   09:00, 16:00 and 19:00 (17:30 instead of 19:00 when an under-5 is playing), each one running for 15 minutes, so a
//   child who arrives late still joins in; one who arrives after it ended is told when the next one is.
// A parade of villagers walks the village's street, a crowd gathers round the stage, and joining the festival game
// gives a special prize: kept like the whistling kite (carried beside the child, switched in the Backpack) and as a
// keepsake for the child's house. Pure data and time sums only (no page, no 3D), so Node's unit tests can read it.
export const EVENTS = [{ at: '09:00' }, { at: '16:00' }, { at: '19:00', little: '17:30' }];
export const EVENT_MIN = 15;          // how long an event runs (late arrivals can still join)
export const AEST_MIN = 10 * 60;      // AEST is UTC+10 all year (Brisbane: no daylight saving)
const toMin = hm => +hm.slice(0, 2) * 60 + +hm.slice(3, 5);
/** minutes into the day in AEST, with the seconds as a fraction */
export const aestMinute = (ms = Date.now()) => (((ms / 60000 + AEST_MIN) % 1440) + 1440) % 1440;
/** the day number in AEST (changes at midnight in Brisbane) */
export const aestDay = (ms = Date.now()) => Math.floor((ms + AEST_MIN * 60000) / 864e5);
/** today's event times, 'HH:MM' in AEST: an under-5 gets the evening one earlier */
export const eventTimes = little => EVENTS.map(e => (little && e.little) || e.at);
/** where the clock is: { on, at, left (seconds of this event left), key (one per event: 'day:HH:MM'), next: { at, inMin, tomorrow } } */
export function eventNow(ms = Date.now(), little = false) {
  const m = aestMinute(ms), day = aestDay(ms), times = eventTimes(little);
  let on = null;
  for (const at of times) { const t = toMin(at); if (m >= t && m < t + EVENT_MIN) on = at; }
  const later = times.find(at => toMin(at) > m), next = later ? { at: later, inMin: toMin(later) - m, tomorrow: false } : { at: times[0], inMin: 1440 - m + toMin(times[0]), tomorrow: true };
  return on ? { on: true, at: on, left: Math.max(0, (toMin(on) + EVENT_MIN - m) * 60), key: day + ':' + on, next }
    : { on: false, at: null, left: 0, key: null, next };
}
/** the event that ended last (today), or null: for "you just missed it, the next one is at …" */
export function lastEvent(ms = Date.now(), little = false) {
  const m = aestMinute(ms), done = eventTimes(little).filter(at => toMin(at) + EVENT_MIN <= m);
  return done.length ? done[done.length - 1] : null;
}

// the special prizes, one per event joined, in order; each also goes in the child's house as a keepsake (hl_<id>)
export const HL_PRIZES = [
  { id: 'drum', icon: '🥁', en: 'Little festival drum', vi: 'Trống hội nhỏ' },
  { id: 'lion', icon: '🦁', en: 'Lion dance head', vi: 'Đầu lân múa' },
  { id: 'fan', icon: '🪭', en: 'Painted paper fan', vi: 'Quạt giấy vẽ hoa' },
  { id: 'carp', icon: '🎏', en: 'Paper carp lantern', vi: 'Đèn cá chép giấy' },
  { id: 'tohe', icon: '🎎', en: 'Tò he dough figures', vi: 'Tò he bột nặn' },
  { id: 'medal', icon: '🏅', en: 'Village festival medal', vi: 'Huy chương hội làng' }
];
/** the next prize for a child who has these ([] → the drum); null when every prize is theirs (then coins and a sticker) */
export const nextPrize = (have = []) => HL_PRIZES.find(x => !have.includes(x.id)) || null;
/** a prize is given once per event per child; the under-5s get it for joining in (no losing), big kids for a win */
export const earnsPrize = ({ joinedKey, prizedKeys = [], little, won }) => !!joinedKey && !prizedKeys.includes(joinedKey) && (little || !!won);

// what is said ([en, vi]; recorded: no names, no numbers that change)
export const HL_LINES = {
  on: ['The village festival is on! Come to the stage: there is a parade, music and a special prize.', 'Hội làng đang diễn ra! Lại sân khấu nhé: có rước, có nhạc và có quà đặc biệt.'],
  join: ['Welcome to the village festival! Play the festival game with us to win a special prize.', 'Chào mừng con đến hội làng! Chơi trò của hội cùng mọi người để nhận quà đặc biệt nhé.'],
  prize: ['A special prize from the village festival! It is yours to keep.', 'Quà đặc biệt của hội làng! Quà này con giữ luôn nhé.'],
  allPrizes: ['You have every festival prize! Here are some coins and a sticker.', 'Con có đủ quà của hội làng rồi! Đây là ít tiền và một hình dán.'],
  already: ['You have your prize from this festival. Enjoy the parade!', 'Con nhận quà của hội này rồi. Xem rước tiếp nhé!'],
  soon: ['The village festival starts soon. Come to the stage!', 'Hội làng sắp bắt đầu rồi. Lại sân khấu nhé!'],
  free: ['Every game here is free. Play any time you like!', 'Mọi trò ở đây đều miễn phí. Con chơi lúc nào cũng được!']
};
// "the next village festival is at …", one recorded line per time
export const HL_NEXT = {
  '09:00': ['The next village festival is at nine in the morning.', 'Hội làng lần tới lúc chín giờ sáng.'],
  '16:00': ['The next village festival is at four in the afternoon.', 'Hội làng lần tới lúc bốn giờ chiều.'],
  '17:30': ['The next village festival is at half past five.', 'Hội làng lần tới lúc năm giờ rưỡi chiều.'],
  '19:00': ['The next village festival is at seven in the evening.', 'Hội làng lần tới lúc bảy giờ tối.']
};
