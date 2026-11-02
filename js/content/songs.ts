// Every song a child can choose on the 🎵 Songs page, and which music plays where (round N, owner: "Trung Thu music at
// Trung Thu, Tết music at Tết, more Vietnamese songs in the Vietnam areas, a music section, and hát ru for bedtime").
// The tunes themselves are in js/audio.js (SONGS); a family's own recordings come from Studio → 🎵 Music
// (content/custom.json "music": [{ id, file, en, vi, tags: ['lullaby' | 'tet' | 'midautumn' | 'christmas' | 'diwali'
// | 'ausday' | 'vn' | 'kids'] }]) and are played in preference to the built-in tunes for those places.
import { T } from '../i18n.js';
import { CUSTOM } from '../custom.js';

export const SONG_GROUPS = [
  { key: 'lullaby', icon: '🌙', name: () => T('Lullabies (hát ru)', 'Hát ru') },
  { key: 'vn', icon: '🏮', name: () => T('Vietnamese village', 'Làng quê Việt Nam') },
  { key: 'festival', icon: '🎉', name: () => T('Festivals', 'Lễ hội') },
  { key: 'kids', icon: '🎈', name: () => T('Children’s songs', 'Bài hát thiếu nhi') },
  { key: 'family', icon: '💛', name: () => T('Our family’s songs', 'Bài hát của nhà mình') }
];

// the traditional lullabies (ca dao, words free to use), each with an original soft instrumental in the hát ru style
export const SONG_LIST = [
  { key: 'ru1', group: 'lullaby', icon: '🌙', name: () => T('À ơi, the night heron', 'À ơi, con cò đi ăn đêm'),
    words: [['Con cò mà đi ăn đêm', 'The little heron goes out to feed at night'], ['Đậu phải cành mềm lộn cổ xuống ao', 'It lands on a soft branch and tumbles into the pond'], ['Ông ơi ông vớt tôi nao', 'Oh grandpa, please lift me out'], ['Tôi có lòng nào ông hãy xáo măng', 'If I did wrong, then cook me with bamboo shoots'], ['Có xáo thì xáo nước trong', 'But if you cook, cook in clear water'], ['Đừng xáo nước đục đau lòng cò con', 'Not muddy water, or the baby heron will be sad']] },
  { key: 'ru2', group: 'lullaby', icon: '🌉', name: () => T('Ầu ơ, the wobbly bridge', 'Ầu ơ, ví dầu cầu ván đóng đinh'),
    words: [['Ầu ơ… Ví dầu cầu ván đóng đinh', 'Ầu ơ… the plank bridge is nailed together'], ['Cầu tre lắt lẻo gập ghềnh khó đi', 'The bamboo bridge sways, bumpy and hard to cross'], ['Khó đi mẹ dắt con đi', 'Hard to cross, so mother leads you over'], ['Con đi trường học, mẹ đi trường đời', 'You go to school, and mother goes out into the world']] },
  { key: 'ru3', group: 'lullaby', icon: '🍂', name: () => T('The autumn wind', 'Gió mùa thu mẹ ru con ngủ'),
    words: [['Gió mùa thu mẹ ru mà con ngủ', 'In the autumn wind, mother sings you to sleep'], ['Năm canh chầy thức đủ vừa năm', 'All night long she stays awake beside you']] },
  { key: 'ru4', group: 'lullaby', icon: '😴', name: () => T('Sleep, little one', 'Cái ngủ mày ngủ cho lâu'),
    words: [['Cái ngủ mày ngủ cho lâu', 'Sleep, little sleep, sleep a long while'], ['Mẹ mày đi cấy đồng sâu chưa về', 'Mother is planting rice in the far fields'], ['Bắt được con trắm con trê', 'She will catch a carp and a catfish'], ['Cầm cổ lôi về cho cái ngủ ăn', 'And bring them home for you to eat']] },
  { key: 'ru1', alt: 'ru5', group: 'lullaby', icon: '🐱', name: () => T('The cat climbs the palm', 'Con mèo mà trèo cây cau'),
    words: [['Con mèo mà trèo cây cau', 'The cat climbs up the areca palm'], ['Hỏi thăm chú chuột đi đâu vắng nhà', 'And asks where Mister Mouse has gone'], ['Chú chuột đi chợ đường xa', 'Mister Mouse went to the far-away market'], ['Mua mắm mua muối giỗ cha chú mèo', 'To buy fish sauce and salt for the cat’s family feast']] },
  { key: 'village', group: 'vn', icon: '🎋', name: () => T('Đàn bầu in the village', 'Tiếng đàn bầu') },
  { key: 'village2', group: 'vn', icon: '💃', name: () => T('Village dance', 'Điệu múa làng') },
  { key: 'vn_sang', group: 'vn', icon: '☀️', name: () => T('Morning in the village', 'Sáng trên làng') },
  { key: 'vn_dong', group: 'vn', icon: '🌾', name: () => T('Rice fields', 'Đồng lúa') },
  { key: 'folk', group: 'kids', icon: '🦋', name: () => T('Look, a yellow butterfly', 'Kìa con bướm vàng') },
  { key: 'tet1', group: 'festival', fest: 'tet', icon: '🧧', name: () => T('Spring is here (Tết)', 'Xuân về') },
  { key: 'tet2', group: 'festival', fest: 'tet', icon: '🎆', name: () => T('Tết fireworks', 'Pháo hoa ngày Tết') },
  { key: 'trungthu1', group: 'festival', fest: 'midautumn', icon: '🏮', name: () => T('Lantern parade (Trung Thu)', 'Rước đèn Trung Thu') },
  { key: 'trungthu2', group: 'festival', fest: 'midautumn', icon: '🌕', name: () => T('Full-moon night', 'Đêm trăng rằm') },
  { key: 'jingle', group: 'festival', fest: 'christmas', icon: '🎄', name: () => T('Jingle Bells', 'Jingle Bells') },
  { key: 'diwali', group: 'festival', fest: 'diwali', icon: '🪔', name: () => T('Diya lights (Diwali)', 'Đèn Diya (Diwali)') },
  { key: 'ausday', group: 'festival', fest: 'ausday', icon: '🇦🇺', name: () => T('Australia Day picnic', 'Dã ngoại Ngày Nước Úc') },
  { key: 'twinkle', group: 'kids', icon: '⭐', name: () => T('Twinkle Twinkle', 'Lấp lánh ngôi sao nhỏ') },
  { key: 'farm', group: 'kids', icon: '🐮', name: () => T('Old MacDonald', 'Ông MacDonald có trang trại') },
  { key: 'pond', group: 'kids', icon: '🚣', name: () => T('Row Your Boat', 'Chèo thuyền') }
];

// the family's own recordings (Studio → 🎵 Music), checked so a hand-edited file can't break the game
const TAGS = ['lullaby', 'tet', 'midautumn', 'christmas', 'diwali', 'ausday', 'vn', 'kids'];
export const familySongs = () => (Array.isArray(CUSTOM.music) ? CUSTOM.music : [])
  .filter(m => m && typeof m.file === 'string' && /^content\/music\/[\w.-]+\.mp3$/.test(m.file)).slice(0, 60)
  .map(m => ({ key: 'file:' + String(m.id || m.file).replace(/[^\w-]/g, '').slice(0, 40), file: m.file, group: 'family', icon: '💛',
    name: () => T(String(m.en || m.vi || 'Our song').slice(0, 60), String(m.vi || m.en || 'Bài hát của nhà mình').slice(0, 60)),
    tags: (Array.isArray(m.tags) ? m.tags : []).filter(t => TAGS.includes(t)) }));

// the music for a festival, and for the Vietnam areas: the family's recordings first, then the built-in tunes
export const FEST_SONGS = { tet: ['tet1', 'tet2'], midautumn: ['trungthu1', 'trungthu2'], christmas: ['jingle'], diwali: ['diwali'], ausday: ['ausday'] };
export const VN_SONGS = ['village', 'village2', 'vn_sang', 'vn_dong', 'folk'];
export const VN_AREAS = ['village', 'market', 'paddies', 'danang', 'bacninh', 'hanoi', 'saigon', 'hoian', 'vungtau']; // (Round T: Hội An, then Vũng Tàu)
export function songsFor(tag) {
  const mine = familySongs().filter(m => m.tags.includes(tag)).map(m => m.key);
  if (mine.length) return mine;
  return tag === 'vn' ? VN_SONGS : FEST_SONGS[tag] || [];
}
