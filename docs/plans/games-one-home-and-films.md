# One home per game, and better films and stories: plan

Owner, 3 Nov 2026 AEDT:
- "Many games in a category are reused. Each game belongs to the category it fits and should not be reused; make more games if needed."
- "In the films and stories the new characters appear, but in fairy tales and folk tales the hair and clothes must fit the setting. Can the films and stories be refined, or remade in Blender, so they look smoother, more beautiful and more fun?"

## A. One home per game

### Today (checked in the code)
- Every game has one home area (`GAME_INFO`, `js/content/activities.ts`), but the Học vui corners also show **link tiles** to games that live elsewhere (`CORNER_LINKS`, `js/content/hocvui.ts`). This is where a child sees the same game twice:

  | Học vui corner | Its own games | Games shown again from other places |
  |---|---|---|
  | Toán (Maths) | **0** | 35 from Con số, plus 11 from Tiền |
  | Tiếng Anh (English) | 8 | 27: phonics, opposites and the reading games |
  | Tiếng Việt (Vietnamese) | 12 | 2: words, letters |
  | Khoa học (Science) | 18 | 0 |

- The Học tab (numbers, letters and words, reading, shapes, me, money) and the Học vui tab (Vietnamese, English, Maths, Science) overlap: maths is in both, and words and reading are in both.
- Some games are near twins under two ids, each in its own corner:
  - `letters` and `vi_letters`;
  - `opposites` and `vi_opposite`;
  - `rd_readalong` and `vi_readalong`;
  - `rd_sentence` and `en_sentence`;
  - `counting` and `en_count`;
  - the shape games and `en_colshape`.

### Plan
1. **One learning tab, one home each.** Học and Học vui become one tab, **Học vui**, with one corner per subject:

   | Corner | Games |
   |---|---|
   | Tiếng Việt | Vietnamese language games only |
   | Tiếng Anh | English games only; they play in English, with a Vietnamese hint |
   | Toán | everything now in Con số; the Con số area becomes Toán |
   | Hình khối | shapes |
   | Tiền | the money games; no longer linked into Toán |
   | Khoa học | science |
   | Chữ và đọc | letter and reading games that play in the child's own language |
   | Em và gia đình | me and my family |

2. **No more link tiles.** `CORNER_LINKS` is removed, and the `hubmap` check is extended so that a game appears in exactly one place in Play, in Học vui and on the Simple screen.
3. **Twins.** Each pair above is checked: if the two games teach the same thing in the same way, they become one game with one home; if they differ (for example Vietnamese tone letters versus the English ABC), both stay, each in its own corner, with different pictures and names so they don't look reused.
4. **Each reading or phonics game goes to the corner of what it teaches:**
   - English sounds, sight words and rhymes go to Tiếng Anh;
   - Vietnamese tones, rhymes and syllables go to Tiếng Việt;
   - games that work the same in both languages go to Chữ và đọc.
5. **New games where a corner becomes thin:**

   | Corner | Own games now | Target | New games |
   |---|---|---|---|
   | Tiếng Anh | 8 (+ the English reading games moved in) | about 20 | Animal Sounds in English, Opposites in English, Feelings, Clothes and Weather, Daily Routine, Prepositions (in/on/under), Action Verbs, Shopping Words, Numbers 11–20, Body Song, Question Words, My Day story |
   | Em và gia đình | 6 | about 12 | My Feelings, Family Tree, Healthy Plate, Brush and Wash, Safe or Not Safe, Kind Choices |
   | Suy nghĩ giỏi | 8 | about 14 | Maze Builder, Code the Robot, Spot the Difference, Memory Pairs Plus, Logic Grid, Tangram Animals |
   | Tiếng Việt | 12 + 2 moved in | about 16 | Đọc thơ ngắn, Ghép câu ca dao, Từ láy, Chính tả s/x |

   Each new game gets the full set: guide film (TV button), levels up to Talent, English and Vietnamese, our own drawings, voices, a check, and the one-screen rule.
6. **The Simple screen** follows the same homes: the Học vui button shows the subject corners, and the Vui chơi button shows folk games, animals and music, pictures, places and thinking.

## B. The new friends in films and stories

### Today
- **39 tale films:** 20 Vietnamese, 6 Australian, 13 from China, India and other places. Each is one file in `js/content/films/`, with settings in `js/content/film-looks.ts`.
- There are also the lantern and chapter films, which use the child's own look.
- The actors are built with the same builder as the villagers (`js/film.ts`).
- The tale theatre (`js/cartoon.ts`) has its own 2D people.

### Plan
1. **Modern stories** (lantern films, chapters 1–3, Hà Nội and Sydney): the child appears as their chosen friend (Finn, Sol, Clara, Lumi) in their own skin tone and outfit. The villagers are in the new style.
2. **Fairy tales and folk tales:**
   - The tale's own people (Tấm, Cám, Thạch Sanh, Sơn Tinh, Chú Cuội, and the others) wear clothes and hair of their time and place:

     | Tales | Clothes and hair |
     |---|---|
     | Vietnamese | áo tứ thân, yếm, váy đụp, khăn mỏ quạ, khăn vấn and long hair in a bun for women; áo the or áo nâu, khố, khăn xếp or khăn đầu rìu and topknots for men; armour and royal robes for kings and generals |
     | Australian | colonial-era clothes for The Magic Pudding; animals as themselves in the First Nations stories, which are told with care and the art style already agreed |
     | Chinese and Indian | hanfu and sari or dhoti of the tale's time |

   - **The four friends do not appear inside the old tales.** No modern clothes are mixed in. See question 2 for whether they appear at the start and end.
   - A **costume kit**: each period outfit and hairstyle is made once in Blender and used in every tale that needs it.
3. **Smoother, more beautiful, more fun** (question 3 picks the way):
   - **In the game (recommended):** the films stay real 3D in the game, so they stay light, and the game gains:
     - the new characters' walk, run, wave and mood faces;
     - lips that move with the voice;
     - eased camera moves (dolly, close-up on the speaker, wide shot for big moments);
     - soft light and shadows that change with the time of day in the story;
     - a little depth blur;
     - particles (petals, rain, sparkles, smoke);
     - a short scene fade instead of a cut.
   - **Blender video:** each film is made in Blender as a video. This is the most beautiful, but each film is about 5–10 MB, so 39 films add about 200–400 MB (more than was just saved by setting aside the male voices), and the films cannot show the child's own friend.
   - **Both:** game films for every story, plus one Blender video trailer for the festival stories only.
4. **Stories (the book pages):** each page picture is redrawn from the Blender characters and settings as an illustration (our own art, about 60–100 KB each). The book and the film then look like the same story.
5. **Checks:**
   - `films` and `stories`, with every film still opening;
   - `perf` while a film plays;
   - a new `talecostume` check: no modern outfit or friend inside a folk tale page.

## Order
- **v1.09**, with the new friends:
  - A1–A4: one home per game, the twins, the reading games moved;
  - B1: modern stories with the friends;
  - the costume kit started.
- **v1.10:**
  - A5: the new games;
  - B2–B4: the folk-tale costumes, the smoother films and the page illustrations.

## Owner's answers (3 Nov 2026 AEDT, pop-ups)
1. Học and Học vui become **one tab, one home per game**.
2. The four friends in the old tales: **only as storytellers at the start and end**, in their own clothes; inside the tale only the tale's people, in clothes of their time.
3. Films: **refined in the game, plus five films made in Blender as videos**.

   Release's proposal for the five (the owner can change them):
   - Bánh Chưng Bánh Giầy (Tết);
   - Chú Cuội (Trung Thu);
   - Tấm Cám;
   - Thánh Gióng;
   - The Rainbow Serpent (Australia).

   How the videos are delivered:
   - each about 1 minute, the same length as today's film of that story.

     Today's films are measured from the page scripts in `js/content/films/`. Over 33 films:
     - the animation runs 31–52 s, 42 s on average;
     - with the narration and the child's taps, a film takes about 1 minute.

     Each video keeps the same 4–6 pages and the same narration;
   - 720p, about 4–6 MB each;
   - the child's help moments stay: the video pauses at those points, shows the tap ring, and goes on after the tap;
   - downloaded only when that film is opened, and kept for offline after that; not in the first download or the Wi-Fi pack;
   - English and Vietnamese voices;
   - the in-game film stays as the fallback when there is no network;
   - made with the costume kit and the new villagers, in v1.10.
