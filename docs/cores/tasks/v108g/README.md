# Round v1.08g: the last things in Blender (Release, 6 Nov 2026 AEDT)

## What the owner asked (6 Nov 2026 AEDT, pop-up)

The second account has usage left. The owner picked three jobs for it:
1. **Festival things**: the decorations of every festival (Tết, Mid-Autumn, Diwali, Teachers' Day and the rest in
   `js/festivals.ts`, placed by `js/festdecor.ts`), the lantern quest's lanterns (`js/lanterns.ts`), the hội làng and folk
   show stages (`js/hoilang.ts`, `js/folkshow.ts`) and the kites (`js/kite.ts`).
2. **Story and street props**: the story chapters' props (`js/content/chapter2props.ts` Hà Nội,
   `js/content/chapter3props.ts` Sydney), the hawkers' carts (`js/hawkers.ts`), the snacks (`js/snacks.ts`) and the
   vendors (`js/vendors.ts`).
3. **Film faces upgrade**: the film character kit (`tools/blender/lumi.py`, used by `tools/blender/storypage.py`) gets the
   half-closed lids and the eyes-to-the-side faces (a half blink now shows fully closed; looking at the speaker is only a
   head turn). Then the owner's PC re-renders the 38 Blender films (about 7 h on the RTX 3060 Ti).

Not in this round: the three missing films (Hồ Gươm, Cây khế, Sự tích dưa hấu) are already rendering on the owner's PC.

## The base and branches

Start from `origin/integrate/v108`. One branch per job, so Release can merge each when it is ready:

| Job | Branch | Script |
|---|---|---|
| Festival things | `work/v108g-festivals` | `tools/blender/world-festivals.py` |
| Story and street props | `work/v108g-props` | `tools/blender/world-props.py` |
| Film faces upgrade | `work/v108g-filmfaces` | changes in `tools/blender/lumi.py`, `lumi-more.py`, `storypage.py` |

The second account runs them one after another (or two at once if it has room), not all three in one chat.

## How (the same rules as v1.08e)

Read `docs/cores/tasks/v108e/README.md` first; everything there applies. In short:
- **The shared kit** `js/modelkit.ts`: tag the code shape with `worldTag(obj, '<name>', opts)` (js/gfx.ts) or call
  `modelFor(fallback, name)`; many copies of one thing use `worldModelParts(name)` for one InstancedMesh. The code shape
  stays as the fallback. Models go to `models/world/<name>.glb` (meshopt, vertex colours, about 50-200 KB, 300-3,000
  triangles for small things). They are **not** in the `sw.ts` install list (cached at runtime).
- **A new picture-book design**, soft and rounded in the style of the friends and the gallery
  (`docs/characters-v108/gallery/`), not a rebuild of the code shape. Keep the code shape's footprint and height so the
  colliders, tap spots and checks stay true; it stands on the ground and faces the same way.
- **Festival decorations**: many copies of the same lamp or lantern are one InstancedMesh. They appear and go with the
  festival dates (check `festivals`, `festhunt`, `festcal`); no piece past the valley edge (`EDGE` in `js/world.ts`, new
  check case in `tests/wading.mts`).
- **Speed limits stay**: `perf` (420 draws in the village, 490 at home), `battery`, `longplaymem`, `startup` (first
  download 1025 KB or less).
- **Never hide a statement inside a comment.** Three merges this week lost a line because a note was pasted in front of
  code on the same line (`// (v1.08e ...) out.push(mesh);`). Put the note on its own line or after the code.
- Our own art only; English and Vietnamese names for anything a child sees; do not move places on the map.
- Screenshots before and after (phone 390x844, tablet, computer 1280x800) in `docs/world-models-v108g/<job>/`.

## Film faces upgrade, more detail

- The game's faces already have these moods and moves (v1.08e faces, Part 3: shape keys `face-half`, `face-lookL`,
  `face-lookR`, `face-smile`, `face-sad` and the rest, `js/friend-model.ts`). The film kit should use the same faces, so a
  film's blink goes half, closed, half, and the eyes turn to the speaker.
- `tools/blender/scene-export.mts` already writes each frame's face (`smile`, `happy`, `sad`, `surprised`, `curious`,
  `shy`, `excited`, blinks, glances): `storypage.py` should pick the matching shape key instead of the nearest full face.
- Check with one film first (`banhchung`): a still of a half blink and of a glance, both in
  `docs/characters-v108/films/`. Then hand the owner the render command for all 38
  (`docs/cores/tasks/v108c/blender-films-gpu.md`); the PC session runs it.

## Checks (one at a time: `cd tests && node suite.mts --jobs 1 --only <names>`)

- Festival things: `festivals,festhunt,festcal,wading,solid,perf,battery,worldplaces,types`.
- Story and street props: `story,perf,battery,solid,worldplaces,types` and the check of each file you change.
- Film faces: `blenderfilms,tales,story,faces`.
Restore the test byproducts before committing (`content/management-catalogue.json`, `tools/voice-daily.json`).

## Done

Write "ready for Release" at the top of `docs/cores/tasks/v108g/<job>.md`, push your branch (never `main`, never
`integrate/v108`), and give the owner a short report to pass to Release: what changed, every check with pass or fail,
branch and last commit, screenshots, anything assumed.
