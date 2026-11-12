---
name: meshy-characters
description: Make Sparkle Valley people (friends, villagers, regional villagers) and animals (pets, companions, valley animals) from ChatGPT reference sheets with Meshy, fit them into the game, and check them in the game before they go on a branch. Use for any Meshy model, fitting, face mood, skin tone or in-game review work.
---

# Meshy characters for Sparkle Valley

Owner rules first (from the owner, 7–8 Nov 2026). They override everything below.

- Never merge main, deploy or bump the version. Work on `meshy-production-20261107` (or a branch the owner names).
- Never retry a paid Meshy request. Every paid call goes through the journal (`D:\WorkSpace\meshy\private\meshy-jobs.sqlite3`, outside the repo): reserve, then post once. Never print or commit the API key.
- Spend only what the owner approved. After any paid run, sync the ledger: `python tools/meshy/ledger_sync.py`.
- Preserve the artwork, age, culture, pose and empty-hand rules of each sheet. Clara's two braids hang in front of the shoulders, none down the back. Regional 074 (coastal grandmother) has short sleeves with clear arm gaps.
- **Nothing goes on the branch until in-game close-ups pass the owner's review.** Blender renders and test numbers are not enough: they hid every face problem on 8 Nov.
- Friends keep the skin Meshy painted. The skin tone choice is hidden (`SKIN_CHOICE` in `js/ui/friends-ui.ts`, `MESHY_TONES` in `js/friend-model.ts`); the tinting must still work cleanly, because the choice may come back.
- (8 Nov 2026, owner's decision) **Friends become a Meshy body plus code-made clothes**: ChatGPT draws each friend with only body, face and hair; clothes are made in Blender from the body's own surface so they fit. Villagers have no shop and stay whole Meshy models.

## Working at scale (owner, 9 Nov 2026: dozens of outfits, villagers and animals to come)

Plan: `docs/meshy-pipeline-20261109/PLAN.md`. In short:
- **The auditor is the gate.** `cd tests; node ../tools/meshy/audit.mts <out> <ids> [quick]` draws every friend in every outfit, nine poses, four views, two skin tones and the closed-eye moods, in the game, and counts faults (`kit`, `poke`, `hairtone`, `skintone`, `eyes`), with magenta fault pictures and `summary.txt`. Nothing goes to the owner while a count is over its limit; the owner reviews looks, not defects.
- **One command:** `powershell -File tools/meshy/make_character.ps1 -Batch finn,sol,clara,lumi -Kind friend [-SkipFit] [-Quick]` builds, installs in the working copy, audits, and exits 2 when the audit fails.
- **Garment shapes are rows** of `tools/meshy/garments.json` (shell copied from the body, or cone hung from the waist; region, thickness, cuts, layer). Bits and layers are written into each model's material extras; the game reads them from the model (no table in the game). At most 8 body-covering and 8 garment-covering shapes per model with the alpha cover mark; outfits are combinations of shapes and colours.
- **While dressed, the swim kit is painted in the worn clothes' colours** (top above the waist, trousers below, keeping its folds): looking into a sleeve or armpit shows "the inside of the clothes", never the grey suit.
- **Auditor rounds, 9 Nov (415 failing cases at the start):** what worked, in order of effect: hide body and inner layers under worn clothes (cover bits); paint the swim kit in the clothes' colours; per-layer depth bias in the game (trousers 2 mm, tops 10 mm, skirts/panels/bib 16 mm, hair below the neck 12 mm: the outline is unchanged, the outer layer wins near-touches); no arm weights on the trunk of tops or on trousers below the armpits; tops' lowest 12 cm follow the thighs; skirt and áo dài panels on driven two-bone chains (front/back, hip to knee with the thigh, knee down mostly hanging), hinged at the hip's front/back surface; skirts thick enough (3.5 cm) to stand clear of tops; radial "inside the cone" cover test for skirts; garment faces turned to agree with the body under them (Blender's recalc turned open shells inward); painted eye whites hidden while the eyes are shut. What failed: wider/longer weight smoothing (.18 m, 30 passes: more pokes, bigger files).
- Auditor limits of its own: hair and skin of one colour (Clara) cannot be told apart in pictures: her hair is checked on the skin-mark sheet. Inside-out cloth looks like the outside (same colour and light): only large patches count (`fold` over 150 px). Shapes (a bib turning into blobs) are not measured: look at the pose sheets.
- **Garments move like cloth:** a top's lowest 8 cm take part of the thigh's weights (the hem lifts with the leg); weights round the shoulders (and hips for trousers) are smoothed over the garment.

## Where things stand (read first; 9 Nov 2026)

- Current state and the next steps: `docs/friends-own-head-20261109/HANDOFF.md`.
- **Friends use the own-head way, B** (the owner chose it on 9 Nov). The whole Meshy swim model is used, head and braids included, with its own face moods and with clothes made in code. The old head graft (A, `graft_friend.ps1`) is kept but not used.
  - One friend: `powershell -File tools/meshy/fit_person.ps1 -Id <id>-swim -Ref D:\WorkSpace\meshy\work-v108\<id>-game-hd.glb -Prefix <id>-` (about 2 min), then `powershell -File tools/meshy/dress_own.ps1 -Id <id>`. Output goes to `D:\WorkSpace\meshy\fitted\<id>-own\`.
- Python with PIL, numpy and scipy for the sheets: `D:\WorkSpace\meshy\tools\pyenv\Scripts\python.exe`. Blender's own Python runs the Blender scripts.
- Review tools:
  - `game_shots.mts` modes `faces`, `tones`, `outfits`, `nape`.
  - `tools/meshy/review_sheets.py` with `eyes`, `chins`, `tones` or `outfits`.
  - `tools/meshy/render_parts.py` (which part a stray piece is).
  - `tools/meshy/render_mark.py` (the skin mark).
- In Windows PowerShell 5.1, never edit Python, JSON or Markdown with `Get-Content`/`Set-Content`/`ReadAllText`+`Replace`: they garble Vietnamese text and line endings. Use the Edit tool or the pyenv Python, and keep each file's own line endings (`fit_people.py` is CRLF).

## Pipeline (one person)

1. **Reference sheet**: ChatGPT turnaround (front, side, back) on grey; views must agree (a braid in front in one view and behind in another makes Meshy build both).
2. **Meshy** (`tools/meshy/overnight.ps1`, journal-guarded): multi-image to 3D `meshy-7.1` (30) → Remesh 30k triangles (5) → Remesh 9k (5, `source@9000`) → Auto-Rigging humanoid (5). Raw files go to `D:\WorkSpace\meshy\raw-models\{A,B,C,remesh,rigged}`. Never do our own decimation of the raw model: it shreds hair and sleeves.
3. **Game reference build**: `blender -b -P tools/blender/lumi.py -- D:\WorkSpace\meshy\work-v108 <friend> game glb hd` or `... villager role=<id> game glb hd` (parts named `villager-`).
4. **Fit**: `powershell -File tools/meshy/fit_person.ps1 -Id <id> [-Ref <ref glb>] [-Villager]`. It runs `auto_joints.py` (joints from Meshy's rig), `fit_people.py` (HD 2048 px, light 9k at 512 px; villager one 1024 px model) and `transfer_rig.py` (Meshy's rig weights onto the game's 11 joints), then gltfpack **with `-ke`** (without it the material tags `skin_ref`, `skin_paint`, `own_face`, `skin_mark` are lost and the game draws the face wrongly). Light model must stay under 500 KB.
5. **Install in the working copy only** (`models/<id>.glb`, `<id>-hd.glb`, `villager-<id>.glb`), then review (below). Commit only after the owner approves.

## How the face works (Meshy's own face)

The face Meshy painted is kept exactly. Each mood is a small soft-edged piece laid just in front of the face, over the eyes and/or mouth only, cut from the same painted face, so its colours and shading match. Earlier ways that failed and must not come back: a face-sized picture layer (band on the forehead, square lid patches, colour mismatch), re-sculpting the eye sockets, recolouring skin by triangle.

- Closed lids close only the painted eye (white, iris, lash pixels, a little wider), filled from the skin right round it; brows, freckles and blush stay.
- The glance slides the whole inside of the eye (white + round iris) within the eye opening.
- Eye whites are found next to a dark iris (white hair is not an eye); hair colour is also sampled from the back of the head (a hat is not hair); a hair-coloured iris still closes (Sol).
- The mouth is the darkest patch of red through the middle (not a red chin or blush).
- The pieces carry the face's own surface directions so they light like the face; the game draws them just on top (polygon offset) and see-through.

## How the game draws a Meshy model (`js/friend-model.ts`)

A model with face pictures is "baked": drawn mostly by its own painted light (emissive 0.95) with a little smooth valley light, both sides, no ink outline. Every friend near any child's camera is high detail (`friendsHDNear`, `js/main.ts`); the light model only far away. Skin tone (when switched on): triangles marked skin when fitting (corner colour `skinw`, grown over the surface from the face's skin, limited to face, ears, neck and near the limbs, stopped by sudden colour changes) times a loose per-texel test that keeps eyes, brows and lines as painted. Do not go back to a mask picture: Meshy's picture islands overlap.

## Review in the game (required)

```
cd tests
node ../tools/meshy/game_shots.mts D:/WorkSpace/meshy/fitted/review faces finn,sol,clara,lumi
node ../tools/meshy/game_shots.mts D:/WorkSpace/meshy/fitted/review tones lumi
node ../tools/meshy/game_shots.mts D:/WorkSpace/meshy/fitted/review village mai,ba
```

Look at every picture: open and closed eyes front and three-quarter, every mood, brows, lids, cheeks, ears, neck, hairline, back of the hair, clothes edges, and the four tones. Also a daytime picture near and far. Send the sheets to the owner (SendUserFile) and wait for approval.

Then the checks: `node suite.mts --only faces,friendmodel,frienditems,friendoutfits,wearfit,newfriends,friendswap,friendmigrate,friendstab,villagermodels --jobs 1`.

## Lessons (each cost hours on 8 Nov)

- Compare a fix in the game, not in Blender.
- Before telling the owner something is done, look at the close-ups yourself, including the ones that look boring (back, neck, three-quarter closed eyes).
- PowerShell `String.Replace` on `fit_people.py` silently does nothing when the line ends differ (CRLF): use the Edit tool, and check "found True".
- `fit_person.ps1` must fail loudly (it checks the exit code and `EXCEPTION_`), or an old model gets installed without notice.
- (10 Nov) When a fix does not move the auditor's count, measure the parts in Blender (z range of each mesh) before trying again. Smoothing a shell moves its open edges: cuffs below the knee climbed 6 cm up the shin and the boot mouth sank 4 cm. Open edges of cuffs and boot mouths are held while smoothing.
- (10 Nov) Meshy's "feet" are its shoes, wider than the shin: a boot made from them must come up above their top edge (its mouth is raised straight across, never cut lower), or the feet show through the trouser cuffs as a band of skin.
- (10 Nov) Closed eyes: the painted eye's own triangles (lashes, iris) are not skin-marked, so the game's skin paint skipped them; the eye areas mark every non-hair triangle in them as skin, and reach the face's middle (the far eye's inner corner, three-quarters, lay between them).
- (10 Nov) The auditor's checks must ask what the player sees: a hole counts only where the friend drawn with nothing hidden would show something (not the valley between an arm and the side, or between the legs); a tear counts only where nothing (hair, a hand, the same or an outer garment) lies in front of it. Before loosening a check, look at its marked pixels at full size and say why each is false.
- (10 Nov) gltfpack stores positions as whole numbers (0 to 16383). Any shader test in model space (eye areas, waist, neck) must first apply the mesh's own dequantization matrix (`uDeq`, set at load from the mesh's matrix in the model): without it the shut-eye paint never ran, and the closed eyes only looked closed because the mood piece lay over them. Check such a feature with its cover hidden (`HIDE=face` in game_shots), not only with the cover on.
- (10 Nov) When a fix changes nothing in the pictures, find which layer it is first: `HIDE=<garment>` in game_shots, or `poses:<list>,pics` in the auditor for every case's layers.
- (10 Nov) Render one garment alone in Blender (workbench, flat colour per object, from the side, back and three-quarters) before tuning weights, thickness or depth order. Lumi's "shorts through the shirt" was a hole in each side of the shirt under the armpits: four rounds of other fixes changed nothing, and one picture showed it.
- (10 Nov) Body triangles within 9 cm of the arm's line count as arm. On the trunk under the armpits that left a hole that no shirt covered. Shirts now also take `ARMPIT` (swim kit, on the trunk's side of the arm's line, below the shoulders). A plain 4.5 cm rule instead pulled the arm's underside onto the shirt as jagged flaps.
- (10 Nov) Trousers and shorts above a top's hem are hidden while the top is worn (a garment cover bit). Use the hem where it actually is, in 36 directions round the trunk, plus 3 cm. With the hem's lowest point, Clara's rain coat, higher at the back, left a see-through gap.
- (10 Nov) Lumi's green irises are coloured like her hair: a dark triangle in an eye area is eye, even when it is hair-coloured or inside the hair region.
- (10 Nov) The eye check counted Lumi's white name label. Ignore the picture's top rows. Remember that WebGL's read buffer is upside down: the picture's top rows are the buffer's last rows.
- (10 Nov) The blink mood piece is drawn from the front. Where the face turns sideways it stretches, and a 1.7-wide eye oval reached Finn's cheeks as streaks before the ears. Use 1.3 wide, and only face triangles that face forward (normal.y < -.45).
- (10 Nov) Known false alarms, not to be "fixed" in the clothes:
  - "Holes" between the legs in run and walk side views: with nothing hidden, the body's stretched crotch webbing fills that space.
  - "Folds" of white trousers seen through the áo dài slits: same colour, hardly visible.
- (10 Nov) Editing a long one-line Python statement: a `#` comment inserted in the middle turns the rest of the line into comment. `isarm` lost three of its conditions this way, and rounds 61 and 62 were wrong. After any sed or Edit on such a line, print the whole line.
- (10 Nov) Logs of background runs: send everything to a file (`*> file.log`). A `ForEach-Object { $_.Substring(...) }` on PowerShell output fails on error records and fails the run.
- (10 Nov) Two layers that lie together, such as trouser cuffs inside boot mouths, need different depth biases. With both at .002 the cuff showed as a ragged edge over the boot. Boots are now .012 (`LAYER_BIAS` in `js/friend-model.ts`, and `BIAS` in `audit.mts` must match).
- (10 Nov) An auditor hole or tear whose sides lie far apart in depth (5 cm for holes, 3 cm for tears) is the gap between two parts: front and back leg, or panel and trousers. It is not a hole in a garment. This took the counts from 131 to 18 holes and from 117 to 8 tears.
- (10 Nov) The self-test's planted faults must really change the picture. `o.scale` does nothing to a skinned mesh, because attached bind mode undoes it; push vertices in the shader instead. Plant the fault on a friend whose outfit can show it: Sol, top over trousers, not Clara, whose skirt covers the waist. After every change to depth biases, run `audit_selftest.ps1` again: the old plant became invisible once tops drew 1.8 cm over trousers.
- Python for pictures: `D:\WorkSpace\meshy\tools\pyenv\Scripts\python.exe` (there is no `python` on the path).

## Friends: old head on a swim body, clothes made in code (8 Nov 2026)

One friend end to end: `GF_SKIP_REFIT=1 powershell -File tools/meshy/graft_friend.ps1 -Id <id>` (refits are slow; skip them once the fitted old head and swim body exist). `graft_head.py` puts the approved old head on the swim body, and `make_clothes.py` makes the garments (`lit-g-<part>`). Review with `game_shots.mts` `faces` (with the side views), `outfits` and `nape`, and crop the chins and collars at full size.

- Find what a stray piece belongs to before fixing it: render each part in a flat colour (body, old head, face, garment). Guessing cost a dozen rounds on the chins and collars.
- These children's shoulders rise above the neck cut. Below the cut, keep the old head only close round the neck, at most 4 cm down. At neck height the old hair spread wide (Sol's cape) and the old neck's front (Finn's V) lie over the new shirt.
- Long hair that hangs in front (Clara's braids): use the swim body's own braids below the cut (`GH_LONG_HAIR`). The old head's braids were shards with the old outfit's straps cut out. The braids are marked `own_hair`, and a garment never covers them. Grow the mark through coloured triangles only, never the kit's tinted shading.
- Garment rays near the collar must start on the neck's own axis. The trunk's middle lies in front of the neck, so a ray from it pointed backwards and threw the collar's front to the nape, which left the grey kit bare under the chin.
- Skirts: fit the waist ring without hair, widen each ring to the body at that height (the seat), but only for nearby points (never a hand beside the hip).
- Light model under 500 KB: Clara's needs `GH_TEX_MAX=300`. Reducing her garments further let leggings poke through skirts.
- Edit Python files with the Edit tool or Python, never PowerShell `Get-Content`/`Set-Content`: on Windows PowerShell 5.1 they garble Vietnamese text ("áo dài").

- Measure the neck by the faces close round its middle (`NRN`, about 2.5-5.6 cm). The cut ring's spread includes shoulders that rise past the cut (11-12 cm), and every rule scaled by it was three times too loose. That is why Sol's cape survived three rounds.
- The other way, with no graft: `powershell -File tools/meshy/dress_own.ps1 -Id <id>` dresses the swim model on its own Meshy head. Fitting already gave that head its own face moods; `CL_OWN_BRAIDS` marks front braids, and `tex_max.py` and `CL_BODY_REDUCE` keep the light model under 500 KB. Compare both ways side by side in the game before choosing (8 Nov: Clara better on her own head; Sol better grafted).

- 9 Nov 2026: the owner chose the own-head way (B) for all four friends. On an own head, closed eyes left a ghost of the open eye, and a black mark at the face's edge from the side, wherever the hair is as dark as the eye's outline (Finn's black, Lumi's darkest leaves) or the eye has a pale rim (Sol). `fit_people.py` now traces the eye's outline itself (very dark or pale-white pixels joined to the eye, out to its corners), and it always closes. Refit with `fit_person.ps1 -Id <id>-swim -Ref <ref> -Prefix <id>-` (2 min each), then run `dress_own.ps1`.

- Skin tones (9 Nov): test every model with `game_shots.mts tones`.
  - The body must carry `skinw` as its only colour layer. Meshy's own all-white `Color` used to be exported first, so the game read it, never saw the mark, and tinted hair with the face.
  - In the mark, red means skin. Green above blue means a bare arm, leg or neck triangle, which the game tints fully to the tone, keeping only the painted light and shade.
  - The face core is all skin except hair, and the game's own per-texel test keeps the eye whites and lines as painted.
  - Hair that is nearly the skin's colour (Clara's) is told apart by its hue and saturation, except below the brows, because her blush is her hair's red.
  - `ears_hidden` in a joints file keeps the hair beside the cheeks out of the skin. `auto_joints.py` preserves that key.
- Closed eyes on own heads: trace the eye's outline (very dark or pale-white pixels joined to the eye) and close a slightly wider area below the brows. Only bright, strongly coloured hair beside the eye stays hair. Dark lash flicks close even when they are hair-coloured (Lumi).

- Hair in the skin mark (owner 9 Nov, r57: "tại sao cái braid tóc bị hoài vậy"). The braid kept taking the skin tone because every skin rule is a place (face, neck, near the arms) plus a colour test, and hair lying in those places passed the test: Clara's hair is nearly her skin's colour, Finn's black hair is not "strongly coloured". `fit_people.py` now finds the hair as one piece and unmarks it last: grown over the surface from the top of the head (and from any loose head piece clearly of the hair's colour: Sol's curls at the temples are not joined to the top) through triangles nearer the hair's whole colour than the face skin's, down the braids too. Only the face between the eyes' outer edges below the brows, and everything below the eyes, is kept from it (Clara's blush is her hair's red). The face box's top is the brows, so a "below the brows" rule alone also protected the temples' hair.
- Look at the mark itself before a game round: render the `skinw` corner colour beside the colour from six angles (front, three-quarters, sides, back). White or yellow on any hair is a bug, whatever the game shots show on the default tone.
- `FIT_DEBUG=<file.npz>` makes `fit_people.py` save each triangle's colour, place and mark, to find why a triangle is (not) skin with numbers, not guesses.
- Order of work (owner 9 Nov: "chỉnh da trên meshy swimsuit trước"): first the skin on the bare swim body, every tone, front and back, whole child (`BARE=1 node game_shots.mts <dir> tones ...`: garments hidden; tones mode also shoots `<id>-tonefull-front|back-<n>`), and only then the clothes. The mark lives on the body, so every outfit shares it.
- Limbs in the skin mark: the joints lie on the body's middle plane (y 0), and the fronts of hands and legs stand 10-14 cm in front of it. The distance to a limb is measured as seen from the front (x, z). The feet below the ankle are a limb too.
- Hair over garments: a hair point (wholly hair: the remesh joins a braid to the body where they touch, and lifting a shared point pulled the kit out) at or inside a garment is lifted 4 mm above it. A body point just outside a garment sinks 3 mm under it. Garment triangle directions are turned to agree with the body under them first: a flipped one pushed Clara's kit out as grey patches.
- **After any change to `js/*.ts`, run `node tools/build.mts` before `game_shots.mts`**: the shots load the built `.js`, not the `.ts` (9 Nov: two rounds of shots ran without the change).
- Poses (owner 9 Nov: "khi di chuyển hay đưa tay lên xuống"): `game_shots.mts <dir> poses` shoots every friend in two outfits walking, running, cheering, waving, dancing, jumping, sitting and climbing, front and back. Rest-pose shots hid trousers coming out through tops and legs through skirts and the áo dài.
- Hidden under clothes (9 Nov): the body under a worn garment, and an inner garment under a worn outer one, are not drawn in the game. `make_clothes.py` writes which garments cover each point (one bit per garment, `COVER_BIT` for the body, `GCOVER_BIT` for garments) in the alpha of its corner colour; `js/friend-model.ts` discards a triangle whose three corners are all covered by worn garments. A point within 6 mm of a garment's open edge is never covered, so no gap opens at hems and cuffs. The same bit tables must match in both files.
- A sleeve cut plane across a hanging arm also crossed the trunk's side and opened slits beside the armpits at the back (the kit showed through): the cut applies only to faces whose nearest body triangle is the arm.
- Garment shade (make_clothes.py) is the body's brightness under it; the swim kit's painted folds gave hard dark blocks on light tops (Sol's yellow shirt). It is smoothed over the garment and kept between 0.8 and 1.08.
- Tried and failed on 9 Nov (do not repeat): (1) moving each face-piece grid point in front of the face over its whole cell, for Clara's inner-corner speck: the speck stayed and the pieces floated, light boxes on Sol's cheek from the side. The speck is not in the closed-eye picture (every eye-white texel is covered); look at the 3D surface there next. (2) pushing a garment out wherever a body point under it lies outside or within 3 mm: it folded garments into black holes (Sol's shirt) and speckled Clara's skirt. Push along a stable direction (the shell's ray from the bone), never along vertex normals of a just-pushed mesh. (3) keeping face pieces only where the face looks forward, for Sol's light cheek patch from the side: the pieces' edges then crossed the cheeks as hard squares (the pieces are a slightly different shade from the body under them). Finn's dark streaks before the ear did not change with any piece change: they are Meshy's own sideburn locks, real hair.

## Scaling up

When a method is proven on one person (owner-approved), the rest can be split across chats or accounts: one chat per group (e.g. friends, VN-north villagers, VN-central, VN-south, Australia, animals by skeleton type), each using this skill, the same tools and its own review sheets, never two chats writing the same files. Paid Meshy jobs stay on one account's journal per group; each group syncs its ledger.

## Animals (pets and companions) with Meshy (10 Nov 2026, dog pilot)

Plan and progress: `docs/meshy-pets-20261110/PLAN.md`. Meshy's auto-rig is humanoid only: animals get the game's own
creature skeleton (the bone names of `tools/blender/world-creatures.py`) and its clips.
- One command: `powershell -File tools/meshy/make_animal.ps1 -Kind puppy [-Quick]` (fit, pack, install in the working
  copy, `pet_shots.mts` close-ups, `audit_pets.mts`; exit 2 when the audit fails). Run a server of your own
  (`SV_URL=http://localhost:<port>/`), never the friends' auditor's.
- Tuning per animal: `tools/meshy/animal_joints/<kind>.json` (joints, leg/ear swing, sleep pose, eye and lid sizes).
- Lessons (each cost a round):
  - The glTF import splits Meshy's surface at every picture seam (6430 pieces on the puppy). Weights must be computed on
    points welded by place, or the seams open as torn strands when a leg turns far (the elbow fur in sleep).
  - `skeleton.pose()` on a gltfpack-quantized model gives whole-number units: keep the bones' loaded pose as the rest.
  - Pictures read from a render target are linear: turn them to sRGB (`game_shots.mts` still does not: its pictures are
    darker and more orange than the game).
  - A skinned piece needs `frustumCulled = false` outside `js/modelkit.ts`, or a lid at rest scale is culled.
  - Do not rely on the game's clock for shots on a busy machine: set each clip's time with your own mixer.
  - Shut and happy lids: a fine grid laid on the face over the whole painted eye (white and outline too, found by
    flood from the iris through texels unlike the fur), its own small picture seen straight on; copies of the head's
    own triangles showed the eye through cracks at their edges.
  - Sleep: a sphinx (front legs forward at the shoulder) looks right; sharing the turn with the elbow made it crouch.
    `ground()` lifts the body at every frame where anything would go under the ground.
  - The auditor's stretch marks were looked at one by one before its limit was set (neck when looking round, ankles,
    underside on the ground): see the header of `audit_pets.mts`.
  - (11 Nov) Anything an animal wears or holds goes on a bone, never on the whole animal: a pet's hat fixed to the pet
    stayed in the air when the head looked down, slept or rolled. Hats sit on the head bone, fitted to the skull
    (`hatFit`, `js/pets.ts`: the band round the head's own points at each hat's depth), put on again when the model
    arrives or changes near/far (`onModel`). The ball in the mouth rides the head bone at the jaw.
  - (11 Nov) A face piece set into the face (a round open mouth) looks right from the front and sticks out of the
    cheeks from below and the sides. Every face piece (lids, mouth) is laid on the surface with its own picture.
  - (11 Nov) Weights by region need limits on every side: the tail took every point behind its root, the whole rump,
    and the rump wagged with it. Each region is bounded (behind, above and within a width of the middle).
  - (11 Nov) Thick legs: the code shapes' swings are made for stick legs (`damp` makes them smaller); the animal's own
    moves (run, jump, sit, beg, roll, swim, dig) are written for its legs and checked for the ground every frame.
  - (11 Nov) A game task that moves a pet (lead the way, fetch, rescue) must also choose its move (`rig.want`): the rescue
    moved the puppy but left it walking in the water. And it must not go through the solid map.

### Checking an animal: what to look at before the owner sees it (owner, 10-11 Nov 2026: "kiểm tra cho hết")

The auditor first (`audit_pets.mts`, full, near and far), then pictures at full size (`pet_shots.mts`):
1. `close`: every clip from the front, three-quarters, side, back, above and the face.
2. `legs`: the legs and hips through every lively clip, six moments, from the side, behind and below.
3. `mouth`: the open mouth from the front, three-quarters and both sides, in every clip that opens it.
4. Every accessory in every clip (the auditor's hats; close-ups front, side, back and rolling over).
5. `follow`, `skills`, `scenes`: in the game with the child (near, far, night, the pet yard, the same kind elsewhere
   in the valley, water, two children), and the skill chips on phone, tablet and computer.
6. The game checks: `worldcreatures`, `petskills`, `companionhats`, `animalhomes`, `phone`.

Lessons about the checking itself (each hid a fault or showed a false one):
- A check that measured nothing has not passed: the hats' drawings load lazily, and on a busy machine the hat check ran
  before them and reported 0. Wait for what you measure, and fail a case that measured nothing.
- Be suspicious of a clean 0 and of a sudden jump: look at the pictures before believing either.
- Every check gets a planted fault in the self-test (`audit_pets.mts ... selftest`), and the plant must change the
  picture: a hole planted inside the body, or in an ear lying on the head, showed nothing.
- Measure in the thing's own frame: a hat's height from a world box grows when the hat tips over (false "head through").
  Distances to a surface are to its triangles, not its corners (Meshy's muzzle has 2 cm triangles).
- A flicker check changes only depth (the camera's near and far planes), never the camera's place: moving it 0.5 mm
  moved the picture by two texels and every edge "flickered".
- Before calling something a game bug, rule out the test: the village dog "never got its model" because a dialog had
  paused the game in the shot script. A fix made for it was taken out again.
- Look at the marks before setting or changing a limit, and write in the check's header what was seen and why.
- Long runs on a shared machine: own server (`SV_URL`), longer page timeouts, background runs with the result in a file;
  never two auditors on one server.
- A `#` or `//` comment inserted in the middle of a long one-line statement turns the rest of the line into comment
  (the shots' render call was lost this way): after such an edit, print the whole line.

### Lessons from the companions and the five pets (11-12 Nov 2026)
- Compare every animal with its reference sheet in the game's own group (`pet_shots.mts ... companion`, or
  `companion_film.mts` for moves): the bare-model `close` shots never show what the game adds (Sparkle's wings were
  missing and nobody saw it). Show the owner films of moves (hover, walk, run, tricks; near and far; HD and light).
- Paint a face piece magenta in a debug build (`LID_DEBUG=1`) to see what it covers in the game: the firefly's lid
  covered her whole head and rode the antennae, and small bumps in Meshy's mesh poked through it.
- Render the weights by colour before tuning numbers (`tools/meshy/weight_colours.py`): the kitty's tall tail tip was
  moved by the head (the head is "above the neck plane"; now bounded behind, `head_back`).
- Ears that stand up (kitty, bunny) need `ear_up` and their pivots at the roots; the hanging-ear rule took a kitty's
  wide cheeks as ears. Ears that lean back need the head to reach them (`head_back`), or they fall out of the head.
- A panda's black ears are bigger dark patches than its eyes: `eye_xmax`. A closed eye in a black patch: the eye is
  only the painted white and iris (`eye_grow` 0.5), the lid filled from the patch (`fill_near`), the line light.
- Lash specks next to a shut lid: `lash_dark` (the lash arc), `lash_spot` (small warm specks darker than the face round
  them), `fill_near` (fill from the face colour only), a fine lid grid on the light model too (`lid_grid_far`).
- Thin-legged animals: the puppy's jump and sphinx sleep stretch them (`jump_legs`, `lie_front`, `lie_front_knee`).
- Before a per-animal audit limit, look at the marks and write the reason in the json: a hanging bell, a gap between a
  leg and the belly, a hop gait in the air are not faults.
- A light model can be made here without credits (`tools/meshy/decimate.py`) when Meshy's 9k remesh is missing; do not
  go below the triangles the lids need (a 7k firefly broke her shut-eye line).
- Run the game checks with `SV_URL` set to your own server: without it the suite tests port 8765, another checkout.
- Write long queues in one shell (bash), and check every `-Out` path expands: a PowerShell queue started a second
  auditor on the same server, and a `$k` inside a quoted path was not expanded (three pets wrote into one folder).
  (13 Nov, again: in a bash double-quoted path a backslash written before `$k` escaped the dollar, so the folder was
  named with a literal `$k` and four pets wrote into one folder: build Windows paths with forward slashes,
  `"D:/WorkSpace/meshy/pets/$k-jump"`.)

### Owner's standing rule on legs (13 Nov 2026, said many times)
Feet and legs must never turn pointed ("nhọn") or drawn out in a run, a jump or any move. Before showing the owner any
pet, look at its feet yourself, frame by frame at full size, in the films of every run and jump, filmed on open flat
grass (farm plots and fences hid the feet). A clean audit does not prove this: the stretch check counts big triangles,
not a foot's shape.

### Lessons from the panda, calf and joey (13 Nov 2026)
- The weights by colour find what numbers do not: the panda's neck stretched (up to 1,127) because the back half of its
  big head was weighted to the body, so it stayed put when the head turned. The neck joint goes where the head meets the
  body (`joints.head`), and the neck's plane follows the animal's own neck line from chin to nape (`neck_tilt`; 0.55 is
  the puppy's, 0.31 the panda's). `neck_soft` alone never fixed it.
- `ear_amp` 0 must keep the ears still in the pets' own moves too (run, swim...), not only in the code shapes' moves: the
  panda's ear weights reach its cheeks, and the cheeks stretched when the ears swung. A big head on a short neck turns
  less in roll and scratch (`head_turn`).
- A tail that hangs down (the calf's) needs `tail_drop`: the tail rule took only points above its root, so the hanging
  tail stayed on the body.
- An animal that stands up (the joey): `upright` mode in `fit_animal.py`. Every joint is set by hand in its json, read
  from ortho renders with a 10 cm grid (0.002 m a pixel, so a pixel is a coordinate); arms by distance to the line from
  shoulder to paw (`paw0/1`, elbow = knee), hind legs below the hips each side of the middle (the long foot below the
  hock), the tail behind and below its root and its tip along the ground; its own moves (`upright_moves`: hop, sit back
  on the tail, beg with paws up, scratch the ear with a paw). If the body is not in the middle of the box (the joey's tail
  curls to one side), `shift` the model, or every left/right rule is off by the difference.
- A model's size follows its points, not its triangles: Meshy's calf had 68k points for 31k triangles (many picture
  seams), so its near model was 978 KB; `jpeg` 70 did nothing (the picture is about 170 KB). A 24k copy made here with
  `decimate.py` (no credits) gave 763 KB; pass it as `make_animal.ps1 -Near`.
- A wider or higher shut lid (`lid_wide`, `lid_up`) is filled with the colour round the eye: on the calf it painted
  brown strips into the white blaze. For a 2-3 px painted lash flick beside the lid, look and allow it with a reason.
- Where an upright paw's fingertips hang below the paw point given for the arm, they stay with the body and are drawn
  into long claws when the arm rises: put the paw point at the fingertips.
- Do not run Blender beside the auditor on this machine: the game page then took over 90 s to open and the audit died.
  One heavy job at a time.
- Keep each file's line endings: Python on Windows writes CRLF in text mode (use `newline=''`), and Git Bash's `sed -i`
  dropped the CRs of the CRLF json files (the whole file then shows as changed).

### Each animal's own skills
Every pet has special skills of its own (owner, 10 Nov 2026), in `PET_SKILLS` (`js/pets.ts`), each with a chip under the
name card (at the right edge on a phone) and a case in `tests/pet-skills.mts`. The puppy: fetch, dig for treasure, lead
the way. The agreed proposals for the others: `docs/meshy-pets-20261110/PLAN.md`.
