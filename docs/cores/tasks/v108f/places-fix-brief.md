# v1.08f places-fix: the Bến Thành sign, and models for the Season 2 Australia landmarks

Read first: `docs/cores/tasks/v108e/README.md` (the model rules: a new picture-book design, not a rebuild; models load near the child and are never on the install list; no apostrophes in the sw.ts FILES list), `docs/cores/tasks/v108e/places-brief.md`, `docs/cores/tasks/v108e/places.md` (what the places helper did), `js/modelkit.ts`, `tools/blender/world-places.py`, `tools/make-places.mts`, `CLAUDE.md`.

## What to do

1. **The Bến Thành sign.** Since the places merge, the Blender model of Bến Thành market covers the "BẾN THÀNH MARKET" name sign.
   - Make the sign show again in front of the building, in the same place for the child as before.
   - Either move the sign out of the façade, or cut room for it in the model.
   - Check every other landmark with a name sign or board in front of it for the same problem, and fix each one the same way.
2. **The Season 2 Australia landmarks:**
   - the Great Barrier Reef pontoon and beach;
   - Cradle Mountain on Tasmania;
   - the Rottnest lighthouse and Perth beach;
   - and any other landmark in `js/s2au-region.ts`.

   They are tagged for models but have none, so their code shapes stay. Make each one in Blender in the same picture-book style as the places models: their real shapes, drawn our way. Keep each footprint, height and collider, and fit them with `tools/make-places.mts`.
3. **Pictures:** before and after shots of Bến Thành and each new landmark, on phone, tablet and computer, in `docs/world-models-v108e/places/`.

## Checks

- **Run:** `worldplaces`, `worldplacement`, `s2au`, `flyaudit`, `solid`, `perf`, `battery`, `startup`, `boot`, `types`.

## Status file

`docs/cores/tasks/v108f/places-fix.md`
