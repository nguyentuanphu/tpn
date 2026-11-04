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

Lê Minh (owner in this chat: "Hãy thu âm lê minh luôn đi"; after Release's note that male voices and Lê Minh go aside, owner: finish and push separately): 1,092 new Vietnamese lines recorded with FPT Lê Minh on the branch `voices/v108-leminh` (commit 198e2e9fd, batches `docs/voice-recording-delta/v108-leminh-1..5.json`, the reviewed-batch tool widened to `js/content/english.ts` and `js/content/tiengviet2.ts` like `hocvui.ts`). Not on fix/v108-suite; voices-aside decides. 66 lines stay without Lê Minh: 35 picture-only "lines" (the line scanner `tools/voice-lines.mts` reads picture pairs like ['apple', 'quả táo', picture] in `js/content/english.ts` as speech; Azure recorded them too), 6 notification lines, 25 built from templates or names. voiceroutes stays red on fix/v108-suite for those Lê Minh lines.

## Checks (local, `--jobs 1 --only`, 3 Nov 2026 AEDT)

- preload, unit (515), offline, swupdate, voicearea, voicecover, voice, englishmode, phone, gamespace, reportburst, ownerstudiofolds, pushnotify: pass
- studio: failed once ("the exe did not save into its folder"), passed on its second try; the message now says why
- the stopped shard's 20 checks: 18 pass (ownerautoplay2x, chapter2, chapter3, ownerautoplaytransport, ownerautoplaynormal, ownerautoplayplans, ownertalesync, festivalsync, autoplaycover, reportfloating, reportingflow, hanoivoice, ownerroadvoice, ownerexplainswitches, ownerfestplacement, ownerquesttargets, filmmusic, ownerstudiofailures); voicecover passed after the recording; voiceroutes red (Lê Minh, above)
- `--changed` picks the full suite (.gitignore changed): left for Release, as the round's rules say

## Round 2 (branch fix/v108-suite2 from origin/integrate/v108, 4 Nov 2026 AEDT)

| # | Check | Cause | Fix |
| --- | --- | --- | --- |
| 1 | familyuiart | `js/ui-settings.ts` updateHanoiInfo wrote to the Lê Minh status line that voices-aside removed (a device that had chosen Lê Minh); the check still waited for the Lê Minh buttons that hanoivoice now requires to be gone | the status line is written only when it is there; the check asserts the set-aside buttons are gone and the female preview is 44 px |
| 2 | familyquizprivate | the same error stopped Grown-ups half drawn | fixed by 1 |
| 3 | familycodejourney | when `js/notify.js` finished loading, Grown-ups drew the whole card again, replacing what a grown-up was tapping or typing | only the notifications part takes the place of its placeholder |
| 4, 5, 6 | horseplay, folkplay, ownerlearningprogression | the one-screen fit (`js/games/frame.ts`) kept buttons at 44 px for big kids and ignored a game's own 64 px minimum; a button drawn after a fit was never grown back | the fit's floor keeps each button's own minimum width and height, and a shrink-only pass goes back up to the floor |
| 7 | voicecover | the pizza and fair-share lines were recorded but in no area | areas rebuilt (`--areas-only`); nothing to record |
| 8 | ownerroadvoice | the check decoded the male cast, now in voices-aside/ | female cast only |
| 9 | pushnotify | GitHub uses Playwright's headless shell, which cannot show a service worker's notifications (reproduced here with the headless shell; full Chromium passes) | the check runs in full Chromium (harness `launch({ full: true })`, channel chromium) |
| 10 | solid | a Diwali hunt lamp stood on a decoration spot inside a stall | once the solids are known a hunt lamp without open ground moves to the nearest open ground (`js/festhunt.ts`) |
| 11 | ownerautoplay2x | at 2x a tap takes about 1.5 s by design and a random maze needs 40 to 78 taps: 519 to 652 s against 600 (mazes unchanged in v1.08) | 15 minutes for the run, 8 minutes per language at 2x (12 at 1x) |
| 12 | emoji | a picture in this file | removed |
| - | tugplay (second try) | Pull can be disabled between the check's count and its click | the click waits 1.5 s, then the next turn |

Checks here (one at a time): familyuiart, familyquizprivate, familycodejourney, hanoivoice, horseplay, folkplay, ownerlearningprogression, gamespace, voicecover, ownerroadvoice, pushnotify (full Chromium), solid, ownerautoplay2x (580 s), tugplay, types, emoji, unit, boot, phone, preload: pass. pushnotify with the headless shell: red before the fix, as on GitHub; the fixed check could not run with Playwright 1.56's own Chromium here (not installed), so GitHub decides.

Not fixed here: voicearea's Wi-Fi part is red on this machine only (Chromium 153): Cache Storage operations (`caches.open` in state.ts writeMirror, `cache.match` in voicestore compact) never finish after the core is saved. Green on GitHub. Worth a separate look: a newer Chrome could hold the save copy the same way.
