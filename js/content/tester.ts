// @ts-check
// Tester reports (owner, 12 Oct 2026 AEDT; brief docs/cores/tasks/tester-reports.md): the lists, words, limits and
// rules for tester devices, with no screen (js/tester.js draws, netlify/lib/tester.mts keeps the reports). A device is a
// tester when Studio's Releases page switches `tester` on for it (every device, or only the ticked ones) and the tester
// has accepted the agreement; on a tester device reports keep the players' names, ages and progress (PRIV-016).

// the agreement, shown once (owner: what is collected and what the tester agrees to; never the tools behind it)
export const AGREEMENT = {
  title: ['Become a Sparkle Valley tester', 'Trở thành người thử Sparkle Valley'],
  intro: ['Thank you for helping make the game better! While this device is a tester:', 'Cảm ơn bạn đã giúp trò chơi tốt hơn! Khi thiết bị này là máy thử:'],
  points: [
    ['When something goes wrong, the game sends a report by itself: a picture of the screen, what was happening in the last 30 seconds, and details of this device and game version.', 'Khi có gì không ổn, trò chơi tự gửi một báo cáo: ảnh màn hình, những gì xảy ra trong 30 giây trước đó, và thông tin về thiết bị này và phiên bản trò chơi.'],
    ['Reports include the players\' names, ages and progress on this device.', 'Báo cáo có tên, tuổi và tiến độ của những người chơi trên thiết bị này.'],
    ['When you tap the ladybird, your typed or spoken note is sent too.', 'Khi bạn chạm vào con bọ rùa, ghi chú bạn gõ hoặc nói cũng được gửi đi.'],
    ['Reports are used only to find and fix problems in the game.', 'Báo cáo chỉ dùng để tìm và sửa lỗi trong trò chơi.'],
    ['You can stop being a tester at any time in Settings, and reports stop straight away.', 'Bạn có thể thôi làm người thử bất cứ lúc nào trong Cài đặt, và báo cáo dừng ngay.']
  ],
  accept: ['I accept', 'Tôi đồng ý'],
  later: ['Not now', 'Để sau']
};

// the five kinds a tester picks on the ladybird's panel (and 'auto' for the game's own reports)
export const KINDS = [
  { id: 'broken', icon: '💥', en: 'Broken', vi: 'Bị hỏng' },
  { id: 'looks', icon: '👀', en: 'Looks wrong', vi: 'Trông sai' },
  { id: 'words', icon: '💬', en: 'Words or voice', vi: 'Chữ hoặc giọng' },
  { id: 'sound', icon: '🔔', en: 'Sound', vi: 'Âm thanh' },
  { id: 'idea', icon: '💡', en: 'Idea', vi: 'Ý tưởng' }
];
export const KIND_IDS = KINDS.map(k => k.id);

// what the game reports by itself (each once a session for the same thing at the same place, then counted)
export const AUTO = {
  error: { en: 'An error in the game', vi: 'Một lỗi trong trò chơi' },
  noopen: { en: 'Did not open', vi: 'Không mở được' },
  noclose: { en: 'Did not close', vi: 'Không đóng được' },
  freeze: { en: 'The screen froze', vi: 'Màn hình bị đứng' },
  slow: { en: 'Slow', vi: 'Chậm' },
  offscreen: { en: 'A button off the screen', vi: 'Một nút nằm ngoài màn hình' },
  novoice: { en: 'A line with no recording', vi: 'Một câu chưa có giọng thu' },
  stuck: { en: 'The child got stuck', vi: 'Bé bị kẹt' },
  autoplay: { en: 'Found by the auto play check', vi: 'Do tự chơi kiểm tra tìm ra' }
};
// the limits: how long and how slow before the game reports by itself
export const LIMITS = {
  openWait: 3,        // seconds before a game or story that has not opened counts
  closeWait: 2,       // seconds before a window that did not close counts
  freeze: 2,          // seconds with no frame while the game is on screen
  slowFps: 20, slowFor: 10, // under 20 frames a second for 10 seconds
  stuck: 4,           // seconds without moving while the stick is pushed (js/players.js watchHero)
  replay: 30,         // seconds kept for the replay
  errors: 20,         // errors kept
  shotWidth: 480,     // the screenshot's width in pixels (a JPEG of about 30 KB)
  queue: 30,          // reports kept on the device while offline
  sameAgain: 10 * 60e3 // the same automatic problem is sent again only after 10 minutes (counted meanwhile)
};

// tester levels (Studio): auto reports only, or auto reports and the ladybird
/**
 * @typedef {'auto' | 'ladybird'} TesterLevel
 * @typedef {{ on?: unknown, devices?: unknown, levels?: Record<string, unknown> | null, peeks?: unknown }} TesterRelease  (Studio's saved rule; old saves may lack fields or hold wrong kinds)
 */
/** @param {unknown} v @returns {v is TesterLevel} */
const isLevel = v => v === 'auto' || v === 'ladybird';
/** @type {TesterLevel[]} */
export const LEVELS = ['auto', 'ladybird'];
// the release rule for `tester` → this device's level, or '' when it is not a tester
//   rule: { on, devices: [ids], levels: { id: 'auto' | 'ladybird' }, peeks: [release ids] }
/** @param {unknown} on @param {TesterRelease | null | undefined} rule @param {string} me @returns {TesterLevel | ''} */
export function testerLevel(on, rule, me) {
  if (!on || !me) return '';
  const list = rule && Array.isArray(rule.devices) ? rule.devices.filter(d => typeof d === 'string') : [];
  if (list.length && !list.includes(me)) return '';
  const lv = rule && rule.levels && rule.levels[me];
  return isLevel(lv) ? lv : 'ladybird';
}
// the releases a tester sees early ("Tester preview")
/** @param {TesterRelease | null | undefined} rule @returns {string[]} */
export const peeksOf = rule => rule && Array.isArray(rule.peeks) ? rule.peeks.filter(x => typeof x === 'string' && /^[\w-]{1,40}$/.test(x)).slice(0, 20) : [];

// a problem's key on this device: the same kind, detail and place is one problem (the server groups by it too)
/** @param {string} kind @param {unknown} [detail] @param {unknown} [where] @returns {string} */
export const keyOf = (kind, detail, where) => [kind, String(detail || '').slice(0, 80), String(where || '').slice(0, 40)].join('|').replace(/[^\w .:/()'#,@|-]/g, '').slice(0, 160);

// ---------- rewards ----------
// Bug Hunter badges by reports that helped (a problem fixed, or confirmed real): worn on the shirt, shown online
export const BADGES = [
  { id: 'lb1', at: 1, color: '#c98a4a', en: 'Bronze Ladybird', vi: 'Bọ rùa Đồng' },
  { id: 'lb2', at: 10, color: '#c9d1d9', en: 'Silver Ladybird', vi: 'Bọ rùa Bạc' },
  { id: 'lb3', at: 25, color: '#ffcf3a', en: 'Gold Ladybird', vi: 'Bọ rùa Vàng' },
  { id: 'lb4', at: 50, color: 'rainbow', en: 'Rainbow Ladybird', vi: 'Bọ rùa Cầu vồng' }
];
/** @param {number} helped */
export const badgeFor = helped => [...BADGES].reverse().find(b => helped >= b.at) || null;
/** @param {number} helped */
export const nextBadge = helped => BADGES.find(b => helped < b.at) || null;
// coins: for each report that helped, a little more when it had a spoken note
export const COINS = { helped: 15, spoken: 10, thanks: 20 };
// tester gear (js/content/shop.js: tester-only, never sold): which badge gives which
export const GEAR = [
  { id: 'sleuthhat', at: 'lb1' },
  { id: 'ladypack', at: 'lb2' },
  { id: 'sleuthcape', at: 'album' } // a full sticker page
];
// the sticker album: one sticker for each kind of problem found
export const STICKER_KINDS = ['broken', 'looks', 'words', 'sound', 'idea'];
export const STICKER_ICON = { broken: '💥', looks: '👀', words: '💬', sound: '🔔', idea: '💡' };

// what testers hear (recorded; a child's name is shown, the spoken line leaves it out: HANDOFF rule 11)
export const TESTER_LINES = {
  welcome: ['Thank you for being a tester! When something looks wrong, tap the ladybird.', 'Cảm ơn con đã làm người thử! Khi thấy gì không ổn, con chạm vào con bọ rùa nhé.'],
  sent: ['Thank you! Your report is on its way.', 'Cảm ơn con! Báo cáo đang được gửi đi.'],
  waiting: ['Saved. It will be sent when we are back online.', 'Đã lưu. Báo cáo sẽ gửi khi có mạng lại.'],
  already: ['Someone already told us about this. Thank you for telling us again!', 'Đã có người báo việc này rồi. Cảm ơn con đã báo thêm!'],
  fixed: ['You found this, and now it is fixed! Thank you, bug hunter!', 'Con đã tìm ra lỗi này, và giờ nó đã được sửa! Cảm ơn bạn săn bọ!'],
  badge: ['A new Bug Hunter badge for your shirt!', 'Một huy hiệu Săn Bọ mới cho áo của con!'],
  star: ['You are this week\'s star tester!', 'Con là người thử ngôi sao của tuần này!'],
  peek: ['A tester preview: you are among the first to see this!', 'Xem trước cho người thử: con là một trong những người đầu tiên được thấy!']
};
