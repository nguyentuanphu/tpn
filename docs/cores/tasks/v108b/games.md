# v1.08b games helper: status

**Ready for Release (part 1 of the brief): items 1, 2, 4 and their checks. Items 3, 5 and 6 are not started (see "Left for later").**

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

## Checks (5 Nov 2026 AEDT)
- `hubmap` extended: no link tiles in the Play hub; each game once across Học vui and Vui chơi on the Simple screen: pass.
- `gameplace` (new, `tests/checks/screens.mts`): every switched-on game has a place that stands in the valley; every area
  has a host and a line; the host news is said once per new game: pass.
- `hocvui`, `englishmode`, `simple`, `secondset` updated to one tab and no links (the old checks asserted the Learning tab
  and the link tiles that the owner's plan removes): see the progress notes below.

## Left for later
- Item 3: the new corner games (Tiếng Anh to about 20, Em và gia đình to about 12, Suy nghĩ giỏi to about 14,
  Tiếng Việt to about 16).
- Item 5: the 24 festival games and their seasons.
- Item 6: learning quests (a learning step in the daily adventure, 10-step subject paths, quest marks).
- The host news for a newly opened story (games only so far).
- Recording the 11 host lines (they are in `js/content/gameplace.ts`; the voice pack tool collects them as pairs).

## Progress notes
