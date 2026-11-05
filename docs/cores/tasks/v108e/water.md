# v1.08e water: status

Branch `work/v108e-water` (from `origin/integrate/v108`). Brief: `water-brief.md`. Times AEDT.

## Now

Working (6 Nov 2026 AEDT): depths, wading, look done (part 1); checks next.

## The water, its file and its depth

| Water | Where it is set | Before | Now |
| --- | --- | --- | --- |
| 14 rivers (`RIVERS`): main_n, main_w, main_e, main_s, han, hong, hoian_canal, saigon_r, mekong1, mekong2 (the Mekong), brisbane_r, sydney_harbour (the harbour), yarra, murray | `js/content/map.ts` `WORLD.riverDepth`, bed in `js/world/ground.ts` | 1.25 m | 0.8 m in the middle, rising over 7.5 m to the banks |
| Mirror Lake (with the Hạ Long Bay and reef landmarks inside it) | `js/world/ground.ts` (`-7` twice), now `WORLD.lakeDepth` | 7 m | 0.8 m, shore over 10 m |
| Hồ Gươm pond | `js/content/map.ts` WATERS `depth: .45` | 0.45 m | 0.45 m (unchanged) |
| Billabong, Swan River pond | `js/world/places.ts` default `2.4`, now `WORLD.pondDepth` | 2.4 m (steep, from half the radius) | 0.7 m, gentle shore to the edge |
| The sea: Vũng Tàu beach, Season 2 Hạ Long (s2_halong), the Reef (s2au), Rottnest, Tasmania | `js/content/map.ts` `WORLD.coast.sea` | 5 m | 0.8 m, beach slope over 14 m |
| Lotus pond at Làng Sen | part of the ground by the lake / river bank (`js/lotus.ts` adds the pier and boat only) | as its water | as its water |

## What changed (part 1)

- Depths: `js/content/map.ts` (`riverDepth .8`, `lakeDepth .8`, `pondDepth .7`, `coast.sea -.8`), `js/world/ground.ts`, `js/world/places.ts`.
- Wading: `js/player.ts`: a little slower the deeper it is (up to 30 percent), a splash going in, splash rings while walking; `wading` (0-1) on the hero. The swimming code stays, but nothing is deep enough for it now. Camera: never under the water.
- `js/wading.ts` (new, after the start, in `sw.ts` FILES): splash rings and little fish near the banks, one InstancedMesh each, hidden when not needed.
- Look: `js/world.ts` lighter, clearer water (`#4fb4e2` at 0.56, was `#2f8fc8` at 0.8), wet sand and pebbles on the bed; `js/world/paint.ts` the foam line only at the very edge (it covered all shallow water). River, lake and pond tints are unchanged (Hạ Long and the Reef keep their turquoise, the lotus pond its green).
- Boats: the ferry hull already sits 8 cm deep and the raft on top of the water; unchanged. Vũng Tàu basket boats float high (`js/roads.ts`), the Hạ Long junks find the shallow sea (`js/s2vn.ts`).
- Pictures: `docs/world-models-v108e/water/before/` and `after/` (river, lake, Hạ Long, Reef; phone, tablet, computer), made by `tools/water-shots.mts`.

## Checks

Baseline on `integrate/v108` (6 Nov, before any change): `shallowrivers` pass, `bridgeunderpass` pass, `boats` FAIL (Season 2 piers join no road: the vehicles helper's work).

## Assumed (owner can change)

- The sea is shallow too (0.8 m), because the brief lists Hạ Long, the Reef, Rottnest and Tasmania, which are in the sea, and "nobody sinks or swims". A child can wade out to Rottnest and Tasmania.
- The swimming code stays in place as a safety net, unused.
