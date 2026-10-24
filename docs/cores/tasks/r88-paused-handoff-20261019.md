# r88 paused: saved work and pending checks

Saved on 20 October 2026 AEDT after the owner said: “You should stop and upload all your work, let me know what you have done and whats other works are pending”. Stop implementation, preserve the current source/tests/evidence and push the working branch. This explicitly authorizes uploading the unfinished checkpoint; it does not approve deployment. Do not resume fixes without a new instruction.

Branch: `work/bugs-typescript-20261019`. [Draft PR #400](https://github.com/nguyentuanphu/Sparkle-Valley/pull/400) remains open into main. Owner chose r88, and the three version sources agree. r87 remains the deployed release. There is no r88 Netlify zip or deployment approval. Work has been done alone, as requested.

## Saved implementation

- Reporting: durable receipt-backed queue, bounded/coalesced sends, live retry status, keyboard-aware form, larger picture viewer, and capture of the actual world plus interface. Four reporting sources converted to TypeScript. [Reporting evidence](../../history/repair-reporting-20261019/STATUS.md).
- Game completion: valley/NPC/shrine games return outside after the celebration; Play/Pad/Simple retain choices. Next/replay/difficulty preserve their launch origin and once-only shrine rewards. Shared frame converted to TypeScript. Short/split-pane celebration layout improved, but a GitHub clipping failure remains. [Game-flow evidence](../../history/repair-game-flow-20261019/STATUS.md).
- Story/audio: actual rope dragging, correct turtle targets, retry progress accounting and waiting for the deferred film. Six fixed companion-name recordings integrated from `21d37dfc`; missing-voice reports include the actual text. Five story/autoplay sources converted to TypeScript with shared contracts. [Story evidence](../../history/repair-story-quests-20261019/STATUS.md).
- Navigation: solid-map source converted in unchanged-rename commit `4818ad97` and typed in `5e163652`; the final checkpoint adds an exact circle/cell footprint query to planner acceptance without changing physical collision resolution or map geometry. [Before/after evidence](../../history/repair-autoplay-shrine-20261019/evidence/).
- Latest story follow-up gives dialogue its own choice plan instead of replacing another child's global game plan. The stronger regression and corrected screenshot setup are saved, but have not been browser-tested after this follow-up.
- Gate #369 has a three-device reproduction and screenshots, with no production fix applied. [Gate evidence](../../history/repair-gate-view-20261019/evidence/before/).

The game now has **61 maintained TypeScript sources and 196 maintained JavaScript sources**. Generated JavaScript build output is excluded from this count. Eleven game sources were converted during this plan. This is not a completed migration or full strict checking.

## Exact verification status

| Checkpoint | Result | Limits |
| --- | --- | --- |
| Reporting `7c28d21a`, GitHub run [39237648036](https://github.com/nguyentuanphu/Sparkle-Valley/actions/runs/39237648036) | 223/223, no failed/repeated checks | Earlier checkpoint only. AI review did not finish. |
| Completion `aff79ee3`, GitHub run [39244377795](https://github.com/nguyentuanphu/Sparkle-Valley/actions/runs/39244377795) | 222/225 | gameflow, gamewinlayout and testerreport still fail after standalone retries. ownerfamily and filmmusic pass only on retry. [Parsed summary](../../history/repair-game-flow-20261019/evidence/github-summary.json). |
| Local gameflow/types before later diagnostics | Both pass, 362/35 s | Does not clear the later GitHub timeout. |
| Local storyquestflow on `b1523a2c` behaviour | Pass, 464 s | Earlier repaired run failed on deferred-film lifecycle; corrected run passed. Latest scoped-choice follow-up is not browser-retested. |
| Related story/audio checks | 7/8 | voicecover, story, chapter2, arch, rules, types and ownerautoplaynavigation pass. Existing autoplay fails at the counting-shrine approach. No assertion relaxed. |
| Focused autoplayshrine after footprint change | Pass, 79 s | Sampled accepted positions now agree with real collision. Actual trail uses the existing flight fallback, then walking and a legal win; this does not prove an entirely walkable route or clear the original whole-autoplay failure. |
| Latest local CI reproduction | 1/2 | gamewinlayout passes 10/10 in 31 s; testerreport fails an 8 s report-panel visibility wait. This is different from its GitHub failure. [Evidence](../../history/r88-pause/evidence/). |

Last type check passed after the footprint and scoped-choice source edits. The newest gameflow diagnostic additions were written afterwards and are not rechecked. The stop request takes priority over further testing. No suites are running; the two-hour local server has expired. Restore/restart it when work is explicitly resumed.

Browser tests fetch/decode actual recordings and shorten voice-end notifications. Codec/signal checks and successful playback do not establish that the sounds are perceptually correct. Six EN/VI story panel images and earlier reporting/completion phone/tablet/computer images were inspected; they are not a final release review of this combined head. Physical iPhone/Mac checks and listening remain pending.

## Resume in this order, when instructed

1. **Clear the three red GitHub checks without weakening them.** gameflow needs the saved phase/failure-state diagnostics to identify its 30 s locator timeout. gamewinlayout needs a reproducible VI short split-pane/font-loading case; local success does not clear GitHub clipping. testerreport currently selects the first freeze report, which can predate its injected 2.6 s task: local evidence contains two earlier freezes and no new one by the lookup. Identify the injected report/cooldown timing while preserving the >=1000 ms script requirement. Separately diagnose the local report-panel visibility timeout; its screenshot shows a translucent panel, but no cause is established.
2. **Resolve the two retry causes.** ownerfamily's fixture uses its in-memory handler. The stack points at the stale-token guard in familydevices.ts, not proof of an unavailable external service. Hypothesis: the settings poll clears a revoked token before a deliberately held manifest response returns; the fixture accepts only a 403, while the guard returns friendly connection-changed text. Reproduce deterministically before changing code/checks. filmmusic reads Music.key after a fixed 300 ms while the theatre loads asynchronously; wait for actual theatre readiness with the existing assertions if that cause is proved.
3. **Retest the latest story and shrine changes.** Run types, storyquestflow, autoplayshrine, the previously failing autoplay check and relevant regressions sequentially. Keep the unavailable-path/non-advancing-quest checks. Verify the other child's playWatch sentinel survives Cô Tam's dialogue. The focused shrine pass is not a substitute for the original autoplay regression.
4. **Fix gate #369 and verify the exact ride reports.** Gate meshes in roads.js set noCam, excluding them from the current see-through collector. Preserve collisions/map positions and camera-specific restoration; rename roads.js/seethrough.js unchanged before types/behaviour edits. Exact #368 electric-cart position and #354 bridge/parked-ride retests remain. r87 already contains the earlier ride-camera fixes; no new camera repair is claimed here. Existing hand-panel Later is 44 px and still needs the under-5 64 px follow-up.
5. **Continue freezes and measured performance work.** #355/#341 and the related restart/white-screen reports still need diagnosis and physical-device confirmation. Remaining S4 net/sticker deferral, S2 valley build/static-mesh work and staged readiness are approved in the plan but are not implemented by this checkpoint. Current r88 local speed checks have not been run. r87's disclosed timing failures remain historical baseline, not an r88 result.
6. **Continue TypeScript batches and strict checking.** 196 game JavaScript sources remain, plus owned Studio/tool/test/marketing files. Use unchanged rename commits before conversion and retain browser .js imports/build output. Do not describe generated .js files as unconverted maintained sources.
7. **Recover blocked feature work.** work/drawing-games-20261018 is still absent from GitHub; its agreed ten-game brief/commits must be recovered before integrating. Permanent chapter-two/three places and Vũng Tàu game scope remain pending. Last audit: 46 open bug issues, 42 robot-stuck, with no new submissions since the recorded audit; this is a snapshot, not a new closure pass.
8. **Finish release verification only after repairs.** New push starts a GitHub full suite; inspect the actual summary and list all retries. Run local perf,battery,startup one at a time, take and inspect final phone/tablet/computer images, build a new zip with ./build-netlify.sh, disclose timings and unfinished AI review, then ask the round's single “yes, deploy” pop-up. No main merge, Studio publication, live issue comments or final check-map artifact commit until the applicable release steps/approval.

## Reproduction commands and evidence

From the repository root, restart the server in the background with `timeout 7200 python3 -m http.server 8765` when resuming. Never run two local suites/browser runs at once. Full suite belongs on GitHub, not locally. Example targeted commands from tests/:

```sh
node suite.mjs --jobs 1 --only types,storyquestflow,autoplayshrine,autoplay,ownerautoplaynavigation
node suite.mjs --jobs 1 --only gameflow,gamewinlayout,testerreport,ownerfamily,filmmusic
```

These are suggested future runs, not checks performed on the paused head. Keep independent runs sequential. No performance budget, test assertion or contract was weakened to obtain a pass.

Earlier source checkpoints: reporting `7c28d21a`, completion `138569ba`/`aff79ee3`, r88 choice/baseline `a151feca`, story rename/types `a784383f`/`5f1cc577`, quest/voices `b1523a2c`, gate/shrine reproduction `746887f0`, solid rename/types `4818ad97`/`5e163652`. The pause commit retains the later footprint fix, scoped story plan and diagnostic edits as unfinished work.

The final GitHub suite and Drive mirror are triggered by pushing this branch. Their completion is not established by the upload. PR #400 remains draft; no issue is being marked live by this checkpoint.
