# The shared face kit (branch `meshy-facekit`), hand-over

Owner, 15 Nov 2026 AEDT: one shared fix for shut eyes on every model, instead of four streams each patching the same faults. Built by Release. **Not approved; no model on this branch is for the owner yet.**

## Root cause (all four person streams)

- The mood pieces (`face-<mood>`, one 3 x 3 picture, `tools/meshy/fit_people.py` ORDER) are cut from the front picture F. F is ray-cast from Meshy's original picture, and it is paler and softer than the body's own baked texture.
- Under a shut piece, the game painted the body's eye area one flat skin colour (`js/friend-model.ts`, the `uShut` lines). With the face pieces hidden, that is a flat oval with a pale rim, and it shows wherever the piece fades. This is the cause of:
  - Sol's and Finn's light patches with hard edges;
  - Lumi's ring;
  - Clara's crescents.

## What the kit does (behind `FIT_FACEKIT=1` and the face box; older models are drawn as before)

1. **Fit:** `face_box` (x0 x1 z0 z1 of the front picture) is written on the body materials next to `eye_boxes`. The game copies it (`t.userData.face_box`).
2. **Game:** while shut (blink, happy, excited, and half on a model with the face box), every forward-facing body texel the piece covers takes the shut piece's own colour from the right tile of the shared picture (`uShutMap`, `uShutTile`, `uFBox`). The old flat paint is off when `uShutOn`.
3. **Fit:** `tools/meshy/facekit/shut_lid.py body_offset` adds the broad colour difference between the body's texture (cast from the front, `G_`) and F to every mood piece, so the pieces are no paler than the body under them.
4. **Fit (optional):** `grain` adds the skin's fine grain to the filled lid (tiles of high-pass skin). Turn it off with `FIT_NOGRAIN=1`. **On Sol it made specks that the patch check counts. Leave it off until the tiles are smaller and blended.**
5. **The smile tile** is kept whole under `FIT_FACEKIT`. It was used by the ratio and difference trials (see below). It does no harm, but the picture is larger.

## Tried and dropped (in the code's comments)

- Body under the piece limited to the eye boxes: the box's lower edge showed as a straight light line across the cheeks.
- Body texel times (shut / smile), and body texel plus (shut - smile), with the piece hidden: the open eye stayed as a ghost outline. F and the body texture never line up to the pixel, and the dark pupil (darker in the body texture than in F) stayed dark under a ratio.

## Auditor (`tools/meshy/audit.mts`)

- `kitviews` (in the quick argument, e.g. `poses:face,pics,kitviews`) adds the views ±.4, from above (`up`) and from below (`down`).
- `vlid`, limit 6: from three-quarters and the side (|turn| .7 or more; in the plant round no eye zone is found at 1.2), a dark group in the eye zone that is upright, thin, with both outer thirds steep (> 1.2) and of opposite sign, is a V; an upright stroke at most 4 px wide and 6 px tall is a tick. Self-test (face plants eyes, face, mouth, lid, stray, patch, vlid on Sol): all caught. The first version (upright groups) marked the lash crescents seen from the side and from above. The self-test plant `vlid` is a dark upright stroke on the blink at ±1.2.
- **Note:** `heavy.ps1` takes PowerShell's common parameters, so `-Out` there is ambiguous. Pass a script with `-Out` through `powershell -Command "& script.ps1 -Out '...' -Only 'a,b'"`, with lists quoted. Unquoted, `-Only a,b` became an array, every plant was skipped, and the self-test said PASSED without having run anything.

## Sol: before and after (`poses:face,pics,kitviews`, worst px over all shut moods)

| | patch front | patch ±.4/.7 | patch ±1.2 | lid | stray front | vlid |
|---|---|---|---|---|---|---|
| friends' last (acov-eyes-final, front/±.7/±1.2 only) | 33 to 225 | up to 223 | 68 to 83 | 52 | 126 | (no check) |
| kit, no grain (`facekit-audit-sol-s3n3`) | 0 (blink, happy, excited); half 48 | 87 to 217 | 20 to 94 | 46 | 151 | 11 to 25 at ±.7 (a hair edge, a dark tick beside the far eye) |

The pictures are in `D:\WorkSpace\meshy\fitted\facekit-audit-sol-*` (s1 = the shader before the material fix, s1e = the piece colour, s2c = the difference trial, s3 = grain, s3n = no grain).

## Still failing on Sol

- **Patch at the turned views.** A faint lighter area with straight vertical edges next to the eye, and the lid's soft edge at the inner corners. Next: find which straight edge it is, out of the `_reg` rectangle of `body_offset`, the piece's band (`_band`, REF beyond it) and the face box. Then fade it.
- **Stray, front 151 and below 530.** Specks at the hairline and brows, and a grey tick under the left eye's inner corner. This is the open eye's outline left outside the hole. The hole rule (the eye white grown by distance to the outline, taking the lash bits in) is **not built yet**: `lid()` still uses the friends' colour thresholds.
- **Lid at -.7, -1.2 and above** (28 to 46): a pale line under the lash from the side.

## Not done

- Clara.
- The other streams.
- The blind second reviewer.
- Two-runs-agree on the new views.
- Kitty (pets) uses a separate lid mesh (`fit_animal.py face_pieces`), so the game-side step does not apply. Plan: use the same `body_offset` idea (match the lid tile to the fur under it), the `vlid`, `patch` and `stray` checks ported to `audit_pets.mts`, and the grain only when blended.

## How each stream takes it up, once Sol and Clara pass

- **Friends:** merge `meshy-facekit`. Refit with `FIT_FACEKIT=1 FIT_NOGRAIN=1`. Audit with `kitviews`.
- **11 villagers and regional:** their `fit_people.py` and `friend-model.ts` have diverged. Port the four pieces: `face_box`; `body_offset` before the atlas; the `uShutMap` block, with the gating of the flat paint and the `half` case; the `face_box` copy in the material loop. Then use the auditor's `kitviews`, `vlid` and `patch` in `audit_villager.mts`.
- **Pets:** see the kitty plan.

## Clara (kit, no grain, `facekit-audit-clara-s3n`)

Friends' last, worst over the closed moods: lid 18, stray 23, patch 266, and mouth 23 at .7.

| case | lid | stray | patch | mouth |
|---|---|---|---|---|
| kit, worst | 9 | 34 | 271 | 579 |
| front blink | | | 57 | |
| front happy, excited | | | 86 | |

- **New in the picture:** faint square blocks about 8 px across round both shut eyes, lighter and darker. This is with the grain off. Find out whether they come from `body_offset` (G_ cast per pixel against a body texture of lower resolution) or from the body texture itself. Compare G_ with F on their own before changing anything.
- **Mouth:** 538 to 579 at ±.4 in sad, o and excited. ±.4 had never been audited before `kitviews`, so this is not yet shown to be a regression. Run the friends' own Clara with `kitviews` to tell.

**Verdict 15 Nov:** neither Sol nor Clara passes. The kit fixes the main cause: the flat body under the piece, and the paler piece. Sol's front shut patch went from 33 to 225 down to 0. It is not finished: turned-view patch, the hole rule, the blocks, and Clara's mouth at ±.4. No second reviewer has looked yet. The trial models are in this worktree's `models/` and are not committed.

## 15 Nov 2026 AEDT, afternoon: coordinator's list, steps 1 to 4

1. **Hole rule (done).** `shut_lid.py` has three parts:
   - `grow_hole`: grey outline close by.
   - `upper_lid`: up to the brow, column by column. The brow is told from Sol's grey crease by darkness, V < .42; the friends used .55 in `EYE_A` too.
   - `eye_disc`: the whole painted eye as an ellipse over its white, outline and iris, grown by .1.

   Sol's grey tick and the upper-lid arcs are gone. lid is 0 on every view (was up to 53).
2. **Turned-view band: found and fixed in part.**
   - The shut piece is a flatter decal lit by its own normals. It is hidden now, and the body draws the shut eye with the head's own light.
   - The body only takes the piece's colour where the lid really changed (piece minus smile tile). Elsewhere it keeps its own texel.
   - The pieces are cut from the body's own texture cast from the front (`FACE_FROM_BODY`), not the original picture. F and that texture differ by only 0.0003 on average (`facekit.json`), so the lighter disc was not a colour offset.
   - The facing test was loosened to -.2..1: the socket's upper part faces down.
   - **Still open:** a light crescent on the side of the near eye's dome at ±.4 and ±.7. A coverage paint (green = covered, magenta = changed; debug build, reverted) shows this crescent gets no cover at all. It is not the colour rule, not the eye-white test, and not facing alone (-.6 did not remove it). Next: check which material or mesh those texels belong to (`skin-tex` without the cover/kit branch?) and their fu_.
3. **Clara's squares: not started.**
4. **Clara's mouth at ±.4: not new.** The old Clara on the friends' server gives the same 538 and 579. It was an auditor fault: the box placed from the front reached her red shirt at the shoulder. The mouth box now keeps to the head's own skin and hair (body codes 5, 3).
5. **Two-run stability: not run yet.**

Sol now (`facekit-audit-sol-s16`):
- eyes 0, face 0, mouth 0, lid 0;
- front patch: blink, happy and excited 0, half 62;
- patch at the turned views and from below: 45 to 204 (the crescent);
- stray 31 to 212: hair edges and brow edges at -.7 and from below;
- vlid 42 to 54 at ±.7: small dark bits at a hair edge and beside the far eye.

### (a) The crescent: found
A debug build (scratchpad `dbg.py`, reverted) coloured each head material and the shut cover: green for covered, yellow for facing backwards, red for outside the face box, blue for a skin material without the kit path. The crescent is **yellow**: a fold on the side of the near eye's dome whose surface normal faces backwards (model z ≤ -.2). The facing test dropped it. There is no second material and no UV seam.

**Fix:** `face_box` gets a 5th value, the face's front (game z of the nose tip). Within 6 cm of it, any facing counts; behind it, the facing test still keeps the back of the head out. This needs a refit, as older models carry only 4 values (`fzf` defaults to 99, so the facing test is unchanged for them).

### (a) The crescent: still open (blocked)
- A second debug render (green where the body takes the piece, yellow where a backward-facing texel is left uncovered) shows a thin yellow line where the fold of the dome is.
- None of these removed the light crescent; the audit numbers are the same to the pixel:
  - a depth gate 6 cm and 12 cm behind the face's front (`face_box[4]`, game z of the nose tip, 0.253 on Sol);
  - the facing test loosened to -.85;
  - eye-coloured texels in the eye areas closed with the skin colour.
- So the light crescent is most likely the **lighting of the dome's geometry** (in the smile too, round the open eye), not a texture left open. The flattened normal (`vFkN_`, the regional kit's way) did not change it either. The next things to check:
  1. Whether the head's baked material is lit at all (BAKED_EMISSIVE against diffuse). A crescent from the light needs diffuse.
  2. The dome itself. Smooth the eye domes in the fit (Blender: flatten the eye-area vertices towards the face's surface before baking), or check whether `normal_fragment_maps` runs for this material (MeshLambert).
- Kept in the shader, as they did no harm: the facing test back at -.2..1, the eye-texel rule, and the `face_box[4]` export (`fzf`, unused for now).

### (c) Clara, refit with today's kit (`facekit-audit-clara-s17`)
- lid 0 (was 18), eyes 0, face 0.
- patch 22 to 401: worst `half/up` 401.
- stray 232 to 490: the hair over her face, to check.
- mouth 538 and 579 at ±.4 are unchanged by the head-only mouth box, so her shirt is not what was counted. Next: dump the Pb codes of the marked pixels.

### (a) The crescent, later the same afternoon
- The head is lit almost wholly by its own painted light (BAKED_EMISSIVE .95, diffuse #262524), so the crescent is texture, not light.
- A debug render showed red = cover weight, green = change from the body's texel. The crescent is covered, but unchanged: the dome's side is painted a paler skin round the open eye, and its front projection falls just outside the lid's hole, because the front picture squeezes the dome's side into a few pixels.
- **Fix (in the shader):** the lid's change is looked up 2 % of the face picture further out (8 samples), so the dome round a shut eye takes the lid. The crescent is now a thin sliver plus the fold line (the backward-facing texels, uncovered), but not gone.
- Next: a wider spread for the side views only, or fill the dome's texels in the fit itself. In the body texture's own UV space, the eye dome's triangles are the eye_ovals' triangles, as the regional stream does.

Sol now (`facekit-audit-sol-s22`): eyes, face, mouth, lid 0; patch up to 205; stray up to 219; vlid up to 54. **Not passing.** Steps (b), (c) squares, and (d) are not done.

## For the next agent (15 Nov 2026 AEDT, evening): what to do, exactly

The coordinator's next order: (1) the UV-space fix; (2) print the Pb codes for Clara's ±.4 mouth pixels; (3) sort Sol's stray and vlid into real faults and noise; (4) two-run stability. The same rules apply:
- every heavy job goes through `D:\WorkSpace\meshy\tools\heavy.ps1`;
- no limit is raised;
- push hourly (`git pull --no-rebase` first, never force);
- never commit `models/`, `content/management-catalogue.json`, `.agents` or `AGENTS.md`;
- no Meshy calls.

**Set-up already in place:**
- worktree `D:\WorkSpace\sv-meshy-facekit`, branch `meshy-facekit`;
- server `node tools/meshy/serve.mjs "D:\WorkSpace\sv-meshy-facekit" 8796`, which may need restarting;
- `tests/node_modules` and `node_modules` are junctions to the prod worktree's;
- build after any `js/*.ts` change: `node tools/build.mts`.

**Commands:**
- **Fit one friend:**
  `FIT_FACEKIT=1 FIT_NOGRAIN=1 powershell -File D:\WorkSpace\meshy\tools\heavy.ps1 powershell -File tools/meshy/facekit/fit_trial.ps1 sol`
  It writes `D:\WorkSpace\meshy\fitted\facekit-<id>-{swim,own}` and copies the result into this worktree's `models/`. A fit takes about 4 minutes per friend.
- **Audit:**
  `cd tests; SV_URL=http://localhost:8796/ powershell -File ...heavy.ps1 node ../tools/meshy/audit.mts <out> sol "poses:face,pics,kitviews"`
- **Self-test:** pass `-Out` and `-Only` quoted, through `-Command`:
  `powershell -File ...heavy.ps1 powershell -Command "& ../tools/meshy/audit_selftest.ps1 -Id sol -Out 'D:\...\facekit-selftest' -Only 'eyes,face,mouth,lid,stray,patch,vlid'"`
  Last result: all 7 face plants caught.
- **Probe:** `node ../tools/meshy/facekit/probe.mts sol blink` lists each material's shut uniforms.
- **Zoom strips:** the scratchpad `strip.py` (`out zoom x0 y0 x1 y1 files...`). Copy it if needed; it is 15 lines of PIL.
- **Debug builds:** scratchpad `dbg.py` / `dbg2.py` patch `js/friend-model.ts` to paint the cover (green), the change (red/green) or backward-facing texels (yellow). They copy the file aside first; restore it after the run.
- **Gotcha:** edit scripts written through a bash heredoc lose backslashes here. Write them with the Write tool and use `chr(92)` for backslash-n in JS strings.

### (1) The UV-space fix: the plan
**Goal:** close the whole eye dome on the head's own texture (the `colour` image, `CA`, baked onto `body`), so no view depends on the front projection. Store it as a second, shut copy that the game swaps to.

**Fit side** (`fit_people.py`, after `colour` is final, near the `CLEAR_FACE` block about line 990, which already maps faces to texels with `uv_texels`):
1. Eye-dome triangles: the body's polygons whose centre (x, z) lies inside each eye's ellipse in metres, grown about 25 %. Convert the pixel boxes with `wbox(b, pad)`, or use `eye_disc` in F, mapped to x/z through `fx0..fz1`. Take every such polygon whatever its facing; that closes the backward fold too.
2. Texels: `uv_texels(polys, A_.shape[:2])`, and grow them 2 to 3 texels against UV seams.
3. Lid colour per texel: the blink tile's colour at that triangle's front-projected position. The blink piece M['blink'] has the lid painted in F space. Sample it at the texel's 3D point: (x, z) to F's pixel. The pale dome sides then get the lid tone too.
4. Write a second image, `colour_shut` = `colour` with those texels replaced. Feather 3 to 4 texels by alpha into the original, to avoid a hard UV edge. Save it in the GLB:
   - easiest: as the `emissiveTexture` of a cloned material with a `_shut` extra;
   - or: put a small atlas in a free corner of `colour` and store its UV rect in userData.

**Game side** (`js/friend-model.ts`): while shut and `uShutOn`, sample `uShutMap2` (the shut colour image, same UVs as the body) instead of the face-picture path:
- the body's texel `tx_` becomes `texture2D(uShutMap2, vMapUv)`, inside the eye areas only;
- keep the projection path as a fallback for models without it;
- `half` uses its own tile. Either make a half image too, or keep the projection for half.

**Check:** the light crescent and the fold line should both go at ±.4 and ±.7 (`facekit-audit-sol-s22`, blink 0.7, about x 930 to 960 zoomed).

### (2) Clara's ±.4 mouth
538/579 is on the old and the new model alike, so it is the auditor. The head-only mouth box (body codes 5, 3) did not change it, so the shirt is not the cause. Print what is in the box: in `audit.mts`'s mouth pass, for `s === .4`, log the histogram of `Math.round(Pb[i*4])` and the box `bx0 bx1 by0 by1` against the face's extent. Then look at `clara-face-o-0.4-mouth.png` in `facekit-audit-clara-s17`. In the old run the magenta was on the lower jaw edge and the neck-shirt at the picture's corners.

### (3) Sol's stray and vlid
| Check | Where | Worst |
|---|---|---|
| stray | -.7 | 212 to 219 |
| stray | from below | about 136 |
| stray | front | 83 |
| vlid | ±.7 | 42 to 54 |

Earlier looks:
- **stray** marks the hairline and brow lower edges (likely hair-edge noise) and a few skin specks.
- **vlid** marks small dark bits at a hair edge and one beside the far eye.

Zoom 3× (`strip.py`) on `sol-face-blink--0.7-stray.png`, `sol-face-blink-down-stray.png` and `sol-face-blink-0.7-vlid.png`. For noise: widen `hairEdge` in audit.mts, and keep the `stray` plant (dark dot on the nose) caught.

### (4) Two runs
Run the same audit twice on the final Sol and Clara. Compare `cases.json` per case: they must agree within 5 px.

### State of the shader (`js/friend-model.ts`, in the kit block)
- `uShutMap`, `uShutTile`, `uFBox`, `uFzf` (the face's front, unused now), `vKitNz`, `vKitZ`, `vFkN_` (forward normal).
- Shut and `uShutOn`: `sa_` = piece alpha × facing (-.2..1); `sc_` = mix(body texel + (piece - smile tile), piece, ch_). ch_ is the lid's change, spread 2 % (8 samples), plus eye-coloured texels.
- Eye texels in the eye areas left uncovered take the paint colour.
- The normal goes forward under the piece.
- The shut piece mesh is hidden; the body draws the shut eye.
- The old flat paint runs only when `uShutOn` is 0 (models without `face_box`).

**Fit (`FIT_FACEKIT`):**
- F is cast from the body's own texture (`FACE_FROM_BODY`).
- Hole: `grow_hole` + `upper_lid` + `eye_disc`.
- Brow vs crease at V < .42.
- Fill sources: skin V > .45.
- Smile tile kept whole.
- `face_box` has 5 values.
- Grain off (`FIT_NOGRAIN=1`): it made specks.
