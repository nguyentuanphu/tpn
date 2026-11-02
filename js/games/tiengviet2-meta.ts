// (v1.08 vietnamese, owner's plan 3 Nov 2026 AEDT) How to play for the ten new Tiếng Việt games (js/games/tiengviet2.ts),
// ready before a game opens: the guide film on the TV button reads these steps aloud in both languages (recorded).
import { HOWTO, type HowToGuide } from '../howto-registry.js';
const S = (pic: string, en: string, vi: string) => ({ pic, en, vi });
const GUIDES: Record<string, HowToGuide> = {
  vi_tonemean: { steps: [S('👂 vi:tonemean', 'Listen to the word: cá, cà or ca?', 'Nghe tiếng được đọc: cá, cà hay ca?'), S('👆 🐟', 'Tap the picture of the word you heard.', 'Chạm vào tranh của tiếng con nghe thấy.'), S('💡 tone:1 tone:2', 'A different tone mark makes a different word!', 'Đổi dấu thanh là thành tiếng khác, nghĩa khác!')] },
  vi_rhyme: { steps: [S('👂 🐱', 'Listen to the word and look at its rhyme.', 'Nghe tiếng này và nhìn vần của nó.'), S('👆 vi:rhyme', 'Tap the word that has the same rhyme.', 'Chạm vào tiếng có vần giống như vậy.'), S('🎉 🍬', 'Mèo and kẹo: the same rhyme, eo!', 'Mèo và kẹo: cùng vần eo!')] },
  vi_letters: { steps: [S('👂 🌙', 'Listen to the word and look for the missing letter.', 'Nghe tiếng này và tìm chữ cái còn thiếu.'), S('👆 vi:letters', 'Tap the right letter: a, ă or â?', 'Chạm vào chữ cái đúng: a, ă hay â?'), S('🎉 ✅', 'Hear the letter and the whole word.', 'Nghe chữ cái và cả tiếng nhé.')] },
  vi_opposite: { steps: [S('👀 vi:opposite', 'Look at the word cards.', 'Nhìn các thẻ từ.'), S('👆 🐘', 'Tap a word, then the word that means the opposite.', 'Chạm một từ, rồi chạm từ có nghĩa ngược lại.'), S('🎉 🐭', 'Match every pair to finish the board.', 'Nối hết các cặp là xong bảng.')] },
  vi_cadao: { steps: [S('👂 vi:cadao', 'Listen to the folk rhyme with one word missing.', 'Nghe câu ca dao còn thiếu một từ.'), S('👆 🎋', 'Tap the picture of the missing word.', 'Chạm vào tranh của từ còn thiếu.'), S('💡 📖', 'Hear the whole rhyme and what it means.', 'Nghe cả câu và ý nghĩa của nó.')] },
  vi_tucngu: { steps: [S('👀 vi:tucngu', 'Read or listen to the saying.', 'Đọc hoặc nghe câu tục ngữ.'), S('👆 🐢', 'Tap the picture that finishes it.', 'Chạm vào hình điền vào chỗ trống.'), S('💡 ❤️', 'Hear what the saying teaches us.', 'Nghe câu tục ngữ dạy mình điều gì.')] },
  vi_readalong: { steps: [S('👂 vi:readalong', 'Listen to the sentence.', 'Nghe cả câu được đọc.'), S('👆 📖', 'Tap each word as it is read.', 'Chạm vào từng tiếng khi được đọc.'), S('🎉 ✅', 'Read the whole sentence together!', 'Cùng đọc cả câu nào!')] },
  vi_sentence: { steps: [S('👀 vi:sentence', 'Look at the picture and the word cards.', 'Nhìn tranh và các thẻ từ.'), S('👆 🏫', 'Tap the words in order to make a sentence.', 'Chạm các tiếng theo thứ tự để thành câu.'), S('👂 🎉', 'Hear the sentence you made!', 'Nghe câu con vừa đặt!')] },
  vi_dictation: { steps: [S('👂 vi:dictation', 'Listen to the word.', 'Nghe tiếng được đọc.'), S('👆 🐟', 'Tap its letters in order.', 'Chạm vào các chữ cái theo thứ tự.'), S('💡 tone:1', 'Listen for the tone mark too!', 'Nghe kỹ cả dấu thanh nhé!')] },
  vi_riddle: { steps: [S('👂 vi:riddle', 'Listen to the folk riddle.', 'Nghe câu đố dân gian.'), S('🤔 🐰', 'Think: what could it be?', 'Suy nghĩ xem: đó là gì nhỉ?'), S('👆 ✅', 'Tap the picture of the answer.', 'Chạm vào tranh của câu trả lời.')] }
};
for (const [id, guide] of Object.entries(GUIDES)) if (!HOWTO[id] || (HOWTO[id].steps || []).length <= 1) HOWTO[id] = guide;
