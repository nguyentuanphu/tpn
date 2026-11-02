# v1.07 old-bugs: status

Helper: old-bugs. Branch: `work/v107-old-bugs`. Started 2 Nov 2026, 10:58 AEDT.

## Plan

Issues: #355 (restarts or white screen while playing), #341 (slow frames on a tester's computer), #739 (a 2.3 s freeze on the iPhone Friends page). Do not close them; Release does.

1. **#341, slow frames.** Measure frames a second in the test browser, which draws with SwiftShader (software, no graphics chip), at the tester's 1870x940. Look for the per-frame costs that hurt a computer without a working graphics chip. Fix: tell software drawing apart at start and, on Graphics Auto, draw the lighter picture; add the graphics kind to tester reports. Check: `softgraphics`.
2. **#355, restarts and white screens.** Measure a 30-minute autoplay memory curve on a phone-sized page (JS heap after garbage collection, DOM nodes, 3D geometries and textures). Fix any growth found. Add to the "ended by the browser" note what a phone without `performance.memory` (every iPhone) can still say: the 3D objects held and the minutes played. Check: extend or add a check for each fix.
3. **#739, freeze on iPhone.** Safari has no `longtask` observer, so every iPhone freeze report says "longest script 0 ms", which is not true. Fix: on a browser without it, a light timer tells "the page was busy" (script, layout) apart from "the page was free but nothing was drawn" (the graphics side). Check: `freezewhy`.

Files: `js/main.ts` (shared, small change), `js/tester.ts`, `js/players.ts`, a new `js/gpu.ts`, `netlify/lib/tester.mts` and `tools/tester-issues.mts` (the device line), `tests/run.mjs` (new checks at the end).

## Progress

(below)
