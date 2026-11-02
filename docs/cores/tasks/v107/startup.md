# v1.07 startup: status

Helper: startup. Branch: `work/v107-startup` (from main v1.06 plus the briefs). Brief: [startup-brief.md](startup-brief.md).

## Plan (written first, 2 Nov 2026 AEDT; the owner's go was given to Release)

1. Measure first: `perf`, `startup`, `battery`, one at a time; the packed copy's start-up modules (`tools/bundle.mts --report`).
2. `perf` under its ratchet without raising it: the parts of the valley that are made during the build steps (after the
   title screen) and that only `js/main.ts` imports are loaded with `import()` during the build, side by side, and each is
   still made at its old place in the build order. No map file, no world position and no `sw.ts` list is changed (the
   packed copy's offline list already holds every chunk; the plain modules were already listed).
3. The Simple screen opens without waiting for the 3D valley (`simpleFirst` in `js/main.ts`), with a new check
   `simplefirst` (`tests/simple-first.mts`, one line at the end of `tests/run.mjs`).
4. A "can play" timing in the anonymous start-up timings: the tester report's `dev.start.play` and the Analytics start
   row; Studio's start-up tile shows it.
5. Screenshots on phone, tablet and computer; before and after numbers.

## Measurements

Before (main v1.06, this container, 2 Nov 2026 AEDT):

| What | Number |
|---|---|
| `perf` startMB | 2.725 MB (fails: max 2.55, allowed up to 2.677) |
| `perf` worldMs (second start) | 7641 ms |
| Packed start-up graph (launch + main static imports) | 2.255 MB raw, 785 KB gzip, 58 files |
| `startup` (tablet speed, CPU x4) | first start 1038 KB, Welcome 2.1 s, valley ready 41.7 s; second start ready 29.9 s, longest freeze 4.4 s; slowest steps things 9.7 s, world 6.4 s, pretraffic 3.0 s, town 2.0 s |
| Time until a child can tap a game (Simple screen child) | after the valley is built: 40 s at tablet speed |

Biggest start-up modules before (minified bytes in the start graph): vendor/three 645 KB, art 159 KB, main 120 KB, ui 83 KB,
world 61 KB, cities 47 KB, net 38 KB, roads 34 KB, vehicles 30 KB, homes 29 KB, avatar 29 KB, heritage 29 KB, farm 27 KB,
festivals 27 KB, regions 26 KB, content/stickers 25 KB, simple 24 KB, audio 23 KB, voice 23 KB, games/catalog 22 KB.

Build steps on this container (normal speed, packed copy): world 3.4 s, people 0.1 s, town 0.6 s, roads 2.6 s,
pretraffic 0.7 s, traffic 0.02 s, things 1.7 s, wideland 0.3 s, levelled 0.2 s, roadside 0.1 s, solids 0.02 s, ready 0.4 s.

After: see "Checks" below.

### A finding about `perf` startMB

Welcome is painted 0.7 to 0.8 s after the page opens, but the checks' remote control (Playwright) gets its answer from the
page only between the long build steps, about 5 to 9 s later (build step 4 to 6). `perf` counts everything downloaded
until then, so it measures "downloaded before about the fourth build step", not "before the title screen". This round
keeps the check as it is (no check changed) and passes it for real: what the build needs from the town step on is fetched
only after the traffic step. Release and the owner may want to measure at the moment Welcome is painted (as `startup`
does with its own frame clock); that would be a change to the check and needs the owner.

## What changed

- `js/main.ts` (shared file, the start-up part only):
  - 22 modules load during the build instead of with the start: `asia`, `hawkers`, `suburbs`, `traffic` (fetched after
    the people step), and `heritage` (with `homes`), `symbols`, `regionsites`, `vnfun`, `myhouse`, `lotus`, `pets`,
    `ferry`, `passport`, `festivals`, `weather`, `fun`, `learn` (with `talesdata`), `showcase`, `trade`, `folkshow`,
    `signposts`, `secrets` (fetched after the traffic step); `tales` (with `cartoon`) loads when a story's theatre
    opens. Each is made at its old place in the build order. A module that cannot load stops the start where it is
    made, as before (Try again).
  - Welcome is painted before the valley starts building (one frame, at most 100 ms). Five more breaths between the
    long parts of the "things" step, so a tap on the Simple screen is answered sooner. (A frame on every breath was
    tried and dropped: it drew the title scene each time and made worldMs 9.0 s.)
  - `simpleFirst`: a child alone who starts on the Simple screen and has seen the prologue gets the Simple screen at Go
    when the valley is not built yet (once the ground is made). Games and stories open over it. The valley's session
    starts behind it when the valley is built and no game or story is open. While a game or story opened this way is up,
    the build waits between its steps, so the game runs smoothly. A place stop and the "valley" button wait with the
    "Getting the valley ready" spinner.
  - `G.playTimes`: `at` (ms after the page opened when a child could first play: the Simple screen up or the valley
    session started) and `waited` (ms the child waited after Go).
- `js/simple.ts`: the place stop and the "valley" button wait for the valley when it is not ready (`G.untilValley`).
- `js/tester.ts`: the tester report's `dev.start` gets `play`.
- `js/players.ts`: the Analytics start row gets two numbers at the end: can play (ms after the page opened) and waited
  (ms after Go). It waits up to 2 minutes for the first play.
- `netlify/lib/hello-clean.mts`, `netlify/lib/players.mts`, `netlify/lib/tester.mts`: keep and summarise the new numbers
  (`startup.play`, per device and per kind of device); old rows without them still read.
- `studio/ui/app.ts`: the start-up tile shows "can play" per kind of device when real devices have sent it.
- `tools/tester-issues.mts`: a tester issue says "can play N ms".
- `types/globals.d.ts`: `playTimes` on the game object for the tester.
- `tests/simple-first.mts` and one line at the end of `tests/run.mjs`: the new check `simplefirst`.

No world position, no map file, no version number and no `sw.ts` list changed. No new words a child hears; the only new
words a child sees are the existing "Getting the valley ready…" spinner (EN/VI). Studio's tile adds "can play / chơi
được" (grown-ups only).

## Checks

Commit after this section (2 Nov 2026 AEDT), this container, game server `python3 -m http.server 8765`:

| Check | Result |
|---|---|
| `perf` (alone) | pass: startMB 2.382 MB (was 2.725, max 2.55), worldMs 7.7 s (was 7.6 s) |
| `startup` (alone) | pass: first start 1071 KB, Welcome 2.3 s, valley ready 46.8 s; second start ready 32.9 s, longest freeze 4.0 s (machine x3.00 of the reference; before x2.91: 1038 KB, 2.1 s, 41.7 s, 29.9 s, 4.4 s) |
| `battery` (alone) | pass |
| `simplefirst` (new) | pass: tablet speed, Welcome 2.5 s, Go 14.7 s, the Simple screen 0.8 s after Go, a game open 0.5 s after its tap, the valley built at 43 s |
| `simple`, `simplereturnfruit`, `boot`, `contract`, `arch`, `iphone`, `tester`, `types`, `offline` | pass |
| `phone`, `names` | pass alone (phone timed out with 3 checks at a time; names failed on a missing type import, fixed) |
| `testerreport` | pass on its second run alone (first run alone: a freeze 3.1 s earlier in the run was reported first, so the made freeze was not) |
| `preload` | pass after `node tools/preload.mts` (index.html's list) |
| Full suite | `--changed` picks the full suite (test code and shared files changed): started on GitHub, `.github/workflows/full-suite.yml` on this branch |

Screenshots looked at: `tests/out/boot-390.png`, `boot-1024.png`, `boot-1280.png` (phone, tablet, computer): the same as before.

New spoken lines: none.

## Part 2: splitting `js/main.ts` (Release's task, owner's decision 2 Nov 2026 AEDT)

Plan: `docs/cores/tasks/v107/split-code.md` on `work/v107-split-code` (main.ts section). Pure moves, one commit per new
file, separate from the start-up commits. Each section moves unchanged into `js/main/<name>.ts` inside one function
`install...(G, deps)`, which `js/main.ts` calls exactly where the section stood (so the order of everything that runs at
load is unchanged) with the names of its own the section uses; the function hands back the names the rest of
main.ts uses. The few changes inside the moved code are main.ts's own `let`s read or set through a small function
(`isPlaying()`, `setPlaying()`, `theOwl()`), and a name made later in main.ts is handed over as a small arrow (`h =>
hudFor(h)`) so nothing is used before it exists (`types` reports that as TS2448). The new files never import main.ts at
run time (`import type` only), so `arch` stays at 0 circles.

| Commit | New file | What | Size |
|---|---|---|---|
| cfde1f83 | `js/main/online-games.ts` | games with friends online, a friend's ride, the room's state | 31.7 KB |
| 1127f7d5 | `js/main/friends.ts` | friend codes, invites, the online panel | 28.3 KB |
| e3fec4fe | `js/main/talks.ts` | NPC talks, Two Homes Street, chatting, the Games hub | 14.2 KB |
| bed4edf2 | `js/main/quests.ts` | objective helpers and quests | 11.1 KB |
| 5e9cc773 | `js/main/interactables.ts` | interactables, bubbles, area signs, guides | 12.5 KB |
| bde8235a | `js/main/hero-events.ts` | hero events, the wanderers at home | 13.7 KB |
| b21e72a7 | `js/main/talking.ts` | quick phrases, speech bubbles, voice calls, hello | 8.1 KB |
| 14ea57c8 | `js/main/layout.ts` | window size, two halves, camera views, taps, goAndDo | 13.8 KB |

`js/main.ts`: 215 KB at v1.06 (about 220 KB with this round's start-up code), now 101 KB: imports and types,
renderer and world, people of the valley, rewards and `playGame`, starting a session, the loop and the boot. Not moved
this round (left for v1.08): people of the valley (it sets `owl` and `gourd`, read all over main.ts), rewards (`save`,
`hudFor`, `playGame` are handed to nearly every part, before and after it) and the loop (it sets `framesSeen`,
`last` and other `let`s that the boot reads); each needs the shared-state step of the plan first.

Every split commit also updates the offline list (`sw.ts`), the preload list (`node tools/preload.mts`), `.gitignore`
(the made `.js`), and the voice-line tools (`tools/voice-lines.mts`, `tools/reviewed-voice-delta.mts`: `js/main/*`
counts as `js/main.js`, as `js/ui/*` does on the split-code branch; Release may need to join the two edits of the same
line when merging). `tests/check-map.json`: each `js/main/*.js` gets `js/main.js`'s checks, as the ui split did.

Checks after each split, one at a time: `names`, `types`, `arch`, `boot`, and the browser checks of that part
(`friendstab`, `netgames` skipped without the local broker; `talk`, `talkonce`, `playhub`; `questbar`,
`ownerquesttargets`, `storyquestflow`; `signs`, `guides`; `firstplayer`, `multiplayer` skipped without the local PeerJS
server, `simplefirst`; `phone`, `iphone`): all pass. `perf` after all eight: pass, startMB 2.386 MB (2.384 before the
split: the install wrappers add about 2 KB), worldMs 7.6 s. `--changed` picks the full suite (shared files): it runs on
GitHub with pull request #785.

Loading later: none of the eight moved parts loads after the first tap yet. They are made in the synchronous part of the
start (before the build steps), and some are needed by the Simple screen before the valley (online-games makes
`G.simple`; friends feeds the Friends page). Friends (28 KB) and online-games' invitations could load during the build
in v1.08, once the Simple screen's Friends page waits for them.

## Open questions

- `perf` startMB measuring point (see the finding above): for Release and the owner, not changed here.
- The Simple screen can open only after the first build step (the ground, `js/world.js`, 3.4 s here and about 13 s at
  tablet speed), because a child on it is already a child in the valley. Making the ground faster or in parts is for the
  next round (map files are closed this round: Round T rule).
