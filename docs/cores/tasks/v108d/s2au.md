# v1.08d s2au (Season 2, Australia): status

**In progress** (started 5 Nov 2026 AEDT). Branch `work/v108d-s2au` from `origin/integrate/v108`. Brief: `s2au-brief.md`.

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
| Great Barrier Reef | beach and reef pontoon | the reef pontoon with coral | Mia, the reef ranger | grilled prawns | Snorkel Spotter (hunt), Turtle to the Sea (path), Reef Friends (quiz) | 10 |
| Tasmania | the island | Cradle Mountain and the boatshed | Ollie, the bushwalker | apple crumble | Wombat Burrow (path), Spot the Devil (hunt), Cradle Mountain Walk (quiz) | 11 |
| Perth and Rottnest | the beach, the Swan River, Rottnest Island | the lighthouse on Rottnest | Ava, the island cyclist | fish and chips | Quokka Photo Hunt (hunt), Swan River Row (path), Beach Day (quiz) | 12 |

**Dates (assumed, owner can change; for s2vn to agree):** regions open Fri 26 Feb, Fri 26 Mar and Fri 23 Apr 2027,
between s2vn's monthly regions (Mekong 12 Feb, Hạ Long 12 Mar, Sapa 9 Apr, Tây Nguyên 7 May), so one region opens
every two weeks. Chapters 10, 11 and 12 follow chapter 9: Fri 21 May, 4 Jun and 18 Jun 2027.

**First Nations care:** the reef and Rottnest are named with their Traditional Owners' care told plainly (no invented
stories); the art style is the one already agreed.

## Places added (not moved)

None of the existing places move. New: `gbr` (the reef beach), `tasmania` (island), `perth` (beach), `rottnest`
(island), the Swan River pond, the coast boat's piers. Positions are in the part notes below.

## Owner's decisions
- (assumed, owner can change) The three regions sit on the southern coast of the Australian bank, reached by one coast
  boat from Melbourne's river pier and by flying.
- (assumed, owner can change) The dates above.

## Progress notes
