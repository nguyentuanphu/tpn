# v1.08d helper: polish (status)

Branch `work/v108d-polish` (from `origin/integrate/v108`). Brief: `polish-brief.md`. Times in AEDT.

## Plan (5 Nov 2026, 9:00 pm AEDT; the owner's go is given)

1. **Part 1, the friends' leftovers:** each friend's quest of three steps and the item in the hand earned from it; shop
   shoes on the friend models; Studio's "kind" (Vietnamese or Australian) for villagers; crowds at the new heights.
   Checks `friendmodel`, `wearfit`, `friendoutfits`, `studio`, `perf`, new `frienditems`.
2. **Part 2, the games' leftovers:** hands-on bánh chưng wrapping for Tết and a maze builder for the thinking corner.
   Checks: the games' checks, `gamefit`, `fivescreens`.
3. **Part 3, small leftovers:** remove the 136 old mixed-line voice files; re-record the two empty Vietnamese files.
   Checks `voicearea`, `voicecover`, `voicepack`, `voiceopus`.

No places are moved on the map in any part (each quest step uses a place that already stands in the valley).

## Part 1: the friends' leftovers

### What changed
- **The friends' models** (`models/*.glb`, rebuilt with `node tools/make-friends.mts`, Blender 4.2.9 and gltfpack 0.20):
  the item in the hand (Finn's compass, Sol's sun crystal, Clara's flower staff, Lumi's star lantern) and the boots are
  parts of their own now (`tools/blender/lumi-rig.py` `lighten()`: `item` and `shoes`; `tools/blender/game-light.py`:
  budgets body 3,000, item 350, shoes 250, so the triangles shown stay as before). Sizes 94, 94, 95, 116 KB.
- **Quests** (`js/content/friendquests.ts` data, `js/friendquest.ts` runtime, `js/art/frienditems.ts` four drawings):
  each friend has three steps at places that already stand in the valley; a sparkle beside the place shows the step the
  child is on; a tap plays the host's line; the third step gives the item (reward card with its drawing, spoken line).
  The quest of the friend the child plays as is a side story on the Adventures page ("Follow" puts its step on the goal
  bar). Loaded after the start (`js/main.ts`, one line), not in the first download.
  - Finn: Ông Cú, the Lotus Statue, the bus stop. Sol: Bác Ba's farm, the music corner, the school (Cô Tam).
    Clara: Cô Mai's market, the art corner, Bác Ba's farm. Lumi: Tèo, Tí, the Lotus Statue.
  - Saved in `profile.friendQuest` (steps done per friend) and `look.fitems` (the friends whose item is earned, one
    string, so online friends see the item too).
- **The model carries its item only once earned** (`js/friend-model.ts` `attachFriendModel(..., { item, shoes })`,
  `js/avatar.ts` passes it from `look.fitems`). Until then the hand is empty.
- **Shop shoes on the models:** with shoes from the shop worn, the model's boots are hidden and the code person's shop
  shoes stay on the model's feet (sneakers, sandals, rain boots); otherwise the model's own boots show.
- **Studio** (`studio/ui/app.ts`, map page, villager form): a "Kind" choice, Vietnamese or Australian, beside Age;
  choosing it dresses the villager in that kind's everyday clothes and hair (Vietnamese: áo dài, black long hair;
  Australian: shirt, light brown short hair), which can then be changed one by one. Saved as `look.kind`.
- **Crowds at the new heights** (WORLD-011): `crowdLook()` in `js/avatar.ts` gives a crowd grown-up 2.0, a grandparent
  (grey or white hair) 1.8 and a child 1.6, as the named villagers. Used in the cities, homes, regions, Asia, heritage
  games, hawkers, the village festival crowd, the folk show, children playing (`js/vnfun.ts`) and the town's juice
  seller. Children are no longer shrunk by hand (.78, .8). Left as they were: the town's seated card players (their
  seat pose is made for the old size), riders in traffic (their seats), films and story chapters.

### Shared files (small edits)
`js/main.ts` (one lazy load, one type line), `js/main/quests.ts` (follow `fq`, side stories list), `js/ui/pad.ts`
(`sd.title(p)`), `js/avatar.ts` (`crowdLook`, item and shoes passed to the model), the crowd files above (one call
each), `tests/checks/play.mts` (the new check at the end, one marked block), `.gitignore` (the built files).

### Checks (5 Nov 2026 AEDT)
- New `frienditems`: pass (three steps at places in the valley, followed on the goal bar; the item shows only after the
  third; another friend's item stays hidden; shop shoes replace the boots; 7 parts drawn with the item).
- `types`, `friendmodel` (94, 94, 95, 116 KB; 7,901 / 7,884 / 7,886 / 13,744 triangles shown in 6 parts), `wearfit`,
  `friendoutfits`, `preload`, `emoji`, `noemoji`, `arch`, `names`, `bilingual`: pass.
- `studio`, `perf`: see the progress notes.

## Owner's decisions
- 5 Nov 2026 AEDT (owner, via Release): "everything that you say left for later round"; the go is given.

## Progress notes
