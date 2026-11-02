# v1.07 tester-bugs: status

**ready for Release** (2 Nov 2026, 2:40 pm AEDT): branch `work/v107-tester-bugs`, draft PR #783, full suite green on GitHub.

Branch `work/v107-tester-bugs` (from main v1.06). Helper chat, started 2 Nov 2026 AEDT.

## Plan

1. Read each issue #746-#781 with its report, note the build it came from.
2. Replay each listed game with auto play on v1.06 (one at a time, 929x1129 like the reporting PC, x5).
3. Replay the situation the reports point to (see "What the reports show") and fix what reproduces.
4. A check for each fix, at the end of `tests/run.mjs`, then `node suite.mjs --changed`.
5. List every issue below as fixed (with the check), not reproduced (with what was tried) or needs owner.

## What the reports show

- Every report #747-#778 comes from one Windows Chrome PC (929x1129) and was first seen on **v1.04**; the copies marked v1.05
  were sent again from the auto play window's "Send / retry report" after the update (the 30 seconds before them show no
  auto play running, only a walk and Skipping Rope, then the whole stored list sent 0.4 s apart, all at "(0, 0)").
- #747 and #748 name what covered the buttons: "Sparkle Valley is open in another tab or window, so this one has stopped".
  The game had been opened in a second tab while auto play ran. That tab stops (the game is paused under the notice), but
  auto play went on: every game was covered (could not work out how to play it, did not close, did not open), the paused
  child stood still (stuck at 69, 151 and 57, -149, the meadow spots of Robot Planner and Mountain Maze) and it counted the
  frames of a stopped tab (0 frames a second). Each was sent as a problem.
- The stopped tab still drew the 3D valley under its notice (its notice is not a `.modal`, so the world never rested): two
  games drawn at once on one PC, which fits #746 (16 frames a second in Brisbane on the same PC) and the 12 fps it showed.
- #780 (v1.05, Android tablet 1600x960, Mirror Painting / Colour by Number): both freezes came 5 s after a "no recording"
  report, whose picture of the screen ran as one block on v1.05. This is #745, fixed in v1.06 (`capturefreeze`).
- #781 (v1.05, same tablet, Odd One Out, 13 fps): the device itself reported 13 fps; see below.

## Fixes

- `js/autoplay.ts`: when another tab takes over (`sv-held`), auto play stops at once, records nothing for the step it was
  in, sends nothing, does not touch the shared save, and the last report says "Stopped: the game was opened in another tab
  or window" with no Send button.
- `js/tester.ts`: no automatic report from a tab another tab took over; "Send / retry report" of a stored run sends it under
  the version it was made on (it said v1.05 for problems seen on v1.04).
- `js/main.ts` (shared file, 4 lines in `frame()`): a tab another tab took over stops drawing the valley.

## Replay on v1.06 (2 Nov 2026 AEDT)

- With the game opened in a second tab during auto play (Tower Stack, Shopping List, Opposites at x5, 929x1129, the new
  check run on the v1.06 code): auto play went on for 30 s and more, and recorded "a button covered by something: rod
  (Sparkle Valley is open in another tab or)", "tall", "night", ... the same text as #747 and #748. Reproduced.
- With the fix: auto play stops 0.1 s after the other tab opens, nothing recorded or sent, 0 frames drawn in 2.5 s.
- The plain replay of all 18 named games on v1.06 (no second tab) was stopped part way when Release asked to save usage
  (2 Nov AEDT); its results were not kept. It was not repeated: the reports' own text names the cause.

## Issues

| Issue | What | Status |
|---|---|---|
| #747, #748 | Swap and Trade, Shopping List: button covered by "open in another tab" | fixed, check `autoplayheld` |
| #749-#753, #757-#759, #762-#766, #768, #769, #771-#778 | games "could not work out how to play it", "did not close", "0 frames a second", "still stuck" (v1.04 run, re-sent on v1.05) | fixed (same cause: the run went on in the stopped tab), check `autoplayheld` |
| #754, #755, #756 | Throw the Còn, Cat and Mouse, Wrap Bánh Chưng: did not open | fixed (same run, under the notice), check `autoplayheld` |
| #760, #761, #767, #770 | stuck at 57, -149 and 69, 151 (meadow) | fixed (the child was paused under the notice), check `autoplayheld`; the spots were not walked again separately |
| #746 | 16 frames a second in Brisbane, same PC, v1.05 | fixed as far as reproducible: the stopped tab no longer draws the valley (two games were drawn at once), check `autoplayheld` (0 frames drawn); needs a replay on that PC |
| #780 | freeze 3.2 s / 3.5 s, Mirror Painting and Colour by Number, Android tablet, v1.05 | not reproduced on v1.06: both freezes came 5 s after a "no recording" report whose picture ran as one block, the cause of #745, fixed in v1.06 (`capturefreeze`) |
| #781 | 13 frames a second, Odd One Out, Android tablet, v1.05 | needs owner: the tablet itself reported 13 fps; the test browser draws in software and cannot measure it; replay on the tablet with v1.07 |

Release closes the issues after the deploy; this chat does not close them.

## Progress

- `a9906606` fixes and the new check; `c41d9675` the check counts only reports made after the stop.
- Checks (2 Nov 2026 AEDT): `autoplayheld` fails on v1.06 code (reproduces the reports), passes with the fix (65 s).
- `node suite.mjs --changed --list`: full suite (a new test file). Started on GitHub, run 41366549196, 11:19 am AEDT.
- Full suite on GitHub, run 41366549196 on `c41d9675` (code unchanged since; later commits are this file only): **green**,
  finished 2:20 pm AEDT (8 shares and Management PostgreSQL passed; the joining job exits with the suite's result). No
  summary comment reached the PR; the check-map artifact is kept on the run for Release.
- Shared files touched: `js/main.ts` (4 lines in `frame()`), `tests/run.mjs` (one check at the end).
- New spoken lines: none. New on-screen line (EN and VI): "Stopped: the game was opened in another tab or window." in the
  tester-only auto play window.
