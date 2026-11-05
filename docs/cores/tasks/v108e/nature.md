# v1.08e nature: status

**ready for Release** (6 Nov 2026 AEDT)

Branch: `work/v108e-nature` (from `origin/integrate/v108`). Brief: `nature-brief.md`.

## Progress
- Part 1 (inventory): done, below.
- Part 2 (Blender): done. `tools/blender/world-nature.py` makes 46 models; `node tools/make-world-nature.mts [name ...]`
  builds them (pip install bpy, Blender 5.2) and compresses each with gltfpack 0.20 (meshopt, `-noq`) into
  `models/world/` (6-130 KB each, 1.6 MB in all, 112-2,476 triangles; one shape, colours in the corners).
- Part 3 (in the game): done. `js/nature-tag.ts` (first download, under 1 KB) marks shapes; `js/world-nature.ts`
  (after the start) swaps a marked shape's geometry for its model when a child is within 70 m (40 on Fast) and back past
  110 m (70 on Fast). Same mesh, material and draw; areas that sleep, taps and colliders unchanged.
- Part 4 (check `worldnature`, `tests/world-nature.mts`, end of `tests/run.mts`): done, passes.
- Part 6 (owner: refinements, then "Detailed up close"): smooth shading and painted light; round picture-book puffs;
  turned pots, vases, lamp, pumpkins, eggs and cobs; rounded wooden props; a different sprout per crop; rocks, grass,
  garden plots, wall frames and keepsake stands too. Close-up models `<name>-hd` for every many-copy kind (canopies of
  broad overlapping leaves, layered fir skirts, fuller grass, reeds and flowers), drawn within 25 m by one small
  InstancedMesh per kind (js/world-nature.ts tickClose); crops, farm props and My House made only in the detailed version.
  Sheets: `docs/world-models-v108e/nature/all-models.png` (light), `close-up-models.png`, `close-up-trees.png`.
- Part 5 (screenshots): `docs/world-models-v108e/nature/` before (models blocked) and after, phone, tablet, computer,
  at the farm and among the trees.

## Checks (6 Nov 2026 AEDT, after the refinements and the close-up models; one at a time)
| Check | Result |
|---|---|
| worldnature (new) | pass: 51 models and 20 close-up ones; close up by a tree 229 draws (close-up trees, rocks, grass, reeds, flowers drawn) |
| perf | pass: home 175 draws (490), village 289 draws (420) / 605k triangles (800k; was 741k before this work) |
| battery, longplaymem, areastream, myhouse, plots, boot, types | pass |
| startup | pass: first start 1033 KB (integrate/v108 measured the same way: 1032 KB) |
| `--changed` | picks the full suite (shared files): left to Release (GitHub full suite) |

## How it works, and changes outside my own files (small, marked "v1.08e nature")
- `js/world.ts`: the instanced trees (not rocks) and the meadow flowers are marked.
- `js/roads.ts`: the roadside flower stems are marked; the VN bougainvillea bushes and AU gum trees are now one
  InstancedMesh each (was one merged mesh each: still one draw), so they can be swapped.
- `js/town.ts` (jacaranda, gum, banana, frangipani), `js/reeds.ts` (reeds, hyacinth), `js/farm.ts` (hay, egg crate,
  wardrobe, easel; crops), `js/home-decor-models.ts` (7 decorations; wall pictures and keepsakes stay).
- `js/farm.ts` crops: stages 1-3 draw their model once loaded (stage 3 no longer shows the produce as a sprite then);
  stage 0 (the seed) stays the code shape. The sunflower faces the field's gate.
- `js/solids.ts`: reads `userData.codeGeo || geometry`, so the solid map (and its saved key) is always the code shape's.
- `js/main.ts`: one `afterStart` line after the kit's. `sw.ts`: lists `js/nature-tag.js`, `js/world-nature.js`.
  The `.glb` files are not kept offline (the code shapes are the fallback, as the README says).
- I did not change `js/modelkit.ts`. Note for Release: `worldModelParts` applies the node matrix to a cloned geometry; a
  gltfpack file with quantized positions (the default, without `-noq`) would be rounded there. My files use `-noq`.
- The Sa Pa peach tree model (`tree-peach`) is made but not placed: the landmark mesh in `js/s2vn.ts` is the places
  helper's. Rocks, grass tufts and garden plots stay code shapes.

## Owner's decisions
- 6 Nov 2026 AEDT, in this chat: "still very scratchy", "still need better refinements": two refinement passes (smooth
  shading, painted light, round puffs, turned shapes, rounded props). Then, by pop-up: **"Detailed up close"** for
  **all** groups (trees and bushes; farm crops and props; My House decorations; flowers, grass, water, rocks): a rich
  close-up model (5,000-8,000 triangles) within about 25 m, the lighter one further away, so phones and the speed limits
  hold.

## Assumed (owner can change)
- Far trees go back to the code shape (the brief allows it), rather than a still copy.
- My House: the decorations got models; the room's frames, notice board and bunting stay as they are.

## Inventory: every tree, flower, plant, crop and My House piece in the code

| Kind | Where | How it is drawn today | Model name(s) |
|---|---|---|---|
| round tree | `js/world.ts` (trees and plants) | InstancedMesh per 100 m tile, `toonVC` | `tree-round` |
| apple tree | `js/world.ts` | instanced tiles; shake for apples | `tree-apple` |
| pine | `js/world.ts` | instanced tiles | `tree-pine` |
| snowy pine | `js/world.ts` | instanced tiles (above 30 m) | `tree-snowpine` |
| bamboo clump | `js/world.ts` | instanced tiles (bamboo grove) | `tree-bamboo` |
| palm | `js/world.ts` | instanced tiles (by the lake) | `tree-palm` |
| bush | `js/world.ts` | instanced tiles | `bush` |
| meadow flower | `js/world.ts` (grass tufts and flowers) | one InstancedMesh, tinted per flower | `flower-meadow` |
| grass tuft | `js/world.ts` | one InstancedMesh | stays the code shape (3 cones; nothing to gain) |
| roadside flowers | `js/roads.ts` `plantRoadside` | stem + petal InstancedMesh per road | `flower-roadside` (stem), petals stay code (two materials, tinted per flower) |
| bougainvillea bush (VN roads) | `js/roads.ts` | one merged mesh for all | `bush-bougainvillea` |
| gum tree (AU roads) | `js/roads.ts` | one merged mesh for all | `tree-gum` |
| jacaranda, gum, banana, frangipani | `js/town.ts` (Sydney, Bà Rịa) | one mesh each | `tree-jacaranda`, `tree-gum`, `tree-banana`, `tree-frangipani` |
| peach tree in flower | `js/s2vn.ts` (Sa Pa terraces landmark) | part of the landmark mesh (places helper) | `tree-peach` (made; the places helper owns the landmark mesh) |
| AU region pines and gums | `js/s2au-region.ts` | small meshes | `tree-pine`, `tree-gum` reused |
| reeds | `js/reeds.ts` | InstancedMesh | `reeds` |
| water hyacinth | `js/reeds.ts` | InstancedMesh | `hyacinth` |
| garden plot (hedges, flower beds) | `js/plots.ts` | InstancedMesh | stays (it is a lawn plan, sized per plot) |
| farm crops: carrot, strawberry, tomato, corn, sunflower, pumpkin | `js/farm.ts` | stage 0 a seed, 1-2 cones, 3 cones + phone-style sprite | `<crop>-1`, `<crop>-2`, `<crop>-3` |
| farm props: hay box, egg crate, wardrobe, easel | `js/farm.ts` | merged meshes | `farm-hay`, `farm-crate`, `farm-wardrobe`, `farm-easel` |
| My House decorations: teddy, clock, vase, lamp, sunflower, lotus, balloons | `js/home-decor-models.ts` | merged mesh per piece | `decor-<key>` |
| rocks | `js/world.ts` | instanced tiles | not nature: stays |
