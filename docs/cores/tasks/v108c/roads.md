# Helper C2: roads and the website script (round v1.08c), status

Branch `work/v108c-roads` from `origin/integrate/v108`. Brief: `roads-brief.md` (replaces the parents brief; the parents
branch `work/v108c-parents` is kept as it was, with Part 1 done, for Release to compare).
Scheduled resumes after each usage reset (every 5 hours) are set in this session (owner, 5 Nov 2026 AEDT).

## Plan
- **Part 1: Concept D roads (#34).** The road network, tones, kerbs, zebra crossings and bus stops were already built in
  v1.07; the look still read as poor (owner's issue): grainy asphalt that shimmers, faint edge lines, a dirt road that
  looked like rubble. Redraw the pictures in `roadTexture` (`js/roads.ts`) to the drawings in `docs/concept-d/index.html`
  ("The new look, drawn from above"): one clean grey asphalt, crisp white edge lines and a light stone kerb, yellow centre
  dashes in Vietnam, white in Australia and on the home island; the dirt road one warm red-earth colour with a darker rim,
  two clean wheel tracks, a row of grass down the middle and edging stones; less speckle everywhere. Only the pictures
  change: the same materials and meshes, so no draw calls are added, and no road or place moves.
- **Part 2: the website navigation script in TypeScript** (`home/site.ts`; the generator keeps only the HTML).

## Progress
- **Part 1: done (5 Nov 2026 AEDT).**
  - `js/roads.ts` `roadTexture`: asphalt (less grit and mottle, faint tyre wear, wider brighter edge lines, lighter kerb,
    brighter yellow dashes); dirt and footpaths (half the edge wander, a darker rim, cleaner wheel tracks, grass dashes
    down the middle, a quarter of the grit and a third of the stones).
  - `docs/roads-concept-d/capture.mts`: the village spot moved off the road's edge (the old one put the camera inside a
    wall: the earlier "after-village" pictures were a plain red screen); pictures go into a folder per tag.
  - Pictures: `docs/roads-concept-d/after/<spot>-<phone|tablet|computer>.jpg` (town = city road, village = Vietnam
    village road, dirt-path, island-ring, crossing-vn, crossing-au, footpath). Looked at all three screens.
  - Checks (one at a time, `node run.mts <name>`): roads pass, roadshape pass, solid pass, vehicles pass (traffic moves;
    there is no separate `traffic` check), startup pass (first start 1069 KB of 1071), perf pass (village 378 draws,
    home 461), battery pass, longplaymem pass, types pass, boot pass.
