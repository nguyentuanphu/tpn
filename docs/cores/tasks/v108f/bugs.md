# v1.08f helper: bugs (status)

Branch `work/v108f-bugs` (from `origin/integrate/v108` at `55a1c17a3`). Started 6 Nov 2026 AEDT. Brief: `bugs-brief.md`.
Runs on another account. Release closes the issues after "yes, deploy"; this helper closes nothing.

## The open bugs (18 GitHub issues labelled `bug`, 6 Nov 2026 AEDT)

The tester reports in Studio (the ladybug list) are filed as GitHub issues by themselves (`[tester]` titles), so this list
is the same as the open ladybug list. Every new one since 3 Nov carries `robot-stuck`: the bug robot could not start
("Your organization has disabled Claude subscription access for Claude Code", run 41642681657, 4 Nov 12:37 am AEDT), so
none of #810 to #817 had been looked at before this round.

| Issue | Core | Reported on | What | State | Commit |
|---|---|---|---|---|---|
| #817 | Voice and audio (really the tester panel) | v1.07 | auto "offscreen: Den do" with the report panel open (Bottle Music) | fixed now | `efe70719c` |
| #814 | Play (really the tester panel) | v1.07 | auto "offscreen: Den do" with the report panel open (Two Homes Words) | fixed now (same cause as #817) | `efe70719c` |
| #810 | Play | v1.07 | auto "offscreen: Bat dau van cung may moi" in Ludo (Co Ca Ngua) | fixed now (same cause) | `efe70719c` |
| #816 | Voice and audio (Play's game) | v1.07 | Bottle Music: every round is the same | (checking) | |
| #815 | Voice and audio (Play's game) | v1.07 | science answers should sit in a row to save space | (checking) | |
| #813 | Play | v1.07 | Two Homes Words: a question about an English word should be said in English | (checking) | |
| #812 | Play | v1.07 | Lamp and Shadow: the shadow should show more clearly | (checking) | |
| #811 | Voice and audio (Play's game) | v1.07 | Sound Pond (Ao Am Thanh): the answers sit below, not on the same screen | (checking) | |
| #797 | Kid UI | v1.06 | stuck, cannot walk to some decorations (village 232, -12) | needs the owner (v1.08 bugs: which decoration) | |
| #796 | Play | v1.06 | Read With Me: the book titles drop to a second line, out of the card | (fixing) | |
| #781 | Play | v1.05 | Odd One Out: 13 frames a second, 3 s freezes | fixed before (v1.08 `618e4186d`, v1.06 #745); owner to replay | |
| #780 | Play | v1.05 | Mirror Painting: freezes 3.2 s and 3.5 s | fixed before (v1.06 `capturefreeze`, v1.08 `618e4186d`); owner to replay | |
| #746 | Analytics and Infra | v1.05 | 16 frames a second on a Windows PC (Brisbane) | fixed before as far as reproducible (v1.07 `autoplayheld`); owner to replay | |
| #739 | Analytics and Infra | v1.05 | 2.3 s freeze, Friends page, iPhone | cannot reproduce (v1.06); v1.07 names the cause in the next report (`freezewhy`) | |
| #355 | Analytics and Infra | r8x | restarts or white screen while playing | big, plan below (unchanged from v1.08) | |
| #341 | World | r82 | slow frames on a computer with no graphics chip | fixed before as far as testable (v1.07 `softgraphics`) | |
| #36 | Analytics and Infra | r4x | start-up slow (umbrella) | left as is, `on-hold` | |
| #34 | World | r4x | roads look poor (umbrella) | left as is, `on-hold` | |

## Fixed now

### #810, #814, #817: a button in a folded list reported as "off the screen"

All three are automatic reports from the same Android tablet (1600x960, v1.07). The ladybug looks every 5 s for buttons a
child cannot reach. Chrome still lays out the inside of a closed `<details>` below its summary, so a long folded list put
its buttons below the bottom of the screen, and the scan reported them as lost:
- #814 and #817: the report panel's "New to test" list (folded since 1 Nov, owner) with its "Go there" (Den do) buttons;
  replayed at 1600x960 with 17 news rows: 6 "offscreen" buttons before the fix, 0 after.
- #810: Ludo's folded "Local players and rules" box with "Start a new local game".

Fix (`js/tester-detection.ts`, `unreachableControl`): a button inside a folded `<details>` (not in its summary) is not
shown, so it is not a lost button. A button really lost, in an open list or in a summary, is still reported.
Check `reportdetectors` (`tests/owner-report-detection.mts`): three new cases; fails on the old code (`folded: true`),
passes with the fix. `testernews` passes.

## Plans for big ones

- **#355 (restarts and white screens).** Unchanged from v1.08 (`docs/cores/tasks/v108/bugs.md`): World, a later round:
  let go of far places' shapes and pictures after some minutes away, and the S2/S3 merge work; a check that the shapes
  held stay under a budget after visiting 6 places.

## Checks

| Check | Result |
|---|---|
| `reportdetectors` | pass (fails on the old code) |
| `testernews` | pass (79 s) |
