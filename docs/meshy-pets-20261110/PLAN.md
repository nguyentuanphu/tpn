# Pets and companions with Meshy: plan (10 Nov 2026 AEDT)

Branch `meshy-pets` (from `meshy-production-20261107`), worktree `D:\WorkSpace\sv-meshy-pets`. Waiting for the owner's
approval before any Meshy credit is spent.

## What the game has today

| Kind | What it is | Where it shows | Drawn with |
|---|---|---|---|
| puppy, kitty, bunny, panda, joey, calf | pets (`PETS`, `js/farm.ts`): up to two per child, follow the child, sniff out Leafies, pull the child out of deep water, wear hats; the rest live in the pet yard on the farm | beside the child everywhere; pet yard; some also on the farm and in places (`farm.ts`, `lotus.ts`, `symbols.ts`, `vnfun.ts`, `surprises.ts`) | Blender models `models/world/creature-<kind>.glb` (v1.08e, 70-110 KB, 4-9k triangles, one skin, bones `body head jaw ear0/1 eye/lid/ulid/brow mouth tail leg0-3 knee0-3`, clips `idle walk wag/hop follow cheer sad surprised sleep`), made by `tools/blender/world-creatures.py` from the code shapes in `js/animals.ts`; the code shape is the fallback |
| firefly (Lấp Lánh), dragon (Rồng con) | the companion (`js/companion.ts`): one per child, flies behind the shoulder, carries the lantern, lights the way, grows when fed, wears hats, does loops and spins | beside the child once chosen in the story | same Blender models (`creature-firefly`, `creature-dragon`), clips `idle fly follow flap cheer sad surprised sleep`; the glow, halo, lantern and hats stay code |

Pictures in the game: `tools/meshy/pet_shots.mts` (close: every clip, front, three-quarter, side, back, above, face;
follow: the game's camera while the child walks). Shots in `D:\WorkSpace\meshy\pets\shots-20261110\`.

Sheets: [sheet-idle.jpg](sheet-idle.jpg) (each kind standing: front, three-quarter, side, back, above, face) and
[sheet-clips.jpg](sheet-clips.jpg) (every clip, three-quarter and side). Faults seen at full size:
- All: blocky low-poly shapes, flat colours, no fur; far from the look of the Meshy friends beside them.
- All: `sleep` is only shut eyes and a lowered head while standing; nobody lies down.
- Puppy: stick legs; a dark patch on the back reads as a hole from the side.
- Kitty: the tail is a straight rod; the stripes are boxes standing on the back; thin stick legs; big pink cheek blobs.
- Joey: the tail floats apart from the body in every side view; box feet.
- Calf (the pet is a buffalo calf, "nghé"): almost black, the face cannot be read near or far. **The ChatGPT sheet is a
  brown cow calf with a bell, not a buffalo calf.**
- Firefly: body nearly black; from the side the wings are opaque grey plates; following the child it is only a yellow
  dot (the body cannot be seen).
- Dragon: flat wing plates pass through the body when flapping (side views); yellow whisker lines. **The sheet shows a
  dragon standing on its back legs with tiny folded wings, but the game's dragon flies.**
- Following: pets keep up and turn well; the quest arrow overlaps the calf; name tags fine.

## What already exists for Meshy

- ChatGPT reference sheets for all 8 (`docs/meshy-production-20261107/reference-images/16-puppy` ... `23-firefly`),
  turnarounds front, left side, back (firefly: front and top). Checked by eye: views agree, no props.
- **Puppy is already built by Meshy** (8 Nov: multi-image 30 + remesh 5 + remesh 9k 5 = 40 credits, paid):
  `D:\WorkSpace\meshy\raw-models\C\puppy.glb`, `remesh\puppy.glb`, `remesh\puppy-9000.glb`. Not rigged. It matches the
  sheet closely (`D:\WorkSpace\meshy\fitted\puppy-views.png`). So the dog pilot costs **0 new credits**.
- Credits so far: 1015 charged against the 1000 first budget (ledger). Any new spend needs a new budget from the owner.

## The pipeline for one animal

1. **Sheet**: the existing ChatGPT turnaround (check views agree, standing calm, mouth closed, eyes open, nothing in the
   paws). A redone sheet only if the auditor or the owner finds a fault Meshy copied.
2. **Meshy** (journal-guarded, reserve then post once, never retried):
   multi-image to 3D `meshy-7.1`, texture 2k (30) → Remesh about 20k triangles for the near model (5) → Remesh about
   8k for the far model (5). **No Meshy rigging**: its auto-rig is humanoid only.
3. **Our own four-legged rig** (new `tools/meshy/fit_animal.py`, Blender):
   - joints placed from the mesh: the four leg columns (lowest parts, front/back by the head's side), knees at a fixed
     fraction, the head (front top blob), the jaw under the muzzle, the ears (pieces above or beside the head), the
     tail (the back end), with a per-animal `joints/<kind>.json` to correct by hand;
   - **the same bone names as today's Blender creatures**, so `animal_moves()` in `world-creatures.py` makes the same
     clips (idle, walk, happy move, follow, cheer, sad, surprised, sleep; companions fly and flap), and the game's code
     (`js/creatures.ts`, the head turning to look at the child) works unchanged;
   - weights: Blender's bone-heat weights, then clean-up per part (ears, tail and each leg only from their own piece of
     the mesh, so a wagging tail never drags the back), smoothed round the shoulders and hips;
   - joey and dragon stand on their back legs (the joey's two-leg hop rig already exists in the spec); the firefly is a
     body with no legs to move: Meshy makes the body, the see-through wings and glow stay the game's code.
4. **Face moods**: Meshy's painted eyes kept as painted. Blink and sleep: small lid pieces cut from the fur colour
   right above each eye (the people's mood-piece method, `fit_people.py`, ported to animal faces: eyes found as the dark
   round patch with a light catch near the front of the head); happy, sad, surprised: brows and mouth pieces the same
   way, plus body moves (ears down when sad, ears up and a hop when surprised, tail wag when happy).
5. **Pack**: gltfpack with `-ke` (keeps material tags), near model at most 600 KB, far model at most 200 KB, installed as
   `models/world/creature-<kind>.glb` (and `-hd`). The Blender model stays as the fallback if a file is missing.
6. **Game**: `js/creatures.ts` already swaps the code shape for a model by name; add the near/far switch (the way
   friends do `friendsHDNear`), and the pet hat position from the model's head bone instead of the bounding box.

## Auditor for animals (`tools/meshy/audit_pets.mts`, like `audit.mts`)

Each animal, every clip sampled over its cycle, eight views plus above and below, near and far model, day and night,
with and without a hat; counts written to `summary.txt` with magenta fault pictures:
- `tear`: background seen through the body (weights pulling a piece away: legs from the belly, the tail root);
- `stretch`: triangles stretched more than 2.5 times their rest size (a leg dragging skin);
- `float` / `sink`: feet off the ground or under it in idle, walk and sleep;
- `eyes`: painted eye white or iris left when the lids are shut (blink, sleep);
- `face`: mood pieces' edges seen from the side (light or dark boxes);
- `hat`: the hat off the head bone or inside the head;
- `size`: file sizes and triangle counts.
A self-test with planted faults (a leg weight broken, a lid left open) must be caught before a round's numbers count.

## Order and credits

| Step | What | New credits |
|---|---|---|
| 1 | Dog pilot: rig, clips, face moods, game switch, auditor, on the existing Meshy puppy | 0 |
| 2 | Owner reviews the puppy in game close-ups and following the child | 0 |
| 3 | Pets kitty, bunny, panda, calf (four legs, same rig as the puppy): 4 x 40 | 160 |
| 4 | Joey (two-leg hop rig) and dragon (two legs, wings): 2 x 40 | 80 |
| 5 | Firefly (body only, code wings and glow): 40 | 40 |
| | Spare for one remake if a model comes out wrong (at most 2 remakes) | 80 |
| | **Total after the pilot** | **280 (at most 360)** |

Each later step starts only after the one before passes the auditor and the owner's look. The owner can stop after the
pilot. Farm and wild animals (cow, sheep, pig, buffalo ...) are not in this plan.

## Owner's decisions (10 Nov 2026 AEDT, pop-up answers)

- **Dog pilot first, 0 new credits**, on the existing Meshy puppy: rig, clips, face moods, game switch, pet auditor,
  in-game pictures for the owner. Credits for the other 7 are asked again after the owner has seen the puppy.
- **Calf: use the existing sheet (brown cow calf with a bell)**; the pet becomes a calf ("bê", cow calf) in the game
  (name in `PETS`, `js/farm.ts`: "Buffalo calf / Nghé con" to "Calf / Bê con", and its sound), not a buffalo calf.
- **Dragon: keep the existing sheet** (standing, small wings); it flies on its small wings.
- **Firefly: Meshy body, wings and glow stay the game's code**; the body a lighter navy so it reads from far away.
