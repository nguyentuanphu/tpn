**ready for Release** (3 Nov 2026, 5:55 pm AEDT)

# v1.08 helper "fixes": the round's full-suite failures

Branch `fix/v108-suite`, made from `origin/fix/v108-startup-art` (3 Nov 2026 AEDT). Brief: Release's message
(full suite on PR #807, run 41551913879, head 57ce9ffe, 275/305). The full suite is left for Release.

## Plan

Find the cause of each red check, fix it at the code, check it locally with `node suite.mts --jobs 1 --only <names>`.

## Causes and fixes

| Check | Cause | Fix |
| --- | --- | --- |
| preload | index.html's preload list predates the new v1.08 files | `node tools/preload.mts` (158 scripts) |
| offline, swupdate | the 15 new v1.08 files that the game loads (games, metas, `js/art/games108.js`, `js/art/companion-hats.js`, `js/content/science-places.js`, `js/content/tiengviet2.js`) were not in `sw.ts` FILES, so they were not kept offline and were fetched again after an update | added to FILES in one block `(v1.08 fixes)` |
| voicearea, unit 498 | merging the helpers' `voices/manifest.json` took the union of `lines` but kept only one helper's `other` (the list of Vietnamese-only lines), so 1,491 Vietnamese lines (2,982 files) were looked for under `voices/en/` | `other.vi` (and zh, hi) rebuilt as the union of every helper branch's `other`; every line now has its file; shards rebuilt with `node tools/split-voice-manifest.mts`, areas with `make-voice-pack.mts --areas-only` |
| one shard stopped (20 checks) | `tests/harness.mts`: the `content/custom.json` route called `route.fetch()` after a check had closed its page ("Request context disposed"); the error was thrown outside any check and stopped the whole run, and every later check in that shard | the route ignores only that closed-page error; anything else still fails |
| gamespace (now owned by helper layout) | English mode put the Vietnamese hint row (44/64 px) under the guide, so the 8 English games' top band was 158 px; on a tablet two things to count filled 40% | the hear button sits beside the level and stars, the Vietnamese line is a thin line under the playing area (`js/englishmode.ts`); 1 to 3 things to count are drawn bigger (`js/games/english.ts`). Release: keep or drop against `work/v108-layout` |
| voicearea (Wi-Fi part) | `js/voicestore.ts` compact() read slices of a cached Blob one after another; on this Chromium (153) a read never finished, held the store's queue, and nothing after the core downloaded. Same on main (v1.07) here | the small bundle is read once as an ArrayBuffer and cut in memory |
| reportburst | since #780 #781 (`js/content/tester.ts` keyOf) details differing only by numbers are one problem, so the check's "burst 0".."burst 11" became one report | the check's 12 details differ by a letter (what it proves is unchanged) |
| voicecover | 12 notification lines (6 EN, 6 VI) had no Azure recording | recorded with Azure (24 files, female and male) |
| ownerstudiofolds, studio | the pretend Netlify in `tests/studio-check.mts` gave Studio no store for the new push notifications, so Studio reached for real Netlify Blobs (MissingBlobsEnvironmentError) | `fakeNetlify` passes a `pushStore` like every other store |

Other notes for Release: `temp/fpt-public-delta/` (431 MP3, copies of `voices/fpt-leminh-v1/`) was committed by the
science helper; `js/art/maths3.ts`, `money3.ts`, `science2.ts`, `tiengviet2.ts` are no longer imported since Release
moved them into `js/art/games108.ts`. Both left as they are.

Lê Minh (owner in this chat: "Hãy thu âm lê minh luôn đi"; after Release's note that male voices and Lê Minh go aside, owner: finish and push separately): 1,092 new Vietnamese lines recorded with FPT Lê Minh on the branch `voices/v108-leminh` (commit 198e2e9fd, batches `docs/voice-recording-delta/v108-leminh-1..5.json`, the reviewed-batch tool widened to `js/content/english.ts` and `js/content/tiengviet2.ts` like `hocvui.ts`). Not on fix/v108-suite; voices-aside decides. 66 lines stay without Lê Minh: 35 picture-only "lines" (the line scanner `tools/voice-lines.mts` reads picture pairs like ['apple', 'quả táo', '🍎'] in `js/content/english.ts` as speech; Azure recorded them too), 6 notification lines, 25 built from templates or names. voiceroutes stays red on fix/v108-suite for those Lê Minh lines.

## Checks (local, `--jobs 1 --only`, 3 Nov 2026 AEDT)

- preload, unit (515), offline, swupdate, voicearea, voicecover, voice, englishmode, phone, gamespace, reportburst, ownerstudiofolds, pushnotify: pass
- studio: failed once ("the exe did not save into its folder"), passed on its second try; the message now says why
- the stopped shard's 20 checks: 18 pass (ownerautoplay2x, chapter2, chapter3, ownerautoplaytransport, ownerautoplaynormal, ownerautoplayplans, ownertalesync, festivalsync, autoplaycover, reportfloating, reportingflow, hanoivoice, ownerroadvoice, ownerexplainswitches, ownerfestplacement, ownerquesttargets, filmmusic, ownerstudiofailures); voicecover passed after the recording; voiceroutes red (Lê Minh, above)
- `--changed` picks the full suite (.gitignore changed): left for Release, as the round's rules say
