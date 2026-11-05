# v1.08b story: status (story helper, started 5 Nov 2026 1:27 pm AEDT)

**ready for Release** (parts 1 to 7 done; the Blender parts are left, see "Not done").

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

## What was built
- **Release calendar** `js/content/releasecal-core.ts` + `releasecal-items.ts` (each item's day, the only part read at start), `releasecal.ts` (names, what's new; for the screens, Studio, the website and the server) and `releasecal-names.ts` (names, loaded when a calendar is shown); the pad's what's-new parts and the Grown-ups card are `js/ui/calendar-news.ts`, loaded on first show, made by `tools/make-releasecal.mts`. 111 games and 66 stories from Mon 16 Nov 2026 to Mon 21 Jun 2027 (about 3.5 games and 2 stories a week, areas mixed); chapter 4 on 4 Dec 2026, chapter 5 on 8 Jan 2027, the finale on 6 Feb 2027. Owner's moves: live content `releaseCalendar.moves`. An item opens for everyone on its day (testers 7 days early), with no 3-win wait; with New games or New stories on, unlock by playing still works.
- **Coming soon tile** (Play hub and story shelves): "Next week: 2 new games" / "Tuần sau: 2 trò mới".
- **Pad calendar tab** renamed "Calendar: festivals and what's new / Lịch: Lễ hội và Có gì mới" (pad, Play hub tab, Simple screen's calendar): per festival a timeline (decorations, hunt, day, festival game then back next year, adventures) with dates and days left; a step that is on flies the child there (`G.festivals.goTo`); then This week's new things, Opens next week (or the next ones coming), Ending soon.
- **Grown-ups "What's new" card** (this week, next week, ending soon); no push for endings. **Saturday push** "Tuần này có gì mới" written from the calendar when Studio set no text (`netlify/lib/push.mts calendarNews`).
- **Install gift** `js/installgift.ts`: running installed (display mode standalone), each child gets once the Home hat (`homehat`, drawn in `js/avatar.ts`, a reward hat in the Backpack), 100 coins and a sticker, told in a reward card and a spoken line (EN, VI). Grown-ups' install chip: "Install on the home screen to play faster, play offline, and get a gift for your child". Nothing asks a child to install.
- **Website** `home/whatsnew.ts`: strip under the hero (Happening now, New this week, Coming up) and a Calendar part in Discover (festivals, new lantern chapters, new games and stories by week, festival games and when they come back), from the same calendar and the page's festival dates; four destinations unchanged.
- **Lantern chapters 4, 5 and the finale** (`js/content/chapter4.ts`, `chapter5.ts`, `chapterfinale.ts`, shared `chapterkit.ts`, films `kitfilms.ts`; `js/lanterns.ts` loads each after the chapter before's lantern is found and only on its calendar day). Each: lantern lights, a talk (big kids), a game (an under-5's own game), a tale, three hiding spots (an under-5's companion leads), the rope, a festival film (two pages, the child starts the fireworks), the place lit, a keepsake (`lantern_ch4`, `lantern_ch5`, `lantern_finale` in `js/myhouse.ts`) and a new trick. Huế is told, not visited (it has no place on the map; the map is not moved). Studio switches `story_ch4`, `story_ch5`, `story_finale` (on).
- **Tale films in period dress**: every T-shirt in the folk-tale films is now a tunic, the Magic Pudding sailor wears an akubra; no friend, child or companion inside a tale (check `talecostume`).
- **Smoother films** (`js/film.ts`): a soft fade between scenes and drifting motes of light (dust by day, fireflies at night); camera moves were already eased. Not calm mode.
- **Voices**: recorded with Azure (HoaiMy, Natasha): 237 new files (all lines missing on the branch, mine included); the tool also removed 136 old all-English files of mixed lines, as it does.

## Not done (left for a later round)
- **Blender** costume kit, redrawn story pages and the five Blender films: Blender is not installed in this container (the friends helper downloads its own). The in-game films got the period dress and smoothing instead.
- Lips that follow the voice and depth blur in films; soft light by time of day beyond what `storyLook` already does.

## Owner's decisions
- (assumed, owner can change) Release calendar start Mon 16 Nov 2026, 32 weeks; chapter 5 on Fri 8 Jan 2027; the finale on Tết, Sat 6 Feb 2027.
- (assumed, owner can change) The website's Calendar part sits inside Discover after the "start here" cards (the festival overview is on the Guides page).

## Shared files touched (small edits)
- `js/custom.ts`: `releaseCalendar` added to `LIVE_SECTIONS`; `earlyDays()` exported.
- `js/content/secondset.ts`: `calDue()`; held items open on their calendar day.
- `js/content/unlocks.ts`: an item whose calendar day came is open without the 3-finish wait.
- `netlify/lib/live.mts`: `releaseCalendar` section and its cleaner; `tests/unit/live-content.test.mts` covers it.
- `netlify/lib/push.mts`: Saturday's text from the calendar when Studio set none.
- `js/ui/hub.ts`, `js/learn.ts`: the Coming soon teaser; hub tab label "Calendar".
- `js/ui/pad.ts`, `js/ui/festivals-ui.ts`, `js/festivals.ts` (`goTo`), `js/ui-settings.ts` (What's new card), `js/install.ts` (chip text), `js/main.ts` (mounts the gift), `js/data.ts` and `js/avatar.ts` (Home hat), `js/lanterns.ts` (later chapters, calendar gate, `mods` for checks), `js/content/releases.ts`, `js/myhouse.ts`, `js/film.ts`, `js/content/films*.ts` (dress), `home/site.ts`, `css/style.css`, `tools/lang-allow.json` (three names), `index.html` (preload list), `tests/run.mts` (new checks at the end).

## Progress notes

### Checks, 5 Nov 2026 AEDT (helper machine; `--changed` asks for the full suite because `.gitignore` changed, so the checks covering the change were run with `--only`, one run at a time)
Pass: unit (520), types, emoji, noemoji, bilingual, names, arch, rules, preload, enwords, contentpair, boot, phone, contract, festcal, chapter3, website, voicepack, films (SAMPLE), perf (alone), and the new releasecalendar, calendartab, websitenews, installgift, talecostume, chapter4, chapter5, finale.
**Fail: startup** (PERF-001 firstKB): 1075-1077 KB against 1071 (1040 + 3 %). `origin/integrate/v108` itself measures 1069 KB on the same machine (passes by 2 KB), so this branch adds about 6-8 KB at start (the calendar's days, the calendar tab's timeline, the chapters' release switches and keepsakes). Everything else was moved out of the start (names, what's new, install gift). The platform helper's lighter start (firstKB under 1030) makes room for it; if it is still over after merging, Release can move `js/ui/festivals-ui.ts`'s timeline behind the tab too.
Not run here: voicearea, roundvariety (their files changed only through the voice pack), the full suite (Release runs one for everyone).

### Calendar redesign (owner, 5 Nov 2026 AEDT: "too long")
One compact row per festival (picture, name, date, one status chip such as "Hunt until 8 Nov" / "Săn đồ đến 8/11", "Decorations from 4 Dec"), a thin bar with a dot per step and a red mark for today; tap a row for its steps (picture, start - end, days left; "Back next year" only there), one open at a time; the festival on now first; next 4, then "See more". The new-things lines show only when they have something, as one line of picture chips. Screenshots: `docs/cores/tasks/v108b/story-shots/cal2-*.png` (phone, phone sideways, tablet, computer, a row opened). Checks: calendartab (rewritten for the compact layout: one chip and a bar per row, details on tap, one open, See more, no "Nothing" lines, 16 px, 44 px, no sideways scroll on five screens), festcal, emoji, types pass.
