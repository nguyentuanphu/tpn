# v1.08 helper: simple (plan part F, the Simple screen)

**Status: ready for Release** (3 Nov 2026 AEDT). Branch `work/v108-simple`, from `origin/release/v1.08`.

## Plan
1. Every switched-on Play game shows on the Simple screen. A locked game is its own stop: its picture greyed under a
   padlock, its name and what to do ("Win 3 times to open" / "Thắng 3 lần để mở"); a tap says what to do (the
   existing recorded lock line) and opens the area's guide (each game to win 3 times, stars so far). Games held back
   in Studio stay one "Coming soon" stop per area. Stories keep their folded lock stop (not in this brief).
2. Top row: name, Back, Valley ("Thung lũng / Valley", 64 px round button), Sound, Home, Grown-ups. Valley leaves the
   bottom bar, which is now: Học vui, Vui chơi, Stories, Places, Discover.
3. Two big buttons, built from the areas (`learnArea()` in `js/simple.ts`), not from a list of games:
   - "Học vui / Fun learning" (`learn`, the default): numbers, shapes, words, reading, me, money, and every Học vui
     corner (`hv_*`, so a new corner lands here by itself).
   - "Vui chơi / Play" (`fun`): every other area (animals, music, art, play, vietnam, travel, thinking, and any new
     non-learning area).
   - The internal tab `games` (both together) stays for old callers, Discover's memory and the checks; it is not in the bar.
4. Checks extended: `adventure` (tests/checks/screens.mts) now walks the two visible buttons and fails if any
   switched-on game is missing, if a locked game has no padlock drawing or no hint, if any game lock is folded, if a
   learning area is under Vui chơi (or the reverse), if the bar is not learn, fun, tales, places, discover, or if Valley
   is not in the top row. `simplefirst` (tests/simple-first.mts) checks, at tablet speed before the valley is built,
   that every switched-on game is reachable from Học vui or Vui chơi.

No new spoken lines (the two buttons reuse "Tap a picture to play!", the lock stop reuses the recorded lock line). No new
drawings (`hv:tab`, the game controller, the tree and the padlock are already drawn in `js/art`).

## Files
- `js/simple.ts`: tabs, grouping, per-game lock stops, Valley in the top row.
- `css/style.css`: one block at the end (Valley round button, padlock badge, greyed picture, hint; hint hidden on a phone on its side).
- `tests/checks/screens.mts` (`adventure`): new reachability assertions; the lock-guide test finds `.sp-stop.locked`
  (each locked game is its own stop now); Discover's Music card is under `fun` instead of `games`.
- `tests/simple-first.mts`: reachability assertion; opens the first area of `learn`.
- `tests/simple-return-fruit.mts`: opens `games` (both buttons) first, since the fruit games are under Vui chơi and the
  default button is now Học vui. The check's assertions are unchanged.

## Checks (3 Nov 2026 AEDT, local, each with `node suite.mts --only ...`)
`--changed` picks the full suite (test code changed), so the full suite is started on GitHub
(`full-suite.yml`, workflow_dispatch on `work/v108-simple`).
- types pass, noemoji pass, bilingual pass, rules pass, contract pass, boot pass
- simple pass, adventure pass (237 games, 17 sections), simplefirst pass, simplereturnfruit pass
- hocvui pass, mapnames pass, songs pass, phone pass (desktop, phone, tablet)
- Screenshots looked at: phone 390x844 (vi), phone on its side 844x390 (vi), tablet 820x1180 (en), computer 1280x800
  (vi), on both buttons: every top button 64 px, one row, no horizontal scroll; on its side the path scrolls sideways only.

## Notes for Release
- The Vui chơi button lists about 70 locked games for a new child (each its own padlock stop), as the owner asked.
- Shared files touched: `css/style.css` (one block at the end). No change to `js/content/activities.ts` or other shared lists.

## Open questions
None.
