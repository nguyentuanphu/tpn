// First words from China Town and India Village. Each: [icon, English, Tiếng Việt, the word, how to say it].
// Chinese is Mandarin (simplified characters + pinyin); Indian words are Hindi (Devanagari + an easy spelling).
export const ZH_WORDS = [
  ['👋', 'hello', 'xin chào', '你好', 'nǐ hǎo'],
  ['🙏', 'thank you', 'cảm ơn', '谢谢', 'xièxie'],
  ['👵', 'grandma', 'bà', '奶奶', 'nǎinai'],
  ['👴', 'grandpa', 'ông', '爷爷', 'yéye'],
  ['👩', 'mum', 'mẹ', '妈妈', 'māma'],
  ['👨', 'dad', 'bố', '爸爸', 'bàba'],
  ['🍚', 'rice', 'cơm', '米饭', 'mǐfàn'],
  ['🍜', 'noodles', 'mì', '面条', 'miàntiáo'],
  ['🥟', 'dumplings', 'sủi cảo', '饺子', 'jiǎozi'],
  ['🍵', 'tea', 'trà', '茶', 'chá'],
  ['🐼', 'panda', 'gấu trúc', '熊猫', 'xióngmāo'],
  ['🐉', 'dragon', 'rồng', '龙', 'lóng'],
  ['🏮', 'lantern', 'đèn lồng', '灯笼', 'dēnglong'],
  ['🌙', 'moon', 'mặt trăng', '月亮', 'yuèliang'],
  ['🔴', 'red', 'đỏ', '红色', 'hóngsè'],
  ['1️⃣', 'one', 'một', '一', 'yī'],
  ['2️⃣', 'two', 'hai', '二', 'èr'],
  ['3️⃣', 'three', 'ba', '三', 'sān'],
  ['4️⃣', 'four', 'bốn', '四', 'sì'],
  ['5️⃣', 'five', 'năm', '五', 'wǔ']
];
export const HI_WORDS = [
  ['👋', 'hello', 'xin chào', 'नमस्ते', 'namaste'],
  ['🙏', 'thank you', 'cảm ơn', 'धन्यवाद', 'dhanyavaad'],
  ['👵', 'grandma', 'bà', 'दादी', 'daadi'],
  ['👴', 'grandpa', 'ông', 'दादा', 'daada'],
  ['👩', 'mum', 'mẹ', 'माँ', 'maa'],
  ['👨', 'dad', 'bố', 'पापा', 'papa'],
  ['🍚', 'rice', 'cơm', 'चावल', 'chaawal'],
  ['🫓', 'flatbread', 'bánh mì dẹt', 'रोटी', 'roti'],
  ['🥭', 'mango', 'xoài', 'आम', 'aam'],
  ['🍵', 'tea', 'trà', 'चाय', 'chai'],
  ['🐘', 'elephant', 'con voi', 'हाथी', 'haathi'],
  ['🐯', 'tiger', 'con hổ', 'बाघ', 'baagh'],
  ['🦚', 'peacock', 'con công', 'मोर', 'mor'],
  ['🌼', 'flower', 'bông hoa', 'फूल', 'phool'],
  ['🟡', 'yellow', 'vàng', 'पीला', 'peela'],
  ['1️⃣', 'one', 'một', 'एक', 'ek'],
  ['2️⃣', 'two', 'hai', 'दो', 'do'],
  ['3️⃣', 'three', 'ba', 'तीन', 'teen'],
  ['4️⃣', 'four', 'bốn', 'चार', 'chaar'],
  ['5️⃣', 'five', 'năm', 'पाँच', 'paanch']
];
export const LEARN = {
  zh: { flag: '🇨🇳', name: { en: 'Chinese', vi: 'Tiếng Trung' }, short: '中', speech: 'zh-CN', words: ZH_WORDS },
  hi: { flag: '🇮🇳', name: { en: 'Hindi', vi: 'Tiếng Hindi' }, short: 'हि', speech: 'hi-IN', words: HI_WORDS }
};
