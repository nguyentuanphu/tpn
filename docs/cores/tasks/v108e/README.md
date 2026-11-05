# Round v1.08e: the world remade in Blender (Release, 6 Nov 2026 AEDT)

## What the owner asked (6 Nov 2026 AEDT)

**The request:** "We will also need to blender all the animals, trees, flowers, pets and companions, what else do you recommend?"

**Pop-up answers:**
- **Round:** add it to v1.08. v1.08 waits until this work is done.
- **Also remade:**
  - vehicles;
  - landmarks and buildings;
  - food and festival props;
  - farm and My House.
- **Loading:** near the child.
  - Each model is small (about 50-200 KB). Many copies of one thing are drawn as one shape.
  - Models load when a child comes near. The code shapes stay as the fallback when there is no network.

## The base

`integrate/v108` holds every v1.08 helper merged so far:
- platform, games, story, friends, roads, quality (part), valley;
- Season 2 Australia, Season 2 Vietnam, polish, voices.

Each branch starts from `origin/integrate/v108`.

## Helpers

The first account runs at most 5 at once: quality is still running, so this round adds 4.

| Helper | Account | Brief | Branch |
|---|---|---|---|
| creatures | first | `creatures-brief.md`: animals, pets, companions, farm animals | `work/v108e-creatures` |
| vehicles | first | `vehicles-brief.md`: every vehicle the child sees or rides | `work/v108e-vehicles` |
| nature | second | `nature-brief.md`: trees, flowers, plants, farm crops, My House furniture | `work/v108e-nature` |
| water | first | `water-brief.md`: every river, lake and pond shallow (0.4-0.8 m) and friendly | `work/v108e-water` |
| places | second | `places-brief.md`: landmarks, buildings, stalls, food and festival props | `work/v108e-places` |

**Split (owner, 6 Nov 2026 AEDT, pop-up):** places and nature run on the second account, to spare the first account's weekly limit.

## The shared kit (written by Release; use it, do not copy it)

- **`js/modelkit.ts`**
  - **Loading:**
    - `loadWorldModel(name)` loads `models/world/<name>.glb` once, with the friends' toon look (vertex colours, three bands).
    - `worldModel(name)` gives one copy now (for a shop picture or a film).
  - **Swapping in near the child:**
    - `modelFor(fallback, name, opts)` puts the model in the code shape's place the first time a child comes within 70 m. The fallback is hidden, not removed.
    - `wakeWorldModels` runs four times a second from `js/main.ts`, at most 3 swaps each time. `wakeAllWorldModels()` is for checks.
  - **Many copies:** `worldModelParts(name)` gives geometry and material for one InstancedMesh (trees, flowers, crops).
  - **Moves:** models with clips get `play(clip)`. `tickWorldModels` updates them every frame.
- **Starting:** `js/main.ts` starts the kit after the start (`afterStart`), so nothing here is in the first download. `sw.ts` lists `js/modelkit.js` for offline.
- **Changes to the kit:** if you need a change, make it small and marked, and say so in your status file. Release merges the kit changes.
- **The Blender pipeline:**
  - `tools/blender/` already has the friends' scripts: `lumi*.py`, `game-light.py` (the light version for phones), `vehicles.py`, `svkit.py`.
  - Make one script per helper, `tools/blender/world-<helper>.py`, that writes every model of your part to `models/world/`.
  - Each model: meshopt-compressed `.glb`, vertex colours (no big pictures), about 50-200 KB.
  - Triangles: about 300-3,000 for small things, up to 8,000 for a landmark.
  - Blender is not installed in the container. Install it the way `docs/cores/tasks/v108c/blender-brief.md` describes, or with `pip install bpy`.
  - There is no GPU: render pictures with Cycles at low samples, or with Workbench for quick checks.

## Rules

Everything in `docs/cores/tasks/v108b/README.md` applies.

- **Only Release merges and runs the full suite** (owner, 5 Nov). Run only the checks for your own change, one at a time (`cd tests && node suite.mts --jobs 1 --only <names>`).
- **Push often.** After each part: commit, push, and update your status file `docs/cores/tasks/v108e/<name>.md`.
- **Medium effort, few subagents.** If a usage limit stops you, carry on from your last push after the reset. The first account showed a 7-day usage warning on 5 Nov, so keep turns lean.
- **Speed limits stay:**
  - `perf`: 420 draws in the village, 490 at home.
  - `battery`: far still copies.
  - `longplaymem`: memory must not grow.
  - `startup`: first download 1025 KB or less.
  - Many copies of one model are one InstancedMesh. Far things stay the code shape or a still copy.
- **Offline list:**
  - Every new `js/` file and every `models/world/*.glb` goes into the `FILES` list in `sw.ts`.
  - On 6 Nov, 66 files from earlier helpers were missing, which broke the `offline` and `swupdate` checks.
  - Never write an apostrophe inside that list, comments included: `tools/bundle.mts` reads the quoted names.
- **Our own art only:**
  - Every model is made by our scripts; no downloaded models.
  - Things a child sees keep English and Vietnamese names.
  - Do not move places on the map; models sit where the code shapes stand.
- **A new design, not a rebuild (Release, 6 Nov, after the first vehicles round):**
  - Each model is a new picture-book design: soft, rounded, detailed, in the style of the four friends and the gallery (`docs/characters-v108/gallery/`, `tools/blender/vehicles.py`).
  - Rebuilding the code shape with softer shading is not enough. The before and after screenshots must show a clear change.
  - Keep the code shape's footprint and height, so the colliders, seat points and checks stay true.
- **Check every swap:**
  - The model stands on the ground.
  - It faces the way the code shape faced.
  - Its size matches the code shape, so colliders and hit areas stay true (no floating, no sinking).
- **Screenshots:** phone, tablet and computer, before and after, in `docs/world-models-v108e/<helper>/` (the owner's rule: designs go in the repo).
- **Done:** write "ready for Release" at the top of your status file.
  - **First account:** message Release (session_01SchVRv9GNVGszhptzXpYMs).
  - **Second account:** chats there cannot message Release, so write the report in your last reply for the owner to pass on.
  - The report gives:
  - what changed;
  - the checks, with pass or fail;
  - your branch and last commit;
  - anything assumed.
