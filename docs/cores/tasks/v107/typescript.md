# v1.07 typescript: status

Branch `work/v107-typescript`, from main v1.06 (204ce75d). Brief: [typescript-brief.md](typescript-brief.md).
Started 2 Nov 2026 11:00 AEDT.

## Plan

Goal: move the remaining game `.js` sources in `js/` and `js/content/` to `.ts`, with no behaviour change, so the light
type check (`tests/tsconfig.json`, check `types`) covers each of them with 0 errors.

Inventory at the start (2 Nov 2026 AEDT, `js/*.js` and `js/content/*.js` without a `.ts` twin): 102 files.
- Left for a later round (World core's map files, brief item 1): `cities regions places homes hawkers regionsites
  realworld ferry houses animalhomes powerlines signposts reeds` (13 files).
- Also left: `js/vendors.js`. It is not in the brief's list, but CLAUDE.md's Round T rule 4 names it among the frozen
  map files, and the docs win over a brief when they disagree. It goes with the World batch.
- To convert this round: 88 files.

Trial (all 88 renamed at once, in a throwaway worktree): 1,000 light errors. 666 of them are "expected N arguments,
but got M": a JavaScript function called with fewer arguments than it declares. Marking those trailing parameters
optional (`name?`) is a type note only; Node's type stripping turns `b?` into `b ` and the `.js` is unchanged. A small
script using the TypeScript compiler finds and marks them (15 parameters in 9 files). That leaves 334 errors, fixed by
hand with type notes.

Batches (each: (a) a rename-only commit with `.gitignore` updated by `node tools/build.mts`; (b) a type-notes commit
that adds the files to `tests/tsconfig.json` with 0 errors):
1. `js/content/*.js` (27 files).
2. `js/a*` to `js/g*` (23 files): ads animals asia boxes cartoon chatter chipinfo commands companion coop credits data
   dayplan dinh emojiswap explain familycards feel festhunt folkshow fun gather gfx.
3. `js/h*` to `js/p*` (18 files): handpad hoilang icons input jobs kidplay kite listen lunar money nametags openspot
   owlguide passport pets photos placebook pricetags.
4. `js/s*` to `js/w*` (20 files): scrollhelp secrets showcase snacks songs soundsheet stickerfx stickers story surprises
   testergate twinchests util validate villagertalk vnfun wayfind weather words words2.

Paths: the made `.js` keeps its address, so `index.html`'s preload list, `sw.ts`'s offline list,
`tests/check-map.json` (keyed by the `.js`) and the bundle need no change. `tests/tsconfig.json` and
`tests/tsconfig-contracts.json` name `js/content/tester.js` and change to `.ts`.

Checks: `cd tests && node suite.mjs --changed` per batch; it will pick the full suite (shared files), so the GitHub
full suite (`full-suite.yml`) runs after batches 2 and 4.

Rules kept: no logic change; only type notes, plus the smallest equivalent rewrite where a note alone cannot express
it (each one listed below). No `@ts-ignore`, no `@ts-nocheck`.

## Progress

Resumed 2 Nov 2026 2:00 pm AEDT (Release: "resume").

- Batch 1 done (27 `js/content/*.js` to `.ts`):
  - b65c2740 rename only; 898790d8 type notes (0 light errors; `js/content/tester.ts` also 0 strict errors in
    `tests/tsconfig-contracts.json`); b3cc0b47 `tools/rules-from-doc.mts` now reads and writes `js/content/rules.ts`
    (the `rules` check failed after the rename; fixed), with `docs/ARCHITECTURE.md` and `checks.yml` comments.
  - Proof of no behaviour change: every built `.js` equals 204ce75d's `.js` with whitespace removed, except removed
    JSDoc comments in `tester` and brackets around `(helped)`, `(rule)`, `(v)` and two values in `films`.
- Tools that name game files (`tools/voice-lines.mts`, `make-voice-pack.mts`, `emoji-audit.mts`, `r79-shots.mts`)
  read or import the built `.js`, like the files converted before: no change needed (confirmed 2 Nov 2:05 pm AEDT).
- Batch 2 done (23 files `js/a*` to `js/g*`): d0a4f9af rename only; 412183d1 type notes, 0 light errors, contracts
  and names clean. Built `.js` equals v1.06's except brackets in `feel` and `gfx`. One type-only change outside the
  batch: `js/chat.ts` ChatTarget splits `'npc' | 'game'` into two members so a command's place target narrows.
- GitHub full suite on 412183d1 (batches 1 and 2): run 41381462510, started 2:08 pm AEDT.
- Next: batch 3 (`js/h*` to `js/p*`, 18 files), then batch 4, then the second full suite.

Helper: `docs/cores/tasks/v107/typescript-optfix.mjs` marks trailing parameters that callers leave out as optional.

## Checks

Batch 1, 2 Nov 2026 11:05 AEDT, `node suite.mjs --only unit,rules,types,arch,emoji,noemoji,preload,names,bilingual,boot,contract`
(`--changed` picks the full suite, which runs on GitHub after batch 2):
- pass: types, names, arch, bilingual, emoji, noemoji, preload, boot, contract.
- rules: fail, then fixed in b3cc0b47 (`node tools/rules-from-doc.mts --check` passes); not yet re-run in the suite.
- unit: fail, not from this branch: `Cannot find package 'pg'` (the repo root's `npm install` was not run in this
  container; the management tests need it). To re-run after `npm ci` in the root.

## Open questions

None.
