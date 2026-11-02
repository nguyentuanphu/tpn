// (v1.08 english, owner's plan 3 Nov 2026 AEDT, part C) How to play for the English corner's eight games, ready before a
// game opens (the guide film behind the TV button reads these steps aloud in both languages; recorded).
import { HOWTO, type HowToGuide } from '../howto-registry.js';
const S = (pic: string, en: string, vi: string) => ({ pic, en, vi });
const GUIDES: Record<string, HowToGuide> = {
  en_words: { steps: [S('👂 en:words', 'Listen to the English word.', 'Nghe một từ tiếng Anh.'), S('👀 🐱 🍎', 'Look at the pictures.', 'Nhìn các bức tranh.'), S('👆 ✅', 'Tap the picture of the word you heard.', 'Chạm vào tranh của từ con vừa nghe.')],
    real: S('🏠 🐶', 'For real: point at things at home and say their English names.', 'Thử thật: chỉ vào đồ vật trong nhà và nói tên tiếng Anh của chúng.') },
  en_listen: { steps: [S('👂 en:listen', 'Listen carefully: how many, and which one?', 'Nghe thật kỹ: bao nhiêu cái, và cái gì?'), S('👀 🐱 🐱', 'Look at the cards. Some show more, some are big or small.', 'Nhìn các thẻ. Có thẻ nhiều, có thẻ ít, có cái to, cái nhỏ.'), S('👆 ✅', 'Tap the card that shows what you heard.', 'Chạm vào thẻ đúng với điều con nghe.')] },
  en_say: { steps: [S('👂 en:say', 'Listen to the word.', 'Nghe từ được đọc.'), S('🗣️ 💬', 'Say it out loud, then tap I said it!', 'Đọc to từ đó, rồi chạm vào nút Con đã nói!'), S('👆 ✅', 'Match the word and its picture.', 'Ghép từ với bức tranh của nó.')] },
  en_abc: { steps: [S('🎵 en:abc', 'Sing the ABC song as the letters light up.', 'Hát bài ABC khi các chữ cái sáng lên.'), S('❓ 🔤', 'A letter goes missing. Which one is it?', 'Một chữ cái bị mất. Đó là chữ nào?'), S('👆 🍎', 'Tap it, and hear a word that starts with it.', 'Chạm vào chữ đó và nghe một từ bắt đầu bằng chữ ấy.')],
    real: S('📚 🔤', 'For real: sing the ABC song with a grown-up and point at each letter in a book.', 'Thử thật: hát bài ABC cùng người lớn và chỉ vào từng chữ trong sách.') },
  en_count: { steps: [S('🎵 en:count', 'Sing the counting song.', 'Hát bài hát đếm số.'), S('👆 🦆', 'Tap each one and count in English: one, two, three!', 'Chạm vào từng cái và đếm bằng tiếng Anh: one, two, three!'), S('🔢 ✅', 'Tap the number word.', 'Chạm vào chữ số đúng.')],
    real: S('🍎 🍌', 'For real: count your fruit in English before you eat it.', 'Thử thật: đếm hoa quả bằng tiếng Anh trước khi ăn nhé.') },
  en_sentence: { steps: [S('👂 en:sentence', 'Listen to the sentence: I see a cat.', 'Nghe câu nói: I see a cat.'), S('🤔 ❓', 'Find the missing word.', 'Tìm từ còn thiếu.'), S('👆 💬', 'Bigger kids put all the words in order.', 'Các bạn lớn hơn xếp tất cả các từ theo thứ tự.')] },
  en_greet: { steps: [S('👀 en:greet', 'Look at what is happening.', 'Xem chuyện gì đang xảy ra.'), S('🤔 💬', 'What do you say? Hello, please, thank you or sorry?', 'Con sẽ nói gì? Xin chào, làm ơn, cảm ơn hay xin lỗi?'), S('👆 ✅', 'Tap the right words.', 'Chạm vào câu đúng.')],
    real: S('👋 😊', 'For real: say hello and thank you in English to your family today.', 'Thử thật: hôm nay nói xin chào và cảm ơn bằng tiếng Anh với cả nhà nhé.') },
  en_colshape: { steps: [S('👂 en:colshape', 'Listen to the colour and the shape.', 'Nghe tên màu và tên hình.'), S('👀 ⭐', 'Look for it: is it big or small?', 'Tìm hình đó: to hay nhỏ?'), S('👆 ✅', 'Tap it!', 'Chạm vào hình đó!')],
    real: S('🏠 🔴', 'For real: find something red and something round at home.', 'Thử thật: tìm trong nhà một thứ màu đỏ và một thứ hình tròn.') }
};
for (const [id, guide] of Object.entries(GUIDES)) if (!HOWTO[id] || (HOWTO[id].steps || []).length <= 1) HOWTO[id] = guide;
