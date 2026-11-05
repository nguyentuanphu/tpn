# v1.08e nature: status

Branch: `work/v108e-nature` (from `origin/integrate/v108`). Brief: `nature-brief.md`.

## Progress
- Part 1 (inventory): done, below.

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
