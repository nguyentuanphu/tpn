# v1.08d s2au (Season 2, Australia): status

**ready for Release** (parts 1 to 3 done, 5 Nov 2026 AEDT; started 5 Nov 2026 AEDT). Branch `work/v108d-s2au` from `origin/integrate/v108`. Brief: `s2au-brief.md`.

## Plan (owner's go given)

Three regions, one part each, pushed after each: Great Barrier Reef, Tasmania, Perth and Rottnest Island.

**Shared frame (built in part 1, used by all three):**
- **Map** (`js/content/map.ts`, one block marked `(v1.08d s2au)`): new places only, nothing moved. The three regions are
  on the southern coast of the west (Australian) bank: the reef on the beach east of the Twelve Apostles, Tasmania an
  island in the sea south of the Apostles, Perth on the beach in the far south-west with Rottnest Island off its coast.
  The two islands are raised out of the sea by a small `ISLES` list read by `heightAt` (`js/world/ground.ts`, one block).
- **Getting there:** the Southern Coast Boat (`BOATS`, `js/ferry.ts` learns boats with more than two piers): from a
  pier on the Murray by Melbourne, down the river and along the coast to the reef, Tasmania, Perth and Rottnest; the
  child chooses the stop. Flying: each region is a place on the Pad map (G.PLACES) once it is open.
- **Loading:** nothing of the regions is in the first download except the map data, the release days and the three
  foods' names. `js/s2au.ts` is loaded 2 s after the start (map pins, game stands, the boat stops' names);
  `js/s2au-region.ts` builds a region's landmark, friend, food stand and decorations when a child comes within 90 m.
- **Release calendar** (`js/content/releasecal-core.ts` and `releasecal.ts`, one block each): a region opens with its
  friend, food and three games on its day; before it a sign says when. Its chapter has its own day.
- **Games:** one engine, `js/games/s2au.ts`, on the maths kit's rounds (levels Easy to Talent, under-5s Easy), three
  kinds: *hunt* (tap every animal of one kind in a scene: counting reef fish, spotting devils, photographing quokkas),
  *path* (tap the squares that make the way: the turtle to the sea, the wombat's burrow, the boat on the Swan River)
  and *quiz* (a picture question). Words in `js/content/s2au-games.ts` (EN and VI, recorded); drawings in
  `js/art/s2au.ts`; How to play (the guide film) in `js/games/s2au-meta.ts`. Each game's place is a stand in its
  region and its host is the region's friend.
- **Chapters 10 to 12** (`js/content/chapter10.ts` ... `chapter12.ts`, the story helper's `chapterkit.ts`; festival
  films in `js/content/s2aufilms.ts`; `js/lanterns.ts` LATER, one block). Each: lantern lights, a talk (big kids), a game
  (an under-5's own game), three hiding spots (the companion leads an under-5), the rope, the festival film, the place
  lit, a keepsake and a trick. Chapter 10 follows s2vn's chapter 9 (its find step `c9_find`).
- **Checks:** new `s2au` (places on open ground, the boat reaches every stop, the regions build when visited, games
  hidden before their day), `s2aureef`, `s2autas`, `s2auperth` (each region's three games won at Easy and Talent, one
  screen on five sizes), `chapter10`, `chapter11`, `chapter12`; plus `releasecalendar`, `voicecover`, `solid`, `perf`,
  `startup`, `emoji`, `types`.

**The three regions:**

| Region | Place | Landmark | Friend | Food | Games | Chapter |
|---|---|---|---|---|---|---|
| Great Barrier Reef | beach and reef pontoon | the reef pontoon with coral | Mia, the reef ranger | grilled prawns | Snorkel Spotter (hunt; the old Reef Count already counts fish), Turtle to the Sea (path), Reef Friends (quiz) | 10 |
| Tasmania | the island | Cradle Mountain and the boatshed | Ollie, the bushwalker | apple crumble | Wombat Burrow (path), Spot the Devil (hunt), Cradle Mountain Walk (quiz) | 11 |
| Perth and Rottnest | the beach, the Swan River, Rottnest Island | the lighthouse on Rottnest (Wadjemup) | Ava, the island cyclist | fish and chips | Quokka Photo Hunt (hunt), Swan River Row (path), Beach Day (quiz) | 12 |

**Dates (assumed, owner can change; for s2vn to agree):** regions open Fri 26 Feb, Fri 26 Mar and Fri 23 Apr 2027
(`feature:s2au_gbr`, `feature:s2au_tas`, `feature:s2au_perth`; each region's games follow its day through
`CAL_LINKS`, so moving a region in Studio moves its games),
between s2vn's monthly regions (Mekong 12 Feb, Hạ Long 12 Mar, Sapa 9 Apr, Tây Nguyên 7 May), so one region opens
every two weeks. Chapters 10, 11 and 12 follow chapter 9: Fri 21 May, 4 Jun and 18 Jun 2027.

**First Nations care:** the reef and Rottnest are named with their Traditional Owners' care told plainly (no invented
stories); the art style is the one already agreed.

## Places added (not moved)

None of the existing places move. New (`js/content/map.ts`, x east, z south):

| New place | Where | Why there |
|---|---|---|
| `gbr` (the reef beach) | (-58, 177), r 7; the reef and its pontoon in the sea at (-58, 213) | the beach between the Murray and the sea, east of the Apostles |
| `tasmania` (island, `ISLES`) | (-132, 222), 30 by 13 m, Cradle Mountain peak 9 m at (-148, 226) | the sea south of the Apostles, as Tasmania is south of Victoria |
| `perth` (beach) | (-204, 177), r 9 | the far south-west beach, Perth being on the west coast |
| `rottnest` (island, `ISLES`) | (-214, 222), 12 by 8 m | off Perth's beach |
| Swan River pond (`WATERS` 'swan') | (-222, 168), r 6 | beside Perth |
| Southern Coast Boat (`BOATS` 'coastboat') | piers: Melbourne's river pier (-122, 145), reef (-58, 184), Tasmania (-120, 211), Perth (-204, 186), Rottnest (-210, 216) | from Melbourne down the Murray and the main river to the sea, then west along the coast |

## Owner's decisions
- (assumed, owner can change) The three regions sit on the southern coast of the Australian bank, reached by one coast
  boat from Melbourne's river pier and by flying.
- (assumed, owner can change) The dates above.

## Progress notes

### Parts 1 to 3, 5 Nov 2026 AEDT (helper machine; `--changed` asks for the full suite, so the checks covering the change were run with `--only` / `run.mts`, one run at a time)
- Part 1 (frame and the Great Barrier Reef), part 2 (Tasmania), part 3 (Perth and Rottnest Island) each pushed when done.
- **Pass:** s2au, s2aureef, s2autas, s2auperth, chapter10, chapter11, chapter12, types, emoji, noemoji, bilingual, names,
  arch, rules, preload, enwords, voicecover, releasecalendar, calendartab, festcal, contentpair, boot and contract (each
  passed alone; beside two other checks they timed out on a click), startup (first start 1064 KB, under the limit:
  Season 2 is not in the first download), perf (alone).
- **Fail, also on `origin/integrate/v108` (not this branch):** `solid` "desktop and phone maps differ" (base 44492 vs
  44496 cells, this branch 44537 vs 44541: the same 4-cell gap; the 45 more cells on both are the coast boat's piers);
  `phone` (a click times out the same way on the base); `unit` (two tests need the `pg` package, not in this container).
- **Voices:** recorded with Azure (HoaiMy, Natasha): 300 new files (the regions' friends, foods, landmarks, the nine
  games, chapters 10 to 12, and lines that were missing on the base), with Opus copies; the pack maker removed 136 old
  all-English mixed-line files, as it does.
- **Screenshots looked at:** each game on phone, phone sideways, tablet and computer (`tests/out/s2au/`), the reef,
  Tasmania and Perth in the valley. On a wide screen the answers sit beside the picture.

## Shared files touched (small edits, each marked `(v1.08d s2au)`)
`js/content/map.ts` (places, `ISLES`, the Swan pond, the coast boat), `js/world/ground.ts` (islands in `heightAt`),
`js/ferry.ts` (a boat with more than two piers), `js/content/releasecal-core.ts` (days and `CAL_LINKS`; `openDate`
and `inCalendar` follow a link), `js/content/releasecal.ts` (three region items, three chapter items; an owner's move of
a fixed game keeps its name), `js/content/activities.ts` (`GAME_INFO`; a Season 2 game is hidden until its region's
day), `js/games/catalog.ts`, `js/art/games108.ts` (the drawings load after the start), `js/data.ts` (three foods in
FEAST), `js/myhouse.ts` (three keepsakes), `js/lanterns.ts` (LATER: ch10 after `c9_find`, ch11, ch12), `js/main.ts`
(one line: `js/s2au.ts` 2 s after the start), `tests/run.mts`, `tests/story-v108b.mts` (`chapterKitCheck` takes the
chapters before as an argument).

## For s2vn (agree through the status files)
- Chapter 10 starts when chapter 9's lantern is found (`c9_find`) and is placed after `ch9` in `CHAPTERS`. If s2vn's
  last find step has another id, change the one line in `js/lanterns.ts` LATER `ch10`.
- Dates: Vietnamese regions 12 Feb, 12 Mar, 9 Apr, 7 May 2027 assumed; ours two weeks after each; chapters 10 to 12
  on 21 May, 4 Jun, 18 Jun 2027.

## Left for later
- The games are on one engine (hunt, path, quiz); richer hands-on versions (swimming the snorkel, digging the burrow)
  could follow.
- Huế-style "told, not visited" was not needed: all three regions stand on the map.
