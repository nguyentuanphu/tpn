# v1.08f bugs: clear the open bug reports before the v1.08 full suite

Read first: `CLAUDE.md`, `HANDOFF.md`, `docs/cores/front-desk.md` (the small-bug and big-bug rules), `docs/cores/tasks/v108f/README.md`.

## What to do

1. **List the open bugs.** Every open GitHub issue labelled `bug`, plus the tester reports in Studio (the ladybug list) still open.
   - Group them by core: World, Play, Kid UI, Voice and audio, Online, Studio.
   - Note the version each was reported on.
2. **Check each one against `origin/integrate/v108`,** not main: v1.08 has changed a lot.
   - Many may already be fixed. Write "fixed in v1.08 by …" with the commit, so Release can close it after the deploy.
   - Do not close issues yourself. Release closes them after "yes, deploy".
3. **Fix every small bug that is still there** (the small-bug rule in `docs/cores/front-desk.md`), at its root cause.
   - Each fix gets its own commit naming the issue number.
   - For a big bug, write the plan in your status file for the owner. Do not build it.
4. **Do not touch** the files the open helpers are changing:
   - `js/avatar.ts`, `js/friend-model.ts`, `js/film.ts` and the villager files (faces helper);
   - `js/modelkit.ts`, the places models and `js/s2au-region.ts` (places-fix helper).
   - If a bug lives there, write it in your status file for Release.

## Checks

- **For each fix:** the check that covers it (`tests/check-map.json`). Add a check where none covers it.
- **At the end:** `types`, `boot`, `phone` and `bilingual`.
- Never weaken a check.

## Status file

`docs/cores/tasks/v108f/bugs.md`
- The table of every open bug: issue, core, state (fixed before, fixed now, big with a plan, cannot reproduce), and commit.
- It runs on another account. End with a short report for the owner to pass to Release.
