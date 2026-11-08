# v1.08e nature: trees, flowers, plants, farm crops and My House in Blender

Read first: `README.md` (this folder), `docs/cores/tasks/v108b/README.md`, `CLAUDE.md`, `js/modelkit.ts`.

## What to build

1. **Find every tree, flower, bush, reed, lotus and crop** in the world code, and list them in your status file with their files. Look in:
   - `js/world.ts`, `js/world/*.ts`, `js/reeds.ts`, `js/lotus.ts`;
   - `js/farm.ts`, `js/plots.ts`, `js/gather.ts`, `js/weather.ts`.
   - The kinds include: palm, banana, bamboo, frangipani, peach and apricot blossom, gum and jacaranda, pine, flowers by colour, rice, vegetables and fruit trees.
2. **Make each kind in Blender** (`tools/blender/world-nature.py`):
   - Picture-book style, toon look, vertex colours.
   - About 300-2,500 triangles each.
   - Crops get each growth stage as its own small model (`<crop>-1`, `-2`, `-3`).
3. **Many copies:**
   - Draw them with `worldModelParts(name)` as one InstancedMesh per kind, in place of today's instanced code shapes.
   - Keep the draws count within `perf` (420 village, 490 home).
   - Far trees may stay the code shape or a still copy (`battery`).
   - Seasons and festivals (blossom at Tết, jacaranda in spring) keep working.
4. **My House:**
   - The furniture and decorations in `js/myhouse.ts`, `js/home-decor-models.ts` and `js/houses.ts`, and the wardrobe and farm buildings' small props.
   - Make them as models.
   - Shop and Bag pictures stay our 2D drawings.

## Checks

- **Yours:** add `worldnature` (`tests/world-nature.mts`, at the end of `tests/run.mts`):
  - each kind loads;
  - instancing keeps the draws within the limits;
  - crops show their stages;
  - fallbacks show when blocked.
- **Existing:** `perf`, `battery`, `longplaymem`, `startup`, `boot`, `areastream`, `farm` (if present), `myhouse` (if present), `seasons`/`festdecor` (if present), `types`.
- **Screenshots** on phone, tablet and computer.

## Status file

`docs/cores/tasks/v108e/nature.md`
