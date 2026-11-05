# s2vn status (Season 2, Vietnam)

Branch `work/v108d-s2vn` from `origin/integrate/v108`. Brief: `s2vn-brief.md`. Started 5 Nov 2026, 9:00 pm AEDT.

## Plan

**One shared region kit, then one region per part** (Mekong, Hạ Long, Sapa, Tây Nguyên), each pushed when its checks pass.

**The kit (built in part 1, with the Mekong):**
- `js/content/s2vn.ts`: pure data (no imports, so the voice tool reads it): each region's place, landmark, friend villager and lines, food (a seller for the food passport and a recipe for cooking), bus stop, games, chapter and calendar day.
- `js/s2vn.ts`: loaded 2.5 s after the start (not in the first download). An open region (its calendar day, testers 7 days early) gets a bus stop in the bus's stop list, a place in the fly list (Pad map, Where-is, Simple screen's places) and a place for each of its games. Its 3D area (landmark, friend, seller, game hosts) is built only when a child comes within 140 m or the story needs it: "regions load when visited".
- `js/games/s2vn.ts`: the twelve games on the maths kit (`js/games/maths-kit.ts`): four levels to Talent, under-5s on Easy, every picture drawn in `js/art/s2vn.ts` (loaded after the start with the other new games' pictures).
- `js/games/s2vn-meta.ts`: each game's guide film steps (How to play), EN and VI.
- `js/content/chapter6.ts` to `chapter9.ts`: lantern-story chapters 6 to 9 on the story kit (`js/content/chapterkit.ts`); their festival films in `js/content/s2vnfilms.ts` (written like `kitfilms.ts`, not editing it).
- Checks in `tests/s2vn.mts`: `s2vnregions` (each region: closed before its day, open on it; the bus stop and the fly target land on open ground; landmark, friend, seller, recipe and game hosts present; nothing on a road or in the water), `s2vngames` (every game played at every level, one screen on five sizes), and `chapter6` to `chapter9` (the story kit's own check, extended).

**Regions and places (no existing place moves; each area is a clearing on free ground beside a road, found by scanning the running game):**

| Region | Area centre (x, z) | Reached by | Why there |
|---|---|---|---|
| Chợ nổi miền Tây (Mekong) | (182, 169) | bus to its stop on the Sài Gòn–Vũng Tàu road; fly | south of TP. HCM by the river mouth and the sea |
| Vịnh Hạ Long | (221, 166) | bus to its stop by Vũng Tàu; fly | on the south-east coast: the limestone islands stand in the sea |
| Sapa | (173, -83) | bus to its stop on the Hà Nội road; fly | between Hà Nội and Làng Sen, beside the rice fields |
| Tây Nguyên | (188, 58) | bus to its stop on the Đà Nẵng–TP. HCM road; fly | central Vietnam, between Đà Nẵng and Hội An |

**Release dates (proposed for s2au to stagger with, AEDT, Mondays):**

| Day | Region | Chapter |
|---|---|---|
| 15 Feb 2027 | Mekong (the floating market's Tết, just after Tết on 6 Feb) | ch6 |
| 1 Mar 2027 | (s2au: Great Barrier Reef) | |
| 15 Mar 2027 | Hạ Long Bay | ch7 |
| 29 Mar 2027 | (s2au: Tasmania) | |
| 12 Apr 2027 | Sapa (spring) | ch8 |
| 26 Apr 2027 | (s2au: Perth and Rottnest) | |
| 10 May 2027 | Tây Nguyên (the gong festival) | ch9 |

Chapters 6 to 9 are s2vn's, 10 to 12 s2au's (after ch9, as the brief says). Studio can move every date.

**Games (three per region, area "Going places"):**
- Mekong: Sampan Fruit Seller (`mk_sampan`), The Cây Bẹo Pole (`mk_caybeo`), Floating Market Count (`mk_count`).
- Hạ Long: Find the Hidden Cave (`hl_cave`), Rock Shapes of Hạ Long (`hl_rocks`), Fishing Village Nets (`hl_nets`).
- Sapa: Plant the Rice Terraces (`sp_terrace`), Rice Through the Year (`sp_seasons`), Brocade Patterns (`sp_brocade`).
- Tây Nguyên: Gong Rhythm (`tn_gong`), Build the Nhà Rông (`tn_nharong`), Feed the Elephants (`tn_elephant`).

**Each region's people, food, landmark and chapter:**

| Region | Friend | Seller and food (recipe) | Landmark | Chapter (tale, trick, under-5 game) |
|---|---|---|---|---|
| Mekong | Út Hoa | Cô Bảy, bánh xèo (rice, beans, herbs) | the monkey bridge, boats with the cây bẹo; market boats on the sea | ch6 (vusua, paddle, mk_count) |
| Hạ Long | Hải | Bác Lâm, chả mực (fish, egg) | Hòn Trống Mái in the sea; junks with brown sails | ch7 (rongtien, dive, hl_nets) |
| Sapa | Mỷ | Chị Pao, trứng nướng (egg, herbs) | the rice terraces and a peach tree | ch8 (hoaban, bloom, sp_brocade) |
| Tây Nguyên | Y Đam | Bà H’Linh, cơm lam (rice, leaf) | the nhà rông and a rack of gongs | ch9 (quabau, drum, tn_elephant) |

**Shared files touched (small blocks marked `(v1.08d s2vn)`):** `js/games/catalog.ts`, `js/content/activities.ts`, `js/content/releasecal-core.ts`, `js/content/releasecal.ts`, `js/lanterns.ts` (LATER), `js/myhouse.ts` (keepsakes), `js/art/games108.ts` (imports), `js/main.ts` (one lazy load line and two type fields), `js/main/talks.ts` (a region's friend tells of its own games: `G.hostLineOf`), `js/world/sites.ts` and `js/world.ts` (`EXTRA_REGIONS`, so walking in names the region), `js/content/map.ts` (four CLEARINGS), `js/content/chapterkit.ts` (`PlaceRef.at`, a spot itself), `tests/run.mts`, `tests/story-v108b.mts` (the chapters before ch6 to ch9). `tests/check-map.json` is not touched (made by the full suite).

## Places moved
None so far. New clearings only (listed above).

## Owner's decisions
- Go given (5 Nov 2026 AEDT, Release's brief).

## Progress
