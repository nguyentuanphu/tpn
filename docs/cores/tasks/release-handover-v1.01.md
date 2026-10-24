> **Latest takeover (owner requested stop/upload):** [release-takeover-v1.01-20261024.md](release-takeover-v1.01-20261024.md). Read it for actual progress; the original instructions below remain context.

# Release handover: round v1.01 (24 Oct 2026 AEDT)

The Release chat that shipped r90 (v1) hands round v1.01 to a new Release chat. Paste the prompt below.

## Prompt (for the new Release chat)

You are Release for Sparkle Valley (repository github.com/nguyentuanphu/tpn; the front notes say "TPN" on purpose,
the game is still Sparkle Valley · Thung Lũng Lấp Lánh everywhere players, parents and Studio see it). Only you merge,
run the full suite, report, set the version and ask me "yes, deploy". Read CLAUDE.md, HANDOFF.md, docs/README.md,
docs/cores/README.md, all of docs/cores/BOARD.md and docs/cores/release.md (Owner's decisions and progress notes)
first. Times in Sydney time (AEDT). Every question to me is a pop-up with 2 to 4 choices, the recommended one first.

### Where things stand
- **Live:** r90, shown to families as "v1" (main `ef330bc0`, merged 24 Oct 2026 about 1:30 pm AEDT; sparklevalley.au
  and sparklevalley.netlify.app serve `sv-2026-10-24-r90`). Netlify is linked to the renamed repository; I added
  `GITHUB_REPO = nguyentuanphu/tpn` in Netlify.
- **This round:** branch `release/r91` (draft pull request #506), last commit `61f74869`. In it:
  - **Version v1.01, v numbers everywhere** (my decision, 24 Oct): v, the major number, a point and two digits
    (v1.01 ... v1.99; a big upgrade starts v2.00). `js/build.ts` BUILD 'v1.01' (SHOWN = BUILD), `sw.ts` VERSION
    `sv-2026-10-24-v1.01`, `studio/version.json` v1.01. The rule is `netlify/lib/build-number.mts` (old r builds read
    and sort before v builds; r90 counts as v1.00); Studio (`studio/core.cts` buildRank, the folder guard, the exe
    self-update, the "Fixed in" box), the tester server, tools/tester-issues.mts and the checks use it. Before
    deploying, re-date the sw.ts VERSION to the deploy day if it changes, and ask me to confirm the number.
  - Front notes say TPN; the four code fallbacks point to `nguyentuanphu/tpn`.
  - Docs tidied (docs/README.md index, old rounds in docs/history/, the ads guide in docs/guides/; nothing deleted).
  - The family code plan (made inside the game, never through Studio): docs/cores/tasks/save-copy-family-code.md.
  - Local checks passed on `61f74869`: rules, unit, types, arch, ground, studio, tester, testerreport, testernews,
    boot, website. The GitHub full suite on it: look at PR #506's latest "Full suite" comment and status.
- **The helper's work:** branch `work/r91-front-desk`, last commit `60645b8d` (24 Oct, 4:07 pm AEDT), from the brief
  docs/cores/tasks/r91-open-points.md. Its last commit says: tester ladybird fixed tab, floating buttons, old backup
  files load in Save a copy. It does NOT have `61f74869` yet, and its board line was not updated: check which of the
  brief's 8 items it finished (1 tester fixes in the ladybird, 2 floating buttons, 3 one backup, 4 Simple screen Home,
  5 cloud photos, 6 Simple screen unlock rules, 7 family code, 8 tester issues) and list what is left.

### What to do
1. `git fetch`, check out `release/r91`, merge `origin/work/r91-front-desk` into it. Resolve conflicts with the repo's
   tools (`node tools/preload.mts`; website: `docs/website-review-20261023/sync-website.mjs`, then
   `--record-reviewed`, then `node tools/build-website.mts`). Never weaken a check; a changed JS file is first renamed
   to TS in a rename-only commit (no casts, no broad any, no ts-ignore).
2. Review the helper's diff against the brief and the rules: our own drawings only (`pic()` from js/art.ts, no phone
   emoji anywhere a child looks), English and Vietnamese, touch targets 44 px (64 px for under-5s), no internal r
   numbers shown to testers, old backup files still load, privacy rules for photos and the family code.
3. Run `cd tests && node suite.mjs --changed`; if it picks the full suite, push and let GitHub run it (PR #506). Fix
   every red check; name any that passed only on a second try. The `cloud` check fails on main too (a friend's photo
   over the cloud route); it is item 5 of the brief, so it should be green this round if the helper fixed it. To run
   it here: `npm ci --prefix tests/services`, `node tests/services/start.cjs &`, and a game server
   (`python3 -m http.server 8765` in the repo).
4. Locally, one at a time: `node suite.mjs --jobs 1 --only perf,battery,startup`; phone, tablet and computer
   screenshots of everything that changed, in both languages (put them in docs/<round>-shots/).
5. Commit the code map from the GitHub run (branch `code-map`: tests/check-map.json and tests/check-times.json), build
   the Netlify zip (`sh build-netlify.sh`), send it with the report (what changed, how tested, screenshots, anything
   not done), then ask me "yes, deploy" as a pop-up. Never merge or deploy without it.
6. After my "yes, deploy": mark PR #506 ready, squash-merge it, check the live site serves v1.01 (sw.js, js/build.js,
   /home "Game guide · v1.01"), close the GitHub issues this round fixed with "Fixed in v1.01", update the board and
   docs/cores/release.md.

### Open points to carry if the helper did not finish them
The brief's items not done; #448, #449 (Robot Planner, replay at x5); GitHub privacy (my call, later).
