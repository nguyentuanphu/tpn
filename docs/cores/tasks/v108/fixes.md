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
| gamespace | English mode put the Vietnamese hint row (44 px, 64 px for under-5s) between the guide and the playing area, so the top band of the 8 English games was 158 px | the hint row now sits under the playing area (`js/englishmode.ts`) |
| ownerstudiofolds, studio | the pretend Netlify in `tests/studio-check.mts` gave Studio no store for the new push notifications, so Studio reached for real Netlify Blobs (MissingBlobsEnvironmentError) | `fakeNetlify` passes a `pushStore` like every other store |

Other notes for Release: `temp/fpt-public-delta/` (431 MP3, copies of `voices/fpt-leminh-v1/`) was committed by the
science helper; `js/art/maths3.ts`, `money3.ts`, `science2.ts`, `tiengviet2.ts` are no longer imported since Release
moved them into `js/art/games108.ts`. Both left as they are.

## Checks (local, `--jobs 1 --only`)

- preload, unit, offline, swupdate: pass (commit 76636b4a2)
