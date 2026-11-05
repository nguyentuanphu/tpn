# v1.08b story: status (story helper, started 5 Nov 2026 1:27 pm AEDT)

Branch `work/v108b-story` from `origin/integrate/v108`. Brief: `story-brief.md`.

## Plan (owner's go given; ordered so the parts other helpers need come first)
1. **Release calendar data** `js/content/releasecal.ts` (+ generated `releasecal-items.ts`, `tools/make-releasecal.mts`): every held-back game (111) and story (66) placed in a week from Mon 16 Nov 2026 to Mon 21 Jun 2027 (about 3.5 games and 2 stories a week, areas mixed), plus the new chapters on fixed days. The owner's drags are kept in the live content section `releaseCalendar` (`{ moves: { "game:id": "YYYY-MM-DD" } }`, cleaned in `netlify/lib/live.mts`). An item opens for everyone on its day (testers 7 days early); unlock-by-playing stays. Shared with the platform helper's Studio Releases timeline (agreed by message, 5 Nov).
2. **Coming soon tile** says what opens next week.
3. **Pad calendar tab** renamed "Lịch: Lễ hội và Có gì mới": a per-festival timeline with days left and fly-to, then This week's new things, Opens next week, Ending soon. Grown-ups "What's new" card; Saturday push text from the calendar.
4. **Install gift**: Home hat, 100 coins, a sticker, once per device when first run installed; the Grown-ups install chip mentions it.
5. **Website**: strip under the hero and a Calendar part inside Discover, from the same data.
6. **Lantern chapters 4, 5 and Finale** with dates 4 Dec 2026, 8 Jan 2027, 6 Feb 2027 (Tết), under-5 paths, festival films, keepsakes.
7. **Tale costumes check** `talecostume` and film smoothing in `js/film.ts`.
8. **Blender** costume kit, redrawn story pages and five Blender films: Blender is not installed in this container; done last if time allows, otherwise left for a later round (said in the report).

## Shared files touched (small edits)
- `js/custom.ts`: `releaseCalendar` added to `LIVE_SECTIONS`; `earlyDays()` exported.
- `js/content/secondset.ts`: `calDue()`; held items open on their calendar day.
- `js/content/unlocks.ts`: an item whose calendar day came is open without the 3-finish wait.
- `netlify/lib/live.mts`: `releaseCalendar` section and its cleaner; `tests/unit/live-content.test.mts` covers it.

## Progress notes
