# v1.08e water: status

**Ready for Release** (6 Nov 2026, 4:00 am AEDT). Branch `work/v108e-water` (from `origin/integrate/v108`). Brief: `water-brief.md`.

## The water, its file and its depth

| Water | Where its hollow is shaped | Before | Now (most) |
| --- | --- | --- | --- |
| 14 rivers (`RIVERS`): main_n, main_w, main_e, main_s, han, hong, hoian_canal, saigon_r, mekong1, mekong2 (the Mekong), brisbane_r, sydney_harbour (the harbour), yarra, murray | `js/content/map.ts` `WORLD.riverDepth` 1.25, `js/world/ground.ts` | 1.25 m | 0.6 m in the middle, deeper (to 0.8) where a river runs into the lake or the sea |
| Mirror Lake (with the Hạ Long Bay and reef landmarks inside) | `js/world/ground.ts` (`-7`) | 7 m | 0.8 m |
| Hồ Gươm | `js/content/map.ts` WATERS (`depth` now .85, the hollow's shape) | 0.45 m | 0.45 m (unchanged, the owner's knee depth) |
| Billabong, Swan River pond | `js/world/places.ts` default 2.4 | 2.4 m | 0.8 m |
| The sea: Vũng Tàu beach, Season 2 Hạ Long, the Reef, Rottnest, Tasmania | `js/content/map.ts` `WORLD.coast.sea` -5 | 5 m | 0.8 m |
| Lotus pond at Làng Sen | the lake's shore (`js/lotus.ts` only adds the pier and basket boat) | as the lake | as the lake |

## How (one rule for all the water)

Every river, the lake, every pond and the sea keep the shape of their hollow, so every shore stays exactly where it was
(no places moved). At the end of `heightAt` (`js/world/ground.ts`), under the water the hollow's depth d becomes
`0.8 * tanh(d / 1.3)` (`WORLD.wade` in `js/content/map.ts`): never deeper than 0.8 m, and every bank gentler than before.
One change of shape: the lake's "stays a lake" rim pulls down to -2.5 (was -7), so the market side slopes in instead of
dropping (its shore moves about half a metre inward there).

## What changed

- **Depths:** `js/content/map.ts` (`wade`, Hồ Gươm's shape), `js/world/ground.ts` (the remap, the lake rim).
- **Wading** (`js/player.ts`): a little slower the deeper it is (up to 30 percent), a splash going in, splash rings round the legs while walking, `hero.wading` (0-1). The swimming code stays as a safety net; nothing is deep enough for it now. **The camera** never goes under the water.
- **`js/wading.ts`** (new, loaded after the start, in `sw.ts` FILES): splash rings and little fish (orange, gold, silver-blue, our own shapes) near the banks, one InstancedMesh each, hidden when not needed.
- **The look** (`js/world.ts`): lighter, clearer water (`#4fb4e2` at 0.56, was `#2f8fc8` at 0.8), the bed wet sand with pebbles. `js/world/paint.ts`: the foam line only at the very edge (it would have covered all the shallow water). Each water keeps its own tint: Hạ Long and the Reef turquoise, the lotus pond green, Sông Hồng red-brown. Reeds and lilies by the banks were already there (`js/reeds.ts`).
- **Boats:** the ferry hull already sits 8 cm deep, the raft on top of the water: unchanged, floating flat and high. Raft and Hạ Long boat spots use the same depths as before in the new units (`js/ferry.ts`, `js/s2vn.ts`). Vũng Tàu's basket boats float high (`js/roads.ts`). Bridges, piers and routes unchanged.
- **Checks** (each comment names the owner's decision of 6 Nov):
  - `shallowrivers` (`tests/shallow-rivers.mts`): was a 1.25 m bed with a swimming channel over 0.9 m. Now every river's middle 0.4-0.8 m deep with no gap; nowhere in the valley deeper than 0.8 m (every metre of the map); no sudden drop in any bed (0.75 m per metre at most; the steepest today is 0.72).
  - `boats` (`tests/checks/valley.mts`): "deep enough" (0.8 m under the boat and 1.5 m either side) became: the boat floats on the water (hull bottom 0-0.4 m under the top) and its hull never reaches the bed, under it and 1.5 m either side. Nothing else changed.
  - `bridgeunderpass` (`tests/bridge-underpass.mts`): it required swimming under every bridge (water over 0.9 m); now at least 0.3 m and the child wades through, never swimming or sinking. Nothing else changed.
  - `wading` (new, `tests/wading.mts`, end of `tests/run.mts`): a child walks into all 22 waters (every river, the lake, every pond, the sea by Hạ Long, the Reef, Rottnest and Tasmania) and back out: at most 0.8 m deep, never swimming or sinking, splash rings, the camera above the water.
- **Pictures:** `docs/world-models-v108e/water/before/` and `after/` (river, lake, Hạ Long, the Reef; phone, tablet, computer), made by `tools/water-shots.mts`.

## Checks (6 Nov 2026 AEDT, last commit before this note `3ccd94598`, each alone)

| Check | Result |
| --- | --- |
| shallowrivers | pass |
| boats | FAIL only on the 5 Season 2 piers that join no road (vehicles helper). The Southern Coast Boat's route by -115,152 is fixed (a boat channel, below) |
| bridgeunderpass | pass |
| wading (new) | pass: 22 waters, at most 0.8 m deep, camera at least 3.9 m over the water; steep banks climbed at the Hội An canal's quay, the Yarra and Hồ Gươm |
| flyaudit, spawnview, worldplacement, regions, s2vnregions, s2au | pass |
| perf | pass (village 295 draws, home 182; limits 420 and 490) |
| battery | pass |
| startup | pass; first start 1036 KB, the same as the base (`integrate/v108` measured 1036 KB too), so not from this branch |
| boot, types | pass |
| lotus | no such check |

Looked at: river, lake, Hạ Long and Reef pictures on phone, tablet and computer, before and after.

## For Release and other helpers

- **Boat channel (Release, 6 Nov, 4:30 am AEDT):** the Southern Coast Boat leaves the Melbourne river pier along the Murray's north bank, so 1.5 m to its side was dry bank. `MAP.BOAT_CHANNELS` (`js/content/map.ts`) cuts a channel along that 16 m of the route (0.6 m deep, 1.8 m each side, easing out over 1.4 m) in `js/world/ground.ts`; the route, the piers and the rest of the shore stay where they are (the bank there moves about 1 m north). Rechecked: `boats` (only the pier-road failures left), `shallowrivers`, `wading`, `s2au`, `types` pass.
- **Vehicles helper:** boat models: the hull's bottom must stay within 0.4 m of the top (the `boats` check now says so).
- `tests/run.mts`: `wading` is added just before `await b.close()`, after `worldvehicles`; a merge with other helpers that also add checks there keeps both lines.
- No new spoken lines.

## Assumed (owner can change)

- The sea is shallow too (0.8 m), because the brief lists Hạ Long, the Reef, Rottnest and Tasmania, which are in the sea, and "nobody sinks or swims". A child can wade out to Rottnest and Tasmania.
- Steep city banks (Hồ Gươm's rise to Hà Nội's level, the Hội An canal's quay, a Yarra bank) stay: a child climbs out of them as anywhere in the valley; widening them would move Hà Nội's and Hội An's plots.
- A river's middle is 0.6 m (in the 0.4-0.8 range), so its shores stay where they were.
- The swimming code stays in place, unused.
