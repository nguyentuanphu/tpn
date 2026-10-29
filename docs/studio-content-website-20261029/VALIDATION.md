# Validation and remaining issues

29 October 2026 AEDT. Implementation source: `47a9079eef4d5e1b0e34283503fc934feb888da7`; generated website facts are pinned to that immutable commit. Captures record the checkout HEAD at execution and exact source-file SHA256 values; some checks ran against the working tree before its source commit. The final layout capture hashes match the committed implementation. Do not mistake an earlier HEAD label for a claim that its working tree was clean.

## Actual outcomes

| Batch | Outcome | Evidence / limit |
|---|---|---|
| Initial art functional validation | 88/88 completions passed | Four EN/VI/layout configurations, item/group/progress gates, album cap, pointer/keyboard and early exit; before later layout refinements |
| Existing regression selection | 16/19 checks passed | Boot, contract, phone, preload, noemoji, architecture, names, secondset, rollout, bilingual, rules, types, offline and website passed. Initial B progress fixture, docs emoji transcript and unit check failed; retained in evidence/regression-initial.* |
| Focused corrections | 12/13 checks passed | 110 art completions over five configurations including landscape, 22 paired completions on 320px phone, actual main-game reward/save/exit/reload, eight website language/layout cases, 76 audio decodes and relevant audits/types passed. Unit retains only the two A-owned fixture failures |
| Final footer/layout correction | 5/5 checks passed | 24 actual representative art completions over six configurations with Save always within viewport and clear of mascot; actual main reward/persistence, architecture, names and types passed on the final layout |
| Final source-pinned website | 1/1 passed | Eight EN/VI/device/portrait/landscape states; four destinations, 22 art anchors, open/focus/language state, no horizontal overflow and general game/story availability explanation |
| Generated output | Passed | tools/build-website.mts --check: 44 assets; export-management-catalogue.mts --check current |
| Packaging | Passed | Local Netlify package built; source, hash and entries in evidence/packaging.json. No deploy |
| Global website editorial gate | Red, intentionally retained | Existing game-review-lock.json is unchanged. Generated Markdown headers now say facts generated from source instead of backdating review of the new source to the historical 23 October baseline. A must review the combined tree; B's scoped review is not a global lock update |

The final captured art screens use the real game frame, stylesheet, artwork replacement module, bundled fonts and synthetic profiles. They are not concept illustrations. The full world/main-game path is tested separately for actual progress/rewards/persistence. Save is anchored while the canvas body scrolls, including landscape. Earlier functional runs exercised all twenty-two activities before the final shared-footer layout correction; the final twenty-four representative cases cover the revised layout across all six configurations. Their scope is explicit in the JSON reports.

The broad phone check covered ten screens across desktop/phone/tablet. The existing noemoji check inspected Who's playing, valley, eight Pad tabs, Grown-ups, speech and 228 registered games; Family Quiz remains conditional on supplied questions. Rollout exercised 27 switches and preserved progress. Offline check reached the valley offline and with a connection that never answers. The website integration check covered Welcome/Settings entry, Close/Escape/focus restoration, state preservation, no HUD Home, parent navigation and goal clearance. These are observed results, not a release certification.

## Unit result and ownership boundary

429 unit tests executed: **426 passed, 2 failed, 1 skipped**. The skip is the existing legacy map layout C case. All four B unit tests passed, including exact catalogue/unlock/guide linkage and a synthetic database event test accepting all twenty-two integrated IDs and rejecting the four pending IDs. The unchanged catalogue/lazy-definition consistency test passes after B separated the unregistered proposals from drawing2.

The only two remaining failures are in A-owned tests/unit/studio-off-policy.test.mjs: frozen counts still expect 26 pending entries instead of four, and the unknown-event fixture still uses now-integrated aodai. A-TEST-REQUEST.md gives exact reconciliation instructions preserving fail-closed checks. B did not weaken, skip, delete or edit A's tests. The whole unit suite is **not green** until A updates those fixtures.

## Failures and retries retained

- Empty synthetic profile fixture: corrected by explicitly seeding an isolated example profile.
- Save control rendered as an object string: actual inherited DOM-construction defect fixed by appending the button element.
- Early-exit assertion ran before frame removal: waited for detachment, preserving the assertion.
- Real-main progress selector matched an outgoing and active frame: targeted the active frame only.
- A reload left a fixture route in flight at teardown and stopped one focused run after voice validation; eleven checks in that batch did not finish. Corrected by waiting for in-flight routes before closing context, without ignoring runtime assertions. Transcript retained in evidence/route-teardown-initial.txt.
- A saved failure transcript contained literal emoji: escaped the transcript; docs/emoji assertion unchanged.
- Catalogue AST test counted guarded pending registrations: moved those unchanged proposals outside the runtime loader; catalogue test unchanged.
- Landscape review showed Save below the fold: added a scoped scrollable body and anchored footer; final tests explicitly assert visible Save and mascot clearance.

## Remaining work

- Four unresolved IDs: spotdiff, hiddenpic, paperfold and rongran. The first three lack their promised puzzle/folding mechanics; rongran has no resolved implementation/intent. They stay declared-only and are not silently aliased or deleted.
- Twelve EN/VI guidance lines need recordings; VOICE.md lists them. All 76 existing relevant recordings fetched/decoded; audible physical-device review remains separate. No speech credential was available and no paid API was called.
- A must reconcile its two stale policy fixtures, integrate the combined tree, review the global website source/art lock and collect exact-source comprehensive CI. CI.json records observations and discovery instructions; no full-suite green claim is made.
- Physical iPhone/Android/tablet, audible voice review, actual device rotation, previous-install update and real device receipt/effect remain unverified. No remote private/provider records or real family saves were accessed or changed. Inventory counts do not prove all controls or runtime instances.
