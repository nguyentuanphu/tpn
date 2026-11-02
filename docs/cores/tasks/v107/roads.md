# v1.07 roads: status

**ready for Release** (2 Nov 2026 AEDT): the roads (owner approved) and the `js/world.ts` split (owner's decision via Release). Draft PR #787. Full suite started on GitHub after the split: Release, please read its result and commit its `check-map` artifact (`tests/check-map.json`, `tests/check-times.json`).

Branch: `work/v107-roads`. Issue #34. Started 2 Nov 2026, 10:57 am AEDT.

## Plan

Target: the "How roads, paths and rivers will look" swatches in `docs/concept-d/index.html` (Vietnam main road,
Australia main road, village brick street, dirt path), plus the rule "patterns are painted into a few shared pictures,
so the draw-call budget stays the same".

What looks poor today (before pictures, `docs/roads-concept-d/before-*.jpg`):
- The road pictures are 64 x 256 pixels, so close up the asphalt is blocky speckle and the lines are blurred.
- Vietnam's stone kerb is 2 px (10 cm); Australia's concrete footpath and gutter are missing.
- Dirt roads are a hard-edged strip that reads like a ploughed field; square grey "stones" on the edge.
- Footpaths are pale sand, the look Concept D calls "paths fade into bare sand".
- The verge beside every road is a pale sand band.
- No crossings at junctions.

Changes (all in `js/roads.ts`; no world position changes, no road course changes):
1. `roadTexture` at 128 x 512, a seeded pattern (same picture every start), soft mottling and fine aggregate instead
   of 2 px speckle; tyre-wear bands in each lane.
2. Vietnam: grey asphalt, stone kerb with joints, white edge lines, yellow centre dashes (22 on, 14 off as drawn).
3. Australia: darker asphalt, concrete footpath strip and gutter at both edges, white centre dashes.
4. Other asphalt (ring road, mountain road): crisp white edge lines and dashes, a pale kerb, region tint kept.
5. Dirt roads: Bà Rịa red earth, two darker wheel tracks, tufts of grass down the middle, grey edging pebbles, ragged
   soft edges (picture alpha with alpha test; no blending cost). Outback orange near Uluru kept.
6. Footpaths: warm red packed earth (not sand), a lighter worn middle, pebbles at the edges, ragged edges.
7. Verge colours: dry grass beside asphalt, earth beside dirt roads and footpaths, instead of pale sand.
8. Zebra crossings where an asphalt side road meets an asphalt road: one merged mesh for all of them (+1 draw call).
9. Town brick and paving pictures redrawn at the higher resolution with the same layout.

Checks: `roads`, `roadtone`, `roadshape`, `ground`, `padmap`, `mapcoords`, `perf`, `startup`, `battery` (one at a
time, `--jobs 1`), then `suite.mjs --changed`.

Screenshots: `docs/roads-concept-d/capture.mjs` (run from `tests/`), 7 spots x phone, tablet, computer, before and
after.

## Progress

- 2 Nov 10:57 am AEDT: read brief, issue #34 and comments, Concept D.
- 2 Nov 11:20 am AEDT: before pictures taken (`docs/roads-concept-d/before-*.jpg`).
- 2 Nov AEDT: first pass written in `js/roads.ts` (plan items 1 to 8: new 128 x 512 road pictures, ragged dirt and path
  edges with alphaTest, verge colours, zebra crossings in one mesh). `roadtone` check in `tests/run.mjs`: pixel spots
  scaled by picture size (same spots and thresholds; the picture is now twice as large each way). After pictures taken
  (`docs/roads-concept-d/after-*.jpg`) but NOT looked at yet. No checks run yet.

- 2 Nov AEDT (after resume): after pictures looked at (computer and phone): red-earth dirt with ragged edges, wheel
  tracks, grass tufts and pebbles; crisp kerbs and lines on asphalt; zebra crossings at junctions. Kept as is.

## Checks (2 Nov 2026 AEDT, local, one at a time)

| check | result |
|---|---|
| roads | pass (26 side-road junctions 60-120 degrees) |
| roadtone | pass (6 road materials, yellow dash VN, kerbs AU) |
| roadshape | pass |
| ground | pass |
| padmap | pass |
| mapcoords | pass |
| battery | pass |
| startup | pass (valley ready 21.7 s on the tablet profile) |
| perf | FAIL, but main fails the same: PERF-001 startMB 2.707 here, 2.704 on main v1.06 (limit 2.55 x 1.03 + 0.05). This branch adds 3 KB and 2 draw calls (377 vs 375 in the village). Not caused by roads; for Release / startup helper. |
| `suite.mjs --changed` | picks the full suite (test code `tests/run.mjs` changed): started on GitHub, `full-suite.yml` on this branch |

## Exact next step (old, done up to step 2)

1. Look at `docs/roads-concept-d/after-*.jpg` next to `before-*.jpg` (computer first, then phone and tablet); tune
   colours, pebble size, crossings if they look wrong. Rebuild with `node tools/build.mts`, retake with
   `cd tests && node ../docs/roads-concept-d/capture.mjs after` (server: `python3 -m http.server 8765` in the repo root;
   tests/node_modules needs symlinks to the global playwright and typescript, not committed).
2. Run checks one at a time: `roads roadtone roadshape ground padmap mapcoords`, then `perf`, `startup`, `battery` with
   `--jobs 1`, then `suite.mjs --changed`.
3. Ask the owner with a pop-up whether the new look is right; write the report in Vietnamese.

Note: `node tools/build.mts` rewrites `content/management-catalogue.json`; restore it with git checkout before committing.

## Owner's decisions

- 2 Nov 2026 AEDT, pop-up: "Đường mới ... đã đúng ý chưa?" Answer: "Đúng rồi". The new road look stays as in
  `docs/roads-concept-d/after-*.jpg`.

## Not done / notes for Release

- PERF-001 startMB fails on main v1.06 too (2.704 MB, limit 2.55). This is not from roads; the startup helper or
  Release should handle it.
- No new spoken lines. No world positions or road courses changed. Bark-chip paths in forests (Concept D) are not done.

## Second task: split `js/world.ts` (owner's decision via Release, 2 Nov 2026 AEDT)

Note: the split-code plan says "after the roads helper's change, because it changes this file", but the roads change is
in `js/roads.ts`; `js/world.ts` was not touched by roads. The split was done anyway, as the owner decided.

Pure move, one commit per new file (each commit starts the game; checked by loading the title on each):

| commit | file | holds |
|---|---|---|
| bdc6609a | `js/world/places.ts` (12 KB) | map data and places, levels, footprints, rivers, ponds, bridges |
| f2d0aa10 | `js/world/ground.ts` (24 KB) | roads data, road/river/water distances, `heightAt`, `surfaceAt`, `oldHeightAt` |
| 9bb8169d | `js/world/sites.ts` (12 KB) | regions, shrines, towers, Leafies, garden plots, building lots |
| a7944baa | `js/world/paint.ts` (7 KB) | painting the map and water pictures |
| 7e9bf354 | `js/world/reshape.ts` (9 KB) | levelling under buildings, widening level land, road beds |

`js/world.ts` (61 KB) keeps `createWorld()` and re-exports every name it exported before (same list), so no import
elsewhere changed. Differences from the plan: the regions/sites part is its own file (not inside `places.ts`), because
it uses `heightAt` and `places.ts` would then import `ground.ts` while `ground.ts` imports `places.ts` (a circle, which
`arch` forbids); `reshape.ts` likewise. Four module variables that other parts assigned (`PADS`, `WIDE`, `RB_ON`,
`HERITAGE_GROUNDS_ON`) are set through one `setGround()` in `ground.ts` (an imported name cannot be assigned); this is
the only change besides added `export` words. A line count against the old file shows nothing else lost or changed.
`createWorld()` itself (60 KB, plan step 2) is not split: left for v1.08.

`sw.ts` offline list and `index.html` preload list updated. `tests/check-map.json` comes from the GitHub full suite's
artifact (coverage offsets cannot be written by hand).

Checks after the split (local, one at a time, 2 Nov 2026 AEDT):

| check | result |
|---|---|
| arch | pass (0 circles) |
| names | pass |
| types | pass |
| preload | pass |
| mapcoords | pass |
| roads | pass |
| roadshape | pass |
| flat | pass |
| solid | FAIL, same on main v1.06: `hunt_diwali_0` (the Diwali hunt, on only around this date) has no open ground near it |
| startup | pass (twice: 25.2 s and 23.0 s on machines x1.48 and x1.63 slower than the reference; 21.7 s at x1.43 before) |
| perf | PERF-001 startMB 2.729 (2.707 before, 2.704 main): fails as on main. The packed bundle is byte-for-byte the same size before and after the split (main graph 2.258 MB both), so the difference is timing noise in what loads before the title; draw calls 375 (same) |
| `--changed` | full suite (test code changed earlier on this branch): started on GitHub |

Screenshots after the split: `docs/world-split/split-*.jpg` (7 spots x phone, tablet, computer). Compared with the
roads "after" pictures taken before the split: 0 to 6 % of pixels differ, all random flowers, the puppy and pop-ups;
places and roads are where they were.
