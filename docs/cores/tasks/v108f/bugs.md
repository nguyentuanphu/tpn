**ready for Release** (6 Nov 2026 AEDT): branch `work/v108f-bugs`; 6 bugs fixed (#796 #810 #812 #814 #816 #817), 3 fixed before by v1.08 (#811 #813 #815); full suite left for Release.

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
| #816 | Voice and audio (Play's game) | v1.07 | Bottle Music: every round is the same | fixed now | `f4f34b511` |
| #815 | Voice and audio (Play's game) | v1.07 | science answers should sit in a row to save space | fixed before: v1.08 layout (answers side by side, one screen, check `gamefit`); seen at 1600x960 | |
| #813 | Play | v1.07 | Two Homes Words: a question about an English word should be said in English | fixed before: v1.08 aussie-voice (`31b8a2d2f`, check `enwords`): the slang word in a Vietnamese line is said by the English voice | |
| #812 | Play | v1.07 | Lamp and Shadow: the shadow should show more clearly | fixed now | `a8ed53a26` |
| #811 | Voice and audio (Play's game) | v1.07 | Sound Pond (Ao Am Thanh): the answers sit below, not on the same screen | fixed before: v1.08 layout (`gamefit`); replayed at 1600x960, both fish side by side on one screen | |
| #797 | Kid UI | v1.06 | stuck, cannot walk to some decorations (village 232, -12) | needs the owner (v1.08 bugs: which decoration) | |
| #796 | Play | v1.06 | Read With Me: the book titles drop to a second line, out of the card | fixed now | `fc87f039c` |
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

### #816: Bottle Music, every round the same

Under-5s (level 0) had two bottles, always red and blue, and were asked "which is highest?" every round (the tester's
taps alternate "Chai xanh duong" and "Chai do"). Bigger kids alternated the question but kept the same colours. The
`roundvariety` check plays big kids only, so it never saw level 0. Fix (`js/games/science.ts`): each round has other bottle
colours (rotating through the five), and every level asks for the highest and the lowest note in turn, starting either
way. Every line used is already recorded (the "lowest" question and all five bottle names were used at higher levels).
New check `bottlevariety` (`tests/bottle-variety.mts`, registered in `tests/checks/learning.mts`): plays as an under-5 and as a
big kid at Easy and fails when two rounds look the same or the under-5s hear one question only. It fails on the old code
(little: rounds 2 and 3 = round 1, one question) and passes with the fix.

### #796: Read With Me, book titles out of their cards

Found by the v1.08 bugs helper (the english helper owned the file then). Replayed at the tester's 430x517 in Vietnamese,
under-5: "Chu Meo Con", "Di Cho Voi Ba" and "Trang Ram" wrapped and the second line fell below the card. Cause: the
under-5s' fixed square `.gl.little .choice` (css/style.css) won over `.choice.rd-book { height: auto }`. Fix
(`js/games/reading.ts`, its own style block): `.gl .choice.rd-book { width: auto; height: auto; }`. Replayed: every title
inside its card (screenshot looked at).

### #812: Lamp and Shadow, the shadow hard to see

The shadow was an 11 px grey wedge at 55 % strength, mostly hidden under the teddy. Now (`js/games/science.ts`) a dark band
lying on the ground from the teddy's feet to the tip, thick at the feet with a rounded tip; the tip (where the shadow
ends) and so the answers are unchanged. Screenshot looked at at 1600x960; `hocvui` plays Lamp and Shadow to a win.

### Already fixed in v1.08 (Release can close after the deploy)

- **#811** Sound Pond, answers below the screen: v1.08 layout (fit one screen, answers side by side; check `gamefit`).
  Replayed at 1600x960, under-5, Vietnamese: the ear and both fish on one screen.
- **#815** science answers in a row: the same v1.08 layout work (Lamp and Shadow at 1600x960: the two answers side by side
  under the picture).
- **#813** Two Homes Words in Vietnamese: v1.08 aussie-voice (`31b8a2d2f`, `f639b3052`, check `enwords`): the slang word
  inside the Vietnamese question is said by the English voice. If the tester wants the whole question in English, that is
  a design choice for the owner (the Vietnamese child would then hear an English question).

### Not changed, for Release or the owner

- **#797** (iPhone, v1.06, stuck near the Lang Sen festival stage): still needs the owner to say which decoration (Studio,
  Analytics, Tester reports, problem `d1a729a3bf33fed5`, its picture); then likely a small World or Play fix.
- **#781, #780, #746, #341, #739**: fixed before as far as reproducible (see the table); waiting for the owner to replay on
  the reporting devices after v1.08 is live (steps in `docs/cores/tasks/v108/bugs.md`).
- **The bug robot is stuck for every new issue**: its account has Claude Code subscription access turned off (run
  41642681657). For Release and the owner: switch `CLAUDE_CODE_OAUTH_TOKEN` (or the backup) to an account with access, or
  the robot stays off.

## Plans for big ones

- **#355 (restarts and white screens).** Unchanged from v1.08 (`docs/cores/tasks/v108/bugs.md`): World, a later round:
  let go of far places' shapes and pictures after some minutes away, and the S2/S3 merge work; a check that the shapes
  held stay under a budget after visiting 6 places.

## Checks

Run one at a time on `work/v108f-bugs`, 6 Nov 2026 AEDT. `node suite.mts --changed --list` picks the full suite (a new test
file), so per the rules it is left for Release.

| Check | Result |
|---|---|
| `reportdetectors` | pass (fails on the old code) |
| `testernews` | pass (79 s) |
| `bottlevariety` (new) | pass (77 s; fails on the old code) |
| `hocvui` | pass (1127 s; plays Bottle Music and Lamp and Shadow to a win at Easy and Talent) |
| `types` | pass (after typing the new test file plainly; first run flagged 2 findings in it) |
| `bilingual` | pass |
| `boot` | pass (96 s) |
| `phone` | pass (259 s; 10 screens on phone, tablet and computer) |
| `reading` | **fail, not from this branch**: "with the switch on" expects `rd_tones` in the big kids' reading list, but v1.08b moved Tone Detective to the Tieng Viet corner (`readingmenu.ts`: `rd_tones: ['hv_vi', ...]`). This branch changed one CSS line in `reading.ts`, which cannot change the list. For Release (the check's IDS list or the menu) |
| full suite | left for Release |

Screenshots looked at: Read With Me 430x517 (before and after), Sound Pond 1600x960, Lamp and Shadow 1600x960 (before and
after). New spoken lines: none. Version: not changed. Reserved files (avatar, friend-model, film, villagers, modelkit,
places models, s2au-region): not touched.
