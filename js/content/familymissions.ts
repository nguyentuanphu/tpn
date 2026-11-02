// (Round U, owner 11 Oct: "for the family mission, week and bedtime, please add 15 tasks, and a short guide so parents
// and kids know this is family play and what they should do") Fifteen ready-made family missions: things a child does
// for real, together with a grown-up, away from the screen. A grown-up turns each one on or off in Grown-ups → Family;
// one of each kind starts on. A day mission comes back the next day, a week mission after seven days, a bedtime mission
// each evening. Plain data (no imports), so Node can read it too.
//   kind: 'day' | 'week' | 'bedtime'; icon: a drawn picture (js/art.js); en, vi: what to do
export const FAMILY_MISSIONS = [
  { id: 'f_table', kind: 'day', icon: '🍽️', en: 'Help set the table for dinner.', vi: 'Giúp dọn bàn cho bữa tối.', on: true },
  { id: 'f_thanks', kind: 'day', icon: '💛', en: 'Say "thank you" and "cảm ơn" to someone in your family today.', vi: 'Nói "cảm ơn" và "thank you" với một người trong nhà hôm nay.' },
  { id: 'f_plant', kind: 'day', icon: '🌱', en: 'Water a plant together with a grown-up.', vi: 'Cùng người lớn tưới cây.' },
  { id: 'f_toys', kind: 'day', icon: '🧸', en: 'Put your toys back in their home.', vi: 'Cất đồ chơi về đúng chỗ.' },
  { id: 'f_fruit', kind: 'day', icon: '🍎', en: 'Eat a piece of fruit and say its name in both languages.', vi: 'Ăn một miếng trái cây và nói tên của nó bằng hai thứ tiếng.' },
  { id: 'f_draw', kind: 'week', icon: '🖍️', en: 'Draw your favourite place in the valley and show your family.', vi: 'Vẽ nơi con thích nhất trong thung lũng rồi cho cả nhà xem.', on: true },
  { id: 'f_call', kind: 'week', icon: '📞', en: 'Call or video-call a grandparent and tell them one thing you learnt.', vi: 'Gọi điện cho ông bà và kể một điều con mới học được.' },
  { id: 'f_cook', kind: 'week', icon: '🥟', en: 'Help cook one dish from the valley with a grown-up.', vi: 'Cùng người lớn nấu một món ăn có trong thung lũng.' },
  { id: 'f_walk', kind: 'week', icon: '🌳', en: 'Go for a walk outside and find three things the valley has too.', vi: 'Đi dạo ngoài trời và tìm ba thứ mà thung lũng cũng có.' },
  { id: 'f_song', kind: 'week', icon: '🎵', en: 'Sing a song from the valley together.', vi: 'Cả nhà cùng hát một bài hát trong thung lũng.' },
  { id: 'f_teeth', kind: 'bedtime', icon: '🪥', en: 'Brush your teeth without being asked.', vi: 'Tự đánh răng mà không cần nhắc.', on: true },
  { id: 'f_pyjamas', kind: 'bedtime', icon: '🌙', en: 'Put on your pyjamas all by yourself.', vi: 'Tự mặc đồ ngủ.' },
  { id: 'f_book', kind: 'bedtime', icon: '📚', en: 'Choose a book for a grown-up to read with you.', vi: 'Chọn một cuốn sách để người lớn đọc cùng con.' },
  { id: 'f_best', kind: 'bedtime', icon: '⭐', en: 'Tell a grown-up the best thing about your day.', vi: 'Kể cho người lớn nghe điều vui nhất trong ngày.' },
  { id: 'f_hug', kind: 'bedtime', icon: '🤗', en: 'Give everyone a goodnight hug.', vi: 'Ôm chúc ngủ ngon mọi người trong nhà.' }
];
// how long a done mission stays done before it comes back (days)
export const FAMILY_AGAIN = { day: 1, week: 7, bedtime: 1 };
// the guide: what family play is and what to do (shown once to grown-ups and to the child, and from a "?" button)
export const FAMILY_GUIDE = [
  ['💛', 'Family missions are family play: real things to do together, away from the screen.', 'Nhiệm vụ gia đình là trò chơi cả nhà: những việc thật làm cùng nhau, rời xa màn hình.'],
  ['📝', 'A grown-up picks the missions in Grown-ups. The child sees them in Adventures.', 'Người lớn chọn nhiệm vụ trong mục Người lớn. Bé thấy chúng trong trang Phiêu lưu.'],
  ['🧒', 'The child does the mission for real, with a grown-up close by.', 'Bé làm nhiệm vụ thật ngoài đời, có người lớn ở bên.'],
  ['✅', 'When it is done, a grown-up holds the tick. Coins and a sticker arrive!', 'Làm xong, người lớn nhấn giữ dấu tích. Bé được thưởng đồng xu và hình dán!']
];
