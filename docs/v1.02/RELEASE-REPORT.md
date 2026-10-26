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

Latest completed exhaustive GitHub run: [40256019376](https://github.com/nguyentuanphu/tpn/actions/runs/40256019376), exact runtime **deb6eba06**, **236/237**. Its only failure was voicecover for turtle clips, before the recording jobs finished. The clips have since arrived and local coverage is zero missing. This does **not** replace a full run on the latest candidate.

**Passed only on a second try in that run:** `ownerreportedphonevi` (screen assertion), `testerreport` (freeze report not detected on the first attempt). Keep both in the final report. Official code map from **ab5cb1293** collected for that exact run. Bot-pushed follow-up runs marked action_required did not execute tests and are not passes.

Local targeted checks pass: games (206), under-five adventure coverage, a11y and solid collision; room-startup cancellation; Studio → public website → game festival sync, both Studio controls, all-off and cached-off outage handling. First festival integration caught an annual override being removed by an unrelated save; source fixed, subsequent run passed. Seven focused festival/turtle units pass. The prior 231/235 full run's four failures are fixed and pass in the newer GitHub run.

Lê Minh browser check passes using 18 real recordings: female default avoids optional fetch; preview preserves parent choice; download survives Settings close; mobile permission can stop and resume the download; female character speaks Lê Minh offline. Existing male/female preview/background-download regression passes (110s). Final bilingual layout check and types pass **2/2**, with **152 explicitly checked files and 49 server/Studio files**. A newly included test-file type error (generic DOM element versus details element) was fixed before that pass. Four focused service units pass, including full-storage reporting and corrupt-file rejection. Six EN/VI voice-settings screenshots and six EN/VI festival screenshots were inspected at phone, tablet and computer sizes. Three new FPT turtle clips independently checksummed and fully decoded.

AI review is **unfinished** (usage/time exhausted; a green wrapper is not an AI verdict). One accidental local --help invocation started suite workers and was stopped immediately; incomplete output is not a result. No local full suite was run to completion.

## Remaining before deployment

1. Repair six inaccurate folk prototypes: Cướp Cờ, Đánh Đáo, Ném Còn, Kéo Cưa Lừa Xẻ, Mèo Đuổi Chuột and Đua Thuyền.
2. Repair Cờ Cá Ngựa track/rules/NPC/networking and shared multiplayer validation/renderers (including Snakes, Ô Ăn Quan, Kéo Co and Family Quiz).
3. Complete website editorial/source consistency review against the final game content. Its gate is still red; do not blindly record a reviewed lock.
4. Finish an exhaustive GitHub run on the resulting source, fix every red check, collect its official code map, and keep retries visible.
5. Fresh serial perf/battery/startup comparison and performance investigation. Earlier runs predate removal of 87 orphaned headless browser groups. Battery passed; prior candidate world11.305s, first ready40.361s, second ready28.222s, freeze6.105s, secondKB0. The first-ready result was slower than live/prior samples, so it remains unresolved. Budgets were not raised. [Raw prior speeds](../v1.02-family-underpass/speed-results.json).
6. Physical-device listening and native riding-camera confirmation remain outstanding. Browser captures are not physical-device proof.
7. Give the final report and ask the owner's deployment pop-up. Never merge/main/Netlify without approval.

The proposed full Studio redesign remains a separate proposal. Earlier detailed progress and speed comparisons are preserved in [the previous checkpoint report](RELEASE-REPORT-before-hanoi-production.md).
