# r91: owner's points after v1, and every open point (Release, 24 Oct 2026 AEDT)

Paste the prompt below to the helper chat. Release (the other chat) collects its branch into r91, runs the full suite on
GitHub, reports to the owner and asks for "yes, deploy".

## Prompt (for the helper chat working on r91)

You are a helper chat for Sparkle Valley, not Release. Release collects your branch, merges it, runs the full suite on
GitHub, reports to the owner and asks for "yes, deploy". Your brief is `docs/cores/tasks/r91-open-points.md` (this
file); keep the CLAUDE.md "Helper chats" rules.

### Things to know first (so nothing confuses you)

- **The repository was renamed** (owner, 24 Oct 2026 AEDT): it is now `github.com/nguyentuanphu/tpn` (old links
  forward). The front notes (README, the CLAUDE.md and HANDOFF.md headings) say "TPN" on purpose. **The game is still
  Sparkle Valley · Thung Lũng Lấp Lánh**: build it, name it and show it to players under that name everywhere. Do not
  rename anything a player, parent or Studio sees.
- **Where the notes live:** `docs/README.md` is the start-here index. Finished round reports moved to `docs/history/`,
  the ads guide to `docs/guides/`. Nothing was deleted.
- **The version (owner, 24 Oct 2026 AEDT): v numbers everywhere, from this round.** r90 is live (24 Oct 2026, about
  1:45 pm AEDT), shown to families as "v1". From now on every build is v, the major number, a point and two digits:
  this round is **v1.01**, then v1.02 ... v1.99; a big upgrade starts v2.00. There are no more "r" numbers, inside or
  on screen: `js/build.ts` `BUILD` is `v1.01` (and `SHOWN` is the same), `sw.ts` VERSION ends `-v1.01`,
  `studio/version.json` says `v1.01`. `netlify/lib/build-number.mts` holds the rule for the website server, Studio and
  the checks; old devices and reports still say r83, r89.1, r90: they are read correctly and sort before every v build.
  **Only Release changes the version**; you never touch `sw.ts` VERSION, `js/build.ts` or `studio/version.json`.
- **The second set of games and stories** is held by two Studio switches, `newGames` and `newStories`, off by default
  (menus then show a wordless "Coming soon" tile). The test harness turns them on; `schedule: true` in `open()` keeps
  the real defaults.
- **Branch:** start from `origin/release/r91` (it has the docs tidy-up and the `tpn` changes), on the branch this
  session was given. Start of session: `git fetch`, then merge `origin/release/r91` and `origin/main` into your branch.
  Resolve generated files with the repo's tools (`node tools/preload.mts`; the website with
  `docs/website-review-20261023/sync-website.mjs`, then `--record-reviewed`, then `node tools/build-website.mts`).

### How to work

- **Read first:** CLAUDE.md, HANDOFF.md, docs/README.md, docs/cores/README.md, docs/cores/BOARD.md (all of it) and the
  core file for each core whose files you touch (Kid UI, Online, Play, Analytics & Infra).
- **Plan first and wait:** show the owner your plan (what, which files, which checks, what is left for later) and wait
  for the owner's "go", asked with a pop-up question (2 to 4 choices, the recommended one first). With no answer after
  15 minutes, carry on with the recommended choice and write it down as "assumed, owner can change".
- **Never:** bump the version; merge into `main` or deploy; change world positions or the map files (helper rule 4);
  weaken, skip or delete a check; force-push.
- **Art:** everything a child sees is our own drawing in `js/art.ts` (`pic()`), never a phone emoji, on screen and on
  canvases; a new picture gets a new drawing. English and Vietnamese for everything a child sees or hears. Touch
  targets 44 px or more (64 px for under-5s). No emoji in docs.
- **Checks:** `cd tests && node suite.mjs --changed`. If it picks the full suite, push and start
  `.github/workflows/full-suite.yml` on your branch by hand instead of running it locally. The `cloud` check needs the
  local services: `npm ci --prefix tests/services` then `node tests/services/start.cjs &`. Look at phone, tablet and
  computer screenshots for every change you can see.
- **Spoken lines:** record new ones with `node tools/make-voice-pack.mts --engine azure` if `AZURE_SPEECH_KEY` is set
  (never print or commit the key), otherwise list them for Release.
- **Pushing:** push your own branch whenever your checks pass, after `git pull --no-rebase`, without asking. Any pull
  request stays a draft.
- **When done:** "ready for Release" on your board line (branch, last commit, assumed choices); every check with pass,
  fail or skipped (commit id, date AEDT) in your core file's progress notes; the owner's decisions under "Owner's
  decisions". Do not close GitHub issues: Release closes them with "Fixed in v1.01" once the round is live.

### The work, in this order

#### 1. Tester: fixed reports go into the ladybird, no pop-ups (owner, 24 Oct AEDT)
Owner: "the congrats on finding a bug fix is a bug itself, I will need to accept many times and then go in the bug to
confirm ... no need for thank you but show this in the ladybug icon; also for the bug report show in a list within the
ladybug and let them accept one or all".
- No "Fixed · rNN / Please check: is it fixed?" pop-up cards (js/tester.ts, around "Fixed in rNN: please check") and
  no Ông Cú thank-you speech or confetti for a fix (js/testerrewards.ts, "You found this, and now it is fixed!").
- The ladybird button (`.z-lb`) shows a small count badge of fixed reports waiting to be checked.
- Inside the ladybird: a "Fixed, please check · Đã sửa, con thử lại nhé" list, one row per report (its title), each
  with "Yes, fixed" and "Still wrong", plus "All fixed · Tất cả đã hết lỗi" at the top. One answer per report: an
  answer in the list is the only answer (nothing asks again).
- The coins for a helped fix are still given, quietly (a "+15" on the row), not with a speech.
- Do not show the internal build number ("r89") to testers: show the public number when there is one (v1 or later),
  otherwise just "Fixed".
- Checks: update `tester`, `testerrewards`, `testernews` as needed (never weaker); phone, tablet, computer screenshots.

#### 2. Settings and Grown-ups: buttons float, no white bars (owner, 24 Oct AEDT)
Owner: "in the settings the done button and the settings show as a white bar that blocks, it should just be the button
itself floating".
- The Settings title row ("Settings · name · Version v1") must not stay stuck as a white bar over the content: the
  title scrolls away with the card; only the round ✕ stays, floating, with no bar behind it.
- The "Done" button (Grown-ups `#gDone`, the tester card, any `.floatbar` / `.floatbtn`) floats by itself: no white
  strip behind or around it (css/style.css: `.modal .card .actions.floatbar`, `.grownups #gDone`, `.floatbtn`).
- Content under a floating button stays reachable (padding at the end of the card).
- Check the `phone` and `settings`-related checks; screenshots on phone, tablet and computer, both languages.

#### 3. Grown-ups: one backup, the newer one (owner, 24 Oct AEDT)
Owner: "the back up save and load seem like they are the same, use the newer one".
- Keep "Save a copy / Load a copy" (the newer one). Remove the older "Backup to Google Drive or iCloud" section
  (js/ui-settings.ts, around line 256) and its buttons.
- **Never lose an old backup:** "Load a copy" must still open a file made by the old backup
  (`sparkle-valley-backup-<date>.txt`, `{app:'sparkle-valley', v:2, profiles, farm, settings}`), with the same check
  and the same "replace?" question. Add a unit test for it.
- The "last backup" date and the 7-day reminder (`settings.lastBackup`, `backupAge()`) now follow "Save a copy".
- The section headings and buttons there use raw emoji (cloud, disk, outbox and inbox pictures): use our drawings (`pic()`).

#### 4. Simple screen: Home next to the top buttons (owner, 24 Oct AEDT)
Owner: "in the simple screen the home webpage should be moved next to speaker, sound and parent setting".
- Move the Home (website) button (`.sp-home`, js/simple.ts) into the top-right group with the speaker, "Sound" and the
  Grown-ups gear (`.sp-top`), the same size and style as those (64 px for under-5s). It keeps opening the floating
  website with "Back to game" (the `simple` check covers it).

#### 5. Playing together over the cloud: photos (Online)
- The owner's test (24 Oct AEDT, two devices): device A started a room and sees both faces; **device B (joined) sees
  A's face but not its own face**.
- The `cloud` check fails the other way round: over the cloud route the room starter never gets the joiner's photo
  (`photoAtA: null`). It fails on r89.1 too (not caused by r90).
- Find and fix both: the joiner's own avatar losing its photo after joining (look at `sendHello`, `helloPhoto` and
  `G.heroes[0].profile.photo` in js/main.ts), and photo delivery on the cloud route (`_sendPhoto`, `photoreq` and the
  `via === 'cloud'` checks in js/net.ts). Privacy rules stay: a photo goes only after admission, locked per player.
- Done when `cloud` passes locally (with the services above) and the two-device test shows every face on both.

#### 6. Simple screen follows the unlock rules
When the second set is switched on, the Simple screen lists the second-set games and stories only once they are
unlocked, the same as the menus (js/content/unlocks.ts `isOpen`, `isHeld`).

#### 7. Family code, made inside the game (plan: docs/cores/tasks/save-copy-family-code.md, Part 2)
The owner decided (24 Oct AEDT) that families never need the creator or Studio: the first device makes the code in
Grown-ups, other devices type it or scan its QR, Studio only counts devices with the same code (as a hash). Show the
plan and the privacy wording (English and Vietnamese) to the owner before building.

#### 8. Tester issues on GitHub (replay before changing code; fix only what reproduces)
- #499: "ResizeObserver loop completed with undelivered notifications" is a harmless browser notice: stop the tester
  from reporting it (js/tester.ts error capture), with a unit test.
- #448, #449 (Robot Planner: a button covered, from r87): replay with auto play at x5
  (`tests/owner-autoplay-plans.mjs --speed=x5 --ids=robot`) and tell Release whether they are fixed.
- Freeze and slow reports (#473 to #505 and older): group them by where they happened (Studio, Analytics, Tester
  reports, "last 30 seconds") and fix the biggest group; list the rest for Release.
- Play Outside games that move on without waiting for a tap (egg and spoon, kick to kick, hoops): make them wait.

#### 9. Left for later (no work unless the owner asks)
- GitHub privacy (private repository) is the owner's call.
- Release keeps: the version numbers, the full suite, the report, "yes, deploy", closing issues.
