# v1.08e villagers: status

Working again (6 Nov 2026, 07:00 AEDT, after Release's review of the first models), by the faces helper (Release moved the villagers brief here). Branch `work/v108e-faces`.
Brief: `villagers-brief.md`.

## The 11 named villagers as models (done)

- `tools/blender/lumi.py`: the 11 named villagers (`role=mai`, `ba`, `teo`, `ti`, `bong`, `su`, `jack`, `mit`, `bom`,
  `ruby`, `lan`), each from the gallery neighbour closest to them, in their own colours in the game (Cô Mai's red áo dài
  and nón lá, Bác Ba's blue, Tèo's orange shirt, Ruby's red hair and purple dress ...). Heights by the neighbour's size
  (children, grown-ups, grandparents), the friends' skeleton and joint names, the soft eyes with lids and all 11 faces.
- `tools/make-villagers.mts`: made like the friends' light models (`tools/blender/game-light.py`): the colours crisp in
  the corners (Release: the first try's baked 512 px picture smeared the clothes), the body kept at 5,200 triangles (at
  3,000 the shorts showed through the shirts), about 12,000-15,000 triangles in all with the 11 faces (about 8,500 shown at
  once), about 100-115 KB each: `models/villager-<id>.glb`.
- Each villager's own hair from their look (Release: everyone wore the same short cut, because the hair table had no
  entry for the named roles): Cô Mai long and black under the nón lá, Bác Ba a grey tuft, Tèo, Su, Jack and Bờm short with
  a fringe, Tí and Mít two buns (with a flower clip), Bống a ponytail with bunny ears, Ruby red to the shoulders, Lan a
  ponytail. The owner (6 Nov): "I don't want this spiky hair": no spiky hair anywhere (the code builder's `spiky` style is
  soft tousled locks now, and no model has spikes).
- `js/main.ts`: a named villager's model is loaded when a child comes within 40 m and worn in place of the code person
  (`wearVillagerModel` in `js/avatar.ts`): it follows the code person's joints and moods, stands at the code person's
  height and feet (it is scaled to them), blinks, looks at the child, and Mai and Bác Ba now breathe and blink too. Far
  away the code person's still copy is shown, as for everyone. A villager with a photo face keeps the code person (the
  photo). Name tags, talk and day plans are unchanged. Blocked: the code person stays.
- `sw.ts`: the 11 models are in the offline list.

## Crowds (owner, 6 Nov 2026 AEDT, pop-up: "Models near the child")

- The 14 gallery neighbours (`vn-aodai`, `vn-dad`, `vn-farmer`, `vn-vendor`, `vn-grandma`, `vn-grandpa`, `vn-schoolboy`,
  `vn-schoolgirl`, `au-dad`, `au-mum`, `au-grandma`, `au-grandpa`, `au-boy`, `au-girl`) as models
  (`node tools/make-villagers.mts crowd`, `models/villager-<role>.glb`).
- `js/crowd-models.ts` (loaded after the start): a crowd person within 25 m of a child wears the neighbour they look most
  like (Vietnam or Australia by where they stand, child, grown-up or grandparent, a dress, áo dài or long hair), three
  swaps every half second at most. Far away: the still copy, as everyone. Never a named villager, a child's own character,
  a photo face or a stand-in not built yet.

Far away and as the fallback the code builder keeps the crowds, with the faces helper's soft eyes, blush, the five-band ramp, rim light and outline,
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

## Owner's decisions

- 6 Nov 2026 AEDT: "I don't want this spiky hair" (a picture of Tèo): no spiky hair.
- 6 Nov 2026 AEDT (pop-up): the crowds look nicer with models near the child.

## Assumed (owner can change)

- Each named villager is drawn from the gallery neighbour closest to their look in the game, in their game colours.
- About 8,500 triangles shown at once (12,000-15,000 with all 11 faces), about 100-115 KB, instead of a 512 px picture.
