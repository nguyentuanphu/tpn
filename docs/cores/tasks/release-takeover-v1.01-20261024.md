> **Release completed: v1.01 is live.** Owner approved deployment after checks; final run 40126459616 passed 233/233 (roadtone second try), PR #506 squash-merged as aa728084, live sw.js/js/build.js/home verified at 7:41 am AEDT. ZIP waived; official code-map c863b373 recorded. See [final report](../../v1.01/RELEASE-REPORT.md). The stopped-work snapshot below is historical, not a current task list.

# Release takeover — v1.01 — stopped at owner's request

24 October 2026 AEDT. Owner said: “Stop and upload what you do, another AI will take over your work.” No deployment approval. Do not merge or deploy. Resume only when assigned by the owner.

Repository: https://github.com/nguyentuanphu/tpn. Branch `release/r91`, draft PR #506. Live remains main `ef330bc0`, r90 publicly v1. Proposed version v1.01 still needs final confirmation with “yes, deploy”. Read CLAUDE.md, HANDOFF.md, docs/README.md, cores README/BOARD/release and the original release-handover-v1.01.md first; this note supersedes its stale progress.

## Collected and implemented

Helper `work/r91-front-desk` at 60645b8d was merged. It finished brief items 1–3 and the ResizeObserver filter part of item 8, not all eight items. See `docs/v1.01/RELEASE-REPORT.md` for the item-by-item audit.

- Fixed-report tab, quiet coins, single/all answers, keyboard/aria fixes, ladybird count and public version formatting. Latest e8887bb5 fixes stale fixed-tab count after an answer; its added browser assertions still need CI.
- Save/Load one copy, legacy v2 compatibility and preserving current device identity when legacy data omits it.
- Simple Home at top beside audio/parents, 64px controls, shared unlock filtering.
- Encrypted cloud-photo race across refreshed same-key hello records. Admission, room, key and removal guards retained. Own-face rendering tested on both browser fixtures.
- Actual male preview selection survives async playback. Female default retained, male optional; preview does not opt into downloads. Offline download is a shared background task independent of the Settings DOM, continues after Save & close while game stays open, uses shared progress and preserves automatic mobile-data policy.
- Floating settings close/save geometry fixed after screenshots. Under-five fixed-report actions now 64px. Parent-panel focus cannot scroll its header away.

Commits: 9c0f797f is unchanged extras.js → extras.ts rename; 700715e4 main repairs; afbb89dc initial website sync; 990b428a screenshot geometry repairs; a675fb41 parent overflow/family wording; e8887bb5 fixed-tab count. The following upload commit contains website sync, screenshots, reports and this handover. Do not reset any of them.

Approved exact family-code copy (feature NOT implemented):
EN: Link your family’s devices for statistics only—no progress or photo sharing. Keep your code private.
VI: Liên kết thiết bị để thống kê gia đình—không chia sẻ tiến trình hay ảnh. Giữ riêng mã gia đình.

## Verification and limits

- Unit 225 pass; emoji, preload, architecture and types pass. Types rerun after floating wrapper change passed.
- Sequential targeted run 5/5: voicebackground 84s, testerrewards 310s, simple 275s, secondset 45s, cloud 443s. These preceded final UI/count commits; final suite required. New voice fixture mistakes were corrected before passing, not an unchanged flaky test retry. testerrewards changed speech expectations to the owner's quiet-coins behaviour; badge, gear, sticker and reward assertions retained.
- Local sequential speed: battery PASS 148s; perf FAIL worldMs 11044 > 6600; startup FAIL timing, but secondKB = 0. Evidence in docs/v1.01/local-speed-*. No limits weakened. Same-machine v1 baseline comparison has NOT run. Do not call these green or an established baseline.
- GitHub run 40067054592 on OLD head afbb89dc: last observed in progress, all shares except share 2 completed successfully; share 2 still running. Push restarts/cancels via workflow concurrency. Check latest full-suite comment and checks on PR #506 for the uploaded head. The final runtime has NOT passed full regression.
- 42 full-game screenshots, seven visually reviewed contact sheets, plus 18 final parent-panel screenshots under docs/v1.01-shots. Main six-layout geometry checks pass, no page errors. Final parent geometry checks pass; final parent pictures still need visual inspection. `before/` intentionally preserves initial layout failures. Capture/verification scripts included, synthetic profiles only.
- Website source lock reviewed against immutable runtime e8887bb5; sync reports no drift, generated website rebuilt. Parent picture manifest pins a675fb41 (actual final parent UI). Do not keep re-pinning to docs-only commit hashes.
- No Netlify ZIP, final code-map, Robot x5 replay, physical iPhone/listening or owner two-device photo verification yet. No issues closed. No Studio EXE: online only.

## Remaining work, in order

1. Fetch/pull release/r91; inspect latest GitHub run on #506 and fix every red check without weakening it. Never two local suites/browser capture jobs at once. Track true second-try passes explicitly.
2. Review final parent screenshots EN/VI phone/tablet/computer. Check final tester count/64px assertions in full CI.
3. Compare perf/startup on detached live v1 source ef330bc0 on the same machine, investigate timing failures. Existing worktree `/workspace/tpn-v1-baseline` has dependencies/build prepared, but no baseline tests run. Local candidate speed evidence already saved. Use `SV_URL=http://127.0.0.1:8767/` with its server if reusing it; start a fresh server when needed.
4. Replay #448/#449: `cd tests && node owner-autoplay-plans.mjs --speed=x5 --ids=robot` (EN/VI). Investigate freeze groups and Play Outside tap waits from the 8-item brief; not fixed/closed. Theatre-film group is largest; audit issues afresh. Raw issue payloads were kept outside repo for privacy.
5. Family-code creation/join/QR/hash is plan only despite approved copy. Decide scope transparently with owner; do not claim it shipped. Review privacy before implementation. Plan is save-copy-family-code.md.
6. Fetch official code-map branch after completed final GitHub run; commit its tests/check-map.json and tests/check-times.json with provenance. Local generated check-times were restored before upload, not substituted as official artifacts.
7. `sh build-netlify.sh`, verify ZIP and versions. Voices ~415 MB, ZIP too big for a normal GitHub source commit; supply download/file artifact, not a tracked giant ZIP. Do not deploy the build.
8. Update final report, board and PR body. Send ZIP/report with remaining limitations; confirm v1.01 and ask owner one pop-up “yes, deploy”. No approval yet. After explicit approval only: ready/squash-merge #506, verify live sw.js/js/build.js/home version, close only truly fixed issues with “Fixed in v1.01”, update board/release docs. Re-date SW version if deployment day changes.

## Workspace/tools notes

Primary `/workspace/tpn-release`, branch release/r91. Dependencies symlinked from `/workspace/Sparkle-Valley/tests/node_modules`. Original marketing worktree not touched. Origin renamed to tpn. Fetch refspec is stale/narrow: fetch explicit refs for main, release/r91, work/r91-front-desk and code-map.

Servers used: repo HTTP8765, local services9000/9001, isolated parent capture8766, baseline8767. All are stopped for this handover if their exact owned PIDs were identifiable; verify ports before restarting. No browser/test jobs left running. Do not use pkill/pgrep -f patterns matching your own shell. Python servers expire after two hours; use background with longest timeout.

Questions only as pop-ups with 2–4 choices, recommended first. Times Sydney AEDT. Pull `git pull --no-rebase` before each push, never force. Old gh supports REST PATCH but gh pr edit fails classic-project GraphQL query; use structured JSON file with gh api if needed. No suite was started after the stop instruction. Upload triggers GitHub CI automatically; it was not manually started.
