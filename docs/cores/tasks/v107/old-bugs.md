**ready for Release (full suite: Release's combined run)** (2 Nov 2026 AEDT)

# v1.07 old-bugs: status

Helper: old-bugs. Branch: `work/v107-old-bugs`. Started 2 Nov 2026, 10:58 AEDT.

## Plan

Issues: #355 (restarts or white screen while playing), #341 (slow frames on a tester's computer), #739 (a 2.3 s freeze on the iPhone Friends page). Do not close them; Release does.

1. **#341, slow frames.** Measure frames a second in the test browser, which draws with SwiftShader (software, no graphics chip), at the tester's 1870x940. Look for the per-frame costs that hurt a computer without a working graphics chip. Fix: tell software drawing apart at start and, on Graphics Auto, draw the lighter picture; add the graphics kind to tester reports. Check: `softgraphics`.
2. **#355, restarts and white screens.** Measure a 30-minute autoplay memory curve on a phone-sized page (JS heap after garbage collection, DOM nodes, 3D geometries and textures). Fix any growth found. Add to the "ended by the browser" note what a phone without `performance.memory` (every iPhone) can still say: the 3D objects held and the minutes played. Check: extend or add a check for each fix.
3. **#739, freeze on iPhone.** Safari has no `longtask` observer, so every iPhone freeze report says "longest script 0 ms", which is not true. Fix: on a browser without it, a light timer tells "the page was busy" (script, layout) apart from "the page was free but nothing was drawn" (the graphics side). Check: `freezewhy`.

Files: `js/main.ts` (shared, small change), `js/tester.ts`, `js/players.ts`, a new `js/gpu.ts`, `netlify/lib/tester.mts` and `tools/tester-issues.mts` (the device line), `tests/run.mjs` (new checks at the end).

## Progress

**Done (2 Nov 2026 AEDT). Full suite: Release's combined run (owner's decision, 3:05 pm AEDT: no per-branch full suites).**

Done, commit e83fa395 (pushed to `work/v107-old-bugs`):
- #341: `js/gpu.ts` tells software drawing apart (test browser: "software: Vulkan 1.3.0 (SwiftShader Device ..."); Graphics Auto then draws the light picture (no shadows, no smoothing) and may go down to 0.5x pixels. `adaptResolution` in `js/main.ts` used to leave out frames over 250 ms, so a computer at 3 frames a second never got a lighter picture; they now count as 250 ms (gaps over 2 s are still a pause). Measured in the test browser at the tester's 1870x940: shadows on ('mid') 0.7 frames a second, light ('low') 2.5, about 3.5x faster. Tester reports now carry `dev.gpu` (`netlify/lib/tester.mts` keeps it, `tools/tester-issues.mts` shows "graphics ...").
- #739: Safari has no long-task observer, so every iPhone freeze said "longest script 0 ms". `js/tester.ts` now runs a 100 ms timer: "page busy N ms" (script or layout held the page) or "(free, not drawn)" (the graphics side stopped); without the observer it says "longest script not measured".
- #355: the "ended by the browser" and "reloaded" notes (`js/players.ts`) add minutes open and the 3D shapes and pictures held, which an iPhone can report (it has no MB figure). Old notes read the same as before (the `gameends` check still matches).
- Shared files touched (small): `js/main.ts` (GPU pick, resolution floor, slow-frame counting), `tests/run.mjs` (two lines at the end).
- New checks in `tests/old-bugs.mts`: `softgraphics`, `freezewhy`. Fixed in the check while running it: the test browser draws at about 2 frames a second and freezes by itself, so `freezewhy` puts a window on top (the valley stops drawing, as in the game); the second freeze lasts 3.6 s because the same freeze in the same place again is one report; a report's own freeze is the last such line of its 30 seconds.

Long-play memory (#355), phone size 390x844, autoplay x5, every group, 30.5 minutes (test browser, not a real iPhone):
- No reload, no error. JS heap after garbage collection 49 MB -> about 60 MB, level from minute 13 (61.5, 59.3, 58.5, 59.9, 60.2).
- DOM nodes 3883 -> 5012 and listeners 214 -> 296: mostly a story theatre and name tags open at the moment of the sample (the end-of-run difference was a theatre, +62 elements); not a steady leak, but worth watching.
- 3D shapes held by the graphics 546 -> 1771 and pictures 201 -> 358. Not a leak: every shape held is still in the valley (8-minute run: the scene uses 4136 shapes, the graphics hold 1198, all of them in use). three.js sends each part to the graphics the first time it is seen and keeps it, so the total grows with the places visited, up to the valley's own (about 4000 shapes, 600 pictures). On an iPhone this is the likely memory pressure behind #355; the real cure is the merge and draw-call work (S2 and S3: fewer, merged shapes), or letting go of far places' shapes, which is bigger work for World. Not done here.
- New check `longplaymem` keeps it so: after 6 places and 3 games, every shape and picture the graphics hold must still be in use.

## Left for later

- #355: lower the memory itself (S2/S3 merge work, or releasing far places), for World or a later round. The notes from v1.07 (minutes, 3D count) will show on the next real report whether long sessions are the pattern.
- #341 and #739: wait for the next real reports, which now name the graphics and say "page busy" or "free, not drawn".
- Not checked on a real iPhone or a real computer without a graphics chip.

## Checks

| Check | Result |
|---|---|
| softgraphics | pass (50 s): SwiftShader told apart, light picture on a 16-core computer, slow frames lower the pixels to 0.5x |
| freezewhy | pass (48 s): busy page "page busy 2582 ms"; held frames "page busy 0 ms (free, not drawn)"; report names the graphics |
| testerreport | pass (82 s) |
| gameends | pass (88 s); the new minutes and 3D fields are not asserted by it (old-format notes still read the same) |
| longplaymem (new) | pass (54 s): 938 shapes held, 937 in use; 286 pictures held, 284 in use |
| `suite.mjs --changed` | picks the full suite (test code changed): left to Release's combined run, as the owner decided |
