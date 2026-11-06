# v1.08g creatures: dragons and birds (status)

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
