**ready for Release** (parts 1 to 4) (6 Nov 2026 AEDT)

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
- `perf` (alone, after the merge of `integrate/v108`): pass (village 306 draws, home 179).
- `studio`: red on this branch (the Simple screen's reading list) and red on the untouched base `integrate/v108` too
  ("the exe did not save into its folder"), so not from this work; the villager form's new Kind choice is not what
  either step checks.

## Part 2: the games' leftovers

### What changed
- New `js/games/handson.ts` (two hands-on games), `js/games/handson-meta.ts` (How to play, read by the guide film),
  `js/art/handson.ts` (the Maze Builder's picture).
- **Wrap the Bánh Chưng** (`fg_tet`, the Tết festival game; same id, so stars and saves stay): was a picture quiz, now
  hands-on: tap the four dong leaves into the square mould, fill it in the real order (sticky rice, mung beans, pork,
  mung beans, sticky rice), fold the leaves over, tie the bamboo string across and down. Easy one cake; Medium adds a
  bowl that does not belong (carrot); Hard two cakes and the bowls move; Talent two wrong bowls, words only, and the
  opposite side must be folded next. Still open only in its season (`festseason.ts`).
- **Maze Builder** (`mazebuild`, thinking corner, age 4, second set): lay stepping stones from the duckling to the mother
  duck, round the rocks; each stone right beside the last; a tap on the last stone takes it back. Easy 4x4 with 3 rocks,
  Medium 5x5 with 6, Hard three 5x5 mazes with 8, Talent 6x6 with 11 and only as many stones as the shortest way needs.
  On a short screen (a phone on its side) the maze is made smaller to fit, never scrolled. Its place in the valley is the
  thinking corner's (Ông Cú, `js/content/gameplace.ts`).
- Shared files: `js/games/catalog.ts` (one entry, one loader; `fg_tet` moved from the quiz loader), `js/games/games108b.ts`
  (skips `fg_tet`), `js/content/activities.ts` (one line), `js/art/games108.ts` (two imports), `tests/checks/play.mts`
  (new check `handson`).
- New spoken lines recorded with Azure (HoaiMy, Natasha): 29 files.

### Checks
- New `handson`: pass (both games won by tapping at Easy, Medium, Hard and Talent; the four levels differ; one screen with
  no scrolling, buttons 44 px or more, text 16 px or more on phone both ways, tablet both ways and computer; pictures in
  `tests/out/handson/`).

## Part 3: small leftovers
- The 136 old mixed-line voice files are removed (the pack maker's Azure run did it while recording the new lines).
- The two empty Vietnamese files `voices/vi/f/2473f892-1b292ac5.mp3` and `e67396f8-2132059d.mp3` are removed: they are
  the Vietnamese parts of mixed lines, which the pack maker no longer lists (those parts are in the reviewed FPT pack,
  `tools/make-voice-pack.mts`: "Do not duplicate Vietnamese fragments in both Azure casts"), so nothing in the game asks
  for them and there is nothing to record. The only other empty file, `05b7dbba-7ca64a0e.mp3`, is the line that is only the chess-piece emoji (a
  picture with no words to say).
- Checks: `voicecover`, `voicepack`, `voicearea` (SAMPLE), `voiceopus`: pass.

## Part 4: added by Release on 5 Nov
- **Học vui on a phone** (`js/learnquest.ts`): the 8 journey rows fold into one row, "Hành trình học / Learning
  journeys" with the steps done (for example 0/72); a tap opens the list. Folded at first on a phone, open on a tablet and
  a computer; the child's open or close is remembered per kind of screen. `learningquests` checks it folded on the phone,
  open on the others, and the rows 44 px or more once open (the check measured hidden rows before; changed on purpose).
- **Calendar** (`js/ui/festivals-ui.ts`): the festival game's step says "Back at <day> / Sẽ quay lại vào <day>" from
  `backOn('fg_' + id)` when the game is out of season (it said "Back next year" every time).
- **Lemonade** (`js/games/money2.ts`): each customer asks for a different number of cups.
- Checks: `hocvui`, `learningquests`, `calendartab`, `festivalgames`, `guides`, `types`, `bilingual`: pass.
  `roundvariety`: the check stops before any game while the harness starts three windows at once (the "New friends are
  here!" card's button does not settle in 30 s here); played one game at a time with `round-variety.mts`, lemonade,
  fg_tet and mazebuild all vary their rounds at every level (0 repeats).

## Base issues seen (not from this branch, for Release)
- `types`: `integrate/v108` itself is over the test-code baseline (play 172, screens 217, voice 38, story-v108b 1 against
  160, 212, 37, 0); this branch adds none.
- `gamefit` (dragonfire on a sideways tablet) and `fivescreens` (cacuangua, chuyen, shapebuilders and others): none of
  them is a game this branch changed.
- `studio` on the base, as above.

## Owner's decisions
- 5 Nov 2026 AEDT (owner, via Release): "everything that you say left for later round"; the go is given.

## Progress notes
- 6 Nov 2026 AEDT: branch `work/v108d-polish`, merged with `origin/integrate/v108`; checks as listed above, each run alone.
