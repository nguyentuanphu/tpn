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

- **12 Nov 2026 AEDT (pop-up "Cả 5 con, 200")**: the five pets kitty, bunny, panda, joey, calf in one go, 200 credits
  (each multi-image 30 + remesh 30k 5 + remesh 9k 5), balance 1,764 before. Submitted 11:02 AEDT through the journal:
  kitty 01a1cd10-4d53, bunny 01a1cd10-56e6, panda 01a1cd10-6052, joey 01a1cd10-69e0, calf 01a1cd10-736f.
- **13 Nov 2026 AEDT, early morning (pop-ups)**: asked which of panda, bunny, calf to approve, the owner ticked bunny,
  calf and "not yet" and wrote "Kiểm tra kỹ khi chạy nhảy và các kiểu chưa" (checked carefully when running, jumping
  and the other moves?): read as not approved yet. Then chose "Quay phim pet": films of each pet moving in the game
  (`tools/meshy/pet_film.mts`: stand, follow walking, run, each own move; six views) before approving.
- **13 Nov 2026 AEDT, morning (after the films of panda, bunny, calf, kitty)**: the owner ticked bunny and calf and
  wrote "Gấu trúc và thỏ đã cho feedbacks phía trên, tất cả con vật khi nhảy đều nhìn quá cứng" (all animals look too
  stiff when jumping; the panda and bunny feedback "above" is not in this chat: ask again). Then chose "Sửa nhảy trước":
  the jump is now smooth key poses with squash, stretch and follow-through (`extra_moves` jump, `fit_animal.py`);
  the four are rebuilt and filmed again (`D:\WorkSpace\meshy\pets\film2`). Not approved yet: show the new films.
- **13 Nov 2026 AEDT, mid-morning (after the film2 films)**: "Nhảy vẫn cứng, Tất cả cần kiểm tra lại ở bước nhảy
  đứng, cổ và chân khi đang chạy và khi gãi": the jump still looks stiff; check again, for all pets, the standing jump,
  and the neck and legs while running and while scratching. None approved.
- **13 Nov 2026 AEDT, late morning (after film3 of calf and kitty), owner, upset:** not acceptable. **The legs turn
  pointed ("nhọn") when jumping and running: said many times.** Film the pets in an open place: the farm plots hid the
  feet. Never send a pet for approval before looking at its feet, frame by frame, at full size, in every run and jump.
- **13 Nov 2026 AEDT, afternoon (after the film20 films):** "Thỏ oke, nhưng khi nhảy bằng 4 chân nhìn hơi cứng": the
  bunny is fine except its four-leg jump looks a little stiff. Panda, kitty, calf: no answer yet.
- **13 Nov 2026 AEDT, owner (screenshot of the chat):** the panda and bunny feedback "above" was these two messages: the
  panda's white specks and dented feet (fixed: repack, sit_fold) and the bunny's stiff four-leg jump (fixed: jump_spring).
  Nothing else is owed on those two.

## Dog pilot: progress (10 Nov 2026 AEDT, no credits spent)

- `tools/meshy/fit_animal.py` (Blender): turns the Meshy puppy to face the game's front at the game animal's height;
  finds the joints from the shape (the belly from below, the four leg columns, the back over the back half, the neck,
  the tail's root, the ears; `animal_joints/<kind>.json` corrects or tunes); weights part by part (legs only inside each
  leg's own thickness, the head over a tilted neck plane, ears, tail), smoothed over the surface and, round the legs'
  tops, in space (Meshy's fur is loose cards); the game's creature bones and world-creatures.py's own clips (leg and
  ear swings made smaller for thick legs and soft ears); sleep lies like a sphinx; every clip is lifted where anything
  would go under the ground.
- Face: Meshy's painted eyes and nose found from the front (dark patches); for each eye a "shut" lid and a "happy"
  lid, each a fine grid laid on the face over the whole painted eye (white, outline, iris) with its own picture: the fur
  round the eye filled in and a lash line; an open mouth under the nose. Clips show them (blinks, sleep, happy moves).
- Game: `js/modelkit.ts` draws a "meshy-" material by its own painted light (like the Meshy friends); `js/creatures.ts`
  uses `creature-<kind>-hd` within 16 m of a child and `creature-<kind>` beyond 24 m (falls back to the far one).
- `tools/meshy/audit_pets.mts`: stretch, tear, sink/float, eyes, hat, size, with a self-test of planted faults.
  `tools/meshy/make_animal.ps1 -Kind puppy` runs fit, pack, install (working copy), shots and the audit.
- Sizes: near 716 KB (31k triangles, 1024 px picture), far 374 KB (9k, 512 px).
- Fixed on the way: shots read linear colours (too dark and orange, `game_shots.mts` has the same: pictures darker than
  the game); `skeleton.pose()` breaks gltfpack-quantized models (the auditor keeps the bones' loaded pose instead).

## Owner's decisions after the first puppy pictures (10 Nov 2026 AEDT)

- "2 con puppies to quá": pet scale 1.3 to 0.85, then "Xuống thử 0.6": **0.6** (`PET_SCALE.puppy`, `js/pets.ts`); the
  name tag sits just over each pet (`tagY`).
- **Every pet gets its own special skill** ("Mỗi con sẽ có một skills đặc biệt riêng"). The puppy: **fetch the ball,
  dig for treasure, lead the way**. For the other pets the owner asked for more special ideas than the first list
  (kitty climbs trees, bunny long jumps and finds carrots, panda shakes trees, joey jumps high and carries in its pouch,
  calf pulls a cart, dragon flies the child over rivers and lights lanterns, firefly lights the night): a new proposal
  comes after the puppy.
- New moves for the puppy: **run fast, jump and bounce, sit and beg, roll over and scratch, swim** (plus dig, for
  its treasure skill).

## Proposal: each pet's special skill (for the owner, 10 Nov 2026)

The puppy (decided): fetch the ball, dig for treasure, lead the way. Proposed for the others, each something only that
animal can do, that opens a place or a game the child could not reach alone:
- **Kitty, "night eyes and high places"**: its eyes glow at night and show hidden things (Leafies, stars, lost items)
  that only it can see; it climbs trees and roofs to bring down kites and balls stuck up high.
- **Bunny, "bunny burrows"**: rabbit holes round the valley join up; the bunny takes the child through them, a quick way
  from one corner to another; and it grows a carrot patch that sprouts in a day.
- **Panda cub, "bamboo builder"**: it lays bamboo across small streams and gaps as a bridge, and rolls down a hill as
  a ball (a downhill race game).
- **Joey, "magic pouch and spring jump"**: its pouch keeps three things for the child; it bounces the child up onto
  high ledges (a spring pad).
- **Calf, "the little herder"**: it pulls a small cart that carries crops, and herds the farm animals home at dusk
  (a herding game).
- **Little dragon, "sky ride and warm breath"**: the child rides it across rivers and up to the hilltops; its warm
  breath lights lanterns and melts ice.
- **Sparkle the firefly, "star guide"**: it calls a swarm of fireflies to make a light bridge at night and joins the
  stars into pictures (a constellation game).

## Accessories and what the auditor covers (10 Nov 2026, owner: "Audit tools kiểm tra kỹ hết chưa, ... accessories ... thử lên chưa")

- Accessories: the 8 hats (party, flower crown, little nón lá, golden crown, woolly beanie, captain, wizard, lotus
  crown; `HATS`, `js/kidplay.ts`), bought with coins and worn by the companion or a pet. The Meshy puppy also has its
  own painted red collar (part of the model, not removable). Before this round a pet's hat was fixed to the whole pet
  and stayed in the air when the head moved: it now sits on the model's head bone (`putHat`, `js/pets.ts`) and is put
  on again when the model arrives or changes near/far. Sheet: [puppy-hats.jpg](puppy-hats.jpg).
- The auditor (`audit_pets.mts`) checks, near and far: stretch, tears through to the background, sink and float,
  shut and happy eyes, every hat in every clip, file sizes; 18 clips, 6 moments, 10 sides plus level from each side.
  The game checks: `worldcreatures`, `petskills` (fetch, dig, lead, a hat on the head bone), `phone`.
- **Not checked yet:** the mood pieces' edges seen from the side (looked at by eye only); flicker between frames; the
  puppy running into walls or buildings while leading (it goes in a straight line); night light; two children with
  pets side by side; speed on a phone with two Meshy puppies (`perf` not run); the pet yard and the farm; the water
  rescue with the swim move; hats on the far model; the village dog, which is the same puppy model at 0.9.

## Everything checked (10 Nov 2026 evening, owner: "Kiểm tra cho hết nhé, mũ phải nudge fit")

- **Hats fitted**: each hat's band goes round the skull at its own depth (`HAT_FIT`, `hatFit` in `js/pets.ts`):
  a beanie pulled down, a captain's hat a little, crowns and rings on top. The auditor measures every hat in every
  clip, near and far: floating (over 6 % of the head's height), loose band (over 4 of 16 points 8 % off the skull),
  head through a closed hat; a planted lifted hat is caught. Close-ups: `puppy-hatfit.jpg`.
- **Shut eyes** from five sides (front, three-quarters, side); **flicker** of the lids (the same moment drawn with
  other near and far planes: only depth fights change); far model lids finer (20 cells).
- **Lead the way and fetch** never go through houses (steps slide along the solid map; `petskills` leads round a
  house). **Rescue**: the puppy runs to the water and swims (it stood still in the follow move before).
- **Scenes** (`pet_shots.mts scenes`): night, the pet yard (Meshy model at 0.6), the village dog (the same puppy,
  near model), the water rescue (run, swim), two children side by side (a pet each, chips in each half).
- **Speed**: `perf` cannot run here (it needs esbuild, not installed in this checkout or the production one). Measured
  instead on a phone-sized split screen: two Meshy puppies draw about 10 % more triangles than the code shapes
  (732k against 667k a frame over both halves); frame times the same within noise in the software renderer. A real
  phone was not measured.
- Still by eye only: the open mouth's edges from the side.

## Owner's approval (11 Nov 2026 AEDT)

- "Giữ 2 bản, duyệt": the Meshy puppy goes on the branch, both models (near `creature-puppy-hd.glb` within 16 m,
  far `creature-puppy.glb` beyond 24 m, as the friends' two files). Pet scale 0.6 kept. The special-skill proposal
  for the other pets agreed. Not merged into main, not deployed, no version change.

## Legs, hips and the open mouth (11 Nov 2026, owner: "Tất cả chân và háng ok hết khi chạy nhảy phải không, có thử khi há miệng chưa")

- **Legs and hips**: close-ups (`pet_shots.mts legs`) of run, carry, jump, bounce, sit, beg and roll, six moments each,
  from the side, behind and below: no tears, no gaps at the hips or between the hind legs, the feet on the ground.
  Sheets: `puppy-legs-side.jpg`, `puppy-legs-back.jpg`, `puppy-legs-below.jpg`.
- **Open mouth: a fault found and fixed.** The open mouth was a round piece set into the face: from the front it looked
  right, from below and the sides it stuck out of both cheeks as dark red bumps. It is now a piece laid on the
  muzzle's own surface (like the lids) with its own picture (the fur as painted, a smaller open mouth with a pink
  tongue), grown from its middle by the jaw. The auditor's new `mouth` check counts any point of it more than 1.2 cm
  off the face's own triangles (a planted oversized mouth is caught). Sheet: `puppy-mouth.jpg` (`pet_shots.mts mouth`).

- (11 Nov 2026) Owner approved the Meshy puppy after the legs, hips and open-mouth checks ("Okay approved").
