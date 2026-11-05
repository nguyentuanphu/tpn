# v1.08e villagers: the 11 named villagers as real models, crowds refined

Read first: `README.md` (this folder), `faces-brief.md` (the eye style and Part 2's lighting, outline and texture), `docs/plans/new-friends-characters.md` section 6, `docs/cores/tasks/v108/lumi.md` (the 14 neighbours of the gallery), `js/avatar.ts`, `js/friend-model.ts`, `CLAUDE.md`.

## What the owner asked (6 Nov 2026 AEDT)

"The characters and villagers need higher definition or some refinement: in the game they don't look much different from the current characters, but with hair."

**Pop-up answer:**
- High-detail models for the friends and the 11 named villagers.
- Crowds keep the code builder, with the new face and outline.

## What to build

1. **The 11 named villagers:** Mai, Ba, Tèo, Tí, Bông, Sứ, Jack, Mít, Bơm, Ruby and Lan (`js/main.ts` and the villager tables). Each becomes a Blender model `models/villager-<id>.glb`:
   - Start from the gallery's 14 neighbours.
   - Same height rules: children 1.6, grown-ups 2.0, grandparents 1.8.
   - Everyday Vietnamese or Australian clothes, as the plan says.
   - The faces helper's soft eyes with lids, blinking and moods.
   - About 8k triangles, one 512 px painted texture, about 150-250 KB.
   - The friends' skeleton and joint names, so the code moves drive them as the friends' are (`js/friend-model.ts` copies joint turns each frame).
2. **Loading:**
   - Each model swaps in for the code person when a child comes near (`js/modelkit.ts` or the valley helper's stand-ins, `lateAvatar` in `js/avatar.ts`).
   - The code person stays as the fallback.
   - Name tags, talk, day plans and photo faces keep working.
   - Add the models to the offline list in `sw.ts`.
3. **Crowds and Studio villagers** keep the code builder, but get:
   - the new eyes and blush from the faces helper's code;
   - the thin outline and rim light;
   - the colours of the new style.
4. **Films:** the films that use these villagers use their models when loaded.

## Checks

- **Yours:** add `villagermodels` (`tests/villager-models.mts`, at the end of `tests/run.mts`):
  - each of the 11 loads and stands at the code person's height and place;
  - it blinks and turns toward the child;
  - the fallback shows when blocked.
- **Existing:** `perf`, `battery`, `longplaymem`, `startup`, `boot`, `areastream`, `village`, `dayplan`, `films` (sample), `types`.
- **Screenshots:** each villager, before and after, and a crowd, on phone, tablet and computer, in `docs/world-models-v108e/villagers/`.

## Status file

`docs/cores/tasks/v108e/villagers.md`. It runs on the second account: end with a report for the owner to pass to Release.
