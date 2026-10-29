// The activity catalogue and spoken instructions are ready before any game opens.
import { GAME_INFO } from '../content/activities.js';
import { HOWTO } from '../howto.js';
GAME_INFO.rulefinder = ['thinking', 3, 1]; GAME_INFO.gardenorder = ['thinking', 3, 1]; GAME_INFO.steppingpath = ['thinking', 4, 2];
export const instructions = {
  rulefinder: [['Look at the examples. Choose another picture that follows their rule.', 'Nhìn các ví dụ. Chọn thêm hình theo cùng quy luật.']],
  gardenorder: [['Put the little story in order. Choose what happens first, then what happens next.', 'Xếp câu chuyện nhỏ theo thứ tự. Chọn việc xảy ra trước, rồi việc tiếp theo.']],
  steppingpath: [['Follow neighbouring flowers to reach the flag. Avoid the puddles.', 'Theo những bông hoa cạnh nhau đến lá cờ. Tránh vũng nước.']]
};
// (audit, 29 Oct 2026 AEDT) only when js/howto-data2.ts has not already given the full guide
for (const [id, lines] of Object.entries(instructions)) if (!HOWTO[id]) HOWTO[id] = { steps: lines.map(([en, vi]) => ({ pic: '🧩', en, vi })) };

export const REASON_INTRO = {
  patternpicnic: ['Listen and look at the pattern. Choose the picture that comes next.', 'Nghe và nhìn quy luật. Chọn hình tiếp theo.'],
  shapebuilders: ['Build the picture. Choose a shape, then tap its matching outline. You can drag the shape there too.', 'Ghép bức tranh. Chọn hình khối rồi chạm vào nét viền giống hình đó. Con cũng có thể kéo hình vào đó.'],
  remembergarden: ['Look at the garden pictures. Put them back in the same order. You can see them again whenever you need.', 'Nhìn các hình trong vườn. Chọn lại theo đúng thứ tự. Con có thể xem lại bất cứ lúc nào.']
};
for (const [id, words] of Object.entries(REASON_INTRO)) {
  GAME_INFO[id] = ['thinking', 3, 2]; if (!HOWTO[id]) HOWTO[id] = { steps: [{ pic: '🧩', en: words[0], vi: words[1] }] };
}

GAME_INFO.sayfind = ['words', 3, 1]; GAME_INFO.marketcount = ['numbers', 3, 1]; GAME_INFO.soundhunt = ['words', 4, 2];
// (feelings keeps its place: Me and my family, for everyone)
export const TALK_INTRO = {
  sayfind: ['Listen to the word, then tap its picture. You can also say the word.', 'Nghe từ rồi chạm vào hình. Con cũng có thể nói từ đó.'],
  marketcount: ['Put the fruit in the basket. We count each one together.', 'Bỏ trái cây vào giỏ. Mình cùng đếm từng quả nhé.'],
  feelings: ['Listen to the little story. Tap the face that shows how Lá feels.', 'Nghe câu chuyện nhỏ. Chạm vào khuôn mặt cho thấy Lá cảm thấy thế nào.'],
  soundhunt: ['Listen to the sound. Tap every picture that sounds the same.', 'Nghe âm. Chạm vào mọi hình có âm giống vậy.']
};
for (const [id, [en, vi]] of Object.entries(TALK_INTRO)) if (!HOWTO[id]) HOWTO[id] = { steps: [{ pic: '👂', en, vi }] };

