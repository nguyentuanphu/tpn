// Học vui (Fun learning), phase 1 of the owner's plan (1 Nov 2026 AEDT, docs/learn-tab/PLAN.md): one tab in Play and
// four areas on the Simple screen, the four corners Tiếng Việt, English, Maths and Science. The new games live in their
// corner (js/content/activities.ts GAME_INFO). Existing games keep their own home tab and are LINKED into a corner too:
// the Play hub lists every game in exactly one tab (the `hubmap` check), so a corner shows a link tile that opens the
// game where it is, and the game is never moved or taken away from where children already find it.
// No imports here except the words' language: tools/make-voice-pack.mts reads hocvuiLines() to record every syllable.

/** the four corners, in the order they are shown (keys are areas in js/content/activities.ts) */
export const CORNERS = ['hv_vi', 'hv_en', 'hv_math', 'hv_sci'] as const;
export type Corner = typeof CORNERS[number];

/** existing games linked into a corner (they stay in their own tab and area) */
export const CORNER_LINKS: Record<Corner, string[]> = {
  // Vietnamese words of the three regions, and the Vietnamese alphabet with ă â đ ê ô ơ ư when played in Tiếng Việt
  hv_vi: ['words', 'letters'],
  // the owner's list: phonics, first words, opposites and the reading corner's games (when Studio's reading switch is on)
  hv_en: ['phonics', 'firstwords', 'opposites', 'rd_listentouch', 'rd_storychoice', 'rd_trace', 'rd_sounds', 'rd_build', 'rd_rhyme', 'rd_sight', 'rd_tones', 'rd_syllable', 'rd_match', 'rd_sentence', 'rd_readalong',
    'rd_blend', 'rd_hats', 'rd_endings', 'rd_compound', 'rd_labels', 'rd_signs', 'rd_questions', 'rd_many', 'rd_caps', 'rd_poem', 'rd_missing', 'rd_book', 'rd_storyhelp'],
  // counting, adding and taking away, the number line and the numbers games; comparing and time from the plan
  hv_math: ['counting', 'sums', 'numline', 'tenframe', 'dice', 'evenodd', 'measure', 'beforeafter', 'halves', 'moreless', 'clock'],
  hv_sci: []
};
/** is this game shown in this corner as a link (not its own area)? */
export const linkedIn = (area: string, id: string): boolean => !!(CORNER_LINKS as Record<string, string[]>)[area]?.includes(id);

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
