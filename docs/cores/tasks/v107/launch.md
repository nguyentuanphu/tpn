# v1.07 launch: status

**PAUSED (Release, 2 Nov 2026 11:12 AM AEDT: "slow down, usage"). Waiting for Release's "resume" after 2 pm AEDT.**

Branch: `work/v107-launch`. Brief: `launch-brief.md`.

## Plan

Everything goes under `docs/launch-2027/`, English and Vietnamese. Materials only: nothing is posted, emailed, paid for or
sent to anyone.

1. `PLAN.md`: launch plan. Dates from `docs/plan-hoan-thien/KE-HOACH.md` (prepare 20 Dec 2026 to 10 Jan 2027, launch
   about 11 to 17 Jan 2027, Tết Sat 6 Feb 2027), five channels, who does what (owner: every contact, post and payment;
   Release: version, `publicLaunch` date, deploy; helpers: materials).
2. `channels/`: Facebook posts (Sydney, Melbourne), email to weekend Vietnamese schools, one-page printable flyer
   (`flyer.html`, bilingual), SBS Tiếng Việt pitch, Tết fair stall text, library email.
3. `VIDEOS.md`: three 15 to 30 s scripts (Tết and heritage; bilingual learning; for parents) with shot lists from
   `shots/`.
4. `LAUNCH-DAY.md`: checklist (Studio Releases page `publicLaunch` date and switch, website banner from
   `home/launch.ts`, Studio Ads "Show ads" off, no store text today since there is no store app).
5. `marketing/source` to TypeScript only if simple (to look at: many scripts load in the browser via `stage.html`).

## Owner's decisions

- 2 Nov 2026 11:00 AM AEDT, pop-up: channels to prepare first = **weekend Vietnamese schools and the Sydney/Melbourne
  Facebook groups** (the recommended choice).

## Done

- Asked the owner which channels first (answer above).
- `docs/launch-2027/capture.mts`: takes the still pictures from the game (720 x 1280 phone screen, our own art), based
  on `marketing/source/capture10.mjs`.
- English shots taken (19) in `docs/launch-2027/shots/*-en.jpg`: title, hub, map, wardrobe, stickers, tale (Thánh
  Gióng), counting, letters, kite, Piggy Bank, Ô ăn quan, reading trace, festival calendar, Grown-ups, Simple screen,
  four valley views. The run was stopped at `two-players` for the pause.

## Found, needs the owner (put in the report and the launch-day checklist)

- **"No children's data" is not true of the game today.** `js/players.ts` (Analytics) sends, per played day, each
  child's first name, age group, games, places, minutes by hour, and the town worked out from the connection; it is on
  until a grown-up turns Analytics off. For a public launch either the promise is reworded or Analytics & Infra changes
  the public build (no first names, no town, or Analytics off by default). Not changed here (not this helper's files).
- **"No ads"** holds only while Studio's Ads "Show ads" stays off (the family ads in `js/ads.js` reach every player
  through the public content).

## Next step (exact)

1. Fix two shots in `capture.mts`: `title` waits until "Preparing the valley" is gone (about 12 s); `valley-village`
   camera is blocked by a tree (move the camera or drop it). Add a Tết view with `url: 'http://localhost:8765/?festival=tet'`
   (a Studio preview link: `js/festivals.ts` visit()). Then run `vi` (and `en` for the fixed ones), one run at a time.
2. Write `PLAN.md`, `channels/` (schools email and Facebook posts first), `VIDEOS.md`, `LAUNCH-DAY.md`, `README.md`.
3. Look at `marketing/source` for TypeScript.
4. `cd tests && node suite.mjs --changed` (docs only: expect quick checks), record results here, push, draft PR
   "v1.07 launch: launch materials for Tết 2027", mark "ready for Release".

## Checks

None run yet.
