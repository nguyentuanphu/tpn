# v1.08e places: status

Branch `work/v108e-places` (from `origin/integrate/v108`). Brief: `places-brief.md`.

## Now (6 Nov 2026 AEDT)

- Parts 1 to 3 done: the landmarks and bridges, the homes, shops and stalls, and the festival and food props.
- The owner asked for more refinement and a better Opera House (6 Nov). Done so far:
  - **The Opera House is rebuilt:**
    - nested pointed-arch shells in two rows (the Concert Hall and the theatre), each opening onto bronze glass walls;
    - one shell turned back over the foyer in each row;
    - the Bennelong restaurant shells;
    - the granite podium with its broad stairs.
  - **Ben Thanh is rebuilt:**
    - the long hipped tile roof and the corner pavilions;
    - pilasters and arched windows;
    - the pedimented gate with columns, and the clock tower with hour marks.
  - **The One Pillar Pagoda's dragons** now curl up to the moon pearl.
  - **Every model** has soft shading (ambient occlusion) baked into its corner colours.

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

- `worldplaces` (new, `tests/world-places.mts`, at the end of `tests/run.mts`): pass (6 Nov, 02:25 AEDT). It checks that:
  - all 60 models in the valley at the start stand on the ground, at the code shape's size and facing, inside its footprint, one draw each;
  - the The Huc bridge and the market gate can be walked through;
  - a blocked model keeps its code shape;
  - every model is in the offline list.
- The other checks are in the report after the last part.

## Owner's decisions / assumed

- Assumed (owner can change): the long tail of landmarks is the code shape remade in Blender (same shapes, softer and rounder). Only the brief's famous places are drawn fully by hand.
