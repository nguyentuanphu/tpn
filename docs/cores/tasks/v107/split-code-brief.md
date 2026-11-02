# v1.07 brief: split-code

Name: split-code. Branch: work/v107-split-code.

This is focus 3 of the owner's plan (docs/plan-hoan-thien/KE-HOACH.md): split the big code files. The goal is no code file over 60 KB (data files such as stories, films and drawings are the exception), and no new line longer than 200 characters.

This round, in this order:
1. **Split `js/ui.ts` (119 KB)** into `js/ui/`: `hub.ts` (Play), `profile.ts` (the child's profile), `grownups.ts` (Grown-ups), `festivals-ui.ts`, `friends.ts`, plus whatever else it holds. `js/ui.ts` keeps its exports, re-exported, so no import elsewhere has to change.
2. **Split `js/art.ts` (170 KB)** into drawing groups under `js/art/`, with the same re-exports.
3. **Do not touch `js/main.ts` or `js/world.ts` this round.** The startup helper is changing `main.ts`, and the roads helper is changing the world. Write a split plan for both into your status file, for v1.08.

Rules:
- A pure move: no logic change. One commit per file split.
- Update `tests/check-map.json`, the preload list (`node tools/preload.mts`), the offline list in `sw.ts`, and any test that reads a path.
- Watch `perf`: the first download must not grow. Splitting may also let parts load later; note it, but leave the loading change to the startup helper.
- `--changed` will pick the full suite, so run it on GitHub. Look at phone, tablet and computer screenshots of Play, the profile and Grown-ups.
