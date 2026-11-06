# v1.08g creatures: dragons and birds (status)

**ready for Release** (6 Nov 2026 AEDT)

Branch: `work/v108g-creatures` (from `origin/integrate/v108`). Brief: the owner's message in the helper chat (6 Nov 2026
AEDT, "Cac con rong, con chim deu etc phai blender thiet dep"), `docs/cores/tasks/v108g/README.md`,
`docs/cores/tasks/v108e/README.md`, `docs/cores/tasks/v108e/creatures.md`.

## Owner's decisions (6 Nov 2026 AEDT, pop-up)
- Plan: go.
- The flying critters stay butterflies (as recommended); **add a flock of little birds** too; **all the companions** are
  redrawn as well (Sparkle the firefly and Little Dragon).

## Plan
1. Redraw (hand-drawn picture-book shapes on the v1.08e skeletons, faces and clips, same size, feet, facing):
   creature-dragon, creature-firefly (companions), creature-crane, creature-peacock, creature-penguin, creature-emu,
   creature-chicken. `tools/blender/world-creatures.py` (a HAND shape per kind replaces the rebuilt code parts).
2. Flocks: `tools/blender/world-flocks.py` -> `models/world/flock-*.glb` (hen, rooster, duck, butterfly body and wings,
   fish, clownfish, black swan, little bird); `js/flocks.ts` (after the start): one InstancedMesh per kind following the
   2D critters (js/world.ts, js/farm.ts, js/s2au-region.ts), simple per-copy moves; the sprites stay as the fallback and
   for taps; a new flock of little birds over the trees.
3. Checks, one at a time: worldcreatures, companion, perf, battery, longplaymem, startup, types, flocks (new), and the
   checks of the files changed.

## What changed
- **Part 1, the birds and companions** (`tools/blender/world-creatures.py`, a `HAND` shape per kind applied before the
  v1.08e restyle; `node tools/make-creatures.mts chicken penguin emu crane peacock dragon firefly`, Blender 4.2.3):
  - chicken: round and fluffy, comb and wattle, layered wing feathers, a tail fan, toes;
  - penguin: smooth tuxedo with a soft darker back, white cheeks, yellow neck patches, soft flippers, three-toed feet;
  - emu: a shaggy coat of broad drooping feathers in rings, blue face and neck, a head tuft, scaled three-toed legs;
  - crane: white with long folded wings, black flight tips and a drooping black bustle, black neck, red crown;
  - peacock: a two-row fan of eye-spot feathers, brown wings under blue-green coverts, white face stripes, a crest;
  - Little Dragon: belly plates, horns, fin ears, whiskers, back spines, a curling tail with a spade, stubby legs with
    claws, wings with finger bones and a scalloped edge;
  - Sparkle the firefly: head and thorax, curled antennae, six little legs, veined wings (its glowing tail stays the
    game's own glow, drawn beside the model).
  - Same bones, v1.08e faces (lids, blinks, looks), the eight clips, height, feet and facing; 5,800-9,200 triangles,
    68-90 KB each. New in the toolkit: a part may set its own detail (`res`), light feather ovals, a `Wing` outline.
- **Part 2, the flocks** (`tools/blender/world-flocks.py`, `node tools/make-world-flocks.mts`; `js/flocks.ts`):
  hen, rooster, mallard, black swan, two pond fish, butterfly (+ wing), little bird (+ wing), 100-2,000 triangles, 152 KB in
  all. One InstancedMesh per kind follows the 2D pictures (js/world.ts critters, js/farm.ts fish and duck, Perth's swans
  listed in `world.swans` by js/s2au-region.ts); the pictures are hidden but kept for taps and stickers, and stay with no
  network. A new flock of nine little birds circles over home.
- Not in the first download (js/flocks.ts after the start; the models load near the child).

## Checks (6 Nov 2026 AEDT, one at a time)
| Check | Result |
|---|---|
| worldcreatures | pass (7 redrawn models: size, feet, facing, clips, faces, 1,500-9,500 triangles) |
| flocks (new, `tests/flocks.mts`) | pass: hen 3, rooster 2, duck 7, fish 3, clownfish 3, butterfly 14, bird 9; 9 draws for all; blocked models keep all 25 pictures |
| companiongoal, animalhomes, s2auperth, longplaymem, types | pass |
| perf | pass: home 164 draws, village 278 draws / 733k triangles |
| battery | pass |
| startup | pass: first start 1047 KB, the same as origin/integrate/v108 measured the same way (this branch adds nothing to it) |
| stickers | FAIL, also on origin/integrate/v108 with the same message (learning-path ways to earn): not from this branch |
| companionhats | FAIL, also on origin/integrate/v108 with the same message (a click on the flower hat times out): not from this branch |
| `--changed` | picks the full suite (shared files): left to Release |

## Pictures (`docs/world-models-v108g/creatures/`)
- `all-birds-and-companions.png`: the seven redrawn models in Blender (Cycles, a frame of their idle clip).
- `before-*` and `after-*`: phone 390x844, tablet 820x1180 and computer 1280x800 (crane, chicken, ducks), and computer
  for the peacock, emu, penguin, hens, butterflies, fish and the little birds; `compare-*.png` side by side. Small things
  far off (butterflies, birds) are small in these views.

## Notes
- The firefly's glowing tail is the game's own glow beside the model (the check counts the model without it).
- Perth's swans are drawn by js/flocks.ts once Season 2's places are built (not covered by the flocks check, which stays
  near home and Lotus Village).
