# v1.07 studio helper: status

**ready for Release** (2 Nov AEDT, after "resume"): draft pull request #786; the GitHub full suite runs on it, result to be read by Release.

Branch `work/v107-studio` (from main v1.06 plus the briefs). Started 2 Nov 2026, about 11:00 am AEDT.

## Plan (owner's go given to Release, 2 Nov AEDT: "chia việc ra cho các agents làm đi")

What is already on main (found by reading the code, 2 Nov AEDT): the Owner's Desk (five areas, `studio/ui/owner-desk.ts`),
"Today in Sparkle Valley" with each part drawn as its answer arrives, a 30-second shared cache in the browser for the
management reads (`studio/ui/app.ts` `api`), and the graphs G01, G02, G04 (device), G05, G15, G17, G21. So this round
does the part still missing: the slow server read behind the first page, and a few more graphs from real data.

1. **First page fast** (`docs/cores/tasks/studio-home-20261030.md`):
   - Server (`netlify/lib/management/read.mts`): a finished day (three or more days ago) is added up once and kept as
     one record `msum/<date>` in the same private players store; later reads take one record per day instead of
     listing and reading every device's record for that day. A late report for that day (`hello`, `netlify/lib/players.mts`)
     removes it, as it already does for `sum/<date>`; the daily tidy removes ones older than 60 days.
   - New quick read `management/summary` (permission `management.read`, the same as Overview): devices today, this
     week, 30 days; new devices this week and ever; minutes today and this week; newest version, devices on older
     ones, game errors. It reads only the day records and the list of device ids, never the device details.
   - Browser: Today draws the health line and the four number tiles from `management/summary` first; the chart,
     places, games and devices fill in from the existing reads after it (owner's pop-up, 2 Nov AEDT: "Fill in by
     themselves"). `management/summary` joins the shared 30-second cache; the older Analytics report (`players`) is
     shared too while one read is on its way, so the Lab, Analytics and device names ask once.
   - Measure before and after with a synthetic store (same delays per read), numbers below.
2. **Connected redesign, real data only:** add G03 (new and returning devices per day, People) and G16 (release
   adoption, versions across reporting devices, Work) from fields the reports already carry; empty states as the
   design says. No new data is collected and nothing leaves the private store (PRIV rules kept).
3. `studio/ui/vi.js` to `vi.ts` if simple.

Checks: `studio`, `ownerdesk`, `unit`, then `cd tests && node suite.mjs --changed` (if it picks the full suite: GitHub
`full-suite.yml` on this branch). Screenshots: computer and tablet (and phone).

Shared files touched: none planned outside Studio's own (`netlify/lib/players.mts` gets two small lines: the
invalidation and the tidy).

## Owner's decisions

- (2 Nov 2026 AEDT, pop-up) Today: the slower parts (chart, places, games, devices) fill in by themselves after the
  quick numbers. No change to what the page shows by default.

## Progress

- 2 Nov ~11:00 AEDT: read the briefs, the design READMEs and the code; plan written.
- 2 Nov ~12:30 pm AEDT: code done for parts 1, 2 and 3 (commit below).
  - Server: `msum/<date>` kept finished days (`keepDays`, live Studio only), `management/summary` (permission
    `management.read`), `dailySeries[].newDevices/returningDevices`; `hello` removes `msum/<date>` on a late report,
    the tidy removes old ones. Files: `netlify/lib/management/read.mts`, `http.mts`, `netlify/lib/admins.mts`,
    `netlify/functions/studio.mts`, `netlify/lib/players.mts` (two lines).
  - Browser: Today's health line and four tiles from `management/summary` (devices today; this week with 30 days;
    new this week with ever; minutes this week with today); `players` read shared while in flight; G03 on People
    (`deskStack`, new file part of `desk-charts.ts`), G16 on Work. `studio/ui/vi.js` is now `vi.ts`.
  - Tests: new `tests/unit/management-summary.test.mjs` (5 tests); `tests/owner-desk-browser.mjs` now fails the
    quick read and the slow read separately, checks unknown numbers show as "–", checks the numbers show while the
    slow read is held, and checks G03 and G16 against the synthetic records.
- Measured (synthetic store, 25 ms per read, `node <scratchpad>/measure.mts`; the script is described here, not committed):

  | Read | 80 devices | 300 devices |
  |---|---|---|
  | Before: overview (what the four numbers waited for) | 584 ms, 1393 reads | 1668 ms, 5133 reads |
  | After: overview with kept days | 340 ms, 313 reads | 895 ms, 1083 reads |
  | After: summary (the four numbers) | 179 ms, 151 reads | 360 ms, 481 reads |

  The first read after a day finishes keeps it once (about 10% slower that one time).

## Checks (2 Nov AEDT)

- `unit`: pass (485, with the new 5).
- `studio`: pass (99 server messages, each in Vietnamese too).
- `types` (tsc, `tests/tsconfig.json` and `tests/tsconfig.server.json`): pass.
- `ownerdesk`: failed once. G03 read the table cells with `innerText`, which is empty inside the closed `<details>`.
  Fixed by reading `textContent` (same assertion). Re-run after "resume": pass.
- Screenshots looked at: Today (computer 1440), People with G03 (tablet 820), Work with G16 (phone 390). Found and
  fixed: "ever" could be lower than the devices seen in 30 days when a device had no first-seen mark (`dev/`); it
  now takes the larger.
- `suite.mjs --changed`: picks the full suite (`.gitignore` changed with `vi.ts`); it runs on GitHub with pull request #786.

## Commits

- `89d88b5e` code and tests; `f37996a8` ever count, screenshots. Draft pull request #786.

## Left for later

- The rest of the connected design (G04 heatmap on device, richer People lifecycle, contextual editors) needs data or
  contracts that do not exist yet; not started.
