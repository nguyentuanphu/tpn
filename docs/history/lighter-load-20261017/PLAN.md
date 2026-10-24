# S5 and S4: measured plan, approved

17 October 2026 AEDT. Helper chat; no release authority.
Repository: nguyentuanphu/Sparkle-Valley. Branch work/lighter-load-20261017, based on main 07d8204.
Read CLAUDE.md, HANDOFF.md and Part 2 of the TypeScript plan on work/typescript-plan-20261016; core ownership notes, board, UX-001–010, architecture overview and existing performance checks also inspected.
Owner explicitly approved: "Go with both; keep all offline". Pop-ups did not display; approval was given in chat. Implementation starts on main cc49c7f (only a board update since measured 07d8204).

## Measurements

esbuild 0.25.10, using tools/bundle.mts entry points and options, write:false. Metafile and verbose size report are beside this document. The launcher has a dynamic import of main: following static imports alone from launch would incorrectly report only 5,040 bytes. Following main and its static dependencies gives 39 JS chunks, 144 source inputs, 2,429,131 bytes (2.429 MB decimal), 849,011 bytes with per-file gzip, 707,066 bytes with per-file Brotli. These are local compression estimates, not observed browser transfer totals. All JS outputs including deferred content total 3,385,779 bytes. Minified CSS adds 257,734 bytes (54,701 gzip). Initial JS + CSS is 2.687 MB before HTML, fonts and runtime requests. The old plan's 2.6 MB is not a fresh browser measurement; main now has a 2.9 MB ratchet.

Selected source contributions to initial JS (bytes in minified outputs, excluding chunk glue):

| Content | Bytes |
|---|---:|
| three.js | 660,349 |
| art.js | 140,394 |
| ui.js | 119,285 |
| main.js | 115,413 |
| games directory including common frame/registry | 226,608 |
| howto.js | 44,709 |
| talesdata.js | 42,126 |
| story.js | 14,678 |
| all sticker modules | 31,511 |
| net.js | 35,353 |

These candidate sizes are upper bounds on removable startup code, not guaranteed savings: shared modules and registration side effects must remain available. Film source modules contribute zero bytes to this initial graph. Reading and chapter film modules are already split. Some apparent dynamic imports (net, sticker effects and tales data) point to small wrappers because static imports elsewhere already pull most of the content into startup.

Live Netlify read-only HTTP GET checks: HTML and bundle/main-PRMKC3H5.js returned 200, Content-Encoding: br and Vary: Accept-Encoding. Compression works for those samples. This is not proof that every live asset or custom domain has the same headers, nor that deployed code equals local main.

Voice manifest: 365,104 bytes raw, 168,430 gzip; 10,720 line hashes. In-memory per-language serialization retaining compatible fields, only that language's cast/voices/templates and its line hashes:

| Language | Hashes | Raw bytes | Gzip bytes |
|---|---:|---:|---:|
| English | 5,421 | 137,234 | 59,088 |
| Vietnamese | 5,255 | 226,013 | 108,655 |
| Chinese | 22 | 1,088 | 481 |
| Hindi | 22 | 1,096 | 486 |

Vietnamese keeps the old redundant `other.vi` membership string for compatibility in this conservative estimate. A later explicit language format can remove that duplication, but is not needed for the first split. S5 saves roughly 62% raw for EN-only, 38% for VI-only; gzip saving roughly 65% and 35%. Both-language families still need both indexes. Current manifest is already deferred until a tap or after world readiness; S5 does not directly remove title-screen bytes.

## Proposed S5 implementation, first

1. Generate voices/manifest-en.json, manifest-vi.json, manifest-zh.json and manifest-hi.json deterministically from the existing pack; keep hash, MP3 paths, gender slots, template pieces and recordings unchanged. Retain the aggregate manifest for old clients and Studio/tool consumers during migration.
2. Update js/voice.js to request selected EN/VI only, both when bilingual is on, and ZH/HI only on explicit speech in that language. Handle language/settings changes, awaited first speech, failed fetch retry, concurrent requests and stale refresh messages per language. Merge loaded indexes into the existing playback interface; reset template caches on replacement.
3. Update js/voicepack.js so downloading sees loaded language indexes and uses stable per-language pack signatures. A newly loaded second language must not falsely invalidate the first or restart saved MP3 downloads. Keep mobile consent, area order and audio pacing.
4. Extend only sw.js's voice-manifest route and message metadata, retaining cache-first/background-refresh, update safety and existing sv-voices MP3 cache. Do not add every language index to the eager offline FILES list. Do not change VERSION or any photo code.
5. Ensure all manifest writers (Azure, partial checkpoints, daily voices and Studio publishing) regenerate matching shards. Inspect aggregate consumers before touching their contracts; keep Studio aggregate reads working. No Azure recording or MP3 re-encoding needed. Keep areas.json unchanged in this batch unless evidence shows a required compatibility fix.

Expected files: voices/manifest-*.json; tools/make-voice-pack.mts and any manifest-writing helper discovered; js/voice.js; js/voicepack.js; the voice-only route in sw.js; focused existing voice checks. Aggregate manifest stays available. Record ownership and decisions in docs/cores/voice-audio.md, analytics-infra.md and BOARD.md after go.

## Proposed S4 implementation, second and incremental

1. Add repeatable esbuild metafile/size reporting in tools/bundle.mts, including launcher, main dependency closure, all deferred chunks, CSS and compression estimates. Do not equate a dynamic wrapper with fully deferred code.
2. Defer How to play rendering/content and tale bodies until opened. Keep small titles/IDs/catalogue data eagerly available for menus, quests and shared stories. A requested prologue still starts at the same point. Files likely involved: js/howto.js, js/talesdata.js, js/tales.js, js/story.js, callers in js/ui.js and js/main.js, plus small content catalogues.
3. Split game catalogue metadata from implementations in js/games/all.js, registry.js and frame.js. Keep synchronous IDs/titles/categories/age filters for NPCs, Simple screen, hub, online invitations and Studio; load an implementation group when its game opens. Deduplicate simultaneous opens, support cancellation and return navigation, and retain missing-chunk update recovery. All entry paths must use the loader; changing all.js alone is insufficient.
4. Treat sticker content as a separate later sub-batch coordinated with its active chat. Rewards and saved ownership need a small always-ready core; opening Album can load richer presentation later. Leave three.js, art and world construction alone (S2/S3 excluded). Online startup is a later candidate, not bundled into this first S4 pass.
5. Offline policy: currently tools/bundle.mts puts every output into sw.js FILES and sw.js installs all chunks with six fetch workers. Code splitting alone does not stop an early network download. Recommended first pass preserves all-content offline availability and schedules optional precaching after mandatory startup; it still eventually downloads the complete offline game. True download-only-when-opened would change first-use offline availability and needs a separate owner choice. Any scheduling change stays in installer/bundle logic and leaves photo routes untouched. Release owns version bumps and integration with S1.

## Checks after approval

Before/after packed browser resource measurements to title and valley-ready, plus separate offline-install transfer total. Confirm observed timings/transfers with perf, startup and battery; only lower applicable baseline ratchets after repeatable improvement, never increase limits. Voice splitting needs its own byte/network assertions because the manifest is already post-startup.

Voice checks: voice, voicepack, welcomevoice, voicecover, voicearea, viwords; targeted cases for EN-only/VI-only/bilingual, live language switch, explicit ZH/HI, offline cached playback, stale/missing index, update refresh, no repeated saved MP3 download. Offline and update checks plus Studio manifest compatibility.

S4 checks: boot, contract, playhub, simple, adventure, relevant games/stories/films and together paths, offline and update recovery. Review unchanged screens in EN/VI on phone, tablet and computer (portrait/landscape where applicable). Run tests/suite.mjs --changed according to CLAUDE.md; if it selects full suite, push only this working branch and dispatch the GitHub full-suite workflow. No full local suite. No runtime regression tests have been run for this plan-only analysis.

Leave for later: S1/photo work, S2/world construction, S3/draw calls, S6/audio codecs, TypeScript migration, version bump, merge and deployment. Never merge to main. Owner go received; no merging or deployment authorized.
