# v1.08e villagers: status

**ready for Release** (6 Nov 2026, 07:40 AEDT), by the faces helper (Release moved the villagers brief here). Branch `work/v108e-faces`.
Brief: `villagers-brief.md`.

## The 11 named villagers as models (done)

- `tools/blender/lumi.py`: the 11 named villagers (`role=mai`, `ba`, `teo`, `ti`, `bong`, `su`, `jack`, `mit`, `bom`,
  `ruby`, `lan`), each from the gallery neighbour closest to them, in their own colours in the game (Cô Mai's red áo dài
  and nón lá, Bác Ba's blue, Tèo's orange shirt, Ruby's red hair and purple dress ...). Heights by the neighbour's size
  (children, grown-ups, grandparents), the friends' skeleton and joint names, the soft eyes with lids and all 11 faces.
- `tools/make-villagers.mts` (with `tools/blender/game-hd.py`, villager budgets): about 10,300-11,700 triangles (the brief said about 8,000: at 8,000 the hair
  collapsed into a block, so the hair has 5,000), one baked 512 px picture, 205-226 KB each: `models/villager-<id>.glb`.
- `js/main.ts`: a named villager's model is loaded when a child comes within 40 m and worn in place of the code person
  (`wearVillagerModel` in `js/avatar.ts`): it follows the code person's joints and moods, stands at the code person's
  height and feet (it is scaled to them), blinks, looks at the child, and Mai and Bác Ba now breathe and blink too. Far
  away the code person's still copy is shown, as for everyone. A villager with a photo face keeps the code person (the
  photo). Name tags, talk and day plans are unchanged. Blocked: the code person stays.
- `sw.ts`: the 11 models are in the offline list.

## Crowds (done)

The code builder keeps the crowds, with the faces helper's soft eyes, blush, the five-band ramp, rim light and outline,
and soft hair locks all round the head.

- Hats (Cô Mai's nón lá, Jack's and Su's bucket hats): their normals are turned outward before baking, and they draw
  both sides with no outline shell behind them (`js/friend-model.ts`).
- Shots: `docs/world-models-v108e/villagers/before-after-named-*.webp` (each villager, the code person then the model)
  and `after-crowd-*.webp`, phone, tablet and computer (`tests/villager-shots.mts`).

## Not done yet

- Films that use these villagers still draw them with the code builder (the faces match; the models are not used).

## Checks

`villagermodels` (new, `tests/villager-models.mts`, end of `tests/run.mts`): pass (each of the 11 worn at the code
person's height and feet, blinks, eyes to a child on its left, tag and talk kept, the code person when blocked). The
other checks: see `faces.md` (the same branch and runs).

## Assumed (owner can change)

- Each named villager is drawn from the gallery neighbour closest to their look in the game, in their game colours.
- About 10,000-11,700 triangles each instead of about 8,000 (the hair needed it).
