# v1.02 Release review · 26 October 2026 AEDT

## Current work · 26 October 2026, 12:50 pm AEDT

Previous exhaustive GitHub run [40244549770](https://github.com/nguyentuanphu/tpn/actions/runs/40244549770), exact head `edc37929`, finished **231/235**, not a release pass. Four failures were games, adventure, a11y (Fruit Bar not enabled in the all-games fixture / missing opening instruction) and solid (deck-only query used for an under-deck player). All four now pass locally with the original checks retained. The official map from that exact run is collected from `1dca02c0e`.

Newly implemented: shared festival switches across both Studio screens, public-only website endpoint and game visibility, with offline snapshot handling and automatic refresh. Local Studio → website → game integration passed after fixing an annual-date preservation bug. Seven focused units pass. Friends room-startup cancellation/null-relay regression passes. Turtle counting utterances now match the voice inventory; small default/FPT recording deltas are queued on the next push, not yet claimed recorded. See [festival evidence](../v1.02-festival-sync/README.md).

The full workflow is set to exhaustive `--all` for this PR branch. No local full suite is authorized. One accidental `--help` invocation launched workers and was stopped immediately; its incomplete output is not a test result. Historical timing comparisons below predate discovery and removal of 87 orphaned headless browser groups; fresh paired speed runs remain required, without changing budgets.

Remaining release blockers: six inaccurate traditional-game prototypes, Cờ Cá Ngựa and shared multiplayer rules, production Lê Minh selection/cache/background downloads, website editorial consistency, latest exhaustive regression, performance investigation and physical-device/listening checks. AI review remains unfinished. Live is v1.01, candidate v1.02; no deployment approval.


Live remains v1.01. The last exhaustive runtime was `4fd792cfa`; the candidate now adds the family/underpass changes below on `work/v1.02-fruit-parade`, draft [PR #602](https://github.com/nguyentuanphu/tpn/pull/602). Deployment approval has not been requested while the blockers below remain.

## Changes reviewed and prepared

- Separate typed Fruit Parade (three lanes per player), Orchard picture missions and family Fruit Bar. Orchard remains accepted-tester-only; Fruit Bar public single/multiplayer switches serve all ages, with a separately gated tester preview. All switches remain off by default. Fruit Bar counters stay in the session and do not change child saves, coins or rewards.
- Trồng Nụ Trồng Hoa uses a large illustrated virtual jumping/hand-and-foot-stack adaptation. The earlier planting-memory prototype did not match the named traditional game.
- Studio keeps all five analytics tiles, with a bilingual persistent overview fold and responsive alignment. Under-five controls remain 64px.
- The tester ladybird floats above games and windows, drags with a device-local saved position, and resets on double-tap. The report form/viewer also stay above the reported window. Reset cancels a newly opened untouched form and preserves text edits and keyboard-selected categories.
- The ride picker groups by displayed destination name, so distinct Brisbane stop IDs produce one card. Physical stops and routes stay in the world.
- Report screenshots reuse already-embedded image data and batch style assignment. A controlled comparison preserves all 1,555,200 pixel channels; one synthetic game capture fell from 6.6s to 2.7s on this machine. This is a local measurement, not a physical-device guarantee.

All new feature logic is TypeScript. Legacy repository JavaScript has not all been converted.

## Verification

The prior GitHub fast checks pass 276 unit tests; the latest local combined units pass 277. Prior checks include  source type checks. Complete Orchard/parent/Studio/report UI workflow 40224911481 passes, including the deterministic slow double-tap, edited-draft and keyboard-category cases. EN/VI phone, tablet and computer browser profiles were captured and inspected. Tests include actual keyboard/controller input, mixed-age online mission completion, cached/lost-move recovery, guest continuation, the original parent gates (superseded by the 26 October family-access change), unchanged child saves, real in-game reporting, drag bounds and saved-position restoration.

Local testerreport, types and reportingflow pass 3/3. Reportingflow covers 12 bilingual layouts, under-five controls, keyboard-visible actions, picture viewing, composed world/interface capture and bounded/coalesced reporting. Dailyadventure passes after the fixture corrections below.

**Full exhaustive regression:** [run 40225017049](https://github.com/nguyentuanphu/tpn/actions/runs/40225017049), **231/233 passed** on `4fd792cfa`, forcing all reading items, films and voice areas. `realrides` failed selecting a stop after destination deduplication; `ownercapture` sampled cream instead of the synthetic pink panel. Both are under investigation; this is not a release pass. Official code-map commit `98cb56ad3` was collected for this exact run. A corrected regression remains pending. Superseded or cancelled runs are not counted as passes.

## Owner additions after the exhaustive run

Fruit Bar is now registered in normal Play/Friends for children and adults. Adult holds and the Grown-ups-only entry are removed; the normal game frame owns pause/cleanup. 64px plus/minus taps supplement numeric counters. The normal invitation still requires consent. Child coin/save/reward isolation is retained.

The new water-crossing check reproduced blocked swimmers at all 13 bridges. Height-aware deck rails and a second water-level solid layer keep real supports solid while allowing passage underneath. Actual swimmer crossings pass for all 13; boat routes and walkable bridges pass. Final deck-rail and family-layout checks pass: actual swimming and retained deck rails at all 13 bridges; public entry, real 64px plus/minus taps, round completion, online cleanup and six EN/VI layouts. Allocation screenshots were inspected. No map positions or boat routes move. [Details and evidence](../v1.02-family-underpass/README.md).

GitHub UI run 40243382944 passes. Six bridge inspection images (positioned test camera) were captured and inspected in EN/VI across phone/tablet/computer. New serial speed results are in [speed-results.json](../v1.02-family-underpass/speed-results.json): battery passes; world11.305s; first title1.668s; first ready40.361s; second ready28.222s; longest second freeze6.105s; first download1004KB and second0KB. Perf/startup remain red with unchanged budgets. **The new first ready is slower than both prior and live samples and needs investigation.** The largest additional first-start gaps precede solid-map construction; the sample does not establish the water-grid build as the cause. Do not call this only an inherited failure.

A new exhaustive run is being dispatched from the final working-branch head. The earlier speed table below applies to runtime4fd792cfa.

## Voices

The frozen Lê Minh baseline is complete: 6,319 clips independently checksummed and fully decoded, with zero errors. Thirteen reviewed arcade lines, including two renamed family Fruit Bar titles, are also recorded and decoded. Baseline assets are on `work/fpt-leminh-full-20261025`; arcade and ten public title assets are collected on the candidate branch. The title recording commit `715f260d1` remains on its reproducible voice branch. Production selection/cache/download integration is pending, with the female default preserved.

The current Vietnamese default manifest has 6,363 units: 6,341 covered by staged Lê Minh recordings (including ten additional public titles verified in run 40227974447), 19 privacy-held exclusions and three public instructions held for game/copy review. [Voice readiness ledger](../v1.02-audit/VOICE-READINESS.md). The full current game must not be described as already using Lê Minh. After the family-access change, both new public Fruit Bar titles were recorded in FPT run 40243379237 and independently decoded. Default run 40243424013 recorded eight Azure title files and passed coverage. The refreshed ledger identifies 6,342 total staged recordings: 6,341 current units and one historical adult-only title.

Ninety-six missing default Azure recordings were recovered from run 40217606701, fully decoded locally, and coverage reports zero missing. A code push raced with that job's final save; the original generated commit was recovered, without another paid synthesis run. The save step now retries pull/push without repeating recording.

## Local speed comparison

All checks ran one at a time. Battery passes. Perf/startup fail their existing timing limits on the candidate and a clean checkout of live v1.01 (`ac76cf609`). Budgets were not raised. Exact results and provenance: [comparison JSON](../v1.02-audit/speed-comparison-20261026.json).

| Measurement | Live v1.01 | Candidate |
|---|---:|---:|
| World build | 11.14s | 10.76s |
| First title | 1.68s | 2.08s |
| First ready | 31.84s | 28.91s |
| Second ready | 33.04s | 31.76s |
| Second-start longest freeze | 8.55s | 7.29s |
| First download, reported KB | 999 | 1,003 |
| Second download, reported KB | 0 | 0 |

These software-rendered browser timings establish the same failing budget categories on main; they do not prove performance on physical devices. The candidate title is slower in this measurement, while ready times are faster.

## Corrections, failures and retries

- Original helper audit full run: 225/233, phone passed on its second try after a navigation/context failure. Intermediate candidate full run 40197716491: 230/233, failing dailyadventure, default voice coverage and Studio layout assumptions. These are historical results.
- Studio's old test assumed the five tiles were direct page children. Its typed reader now recognizes the overview wrapper and additionally requires all five to be visible; the other details still start closed.
- Functional all-game fixtures explicitly opt into accepted tester access. No game-open/accessibility/adventure assertion was removed.
- The adventure test raced one-second queued narration and assumed a start location/region. Its typed fixture uses a controlled plateau/region and a bounded five-second wait for the same remembered-day state. The complete check passes (253s).
- Reporting fixtures now locate the body-level control and use actual taps/holds. A final-tick polling bug missed a report already arriving at the deadline; three unit cases cover the corrected boundary without extending reporting timeouts.
- Earlier local reporting runs failed freeze/no-open/form timing. Capture profiling identified unnecessary embedded-image reprocessing; the complete reporter and reportingflow pass with their original timeouts after the capture fix.
- GitHub UI run 40219244759 exposed a completed-capture double-click race after an earlier local gesture pass. The latest deterministic reset/draft checks and complete UI workflow pass.
- FPT initially returned HTTP 401 after 1,580 clips. An unchanged-key diagnostic succeeded and the resumed baseline completed. The original provider failure cause remains unproven.
- AI review did not finish; its comment says usage or time may have run out. A successful wrapper is not a completed review.

## Work required before deployment approval

1. Correct/review Cướp Cờ, Đánh Đáo, Ném Còn, Kéo Cưa Lừa Xẻ, Mèo Đuổi Chuột and Đua Thuyền. They remain inaccurate prototypes.
2. Finish Cờ Cá Ngựa's track/rules/dice/turn validation, and the inherited shared-state issues in the other multiplayer upgrades. Family Quiz question/result synchronization also remains incomplete.
3. Integrate the parent-selected Lê Minh provider/manifest/cache/background download, review the remaining speech delta and perform listening/physical-device checks.
4. Review the website's explanations, availability and images against the final games, then regenerate and record the source lock. Its current consistency failure is explicit editorial drift (`coverageChanged: []`), not approval to publish.
5. Finish the exact full regression/code-map collection and resolve any red; retain the measured speed limitations in the owner report.

Manual rules findings remain release blockers alongside automated results. Main/Netlify remains unchanged, and the owner's v1.02 version choice is not deployment approval.

Extended festival integration and types pass 2/2 (85s and 22s): both Studio controls synchronize, all-off removes the website festival section, and service failure retains cached off state. No check was weakened.
