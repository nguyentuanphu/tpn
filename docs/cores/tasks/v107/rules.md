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
