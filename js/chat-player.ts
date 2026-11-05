// Chatting with the people of the valley. Children can ask by tapping a picture question, by talking
// (🎤) or by typing. Answers come from a built-in, offline "conversation brain" for each villager.
// If a grown-up adds an Anthropic API key in Grown-ups, villagers can answer anything freely with Claude
// (online; only the chat text is sent, never names of real people, photos or recordings).
import { T, nm } from './i18n.js';
import { settings, AI_CHAT_OFFER } from './state.js';
import { say, hush, setSpeaker } from './voice.js';
import { SFX } from './audio.js';
import { GAMES } from './games/frame.js';
import { HOWTO, openHowTo } from './howto.js';
import { QUEST_TALES } from './story.js';
import { listen, canListen, plain, has } from './listen.js';
import { el, esc, pick } from './util.js';
import { AUSSIE_SLANG, VN_WORDS, VN_SLANG } from './words.js';

import { PERSONAS, findTarget } from './chat.js';
import './howto-data.js';

const JOKES: [string, string][] = [
  ['Why did the cow cross the road? To get to the mooo-vies!', 'Tại sao con bò qua đường? Để đi xem phim bò… à không, phim "bòòò"!'],
  ['What do you call a sleeping dinosaur? A dino-snore!', 'Khủng long ngủ thì gọi là gì? Khủng long… ngáy khò khò!'],
  ['Why are fish so smart? Because they live in schools!', 'Vì sao cá thông minh? Vì cá bơi theo… trường!'],
  ['What do kangaroos read? Hop-ular books!', 'Chuột túi đọc sách gì? Sách… nhảy cóc!'],
  ['Knock knock! Who is there? Lettuce. Lettuce who? Lettuce in, it is cold out here!', 'Con gì càng to càng nhỏ? Con cua… à không, cái lỗ! Càng đào càng to mà!'],
  ['What is a cat’s favourite colour? Purr-ple!', 'Con gì đầu dê mình ốc? Con… dốc! Ha ha!']
];
const STORIES: [string, string][] = [
  ['Long ago, a kind girl called An Tiêm was sent to a lonely island. She planted black seeds a bird dropped, and they grew into the very first watermelons! She sent them across the sea, and everyone loved them.', 'Ngày xưa, Mai An Tiêm bị đày ra đảo hoang. Ông gieo những hạt đen do chim thả xuống, và chúng mọc thành những quả dưa hấu đầu tiên! Ông thả dưa ra biển, ai ăn cũng thích.'],
  ['Once there was a little koala who could not sleep, because the moon was too bright. A wise kookaburra laughed and said: close your eyes and count the stars inside your head. One, two, three… and the koala was fast asleep.', 'Ngày xưa có một chú gấu túi nhỏ không ngủ được vì trăng sáng quá. Chim kookaburra thông thái cười và nói: nhắm mắt lại và đếm sao trong đầu nhé. Một, hai, ba… thế là gấu túi ngủ say.'],
  ['A giant turtle lives in Hoàn Kiếm Lake in Hà Nội. Long ago, a king borrowed a magic sword, and when peace came, he gave it back to the golden turtle. That is why it is called the Lake of the Returned Sword.', 'Ở Hà Nội có Hồ Hoàn Kiếm. Ngày xưa nhà vua mượn thanh gươm thần, khi đất nước thanh bình, vua trả gươm cho Rùa Vàng. Vì thế hồ có tên là Hồ Gươm.']
];
const COMFORT: [string, string] = ['It is okay to feel like that. Take a big breath with me… in… and out. You are doing great, and I am right here.', 'Cảm thấy như vậy cũng không sao đâu. Hít một hơi thật sâu với tớ nhé… hít vào… thở ra. Con giỏi lắm, và tớ ở ngay đây.'];

// The offline conversation brain. Returns { en, vi, actions: [{label, run}] }.
export function offlineReply(G, h, pid, text) {
  const P = PERSONAS[pid], kid = h.profile.name, q = G.currentQuest(h.profile), A = [];
  const r = (en: string, vi: string): { en: string; vi: string; actions: typeof A; bye?: boolean } => ({ en, vi, actions: A });
  const sum = plain(text).match(/(\d+)\s*(\+|plus|cong|and|va)\s*(\d+)/);
  if (sum) { const a = +sum[1], b = +sum[3]; return r(`${a} plus ${b} is ${a + b}! You are a maths star, ${kid}.`, `${a} cộng ${b} bằng ${a + b}! ${kid} giỏi toán quá.`); }
  if (has(text, 'bye', 'goodbye', 'see you', 'tam biet', 'chao nhe', 'di day')) return Object.assign(r(`Bye bye, ${kid}! Come back soon!`, `Tạm biệt ${kid}! Nhớ quay lại nhé!`), { bye: true });
  if (has(text, 'thank', 'thanks', 'thank you', 'cam on')) return r(`You are very welcome, ${kid}!`, `Không có gì đâu ${kid}!`);
  if (has(text, 'how old', 'bao nhieu tuoi', 'may tuoi')) return r(`I am ${P.age[0]}! How old are you?`, `Tớ ${P.age[1]} tuổi! Còn bạn mấy tuổi?`.replace('Tớ ', pid === 'owl' || pid === 'gourd' ? 'Ông ' : pid === 'mai' ? 'Cô ' : pid === 'ba' ? 'Bác ' : 'Tớ '));
  if (has(text, 'sad', 'scared', 'tired', 'lonely', 'cry', 'buon', 'so', 'met', 'khoc', 'co don')) return r(...COMFORT);
  if (has(text, 'joke', 'funny', 'laugh', 'dua', 'buon cuoi', 'chuyen cuoi', 'cuoi')) { const words = pick(JOKES); return r(words[0], words[1]); }
  if (has(text, 'story', 'tell me', 'ke chuyen', 'truyen', 'ke')) { const words = pick(STORIES); return r(words[0], words[1]); }
  if (has(text, 'secret', 'hidden', 'bi mat', 'an giau')) { const hint = G.secrets && G.secrets.hint(h); return hint ? r('Psst… ' + hint, 'Suỵt… ' + hint) : r('You found every secret! You are a super explorer!', 'Con tìm ra hết bí mật rồi! Con là nhà thám hiểm siêu đẳng!'); }
  if (has(text, 'how to play', 'how do i play', 'rules', 'cach choi', 'choi the nao', 'choi sao', 'luat')) {
    const tg = findTarget(G, text), id = tg && tg.kind === 'game' ? tg.id : P.game;
    if (id && GAMES[id]) { const steps = (HOWTO[id] && HOWTO[id].steps) || []; A.push({ label: T('📺 Watch how', '📺 Xem cách chơi'), run: () => openHowTo(id, { onPlay: () => G.playGame(h.i, id, 'folk') }) });
      return r(steps.map(s => s.en).join(' ') || 'Just tap and try!', steps.map(s => s.vi).join(' ') || 'Cứ chạm và thử nhé!'); }
  }
  if (has(text, 'where', 'take me', 'go to', 'find', 'o dau', 'di den', 'dua toi', 'dan toi', 'tim')) {
    const tg = findTarget(G, text);
    if (tg && tg.kind !== 'game') { A.push({ label: `${tg.icon} ${T('Take me there', 'Đưa tớ đến đó')}`, run: () => { const t = tg.kind === 'npc' ? G.npcs.find(n => n.id === tg.id) : tg; if (t) G.travel(h, t.x - 1.5, t.z + 2); } }); return r(`${tg.name}? Easy! Tap the button and I will show you the way.`, `${tg.name} hả? Dễ thôi! Chạm vào nút, tớ chỉ đường cho.`); }
    if (tg && tg.kind === 'game') { A.push({ label: `${tg.icon} ${T('Take me there', 'Đưa tớ đến đó')}`, run: () => G.goToGame(h.i, tg.id) }); return r(`You can play ${tg.name} nearby. Tap the button!`, `Chơi ${tg.name} ở gần đây thôi. Chạm vào nút nhé!`); }
  }
  if (has(text, 'play', 'game', 'choi', 'tro choi')) {
    const tg = findTarget(G, text), id = tg && tg.kind === 'game' ? tg.id : P.game;
    if (id && GAMES[id]) { A.push({ label: `▶ ${GAMES[id].name()}`, run: () => G.playGame(h.i, id, 'folk') }, { label: T('📺 How to play', '📺 Cách chơi'), run: () => openHowTo(id, { onPlay: () => G.playGame(h.i, id, 'folk') }) }); return r(`Yes! Let's play ${GAMES[id].name()}!`, `Được! Mình chơi ${GAMES[id].name()} nhé!`); }
    A.push({ label: '🎮 ' + T('All games', 'Tất cả trò chơi'), run: () => G.openGamesHub(h.i) });
    return r('I know lots of games! Visit the park on Two Homes Street or open the games menu.', 'Tớ biết nhiều trò lắm! Đến công viên ở Phố Hai Quê hoặc mở danh sách trò chơi nhé.');
  }
  if (has(text, 'what should i do', 'what do i do', 'help', 'quest', 'mission', 'lam gi', 'nhiem vu', 'giup', 'bay gio')) {
    if (!q) return r('You finished every quest! Now you can explore, find secrets and play with friends.', 'Con xong hết nhiệm vụ rồi! Giờ hãy khám phá, tìm bí mật và chơi với bạn bè nhé.');
    const tale = q.tale || QUEST_TALES[q.id]; A.push({ label: '▶ ' + T("Let's go!", 'Đi thôi!'), run: () => G.goToObjective(h.i) });
    return tale ? r(`${q.title()}. ${tale[2]}`, `${q.title()}. ${tale[3]}`) : r(q.title(), q.title());
  }
  if (has(text, 'who are you', 'your name', 'what is your name', 'ten gi', 'la ai', 'ten la', 'ban ten')) return r(...P.about);
  if (has(text, 'favourite', 'favorite', 'like', 'love', 'thich', 'yeu')) return r(...P.likes);
  if (has(text, 'how are you', 'are you ok', 'khoe khong', 'the nao', 'co khoe')) return r(...P.mood);
  if (has(text, 'hi', 'hello', 'hey', "g'day", 'gday', 'xin chao', 'chao', 'alo')) return r(`Hello ${kid}! ${P.mood[0]}`, `Chào ${kid}! ${P.mood[1]}`);
  if (has(text, 'slang', 'word', 'words', 'teach me', 'say', 'tieng long', 'tu', 'tu moi', 'day', 'giong', 'noi sao', 'mien')) {
    const region = P.region || (['jack', 'ruby'].includes(pid) ? 'au' : ['mit', 'bom', 'lan', 'teo', 'ti', 'bong', 'su'].includes(pid) ? 'nam' : pick(['au', 'bac', 'trung', 'nam']));
    if (region === 'au') { const s2 = pick(AUSSIE_SLANG); return r(`Here's some Aussie slang: "${s2[0]}" means ${s2[1].toLowerCase()}. ${s2[4]}`, `Tiếng lóng Úc nè: "${s2[0]}" nghĩa là ${s2[2].toLowerCase()}. Ví dụ: ${s2[4]}`); }
    if (Math.random() < .5) { const s3 = pick(VN_SLANG); return r(`Here's some Vietnamese slang: "${s3[0]}" means ${s3[1].toLowerCase()} ${s3[4]}`, `Học tiếng lóng nè: "${s3[0]}" nghĩa là ${s3[2].toLowerCase()}. ${s3[4]}`); }
    const w = pick(VN_WORDS); return r(`In Vietnam, a ${w[1]} is "${w[2]}" in the north, "${w[3]}" in the centre and "${w[4]}" in the south!`, `Cái này miền Bắc gọi là "${w[2]}", miền Trung gọi là "${w[3]}", miền Nam gọi là "${w[4]}" đó!`);
  }
  if (has(text, 'australia', 'uc', 'kangaroo', 'koala', 'chuot tui')) return r('Australia is a big sunny country with kangaroos, koalas and beautiful beaches. Kids there play Mr Wolf and marbles!', 'Nước Úc rộng lớn, nhiều nắng, có chuột túi, gấu túi và bãi biển đẹp. Trẻ em ở đó chơi ông Sói và bắn bi!');
  if (has(text, 'vietnam', 'viet nam', 'pho', 'hanoi', 'ha noi', 'saigon')) return r('Vietnam has rice fields, lotus flowers, delicious phở and lanterns at the Mid-Autumn festival!', 'Việt Nam có cánh đồng lúa, hoa sen, phở thơm ngon và đèn lồng Trung Thu!');
  if (has(text, 'love you', 'thuong', 'yeu ban')) return r(`Aww! You are a wonderful friend, ${kid}.`, `Ôi! ${kid} là người bạn tuyệt vời.`);
  A.push(...quickAsks(G, h, pid).slice(0, 3).map(qq => ({ label: qq.label, ask: qq.ask })));
  return r(`Hmm, I am not sure about that! You can ask me who I am, what to do next, for a joke or a story.`, `Ừm, tớ không chắc lắm! Bạn có thể hỏi tớ là ai, làm gì tiếp theo, kể chuyện cười hay kể chuyện nhé.`);
}

// Big picture questions for children who cannot read or type yet.
function quickAsks(G, h, pid) {
  const P = PERSONAS[pid], list = [
    { label: '🙋 ' + T('Who are you?', 'Bạn là ai?'), ask: T('Who are you?', 'Bạn là ai?') },
    { label: '🎯 ' + T('What should I do?', 'Mình làm gì bây giờ?'), ask: T('What should I do?', 'Mình làm gì bây giờ?') },
    { label: '😂 ' + T('Tell me a joke', 'Kể chuyện cười đi'), ask: T('Tell me a joke', 'Kể chuyện cười đi') },
    { label: '📖 ' + T('Tell me a story', 'Kể chuyện đi'), ask: T('Tell me a story', 'Kể chuyện đi') },
    { label: '💖 ' + T('What do you like?', 'Bạn thích gì?'), ask: T('What do you like?', 'Bạn thích gì?') }
  ];
  if (P.game) list.splice(1, 0, { label: '🎮 ' + T("Let's play!", 'Chơi đi!'), ask: T("Let's play a game!", 'Mình chơi trò chơi đi!') });
  if (P.secrets) list.splice(1, 0, { label: '🤫 ' + T('Tell me a secret', 'Kể bí mật đi'), ask: T('Tell me a secret', 'Kể bí mật đi') });
  return list;
}

// ---------- Claude (optional, online) ----------
let sdk = null;
async function claudeReply(G, h, pid, history) {
  if (!sdk) sdk = (await import('../vendor/anthropic-sdk.mjs')).Anthropic;
  const client = new sdk({ apiKey: settings.aiKey, dangerouslyAllowBrowser: true });
  const P = PERSONAS[pid], p = h.profile, q = G.currentQuest(p), lang = settings.lang === 'vi' ? 'Vietnamese' : 'English';
  const places = G.PLACES.map(pl => pl.name()).join(', ');
  const system = `You are ${P.name}, ${P.role}, a character in Sparkle Valley, a gentle open-world game for children aged 2 to 8 who are growing up between Australia and Vietnam.
About you: ${P.about[0]} You like: ${P.likes[0]}${P.game && GAMES[P.game] ? ` You love playing ${GAMES[P.game].name()}.` : ''}
You are talking with ${p.name}, ${p.age === 'big' ? 'a child aged 5 to 8' : 'a little child under 5'}. Places in the valley: ${places}. Their current goal is: ${q ? q.title() : 'free play, all quests are done'}.
${P.region === 'au' ? 'Sprinkle in friendly Australian slang (mate, arvo, heaps, no worries) and explain any slang word you use. ' : P.region ? `When speaking Vietnamese, use the ${({ bac: 'northern (Hà Nội)', trung: 'central (Huế)', nam: 'southern (Sài Gòn)' })[P.region]} way of speaking. ` : ''}Reply in ${lang}, in 1 to 3 short, simple sentences a young child understands when read aloud. Be warm, playful and encouraging, and stay in character.
Talk about the valley, games, animals, counting, letters, kindness, and the cultures of Vietnam and Australia. If asked about something scary, grown-up or unsafe, gently change the subject and suggest asking a grown-up.
Never ask for or repeat personal details such as surnames, addresses, schools or phone numbers. Do not use emoji, lists, links or markdown, because your words are spoken aloud.
Latency-sensitive; begin your visible answer immediately.`;
  const res = await client.beta.messages.create({
    model: 'claude-opus-5-5', max_tokens: 1024,
    betas: ['server-side-fallback-2026-07-01'], fallbacks: 'default',
    output_config: { effort: 'low' },
    system, messages: history.slice(-12)
  });
  if (res.stop_reason === 'refusal') return null;
  const text = res.content.filter(b => b.type === 'text').map(b => b.text).join(' ').trim();
  return text || null;
}
export const aiReady = () => AI_CHAT_OFFER && settings.aiOn && !!settings.aiKey && navigator.onLine !== false;

// ---------- the chat window ----------
export function openChat(G, i, pid, onClose, firstAsk) {
  const h = G.heroes[i], P = PERSONAS[pid]; if (!h || !P) return;
  const m = el('div', 'chatbox', `<div class="cb-card">
    <div class="cb-head"><span class="cb-face">${P.emoji}</span><b>${esc(nm(P.name))}</b>${aiReady() ? '<small class="cb-ai">✨</small>' : ''}<button class="cb-x" aria-label="${T('Close', 'Đóng')}">✕</button></div>
    <div class="cb-log"></div><div class="cb-acts"></div><div class="cb-quick"></div>
    <form class="cb-in">${canListen() ? `<button type="button" class="cb-mic" aria-label="${T('Talk', 'Nói')}">🎤</button>` : ''}<input type="text" enterkeyhint="send" placeholder="${T('Say or type something…', 'Nói hoặc gõ gì đó…')}"><button type="submit" class="cb-send" aria-label="${T('Send', 'Gửi')}">➤</button></form></div>`);
  document.body.appendChild(m);
  const log = m.querySelector('.cb-log'), acts = m.querySelector('.cb-acts'), input = m.querySelector('input'), quick = m.querySelector('.cb-quick');
  const history = [];
  let busy = false;
  const bubble = (who, text) => { const b = el('div', 'cb-msg ' + who, esc(text)); log.appendChild(b); log.scrollTop = log.scrollHeight; return b; };
  const close = () => { if (!m.isConnected) return; hush(); setSpeaker(null); m.remove(); onClose && onClose(); };
  if (G.walkAwayClose) G.walkAwayClose(m, close); // (walking away closes it)
  const showActions = list => {
    acts.innerHTML = '';
    (list || []).forEach(a => { const b = el('button', 'cb-act', esc(a.label)); b.onclick = () => { SFX.tap(); if (a.ask) ask(a.ask); else { close(); a.run(); } }; acts.appendChild(b); });
  };
  const answer = (text, list) => { bubble('them', text); history.push({ role: 'assistant', content: text }); setSpeaker(P.name); say(text, text); showActions(list); };
  async function ask(text) {
    text = String(text || '').trim(); if (!text || busy) return;
    busy = true; bubble('me', text); history.push({ role: 'user', content: text }); acts.innerHTML = '';
    const off = offlineReply(G, h, pid, text);
    let reply = null;
    if (aiReady() && !off.bye) {
      const dots = bubble('them typing', '• • •');
      try { reply = await claudeReply(G, h, pid, history); } catch (e) { console.warn('Claude chat failed, using the offline answers', e); }
      dots.remove();
    }
    if (reply) answer(reply, off.actions); else answer(T(off.en, off.vi), off.actions);
    busy = false;
    if (off.bye) setTimeout(close, 1800);
  }
  quickAsks(G, h, pid).forEach(qq => { const b = el('button', 'cb-q', esc(qq.label)); b.onclick = () => { SFX.tap(); ask(qq.ask); }; quick.appendChild(b); });
  m.querySelector('.cb-x').onclick = close;
  m.querySelector('form').onsubmit = e => { e.preventDefault(); const t = input.value; input.value = ''; ask(t); };
  const mic = m.querySelector('.cb-mic');
  if (mic) mic.onclick = async () => {
    if (mic.classList.contains('on')) return;
    hush(); mic.classList.add('on'); input.placeholder = T('Listening…', 'Đang nghe…');
    const heard = await listen({ onPartial: t => { input.value = t; } });
    mic.classList.remove('on'); input.placeholder = T('Say or type something…', 'Nói hoặc gõ gì đó…'); input.value = '';
    if (heard === '\u0000denied') { bubble('them', T('I cannot hear you. A grown-up can allow the microphone in the settings.', 'Tớ không nghe được. Người lớn có thể cho phép micro trong phần cài đặt.')); return; }
    if (heard) ask(heard); else bubble('them', T('I did not hear anything. Tap 🎤 and talk to me!', 'Tớ chưa nghe thấy gì. Chạm 🎤 rồi nói nhé!'));
  };
  const hi = T(`Hello ${h.profile.name}! ${P.mood[0]} What would you like to know?`, `Chào ${h.profile.name}! ${P.mood[1]} Bạn muốn hỏi gì nào?`);
  if (firstAsk) ask(firstAsk); else { bubble('them', hi); setSpeaker(P.name); say(hi, hi); }
  return close;
}
