# v1.08e creatures: status

**ready for Release** (6 Nov 2026, 04:08 AEDT, fifth pass: eyes on the face). Branch `work/v108e-creatures` from `origin/integrate/v108`.

## Fifth pass: eyes on the face (owner, 6 Nov 2026 AEDT: "Animals eyes too pop out, too scary")

- The eyes stood where the old code's eye balls were, in front of the (now bigger) head. Each eye is now found on the
  head's own surface and lies on it, turned to face out along it, centred on the surface so it stands out only about a
  third of its size, like a button. Layers in order: colour, pupil and glow, then the sparkles, so the sparkle always shows.
- A little smaller (1.22 times the code eye; companions 1.05). The light rim only on a dark face (panda, sheep, penguin,
  firefly), not on the dragon. The closed-eye arcs sit on the face too, and are light on a dark face.
- worldcreatures passes ({"6 Nov 2026, 04:08 AEDT"}). Pictures updated: moods-1 to moods-3, sheet-1, sheet-2, moves, *-face.png.

## Fourth pass: plush refinement (owner, 6 Nov 2026 AEDT, pop-up: all four of smoother, cuter proportions, more detail, nicer moves)

- **Smoother, softer:** cylinders and cones have rounded edges and tips; boxes (feet, flippers, bills, the peacock's fan)
  are rounded; a soft round hip where each leg meets the body (no hard seam); more detail on the big shapes.
- **Cuter proportions:** bigger heads (about 1.15-1.35 times), chubbier bodies, shorter chunkier legs, like soft toys. Each
  creature is then sized back to its code shape's height, so it stands as tall as before; width and length change a
  little (the check allows 30 % there, the height still 12 %, as the owner chose when picking cuter proportions).
- **More detail:** three toes on each paw (puppy, kitty, bear, panda, koala), split hooves (calf, cow, bull, buffalo,
  unicorn, pig), a tuft of fur on the head (puppy, calf, cow, bull, buffalo, pig, joey).
- **Nicer moves:** knees half way down each walking leg that bend as the foot comes forward and fold under when lying
  down; the body bounces and squashes a little with each step; ears and head move a beat behind the step; in the game an
  animal near a child turns its head to look at them (`js/creatures.ts`).
- 2,900-9,200 triangles, 2.0 MB for all 24 (loaded only near the child).
- Checks ({"6 Nov 2026, 04:00 AEDT"}, one at a time, all on the first try): worldcreatures, types, boot, startup (1032 KB, same as the
  base), perf (village 278 draws, 631k triangles), battery, longplaymem, companiongoal.
- Pictures: sheet-1, sheet-2, moods-1 to moods-3, horns, moves (walk, walk, cheer, asleep), *-face.png (the puppy greeting
  the child in the game).

## Third pass: friendly eyes (owner, 6 Nov 2026 AEDT: "All the animals eyes look still very scary")

- The eyes were round balls bulging out of the face, some with whites round them (goggly), the kitty's with slits, under
  dark brows close above: a stare. Now they are big, soft, glossy eyes that sit flat on the face like a picture book's:
  warm dark brown, a little taller than wide, a big sparkle and a small one on the same side of both eyes, a soft glow at
  the bottom. No whites (a thin light rim only on a dark face: panda, penguin, sheep, companions); the kitty has green
  eyes with round pupils; the companions' eyes are smaller for their heads.
- Brows are short, soft (a little darker than the fur) and well above the eyes.
- Happy and asleep show only the closed-eye curve ("^ ^" and a gentle curve), not a squashed eye under it.
- Surprised eyes grow a little (18 %), not a lot.
- worldcreatures passes ({"6 Nov 2026, 03:36 AEDT"}). Pictures updated: moods-1 to moods-3, sheet-1, sheet-2, *-face.png.

## Second pass (owner, 6 Nov 2026 AEDT)

The owner: "The animals need better refinement, this is still very scratchy and still doesn't look as nice. Check the cows
and buffaloes horns, they look incorrect, all animals need to show emotions, facial expressions, movements, eye blinks."

- **Smooth, clean shapes:** the melted felt surface (voxel remesh, thinned) made lumpy shapes and jagged colour edges; it is
  gone. Each part is now a smooth round shape at good detail with clean colour edges (2,400-9,000 triangles, 45-92 KB).
- **Horns:** shaped in Blender as smooth tapering curves with darker tips: the cow's and bull's curve out and up, the calf's
  are short nubs, the buffalo's sweep out and back in a wide crescent with rings (as wide as before, so its hit area stays).
- **Faces on all 24:** shiny eyes with two highlights (whites for the sheep, penguin, panda and companions; the kitty's
  green eyes with slit pupils), brows, a mouth (a "w" for the kitty and bunny; none for beaks, the platypus's bill and the
  elephant's trunk), rosy cheeks. Bones for each eye, brow, the mouth and the jaw, and a closed-eye arc for each eye.
- **Moves and moods:** every clip blinks; idle also looks around and twitches its ears. New clips `sad`, `surprised`,
  `sleep`; happy move and cheer show "^ ^" eyes and an open smile.
- **In the game** (`js/creatures.ts`): an animal is surprised when a child walks up, then does its happy move to greet
  them; it is sad for a moment when they walk away; it sleeps at night when nobody is near; a pet cheers on its happy jump.
  The companion is surprised when it starts lighting the way, flaps on a trick, and sleeps beside a resting child at night.
- **Check `worldcreatures`** now also checks the eight clips, two eyes and a closed-eye arc on every creature, a blink in
  idle and shut eyes asleep.
- Checks (6 Nov 2026, 03:28 AEDT, one at a time): worldcreatures, types, boot, startup (1032 KB, same as the base), perf (village 275 draws),
  battery, longplaymem, areastream, companiongoal: all pass, each on the first try.

## What changed

- **Models:** `models/world/creature-<kind>.glb` for 22 animals and 2 companions (24 files, 17-35 KB each, 1,400-4,300
  triangles, about 3,300 on average; meshopt; vertex colours, one material, one skinned mesh = one draw).
  - Made by `tools/blender/world-creatures.py` (`node tools/make-creatures.mts [kind ...]`, Blender 4.2.3, gltfpack 0.20).
  - The shapes come from the game's own code (`tools/blender/creatures-dump.mts` writes `tools/blender/creatures-spec.json`),
    so place, size and facing match the code shapes. Big parts of each moving piece are melted into one soft felt shape
    (voxel remesh, smoothed, thinned) with their colours carried over; eyes, noses and small bits stay crisp.
  - Skeleton: one bone per moving piece (body, head, ears, tail, legs; wings for companions).
  - Clips: `idle`, `walk` (companions `fly`), the happy move (`wag`, `hop` or `flap`, in `tools/blender/creatures-built.json`),
    `follow`, `cheer`; every creature has all five (pets and companions use `follow` and `cheer`).
- **Game:**
  - `js/creatures.ts` (new, after the start): asks for an animal's model the first time a child comes near (tickAnimals,
    60 m), at most 3 a moment; plays walk/follow/idle by speed, the happy move now and then when still, cheer on a pet's
    happy jump. The companion's model loads as soon as the child has one.
  - `js/animals.ts`: two small hooks (`useCreatureModels`, `animalCheer`); the code shape (`rig.root`) is hidden, not
    removed, and stays as the fallback.
  - `js/companion.ts`: the code shape's body and wings in a `look` group (the fallback); the glow, lantern, hat and tricks
    stay the game's own. Hook `useCompanionModels`.
  - `js/pets.ts`: a pet's happy jump plays its cheer (`animalCheer`).
  - `js/main.ts`: one marked line, `afterStart(() => import('./creatures.js'), ...)`. `sw.ts`: `js/creatures.js` in the offline list.
  - Shop, Bag and game pictures keep our drawings in `js/art.ts`; only the 3D world changed.
- **Check:** `worldcreatures` (`tests/world-creatures.mts`, end of `tests/run.mts`).
- **Screenshots:** `docs/world-models-v108e/creatures/` (phone, tablet, computer, before and after; code-vs-model sheets).

## Checks (one at a time, 6 Nov 2026, 02:54 AEDT)

| Check | Result |
|---|---|
| worldcreatures | pass (24 models load, size within 12 %, feet on the ground, clips move, bunny swapped near the child, dragon companion model, code shapes stay when blocked) |
| types, names | pass |
| boot | pass |
| startup | pass: first start 1032 KB, the same as integrate/v108 without this branch (1032 KB measured the same way); the 1025 KB target was already passed by the base |
| perf | pass on the second try (village 276 draws, home 155); the first try stopped on "__sv is not defined" while the check's page reloaded, not in creature code |
| battery | pass |
| longplaymem | pass |
| areastream | pass |
| companiongoal | pass |
| pets, companion | no checks with these names; companiongoal covers the companion screen |

## Assumed (owner or Release can change)

- Model names have a `creature-` prefix (`creature-puppy`), so they never clash with the other helpers' models.
- Animals in story films keep the code shapes this round (`filmAnimal`).
- Flocks (the little hens, ducks, birds, fish pictures in `world.critters`) stay as they are (brief point 4).
- Animals swap in through the animals' own near-the-child tick (`tickAnimals`, 60 m) rather than `modelFor`'s queue: an
  animal that is removed (a pet rebuilt) then never waits in the queue for good. The kit itself is unchanged.
- Files are 17-35 KB, under the "about 50-200 KB" guide: smaller is lighter on phones, and the look holds at game distance.
- Happy moves: wag for animals with a wagging tail and the cattle, flap for the birds, hop for the rest.

## Every creature the code draws

| Creature | id (model) | Drawn by | Where it shows (copies) |
|---|---|---|---|
| puppy, kitty, bunny, panda, joey, calf | `creature-<kind>` | `js/animals.ts` `animalModel` | the child's pets (`js/pets.ts`, up to 2 per child, at home and the yard), farm animals (`js/farm.ts`), Lotus Village (`js/lotus.ts`, the village dog) |
| cow, sheep, pig, chicken, unicorn | `creature-<kind>` | `js/animals.ts` | farm animals (`js/farm.ts`, one per animal bought), hutch bunny, Lotus hens (`js/lotus.ts`, with `js/animalhomes.ts` coop) |
| bear, koala, platypus, penguin, emu, turtle, elephant, crane, bull, buffalo, peacock | `creature-<kind>` | `js/animals.ts` | regional symbols (`js/symbols.ts`, one each), Lotus Village (`js/lotus.ts`, the buffalo cart), Vietnam fun (`js/vnfun.ts`) |
| firefly (Lấp Lánh), baby dragon (Rồng con) | `creature-firefly`, `creature-dragon` | `js/companion.ts` | the child's companion, one per child |
| little hens, ducks, birds, fish (pictures) | stay as they are | `world.critters` sprites (`js/world.ts`, `js/animalhomes.ts`) | flocks: stay sprites (brief point 4) |
| animals in story films | stay code shapes | `js/content/films/kit.ts` `filmAnimal` | films keep the code shapes this round |

## Progress notes

- 6 Nov 2026, 02:54 AEDT: all parts done, checks above, ready for Release.
- 6 Nov 2026, 02:05 AEDT: `tools/blender/creatures-dump.mts` reads every creature's parts from the game's own code into `tools/blender/creatures-spec.json` (22 animals, 2 companions), so the Blender models match place, size and facing.

## Owner's decisions

- 6 Nov 2026 AEDT (pop-up, "Everything still need better refinement"): all four: smoother and softer (no facets or hard seams, rounded boxes, soft joints, paws and hooves); cuter proportions (bigger heads, chubbier bodies, shorter legs, like plush toys; the sizes the game uses for touching them adjusted); more detail (tufts, toes, hooves); nicer moves (bending knees, bouncing bodies, heads that follow the child, ears and tails with follow-through).
- 6 Nov 2026 AEDT (pop-ups, via Release): the go for v1.08e; models load near the child; code shapes stay as the fallback.
