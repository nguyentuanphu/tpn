# Lantern, turtle and companion-voice repairs

Release r88 candidate on work/bugs-typescript-20261019, draft PR #400. Owner chose r88; deployment is not approved. Issues #361–#363 and #365 are not closed by this checkpoint.

## Reproduction

The baseline storyquestflow check follows real interactable/autoplay paths from seeded chapter boundaries. VI leaf/carry narration falls back on “Rồng con”. Direct rope autoplay reports success without hanging. Both the under-5 three-turtle and older five-turtle lessons stop incomplete after three attempts. Observations are preserved in evidence/before/.

## Repairs verified locally

- Autoplay recognizes the actual hand panel and pulls its rope through pointer events. Unknown hand activities report that they need help. Later closes through the real control.
- The arrow points to the nearest uncounted turtle after Cô Tam's introduction. Successful intermediate actions reset failed-attempt counting; the original three-attempt stall limit and overall bound remain. One result row accumulates a quest's actions.
- The older child's lesson offers its legal answer button as an autoplay plan, cleaned up after the dialogue. It does not award a synthetic win.
- Existing hanging-in-progress state remains queryable while the deferred theatre loads, so autoplay cannot declare success in the gap. The first repaired run exposed this lifecycle gap and failed waiting for the result panel; it is not counted as a pass.
- Six fixed-character name clips were recorded using the existing isolated Azure workflow (source commit 21d37dfc). Files decode, contain signal and do not clip; original numeric observations are in scratch and will be copied into this report. Full EN narration translates companion names; exact-name preview separately exercises the raw files. Missing-recording reports now include the language and actual text.

## Migration and limits

Five game sources were renamed unchanged in a784383f, then typed with shared chapter/step/tale/action/context and autoplay result contracts in 5f1cc577. The existing light configuration reached zero errors before behaviour edits. It is not full strict coverage; legacy loose root objects remain in the later migration work.

The browser test shortens voice-end notifications while requiring actual file fetch/decode. It does not establish how the recordings sound. Physical iOS and perceptual listening remain unverified. The current-source actual-path run, related regressions, screenshot inspection and final GitHub suite are still required.

## Actual-path result

The final storyquestflow run passes in 464 s. VI lotus-leaf/carry narration reports zero missing recordings. All six exact-name MP3s are requested and decoded through the real voice player. Rope dragging completes chapter one through its deferred film. Three- and five-turtle lessons complete, including a real tap on “5”; result rows contain no problems. Six EN/VI phone/tablet/computer rope-panel layouts have visible/hittable rope and Later controls; Later earns no lantern. Their images were inspected.

These layout fixtures change the active language directly, so some pre-existing HUD labels retain the previous language; this is a fixture limitation, not evidence of a production language-switch defect. They exercise the panel at the existing chapter-two scene after the lesson, rather than claiming a physical trip back to the đình. The actual completion test above does land by the chapter-one target. No claim of 64 px Later controls is made: the existing hand-panel close is 44 px, a general under-5 UI follow-up.

Two repaired-run attempts: the first exposed the late-theatre lifecycle bug and failed; the corrected second run passed. Existing regression checks are running separately. Evidence is under evidence/after/, and six-file codec/signal measurements are in evidence/voice-files.json. GitHub still must validate the final combined head.


## Owner-requested pause, 20 October 2026 AEDT

Related regressions finished 7/8: voicecover, story, chapter2, arch, rules, types and ownerautoplaynavigation pass; existing autoplay fails approaching the counting shrine. The later footprint probe passes, but the whole-autoplay regression has not been rerun. See the shrine evidence and pause handoff.

A subsequent review replaced the game's shared playWatch plan with a story-owned dialogue choice plan and strengthened the older-child regression to preserve a separate game's plan. Type checking passed after the source edits; the updated actual-path story test has not run. Screenshot fixtures now call applyLang and land by the actual rope target, but the saved passing images precede these fixture improvements. The 464 s pass above applies to the earlier repaired behaviour, not this latest untested follow-up.

Six-file codec/signal measurements are saved in evidence/voice-files.json. There is no perceptual listening verification. Full GitHub validation of the paused combined head remains pending; the owner asked to stop and upload rather than continue testing. [Complete handoff](../../cores/tasks/r88-paused-handoff-20261019.md).
