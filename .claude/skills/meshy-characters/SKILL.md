---
name: meshy-characters
description: Make Sparkle Valley people (friends, villagers, regional villagers) from ChatGPT reference sheets with Meshy, fit them into the game, and check them in the game before they go on a branch. Use for any Meshy model, fitting, face mood, skin tone or in-game review work.
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
