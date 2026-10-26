# v1.02 release review · in progress

Updated 27 October 2026, 5:10 am AEDT. Live remains **v1.01**. Candidate: `work/v1.02-fruit-parade`, draft [PR #602](https://github.com/nguyentuanphu/tpn/pull/602). **Not ready for deployment approval.** The owner selected v1.02 and waived the ZIP. No v1.02 merge or deployment is approved. Release is working alone at the owner's latest instruction.

## Changes prepared

- Fruit Parade has three lanes per player. Orchard Quest is a separate picture-mission game, available to accepted testers through its own Studio switches. Fruit Bar is for children and adults, with public single/multiplayer switches and separate tester preview; switches default off. Its free session counters never use child coins, purchases or cash-out.
- Trồng Nụ Trồng Hoa uses a large hand-and-foot stack and jumping, replacing the unrelated planting-memory prototype. Cờ Cá Ngựa uses legal one-die classic rules and a gentle adaptation with real 2–4-seat shared boards. Six Vietnamese folk activities now show their actual actions and cultural context: Cướp Cờ, Mèo Đuổi Chuột, Ném Còn, Đánh Đáo, Kéo Cưa Lừa Xẻ and Đua Thuyền. They are labelled screen adaptations.
- Shared Snakes and Ladders, Ô Ăn Quan and Kéo Co have actual board/rope progress, legal host-ordered commands, agreed youngest-player difficulty, replay/recovery and explicit local continuation. Ô Ăn Quan preserves the existing sow/capture/borrow/repay rules and seed conservation. Kéo Co supports 2–6 accepted seats with normalized teams and bounded concurrent pulls.
- Parents can create private Family Quiz questions in protected Grown-ups settings, retain them in the existing save-copy format and play with accepted friends. Shared private snapshots use recipient-bound ECDH/AES encryption. Guest copies are temporary. Malicious picture IDs cannot create HTML; reports, replay and screenshot capture redact private question/editor content. Private speech uses only explicitly offline local device voices; otherwise families read together. Studio clearly distinguishes site-wide published questions from this private editor. Older copies still load; replacing saved family content requires the existing confirmation.
- The ladybird floats above games and windows, can be dragged, remembers its device-local position and resets on double-tap. Report drafts survive movement/reset. Duplicate named Brisbane destinations are grouped without removing physical stops.
- Swimmers cross all 13 bridge underpasses. Water-level collision retains bridge supports; deck rails and ferry/raft route checks remain. The solid check observes actual player height.
- Studio preserves five analytics tiles with persistent bilingual folds and responsive alignment. A broader Studio redesign is a separate proposal.
- Festival switches in both Studio screens drive website listings, related guides, game calendar, notices, decorations and activities. Explicit off overrides manual selection/tester preview. The public endpoint contains festival fields only; pages refresh on focus/visibility and every 60 seconds, retaining the last snapshot offline. This final audit found and repaired a generator-template omission that removed visibility hooks on website rebuild. It also aligns scheduled festivals and public visibility to Sydney calendar days.
- Friends startup rejects stale attempts and safely handles a missing relay. Turtle Counting uses the exact recorded lines.
- Parents can select **FPT Neo Lê Minh** for Vietnamese speech, including Vietnamese fragments within English recordings. Female remains default. Fragment playback is preflighted and joined into one buffer; missing/corrupt parts fall back to the entire original recording. Provider-specific verified caching/downloads survive Settings close while the game remains open; mobile permission is visible and revocable. Private user text is excluded from recording jobs and missing-line harvesting.
- Current local optional Lê Minh package: **6,663 verified public units**, **435,948,496 bytes (~416 MiB)**. All 340 reviewed delta clips independently pass receipt bytes/SHA, duration and full MP3 decode. Nineteen privacy-held units remain excluded; no unknown public Vietnamese gap. Azure run40362276888 completed; all1,442 English fragment files are collected. Current coverage reports zero missing; independent full MP3 decoding passed for all1,442 clips.
- Website copy now explains the actual folk/shared games, private family questions, parent controls, voices, festivals and rewards in both languages, with 17 game photos and four main destinations. Final source lock and current parent/Studio captures remain in progress; source-drift review is not bypassed.

All new feature logic is TypeScript. The legacy repository is not entirely converted. Existing drawing-game work and later startup/TypeScript plans retain their own scope; this report does not claim a new drawing-game batch.

## Verification

Latest completed exhaustive [GitHub run 40362309176](https://github.com/nguyentuanphu/tpn/actions/runs/40362309176), source `4f1c7e023`: **242/247**, no second-try passes in all eight worker logs. Five initial/retry failures: voicecover lacked1,442 English fragment files (now collected with zero missing coverage), and festcal/festivals/ownerdecorworld/autoplay exposed the Sydney-vs-device schedule mismatch (targeted repairs pass). [Exact findings](../v1.02-audit/github-40362309176.md). Final code/assets need a fresh exhaustive pass and official map.

Prior source `c1a2c5b27` passed 240/240 in 40278772969 with no retries; its exact map is collected. It predates the final changes. Bot runs marked action_required executed no checks and are not passes.

Local completed evidence includes legal full shared matches, replay/transport/consent/rate checks; 330 unit tests; actual Family Quiz private flows and report/screenshot redaction; selected-voice composition and fallback; parent download/background/offline checks; all 13 bridge crossings and deck/boat checks; and EN/VI phone/tablet/computer captures of the changed games. Family Quiz editor and game contact sheets have been inspected. Current types pass with 195 explicit files plus 51 server/Studio/tool files. Real Studio → rebuilt website → game off/on/off and bootstrap pass 2/2. Sydney calendar repair: festcal passed; after an environment restart, the resumed festivals/whole-world decorations/unit/types run passed 4/4. All placement, no-overlap, off-precedence and game-rule assertions remain.

Historical second-try cases remain disclosed: animalvoices in 40286660229 (fixture settled before a delayed welcome sticker sound; isolated actual-animal assertions retained and strengthened), filmmusic in 40267531199, ownerreportedphonevi and testerreport in 40256019376, and phone in the initial audit. Current final-run retries will be added explicitly.

AI review is **unfinished** due to usage/time exhaustion. A green workflow wrapper is not a review verdict. Browser evidence is not physical iPhone/iPad listening, native riding-camera or real two-device proof.

## Local speed comparison

Serial checks, unchanged budgets, same machine. Final network repair restores **secondKB0**. Reusing the initial live-settings request removes the duplicate startup festival request; later public refreshes remain. Festival formatting now reuses its formatter and skips date work for unscheduled rules.

| Measure | Live v1.01 | Candidate before repair | Candidate after repair |
| --- | ---: | ---: | ---: |
| World build | 13.934 s | 18.102 s | 14.475 s |
| First ready | 31.130 s | 48.943 s | 35.262 s |
| Cached ready | 41.738 s | 44.611 s | 42.128 s |
| Cached freeze | 8.252 s | 10.290 s | 10.423 s |
| Second-start network | 0 KB | 1 KB | 0 KB |

**Perf and startup remain red against their unchanged timing limits on both versions.** The repair substantially reduces the candidate slowdown, but timings remain a disclosed limitation. The startup calibration probe was169ms for live and218ms for the candidate, so the machine also varied between serial runs. No JavaScript errors or muted voice-index loads were observed. Candidate battery previously passed187s; final follow-up pending. Raw comparisons: [live](../v1.02-audit/live-same-machine-speed-20261027.json), [before](../v1.02-audit/speed-before-festival-bootstrap-20261027.json), [after](../v1.02-audit/speed-after-festival-bootstrap-20261027.json).

## Open tester reports outside the verified fixes

A fresh GitHub check on27 October2026 AEDT found live-v1.01 reports that this release must **not** close without reproduction and a verified repair: [#603](https://github.com/nguyentuanphu/tpn/issues/603) Hanoi electric-cart dark windscreen/road view; [#605](https://github.com/nguyentuanphu/tpn/issues/605) Terracotta Army placement near Hanoi; [#606](https://github.com/nguyentuanphu/tpn/issues/606) Sword Lake appearance; [#607](https://github.com/nguyentuanphu/tpn/issues/607) obstruction near(179,-134). Recent freeze/slow reports include#604,#608–611 and recurring#404/#561/#570. These remain open; browser rule/geometry checks do not establish a physical iPhone fix for them. Earlier startup#36 and road-art#34 also retain their scope. No claim that all repository bugs are resolved.

## Still required

1. Finish the final serial battery follow-up; preserve the red timing results and baseline comparison above.
2. Collected English fragments independently pass full decode; coverage is zero missing and the verified optional package has been rebuilt. Final GitHub voicecover remains required.
3. Finish current parent/Studio captures, inspect the website, record its immutable reviewed-source lock and rebuild/check production `/home/`.
4. Push the complete candidate, fix every red GitHub check, collect the final exact code map and update this report/board/PR description.
5. Present the final review and request one explicit **yes, deploy v1.02** pop-up. Main, Netlify, issue closure and Studio publication wait for that approval.

[Detailed game evidence](../v1.02-traditional-repairs/README.md) · [Previous checkpoint preserved](RELEASE-REPORT-checkpoint-20261026.md).
