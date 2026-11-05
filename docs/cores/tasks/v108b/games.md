# v1.08b games helper: status

**Ready for Release: items 1 to 7 (item 6 as the owner chose: 9 steps and a badge).**

Branch `work/v108b-games` from `origin/integrate/v108`. Times in AEDT.

## Plan (5 Nov 2026, 1:30 pm AEDT)

The owner's go is given (plans `docs/plans/games-one-home-and-films.md` part A and `docs/plans/links-rollout-install.md`
parts 1 and 4). The brief is large (about 30 new corner games and 24 festival games, each with the full set), so this
session does the structural part first, so other helpers and Release can build on it:

1. One learning tab, one home per game (brief item 1).
2. The twins checked (brief item 2).
3. A place and a host for every game, with the first-open news (brief item 4).
4. Checks: `hubmap` extended, new `gameplace`; `hocvui`, `englishmode`, `simple`, `secondset` updated to the new layout.

Later sessions: the new games (item 3), the festival games (item 5), the learning quests (item 6).

## What changed

### 1. One learning tab, one home per game
- `js/ui/hub.ts`: the Học tab is gone; Học vui is the first tab with the corners, in order: Tiếng Việt, Tiếng Anh, Toán,
  Hình khối, Tiền, Khoa học, Chữ và đọc, Góc đọc (the reading trial's games, while Studio's reading switch is on),
  Em và gia đình. Link tiles and their code are removed. A card in the English corner plays in English mode.
- `js/content/activities.ts`: `LEARN_CORNERS` (the corner order, shared by the hub and the Simple screen); area
  `numbers` is shown as Toán (Maths), `words` as Chữ và đọc (Letters and reading); the empty `hv_math` area is removed;
  `linksIn` removed. First Sounds (`phonics`, English letter sounds) moves to Tiếng Anh; Two Homes Words (`words`,
  Vietnamese words of the regions) to Tiếng Việt; Tone Marks (`rd_tones`) and Vowel Hats (`rd_hats`, â ê ô) to
  Tiếng Việt. The other reading games play in the child's own language and stay in Chữ và đọc / Góc đọc.
- `js/content/hocvui.ts`: `CORNER_LINKS` and `linkedIn` removed.
- `js/simple.ts`: the Học vui button shows the same corners in the same order; no link stops; a game from the English
  corner plays in English mode, as in the hub. Vui chơi keeps folk, animals and music, pictures, places, thinking.
- `css/style.css`: the link tile styles removed (`.hcard.hlink`, `.hfrom`): small edit to a shared file.

Area keys stay as they were (`numbers`, `words`, `reading`), so saves, stars, levels and the second-set unlocks keep
working; the four games that moved corners only make an unlock easier, never harder (their old area's first set is one
game shorter), so no child loses a game they have.

### 2. Twins
Each pair was played and read in the code. None teaches the same thing the same way, so all stay, each in its own corner,
and no save needs an id mapping (`normalizeProfile` unchanged):

| Pair | How they differ | Corners |
|---|---|---|
| `letters` / `vi_letters` | Letter Hunt finds the letter heard, in the child's alphabet; Vietnamese Letters fills the missing letter (ă â đ ê ô ơ ư) in a spoken Vietnamese word | Chữ và đọc / Tiếng Việt |
| `opposites` / `vi_opposite` | Opposites picks the opposite of one word, in the child's language; Opposite Pairs matches pairs on a board | Chữ và đọc / Tiếng Việt |
| `rd_readalong` / `vi_readalong` | Read With Me reads a little book with a question at the end; Read Along taps each word of a sentence as it is read | Góc đọc / Tiếng Việt |
| `rd_sentence` / `en_sentence` | Sentence Train builds a sentence in the child's language; First Sentences is English only | Góc đọc / Tiếng Anh |
| `counting` / `en_count` | Count With Me counts in the child's language; Counting Song is an English counting song | Toán / Tiếng Anh |
| `shapes` / `en_colshape` | Shadow Shapes matches shadows; Colours and Shapes teaches the English words | Hình khối / Tiếng Anh |

Their names and pictures were already different, so nothing was renamed (no new voice lines needed for names).

### 4. A place and a host for every game
- New `js/content/gameplace.ts`: `AREA_PLACE`, a place and a host for each area (school rooms with Cô Tam for the
  languages, maths, shapes and reading; Cô Mai's market for money; Tèo in the village yard for folk games; Tí outside;
  the music corner; the art easel; Bác Ba's farm pen; home; Ông Cú for thinking; the bus stop for going places), each
  with one spoken line in English and Vietnamese. Only places that already stand in the valley are used.
- `js/main/talks.ts`: `G.gameSpot` falls back to the area's place, so all 299 games have a place (168 had none).
  `G.hostNews`: as a child walks past a game's place while a game there is newly open, its host says their line once and
  the game's name shows. The games already open the first time it runs are counted as known (no burst of news on an old
  save); `profile.hostNews` remembers them.
- `js/main.ts`: one line in the hero loop calls `G.hostNews`; the `SvMain` type gains `hostNews`.

### 3. New games where a corner is thin (27 games)
- `js/content/games108b.ts`: each game is a table of questions in English and Vietnamese (every line written in full, so
  the voice pack records it). `js/games/games108b.ts` plays them as picture quizzes on the maths kit's rounds (the right
  answer moves, no two rounds alike; Easy 4 rounds and 2 wrong answers, Medium 5, Hard 6 and 3, Talent 7 and 3 with
  written answers only; under-5s always Easy with pictures). English corner games play in English mode.
- Tiếng Anh 9 to 21: Who Says That?, Opposites in English, How Do You Feel?, Clothes and Weather, My Daily Routine,
  In On Under, Action Words, At the Shop, Numbers 11 to 20, Body Song, Who What Where?, My Day Story.
- Em và gia đình 6 to 12: Family Tree, Brush and Wash, Safe or Not Safe?, Helping at Home, Calm Down Corner, At the Table
  (the plan's My Feelings, Healthy Plate and Kind Choices already existed as feelings, plate and kindchoice, so three
  other topics were chosen).
- Suy nghĩ giỏi 8 to 14: Balance Puzzle, Clue Detective, Code the Robot, What Changed?, Hidden Counting, What Goes Together?
  (the plan's Maze Builder, Memory Pairs Plus and Tangram Animals overlap maze, memory and tangram, so other puzzles were chosen).
- Tiếng Việt 15 to 18: Đọc Thơ Ngắn, Từ Láy, Chính Tả S hay X (Ghép câu ca dao already exists as vi_cadao).
- Our own drawings: 27 game pictures in `js/art/games108b.ts`; 9 pictures that had none (shorts, gloves, wind, cyclist,
  comb, tissue, watering can, worried face, zipped mouth) in `js/art/emoji108b.ts`, part of the start so the emoji check sees them.
- How to play (the TV guide film reads it): `js/games/games108b-meta.ts`. Catalogue and loader: `js/games/catalog.ts`
  (one block each); `GAME_INFO` block in `js/content/activities.ts`.

### 5. One game per festival (24 games)
- `js/content/festgames108b.ts`: one game per festival of `js/content/festcal.ts` (Gói Bánh Chưng, Thả Đèn Rằm Tháng
  Giêng, Bánh Dâng Vua Hùng, Đua Thuyền Rồng, Bông Hồng Cài Áo, Làm Đèn Ông Sao, Thả Cá Chép Tiễn Ông Táo, Bóng Bay 1/6,
  Treo Cờ Quốc Khánh, Hoa Tặng Thầy Cô, Tô Trứng Phục Sinh, Thiệp Tặng Mẹ, Dã Ngoại Cùng Bố, Đèn Bí Ngô, Trang Trí Cây
  Thông, Đếm Ngược Năm Mới, Cricket Sân Sau, Dọn Sạch Công Viên, Xin Chào Nhiều Thứ Tiếng, Tung Bột Màu Holi, Bánh Quy
  Anzac, Những Bàn Tay Nắm Lấy Nhau, Tranh Chấm Kể Chuyện, Thắp Đèn Diya); quiet days are gentle. Same quiz engine.
- `js/content/festseason.ts`: a festival game is open from the decorations (3 weeks before a party, 3 days before a quiet
  day, or the build-up set in Studio) until 3 days after; testers 7 days earlier; a date moved in Studio is followed.
  `backOn(id)` gives the day it comes back. `gameInfo` hides a festival game out of season.
- `festcal.ts`: one line at the end makes each festival's table game its own festival game (the everyday games are
  everyday only again). New area `festival` (Trò chơi lễ hội) in the Dân gian tab; its place is the festival's table,
  else the Lotus statue in the village.
- **Request to the story helper (calendar tab):** outside the season the calendar should show "Sẽ quay lại vào …" /
  "Back on …" for the festival's game: call `backOn('fg_' + festivalId)` from `js/content/festseason.ts` (a Date or null).

### 6. Learning quests (owner, 5 Nov 2026 AEDT: "làm luôn mục 6: 9 bước và một huy hiệu")
- `js/content/learnpaths.ts`: 8 journeys (Tiếng Việt, Tiếng Anh, Toán, Hình khối, Tiền, Khoa học, Chữ và đọc, Em và gia
  đình), 9 steps each and a badge at the end.
- `js/learnquest.ts`: the steps are the subject's games made for the child's age, easiest first (first set before the
  second); a step won gives its sticker, the 9th the badge (`profile.learnPath`, `profile.learnBadges`). One learning
  step a day (a different unfinished journey each day): a row in the daily adventure's window (`js/adventure.ts`, one
  line and one binding), a quest mark on its card in the Play hub, a quest star on its Simple screen stop. The journeys
  show at the top of the Học vui tab, each with its 9 dots and badge; a tap plays the next step.
- Sticker book (`js/content/stickers.ts`, `js/stickers.ts`, small blocks): a new theme "Learning" with one page of 9 per
  subject (step 1 is the page's welcome sticker, STK-3) and a new way to earn, `learn`. The sticker unit test lists
  the new theme and the new way (the test pins the list of themes; changed on purpose).
- Drawings (part of the start, `js/art/emoji108b.ts`): the tab, the quest mark, a medal per step, a badge per subject.

### Leftovers asked by Release (5 Nov 2026 AEDT)
- The 11 host lines and the festival host line are recorded (Azure, HoaiMy and Natasha), with every new game's lines.
- Host news for stories: Bà Năm says once, as the child passes her mat, that a story has newly opened
  ("Có truyện mới trên chiếu của bà đó!"); stories already open the first time are counted as known (`js/main/talks.ts`).

## Checks (5 Nov 2026 AEDT)
- `hubmap` extended: no link tiles in the Play hub; each game once across Học vui and Vui chơi on the Simple screen: pass.
- `gameplace` (new, `tests/checks/screens.mts`): every switched-on game has a place that stands in the valley; every area
  has a host and a line; the host news is said once per new game: pass.
- `hocvui`, `englishmode`, `simple`, `secondset` updated to one tab and no links (the old checks asserted the Learning tab
  and the link tiles that the owner's plan removes): see the progress notes below.

## Left for later
- The new games are picture quizzes on one engine; richer hands-on versions (wrapping the cake, a maze builder) could follow.

- On a phone the 8 journey rows fill the first screen of the Học vui tab (the games are just below); Release may want them folded.

## Progress notes

## Owner's decisions
- 5 Nov 2026 AEDT: learning journeys have 9 steps and a badge (fits the sticker book's pages of 9).

## Progress notes
- 5 Nov 2026 AEDT, branch work/v108b-games, checks (each run alone, `node run.mts` or `suite.mts --only`; `--changed` asks
  for the full suite, which only Release runs):
  - pass: hubmap, gameplace (with story news), hocvui (65 new games won at Easy and Talent), englishmode, simple,
    secondset, playhub, emoji, noemoji, festivalgames, learningquests, games (326 games), phone, boot, contract.
  - fail, not this branch: unit (2 tests need the `pg` package, not installed in this container); roundvariety
    (`lemonade`, a money game: hard round 4 = round 2; every new game passed).
  - guides, levelsa, gamespace, gamefit: see the next note.
