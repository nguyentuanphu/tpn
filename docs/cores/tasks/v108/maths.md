# v1.08 helper: maths (status)

Branch `work/v108-maths` from `origin/release/v1.08`. Brief: `maths-brief.md`. Plan part D, maths.

## Plan (3 Nov 2026 AEDT)

1. **The 7 held-back maths games** (numline, tenframe, dice, evenodd, measure, beforeafter, halves): take them out of the
   Studio "New games" hold (`js/content/secondset.ts`, numbers list empty), after checking each one's rules, levels, guide
   (How to play steps in `js/howto-data2.ts`) and voice lines. The `secondset` check used `numline` as its sample of a
   held game; it moves to `solids` (still held), because numline is no longer in the second set.
2. **21 new maths games**, area `numbers` (the Learning tab, Con số), each linked into Học vui > Toán
   (`js/content/hocvui.ts` CORNER_LINKS.hv_math). One shared engine (`js/games/maths-kit.ts`) draws a picture, says a
   question and offers answer buttons (64 px), with Easy, Medium, Hard and Talent set by `lv()` (noted for `levelsall`)
   and a plan for autoplay and the checks. Games in two files: `js/games/maths3.ts` (11) and `js/games/maths4.ts` (10).
   Ids start `mx_`:
   - mx_bonds Number Bonds, mx_takeaway Take Away, mx_skip Skip Counting, mx_patterns Patterns, mx_shapehunt Shapes Hunt,
     mx_symmetry Symmetry, mx_heavy Heavier or Lighter, mx_full Full or Empty, mx_pizza Pizza Fractions,
     mx_graph Picture Graph, mx_calendar Calendar;
   - mx_quarter Quarter Past, mx_sudoku Number Puzzle, mx_bigger Bigger Number Race, mx_doubles Doubles,
     mx_tens Tens and Ones, mx_missing Missing Number, mx_solids3d Shapes in 3D, mx_leftright Left and Right,
     mx_sprint Mental Maths Sprint, mx_grouping Count by Grouping.
3. **Each game:** English and Vietnamese text; spoken questions are fixed sentences or templates with number gaps only
   (recorded with Azure as whole lines and parts); its own icon drawing in `js/art/maths3.ts` (key `mx:<name>`); a How to
   play guide of three steps with drawn pictures (`js/games/maths3-meta.ts`, read by the TV button's guide film); a place
   in the valley for the map pin: Cô Tam's school on Two Homes Street (`G.GAME_SPOT`, set in `js/school.ts`, no place moved).
4. **Checks:** `levelsa` and `hocvui` lists get a maths sample; `games`, `levelsall`, `guides`, `voicecover`, `emoji`,
   `noemoji` cover every game already. Then `cd tests && node suite.mts --changed`; the full suite on GitHub if it asks.
5. Left for later: none planned; the plan's later batches (v1.09, v1.10) are science and English, not this brief.

## Shared files touched (each a marked block `// (v1.08 maths)`)

- `js/content/activities.ts` GAME_INFO, `js/games/catalog.ts` (catalogue and loaders), `js/content/hocvui.ts`
  (CORNER_LINKS.hv_math), `js/content/secondset.ts` (numbers list), `js/art.ts` (one import), `js/games/registry.ts`
  (one import of the guides), `js/school.ts` (map pins), tests `play.mts` (secondset sample), `games.mts` (levelsa sample).

## Progress (3 Nov 2026 AEDT)

- Done: the 21 games (`js/games/maths-kit.ts`, `maths3.ts`, `maths4.ts`), their drawings (`js/art/maths3.ts`), guides
  (`js/games/maths3-meta.ts`), registration in the shared lists, map pins at the school, the 7 numbers games switched on.
- Fixes to the 7 held games: their rules, levels and guides were right. Their four questions with a number (Hop the
  Number Line, Pairs or Odd, Before and After, Share in Half) were built by string joining, so the voice pack had no
  recording or template for them; they are now spoken through `api.say` templates and their parts are recorded.
- Probe (not committed): every new game opened and won by tapping the right thing at under-5, Easy and Talent on a phone
  (390 x 844), no page errors; targets 64 px. Screenshots of phone, tablet (820 x 1180) and computer (1366 x 800) looked
  at: the balance first tipped the wrong way and some drawings shrank; both fixed.
- Voices: recorded with Azure en-AU and vi-VN (`node tools/make-voice-pack.mts --engine azure`), then `--areas`.

## Checks (local, 3 Nov 2026 AEDT)

- pass: games (258 games), guides (258), secondset, hocvui, levelsa (now with mx_sprint and mx_patterns), hubmap,
  types, names, bilingual, rules, unit, levels-all run on the 28 maths games.
- fail, not this branch: emoji, because `docs/plans/v108-owner-batch-20261103.md` (Release's plan) has an emoji.
- `node suite.mts --changed` picks the full suite (shared files and test code changed): run on GitHub,
  `.github/workflows/full-suite.yml` on this branch.

## For Release

- Shared files changed (marked `// (v1.08 maths)`): `js/content/activities.ts`, `js/games/catalog.ts`,
  `js/content/hocvui.ts`, `js/content/secondset.ts`, `js/art.ts`, `js/games/registry.ts`, `js/school.ts`,
  `js/games/numbers2.ts`, `tests/checks/play.mts` (secondset sample now `solids`), `tests/checks/games.mts` (levelsa).
- New spoken lines are recorded (no line has a name in it).
