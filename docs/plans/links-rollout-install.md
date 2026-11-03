# Games, stories and quests linked; a slow rollout; a gift for installing: plan

Owner, 3 Nov 2026 AEDT:
- Are the games and stories in Play and on the Simple screen linked to the in-game quests and the villagers?
- How should new content roll out slowly so the game stays interesting, and how are children and parents told?
- Should children who install the game on the home screen get a gift?
- Any other ideas?

## Today (checked in the code)

**Games and the valley**
- 275 games. **131 have a place in the valley** (the map pin and "Go there"); **144 do not**.

  | How a game is placed | Games | Where |
  |---|---|---|
  | `GAME_SPOT` | 38 | `js/main/talks.ts` |
  | The school | 38 | |
  | Science places | 18 | |
  | Shrines | 12 | |
  | Money places | 11 | |
  | City hosts | 8 | |
  | Street play groups | 3 | |

  All the `en_*` games go to the school.
- From the Play hub, tapping a game with a place flies the child there first.
- **The Simple screen opens games straight away, with no link to the valley.**

**Villagers**
- 9 village children offer "Play / How to play".
- The Homes Street neighbours offer Snap, Tiến Lên and Đá cầu, and Cô Mai offers the market game.
- In chat, 12 of 16 characters offer a game set.
- **No villager tells the child about a new game or story.**

**Stories**
- Every fairy tale is told at one spot: Bà Năm's mat under the banyan.
- Only the lantern story's chapters are tied to places: Lotus Village, Hà Nội and Sydney.

**Quests**

| Quest system | How many | Linked to a game or story |
|---|---|---|
| Valley quests | 17 | 3 need games |
| Lantern story | 3 chapters | 4 game steps and 3 story steps |
| Daily adventures | 56 | 13 have a "play" step |
| Farm jobs | 12 | "play 2 games" |
| Passport | 4 countries | one stamp is a country's game |
| Festival hunts | 24 | no |
| Co-op quests | | no |
| Family missions | 15 | no |

- **No quest asks for one of the new learning games** (Vietnamese, English, Maths, Science, Money), and none asks for a particular fairy tale.

**Rollout**
- **What is held back:** 111 games and 54 stories are held back as "Coming soon" (`js/content/secondset.ts`). Each one opens for a child after the first-set items in its area are won 3 times (`js/content/unlocks.ts`).
- **What Studio can schedule:** Studio has 118 switches (`js/content/releases.ts`). Each has on/off, a start date, days on and days the "New" badge shows. Saving goes live with no deploy.
- **Missing:** there is no calendar that releases single games or stories week by week.

**Telling children and parents**
- **What children see:**
  - a "New in the valley!" pop-up, up to 3 items, once per child;
  - New tags on the Simple screen, the festival calendar and the sticker album, but **not on the Play hub tiles**.
- **What testers see:** the tester ladybird list.
- **What parents get:**
  - 12 kinds of push notification, among them Saturday's "What's new" with text Studio writes, and the game of the week;
  - the weekly note in Grown-ups.

  There is no email.

**Install**
- What exists:
  - the install chip on the title screen and in Grown-ups, with picture guides for iPhone, Android and computer;
  - the one-tap install on Android and computer;
  - Studio counts installs.
- **No gift for installing.**

## Plan

### 1. Everything linked
1. **Every game gets a place in the valley:**
   - Vietnamese, English and Maths at the school (a room each);
   - Science at the garden lab and its places;
   - Money at the market and shops;
   - folk games at the đình and the village yard;
   - music at the music corner;
   - drawing at the easel and the art house;
   - thinking games with Ông Cú.

   Each place has a villager host who says one line about it ("Cô giáo Lan: Hôm nay mình học đếm nhé!"). A check fails if a switched-on game has no place.
2. **Every fairy tale gets its own spot** (Tấm Cám by the well and the thị tree, Sơn Tinh by the river, Chú Cuội under the banyan on the hill, and so on) with a small sign. Bà Năm stays the storyteller. The child can read the tale there or at her mat.
3. **Villagers tell children about new things.**
   - When a game or story opens, its host says so the first time the child passes: "Có trò mới ở trường đó!" ("There's a new game at the school!").
   - Lumi or Ông Cú carries the week's news.
4. **Learning quests.**
   - The daily adventure includes one learning step at the child's level ("Help Cô Mai count the change": a money game; "Read Tấm Cám to Bà Năm": a story).
   - Each subject gets a short path of 10 steps ("Hành trình Toán", "Hành trình Tiếng Anh") with a sticker at each step and a badge at the end.
   - The Play hub tile shows a small quest mark when a game is part of today's quest.
5. **The Simple screen** stays one tap to play for little children, with no flying. A small quest star shows on today's quest game.

### 2. A slow rollout
1. **A weekly drop.** Every week a few new things open for everyone, for example:
   - 3–4 games;
   - 1 story;
   - 1 thing in the valley.

   About 165 things are held back, and v1.08 and v1.09 add more, which is about a year of weekly drops. Big festivals (Tết, Trung Thu, Christmas, Australia Day) bring a bigger drop with their decorations.
2. **A release calendar in Studio** ("Lịch phát hành"):
   - Every held-back game and story is placed in a week. Release fills it in first, and the owner can drag items between weeks.
   - Items open by date on their own, using the existing start-date mechanism, with no deploy.
   - Testers still see each drop 7 days early.
3. **Unlocks by playing stay**: a child who plays a lot can open the area's next items before their week, so the keen ones are never stuck waiting.
4. **A teaser**: the Coming soon tile says what opens next week ("Tuần sau: 3 trò Khoa học mới").

### 3. Telling children and parents
- **Children:**
  - the week's host in the valley announces it, and Lumi says it on the Simple screen;
  - a "New" badge on Play hub tiles (missing today) and on the Simple screen (exists);
  - the "New in the valley!" pop-up (exists).
- **Parents:**
  - Saturday's push "Tuần này có gì mới" (exists), written from the release calendar automatically;
  - a "What's new" card at the top of Grown-ups;
  - the weekly note lists the new things and suggests one to play together.
- **Website:** a "What's new" strip on the home page, from the same calendar.
- No streaks, timers or "you will lose it" messages: the game stays calm for children.

### 4. A gift for installing on the home screen
- When the game first runs installed (display mode standalone), every child on that device gets a one-time gift:
  - a special hat, "Mũ Ngôi Nhà / Home hat" (our own drawing);
  - 100 coins;
  - a sticker.

  It is given once per device, and the gift is told to the child in English and Vietnamese.
- The install chip in Grown-ups says: "Cài lên màn hình chính để chơi nhanh hơn, chơi offline, và nhận quà cho bé".
- Children are never pushed to install by themselves. Installing is the grown-up's job, so the reminder lives only in Grown-ups and on the title screen.
- Studio already counts installs, so the effect can be seen there.

### 5. Other ideas from Release
1. **A learning report for parents by subject:**
   - what the child practised this week in Vietnamese, English, Maths, Science and Money;
   - what went well;
   - one game suggested for next week.

   It stays in Grown-ups and can be shared as a picture.
2. **Difficulty that follows the child per subject:** a child strong in Maths but new to English gets harder Maths and easier English automatically. The parent can still set the level.
3. **Lumi as the guide:** she welcomes new children, explains new things, and is the voice of the Simple screen. One friendly face for news.
4. **Play together at home:** a "Chơi cùng bố mẹ" (play with Mum and Dad) list of games that two people can play on one device, with a short guide for the grown-up.
5. **Gentle time limits:** a parent-set play time with a soft goodbye from Lumi ("Hẹn mai chơi tiếp nhé!").
6. **Reading aloud everywhere:** every text a child sees can be tapped to hear it, for children who can't read yet.
7. **A printable sheet per week:** the week's words and numbers as a PDF for parents (our own art).

## Questions for the owner (asked by pop-up)
1. Rollout pace.
2. The install gift.
3. Which other ideas to add.
4. Which round: the links and quests, the release calendar and the install gift.
