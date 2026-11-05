# v1.08e creatures: status

**In progress** (5 Nov 2026 AEDT). Branch `work/v108e-creatures` from `origin/integrate/v108`.

## Every creature the code draws

| Creature | id (model) | Drawn by | Where it shows (copies) |
|---|---|---|---|
| puppy, kitty, bunny, panda, joey, calf | `creature-<kind>` | `js/animals.ts` `animalModel` | the child's pets (`js/pets.ts`, up to 2 per child, at home and the yard), farm animals (`js/farm.ts`), Lotus Village (`js/lotus.ts`, the village dog) |
| cow, sheep, pig, chicken, unicorn | `creature-<kind>` | `js/animals.ts` | farm animals (`js/farm.ts`, one per animal bought), hutch bunny, Lotus hens (`js/lotus.ts`, with `js/animalhomes.ts` coop) |
| bear, koala, platypus, penguin, emu, turtle, elephant, crane, bull, buffalo, peacock | `creature-<kind>` | `js/animals.ts` | regional symbols (`js/symbols.ts`, one each), Lotus Village (`js/lotus.ts`, the buffalo cart), Vietnam fun (`js/vnfun.ts`) |
| firefly (Lấp Lánh), baby dragon (Rồng con) | `creature-firefly`, `creature-dragon` | `js/companion.ts` | the child's companion, one per child |
| little hens, ducks, birds, fish (pictures) | stay as they are | `world.critters` sprites (`js/world.ts`, `js/animalhomes.ts`) | flocks: stay sprites (brief point 4) |
| animals in story films | stay code shapes | `js/content/films/kit.ts` `filmAnimal` | films keep the code shapes this round |

## Progress notes

- 5 Nov 2026 AEDT: `tools/blender/creatures-dump.mts` reads every creature's parts from the game's own code into `tools/blender/creatures-spec.json` (22 animals, 2 companions), so the Blender models match place, size and facing.

## Owner's decisions

- 6 Nov 2026 AEDT (pop-ups, via Release): the go for v1.08e; models load near the child; code shapes stay as the fallback.
