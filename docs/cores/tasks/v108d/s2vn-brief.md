# Helper brief: s2vn (Season 2, Vietnam)

**Owner, 3 and 5 Nov 2026 AEDT:** Season 2 after Tết explores more of Vietnam and Australia, not China Town and India Village. "Proceed".

**Plan:** `docs/plans/v109-extras.md` ("The lantern story to Tết", Season 2) and `docs/cores/STORY.md`. The Australian half is the s2au helper's.

**Regions:**

| Region | Showing |
|---|---|
| Chợ nổi miền Tây | Mekong floating markets |
| Vịnh Hạ Long | Hạ Long Bay |
| Sapa | rice terraces |
| Tây Nguyên | the Central Highlands' gongs |

**Each region gets:**
- **A place on the map:** a small new area, reachable by a vehicle (boat, train, bus) and by flying, on open ground (the quality helper's drop-off rules).
- **A landmark.**
- **A new friend villager** in the new style, with a name and lines in EN and VI.
- **One local food** for the cooking and taste systems.
- **Three games**, each with the full set:
  - levels up to Talent, a guide film, EN and VI with female voices, our own drawings, a place and a host;
  - one screen on all sizes (the five-screen check);
  - a check.
  - For example: rowing a sampan to sell fruit; finding the hidden cave in Hạ Long; planting rice on the terraces; playing a gong rhythm.
- **A lantern-story chapter**, Chapters 6 to 9 after the Tết finale, each with a festival film, a keepsake and an under-5 path, like chapters 1 to 5 (reuse `js/content/chapterkit.ts` and `kitfilms.ts` from the story helper).
- **A link to a real festival or season where it fits:** Tây Nguyên's gong festival, the Mekong's floating-market Tết, Sapa's spring.

**Release dates:** set in the release calendar (`js/content/releasecal*.ts`), from mid-February 2027, about a month apart. Studio can move them. Testers see them 7 days early.

**Parts** (one region per 5-hour window): Mekong, then Hạ Long, then Sapa, then Tây Nguyên. Push after each.

**Checks:** `chapterN` for each new chapter, the games' checks, `releasecalendar`, `voicecover`, `solid`, `perf` in the new area, `startup` (the first download must not grow: regions load when visited).
