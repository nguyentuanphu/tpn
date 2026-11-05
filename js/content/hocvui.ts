// Học vui (Fun learning), the owner's plan (1 Nov 2026 AEDT, docs/learn-tab/PLAN.md). (v1.08b games, owner 3 Nov 2026
// AEDT: "each game belongs to the category it fits and should not be reused") Học and Học vui are one tab now, and every
// game lives in one corner only (js/content/activities.ts GAME_INFO and LEARN_CORNERS); the link tiles are gone.
// No imports here except the words' language: tools/make-voice-pack.mts reads hocvuiLines() to record every syllable.

/** the subject corners that are Học vui's own areas (the tab also holds Toán, Hình khối, Tiền, Chữ và đọc, Em và gia đình) */
export const CORNERS = ['hv_vi', 'hv_en', 'hv_sci'] as const;
export type Corner = typeof CORNERS[number];

// ---------- Tiếng Việt: the six tones ----------
// index 0 ngang (no mark), 1 sắc, 2 huyền, 3 hỏi, 4 ngã, 5 nặng; each family is one syllable with the six marks
export const TONE_NAMES: [string, string][] = [['no mark', 'không dấu'], ['rising', 'sắc'], ['falling', 'huyền'], ['dipping', 'hỏi'], ['broken', 'ngã'], ['heavy', 'nặng']];
export const TONE_MARKS = ['', '́', '̀', '̉', '̃', '̣'];
export const TONE_FAMILIES: string[][] = [
  ['ma', 'má', 'mà', 'mả', 'mã', 'mạ'], ['ba', 'bá', 'bà', 'bả', 'bã', 'bạ'], ['be', 'bé', 'bè', 'bẻ', 'bẽ', 'bẹ'],
  ['la', 'lá', 'là', 'lả', 'lã', 'lạ'], ['co', 'có', 'cò', 'cỏ', 'cõ', 'cọ'], ['me', 'mé', 'mè', 'mẻ', 'mẽ', 'mẹ'], ['bo', 'bó', 'bò', 'bỏ', 'bõ', 'bọ']
];
// two-syllable words for Talent: the word heard, and three spellings that differ from it only by a tone mark
export const TONE_WORDS: string[][] = [
  ['cá vàng', 'cà vàng', 'cá vang', 'cả vàng'], ['bánh mì', 'bánh mí', 'bành mì', 'bạnh mì'], ['con gà', 'con gá', 'còn gà', 'con ga'],
  ['mèo con', 'mẹo con', 'meo con', 'mèo cón'], ['bà nội', 'ba nội', 'bà nồi', 'bá nội'], ['cây dừa', 'cây dứa', 'cấy dừa', 'cây dửa'],
  ['quả na', 'quà na', 'quả ná', 'qua na'], ['trời mưa', 'trời múa', 'trởi mưa', 'trời mứa']
];

// ---------- Tiếng Việt: building a syllable (consonant + rhyme + tone) ----------
// each rhyme with its six tone forms (the mark sits where Vietnamese schools put it)
export const RHYMES: Record<string, string[]> = {
  a: ['a', 'á', 'à', 'ả', 'ã', 'ạ'], o: ['o', 'ó', 'ò', 'ỏ', 'õ', 'ọ'], e: ['e', 'é', 'è', 'ẻ', 'ẽ', 'ẹ'], ơ: ['ơ', 'ớ', 'ờ', 'ở', 'ỡ', 'ợ'],
  eo: ['eo', 'éo', 'èo', 'ẻo', 'ẽo', 'ẹo'], oa: ['oa', 'oá', 'oà', 'oả', 'oã', 'oạ'], ây: ['ây', 'ấy', 'ầy', 'ẩy', 'ẫy', 'ậy'], oi: ['oi', 'ói', 'òi', 'ỏi', 'õi', 'ọi'],
  âu: ['âu', 'ấu', 'ầu', 'ẩu', 'ẫu', 'ậu'], ưa: ['ưa', 'ứa', 'ừa', 'ửa', 'ữa', 'ựa'], ưng: ['ưng', 'ứng', 'ừng', 'ửng', 'ững', 'ựng'], am: ['am', 'ám', 'àm', 'ảm', 'ãm', 'ạm'],
  uôi: ['uôi', 'uối', 'uồi', 'uổi', 'uỗi', 'uội'], em: ['em', 'ém', 'èm', 'ẻm', 'ẽm', 'ẹm']
};
// [the word, its picture, its consonant, its rhyme, its tone, what it means in English, how hard (1 single letters,
// 2 a longer rhyme, 3 two-letter consonants and the c / k spelling rule)]
export type BuildWord = [string, string, string, string, number, string, number];
export const BUILD_WORDS: BuildWord[] = [
  ['cá', '🐟', 'c', 'a', 1, 'fish', 1], ['gà', '🐔', 'g', 'a', 2, 'chicken', 1], ['bò', '🐄', 'b', 'o', 2, 'cow', 1], ['lá', '🍃', 'l', 'a', 1, 'leaf', 1],
  ['xe', '🚗', 'x', 'e', 0, 'car', 1], ['cờ', '🚩', 'c', 'ơ', 2, 'flag', 1], ['mèo', '🐱', 'm', 'eo', 2, 'cat', 2], ['hoa', '🌸', 'h', 'oa', 0, 'flower', 2],
  ['voi', '🐘', 'v', 'oi', 0, 'elephant', 2], ['cam', '🍊', 'c', 'am', 0, 'orange', 2], ['gấu', '🐻', 'g', 'âu', 1, 'bear', 2], ['cây', '🌳', 'c', 'ây', 0, 'tree', 2],
  ['nhà', '🏠', 'nh', 'a', 2, 'house', 3], ['chó', '🐶', 'ch', 'o', 1, 'dog', 3], ['thỏ', '🐰', 'th', 'o', 3, 'rabbit', 3], ['ngựa', '🐴', 'ng', 'ưa', 5, 'horse', 3],
  ['trứng', '🥚', 'tr', 'ưng', 1, 'egg', 3], ['sữa', '🥛', 's', 'ưa', 4, 'milk', 3], ['chuối', '🍌', 'ch', 'uôi', 1, 'banana', 3], ['kẹo', '🍬', 'k', 'eo', 5, 'sweet', 3],
  ['kem', '🍦', 'k', 'em', 0, 'ice cream', 3]
];
export const ONSETS = ['b', 'c', 'k', 'g', 'h', 'l', 'm', 'n', 'v', 'x', 's', 't', 'đ', 'nh', 'ch', 'th', 'tr', 'ng', 'kh', 'ph'];

/** every Vietnamese word the two Tiếng Việt games say on its own (recorded into the voice pack by
 *  tools/make-voice-pack.mts; none has a name in it) */
export function hocvuiLines(): { lang: string; text: string }[] {
  const out: { lang: string; text: string }[] = [], seen = new Set<string>(), add = (text: string) => { if (text && !seen.has(text)) { seen.add(text); out.push({ lang: 'vi', text }); } };
  for (const f of TONE_FAMILIES) f.forEach(add);
  for (const w of TONE_WORDS) add(w[0]);
  for (const w of BUILD_WORDS) add(w[0]);
  return out;
}
