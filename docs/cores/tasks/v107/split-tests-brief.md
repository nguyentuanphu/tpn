# v1.07 brief: split-tests

Name: split-tests. Branch: work/v107-split-tests.

Split `tests/run.mjs` (about 786 KB, 7,700 lines) into files by group under `tests/checks/`, for example games, valley and map, simple screen and hub, online and friends, Studio, voice and audio, tester and reports, festivals, owner-reported. The owner's plan (docs/plan-hoan-thien/KE-HOACH.md, focus 3, step 1) does this first because it does not touch the game, and it lets `suite.mjs --changed` pick fewer checks.

Must hold:
- Every check keeps its exact name. `node suite.mjs --only <name>`, `--list`, `--changed`, `--jobs` and the GitHub full-suite workflow's sharing across 8 machines all work as before.
- `tests/check-map.json` and `tests/check-times.json` keep working. Update `suite.mjs` or the map maker if they read `run.mjs` by path.
- Helpers shared between checks (`open`, `clear`, the browser `b` and so on) go into one shared module. Do not copy them.
- No check's logic changes. A pure move: compare the list of check names before and after (the counts must match exactly), and say so in your status file.
- Other helpers will add new `check(...)` blocks at the end of `tests/run.mjs` while you work. Leave a short way to add a new check (document it at the top of `tests/run.mjs` or in `tests/README`), so Release can move their new checks into the right group when it merges.

Prove it with a GitHub full-suite run on your branch: same number of checks, all passing that pass on main. Also convert the new group files to `.mts` only if that is simple; otherwise note it for later.
