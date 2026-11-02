# Plan: strict type checking for the game files (v1.07 typescript, 2 Nov 2026 AEDT)

Status: plan only. Strict is **not** turned on. This follows item 5 of [typescript-brief.md](typescript-brief.md) and step 5
of [the TypeScript plan](../typescript-plan-20261016.md).

## Where we are (measured 2 Nov 2026 AEDT, commit 145221eb)

The probe ran `tests/tsconfig.json` once with `strict` and `noImplicitAny` on, without saving that setting.
- Game files listed in `tests/tsconfig.json` (`js/`, `studio/ui/`, `home/`): 245.
- **Already strict-clean: 71.** The 11 in `tests/tsconfig-contracts.json` are checked strictly today; the other 60 are
  clean but not yet held to it.
- The rest: 51 files have 1 to 10 errors, 76 have 11 to 50, 38 have 51 to 200, and 9 have more than 200
  (`studio/ui/app.ts` 1219, `js/main.ts` 777, `js/world.ts` 487, `js/ui.ts` 454, `js/autoplay.ts` 356,
  `js/net.ts` 254, `js/festivals.ts` 245, `js/content/films.ts` 236, `js/voice.ts` 209).
- About 10,000 errors in the listed files (12,842 counting the files they import). Kinds: 68 % are a parameter
  without a type (TS7006/7005); 18 % are a value that may be null or undefined (TS18047/18048); 8 % are an index
  without a type (TS7053).
- The per-file numbers are in [typescript-strict-ratchet.json](typescript-strict-ratchet.json).

## Ratchet

1. Add a check `strict` (in `tests/run.mjs`, at the end, its own `check(...)` block). It runs the same probe and
   compares it with the ratchet file (moved to `tests/strict-ratchet.json`, like `tests/perf-baseline.json`).
   - A file at 0 errors may never go above 0.
   - No file may go up.
   - The total may only go down. When a file's count drops, the check says so and the number is lowered in the same commit.
2. A file that reaches 0 moves into `tests/tsconfig-contracts.json`, where it is fully strict.
3. No broad `any`, no `@ts-ignore`, no casts just to make a number drop (owner repair rules, 14 Oct). The
   null checks get real guards, which is a behaviour change, so they go in commits of their own with tests.

## Order

1. Move the 60 clean files into `tests/tsconfig-contracts.json` and add the ratchet check. This is a small change
   with no code edits, one round.
2. The 51 files with 1 to 10 errors, a core at a time (mostly parameter types: notes only).
3. Shared types first for the big ones: the shared game object (`SvMain` in `js/main.ts`), the hero and the
   profile. Most errors in the large files come from them, and in the files that use them.
4. Then the 11 to 50 group, then the large files, one per round, with the World files after Round T's map work.

## Not done this round

- The 14 World map files are still `.js`: `animalhomes cities ferry hawkers homes houses places powerlines realworld
  reeds regions regionsites signposts vendors`.
- Tests, tools prototypes, Studio translation source and marketing scripts (row 7 of
  `docs/plans/bugs-typescript-20261019.md`).
