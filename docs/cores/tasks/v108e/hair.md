# v1.08e hair round 3: status

Branch `work/v108e-hair` (from `work/v108e-faces`). Asked by Release, 6 Nov 2026 AEDT, after the owner (6 Nov, 9 pm AEDT)
said the hair, with the eyes and cheeks, "will 100% scare the kids": sharp faceted shards and spikes.

## What changed (scripts only; no rebuilt model is committed)

Release merges these scripts into the faces branch; the full rebuild of all 33 models runs once afterwards
(`node tools/make-friends.mts`, `node tools/make-friends.mts hd`, `node tools/make-villagers.mts`, `... crowd`).

- **Villagers' hair** (`tools/blender/lumi-hair.py`, every named villager and crowd neighbour):
  - every lock is a soft round clump, like a clay sculpt: an oval tube (8 sides), full at the root, staying full to a
    blunt round tip about one width long, the root closed and round; no flat strips with edges, no points;
  - about a quarter fewer locks, each wider (`CLUMP`); the side locks of short hair start behind the temple, off the
    cheek; Bác Ba's tufts and the curls stay soft spheres (the grandmother's curls fewer and bigger);
  - one base colour (no light and dark stripes of locks): dark hair is a warm dark brown (`_lift`, near-black lifted
    toward brown by 42 %), never black;
  - the hair base's trimmed edge round the face is smoothed along itself (a soft hairline curve, not a staircase).
- **Friends' hair** (Finn, Sol, Clara: `lumi.py`'s approved felt clumps, not edited): softened at export
  (`tools/blender/hair-finish.py`, called from `lumi-rig.py` and `game-hd.py`): the same paths and roots, but every clump
  and lock stays at least about half as thick as its root and ends in a round dome instead of a point; the locks, clumps
  and braid beads in the main colour (the cap under them keeps its darker shade, the depth under the locks); each lock
  is thinned by the same share before the parts are joined, so the long locks do not turn into flat slabs. Lumi's leaf
  hair keeps its leaves and their three greens: it is only given smooth normals.
- **The export** (`game-light.py`, `game-hd.py`, `lumi-rig.py`):
  - the villagers' new locks are subdivided once before thinning (8,680 triangles thinned to 5,000 for Mai: about half,
    so no shards); the friends' tubes are already dense and are not subdivided again (subdivided, Clara's hair came to
    81,000 triangles and the thinning to 9,500 cut it back into facets); the hair base is not subdivided for the
    villagers (it hardly shows), and keeps its one subdivision for the friends (its edge is jagged without it);
  - smooth shading on all hair, no sharp edges, and each thinned corner takes the normal of the full smooth hair at that
    point (data transfer; angle-weighted normals where no full hair is at hand), so the clumps shade as round shapes;
  - one soft highlight band round the upper head (`hair_colour`): the base colour lifted 20 % toward a warm light,
    strongest at the front and the light side, fading toward the back and the hairline; a dark brown band stays brown.
- **Shots tool** `tests/hair-shots.mts`: Clara (high-detail and light), Mai and Tèo, front and three-quarter, phone
  (390x844) at 1x and 2x, and a 4x close-up of each head.

Hats, bows, flowers and Bác Ba's tufts are separate parts with their own materials and are not changed: the nón lá sits
on Mai's hair as before; Clara's braids, ties and flower clip keep their places.

## Quality gate (7 Nov 2026, 00:30 AEDT)

Shots: `docs/world-models-v108e/faces/hair-r3/` (`before-*`: the current scripts, `after-*`: this round; `*-phone-1x`,
`*-phone-2x`, `*-close-all`, `*-close4x-<id>-<front|three-quarter>.webp`). The before close-ups were framed a little
tighter.

"Would a 3-year-old be comfortable with this hair?"
- **Mai, Tèo:** yes. Soft warm-brown clumps, round ends, no shard, spike or hard edge at 1x, 2x or 4x.
- **Clara:** no spike or shard any more (before: flat triangular shards on top, spiky tips), one pink, braids as soft
  beads. At the 4x close-up her many locks are still chunky (low-poly lumps): the light model has 4,200 triangles for
  about 50 tubes and 18 beads, and her shapes live in `lumi.py`, which this helper was told not to touch. Fix that needs
  Release's or the owner's word: fewer, bigger locks in `lumi.py`'s `hair_clara` / `hair_finn` / `hair_sol` (as done for
  the villagers), or a larger hair budget.

## Triangles (this container's build)

| Model | Total | Hair |
|---|---|---|
| Clara light | 11,196 (before 11,195) | 4,200 |
| Mai | 20,150 (before 20,150) | 5,000 |
| Tèo | 19,566 (before 19,566) | 5,000 |

Within the `friendmodel` (12,000) and `villagermodels` budgets: the hair budgets are unchanged.

## How it was built here

Blender 4.2 could not be downloaded in this container (blocked); `pip install bpy` gives Blender 5.2, run through a small
shim outside the repo (it maps `blender -b -P script -- args`). Three 5.2 differences were worked around in the shim
only, not in the repo: `Action.fcurves` (layered actions), the compositor's `Scene.node_tree`, and the glTF exporter's
colour option. Cycles baking to vertex colours writes nothing in the pip build, so the high-detail models' baked light
was replaced, for these test builds only, by a soft light from the normals. Release's rebuild with Blender 4.2 bakes as
before. Models rebuilt here were never committed.

## Checks

7 Nov 2026, 00:30 AEDT, one at a time (`node suite.mts --jobs 1 --only ...`), with Clara, Mai and Tèo rebuilt here
(the other 30 models as committed):

| Check | Result |
|---|---|
| `friendmodel` | pass (clara 10,363 triangles in 6 parts by the check's count; finn 10,299, sol 10,281, lumi 16,267 as committed) |
| `villagermodels` | pass (11 villagers wear their models, blink and look; the crowd wears its model) |
| `faces` | pass (lids close, 8 mouth shapes, heads not spheres) |
| `noemoji`, `arch`, `bilingual`, `rules` | pass |
| `names`, `types` | skipped (no npm install in tests here) |
| `emoji` | fail, not this change: emoji in `docs/cores/tasks/v108d/polish.md` and `docs/cores/tasks/v108f/settings.md` |
| `unit` | fail, not this change: the packages `pg` and `typescript` are not installed in this container |

`suite --changed` cannot run here (no `main` in this clone); the change is build scripts only, so the game checks are
unchanged until the rebuild. Release / the faces helper runs the full rebuild of all 33 models and then the checks.

## Left for a later round

- Clara's (and Finn's, Sol's) locks are still chunky at the 4x close-up (fine at phone 1x and 2x): fewer, bigger locks
  in `lumi.py`'s friend hair, which this helper was not to touch.
- Release's tip, not done: bring the fringe and hairline down to meet the eyes (they moved up about 4 % of head height).
- Finn, Sol, Lumi and the other villagers were not built here (the brief's three test models only).

## Progress notes

- 7 Nov 2026, 00:35 AEDT: scripts pushed (`work/v108e-hair`); checks above.
