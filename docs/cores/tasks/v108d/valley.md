# Helper: valley (v1.08d) — status

**ready for Release** (5 Nov 2026, 11:20 pm AEDT). Branch `work/v108d-valley` from `origin/integrate/v108`.

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

- `tests/startup-baseline.json`: firstKB limit 1040 to 1025.
- `index.html`: the preload list again (`node tools/preload.mts`).

**Result (check `startup`, this machine x1.78 slower than the reference):**

| | integrate/v108 | Part 1 |
|---|---|---|
| first download | 1063 KB | 1021 KB |
| first start, ready | 38.3 s (machine x1.90) | 25.0 s (machine x1.78) |
| second start, ready | | 19.5 s, longest freeze 2.5 s |

## Parts 2 and 3: what changed
- `js/areas.ts` (new): **parts of the valley built after the start.** Each part has a place on the map. After the valley
  is ready, one part is built in each quiet moment of the page: the nearest first, and of two parts the one the child
  walks towards first. A part more than 150 m from the child waits until the child comes within 150 m or flies there;
  `G.travel` (`js/main/hero-events.ts`) builds the parts round the landing spot while its blue fade is up (the short,
  soft loading moment). A built part farther than 170 m sleeps: its scene objects are hidden and its every-frame work
  stops; it wakes within 140 m. Parts are built once and kept (nothing is thrown away and rebuilt), so the memory stays
  level; the roads, ground and solid maps stay kept on the device as before (#31).
- **The parts this round (`js/main.ts`):** the signposts (one part: they share one picture), the crossing warnings of
  Phố Hai Quê and of Aussie Corner (one part each, `createCrossings(G, ids)`), and each city's symbol animal (ten
  parts, `createSymbols(G, { only })`: Brisbane, Sydney, Melbourne, Hà Nội, Bắc Ninh, Đà Nẵng, Sài Gòn, Aussie Corner,
  China, India). They were before "ready"; now about 0.2 s (second start, full speed) less work before the child can move.
- After each part (`js/main.ts`): its pickups join first come first served (`G.claims.wrap`), its activities get their
  bubbles (`setupBubbles` now adds only new ones, `js/main/interactables.ts`), and the solid map is made again a moment
  later. `js/solids.ts` keeps the last three solid maps on the device (it kept only the newest, so every start would
  have worked it out twice).
- `js/roads.ts` crossing warnings: the headroom rays test only meshes within 30 m of that street and not the ground
  mesh (a ray going straight up from just above the ground cannot meet it); the signs land on the same spots
  (checked against `origin/integrate/v108`: identical), in a fraction of the time (165 ms to 40–80 ms).
- **Kept at the start on purpose:** the children playing in Hà Nội and Sài Gòn (`js/vnfun.ts`): they are hosts on the
  folk games time tables (`js/folkshow.ts`), which are made from the hosts present at the start. The region sites:
  they add to the landmarks list that the name tags and the passport read at the start. The ground, roads, cities,
  homes and villagers: everything else is built on them.
- Checks: `tests/harness.mts` start() builds every part before a check plays (the checks play in the whole valley);
  new check `areastream` (`tests/checks/valley.mts`) starts without that, and checks that the parts near home are built
  at once and far ones wait, then flies to every part three times round: each is built by its first landing, what it
  made that can be tapped is not inside anything solid, far parts sleep and wake at home, and the graphics memory is
  level from the second round.

## Places moved
Built later, a part places its things round what already stands, so a few land elsewhere:

| What | Old (x, z) | New (x, z) | Why |
|---|---|---|---|
| Signpost at the junction by Memory Village (west) | -136.99, 47.33 | -137.00, 51.48 | built after the start: its old spot is now taken by a collider made before it (same boards) |
| Signpost on the road to Lotus Village, Đà Nẵng, Hà Nội | 148.01, -38.67 | 146.76, -37.83 | the same |
| The 4 crossing warning signs | unchanged | unchanged | checked identical |

## Checks (Part 1, commit 8ed9d5111, 5 Nov 2026 AEDT, one at a time with `--only`; `--changed` asked for the full suite because `.gitignore` changed)
- pass: startup, festgameids (new), boot, preload (after `node tools/preload.mts`), lighterload, roads, jobs, wayfind,
  dayplan, animalhomes, perf, longplaymem
- **fail, not from this branch: battery.** "far people standing still are one shape": one far person is not, the
  child's own friend model (`userData.friendModel`, `own`), at 1, 44. A friend's model has no still copy by design
  (`js/avatar.ts` showStill, v1.08b friends), so the check should leave models out. The same happens on
  `origin/integrate/v108` (checked twice with the same script). Left for Release / the friends work: the check is not mine
  to change.

## Checks (Parts 2 and 3, 5 Nov 2026 AEDT, one at a time with `--only`)
- pass: types (after adding `areas` to `types/globals.d.ts`), boot, lighterload, festgameids, roads, solid (saved map
  reused), worldplacement, signs (16 signposts at 16 junctions), ownerroadsafety (20 sign taps at both crossings),
  areastream (new: 13 parts, 4 near home built at once, 4 far ones built on the flight there, all reachable, far parts
  sleep and wake, memory level), autoplay (sample), longplaymem, perf (passed on the second run; the first stopped on
  "__sv is not defined" right after a reload, a timing race in the check on a slow run), startup (1022 KB; ready 31.3 s
  on a machine x2.24 slower than the reference)
- fail, not from this branch: battery (the friend model, see Part 1)
- Screenshots looked at: `tests/out/boot-390.png`, `boot-1024.png`, `boot-1280.png` (phone, tablet, computer): the
  same as before (nothing on screen changed).
- No new spoken lines.

## Left for later
- The ground, roads, cities, homes and villagers are still built before the child can move: everything else stands on
  them. Splitting those by area (the biggest share of the start: the ground 0.6 s, people 0.4 s, roads 0.3 s at full
  speed) means changing how the ground mesh and the solid map are made, a round of its own.
- Far parts sleep (hidden, no every-frame work) but are not thrown away and rebuilt: the builders add to shared lists
  (tap targets, colliders), so rebuilding them safely needs each builder changed.
- More parts can join `js/areas.ts` one by one (each needs a check that nothing at the start reads what it makes): the
  region sites (read by the name tags and passport at the start), the children playing (hosts of the folk games boards).

## Round 2 (after Release's merge, 5 Nov 2026 AEDT)
Release merged this branch with the quality and games work; on the combined code the first download was 1033 KB
against the 1025 KB limit. `origin/integrate/v108` (91c01e198) merged in here.
- What came back into the first download: Lumi (`js/lumi.ts`, `js/content/parents.ts` through it), read by the Simple
  screen and by `js/learn.ts`; and `js/tales.ts` with `js/cartoon.ts`, read by `js/learn.ts`.
- `js/learn.ts`: Lumi's speech bubble and the story theatre load when they are first needed.
- `js/simple.ts`: Lumi's welcome and news use her file at once when it is loaded (`warmLumi`, called by `js/main.ts`
  just after the start), else load it first.
- Result: **1021 KB** on the combined code (check `startup`: 1021 KB, ready 27.2 s on a machine x2.29 slower).
- Checks: pass startup, boot, lighterload, preload (list refreshed), simple, parents, tales, lumiguide (failed before
  `warmLumi`: the first greeting came about 1 s late on the slow test page).
- **types fails, not from this branch:** new findings in `tests/checks/play.mts`, `tests/checks/screens.mts`,
  `tests/checks/voice.mts`, `tests/story-v108b.mts`, files this branch does not change (they came with the merge).

## Round 3, step 1: villagers built when a child comes near (5 Nov 2026 AEDT)
Release's go (5 Nov): part 2 one safe step per push, first villagers behind a stand-in.
- `js/avatar.ts`: `lateAvatar(look)` makes a stand-in: an empty group where the villager stands (`userData.avatar`),
  with their look, their height and an animation that does nothing. `buildAvatar(look, photo, { into })` builds the
  real person into that same object and group, so whatever holds the villager (their place, the day plan, villager
  talk, name tags, chat groups, photo faces: `setFace` waits for the build) keeps it. `wakeLateAvatars(points, r, max)`,
  `buildAllLate()`, `lateLeft()`, `lateSpots()`.
- Made as stand-ins (102 of the 182 people at the start): the city people (`js/cities.ts`), the families outside
  their homes (`js/homes.ts`; people in a room are built at once, as before), the heritage play groups
  (`js/heritage.ts`), the sellers and hosts of the regions (`js/regions.ts`). Their makers use only the group and
  `anim` (one guards `armR`) before the build.
- `js/main.ts`: four times a second the stand-ins within 60 m of a child are built, three at most each time (the
  sellers' and families' own animation starts at 50 to 70 m); round a flight's landing spot all of them at once, while
  the fade is up. `G.areas.all()` (the checks' start) builds them all; `G.areas.late()` counts them.
- Check `areastream`: stand-ins wait at the start, a landing builds those round it, `all()` leaves none and every person
  has their body and animation.
- No place moved: a stand-in stands where the villager stands.

## Round 3, step 2: more villagers as stand-ins (5 Nov 2026 AEDT)
- Stand-ins now also: the people of the Asian villages (`js/asia.ts`), the walking sellers (`js/hawkers.ts`, their
  route goes on; they are built when a child comes near them), the children playing in Hà Nội and Sài Gòn
  (`js/vnfun.ts`; their pose waits for the build, and the blindfold of Blindfold Goat goes on with `afterBuilt`). 120
  people wait as stand-ins at home now.
- Left as they are: Phố Hai Quê (`js/town.ts`, its card players move arms and legs every frame), the yard story, the
  folk show singers, school and lotus village people (stories and shows: they need their bodies at once).
- Checks: pass areastream, boot, stalls, dayplan, autoplay, longplaymem, perf, battery, startup (1022 KB).
  **folkplay and goatcircle fail, not from this branch:** button sizes inside the games ("folk control size", "64px goat
  controls"); they fail the same on `origin/integrate/v108` 91c01e198 (checked).
