# v1.08e creatures: animals, pets, companions and farm animals in Blender

Read first: `README.md` (this folder), `docs/cores/tasks/v108b/README.md`, `CLAUDE.md`, `js/modelkit.ts`, `js/friend-model.ts`.

## What to build

1. **Find every creature the code draws.** List each one in your status file with its file and how many copies the valley shows. Look in:
   - `js/animals.ts`, `js/animalhomes.ts`, `js/pets.ts`, `js/companion.ts`;
   - `js/farm.ts`, `js/s2vn.ts`, `js/s2au-region.ts`, `js/regions.ts`;
   - the games and films that build animals in 3D.
2. **Make each creature in Blender** (`tools/blender/world-creatures.py`, writing `models/world/<id>.glb`):
   - Picture-book style that matches the four friends: soft, round, felt-like, with the same toon look.
   - A small skeleton and clips: `idle`, `walk` (or `swim`/`fly`), and one happy move (`hop`, `wag`, `flap`).
   - Pets and companions also get `follow` and `cheer`.
   - About 1,500-4,000 triangles, 50-200 KB.
3. **Swap them in** with `modelFor(codeShape, id, { clip: 'idle' })`:
   - The code's own movement code moves the root and calls `play('walk')` or `play('idle')` as it changes.
   - The child's pet and companion load as soon as the child has one, not only near.
4. **Flocks and herds** (ducks, fish, birds in the sky) stay as one InstancedMesh or the code shape when they are far.
5. **Pictures:** where the Bag, the Shop or a game shows a creature's picture, keep our drawings in `js/art.ts`. Only the 3D world changes.

## Checks

- **Yours:** add `worldcreatures` (`tests/world-creatures.mts`, at the end of `tests/run.mts`):
  - every creature model loads;
  - it stands on the ground at the code shape's size;
  - it plays its clips;
  - the fallback shows when the model is blocked.
- **Existing:** `perf`, `battery`, `longplaymem`, `startup`, `boot`, `areastream`, `pets` (if present), `companion` (if present), `types`.
- **Screenshots** on phone, tablet and computer.

## Status file

`docs/cores/tasks/v108e/creatures.md`
