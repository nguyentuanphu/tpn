// (v1.08d s2vn) How to play for the Season 2, Vietnam games (js/games/s2vn.ts), ready before a game opens: the guide
// film behind the TV button reads these steps aloud in English and Vietnamese, the game's own picture first.
import { HOWTO, type HowToGuide } from '../howto-registry.js';

const GUIDES: Record<string, [string, [string, string]][]> = {
  mk_sampan: [['s2g:sampan', ['Look at what the customer on the boat wants.', 'Nhìn xem khách trên ghe muốn mua gì.']], ['👆 ✅', ['Tap the basket with the right fruit.', 'Chạm vào giỏ có đúng trái cây đó.']], ['s2:coin', ['On the hardest levels, count the fruit and the coins.', 'Ở mức khó, con đếm số trái và số đồng tiền.']]],
  mk_caybeo: [['s2g:caybeo', ['Look at the top of the boat’s tall pole.', 'Nhìn lên ngọn cây sào cao trên ghe.']], ['👆 ✅', ['Tap what the boat sells.', 'Chạm vào thứ mà ghe đó bán.']], ['🛶', ['On the hardest levels, find the boat that sells the thing in the picture.', 'Ở mức khó, con tìm chiếc ghe bán đúng thứ trong tranh.']]],
  mk_count: [['s2g:count', ['Listen to which fruit the customer wants.', 'Nghe xem khách muốn trái gì.']], ['👆 ✅', ['Tap every one of that fruit on the boat.', 'Chạm vào tất cả trái đó trên ghe.']]],
  hl_cave: [['s2g:cave', ['Listen to the clue about the hidden cave.', 'Nghe gợi ý về hang động bí ẩn.']], ['👆 ✅', ['Tap the only island that matches the clue.', 'Chạm vào hòn đảo duy nhất đúng với gợi ý.']], ['⛵', ['Look for the boats, the birds, the trees and the tall islands.', 'Để ý thuyền, chim, cây và những hòn đảo cao.']]],
  hl_rocks: [['s2g:rocks', ['Look at the shape of the rock island.', 'Nhìn hình dáng của hòn đảo đá.']], ['👆 ✅', ['Tap the animal it looks like.', 'Chạm vào con vật mà nó trông giống.']], ['🐢', ['On the hardest levels, find the rock that looks like the animal.', 'Ở mức khó, con tìm hòn đá giống con vật được hỏi.']]],
  hl_nets: [['s2g:nets', ['Look at the fish in the fishing nets.', 'Nhìn những con cá trong lưới.']], ['👆 ✅', ['Tap the net with the most fish, or count the fish.', 'Chạm vào lưới nhiều cá nhất, hoặc đếm số cá.']], ['➕', ['On the hardest level, add the fish of two nets.', 'Ở mức khó nhất, con cộng cá của hai lưới.']]],
  sp_terrace: [['s2g:terrace', ['Look at the rice plants on each terrace.', 'Nhìn cây lúa trên từng thửa ruộng.']], ['👆 ✅', ['Tap the right terrace, or count the rice plants.', 'Chạm vào đúng thửa ruộng, hoặc đếm cây lúa.']]],
  sp_seasons: [['s2g:seasons', ['Look at how the terraces change through the year.', 'Nhìn ruộng bậc thang đổi màu qua các mùa.']], ['👆 ✅', ['Tap what comes next, or what is missing.', 'Chạm vào mùa tiếp theo, hoặc mùa còn thiếu.']]],
  sp_brocade: [['s2g:brocade', ['Look at the pattern on the blue cloth.', 'Nhìn hoa văn trên tấm vải chàm.']], ['👆 ✅', ['Tap the shape that comes next.', 'Chạm vào hình tiếp theo.']]],
  tn_gong: [['s2g:gong', ['Listen and watch the gongs ring one by one.', 'Nghe và nhìn từng chiếc chiêng vang lên.']], ['👆 ✅', ['Tap the gong that comes next.', 'Chạm vào chiếc chiêng đánh tiếp theo.']]],
  tn_nharong: [['s2g:nharong', ['Look at the nhà rông: one part is missing.', 'Nhìn nhà rông: còn thiếu một phần.']], ['👆 ✅', ['Tap the missing part.', 'Chạm vào phần còn thiếu.']]],
  tn_elephant: [['s2g:elephant', ['Look at the elephants and their bananas.', 'Nhìn các chú voi và chuối của chúng.']], ['👆 ✅', ['Tap the elephant with the most, or count the bananas.', 'Chạm vào chú voi nhiều chuối nhất, hoặc đếm chuối.']]]
};
for (const [id, steps] of Object.entries(GUIDES)) {
  const guide: HowToGuide = { steps: steps.map(([p, [en, vi]]) => ({ pic: p, en, vi })) };
  if (!HOWTO[id] || (HOWTO[id].steps || []).length <= 1) HOWTO[id] = guide;
}
