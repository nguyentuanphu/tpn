# v1.08e villagers: status

Working again (6 Nov 2026, after Release's review of the first models and the owner's notes), by the faces helper (Release moved the villagers brief here). Branch `work/v108e-faces`.
Brief: `villagers-brief.md`.

## The 11 named villagers as models (done)

- `tools/blender/lumi.py`: the 11 named villagers (`role=mai`, `ba`, `teo`, `ti`, `bong`, `su`, `jack`, `mit`, `bom`,
  `ruby`, `lan`), each from the gallery neighbour closest to them, in their own colours in the game (Cô Mai's red áo dài
  and nón lá, Bác Ba's blue, Tèo's orange shirt, Ruby's red hair and purple dress ...). Heights by the neighbour's size
  (children, grown-ups, grandparents), the friends' skeleton and joint names, the soft eyes with lids and all 11 faces.
- `tools/make-villagers.mts` (the owner, 6 Nov 2026 AEDT, by pop-up: "Bake gallery light", then "Smoother, heavier"):
  each model keeps far more of the gallery shape (about 21,000-26,000 triangles, smooth normals), and the gallery's soft
  studio light (felt sheen, soft shadows in the folds) is baked into its picture (`tools/blender/game-hd.py`, `LIT`: the
  named 2048 px at 64 samples, the 14 crowd neighbours 1024 px). The game draws it mostly by its own light, warm and
  bright (`lit-` materials in `js/friend-model.ts`; the owner: "brighter, warmer"). The hair and hands get their clean
  colour and soft shadow instead (baked light came out speckled and dark there); the skin keeps the villager's own skin
  tone. Sizes: the named 720-890 KB, the crowd 390-540 KB.
- The owner (6 Nov): "the heads are too round and don't look like the model; the hats don't fit the head": the gallery's
  smaller, oval head and softer chin for villagers (`lumi.py`), hats sit down over the hair (`lumi-more.py hat()`).
- The owner (6 Nov): "Mai's tummy looks strange": under an áo dài the sculpted trousers start below its panels (they
  showed as a white band at the waist, `lumi-sculpt.py`).
- Each villager's own hair from their look (Release: everyone wore the same short cut, because the hair table had no
  entry for the named roles): Cô Mai long and black under the nón lá, Bác Ba a grey tuft, Tèo, Su, Jack and Bờm short with
  a fringe, Tí and Mít two buns (with a flower clip), Bống a ponytail with bunny ears, Ruby red to the shoulders, Lan a
  ponytail. The owner (6 Nov): "I don't want this spiky hair": no spiky hair anywhere (the code builder's `spiky` style is
  soft tousled locks now, and no model has spikes).
- `js/main.ts`: a named villager's model is loaded when a child comes within 40 m and worn in place of the code person
  (`wearVillagerModel` in `js/avatar.ts`): it follows the code person's joints and moods, stands at the code person's
  head and feet (the model's head joint at the code person's head, a hat does not count; only what is drawn is measured:
  the hidden glider over the head had made every model too big), blinks, looks at the child, and Mai and Bác Ba now breathe and blink too. Far
  away the code person's still copy is shown, as for everyone. A villager with a photo face keeps the code person (the
  photo). Name tags, talk and day plans are unchanged. Blocked: the code person stays.
- `sw.ts`: the villager models (about 15 MB for all 25) are not in the up-front offline list: each is kept by the service
  worker the first time a child meets that villager.

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

6 Nov 2026, 14:20 AEDT, one at a time: `perf` pass (village 276 draws, 692k triangles, largest texture 1024 px),
`villagermodels` pass (the 11 and a crowd neighbour), `battery` pass.

`villagermodels` (new, `tests/villager-models.mts`, end of `tests/run.mts`): pass (each of the 11 worn at the code
person's height and feet, blinks, eyes to a child on its left, tag and talk kept, the code person when blocked). The
other checks: see `faces.md` (the same branch and runs).

## Owner's decisions

- 6 Nov 2026 AEDT: "I don't want this spiky hair" (a picture of Tèo): no spiky hair.
- 6 Nov 2026 AEDT (pop-up): the crowds look nicer with models near the child.
- 6 Nov 2026 AEDT (pop-up): bake the gallery light; then brighter, warmer; then smoother, heavier models (about 25k triangles).
- 6 Nov 2026 AEDT: the heads too round and the hats not fitting; Mai's tummy looked strange (both fixed).
- 6 Nov 2026 AEDT: the owner offered their own computer for Blender: not needed (this container builds them; the gap was the conversion).

## Assumed (owner can change)

- Each named villager is drawn from the gallery neighbour closest to their look in the game, in their game colours.
- Up to about 26,000 triangles and 0.4-0.9 MB per model (the owner chose "smoother, heavier"); only the villagers within
  40 m (named) or 12 m (crowd: two swaps every half second, at most three crowd models within 25 m of a child), at
  about 18,000 triangles and a 1024 px picture each, so `perf` stays inside its limits (village 692k triangles, 6 Nov
  2026 14:20 AEDT).
