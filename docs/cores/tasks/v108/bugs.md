**ready for Release** (3 Nov 2026, 8:45 am AEDT): branch `work/v108-bugs`, draft PR #800 into `release/v1.08`; full suite left for Release.

# v1.08 helper: bugs (status)

Branch `work/v108-bugs` (from `origin/release/v1.08` at `57f3ef9e`). Started 3 Nov 2026 AEDT. Brief: `bugs-brief.md`.

## Plan

1. Read every open GitHub issue labelled `bug` on nguyentuanphu/tpn (10 open on 3 Nov 2026 AEDT, all labelled `big`) and
   the tester summary (#73, last posted 16 Oct 2026 AEDT, nothing new).
2. Read each report's last 30 seconds and the build it came from; compare with what v1.06 and v1.07 already fixed
   (`docs/cores/tasks/v107/tester-bugs.md`, `docs/cores/tasks/v107/old-bugs.md`).
3. Replay what can be replayed in the test browser at the reporting screen size; fix the small ones on this branch with a
   check each; write a plan or the owner's steps for the rest.
4. Leave #34 and #36 (umbrella issues). Close nothing: Release closes after the deploy.
5. Bugs in another helper's area this round are written down for that helper here, not fixed.

## Issues

| Issue | What | Status |
|---|---|---|
| #797 | iPhone, v1.06, village (232, -12) beside the Lang Sen village festival stage: "stuck, cannot walk to some decorations" | needs the owner (see below) |
| #796 | iPhone 430x517, v1.06, Read With Me (Cung Doc): "words drop to the next line" | found, for the **english** helper (see below) |
| #781 | Android tablet, v1.05, Odd One Out: 13 frames a second, three 3-second freezes | fixed in part (commit below); needs the owner to replay |
| #780 | Android tablet, v1.05, Mirror Painting / Colour by Number: freezes of 3.2 s and 3.5 s | fixed in v1.06 (#745, `capturefreeze`) plus this round's fix; needs the owner to replay |
| #746 | Windows PC, v1.05, Brisbane: 16 frames a second | fixed as far as reproducible in v1.07 (`autoplayheld`); needs the owner to replay |
| #739 | iPhone, v1.05, Friends page, "1. Create room": 2.3 s freeze | not reproduced (v1.06); v1.07 added "page busy" timing for iPhones (`freezewhy`); waits for the next real report |
| #355 | restarts or white screen while playing (iPhone and computer) | planned (big): see "Plans for big ones" |
| #341 | slow frames on a tester's computer without a graphics chip | fixed as far as testable in v1.07 (`softgraphics`: light picture on software drawing); waits for the next real report, which now names the graphics |
| #36 | start-up slow | left as is (umbrella issue, brief) |
| #34 | roads look poor | left as is (umbrella issue, brief) |

### #781 and #780: freeze reports that set off more freezes (fixed on this branch)

Both reports come from the same Android tablet on v1.05. In #781 the last 30 seconds show three freezes of about 3 s
(longest script 2982, 3508, 3000 ms) about 5 s apart, and the child's taps queued up behind each (a dozen taps at the
same instant). In #780 each freeze came about 5 s after a "no recording" report. On v1.05 making an automatic report's
picture of the screen ran as one block (#745, fixed in v1.06 by `js/screencapture.ts` giving the browser a turn every
few ms, check `capturefreeze`).

What was still wrong on v1.08: the device decides "same problem, send once in 10 minutes" with `keyOf` in
`js/content/tester.ts`, and that key kept the numbers. "freeze 3.1 s", "freeze 3.6 s" and "freeze 3.0 s" in the same game
were three different problems on the device, so each made a new report with a new picture of the screen (on v1.05 the
picture itself froze the game again: the loop in #781), and each counted toward the device's daily report limit. The
server already groups them as one problem (`netlify/lib/tester.mts` `problemKey` turns numbers into `#`).

Fix: `keyOf` turns numbers into `#` as the server does. The same freeze or slow patch in the same game is now sent once
in 10 minutes and counted meanwhile, like every other automatic report. Check: `unit` (`tests/unit/tester.test.mts`):
freezes of another length and slow patches of another speed are one problem on the device; another game is another
problem; the device and the server group alike. The new lines fail on the old code (17 pass, 1 fail) and pass with the fix.

What the owner can try (on the Android tablet of #780 and #781, after v1.08 is live):
1. Turn tester reports on for the tablet (Studio, Releases, tester).
2. Open Odd One Out (Tim Hinh Khac Loai) and tap the answers quickly for a minute; then Mirror Painting (Ve Doi Xung)
   and Colour by Number (To Mau Theo So), as in the reports.
3. Expected: no freeze, taps answered at once. If it freezes, send a ladybird report straight away: its last 30 seconds
   now say "page busy N ms" or "free, not drawn" and name the graphics.
4. Studio, Analytics, Tester reports: the freezes from one game show as one problem with a count, not a new report each.

### #746: what the owner can try

On the Windows PC (929x1129), v1.08: walk to Brisbane with only one tab of the game open and watch the frames for a
minute (the ladybird's frames line). v1.07 stopped a tab another tab took over from drawing the valley, which fitted the
16 frames a second; if Brisbane alone is still under 20, send a report: it names the graphics now.

### #797: needs the owner

The report is a tester's note with no detail of which decoration. The child stood at (232, -12) in the village, beside
the village festival stage of Lang Sen (the stage's collider, 4.3 m, is at (224, -28); smaller ones at (220, -22.4),
(226, -17.3) and (216.7, -3.9)). Without the report's picture it is not clear which decoration could not be reached
(festival street decorations, the stage, or a home decoration). What the owner can do: open Studio, Analytics, Tester
reports, problem `d1a729a3bf33fed5`, look at the picture and say which decoration; or on the iPhone walk from the stage
toward the decorations and send a ladybird report when stuck (the report then has the child's spot and a "stuck" line).
Once the decoration is known this is likely a small fix for World (a collider too wide) or Play (festival decorations).

### #796: for the english helper (Read With Me is in Hoc vui, Tieng Anh)

Replayed in the test browser at the tester's 430x517, Vietnamese, under-5 profile: on the book choice screen the titles
"Chu Meo Con" and "Di Cho Voi Ba" wrap to two lines and the second line falls below the white card (the tester's
"words drop to the next line"; the report came 7 s after opening the game, while the book covers are up). Cause:
`.gl.little .choice` (css/style.css, a fixed height under 520 px tall) wins over `.choice.rd-book { height: auto }` in
`js/games/reading.ts`. One-line fix, checked by adding it in the test browser (the cards grow and the titles stay
inside): in the style block of `js/games/reading.ts`, add `.gl .choice.rd-book { height: auto; }` after the
`.choice.rd-book` line. Not changed here because the english helper is changing `js/games/reading*.ts` this round
(English mode). Please add a check (the `learning` reading games at 430x517 under-5: each `.rd-book` title inside its
card).

## Plans for big ones

- **#355 (restarts and white screens).** v1.07 measured a 30-minute play on a phone-sized page: no leak, but the graphics
  hold every shape of each place visited (about 4000 shapes and 600 pictures for the whole valley), the likely memory
  pressure on an iPhone. Plan for World, a later round (several days): let go of far places' shapes and pictures when the
  child has been away for some minutes (dispose and rebuild from the cached build), and the S2/S3 merge work (fewer,
  merged shapes). A check: after visiting 6 places and coming back, the shapes held stay under a budget. Not built here.

## Progress

- Commits: `618e4186` (the fix, its unit check, this file), `1441871e` (the two tester checks, check results).
- Shared files touched: `js/content/tester.ts` (`keyOf`, one line), `tests/unit/tester.test.mts` (new lines in the first test),
  `tests/checks/tester.mts` and `tests/old-bugs.mts` (see the checks below).
- New spoken lines: none. Nothing a child sees changed.

## Checks

| Check | Result |
|---|---|
| `unit` tester test alone | pass 18/18 with the fix; 17 pass, 1 fail on the old `keyOf` |
| `suite.mts --changed --list --base origin/release/v1.08` | picks the full suite (a TypeScript file every check loads) |
| `testerreport`, `freezewhy` (first run) | fail: both caused a second freeze in the same place and expected a second report, the behaviour this fix stops (in `testerreport` the software-drawn test browser had already frozen by itself in the valley, so the deliberate freeze was counted, not sent). Changed, not weakened: each deliberate freeze now happens under a window of its own (a new place), so it is still a new report and every line of it is still checked; `testerreport` removes its window before the ladybird part |
| `testerreport`, `freezewhy` (after) | pass (111 s, 52 s), one at a time |
| `capturefreeze` | pass (86 s) |
| `preload`, `arch`, `bilingual`, `rules`, `noemoji` | pass |
| `names`, `types` | skipped here (tests packages not installed) |
| `emoji` | fail, not this branch: an emoji in Release's `docs/plans/v108-owner-batch-20261103.md` |
| `unit` (whole) | fail, not this branch: two management tests need the `pg` package, not installed here; the tester tests pass |
| full suite | left for Release (Release's rule of 3 Nov AEDT: Release runs every branch's full suite at once). A run started on this branch by mistake (41527662277) was cancelled before it finished |
