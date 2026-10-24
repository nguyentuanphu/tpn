# Game completion repair — 19 October 2026 AEDT

Approved combined plan: ../plans/bugs-typescript-20261019.md. Branch work/bugs-typescript-20261019, draft PR #400. Live remains r87; owner has since chosen r88; r88 deployment remains unapproved.

## Change

Issue #375 requests that games opened from the valley or a quest finish back outside, while Simple and Play retain Next/Play again. The shared frame now accepts an explicit choose/return completion policy. Main retains the launch origin through Next, replay and difficulty changes, so changing difficulty at a shrine still earns its once-only orb. Return mode closes after the existing chest celebration; cleanup cancels its pending waits and listeners.

The frame was renamed without content changes in 0f4c56e8, then typed in 4f61a7b7 before the behaviour repair. Type checking is currently clear; this is the existing light configuration, not a claim of full strict checking.

Screenshot review also found that a celebration could put Replay below a short split-screen pane. A frame-only fixture reproduces clipping in the old CSS. Celebration artwork now scales to the actual pane, choices keep their 64 px little targets, and overflow can scroll from the top instead of cropping above it. The final ten-case EN/VI phone/full and phone/tablet/computer split matrix passes, including 320 px and the finish instruction. Equal columns prevent the English Replay label from forcing a second row. Phone/tablet/computer images were inspected.

## Verification status

- Real counting-shrine/number-game coverage checks the difficulty restart, two children receiving exactly one reward, folk quest credit, actual Play menu replay, actual Simple road Next and leaving without crediting a win.
- Five development runs failed: an earned storybook was left open in the fixture; a self-dismissing reward raced the fixture's click; the fixture then attempted Leave behind the celebration overlay; a live reward locator followed consecutive rewards; waiting for one self-dismiss timer also exceeded the fixture timeout on the software renderer. The fixture now uses real book controls, acknowledges each individual reward through its actual click handler and checks leaving during gameplay. The six-second fixture wait was not a product timing requirement; startup/frame budgets and existing checks are unchanged. No existing assertion or budget was relaxed.
- The corrected final run passes 2/2: gameflow 362 s, types 35 s (76 explicit files). The eight-case layout check first passed for buttons; image review and the added 320 px English case exposed more clipping. The final stronger ten-case check passes in 31 seconds, including the instruction. One earlier fixture launch had a missing serialized height parameter; it is corrected and not counted as a product failure.
- Physical iOS and perceptual sound verification remain separate. GitHub's full suite is still required for the final combined head. The reporting checkpoint run 39237648036 passed 223/223 with no failed/repeated checks; AI review 39237648251 did not finish and is not a pass.

Before/after layout observations and pictures are in evidence/. This is a working checkpoint, not a release approval request.


## GitHub result and pause, 20 October 2026 AEDT

Full run 39244377795 on aff79ee3 finishes 222/225: gameflow times out on a locator after 30 s; gamewinlayout clips the VI phone-split finish instruction; testerreport reports only about 220 ms of script time instead of the injected long task. All three remain red after standalone retries. ownerfamily and filmmusic pass only on retry and still need cause investigation. Parsed results are in evidence/github-summary.json.

The latest local reproduction passes gamewinlayout 10/10 in 31 s, but testerreport fails an 8 s report-panel visibility wait. This does not clear the GitHub failures. New geometry/font measurements and freeze observations are saved under docs/history/r88-pause/evidence/. Gameflow now saves phase/state/failure-image diagnostics; those latest additions have not been rechecked or browser-run. No assertion or wait budget was weakened. AI review did not finish; its wrapper is not an approval.

Owner requested stop and upload all current work. PR #400 remains draft; no r88 zip, final verification or deployment approval. [Complete handoff](../../cores/tasks/r88-paused-handoff-20261019.md).
