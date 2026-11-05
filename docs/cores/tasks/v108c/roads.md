**ready for Release** (5 Nov 2026 AEDT): both parts done and pushed.

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
- **Part 2: done (5 Nov 2026 AEDT).**
  - `home/page.ts` (new): the whole page script that was inline in `home/index.html` (10 KB), typed; `home/site.ts`
    runs it first, so it still runs before the festival and launch code, as the inline script did.
  - `home/navigation.ts` (new): moving the retained sections onto their topic pages and showing one page at a time, the
    one source for the website and the design preview.
  - `docs/website-review-20261023/navigation.mts`: HTML only (the two script templates are gone).
    `build-preview.mts`: gives the preview the same code from `home/navigation.ts`.
    `tools/build-website.mts`: takes the design's inline script out whole (the old LIVE replacement is gone) and fails if
    an inline script other than the head's festival switch is left.
  - Also fixed: `home/index.html` did not match its design (`build-website --check` failed on `integrate/v108`): the
    v1.08 voices-aside change edited the voice tip in the page by hand. The tip is now in its source
    (`parent-controls-content.mts`), the preview and the page are rebuilt, and `--check` passes.
  - `tests/tsconfig.json`: the two new files listed for `types`.
  - Checks: website pass, contentwebsite pass (8 language, layout and deep-link checks), types pass,
    `build-website --check` pass, design-preview checks: check-navigation pass (5 layouts, English and Vietnamese),
    check-parent-controls pass, check-rewards pass; check-preview and check-festivals fail the same way on the preview
    before this change (catalogue counts 18 vs 17 and 15 vs 13: content grew since those checks were written), so not
    caused here; left for Release / Analytics & Infra.
  - The game's `index.html` browser guard is untouched.
