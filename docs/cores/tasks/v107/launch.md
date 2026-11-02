# v1.07 launch: status

**ready for Release** (2 Nov 2026 2:35 PM AEDT), once the GitHub full suite started on this branch is green (see Checks).
Docs and marketing scripts only: no game code changed.

Branch: `work/v107-launch`. Brief: `launch-brief.md`. Paused 11:12 AM to 2:05 PM AEDT for Release's "slow down".

## Plan

Everything under `docs/launch-2027/`, English and Vietnamese. Materials only: nothing posted, emailed, paid for or sent.

1. `PLAN.md`: dates, five channels, who does what, the promise check.
2. `channels/`: schools email, Facebook posts, flyer, SBS pitch, Tết fairs, libraries.
3. `VIDEOS.md`: three 15 to 30 s scripts with shot lists from `shots/`.
4. `LAUNCH-DAY.md`: Studio `publicLaunch` date, website banner, ads off, store text.
5. `marketing/source` node scripts to TypeScript if simple.

## Owner's decisions

- 2 Nov 2026 11:00 AM AEDT, pop-up: channels to prepare first = **weekend Vietnamese schools and the Sydney/Melbourne
  Facebook groups** (the recommended choice).

## Done

- `docs/launch-2027/README.md` (index), linked from `docs/README.md` (one line added).
- `PLAN.md`: timetable 7 Dec 2026 to 13 Feb 2027, proposed launch day Sat 16 Jan 2027, channel table, who does what,
  "Before we promise" (English and Vietnamese).
- `channels/schools-email.md`, `channels/facebook.md` (three posts and common questions), `channels/flyer.html` (A4,
  bilingual, real shots), `channels/sbs-pitch.md`, `channels/tet-fairs.md`, `channels/libraries.md`.
- `VIDEOS.md`: Tết in the valley (25 s), Two languages one tap (20 s), For parents (25 s), each with time, picture,
  voice in both languages and words on screen; shot list.
- `LAUNCH-DAY.md`: a week before, the day before, on the day, store text (none: no store app), if something goes wrong.
- `shots/`: 20 screens in each language (720 x 1280) taken with `capture.mts` from the game (our own art). Looked at
  every one. The title still hides the loading line (the last loading step only finishes after Tap to start).
- `marketing/source/*.mjs` (13 node scripts) renamed to `.mts`; every reference in the `.sh` scripts, `ADS.md` and
  `ads-r82/README.md` updated. Plain JavaScript is valid there, so Node runs them the same (each checked to parse after
  type stripping). The four browser scripts (`ads10.js`, `ads5.js`, `films2.js`, `videos.js`) stay `.js`: the render
  page loads them with a script tag, so converting them would need a build step (not simple).

## Found, needs the owner

- **"No children's data" is not true of the game today.** `js/players.ts` (Analytics) sends, per played day, each
  child's first name, age group, games, places, minutes by hour, and the town from the connection, until a grown-up
  turns Analytics off. Texts use a safe wording marked `[DATA]` until the owner decides: change the public build
  (Analytics & Infra) or change the promise.
- **"No ads"** holds only while Studio's "Show ads in the game" stays off (on the checklist).
- Small, seen in the shots (not this helper's files): the title's "Add to Home Screen" button shows a phone emoji.

## Checks (2 Nov 2026 AEDT)

- `node suite.mjs --changed` chose the **full suite** ("marketing/source/capture.mts changed and no check names it"),
  so it was started on GitHub (`full-suite.yml`, workflow_dispatch on `work/v107-launch`, 2:34 PM AEDT). Result: Release
  to read on the pull request / Actions.
- Local quick checks, commit `ac483423`: emoji pass, preload pass, noemoji pass, arch pass, names pass, rules pass,
  bilingual pass, types pass, unit pass (first run failed only because the root `npm ci` had not been run: package
  `pg` missing; passed after `npm ci`, 480 tests).
- No browser checks needed: no game file changed. Screenshots: phone-size shots of the game in both languages looked at.

## Commits

`4bee7f2b`, `c7ba8fad`, `573322f6`, `ac483423`, and this status commit.
