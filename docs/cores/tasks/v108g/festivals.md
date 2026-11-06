# v1.08g festivals: status

**ready for Release** (6 Nov 2026 AEDT)

Branch: `work/v108g-festivals` (from `origin/integrate/v108`). Brief: `README.md` (this folder).

## Owner's decisions
- 6 Nov 2026 AEDT, by pop-up: **"Go, but richer"**: fewer pieces get models but each is more detailed (up to about
  1,500 triangles; a 5x festival street may show fewer far pieces within the 60k festival triangle budget). Applied as:
  each festival's own pieces and the single objects get rich models (about 300-1,900 triangles); the four shared pieces
  get mid-weight ones; the bunting strings (hundreds of flags) stay code shapes.

## Inventory (code shape -> model)
| Where | Code shape | Model(s) |
|---|---|---|
| `js/festivals.ts` own(), tet | red cau doi banner (the peach and mai trees were v1.08e's pr-peach, pr-mai) | `fe-caudoi`, `fe-caudoi-glow` |
| pumpkins (Halloween) | pumpkins, skeleton, web, ghost, cat, cauldron, scarecrow, witch's hat | `fe-pumpkins` (+glow), `fe-skeleton`, `fe-web`, `fe-ghost`, `fe-cat`, `fe-cauldron` (+glow), `fe-scarecrow`, `fe-witchhat` |
| xmas | presents (the tree was v1.08e's pr-xmastree) | `fe-presents` |
| hearts | heart pole, flower pot | `fe-heartpole`, `fe-pot` |
| diyas | diyas and rangoli | `fe-diyas` (+glow) |
| colours, poppies, ochre | powder hills, poppy wreath, dot painting | `fe-colours`, `fe-poppy`, `fe-ochre` |
| harmony, kids, sparkle | balloons | `fe-balloons` (colour slots) |
| clean, kitchen, dragonboat, teacher | bins, carp basin, dragon boat, card and pot | `fe-bins`, `fe-carpbasin` (+glow), `fe-dragonboat`, `fe-teacher` + `fe-pot` |
| flags-vn, flags-au | flags on poles | `fe-flag-vn` (+glow star), `fe-flag-au` |
| lanterns, eggs | (v1.08e's pr-starlantern, pr-lantern, pr-eggs) | unchanged |
| `js/festivals.ts` shared() | lantern post, pennant pole, flower tub, garland arch | `fe-lanternpost` (+glow), `fe-pennantpole`, `fe-flowertub`, `fe-arch` (+glow), all with colour slots |
| `js/festivals.ts` bunting() | flags, lanterns, bats on strings | stays code (hundreds of copies) |
| `js/dinh.ts` buildLantern (lantern quest, companion) | sphere, caps, tassel | `fe-questlantern-body` (keeps its lit glow material), `fe-questlantern-trim` |
| `js/hoilang.ts` | the tall flag pole, the walker's flag | `fe-hoilang-pole`, `fe-hoilang-flag` |
| `js/folkshow.ts` | the sign post, the singer's stage | `fe-folk-post`, `fe-folk-stage` (the board picture stays) |
| `js/kite.ts` | the sail with the flute | `fe-kite` (the tail of bows stays) |

## How it works
- `tools/blender/world-festivals.py` (toolkit of `world-nature.py`), `node tools/make-world-festivals.mts [name ...]`
  (gltfpack 0.20, meshopt, `-noq`) -> `models/world/fe-*.glb`, 43 files, about 1.2 MB in all.
- Festival pieces: `js/festivals.ts` FEST_MODELS lists each theme's models; a festival on now loads only its theme's and
  the shared ones (when its decorations are built near a child); they join the same 12 m patch merge (same draws) through
  the v1.08e `prop()` route; "-glow" models go with the glows (lit at night). Code pieces stay until they arrive and with no
  network.
- Colour slots: corners painted pure red, blue or green are repainted with the festival's colours (`findSlots`, `prop(...,
  pal)`), so the shared pieces and balloons serve every festival.
- Single objects: `worldTag` (hoi lang pole and flag, folk post and stage, kite); the folk stage's show/hide toggle now
  drives the model when there is one (`js/folkshow.ts`). The quest lantern is dressed inside `buildLantern` (`js/dinh.ts`).

## Progress
- Models, game wiring, check `festmodels` (`tests/festival-models.mts`, end of `tests/run.mts`): done.
- Screenshots: `docs/world-models-v108g/festivals/` (before = models blocked, after; phone 390x844, tablet 820x1180,
  computer 1280x800; Tet, Mid-Autumn lanterns, Halloween, Diwali; `compare-*.png` side by side). The Tet pair is badly
  framed (a roof in front of the camera in both).

## Checks (6 Nov 2026 AEDT, one at a time)
| Check | Result |
|---|---|
| festmodels (new) | pass: all 15 themes fetch and use their models, no colour slot left, Lotus Village on Tet within 420 draws, quest lantern and folk show models, blocked models keep the code pieces |
| festivals, festhunt, festcal, wading | pass |
| perf | pass: home 164 draws, village 283 draws / 761k triangles |
| battery, types | pass |
| solid | pass (was failing: desktop and phone maps differed by 3 cells; fixed in js/folkshow.ts and js/dinh.ts, see below) |
| worldplaces | pass (the check waited for exactly 8 festival props; it now counts the eight v1.08e `pr-*` ones by name, since the festivals' own `fe-*` models load beside them: what it checks is unchanged) |
| `--changed` | picks the full suite (shared files): left to Release |

## Fixes found by the checks
- `js/folkshow.ts`: a singer's stage that is off (Studio switch) with its model arrived would have counted in the solid map
  (js/solids.ts reads a hidden code shape while it has a model): an off stage now parks its model (`offModel`), hidden.
- `js/dinh.ts`: the quest lantern keeps its code shapes in the solid map (`codeGeo`, `swapped`), the trim is `noSolid`,
  and the lantern's own scale is untouched.
- A note pasted before code swallowed a statement in `js/dinh.ts` (commit 22393a492); restored in d733e171a.
