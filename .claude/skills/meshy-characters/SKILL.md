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

## Scaling up

When a method is proven on one person (owner-approved), the rest can be split across chats or accounts: one chat per group (e.g. friends, VN-north villagers, VN-central, VN-south, Australia, animals by skeleton type), each using this skill, the same tools and its own review sheets, never two chats writing the same files. Paid Meshy jobs stay on one account's journal per group; each group syncs its ledger.
