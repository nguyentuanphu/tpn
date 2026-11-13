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
- (10 Nov, round 69-70) **The auditor counts what the player sees.** A fold (inside of a garment) or a poke counts only where the game picture differs from the covering garment's colour round it (median of the first pixel of that garment in 8 directions within 14 px, tolerance .09; none near: the garment's colour over the whole picture, .13). The game draws a garment's inside in its own colour and light, so most "folds" were invisible: 108 fold cases went to 9. Look at the `-look` pictures (`poses:<list>,pics`) at full size before and after such a change, and run `audit_selftest.ps1`: the plants must still be caught.
- (10 Nov) Skin-tone and hair-tone checks skip pixels the valley hides (a falling leaf in front of Sol's arm counted as 1129 px of untinted skin): the picture is read again with the friend taken out, and a pixel that is the same both ways is hidden.
- (10 Nov) Each case's `pokeBy` in `cases.json` says which layer shows through which garment (`bodice>skirt`, `skin>trousers`, `trousers>aodai-panels`). Read it before guessing which garment to change.
- (10 Nov) Skirt bones: turning the front about a hinge in front of the hips put the cloth below a sitting child's thighs. The front bone is carried round the hip joints' own axis, by the angle of the model's own thigh (hip to knee, measured in the rig: the code leg's angle misses the hips' tilt), times .8 so the flared hem lies on the knees. The back keeps its hinge: about the hip axis a back swung by the walking leg pushed its top into the top. The middle of a skirt's front, with no thigh under it, is half carried by the trunk, so it sags between the knees instead of standing up as an arch.
- (10 Nov) A top always worn under a skirt (the bodice) ends 4 cm under the skirt's top and does not follow the thighs; skirts draw over tops by .034 (`LAYER_BIAS`, and `BIAS` in `audit.mts`).
- (10 Nov) The áo dài's back panel below the knee follows the shin kicked furthest back (thigh plus knee angle, .85), or the heel comes through its hem when running.
- (10 Nov) The audit runs one process per friend side by side (`make_character.ps1`, merged with `audit.mts <out> merge`): about a quarter of the time. Do not start other browser checks at the same time: the shared page server (port 8765) then times out (`page.goto: Timeout`). From Git Bash, pass Windows paths to PowerShell inside `powershell -Command "& { ... 'D:\...' }"`: plain `D:\\WorkSpace\\...` lost its backslashes and the round went to `tests\WorkSpacemeshy...`.
- Python for pictures: `D:\WorkSpace\meshy\tools\pyenv\Scripts\python.exe` (there is no `python` on the path).

## Villagers (the 11 named: ba, bom, bong, jack, lan, mai, mit, ruby, su, teo, ti; 10 Nov 2026)

Whole Meshy models (clothes are part of the model, painted on; no code clothes, no shop), on their own painted face with mood pieces, one model seen near and far, **under 500 KB**.
- One command: `powershell -File tools/meshy/make_character.ps1 -Batch ba,bom,... -Kind villager [-SkipFit] -Jobs 2` (fit, install `models/villager-<id>.glb`, build, audit with `audit_villager.mts`). `-Jobs` caps the browsers running at once; set `SV_URL=http://127.0.0.1:<port>/` to use a page server of your own.
- Fit alone: `powershell -File tools/meshy/fit_person.ps1 -Id <id> -Villager`. The reference is found by itself: `work-v108\villager-<id>-<role>-hd.glb` (`game`, `elder` for Ba, `adult` for Mai), never `<id>-game-hd.glb`.
- The size budget: the 30k remesh at 1024 px was 1150 KB (shapes 580 KB, picture 260, face atlas 310). Now: Meshy's own 9k remesh (`<id>-9000.glb`, never our own decimation), 1024 px colour at JPEG 70, a 192 px face tile (`FIT_TILE`), a 26-point mood grid (`FIT_GN`: nine 44-grids had more points than the 9k body). Over 490 KB, `fit_person.ps1` fits again with JPEG 60, then a 160 px tile, then an 896 px picture at JPEG 70 (Mit needed the last: 499 KB). Sizes on 10 Nov: 457 to 499 KB.
- **`audit.mts` is for the friends and their clothes only** (it loads `models/<id>.glb` with four outfits). Villagers use `tools/meshy/audit_villager.mts`: the villager worn in the valley (as `js/main.ts` does), the same closed-eye white rule (blink, happy; front, three-quarters, sides), the file size, and pose pictures (idle, walk, wave, cheer, sit; front and back) for the sheets.
- In-game review: `game_shots.mts <dir> village <ids>` now shoots every mood front and three-quarter, smile/blink/look from both sides, the back from three sides and the whole villager front, three-quarter and back. Sheet: `review_sheets.py village <dir> <ids> <out.jpg>`.
- (10 Nov) **A friend-only change can break every villager.** `dress()` in `js/friend-model.ts` returns `{ bits: 0 }` with no `cov` for a model without garments, and the garment-colour loop read `dressed.cov[k]` and threw inside `wearVillagerModel`. The villager stayed `_vm = 'loading'` for ever and the game showed the old code person, with no error on screen. Owner, 10 Nov: guard it (`dressed.cov &&`), and remember that a Meshy villager has its clothes fused to the body. When a villager is not worn, call `A.wearVillagerModel(n.A, 'villager-<id>')` in the page inside try/catch to see the real error.
- (10 Nov, owner: "You are looking at the wrong villagers, they should be the chatgpt villagers") **A villager standing still shows the far "still" copy, which is the old code person** (`stillOf` bakes it from the code parts; `js/main.ts` calls `showStill` when the villager is calm and no child is near). The first villager audit, paused, audited that copy: a red-capped Jack instead of the ChatGPT Jack in the royal blue bucket hat. Before every review picture call `A.showStill(av, false)`, and check the picture against `docs/meshy-production-20261107/reference-images/<nn>-<id>/front.png` (the ChatGPT sheet) before trusting any count. `audit_villager.mts` also fails a villager when any code part is drawn.
- (10 Nov) Villagers stand by houses, trees and stalls: from the child's side these hid the face, and a hidden face passes the eye check. The villager shots and the auditor hide everything but the lights and the villager's own branch.
- (10 Nov) A new worktree has no `tests/node_modules`: link it to another worktree's (`New-Item -ItemType Junction`). Python's `http.server` reset connections when the game loaded its many files; a small Node static server works. On a busy machine (other chats' audits at 100% CPU) the page took 3-4 min to open, so `audit_villager.mts` and `game_shots.mts` raise Playwright's limits to 3 min and the auditor tries the page three times.

## Regional villagers (pilot of 6 in a Linux cloud session, 10 Nov 2026)

Record: `docs/meshy-regional-40-100/PILOT-1.md`. Ids `r<nnn>` (sheet number), job specifications in
`docs/meshy-regional-40-100/job-specifications/`, paid steps one at a time with `tools/meshy/regional_pilot.py` (270-credit cap).
- The tools run on Linux: `SV_MESHY_ROOT`, `SV_BLENDER`, `SV_NPX`, `SV_PY` (defaults are the owner's PC paths); `pwsh` runs the
  `.ps1` tools; paths are joined with `Join-Path` (a `\` path reaches Blender as a literal backslash on Linux). Blender's renders
  need `libegl1`. Playwright under `tests/` needs its own Chromium (`npx playwright install chromium`).
- GitHub refuses releases from a cloud session (403). The owner chose: the journal and raw files are sent in the chat after each
  paid step; nothing raw is committed.
- `lumi.py villager role=<role>` names its file by the role's size: `villager-<role>-game-hd.glb` for children,
  `-adult-hd` and `-elder-hd` for grown-ups. Pass `-Ref` to `fit_person.ps1` with that exact name.
- A regional person is no NPC: `audit_villager.mts` and `game_shots.mts village` take `<id>@<role>` and put the model on a crowd
  person the game would give that role (`crowdRole`); the crowd's looks are random per load, so when no one has that role the
  next best is the same age. A crowd host may be sitting on a bench and turns its rig, not its root: stand it up
  (`A.animate(av, 'idle', 1)`, valley paused) and read the facing from `av.rig`. The first r045 shots were a seated girl, and
  "front" was a three-quarter view.
- **`game_shots.mts` pictures were linear, not what the screen shows.** A three.js render target is linear unless
  `rt.texture.colorSpace = SRGBColorSpace`; the game's screen is sRGB. Every earlier sheet was darker and redder than the game
  (pink jacket brown-red, skin orange). Fixed in `grab` (`LINEAR=1` gives the old pictures). The auditors still read linear
  pixels; their limits were set on those.
- **The skin mark's limb flag (green above blue) paints texels in the skin's colour, also with no tone.** On r045 the pink
  sleeves and shoulders near the arms came out beige. A villager is never toned, so regional villagers are fitted with
  `fit_person.ps1 -NoLimbTint` (`FIT_NO_LIMB_TINT` in `fit_people.py`: no limb flag; the face mark and closed-eye rules stay).
  Before trusting a villager's colours, compare the full views with the ChatGPT front at full size.
- A crowd host turns its head to look at the child: head shots and the eye audit face the model's own face (head bone to the
  middle of the `face-smile` piece), the whole-body shots its shoulders (`armL` to `armR`). Before this, "front" rows were
  three-quarter views and the eye audit looked from the wrong sides.
- Dark or strongly coloured skin (r084, saturation .58; r074's flushed cheeks): at `SKIN_SMAX` .44 none of it was skin in the
  face picture, the lids and the mouth pieces were filled with the pale reference colour, and showed as light squares and
  patches. `fit_person.ps1 -SkinSMax .65` fixes it (the eye growth below still uses the strict .44: r074's orange-brown irises
  passed as skin at .65).
- Big irises with white only at the corners (r057's hazel eyes): the eye box held only the whites, and the closed lids left the
  irises showing. `fit_person.ps1 -EyeDark` grows the box from the whites through what is not skin next to them. Use it only
  where the irises show through: on r064 it made the side view worse (108 against 32 eye-white pixels), so r064 keeps the fit
  without it. Look at each person's closed eyes front and from both sides after the change.
- (10 Nov) A `#` comment inserted in the middle of a one-line Python statement again swallowed the rest of the line
  (`; _g = ...`), and a fit failed with a NameError. After every scripted edit of `fit_people.py`, print the edited line.
- **Closed eyes ("hốc mắt chưa đẹp", owner 10 Nov).** The lid area (`lid()` in `fit_people.py`) took in the whole socket, a wide
  oval reaching below the eye, and filled it with the light skin round it: every blink showed a flat pale disc with the blush
  and the shading under the eye wiped out. It is in the picture data itself, not the game's drawing: render the fitted
  `.blend` from the front with each picture as pure emission (no light), body alone and body with the `face-blink` piece, and
  compare. `fit_person.ps1 -LidMatch` replaces only the painted eye (dark, white-grey or far from the skin's colour, and never
  what is still skin, blush included), a tenth of the eye's width wider for its rim; the fill flows in from the socket's own
  skin. Tried and not the cause (no change): smooth instead of flat piece normals (`-SmoothPieces`), a 2048 px body picture,
  no mipmaps, unlit materials; matching the fill's brightness to the skin inside the wide oval (the fill already matched it).
  A hole cut off straight at the eye's lowest row left a hard line; a mask that counted blush as eye left another.
- Fits on 4 CPU cores take about 9 min per pass (up to 4 passes for the 500 KB budget); two run side by side.
- **Eyes, nose and mouth (owner 11 Nov 2026: "Đã làm rất nhiều rồi sao vẫn còn nhiều lỗi vậy, các skill đâu dao không kiểm
  tra? Tất cả con mắt, mũi và miệng của các nhân vật đều có vấn đề").** A round passed the auditor and was sent with a second
  mouth on every "o", excited and sad face, soft eyes, smudged noses and streaked looking eyes. Causes and fixes (all in
  `fit_person.ps1`, regional villagers fit with `-NoLimbTint -LidMatch -FaceUV 2 -PieceSnap .001 -MouthFind -LookSolid -VTile 256`):
  - *Two mouths.* The mood mouth erased the painted one through `lid()`, the eye's closing, and `-LidMatch` keeps whatever is
    near the skin's colour: pink lips are, so the smile stayed under the new mouth. The mouth box was also a fixed band of the
    face picture (.62 to .97 of its height): r057's mouth lies at .56 (his helmet strap was taken) and r084's darker skin made
    the whole lower face "mouth". `-MouthFind`: the mouth is the darkest wide flat patch below the eyes, between the pupils,
    against the skin right there (a fainter step when none is found), erased on its own (`erase_mouth`).
  - *Pieces floating off the face.* The mood grid was smoothed and only kept from going behind the face, never from floating
    in front: over hollows (the mouth, the eye sockets) it stood up to a centimetre off, and from three-quarters the "o" sat on
    the chin and the far eye showed past the nose. `-PieceSnap .001`: at most 1 mm (+3) in front. The closed-eye count fell
    from 27-66 to 0 on r050 and r084 with this alone.
  - *Soft eyes, smudged nose.* `keep_meshy_uvs` keeps Meshy's layout, where the face is a few percent of the picture, cut into
    330-580 small islands; the 500 KB budget halves the 2048 picture to 1024, so the eyes were 35 px wide (Meshy's own: 75).
    Repacking Meshy's islands, or shelving the face's, wasted the gaps (1.12-1.16 times). `-FaceUV 2`: Meshy's layout is
    squeezed to .7 of the height and the face's front (what a camera in front sees) becomes one island projected from the front
    in the strip along the top, baked from the untouched model. Measure it: look at `mid/colour.jpg` (the face is the island at
    the top) and the `FIT face front` line (`FIT_LOG=<file>` keeps Blender's output; `fit_person.ps1` dropped it).
  - *Streaked looking eyes.* The look pieces drew only the changed pixels with soft edges, so the painted iris showed through
    as rings; the slide also moved only the white and the iris core, so the iris's outer ring stayed behind, and a big iris
    that touches both lids was cut in half by white bands; r057's found eye box missed the inner third of his eye. `-LookSolid`
    draws the eye afresh: the eye is what inside a wider box is not skin, joined to its whites, holes filled, less its rim;
    the old iris (as tall as the eye) turns eye white and is laid on again to the side; the piece covers it solidly. Test it
    without a fit: copy `shift_iris` and `skin_mask` out of `fit_people.py` and run them on `mid/face-bake.png` with the eye
    boxes of the `FIT eyes` line (a 20-minute fit per try is too slow). The 11 named villagers have the same fault.
  - *Judged at the wrong size (owner 11 Nov 2026, second refusal: "Mắt và miệng, nặng nhất là mắt, không soi kỹ hay sao mà
    đã hỏi?").* The round was sent after looking at 480 px shots and 240 px sheet cells, where a face is about 150 px: every
    fault below was invisible there and plain at 1024 px. Closed lids were flat discs with a ring (the painted eye's pale
    outline) and a straight edge where the eye piece's oval (1.3 wide) cut the fill: `-LidSoft` ends the lid in a band of
    blurred skin and widens the oval to 1.6. Looking eyes spilled white past the outline onto the skin (the shaded skin under
    the eye was not "skin"): `-LookSolid` now takes the opening as the convex hull of the whites and the iris core, so nothing
    outside the painted eye changes. **Before any report, shoot the faces at 1024 px**
    (`SHOT_SIZE=1024 SHOT_DIST=.45 SHOT_UP=.06 node ../tools/meshy/game_shots.mts <out> village <list>`) and look at every mood
    of every person at that size, eye by eye. **Try a face fix in seconds, not a 20-minute fit:**
    `tools/meshy/face_moods_preview.py` runs the mood code on the face picture a fit saved with `FIT_SAVE_F` and composites
    every piece (with `ALPHA=<mood>`: the piece's alpha, its change and the masks, where cut edges show at once).
  - *Clean in the picture, broken in the game (12 Nov 2026).* The preview (`face_moods_preview.py`) was clean while the game
    showed lash arcs over r045's shut eyes and lash flicks at r074's corners: the mood pieces are a grid of 1.3 cm cells,
    snapped 1 mm in front of the face at their corners only, so between corners they cut under the bulge of the lid and the
    brow, and the painted eye showed through. Each grid point is now placed by the highest face at it, a quarter cell to
    either side and half a cell up and up to either side, with `-PieceSnap .001` (tried and dropped: the eight half-cell
    points, and 3 mm, made the piece stand off so the painted eye showed past it from the side, r050's profile 34 px;
    up and down only left lash bits over r045's shut eyes). Judge it with the audit's side views and the front close-up. Also: looking eyes were empty in the game for a whole round (a sign
    error in the eye's hull) and no check said so: `audit_villager.mts` now has `lookstill`. Lesson: a fix is judged in the
    game at 1024 px, the preview only says the picture is right.
  - *Hair round a shut eye (owner 12 Nov 2026: "Sửa lại 3 lỗi và kiểm tra lại mắt và mí của r45").* The lid's hole took
    in hair inside the eye's box (r064's fringe block, r045's strands up to the brow) and cut it square, on the half and
    sad lids too. A painted face's hair colour cannot be trusted (r045's was read from her pink hat), so `-LidSoft` sorts
    the dark patches round each eye instead: big ones, or ones reaching the window's edge, lying mostly off the eye's oval
    are hair and only their part along the eye white (the lashes) closes; small ones touching the eye are lash flicks and
    close; a strand that does not touch the eye stays. Debug it with the lid's hole drawn over the face picture (green
    mask before and after the rules) rather than with game shots. A half lid over a high iris left bare white: the white
    under a half lid now takes the lid's shadow (moving the lid line only shut the eye).
  - *Owner's review gate (12 Nov 2026 evening: "chỉ đưa bản tốt nhất").* No approval question until the auditor is clean
    and not worse, the `SHOT_GATE=1` picture set at 1024 px (every mood at -.7, -.4, 0, .4, .7, both sides, from above and
    below; neck, back, whole body) has been looked at picture by picture, a second reviewer (a subagent given only the
    pictures and a checklist) has listed faults and each is fixed or explained, and every fault the owner ever circled is
    checked again. `game_shots.mts` with `SHOT_GATE=1` returns about 130 pictures of 1024 px per person: run it one person
    at a time (all six at once overflowed Node's string limit, `ERR_STRING_TOO_LONG`).
  - *A fleck that stays put in every view is 3D, not paint (13 Nov 2026).* r045's dark lens over the shut right eye was
    "fixed" twice in the picture (751e6d0a4) and never moved: the preview was clean. Measured in Blender (each body vertex
    against the blink piece, rays from the front): a hair tip lay on the lid 6-7 mm in front of the piece, between the
    grid's snap rays. `-PieceSink` moves every body point that lies in front of a mood piece, where that piece is not
    see-through, 2 mm behind it. When a fault looks the same from every angle, measure depths before touching the picture.
  - *Mid-brown hair round a shut eye (13 Nov 2026).* The lid's hair rules sort only dark patches (V < .4): a lock whose
    body is mid-brown kept its dark outline and lost its body, and came out as a dotted outline past r045's brow.
    `-LidHair`: above the eye's top, what is not skin, away from the eye white and joined to the kept hair (or running out
    of the window) stays as painted; an upper lash's top edge, alone, still closes (r050's and r064's flecks when the join
    test was missing). It also draws strong changes inside the eye box solid: the soft hair guard (`NOHAIR`) made the
    piece see-through at the box's edge and the erased iris rim showed as grey ticks at r045's and r057's inner corners.
  - *Mouth piece edges (13 Nov 2026).* The "o" and sad pieces hugged the erased smile; the game cuts at alpha .5, and the
    cut fell on the smile's soft blur (sharper in the body's picture than in the face tile): a thin pale line along r050's
    old smile corner. `-MouthSoft` lets the mouth pieces reach a few px further.
  - *The light disc round a shut eye (13 Nov 2026, r050, r057, r064 at three-quarters).* Measured on r050's preview: the
    fill was exactly her painted skin (254,199,146) while the blush under the eye is (255,182,132). Round the hole,
    whatever `skin_mask` does not call skin (lashes, brows, hair, but also blush and the socket's shade) was held at the
    painted skin, and the fill settled to it. `-LidLocal` (shut eyes only: under a half lid the iris bled up as a brown
    smudge) keeps light warm colour round the hole as it is and runs the smoothing about 3 times the hole's size squared
    (700 passes reach only about 25 px). Tried first and no change: `-SmoothPieces` (piece normals), holding at the rim's
    median. Read the numbers in the preview before guessing at lights.
  - *The open eye beside every shut lid at three-quarters (13 Nov 2026, all six regional villagers).* The game's shut-eye
    paint (`js/friend-model.ts`, eye areas `eye_boxes`) lived only in the code-clothes branch, and a villager's positions
    were never dequantized (`deq` was set only with `cover`): for villagers it never ran. Shot with `HIDE=face` (pieces
    hidden) a shut villager still had open eyes. Now a model with eye areas and no code clothes gets it too, painting only
    eye whites (very light, unsaturated) and strongly coloured irises, judged near screen colour (`sqrt` of the linear
    texel: in linear colour rosy skin is .74 saturated and was painted as "iris", flattening the blush), inside the eye
    areas less their top quarter and outer fifth. Tried and dropped: the friends' "not skin" test (painted blush and
    freckles flat, a hard band at three-quarters), dark texels (r084's curly hair and brows turned skin-coloured), scaling
    a dark texel up to the skin (coloured noise: the output is mixed to the skin colour outright, diffuse and emissive).
  - *The colour test was not enough: each eye's own oval (13 Nov 2026, second reviewers, all six).* A debug colouring
    (a temporary line in the shader: inside the eye areas magenta, painted texels green; shot with `HIDE=face`) showed the
    colour test caught only the whites: the iris, the lashes and the pale rim round the eye stayed, and showed past the lid
    piece from the side, above, below and on the far eye. The fit now also writes `eye_ovals` (each eye out to its lashes,
    `grow()`-sized: .14 of its width each side, .22 of its height above, .28 below, in model space) and `eye_skin` (the
    face picture's skin in a ring right round the eyes, sRGB); while shut, every skin-marked texel inside an oval takes that
    skin outright (soft edge .85-1), lit as if facing the head's forward (`vEyeN_` from the skin matrix: the eyeball's dome
    was lit lighter above and below and darker at the side, a ring). Three things made the paint a lighter ring until
    found: the flat skin `uTint * uPaint` is not the skin by the eyes; the eye's texels are not skin-weighted, so `k_` is 1
    there, not the tone (paint `uEyeSkin * uTint`); and the baked material's dark colour (`diffuse`, #262524) multiplies
    every texel's diffuse, so the paint must be `diffuse * skin`, not the skin alone. Older models get the ovals without a
    refit with `tools/meshy/patch_eye_ovals.py` (the eyes found again on `F.png`, written into the glb's material extras).
  - *Two lash lines on the sad face (13 Nov 2026, r064, r050).* The sad lid is the box's top .18 (a part lid); a thick upper
    lash above the box stayed above the drooped lid. `-SadTall` takes the box a quarter higher and keeps the lid's edge where
    it was. Only where the double line shows: on r045 and r084 it hooked the lid's ends (looked angry).
    The other way round on r074 and r084 (and r057, lighter): their own lash sat lower than the box's top .18, so the drawn
    lid floated above it and closed nothing, two lines like a frown. `-SadBot .42` brings the lid that far down the box:
    one drooped lid (previewed before the refit).
  - *A villager's eye triangles were never marked skin (13 Nov 2026, gate j).* The game paints only skin-marked texels
    (`vColor.r`), and the fit marked an eye area's triangles skin only for the friends (`'swim' in ID`): a villager's far
    eye kept its iris and lashes past the nose while shut, whatever the shader did. `-EyeSkin` marks the triangles inside
    each eye's oval (not hair-like, the face side). On that path `_ear_y` was undefined for villagers (all six fits
    failed once): the head skin's middle depth stands in.
  - *Half and sad lids, and how far the paint reaches (14 Nov 2026, gates k and l).* The shut-eye paint ran only for
    blink and happy, so from above the half and sad faces showed the old upper lash and the far iris over their lids: the
    game paints a villager's oval above each lid's own depth too (`uLid`, a villager-only uniform: the friends' paint keys
    on `uShut > .5` and must not change; depths `lid_half`, `lid_sad` from the fit). Widening the oval (.24 / .28 / .32)
    took the socket's pale outline, but then painted the brow's mid-tone edges and the shaded socket skin: above each
    eye's box only grey is painted, and texels within .12-.2 of the skin round the eyes stay.
  - *Shut pieces over the hair's edge (14 Nov 2026, r045).* With the pieces hidden (`HIDE=face`) her hair was intact, so
    the skin over her hairline and the dashed brow from the side were the blink piece: opaque up to the brows (the soft
    lid band's small changes). `-LidClip` keeps the shut pieces to an oval round each eye (the eye's box 1.3 wide, 1.2
    tall); the game's paint covers the rest. In the preview the outer lash corner then shows (it draws the plain face
    picture under the piece): judge it in the game.
  - *3D folds in front of an eye (13 Nov 2026).* r084's skin wedge across an iris and r045's shards over the upper lids
    were not in `F.png`: Meshy's lid folded in front of the eye. `-EyeDespike` moves a body point in an eye's area that sits
    2.5 to 30 mm in front of its neighbours' middle depth back to it. Without the 30 mm cap r064's lock of hair, 12 cm in
    front of her eye, was pulled onto the face: not used on r064 and r050 (no folds there).
  - *r074's blush under a shut eye (13 Nov 2026).* `-EyeDark` grows the eye box through what is not skin, and her flushed
    cheeks are not: the lid hole took them. With `-LidLocal`, warm colour below the eye white's lowest row is no part of
    the hole. Removing warm colour round the eye itself instead left the iris and the socket's shade as smudges.
  - *The villager auditor's `lid` and `mshape` (13 Nov 2026, from audit.mts).* Ported as they were, they failed on things
    that are not faults: earrings, the white patch at r064's ear and r045's hat lay under the face grid and passed as eye
    whites (only whites the shut eye covers count now); the friends' lips box (nose tip to chin) took grown-ups' pink
    noses, blush and the hair by the chin, and cut big "o" mouths in half, and at three-quarters the mouth is not half
    way between the eyes (the box is now the smile's own lips, a little wider, within the face grid, and only pixels the
    mood changes count). The crowd host wearing the model is random per load, so counts move between runs: look at the
    pictures of every failing case.
  - *Thin grey and white lines round the ears and on the neck (13 Nov 2026, left).* Not in Meshy's own model at the same
    view; not the bake's ray length either (`FIT_BAKE_EXT=.0005 FIT_BAKE_DIST=.0015` gave the same picture as .002/.006).
    Likely the 2048 px picture squeezed into 1024 at .7 of the height (island edges). The white patch at r064's ear and the
    straight edge of her hair under it are Meshy's own (render the raw `-9000.glb` from the same side to tell).
  - *Mouth fixes that only worked on the test pair.* After the fixes passed on r050 and r084, the run of all six failed
    `oldmouth` on three: r057's collar edge against the black round the face was darker than his lips (patches touching
    the black are skipped now), and r045's and r074's pink lips passed as hair (nearer the hair's colour mix than the skin's),
    so the mouth piece was see-through inside and only its rim showed (the found mouth is never hair now). Lesson: test a
    fix on every person it is meant for, and read the piece's alpha (composite the atlas tile on green), not only its colours.
  - *Why the auditor passed it.* Its mouth check only measured how far the "o" lies below the eyes. `audit_villager.mts` now has
    `oldmouth`: front and both three-quarters, pixels round the "o"/sad mouth (on the face, not its outline) as dark as a mouth
    line that did not change from the smile face. It failed this morning's models (138-659) before any fix.
  - Before sending a round: look at one mood picture of each person at full size (not only the sheet), front and
    three-quarter, against the ChatGPT front, and ask "is there anything here a child would see as wrong?" The sheet's small
    tiles hid the second mouth from the reviewing chat; the owner saw it at once.

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
