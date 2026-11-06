# v1.08e places: status

**ready for Release** (6 Nov 2026 AEDT). Branch `work/v108e-places`. The last commit is in the report.

Branch `work/v108e-places` (from `origin/integrate/v108`). Brief: `places-brief.md`.

## Now (6 Nov 2026 AEDT)

- Parts 1 to 3 are done: the landmarks and bridges; the homes, shops and stalls; the festival and food props.
- The owner asked twice for more refinement and a better Opera House (6 Nov). Done since then:
  - **Drawn by hand: 54 landmarks**, so every landmark except the bridges now has its real shape, drawn our way:
    - Ha Noi: Thap Rua, The Huc with Ngoc Son's gate, Khue Van Cac, the One Pillar Pagoda, the water puppet stage.
    - Bac Ninh: the clock tower, Chua Dau, But Thap, Den Do's gate, the Quan ho dragon boat.
    - Saigon: Ben Thanh, Notre-Dame, the Central Post Office.
    - Central Vietnam: Hue's Ngo Mon, the Golden Bridge with its stone hands, the Marble Mountains, Hoi An's houses with lanterns.
    - The Mekong and Cai Rang.
    - Sydney: the Opera House, the Harbour Bridge, Sydney Tower, Luna Park.
    - Melbourne and Brisbane: Flinders Street, the W-class tram, the Exhibition Building, the Brisbane Wheel stand, Lone Pine.
    - Around Australia:
      - the Big Banana, Bondi, Uluru, Kakadu, the reef, the Twelve Apostles, the Three Sisters;
      - Season 2's Rottnest, Cradle Mountain and reef: tagged, not made yet (the dump did not build them). Their code shapes stay; a later round can add them.
    - The Vung Tau lighthouse.
    - The heritage sites: Ha Long, My Son, Phong Nha, Trang An, the Forbidden City, the Temple of Heaven, the Potala, the Terracotta Army, the Qutub Minar, the Red Fort, Konark, Hampi, Mahabodhi.
    - Season 2 Vietnam: Hon Trong Mai, the Mekong canal and monkey bridge, Sa Pa's terraces, the nha rong.
  - **The Opera House is rebuilt:**
    - nested pointed-arch shells in two rows, opening onto bronze glass;
    - one shell turned back over the foyer in each row;
    - the Bennelong restaurant shells;
    - the granite podium with its stairs.
  - **Every other model** (houses, shops, stalls, bridges) gets automatic picture-book detail:
    - tiled roofs with eaves, fascia and tile courses;
    - darker plinths and lighter cornices on walls;
    - window frames, sills and glazing bars;
    - leafy clusters for round bushes;
    - a slight hand-painted colour change from part to part;
    - a lighter detail level kicks in automatically when a model gets too heavy.
  - **Every model** has soft shading (ambient occlusion) baked into its corner colours.
  - All 110 models together: 3.6 MB.
- **Bridges:** Long Bien and Chua Cau are drawn by hand; the other bridges get the automatic detail.
- **Before and after:** pictures of 17 famous landmarks on phone, tablet and computer are in `docs/world-models-v108e/places/` (`tests/places-shots.mts`).
- **Fix:** the solid map and the open-spot finder keep counting a code shape after its model swaps in; the model is `noSolid`.

## How it works

- **Tag, not import:** a code shape that gets a model is tagged where it is built: `worldTag(mesh, 'lm-opera', opts)` (`js/gfx.ts`, a few bytes, nothing loaded). The kit picks the tags up after the start (`adoptWorldTags` in `js/modelkit.ts`) and swaps the model in with `modelFor` when a child comes within 70 m. The startup download does not change.
  - `opts.outline`: the model gets the code shape's outline. `opts.carry`: the code shape's own children (Bac Ninh's clock faces, the Ferris wheel, the Quan ho singers) move onto the model.
- **The code shape's own frame:** `tools/blender/places-dump.mts` runs the game and writes every tagged shape's parts to `tools/blender/places-spec.json`. `tools/blender/world-places.py` builds each model in that frame, so place, size and facing match and the colliders stay true.
  - **Drawn by hand** (real shapes, our style): Thap Rua, The Huc bridge with Ngoc Son's gate, Khue Van Cac (Van Mieu), the One Pillar Pagoda, Ben Thanh market, the Sydney Opera House, the Harbour Bridge.
  - **Every other model:** the code shape rebuilt part by part, with rounder parts and soft bevelled edges.
- **Making:** `node tools/make-places.mts [name ...]` runs Blender and then gltfpack (meshopt). It also rewrites the places block of the `sw.ts` offline list.
  - Blender 4.2.3 goes in `/opt` (download from blender.org). Quick looks: `tools/blender/places-look.py` (Cycles on the CPU).
- **One mesh, one material** per model: the same draws as the code shape plus its outline.

## Kit changes (small, marked, for Release)

- `js/gfx.ts`: `WORLD_TAGS`, `worldTag()`, `geoKey()`; `merge()` keeps a colourless part's own corner colours.
- `js/modelkit.ts`:
  - imports `WORLD_TAGS` and `outline`;
  - `adoptWorldTags()`, called in the `startWorldModels` updater;
  - carried children are marked `userData.carried`.

## List

### Landmarks (part 1: done, 64 models, 1153 KB in all)

| Kind | Models |
|---|---|
| By hand | `lm-turtle`, `lm-thehuc`, `lm-vanmieu`, `lm-onepillar`, `lm-benthanh`, `lm-opera`, `br-harbour` |
| Cities (`js/cities.ts`) | puppetstage, bnclock, chuadau, butthap, dendo, quanho, goldenbridge, cathedral, postoffice, wheelbase, lonepine, sydneytower, lunapark, flinders, wtram |
| Valley (`js/regions.ts`) | banana, bondi, lighthouse, uluru, the market gate (`pl-marketgate`) |
| Heritage (`js/heritage.ts`) | halong, hue, myson, cave, trangan, reef, sisters, exhibition, kakadu, forbidden, heaven, terracotta, potala, qutub, redfort, konark, hampi, mahabodhi |
| Region sites (`js/regionsites.ts`) | marble, hoian, cairang, apostles |
| Bridges (`js/world.ts`) | longbien, story, princes, chuacau, and the plain road bridges |
| Season 2 Vietnam (`js/s2vn.ts`) | mekong, halong, sapa, taynguyen |
| Season 2 Australia (`js/s2au-region.ts`) | tagged (`lm-s2au-gbr`, `-tas`, `-perth`), not made yet: not built in the dump; next part |

### Homes, shops, stalls (part 2: done, 38 models)

- **What is covered:** every storybook house (`finish()` in `js/houses.ts`, used by the town, the suburbs, Asia and the village), the Aussie Corner shops, the school, the market stalls (`stall()` in `js/regions.ts`, `js/world.ts`), the clothes stall (`js/shop.ts`) and the farm stall (`js/farm.ts`).
- **Naming:** one model per distinct shape, named by a hash of the code shape (`geoKey`), so repeated houses share one model.
- **Over budget:** a few detailed houses have 3,200-5,400 triangles, about what their code shapes already have.
- **Not done:** the hawkers' carrying poles (they move with a person), and the My House rooms (interior, the nature helper's furniture).

### Food and festival props (part 3: done, 8 models)

- **The props:**
  - `pr-peach` (hoa dao in a red pot) and `pr-mai` (hoa mai);
  - `pr-banhchung` and `pr-mamnguqua` (new, on the Tet table);
  - `pr-xmastree` and `pr-eggs` (Easter);
  - `pr-starlantern` (Mid-Autumn) and `pr-lantern` (round silk lantern).
- **Drawing:** the festival decorations are merged into 12 m patches under a draw and triangle budget (PERF-003). So a prop's own geometry, with its colours, joins that same merge in place of the code parts (`js/festivals.ts`):
  - the draws stay the same;
  - the code parts stay as the fallback;
  - the lanterns join the glow mesh, so they still light up at night.
- **Small change in `js/gfx.ts`:** `merge()` keeps a part's own corner colours when the part has no colour.
- **Not done:** the stall food on the market counters. It is drawn as our 2D art pictures (sprites), which the brief keeps as 2D.

## Checks

- **Results (6 Nov AEDT):**
  - Pass (last run after the final models): `worldplaces` (102 models and the 8 festival props), `perf` (village 294 draws, 600k triangles), `festivals`, `flyaudit`.
  - Pass earlier the same day: `types`, `boot`, `perf` (village 293 draws), `startup`, `battery`, `worldplacement`, `stalls`, `regions`, `festivals`, `ownerfestplacement`, `spawnview`, `flyaudit`.
  - `startup` passes, but the first download is 1033 KB against the brief's 1025 KB (the tag helpers in `js/gfx.ts`).
  - `solid` fails on `sing4`, the same on `origin/integrate/v108` (not caused by this work).
- `worldplaces` (new, `tests/world-places.mts`, at the end of `tests/run.mts`): It checks that:
  - all 60 models in the valley at the start stand on the ground, at the code shape's size and facing, inside its footprint, one draw each;
  - the The Huc bridge and the market gate can be walked through;
  - a blocked model keeps its code shape;
  - every model is in the offline list.
- The other checks are in the report after the last part.

## Owner's decisions / assumed

- Assumed (owner can change): the long tail of landmarks is the code shape remade in Blender (same shapes, softer and rounder). Only the brief's famous places are drawn fully by hand.
