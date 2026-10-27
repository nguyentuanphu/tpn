# v1.02 release review · 26 October 2026, 03:07 PM AEDT

Live remains **v1.01**. Candidate: `work/v1.02-fruit-parade`, draft [PR #602](https://github.com/nguyentuanphu/tpn/pull/602). No deployment approval. The owner authorized routine branch fixes without more questions; final deployment still requires explicit **yes, deploy**. The ZIP is waived for this session.

## Completed

- Typed Fruit Parade with three lanes per player; separate Orchard picture missions; Fruit Bar for children and adults with public Studio single/multiplayer controls and separate tester preview. All new arcade switches default off. Orchard remains accepted-tester-only. Fruit Bar uses free session counters without child coins, saves, purchases or cash-out.
- Large Trồng Nụ Trồng Hoa hand-and-foot-stack jumping adaptation; genuine gameplay replaces the old planting-memory prototype.
- Floating, draggable tester ladybird above games and windows; device-local position, double-tap reset, edited report drafts retained. Duplicate visible Brisbane destinations grouped without removing physical stops.
- Swimmers pass under all 13 bridges. Water-level collision retains actual supports; deck rails and boat/deck checks remain. The solid regression now observes the player's actual height.
- Studio preserves five analytics tiles with persistent bilingual folds and responsive alignment.
- Shared festival visibility: either Studio screen publishes the same off/on switches; the website, game calendar/notices, decorations, activities and previews follow them. Public-only endpoint exposes no family content. Open pages refresh on focus/visibility and every 60 seconds. Offline pages retain their last snapshot until reconnecting. Date/decor overrides and unrelated switches survive saves. [Festival evidence](../v1.02-festival-sync/README.md).
- Friends startup safely cancels stale attempts and handles a missing relay instead of throwing on `door.connected`.
- Turtle-counting inventory uses the exact spoken utterances. Default and FPT recording jobs succeeded; default coverage is **zero missing**.
- Optional parent-selectable **Lê Minh** production pack: **6,344 verified current public units**, **424,275,298 bytes (~405 MiB)**. Female remains default; family recordings retain their existing priority. Provider-specific IDs/cache, byte/checksum verification, resumable service-owned downloads and visible/revocable mobile permission. Closing Settings keeps the job running while the game is open. Private speech is never sent to FPT. Nineteen privacy-held units and three unreviewed prototype instructions remain excluded. [Voice ledger](../v1.02-audit/VOICE-READINESS.md).

New feature logic is TypeScript; the entire legacy repository has not been converted.

## Verification and failures

Latest completed exhaustive GitHub run: [40267531199](https://github.com/nguyentuanphu/tpn/actions/runs/40267531199), exact head **bed1f1672**, **237/238**. Only hanoivoice failed, both initially and alone. Reproduced locally: the concurrent default download overwrote the completed Lê Minh progress label. The fix tracks both providers independently; the stronger regression requires a default loading event after optional completion and retains both labels. Its first local follow-up passed hanoivoice/voicebackground/types3/3; latest rapid-preview follow-up also passes: hanoivoice108s, voicebackground104s, types23s (163 explicit/49 server and Studio),3/3.

**Passed only on a second try:** filmmusic in run40267531199; ownerreportedphonevi and testerreport in prior run40256019376. Keep all in the final report. Official code map from40267531199 collected fromed1103d94. Its generated metadata names23084a2d (the bot commit pushed during the run); the run itself testedbed1f1672. This mismatch is disclosed, not treated as final exact-head evidence. Bot-pushed runs marked action_required did not execute tests and are not passes.

Local targeted checks pass: games (206), under-five adventure coverage, a11y and solid collision; room-startup cancellation; Studio → public website → game festival sync, both Studio controls, all-off and cached-off outage handling. First festival integration caught an annual override being removed by an unrelated save; source fixed, subsequent run passed. Seven focused festival/turtle units pass. The prior 231/235 full run's four failures are fixed and pass in the newer GitHub run.

Lê Minh browser check passes using 18 real recordings: female default avoids optional fetch; preview preserves parent choice; download survives Settings close; mobile permission can stop and resume the download; female character speaks Lê Minh offline. Existing male/female preview/background-download regression passes (110s). Final bilingual layout check and types pass **2/2**, with **152 explicitly checked files and 49 server/Studio files**. A newly included test-file type error (generic DOM element versus details element) was fixed before that pass. Four focused service units pass, including full-storage reporting and corrupt-file rejection. Six EN/VI voice-settings screenshots and six EN/VI festival screenshots were inspected at phone, tablet and computer sizes. Three new FPT turtle clips independently checksummed and fully decoded.

AI review is **unfinished** (usage/time exhausted; a green wrapper is not an AI verdict). One accidental local --help invocation started suite workers and was stopped immediately; incomplete output is not a result. No local full suite was run to completion.

## Remaining before deployment

1. Six folk repairs now pass actual gameplay in both age modes,300 units/types and36 reviewed bilingual/device layouts; record/package their new lines, verify final source on GitHub. Corrected ribbon captures have been retaken and reviewed. See traditional-game evidence.
2. Cờ Cá Ngựa repair now passes local rules/real four-seat transport/playable-board/layout checks; collect its new recordings and verify it on GitHub. Shared multiplayer validation/renderers for Snakes, Ô Ăn Quan, Kéo Co and Family Quiz remain pending.
3. Complete chosen-voice handling for Vietnamese words inside English recordings and rapid preview switching; then complete website editorial/source consistency review against the final game content. Its gate is still red; do not blindly record a reviewed lock.
4. Finish an exhaustive GitHub run on the resulting source, fix every red check, collect its official code map, and keep retries visible.
5. Fresh serial perf/battery/startup comparison and performance investigation. Earlier runs predate removal of 87 orphaned headless browser groups. Battery passed; prior candidate world11.305s, first ready40.361s, second ready28.222s, freeze6.105s, secondKB0. The first-ready result was slower than live/prior samples, so it remains unresolved. Budgets were not raised. [Raw prior speeds](../v1.02-family-underpass/speed-results.json).
6. Physical-device listening and native riding-camera confirmation remain outstanding. Browser captures are not physical-device proof.
7. Give the final report and ask the owner's deployment pop-up. Never merge/main/Netlify without approval.

The proposed full Studio redesign remains a separate proposal. Earlier detailed progress and speed comparisons are preserved in [the previous checkpoint report](RELEASE-REPORT-before-hanoi-production.md).

## Latest local horse repair

See [traditional-game evidence](../v1.02-traditional-repairs/README.md). Combined local horseplay/unit/types3/3,295units; reviewed-layout/types2/2 after stronger visibility/capture checks. Four-seat actual transport match and replay/mixed-age tests pass. New horse voice delta and latest-source GitHub checks remain pending. No other multiplayer adapter is implied fixed by this result.

## Owner-requested handover · 26 October 2026, 5:10 pm AEDT

Owner requested a ten-minute wrap-up and upload. Codeadb9a0b7d/8a4a46ebe pushed; FPT6a670a255 collected. Delta57/57 succeeded in40277620143 and every MP3 independently byte/SHA/full-decode checked. Default Azure40277620142 and exhaustive40277800123 were still running at this checkpoint. Fast Checks failed only on tick emoji characters in saved evidence logs; replaced with plain PASS and local emoji1/1 passes. Website consistency remains red. Production6344 count is the preceding package until new default inventory arrives and packaging runs again. No remaining shared-adapter/mixed-language work is claimed completed. See [takeover instructions](../cores/tasks/v1.02-release-takeover-20261026.md).

## Production voice package resumed

Owner asked this chat to continue; no other chat works on the branch. Isolated the57-entry delta from older overlapping receipts, retaining all verification checks. Rebuilt production6384 units/427403942 bytes (~408MiB). Current VI inventory6403; only19 privacy-held units absent, no unknown public gaps. Default Azure completed, zero missing. Latest package browser/types follow-up2/2 (110s/21s). Earlier packaging-blocker/6344 statements describe the handover snapshot and are resolved. Snakes shared four-seat repair is now in progress, not yet release-ready.

## Shared-game progress

Prior-source exhaustive40278772969 onc1a2c5b27 passed240/240; all eight worker logs contain no failure/retry entries. Exact official map0a2beb726 collected. This does not replace a final run for new source. Snakes/Ô Ăn Quan are pushed6c2e2ff23, their new run40285147018 is running. Kéo Co now passes actual six-seat browser/protocol/rate-limit tests, with the combined local4/4 including315units,179explicit types/49 server and Studio, and24 reviewed Tug/Snakes device-language-mode captures. Family Quiz, mixed-language chosen voice, website/source review and final speed/device checks still block deployment.
