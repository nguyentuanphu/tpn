// Bilingual text. Strings are written inline as T('English', 'Tiếng Việt') so the two
// languages always travel together.
import { settings } from './state.js';
import { events } from './core/events.js';
import { CUSTOM, customName } from './custom.js';

// NAMES (owner's rule, 9 Oct, round R): people's titles follow the chosen language and their given names stay as they
// are in their own region: in English "Bà Hai" is "Grandma Hai", in Vietnamese "Mrs Kelly" is "Cô Kelly". A name that
// is really a word (an animal, a thing, a nickname) is translated so an English-speaking child understands it:
// "Ông Cú" is "Grandpa Owl", "Ông Bầu" the talking gourd is "Grandpa Gourd", "Bác Gấu" is "Mr. Bear", "Mây Cau Có" is
// "Grumpy Cloud", the companions "Lấp Lánh" and "Rồng con" are "Sparkle" and "Little Dragon". Real places keep their
// names (Hà Nội, Sydney); the valley's own places are translated (Làng Sen is Lotus Village). Dishes keep their
// Vietnamese name with a few English words saying what it is ("bánh xèo, a crispy pancake"), said by the Vietnamese
// voice. Grown-ups can also rename any character (settings.npcNames), per language.
const NAMES_EN = {
  'Ông Cú': 'Grandpa Owl', 'Ông Bầu': 'Grandpa Gourd', 'Lấp Lánh': 'Sparkle', 'Rồng con': 'Little Dragon', 'Anh 2': 'Big Brother Hai', 'Anh Bảy': 'Big Brother Bảy', 'Anh Quân': 'Big Brother Quân', 'Chú Hùng': 'Uncle Hùng', 'Chú Sơn Diệu': 'Uncle Sơn Diệu', 'Chú Sơn Cường': 'Uncle Sơn Cường', 'Chị Huyền': 'Big Sister Huyền', 'Anh Trọng': 'Big Brother Trọng', 'Mây Cau Có': 'Grumpy Cloud', 'Cô Mai': 'Auntie Mai', 'Bác Ba': 'Uncle Ba',
  'Cô Sáu': 'Auntie Sáu', 'Chú Tư': 'Uncle Tư', 'Anh Tuấn': 'Big Brother Tuấn', 'Bà Hai': 'Grandma Hai', 'Cô Thu': 'Auntie Thu',
  'O Lài': 'Auntie Lài', 'Chú Năm': 'Uncle Năm', 'Chú Tám': 'Uncle Tám', 'Cô Út': 'Auntie Út', 'Bà Năm': 'Grandma Năm', 'Bà Nội': 'Grandma', 'Bà Hạnh': 'Grandma Hạnh', 'Ông Tú': 'Grandpa Tú', 'Chị Thơm': 'Big Sister Thơm', 'Cô Liên': 'Auntie Liên', 'Chú Hải': 'Uncle Hải', 'Dì Bảy': 'Auntie Bảy', 'Cô Vy': 'Auntie Vy',
  'Anh Hai': 'Big Brother Hai', 'Cô Hạnh': 'Miss Hạnh', 'Bác Gấu': 'Mr. Bear', 'Cô Mei': 'Miss Mei', 'Bà Lin': 'Grandma Lin', 'Bà Asha': 'Grandma Asha', 'Bà Huệ': 'Grandma Huệ', 'Ông Nghi': 'Grandpa Nghi', 'Bác 2': 'Uncle Hai', 'Bác 3': 'Uncle Ba', 'Bác 4': 'Uncle Tư', 'Cậu Tâm': 'Uncle Tâm', 'Mợ An': 'Auntie An', 'Cô Tam': 'Miss Tam', 'Chú Trung': 'Uncle Trung', 'Chú Thuận': 'Uncle Thuận', 'Mợ Phương': 'Auntie Phương', 'O Thủy': 'Auntie Thủy', 'O Thúy': 'Auntie Thúy', 'Bác Sơn': 'Uncle Sơn', 'Chú Sự': 'Uncle Sự', 'Em Hà': 'Little Hà', 'O Thương': 'Auntie Thương', 'Dượng Dũng': 'Uncle Dũng', 'Chị Thúy': 'Big Sister Thúy', 'Anh Ba': 'Big Brother Ba', 'Cu Bin': 'Little Bin', 'Út Lì': 'Little Lì'
};
const NAMES_VI = { 'Mrs Kelly': 'Cô Kelly', 'Aunty Bev': 'Dì Bev', 'Uncle Robbo': 'Chú Robbo', 'Mr. Bear': 'Bác Gấu' };
const ALIAS = { 'Mr. Bear': 'Bác Gấu' }; // two spellings of one character
const esc = k => k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
// The base name of a character, without a flag or emoji after it ("Jack 🇦🇺" → "Jack").
export const baseName = n => String(n).replace(/\s+[^\p{L}\p{N}]+$/u, '').trim();
export const defaultName = (id, lang = settings.lang) => lang === 'vi' ? (NAMES_VI[id] || id) : (NAMES_EN[id] || id);
// Every character the world creates registers here, so Grown-ups can list them for renaming.
export const NPC_NAMES = [];
export const registerName = (name, icon = '🙂') => { const id = ALIAS[baseName(name)] || baseName(name); if (id && !NPC_NAMES.some(n => n.id === id)) NPC_NAMES.push({ id, icon }); };
let RE = null, reKey = '';
function nameRE() {
  const custom = [...Object.keys(settings.npcNames || {}).filter(k => { const c = settings.npcNames[k]; return c && (c.en || c.vi); }), ...Object.keys(CUSTOM.names || {})];
  const key = custom.join('|');
  if (!RE || key !== reKey) {
    const keys = [...new Set([...Object.keys(NAMES_EN), ...Object.keys(NAMES_VI), ...custom])].sort((a, b) => b.length - a.length);
    // (owner, 29 Oct 2026 AEDT: an iPad stopped at "could not finish loading") no lookbehind: Safari before 16.4 cannot
    // read it, and one such pattern stops the whole game from starting; the letter before a name is kept and put back
    RE = new RegExp('(^|[^\\p{L}])(' + keys.map(esc).join('|') + ')(?![\\p{L}])', 'gu'); reKey = key;
  }
  return RE;
}
// swap people's names inside any text for the given language
// "Bé" (little one) in front of a child's name is a title too: "Bé Na" is "Little Na" in English.
const BE_EN = /(^|[^\p{L}])Bé (?=\p{Lu})/gu, BE_VI = /(^|[^\p{L}])Little (?=\p{Lu})/gu;
export const swapNames = (text, lang = settings.lang) => typeof text !== 'string' ? text : text.replace(nameRE(), (_, before, m) => {
  const id = ALIAS[m] || m, c = (settings.npcNames || {})[id], f = customName(id); // the device's own name first, then the family's content pack
  return before + ((c && c[lang]) || (f && typeof f[lang] === 'string' && f[lang]) || defaultName(id, lang));
}).replace(lang === 'vi' ? BE_VI : BE_EN, lang === 'vi' ? '$1Bé ' : '$1Little ');
export const nm = name => swapNames(name);
// (English, Vietnamese); callers may also spread a pair kept as a list: T(...[en, vi])
export const T = (...[en, vi]: (string | number)[]) => (settings.lang === 'vi' ? swapNames(vi, 'vi') : swapNames(en, 'en'));
// Things drawn into the 3D world (signs, name tags) register here to redraw when the language changes.
const langListeners = [];
export const onLang = f => { langListeners.push(f); };
export const applyLang = () => { document.documentElement.lang = settings.lang === 'vi' ? 'vi' : 'en'; langListeners.forEach(f => { try { f(); } catch (e) { } }); events.emit('LanguageChanged', { lang: settings.lang }); };
applyLang();
export const other = (en, vi) => (settings.lang === 'vi' ? en : vi);

// Alphabets for the letter games.
export const ALPHABET = {
  en: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split(''),
  vi: ['A', 'Ă', 'Â', 'B', 'C', 'D', 'Đ', 'E', 'Ê', 'G', 'H', 'I', 'K', 'L', 'M', 'N', 'O', 'Ô', 'Ơ', 'P', 'Q', 'R', 'S', 'T', 'U', 'Ư', 'V', 'X', 'Y']
};
// How each Vietnamese letter is read aloud (traditional school names).
export const VI_LETTER_NAMES = {
  A: 'a', 'Ă': 'á', 'Â': 'ớ', B: 'bờ', C: 'cờ', D: 'dờ', 'Đ': 'đờ', E: 'e', 'Ê': 'ê', G: 'gờ', H: 'hờ', I: 'i', K: 'ca',
  L: 'lờ', M: 'mờ', N: 'nờ', O: 'o', 'Ô': 'ô', 'Ơ': 'ơ', P: 'pờ', Q: 'quờ', R: 'rờ', S: 'sờ', T: 'tờ', U: 'u', 'Ư': 'ư', V: 'vờ', X: 'xờ', Y: 'i dài'
};
// A picture word for each letter, so the letter games can say "B is for ball".
export const LETTER_WORDS = {
  en: { A: ['🍎', 'apple'], B: ['⚽', 'ball'], C: ['🐱', 'cat'], D: ['🐶', 'dog'], E: ['🐘', 'elephant'], F: ['🐟', 'fish'], G: ['🍇', 'grapes'], H: ['🏠', 'house'],
    I: ['🍦', 'ice cream'], J: ['🧃', 'juice'], K: ['🪁', 'kite'], L: ['🦁', 'lion'], M: ['🌙', 'moon'], N: ['🪺', 'nest'], O: ['🐙', 'octopus'], P: ['🐷', 'pig'],
    Q: ['👑', 'queen'], R: ['🌈', 'rainbow'], S: ['☀️', 'sun'], T: ['🐢', 'turtle'], U: ['☂️', 'umbrella'], V: ['🎻', 'violin'], W: ['🐋', 'whale'], X: ['🎄', 'xmas tree'], Y: ['🪀', 'yo-yo'], Z: ['🦓', 'zebra'] },
  vi: { A: ['👕', 'cái áo'], 'Ă': ['🍚', 'ăn cơm'], 'Â': ['🫖', 'ấm trà'], B: ['🐄', 'con bò'], C: ['🐟', 'con cá'], D: ['🥥', 'quả dừa'], 'Đ': ['🏮', 'đèn lồng'],
    E: ['👶', 'em bé'], 'Ê': ['🐸', 'con ếch'], G: ['🐔', 'con gà'], H: ['🌸', 'bông hoa'], I: ['🔵', 'hòn bi'], K: ['🍬', 'cái kẹo'], L: ['🍐', 'quả lê'],
    M: ['🐱', 'con mèo'], N: ['🍇', 'quả nho'], O: ['🐝', 'con ong'], 'Ô': ['☂️', 'cái ô'], 'Ơ': ['🌶️', 'quả ớt'], P: ['🔋', 'cục pin'], Q: ['🍊', 'quả cam'],
    R: ['🐢', 'con rùa'], S: ['📕', 'quyển sách'], T: ['🍎', 'quả táo'], U: ['🦉', 'con cú'], 'Ư': ['🦁', 'sư tử'], V: ['🐘', 'con voi'], X: ['🚲', 'xe đạp'], Y: ['🩺', 'y tá'] }
};
export const NUMBER_WORDS = {
  en: ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen', 'twenty'],
  vi: ['không', 'một', 'hai', 'ba', 'bốn', 'năm', 'sáu', 'bảy', 'tám', 'chín', 'mười', 'mười một', 'mười hai', 'mười ba', 'mười bốn', 'mười lăm', 'mười sáu', 'mười bảy', 'mười tám', 'mười chín', 'hai mươi']
};
export const numWord = n => (NUMBER_WORDS[settings.lang] || NUMBER_WORDS.en)[n] ?? String(n);
export const COLORS = [
  { hex: '#e8434a', en: 'red', vi: 'đỏ' }, { hex: '#3d7fd6', en: 'blue', vi: 'xanh dương' }, { hex: '#ffd23f', en: 'yellow', vi: 'vàng' },
  { hex: '#4cbf5c', en: 'green', vi: 'xanh lá' }, { hex: '#ff8a2a', en: 'orange', vi: 'cam' }, { hex: '#9a6bff', en: 'purple', vi: 'tím' }, { hex: '#ff7eb8', en: 'pink', vi: 'hồng' }
];
export const colorName = c => T(c.en, c.vi);
// a label made with T(), in both languages (to speak a name: say(...both(g.name)))
export const both = f => { const l = settings.lang; try { settings.lang = 'en'; const en = f(); settings.lang = 'vi'; return [en, f()]; } finally { settings.lang = l; } };
