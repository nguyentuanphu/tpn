# Helper: valley (v1.08d) — status

**Status:** Part 1 in progress (5 Nov 2026, 9:25 pm AEDT). Branch `work/v108d-valley` from `origin/integrate/v108`.

## Plan
- **Part 1, the light start:** measure what the merge added; move what the child does not need before moving to after the
  start; make the roads' first-start sums cheaper; lower `tests/startup-baseline.json` firstKB.
- **Part 2, the child walks in after the essentials:** the parts of the valley far from the child are built after the
  start, nearest first, one part per quiet moment of the page; everything stays reachable; the kept roads and ground
  (#31) stay on the device.
- **Part 3, areas built when the child comes near:** a far area is built when the child travels towards it; a new check
  `areastream`.

## Part 1: measurements (5 Nov 2026 AEDT, this machine)

How measured: the packed copy (`tools/bundle.mts`), compressed like Netlify, first start with an empty device, up to the
valley ready plus 1 s, as the `startup` check counts it. Every downloaded chunk is split among the source files in it by
their share of its bytes (scratch script, not in the repo). "Before" is `af1038bab` (integrate/v108 before the platform,
games, story and friends merges); "after" is `origin/integrate/v108` (`d9263cdee`).

**First download (KB, compressed)**

| What | Before | After |
|---|---|---|
| Whole first download | 1069 | 1063 |
| Stylesheet | 59.9 | 60.5 |
| `js/content/festgames108b` (festival games' questions, new) | 0 | 10.9 |
| `js/games/catalog` | 11.2 | 13.4 |
| `js/ui/pad` (+ album, map), `js/parents`, `js/surprises`, family missions | 33.5 | 0 (platform helper moved them after the start) |
| `js/learnquest`, release calendar, `festseason`, `gameplace`, `learnpaths` | 0 | 5.8 |
| everything else | about 964 | about 972 |

So the merge did not make the first download bigger: the platform helper's savings and the new parts cancel out.

**Time to ready (ms, first start; tablet speed = the processor 4 times slower; two runs each)**

| Run | Before | After |
|---|---|---|
| full speed | 8427 | 8681 |
| tablet speed, run 1 | 31660 | 25544 |
| tablet speed, run 2 | 24428 | 24963 |

On this machine the merge did not slow the start either (the runs wander by several seconds). The slowest steps at tablet
speed: roads (town to roads) 7.0–7.8 s, things (traffic to things) 4.6–5.0 s, world 3.4–4.1 s. A profile (full speed,
first start) shows `heightAt` (the ground's height) taking 1.8 s of 8.4 s, most of it asked by the roads' profiles.

## Part 1: what changed
- `js/content/festgame-ids.ts` (new): which festival each festival game belongs to, without the questions;
  `js/content/festseason.ts` and `js/main/talks.ts` read it. The questions load with the game. Check `festgameids`
  keeps both lists the same.
- `js/main.ts`: `afterStart(load, make)`: 1.5 s after the valley is ready the files are fetched side by side, then each
  part is made in its own quiet moment. Moved there: learning journeys, scroll help, villager talk and day plan, price
  tags, job boards, Where-is sparkles, animal homes, the reading games menu.
- `js/roads.ts`: a road's ground heights are worked out once per road and reused for its later profiles (the same
  numbers, checked: road heights and a ground sample identical to before).
- `index.html`, `sw.ts`: the page's small icon is a 32 px picture (`icons/icon-32.png`, 2 KB) instead of the 192 px one
  (11 KB); the big ones stay for the Home Screen.

## Places moved
None yet.

## Checks
(to come)
