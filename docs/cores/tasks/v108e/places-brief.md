# v1.08e places: landmarks, buildings, stalls, and food and festival props in Blender

Read first: `README.md` (this folder), `docs/cores/tasks/v108b/README.md`, `CLAUDE.md`, `js/modelkit.ts`.

## What to build

1. **List the landmarks, buildings, stalls and props** in your status file. Look in:
   - `js/world/sites.ts`, `js/regionsites.ts`, `js/heritage.ts`, `js/dinh.ts`, `js/town.ts`;
   - `js/cities.ts`, `js/asia.ts`, `js/suburbs.ts`, `js/houses.ts`, `js/homes.ts`, `js/school.ts`;
   - `js/hawkers.ts`, `js/vendors.ts`, `js/festdecor.ts`, `js/lanterns.ts`;
   - `js/s2vn.ts`, `js/s2au-region.ts`.

   **Landmarks first, in this order:**
   1. Hồ Gươm with the Thê Húc bridge and the turtle tower.
   2. Văn Miếu.
   3. One Pillar Pagoda.
   4. Bến Thành.
   5. The Sydney Opera House and Harbour Bridge.
   6. The Season 2 landmarks.

   **Then:** the homes, shops and stalls.

   **Then the food and festival props:**
   - stall food, bánh chưng, mâm ngũ quả;
   - lanterns, peach blossom in pots;
   - the Christmas tree, Easter eggs, the Mid-Autumn star lantern.
2. **Make each in Blender** (`tools/blender/world-places.py`):
   - Picture-book style, toon look, vertex colours.
   - Up to about 8,000 triangles for a landmark, 500-3,000 for a building, a few hundred for a prop.
   - **Landmarks keep their real shape** (owner: famous places look like themselves), drawn our way.
3. **Swap them in:**
   - Use `modelFor` on the code shape's group.
   - Repeated buildings and props use one InstancedMesh per kind.
   - Walls, doors and colliders stay where the code put them. The model must fit inside them: no walking through a wall, and no invisible wall in an open doorway.
4. **Pictures stay our 2D drawings in `js/art.ts`:** the cooking book, the food passport, the shop and the festival cards. Only the 3D world changes.

## Checks

- **Yours:** add `worldplaces` (`tests/world-places.mts`, at the end of `tests/run.mts`):
  - each model loads at its code shape's place and size;
  - the colliders match (a walk test through each doorway and round each landmark);
  - the fallback shows when blocked.
- **Existing:** `worldplacement`, `solid`, `flyaudit`, `spawnview`, `regions`, `stalls`, `festdecor` (if present), `perf`, `battery`, `startup`, `boot`, `types`.
- **Screenshots** on phone, tablet and computer of each landmark, before and after.

## Status file

`docs/cores/tasks/v108e/places.md`
