# Orchard, parent Fruit Bar and Studio review · v1.02

Release branch: `work/v1.02-fruit-parade`. NOT READY for deployment. The owner requested these additions on 25 October 2026 AEDT; deployment is not authorized.

The helper's latest audited head is ed9a5b0a. It does not contain the claimed parade-engine.ts: Orchard is a welcome-only stub with an unresolved import. Its recording manifest says dryRun true and recorded 0. The Studio diff contains broad line-ending churn around three folding wrappers, including untranslated “Tiles”; its Simple screen CSS reduces under-five tools to 44px. These changes have not been blindly merged. [Audit and implementation plan](../cores/tasks/orchard-fruit-bar-v1.02.md).

## Implemented for review

- Separate Orchard ID `sparkleorchard`: perimeter light board, visual collection mission, seeded board with every requested picture present, gentle assist, solo/helper/local two-player and online 2–4 players. Original game drawings, bilingual spoken introduction, 64px child controls, calm mode, keyboard/controller stop, cleanup. Existing child reward/save flow stays with Orchard only. Special combinations emit the adopted extension event; world adventures and inventory prizes are not falsely awarded.
- Separate parent Fruit Bar: entered from Grown-ups, never listed in the children's games or Friends picker. Every participating device must pass the existing grown-up gate. Separate tester master/single/multiplayer Studio switches, actual tester eligibility and accepted agreement required. Ordinary devices cannot open either new activity even when mode switches are on; explicit off overrides previews.
- Parent counters exist only in this open arcade session. Free refill, clear/repeat allocations, transparent weighted/equal frequencies, bounded allocation values, shared results with individual balances, biggest-return statistics and 20-round completion. No child coins/save writes, purchase, exchange, cash-out, public leaderboard or cash value. Solo, practice helper, local adults and online 2–4 adults. Alternate reel skins, doubling/bonus games and global daily tournaments remain optional extensions from the reference; they are not implemented or advertised as complete.
- Ordered family-host command adapter rejects wrong seats, stale/future/duplicate/invalid actions, replays lost commits and unregisters listeners. The seed is shared; this is not trusted backend anti-cheat or ranked competitive play. Temporary interruptions retain state; explicit local continuation is available after 30 seconds.
- Studio preserves all analytics. Overview uses a bilingual persistent fold; responsive grid children can shrink within their columns and long labels wrap. No broad helper line-ending rewrite collected. Under-five controls remain 64px.

## Verification status

Six new pure engine/gating/protocol tests pass; all seven pure engines/input/session modules compile with strict TypeScript. Combined unit check passes 269 cases (one existing legacy skip); rules/preload/architecture/types/names pass. Copied reference stars initially failed the no-emoji documentation check; transcribed as names and the unchanged emoji check passes on rerun. Source-generated JavaScript is compatibility/build output; all new game logic is TypeScript. Legacy repository JavaScript has not all been converted.

First new browser attempt reached actual local completion but tried to click the close button through the existing win overlay; corrected the fixture to use the existing finish flow. A later attempt reached shared online Orchard completion but needed the same choose/finish handling for online games. No runtime assertion was removed. The full browser run then passed: actual Orchard local/online completion, rejected non-testers, parent gate, local/shared online result, unchanged child saves and retained temporary-disconnect session. Final 12 bilingual game captures passed 64px/visible-control checks after reducing desktop board height; screenshots/contact sheets inspected. Studio passed six bilingual/device cases including collapse persistence after reload, no document overflow, equal-width tiles and all six real controls. A later command-replay optimization passes the nine focused engine/story cases; GitHub reruns the full browser path on it. The full earlier Fruit Parade/Trồng Nụ browser extension passed, including first-use offline, NPC, controller/keyboard, shared online outcomes and 30-second continuation.

All-game regression fixtures explicitly opt into accepted tester access through the typed harness; the original game-open, accessibility and adventure assertions are unchanged. The dedicated new browser check also tests rejection of non-testers. This is a fixture correction for games intentionally held behind Studio, not publication to children.

## Voices

The frozen 6,319-line baseline completed successfully in workflow 40175822783 on `work/fpt-leminh-full-20261025`; every shard manifest is complete. Independent full-pack audit **40190674496 passed: all 6,319 checksummed and fully decoded, zero missing/errors**. Exact result is retained in `../fpt-leminh-full-20261025/final-audit.json`. It resumed after the earlier HTTP 401 and a successful one-clip diagnostic. The exact original failed line was subsequently recorded; the initial provider failure's cause remains unproven.

The new stable static arcade source contributes **11 additional Vietnamese lines / 344 characters** after deduplicating against that frozen baseline, not an assumed 35. `voice-delta.json` retains canonical IDs, source hashes and provenance. The separate delta workflow used the same provider lock and waited for the baseline job. Run 40190084618 succeeded: all 11 new clips recorded and fully decoded. A source-hash refresh reuses verified identical recordings rather than paying for them again. Each clip is checksummed, probed and fully FFmpeg-decoded; progress survives failure. FPT_API_KEY stays in GitHub Actions. No child names, family questions or private text are uploaded. Generated clips are review staging only; production voice selection/download integration remains pending, and the default female voice has not changed.

## Remaining release blockers

[Independent audit](../v1.02-audit/REPORT.md): remaining horse rules/shared-state defects, six inaccurate folk prototypes, voice coverage and production Lê Minh integration/delta review, refreshed website review, final GitHub full suite, local speed checks and physical-device/listening review. No v1.02 deployment approval is requested while these remain.


Initial GitHub fast checks identified two fixture/integration problems: the story-reordering fixture omitted the game in its accepted invitation (now supplied, with all ordering assertions preserved); dynamic switch wrappers were invisible to the unchanged control-coverage check (now explicit literal reads). The new consent check still rejects an invitation that changes games. Website editorial review remains deliberately blocked until current explanations are reviewed; it has not been marked reviewed merely to turn a check green. AI review did not finish.


The targeted Simple-screen adventure check initially missed Orchard because this synthetic fixture had no tester device ID (analytics can be disabled). The typed fixture now creates a synthetic ID if absent and asserts that accepted tester eligibility was established; all original adventure assertions remain. Rerun passes: 205 games, 13 under-five sections, 179 drawn stops. One interrupted incorrectly started fixture rerun was discarded; it is not counted as a pass.


Final Orchard review repaired guest-to-NPC continuation to retain the guest’s actual seat, and restored keyboard focus after choosing a mode. The extended full browser pass now completes solo/local, NPC, shared online and guest-to-NPC games; parent shared balances, temporary reconnect and unchanged child saves still pass. A separate actual-keyboard/controller run passes. Seven pure arcade cases include completing a four-seat mission from guest seat two with helpers controlling the other three; strict engines and project types pass again. Exact evidence is `browser-results.json` and `input-results.json`.


The dedicated parent-entry regression also passes: rapid duplicate opening creates one gated window, an actual round completes, and closing restores the prior pause state. New invitations are declined while the parent arcade is already active. The 6,319 baseline clips cover stable v1.01; six uncorrected folk prototypes still require a later reviewed speech delta, rather than paying to record incorrect instructions.

[Orchard pictures](review/orchard.jpg) · [Parent arcade pictures](review/parent-bar.jpg) · [Studio analytics pictures](review/analytics.jpg) · [Studio switches](review/switches.jpg). These are synthetic test profiles and actual game artwork, not real family data.
