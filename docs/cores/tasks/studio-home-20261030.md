# Studio first page: "Today in Sparkle Valley" (owner, 30 Oct 2026 AEDT)

Owner: "First page loads too long, I need to see general information like device name, how many devices play,
new devices, minutes kids play, what games they enjoy, their device locations." Chosen by pop-up:
build it for the next round; places shown as **town and country** (from the connection, never an address).

Mock-up: [docs/studio-home-20261030/index.html](../../studio-home-20261030/index.html)
(pictures: `phone.png`, `computer.png`; sample numbers).

## On the first page, in this order
1. Health line: live version and since when, devices updated, devices on an old version, load failures.
2. Numbers: devices today, this week, 30 days; new devices this week and ever; minutes played this week.
3. Waiting on you: tester reports, photos to approve, festivals starting soon, releases ready.
4. Problems since the last release, in plain words, by device name.
5. Minutes played over 30 days, busiest time.
6. Where they play: town, state, country with device counts.
7. Favourite games this week by minutes; games started but rarely finished.
8. Devices: family name or easy name, kind, version, place, children, minutes today, last seen.

## Why it is slow now, and the fix
- `netlify/lib/players.mts` `report()` lists and reads every device record on each request, and several
  Studio pages call `api('players')` separately (studio/ui/app.ts).
- Keep one running summary blob, updated as each device reports (`hello`), that the first page reads in
  one call; fill charts and the device list after the numbers; share one fetch between pages.
- Target: the numbers show within about 1 second on a phone.

## Rules
- Children's names stay tied to their own device and profile (Studio privacy rules); places never finer
  than town.
- English and Tiếng Việt for every label; touch targets 44 px; phone 390 px with no sideways scroll.
- Checks: `studio` (five tiles rule from r65 moves to this page's tiles), `ownerdesk`, phone, tablet and
  computer screenshots.
