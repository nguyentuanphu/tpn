# Friends swim-sheet handoff

8 November 2026, Australia/Sydney. Owner authorized uploading all completed grey and bright pink swim-kit artwork. [View every new sheet](GALLERY.md). Native Markdown renders images on GitHub, including iPhone browsers.

## Included

- `grey/{finn,sol,clara,lumi}.png`: four light-grey sporty swim-kit sheets.
- `bright-pink/{finn,sol,clara,lumi}.png`: four bright pink recolours, target colour approximately #FF379B under shaded lighting.
- `variants/finn-grey-warm-peach.png`: additional Finn grey-kit generation with requested skin base #E3A88B. This is an art prompt target, not a guarantee of exact rendered pixel values.
- [Earlier four T-shirt/shorts sheets and handoff](../friends-body-sheets-20261108/README.md), including the later crops created by the other chat, remain intact.
- `MANIFEST.json`: source generation paths, PNG dimensions, byte counts, SHA-256 hashes and scope.

Each swim sheet has front, left side, back and three-quarter-front full-body views. Opaque modest high-round-neck sleeveless top extends to hips, with matching mid-thigh shorts, bare feet, no logos/patterns/contrasting trim/accessories. Same reference 3D cartoon style, relaxed A-pose, mid-grey background and soft even lighting. Identity and hair continuity were requested; Clara's braids remain in front with none down her back; Lumi keeps her leaf hair and flower. Generated image edits can introduce small differences; review identity and silhouettes before production.

## Status and limits

Nine new images were generated and technically checked for PNG decoding and file hashes. Final source choice and downstream model fitting still need review. Grey and pink are alternative references; do not combine different generations into one inconsistent multiview input. No underwear or skin-matched swimsuit images were generated. No paid Meshy requests, new model generation, rigging, runtime integration or deployment were performed for this swim pack.

The existing body pack is already referenced by other-chat crops/job specifications. This new pack does not overwrite that pack, its manifest, job specifications, paid-task history, current runtime assets or ledger. Before changing model inputs, read `../meshy-production-20261107/BODY-SHEETS-PROMPT.md`, `CURRENT-STATUS.md` in that directory, and the repository Meshy skill; inspect the live journal for already-submitted jobs. Obtain required approval before any new paid calls. Images do not provide separately editable 3D garment meshes: garment separation, material assignment and clipping checks are downstream work.

## Next steps

1. Review GALLERY.md and select one reference generation per character (grey or pink; optional additional Finn variant).
2. Keep originals and their hashes; derive new crops into a separate location with recorded coordinates if needed.
3. Follow the current body-and-code-clothes plan, retaining separate skin and clothing materials in the resulting 3D assets. Hide covered geometry only where needed to prevent clipping.
4. Validate face/hair continuity, all views, skin tint independence, garment fit and animation in game before accepting runtime changes.
5. Update the board and preserve all existing paid-job records. Reference upload alone does not complete these modelling steps.

## Short takeover prompt

Continue on meshy-production-20261107. Read docs/friends-swim-sheets-20261108/README.md, GALLERY.md and MANIFEST.json, plus the earlier friends-body-sheets-20261108 handoff. All four grey and bright pink swim-kit sheets and an additional Finn grey variant are ready. Review and select sources before following BODY-SHEETS-PROMPT.md. Preserve character identity, Clara's forward braids, Lumi's flower, current job inputs and paid-task history. Keep skin/clothes separate; obtain required approval before new paid Meshy calls.

## Review and selection for 3D (8 Nov 2026, Claude Code)

All nine sheets reviewed against the friends' earlier sheets: faces, eyes, freckles, hair shapes and colours match;
Clara's braids are in front in every view with none down the back; Lumi's flower is there in every view (on the
far side in the back view, as it should be). Every sheet: sleeveless top, mid-thigh shorts, bare feet, same A-pose.

**Selected: grey** for all four (`grey/<friend>.png`). Skin below the face measures closest to the T-shirt body
sheets (Finn #EFB193, Sol #F3AC8D, Clara #F3B2A0, Lumi #FBBF99); the pink kit reflects onto the skin and lightens it,
and grey stays neutral if any of the kit shows under a garment. The extra Finn variant matches the grey Finn closely
(#F2B395); the main grey Finn is kept so all four come from the same set. Pink is kept for reference only (generations
are never mixed in one input).

Views cut by `tools/meshy/crop_body_sheets.py --pack docs/friends-swim-sheets-20261108 --variant grey` into
`crops-grey/` (16 centred square views); `SELECTION.json` records the chosen sheets, their hashes and the views. This
pack's MANIFEST.json is unchanged. Draft jobs, not submitted: `job-specifications/48-clara-swim.json` to
`51-lumi-swim.json` (front, left side, back), checked offline by `run_batch.py check --asset <friend>-swim`. They need
the owner's approval (`approvedBodies` in the account record) before any submission: 45 credits each, 180 in all.
