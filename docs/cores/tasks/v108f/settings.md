**ready for Release** (6 Nov 2026, 10:40 am AEDT) · branch `work/v108f-settings`

# v1.08f settings: status

Branch `work/v108f-settings` (from `origin/integrate/v108`). Helper: settings. Started 6 Nov 2026, 8:41 am AEDT.

## Done

1. **Captions off by default** (`js/ui/common.ts`, `js/ui-settings.ts`): captions show only when `settings.captions === true`.
   A family that never touched the box (no saved value) now reads as off; one that ticked it on keeps it on.
   The Grown-ups box says "(off unless you turn it on)". `tests/checks/screens.mts` (A11Y-002 caption size) and
   `tests/checks/learning.mts` (queued captions hidden) turn captions on before they measure them.
2. **AI chat offer hidden** (`js/state.ts` `AI_CHAT_OFFER = false`, `js/extras.ts`, `js/chat-player.ts`): the Grown-ups
   section "Villagers who chat freely (AI)" with the Anthropic key is gone, the internet list no longer mentions it,
   and `aiReady()` is false even with an old key saved. Set `AI_CHAT_OFFER` to true to bring it back.
   Assumed (owner can change): the villagers' offline Chat button (speech-bubble picture) (built-in answers, no AI) stays.
3. **One row** (`js/ui-settings.ts` class `row3`, `css/style.css`): Two players, Fit the screen and Money each sit on one
   row on every screen; each button shrinks (13 to 16 px text) and wraps inside itself, 48 px tall.
4. **The jump**: the part that scrolls is `.grownups-body`, which every redraw made anew, so the old
   `m.scrollTop` keep did nothing. `draw()` now keeps `.grownups-body`'s scroll for every redraw in Grown-ups.
5. **TURN relay kept, its wording and field hidden** (owner's correction via Release, 6 Nov AEDT: "the turn function
   stays but the wording and the link there to hide"). `js/net.ts`, `netlify/functions/turn.mts`, `netlify.toml` and the
   credentials are exactly as on integrate/v108 (an early removal was undone). `js/state.ts` `TURN_OFFER = false` hides the
   Grown-ups relay note and its link/name/password fields, the relay wording in the connection test results and in
   "What uses the internet". Set it to true to show them again.
4b. **The jump, second part:** keeping `scrollTop` alone was not enough (a redraw closes inner sections and late parts load
   above), so the tapped control (or the first one in view) is found again by its kind, classes and words and put back
   where it was on screen, again at 60, 250, 700 and 1500 ms unless the grown-up has scrolled.
6. **Ladybird Try again goes to the broken thing** (owner, 6 Nov AEDT, item 6). `js/tester.ts`: new reports save the
   game's level, difficulty, mode and players; the screen and tab (`pad:<tab>`, `grownups`, `hub`, `shop`, `cook`,
   `tale:<id>`); the quest step when the tester stood within 12 m of its goal; the thing within 7 m (stall, villager, pot,
   tap spot). Try again opens the game at that level/difficulty/mode (a note if it had more players), opens the screen
   on its tab, walks to the quest goal (Go) and rings it, or lands beside the thing, faces it and rings it (a red ring for
   15 s, `tester-target-ring`). Without these it goes to the place and says "Action unknown, you are at the reported
   place / Không rõ hành động, đã đưa bạn tới chỗ đã báo". `js/main.ts` `playGame` takes an optional `{ level, diff }`;
   `netlify/lib/tester.mts` keeps the new `where` fields (checked and size-limited). A story page number is not saved:
   a tale report opens the tale from its start.

## Checks

New checks `grownupsrow` (`tests/grownups-row.mts`) and `testertryagain` (`tests/tester-tryagain.mts`), both in `tests/run.mts`.

Run one at a time on 6 Nov 2026 AEDT (`node suite.mts --jobs 1 --only ...`):
- pass: types, bilingual, boot, a11y, owneractivityshell, onlineoff, grownupsrow, testertryagain, tester, testerreport,
  testerretest, testerrewards, report, reportingflow.
- fail, **already failing on integrate/v108** (re-run on an untouched copy, same errors): `unit` (menu catalogue
  "G is not defined"; map WORLD-009 references), `phone` (a click time-out), `studio` (Simple screen page lists no
  reading games). Not from this branch.
- `suite.mts --changed` asks for the full suite (integrate/v108 is far from main): left to Release.
- Screenshots looked at: Grown-ups on phone (EN, VI), tablet and computer (`tests/out/grownupsrow/`).
- No new spoken lines.
