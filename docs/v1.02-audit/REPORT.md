# v1.02 independent Release audit

**Status: NOT READY FOR DEPLOYMENT.** Owner chose v1.02, but has not approved deployment. Live remains v1.01. This is an audit of the pushed `work/v1.01-hanoi-voice` branch at **59fe48fd**, not uncommitted files on the helper's Windows machine.

Release collected the helper's 14 new commits after ba118721 onto current main ac76cf60, preserving the verified v1.01 history and production evidence. Audit branch: `release/hanoi-audit-20261025`. Initial reproduction checkpoint: **107302c9**; original-art repair checkpoint: **536734ec**. The family privacy regression and catalogue registration/order mismatch were repaired; known gameplay blockers below remain.

## Requested scope

| Item | Verified result |
| --- | --- |
| Seven Vietnamese games | Registered, but several are prototypes rather than the named traditional games. Trồng Nụ is a planting-memory activity, not Trồng Nụ Trồng Hoa; Đánh Đáo is labelled a wooden-peg aim tap. Cướp Cờ is a colour-choice tap, Ném Còn is a fixed middle-button choice and Đua Thuyền is four rowing-button taps without rhythm validation. The broken icon comparison is reproduced below. Do not claim these seven finished. |
| Fruit Parade toggles | All three entries exist and default off. However, enabling the tester switch exposes it to an ordinary non-tester too. NPC mode is stuck, and four advertised online seats share only three fixed lane assignments. |
| Mobile/bottom-bar CSS | `css/style.css` has **no difference from live main**. The handoff's claimed CSS work is already in v1.01. New game-specific controls do not meet the existing touch-target rule. |
| Collapsible Studio analytics | `studio/ui/app.ts` has **no difference from live main**. Existing foldPage/refold functionality is present; this is not new helper delivery. Studio core's sw.ts version read with sw.js fallback is a separate real change. |
| FPT bulk workflow | `.github/workflows/fpt-le-minh-bulk.yml` is **absent** from the helper's final pushed tree. Workflow removals are in its history. Release created a separate tested bulk workflow; see recording status below. |
| Helper recorder | Static collectLines only, missing dynamic/reading/template-part catalogue; missing explicit MP3 format, timeout/backoff and trustworthy resume/provenance. Its text-only SHA filename is not the game's canonical voice ID. Do not use it as a full-pack installer. |
| Helper audio samples | All three files in temp/fpt-samples/*.mp3 are **WAV**, confirmed by ffprobe. [Evidence](helper-sample-formats.json). |

## Reproduced blockers

[Observations](observations.json) and [56 native screenshots](shots/) use isolated synthetic profiles with Analytics and online play disabled and API calls mocked. Capture covers nine games in EN/VI at phone 390x844, tablet 820x1180 and computer 1280x800, plus two interaction proofs. No real child reports were sent. The capture fixture initially failed to close the preceding game; corrected to use the actual close button before the completed capture. No product assertion was weakened.

1. **Fruit Parade NPC deadlock.** After the child stops lane 1, all three buttons are disabled, progress remains 0%, and helper lanes never stop. The NPC callback tests `!button.disabled`, although its button was disabled at construction. Timer entries also mix lane intervals and NPC timeouts. [Screenshot](shots/fruit-npc-stuck.png).
2. **Tester preview leaks to ordinary children.** With both child modes off, tester preview on and `tester:false`, gameInfo reports `hidden:false` and the game opens. The mode helper ORs the preview rule without tester entitlement.
3. **Touch targets too small.** Fruit stop controls measure **56px** for an under-five profile (required 64px). Horse-game mode/roll/NPC controls use small native styling; older-child controls require at least 44px. [Measured layouts](touch-target-findings.json).
4. **Ném Còn cannot recognize the correct tap after own-art replacement.** Clicking its correct middle button creates a second choices group and leaves the game open. Its logic compares textContent with an emoji after the normal SVG-art replacement has removed that text. The same pattern affects several new games. Wrong answers recursively append more DOM rather than replacing a round. [Screenshot](shots/throw-centre-repeats.png).
5. **Cờ Cá Ngựa full-mode roll stalls.** Empty-stable turns repeatedly roll [4,3] then [3,4]. Dice depend only on the turn and old dice, which are cleared; no six is rolled to leave the stable. The UI also does not reliably pass a no-move NPC turn back. No complete full-mode match was verified.
6. **Horse rules accept an illegal launch.** With a full-mode die of 1, legalMoves returns zero, but applyMove accepts the launch and puts the horse on the track. The move reducer must validate legalMoves, indexes, dice and turn state itself.
7. **Horse rendering/networking incomplete.** Display is two player cards and horse icons, no track or movement positions. Colours remain RED/BLUE in Vietnamese. State is initialized for two players despite advertised online capacity four; dice are not synchronized, and receipt handling calls the same move function that sends again. [Phone screenshot](shots/phone-vi-cacuangua.png).
8. **Shared multiplayer validation is not a game-authoritative reducer.** A future move number 9999 is accepted in a fresh state. Turn counting does not validate a board. Snakes advertises four players but renders/moves only two; its under-five clamp can send zero while the new validator rejects zero. Ô Ăn Quan and Kéo Co renderers were not upgraded to the newly advertised shared rules (they retain generic race/local play). Family Quiz exchanges locally selected answer indexes without synchronizing the host's question set/result state.
9. **Incomplete online replay handling.** Fruit retries reuse the same round/lane message numbers, whose existing transport deduplicates earlier moves. Received lane values do not stop/redraw the remote lane. The fourth online player gets no lane. Random-sort shuffling also needs a defined deterministic shuffle across browser engines.
10. **Test coverage overclaims.** New renderer tests largely search source strings for online calls; they do not prove a real NPC game or a synchronized multi-device match can finish. The existing full suite remains necessary but will not by itself approve the above failures.

## Release repairs already made

- Restored exact owner-approved family-code privacy wording (statistics only; no progress/photo sharing). Helper had substituted text implying photo sharing.
- Fixed catalogue inspection's `def is not defined` error by explicit registrations; aligned loader order, English name and origin metadata. Existing catalogue unit check now passes for both languages/currencies; assertion retained.
- Set owner-chosen v1.02 metadata on the audit branch, rebuilt generated scripts/preloads and synced the website source lock for this **audit preview**. This is consistency review, not approval to deploy the gameplay.

## Voice recording status

Owner authorized full Lê Minh recording on 25 October 2026 AEDT. Started separately on `work/fpt-leminh-full-20261025`; now stopped on authorization: [workflow 40169102867](https://github.com/nguyentuanphu/tpn/actions/runs/40169102867).

The complete stable v1.01 catalogue contains **6,319 Vietnamese recordings**, including **870 reusable parts**, after holding 19 test-child-name lines for privacy. Approximate text cost US$3.84 at the owner's displayed rate, before retries. The helper's static-only 3,521 count is incomplete. [Frozen inventory and recording rules](https://github.com/nguyentuanphu/tpn/blob/work/fpt-leminh-full-20261025/docs/fpt-leminh-full-20261025/README.md).

Four serial shards, 1.5-second spacing, bounded retries, stop on access/quota problems; every output is decoded, checksummed and bound to exact provider/text identity. Progress is saved every 50 clips into **temp/fpt-recordings/** on that branch. The first shard completed: **1,580 clips saved**. All 1,580 were independently downloaded, checksummed and fully decoded with FFmpeg without errors. The second shard stopped at **HTTP 401**; 4,739 clips remain. The owner was asked to check the key and GitHub secret. No further paid retry has been made. This is not a claim of full completion. New/repaired helper content will be a later delta; no current female/default policy, game voice manifest or live site has been changed. Owner chose parent-selectable Lê Minh for **all Vietnamese speech**, preserving the existing default. Full FPT manifest/cache/selection integration remains to be implemented and reviewed.

## Verification

- Initial local unit check failed on catalogue registration; targeted catalogue check and the complete unit run now pass: 255 passed, one legacy skip.
- Local types pass (137 generated TypeScript game files; explicit/core/server checks reported by suite).
- Read-only reproduction and 56 captures completed with zero page errors, while reproducing semantic failures above. All nine contact sheets in review/ were visually inspected across both languages and all three sizes; gameplay/visual gaps remain.
- Initial GitHub Checks failed only the unchanged artwork check: saw and vintage key were undrawn. Added original SVGs in 536734ec; focused emoji check now passes (zero undrawn), and the tools-art screenshot was inspected. This is a code repair, not a retry-only pass.
- Website source sync/preload checks pass at source 536734ec; publication remains blocked.
- Bulk tooling: 245 unit tests and standalone strict TypeScript passed; existing pack coverage stayed green before recording started.
- **GitHub full suite: 225/233 passed**, at dfd46bb7 on [run 40171076084](https://github.com/nguyentuanphu/tpn/actions/runs/40171076084). Failed: netgames, games, a11y, adventure, friendstab, swupdate, voicecover (22 missing lines), offline. [Exact summary](github-suite-result.md). No failures are waived.
- **Passed only on a second try: phone** (execution context destroyed during navigation). Catalogue and original-art failures were repaired in code; those are not flaky retry passes.
- Official code map/timings copied from code-map commit **f869b6f7**, whose provenance names run 40171076084 and runtime dfd46bb7 (285 covered files). Direct artifact download returned Forbidden; the workflow's official code-map branch supplied the identical designated files.
- Updated Checks and website consistency pass. AI review did not finish (workflow job success is not a completed AI review).
- No local full suite, release speed run or ZIP is warranted until gameplay blockers are resolved.

## Owner-directed follow-up already underway

Owner supplied the full screen-only Fruit Parade design and required TypeScript. Work is isolated on **work/v1.02-fruit-parade**, initial implementation checkpoint **34ecafb4**; it is not what the above full suite tested. The owner also flagged tiny Trồng Nụ pictures: the rewrite replaces the wrong planting activity with a large illustrated Trồng Nụ Trồng Hoa jumping adaptation. Local behavioural/protocol tests and bilingual device captures are being checked, including NPC, two-player play and reconnect. Other six folk games, horse/shared-game blockers and the baseline failures still require resolution. Do not merge either branch as a complete release.


## Work required before release approval

Rework the seven folk games against their actual rules and original art; implement and test real shared/NPC state transitions; repair Fruit preview entitlement, timers, retry numbering and controls; finish horse rules/track/turn/dice flow; replace source-string-only assurances with behavioural tests; finish voice delta/provider/cache integration after recording, using the owner-approved parent-selectable policy. Then rerun required regression, inspect revised EN/VI devices, perform speed checks and provide the round report. No merge or deployment without a new explicit v1.02 “yes, deploy”.


## Follow-up status · 25 October 2026 AEDT

Draft PR #602 now holds typed Fruit Parade, enlarged authentic Trồng Nụ, separate Orchard and parent tester arcade, and reviewed Studio repairs. Helper ed9a5b0a Orchard was independently found to be a welcome-only stub importing an absent engine; its claimed recording manifest was a zero-recording dry run. New game/Studio evidence is `../v1.02-orchard-arcade/README.md`. Fruit/TN full browser and new Orchard/parent local/online/gate/save checks pass; Studio six bilingual/device cases pass, including persistent folds. Combined units 269 pass; source checks and strict engines pass after documented fixture/transcription corrections. Adventure passes after synthetic tester ID was explicitly established; no assertion was removed. Latest GitHub regression is pending; this does not clear the remaining horse, folk-prototype, voice integration, website or physical-device findings above.

Lê Minh baseline completed 6,319 recordings in run 40175822783; independent run 40190674496 fully decoded and verified all of them with zero errors. Eleven static arcade delta recordings additionally passed full decoding in run 40190084618. These are staged assets; default voice and live site are unchanged. No v1.02 deployment approval.
