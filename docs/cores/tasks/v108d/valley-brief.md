# Helper brief: valley (the valley builds as the child walks; the light start)

**Owner, 5 Nov 2026 AEDT:** proceed. Moving where things are placed is allowed this round.

**Plan:** `docs/plans/v109-extras.md`, "Waiting items joining v1.09"; tasks #25, #32, #39, #41 (issue #36).

**Start (Release measured `integrate/v108` on 5 Nov):**
- First download 1063 KB. The limit is 1071 KB and the target is under 1030 KB.
- The second start downloads 0 KB.
- Time to ready about 29 s on Release's machine, against about 20 s before the merge. The slowest steps are "things", "world" and "roads".

## Part 1 (one 5-hour window): measure, then the light start
- **Measure first:** find what the merge added to the first download and to the ready time (friends, story, games, villager atlas, calendar). Write a table in your status file.
- **Bring the first download under 1030 KB.** Load anything not needed before the child can move after ready.
- **Bring the ready time back** to where it was before the merge, or better.
- **Lower the limit:** set `tests/startup-baseline.json` firstKB to the new level.
- **Checks:** `startup`, `perf`, `battery`, `longplaymem`, `boot`, `preload`.

## Part 2: the child walks in after the essentials
- **What builds first:** only the area the child is in: the ground, the paths, the nearest buildings and people.
- **The rest builds while the child plays,** area by area, in small slices per frame so play never stutters.
- **Order:** the area the child walks towards comes first.
- **Moving places:** builders may place things differently when an area is built later, for example houses placed after the roads. Every place a child can reach must stay reachable. Keep the cached roads, land and solids on the device (#31).
- **Checks:** `startup`, `perf`, `battery`, `longplaymem`, `solid`, `roads`, `play`, `autoplay` (sample), and the quality helper's `flyaudit` when it is merged.

## Part 3: areas built as the child comes near, and put to sleep when far
- An area out of reach (for example Sydney while the child is in Lotus Village) is built when the child flies or walks towards it, with a short soft loading moment if needed.
- **Tidying:** far areas can be dropped from memory and rebuilt from the device's cache.
- **Checks:** a new `areastream` check (fly to every region; each builds, is reachable, and memory does not grow over a long play), plus `longplaymem`.

**Record every place you move** in your status file: old position, new position, why.
