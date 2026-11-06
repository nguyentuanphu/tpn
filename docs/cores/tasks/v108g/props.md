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

## Progress

- Started.
