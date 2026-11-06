**ready for Release** (6 Nov 2026 AEDT): branch `work/v108g-props`; 22 props remade in Blender; checks below (stalls red, not from this branch).

# v1.08g helper: story and street props (status)

Branch `work/v108g-props` (from `origin/integrate/v108` at `6fc7bf1e5`). Started 6 Nov 2026 AEDT. Brief:
`docs/cores/tasks/v108g/README.md` (and `docs/cores/tasks/v108e/README.md`).

## Owner's decisions (6 Nov 2026 AEDT, pop-up)

- Plan: go, as written below.
- The five Vietnamese market stalls are remade as new hand-drawn picture-book stalls (replacing the v1.08e rounded-off
  code shapes), same footprint and facing.
- The food on the stall counters and in the hawkers' baskets becomes small 3D food models near the child; the 2D
  pictures stay as the fallback and in the bag and menus.

- (6 Nov 2026 AEDT, pop-up, in this chat) The dragons and birds made really beautiful in Blender: both the v1.08e models
  (Little Dragon, crane, peacock, penguin, emu, chicken) remade with more detail, and the 2D flocks (little hens, ducks,
  flying birds, fish) made as Blender models, one InstancedMesh per kind. After the props, on a new branch
  `work/v108g-creatures`; Release merges it separately.

## Plan

Models `models/world/pp-*.glb`, made by `tools/blender/world-props.py`:
1. Story, Ha Noi (`js/content/chapter2props.ts`): star lantern, stone turtle with stele, lion-dance head, mooncakes,
   the red The Huc bridge (film). Glow parts and rail points stay code.
2. Story, Sydney (`js/content/chapter3props.ts`): ferry, gum tree, koala, the film's Opera House and Harbour Bridge.
   The sail light show stays code.
3. Hawkers' shoulder poles (`js/hawkers.ts`, Co Thu in `js/regions.ts`): six pole-and-basket sets with their goods.
4. Vendors' stalls (`js/regions.ts`): five Vietnamese stalls and Uncle Robbo's sausage sizzle stand.
5. Snacks: one small 3D food per item sold, on the counters and in the baskets, one InstancedMesh per food.

Checks, one at a time: story, perf, battery, solid, worldplaces, types, stalls, regions, startup.

## What changed

- `tools/blender/world-props.py` (new): 21 new picture-book models, `models/world/pp-*.glb`, 19 to 86 KB each, 2,200 to
  7,900 triangles (the stalls and the film bridge are the largest). `tools/make-props.mts` makes and packs them (meshopt);
  `tools/blender/props-look.py` draws a quick look.
  - Story, Ha Noi: `pp-starlantern` (the stick and the star's bamboo frame; the paper star stays the game's, with its
    colour and glow), `pp-stoneturtle`, `pp-lionhead`, `pp-mooncakes`, `pp-thehuc` (film).
  - Story, Sydney: `pp-ferry`, `pp-gumtree`, `pp-koala`, `pp-harbourbridge` (film). The film's Opera House uses the
    valley's `lm-opera` (the same code shape).
  - Street: `pp-pole-traicay`, `-tauhu`, `-bunoc`, `-bunrieu`, `-banhda`, `-cothu` (the poles with their goods in 3D),
    `pp-stall-bahai`, `-olai`, `-chunam`, `-chutam`, `-cout` (the stalls with their food on the counter), `pp-sizzle`.
- `js/content/propmodel.ts` (new, in `sw.ts` FILES): `propModel(fallback, name, now)`: worldTag near the child, or the
  model at once in a film.
- Swap-ins: `js/content/chapter2props.ts`, `chapter3props.ts` (the gum tree is drawn at size 1 and scaled, so its model
  takes the same size), `chapter2films.ts`, `chapter3films.ts` (films ask for the models at once), `chapter2hanoi.ts`
  (the golden turtle keeps its code shape and gold), `js/hawkers.ts`, `js/regions.ts` (the five stalls now tagged
  `pp-stall-<seller>` instead of the v1.08e `st-<shape>`; Co Thu's pole; the sizzle). The 2D food pictures ride on the
  code shapes, so they go when the model comes and stay as the fallback.
- No change to `js/modelkit.ts` and none to the festival helper's files.
- New check `propsfit` (`tests/props-fit.mts`, in `tests/run.mts`): every prop's model within 20 % of its code shape's box
  on every side, at its height, turned its way.
- Pictures: `tests/props-shots.mts` -> `docs/world-models-v108g/props/` (market, hawker, sizzle, hanoi, sydney, bridges;
  phone 390x844, tablet 820x1180, computer 1280x800; before and after). The story props are shown on a test spot in the
  valley (in the game they stand in chapter places and films, which a picture cannot reach without playing the story).

## Checks (6 Nov 2026 AEDT, `suite.mts --jobs 1 --only ...`, one at a time)

| Check | Result |
|---|---|
| propsfit (new) | pass (22 models) |
| story | pass |
| perf | pass (home 167 draws, village 286) |
| battery | pass |
| solid | pass |
| worldplaces | pass |
| types | pass |
| regions | pass |
| startup | pass, first start 1047 KB (base 1043 to 1046 KB; this branch adds about 0.7 KB of source to `regions.ts` and `hawkers.ts`; the brief's 1025 KB was already passed before this branch) |
| stalls | **fail, not from this branch**: Melbourne kiosk `k_dimsim` 0.6 m from a road (`js/cities.ts`); the same fail with this branch's game files put back to `integrate/v108` |

## Assumed

- The v1.08e `st-*` models of the five Vietnamese stalls are no longer used by them (the files stay; the other markets'
  stalls still use theirs).
- The film's coloured sail lights sit on the code sails; the `lm-opera` model's sails may not match them exactly.
