# v1.08b quality helper: status

Branch `work/v108b-quality` from `origin/integrate/v108`. Started 5 Nov 2026, 1:27 pm AEDT.

## Plan (owner's go given 3-4 Nov; brief `quality-brief.md`)

1. `fivescreens` checks: games at phone portrait/landscape (big kid and under-5) in `fivescreens`, tablet portrait,
   tablet landscape and computer in `fivescreenswide` (touch targets, overlap, text 16 px, inside the screen, no
   scrolling; built on the `gamefit` measuring, which now exports `fitGames`). Guide films and tale pages in
   `fivescreensfilms`. Then fix the shared game frame for a short landscape screen first.
2. TypeScript everywhere: `tests/` and `marketing/source` type-checked by `types`.
3. Learning report by subject in Grown-ups, and difficulty by subject.
4. Lumi as the guide (welcome, the week's news, Simple screen voice).
5. Play together list and gentle play time.
6. Roads to Concept D.

Order: 1, 3, 5, 4, 2, 6 (the child-facing layout and the parent features first; the type work and the roads last, as
time allows).

## Done

**1. Five screens**
- `tests/fivescreens-browser.mts`: `fivescreens` (phone 390x844 and 844x390, big kid and under-5) and `fivescreenswide`
  (tablet 820x1180, tablet 1280x800 big kid and under-5, computer 1440x900). Fails on: outside the screen, scrolling,
  text under 16 px, touch target under 44 px (64 px under-5), two controls overlapping. Pictures in `tests/out/fivescreens/`.
  The measuring is `gamefit`'s (`tests/gamefit-browser.mts` now exports `fitGames`; `gamefit` itself unchanged).
- `tests/fivescreens-films.mts`: `fivescreensfilms`, every tale (every page) and every game's guide film at the five
  sizes; samples a third each run like `films` (all when the film, tale or guide files change: `suite.mts` SLOW_OWN).
- The three are in `suite.mts` HEAVY (one lane, one after another).
- Shared fix, `js/games/frame.ts` and `css/style.css` (one block at the end): on a short landscape screen (a phone held
  sideways) the frame's top row and guide stand in a rail on the left, so the game has the whole height; a game that
  still does not fit tries its picture beside its answers (`.gl-wide`, kept only when it fits better, before the first
  tap only); one board made of two parts (picture and answers: the science, Tiếng Việt, maths boards) turns into a row.
  The folk games (field beside the buttons) and Rắn và Thang (board beside the players and buttons) have their own rule.
- Phone landscape before: 116 big-kid games did not fit (`fivescreens` phoneland). After: 50 rows (big kid and under-5
  together, about 30 games); all 17 science games, the words, money and maths boards now fit.

**3. Learning report by subject, level by subject**
- `js/content/subjects.ts` (pure): five subjects (Tiếng Việt, English, Maths, Science, Money), a game's subject from its
  Học vui corner or its area, the week by subject, the report lines, one game for next week, the level by subject.
- `js/report.ts`: each day now also keeps the games played and won (`stats.days[d].by`, `.won`); the play report has
  "Học theo môn / Learning by subject" with a level per subject (Auto, Easy, Medium, Hard, Talent) and "Share as a
  picture" (1080x1350, the phone's share sheet or saved).
- `js/main.ts`: with no level chosen in the game, the level follows the child per subject: one step up where strong
  (3+ games, 8+ wins, average level 3+), one step down where new; Talent only by choice; a grown-up's subject level wins.

**4. Lumi as the guide**
- `js/art/lumi.ts`: Lumi's face (leaf hair, star lantern) and the Play with Mum and Dad picture, our own drawings.
- `js/lumi.ts`, `js/content/lumi.ts`: her card and voice; the Simple screen's guide button is Lumi (was Ông Cú there);
  a new child hears her welcome once, then the week's news once a week. The card never takes a tap.
- 16 lines recorded with Azure (en-AU Natasha, vi-VN HoaiMy), with the play-together guide lines.

**5. Play with Mum and Dad, gentle play time**
- `js/playtogether.ts`: Grown-ups, "Chơi cùng bố mẹ / Play with Mum and Dad": 8 games two people take turns at on one
  device (Ô ăn quan, Cờ cá ngựa, Rắn và thang, Kéo co, Family quiz, Memory, Tiến lên, Tháp Hà Nội), a three-line guide for
  the grown-up and a short tip per game; Play opens the game.
- `js/learn.ts`: the rest time a grown-up sets (Grown-ups > Play time, unchanged setting) now counts games and the Simple
  screen too; two minutes before, Lumi says so; when time is up her goodbye ("Hẹn mai chơi tiếp nhé!") waits until the
  game, film or story in hand is over.

**2. TypeScript everywhere (part)**
- `tests/tsconfig.tests.json`: the test code (`tests/*.mts`, `tests/checks`, `tests/unit`) and `marketing/source`, as
  Node runs them, in the `types` check.
- The roots fixed: the page globals the checks use (`__sv`, `__Net`, the probes a check leaves on window) and the
  elements they tap are typed in `tests/types/test-globals.d.ts`: 3871 findings became 1780.
- The 1780 left (120 files, a long tail: `const out = {}` then `out.x = ...`, JSON read as unknown, the marketing
  scripts that share globals across files) are recorded per file in `tests/types-baseline.json`: a file may only go
  down, a new file starts at 0. Fixing them all touches nearly every check file that the other helpers are changing
  this round, so it is left for a quiet moment after the merge.
- The new game files are in `tests/tsconfig.json`; the new test files have no findings.

## Shared files touched (small edits)

`js/games/frame.ts` (the fit: the wide try), `js/main.ts` (one line: the level, plus the import), `js/simple.ts` (the
guide button, the welcome/news line), `js/ui-settings.ts` (two lines: the section and its binding), `js/report.ts`,
`js/learn.ts` (the rest timer block), `js/art.ts` (one import), `css/style.css` (blocks at the end),
`tests/harness.mts` (`noWelcome` also marks Lumi's welcome and news heard, so checks of the Simple screen see what they
saw before), `tests/suite.mts` (HEAVY and SLOW_OWN entries), `tests/run.mts` (the new checks at the end),
`tests/checks/code.mts` (`types` also runs `tsconfig.tests.json`), `tests/tsconfig.json`.

Voice pack: `make-voice-pack.mts --engine azure` made 42 files and, as it does, removed 173 old Vietnamese entries no
longer in the code (136 files). The manifests are one-line JSON, so they will conflict with other helpers' recordings:
Release, run the voice pack once after merging (it is cheap: everything else is already recorded).

## Left for later

- Phone landscape, the games that draw their own layout (about 30, `tests/out/fivescreens/` after a run): Cờ cá ngựa,
  Trồng nụ trồng hoa, Cờ tướng and mini chess (board 53 px too tall), Tiến lên (both), Kéo cưa lừa xẻ, Đánh đáo, Ném
  còn, Đua thuyền (folk fields still a little tall), the outside games' floating pieces (hide and seek, nippers, duck
  duck goose), dotdot and shapebuilders (overlapping slots), rd_storyhelp, emueggs, marketcount, blindtag, pipes; and
  touch targets under 64 px for under-5s in hanoi, robot, oanquan, market, tower, chuyen, dragon, firstwords, rangoli,
  copygrid, mx_calendar (these are the same on every screen, not only landscape).
- The other sizes and the films part: see "Checks" for what ran.
- The website navigation script into `home/site.ts`.
- Roads and dirt roads to Concept D (#34): not started.

## Checks

(filled in below as they run)
