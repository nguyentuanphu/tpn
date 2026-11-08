# v1.08b platform helper: status

**Ready for Release: parts 6 (Studio), 1 (Opus voices), 4 (lighter first download) and 5 (rules audit lines).** Branch `work/v108b-platform` (from `origin/integrate/v108`). Parts 2 and 3 moved to the v1.08c voices helper (Release, 5 Nov 2026 AEDT); not started here.

## Round two (5 Nov 2026 AEDT, after Release asked for parts 1 to 5)

- **Part 1, voices in Opus (done before parts 1 to 3 moved):** `tools/make-voice-opus.mts` makes an Opus copy (mono 18 kbps) beside every MP3; 19,028 recordings, 119 MB against 271 MB of MP3. The manifests say `formats: ["mp3","opus"]` only when every recording of the language has its copy. The game (`js/voice-index.ts` voiceFormatFor, `js/voice.ts`, `js/voicepack.ts`) asks for Opus only when the browser plays it (`canPlayType`), chosen once per device (`sv2_voiceFmt`); a device already keeping MP3 recordings stays on MP3; a missing Opus file falls back to its MP3. `sw.ts` serves `.opus` from the voice store; `netlify.toml` gives `/voices/*.opus` the type audio/ogg. The pack maker runs the Opus step at the end (Azure path too). `tests/harness.mts` seedPlayers keeps the checks' devices on MP3 (those checks test downloading and playing, by `.mp3` address); check `voiceopus` covers Opus. Found: two empty Vietnamese MP3 files (0 bytes since 4 Nov): `voices/vi/f/2473f892-1b292ac5.mp3`, `voices/vi/f/e67396f8-2132059d.mp3`; they need recording again.
- **Part 4, lighter first download:** 1057 -> 1024 KB (check `startup`, tablet speed). The Pad's code (`js/ui/pad.ts` and what only it uses, `js/ui.ts` loadPad) comes when the Pad first opens or 1.5 s after the valley is built; the surprises and the grown-ups' features (`js/main.ts`, no place on the map) are made 2 s after the child can start. Hội làng and the clothes shop stay in the build because they choose places on the map. The "valley builds as the child walks" part (tasks #25, #32, #39, #41) is not done: it needs moving area builders, which changes where things are placed. `startup-baseline.json` firstKB max is left at 1040 for Release to lower once the other branches are in (the friends branch was at 1071).
- **Part 5, open bugs and the rules audit:** the bugs named in the brief are closed except #355 and #341 (both wait on real-device reports and the draw-call memory work) and #36 (on hold); not changed here. Rules audit: the 12 games marked "Simpler, not said" in `docs/rules-audit/README.md` now say how in the last step of their guide (`js/howto-data.ts`, one block at the end), English and Vietnamese, recorded with Azure (HoaiMy and Natasha, 24 files, with Opus copies).
- Not done on purpose: the pack maker's Azure run also wanted to drop 41 English and 172 Vietnamese lines from the voice lists and delete 136 older all-English files of mixed lines (lines it cannot find in this branch's code). That was put back: only the 24 new lines were added. Release may run that clean-up on purpose after merging.

## Plan (5 Nov 2026 AEDT, owner's go given in the round's shared rules)

Order: the owner's newest ask first (part 6, Studio), then the rest of the brief as time allows.

1. Studio speed: each read kept for 3 minutes and shared by every page (memory and `sessionStorage`); the status first, then the family's content and its live sections side by side; pages that never use the content (Home, the reports, the section cards, and online Releases, Sparkle Lab, Tester reports) open without waiting for it; the live switches are read quietly while the first page is looked at.
2. No reload on Back: every page left without unsaved changes is kept as built, with its scroll; Back shows it at once without a network read; one older than 3 minutes is shown at once and rebuilt with fresh data behind it. A save, the language, signing in and Reload drop every kept page and every kept read.
3. Releases redesign: switches grouped by what they are for (Games and stories, Story chapters, Valley features, Little ones and family, Festivals, Money and shop, Tips and explanations, Notifications for grown-ups, Testing and tools); each row a short name, a plain line of what it does for a child, its state at a glance (On / Off / Starts 14 Nov / Ends on 20 Nov (in 15 days) / "New" for 5 days), one tap on the switch; search and filters kept; a Timeline view (what opens and ends each week, plus the release calendar's plan); the Save bar lists every change before saving. EN and VI, phone and computer.
4. Sparkle Lab in three parts: Reports from testers (newest first, fixed or not, version, and the tester switch with its long settings folded under "More settings for testers"), Automatic play (the auto play switch and the nightly robots), Devices (one card per device, as before).
5. Checks: new `studioback`, `studioreleases`, `sparklelab` (`tests/studio-back.mts`), plus the existing Studio checks.

## Shared data with the story helper (release calendar)

The Releases timeline reads the story helper's module `js/content/releasecal.ts` (agreed 5 Nov 2026 AEDT, their message):

```ts
export type CalItem = { key: string; kind: 'game'|'story'|'chapter'|'feature'; id: string; en: string; vi: string; date: string /* the day it opens, YYYY-MM-DD Sydney; the Monday for games and stories */; end?: string; icon?: string };
export const CAL_DEFAULT: CalItem[];
export function calendar(over?: Record<string, string>): CalItem[]; // merges the owner's moves
```

- The owner's moves live in the live content section `releaseCalendar`: `{ moves: { "game:crabwalk": "2026-11-23" } }` (key to the Monday of its new week).
- Studio (this branch): the Timeline view lists every calendar item in its week with a week chooser (a select, easier than dragging on a phone); a move shows in the change list and Save writes `releaseCalendar.moves` with `api('live/content')` online (the exe also saves it in content). An item with a start date saved in Studio (`releases[id].start`) shows by that date instead.
- Story helper: add `releaseCalendar` to `LIVE_SECTIONS` in both `js/custom.ts` and `netlify/lib/live.mts` (with a CLEAN function), or the website will drop the moves. Until `releasecal.ts` exists the timeline shows only saved start and end dates.
- Agreed with the story helper by message (5 Nov 2026 AEDT).

## Measurements (pretend Netlify on this machine, each Studio read delayed 250 ms like a real function and GitHub; `node studio-back.mts --measure`)

| | before | after |
|---|---|---|
| First page (new tab) | 1147 ms, 7 reads one after another | 620 ms, 7 reads |
| First page again in the same tab | 1137 ms, 7 reads | 90 ms, 1 read (in the background) |
| Open Releases | 410 ms | 390 ms |
| Back to Releases from Sparkle Lab | 454 ms, 2 reads, scroll lost (900 to 0) | 50 ms, 0 reads, scroll kept (900) |

Phone numbers are within 10% of these.

## Files changed

- `studio/ui/app.ts`: read cache (`api`, `forgetReads`), `load()` and `CONTENT_P`, kept pages (`KEEP`, `keepShown`, `render`), Releases (`PURPOSE`, `plainOf`, timeline, change list), Sparkle Lab (`labParts`).
- `studio/ui/style.css`: one block at the end marked `(v1.08b platform)`.
- `tests/studio-back.mts` (new), `tests/checks/studio.mts` (three checks at the end), `tests/suite.mts` (one line: `tests/studio-back.mts` maps to its three checks).

## Checks (5 Nov 2026 AEDT)

See "Progress notes" below for the commit and results.

## Left for later (not started in this session)

- Part 1 voices in Opus, part 2 three offline levels, part 3 downloads on demand and festival packs, part 4 light first download and the valley that builds as the child walks, part 5 the open bugs and the rules audit; checks `offlinelevels`, `festivalpack`.
- Studio: the owner's desk pages (Home, People, Work, the management tools) are drawn again on Back instead of kept (they hold their own state with the page they drew); their reads are shared for 3 minutes, so Back to them asks the website nothing new within that time. A page opened by a tap (tab or card) is drawn again from the kept reads; only Back (browser or the arrow button) shows the kept page.
- Studio: the content (`content` read) is kept in memory only, not in `sessionStorage`, on purpose: content pages save the whole content back, and an old copy from another tab could overwrite a newer one.

## Owner's decisions

- 5 Nov 2026 AEDT: Studio redesign added to this helper (Releases and Sparkle Lab easier to understand, Studio fast, no reload on Back).

## Progress notes

- 5 Nov 2026 19:13 AEDT, commit 396e345d1 (studio code unchanged since; this note is the next commit). `suite.mts --changed` asks for the full suite (it compares with `main`, far behind `integrate/v108`), so the checks covering the change ran with `--only`, one at a time:
  - pass: `studio`, `studioback` (new), `studioreleases` (new), `sparklelab` (new), `managementstudio`, `ownerdesk`, `ownerstudiofailures`, `ownerstudiofolds`, `ownerstudioperms`, `types`, `names`, `nostudio`.
  - Fixed on the way (my own changes): `managementstudio` and `studio` were red when the owner's desk pages and pages opened by a tap were kept; `studio` was red on a missing-file error for the calendar module before the story branch is merged; `types` on generic calls.
  - Screenshots looked at: Releases (list and timeline) and Sparkle Lab, phone 390 and computer 1280, EN and VI (`tests/out/studio-*.png`). A tablet screenshot was not taken separately; the `studio` check opens every page at 820 px and checks the 44 px targets there.
  - Release calendar tried with a stand-in module: items listed by week, a move shows in the change list, Save sends `releaseCalendar.moves` (the website keeps it once the story branch adds the section).

- 5 Nov 2026 20:24 AEDT, commit 674806807. Checks, one at a time with `--only`: pass `voiceopus` (new), `voicepack`, `voicefirstchoice`, `voicearea`, `voicecover`, `offline`, `swupdate`, `preload`, `enwords`, `viwords`, `ownerheartstap`, `filmtails`, `startup` (1024 KB), `perf`, `battery`, `longplaymem`, `padmap`, `bagitems`, `bagpals`, `stickers`, `nostudio`, `mapnames`, `friendstab`, `hubmap`, `familymissions`, `parents`, `questbar`, `shop`, `studiolive`, `surprises`, `guides`, `lighterload`. `voicecover` was red once (the new lines had no area) and passes after `--areas-only`. Not run here: the other 30 or so checks that open the Pad (the full suite on GitHub will run them; the Pad now loads on first open, so a check that looks for the Pad in the same instant would show it).
