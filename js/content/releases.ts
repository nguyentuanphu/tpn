// Everything Sparkle Studio's Ra mắt (Releases) page can switch on, schedule or switch off (round R, owner, 8 Oct;
// the full list and suggested starts are in docs/cores/FEATURES.md). Each: id (what the game asks featureOn/releaseOn
// for), en, vi, group, def (what it is when Studio never set it: the owner chose "everything on"). Every festival is
// one too (fest_<id>, from js/content/festcal.js). Part 2 of round R adds the rest of the list as each one is built.
import { FESTCAL } from './festcal.js';
// game: the money game it switches; icon: a festival's picture
export type Release = { id: string, en: string, vi: string, group: string, def: boolean, icon?: string, game?: string };
export const RELEASES: Release[] = [
  { id: 'autoplay', en: 'Auto play check (for grown-ups testing: a small window that plays everything; every device, or only the ticked ones)', vi: 'Tự chơi để kiểm tra (cho người lớn thử game: một cửa sổ nhỏ tự chơi mọi thứ; mọi máy, hoặc chỉ các máy được chọn)', group: 'tools', def: false },
  // (r90, owner 24 Oct AEDT: "hold them off until I want to release; switched off it should show as coming soon") the
  // second set of games and of stories (js/content/secondset.ts): off until the owner switches them on
  { id: 'newGames', en: 'New games (the second set, in every area): off shows "Coming soon" in the Play menu; on, each area\'s new games unlock after its first games are finished 3 times', vi: 'Trò chơi mới (bộ thứ hai, ở mọi khu): tắt thì hiện "Sắp ra mắt" trong Vui chơi; bật thì trò mới của mỗi khu mở sau khi chơi xong các trò đầu 3 lần', group: 'kids', def: false },
  { id: 'newStories', en: 'New stories (the second set, on every shelf): off shows "Coming soon" on the story shelves; on, each shelf\'s new stories unlock after its first stories are finished 3 times', vi: 'Truyện mới (bộ thứ hai, ở mọi kệ): tắt thì hiện "Sắp ra mắt" trên kệ truyện; bật thì truyện mới của mỗi kệ mở sau khi đọc xong các truyện đầu 3 lần', group: 'kids', def: false },
  // (r90, owner 23 Oct) unlock all games and stories
  { id: 'unlockAll', en: 'Unlock all games and stories: opens every game and story without needing 3 finishes (for testers and auto play; every device, or only the ticked ones)', vi: 'Mở tất cả trò chơi và truyện: mở mọi trò chơi và truyện mà không cần chơi xong 3 lần (cho người thử và tự chơi; mọi máy, hoặc chỉ các máy được chọn)', group: 'tools', def: false },
  { id: 'tester', en: 'Testers (devices that report problems by themselves, with the ladybird; every device, or only the ticked ones)', vi: 'Người thử (máy tự báo lỗi, có con bọ rùa; mọi máy, hoặc chỉ các máy được chọn)', group: 'tools', def: false },
  { id: 'traffic', en: 'Traffic on the roads', vi: 'Xe cộ trên đường', group: 'world', def: true },
  { id: 'cityVehicles', en: 'Vehicles in the cities (parked bikes and cars, tram, xích lô, Hồ Gươm cart)', vi: 'Xe trong thành phố (xe đậu, tàu điện, xích lô, xe điện Hồ Gươm)', group: 'world', def: true },
  { id: 'rideBikes', en: 'Bicycles children can ride', vi: 'Xe đạp cho các con đạp', group: 'world', def: true },
  { id: 'xichloRides', en: 'Xích lô rides', vi: 'Đi xích lô', group: 'world', def: true },
  { id: 'realVehicles', en: 'Real-looking vehicles for older children', vi: 'Xe như thật cho các con lớn', group: 'world', def: true },
  { id: 'powerPoles', en: 'Power poles and wires', vi: 'Cột điện và dây điện', group: 'world', def: false },
  { id: 'story_prologue', en: 'Story: The Lanterns Blow Away (prologue, companion)', vi: 'Truyện: Đèn Lồng Bay Mất (mở đầu, bạn đồng hành)', group: 'story', def: true },
  { id: 'story_ch1', en: 'Story chapter 1: Lotus Village', vi: 'Truyện chương 1: Làng Sen', group: 'story', def: true },
  { id: 'story_ch2', en: 'Story chapter 2: Hà Nội (Tèo\'s challenge, Văn Miếu, Cầu Thê Húc lights up, Trung Thu parade)', vi: 'Truyện chương 2: Hà Nội (Tèo thách đấu, Văn Miếu, Cầu Thê Húc sáng đèn, rước đèn Trung Thu)', group: 'story', def: true }, // (owner 10 Oct: off until an admin switches it on or schedules it)
  { id: 'story_ch3', en: 'Story chapter 3: Sydney (Chi\'s Aussie words, the ferries, cricket with Jack and Ruby, the Opera House lights up, fireworks)', vi: 'Truyện chương 3: Sydney (Chi dạy từ tiếng Úc, phà, chơi cricket với Jack và Ruby, Nhà hát Opera sáng đèn, pháo hoa)', group: 'story', def: true },
  { id: 'story_yard', en: 'Story: Bà Huệ and ông Nghi\'s yard (coach from Hà Tĩnh, dump truck, excavator, a house built together)', vi: 'Truyện: Công trường của bà Huệ và ông Nghi (xe khách từ Hà Tĩnh, xe ben, máy xúc, cùng xây nhà)', group: 'story', def: true },
  // (owner, 18 Oct AEDT: "stories film switch is not available on studio") js/tales.js, js/howto-player.js; also on Studio's Defaults page (Releases wins)
  { id: 'storyFilms', en: 'Stories and how-to guides as 3D films (where a film is made). Off: the tale opens as a picture book and the guide as pictures', vi: 'Truyện và hướng dẫn thành phim 3D (khi đã có phim). Tắt: truyện mở thành sách tranh và hướng dẫn thành tranh', group: 'story', def: true },
  // (round R, owner 9 Oct: "add these in and add to the studio so we can switch on/off") what keeps little ones playing
  { id: 'yardHands', en: 'The yard by hand: steer the dump truck, drag the excavator arm, stack the bricks', vi: 'Công trường tự tay làm: lái xe ben, kéo cần máy xúc, xếp gạch', group: 'kids', def: true },
  { id: 'simpleStart', en: 'Under-5s start on the Simple screen (until they choose)', vi: 'Bé dưới 5 tuổi bắt đầu ở màn hình Đơn giản (đến khi bé tự chọn)', group: 'kids', def: true },
  { id: 'storyActions', en: 'Story steps with something to do (catch the wind ribbons, lift the lotus leaves)', vi: 'Mỗi bước truyện có việc để làm (bắt dải lụa gió, lật lá sen)', group: 'kids', def: true },
  { id: 'companionGrow', en: 'The companion grows: feed it once a day, it learns tricks and looks new', vi: 'Bạn đồng hành lớn lên: cho ăn mỗi ngày, học trò mới, đổi dáng mới', group: 'kids', def: true },
  { id: 'shortTalk', en: 'Shorter speeches and a big Skip button on story films', vi: 'Lời nói ngắn hơn và nút Bỏ qua lớn trên phim truyện', group: 'kids', def: true },
  { id: 'dailySurprise', en: 'A surprise gift somewhere in the valley every day', vi: 'Mỗi ngày có một món quà bất ngờ trong thung lũng', group: 'kids', def: true },
  { id: 'saveGoal', en: 'A coin goal to save for (hats for the companion)', vi: 'Mục tiêu để dành tiền (mũ cho bạn đồng hành)', group: 'kids', def: true },
  // (round S, owner plan 8 Oct: Round R Part 2 items 6 and 10) the clothes shop, and for 5 to 8 year olds at Medium or Hard
  { id: 'shop', en: 'Clothes shop by the market and the wardrobe (two starting outfits; the Bag button goes to the shop)', vi: 'Cửa hàng quần áo cạnh chợ và tủ đồ (hai bộ đồ ban đầu; nút Ba lô đưa đến cửa hàng)', group: 'rewards', def: true },
  { id: 'mysteryBox', en: 'Mystery boxes: one free a day and one for a finished quest (5 to 8, Medium or Hard)', vi: 'Hộp bí ẩn: mỗi ngày một hộp và thêm một hộp khi xong nhiệm vụ (5 đến 8 tuổi, Vừa hoặc Khó)', group: 'rewards', def: true },
  { id: 'rankings', en: 'Family rankings: stars and quests, collections, kindness, learning (5 to 8, Medium or Hard)', vi: 'Bảng thành tích gia đình: sao và nhiệm vụ, bộ sưu tập, tốt bụng, học hỏi (5 đến 8 tuổi, Vừa hoặc Khó)', group: 'rewards', def: true },
  { id: 'collectibles', en: 'Collection book: fairies, dragons, stickers, decorations (5 to 8, Medium or Hard)', vi: 'Sổ sưu tập: nàng tiên, rồng, hình dán, đồ trang trí (5 đến 8 tuổi, Vừa hoặc Khó)', group: 'rewards', def: true },
  // (round S, owner plan 8 Oct: ROUND-R items 5, 9 and 11) the village festival, surprises and the grown-ups' features
  { id: 'hoilang', en: 'Village festival (Hội làng) three times a day: parade, crowd and a special prize', vi: 'Hội làng ba lần mỗi ngày: rước, đông vui và quà đặc biệt', group: 'kids', def: true },
  { id: 'surprises', en: 'Surprises (rainbow lotus, golden butterfly, treasure map, fairy glade, rare visitors…), up to 3 a visit', vi: 'Điều bất ngờ (sen cầu vồng, bướm vàng, bản đồ kho báu, rừng tiên, khách quý…), tối đa 3 lần mỗi lượt chơi', group: 'kids', def: true },
  { id: 'familyMissions', en: 'Family missions a grown-up writes and ticks', vi: 'Nhiệm vụ gia đình do người lớn viết và đánh dấu', group: 'kids', def: true },
  { id: 'weeklyNote', en: 'A weekly note for grown-ups', vi: 'Ghi chú hằng tuần cho người lớn', group: 'kids', def: true },
  { id: 'certCard', en: 'Certificate card with the stickers earned (save the picture)', vi: 'Thiệp khen với các hình dán đã nhận (lưu ảnh)', group: 'kids', def: true },
  { id: 'danceBreak', en: 'A dance break after 20 minutes of play', vi: 'Giờ nhảy múa sau 20 phút chơi', group: 'kids', def: true },
  { id: 'bedtime', en: 'Bedtime: the valley dims, lullabies, goodnight', vi: 'Giờ đi ngủ: thung lũng tối dần, hát ru, chúc ngủ ngon', group: 'kids', def: true },
  { id: 'birthday', en: 'A birthday surprise (birthday kept on the device only)', vi: 'Quà bất ngờ ngày sinh nhật (ngày sinh chỉ lưu trên máy)', group: 'kids', def: true },
  ...FESTCAL.map(F => ({ id: 'fest_' + F.id, en: F.en, vi: F.vi, group: 'festivals', def: true, icon: F.icon }))
];
export const RELEASE_GROUPS: Record<string, [string, string]> = { story: ['The lantern story', 'Truyện đèn lồng'], kids: ['For little ones', 'Cho các bé'], rewards: ['Shop and rewards', 'Cửa hàng và phần thưởng'], world: ['In the valley', 'Trong thung lũng'], festivals: ['Festivals', 'Lễ hội'], tools: ['For testing', 'Để thử'] };
// (Play reading trial, owner 11 Oct 2026 AEDT) the ten reading games: off until an admin switches them on
// (owner, 12 Oct AEDT: "all other features should be on for now until I say or switch it off"; only power poles and
// the auto play check stay off) the reading games and story chapters 2 and 3 are on unless Studio switches them off
RELEASES.push({ id: 'readingTrial', en: 'Reading games (trial): ten games in the Reading corner, in English or Vietnamese by the language setting', vi: 'Trò chơi tập đọc (thử nghiệm): mười trò ở Góc đọc, tiếng Anh hoặc tiếng Việt theo ngôn ngữ đã chọn', group: 'trial', def: true });
RELEASE_GROUPS.trial = ['Trials', 'Thử nghiệm'];
// (batch rollout, owner 13 Oct AEDT; docs/cores/FEATURES.md "Batch calendar") the Round U features and the festival hunt,
// one switch each, and each money game on its own. All start on; a start date still to come or Off hides one only from
// children who never used it (js/custom.js keptOn)
RELEASES.push(
  { id: 'rideAny', en: 'Ride any vehicle: drive the parked cars and motorbikes', vi: 'Đi mọi loại xe: lái xe hơi và xe máy đang đậu', group: 'world', def: true },
  { id: 'busFares', en: 'Buses, trams and taxis take a passenger for a fare; bus stops with a picture timetable', vi: 'Xe buýt, tàu điện và taxi chở khách có trả tiền vé; trạm xe buýt có bảng giờ bằng hình', group: 'world', def: true },
  { id: 'wayfind', en: 'Find a place: compass guidance (hidden until enabled)', vi: 'Tìm một nơi: la bàn chỉ đường (ẩn đến khi bật)', group: 'valley', def: false },
  { id: 'jobs', en: 'Village job boards: helping jobs for coins and a sticker', vi: 'Bảng việc làng: việc giúp đỡ được tiền và hình dán', group: 'valley', def: true },
  { id: 'villagerTalk', en: 'Every villager talks: a fact or a saying of their place', vi: 'Mọi người trong làng đều nói chuyện: kể điều hay hoặc câu nói của quê mình', group: 'valley', def: true },
  { id: 'dayPlan', en: 'Villagers\' day plan: they walk home at night, umbrellas in the rain', vi: 'Một ngày của dân làng: tối đi về nhà, trời mưa che ô', group: 'valley', def: true },
  { id: 'animalHomes', en: 'Animals with homes: hens to the coop, ducks together at night, the dog follows you', vi: 'Nhà của các con vật: gà vào chuồng, vịt tụ lại ban đêm, chó đi theo con', group: 'valley', def: true },
  { id: 'singers', en: 'Village singers on their little stages', vi: 'Ca sĩ làng trên sân khấu nhỏ', group: 'valley', def: true },
  { id: 'priceTags', en: 'Price pictures over the food stalls, and counting the change', vi: 'Bảng giá bằng hình trên các quầy ăn, và đếm tiền thối', group: 'valley', def: true },
  { id: 'sellersRemember', en: 'Sellers remember you and your favourite food', vi: 'Người bán hàng nhớ con và món con thích', group: 'valley', def: true },
  { id: 'houseGuide', en: 'House guide: how to earn, buy, place and upgrade. Off: the guide no longer opens at the house and the ❓ spot is gone', vi: 'Hướng dẫn ngôi nhà: kiếm tiền, mua, đặt đồ và nâng cấp. Tắt: hướng dẫn không tự mở ở nhà và điểm ❓ biến mất', group: 'explain', def: true },
  { id: 'owlGuide', en: 'Ông Cú as guide: one new thing explained each visit. Off: visiting Ông Cú no longer opens a lesson page', vi: 'Ông Cú chỉ đường: mỗi lần ghé ông giải thích một điều mới. Tắt: ghé Ông Cú không còn mở trang bài học', group: 'explain', def: true },
  { id: 'festHunt', en: 'Festival hunt: five festival things hidden in the last week and on the day', vi: 'Truy tìm lễ hội: năm món đồ lễ hội giấu trong tuần cuối và ngày lễ', group: 'festivals', def: true },
  { id: 'festDecoBig', en: 'Big festival decorations (5x) over the whole valley (off: as before, unless a festival sets its own)', vi: 'Trang trí lễ hội lớn (gấp 5) khắp thung lũng (tắt: như trước, trừ khi lễ hội tự chọn)', group: 'festivals', def: true },
  ...[['heodat', 'Piggy Bank', 'Heo Đất'], ['coinnote', 'Coin or Note?', 'Xu hay Tiền Giấy?'], ['needwant', 'Need or Want?', 'Cần hay Muốn?'],
    ['cheaper', 'Which Is Cheaper?', 'Món Nào Rẻ Hơn?'], ['lixi', 'Lucky Money Count', 'Đếm Lì Xì'], ['bahu', 'Three Jars', 'Ba Hũ'],
    ['shoplist', 'Shopping List', 'Danh Sách Đi Chợ'], ['waitgrow', 'Wait and Grow', 'Chờ Cây Lớn'], ['shopkeep', 'Little Shopkeeper', 'Bé Bán Hàng'],
    ['barter', 'Swap and Trade', 'Đổi Hàng']].map(([g, en, vi]) => ({ id: 'money_' + g, en: 'Money game: ' + en, vi: 'Trò chơi tiền: ' + vi, group: 'money', def: true, game: g }))
);
RELEASE_GROUPS.valley = ['The living valley', 'Thung lũng sống động'];
RELEASE_GROUPS.money = ['Money games', 'Trò chơi tiền'];

// (owner, 16 Oct AEDT: "all options to switch on/off one by one, each telling what will be switched off in the game";
// "short line and short voice, both in Vietnamese and English, both selectable in Studio") js/explain.js
RELEASE_GROUPS.explain = ['Explanations and tips', 'Lời giải thích và mẹo'];
RELEASES.push(
  { id: 'explain_hearts_note', en: 'Hearts: a short note when a child taps the hearts. Off: no note on screen (the spoken line is its own switch)', vi: 'Trái tim: một dòng ghi chú ngắn khi bé chạm vào trái tim. Tắt: không có ghi chú trên màn hình (lời nói có công tắc riêng)', group: 'explain', def: true },
  { id: 'explain_hearts_voice', en: 'Hearts: a short spoken line when a child taps the hearts. Off: tapping the hearts is silent (the note is its own switch)', vi: 'Trái tim: một câu nói ngắn khi bé chạm vào trái tim. Tắt: chạm vào trái tim không có tiếng (ghi chú có công tắc riêng)', group: 'explain', def: true },
  { id: 'explain_gift_note', en: 'Daily gift: a short note saying where today\'s gift is. Off: no note on screen; the gift is still there', vi: 'Quà mỗi ngày: một dòng ghi chú ngắn cho biết quà hôm nay ở đâu. Tắt: không có ghi chú; quà vẫn còn đó', group: 'explain', def: true },
  { id: 'explain_gift_voice', en: 'Daily gift: a short spoken line that a gift is waiting. Off: no spoken line; the gift is still there', vi: 'Quà mỗi ngày: một câu nói ngắn rằng có quà đang chờ. Tắt: không có lời nói; quà vẫn còn đó', group: 'explain', def: true },
  { id: 'explain_gameLine', en: 'Games: the question line at the top of a game (for example "How many can you count?"). Off: the line is hidden; the game still says it aloud', vi: 'Trò chơi: dòng câu hỏi ở đầu trò chơi (ví dụ "Có bao nhiêu nhỉ?"). Tắt: dòng chữ bị ẩn; trò chơi vẫn nói câu đó', group: 'explain', def: true },
  { id: 'explain_updateNotice', en: 'Update notice: a small note that a new version is ready, with an Update button. Off: no note; the new version starts the next time the game is opened', vi: 'Thông báo cập nhật: một ghi chú nhỏ khi có bản mới, có nút Cập nhật. Tắt: không có ghi chú; bản mới chạy ở lần mở trò chơi sau', group: 'explain', def: true },
  { id: 'explain_voiceAsk', en: 'Voice download question: on mobile data, asks a grown-up before downloading the rest of the voices. Off: no question; the rest of the voices download on Wi-Fi only', vi: 'Câu hỏi tải giọng đọc: khi dùng dữ liệu di động, hỏi người lớn trước khi tải phần giọng còn lại. Tắt: không hỏi; phần giọng còn lại chỉ tải khi có Wi-Fi', group: 'explain', def: true }
);

// (owner, 16 Oct AEDT: "show me and I will decide") the new family devices and photo sharing (owner points 39-45) is a
// trial, off until the owner switches it on
RELEASES.push({ id: 'familyDevices', en: 'Family devices and photo sharing (trial): connect the family\'s devices with a one-use code, and family photos on villagers reach every connected device. Off: the section is not shown in Grown-ups and no device contacts the family service, except tester devices, so it can be tried first', vi: 'Thiết bị gia đình và chia sẻ ảnh (thử nghiệm): kết nối các thiết bị trong nhà bằng mã dùng một lần, ảnh gia đình trên dân làng tới mọi thiết bị đã kết nối. Tắt: phần này không hiện trong mục Người lớn và không thiết bị nào liên lạc với dịch vụ gia đình, trừ thiết bị thử nghiệm để thử trước', group: 'trial', def: false });

/* daily adventure (chat C) */
// (owner plan, 16 Oct AEDT) one three-step adventure a day for each child, the goal card, the window, the week chest
// (js/adventure.js, js/content/adventures.js). Off: no goal card or adventure window; the Adventures tab is as before
RELEASES.push({ id: 'adventure', en: 'Daily adventure: one three-step adventure a day with a treasure chest, week stamps and a week chest. Off: no adventure card on the game screen and the Adventures tab shows its lists as before', vi: 'Phiêu lưu mỗi ngày: mỗi ngày một chuyến phiêu lưu ba bước có rương báu, con dấu trong tuần và rương cuối tuần. Tắt: không có thẻ phiêu lưu trên màn hình và mục Nhiệm vụ hiện danh sách như trước', group: 'kids', def: true });

// Sparkle Fruit Parade availability is independently controllable for children, friends, and testers.
RELEASES.push(
  { id: 'sparkleFruitParade_single', en: 'Sparkle Fruit Parade: single-player mode (off hides it from Play)', vi: 'Sparkle Fruit Parade: chế độ chơi đơn (tắt sẽ ẩn khỏi Vui chơi)', group: 'kids', def: false },
  { id: 'sparkleFruitParade_multi', en: 'Sparkle Fruit Parade: multiplayer mode (off hides it from Friends)', vi: 'Sparkle Fruit Parade: chế độ nhiều người (tắt sẽ ẩn khỏi Bạn bè)', group: 'kids', def: false },
  { id: 'sparkleFruitParade_tester', en: 'Sparkle Fruit Parade: tester preview (allows a tester to open it while child modes are off)', vi: 'Sparkle Fruit Parade: bản thử nghiệm (cho phép người thử mở trò khi các chế độ cho trẻ đang tắt)', group: 'tools', def: false }
);

// Orchard remains tester-only. Fruit Bar public modes serve all ages; preview still requires a tester.
for (const [id,en,vi] of [['sparkleorchard','Orchard Quest','Nhiệm vụ vườn quả'],['sparklefruitbar','Fruit Bar','Bảng trái cây']]) {
 RELEASES.push({id:id+'_tester',en:en+(id==='sparkleorchard'?': invited tester preview (works while tester modes are off; never opens for non-testers)':': enable invited tester preview only'),vi:vi+(id==='sparkleorchard'?': bản thử cho người thử được mời (dùng được khi các chế độ thử đang tắt; không mở cho người chưa thử)':': chỉ bật bản thử cho người thử được mời'),group:'tools',def:false},
 {id:id+'_single',en:en+(id==='sparklefruitbar'?': single-device play for everyone':': tester single-device play'),vi:vi+(id==='sparklefruitbar'?': mọi người chơi cùng máy':': người thử chơi cùng máy'),group:'tools',def:false},
 {id:id+'_multi',en:en+(id==='sparklefruitbar'?': online multiplayer for everyone':': tester online multiplayer'),vi:vi+(id==='sparklefruitbar'?': mọi người chơi nhiều máy':': người thử chơi nhiều máy'),group:'tools',def:false});
}
