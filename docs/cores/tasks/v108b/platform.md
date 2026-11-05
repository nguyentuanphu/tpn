# v1.08b platform helper: status

**Ready for Release (Studio part).** Branch `work/v108b-platform` (from `origin/integrate/v108`). Parts 1 to 5 of the brief are not started in this session (see "Left for later").

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
export type CalItem = { key: string; kind: 'game'|'story'|'chapter'|'feature'; id: string; en: string; vi: string; week: string /* Monday YYYY-MM-DD */; end?: string; icon?: string };
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
- Studio: the content (`content` read) is kept in memory only, not in `sessionStorage`, on purpose: content pages save the whole content back, and an old copy from another tab could overwrite a newer one.

## Owner's decisions

- 5 Nov 2026 AEDT: Studio redesign added to this helper (Releases and Sparkle Lab easier to understand, Studio fast, no reload on Back).

## Progress notes
