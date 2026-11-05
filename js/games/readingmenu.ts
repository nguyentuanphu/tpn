// (Play reading trial, owner 11 Oct 2026 AEDT; brief docs/cores/tasks/play-reading.md) The ten reading games' names,
// pictures and how-to cards. js/main.js loads this file only while Studio's `readingTrial` switch is on, so with the
// switch off none of the trial is downloaded or shown; the games themselves (js/games/reading.js) and their words
// (js/content/reading.js) load when one opens. Their area and ages are in js/content/activities.js ("Reading corner").
import { register, GAMES } from './registry.js';
import { HOWTO } from '../howto.js';
import { T } from '../i18n.js';
import { GAME_INFO } from '../content/activities.js';

const S = (pic, en, vi) => ({ pic, en, vi });
const game = def => register({ ...def, async run(api) { const m = await import('./reading.js'); return m.play(def.id, api); } });

game({ id: 'rd_listentouch', icon: '👂', name: () => T('Listen and Touch', 'Nghe và Chạm') });
game({ id: 'rd_storychoice', icon: '📖', name: () => T('Story Choices', 'Chọn Trong Truyện') });
game({ id: 'rd_trace', icon: '🏮', name: () => T('Lantern Letters', 'Đèn Lồng Chữ Cái') });
game({ id: 'rd_sounds', icon: '🐟', name: () => T('Sound Pond', 'Ao Âm Thanh') });
game({ id: 'rd_build', icon: '🧩', name: () => T('Word Builder', 'Ghép Chữ') });
game({ id: 'rd_rhyme', icon: '🎵', name: () => T('Rhyme Time', 'Tìm Vần') });
game({ id: 'rd_sight', icon: '🎈', name: () => T('Word Balloons', 'Bóng Bay Chữ') });
game({ id: 'rd_tones', icon: '🎤', name: () => T('Tone Marks', 'Dấu Thanh') });
game({ id: 'rd_syllable', icon: '🥁', name: () => T('Syllable Drum', 'Trống Đếm Tiếng') });
game({ id: 'rd_match', icon: '🖼️', name: () => T('Word and Picture', 'Chữ và Hình') });
game({ id: 'rd_sentence', icon: '🚂', name: () => T('Sentence Train', 'Tàu Câu') });
game({ id: 'rd_readalong', icon: '📖', name: () => T('Read With Me', 'Cùng Đọc') });
// (r90) the twelve new reading games (js/games/reading2.ts) belong to the same trial: registered here, so with the
// switch off they are neither listed nor downloaded; their code loads when one opens (it registers the real game).
const game2 = def => { const lazy = async api => { await import('./reading2.js'); const run = GAMES[def.id]?.run; if (!run || run === lazy) throw new Error('Game implementation unavailable: ' + def.id); return run(api); }; register({ ...def, run: lazy }); };
game2({ id: 'rd_blend', icon: '🔤', name: () => T('Blend the Sounds', 'Ghép Âm') });
game2({ id: 'rd_hats', icon: '🎩', name: () => T('Vowel Hats', 'Mũ Cho Chữ') });
game2({ id: 'rd_endings', icon: '🔚', name: () => T('Word Endings', 'Vần Cuối') });
game2({ id: 'rd_compound', icon: '🧩', name: () => T('Two Words Make One', 'Ghép Hai Từ') });
game2({ id: 'rd_labels', icon: '🏷️', name: () => T('Label the Picture', 'Gắn Tên Cho Tranh') });
game2({ id: 'rd_signs', icon: '🚸', name: () => T('Signs in Town', 'Biển Báo Trong Phố') });
game2({ id: 'rd_questions', icon: '❓', name: () => T('Who, What, Where', 'Ai, Gì, Ở Đâu') });
game2({ id: 'rd_many', icon: '🔢', name: () => T('One and Many', 'Một và Nhiều') });
game2({ id: 'rd_caps', icon: '🔠', name: () => T('Big and Small Letters', 'Chữ Hoa Chữ Thường') });
game2({ id: 'rd_poem', icon: '📜', name: () => T('Read a Little Poem', 'Đọc Bài Thơ Nhỏ') });
game2({ id: 'rd_missing', icon: '🧩', name: () => T('Missing Letter', 'Điền Chữ Còn Thiếu') });
game2({ id: 'rd_book', icon: '📖', name: () => T('Make a Little Book', 'Làm Sách Nhỏ') });

// (owner, 18 Oct AEDT) read a page, help in the picture, read on (js/games/storyhelp.ts; for 2 to 8)
register({ id: 'rd_storyhelp', icon: '🏡', name: () => T('Story Helpers', 'Cùng Giúp Trong Truyện'), async run(api) { const m = await import('./storyhelp.js'); return m.play(api); } });

// their place in the one activity list (UI-005): [area, youngest age, how hard]; Word Balloons, Word and Picture and
// Sentence Train are for 5 to 8 only (A11Y-006)
Object.assign(GAME_INFO, {
  rd_listentouch: ['reading', 2, 1], rd_storychoice: ['reading', 3, 1],
  rd_trace: ['reading', 2, 1], rd_sounds: ['reading', 3, 1], rd_build: ['reading', 4, 2], rd_rhyme: ['reading', 4, 2], rd_sight: ['reading', 5, 2],
  rd_tones: ['hv_vi', 4, 2], // (v1.08b games) Vietnamese tone marks: Tiếng Việt rd_syllable: ['reading', 3, 1], rd_match: ['reading', 5, 2], rd_sentence: ['reading', 5, 3], rd_readalong: ['reading', 3, 1], rd_storyhelp: ['reading', 2, 1]
});

// the how-to cards (ACT-002), read aloud in the child's language
Object.assign(HOWTO, {
  rd_listentouch: { steps: [S('👂', 'Listen to a word.', 'Nghe một tiếng.'), S('👆', 'Touch its picture; tap the ear to listen again.', 'Chạm tranh của tiếng đó; chạm tai để nghe lại.')] },
  rd_storychoice: { steps: [S('📖', 'Listen to the short story.', 'Nghe truyện ngắn.'), S('👆', 'Choose the picture that helps.', 'Chọn tranh giúp được nhân vật.')] },
  rd_trace: { steps: [S('👀 🏮', 'Look at the big letter on the lantern.', 'Nhìn chữ cái to trên đèn lồng.'), S('👆 ✨', 'Trace it with your finger along the glowing dots.', 'Dùng ngón tay tô theo các chấm sáng.'), S('🏮 🎉', 'The lantern lights up and says the letter and its sound!', 'Đèn lồng sáng lên và đọc chữ cái cùng âm của nó!')] },
  rd_sounds: { steps: [S('👂 🐟', 'Listen to the sound.', 'Nghe âm.'), S('👆 🐟', 'Catch the fish that carries that letter.', 'Bắt chú cá mang chữ cái đó.'), S('🐟 🎉', 'Catch them all to win!', 'Bắt hết cá là thắng!')] },
  rd_build: { steps: [S('👀 🐱', 'Look at the picture.', 'Nhìn tranh.'), S('👆 🧩', 'Put the letters on the picture to make its word. Each letter says its sound.', 'Đặt các chữ lên tranh để ghép thành tiếng. Mỗi chữ đọc âm của nó.'), S('👂 🎉', 'Then hear the sounds blend into the word!', 'Rồi nghe các âm ghép lại thành tiếng!')] },
  rd_rhyme: { steps: [S('👂 🐱 🎩', 'Listen to two words.', 'Nghe hai tiếng.'), S('👍 ❌', 'Do they rhyme? Words that rhyme sound the same at the end.', 'Chúng có cùng vần không? Cùng vần là nghe giống nhau ở cuối.'), S('👆 🎵', 'Big kids find the word that rhymes.', 'Các bạn lớn tìm tiếng cùng vần.')] },
  rd_sight: { steps: [S('👂 🎈', 'Listen to the word.', 'Nghe chữ.'), S('👆 🎈', 'Pop the balloon with that word.', 'Bấm vỡ quả bóng có chữ đó.'), S('🎈 🎉', 'The balloons float slowly. Take your time!', 'Bóng bay chầm chậm. Cứ từ từ nhé!')] },
  rd_tones: { steps: [S('👂 🎤', 'Listen carefully to the word.', 'Nghe thật kỹ tiếng.'), S('👆 ✏️', 'Tap the word you hear, or the mark it needs.', 'Chạm vào tiếng con nghe thấy, hoặc dấu mà tiếng cần.'), S('🎤 🎉', 'Say it with me!', 'Cùng đọc theo nhé!')] },
  rd_syllable: { steps: [S('👀 🍌', 'Look at the picture and listen to its word.', 'Nhìn tranh và nghe tiếng của nó.'), S('👆 🥁', 'Beat the drum once for each part of the word.', 'Gõ trống một lần cho mỗi tiếng.'), S('✋ 🎉', 'Stop, and we count the beats together!', 'Dừng lại, rồi mình cùng đếm số lần gõ!')] },
  rd_match: { steps: [S('👀 ✏️', 'Read the word.', 'Đọc chữ.'), S('👆 🖼️', 'Tap its picture.', 'Chạm vào tranh của chữ đó.'), S('🖼️ ✏️', 'On Hard, find the word for the picture.', 'Ở mức Khó, tìm chữ cho bức tranh.')] },
  rd_sentence: { steps: [S('👀 🚂', 'Look at the word carriages.', 'Nhìn các toa chữ.'), S('👆 🚂', 'Tap them in order to make a sentence.', 'Chạm theo thứ tự để thành một câu.'), S('👂 🎉', 'Then the train reads your sentence!', 'Rồi đoàn tàu đọc câu của con!')] },
  rd_storyhelp: { steps: [S('📖 👂', 'Listen to the story. Each word lights up.', 'Nghe kể chuyện. Mỗi chữ sáng lên.'), S('👆 🧹', 'Help in the picture: drag things where they belong, or tap a thing and then its place.', 'Giúp trong tranh: kéo đồ vật về đúng chỗ, hoặc chạm vào đồ vật rồi chạm vào chỗ của nó.'), S('📖 🎉', 'Then the story goes on!', 'Rồi câu chuyện lại tiếp tục!')] },
  rd_readalong: { steps: [S('📖 👂', 'Listen as the story is read. Each word lights up.', 'Nghe đọc truyện. Mỗi chữ sáng lên.'), S('👆 ✏️', 'Tap any word to hear it again.', 'Chạm vào chữ nào để nghe lại chữ đó.'), S('❓ 🖼️', 'At the end, answer with a picture.', 'Cuối truyện, trả lời bằng một bức tranh.')] }
});
