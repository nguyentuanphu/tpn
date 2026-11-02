# v1.07 rules: status

Helper: rules. Branch: `work/v107-rules`. Started 2 Nov 2026, 11:00 am AEDT.

## Plan

1. List every game in Play that has real-world rules (traditional Vietnamese and Australian games, board and card games, playground games). Learning quizzes, drawing and craft games have no outside rules to compare; they are listed as "not a rules game".
2. For each rules game: read the code (rules, gentle under-5 variant), compare with the real rules, with the guide text (`js/howto-data.ts`, `js/howto-data2.ts`), the in-game help text and the guide film (`js/content/films.js`).
3. Write `docs/rules-audit/README.md`: one row per game, verdict CORRECT, SIMPLIFIED (said / not said) or WRONG.
4. Fix what is wrong in that game's own file, with a unit check (`tests/unit/` or a new `check(...)` at the end of `tests/run.mjs`). Simpler for under-5s stays.
5. Guide and voice text changes in both languages. No Azure key in this session unless set: new lines are listed below for Release.
6. Levels: not touched (levels helper). Only rule code and rule text.
7. Checks: `cd tests && node suite.mjs --changed`.

## Notes

- There is no Bầu cua game in the catalogue (the brief names it as an example); recorded in the audit.
- The older rules work: issue #350 (Ô Ăn Quan, closed 1 Nov 2026), `docs/v1.02-traditional-repairs/` (Cờ cá ngựa, Snakes, Ô Ăn Quan, six folk games).

## Progress

- 11:00 am AEDT: briefs read, game list made, audit started.
- About 11:05 am AEDT: audit done for every rules game (table: `docs/rules-audit/README.md`). Eleven wrong rules, guides or lines fixed in each game's own file. New check `tests/unit/rules-audit.test.mjs` (fails without the fixes, passes with them). Commit `09c5b6bf`, then a type fix in `js/games/sudoku-core.ts` (`Set<number>`).
- New spoken lines recorded with Azure (`node tools/make-voice-pack.mts --engine azure`): 12 files (3 English and 3 Vietnamese lines, woman and man voices), committed under `voices/`.
- Paused at about 11:15 am AEDT on Release's "slow down" message (usage). Waiting for "resume" after 2 pm AEDT.

## Checks so far

- `node --test unit/rules-audit.test.mjs`: pass (2/2).
- Quick checks (`suite.mjs --only unit,rules,types,arch,emoji,noemoji,preload,names,bilingual`): 7/9 pass.
  - `types` failed on `sudoku-core.ts` (Set type). Fixed; re-run after resume: **pass** (216 files).
  - `unit` failed only because `pg` was not installed (session setup). After root `npm ci`, re-run: **pass** (482 unit tests).
- `suite.mjs --changed` picks the **full suite** (`.gitignore` changed: the build added `js/games/sudoku-core.js` to it). By the round rules it runs on GitHub, not locally.

## Exact next step (after "resume")

1. Run `npm ci` in the repo root (for `pg`), then re-run `cd tests && node suite.mjs --only unit,types` (game server: `python3 -m http.server 8765`).
2. Start `.github/workflows/full-suite.yml` with workflow_dispatch on `work/v107-rules`; fix anything red.
3. Look at phone, tablet and computer pictures of Bánh Chưng, Duck Duck Goose and Pass the Parcel.
4. Open the draft pull request "v1.07 rules: audit and rule fixes", then write "ready for Release" at the top of this file.

## For the levels helper

Only rule code changed in shared game files: `folk.ts` (Mr Wolf dinner step), `folk2.ts` (Parcel stop layer), `outside.ts` (Duck Duck Goose goose and sitting; Tag line), `vietnam2.ts` (Bánh Chưng steps), `more.ts` (Sudoku holes now from `sudoku-core.ts`), `snakes.ts`, `thinking2.ts`, `vietnam.ts`, `cacuangua-core.ts`. No level numbers changed. Left for levels: Snap under-5 uncles still snap after about 4 s; Đá Cầu drop does not reset the count.
