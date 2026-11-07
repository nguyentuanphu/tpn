// (v1.08b quality, owner's pop-ups 3-4 Nov 2026 AEDT, docs/plans/links-rollout-install.md part 5) Lumi as the guide:
// she welcomes a new child, explains new things, carries the week's news, and is the voice of the Simple screen; her
// soft goodbye ends the play time a grown-up set; and the games two people can play together on one device.
// Pure: words and lists only. The page side is js/lumi.ts. Every line is a recorded pair [en, vi] (women's voices,
// HoaiMy and Natasha, tools/make-voice-pack.mts); none has a child's name in it (HANDOFF rule 11).

export const LUMI_NAME: [string, string] = ['Lumi', 'Lumi'];
export const LUMI_WELCOME: [string, string][] = [
  ['Hello! I am Lumi, the star gardener. Welcome to Sparkle Valley!', 'Xin chào! Tớ là Lumi, người làm vườn sao. Chào mừng bạn đến Thung Lũng Lấp Lánh!'],
  ['Tap a picture to play. I will help you along the way.', 'Chạm vào một hình để chơi nhé. Tớ sẽ giúp bạn trên đường đi.']
];
// the week's news: one a week, in turn (the week number of the year picks it), each about something to find
export const LUMI_NEWS: [string, string][] = [
  ['News this week: there are new games in Fun learning. Come and find them!', 'Tin tuần này: Học vui có trò chơi mới. Mình cùng đi tìm nhé!'],
  ['News this week: tap the TV in any game to watch how to play.', 'Tin tuần này: chạm vào cái ti vi trong trò chơi để xem cách chơi nhé.'],
  ['News this week: some games are for two. Play one with Mum or Dad!', 'Tin tuần này: có trò chơi cho hai người. Chơi cùng bố hoặc mẹ nhé!'],
  ['News this week: win stars to light up the path. How many can you find?', 'Tin tuần này: thắng sao để thắp sáng con đường. Bạn tìm được bao nhiêu ngôi sao?'],
  ['News this week: a new story is waiting in the valley. Shall we read it?', 'Tin tuần này: một câu chuyện mới đang chờ trong thung lũng. Mình đọc nhé?']
];
// the gentle play time: a word two minutes before, then the goodbye once the game in hand is over (never mid-game)
export const LUMI_SOON: [string, string] = ['Two more minutes, then it is time to rest.', 'Còn hai phút nữa, rồi mình nghỉ nhé.'];
export const LUMI_BYE: [string, string] = ['You played so well today! See you tomorrow, let us play again!', 'Hôm nay bạn chơi giỏi lắm! Hẹn mai chơi tiếp nhé!'];
export const SOON_MIN = 2;
/** which part of the play time it is: 'play', 'soon' (the last two minutes) or 'bye' (time is up) */
export function playTimePhase(playedMin: number, limitMin: number): 'play' | 'soon' | 'bye' {
  if (!limitMin || limitMin <= 0) return 'play';
  return playedMin >= limitMin ? 'bye' : playedMin >= limitMin - SOON_MIN ? 'soon' : 'play';
}
/** the goodbye waits for the game in hand: it shows only when no game, film or story is open */
export const byeNow = (phase: string, busy: boolean) => phase === 'bye' && !busy;
/** the news line of the week of this date (Sydney date as 'YYYY-MM-DD') */
const weekOf = (date: string) => Math.floor((Date.UTC(+date.slice(0, 4), +date.slice(5, 7) - 1, +date.slice(8, 10)) - Date.UTC(+date.slice(0, 4), 0, 1)) / (7 * 864e5));
/** the news line of the week of this date (Sydney date as 'YYYY-MM-DD') */
export const newsOfWeek = (date: string): [string, string] => LUMI_NEWS[weekOf(date) % LUMI_NEWS.length];
/** the week a news line belongs to, so each child hears it once a week */
export const weekKey = (date: string) => date.slice(0, 4) + 'w' + weekOf(date);

// ---------- Play with Mum and Dad (Chơi cùng bố mẹ) ----------
// games two people can play on one device, taking turns on the same screen, each with a short guide for the grown-up
export const PLAY_TOGETHER: { id: string, guide: [string, string] }[] = [
  { id: 'oanquan', guide: ['Take turns sowing the stones. Count out loud together: it is good maths practice.', 'Lần lượt rải quân. Cùng đếm to lên: luyện toán rất tốt.'] },
  { id: 'cacuangua', guide: ['Choose two players and turn the helpers off. Roll the die in turn and race your horses home.', 'Chọn hai người chơi và tắt người giúp. Lần lượt gieo xúc xắc và đưa ngựa về chuồng.'] },
  { id: 'snakes', guide: ['Two players take turns to roll. Say each number as your piece moves.', 'Hai người lần lượt gieo. Đọc to từng số khi quân đi.'] },
  { id: 'tug', guide: ['Each of you taps your own side as fast as you can. Let your child win sometimes!', 'Mỗi người chạm bên của mình thật nhanh. Thỉnh thoảng để bé thắng nhé!'] },
  { id: 'familyquiz', guide: ['Read the question together, then let your child choose the answer.', 'Cùng đọc câu hỏi, rồi để bé chọn câu trả lời.'] },
  { id: 'memory', guide: ['Take turns turning two cards. Talk about the pictures you find.', 'Lần lượt lật hai thẻ. Cùng nói về các hình tìm được.'] },
  { id: 'tienlen', guide: ['Hold the device between you and play your cards in turn. Help your child count the cards.', 'Cầm máy ở giữa và lần lượt đánh bài. Giúp bé đếm các lá bài.'] },
  { id: 'hanoi', guide: ['Solve it together: one of you says the move, the other makes it.', 'Cùng giải: một người nói nước đi, người kia thực hiện.'] }
];
export const TOGETHER_GUIDE: [string, string][] = [
  ['Sit side by side and hold the device between you.', 'Ngồi cạnh nhau và cầm máy ở giữa.'],
  ['Take turns, and say what you see and count out loud.', 'Lần lượt chơi, nói những gì mình thấy và đếm to lên.'],
  ['Praise trying, not only winning.', 'Khen bé cố gắng, không chỉ khi thắng.']
];
