# v1.07 tester-bugs: status

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

## Progress

(filled in below as the work goes)
