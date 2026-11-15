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
