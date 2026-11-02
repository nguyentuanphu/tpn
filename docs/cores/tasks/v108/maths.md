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

## Progress

(filled in as work goes)
