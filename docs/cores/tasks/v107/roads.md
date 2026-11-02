# v1.07 roads: status

**Paused (2 Nov AEDT, Release's "slow down"): waiting for "resume" after 2 pm AEDT. Not ready for Release yet.**

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

## Exact next step

1. Look at `docs/roads-concept-d/after-*.jpg` next to `before-*.jpg` (computer first, then phone and tablet); tune
   colours, pebble size, crossings if they look wrong. Rebuild with `node tools/build.mts`, retake with
   `cd tests && node ../docs/roads-concept-d/capture.mjs after` (server: `python3 -m http.server 8765` in the repo root;
   tests/node_modules needs symlinks to the global playwright and typescript, not committed).
2. Run checks one at a time: `roads roadtone roadshape ground padmap mapcoords`, then `perf`, `startup`, `battery` with
   `--jobs 1`, then `suite.mjs --changed`.
3. Ask the owner with a pop-up whether the new look is right; write the report in Vietnamese.

Note: `node tools/build.mts` rewrites `content/management-catalogue.json`; restore it with git checkout before committing.
