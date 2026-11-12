# Regional villagers: review gate, 13 Nov 2026 (about 07:30 AEDT)

Round: the six refitted with `-NoLimbTint -LidMatch -FaceUV 2 -PieceSnap .001 -MouthFind -LookSolid -LidSoft -PieceSink
-LidHair -MouthSoft -LidLocal -VTile 256` (per-person flags in `HANDOFF-PILOT-1.md`), models committed as a work-in-progress
snapshot (commit 2ad8cc7f4), **not approved, gate not clean: no approval question was asked.**
Pictures: `D:\WorkSpace\meshy\fitted\regional-gate-20261113c\shots1024` (129 per person, `SHOT_GATE=1`, 1024 px; not in
the repo, about 130 MB); mood sheets here (`moods-<id>.jpg` front, `moods-<id>-angle.jpg` at -.7); auditor `audit.log`.

## Fixed this round (seen fixed at 1024 px)

- r045: the lens-shaped dark fleck over the shut right eye (owner's fault of 12 Nov): a hair tip 6-7 mm in front of the
  blink piece, `-PieceSink`.
- r045: the lock past the right brow's end dotted on every shut eye, `-LidHair`.
- r045, r057: grey ticks of the old iris rim at the inner corners of shut eyes, `-LidHair`.
- r050: pale line along the old smile's corner over "o" and sad, `-MouthSoft`.
- r050, r064, r045: the flat light disc round every shut eye (front and three-quarters), `-LidLocal`.
- Auditor: `lid` and `mshape` ported from `audit.mts` and fitted to villagers (false alarms on earrings, hats, noses,
  blush, big mouths removed; each remaining case looked at).

## Auditor (last run)

eyes 1 case over (r050 blink 1.2, 8 px), lid 19 cases (side views: the open eye's edge beside a shut lid, see A),
mshape 15 cases (looked at: blush, nose and hair still caught on some hosts, r074 at -.7 a real faint old-smile corner),
mouth, oldmouth, lookstill, size 0. Counts move between runs: the crowd host wearing the model is random per load.

## Left: second reviewer (three subagents, full size) plus own review

A. **The open eye beside a shut lid in angled views (high, all six).** At y.4, -.7, tq and the near-profile views a white
   or dark sliver of the painted eye shows past the nose (far eye) or beside the lash (near eye at y1.2). The pieces are
   laid from the front, so where the face turns away they do not cover the painted eye. Needs the game's shut-eye paint in
   `js/friend-model.ts` (another chat's file; on the board since 12 Nov) or pieces that wrap round the eye's sides.
B. r064: a skin-coloured slab replaces a hair lock at the left edge in shut moods at y.4 and tq (appears on blink).
C. r064 sad: the old upper lash shows as a second stepped line above both sad lids; grey smudge at the outer corners.
D. r050, r074, r084 half lids: pale or grey crescent under the iris; r050 half: grey wedges at the inner corners.
E. r074 blink/happy front: blush and freckles under the eyes flattened, a pink band with a hard top edge.
F. r084: a lone dark hair strip beside the left eye on shut moods (front); faint outline arc of the old eye at tq and y1.2;
   small "o" low on the face (known).
G. Looking eyes move little at the front on r050, r074, r084 (they do change: 20-36 k px of 1 M) and iris edges are
   stepped on r057 and r064.
H. Meshy's own geometry and paint (not from the fit, checked against the raw `-9000.glb` where noted): faceted, shattered
   ears (r045, r064, r074), pale shards on foreheads (r050, r064), r045's hat brim saw-tooth at the back, r057's black
   hair slab under the helmet from above and mottled chin strap, r064's earrings as white chips and the straight hair edge
   under her ear, r057's irregular pupils, thin grey lines round ears and necks (not the bake's ray length).
I. The far eye past the nose was already on the board as another chat's work.

## Next

Not for an approval question yet (owner's gate). Next steps are in `HANDOFF-PILOT-1.md`.
