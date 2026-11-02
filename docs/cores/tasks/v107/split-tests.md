# v1.07 split-tests: status

Branch: `work/v107-split-tests` (from main v1.06). Brief: [split-tests-brief.md](split-tests-brief.md).
State: in progress (2 Nov 2026 AEDT).

## Plan (2 Nov 2026, 11:00 am AEDT; covered by the owner's go of 2 Nov)

1. Read `tests/run.mjs` with the TypeScript parser: 297 `check(...)` blocks, and 39 other top-level pieces (imports,
   `check`, `ok`, the browser `b`, `packedSite`, `serveFolder`, `pairKeys`, `withEmo`, `testerPre`, `testerSite`,
   `ACCEPTED`, `ownerSmoke`, the final summary).
2. Move every helper into one shared module, `tests/checks/shared.mjs`, with `export` (the browser `b` stays a live
   binding, so a browser replaced after a stuck check is the one every group sees).
3. Move the checks unchanged into 16 group files under `tests/checks/`, each importing only the shared names it uses.
4. `tests/run.mjs` becomes the runner: imports the groups in the order of `tests/checks/index.mjs`, then runs its own
   last checks and the summary. It keeps the old last three checks so branches that added a check at the end of the
   old file merge without a conflict; that is also where new checks go.
5. `tests/suite.mjs` reads all the check files for `--list`, `--changed`, `--only`, `--shard`, the code map and
   `bodyOf` (css and tools file names).
6. Prove: same 297 names; each check's text identical apart from path fixes; no name lost (TypeScript compares the
   unknown names per check before and after); quick checks and a browser sample locally; the GitHub full suite.
7. Not in this part: converting the group files to `.mts` (see "Later").

## Files

- New: `tests/checks/shared.mjs`, `tests/checks/index.mjs`, `tests/checks/README.md` and the group files
  `code`, `content`, `startup`, `screens`, `games`, `learning`, `valley`, `play`, `online`, `studio`, `voice`, `tester`,
  `festivals`, `stories`, `autoplay`, `owner` (`.mjs`).
- Changed: `tests/run.mjs` (now 25 lines: runner, how to add a check, the last three checks, the summary),
  `tests/suite.mjs` (reads every check file), `tests/README.md` (one line).
- Shared file touched: `tests/run.mjs` (the whole file, by design of this part).

## The pure move, checked

- Check names: 297 before, 297 after, the same sorted list (`diff` of the two lists is empty). No name repeated.
- Check text: 241 checks byte-for-byte identical. 56 differ only by the path fixes a move one folder down needs:
  `import('./x.mts')` to `import('../x.mts')`, `import('../js/x.js')` to `import('../../js/x.js')`,
  `new globalThis.URL('../sw.js', import.meta.url)` to `'../../sw.js'`. One more: the `rules` check read `run.mjs` to
  find the rule ids the checks name; it now reads `run.mjs` and `checks/*.mjs` (still 34 ids, the same as main).
  Paths given to `fs` and child processes are relative to `tests/` and did not change.
- Names in scope: TypeScript lists, for each check, the names it uses that nothing defines. The lists are the same
  before and after for all 158 checks that have any (a removed import is caught: tried on purpose).
- `suite.mjs --shard k/8 --no-solo --list`: the same checks on each of the 8 machines as main.
- `suite.mjs --changed --list --base HEAD` after an edit inside the `gamelevel` check picks only `gamelevel` and the
  quick checks; an edit to a group's import line, or to `shared.mjs`, picks the full suite; an edit to a check kept in
  `run.mjs` picks that check.
- Order: the groups run one after another, so the order differs from the old single file. No check depends on another
  (each opens and closes its own windows), and GitHub already runs them in different sets on 8 machines.

## Checks

| Check | Result | Where |
| --- | --- | --- |
| unit, rules, types, arch, emoji, noemoji, preload, names, bilingual, validate, mapcoords, viwords, terrainmath | pass (13/13) | local, 2 Nov AEDT, commit 5537d2b0 (unit needed `npm ci` in the repo root first) |
| browser sample from every group | running | local |
| `suite.mjs --changed` | full suite (tests/run.mjs changed outside a check: expected) | local |
| GitHub full suite | to start | GitHub |

## Later

- `.mts` for the group files: simple in itself (Node runs `.mts` here), but `suite.mjs`, `index.mjs` and the docs name
  `.mjs`, and the `types` check would then try to type the checks. Left for a later round, after Release has merged the
  other helpers' new checks.

## Open questions

None.
