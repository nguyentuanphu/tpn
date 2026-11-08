# v1.08e water: every river, lake and pond shallow and friendly

Read first: `README.md` (this folder), `docs/cores/tasks/v108b/README.md`, `CLAUDE.md`.

## What the owner asked (6 Nov 2026 AEDT)

"Tất cả dòng sông quá sâu cần được làm nông, dễ thương và friendly hơn" ("all the rivers are too deep; make them shallow, cute and friendlier").

**Pop-up answers:**
- **Depth:** knee to waist deep, about 0.4-0.8 m.
  - Children wade through and splash.
  - Nobody sinks or swims underwater.
  - The bed (pebbles, sand, fish) shows through clear, light water.
- **Boats:** they float on the shallow water like toy boats, sitting flat and high.
  - Their routes and piers stay as they are.
  - The checks are updated to the new depth.

## What to build

1. **Find all the water** and list it in your status file with its file and today's depth:
   - every river (`RIVERS`), lake, pond and harbour;
   - the Season 2 water: Mekong, Hạ Long, the Reef, Rottnest, Tasmania.

   Look in `js/world.ts`, `js/world/ground.ts`, `js/world/places.ts`, `js/content/map.ts` (`WORLD.riverDepth`), `js/s2vn.ts`, `js/s2au-region.ts` and `js/lotus.ts`.
2. **Make every bed 0.4-0.8 m** below the water.
   - Shallow at the banks with gentle slopes, so a child can walk in and out anywhere that is not a wall.
   - No sudden drops.
   - Change the depths, not the places: rivers, lakes and piers stay where they are.
3. **The child in the water:**
   - wading slows them a little and makes splash rings;
   - the water comes up to the knees or waist;
   - no swimming underwater and no sinking;
   - the camera never goes under the water.
4. **The look:**
   - clear, lighter water, so the bed shows through;
   - a sandy or pebbly bed;
   - small fish and water plants near the banks (our own art, light, instanced);
   - gentle ripples.
   - The Hạ Long and Reef water stays turquoise, and lotus ponds stay green.
5. **Boats and ferries** sit flat and high on the shallow water, with a shallow draught:
   - set their height from the new water level;
   - bridges keep enough room over the boats;
   - the raft still stops by every bridge.
6. **Checks:** update the checks that encode the old depths, as the owner decided. Write the owner's decision in each check's comment.
   - `shallowrivers` (1.25 m bed with a swimming channel over 0.9 m) becomes a 0.4-0.8 m bed everywhere, with gentle banks.
   - `boats` (deep enough under a boat) becomes: the boat floats on the water, never inside the bed, with room under every bridge it passes.
   - Never loosen anything else in those checks.

## Who does what

- The vehicles helper is redesigning the ferries and joining the five Season 2 piers to roads.
- Water depth is yours alone: tell the vehicles helper through Release if a boat model needs a change.

## Checks

- **Yours:** `shallowrivers` and `boats` (updated), plus a new `wading` check (`tests/wading.mts`, at the end of `tests/run.mts`):
  - a child walks into each river, lake and pond, and out again;
  - the water stays at knee to waist height;
  - the camera stays above the water.
- **Existing:** `bridgeunderpass`, `flyaudit`, `spawnview`, `worldplacement`, `regions`, `s2vnregions`, `s2au`, `lotus` (if present), `perf`, `battery`, `startup`, `boot`, `types`.
- **Screenshots** of the rivers, a lake, Hạ Long and the Reef, before and after, on phone, tablet and computer, in `docs/world-models-v108e/water/`.

## Status file

`docs/cores/tasks/v108e/water.md`
